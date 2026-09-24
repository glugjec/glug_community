# GLUG — Technical Community & Open-Source Platform

An all-in-one technical platform and open-source collaboration hub built for the **GNU/Linux User Group (GLUG)**. Engineered with modern web standards to empower developers and community members through real-world Linux practice, multi-language code compilation, technical discussions, community events, curated learning roadmaps, direct messaging, in-app notifications, and automated content moderation.

---

## Table of Contents

- [Platform Overview](#platform-overview)
- [Key Features](#key-features)
  - [1. In-Browser Linux Terminal & Virtual Filesystem](#1-in-browser-linux-terminal--virtual-filesystem)
  - [2. Multi-Language Web Compiler & IDE](#2-multi-language-web-compiler--ide)
  - [3. Technical Discussion Forum & Threaded Replies](#3-technical-discussion-forum--threaded-replies)
  - [4. Personalized "For You" Feed & Topic Discovery](#4-personalized-for-you-feed--topic-discovery)
  - [5. Events & Workshop Hub](#5-events--workshop-hub)
  - [6. Curated Learning Roadmaps & Resource Vault](#6-curated-learning-roadmaps--resource-vault)
  - [7. Direct Messaging & Team Communication](#7-direct-messaging--team-communication)
  - [8. Real-Time In-App Notification Center](#8-real-time-in-app-notification-center)
  - [9. AI-Assisted Moderation, Strike Pipeline & Appeals](#9-ai-assisted-moderation-strike-pipeline--appeals)
  - [10. Member Directory & Profiles](#10-member-directory--profiles)
  - [11. Granular Role-Based Administration](#11-granular-role-based-administration)
  - [12. Dual Theme Engine & Mobile-First UX](#12-dual-theme-engine--mobile-first-ux)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
  - [3. Environment Variables Reference](#3-environment-variables-reference)
  - [4. Database Initialization & Seeding](#4-database-initialization--seeding)
  - [5. Production Build](#5-production-build)
- [Complete API Reference](#complete-api-reference)
  - [Authentication & Verification (`/api/auth`)](#authentication--verification-apiauth)
  - [Posts & Discussions (`/api/posts`)](#posts--discussions-apiposts)
  - [Comments & Replies (`/api/posts/:id/comments`)](#comments--replies-apipostsidcomments)
  - [Events & Workshops (`/api/events`)](#events--workshops-apievents)
  - [Curated Resources (`/api/resources`)](#curated-resources-apiresources)
  - [Notifications Center (`/api/notifications`)](#notifications-center-apinotifications)
  - [Direct Messaging (`/api/chat`)](#direct-messaging-apichat)
  - [Member Profiles & Terminal State (`/api/users`)](#member-profiles--terminal-state-apiusers)
  - [Admin Moderation & Operations (`/api/admin`)](#admin-moderation--operations-apiadmin)
  - [Cloud Code Compilation (`/api/compile`)](#cloud-code-compilation-apicompile)
  - [Media Uploads (`/api/upload`)](#media-uploads-apiupload)
- [In-Browser Linux Terminal Command Reference](#in-browser-linux-terminal-command-reference)
- [Compiler Language & Runtime Matrix](#compiler-language--runtime-matrix)
- [Security, Moderation & Data Integrity](#security-moderation--data-integrity)
- [Contributing](#contributing)
- [License](#license)

---

## Platform Overview

GLUG bridges the gap between theoretical classroom learning and real-world development workflows:
- **Zero Configuration**: Practice Unix/Linux commands and write code directly in the browser with no installation required.
- **Collaborative Community**: Ask technical questions, reply in nested threads, join campus events, and share knowledge with peers.
- **Safety & Quality**: Automated AI content analysis and multi-tier moderation guard discussions against spam, harassment, and low-quality submissions.
- **Accessible Anywhere**: Responsive, mobile-first design with dark and light themes, touch toolbars, and background scroll locks.
- **Production Ready**: Robust JWT session management, email verification pipelines, rate limiting, and in-memory development fallback.

---

## Key Features

### 1. In-Browser Linux Terminal & Virtual Filesystem
- **Full Virtual Filesystem (VFS)**: Complete directory hierarchy (`/home/user`, `/etc`, `/var`, `/bin`, `/tmp`) supporting file creation, modification, deletion, and path traversal (`~`, `.`, `..`, absolute and relative paths).
- **35+ Unix Commands**: Core utilities including `ls`, `cd`, `pwd`, `cat`, `mkdir`, `rmdir`, `rm`, `touch`, `cp`, `mv`, `tree`, `find`, `grep`, `head`, `tail`, `wc`, `echo`, `chmod`, `curl`, `whoami`, `hostname`, `uname`, `date`, `history`, `clear`, `ps`, `kill`, `env`, `export`, `alias`, `unalias`, `man`, `neofetch`, `cowsay`, and `fortune`.
- **I/O Redirection & Pipes**: Supports standard piping (`|`), output redirection (`>`), and append redirection (`>>`).
- **Interactive Full-Screen `nano` Editor**: In-terminal text editor with cursor positioning, keyboard navigation, status line, shortcuts (`Ctrl+O` save, `Ctrl+X` exit), and file persistence.
- **Embedded Python REPL Shell**: Run interactive Python scripts and expressions directly within the terminal session.
- **Persistent Sessions**: Authenticated member terminal states, custom files, and command history sync seamlessly with MongoDB (`/api/users/me/terminal`).
- **Mobile Touch Toolbar**: Quick touch controls for `Tab`, `Ctrl+C`, `Esc`, `Clear`, arrows, and common commands.

### 2. Multi-Language Web Compiler & IDE
- **Dual Execution Engine**:
  - **In-Browser Pyodide (WASM)**: Instant, zero-latency execution of Python code in a sandboxed WebAssembly runtime with synchronous `input()` prompt handling.
  - **Cloud Judge0 CE Integration**: High-performance remote sandbox execution for C (GCC), C++ (G++), Java (OpenJDK), C# (Mono), Go, Rust, JavaScript (Node.js), and TypeScript.
- **Monaco Editor Integration**: Visual Studio Code editing engine with syntax highlighting, automatic indentation, bracket matching, line numbering, code formatting, and code download/upload.
- **Multi-File Workspace**: Tabbed file manager supporting file creation, switching, and closing inside the active session.
- **View Modes**: One-click toggling between **Split**, **Code Only**, and **Console Only** view modes.
- **Interactive Terminal & Stdin Stream**: Standard output (`stdout`), standard error (`stderr`), live execution status, interactive stdin input bar, execution timing, and clear logs functionality.
- **Customizable Environment**: Font size stepper, full-screen mode, keyboard execution shortcut (`Ctrl + Enter`), and dark/light synchronization.

### 3. Technical Discussion Forum & Threaded Replies
- **Categorized Discussion Boards**: Linux & Distros, Programming & Algorithms, Web Development, DevOps & Cloud, Security & CTF, College Projects, Hardware & IoT, Club Events, and General Q&A.
- **Tag Filtering & Search**: Instant real-time search across titles, content, tags, and authors with debounced querying.
- **Rich Text & Markdown Support**: Unified TipTap WYSIWYG editor and GitHub Flavored Markdown renderer with code syntax highlighting, blockquotes, tables, and image embedding.
- **Nested Threaded Comments**: Indented conversation trees with author badges, direct reply targets (`@username`), collapsible reply streams, and pagination.
- **Protected Voting & Zero-Floor Scores**: Discussion scores cannot be maliciously downvoted below zero. Author self-voting is blocked, and undoing votes is fully supported.
- **Bookmarking & Saved Threads**: Save discussions for offline reference, accessible from member profiles and quick-filter sidebars.

### 4. Personalized "For You" Feed & Topic Discovery
- **Algorithmic Activity Stream**: Dedicated `/for-you` feed analyzing trending topics, subscribed categories, member interests, and interaction history.
- **Topic Quick Filters**: Jump immediately to discussions matching specific programming languages, technical concepts, or project types.

### 5. Events & Workshop Hub
- **Club Event Management**: Dedicated `/events` platform showcasing upcoming workshops, hackathons, bootcamps, and technical meetups.
- **Detailed Event Pages**: Includes comprehensive descriptions, schedules, speaker lists, venue details, Google Maps integration, virtual meeting links, and external registration links.
- **Photo Gallery & Archive**: Event recaps featuring uploaded photo galleries and presentation resources.
- **Content Admin Privileges**: Role-gated creation and management of events without requiring full system administrator access.

### 6. Curated Learning Roadmaps & Resource Vault
- **12 Structured Topic Tracks**: CS Introduction, Algorithms & DSA, Systems & Architecture, Operating Systems, Linux Basics, Sysadmin & DevOps, Git & VCS, Open Source & FOSS, Developer Tools, C & Systems Programming, Web Development, and Security & Networks.
- **Resource Bookmarking & Downloads**: Save study guides to your profile and track download counts for curated materials.
- **Level-Based Filtering**: Filter resources by difficulty (`Beginner`, `Intermediate`, `Advanced`, `All Levels`).

### 7. Direct Messaging & Team Communication
- **Member-to-Member & Staff Messaging**: Contact community administrators, team leads, mentors, and peers directly.
- **Conversation Management**: Chronological conversation list with last active message snippets and unread badge counters.
- **Live Message Streams**: Timestamped message histories with author verification and responsive chat windows.

### 8. Real-Time In-App Notification Center
- **Activity Alerts**: Instant notifications for replies on authored posts, comment mentions, upvote milestones, and direct messages.
- **System & Moderation Notifications**: Official notifications for event updates, appeal decisions, and community announcements.
- **Notification Inbox**: Read/unread toggles, global "mark all as read" capability, and quick navigation to source content.

### 9. AI-Assisted Moderation, Strike Pipeline & Appeals
- **Automated Content Analysis**: Background worker powered by Groq (Llama 3.1) scanning submissions for spam, profanity, harassment, and severe policy violations.
- **Community Reporting**: Members can flag offending posts or comments with specific violation categories and optional descriptions.
- **Three-Strike Policy**:
  - Strike 1: Warning and strike record.
  - Strike 2: 7-day posting restriction across the entire platform.
  - Strike 3: Permanent account suspension.
- **Formal Appeals Process**: Suspended or restricted members can submit formal appeals (`/api/users/me/appeals`), allowing administrators to review context, revoke strikes, and restore content.

### 10. Member Directory & Profiles
- **Community Leaderboard**: Member rankings sorted by contributions, upvotes received, and community roles.
- **Customizable Profiles**: Profile avatars, bios, GitHub links, LinkedIn profiles, personal websites, and technical skill tags.
- **Activity Timeline**: Tabs displaying authored discussions, posted replies, bookmarked threads, and moderation standing.

### 11. Granular Role-Based Administration
- **Hierarchical Access Levels**:
  - `student`: Standard community member with participation, voting, and resource viewing privileges.
  - `content_admin`: Designated community manager with permissions to create, edit, and curate events and learning resources.
  - `moderator`: Community supervisor with tools to review reports and flag content.
  - `admin`: Superuser with platform analytics, user role delegation, suspension controls, appeal resolution, and audit log access.
- **Moderation Audit Logs**: Immutable log history tracking administrative actions, reason codes, affected users, and appeal resolutions.

### 12. Dual Theme Engine & Mobile-First UX
- **Light & Dark Themes**: Synchronized theme switching stored locally and tied to authenticated member account preferences.
- **Mobile Navigation Drawer**: Responsive slide-out navigation with backdrop blur and touch optimization.
- **Modal Scroll Locking**: Dedicated `ModalScrollLock` component preventing body scroll bleed-through when dialogs, reports, or modals are active.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | `19.2.8` | Component architecture and reactive UI |
| **Vite** | `8.2.0` | Development server, bundling, and hot module replacement |
| **React Router** | `7.18.2` | Declarative client-side routing |
| **Monaco Editor** | `0.56.0` | Code editor powering the online IDE |
| **TipTap Editor** | `3.31.3` | Headless rich text WYSIWYG editor |
| **Lucide React** | `1.33.0` | Modern SVG icon system |
| **Marked** | `18.0.12` | Markdown parsing engine |
| **DOMPurify** | `3.4.15` | Client-side XSS sanitization |
| **Axios** | `1.19.0` | HTTP client with automatic auth token interceptors |
| **@react-oauth/google**| `0.12.2` | Google OAuth 2.0 frontend authentication |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | `>= 18.0.0` | Server runtime (ES Modules) |
| **Express.js** | `4.19.2` | REST API framework and routing |
| **MongoDB & Mongoose** | `8.24.4` | Document database schemas, indexes, and queries |
| **mongodb-memory-server** | `10.4.3` | Zero-configuration in-memory database for local dev |
| **JWT (jsonwebtoken)** | `9.0.2` | Stateless authentication tokens |
| **bcryptjs** | `2.4.3` | Password hashing with cryptographic salts |
| **Google Auth Library** | `9.15.1` | Google OAuth token verification on the backend |
| **Helmet** | `8.3.0` | Secure HTTP response headers |
| **Express Rate Limit** | `7.5.1` | Rate limiting to prevent brute force and abuse |
| **Express Validator** | `7.3.2` | Request payload schema validation |
| **Multer & Cloudinary** | `2.3.0 / 2.11.0` | Image processing and cloud asset hosting |
| **Nodemailer** | `10.0.3` | Async email delivery queue for OTPs and notices |
| **Groq AI** | API | Automated AI background content moderation |

---

## Directory Structure

```
GLUG_NEW/
├── client/
│   ├── public/                    # Static assets, logos, and defaults
│   ├── src/
│   │   ├── api.js                 # Centralized Axios client & API helpers
│   │   ├── App.jsx                # Application root with route registry
│   │   ├── index.css              # Global styles, CSS design tokens, and themes
│   │   ├── main.jsx               # Client application entry point
│   │   ├── components/
│   │   │   ├── admin/             # Admin moderation tables, metric cards, modals
│   │   │   ├── auth/              # Login, register, and password reset components
│   │   │   ├── common/            # Navbar, TopBar, Footer, Modals, MarkdownRenderer
│   │   │   ├── events/            # Event cards, calendar components, detail widgets
│   │   │   ├── forum/             # PostCard, CommentItem, TagSelector, VotePill
│   │   │   ├── home/              # Hero banner, feature highlights, stats widgets
│   │   │   ├── layout/            # Layout shell, Sidebar, TopBar navigation
│   │   │   ├── linux/             # Virtual Linux Terminal emulator & nano editor
│   │   │   └── resources/         # Resource cards, category pills, filter drawers
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Authentication state, session handling, theme sync
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Activity feed, trending topics, quick create
│   │   │   ├── ForYou.jsx         # Personalized recommendations and feed
│   │   │   ├── Forum.jsx          # Filterable discussions, search, categories
│   │   │   ├── PostDetail.jsx     # Discussion view, threaded comments, voting
│   │   │   ├── Events.jsx         # Upcoming and past events directory
│   │   │   ├── EventDetail.jsx    # Event description, speakers, gallery, registration
│   │   │   ├── TerminalPage.jsx   # Dedicated full-page terminal workstation
│   │   │   ├── compiler/          # Multi-language IDE & Monaco compiler
│   │   │   ├── Resources.jsx      # Curated learning roadmaps & cheatsheets
│   │   │   ├── Categories.jsx     # Topic directory with post counts
│   │   │   ├── Members.jsx        # Community members leaderboard
│   │   │   ├── Profile.jsx        # Member profile, activity history, bookmarks
│   │   │   ├── Settings.jsx       # Account, security, preferences, theme
│   │   │   ├── Chat.jsx           # Direct messaging and chat conversations
│   │   │   ├── AdminDashboard.jsx # Analytics, moderation, appeals, role manager
│   │   │   └── About.jsx          # Club mission, history, and executive team
│   │   └── utils/                 # Date formatters, sanitizers, vote calculations
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── index.js               # Express application entrypoint & middleware
│   │   ├── config/
│   │   │   ├── db.js              # MongoDB connection & in-memory dev fallback
│   │   │   ├── cloudinary.js      # Cloudinary storage configuration
│   │   │   └── mail.js            # Nodemailer transporter & async delivery queue
│   │   ├── middleware/
│   │   │   ├── auth.js            # requireAuth, optionalAuth, requireAdmin, requireContentAdmin
│   │   │   └── upload.js          # Multer memory storage handler
│   │   ├── models/
│   │   │   ├── User.js            # Member profiles, roles, terminal state, strikes
│   │   │   ├── Post.js            # Discussions, tags, pinned status, scores, reports
│   │   │   ├── Comment.js         # Nested threaded replies, reports, flags
│   │   │   ├── Event.js           # Workshop & event schedules, speakers, gallery
│   │   │   ├── Resource.js        # Curated technical roadmap items & files
│   │   │   ├── Notification.js    # In-app member notifications
│   │   │   ├── Conversation.js    # Direct messaging chat channels
│   │   │   ├── Message.js         # Direct chat messages
│   │   │   ├── Report.js          # Member-submitted content reports
│   │   │   ├── Appeal.js          # Moderation strike & ban review appeals
│   │   │   ├── ModerationLog.js   # Audit trails for administrative actions
│   │   │   ├── Vote.js            # Vote registry for idempotency
│   │   │   ├── Bookmark.js        # Saved discussion references
│   │   │   └── EmailOtp.js        # Email verification and password recovery codes
│   │   ├── routes/
│   │   │   ├── auth.routes.js     # Register, login, OTP verification, password reset
│   │   │   ├── posts.routes.js    # Posts CRUD, voting, comments, feed, reports
│   │   │   ├── events.routes.js   # Events CRUD, gallery uploads, RSVP stats
│   │   │   ├── resource.routes.js # Roadmaps, categories, downloads, bookmarks
│   │   │   ├── notification.routes.js # Member alerts, unread counts, mark read
│   │   │   ├── chat.routes.js     # Conversations, messages, unread count
│   │   │   ├── user.routes.js     # Profiles, team list, appeals, terminal sync
│   │   │   ├── admin.routes.js    # Metrics, roles, ban/unban, reports, appeals
│   │   │   ├── compile.routes.js  # Judge0 remote compilation proxy
│   │   │   └── upload.routes.js   # Image upload endpoint
│   │   ├── scripts/
│   │   │   ├── seed.js            # Core seed script with users, posts, comments
│   │   │   ├── seedResources.js   # Seed technical resources across 12 tracks
│   │   │   ├── seedEvents.js      # Seed demo workshops and hackathons
│   │   │   └── initDb.js          # Database index initializer
│   │   └── utils/
│   │       ├── contentModerator.js# Groq AI moderation scanner & strike pipeline
│   │       └── notificationService.js # In-app notification creation helper
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **MongoDB** (Optional for local development): A local MongoDB instance or MongoDB Atlas cluster. If `MONGODB_URI` is omitted or unavailable, the backend boots an isolated `mongodb-memory-server` automatically.

---

### 1. Backend Setup

```bash
cd server
npm install

# Copy environment variables
cp .env.example .env

# Initialize database indexes
npm run db:init

# Seed initial categories, demo discussions, resources, and events
npm run seed

# Launch the backend server in development mode (auto-restarts with nodemon)
npm run dev
```

The server will start at `http://localhost:5000`.

---

### 2. Frontend Setup

In a new terminal window:

```bash
cd client
npm install

# Start the Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

### 3. Environment Variables Reference

#### Server (`server/.env`)
| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `5000` | Port for the Express backend |
| `MONGODB_URI` | `mongodb://localhost:27017/glug` | Connection URI. Leave empty to use auto-started in-memory MongoDB |
| `JWT_SECRET` | `change-me-in-production` | Secret key used to sign and verify JSON Web Tokens |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL for links sent in email communications |
| `GOOGLE_CLIENT_ID` | `(optional)` | Google OAuth 2.0 Web Client ID for authentication |
| `CLOUDINARY_CLOUD_NAME` | `(optional)` | Cloudinary cloud identifier for image uploads |
| `CLOUDINARY_API_KEY` | `(optional)` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | `(optional)` | Cloudinary API Secret |
| `GROQ_API_KEY` | `(optional)` | Groq API Key for background AI content moderation |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | Model identifier for Groq AI analysis |
| `SMTP_USER` | `(optional)` | SMTP email address for sending system emails |
| `SMTP_PASS` | `(optional)` | SMTP password / App password |
| `SMTP_SERVICE` | `gmail` | Email service provider |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP host server (if custom provider) |
| `SMTP_PORT` | `587` | SMTP port |

#### Client (`client/.env`)
| Variable | Default Value | Description |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | `(optional)` | Google OAuth Client ID for the Google sign-in button |
| `VITE_JUDGE0_API_KEY` | `(optional)` | Judge0 CE API key (defaults to free tier `https://ce.judge0.com`) |

---

### 4. Database Initialization & Seeding

The backend includes individual and combined seed utilities:

```bash
cd server

# Initialize indexes
npm run db:init

# Full platform seed (users, admin, discussions, comments)
npm run seed

# Seed curated roadmaps & cheatsheets across 12 tracks
npm run seed:resources

# Seed workshops, meetups, and hackathons
npm run seed:events
```

---

### 5. Production Build

To build the frontend production bundle:

```bash
cd client
npm run build
```

To preview the production bundle locally:

```bash
npm run preview
```

---

## Complete API Reference

All requests accept and return `application/json`. Authenticated routes require an `Authorization: Bearer <token>` header.

### Authentication & Verification (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/send-otp` | Send registration or password reset OTP | No |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit OTP code | No |
| `GET` | `/api/auth/check-username` | Check username availability | No |
| `POST` | `/api/auth/register` | Register new account (`username, email, password, verificationToken`) | No |
| `POST` | `/api/auth/login` | Login with username/email & password | No |
| `POST` | `/api/auth/google` | Sign in / register with Google credential token | No |
| `GET` | `/api/auth/me` | Fetch currently authenticated user session | Yes |
| `PUT` | `/api/auth/me` | Update bio, avatar, skills, theme, or social links | Yes |
| `POST` | `/api/auth/change-password` | Update account password | Yes |
| `POST` | `/api/auth/forgot-password` | Request password reset code via email | No |
| `POST` | `/api/auth/reset-password` | Reset password using verified reset code | No |
| `POST` | `/api/auth/banned-appeal` | Submit ban appeal using temporary appeal token | No |

### Posts & Discussions (`/api/posts`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/posts` | List posts with category, tag, search, and tab filters | No (Optional) |
| `GET` | `/api/posts/feed` | Personalized "For You" activity feed | No (Optional) |
| `GET` | `/api/posts/meta/stats` | Forum global metrics (posts, comments, authors) | No |
| `GET` | `/api/posts/:id` | Fetch discussion by ID with author info and vote status | No (Optional) |
| `POST` | `/api/posts` | Create new discussion (`title, body, category, tags`) | Yes |
| `PUT` | `/api/posts/:id` | Edit discussion title, content, or tags | Author / Admin |
| `DELETE` | `/api/posts/:id` | Delete discussion and cascade delete replies | Author / Admin |
| `POST` | `/api/posts/:id/vote` | Cast or undo upvote/downvote (`{ value: 1 \| -1 }`) | Yes |
| `POST` | `/api/posts/:id/bookmark` | Toggle bookmark on a discussion | Yes |
| `POST` | `/api/posts/:id/report` | Report a discussion for policy violations | Yes |
| `PUT` | `/api/posts/:id/pin` | Pin or unpin discussion to category top | Admin |
| `PUT` | `/api/posts/:id/lock` | Lock or unlock replies on discussion | Admin |

### Comments & Replies (`/api/posts/:id/comments`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/posts/:id/comments` | Fetch threaded comment tree for a post | No (Optional) |
| `POST` | `/api/posts/:id/comments` | Post root comment or reply (`{ body, parentComment }`) | Yes |
| `DELETE` | `/api/posts/:id/comments/:commentId` | Delete comment and all its nested children | Author / Admin |
| `POST` | `/api/posts/:id/comments/:commentId/vote` | Vote on a comment (`{ value: 1 \| -1 }`) | Yes |
| `POST` | `/api/posts/:id/comments/:commentId/report` | Report a comment for policy violations | Yes |

### Events & Workshops (`/api/events`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/events` | List events with category, type (`upcoming\|past`), and search | No |
| `GET` | `/api/events/upcoming` | Fetch upcoming published events | No |
| `GET` | `/api/events/stats` | Event metrics (total, upcoming, past, photo count) | No |
| `GET` | `/api/events/:idOrSlug` | Fetch event details by ObjectId or URL slug | No |
| `POST` | `/api/events` | Create new event (`title, date, venue, speakers, banner`) | Admin / Content Admin |
| `PUT` | `/api/events/:id` | Update event details | Admin / Content Admin |
| `DELETE` | `/api/events/:id` | Delete event | Admin / Content Admin |
| `POST` | `/api/events/:id/gallery` | Add photo to event recap gallery | Admin / Content Admin |
| `DELETE` | `/api/events/:id/gallery/:photoId` | Remove photo from event recap gallery | Admin / Content Admin |

### Curated Resources (`/api/resources`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/resources` | List learning resources (`?category=...&difficulty=...&search=...`) | No (Optional) |
| `GET` | `/api/resources/categories` | List all 12 roadmap tracks with item counts | No |
| `GET` | `/api/resources/featured` | Fetch curated featured guides and roadmaps | No |
| `GET` | `/api/resources/stats` | Resource metrics (total, categories, downloads) | No |
| `GET` | `/api/resources/:idOrSlug` | Fetch resource by ID or slug | No (Optional) |
| `POST` | `/api/resources` | Create new learning resource | Admin / Content Admin |
| `PUT` | `/api/resources/:id` | Update resource content or attachments | Admin / Content Admin |
| `DELETE` | `/api/resources/:id` | Delete resource | Admin / Content Admin |
| `POST` | `/api/resources/:id/bookmark` | Toggle resource bookmark | Yes |
| `POST` | `/api/resources/:id/download` | Increment resource download count | No |

### Notifications Center (`/api/notifications`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/notifications` | Fetch recent in-app notifications for authenticated member | Yes |
| `GET` | `/api/notifications/unread-count` | Get total unread notifications count | Yes |
| `PUT` | `/api/notifications/read-all` | Mark all notifications as read | Yes |
| `PUT` | `/api/notifications/:id/read` | Mark specific notification as read | Yes |

### Direct Messaging (`/api/chat`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/chat/unread-count` | Get total unread direct messages count | Yes |
| `GET` | `/api/chat/conversations` | List user's active conversations | Yes |
| `GET` | `/api/chat/conversations/with/:userId` | Get or create conversation with specific user | Yes |
| `GET` | `/api/chat/conversations/:id/messages` | Fetch message history in conversation | Yes |
| `POST` | `/api/chat/conversations/:id/messages` | Send a message (`{ content }`) | Yes |

### Member Profiles & Terminal State (`/api/users`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users/team` | Fetch GLUG community team and staff members | No |
| `GET` | `/api/users/search` | Search community members by query | No |
| `GET` | `/api/users/:id` | Fetch public member profile and statistics | No |
| `GET` | `/api/users/:id/posts` | Fetch discussions authored by member | No |
| `GET` | `/api/users/me/terminal` | Retrieve member's saved virtual filesystem state | Yes |
| `PUT` | `/api/users/me/terminal` | Save persistent virtual filesystem & history (`fs, cwd, history`) | Yes |
| `GET` | `/api/users/me/moderation-history` | View account strikes, restriction timers, and past appeals | Yes |
| `POST` | `/api/users/me/appeals` | Submit appeal against strike, restriction, or hidden content | Yes |

### Admin Moderation & Operations (`/api/admin`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Platform-wide metrics (users, posts, reports, strikes, appeals) | Admin |
| `GET` | `/api/admin/users` | List members with roles, strikes, and ban status | Admin |
| `PUT` | `/api/admin/users/:id/role` | Update user role (`student`, `content_admin`, `moderator`, `admin`) | Admin |
| `PUT` | `/api/admin/users/:id/ban` | Issue manual ban with reason and duration | Admin |
| `PUT` | `/api/admin/users/:id/unban` | Lift ban and restore member privileges | Admin |
| `DELETE` | `/api/admin/users/:id` | Permanently delete account and clean up associated content | Admin |
| `GET` | `/api/admin/team` | List community team leads and coordinators | Admin |
| `PUT` | `/api/admin/team/:userId` | Assign community leadership designation | Admin |
| `DELETE` | `/api/admin/team/:userId` | Remove member from community leadership roster | Admin |
| `GET` | `/api/admin/moderation/flagged` | List AI-flagged posts and comments | Admin |
| `PUT` | `/api/admin/moderation/posts/:id/restore` | Restore flagged post to public view | Admin |
| `PUT` | `/api/admin/moderation/comments/:id/restore` | Restore flagged comment to public view | Admin |
| `DELETE` | `/api/admin/moderation/posts/:id` | Permanently remove flagged post | Admin |
| `DELETE` | `/api/admin/moderation/comments/:id` | Permanently remove flagged comment | Admin |
| `GET` | `/api/admin/moderation/reports` | View pending member-submitted reports | Admin |
| `PUT` | `/api/admin/moderation/reports/:id/override` | Dismiss or uphold report with strike action | Admin |
| `GET` | `/api/admin/moderation/banned-users` | List suspended accounts | Admin |
| `GET` | `/api/admin/moderation/logs` | View administrative audit action logs | Admin |
| `GET` | `/api/admin/moderation/appeals` | List pending moderation appeals | Admin |
| `PUT` | `/api/admin/moderation/appeals/:id/resolve` | Approve or reject appeal (revokes strikes & restores content) | Admin |

### Cloud Code Compilation (`/api/compile`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/compile` | Compile and execute source code via Judge0 CE cloud | No |

Payload format:
```json
{
  "language": "cpp",
  "code": "#include <iostream>\nint main() { std::cout << \"Hello GLUG!\"; return 0; }",
  "stdin": ""
}
```

### Media Uploads (`/api/upload`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/upload` | Upload image file (`multipart/form-data`) to Cloudinary | Yes |

---

## In-Browser Linux Terminal Command Reference

| Command | Syntax | Description |
|---|---|---|
| `ls` | `ls [-l] [-a] [path]` | List directory contents with file metadata and permissions |
| `cd` | `cd [dir]` | Change current working directory (`~`, `..`, relative, absolute) |
| `pwd` | `pwd` | Print current working directory path |
| `cat` | `cat <file>` | Display content of one or more text files |
| `nano` | `nano <file>` | Open interactive full-screen text editor |
| `python` | `python [file]`, `python3` | Launch interactive Python REPL or run script file |
| `mkdir` | `mkdir [-p] <dir>` | Create a new directory (supports nested `-p`) |
| `rmdir` | `rmdir <dir>` | Remove an empty directory |
| `rm` | `rm [-r] [-f] <file/dir>` | Remove files or directories recursively (`-r`) |
| `touch` | `touch <file>` | Create an empty file or update timestamp |
| `cp` | `cp [-r] <src> <dest>` | Copy files or directories |
| `mv` | `mv <src> <dest>` | Move or rename files and directories |
| `tree` | `tree [path]` | Display recursive visual directory tree |
| `find` | `find [path] -name <pattern>` | Search for files by name inside directory tree |
| `grep` | `grep [-i] [-n] <text> [file]` | Search text inside files with line numbers |
| `head` | `head [-n count] <file>` | Output the first lines of a file |
| `tail` | `tail [-n count] <file>` | Output the last lines of a file |
| `wc` | `wc [-l] [-w] [-c] <file>` | Count lines, words, and characters in a file |
| `echo` | `echo [text] [> file]` | Print text or redirect output to file |
| `chmod` | `chmod <mode> <file>` | Modify file permission flags |
| `curl` | `curl <url>` | Simulate HTTP request and display response |
| `whoami` | `whoami` | Display active username |
| `hostname` | `hostname` | Display system host name |
| `uname` | `uname [-a]` | Display operating system and kernel information |
| `date` | `date` | Display current system date and time |
| `history` | `history` | List command history for current session |
| `clear` | `clear` | Clear terminal screen display |
| `ps` | `ps` | List simulated running processes |
| `kill` | `kill <pid>` | Terminate process by PID |
| `env` | `env` | Display environment variables |
| `export` | `export KEY=VALUE` | Set environment variable |
| `alias` | `alias name='command'` | Create custom command shortcut |
| `unalias` | `unalias name` | Remove command shortcut |
| `resetfs` | `resetfs` | Reset virtual filesystem to factory default |
| `neofetch` | `neofetch` | Print GLUG Linux ASCII banner and system metrics |
| `cowsay` | `cowsay <message>` | Display ASCII cow speech bubble |
| `fortune` | `fortune` | Print inspirational open-source quote |
| `help` | `help [command]` | Display comprehensive shell reference guide |

---

## Compiler Language & Runtime Matrix

| Language | Identifier | Runtime Engine | Interactive Stdin | File Extension |
|---|---|---|---|---|
| **Python** | `python` | Pyodide (In-Browser WASM) / Judge0 | Yes (`input()`) | `.py` |
| **C** | `c` | GCC 11.1.0 via Judge0 Cloud | Yes | `.c` |
| **C++** | `cpp` | G++ 11.1.0 via Judge0 Cloud | Yes | `.cpp` |
| **Java** | `java` | OpenJDK 17 via Judge0 Cloud | Yes | `.java` |
| **C#** | `csharp` | Mono 6.12 via Judge0 Cloud | Yes | `.cs` |
| **JavaScript**| `javascript`| Node.js 18 via Judge0 Cloud | Yes | `.js` |
| **TypeScript**| `typescript`| TypeScript via Judge0 Cloud | Yes | `.ts` |
| **Go** | `go` | Go 1.18 via Judge0 Cloud | Yes | `.go` |
| **Rust** | `rust` | Rustc 1.60 via Judge0 Cloud | Yes | `.rs` |

---

## Security, Moderation & Data Integrity

- **Stateless JWT Authentication**: Tokens signed with SHA-256 HMAC and verified on protected endpoints with automatic refresh handling.
- **Cryptographic Password Hashing**: Passwords salted and hashed with `bcryptjs` (salt rounds: 10).
- **Strict Content Sanitization**: All user-authored posts, comments, and bios are processed through `DOMPurify` before DOM rendering to eliminate XSS vectors.
- **Vote Idempotency & Zero-Floor Protection**: Unique compound indexes on the `Vote` collection prevent duplicate votes. Vote scores are capped at a minimum of 0 to stop negative brigading.
- **Automated AI Moderation Worker**: Background scanner using Groq models to analyze new content asynchronously without blocking API responses.
- **Comprehensive Three-Strike & Appeals System**: Progressive escalation for community guideline violations paired with formal appeal submission and email notices.
- **Rate Limiting & Abuse Prevention**: Tiered rate limiters protect authentication, OTP dispatch, and API endpoints against brute force attempts.
- **HTTP Header Hardening**: Configured via `helmet` with secure Content Security Policies, clickjacking prevention (`X-Frame-Options`), and MIME sniffing protection.
- **In-Memory Fallback Isolation**: When local MongoDB is not running, the system initializes an isolated `mongodb-memory-server` without failing server startup.

---

## Contributing

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/NewFeature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'feat: Add NewFeature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/NewFeature
   ```
5. Open a Pull Request on GitHub

---

## License

Distributed under the **MIT License**. See `LICENSE` for more information.