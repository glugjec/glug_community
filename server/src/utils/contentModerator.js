import { createSystemNotification } from './notificationService.js';
import { sendStrikeMail } from '../config/mail.js';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { ModerationLog } from '../models/ModerationLog.js';

const cache = new Map();
const MAX_CACHE_SIZE = 1000;

function hashText(text) {
  return crypto.createHash('sha256').update(String(text).trim().toLowerCase()).digest('hex');
}

/**
 * Calls Groq API to classify user content.
 * Returns: { verdict: 'VIOLATION' | 'SAFE', reason: string, category: string }
 */
export async function moderateContent(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return { verdict: 'SAFE', reason: '', category: 'none' };
  }

  const cleanText = text.trim();
  const textHash = hashText(cleanText);

  if (cache.has(textHash)) {
    return cache.get(textHash);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('[Moderation] GROQ_API_KEY is not configured. Failing open (allowing content).');
    return { verdict: 'SAFE', reason: 'Moderation key missing', category: 'none', skipped: true };
  }

  const systemPrompt = `You are a content safety and moderation classifier for a college GNU/Linux User Group (GLUG) community forum.

CORE TOLERANCE GUIDELINE:
- Normal heated arguments, debate, disagreements, strong criticism of tools/distributions/approaches, swearing, profanity, cuss words, and informal or bad language are ACCEPTABLE and MUST be classified as SAFE.
- Do NOT flag normal technical words (e.g. kill -9, execute, dump, abort, master/slave branch, daemon) or bad language/profanity as violations.

STRICT VIOLATIONS (ONLY FLAG IF PRESENT):
1. NSFW / Sexual content / Pornography / Explicit sexual imagery or descriptions (category: "nsfw")
2. Targeted harassment, malicious bullying, stalking, direct personal threats, doxxing (category: "harassment")
3. Child protection law violations, CSAM, child exploitation or endangerment - ZERO TOLERANCE (category: "child_safety")
4. Severe real-world threats of physical violence, terrorism, or self-harm (category: "threat")

Respond ONLY with a valid JSON object matching this schema with no markdown code blocks:
{
  "verdict": "VIOLATION" or "SAFE",
  "category": "nsfw" | "harassment" | "child_safety" | "threat" | "none",
  "reason": "Short explanation in one sentence of why it violated guidelines or empty string if SAFE"
}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cleanText },
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Moderation] Groq API returned status ${response.status}: ${errText}`);
      // Fail-open strategy to avoid blocking users during API outage
      return { verdict: 'SAFE', reason: 'API error fallback', category: 'none', error: true };
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim() || '{}';

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      // Fallback regex extraction if needed
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse moderation JSON');
      }
    }

    const verdict = parsed.verdict?.toUpperCase() === 'VIOLATION' ? 'VIOLATION' : 'SAFE';
    const category = parsed.category || (verdict === 'VIOLATION' ? 'abuse' : 'none');
    const reason = parsed.reason || (verdict === 'VIOLATION' ? 'Violates community guidelines' : '');

    const result = { verdict, category, reason };

    // Maintain in-memory cache
    if (cache.size >= MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(textHash, result);

    return result;
  } catch (err) {
    console.error('[Moderation Error]', err.message);
    return { verdict: 'SAFE', reason: 'Moderation service error', category: 'none', error: true };
  }
}

/**
 * Applies the graduated strike pipeline to a user:
 * - Strike 1: Warning, content hidden, no ban
 * - Strike 2: 24h temporary ban, content hidden
 * - Strike 3+: Permanent ban, content hidden
 */
