import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

export async function seedEvents() {
  const adminUser = await User.findOne({ role: 'admin' });
  const adminId = adminUser ? adminUser._id : null;

  const now = new Date();
  const pastDate1 = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);
  const pastDate2 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const upcomingDate1 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingDate2 = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
  const upcomingDate3 = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

  const sampleEvents = [
    {
      title: 'Linux Kernel Deep Dive: System Calls and eBPF',
      tagline: 'Master low-level Linux internals, trace system calls, and understand eBPF observability.',
      category: 'workshop',
      status: 'published',
      startDate: upcomingDate1,
      endDate: new Date(upcomingDate1.getTime() + 4 * 60 * 60 * 1000),
      time: '02:00 PM - 06:00 PM IST',
      locationType: 'in-person',
      venue: 'GLUG Lab, CS Department, Room 302',
      mapUrl: 'https://maps.google.com',
      bannerUrl: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1400&q=80',
      description: `### About the Workshop
Join us for an intensive hands-on exploration of the Linux Kernel. We will dismantle how modern Linux kernels handle user-space to kernel-space transitions, investigate system call dispatching, and deploy modern eBPF programs for real-time system tracing.

### Agenda
1. **Architecture Overview**: Protection rings, trap handlers, and context switches.
2. **System Call Internals**: Tracing syscall execution with \`strace\` and \`ftrace\`.
3. **Introduction to eBPF**: Safe kernel execution without kernel modules.
4. **Hands-on Lab**: Writing your first eBPF tracing hook using BCC / libbpf.

### Prerequisites
- Basic familiarity with C programming and terminal navigation.
- Bring your laptop with Linux installed (or a functional virtual machine).`,
      tags: ['Linux', 'Kernel', 'eBPF', 'Systems', 'FOSS'],
      registration: {
        enabled: true,
        url: 'https://forms.gle/glug-linux-internals',
        capacity: 60,
      },
      speakers: [
        {
          name: 'Arjun Sen',
          role: 'Systems Engineer',
          company: 'Kernel Lab',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          bio: 'Linux kernel contributor and open source enthusiast specializing in network drivers and eBPF observability.',
          github: 'https://github.com',
          linkedin: 'https://linkedin.com',
        },
      ],
      resources: [
        {
          label: 'Workshop GitHub Repository',
          url: 'https://github.com',
          type: 'code',
        },
        {
          label: 'Slides & Architecture Diagrams',
          url: 'https://speakerdeck.com',
          type: 'slides',
        },
      ],
      gallery: [
        {
          url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
          caption: 'Interactive coding lab session',
        },
        {
          url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
          caption: 'Speaker walk-through on kernel tracing architecture',
        },
      ],
      createdBy: adminId,
    },
    {
      title: 'GLUG HackFOSS 2026: 24-Hour Open Source Hackathon',
      tagline: 'Build impactful open source tools, collaborate with peers, and showcase software freedom.',
      category: 'hackathon',
      status: 'published',
      startDate: upcomingDate2,
      endDate: new Date(upcomingDate2.getTime() + 24 * 60 * 60 * 1000),
      time: '10:00 AM IST onwards',
      locationType: 'hybrid',
      venue: 'College Main Seminar Hall & Online Discord',
      virtualLink: 'https://discord.gg/glug',
      mapUrl: 'https://maps.google.com',
      bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1400&q=80',
      description: `### Unleash Open Source Creativity
HackFOSS is our flagship annual hackathon encouraging students to collaborate on free and open-source software solutions. Whether you want to develop Linux command-line utilities, privacy-first web apps, or developer tooling, this is the arena to build.

### Tracks
- **Developer Experience & CLI Tools**
- **Decentralized & Privacy-Respecting Apps**
- **Campus & Community Infrastructure**
- **Open Track (Build Anything FOSS!)**

### Perks & Awards
- Mentorship from industry engineers and senior club mentors.
- Exclusive GLUG merchandise, stickers, and hardware prizes.
- Food, midnight coffee, and 24-hour lab access.`,
      tags: ['Hackathon', 'OpenSource', 'React', 'Rust', 'Python', 'WebDev'],
      registration: {
        enabled: true,
        url: 'https://hackfoss.glug.dev',
        capacity: 120,
      },
      speakers: [
        {
          name: 'Priya Sharma',
          role: 'Maintainer & FOSS Evangelist',
          company: 'FOSS United',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
          bio: 'Community builder dedicated to empowering student developers to make their first upstream PRs.',
        },
      ],
      resources: [
        {
          label: 'Hackathon Starter Template',
          url: 'https://github.com',
          type: 'code',
        },
      ],
      gallery: [],
      createdBy: adminId,
    },
    {
      title: 'Modern Git & Upstream Contribution Workflow',
      tagline: 'Learn interactive rebasing, branch hygiene, merge conflict resolution, and submitting clean PRs.',
      category: 'workshop',
      status: 'published',
      startDate: upcomingDate3,
      time: '04:00 PM - 06:30 PM IST',
      locationType: 'virtual',
      virtualLink: 'https://meet.google.com/glug-git-workshop',
      bannerUrl: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?auto=format&fit=crop&w=1400&q=80',
      description: `### Master Your VCS Skills
Git is the backbone of open source development. Moving past simple \`git add\` and \`git commit\`, this session walks you through advanced git features used by professional software engineering teams worldwide.

### Session Outline
- Understanding the Git object store: Blobs, Trees, Commits, and Annotated Tags.
- Clean commit hygiene and writing good commit messages.
- Resolving tricky merge conflicts with confidence.
- Squash, reword, and reorder commits with \`git rebase -i\`.
- Forking, configuring remotes, and making upstream pull requests.`,
      tags: ['Git', 'VCS', 'OpenSource', 'GitHub', 'Workflow'],
      registration: {
        enabled: true,
        url: 'https://forms.gle/glug-git-workflow',
        capacity: 150,
      },
      speakers: [
        {
          name: 'Alex Chen',
          role: 'Senior Software Engineer',
          company: 'CloudNative Inc',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
          bio: 'Open source enthusiast with extensive experience maintaining large distributed software codebases.',
        },
      ],
      resources: [],
      gallery: [],
      createdBy: adminId,
    },
    {
      title: 'Freshers Linux Installation Drive & FOSS Onboarding',
      tagline: 'Helped 80+ students dual-boot Fedora and Ubuntu, configure dotfiles, and set up CLI tools.',
      category: 'installation-drive',
      status: 'published',
      startDate: pastDate1,
      endDate: new Date(pastDate1.getTime() + 6 * 60 * 60 * 1000),
      time: '10:00 AM - 04:00 PM IST',
      locationType: 'in-person',
      venue: 'Main Computer Centre, 2nd Floor',
      bannerUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1400&q=80',
      description: `### Event Recap & Achievements
Our annual Linux Installation Drive was an overwhelming success! Over 80 student participants successfully installed Linux on their machines, configured development tools, and joined our student developer community.

### Highlights
- 45+ Ubuntu LTS installations and 35+ Fedora Workstation dual-boots.
- Zero data loss incidents with assisted EFI partition management.
- Live dotfile configuration demos with Neovim, Zsh, and Tmux.
- Quick beginner tutorial on basic bash commands, package managers, and permissions.`,
      tags: ['Linux', 'Ubuntu', 'Fedora', 'DualBoot', 'Bash'],
      registration: {
        enabled: false,
      },
      speakers: [
        {
          name: 'GLUG Core Team',
          role: 'Technical Leads & Volunteers',
          avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=80',
          bio: 'Student organizers and Linux enthusiasts helping peers transition to free and open source software.',
        },
      ],
      resources: [
        {
          label: 'Installation Guide & Checklist',
          url: 'https://glug.dev/resources',
          type: 'notes',
        },
        {
          label: 'GLUG Dotfiles Repository',
          url: 'https://github.com',
          type: 'code',
        },
      ],
      gallery: [
        {
          url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
          caption: 'Students assembling for the initial distro overview lecture',
        },
        {
          url: 'https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&w=1200&q=80',
          caption: 'Peer mentoring during UEFI partition configuration',
        },
        {
          url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
          caption: 'Celebrating successful first-time Linux boot ups',
        },
        {
          url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
          caption: 'The GLUG volunteer team and organizers',
        },
      ],
      createdBy: adminId,
    },
    {
      title: 'Rust for Systems Programmers: Safe Concurrency & Memory',
      tagline: 'An engaging masterclass exploring ownership, borrow checker semantics, and memory safety without GC.',
      category: 'talk',
      status: 'published',
      startDate: pastDate2,
      time: '03:30 PM - 06:00 PM IST',
      locationType: 'in-person',
      venue: 'Auditorium Hall B',
      bannerUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1400&q=80',
      description: `### Retrospective & Session Summary
A deep dive into Rust systems programming hosted by our alumni and club mentors. Over 70 attendees explored how Rust prevents memory leaks, data races, and null pointer dereferences at compile time.

### Topics Covered
- Why C/C++ memory vulnerabilities matter in modern operating systems.
- Ownership, Borrowing, and Lifetimes explained visually.
- Concurrency with \`Arc\`, \`Mutex\`, and Channels.
- Building a multi-threaded web server from scratch in under 80 lines of Rust.`,
      tags: ['Rust', 'Systems', 'Concurrency', 'MemorySafety'],
      registration: {
        enabled: false,
      },
      speakers: [
        {
          name: 'Vikram Joshi',
          role: 'Staff Systems Architect',
          company: 'Rust Foundation Member',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
          bio: 'Passionate about type systems, formal verification, and writing zero-cost abstractions.',
        },
      ],
      resources: [
        {
          label: 'Code Samples & Mini Server',
          url: 'https://github.com',
          type: 'code',
        },
        {
          label: 'Talk Recording (YouTube)',
          url: 'https://youtube.com',
          type: 'recording',
        },
      ],
      gallery: [
        {
          url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
          caption: 'Live demonstration of the Rust borrow checker in action',
        },
        {
          url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
          caption: 'Interactive Q&A on compiler memory guarantees',
        },
      ],
      createdBy: adminId,
    },
  ];

  for (const item of sampleEvents) {
    const existing = await Event.findOne({ title: item.title });
    if (!existing) {
      await Event.create(item);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/glug';
  mongoose
    .connect(uri)
    .then(async () => {
      console.log('Seeding sample events...');
      await seedEvents();
      console.log('Event seeding completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding error', err);
      process.exit(1);
    });
}
