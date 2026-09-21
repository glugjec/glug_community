import { createSystemNotification } from '../utils/notificationService.js';
import { Router } from "express";
import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { Comment } from "../models/Comment.js";
import { Vote } from "../models/Vote.js";
import { Bookmark } from "../models/Bookmark.js";
import { Resource } from "../models/Resource.js";
import { Event } from "../models/Event.js";
import { Report } from "../models/Report.js";
import { Appeal } from "../models/Appeal.js";
import { ModerationLog } from "../models/ModerationLog.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { applyStrikePipeline } from "../utils/contentModerator.js";
import { sendAppealDecisionMail } from "../config/mail.js";

const router = Router();

// Protect all admin routes
router.use(requireAuth, requireAdmin);

const PROTECTED_ADMIN_EMAILS = ["glug.jec@gmail.com"];

const stripHtmlText = (str = "") => {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
};

// @route   GET /api/admin/stats
// @desc    Get platform-wide metrics
router.get("/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalPosts,
      totalComments,
      totalResources,
      totalEvents,
      adminCount,
      todayPosts,
      teamCount,
      bannedUsersCount,
      flaggedPostsCount,
      flaggedCommentsCount,
      pendingReportsCount,
      pendingAppealsCount,
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments(),
      Resource.countDocuments(),
      Event.countDocuments(),
      User.countDocuments({ role: "admin" }),
      Post.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ "communityRole.isMember": true }),
      User.countDocuments({ isBanned: true }),
      Post.countDocuments({ isHidden: true }),
      Comment.countDocuments({ isHidden: true }),
      Report.countDocuments({ status: "pending" }),
      Appeal.countDocuments({ status: "pending" }),
    ]);

    return res.json({
      totalUsers,
      totalPosts,
      totalComments,
      totalResources,
      totalEvents,
      adminCount,
      todayPosts,
      teamCount,
      bannedUsersCount,
      flaggedPostsCount,
      flaggedCommentsCount,
      pendingReportsCount,
      pendingAppealsCount,
      flaggedCount: flaggedPostsCount + flaggedCommentsCount,
    });
  } catch (err) {
    console.error("[Admin Stats Error]", err);
    return res.status(500).json({ error: "Failed to load dashboard metrics" });
  }
});

// @route   GET /api/admin/users
// @desc    List all registered users with search and filtering
router.get("/users", async (req, res) => {
  try {
    const { q, role, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (role && ["student", "admin"].includes(role)) {
      filter.role = role;
    }

    if (q) {
      filter.$or = [
        { username: { $regex: q.trim(), $options: "i" } },
        { email: { $regex: q.trim(), $options: "i" } },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      User.countDocuments(filter),
    ]);

    // Aggregate counts for each user
    const userIds = users.map((u) => u._id);
    const [postCounts, commentCounts] = await Promise.all([
      Post.aggregate([
        { $match: { author: { $in: userIds } } },
        { $group: { _id: "$author", count: { $sum: 1 } } },
      ]),
      Comment.aggregate([
        { $match: { author: { $in: userIds } } },
        { $group: { _id: "$author", count: { $sum: 1 } } },
      ]),
    ]);

    const postMap = new Map(postCounts.map((p) => [p._id.toString(), p.count]));
    const commentMap = new Map(commentCounts.map((c) => [c._id.toString(), c.count]));

    const formattedUsers = users.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
      role: u.role,
      avatar: u.avatar || "",
      communityRole: u.communityRole || {},
      isBanned: Boolean(u.isBanned),
      banReason: u.banReason || "",
      bannedAt: u.bannedAt || null,
      banExpiresAt: u.banExpiresAt || null,
      moderationStrikes: u.moderationStrikes || 0,
      createdAt: u.createdAt,
      stats: {
        posts: postMap.get(u._id.toString()) || 0,
        comments: commentMap.get(u._id.toString()) || 0,
      },
      isProtected: PROTECTED_ADMIN_EMAILS.includes(u.email),
    }));

    return res.json({
      users: formattedUsers,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    console.error("[Admin Get Users Error]", err);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Change user role (student / admin)
router.put("/users/:id/role", async (req, res) => {
  const { role } = req.body;

  if (!["student", "admin"].includes(role)) {
    return res.status(400).json({ error: "Role must be either student or admin" });
  }

  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Safety checks: Cannot demote protected admin
    if (PROTECTED_ADMIN_EMAILS.includes(targetUser.email) && role !== "admin") {
      return res.status(403).json({ error: "Cannot demote primary administrator" });
    }

    // Cannot demote yourself
    if (targetUser._id.toString() === req.user.id && role !== "admin") {
      return res.status(400).json({ error: "Cannot remove your own admin privileges" });
    }

    targetUser.role = role;
    await targetUser.save();

    return res.json({
      success: true,
      id: targetUser._id.toString(),
      username: targetUser.username,
      role: targetUser.role,
    });
  } catch (err) {
    console.error("[Admin Update Role Error]", err);
    return res.status(500).json({ error: "Failed to update user role" });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user account and associated content
router.delete("/users/:id", async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (PROTECTED_ADMIN_EMAILS.includes(targetUser.email)) {
      return res.status(403).json({ error: "Cannot delete primary administrator" });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account from admin dashboard" });
    }

    // Cascade delete user posts, comments, and votes
    const userPosts = await Post.find({ author: targetUser._id }).select("_id");
    const postIds = userPosts.map((p) => p._id);

    await Promise.all([
      Comment.deleteMany({ $or: [{ author: targetUser._id }, { post: { $in: postIds } }] }),
      Vote.deleteMany({ $or: [{ user: targetUser._id }, { post: { $in: postIds } }] }),
      Post.deleteMany({ author: targetUser._id }),
      User.findByIdAndDelete(targetUser._id),
    ]);

    return res.json({ success: true, message: `User @${targetUser.username} and their content deleted` });
  } catch (err) {
    console.error("[Admin Delete User Error]", err);
    return res.status(500).json({ error: "Failed to delete user" });
  }
});

// @route   GET /api/admin/posts
// @desc    List posts for moderation
router.get("/posts", async (req, res) => {
  try {
    const { q, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { title: { $regex: q.trim(), $options: "i" } },
        { body: { $regex: q.trim(), $options: "i" } },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate("author", "username email role avatar")
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Post.countDocuments(filter),
    ]);

    return res.json({
      posts: posts.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        body: p.body,
        category: p.category,
        tags: p.tags || [],
        voteScore: p.voteScore || 0,
        commentCount: p.commentCount || 0,
        isPinned: Boolean(p.isPinned),
        isLocked: Boolean(p.isLocked),
        author: p.author
          ? {
              id: p.author._id.toString(),
              username: p.author.username,
              email: p.author.email,
              role: p.author.role,
            }
          : { username: "[deleted]", role: "student" },
        createdAt: p.createdAt,
      })),
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    console.error("[Admin Get Posts Error]", err);
    return res.status(500).json({ error: "Failed to fetch posts for moderation" });
  }
});

// @route   PUT /api/admin/posts/:id/pin
// @desc    Toggle pin status of a post
router.put("/posts/:id/pin", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    post.isPinned = !post.isPinned;
    await post.save();

    return res.json({ success: true, isPinned: post.isPinned });
  } catch (err) {
    console.error("[Admin Pin Post Error]", err);
    return res.status(500).json({ error: "Failed to toggle pin status" });
  }
});