export async function applyStrikePipeline({
  userId,
  reason,
  category = 'abuse',
  actionSource = 'auto_flag',
  targetPost = null,
  targetComment = null,
  targetMessage = null,
  performedBy = null,
}) {
  const user = await User.findById(userId);
  if (!user) {
    return { error: 'User not found' };
  }

  // Admins are immune from auto-banning and strikes
  if (user.role === 'admin') {
    return { skipped: true, reason: 'Admin is immune' };
  }

  // Auto-reset expired strikes
  if (user.strikeExpiresAt && new Date(user.strikeExpiresAt) <= new Date()) {
    user.moderationStrikes = 0;
    user.strikeExpiresAt = null;
    user.postingRestrictedUntil = null;
  }

  user.moderationStrikes = (user.moderationStrikes || 0) + 1;
  const currentStrikes = user.moderationStrikes;
  let actionTaken = 'warning';

  let postTitle = '';
  if (targetPost && typeof targetPost === 'object' && targetPost.title) {
    postTitle = targetPost.title;
  } else if (targetPost) {
    const p = await Post.findById(targetPost).select('title').lean().catch(() => null);
    if (p) postTitle = p.title;
  }
  if (!postTitle && targetComment) {
    const c = await Comment.findById(targetComment).populate('post', 'title').lean().catch(() => null);
    if (c?.post?.title) postTitle = c.post.title;
  }

  const cleanReason = String(reason || 'community guideline violation').replace(/["'“”]+/g, '').replace(/\.+$/, '').trim();

  let strikeNotice = '';
  if (currentStrikes === 1) {
    actionTaken = 'warning';
    user.strikeExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.postingRestrictedUntil = null;
    user.isBanned = false;
    strikeNotice = postTitle
      ? `Warning: Your content on "${postTitle}" was removed for: ${cleanReason}. You received Strike 1/3 (Warning). Your posting privileges remain active. This warning expires in 7 days if no further violations occur. You can request an appeal in Settings.`
      : `Warning: You received moderation Strike 1/3 (Warning) for: ${cleanReason}. Your posting privileges remain active. This warning expires in 7 days if no further violations occur. You can request an appeal in Settings.`;
  } else if (currentStrikes === 2) {
    actionTaken = 'temp_restriction';
    user.postingRestrictedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.strikeExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    user.isBanned = false;
    strikeNotice = postTitle
      ? `Account Restriction: Your content on "${postTitle}" was removed for: ${cleanReason}. You received Strike 2/3. Posting and commenting are paused for 24 hours. Your strike count will reset to 0 in 30 days if no further violations occur. You can request an appeal in Settings.`
      : `Account Restriction: You received moderation Strike 2/3 for: ${cleanReason}. Posting and commenting are paused for 24 hours. Your strike count will reset to 0 in 30 days if no further violations occur. You can request an appeal in Settings.`;
  } else {
    actionTaken = 'permanent_ban';
    user.isBanned = true;
    user.banReason = reason || `Accumulated ${currentStrikes} moderation strikes`;
    user.bannedAt = new Date();
    user.banExpiresAt = null;
    user.postingRestrictedUntil = null;
    strikeNotice = `Account Banned: You received Strike ${currentStrikes}/3 for: ${cleanReason}. Your account has been permanently suspended. You can submit an appeal from the login screen.`;
  }

  await user.save();

  try {
    await createSystemNotification({
      recipientId: user._id,
      type: 'moderation_strike',
      message: strikeNotice,
      postId: targetPost?._id || targetPost || null,
      commentId: targetComment?._id || targetComment || null,
    });
  } catch (notifErr) {
    console.error('[Strike Notification Error]', notifErr.message);
  }

  if (user.email) {
    try {
      await sendStrikeMail({
        to: user.email,
        username: user.username,
        strikeLevel: currentStrikes,
        reason,
        category,
        postingRestrictedUntil: user.postingRestrictedUntil,
        strikeExpiresAt: user.strikeExpiresAt,
      });
    } catch (mailErr) {
      console.error('[Strike Mail Error]', mailErr.message);
    }
  }

  let commentSnippet = '';
  let postSnippet = '';

  if (targetComment) {
    if (typeof targetComment === 'object' && targetComment.body) {
      commentSnippet = targetComment.body.slice(0, 200);
    } else {
      const c = await Comment.findById(targetComment).select('body post').lean().catch(() => null);
      if (c?.body) commentSnippet = c.body.slice(0, 200);
    }
  }

  if (targetPost) {
    if (typeof targetPost === 'object' && targetPost.body) {
      postSnippet = targetPost.body.slice(0, 200);
    } else {
      const p = await Post.findById(targetPost).select('body').lean().catch(() => null);
      if (p?.body) postSnippet = p.body.slice(0, 200);
    }
  }

  const contentType = targetComment ? 'comment' : (targetPost ? 'post' : (targetMessage ? 'message' : 'user'));
  const contentSnippet = targetComment ? commentSnippet : postSnippet;

  // Record in audit log
  try {
    await ModerationLog.create({
      action: actionSource,
      performedBy: performedBy || null,
      targetUser: user._id,
      targetPost: targetPost?._id || targetPost || null,
      targetComment: targetComment?._id || targetComment || null,
      targetMessage: targetMessage?._id || targetMessage || null,
      contentType,
      contentSnippet,
      postTitle,
      reason,
      category,
      details: `Strike #${currentStrikes} applied. Resulting action: ${actionTaken}`,
    });
  } catch (logErr) {
    console.error('[ModerationLog Error]', logErr.message);
  }

  return {
    strikes: currentStrikes,
    action: actionTaken,
    isBanned: user.isBanned,
    banExpiresAt: user.banExpiresAt,
  };
}

