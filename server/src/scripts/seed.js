import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { Vote } from '../models/Vote.js';
import { Bookmark } from '../models/Bookmark.js';

const RELEVANT_IMAGES = {
  terminal: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=1200&auto=format&fit=crop&q=80',
  code: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
  workspace: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
  event: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
};

async function seed() {
  console.log('[Seed] Connecting to MongoDB...');
  await connectDB();

  console.log('[Seed] Checking existing users...');
  const allUsers = await User.find();

  if (!allUsers || allUsers.length === 0) {
    console.error('[Seed Error] No existing users found.');
    process.exit(1);
  }

  const uGlug = allUsers.find((u) => u.username === 'glug_jec') || allUsers[0];
  const uKaushik = allUsers.find((u) => u.username === 'Kaushik_Ranjan') || allUsers.find((u) => u.role === 'admin') || uGlug;

  console.log(`[Seed] Using posters: ${uGlug.username} (${uGlug._id}) & ${uKaushik.username} (${uKaushik._id})`);

  console.log('[Seed] Purging existing discussions and comments...');
  await Promise.all([
    Post.deleteMany({}),
    Comment.deleteMany({}),
    Vote.deleteMany({}),
    Bookmark.deleteMany({}),
  ]);

  console.log('[Seed] Creating properly formatted rich-text discussions...');

  const post1 = await Post.create({
    author: uGlug._id,
    title: 'GLUG JEC: Vision, Community Guidelines & Getting Started in 2026',
    body: `Welcome to the official GNU/Linux User Group discussion forum at Jorhat Engineering College.

<img src="${RELEVANT_IMAGES.workspace}" alt="GLUG Community" />

### Our Mission

We are a student-run technical community dedicated to open-source software, GNU/Linux adoption, systems programming, and peer learning.

### Guidelines for Forum Discussions

1. **Search Before Asking**: Review existing threads in the relevant category before creating a new post.
2. **Format Code Properly**: Always wrap command outputs and source snippets in fenced markdown blocks.
3. **Provide Error Logs**: When asking for debugging help, include your distribution name, kernel version (\`uname -r\`), and the exact terminal output.
4. **Respectful Collaboration**: Everyone was once a beginner. Help newcomers and share knowledge freely.

Check out the Resources section for recommended installation ISOs and guides!`,
    category: 'general',
    tags: ['glug', 'community', 'guidelines', 'jec', 'open-source'],
    voteScore: 28,
    views: 640,
    isPinned: true,
    isLocked: false,
  });

  const post2 = await Post.create({
    author: uKaushik._id,
    title: 'Complete Guide: Dual-Booting Fedora 41 or Ubuntu 24.04 with Windows 11 Safely',
    body: `Dual-booting is one of the most common requirements for university labs. Here is a battle-tested checklist to ensure your Windows installation and data stay intact.

### 1. Preparation in Windows

- **BitLocker Key**: If your device uses BitLocker, print or save your 48-digit recovery key before touching disk partitions.
- **Disable Fast Startup**: Open Control Panel -> Power Options -> "Choose what the power buttons do" -> Uncheck "Turn on fast startup". Windows Fast Startup leaves NTFS partitions locked in hibernation, preventing Linux from mounting them cleanly.
- **Shrink Partition**: Use Windows Disk Management (\`diskmgmt.msc\`) to shrink drive C: by at least 60 GB - 100 GB. Leave this space as unallocated.

### 2. Live USB Creation

- Use **Ventoy** to create a bootable USB drive. Simply drag-and-drop the Fedora Workstation or Ubuntu Desktop ISO into the USB.
- If using Rufus, choose **GPT** partition scheme and **UEFI (non-CSM)** target system.

### 3. Installation Steps

- Choose "Custom / Something Else" partitioning if you want fine control.
- Assign the unallocated space to root (\`/\`) formatted with \`btrfs\` (Fedora default) or \`ext4\` (Ubuntu).
- Do **NOT** format the existing Windows EFI system partition. Simply mount it to \`/boot/efi\`.

### 4. Intel VMD / RST Note

If the installer does not see your NVMe SSD, you may need to switch SATA/VMD controller mode from RST to AHCI/NVMe in BIOS settings.`,
    category: 'installation',
    tags: ['installation', 'dual-boot', 'windows11', 'fedora', 'ubuntu', 'uefi'],
    voteScore: 24,
    views: 512,
    isPinned: false,
    isLocked: false,
  });

  const post3 = await Post.create({
    author: uGlug._id,
    title: 'Essential Terminal Upgrades: ripgrep, fd, fzf, and Shell Aliases for Faster Workflows',
    body: `Modern CLI tools written in Rust and Go have significantly improved shell productivity over legacy coreutils. Here are the most effective replacements for everyday programming tasks.

<img src="${RELEVANT_IMAGES.terminal}" alt="Modern CLI Terminal" />

### Key Replacements

- **ripgrep (\`rg\`)** instead of \`grep\`: Recursively searches directory trees with multi-threading and automatically respects \`.gitignore\` files.
- **fd** instead of \`find\`: Simple syntax by default (e.g., \`fd pattern\`) and color-coded output.
- **eza** instead of \`ls\`: Shows file icons, permissions in human-readable format, and git repository status right in the directory list.
- **bat** instead of \`cat\`: Automatic syntax highlighting, line numbers, and git diff markers in file previews.

### Interactive Fuzzy Finding with fzf

Install \`fzf\` and append this to your \`~/.bashrc\` or \`~/.zshrc\`:

\`\`\`bash
source <(fzf --bash)  # For Bash 4.4+
# Or in zsh:
source <(fzf --zsh)
\`\`\`

Pressing **Ctrl + R** will now provide fuzzy searchable command history with interactive previews.`,
    category: 'command-line',
    tags: ['command-line', 'terminal', 'bash', 'zsh', 'fzf', 'productivity'],
    voteScore: 21,
    views: 430,
    isPinned: false,
    isLocked: false,
  });

  const post4 = await Post.create({
    author: uKaushik._id,
    title: 'Setting up a Modern C/C++ and Rust Development Toolchain on Linux for University Labs',
    body: `For Computer Science students entering Data Structures, Operating Systems, and Systems Programming courses, having an integrated Linux toolchain makes debugging straightforward.

<img src="${RELEVANT_IMAGES.code}" alt="C and Rust Toolchain" />

### Essential Packages (Ubuntu / Debian)

\`\`\`bash
sudo apt update
sudo apt install build-essential gdb valgrind clang-format clangd cmake ninja-build
\`\`\`

### Essential Packages (Fedora)

\`\`\`bash
sudo dnf groupinstall "C Development Tools and Libraries"
sudo dnf install gdb valgrind clang-tools-extra cmake ninja-build
\`\`\`

### Setting up Rust

Always use \`rustup\` rather than distribution package managers to keep toolchains updated:

\`\`\`bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustup component add rust-analyzer clippy rustfmt
\`\`\`

### Tip: Clang Language Server in VS Code / Neovim

Install the **clangd** extension instead of default Microsoft C/C++ intellisense for faster indexing and precise cross-reference navigation.`,
    category: 'programming',
    tags: ['programming', 'c-lang', 'rust', 'gcc', 'gdb', 'toolchain'],
    voteScore: 19,
    views: 388,
    isPinned: false,
    isLocked: false,
  });

  const post5 = await Post.create({
    author: uGlug._id,
    title: 'Choosing Your First Linux Distribution: Fedora Workstation vs Linux Mint for Students',
    body: `We frequently get asked which Linux distribution is ideal for university coursework. While distros like Arch have enthusiastic followings, we strongly advise newcomers to begin with either **Linux Mint** or **Fedora Workstation**.

### Linux Mint (Cinnamon Edition)

- **Strengths**: Familiar Windows-like taskbar and start menu, based on Ubuntu LTS, automatic hardware driver manager for NVIDIA GPUs, stable software repository.
- **Best For**: Students who want their laptop ready for college assignments without learning new desktop paradigm shortcuts on day one.

### Fedora Workstation (GNOME)

- **Strengths**: Clean vanilla GNOME desktop, cutting-edge Linux kernels (ideal for newer 13th/14th Gen Intel and AMD Ryzen laptops), native Flatpak support, PipeWire and Wayland out of the box.
- **Best For**: Students interested in modern cloud-native standards, Red Hat ecosystem tools, and developer-centric defaults.

Both choices are fully supported during GLUG install sessions!`,
    category: 'linux',
    tags: ['linux', 'distro', 'beginners', 'fedora', 'mint', 'comparison'],
    voteScore: 17,
    views: 360,
    isPinned: false,
    isLocked: false,
  });

  const post6 = await Post.create({
    author: uKaushik._id,
    title: 'Top Open-Source Software Alternatives for Engineering Students in 2026',
    body: `You do not need to rely on pirated or proprietary software during your college degree. Here is a verified list of high-quality FOSS tools that run natively on Linux:

- **Office Documents**: **LibreOffice 24+** or **OnlyOffice** (100% compatibility with DOCX/PPTX formatting).
- **Notes & Knowledge Base**: **Obsidian** (local markdown files with math LaTeX rendering) or **Logseq**.
- **Diagrams & Vector Graphics**: **Inkscape** and **Draw.io Desktop**.
- **Circuit Simulation & EDA**: **KiCad 8** for schematic capture and PCB design.
- **PDF Reading & Annotation**: **Sioyek** (designed for technical papers with smart reference lookups) and **Okular**.
- **Code Editors**: **VS Code (VSCodium)**, **Neovim**, and **Zed**.

Feel free to share any other applications you rely on for coursework!`,
    category: 'tools-apps',
    tags: ['tools-apps', 'open-source', 'alternatives', 'foss', 'student-tools'],
    voteScore: 15,
    views: 310,
    isPinned: false,
    isLocked: false,
  });

  const post7 = await Post.create({
    author: uGlug._id,
    title: 'How to Make Your First Open-Source Contribution on GitHub: A Step-by-Step Guide',
    body: `Contributing to open source builds real-world engineering skills and git proficiency. Here is how to submit your first Pull Request cleanly:

### 1. Finding a Target Repository

Look for repositories marked with \`good-first-issue\` or \`documentation\` labels on GitHub.

### 2. The Contribution Workflow

1. **Fork the Repository**: Click Fork on the upstream GitHub page to create your copy.
2. **Clone Locally**:

\`\`\`bash
git clone https://github.com/your-username/repo-name.git
cd repo-name
git remote add upstream https://github.com/original-owner/repo-name.git
\`\`\`

3. **Create a Topic Branch**:

\`\`\`bash
git checkout -b fix-typo-readme
\`\`\`

4. **Make Your Changes and Commit** with clear message formatting:

\`\`\`bash
git commit -m "docs: clarify installation steps in README"
\`\`\`

5. **Sync with Upstream before Push**:

\`\`\`bash
git fetch upstream
git rebase upstream/main
\`\`\`

6. **Push and Open PR**: Submit the pull request through the GitHub web UI and follow the project PR template.`,
    category: 'open-source',
    tags: ['open-source', 'github', 'git', 'first-pr', 'collaboration'],
    voteScore: 16,
    views: 325,
    isPinned: false,
    isLocked: false,
  });

  const post8 = await Post.create({
    author: uKaushik._id,
    title: 'Fixing Common Wi-Fi, Bluetooth, and Audio Issues after Installing Linux on Laptops',
    body: `Encountering hardware quirks right after installing Linux on a modern laptop is solvable. Here are the most effective troubleshooting checks:

### 1. Identifying the Chipset

Run this in your terminal to see exact hardware controller details:

\`\`\`bash
lspci -nnk | grep -iA3 net
lsusb
\`\`\`

### 2. Wi-Fi Card Driver Checks

- **Realtek (RTL8821CE / RTL8852AE)**: Some Realtek chips require out-of-tree DKMS modules. On Ubuntu:
  \`\`\`bash
  sudo apt install dkms git
  sudo apt install rtl8821ce-dkms
  \`\`\`
- **Intel Wi-Fi**: Intel AX200/AX210/BE200 modules are built into the official Linux kernel. Ensure \`linux-firmware\` is installed.

### 3. Audio & Microphone Troubleshooting

Modern Linux systems use **PipeWire** as the multimedia server. If your audio inputs are muted:

\`\`\`bash
systemctl --user restart pipewire wireplumber
pavucontrol
\`\`\``,
    category: 'help',
    tags: ['help', 'hardware', 'wifi', 'drivers', 'troubleshooting', 'pipewire'],
    voteScore: 14,
    views: 290,
    isPinned: false,
    isLocked: false,
  });

  const post9 = await Post.create({
    author: uGlug._id,
    title: 'Recap: GLUGINIT 2026 Linux Installation Fest and Highlights',
    body: `A big thank you to all 70+ students who joined us for GLUGINIT at the Computer Science Lab!

<img src="${RELEVANT_IMAGES.event}" alt="GLUGINIT Event Recap" />

### Event Summary

- Assisted over 45 first-year and second-year students in dual-booting Linux alongside Windows.
- Successfully resolved EFI boot entry conflicts on Acer, Asus, and Lenovo laptops.
- Live demonstration of shell scripting, package management, and git collaboration.

### Slides and Resources

Presentation slides, command reference cheat sheets, and post-installation checklists have been uploaded to the Resources tab. Drop any remaining questions below!`,
    category: 'events',
    tags: ['events', 'gluginit', 'installfest', 'recap', 'jec'],
    voteScore: 22,
    views: 470,
    isPinned: false,
    isLocked: false,
  });

  const post10 = await Post.create({
    author: uKaushik._id,
    title: 'Understanding C Memory Management: Stack vs Heap, Pointers, and Sanitizers',
    body: `Segmentation faults (\`SIGSEGV\`) are a rite of passage for students learning C. Understanding how virtual memory is allocated solves most common bugs.

### Stack vs Heap Allocation

- **Stack**: Local variables inside functions. Automatically allocated and freed upon function return. Fast, but limited in size. Never return a pointer to a stack-allocated local variable!
- **Heap**: Dynamic memory via \`malloc\`, \`calloc\`, or \`realloc\`. Must be explicitly released using \`free()\`. Forgetting to free leads to memory leaks; freeing twice leads to double-free crashes.

### GCC AddressSanitizer (ASan)

Instead of guessing where memory corruption occurs, compile your lab assignments with AddressSanitizer:

\`\`\`bash
gcc -g -fsanitize=address -fsanitize=undefined main.c -o main
./main
\`\`\`

If your program reads past an allocated array boundary or uses memory after freeing it, ASan will print the exact source file line number immediately.`,
    category: 'programming',
    tags: ['programming', 'c-lang', 'memory', 'pointers', 'debugging'],
    voteScore: 18,
    views: 345,
    isPinned: false,
    isLocked: false,
  });

  console.log('[Seed] Adding realistic upvotes to posts...');
  const postsList = [post1, post2, post3, post4, post5, post6, post7, post8, post9, post10];

  for (const post of postsList) {
    const voterSample = allUsers.slice(0, Math.min(allUsers.length, Math.max(3, Math.floor(Math.random() * 8) + 4)));
    for (const voter of voterSample) {
      await Vote.create({ user: voter._id, post: post._id, value: 1 });
    }
  }

  console.log('[Seed] Adding meaningful comments and replies authored by glug_jec & Kaushik_Ranjan...');

  const c1_1 = await Comment.create({
    post: post1._id,
    author: uKaushik._id,
    body: '<p>Looking forward to collaborating on the portal projects this semester! We will be hosting onboarding sessions for first-year students every alternate Wednesday in CS Lab 2.</p>',
    voteScore: 4,
  });

  await Comment.create({
    post: post1._id,
    author: uGlug._id,
    parentComment: c1_1._id,
    body: '<p>We have three active working tracks: Systems & Linux, Web Development & Portal, and Competitive Programming & FOSS. Everyone is welcome to contribute!</p>',
    voteScore: 5,
  });

  const c2_1 = await Comment.create({
    post: post2._id,
    author: uGlug._id,
    body: '<p>What partition size would you recommend for root if students plan to install Docker and language toolchains?</p>',
    voteScore: 3,
  });

  const c2_2 = await Comment.create({
    post: post2._id,
    author: uKaushik._id,
    parentComment: c2_1._id,
    body: '<p>Allocate at least <strong>80 GB</strong> for root if using Docker. Docker container layers and build caches in <code>/var/lib/docker</code> can grow quickly over time.</p>',
    voteScore: 4,
  });

  await Comment.create({
    post: post2._id,
    author: uGlug._id,
    parentComment: c2_2._id,
    body: '<p>You can also run <code>docker system prune -a</code> periodically to reclaim disk space from stopped containers and unused images.</p>',
    voteScore: 3,
  });

  const c3_1 = await Comment.create({
    post: post3._id,
    author: uKaushik._id,
    body: '<p><code>ripgrep</code> is incredible. Searching through multi-thousand line codebases takes under 100 milliseconds compared to minutes with grep.</p>',
    voteScore: 4,
  });

  await Comment.create({
    post: post3._id,
    author: uGlug._id,
    parentComment: c3_1._id,
    body: '<p>Combine it with <code>fzf</code> using <code>rg --files | fzf</code> to create an instant interactive file finder for any repository!</p>',
    voteScore: 3,
  });

  const c4_1 = await Comment.create({
    post: post4._id,
    author: uGlug._id,
    body: '<p>How do you recommend running <code>valgrind</code> to detect memory leaks in C lab assignments?</p>',
    voteScore: 3,
  });

  await Comment.create({
    post: post4._id,
    author: uKaushik._id,
    parentComment: c4_1._id,
    body: '<p>Compile with debug symbols using <code>gcc -g main.c -o main</code>, then run: <code>valgrind --leak-check=full --show-leak-kinds=all ./main</code>. It shows the exact line number where leaked memory was allocated.</p>',
    voteScore: 5,
  });

  const c5_1 = await Comment.create({
    post: post5._id,
    author: uKaushik._id,
    body: '<p>Installed Fedora 41 on a ThinkPad recently and battery life with Wayland and GNOME has been very solid. Flatpak integration through GNOME Software is seamless.</p>',
    voteScore: 4,
  });

  await Comment.create({
    post: post5._id,
    author: uGlug._id,
    parentComment: c5_1._id,
    body: '<p>Install <code>power-profiles-daemon</code> or <code>auto-cpufreq</code> if you want even better battery endurance during long campus sessions.</p>',
    voteScore: 3,
  });

  const c7_1 = await Comment.create({
    post: post7._id,
    author: uKaushik._id,
    body: '<p>What should students do if the upstream repository receives new commits before their Pull Request is reviewed?</p>',
    voteScore: 3,
  });

  await Comment.create({
    post: post7._id,
    author: uGlug._id,
    parentComment: c7_1._id,
    body: '<p>Fetch upstream and rebase your branch: <code>git fetch upstream && git rebase upstream/main</code>. Resolve any conflicts locally, then push with <code>git push --force-with-lease origin your-branch</code>.</p>',
    voteScore: 4,
  });

  const c8_1 = await Comment.create({
    post: post8._id,
    author: uGlug._id,
    body: '<p>Restarting PipeWire via <code>systemctl --user restart pipewire wireplumber</code> fixed the microphone input issue on Discord immediately. Excellent tip!</p>',
    voteScore: 3,
  });

  const c9_1 = await Comment.create({
    post: post9._id,
    author: uKaushik._id,
    body: '<p>Kudos to everyone for organizing GLUGINIT. Helping juniors configure their dual-boot setups and terminal environments was a great experience.</p>',
    voteScore: 4,
  });

  const c10_1 = await Comment.create({
    post: post10._id,
    author: uGlug._id,
    body: '<p>AddressSanitizer (<code>-fsanitize=address</code>) saved hours of debugging linked list pointers. Catches out-of-bounds writes on the spot at runtime.</p>',
    voteScore: 4,
  });

  console.log('[Seed] Synchronizing comment counts on all posts...');
  const allCreatedPosts = await Post.find();
  for (const p of allCreatedPosts) {
    p.commentCount = await Comment.countDocuments({ post: p._id });
    await p.save();
  }

  console.log('[Seed] Seeding sample bookmarks...');
  await Bookmark.create({ user: uGlug._id, post: post2._id });
  await Bookmark.create({ user: uGlug._id, post: post3._id });
  await Bookmark.create({ user: uKaushik._id, post: post4._id });
  await Bookmark.create({ user: uKaushik._id, post: post6._id });
  await Bookmark.create({ user: uGlug._id, post: post7._id });

  console.log('[Seed] ========================================');
  console.log(`[Seed] Seeded ${allCreatedPosts.length} discussions.`);
  console.log(`[Seed] All posts and comments authored by glug_jec & Kaushik_Ranjan.`);
  console.log(`[Seed] Seeded ${await Comment.countDocuments()} comments and replies.`);
  console.log(`[Seed] Seeded ${await Vote.countDocuments()} votes.`);
  console.log(`[Seed] Preserved all ${allUsers.length} user accounts.`);
  console.log('[Seed] ========================================');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