// @route   PUT /api/admin/posts/:id/lock
// @desc    Toggle lock status of a post (prevents new comments)
router.put("/posts/:id/lock", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    post.isLocked = !post.isLocked;
    await post.save();

    return res.json({ success: true, isLocked: post.isLocked });
  } catch (err) {
    console.error("[Admin Lock Post Error]", err);
    return res.status(500).json({ error: "Failed to toggle lock status" });
  }
});

// @route   DELETE /api/admin/posts/:id
// @desc    Delete post, its comments and votes
router.delete("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    await Promise.all([
      Comment.deleteMany({ post: post._id }),
      Vote.deleteMany({ post: post._id }),
      Bookmark.deleteMany({ post: post._id }),
      Post.findByIdAndDelete(post._id),
    ]);

    return res.json({ success: true, message: "Discussion deleted successfully" });
  } catch (err) {
    console.error("[Admin Delete Post Error]", err);
    return res.status(500).json({ error: "Failed to delete post" });
  }
});

async function getAllDescendantCommentIds(initialCommentId) {
  const idsToDelete = [initialCommentId.toString()];
  let currentParentIds = [initialCommentId];
  while (currentParentIds.length > 0) {
    const children = await Comment.find({ parentComment: { $in: currentParentIds } }).select('_id').lean();
    if (!children.length) break;
    const childIds = children.map((c) => c._id);
    for (const cid of childIds) {
      idsToDelete.push(cid.toString());
    }
    currentParentIds = childIds;
  }
  return idsToDelete;
}

router.delete("/comments/:id", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const postId = comment.post;
    const allIds = await getAllDescendantCommentIds(comment._id);
    await Comment.deleteMany({ _id: { $in: allIds } });

    const remainingCount = await Comment.countDocuments({ post: postId });
    await Post.findByIdAndUpdate(postId, { commentCount: remainingCount });

    return res.json({ success: true, message: "Comment deleted successfully", deletedCount: allIds.length, remainingCount });
  } catch (err) {
    console.error("[Admin Delete Comment Error]", err);
    return res.status(500).json({ error: "Failed to delete comment" });
  }
});

router.get("/team", async (req, res) => {
  try {
    const teamMembers = await User.find({
      "communityRole.isMember": true,
    })
      .select("-passwordHash")
      .sort({ "communityRole.order": 1, createdAt: 1 })
      .lean();

    const formatted = teamMembers.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
      role: u.role,
      avatar: u.avatar || "",
      bio: u.bio || "",
      skills: u.skills || [],
      socials: u.socials || {},
      communityRole: {
        isMember: true,
        category: u.communityRole?.category || "Coordinator",
        positionTitle: u.communityRole?.positionTitle || "Team Member",
        teamDomain: u.communityRole?.teamDomain || "Core",
        order: typeof u.communityRole?.order === "number" ? u.communityRole.order : 99,
        assignedAt: u.communityRole?.assignedAt || u.createdAt,
      },
      createdAt: u.createdAt,
    }));

    return res.json({ team: formatted });
  } catch (err) {
    console.error("[Admin Get Team Error]", err);
    return res.status(500).json({ error: "Failed to load team members" });
  }
});

