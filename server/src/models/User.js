import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: '',
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: false,
      default: '',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'moderator', 'content_admin'],
      default: 'student',
    },
    isBanned: {
      type: Boolean,
      default: false,
      index: true,
    },
    banReason: {
      type: String,
      default: '',
    },
    bannedAt: {
      type: Date,
      default: null,
    },
    banExpiresAt: {
      type: Date,
      default: null,
    },
    moderationStrikes: {
      type: Number,
      default: 0,
    },
    strikeExpiresAt: {
      type: Date,
      default: null,
    },
    postingRestrictedUntil: {
      type: Date,
      default: null,
    },
    bio: {
      type: String,
      default: '',
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    skills: {
      type: [String],
      default: ['Linux', 'Git', 'Open Source'],
    },
    avatar: {
      type: String,
      default: '',
    },
    socials: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      website: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },
    preferences: {
      emailNotifs: { type: Boolean, default: true },
      replyNotifs: { type: Boolean, default: true },
      eventNotifs: { type: Boolean, default: true },
      newsletterNotifs: { type: Boolean, default: false },
      theme: { type: String, default: 'dark' },
    },
    communityRole: {
      isMember: { type: Boolean, default: false, index: true },
      category: {
        type: String,
        enum: ['', 'Mentor', 'Alumni', 'Head', 'Club Head', 'Advisor', 'Co-Head', 'Team Lead', 'Coordinator'],
        default: '',
      },
      positionTitle: { type: String, default: '' },
      teamDomain: { type: String, default: 'Core' },
      order: { type: Number, default: 99 },
      assignedAt: { type: Date, default: Date.now },
    },
    terminalState: {
      fs: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      history: {
        type: [String],
        default: [],
      },
      cwd: {
        type: String,
        default: '/home/user',
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plainPassword) {
  return bcrypt.hash(plainPassword, 10);
};

export const User = mongoose.model('User', userSchema);

