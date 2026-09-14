import crypto from 'crypto';
import { User } from '../models/User.js';
import { ModerationLog } from '../models/ModerationLog.js';

const cache = new Map();
const MAX_CACHE_SIZE = 1000;

function hashText(text) {
  return crypto.createHash('sha256').update(String(text).trim().toLowerCase()).digest('hex');
}

/**
 * Calls Groq API (Llama 3.1 8B Instant) to classify user content.
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

  const systemPrompt = `You are a strict content safety and moderation classifier for a college GNU/Linux User Group (GLUG) community forum.
Evaluate the given text for any:
1. NSFW / Sexual content / Pornography / Explicit language (category: "nsfw")
2. Severe abuse, targeted insults, harassment, bullying (category: "abuse" or "harassment")
3. Hate speech, racism, slurs, discrimination (category: "hate_speech")
4. Threats of violence, self-harm, or illegal attacks (category: "threat")
5. Malicious spam, scams, phishing, or malware distribution (category: "spam")

Note: Normal technical discussions, bash commands, Linux errors, code snippets, and mild informal language are completely SAFE.
Do NOT flag normal technical coding words (e.g. kill -9, execute, dump, abort, master/slave branch, daemon, etc.) as abusive.

Respond ONLY with a valid JSON object matching this schema with no markdown code blocks:
{
  "verdict": "VIOLATION" or "SAFE",
  "category": "nsfw" | "abuse" | "hate_speech" | "harassment" | "threat" | "spam" | "none",
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

  user.moderationStrikes = (user.moderationStrikes || 0) + 1;
  const currentStrikes = user.moderationStrikes;
  let actionTaken = 'warning';

  if (currentStrikes === 1) {
    actionTaken = 'warning';
  } else if (currentStrikes === 2) {
    actionTaken = 'temp_ban';
    user.isBanned = true;
    user.banReason = reason || 'Accumulated 2 moderation strikes';
    user.bannedAt = new Date();
    // 24-hour temporary ban
    user.banExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  } else {
    // 3 or more strikes -> Permanent ban
    actionTaken = 'permanent_ban';
    user.isBanned = true;
    user.banReason = reason || `Accumulated ${currentStrikes} moderation strikes`;
    user.bannedAt = new Date();
    user.banExpiresAt = null; // null represents permanent ban
  }

  await user.save();

  // Record in audit log
  try {
    await ModerationLog.create({
      action: actionSource,
      performedBy: performedBy || null,
      targetUser: user._id,
      targetPost: targetPost?._id || targetPost || null,
      targetComment: targetComment?._id || targetComment || null,
      targetMessage: targetMessage?._id || targetMessage || null,
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