router.put("/team/:userId", async (req, res) => {
  try {
    const { category, positionTitle, teamDomain, order } = req.body;

    const validCategories = [
      "Mentor",
      "Alumni",
      "Head",
      "Club Head",
      "Advisor",
      "Co-Head",
      "Team Lead",
      "Lead",
      "Coordinator",
    ];

    if (category && !validCategories.includes(category)) {
      return res.status(400).json({ error: "Invalid team category" });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.communityRole = {
      isMember: true,
      category: category || user.communityRole?.category || "Coordinator",
      positionTitle: typeof positionTitle === "string" ? positionTitle.trim() : (user.communityRole?.positionTitle || ""),
      teamDomain: typeof teamDomain === "string" ? teamDomain.trim() : (user.communityRole?.teamDomain || "Core"),
      order: typeof order === "number" ? order : (Number(order) || 99),
      assignedAt: user.communityRole?.assignedAt || new Date(),
    };

    await user.save();

    return res.json({
      success: true,
      message: "Team position updated successfully",
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        communityRole: user.communityRole,
      },
    });
  } catch (err) {
    console.error("[Admin Update Team Position Error]", err);
    return res.status(500).json({ error: "Failed to update team position" });
  }
});

router.delete("/team/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.communityRole = {
      isMember: false,
      category: "",
      positionTitle: "",
      teamDomain: "",
      order: 99,
      assignedAt: null,
    };

    await user.save();

    return res.json({ success: true, message: "Member removed from community team" });
  } catch (err) {
    console.error("[Admin Remove Team Member Error]", err);
    return res.status(500).json({ error: "Failed to remove member from team" });
  }
});

// ==========================================
// USER BAN / UNBAN MANAGEMENT
// ==========================================

// @route   PUT /api/admin/users/:id/ban
// @desc    Manually ban a user
router.put("/users/:id/ban", async (req, res) => {
  const { reason = "Banned by administrator", hours = null } = req.body;

  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (PROTECTED_ADMIN_EMAILS.includes(targetUser.email) || targetUser.role === "admin") {
      return res.status(403).json({ error: "Cannot ban administrators" });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ error: "Cannot ban your own account" });
    }

    targetUser.isBanned = true;
    targetUser.banReason = String(reason).trim();
    targetUser.bannedAt = new Date();
    targetUser.banExpiresAt = hours ? new Date(Date.now() + Number(hours) * 3600000) : null;
    await targetUser.save();

    await ModerationLog.create({
      action: "manual_ban",
      performedBy: req.user.id,
      targetUser: targetUser._id,
      reason: targetUser.banReason,
      details: hours ? `Temporary ban for ${hours} hours` : "Permanent ban",
    });

    return res.json({
      success: true,
      message: `User @${targetUser.username} has been banned`,
      user: {
        id: targetUser._id.toString(),
        username: targetUser.username,
        isBanned: targetUser.isBanned,
        banReason: targetUser.banReason,
        banExpiresAt: targetUser.banExpiresAt,
      },
    });
  } catch (err) {
    console.error("[Admin Ban User Error]", err);
    return res.status(500).json({ error: "Failed to ban user" });
  }
});

// @route   PUT /api/admin/users/:id/unban
// @desc    Unban a user with optional strike reset
router.put("/users/:id/unban", async (req, res) => {
  const { resetStrikes = false } = req.body;

  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    targetUser.isBanned = false;
    targetUser.banReason = "";
    targetUser.banExpiresAt = null;
    targetUser.postingRestrictedUntil = null;
    if (resetStrikes) {
      targetUser.moderationStrikes = 0;
      targetUser.strikeExpiresAt = null;
    }
    await targetUser.save();

    await ModerationLog.create({
      action: "manual_unban",
      performedBy: req.user.id,
      targetUser: targetUser._id,
      details: resetStrikes ? "Unbanned and reset strikes to 0" : "Unbanned, strikes retained",
    });

    return res.json({
      success: true,
      message: `User @${targetUser.username} has been unbanned`,
      user: {
        id: targetUser._id.toString(),
        username: targetUser.username,
        isBanned: targetUser.isBanned,
        moderationStrikes: targetUser.moderationStrikes,
      },
    });
  } catch (err) {
    console.error("[Admin Unban User Error]", err);
    return res.status(500).json({ error: "Failed to unban user" });
  }
});

// ==========================================
// MODERATION HUB ENDPOINTS
// ==========================================

