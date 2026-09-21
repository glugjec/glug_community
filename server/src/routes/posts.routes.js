import { Router } from 'express';
import mongoose from 'mongoose';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { Vote } from '../models/Vote.js';
import { Bookmark } from '../models/Bookmark.js';
import { User } from '../models/User.js';
import { Resource } from '../models/Resource.js';
import { Event } from '../models/Event.js';
import { requireAuth, optionalAuth, requireAdmin } from '../middleware/auth.js';
import { calculateNextVoteScore } from '../utils/voteCalculator.js';
import { createNotification, createSystemNotification, notifyAllAdmins } from '../utils/notificationService.js';
import { Report } from '../models/Report.js';
import { ModerationLog } from '../models/ModerationLog.js';
import { Appeal } from '../models/Appeal.js';
import { moderateContent, applyStrikePipeline } from '../utils/contentModerator.js';

const router = Router();
const recentViews = new Map();
const serverPostsCache = new Map();

function clearServerPostsCache() {
  serverPostsCache.clear();
}

// @route   GET /api/posts
// @desc    Get list of posts with filtering, sorting, pagination, and user vote status
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const { category, tag, sort = 'hot', search, tab } = req.query;

    const filter = {};
    if (category && category !== 'All' && category !== 'all') {
      filter.category = category.toLowerCase();
    }
    if (tag) {
      filter.tags = tag;
    }
    if (search && String(search).trim()) {
      const q = String(search).trim();
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matchingUsers = await User.find({
        $or: [
          { username: { $regex: escaped, $options: 'i' } },
          { email: { $regex: escaped, $options: 'i' } },
          { name: { $regex: escaped, $options: 'i' } },
        ],
      }).select('_id').lean();
      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { body: { $regex: escaped, $options: 'i' } },
        { tags: { $regex: escaped, $options: 'i' } },
        { category: { $regex: escaped, $options: 'i' } },
        ...(userIds.length > 0 ? [{ author: { $in: userIds } }] : []),
      ];
    }

    if (tab === 'unanswered') {
      filter.commentCount = { $lte: 0 };
    } else if (tab === 'my-posts') {
      if (!req.user) {
        return res.json({
          posts: [],
          pagination: { total: 0, page, limit, totalPages: 1, hasMore: false },
        });
      }
      filter.author = req.user.id;
    } else if (tab === 'bookmarks') {
      if (!req.user) {
        return res.json({
          posts: [],
          pagination: { total: 0, page, limit, totalPages: 1, hasMore: false },
        });
      }
      const bookmarks = await Bookmark.find({ user: req.user.id }).select('post').lean();
      const bookmarkedPostIds = bookmarks.map((b) => b.post);
      filter._id = { $in: bookmarkedPostIds };
    }

    if (req.user?.role !== 'admin') {
      filter.isHidden = { $ne: true };
    }

    let sortCriteria = { isPinned: -1 };
    if (sort === 'new') {
      sortCriteria.createdAt = -1;
    } else if (sort === 'top') {
      sortCriteria.voteScore = -1;
      sortCriteria.createdAt = -1;
    } else {
      sortCriteria.voteScore = -1;
      sortCriteria.createdAt = -1;
    }

    const canCache = tab !== 'my-posts' && tab !== 'bookmarks' && !search;
    const cacheKey = canCache
      ? `${category || ''}:${tag || ''}:${tab || ''}:${sort}:${page}:${limit}`
      : null;

    let posts, total;
    const cached = cacheKey ? serverPostsCache.get(cacheKey) : null;
    if (cached && Date.now() - cached.timestamp < 15000) {
      posts = cached.posts;
      total = cached.total;
    } else {
      [posts, total] = await Promise.all([
        Post.find(filter)
          .sort(sortCriteria)
          .skip(skip)
          .limit(limit)
          .populate('author', 'username role avatar communityRole')
          .lean(),
        Post.countDocuments(filter),
      ]);
      if (canCache) {
        if (serverPostsCache.size > 150) serverPostsCache.clear();
        serverPostsCache.set(cacheKey, { posts, total, timestamp: Date.now() });
      }
    }

    let userVoteMap = new Map();
    let userBookmarkSet = new Set();
    if (req.user && posts.length > 0) {
      const postIds = posts.map((p) => p._id);
      const [userVotes, userBookmarks] = await Promise.all([
        Vote.find({
          user: req.user.id,
          post: { $in: postIds },
        }).lean(),
        Bookmark.find({
          user: req.user.id,
          post: { $in: postIds },
        }).lean(),
      ]);

      userVotes.forEach((v) => {
        userVoteMap.set(v.post.toString(), v.value);
      });
      userBookmarks.forEach((b) => {
        userBookmarkSet.add(b.post.toString());
      });
    }

    const formattedPosts = posts.map((p) => ({
      id: p._id.toString(),
      _id: p._id.toString(),
      title: p.title,
      body: p.body,
      category: p.category,
      tags: p.tags || [],
      voteScore: Math.max(0, p.voteScore || 0),
      commentCount: p.commentCount || 0,
      views: p.views || 0,
      isPinned: !!p.isPinned,
      isLocked: !!p.isLocked,
      isHidden: !!p.isHidden,
      moderationReason: req.user?.role === 'admin' ? p.moderationReason : undefined,
      moderationCategory: req.user?.role === 'admin' ? p.moderationCategory : undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      author: p.author
        ? {
            id: p.author._id.toString(),
            username: p.author.username,
            role: p.author.role,
            avatar: p.author.avatar,
            communityRole: p.author.communityRole || {},
          }
        : { username: 'deleted', role: 'student', communityRole: {} },
      userVote: userVoteMap.get(p._id.toString()) || 0,
      isBookmarked: userBookmarkSet.has(p._id.toString()),
    }));

    return res.json({
      posts: formattedPosts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: page * limit < total,
      },
    });
  } catch (err) {
    console.error('[Get Posts Error]', err);
    return res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.get('/feed', optionalAuth, async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const seed = parseInt(req.query.seed) || Date.now();

    const seededRandom = (s) => {
      let x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    const shuffle = (arr, s) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(s + i) * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    let boostedCategories = [];
    let boostedTags = [];

    if (req.user) {
      const userVotes = await Vote.find({ user: req.user.id, value: 1 })
        .sort({ createdAt: -1 })
        .limit(50)
        .select('post')
        .lean();

      const userBookmarks = await Bookmark.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .limit(30)
        .select('post')
        .lean();

      const interactedIds = [
        ...userVotes.map((v) => v.post),
        ...userBookmarks.map((b) => b.post),
      ];

      if (interactedIds.length > 0) {
        const interactedPosts = await Post.find({ _id: { $in: interactedIds } })
          .select('category tags')
          .lean();

        const catFreq = {};
        const tagFreq = {};
        interactedPosts.forEach((p) => {
          if (p.category) catFreq[p.category] = (catFreq[p.category] || 0) + 1;
          if (p.tags) p.tags.forEach((t) => { tagFreq[t] = (tagFreq[t] || 0) + 1; });
        });

        boostedCategories = Object.entries(catFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([cat]) => cat);

        boostedTags = Object.entries(tagFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag]) => tag);
      }
    }

    const poolSize = Math.min(Math.max(limit * page * 3, 100), 300);
    const feedFilter = req.user?.role === 'admin' ? {} : { isHidden: { $ne: true } };

    const [recentPosts, topPosts] = await Promise.all([
      Post.find(feedFilter)
        .sort({ createdAt: -1 })
        .limit(poolSize)
        .populate('author', 'username role avatar communityRole')
        .lean(),
      Post.find(feedFilter)
        .sort({ voteScore: -1, createdAt: -1 })
        .limit(poolSize)
        .populate('author', 'username role avatar communityRole')
        .lean(),
    ]);

    const postMap = new Map();
    [...recentPosts, ...topPosts].forEach((p) => {
      postMap.set(p._id.toString(), p);
    });

    let allPosts = Array.from(postMap.values());

    if (req.user && (boostedCategories.length > 0 || boostedTags.length > 0)) {
      allPosts.forEach((p) => {
        let boost = 0;
        if (boostedCategories.includes(p.category)) boost += 2;
        if (p.tags && p.tags.some((t) => boostedTags.includes(t))) boost += 1;
        p._feedBoost = boost;
      });

      const boosted = allPosts.filter((p) => p._feedBoost > 0);
      const rest = allPosts.filter((p) => !p._feedBoost);

      const shuffledBoosted = shuffle(boosted, seed);
      const shuffledRest = shuffle(rest, seed + 1);

      const pinned = shuffledBoosted.filter((p) => p.isPinned);
      const unpinnedBoosted = shuffledBoosted.filter((p) => !p.isPinned);

      allPosts = [...pinned, ...unpinnedBoosted, ...shuffledRest];
    } else {
      const pinned = allPosts.filter((p) => p.isPinned);
      const unpinned = allPosts.filter((p) => !p.isPinned);
      allPosts = [...pinned, ...shuffle(unpinned, seed)];
    }

    const skip = (page - 1) * limit;
    const feedPosts = allPosts.slice(skip, skip + limit);

    let userVoteMap = new Map();
    let userBookmarkSet = new Set();
    if (req.user && feedPosts.length > 0) {
      const postIds = feedPosts.map((p) => p._id);
      const [uv, ub] = await Promise.all([
        Vote.find({ user: req.user.id, post: { $in: postIds } }).lean(),
        Bookmark.find({ user: req.user.id, post: { $in: postIds } }).lean(),
      ]);
      uv.forEach((v) => userVoteMap.set(v.post.toString(), v.value));
      ub.forEach((b) => userBookmarkSet.add(b.post.toString()));
    }

    const formatted = feedPosts.map((p) => {
      const { _feedBoost, ...rest } = p;
      return {
        id: rest._id.toString(),
        _id: rest._id.toString(),
        title: rest.title,
        body: rest.body,
        category: rest.category,
        tags: rest.tags || [],
        voteScore: Math.max(0, rest.voteScore || 0),
        commentCount: rest.commentCount || 0,
        views: rest.views || 0,
        isPinned: !!rest.isPinned,
        isLocked: !!rest.isLocked,
        isHidden: !!rest.isHidden,
        moderationReason: req.user?.role === 'admin' ? rest.moderationReason : undefined,
        moderationCategory: req.user?.role === 'admin' ? rest.moderationCategory : undefined,
        createdAt: rest.createdAt,
        updatedAt: rest.updatedAt,
        author: rest.author
          ? {
              id: rest.author._id.toString(),
              username: rest.author.username,
              role: rest.author.role,
              avatar: rest.author.avatar,
              communityRole: rest.author.communityRole || {},
            }
          : { username: 'deleted', role: 'student', communityRole: {} },
        userVote: userVoteMap.get(rest._id.toString()) || 0,
        isBookmarked: userBookmarkSet.has(rest._id.toString()),
      };
    });

    return res.json({
      posts: formatted,
      seed,
      pagination: {
        total: allPosts.length,
        page,
        limit,
        totalPages: Math.ceil(allPosts.length / limit) || 1,
        hasMore: skip + feedPosts.length < allPosts.length,
      },
    });
  } catch (err) {
    console.error('[Feed Error]', err);
    return res.status(500).json({ error: 'Failed to load feed' });
  }
});

