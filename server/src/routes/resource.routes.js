import { Router } from "express";
import mongoose from "mongoose";
import { Resource } from "../models/Resource.js";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth.js";

const router = Router();

const CATEGORY_DEFINITIONS = [
  { id: "cs-intro", label: "CS Introduction" },
  { id: "algorithms-dsa", label: "Algorithms & DSA" },
  { id: "systems-arch", label: "Systems & Architecture" },
  { id: "operating-systems", label: "Operating Systems" },
  { id: "linux-basics", label: "Linux Basics" },
  { id: "linux-sysadmin", label: "Sysadmin & DevOps" },
  { id: "git-vcs", label: "Git & VCS" },
  { id: "open-source", label: "Open Source & FOSS" },
  { id: "dev-tools", label: "Developer Tools" },
  { id: "systems-c-prog", label: "C & Systems Programming" },
  { id: "web-dev", label: "Web Development" },
  { id: "security-crypto", label: "Security & Networks" },
];

function formatResource(r, currentUserId = null) {
  const userIdStr = currentUserId ? String(currentUserId) : null;
  const isBookmarked =
    userIdStr && Array.isArray(r.bookmarks)
      ? r.bookmarks.some((b) => String(b) === userIdStr)
      : false;

  return {
    id: r._id.toString(),
    title: r.title,
    slug: r.slug || "",
    description: r.description,
    details: r.details || "",
    category: r.category || "cs-intro",
    difficulty: r.difficulty || "all-levels",
    items: Array.isArray(r.items) ? r.items : [],
    links: Array.isArray(r.links) ? r.links : [],
    files: Array.isArray(r.files) ? r.files : [],
    isFeatured: Boolean(r.isFeatured),
    order: typeof r.order === "number" ? r.order : 0,
    viewsCount: r.viewsCount || 0,
    downloadCount: r.downloadCount || 0,
    bookmarksCount: Array.isArray(r.bookmarks) ? r.bookmarks.length : 0,
    isBookmarked,
    author: r.createdBy
      ? {
          id: r.createdBy._id?.toString() || r.createdBy.id?.toString(),
          username: r.createdBy.username,
          name: r.createdBy.name,
          avatar: r.createdBy.avatar,
        }
      : null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

router.get("/categories", async (_req, res) => {
  try {
    const counts = await Resource.aggregate([
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
          fileCount: { $sum: { $size: { $ifNull: ["$files", []] } } },
        },
      },
    ]);

    const countMap = {};
    for (const c of counts) {
      if (c._id) {
        countMap[c._id] = {
          total: c.total,
          fileCount: c.fileCount,
        };
      }
    }

    const categories = CATEGORY_DEFINITIONS.map((def) => ({
      ...def,
      count: countMap[def.id]?.total || 0,
      fileCount: countMap[def.id]?.fileCount || 0,
    }));

    return res.json(categories);
  } catch (err) {
    console.error("[Get Resource Categories Error]", err);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/", optionalAuth, async (req, res) => {
  try {
    const {
      category,
      difficulty,
      search,
      hasFiles,
      isFeatured,
      sort = "order",
      limit,
      page,
    } = req.query;

    const query = {};

    if (category && category !== "all") {
      query.category = category;
    }

    if (difficulty && difficulty !== "all") {
      query.difficulty = difficulty;
    }

    if (hasFiles === "true" || hasFiles === "1") {
      query["files.0"] = { $exists: true };
    }

    if (isFeatured === "true" || isFeatured === "1") {
      query.isFeatured = true;
    }

    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, "i");
      query.$or = [
        { title: regex },
        { description: regex },
        { details: regex },
        { items: regex },
        { "files.name": regex },
      ];
    }

    let sortObj = { order: 1, createdAt: -1 };
    if (sort === "newest") {
      sortObj = { createdAt: -1 };
    } else if (sort === "downloads") {
      sortObj = { downloadCount: -1, createdAt: -1 };
    } else if (sort === "views") {
      sortObj = { viewsCount: -1, createdAt: -1 };
    } else if (sort === "alpha") {
      sortObj = { title: 1 };
    } else if (sort === "featured") {
      sortObj = { isFeatured: -1, order: 1, createdAt: -1 };
    }

    const currentUserId = req.user?.id || null;

    if (limit && !isNaN(parseInt(limit, 10))) {
      const lim = Math.max(1, parseInt(limit, 10));
      const pg = Math.max(1, parseInt(page, 10) || 1);
      const skip = (pg - 1) * lim;

      const [resources, total] = await Promise.all([
        Resource.find(query)
          .populate("createdBy", "username name avatar")
          .sort(sortObj)
          .skip(skip)
          .limit(lim)
          .lean(),
        Resource.countDocuments(query),
      ]);

      return res.json({
        total,
        page: pg,
        pages: Math.ceil(total / lim),
        resources: resources.map((r) => formatResource(r, currentUserId)),
      });
    }

    const resources = await Resource.find(query)
      .populate("createdBy", "username name avatar")
      .sort(sortObj)
      .lean();

    return res.json(resources.map((r) => formatResource(r, currentUserId)));
  } catch (err) {
    console.error("[Get Resources Error]", err);
    return res.status(500).json({ error: "Failed to fetch resources" });
  }
});

