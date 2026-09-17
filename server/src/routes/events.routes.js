import { Router } from 'express';
import mongoose from 'mongoose';
import { Event } from '../models/Event.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';

const router = Router();

router.get('/upcoming', async (req, res) => {
  try {
    const now = new Date();
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);

    const events = await Event.find({
      status: 'published',
      startDate: { $gte: now },
    })
      .sort({ startDate: 1 })
      .limit(limit)
      .populate('createdBy', 'username name avatar');

    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch upcoming events' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const [total, upcoming, past, totalPhotosAgg] = await Promise.all([
      Event.countDocuments({ status: 'published' }),
      Event.countDocuments({ status: 'published', startDate: { $gte: now } }),
      Event.countDocuments({ status: 'published', startDate: { $lt: now } }),
      Event.aggregate([
        { $match: { status: 'published' } },
        { $project: { galleryCount: { $size: { $ifNull: ['$gallery', []] } } } },
        { $group: { _id: null, totalPhotos: { $sum: '$galleryCount' } } },
      ]),
    ]);

    const totalPhotos = totalPhotosAgg[0]?.totalPhotos || 0;

    res.json({
      total,
      upcoming,
      past,
      totalPhotos,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch event stats' });
  }
});

router.get('/', async (req, res) => {
  try {
    const {
      type = 'all',
      category,
      search,
      status,
      page = 1,
      limit = 12,
      includeDrafts = 'false',
    } = req.query;

    const query = {};
    const now = new Date();

    if (includeDrafts !== 'true') {
      query.status = 'published';
    } else if (status) {
      query.status = status;
    }

    if (type === 'upcoming') {
      query.startDate = { $gte: now };
    } else if (type === 'past') {
      query.startDate = { $lt: now };
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { tagline: searchRegex },
        { venue: searchRegex },
        { tags: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const sortOrder = type === 'past' ? { startDate: -1 } : { startDate: 1 };

    const [events, total] = await Promise.all([
      Event.find(query)
        .sort(sortOrder)
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'username name avatar'),
      Event.countDocuments(query),
    ]);

    res.json({
      events,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to list events' });
  }
});

router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let event = null;

    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      event = await Event.findById(idOrSlug).populate('createdBy', 'username name avatar');
    }

    if (!event) {
      event = await Event.findOne({ slug: idOrSlug.toLowerCase() }).populate(
        'createdBy',
        'username name avatar'
      );
    }

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await Event.findByIdAndUpdate(event._id, { $inc: { viewsCount: 1 } });

    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch event' });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      tagline,
      description,
      category,
      status = 'published',
      startDate,
      endDate,
      time,
      locationType,
      venue,
      mapUrl,
      virtualLink,
      bannerUrl,
      bannerPublicId,
      gallery = [],
      registration = {},
      speakers = [],
      resources = [],
      tags = [],
    } = req.body;

    if (!title || !startDate) {
      return res.status(400).json({ error: 'Title and start date are required' });
    }

    const event = await Event.create({
      title,
      tagline,
      description,
      category,
      status,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      time,
      locationType,
      venue,
      mapUrl,
      virtualLink,
      bannerUrl,
      bannerPublicId,
      gallery,
      registration,
      speakers,
      resources,
      tags,
      createdBy: req.user._id,
    });

    res.status(201).json({ event });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create event' });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const updates = { ...req.body };
    if (updates.startDate) {
      updates.startDate = new Date(updates.startDate);
    }
    if (updates.endDate) {
      updates.endDate = new Date(updates.endDate);
    }

    const event = await Event.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'username name avatar');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update event' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.bannerPublicId) {
      try {
        await cloudinary.uploader.destroy(event.bannerPublicId);
      } catch (cErr) {
        console.error('Cloudinary banner removal error', cErr);
      }
    }

    if (Array.isArray(event.gallery) && event.gallery.length > 0) {
      for (const img of event.gallery) {
        if (img.publicId) {
          try {
            await cloudinary.uploader.destroy(img.publicId);
          } catch (cErr) {
            console.error('Cloudinary gallery photo removal error', cErr);
          }
        }
      }
    }

    await Event.findByIdAndDelete(id);

    res.json({ message: 'Event deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to delete event' });
  }
});

router.post('/:id/gallery', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const newImages = images.map((img) => ({
      url: typeof img === 'string' ? img : img.url,
      publicId: img.publicId || '',
      caption: img.caption || '',
      uploadedAt: new Date(),
    }));

    event.gallery.push(...newImages);
    await event.save();

    res.json({ event, gallery: event.gallery });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to append gallery photos' });
  }
});

router.delete('/:id/gallery/:imageId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id, imageId } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const imgIndex = event.gallery.findIndex((g) => g._id.toString() === imageId);
    if (imgIndex === -1) {
      return res.status(404).json({ error: 'Image not found in event gallery' });
    }

    const [removed] = event.gallery.splice(imgIndex, 1);
    await event.save();

    if (removed.publicId) {
      try {
        await cloudinary.uploader.destroy(removed.publicId);
      } catch (cErr) {
        console.error('Cloudinary gallery image destroy error', cErr);
      }
    }

    res.json({ message: 'Gallery image removed', gallery: event.gallery });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to delete gallery image' });
  }
});

router.patch('/:id/gallery/:imageId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const { caption } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const img = event.gallery.id(imageId);
    if (!img) {
      return res.status(404).json({ error: 'Image not found in event gallery' });
    }

    img.caption = typeof caption === 'string' ? caption : '';
    await event.save();

    res.json({ message: 'Photo caption updated', gallery: event.gallery });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update photo caption' });
  }
});

router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['published', 'draft', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const event = await Event.findByIdAndUpdate(id, { status }, { new: true });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update event status' });
  }
});

export default router;