router.get('/meta/stats', async (req, res) => {
  try {
    const [totalMembers, totalPosts, categoryCounts, categoryMembers, totalResources, totalEvents] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Post.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      Post.aggregate([
        { $group: { _id: { category: '$category', author: '$author' } } },
        { $group: { _id: '$_id.category', members: { $sum: 1 } } },
      ]),
      Resource.countDocuments(),
      Event.countDocuments({ status: 'published' }),
    ]);

    const validCategories = [
      'general',
      'help',
      'linux',
      'installation',
      'command-line',
      'programming',
      'open-source',
      'tools-apps',
      'projects',
      'events',
      'resources',
      'careers',
    ];

    const categories = {};
    validCategories.forEach((cat) => {
      categories[cat] = { discussions: 0, members: 0 };
    });

    categoryCounts.forEach((c) => {
      if (c._id) {
        if (!categories[c._id]) {
          categories[c._id] = { discussions: 0, members: 0 };
        }
        categories[c._id].discussions = c.count;
      }
    });

    categoryMembers.forEach((m) => {
      if (m._id) {
        if (!categories[m._id]) {
          categories[m._id] = { discussions: 0, members: 0 };
        }
        categories[m._id].members = m.members;
      }
    });

    return res.json({
      members: totalMembers,
      discussions: totalPosts,
      resources: totalResources,
      events: totalEvents,
      categories,
    });
  } catch (err) {
    console.error('[Stats Error]', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// @route   GET /api/posts/:id
// @desc    Get single post detail with comments and user vote
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username role avatar bio communityRole')
      .lean();

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isAuthor = req.user && String(post.author?._id || post.author) === String(req.user.id);
    const isAdmin = req.user?.role === 'admin';

    if (post.isHidden && !isAdmin && !isAuthor) {
      return res.status(404).json({ error: 'Post not found or is under moderation review' });
    }

    const commentFilter = { post: post._id };
    if (!isAdmin) {
      if (req.user) {
        commentFilter.$or = [
          { isHidden: { $ne: true } },
          { author: req.user.id },
        ];
      } else {
        commentFilter.isHidden = { $ne: true };
      }
    }

    const comments = await Comment.find(commentFilter)
      .sort({ createdAt: 1 })
      .populate('author', 'username role avatar communityRole')
      .lean();

    let userVote = 0;
    let isBookmarked = false;
    if (req.user) {
      const [vote, bookmark] = await Promise.all([
        Vote.findOne({ user: req.user.id, post: post._id }).lean(),
        Bookmark.findOne({ user: req.user.id, post: post._id }).lean(),
      ]);
      if (vote) userVote = vote.value;
      if (bookmark) isBookmarked = true;
    }

    const viewerKey = `${req.user?.id || req.ip || 'anon'}:${req.params.id}`;
    const now = Date.now();
    const lastView = recentViews.get(viewerKey) || 0;
    let currentViews = post.views || 0;

    if (now - lastView > 30000) {
      recentViews.set(viewerKey, now);
      await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
      currentViews += 1;

      if (recentViews.size > 2000) {
        const cutoff = now - 60000;
        for (const [k, time] of recentViews.entries()) {
          if (time < cutoff) recentViews.delete(k);
        }
      }
    }

    const formattedPost = {
      id: post._id.toString(),
      _id: post._id.toString(),
      title: post.title,
      body: post.body,
      category: post.category,
      tags: post.tags || [],
      voteScore: Math.max(0, post.voteScore || 0),
      commentCount: post.commentCount || 0,
      views: currentViews,
      isPinned: !!post.isPinned,
      isLocked: !!post.isLocked,
      isHidden: !!post.isHidden,
      moderationReason: req.user?.role === 'admin' ? post.moderationReason : undefined,
      moderationCategory: req.user?.role === 'admin' ? post.moderationCategory : undefined,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author
        ? {
            id: post.author._id.toString(),
            username: post.author.username,
            role: post.author.role,
            avatar: post.author.avatar,
            bio: post.author.bio,
            communityRole: post.author.communityRole || {},
          }
        : { username: 'deleted', role: 'student', communityRole: {} },
      userVote,
      isBookmarked,
    };

    const formattedComments = comments.map((c) => {
      let commentUserVote = 0;
      if (req.user && Array.isArray(c.votes) && c.votes.length > 0) {
        const found = c.votes.find((v) => v.user?.toString() === req.user.id);
        if (found) commentUserVote = found.value;
      }
      return {
        id: c._id.toString(),
        _id: c._id.toString(),
        body: c.body,
        parentComment: c.parentComment ? c.parentComment.toString() : null,
        createdAt: c.createdAt,
        voteScore: Math.max(0, c.voteScore || 0),
        userVote: commentUserVote,
        isHidden: !!c.isHidden,
        moderationReason: req.user?.role === 'admin' ? c.moderationReason : undefined,
        moderationCategory: req.user?.role === 'admin' ? c.moderationCategory : undefined,
        author: c.author
          ? {
              id: c.author._id.toString(),
              username: c.author.username,
              role: c.author.role,
              avatar: c.author.avatar,
              communityRole: c.author.communityRole || {},
            }
          : { username: 'deleted', role: 'student', communityRole: {} },
      };
    });

    return res.json({
      post: formattedPost,
      comments: formattedComments,
    });
  } catch (err) {
    console.error('[Get Post Detail Error]', err);
    return res.status(500).json({ error: 'Failed to fetch post details' });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
router.post('/', requireAuth, async (req, res) => {
  const { title, body, category = 'general', tags = [] } = req.body;

  if (!title?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  const validCategories = [
    'general',
    'help',
    'linux',
    'installation',
    'command-line',
    'programming',
    'open-source',
    'tools-apps',
    'projects',
    'events',
    'resources',
    'careers',
  ];
  const safeCategory = validCategories.includes(category?.toLowerCase())
    ? category.toLowerCase()
    : 'general';

  const cleanTags = Array.isArray(tags)
    ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 5)
    : [];

  if (req.user.postingRestrictedUntil && new Date(req.user.postingRestrictedUntil) > new Date()) {
    const hoursLeft = Math.ceil((new Date(req.user.postingRestrictedUntil) - Date.now()) / (1000 * 60 * 60));
    return res.status(403).json({
      error: `Your posting privileges are temporarily restricted due to a moderation strike. Restriction lifts in ${hoursLeft} hour${hoursLeft === 1 ? '' : 's'}.`,
      postingRestrictedUntil: req.user.postingRestrictedUntil,
    });
  }

  try {
    let isHidden = false;
    let moderationReason = '';
    let moderationCategory = '';
    let hiddenAt = null;
    let pipelineResult = null;

    if (req.user.role !== 'admin') {
      const modResult = await moderateContent(`${title.trim()}\n\n${body.trim()}`);
      if (modResult.verdict === 'VIOLATION') {
        isHidden = true;
        moderationReason = modResult.reason || 'Violates community guidelines';
        moderationCategory = modResult.category || 'abuse';
        hiddenAt = new Date();
      }
    }

    const post = await Post.create({
      author: req.user.id,
      title: title.trim(),
      body: body.trim(),
      category: safeCategory,
      tags: cleanTags,
      isHidden,
      moderationReason,
      moderationCategory,
      hiddenAt,
    });

    if (isHidden) {
      pipelineResult = await applyStrikePipeline({
        userId: req.user.id,
        reason: moderationReason,
        category: moderationCategory,
        actionSource: 'auto_flag',
        targetPost: post,
      });
    }

    const populated = await Post.findById(post._id).populate('author', 'username role avatar communityRole');
    clearServerPostsCache();

    const resJson = populated.toJSON();
    if (isHidden && pipelineResult) {
      resJson.moderation = {
        flagged: true,
        reason: moderationReason,
        category: moderationCategory,
        action: pipelineResult.action,
        strikes: pipelineResult.strikes,
      };
    }
    return res.status(201).json(resJson);
  } catch (err) {
    console.error('[Create Post Error]', err);
    return res.status(500).json({ error: 'Failed to create post' });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post (author or admin)
router.put('/:id', requireAuth, async (req, res) => {
  const { title, body, category, tags } = req.body;

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to edit this post' });
    }

    let isHidden = post.isHidden;
    let moderationReason = post.moderationReason;
    let moderationCategory = post.moderationCategory;
    let hiddenAt = post.hiddenAt;
    let pipelineResult = null;

    const newTitle = title?.trim() || post.title;
    const newBody = body?.trim() || post.body;

    if (req.user.role !== 'admin' && (title?.trim() || body?.trim())) {
      const modResult = await moderateContent(`${newTitle}\n\n${newBody}`);
      if (modResult.verdict === 'VIOLATION') {
        isHidden = true;
        moderationReason = modResult.reason || 'Violates community guidelines';
        moderationCategory = modResult.category || 'abuse';
        hiddenAt = new Date();

        post.isHidden = true;
        post.moderationReason = moderationReason;
        post.moderationCategory = moderationCategory;
        post.hiddenAt = hiddenAt;

        pipelineResult = await applyStrikePipeline({
          userId: req.user.id,
          reason: moderationReason,
          category: moderationCategory,
          actionSource: 'auto_flag',
          targetPost: post,
        });
      }
    }

    if (title?.trim()) post.title = title.trim();
    if (body?.trim()) post.body = body.trim();
    if (category) post.category = category.toLowerCase();
    if (Array.isArray(tags)) {
      post.tags = tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 5);
    }

    await post.save();
    clearServerPostsCache();
    const updated = await Post.findById(post._id).populate('author', 'username role avatar communityRole');
    return res.json(updated.toJSON());
    const resJson = updated.toJSON();
    if (isHidden && pipelineResult) {
      resJson.moderation = {
        flagged: true,
        reason: moderationReason,
        category: moderationCategory,
        action: pipelineResult.action,
        strikes: pipelineResult.strikes,
      };
    }
    return res.json(resJson);
  } catch (err) {
    console.error('[Update Post Error]', err);
    return res.status(500).json({ error: 'Failed to update post' });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post (author or admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }

    await Promise.all([
      Post.findByIdAndDelete(post._id),
      Comment.deleteMany({ post: post._id }),
      Vote.deleteMany({ post: post._id }),
      Bookmark.deleteMany({ post: post._id }),
    ]);

    clearServerPostsCache();
    return res.json({ message: 'Post and associated comments deleted successfully' });
  } catch (err) {
    console.error('[Delete Post Error]', err);
    return res.status(500).json({ error: 'Failed to delete post' });
  }
});

router.post('/:id/bookmark', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existing = await Bookmark.findOne({
      user: req.user.id,
      post: post._id,
    });

    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id });
      return res.json({ bookmarked: false, message: 'Bookmark removed' });
    } else {
      await Bookmark.create({
        user: req.user.id,
        post: post._id,
      });
      return res.json({ bookmarked: true, message: 'Saved to bookmarks' });
    }
  } catch (err) {
    console.error('[Bookmark Error]', err);
    return res.status(500).json({ error: 'Failed to update bookmark' });
  }
});