// @route   GET /api/admin/moderation/flagged
// @desc    List all flagged (hidden) posts and comments
router.get("/moderation/flagged", async (req, res) => {
  try {
    const { type = "all", category, page = 1, limit = 50 } = req.query;

    const postFilter = { isHidden: true };
    const commentFilter = { isHidden: true };

    if (category && category !== "all") {
      postFilter.moderationCategory = category;
      commentFilter.moderationCategory = category;
    }

    let flaggedPosts = [];
    let flaggedComments = [];

    if (type === "all" || type === "posts") {
      flaggedPosts = await Post.find(postFilter)
        .populate("author", "username email avatar role communityRole moderationStrikes isBanned")
        .sort({ hiddenAt: -1, createdAt: -1 })
        .limit(parseInt(limit, 10))
        .lean();
    }

    if (type === "all" || type === "comments") {
      flaggedComments = await Comment.find(commentFilter)
        .populate("author", "username email avatar role communityRole moderationStrikes isBanned")
        .populate("post", "title")
        .sort({ hiddenAt: -1, createdAt: -1 })
        .limit(parseInt(limit, 10))
        .lean();
    }

    const formattedPosts = flaggedPosts.map((p) => ({
      id: p._id.toString(),
      itemType: "post",
      title: p.title,
      body: p.body,
      category: p.category,
      moderationCategory: p.moderationCategory || "abuse",
      moderationReason: p.moderationReason || "Flagged by automated moderation",
      hiddenAt: p.hiddenAt || p.updatedAt,
      createdAt: p.createdAt,
      author: p.author
        ? {
            id: p.author._id.toString(),
            username: p.author.username,
            email: p.author.email,
            avatar: p.author.avatar,
            role: p.author.role,
            strikes: p.author.moderationStrikes || 0,
            isBanned: Boolean(p.author.isBanned),
          }
        : { username: "[deleted]", role: "student" },
    }));

    const formattedComments = flaggedComments.map((c) => ({
      id: c._id.toString(),
      itemType: "comment",
      body: c.body,
      postTitle: c.post?.title || "Unknown Post",
      postId: c.post?._id?.toString() || c.post?.toString() || "",
      moderationCategory: c.moderationCategory || "abuse",
      moderationReason: c.moderationReason || "Flagged by automated moderation",
      hiddenAt: c.hiddenAt || c.updatedAt,
      createdAt: c.createdAt,
      author: c.author
        ? {
            id: c.author._id.toString(),
            username: c.author.username,
            email: c.author.email,
            avatar: c.author.avatar,
            role: c.author.role,
            strikes: c.author.moderationStrikes || 0,
            isBanned: Boolean(c.author.isBanned),
          }
        : { username: "[deleted]", role: "student" },
    }));

    const allItems = [...formattedPosts, ...formattedComments].sort(
      (a, b) => new Date(b.hiddenAt || b.createdAt) - new Date(a.hiddenAt || a.createdAt)
    );

    return res.json({
      items: allItems,
      totalPosts: flaggedPosts.length,
      totalComments: flaggedComments.length,
      total: allItems.length,
    });
  } catch (err) {
    console.error("[Admin Get Flagged Error]", err);
    return res.status(500).json({ error: "Failed to fetch flagged content" });
  }
});

// @route   PUT /api/admin/moderation/posts/:id/restore
// @desc    Restore (unhide) a flagged post
router.put("/moderation/posts/:id/restore", async (req, res) => {
  const { decrementStrike = true } = req.body || {};
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    post.isHidden = false;
    post.moderationReason = "";
    post.moderationCategory = "";
    post.hiddenAt = null;
    await post.save();

    let authorUpdated = null;
    if (decrementStrike && post.author) {
      const author = await User.findById(post.author);
      if (author) {
        author.moderationStrikes = Math.max(0, (author.moderationStrikes || 0) - 1);
        if ((author.moderationStrikes || 0) < 2) {
          author.postingRestrictedUntil = null;
        }
        if ((author.moderationStrikes || 0) === 0) {
          author.strikeExpiresAt = null;
        }
        if (author.isBanned && (author.moderationStrikes || 0) < 3) {
          author.isBanned = false;
          author.banExpiresAt = null;
          author.banReason = "";
        }
        await author.save();
        authorUpdated = {
          id: author._id,
          moderationStrikes: author.moderationStrikes,
        };
      }
    }

    await ModerationLog.create({
      action: "restore_post",
      performedBy: req.user.id,
      targetUser: post.author,
      targetPost: post._id,
      details: `Restored post: "${post.title}". Strike decremented: ${decrementStrike}`,
    });

    return res.json({
      success: true,
      message: "Discussion topic restored successfully",
      author: authorUpdated,
    });
  } catch (err) {
    console.error("[Admin Restore Post Error]", err);
    return res.status(500).json({ error: "Failed to restore post" });
  }
});

// @route   PUT /api/admin/moderation/comments/:id/restore
// @desc    Restore (unhide) a flagged comment
router.put("/moderation/comments/:id/restore", async (req, res) => {
  const { decrementStrike = true } = req.body || {};
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    comment.isHidden = false;
    comment.moderationReason = "";
    comment.moderationCategory = "";
    comment.hiddenAt = null;
    await comment.save();

    const visibleCount = await Comment.countDocuments({
      post: comment.post,
      isHidden: { $ne: true },
    });
    await Post.findByIdAndUpdate(comment.post, { commentCount: visibleCount });

    let authorUpdated = null;
    if (decrementStrike && comment.author) {
      const author = await User.findById(comment.author);
      if (author) {
        author.moderationStrikes = Math.max(0, (author.moderationStrikes || 0) - 1);
        if ((author.moderationStrikes || 0) < 2) {
          author.postingRestrictedUntil = null;
        }
        if ((author.moderationStrikes || 0) === 0) {
          author.strikeExpiresAt = null;
        }
        if (author.isBanned && (author.moderationStrikes || 0) < 3) {
          author.isBanned = false;
          author.banExpiresAt = null;
          author.banReason = "";
        }
        await author.save();
        authorUpdated = {
          id: author._id,
          moderationStrikes: author.moderationStrikes,
        };
      }
    }

    await ModerationLog.create({
      action: "restore_comment",
      performedBy: req.user.id,
      targetUser: comment.author,
      targetComment: comment._id,
      targetPost: comment.post,
      details: `Restored comment. Strike decremented: ${decrementStrike}`,
    });

    return res.json({
      success: true,
      message: "Comment restored successfully",
      author: authorUpdated,
    });
  } catch (err) {
    console.error("[Admin Restore Comment Error]", err);
    return res.status(500).json({ error: "Failed to restore comment" });
  }
});

