import { Router } from 'express';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { Appeal } from '../models/Appeal.js';
import { ModerationLog } from '../models/ModerationLog.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// @route   GET /api/users/me/terminal
// @desc    Get authenticated student's persistent terminal session
router.get('/me/terminal', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('terminalState');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ terminalState: user.terminalState || null });
  } catch (err) {
    console.error('[Get Terminal State Error]', err);
    return res.status(500).json({ error: 'Failed to load terminal state' });
  }
});

// @route   PUT /api/users/me/terminal
// @desc    Save authenticated student's persistent terminal session
router.put('/me/terminal', requireAuth, async (req, res) => {
  const { fs, history, cwd } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.terminalState = {
      fs: fs || user.terminalState?.fs,
      history: Array.isArray(history) ? history.slice(-100) : user.terminalState?.history || [],
      cwd: typeof cwd === 'string' ? cwd : user.terminalState?.cwd || '/home/user',
      updatedAt: new Date(),
    };

    await user.save();
    return res.json({ success: true, updatedAt: user.terminalState.updatedAt });
  } catch (err) {
    console.error('[Save Terminal State Error]', err);
    return res.status(500).json({ error: 'Failed to save terminal state' });
  }
});

router.get('/team', async (req, res) => {
  try {
    const members = await User.find({
      'communityRole.isMember': true,
    })
      .select('-passwordHash')
      .sort({ 'communityRole.order': 1, createdAt: 1 })
      .lean();

    const formatted = members.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
      role: u.role,
      avatar: u.avatar || '',
      bio: u.bio || '',
      skills: u.skills || [],
      socials: u.socials || {},
      communityRole: {
        isMember: true,
        category: u.communityRole?.category || 'Coordinator',
        positionTitle: u.communityRole?.positionTitle || 'Team Member',
        teamDomain: u.communityRole?.teamDomain || 'Core',
        order: typeof u.communityRole?.order === 'number' ? u.communityRole.order : 99,
        assignedAt: u.communityRole?.assignedAt || u.createdAt,
      },
      createdAt: u.createdAt,
    }));

    return res.json({ team: formatted });
  } catch (err) {
    console.error('[Get Public Team Error]', err);
    return res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || req.query.search || '').trim();
    if (!q) {
      return res.json({ users: [] });
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const users = await User.find({
      $or: [
        { username: { $regex: regex } },
        { email: { $regex: regex } },
        { name: { $regex: regex } },
      ],
    })
      .select('name username email role avatar bio skills communityRole createdAt')
      .limit(6)
      .lean();

    const formatted = users.map((u) => ({
      id: u._id.toString(),
      name: u.name || '',
      username: u.username,
      email: u.email || '',
      role: u.role,
      avatar: u.avatar || '',
      bio: u.bio || '',
      skills: u.skills || [],
      communityRole: u.communityRole || { isMember: false },
      createdAt: u.createdAt,
    }));

    return res.json({ users: formatted });
  } catch (err) {
    console.error('[Search Users Error]', err);
    return res.status(500).json({ error: 'Failed to search users' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const escaped = String(req.params.id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = isObjectId ? { _id: req.params.id } : { username: { $regex: new RegExp(`^${escaped}$`, 'i') } };

    const user = await User.findOne(query).select('-passwordHash').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [postCount, commentCount] = await Promise.all([
      Post.countDocuments({ author: user._id }),
      Comment.countDocuments({ author: user._id }),
    ]);

    const userPosts = await Post.find({ author: user._id }).select('voteScore').lean();
    const upvotesReceived = userPosts.reduce((sum, p) => sum + (p.voteScore > 0 ? p.voteScore : 0), 0);

    return res.json({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      bio: user.bio || '',
      skills: user.skills || [],
      avatar: user.avatar || '',
      socials: user.socials || {},
      communityRole: user.communityRole || {
        isMember: false,
        category: '',
        positionTitle: '',
        teamDomain: '',
        order: 99,
      },
      preferences: user.preferences || {},
      createdAt: user.createdAt,
      stats: {
        posts: postCount,
        comments: commentCount,
        upvotes: upvotesReceived,
      },
      moderationStrikes: user.moderationStrikes || 0,
      isBanned: !!user.isBanned,
      banExpiresAt: user.banExpiresAt || null,
      banReason: user.banReason || "",
    });
  } catch (err) {
    console.error('[Get User Profile Error]', err);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// @route   GET /api/users/:id/posts
// @desc    Get all posts created by a specific user
router.get('/:id/posts', async (req, res) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    let userId = req.params.id;

    if (!isObjectId) {
      const escaped = String(req.params.id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const u = await User.findOne({ username: { $regex: new RegExp(`^${escaped}$`, 'i') } }).select('_id');
      if (!u) return res.status(404).json({ error: 'User not found' });
      userId = u._id;
    }

    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate('author', 'username role avatar')
      .lean();

    return res.json(
      posts.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        body: p.body,
        category: p.category,
        tags: p.tags || [],
        voteScore: p.voteScore || 0,
        commentCount: p.commentCount || 0,
        createdAt: p.createdAt,
      }))
    );
  } catch (err) {
    console.error('[Get User Posts Error]', err);
    return res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});


function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// @route   GET /api/users/me/moderation-history
// @desc    Get user flagged content, strikes, and appeals
router.get("/me/moderation-history", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [userDoc, flaggedPosts, flaggedComments, strikeLogs, appeals] = await Promise.all([
      User.findById(userId).select("moderationStrikes isBanned banExpiresAt banReason strikeExpiresAt postingRestrictedUntil").lean(),
      Post.find({ author: userId, isHidden: true })
        .select("title body category isHidden moderationReason moderationCategory hiddenAt createdAt")
        .sort({ hiddenAt: -1, createdAt: -1 })
        .lean(),
      Comment.find({ author: userId, isHidden: true })
        .populate("post", "title")
        .select("body isHidden moderationReason moderationCategory hiddenAt createdAt post")
        .sort({ hiddenAt: -1, createdAt: -1 })
        .lean(),
      ModerationLog.find({
        targetUser: userId,
        action: { $in: ["auto_flag", "report_flag", "manual_ban"] },
      })
        .populate("targetPost", "title")
        .populate("targetComment", "body")
        .populate({
          path: "targetComment",
          select: "body post",
          populate: { path: "post", select: "title" },
        })
        .sort({ createdAt: -1 })
        .lean(),
      Appeal.find({ appellant: userId })
        .populate("targetPost", "title")
        .populate("targetComment", "body")
        .populate({
          path: "targetComment",
          select: "body post",
          populate: { path: "post", select: "title" },
        })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return res.json({
      strikes: userDoc?.moderationStrikes || 0,
      isBanned: !!userDoc?.isBanned,
      banExpiresAt: userDoc?.banExpiresAt || null,
      banReason: userDoc?.banReason || "",
      strikeExpiresAt: userDoc?.strikeExpiresAt || null,
      postingRestrictedUntil: userDoc?.postingRestrictedUntil || null,
      flaggedPosts: flaggedPosts.map((p) => ({
        id: p._id.toString(),
        _id: p._id.toString(),
        postId: p._id.toString(),
        targetPostId: p._id.toString(),
        title: p.title,
        bodySnippet: stripHtml(p.body).slice(0, 150),
        category: p.category,
        moderationReason: p.moderationReason,
        moderationCategory: p.moderationCategory,
        hiddenAt: p.hiddenAt || p.createdAt,
      })),
      flaggedComments: flaggedComments.map((c) => {
        const postId = c.post?._id ? c.post._id.toString() : (c.post ? c.post.toString() : null);
        return {
          id: c._id.toString(),
          _id: c._id.toString(),
          postTitle: c.post?.title || "Discussion Post",
          postId,
          targetPostId: postId,
          bodySnippet: stripHtml(c.body).slice(0, 150),
          moderationReason: c.moderationReason,
          moderationCategory: c.moderationCategory,
          hiddenAt: c.hiddenAt || c.createdAt,
        };
      }),
      strikeLogs: strikeLogs.map((s) => {
        const targetPostId = s.targetPost?._id
          ? s.targetPost._id.toString()
          : (s.targetComment?.post?._id
              ? s.targetComment.post._id.toString()
              : (s.targetComment?.post ? s.targetComment.post.toString() : null));
        return {
          id: s._id.toString(),
          _id: s._id.toString(),
          action: s.action,
          reason: s.reason,
          category: s.category,
          details: s.details,
          targetPostId,
          postId: targetPostId,
          targetCommentId: s.targetComment?._id
            ? s.targetComment._id.toString()
            : (s.targetComment ? s.targetComment.toString() : null),
          targetPostTitle: s.targetPost?.title || s.targetComment?.post?.title || null,
          targetCommentSnippet: s.targetComment?.body ? stripHtml(s.targetComment.body).slice(0, 100) : null,
          createdAt: s.createdAt,
        };
      }),
      appeals: appeals.map((a) => {
        const targetPostId = a.targetPost?._id
          ? a.targetPost._id.toString()
          : (a.targetComment?.post?._id
              ? a.targetComment.post._id.toString()
              : (a.targetComment?.post ? a.targetComment.post.toString() : (a.targetPost ? a.targetPost.toString() : null)));
        return {
          id: a._id.toString(),
          _id: a._id.toString(),
          itemType: a.itemType,
          targetPostId,
          postId: targetPostId,
          targetCommentId: a.targetComment?._id ? a.targetComment._id.toString() : (a.targetComment || null),
          targetPostTitle: a.targetPost?.title || a.targetComment?.post?.title || null,
          targetCommentSnippet: a.targetComment?.body ? a.targetComment.body.slice(0, 100) : null,
          moderationLogId: a.moderationLog ? a.moderationLog.toString() : null,
          strikeIndex: a.strikeIndex,
          originalReason: a.originalReason,
          originalCategory: a.originalCategory,
          statement: a.statement,
          status: a.status,
          adminNotes: a.adminNotes || "",
          resolvedAt: a.resolvedAt,
          createdAt: a.createdAt,
        };
      }),
    });
  } catch (err) {
    console.error("[Get Moderation History Error]", err);
    return res.status(500).json({ error: "Failed to load moderation history" });
  }
});

// @route   POST /api/users/me/appeals
// @desc    Submit an appeal for a strike or flagged item
router.post("/me/appeals", requireAuth, async (req, res) => {
  const {
    itemType = "strike",
    targetPostId = null,
    targetCommentId = null,
    targetMessageId = null,
    moderationLogId = null,
    strikeIndex = 1,
    originalReason = "",
    originalCategory = "",
    statement = "",
  } = req.body;

  if (!statement || typeof statement !== "string" || !statement.trim()) {
    return res.status(400).json({ error: "Please provide an explanation statement for your appeal" });
  }

  try {
    const userId = req.user.id;

    // Check duplicate pending appeal for this specific item/strike
    const query = {
      appellant: userId,
      status: "pending",
    };

    if (targetCommentId) {
      query.targetComment = targetCommentId;
    } else if (moderationLogId) {
      query.moderationLog = moderationLogId;
    } else if (targetPostId && itemType === "post") {
      query.targetPost = targetPostId;
    } else {
      query.strikeIndex = strikeIndex;
    }

    const existingPending = await Appeal.findOne(query);
    if (existingPending) {
      return res.status(400).json({ error: "You already have a pending appeal under review for this item" });
    }

    const appeal = await Appeal.create({
      appellant: userId,
      itemType,
      targetPost: (itemType === "post" ? targetPostId : null) || null,
      targetComment: targetCommentId || null,
      targetMessage: targetMessageId || null,
      moderationLog: moderationLogId || null,
      strikeIndex: Number(strikeIndex) || 1,
      originalReason: String(originalReason).trim().slice(0, 300),
      originalCategory: String(originalCategory).trim().slice(0, 100),
      statement: statement.trim().slice(0, 1500),
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Your appeal has been submitted and queued for administrator review.",
      appeal: appeal.toJSON(),
    });
  } catch (err) {
    console.error("[Submit Appeal Error]", err);
    return res.status(500).json({ error: "Failed to submit appeal" });
  }
});

export default router;