router.post('/:id/vote', requireAuth, async (req, res) => {
  const { value } = req.body;
  const numericValue = Number(value);

  if (![1, -1, 0].includes(numericValue)) {
    return res.status(400).json({ error: 'Vote value must be 1, -1, or 0' });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingVote = await Vote.findOne({
      user: req.user.id,
      post: post._id,
    });

    let targetVote = numericValue;
    if (numericValue === 0 || (existingVote && existingVote.value === numericValue)) {
      targetVote = 0;
    }

    const votes = await Vote.find({ post: post._id });
    const upvotes = votes.filter((v) => v.value === 1).length;
    const downvotes = votes.filter((v) => v.value === -1).length;
    const curScore = Math.max(0, upvotes - downvotes);

    if (targetVote === -1) {
      if (!existingVote || existingVote.value === 0) {
        if (curScore <= 0) {
          return res.status(400).json({
            error: 'Cannot downvote when score is 0',
            voteScore: 0,
            userVote: 0,
          });
        }
      } else if (existingVote.value === 1) {
        if (curScore <= 1) {
          targetVote = 0;
        }
      }
    }

    let newUserVote = 0;

    if (targetVote === 0) {
      if (existingVote) {
        await Vote.deleteOne({ _id: existingVote._id });
      }
      newUserVote = 0;
    } else if (existingVote) {
      existingVote.value = targetVote;
      await existingVote.save();
      newUserVote = targetVote;
    } else {
      await Vote.create({
        user: req.user.id,
        post: post._id,
        value: targetVote,
      });
      newUserVote = targetVote;
    }

    const updatedVotes = await Vote.find({ post: post._id });
    const newUp = updatedVotes.filter((v) => v.value === 1).length;
    const newDown = updatedVotes.filter((v) => v.value === -1).length;
    const trueScore = Math.max(0, newUp - newDown);

    post.voteScore = trueScore;
    await post.save();
    clearServerPostsCache();

    return res.json({
      voteScore: trueScore,
      userVote: newUserVote,
    });
  } catch (err) {
    console.error('[Vote Post Error]', err);
    return res.status(500).json({ error: 'Failed to register vote' });
  }
});