// @route   DELETE /api/admin/moderation/posts/:id
// @desc    Permanently delete a flagged post
router.delete("/moderation/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    await Promise.all([
      Comment.deleteMany({ post: post._id }),
      Vote.deleteMany({ post: post._id }),
      Bookmark.deleteMany({ post: post._id }),
      Report.deleteMany({ targetPost: post._id }),
      Post.findByIdAndDelete(post._id),
    ]);

    await ModerationLog.create({
      action: "delete_post",
      performedBy: req.user.id,
      targetUser: post.author,
      details: `Permanently deleted flagged post: "${post.title}"`,
    });

    return res.json({ success: true, message: "Discussion and associated data permanently deleted" });
  } catch (err) {
    console.error("[Admin Delete Flagged Post Error]", err);
    return res.status(500).json({ error: "Failed to delete post" });
  }
});

// @route   DELETE /api/admin/moderation/comments/:id
// @desc    Permanently delete a flagged comment
router.delete("/moderation/comments/:id", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const postId = comment.post;
    const post = await Post.findById(postId).select("title").lean();
    const allIds = await getAllDescendantCommentIds(comment._id);
    const commentSnippet = stripHtmlText(comment.body || "").slice(0, 150);
    const postTitle = post?.title || "";

    await Promise.all([
      Comment.deleteMany({ _id: { $in: allIds } }),
      Report.deleteMany({ targetComment: { $in: allIds } }),
      ModerationLog.updateMany(
        { targetComment: { $in: allIds } },
        {
          $set: {
            contentType: "comment",
            contentSnippet: commentSnippet,
            postTitle: postTitle,
            targetPost: postId,
          },
        }
      ),
      Appeal.updateMany(
        { targetComment: { $in: allIds } },
        {
          $set: {
            itemType: "comment",
            contentSnippet: commentSnippet,
            postTitle: postTitle,
            targetPost: postId,
          },
        }
      ),
    ]);

    const remainingCount = await Comment.countDocuments({
      post: postId,
      isHidden: { $ne: true },
    });
    await Post.findByIdAndUpdate(postId, { commentCount: remainingCount });

    await ModerationLog.create({
      action: "delete_comment",
      performedBy: req.user.id,
      targetUser: comment.author,
      targetPost: postId,
      targetComment: comment._id,
      contentType: "comment",
      contentSnippet: commentSnippet,
      postTitle: postTitle,
      details: `Permanently deleted flagged comment (and ${allIds.length - 1} replies)`,
    });

    return res.json({ success: true, message: "Comment permanently deleted" });
  } catch (err) {
    console.error("[Admin Delete Flagged Comment Error]", err);
    return res.status(500).json({ error: "Failed to delete comment" });
  }
});