router.get("/:idOrSlug", optionalAuth, async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let resource = null;

    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      resource = await Resource.findByIdAndUpdate(
        idOrSlug,
        { $inc: { viewsCount: 1 } },
        { new: true }
      ).populate("createdBy", "username name avatar");
    }

    if (!resource) {
      resource = await Resource.findOneAndUpdate(
        { slug: idOrSlug.toLowerCase() },
        { $inc: { viewsCount: 1 } },
        { new: true }
      ).populate("createdBy", "username name avatar");
    }

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    return res.json(formatResource(resource, req.user?.id));
  } catch (err) {
    console.error("[Get Single Resource Error]", err);
    return res.status(500).json({ error: "Failed to fetch resource" });
  }
});

router.post("/:id/track-download", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }

    const updated = await Resource.findByIdAndUpdate(
      id,
      { $inc: { downloadCount: 1 } },
      { new: true, select: "downloadCount" }
    );

    if (!updated) {
      return res.status(404).json({ error: "Resource not found" });
    }

    return res.json({ success: true, downloadCount: updated.downloadCount });
  } catch (err) {
    console.error("[Track Download Error]", err);
    return res.status(500).json({ error: "Failed to record download telemetry" });
  }
});

router.post("/:id/bookmark", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    const userIdStr = String(req.user.id);
    const hasBookmarked = resource.bookmarks.some((b) => String(b) === userIdStr);

    if (hasBookmarked) {
      resource.bookmarks = resource.bookmarks.filter((b) => String(b) !== userIdStr);
    } else {
      resource.bookmarks.push(req.user.id);
    }

    await resource.save();

    return res.json({
      success: true,
      isBookmarked: !hasBookmarked,
      bookmarksCount: resource.bookmarks.length,
    });
  } catch (err) {
    console.error("[Bookmark Resource Error]", err);
    return res.status(500).json({ error: "Failed to update bookmark" });
  }
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const {
    title,
    slug,
    description,
    details,
    category,
    difficulty,
    items,
    links,
    files,
    isFeatured,
    order,
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required" });
  }

  try {
    const formattedFiles = Array.isArray(files)
      ? files
          .filter((f) => f && f.name && f.url)
          .map((f) => ({
            name: String(f.name).trim(),
            url: String(f.url).trim(),
            format: f.format ? String(f.format).toLowerCase().trim() : "other",
            size: f.size ? String(f.size).trim() : "",
            description: f.description ? String(f.description).trim() : "",
          }))
      : [];

    const formattedLinks = Array.isArray(links)
      ? links
          .filter((l) => l && l.title && l.url)
          .map((l) => ({
            title: String(l.title).trim(),
            url: String(l.url).trim(),
            type: l.type ? String(l.type).trim() : "link",
          }))
      : [];

    const cleanItems = Array.isArray(items)
      ? items.map((i) => String(i).trim()).filter(Boolean)
      : [];

    const resource = await Resource.create({
      title: title.trim(),
      slug: slug ? slug.toLowerCase().trim() : undefined,
      description: description.trim(),
      details: details ? details.trim() : "",
      category: category || "cs-intro",
      difficulty: difficulty || "all-levels",
      items: cleanItems,
      links: formattedLinks,
      files: formattedFiles,
      isFeatured: Boolean(isFeatured),
      order: typeof order === "number" ? order : 0,
      createdBy: req.user.id,
    });

    const populated = await Resource.findById(resource._id).populate(
      "createdBy",
      "username name avatar"
    );

    return res.status(201).json(formatResource(populated, req.user.id));
  } catch (err) {
    console.error("[Create Resource Error]", err);
    return res.status(500).json({ error: "Failed to create resource" });
  }
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const {
    title,
    slug,
    description,
    details,
    category,
    difficulty,
    items,
    links,
    files,
    isFeatured,
    order,
  } = req.body;

  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (title) resource.title = title.trim();
    if (slug) resource.slug = slug.toLowerCase().trim();
    if (description) resource.description = description.trim();
    if (typeof details === "string") resource.details = details.trim();
    if (category) resource.category = category;
    if (difficulty) resource.difficulty = difficulty;
    if (typeof isFeatured === "boolean") resource.isFeatured = isFeatured;
    if (typeof order === "number") resource.order = order;

    if (Array.isArray(items)) {
      resource.items = items.map((i) => String(i).trim()).filter(Boolean);
    }

    if (Array.isArray(links)) {
      resource.links = links
        .filter((l) => l && l.title && l.url)
        .map((l) => ({
          title: String(l.title).trim(),
          url: String(l.url).trim(),
          type: l.type ? String(l.type).trim() : "link",
        }));
    }

    if (Array.isArray(files)) {
      resource.files = files
        .filter((f) => f && f.name && f.url)
        .map((f) => ({
          name: String(f.name).trim(),
          url: String(f.url).trim(),
          format: f.format ? String(f.format).toLowerCase().trim() : "other",
          size: f.size ? String(f.size).trim() : "",
          description: f.description ? String(f.description).trim() : "",
        }));
    }

    await resource.save();

    const populated = await Resource.findById(resource._id).populate(
      "createdBy",
      "username name avatar"
    );

    return res.json(formatResource(populated, req.user.id));
  } catch (err) {
    console.error("[Update Resource Error]", err);
    return res.status(500).json({ error: "Failed to update resource" });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }
    return res.json({ success: true, message: "Resource deleted successfully" });
  } catch (err) {
    console.error("[Delete Resource Error]", err);
    return res.status(500).json({ error: "Failed to delete resource" });
  }
});

export default router;