// @route   POST /api/posts/:id/comments
// @desc    Add a comment (supports threaded parentComment)
router.post('/:id/comments', requireAuth, async (req, res) => {
  const { body, parentComment } = req.body;

  if (!body?.trim()) {
    return res.status(400).json({ error: 'Comment body is required' });
  }

  if (req.user.postingRestrictedUntil && new Date(req.user.postingRestrictedUntil) > new Date()) {
    const hoursLeft = Math.ceil((new Date(req.user.postingRestrictedUntil) - Date.now()) / (1000 * 60 * 60));
    return res.status(403).json({
      error: `Your commenting privileges are temporarily restricted due to a moderation strike. Restriction lifts in ${hoursLeft} hour${hoursLeft === 1 ? '' : 's'}.`,
      postingRestrictedUntil: req.user.postingRestrictedUntil,
    });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.isLocked && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'This discussion has been locked by an administrator' });
    }

    let parent = null;
    let parentId = null;
    if (parentComment && mongoose.Types.ObjectId.isValid(parentComment)) {
      parent = await Comment.findOne({ _id: parentComment, post: post._id });
      if (parent) {
        parentId = parent._id;
      }
    }

    let isHidden = false;
    let moderationReason = '';
    let moderationCategory = '';
    let hiddenAt = null;
    let pipelineResult = null;

    if (req.user.role !== 'admin') {
      const modResult = await moderateContent(body.trim());
      if (modResult.verdict === 'VIOLATION') {
        isHidden = true;
        moderationReason = modResult.reason || 'Violates community guidelines';
        moderationCategory = modResult.category || 'abuse';
        hiddenAt = new Date();
      }
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user.id,
      body: body.trim(),
      parentComment: parentId,
      isHidden,
      moderationReason,
      moderationCategory,
      hiddenAt,
    });

    if (isHidden) {
      pipelineResult = await applyStrikePipeline({
        userId: req.user.id,
        reason: moderationReason,
        category: moderationCategory,
        actionSource: 'auto_flag',
        targetComment: comment._id,
        targetPost: post._id,
      });
    } else {
      post.commentCount = (post.commentCount || 0) + 1;
      await post.save();

      if (parent && parent.author) {
        createNotification({
          senderId: req.user.id,
          recipientId: parent.author,
          type: 'reply',
          postId: post._id,
          commentId: comment._id,
          commentBody: comment.body,
        });

        if (
          post.author &&
          post.author.toString() !== req.user.id &&
          post.author.toString() !== parent.author.toString()
        ) {
          createNotification({
            senderId: req.user.id,
            recipientId: post.author,
            type: 'comment',
            postId: post._id,
            commentId: comment._id,
            commentBody: comment.body,
          });
        }
      } else if (post.author && post.author.toString() !== req.user.id) {
        createNotification({
          senderId: req.user.id,
          recipientId: post.author,
          type: 'comment',
          postId: post._id,
          commentId: comment._id,
          commentBody: comment.body,
        });
      }
    }

    const populated = await comment.populate(
      'author',
      'username role avatar communityRole'
    );
    const doc = populated || comment;

    clearServerPostsCache();

    const commentJson = {
      id: doc._id.toString(),
      _id: doc._id.toString(),
      body: doc.body,
      parentComment: doc.parentComment ? doc.parentComment.toString() : null,
      createdAt: doc.createdAt,
      isHidden: !!doc.isHidden,
      author: doc.author && typeof doc.author === 'object' && doc.author._id
        ? {
            id: doc.author._id.toString(),
            username: doc.author.username,
            role: doc.author.role,
            avatar: doc.author.avatar,
            communityRole: doc.author.communityRole || {},
          }
        : { username: req.user.username || 'Member', role: req.user.role || 'student', communityRole: {} },
    };

    if (isHidden && pipelineResult) {
      commentJson.moderation = {
        flagged: true,
        reason: moderationReason,
        category: moderationCategory,
        action: pipelineResult.action,
        strikes: pipelineResult.strikes,
      };
    }

    return res.status(201).json(commentJson);
  } catch (err) {
    console.error('[Add Comment Error]', err);
    return res.status(500).json({ error: 'Failed to add comment' });
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

router.delete('/:id/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await Comment.findOne({
      _id: req.params.commentId,
      post: post._id,
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const isPostAuthor = post.author.toString() === req.user.id;
    const isCommentAuthor = comment.author.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isPostAuthor && !isCommentAuthor && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    const allIds = await getAllDescendantCommentIds(comment._id);
    const commentSnippet = String(comment.body || '').replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim().slice(0, 150);
    const postTitle = post.title || '';

    await Promise.all([
      Comment.deleteMany({ _id: { $in: allIds } }),
      ModerationLog.updateMany(
        { targetComment: { $in: allIds } },
        {
          $set: {
            contentType: 'comment',
            contentSnippet: commentSnippet,
            postTitle: postTitle,
            targetPost: post._id,
          },
        }
      ),
      Appeal.updateMany(
        { targetComment: { $in: allIds } },
        {
          $set: {
            itemType: 'comment',
            contentSnippet: commentSnippet,
            postTitle: postTitle,
            targetPost: post._id,
          },
        }
      ),
    ]);

    const remainingCount = await Comment.countDocuments({ post: post._id });
    await Post.findByIdAndUpdate(post._id, { commentCount: remainingCount });
    clearServerPostsCache();

    return res.json({ message: 'Comment removed successfully', deletedCount: allIds.length, remainingCount });
  } catch (err) {
    console.error('[Delete Comment Error]', err);
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// @route   PUT /api/posts/:id/pin
// @desc    Pin / unpin a post (admin only)
router.put('/:id/pin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.isPinned = !post.isPinned;
    await post.save();
    clearServerPostsCache();

    return res.json({ isPinned: post.isPinned, message: post.isPinned ? 'Post pinned' : 'Post unpinned' });
  } catch (err) {
    console.error('[Pin Post Error]', err);
    return res.status(500).json({ error: 'Failed to update pin status' });
  }
});