// @route   GET /api/admin/moderation/reports
// @desc    List all user-submitted reports with AI classification
router.get("/moderation/reports", async (req, res) => {
  try {
    const { status, contentType, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status && ["pending", "confirmed", "dismissed"].includes(status)) {
      filter.status = status;
    }

    if (contentType && ["post", "comment", "message"].includes(contentType)) {
      filter.contentType = contentType;
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate("reporter", "username email avatar")
        .populate("targetAuthor", "username email avatar role moderationStrikes isBanned")
        .populate("targetPost", "title body isHidden")
        .populate("targetComment", "body isHidden")
        .populate({
          path: "targetComment",
          select: "body isHidden post",
          populate: { path: "post", select: "title" },
        })
        .populate("targetMessage", "text")
        .populate("resolvedBy", "username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Report.countDocuments(filter),
    ]);

    const formatted = reports.map((r) => ({
      id: r._id.toString(),
      contentType: r.contentType,
      userReason: r.userReason || "No explanation provided",
      status: r.status,
      aiVerdict: r.aiVerdict,
      aiReason: r.aiReason,
      aiCategory: r.aiCategory,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      resolvedBy: r.resolvedBy?.username || null,
      reporter: r.reporter
        ? {
            id: r.reporter._id.toString(),
            username: r.reporter.username,
            avatar: r.reporter.avatar,
          }
        : { username: "[deleted]" },
      targetAuthor: r.targetAuthor
        ? {
            id: r.targetAuthor._id.toString(),
            username: r.targetAuthor.username,
            email: r.targetAuthor.email,
            avatar: r.targetAuthor.avatar,
            role: r.targetAuthor.role,
            strikes: r.targetAuthor.moderationStrikes || 0,
            isBanned: Boolean(r.targetAuthor.isBanned),
          }
        : { username: "[deleted]" },
      contentPreview:
        r.contentType === "post"
          ? {
              id: r.targetPost?._id?.toString() || "",
              postId: r.targetPost?._id?.toString() || "",
              title: r.targetPost?.title || "[Post Removed]",
              body: r.targetPost?.body || "",
              bodySnippet: stripHtmlText(r.targetPost?.body || "").slice(0, 150),
              isHidden: Boolean(r.targetPost?.isHidden),
            }
          : r.contentType === "comment"
          ? {
              id: r.targetComment?._id?.toString() || "",
              postId: r.targetComment?.post?._id?.toString() || r.targetComment?.post?.toString() || "",
              postTitle: r.targetComment?.post?.title || "Discussion Post",
              body: r.targetComment?.body || "[Comment Removed]",
              bodySnippet: stripHtmlText(r.targetComment?.body || "").slice(0, 150),
              isHidden: Boolean(r.targetComment?.isHidden),
            }
          : {
              id: r.targetMessage?._id?.toString() || "",
              postId: null,
              text: r.targetMessage?.text || "[Message Removed]",
              bodySnippet: stripHtmlText(r.targetMessage?.text || "").slice(0, 150),
            },
    }));

    return res.json({
      reports: formatted,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    console.error("[Admin Get Reports Error]", err);
    return res.status(500).json({ error: "Failed to fetch moderation reports" });
  }
});

// @route   PUT /api/admin/moderation/reports/:id/override
// @desc    Admin manually overrides report status
router.put("/moderation/reports/:id/override", async (req, res) => {
  const { newStatus, action = "none", applyStrike = false, reason = "" } = req.body;

  if (!["confirmed", "dismissed"].includes(newStatus)) {
    return res.status(400).json({ error: "Status must be 'confirmed' or 'dismissed'" });
  }

  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    report.status = newStatus;
    report.resolvedBy = req.user.id;
    report.resolvedAt = new Date();
    await report.save();

    // If action is hide/unhide on post or comment
    if (report.contentType === "post" && report.targetPost) {
      const post = await Post.findById(report.targetPost);
      if (post) {
        if (action === "hide") {
          post.isHidden = true;
          post.moderationReason = reason || "Hidden by administrator override";
          post.hiddenAt = new Date();
          await post.save();
        } else if (action === "unhide") {
          post.isHidden = false;
          post.moderationReason = "";
          post.hiddenAt = null;
          await post.save();
        }
      }
    } else if (report.contentType === "comment" && report.targetComment) {
      const comment = await Comment.findById(report.targetComment);
      if (comment) {
        if (action === "hide") {
          comment.isHidden = true;
          comment.moderationReason = reason || "Hidden by administrator override";
          comment.hiddenAt = new Date();
          await comment.save();
        } else if (action === "unhide") {
          comment.isHidden = false;
          comment.moderationReason = "";
          comment.hiddenAt = null;
          await comment.save();
        }
      }
    }

    // Apply strike pipeline if requested
    if (applyStrike && report.targetAuthor) {
      await applyStrikePipeline({
        userId: report.targetAuthor,
        reason: reason || "Administrator manual penalty following report review",
        category: report.aiCategory || "abuse",
        actionSource: "report_override",
        performedBy: req.user.id,
      });
    }

    if (newStatus === "confirmed") {
      if (report.reporter) {
        await createSystemNotification({
          recipientId: report.reporter,
          type: "report_accepted",
          message: "Thank you for helping keep GLUG safe. An administrator reviewed and accepted your report.",
        });
      }
      if (report.targetAuthor && (action === "hide" || applyStrike)) {
        await createSystemNotification({
          recipientId: report.targetAuthor,
          type: "report_accepted",
          message: "A report against your content was confirmed by an administrator. The content has been hidden.",
        });
      }
    }

    await ModerationLog.create({
      action: "report_override",
      performedBy: req.user.id,
      targetUser: report.targetAuthor,
      reason: reason || `Overridden report status to ${newStatus}`,
      details: `Action: ${action}, Applied Strike: ${applyStrike}`,
    });

    return res.json({
      success: true,
      message: `Report status updated to ${newStatus}`,
      report: {
        id: report._id.toString(),
        status: report.status,
        resolvedAt: report.resolvedAt,
      },
    });
  } catch (err) {
    console.error("[Admin Override Report Error]", err);
    return res.status(500).json({ error: "Failed to override report" });
  }
});

// @route   GET /api/admin/moderation/banned-users
// @desc    List all currently banned users
router.get("/moderation/banned-users", async (req, res) => {
  try {
    const bannedUsers = await User.find({ isBanned: true })
      .select("-passwordHash")
      .sort({ bannedAt: -1 })
      .lean();

    const formatted = bannedUsers.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
      avatar: u.avatar || "",
      role: u.role,
      banReason: u.banReason || "No reason specified",
      bannedAt: u.bannedAt,
      banExpiresAt: u.banExpiresAt,
      isPermanent: !u.banExpiresAt,
      moderationStrikes: u.moderationStrikes || 0,
      createdAt: u.createdAt,
    }));

    return res.json({ users: formatted, total: formatted.length });
  } catch (err) {
    console.error("[Admin Get Banned Users Error]", err);
    return res.status(500).json({ error: "Failed to fetch banned users" });
  }
});

