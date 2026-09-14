import { Router } from "express";
import { Resource } from "../models/Resource.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// @route   GET /api/resources
// @desc    Get all learning resources
router.get("/", async (req, res) => {
  try {
    const resources = await Resource.find()
      .populate("createdBy", "username name avatar")
      .sort({ order: 1, createdAt: 1 })
      .lean();
    return res.json(
      resources.map((r) => ({
        id: r._id.toString(),
        title: r.title,
        description: r.description,
        category: r.category,
        items: r.items || [],
        links: r.links || [],
        order: r.order || 0,
        author: r.createdBy
          ? {
              id: r.createdBy._id?.toString(),
              username: r.createdBy.username,
              name: r.createdBy.name,
              avatar: r.createdBy.avatar,
            }
          : null,
        createdAt: r.createdAt,
      }))
    );
  } catch (err) {
    console.error("[Get Resources Error]", err);
    return res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// @route   POST /api/resources
// @desc    Create a new learning resource (Admin only)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { title, description, category, items, links, order } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required" });
  }

  try {
    const resource = await Resource.create({
      title: title.trim(),
      description: description.trim(),
      category: category || "getting-started",
      items: Array.isArray(items) ? items.map((i) => String(i).trim()).filter(Boolean) : [],
      links: Array.isArray(links) ? links.filter((l) => l.title && l.url) : [],
      order: typeof order === "number" ? order : 0,
      createdBy: req.user.id,
    });

    return res.status(201).json(resource);
  } catch (err) {
    console.error("[Create Resource Error]", err);
    return res.status(500).json({ error: "Failed to create resource" });
  }
});

// @route   PUT /api/resources/:id
// @desc    Update a learning resource (Admin only)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { title, description, category, items, links, order } = req.body;

  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (title) resource.title = title.trim();
    if (description) resource.description = description.trim();
    if (category) resource.category = category;
    if (Array.isArray(items)) {
      resource.items = items.map((i) => String(i).trim()).filter(Boolean);
    }
    if (Array.isArray(links)) {
      resource.links = links.filter((l) => l.title && l.url);
    }
    if (typeof order === "number") {
      resource.order = order;
    }

    await resource.save();
    return res.json(resource);
  } catch (err) {
    console.error("[Update Resource Error]", err);
    return res.status(500).json({ error: "Failed to update resource" });
  }
});

// @route   DELETE /api/resources/:id
// @desc    Delete a learning resource (Admin only)
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