router.put('/:id/lock', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isAuthor = post.author && post.author.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'Only the author or an administrator can lock replies' });
    }

    post.isLocked = !post.isLocked;
    await post.save();
    clearServerPostsCache();

    return res.json({
      success: true,
      isLocked: post.isLocked,
      message: post.isLocked ? 'Replies locked' : 'Replies unlocked'
    });
  } catch (err) {
    console.error('[Lock Post Error]', err);
    return res.status(500).json({ error: 'Failed to toggle lock status' });
  }
});

const handleVoteComment = async (req, res) => {
  const { value } = req.body;
  const numericValue = Number(value);

  if (![1, -1, 0].includes(numericValue)) {
    return res.status(400).json({ error: 'Vote value must be 1, -1, or 0' });
  }

  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (!Array.isArray(comment.votes)) {
      comment.votes = [];
    }

    const voteIdx = comment.votes.findIndex((v) => v.user.toString() === req.user.id);
    const existingVote = voteIdx !== -1 ? comment.votes[voteIdx] : null;

    let targetVote = numericValue;
    if (numericValue === 0 || (existingVote && existingVote.value === numericValue)) {
      targetVote = 0;
    }

    const upvotes = comment.votes.filter((v) => v.value === 1).length;
    const downvotes = comment.votes.filter((v) => v.value === -1).length;
    const curScore = Math.max(0, upvotes - downvotes);

    if (targetVote === -1) {
      if (!existingVote || existingVote.value === 0) {
        if (curScore <= 0) {
          return res.status(400).json({
            error: 'Cannot downvote when score is 0',
            voteScore: 0,
            userVote: 0,
          });
        }
      } else if (existingVote.value === 1) {
        if (curScore <= 1) {
          targetVote = 0;
        }
      }
    }

    let newUserVote = 0;

    if (targetVote === 0) {
      if (existingVote) {
        comment.votes.splice(voteIdx, 1);
      }
      newUserVote = 0;
    } else if (existingVote) {
      existingVote.value = targetVote;
      newUserVote = targetVote;
    } else {
      comment.votes.push({ user: req.user.id, value: targetVote });
      newUserVote = targetVote;
    }

    const newUp = comment.votes.filter((v) => v.value === 1).length;
    const newDown = comment.votes.filter((v) => v.value === -1).length;
    const trueScore = Math.max(0, newUp - newDown);

    comment.voteScore = trueScore;
    await comment.save();

    return res.json({
      voteScore: trueScore,
      userVote: newUserVote,
    });
  } catch (err) {
    console.error('[Vote Comment Error]', err);
    return res.status(500).json({ error: 'Failed to register comment vote' });
  }
};