// @route   GET /api/admin/moderation/logs
// @desc    Get moderation audit trail
router.get("/moderation/logs", async (req, res) => {
  try {
    const { action, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (action) {
      filter.action = action;
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [logs, total] = await Promise.all([
      ModerationLog.find(filter)
        .populate("performedBy", "username email avatar")
        .populate("targetUser", "username email avatar")
        .populate("targetPost", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      ModerationLog.countDocuments(filter),
    ]);

    const formatted = logs.map((l) => ({
      id: l._id.toString(),
      action: l.action,
      reason: l.reason,
      category: l.category,
      details: l.details,
      createdAt: l.createdAt,
      performedBy: l.performedBy
        ? {
            id: l.performedBy._id.toString(),
            username: l.performedBy.username,
            avatar: l.performedBy.avatar,
          }
        : { username: "System (Automated)" },
      targetUser: l.targetUser
        ? {
            id: l.targetUser._id.toString(),
            username: l.targetUser.username,
            avatar: l.targetUser.avatar,
          }
        : { username: "[deleted]" },
      targetPostTitle: l.targetPost?.title || null,
    }));

    return res.json({
      logs: formatted,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    console.error("[Admin Get Moderation Logs Error]", err);
    return res.status(500).json({ error: "Failed to fetch moderation logs" });
  }
});


// @route   GET /api/admin/moderation/appeals
// @desc    List all moderation appeals
router.get("/moderation/appeals", async (req, res) => {
  const { status = "all" } = req.query;

  try {
    const filter = {};
    if (status !== "all" && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const rawAppeals = await Appeal.find(filter)
      .sort({ createdAt: -1 })
      .populate("appellant", "username email role avatar moderationStrikes isBanned banExpiresAt")
      .populate("resolvedBy", "username")
      .lean();

    const postIds = rawAppeals.map((a) => a.targetPost).filter(Boolean);
    const commentIds = rawAppeals.map((a) => a.targetComment).filter(Boolean);
    const [posts, comments] = await Promise.all([
      Post.find({ _id: { $in: postIds } }).select("title body").lean(),
      Comment.find({ _id: { $in: commentIds } }).select("body post").populate("post", "title").lean(),
    ]);
    const postMap = new Map(posts.map((p) => [p._id.toString(), p]));
    const commentMap = new Map(comments.map((c) => [c._id.toString(), c]));

    return res.json({
      appeals: rawAppeals.map((a) => {
        const targetCommentId = a.targetComment ? a.targetComment.toString() : null;
        const targetPostId = a.targetPost ? a.targetPost.toString() : null;
        const matchedComment = targetCommentId ? commentMap.get(targetCommentId) : null;
        const matchedPost = targetPostId
          ? postMap.get(targetPostId)
          : (matchedComment?.post?._id ? postMap.get(matchedComment.post._id.toString()) : null);

        const isCommentAppeal = a.itemType === "comment" || !!targetCommentId || /comment/i.test(a.originalReason || "");
        const itemType = isCommentAppeal ? "comment" : a.itemType;
        const postTitle = a.postTitle || matchedPost?.title || matchedComment?.post?.title || "Discussion Post";
        const commentBody = matchedComment?.body || a.contentSnippet || "[Removed comment]";

        return {
          id: a._id.toString(),
          _id: a._id.toString(),
          appellant: a.appellant
            ? {
                id: a.appellant._id.toString(),
                username: a.appellant.username,
                email: a.appellant.email,
                role: a.appellant.role,
                avatar: a.appellant.avatar,
                moderationStrikes: a.appellant.moderationStrikes || 0,
                isBanned: !!a.appellant.isBanned,
                banExpiresAt: a.appellant.banExpiresAt,
              }
            : null,
          itemType,
          isComment: isCommentAppeal,
          isCommentDeleted: isCommentAppeal && !matchedComment,
          strikeIndex: a.strikeIndex,
          originalReason: a.originalReason,
          originalCategory: a.originalCategory,
          statement: a.statement,
          status: a.status,
          adminNotes: a.adminNotes || "",
          targetPostId: targetPostId || matchedComment?.post?._id?.toString() || null,
          targetPost: matchedPost
            ? {
                id: matchedPost._id.toString(),
                title: matchedPost.title,
                body: matchedPost.body || "",
                bodySnippet: stripHtmlText(matchedPost.body || "").slice(0, 150),
              }
            : (postTitle ? { id: targetPostId, title: postTitle, bodySnippet: "" } : null),
          targetComment: isCommentAppeal
            ? {
                id: targetCommentId,
                postId: targetPostId || matchedComment?.post?._id?.toString() || null,
                postTitle: postTitle,
                body: commentBody,
                bodySnippet: stripHtmlText(commentBody).slice(0, 150),
                isDeleted: !matchedComment,
              }
            : null,
          resolvedBy: a.resolvedBy?.username || null,
          resolvedAt: a.resolvedAt,
          createdAt: a.createdAt,
        };
      }),
    });
  } catch (err) {
    console.error("[Get Appeals Error]", err);
    return res.status(500).json({ error: "Failed to fetch appeals" });
  }
});

// @route   PUT /api/admin/moderation/appeals/:id/resolve
// @desc    Approve or reject a moderation appeal
router.put("/moderation/appeals/:id/resolve", async (req, res) => {
  const { status, adminNotes = "", restoreContent = true, decrementStrike = true } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
  }

  try {
    const appeal = await Appeal.findById(req.params.id);
    if (!appeal) {
      return res.status(404).json({ error: "Appeal not found" });
    }

    appeal.status = status;
    appeal.adminNotes = String(adminNotes).trim();
    appeal.resolvedBy = req.user.id;
    appeal.resolvedAt = new Date();
    await appeal.save();

    const appellant = await User.findById(appeal.appellant);
    const isAccountBanAppeal = appeal.itemType === "account_ban" || appeal.originalCategory === "account_ban";
    const isCommentAppeal = appeal.itemType === "comment" || !!appeal.targetComment;
    const appealType = isAccountBanAppeal ? "account_ban" : (isCommentAppeal ? "comment" : (appeal.itemType || "strike"));

    if (status === "approved") {
      // 1. Unban and/or decrement strike if requested
      if (appellant) {
        if (isAccountBanAppeal) {
          appellant.isBanned = false;
          appellant.banExpiresAt = null;
          appellant.banReason = "";
          appellant.postingRestrictedUntil = null;
          if (decrementStrike) {
            appellant.moderationStrikes = Math.max(0, (appellant.moderationStrikes || 0) - 1);
          }
        } else if (decrementStrike) {
          appellant.moderationStrikes = Math.max(0, (appellant.moderationStrikes || 1) - 1);
          if (appellant.isBanned && appellant.moderationStrikes < 3) {
            appellant.isBanned = false;
            appellant.banExpiresAt = null;
            appellant.banReason = "";
          }
        }
        if (decrementStrike || (appellant.moderationStrikes || 0) < 2) {
          appellant.postingRestrictedUntil = null;
        }
        if ((appellant.moderationStrikes || 0) === 0) {
          appellant.strikeExpiresAt = null;
        }
        await appellant.save();
      }

      // 2. Restore content if requested
      if (restoreContent) {
        if (isCommentAppeal) {
          if (appeal.targetComment) {
            await Comment.findByIdAndUpdate(appeal.targetComment, {
              isHidden: false,
              moderationReason: "",
              hiddenAt: null,
            });
            if (appeal.targetPost) {
              const remainingCount = await Comment.countDocuments({
                post: appeal.targetPost,
                isHidden: { $ne: true },
              });
              await Post.findByIdAndUpdate(appeal.targetPost, { commentCount: remainingCount });
            }
          }
        } else if (appeal.targetPost) {
          await Post.findByIdAndUpdate(appeal.targetPost, {
            isHidden: false,
            moderationReason: "",
            hiddenAt: null,
          });
        }
      }

      // 3. Log audit
      await ModerationLog.create({
        action: "appeal_approved",
        performedBy: req.user.id,
        targetUser: appeal.appellant,
        targetPost: appeal.targetPost || null,
        targetComment: appeal.targetComment || null,
        contentType: isCommentAppeal ? "comment" : (appeal.targetPost ? "post" : (isAccountBanAppeal ? "account_ban" : "unknown")),
        postTitle: appeal.postTitle || "",
        contentSnippet: appeal.contentSnippet || "",
        reason: adminNotes || (isAccountBanAppeal ? "Account ban appeal approved by administrator" : "Appeal reviewed and approved by administrator"),
        details: isAccountBanAppeal
          ? `Account unbanned. Strike decremented: ${decrementStrike}.`
          : `Strike decremented: ${decrementStrike}. Content restored: ${restoreContent}.`,
      });

      // 4. Notify user
      await createSystemNotification({
        recipientId: appeal.appellant,
        type: "report_accepted",
        message: isAccountBanAppeal
          ? "Your account ban appeal has been APPROVED by an administrator. Your suspension has been lifted."
          : (isCommentAppeal
              ? "Your comment moderation appeal has been APPROVED by an administrator. Your strike has been revoked."
              : "Your moderation appeal has been APPROVED by an administrator. Your strike has been revoked and standing updated."),
      });
    } else {
      // Rejected
      await ModerationLog.create({
        action: "appeal_rejected",
        performedBy: req.user.id,
        targetUser: appeal.appellant,
        targetPost: appeal.targetPost || null,
        targetComment: appeal.targetComment || null,
        contentType: isCommentAppeal ? "comment" : (appeal.targetPost ? "post" : (isAccountBanAppeal ? "account_ban" : "unknown")),
        postTitle: appeal.postTitle || "",
        contentSnippet: appeal.contentSnippet || "",
        reason: adminNotes || (isAccountBanAppeal ? "Account ban appeal denied by administrator" : "Appeal denied by administrator"),
        details: `Admin notes: ${adminNotes}`,
      });

      await createSystemNotification({
        recipientId: appeal.appellant,
        type: "system",
        message: isAccountBanAppeal
          ? `Your account ban appeal was reviewed and denied. Note: "${adminNotes || 'Denied following review against community guidelines.'}"`
          : (isCommentAppeal
              ? `Your comment moderation appeal was reviewed and denied. Note: "${adminNotes || 'Denied following review against community guidelines.'}"`
              : `Your moderation appeal was reviewed and denied. Note: "${adminNotes || 'Denied following review against community guidelines.'}"`),
      });
    }

    let contentTitle = appeal.postTitle || "";
    let relatedPostId = null;

    if (appeal.targetPost) {
      relatedPostId = appeal.targetPost.toString();
      if (!contentTitle) {
        const p = await Post.findById(appeal.targetPost).select("title").lean();
        if (p?.title) contentTitle = p.title;
      }
    } else if (appeal.targetComment) {
      const c = await Comment.findById(appeal.targetComment).populate("post", "title").select("body post").lean();
      if (c?.post) {
        relatedPostId = c.post._id ? c.post._id.toString() : c.post.toString();
        if (!contentTitle && c.post.title) contentTitle = c.post.title;
      }
    }

    if (appellant?.email) {
      try {
        await sendAppealDecisionMail({
          to: appellant.email,
          username: appellant.username || "Member",
          decision: status,
          appealType,
          strikeIndex: appeal.strikeIndex || 1,
          adminNotes: appeal.adminNotes || "",
          originalReason: appeal.originalReason || "",
          originalCategory: appeal.originalCategory || "",
          statement: appeal.statement || "",
          contentTitle,
          postId: relatedPostId,
          currentStrikes: appellant?.moderationStrikes ?? 0,
          isBanned: appellant?.isBanned ?? false,
        });
      } catch (mailErr) {
        console.error("[Appeal Decision Mail Error]", mailErr.message);
      }
    }

    return res.json({
      success: true,
      message: status === "approved"
        ? (isAccountBanAppeal ? "Appeal approved and account ban lifted" : "Appeal approved and strike penalty revoked")
        : "Appeal rejected",
      appeal: appeal.toJSON(),
      updatedStrikes: appellant?.moderationStrikes ?? 0,
      isBanned: appellant?.isBanned ?? false,
    });
  } catch (err) {
    console.error("[Resolve Appeal Error]", err);
    return res.status(500).json({ error: "Failed to resolve appeal" });
  }
});

export default router;
