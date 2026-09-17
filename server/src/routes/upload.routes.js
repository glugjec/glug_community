import { Router } from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ error: 'Cloudinary credentials are not configured on server' });
    }

    const uploadPromise = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'glug/avatars',
          resource_type: 'image',
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height,
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    res.status(500).json({ error: err.message || 'Failed to upload image' });
  }
});

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ error: 'Cloudinary credentials are not configured on server' });
    }

    const uploadPromise = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'glug/uploads',
          resource_type: 'image',
          transformation: [
            { quality: 'auto:good', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    res.status(500).json({ error: err.message || 'Failed to upload image' });
  }
});

router.post('/multiple', requireAuth, upload.array('images', 15), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ error: 'Cloudinary credentials are not configured on server' });
    }

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'glug/events',
            resource_type: 'image',
            transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              bytes: result.bytes,
              format: result.format,
            });
          }
        );
        stream.end(file.buffer);
      });
    });

    const results = await Promise.all(uploadPromises);
    res.json({ images: results });
  } catch (err) {
    console.error('[Upload Multiple Error]', err);
    res.status(500).json({ error: err.message || 'Failed to upload images' });
  }
});

export default router;