router.post('/:id/comments/:commentId/vote', requireAuth, handleVoteComment);
router.post('/comments/:commentId/vote', requireAuth, handleVoteComment);

// @route   POST /api/posts/:id/report
// @desc    Report a post (triggers AI check)
router.post('/:id/report', requireAuth, async (req, res) => {
  const { reason = '' } = req.body;

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() === req.user.id) {
      return res.status(400).json({ error: 'You cannot report your own post' });
    }

    // Check duplicate report
    const existing = await Report.findOne({
      reporter: req.user.id,
      targetPost: post._id,
    });
    if (existing) {
      return res.status(400).json({ error: 'You have already reported this post' });
    }

    // AI Check
    const modResult = await moderateContent(`${post.title}\n\n${post.body}`);
    const isViolation = modResult.verdict === 'VIOLATION';

    const report = await Report.create({
      reporter: req.user.id,
      contentType: 'post',
      targetPost: post._id,
      targetAuthor: post.author,
      userReason: String(reason).trim().slice(0, 500),
      status: isViolation ? 'confirmed' : 'dismissed',
      aiVerdict: modResult.verdict,
      aiReason: modResult.reason || '',
      aiCategory: modResult.category || '',
      resolvedAt: new Date(),
    });

    if (isViolation) {
      post.isHidden = true;
      post.moderationReason = modResult.reason || 'Reported and flagged by AI';
      post.moderationCategory = modResult.category || 'abuse';
      post.hiddenAt = new Date();
      await post.save();
      clearServerPostsCache();

      await applyStrikePipeline({
        userId: post.author,
        reason: post.moderationReason,
        category: post.moderationCategory,
        actionSource: 'report_flag',
        targetPost: post,
        performedBy: req.user.id,
      });

      await createSystemNotification({
        recipientId: req.user.id,
        type: "report_accepted",
        postId: post._id,
        message: `Thank you for helping keep our community safe. Your report regarding a post was reviewed and accepted.`,
      });

      await createSystemNotification({
        recipientId: post.author,
        type: "report_accepted",
        postId: post._id,
        message: `A report on your post "${post.title}" was confirmed for violating community guidelines. The post has been hidden.`,
      });
    }

    const reporter = await User.findById(req.user.id).select("username").lean();
    const reporterName = reporter?.username || req.user.username || "A member";
    const truncTitle = post.title && post.title.length > 60 ? post.title.slice(0, 60) + "..." : post.title;
    notifyAllAdmins({
      message: `${reporterName} reported a post "${truncTitle}" - ${isViolation ? 'AI confirmed violation, content hidden' : 'AI found safe'}.`,
      senderId: req.user.id,
      postId: post._id,
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      reportId: report._id,
      status: report.status,
      aiVerdict: modResult.verdict,
      actionTaken: isViolation ? 'content_hidden' : 'reviewed_safe',
      message: isViolation
        ? 'Report confirmed by automated moderation. The post has been hidden.'
        : 'Report reviewed by automated moderation and found safe with guidelines.',
    });
  } catch (err) {
    console.error('[Report Post Error]', err);
    return res.status(500).json({ error: 'Failed to submit post report' });
  }
});

