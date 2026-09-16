import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Appeal } from '../models/Appeal.js';
import { EmailOtp } from '../models/EmailOtp.js';
import { sendOtpMail } from '../config/mail.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { notifyAllAdmins } from '../utils/notificationService.js';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Automatic Admin Email List
const ADMIN_EMAILS = ['glug.jec@gmail.com'];

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    return res.status(400).json({ error: errors.array()[0].msg });
  };
};

router.post(
  '/send-otp',
  validate([
    body('email').trim().isEmail().withMessage('Please provide a valid email'),
  ]),
  async (req, res) => {
    const { email, purpose = 'register' } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    try {
      if (purpose === 'register') {
        const existing = await User.findOne({ email: cleanEmail });
        if (existing) {
          return res.status(409).json({ error: 'An account with this email already exists' });
        }
      }

      const recentOtp = await EmailOtp.findOne({
        email: cleanEmail,
        purpose,
        createdAt: { $gte: new Date(Date.now() - 45 * 1000) },
      });
      if (recentOtp) {
        return res.status(429).json({ error: 'Please wait 45 seconds before requesting another code' });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await EmailOtp.deleteMany({ email: cleanEmail, purpose });
      await EmailOtp.create({
        email: cleanEmail,
        otp,
        purpose,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await sendOtpMail({
        to: cleanEmail,
        otp,
        purpose: purpose === 'register' ? 'registration' : purpose,
      });

      return res.json({ success: true, message: 'Verification code sent' });
    } catch (err) {
      console.error('[Send OTP Error]', err);
      return res.status(500).json({ error: err.message || 'Failed to send verification code' });
    }
  }
);

router.post(
  '/verify-otp',
  validate([
    body('email').trim().isEmail().withMessage('Please provide a valid email'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ]),
  async (req, res) => {
    const { email, otp, purpose = 'register' } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    try {
      const record = await EmailOtp.findOne({ email: cleanEmail, purpose }).sort({ createdAt: -1 });
      if (!record) {
        return res.status(400).json({ error: 'Verification code expired or not found' });
      }

      if (new Date() > record.expiresAt) {
        await EmailOtp.deleteOne({ _id: record._id });
        return res.status(400).json({ error: 'Verification code has expired' });
      }

      if (record.attempts >= 5) {
        await EmailOtp.deleteOne({ _id: record._id });
        return res.status(400).json({ error: 'Too many failed attempts. Please request a new code' });
      }

      if (record.otp !== otp.trim()) {
        record.attempts += 1;
        await record.save();
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      await EmailOtp.deleteOne({ _id: record._id });

      const verificationToken = jwt.sign(
        { email: cleanEmail, purpose, verified: true },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      return res.json({
        success: true,
        verificationToken,
        message: 'Email verified successfully',
      });
    } catch (err) {
      console.error('[Verify OTP Error]', err);
      return res.status(500).json({ error: 'Failed to verify code' });
    }
  }
);

router.get('/check-username', async (req, res) => {
  const username = (req.query.username || '').trim();

  if (!username) {
    return res.json({ available: false, message: 'Username is required' });
  }

  if (username.length < 3) {
    return res.json({ available: false, message: 'Must be at least 3 characters' });
  }

  if (username.length > 30) {
    return res.json({ available: false, message: 'Cannot exceed 30 characters' });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.json({ available: false, message: 'Only letters, numbers, and underscores allowed' });
  }

  try {
    const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existing = await User.findOne({
      username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') },
    });

    if (existing) {
      return res.json({ available: false, message: 'Username already taken' });
    }

    return res.json({ available: true, message: 'Username is available' });
  } catch (err) {
    console.error('[Check Username Error]', err);
    return res.status(500).json({ error: 'Failed to check username' });
  }
});

router.post(
  '/register',
  validate([
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email').trim().isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ]),
  async (req, res) => {
    const { username, email, password, verificationToken } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    try {
      if (verificationToken) {
        try {
          const decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
          if (decoded.email !== cleanEmail || !decoded.verified) {
            return res.status(400).json({ error: 'Email verification token is invalid' });
          }
        } catch {
          return res.status(400).json({ error: 'Email verification expired. Please verify your email again' });
        }
      }

      const cleanUsername = username.trim();
      const escapedUsername = cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await User.findOne({
        $or: [
          { email: cleanEmail },
          { username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') } },
        ],
      });

      if (existing) {
        if (existing.email === cleanEmail) {
          return res.status(409).json({ error: 'Email already registered' });
        }
        return res.status(409).json({ error: 'Username already taken' });
      }

      const role = ADMIN_EMAILS.includes(cleanEmail) ? 'admin' : 'student';
      const passwordHash = await User.hashPassword(password);
      const user = await User.create({
        username: username.trim(),
        email: cleanEmail,
        passwordHash,
        role,
        isEmailVerified: Boolean(verificationToken),
      });

      const token = signToken(user);
      return res.status(201).json({ user: user.toJSON(), token });
    } catch (err) {
      console.error('[Auth Register Error]', err);
      return res.status(500).json({ error: 'Failed to create account' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Log in an existing user
router.post(
  '/login',
  validate([
    body('email').trim().isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  async (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    try {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (ADMIN_EMAILS.includes(cleanEmail) && user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
      }

      if (user.isBanned) {
        if (user.banExpiresAt && new Date(user.banExpiresAt) <= new Date()) {
          user.isBanned = false;
          user.banReason = '';
          user.banExpiresAt = null;
          await user.save();
        } else {
          const appealToken = jwt.sign(
            { id: user._id.toString(), email: user.email, role: user.role, isBanned: true },
            process.env.JWT_SECRET || 'glug-secret-key-development',
            { expiresIn: '24h' }
          );

          const pendingAppeal = await Appeal.findOne({
            appellant: user._id,
            $or: [{ itemType: 'account_ban' }, { originalCategory: 'account_ban' }],
            status: 'pending',
          }).select('statement createdAt status').lean();

          return res.status(403).json({
            error: user.banExpiresAt
              ? `Your account has been temporarily suspended until ${new Date(user.banExpiresAt).toLocaleString()}.`
              : 'Your account has been suspended by an administrator.',
            isBanned: true,
            banReason: user.banReason || 'Suspended by administrator',
            moderationStrikes: user.moderationStrikes || 0,
            bannedAt: user.bannedAt,
            banExpiresAt: user.banExpiresAt || null,
            appealToken,
            pendingAppeal: pendingAppeal ? {
              statement: pendingAppeal.statement,
              createdAt: pendingAppeal.createdAt,
              status: pendingAppeal.status,
            } : null,
          });
        }
      }

      const token = signToken(user);
      return res.json({ user: user.toJSON(), token });
    } catch (err) {
      console.error('[Auth Login Error]', err);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  }
);

router.post('/banned-appeal', async (req, res) => {
  const { appealToken, statement } = req.body;

  if (!statement || typeof statement !== 'string' || !statement.trim()) {
    return res.status(400).json({ error: 'Please provide an appeal statement.' });
  }

  if (!appealToken) {
    return res.status(401).json({ error: 'Appeal authorization token missing.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'glug-secret-key-development';
    const decoded = jwt.verify(appealToken, secret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const existingPending = await Appeal.findOne({
      appellant: user._id,
      $or: [{ itemType: 'account_ban' }, { originalCategory: 'account_ban' }],
      status: 'pending',
    });

    let appeal;
    if (existingPending) {
      existingPending.itemType = 'account_ban';
      existingPending.originalCategory = 'account_ban';
      existingPending.statement = statement.trim().slice(0, 1500);
      existingPending.originalReason = user.banReason || existingPending.originalReason || 'Account suspended by administrator';
      appeal = await existingPending.save();

      notifyAllAdmins({
        message: `${user.username || 'A banned member'} updated their account ban appeal for review.`,
        senderId: user._id,
      }).catch(() => {});

      return res.status(200).json({
        success: true,
        message: 'Your appeal has been updated successfully. Our moderation team will review your request.',
        appeal: appeal.toJSON(),
      });
    }

    appeal = await Appeal.create({
      appellant: user._id,
      itemType: 'account_ban',
      strikeIndex: user.moderationStrikes || 0,
      originalReason: user.banReason || 'Account suspended by administrator',
      originalCategory: 'account_ban',
      statement: statement.trim().slice(0, 1500),
      status: 'pending',
    });

    notifyAllAdmins({
      message: `${user.username || 'A banned member'} submitted a new account ban appeal for review.`,
      senderId: user._id,
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Your appeal has been submitted successfully. Our moderation team will review your request.',
      appeal: appeal.toJSON(),
    });
  } catch (err) {
    console.error('[Banned Appeal Error]', err);
    return res.status(401).json({ error: 'Invalid or expired appeal session. Please try logging in again.' });
  }
});

router.post(
  '/forgot-password',
  validate([
    body('email').trim().isEmail().withMessage('Please provide a valid email'),
  ]),
  async (req, res) => {
    const { email } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    try {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(404).json({ error: 'No account registered with this email address' });
      }

      const recentOtp = await EmailOtp.findOne({
        email: cleanEmail,
        purpose: 'reset',
        createdAt: { $gte: new Date(Date.now() - 45 * 1000) },
      });
      if (recentOtp) {
        return res.status(429).json({ error: 'Please wait 45 seconds before requesting another code' });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await EmailOtp.deleteMany({ email: cleanEmail, purpose: 'reset' });
      await EmailOtp.create({
        email: cleanEmail,
        otp,
        purpose: 'reset',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await sendOtpMail({
        to: cleanEmail,
        otp,
        purpose: 'reset',
      });

      return res.json({ success: true, message: 'Password reset code sent to your email' });
    } catch (err) {
      console.error('[Forgot Password Error]', err);
      return res.status(500).json({ error: 'Failed to send password reset code' });
    }
  }
);

router.post(
  '/reset-password',
  validate([
    body('email').trim().isEmail().withMessage('Please provide a valid email'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ]),
  async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    try {
      const record = await EmailOtp.findOne({ email: cleanEmail, purpose: 'reset' }).sort({ createdAt: -1 });
      if (!record) {
        return res.status(400).json({ error: 'Reset code expired or not found' });
      }

      if (new Date() > record.expiresAt) {
        await EmailOtp.deleteOne({ _id: record._id });
        return res.status(400).json({ error: 'Reset code has expired. Please request a new one' });
      }

      if (record.attempts >= 5) {
        await EmailOtp.deleteOne({ _id: record._id });
        return res.status(400).json({ error: 'Too many incorrect attempts. Please request a new code' });
      }

      if (record.otp !== otp.trim()) {
        record.attempts += 1;
        await record.save();
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      await EmailOtp.deleteOne({ _id: record._id });

      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.passwordHash = await User.hashPassword(newPassword);
      await user.save();

      return res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
      console.error('[Reset Password Error]', err);
      return res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

// @route   POST /api/auth/google
// @desc    Google OAuth Sign-In / Sign-Up
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Google credential token is required' });
  }

  try {
    let payload;

    if (process.env.GOOGLE_CLIENT_ID) {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } else {
      const parts = credential.split('.');
      if (parts.length === 3) {
        payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      } else {
        return res.status(400).json({ error: 'Invalid token structure' });
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Unable to extract profile from Google token' });
    }

    const { email, sub: googleId, picture } = payload;
    const cleanEmail = email.toLowerCase().trim();
    const isSpecialAdmin = ADMIN_EMAILS.includes(cleanEmail);

    let user = await User.findOne({
      $or: [{ googleId }, { email: cleanEmail }],
    });

    if (user) {
      let modified = false;
      if (isSpecialAdmin && user.role !== 'admin') {
        user.role = 'admin';
        modified = true;
      }
      if (!user.googleId) {
        user.googleId = googleId;
        modified = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        modified = true;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        modified = true;
      }
      if (modified) await user.save();

      if (user.isBanned) {
        if (user.banExpiresAt && new Date(user.banExpiresAt) <= new Date()) {
          user.isBanned = false;
          user.banReason = '';
          user.banExpiresAt = null;
          await user.save();
        } else {
          const appealToken = jwt.sign(
            { id: user._id.toString(), email: user.email, role: user.role, isBanned: true },
            process.env.JWT_SECRET || 'glug-secret-key-development',
            { expiresIn: '24h' }
          );

          const pendingAppeal = await Appeal.findOne({
            appellant: user._id,
            $or: [{ itemType: 'account_ban' }, { originalCategory: 'account_ban' }],
            status: 'pending',
          }).select('statement createdAt status').lean();

          return res.status(403).json({
            error: user.banExpiresAt
              ? `Your account has been temporarily suspended until ${new Date(user.banExpiresAt).toLocaleString()}.`
              : 'Your account has been suspended by an administrator.',
            isBanned: true,
            banReason: user.banReason || 'Suspended by administrator',
            moderationStrikes: user.moderationStrikes || 0,
            bannedAt: user.bannedAt,
            banExpiresAt: user.banExpiresAt || null,
            appealToken,
            pendingAppeal: pendingAppeal ? {
              statement: pendingAppeal.statement,
              createdAt: pendingAppeal.createdAt,
              status: pendingAppeal.status,
            } : null,
          });
        }
      }

      const token = signToken(user);
      return res.json({ user: user.toJSON(), token });
    }

    const oauthToken = jwt.sign(
      {
        googleId,
        email: cleanEmail,
        picture: picture || '',
        name: payload.name || '',
        role: isSpecialAdmin ? 'admin' : 'student',
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const baseUsername = (cleanEmail.split('@')[0] || 'student')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .slice(0, 20);

    return res.json({
      requiresUsername: true,
      oauthToken,
      email: cleanEmail,
      name: payload.name || '',
      picture: picture || '',
      suggestedUsername: baseUsername.length >= 3 ? baseUsername : `${baseUsername}_user`,
    });
  } catch (err) {
    console.error('[Google Auth Error]', err);
    return res.status(401).json({ error: 'Google authentication failed: ' + (err.message || 'Invalid token') });
  }
});

router.post(
  '/google/complete',
  validate([
    body('oauthToken').notEmpty().withMessage('OAuth token is required'),
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
  ]),
  async (req, res) => {
    const { oauthToken, username } = req.body;

    let payload;
    try {
      payload = jwt.verify(oauthToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: 'OAuth session has expired. Please sign in with Google again' });
    }

    const { googleId, email, picture, role } = payload;
    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();

    try {
      const escapedUsername = cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await User.findOne({
        $or: [
          { email: cleanEmail },
          { username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') } },
        ],
      });

      if (existing) {
        if (existing.email === cleanEmail) {
          return res.status(409).json({ error: 'An account with this email already exists' });
        }
        return res.status(409).json({ error: 'Username already taken' });
      }

      const user = await User.create({
        username: cleanUsername,
        email: cleanEmail,
        googleId,
        avatar: picture || '',
        role: role || (ADMIN_EMAILS.includes(cleanEmail) ? 'admin' : 'student'),
        isEmailVerified: true,
      });

      const token = signToken(user);
      return res.status(201).json({ user: user.toJSON(), token });
    } catch (err) {
      console.error('[Google Complete Error]', err);
      return res.status(500).json({ error: 'Failed to complete Google sign up' });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isBanned) {
      if (user.banExpiresAt && new Date(user.banExpiresAt) <= new Date()) {
        user.isBanned = false;
        user.banReason = '';
        user.banExpiresAt = null;
        await user.save();
      } else {
        return res.status(403).json({
          error: 'Your account has been suspended by an administrator.',
          isBanned: true,
          banReason: user.banReason || 'Suspended by administrator',
          banExpiresAt: user.banExpiresAt || null,
        });
      }
    }

    return res.json({ user: user.toJSON() });
  } catch (err) {
    console.error('[Auth /me Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// @route   PUT /api/auth/me
router.put('/me', requireAuth, async (req, res) => {
  const { username, bio, skills, avatar, socials, preferences, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (typeof username === 'string' && username.trim() && username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const cleanUsername = username.trim();
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
        return res.status(400).json({ error: 'Username must be 3-30 characters (letters, numbers, underscore)' });
      }
      const escapedUsername = cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await User.findOne({
        username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') },
        _id: { $ne: user._id },
      });
      if (existing) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      user.username = cleanUsername;
    }

    if (typeof bio === 'string') user.bio = bio;
    if (Array.isArray(skills)) user.skills = skills.map((s) => String(s).trim()).filter(Boolean);
    if (typeof avatar === 'string') user.avatar = avatar;

    if (socials && typeof socials === 'object') {
      user.socials = {
        github: typeof socials.github === 'string' ? socials.github.trim() : (user.socials?.github || ''),
        linkedin: typeof socials.linkedin === 'string' ? socials.linkedin.trim() : (user.socials?.linkedin || ''),
        website: typeof socials.website === 'string' ? socials.website.trim() : (user.socials?.website || ''),
        twitter: typeof socials.twitter === 'string' ? socials.twitter.trim() : (user.socials?.twitter || ''),
      };
    }

    if (preferences && typeof preferences === 'object') {
      user.preferences = {
        emailNotifs: preferences.emailNotifs !== undefined ? !!preferences.emailNotifs : (user.preferences?.emailNotifs ?? true),
        replyNotifs: preferences.replyNotifs !== undefined ? !!preferences.replyNotifs : (user.preferences?.replyNotifs ?? true),
        eventNotifs: preferences.eventNotifs !== undefined ? !!preferences.eventNotifs : (user.preferences?.eventNotifs ?? true),
        newsletterNotifs: preferences.newsletterNotifs !== undefined ? !!preferences.newsletterNotifs : (user.preferences?.newsletterNotifs ?? false),
        theme: typeof preferences.theme === 'string' ? preferences.theme : (user.preferences?.theme || 'dark'),
      };
    }

    if (newPassword) {
      if (user.passwordHash) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to set a new password' });
        }
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(400).json({ error: 'Current password does not match' });
        }
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      user.passwordHash = await User.hashPassword(newPassword);
    }

    await user.save();
    return res.json({ user: user.toJSON() });
  } catch (err) {
    console.error('[Auth Update Profile Error]', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;

