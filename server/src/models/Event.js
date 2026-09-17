import mongoose from 'mongoose';

const galleryImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    caption: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const speakerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, default: '' },
    company: { type: String, default: '' },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
  },
  { _id: true }
);

const resourceLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ['slides', 'code', 'recording', 'notes', 'other'],
      default: 'other',
    },
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['workshop', 'hackathon', 'meetup', 'talk', 'installation-drive', 'general'],
      default: 'workshop',
      index: true,
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'cancelled', 'completed'],
      default: 'published',
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
    },
    time: {
      type: String,
      default: '',
    },
    locationType: {
      type: String,
      enum: ['in-person', 'virtual', 'hybrid'],
      default: 'in-person',
    },
    venue: {
      type: String,
      default: '',
    },
    mapUrl: {
      type: String,
      default: '',
    },
    virtualLink: {
      type: String,
      default: '',
    },
    bannerUrl: {
      type: String,
      default: '',
    },
    bannerPublicId: {
      type: String,
      default: '',
    },
    gallery: [galleryImageSchema],
    registration: {
      enabled: { type: Boolean, default: false },
      url: { type: String, default: '' },
      deadline: { type: Date },
      capacity: { type: Number, default: 0 },
    },
    speakers: [speakerSchema],
    resources: [resourceLinkSchema],
    tags: [{ type: String, trim: true }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

eventSchema.pre('validate', async function () {
  if (this.title && (!this.slug || this.isModified('title'))) {
    const baseSlug = slugify(this.title) || 'event';
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await mongoose.models.Event.findOne({
        slug: uniqueSlug,
        _id: { $ne: this._id },
      });
      if (!existing) break;
      uniqueSlug = `${baseSlug}-${counter}`;
      counter += 1;
    }
    this.slug = uniqueSlug;
  }
});

export const Event = mongoose.model('Event', eventSchema);