// @route   POST /api/posts/:id/comments/:commentId/report
// @desc    Report a comment (triggers AI check)
router.post('/:id/comments/:commentId/report', requireAuth, async (req, res) => {
  const { reason = '' } = req.body;

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await Comment.findOne({
      _id: req.params.commentId,
      post: post._id,
    });
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.author.toString() === req.user.id) {
      return res.status(400).json({ error: 'You cannot report your own comment' });
    }

    // Check duplicate report
    const existing = await Report.findOne({
      reporter: req.user.id,
      targetComment: comment._id,
    });
    if (existing) {
      return res.status(400).json({ error: 'You have already reported this comment' });
    }

    // AI Check
    const modResult = await moderateContent(comment.body);
    const isViolation = modResult.verdict === 'VIOLATION';

    const report = await Report.create({
      reporter: req.user.id,
      contentType: 'comment',
      targetPost: post._id,
      targetComment: comment._id,
      targetAuthor: comment.author,
      userReason: String(reason).trim().slice(0, 500),
      status: isViolation ? 'confirmed' : 'dismissed',
      aiVerdict: modResult.verdict,
      aiReason: modResult.reason || '',
      aiCategory: modResult.category || '',
      resolvedAt: new Date(),
    });

    if (isViolation) {
      comment.isHidden = true;
      comment.moderationReason = modResult.reason || 'Reported and flagged by AI';
      comment.moderationCategory = modResult.category || 'abuse';
      comment.hiddenAt = new Date();
      await comment.save();

      // Decrement post comment count for visible comments
      const remainingCount = await Comment.countDocuments({ post: post._id, isHidden: { $ne: true } });
      post.commentCount = remainingCount;
      await post.save();
      clearServerPostsCache();

      await applyStrikePipeline({
        userId: comment.author,
        reason: comment.moderationReason,
        category: comment.moderationCategory,
        actionSource: 'report_flag',
        targetComment: comment,
        targetPost: post,
        performedBy: req.user.id,
      });

      await createSystemNotification({
        recipientId: req.user.id,
        type: "report_accepted",
        postId: post._id,
        commentId: comment._id,
        message: `Thank you for helping keep our community safe. Your report regarding a comment was reviewed and accepted.`,
      });

      await createSystemNotification({
        recipientId: comment.author,
        type: "report_accepted",
        postId: post._id,
        commentId: comment._id,
        message: `A report on your comment was confirmed for violating community guidelines. The comment has been hidden.`,
      });
    }

    const cReporter = await User.findById(req.user.id).select("username").lean();
    const cReporterName = cReporter?.username || req.user.username || "A member";
    const cTruncTitle = post.title && post.title.length > 60 ? post.title.slice(0, 60) + "..." : post.title;
    notifyAllAdmins({
      message: `${cReporterName} reported a comment on "${cTruncTitle}" - ${isViolation ? 'AI confirmed violation, comment hidden' : 'AI found safe'}.`,
      senderId: req.user.id,
      postId: post._id,
      commentId: comment._id,
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      reportId: report._id,
      status: report.status,
      aiVerdict: modResult.verdict,
      actionTaken: isViolation ? 'content_hidden' : 'reviewed_safe',
      message: isViolation
        ? 'Report confirmed by automated moderation. The comment has been hidden.'
        : 'Report reviewed by automated moderation and found safe with guidelines.',
    });
  } catch (err) {
    console.error('[Report Comment Error]', err);
    return res.status(500).json({ error: 'Failed to submit comment report' });
  }
});

export default router;

