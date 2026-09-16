import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Resource } from '../models/Resource.js';

/**
 * Curated 100+ Verified Learning Resources
 * Theme: CS Introduction, Linux, and Open Source
 * Author: @glug_jec
 */

const CURATED_RESOURCES = [
  // ==========================================
  // 1. CS INTRODUCTION & COMPUTATIONAL THINKING
  // ==========================================
  {
    title: 'CS50x: Introduction to Computer Science (Harvard)',
    description: 'Harvard University\'s world-renowned entry-level course on computer science and the art of programming, covering C, Python, SQL, algorithms, and web basics.',
    category: 'cs-intro',
    items: ['C programming fundamentals', 'Memory management & Pointers', 'Data structures (arrays, lists, trees)', 'Python & SQL', 'Web development basics'],
    links: [
      { title: 'CS50 Official Course Portal', url: 'https://cs50.harvard.edu/x/', type: 'course' },
      { title: 'edX Interactive Audit Track', url: 'https://www.edx.org/learn/computer-science/harvard-university-cs50-s-introduction-to-computer-science', type: 'course' },
    ],
    order: 1,
  },
  {
    title: 'MIT 6.0001: Intro to Computer Science & Python',
    description: 'MIT\'s foundational course introducing computational thinking, algorithmic complexity, numerical methods, and structured problem solving in Python.',
    category: 'cs-intro',
    items: ['Python basics & functions', 'Branching & Iteration', 'Recursion & Decomposition', 'Object-Oriented Programming', 'Algorithmic complexity (Big O)'],
    links: [
      { title: 'MIT OpenCourseWare (6.0001)', url: 'https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/', type: 'course' },
    ],
    order: 2,
  },
  {
    title: 'Structure & Interpretation of Computer Programs (SICP)',
    description: 'The legendary MIT computer science textbook exploring abstraction, higher-order functions, interpreters, and metalinguistic programming.',
    category: 'cs-intro',
    items: ['Building Abstractions with Procedures', 'Building Abstractions with Data', 'Modularity, Objects & State', 'Metalinguistic Abstraction'],
    links: [
      { title: 'HTML Full Text (MIT Press)', url: 'https://mitp-content-server.mit.edu/books/content/sectbyfn/books_pres_0/11599/book/book.html', type: 'book' },
    ],
    order: 3,
  },
  {
    title: 'Teach Yourself Computer Science',
    description: 'A curated self-study roadmap outlining the nine foundational computer science subjects that every software engineer should master.',
    category: 'cs-intro',
    items: ['Programming & Architecture', 'Algorithms & Mathematics', 'Operating Systems & Networking', 'Databases & Distributed Systems'],
    links: [
      { title: 'TeachYourselfCS Guide', url: 'https://teachyourselfcs.com/', type: 'doc' },
    ],
    order: 4,
  },
  {
    title: 'Open Source Society University (OSSU) CS',
    description: 'A complete, self-paced undergraduate computer science curriculum assembled entirely from world-class free university courses.',
    category: 'cs-intro',
    items: ['Core Programming', 'Core Systems & Math', 'Advanced CS Pathways', 'Capstone projects'],
    links: [
      { title: 'OSSU GitHub Repository', url: 'https://github.com/ossu/computer-science', type: 'repo' },
    ],
    order: 5,
  },
  {
    title: 'Nand2Tetris: Building a Computer from First Principles',
    description: 'Build a modern, general-purpose computer system from elementary NAND gates all the way up through an assembler, VM, compiler, and OS.',
    category: 'cs-intro',
    items: ['Boolean logic gates', 'ALU & Memory chips', 'Virtual machine architecture', 'Jack language compiler', 'Minimal operating system'],
    links: [
      { title: 'Nand2Tetris Official Portal', url: 'https://www.nand2tetris.org/', type: 'interactive' },
      { title: 'Coursera Course Part 1', url: 'https://www.coursera.org/learn/build-a-computer', type: 'course' },
    ],
    order: 6,
  },
  {
    title: 'Computer Science Field Guide',
    description: 'An interactive open-source online learning resource designed to introduce fundamental CS topics to beginners without tedious syntax barriers.',
    category: 'cs-intro',
    items: ['Algorithms & Complexity', 'Data Representation', 'Cryptography & Security', 'Human-Computer Interaction', 'Software Engineering'],
    links: [
      { title: 'CS Field Guide Portal', url: 'https://www.csfieldguide.org.nz/en/', type: 'interactive' },
    ],
    order: 7,
  },
  {
    title: 'How to Design Programs (HtDP)',
    description: 'A systematic introduction to programming and structured problem solving that focuses on systematic design recipes and invariant reasoning.',
    category: 'cs-intro',
    items: ['Design recipes', 'Data definitions', 'Generative recursion', 'Function abstraction', 'Interactive programs'],
    links: [
      { title: 'HtDP Online Edition', url: 'https://htdp.org/', type: 'book' },
    ],
    order: 8,
  },
  {
    title: 'Crash Course Computer Science (PBS)',
    description: 'A fast-paced 40-episode animated visual journey through the history, hardware, software, and real-world implications of computing.',
    category: 'cs-intro',
    items: ['Early computing history', 'Logic gates & ALU', 'Registers & RAM', 'CPU instruction sets', 'Graphical user interfaces'],
    links: [
      { title: 'YouTube Playlist', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtNlUrzyH5r6jN9ulIgZBpdo', type: 'video' },
    ],
    order: 9,
  },
  {
    title: 'Automate the Boring Stuff with Python',
    description: 'Al Sweigart\'s practical programming book teaching beginners how to write Python scripts that automate tedious day-to-day computer tasks.',
    category: 'cs-intro',
    items: ['Python basics', 'Pattern matching with Regex', 'Reading & Writing files', 'Web scraping', 'Automating GUI and spreadsheets'],
    links: [
      { title: 'Free Online Book', url: 'https://automatetheboringstuff.com/', type: 'book' },
    ],
    order: 10,
  },

  // ==========================================
  // 2. DATA STRUCTURES & ALGORITHMS
  // ==========================================
  {
    title: 'VisuAlgo: Visualizing Data Structures & Algorithms',
    description: 'An interactive animated visualizer for understanding data structures and classic algorithms through step-by-step graphical animations.',
    category: 'algorithms-dsa',
    items: ['Sorting algorithms', 'Binary Search Trees & AVL', 'Graph traversals (BFS/DFS)', 'Shortest Paths (Dijkstra/Bellman-Ford)', 'Union-Find Disjoint Sets'],
    links: [
      { title: 'VisuAlgo Portal', url: 'https://visualgo.net/en', type: 'interactive' },
    ],
    order: 11,
  },
  {
    title: 'Open Data Structures (Pat Morin)',
    description: 'An open-source academic textbook providing mathematical analysis and clean code implementations of fundamental data structures in C++, Java, and Python.',
    category: 'algorithms-dsa',
    items: ['Array-based lists', 'Linked lists & Skiplists', 'Hash tables & Universal hashing', 'Binary trees & B-trees', 'Sorting algorithms'],
    links: [
      { title: 'Open Data Structures Online', url: 'https://opendatastructures.org/', type: 'book' },
    ],
    order: 12,
  },
  {
    title: 'Algorithms by Jeff Erickson',
    description: 'An acclaimed, freely accessible undergraduate algorithms textbook developed at UIUC, known for mathematical clarity and rigorous exposition.',
    category: 'algorithms-dsa',
    items: ['Recursion & Backtracking', 'Dynamic Programming', 'Greedy algorithms', 'Graph algorithms', 'NP-hardness & reductions'],
    links: [
      { title: 'Jeff Erickson Textbook Page', url: 'https://jeffe.cs.illinois.edu/teaching/algorithms/', type: 'book' },
    ],
    order: 13,
  },
  {
    title: 'CP-Algorithms (E-Maxx in English)',
    description: 'The premier open-source repository of algorithm and data structure descriptions with mathematical proofs and tested competitive programming implementations.',
    category: 'algorithms-dsa',
    items: ['Number theory & Combinatorics', 'Graph theory & Trees', 'String algorithms (KMP, Z, Suffix Automaton)', 'Geometry & Linear algebra'],
    links: [
      { title: 'CP-Algorithms Wiki', url: 'https://cp-algorithms.com/', type: 'doc' },
    ],
    order: 14,
  },
  {
    title: 'The Algorithms (Open Source Collections)',
    description: 'The world\'s largest open-source algorithm repository, featuring peer-reviewed implementations across Python, C, C++, Java, and Go.',
    category: 'algorithms-dsa',
    items: ['Sorting and searching algorithms', 'Data structures', 'Dynamic programming', 'Ciphers and hashing', 'Machine learning algorithms'],
    links: [
      { title: 'The Algorithms GitHub', url: 'https://github.com/TheAlgorithms', type: 'repo' },
      { title: 'Documentation & Search', url: 'https://the-algorithms.com/', type: 'doc' },
    ],
    order: 15,
  },
  {
    title: 'MIT 6.006: Introduction to Algorithms',
    description: 'MIT\'s rigorous foundational course on mathematical modeling of computational problems, algorithmic paradigms, and efficiency analysis.',
    category: 'algorithms-dsa',
    items: ['Asymptotic notation & Master theorem', 'Divide and conquer', 'Heaps & Priority queues', 'Dynamic programming', 'Graph algorithms'],
    links: [
      { title: 'MIT OCW 6.006 Course', url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/', type: 'course' },
    ],
    order: 16,
  },
  {
    title: 'NeetCode DSA Roadmap & Problem Patterns',
    description: 'A visual, pattern-oriented learning roadmap with video walkthroughs covering core algorithm patterns for technical problem solving.',
    category: 'algorithms-dsa',
    items: ['Two Pointers & Sliding Window', 'Trees & Graph traversals', 'Binary Search patterns', 'Dynamic Programming paradigms'],
    links: [
      { title: 'NeetCode Roadmap', url: 'https://neetcode.io/roadmap', type: 'interactive' },
    ],
    order: 17,
  },
  {
    title: 'Sedgewick & Wayne: Algorithms 4th Edition',
    description: 'The companion resource for Robert Sedgewick and Kevin Wayne\'s classic textbook, containing comprehensive Java source code and exercise guides.',
    category: 'algorithms-dsa',
    items: ['Union-find analysis', 'Quicksort & Mergesort', 'Balanced search trees (Red-Black)', 'Graph processing algorithms'],
    links: [
      { title: 'Princeton Algorithms Booksite', url: 'https://algs4.cs.princeton.edu/home/', type: 'doc' },
    ],
    order: 18,
  },
  {
    title: 'Algorithm Visualizer (Interactive Engine)',
    description: 'An open-source interactive web visualization library that interprets and renders algorithm execution directly from code.',
    category: 'algorithms-dsa',
    items: ['Interactive step debugger', 'Visual memory structures', 'JavaScript/C++ algorithm editor'],
    links: [
      { title: 'Algorithm Visualizer App', url: 'https://algorithm-visualizer.org/', type: 'interactive' },
    ],
    order: 19,
  },
  {
    title: 'Competitive Programmer\'s Handbook (Antti Laaksonen)',
    description: 'A modern, concise introduction to competitive algorithm design, theoretical asymptotic math, and practical data structures.',
    category: 'algorithms-dsa',
    items: ['Time complexity & amortized analysis', 'Tree algorithms & Segment trees', 'Flow networks', 'Shortest path algorithms'],
    links: [
      { title: 'Free PDF Book (CSES)', url: 'https://cses.fi/book/book.pdf', type: 'book' },
    ],
    order: 20,
  },

  // ==========================================
  // 3. COMPUTER SYSTEMS & ARCHITECTURE
  // ==========================================
  {
    title: 'Computer Systems: A Programmer\'s Perspective (CS:APP)',
    description: 'Bryant & O\'Hallaron\'s definitive guide explaining how computer hardware, machine assembly, compilers, and operating systems interact.',
    category: 'systems-arch',
    items: ['Data representations (bits, integers, floats)', 'x86-64 Machine-level code', 'Processor architecture & Pipelining', 'Memory hierarchy & Cache hits', 'Virtual memory'],
    links: [
      { title: 'CS:APP Official Site & Student Labs', url: 'http://csapp.cs.cmu.edu/', type: 'doc' },
    ],
    order: 21,
  },
  {
    title: 'Ben Eater: Build an 8-bit Computer on Breadboards',
    description: 'An iconic video series building a fully programmable 8-bit computer from individual 7400-series TTL logic chips on breadboards.',
    category: 'systems-arch',
    items: ['555 timer clock circuit', 'Registers & ALU using adders', 'RAM & Control logic EEPROMs', 'Microcode instruction decoder', 'Bus architecture'],
    links: [
      { title: 'Ben Eater Project Portal', url: 'https://eater.net/8bit', type: 'interactive' },
      { title: 'YouTube Playlist', url: 'https://www.youtube.com/playlist?list=PLowKtXNTBypGqImE405J2565dvjafglHU', type: 'video' },
    ],
    order: 22,
  },
  {
    title: 'Berkeley CS61C: Great Ideas in Computer Architecture',
    description: 'UC Berkeley\'s acclaimed machine structures course covering RISC-V assembly language, C memory safety, hardware parallelism, and caching.',
    category: 'systems-arch',
    items: ['C memory layout', 'RISC-V assembly programming', 'CPU datapath & Pipelining hazards', 'Cache memory mapping', 'Virtual memory'],
    links: [
      { title: 'Berkeley CS61C Course Site', url: 'https://cs61c.org/', type: 'course' },
    ],
    order: 23,
  },
  {
    title: 'Modern Microprocessors: A 90-Minute Guide',
    description: 'A lucid, illustrated walkthrough of how modern CPUs execute code: instruction pipelines, superscalar dispatch, branch prediction, and multi-threading.',
    category: 'systems-arch',
    items: ['Pipelining fundamentals', 'Superscalar architecture', 'Out-of-order execution', 'Branch prediction & Speculation', 'Cache hierarchies'],
    links: [
      { title: 'Lighterra Online Guide', url: 'http://www.lighterra.com/papers/modernmicroprocessors/', type: 'doc' },
    ],
    order: 24,
  },
  {
    title: 'What Every Programmer Should Know About Memory',
    description: 'Ulrich Drepper\'s celebrated technical treatise detailing CPU L1/L2/L3 caches, DRAM bus architecture, NUMA memory, and software cache optimization.',
    category: 'systems-arch',
    items: ['RAM types & internal structure', 'CPU cache lines & associativity', 'Virtual memory & TLB misses', 'NUMA memory optimization', 'Cache-friendly algorithms'],
    links: [
      { title: 'Full Paper on LWN.net', url: 'https://lwn.net/Articles/250967/', type: 'doc' },
    ],
    order: 25,
  },
  {
    title: 'Venus: Interactive RISC-V Web Simulator',
    description: 'A full-featured in-browser simulator and assembler for the RISC-V architecture, featuring step debugging and visual memory exploration.',
    category: 'systems-arch',
    items: ['RISC-V assembly simulator', 'Register file visualizer', 'Memory inspection grid', 'Interactive breakpoint runner'],
    links: [
      { title: 'Venus Web Simulator', url: 'https://venus.kvakil.me/', type: 'interactive' },
      { title: 'GitHub Repository', url: 'https://github.com/ThaumicMekanism/venus', type: 'repo' },
    ],
    order: 26,
  },
  {
    title: 'RISC-V Instruction Set Manual & Specifications',
    description: 'The official specifications for the open and free RISC-V instruction set architecture, maintaining standards for unprivileged and privileged ISA.',
    category: 'systems-arch',
    items: ['Base integer ISA (RV32I/RV64I)', 'Standard extensions (M, A, F, D, C)', 'Calling conventions', 'Privileged architecture modes'],
    links: [
      { title: 'RISC-V Specifications Portal', url: 'https://riscv.org/technical/specifications/', type: 'doc' },
    ],
    order: 27,
  },
  {
    title: 'Computer Architecture Lectures (CMU / Onur Mutlu)',
    description: 'Comprehensive graduate and undergraduate lectures on modern processor microarchitecture, memory controllers, and hardware security by Prof. Onur Mutlu.',
    category: 'systems-arch',
    items: ['Branch prediction algorithms', 'Precise exceptions & Register renaming', 'Memory controllers & DRAM scheduling', 'Rowhammer & Spectre vulnerabilities'],
    links: [
      { title: 'Prof. Mutlu Architecture Course', url: 'https://safari.ethz.ch/architecture/', type: 'course' },
    ],
    order: 28,
  },
  {
    title: 'Patterson & Hennessy: Computer Organization Companion',
    description: 'Companion study resources and lecture slides for the classic textbook that established quantitative computer architecture design.',
    category: 'systems-arch',
    items: ['MIPS and RISC-V processor models', 'Instruction-level parallelism', 'Storage and I/O interconnects', 'Multi-core architectures'],
    links: [
      { title: 'Elsevier Textbook Companion', url: 'https://booksite.elsevier.com/9780128119051/', type: 'doc' },
    ],
    order: 29,
  },
  {
    title: 'Digital Design & Computer Architecture (Harris & Harris)',
    description: 'A textbook bridging the gap between digital electronic gates and microarchitecture, showing how Verilog/VHDL implements processors.',
    category: 'systems-arch',
    items: ['Combinational logic design', 'Sequential logic & Clocking', 'HDL programming in SystemVerilog', 'Microprocessor implementation'],
    links: [
      { title: 'Digital Design Companion Site', url: 'https://www.sciencedirect.com/book/9780128000564/digital-design-and-computer-architecture', type: 'doc' },
    ],
    order: 30,
  },

  // ==========================================
  // 4. OPERATING SYSTEMS CONCEPTS
  // ==========================================
  {
    title: 'Operating Systems: Three Easy Pieces (OSTEP)',
    description: 'The acclaimed, freely available operating systems textbook by Remzi & Andrea Arpaci-Dusseau, organized around Virtualization, Concurrency, and Persistence.',
    category: 'operating-systems',
    items: ['CPU scheduling & Process API', 'Memory virtualization & Paging', 'Locks, Semaphores & Condition variables', 'File systems & Crash consistency', 'Log-structured file systems'],
    links: [
      { title: 'OSTEP Free Chapters Online', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', type: 'book' },
    ],
    order: 31,
  },
  {
    title: 'xv6: A Simple Unix-like Teaching OS (MIT)',
    description: 'MIT\'s modern pedagogical reimplementation of Dennis Ritchie\'s Unix V6 in ANSI C for multi-core RISC-V microprocessors.',
    category: 'operating-systems',
    items: ['Trap handling & Interrupts', 'Kernel page tables', 'Context switching & Scheduler', 'System call dispatch', 'Buffer cache & Inode filesystem'],
    links: [
      { title: 'MIT 6.1810 xv6 Project', url: 'https://pdos.csail.mit.edu/6.1810/2023/xv6.html', type: 'course' },
      { title: 'xv6 RISC-V GitHub Source', url: 'https://github.com/mit-pdos/xv6-riscv', type: 'repo' },
    ],
    order: 32,
  },
  {
    title: 'OSDev Wiki (Operating System Development)',
    description: 'The premier collaborative knowledge base for low-level systems engineers building hobbyist and academic operating systems from scratch.',
    category: 'operating-systems',
    items: ['Bootloaders (BIOS & UEFI)', 'Protected mode & Long mode setup', 'Interrupt Descriptor Table (IDT)', 'Paging & Memory managers', 'Device drivers (VGA, PS/2, Serial)'],
    links: [
      { title: 'OSDev Wiki Main Page', url: 'https://wiki.osdev.org/Main_Page', type: 'doc' },
    ],
    order: 33,
  },
  {
    title: 'The Linux Programming Interface (TLPI)',
    description: 'Michael Kerrisk\'s definitive 1,500-page encyclopedia of Linux and UNIX system programming APIs, covering POSIX interfaces in depth.',
    category: 'operating-systems',
    items: ['File I/O and buffering', 'Process creation (fork, exec, wait)', 'Signals and realtime timers', 'Interprocess Communication (Pipes, FIFOs, Shared Memory)', 'POSIX Sockets'],
    links: [
      { title: 'TLPI Official Site & Code', url: 'https://man7.org/tlpi/', type: 'book' },
    ],
    order: 34,
  },
  {
    title: 'Writing an OS in Rust (Philipp Oppermann)',
    description: 'A universally praised step-by-step blog tutorial series on building a small, memory-safe 64-bit operating system kernel from scratch in Rust.',
    category: 'operating-systems',
    items: ['Bare-metal Rust kernel', 'VGA text buffer driver', 'CPU exception handling', 'Hardware interrupts (PIC/APIC)', 'Paging & Heap allocation'],
    links: [
      { title: 'Philipp Oppermann\'s Blog', url: 'https://os.phil-opp.com/', type: 'doc' },
    ],
    order: 35,
  },
  {
    title: 'The Linux Kernel Documentation (kernel.org)',
    description: 'The official documentation tree maintained by Linux kernel developers, detailing kernel subsystems, memory management, and driver APIs.',
    category: 'operating-systems',
    items: ['Completely Fair Scheduler (CFS)', 'Virtual Memory & Page allocator', 'Virtual File System (VFS)', 'Kernel locking (spinlocks, RCU)', 'Device driver model'],
    links: [
      { title: 'The Linux Kernel Documentation', url: 'https://docs.kernel.org/', type: 'doc' },
    ],
    order: 36,
  },
  {
    title: 'Linux Inside (0xAX GitBook)',
    description: 'An open-source online book diving into the internals of the Linux kernel source code, boot sequence, and initialization protocols.',
    category: 'operating-systems',
    items: ['Kernel bootloader interaction', 'Early memory management', 'Syscall entry and exit', 'Interrupt handling vectors'],
    links: [
      { title: 'Linux Inside GitHub Book', url: 'https://github.com/0xAX/linux-insides', type: 'repo' },
    ],
    order: 37,
  },
  {
    title: 'Tanenbaum: Modern Operating Systems Companion',
    description: 'Conceptual notes and slides from Andrew S. Tanenbaum\'s foundational textbook covering operating system design and architecture tradeoffs.',
    category: 'operating-systems',
    items: ['Process scheduling algorithms', 'Deadlock detection and avoidance', 'Memory virtualization & Swapping', 'Security & Protection mechanisms'],
    links: [
      { title: 'Tanenbaum Modern OS Portal', url: 'https://www.cs.vu.nl/~ast/books/mos4/', type: 'doc' },
    ],
    order: 38,
  },
  {
    title: 'Write Your Own Operating System (Stephen Brennan)',
    description: 'An accessible, hands-on guide walking through creating an x86 toy operating system kernel that boots with GRUB and prints to the screen.',
    category: 'operating-systems',
    items: ['GRUB multiboot header', 'Screen driver in C', 'GDT setup', 'Keyboard interrupts'],
    links: [
      { title: 'Stephen Brennan\'s Tutorial', url: 'https://brennan.io/2020/05/24/userspace-intro/', type: 'doc' },
    ],
    order: 39,
  },
  {
    title: 'Understanding the Linux Kernel (O\'Reilly)',
    description: 'Bovet and Cesati\'s classic deep-dive into the architectural mechanics, data structures, and algorithms powering the Linux monolithic kernel.',
    category: 'operating-systems',
    items: ['Process descriptors (task_struct)', 'Buddy system memory allocation', 'Block I/O layers', 'Page cache and swap'],
    links: [
      { title: 'O\'Reilly Book Archive', url: 'https://www.oreilly.com/library/view/understanding-the-linux/0596005652/', type: 'book' },
    ],
    order: 40,
  },

  // ==========================================
  // 5. LINUX FUNDAMENTALS & COMMAND-LINE
  // ==========================================
  {
    title: 'Linux Journey',
    description: 'A friendly, beautifully structured online tutorial guiding learners through Linux essentials across bite-sized interactive lessons.',
    category: 'linux-basics',
    items: ['Command-line basics', 'Filesystem hierarchy (/etc, /usr, /var)', 'File permissions (chmod, chown)', 'Process management', 'Networking tools'],
    links: [
      { title: 'Linux Journey Portal', url: 'https://linuxjourney.com/', type: 'interactive' },
    ],
    order: 41,
  },
  {
    title: 'OverTheWire: Bandit Wargame',
    description: 'The premier gamified security and Linux challenge that teaches terminal commands, SSH keys, file inspection, and scripting through 34 levels.',
    category: 'linux-basics',
    items: ['Terminal navigation (ls, cd, cat)', 'Searching files (find, grep, xargs)', 'Piping & Redirection', 'Compression (tar, gzip, bzip2)', 'Cron job inspection'],
    links: [
      { title: 'Bandit Levels Portal', url: 'https://overthewire.org/wargames/bandit/', type: 'interactive' },
    ],
    order: 42,
  },
  {
    title: 'The Linux Command Line (William Shotts)',
    description: 'A comprehensive, free 500-page book taking beginners from their very first terminal commands to writing sophisticated shell automation scripts.',
    category: 'linux-basics',
    items: ['Filesystem navigation', 'Permissions and ownership', 'Standard I/O and Redirection', 'Package management', 'Shell scripting syntax'],
    links: [
      { title: 'Free PDF Download (LinuxCommand.org)', url: 'https://linuxcommand.org/tlcl.php', type: 'book' },
    ],
    order: 43,
  },
  {
    title: 'ExplainShell',
    description: 'An interactive web tool that parses complex Linux command lines and matches each flag against official man pages to show what it does.',
    category: 'linux-basics',
    items: ['Interactive flag explanation', 'Command line dissection', 'Man page matching', 'Complex pipeline debugging'],
    links: [
      { title: 'ExplainShell Web App', url: 'https://explainshell.com/', type: 'interactive' },
    ],
    order: 44,
  },
  {
    title: 'Ryan\'s Linux Tutorial',
    description: 'A practical, straightforward introduction to the Linux command line, wildcards, directory navigation, file permissions, and piping.',
    category: 'linux-basics',
    items: ['Directory navigation', 'Wildcards & Pattern matching', 'Permissions (chmod, chown)', 'Piping & Filters', 'Scripting basics'],
    links: [
      { title: 'Ryan\'s Tutorials', url: 'https://ryanstutorials.net/linuxtutorial/', type: 'doc' },
    ],
    order: 45,
  },
  {
    title: 'Linux Survival: Hands-on Browser Terminal',
    description: 'A free interactive guide with an embedded virtual terminal simulator, teaching core Linux commands through guided exercises.',
    category: 'linux-basics',
    items: ['Directory manipulation', 'File inspection commands', 'Moving and copying files', 'Piping and text filtering'],
    links: [
      { title: 'Linux Survival Site', url: 'https://linuxsurvival.com/', type: 'interactive' },
    ],
    order: 46,
  },
  {
    title: 'Command Line Challenge (cmdchallenge.com)',
    description: 'A suite of short, interactive puzzle challenges designed to test your bash command-line skills and coreutils problem-solving.',
    category: 'linux-basics',
    items: ['Text filtering with awk & sed', 'File matching', 'Directory traversal', 'Piping puzzles'],
    links: [
      { title: 'CMD Challenge Portal', url: 'https://cmdchallenge.com/', type: 'interactive' },
    ],
    order: 47,
  },
  {
    title: 'GNU Coreutils Manual',
    description: 'The authoritative official manual for GNU core utilities, documenting common command-line programs: cat, cp, dd, ls, mv, rm, test, and more.',
    category: 'linux-basics',
    items: ['File printing & concatenation', 'Directory operations', 'File permission manipulation', 'Text formatting utilities'],
    links: [
      { title: 'GNU Coreutils Documentation', url: 'https://www.gnu.org/software/coreutils/manual/', type: 'doc' },
    ],
    order: 48,
  },
  {
    title: 'ArchWiki: General Recommendations',
    description: 'The Arch Linux Wiki\'s renowned master guide for configuring, securing, and maintaining a clean, performant GNU/Linux system.',
    category: 'linux-basics',
    items: ['User privilege management (sudo)', 'System maintenance', 'Hardware configuration', 'Network configuration', 'Audio and desktop environments'],
    links: [
      { title: 'ArchWiki Recommendations', url: 'https://wiki.archlinux.org/title/General_recommendations', type: 'doc' },
    ],
    order: 49,
  },
  {
    title: 'GNU Bash Reference Manual',
    description: 'The definitive official documentation for the Bourne Again SHell (Bash), covering syntax, parameters, expansions, builtins, and job control.',
    category: 'linux-basics',
    items: ['Shell expansion rules', 'Command substitution', 'Positional parameters', 'Shell builtins', 'Job control & Signals'],
    links: [
      { title: 'Official Bash Manual', url: 'https://www.gnu.org/software/bash/manual/', type: 'doc' },
    ],
    order: 50,
  },

  // ==========================================
  // 6. LINUX SYSADMIN, DEVOPS & CONTAINERS
  // ==========================================
  {
    title: 'SadServers: Linux Troubleshooting Scenarios',
    description: 'Solve real-world Linux system administration, networking, and server failure puzzles hosted on live ephemeral virtual machines.',
    category: 'linux-sysadmin',
    items: ['Disk full & Inode exhaustion', '500 Server Error debugging', 'Permissions & Ownership bugs', 'Network connectivity failures', 'Cron & Service failures'],
    links: [
      { title: 'SadServers Challenge Platform', url: 'https://sadservers.com/', type: 'interactive' },
    ],
    order: 51,
  },
  {
    title: 'DigitalOcean Community Linux Tutorials',
    description: 'Thousands of high-grade, practical step-by-step tutorials on setting up web servers, databases, SSL certificates, firewalls, and systemd services.',
    category: 'linux-sysadmin',
    items: ['Nginx / Apache web servers', 'UFW firewall configuration', 'Let\'s Encrypt SSL certificates', 'PostgreSQL & MySQL setup', 'SSH key hardening'],
    links: [
      { title: 'DigitalOcean Tutorials', url: 'https://www.digitalocean.com/community/tutorials', type: 'doc' },
    ],
    order: 52,
  },
  {
    title: 'Julia Evans: Systems & Networking Wizard Zines',
    description: 'Engaging, beautifully illustrated comic zines demystifying complex Linux concepts: DNS, Linux tracing with strace, TCP/IP, and shell tools.',
    category: 'linux-sysadmin',
    items: ['Bite Size Linux', 'DNS troubleshooting', 'Linux tracing tools (strace, lsof)', 'TCP/IP networking fundamentals'],
    links: [
      { title: 'Wizard Zines Library', url: 'https://wizardzines.com/', type: 'doc' },
    ],
    order: 53,
  },
  {
    title: 'The Debian Administrator\'s Handbook',
    description: 'A complete, freely available guide to Debian GNU/Linux system administration from basic installation to large-scale network service deployment.',
    category: 'linux-sysadmin',
    items: ['APT package manager', 'LVM logical volume management', 'System boot with systemd', 'Network services configuration', 'Security hardening'],
    links: [
      { title: 'Debian Handbook Online', url: 'https://debian-handbook.info/browse/stable/', type: 'book' },
    ],
    order: 54,
  },
  {
    title: 'systemd Documentation & By-Example Guide',
    description: 'Official documentation and practical guides for managing system services, unit files, timers, targets, and system logging with journalctl.',
    category: 'linux-sysadmin',
    items: ['Unit configuration files', 'Service dependencies & ordering', 'systemd timers vs cron', 'journalctl log filtering', 'systemctl control'],
    links: [
      { title: 'systemd Documentation Portal', url: 'https://systemd.io/', type: 'doc' },
    ],
    order: 55,
  },
  {
    title: 'Docker Curriculum (prakhar.me)',
    description: 'A celebrated, beginner-friendly comprehensive tutorial on containerization fundamentals, writing Dockerfiles, and multi-service compose stacks.',
    category: 'linux-sysadmin',
    items: ['Container vs Virtual Machine', 'Docker CLI commands', 'Building custom Dockerfiles', 'Multi-stage builds', 'Docker Compose orchestration'],
    links: [
      { title: 'Docker Curriculum Tutorial', url: 'https://docker-curriculum.com/', type: 'interactive' },
    ],
    order: 56,
  },
  {
    title: 'roadmap.sh: DevOps & Linux Roadmap',
    description: 'An interactive community-curated roadmap outlining essential knowledge paths for Linux systems engineering, automation, and DevOps.',
    category: 'linux-sysadmin',
    items: ['OS concepts', 'Terminal & text manipulation', 'Networking protocols', 'CI/CD automation', 'Monitoring & Telemetry'],
    links: [
      { title: 'DevOps Interactive Roadmap', url: 'https://roadmap.sh/devops', type: 'interactive' },
    ],
    order: 57,
  },
  {
    title: 'ShellCheck: Static Analysis for Shell Scripts',
    description: 'The standard static analysis linter for bash and POSIX sh scripts, warning against syntax mistakes, quoting pitfalls, and portability bugs.',
    category: 'linux-sysadmin',
    items: ['Quoting rules & Word splitting', 'Command substitution errors', 'POSIX sh compatibility', 'Variable scoping'],
    links: [
      { title: 'ShellCheck Online Linter', url: 'https://www.shellcheck.net/', type: 'tool' },
      { title: 'GitHub Repository', url: 'https://github.com/koalaman/shellcheck', type: 'repo' },
    ],
    order: 58,
  },
  {
    title: 'Linux Network Administrator\'s Guide (TLDP)',
    description: 'The classic Linux Documentation Project reference on TCP/IP networking, routing tables, firewalls, and network troubleshooting tools.',
    category: 'linux-sysadmin',
    items: ['IP routing fundamentals', 'Network device drivers', 'Firewalling with iptables/nftables', 'DNS resolver setup'],
    links: [
      { title: 'TLDP Network Guide Online', url: 'https://tldp.org/LDP/nag2/index.html', type: 'doc' },
    ],
    order: 59,
  },
  {
    title: 'Red Hat Enterprise Linux 9 Administration Guide',
    description: 'Enterprise documentation from Red Hat detailing user management, storage pools, SELinux enforcement, and automated deployment.',
    category: 'linux-sysadmin',
    items: ['SELinux modes and troubleshooting', 'Storage configuration (Stratis, VDO)', 'Cockpit web console', 'System performance tuning'],
    links: [
      { title: 'Red Hat Documentation Portal', url: 'https://docs.redhat.com/', type: 'doc' },
    ],
    order: 60,
  },

  // ==========================================
  // 7. GIT, VERSION CONTROL & COLLABORATION
  // ==========================================
  {
    title: 'Pro Git Book (Scott Chacon & Ben Straub)',
    description: 'The official, comprehensive open-source guide to Git, covering fundamental commands, branching workflows, internals, and GitHub collaboration.',
    category: 'git-vcs',
    items: ['Git object model (blobs, trees, commits)', 'Branching, merging, and rebasing', 'Distributed workflows', 'Git internals and plumbing commands'],
    links: [
      { title: 'Pro Git Full Book (Git-SCM)', url: 'https://git-scm.com/book/en/v2', type: 'book' },
    ],
    order: 61,
  },
  {
    title: 'Learn Git Branching (Interactive Visualizer)',
    description: 'The most visual, hands-on way to master Git branching, commits, cherry-picking, rebasing, and HEAD manipulation directly in the browser.',
    category: 'git-vcs',
    items: ['Visual commit tree graph', 'Git rebase interactive', 'Cherry-picking commits', 'Remote branch tracking', 'Merge conflict resolution'],
    links: [
      { title: 'Learn Git Branching Web App', url: 'https://learngitbranching.js.org/', type: 'interactive' },
    ],
    order: 62,
  },
  {
    title: 'Oh My Git! (Open Source Game)',
    description: 'An open-source desktop game built with Godot that turns learning Git version control into an interactive visual puzzle.',
    category: 'git-vcs',
    items: ['Visual repository state', 'Hands-on merge conflict puzzles', 'Interactive card-based actions', 'Terminal command view'],
    links: [
      { title: 'Oh My Git! Website', url: 'https://ohmygit.org/', type: 'interactive' },
      { title: 'GitHub Repository', url: 'https://github.com/blinry/ohmygit', type: 'repo' },
    ],
    order: 63,
  },
  {
    title: 'Dangit, Git!?! (Oh Shit, Git!?)',
    description: 'A humorous yet battle-tested collection of emergency recipes for untangling messy Git states without losing code or repository history.',
    category: 'git-vcs',
    items: ['Accidentally committed to main', 'Undo last commit but keep changes', 'Recover deleted branch (git reflog)', 'Discard uncommitted local edits'],
    links: [
      { title: 'Dangit, Git!?! Site', url: 'https://dangitgit.com/en', type: 'doc' },
    ],
    order: 64,
  },
  {
    title: 'GitHub Skills (Interactive Learning Pathways)',
    description: 'Hands-on courses hosted directly on GitHub where an automated bot creates pull requests and reviews your git actions in real time.',
    category: 'git-vcs',
    items: ['Introduction to GitHub', 'Markdown communication', 'Resolving merge conflicts', 'Code review workflows', 'GitHub Actions basics'],
    links: [
      { title: 'GitHub Skills Portal', url: 'https://skills.github.com/', type: 'interactive' },
    ],
    order: 65,
  },
  {
    title: 'Flight Rules for Git (k88hudson)',
    description: 'A guide for software astronauts on what to do when things go wrong in Git, structured like aerospace emergency flight procedures.',
    category: 'git-vcs',
    items: ['Commit editing and splitting', 'Branch surgery', 'Stash recovery', 'Submodule management', 'Reflog troubleshooting'],
    links: [
      { title: 'Flight Rules GitHub Repo', url: 'https://github.com/k88hudson/git-flight-rules', type: 'repo' },
    ],
    order: 66,
  },
  {
    title: 'Conventional Commits Specification',
    description: 'A lightweight convention on top of commit messages that provides an easy set of rules for creating human- and machine-readable commit histories.',
    category: 'git-vcs',
    items: ['feat, fix, docs, refactor types', 'Breaking change indicators', 'Automated semantic versioning', 'Changelog generation'],
    links: [
      { title: 'Conventional Commits Portal', url: 'https://www.conventionalcommits.org/', type: 'doc' },
    ],
    order: 67,
  },
  {
    title: 'Visualizing Git Concepts with D3',
    description: 'An interactive SVG web application using D3.js animated trees to visually demonstrate git commits, branches, merges, and tags.',
    category: 'git-vcs',
    items: ['Interactive command sandbox', 'Animated commit tree', 'Detached HEAD visualization', 'Branch and tag manipulation'],
    links: [
      { title: 'Visualizing Git Web App', url: 'https://git-school.github.io/visualizing-git/', type: 'interactive' },
    ],
    order: 68,
  },
  {
    title: 'Git Immersion: Guided Walkthrough',
    description: 'A guided hands-on tutorial that walks through Git fundamentals step-by-step, starting from initial setup up to advanced conflict resolution.',
    category: 'git-vcs',
    items: ['Basic workflow (add, commit, status)', 'Diffing and staging', 'Tagging releases', 'Branching and merging'],
    links: [
      { title: 'Git Immersion Site', url: 'https://gitimmersion.com/', type: 'interactive' },
    ],
    order: 69,
  },
  {
    title: 'Official Git Documentation & Reference',
    description: 'The authoritative reference documentation for every Git command, flag, configuration option, and internal plumbing utility.',
    category: 'git-vcs',
    items: ['Command man pages', 'Plumbing vs Porcelain tools', 'Git hooks system', 'Git transport protocols'],
    links: [
      { title: 'Official Git Documentation', url: 'https://git-scm.com/docs', type: 'doc' },
    ],
    order: 70,
  },

  // ==========================================
  // 8. OPEN SOURCE CULTURE & FIRST CONTRIBUTIONS
  // ==========================================
  {
    title: 'GitHub Open Source Guides',
    description: 'Community-curated collection of guides on how to contribute, launch, and maintain healthy, welcoming open-source software projects.',
    category: 'open-source',
    items: ['How to Contribute to Open Source', 'Starting an Open Source Project', 'Building Welcoming Communities', 'Open Source Metrics'],
    links: [
      { title: 'Open Source Guides Portal', url: 'https://opensource.guide/', type: 'doc' },
    ],
    order: 71,
  },
  {
    title: 'First Contributions Project',
    description: 'A hands-on open-source project designed to guide complete beginners through making their very first Pull Request in five minutes.',
    category: 'open-source',
    items: ['Forking a repository', 'Cloning locally', 'Branching and editing code', 'Submitting a Pull Request', 'Review process'],
    links: [
      { title: 'First Contributions Web Guide', url: 'https://firstcontributions.github.io/', type: 'interactive' },
      { title: 'GitHub Repository', url: 'https://github.com/firstcontributions/first-contributions', type: 'repo' },
    ],
    order: 72,
  },
  {
    title: 'Choose A License (GitHub)',
    description: 'A straightforward guide to open-source software licensing, breaking down the differences between MIT, Apache 2.0, GNU GPLv3, and AGPL.',
    category: 'open-source',
    items: ['Permissive vs Copyleft licenses', 'Commercial use permissions', 'Patent grants', 'Obligations to disclose source code'],
    links: [
      { title: 'Choose A License Portal', url: 'https://choosealicense.com/', type: 'doc' },
    ],
    order: 73,
  },
  {
    title: 'Up For Grabs',
    description: 'A curated directory of open-source projects with issues labeled specifically for new contributors wanting to participate in FOSS.',
    category: 'open-source',
    items: ['Filter by programming language', 'Filter by project tags', 'Beginner-friendly issue tracker', 'Active open-source repos'],
    links: [
      { title: 'Up For Grabs Portal', url: 'https://up-for-grabs.net/', type: 'interactive' },
    ],
    order: 74,
  },
  {
    title: 'Good First Issue',
    description: 'A popular discovery platform that curates accessible, easy issues from open-source repositories to help developers make meaningful contributions.',
    category: 'open-source',
    items: ['Curated GitHub issue explorer', 'Language filters', 'Popular project listings', 'Starter tickets'],
    links: [
      { title: 'Good First Issue Portal', url: 'https://goodfirstissue.dev/', type: 'interactive' },
    ],
    order: 75,
  },
  {
    title: 'The Cathedral & the Bazaar (Eric S. Raymond)',
    description: 'The historic essay analyzing the open-source software development revolution, contrasting top-down cathedral planning with bottom-up bazaar dynamics.',
    category: 'open-source',
    items: ['Linus\'s Law ("given enough eyeballs, all bugs are shallow")', 'Release early, release often', 'The open source peer review model'],
    links: [
      { title: 'Cathedral & the Bazaar Text', url: 'http://www.catb.org/~esr/writings/cathedral-bazaar/cathedral-bazaar/', type: 'book' },
    ],
    order: 76,
  },
  {
    title: 'Free Software Foundation (FSF): The Four Freedoms',
    description: 'Richard Stallman and the FSF\'s foundational manifesto establishing the four essential freedoms that define Free and Open Source Software.',
    category: 'open-source',
    items: ['Freedom 0: Run the program for any purpose', 'Freedom 1: Study how the program works', 'Freedom 2: Redistribute copies', 'Freedom 3: Distribute modified copies'],
    links: [
      { title: 'GNU Free Software Definition', url: 'https://www.gnu.org/philosophy/free-sw.html', type: 'doc' },
    ],
    order: 77,
  },
  {
    title: 'Open Source Initiative (OSI)',
    description: 'The steward of the Open Source Definition (OSD), validating whether software licenses conform to open-source standards.',
    category: 'open-source',
    items: ['The 10 criteria of Open Source', 'Approved license lists', 'Open source governance', 'History of FOSS'],
    links: [
      { title: 'Open Source Initiative Site', url: 'https://opensource.org/', type: 'doc' },
    ],
    order: 78,
  },
  {
    title: 'Google Open Source Documentation & Playbook',
    description: 'How Google creates, releases, and contributes to open source software, including legal reviews, patching strategies, and community stewardship.',
    category: 'open-source',
    items: ['Releasing open source projects', 'Inbound and outbound licensing', 'Patching upstream software', 'Community guidelines'],
    links: [
      { title: 'Google Open Source Docs', url: 'https://opensource.google/documentation/', type: 'doc' },
    ],
    order: 79,
  },
  {
    title: 'Contributor Covenant: Open Source Code of Conduct',
    description: 'The standard Code of Conduct adopted by thousands of prominent open-source projects (Linux, Kubernetes, Swift) to foster welcoming environments.',
    category: 'open-source',
    items: ['Community standards', 'Enforcement guidelines', 'Scope and reporting procedures', 'Inclusivity best practices'],
    links: [
      { title: 'Contributor Covenant Portal', url: 'https://www.contributor-covenant.org/', type: 'doc' },
    ],
    order: 80,
  },

  // ==========================================
  // 9. OPEN SOURCE DEVELOPER TOOLING
  // ==========================================
  {
    title: 'OpenVim: Interactive Modal Editing Tutorial',
    description: 'An interactive web-based terminal simulator teaching modal text editing, movement commands (hjkl, w, b, e), and editing operators in Vim.',
    category: 'dev-tools',
    items: ['Normal, Insert, and Visual modes', 'Navigation keystrokes', 'Text modification operators', 'Search and replace commands'],
    links: [
      { title: 'OpenVim Interactive Guide', url: 'https://www.openvim.com/', type: 'interactive' },
    ],
    order: 81,
  },
  {
    title: 'Neovim: Extensible Vim-based Text Editor',
    description: 'The modern, hyper-extensible evolution of Vim featuring first-class Lua scripting, built-in Language Server Protocol (LSP), and Treesitter syntax highlighting.',
    category: 'dev-tools',
    items: ['Lua configuration', 'Builtin LSP client', 'Treesitter AST parsing', 'Plugin management (lazy.nvim)'],
    links: [
      { title: 'Neovim Official Site', url: 'https://neovim.io/', type: 'tool' },
      { title: 'Neovim Documentation', url: 'https://neovim.io/doc/', type: 'doc' },
    ],
    order: 82,
  },
  {
    title: 'tmux: Terminal Multiplexer Quick Reference',
    description: 'Master persistent command-line sessions, window tabs, and split panes for multitasking and resilient remote SSH sessions.',
    category: 'dev-tools',
    items: ['Sessions and detaching', 'Window creation and navigation', 'Pane splits (horizontal/vertical)', 'tmux.conf customization'],
    links: [
      { title: 'tmux Official GitHub', url: 'https://github.com/tmux/tmux', type: 'repo' },
      { title: 'tmux Cheatsheet Guide', url: 'https://tmuxcheatsheet.com/', type: 'doc' },
    ],
    order: 83,
  },
  {
    title: 'GNU Make Manual & Build Automation',
    description: 'The authoritative official manual for GNU Make, the standard tool for automating the compilation and dependency resolution of C/C++ projects.',
    category: 'dev-tools',
    items: ['Target, prerequisite, and rule syntax', 'Automatic variables ($@, $<, $^)', 'Pattern rules and wildcard expansion', '.PHONY targets'],
    links: [
      { title: 'GNU Make Official Manual', url: 'https://www.gnu.org/software/make/manual/', type: 'doc' },
    ],
    order: 84,
  },
  {
    title: 'GDB: The GNU Debugger Guide (Peter Jay Salzman)',
    description: 'A thorough, practical manual explaining how to debug native compiled C and C++ programs from the command line using GDB.',
    category: 'dev-tools',
    items: ['Setting breakpoints & watchpoints', 'Stack backtraces and frame inspection', 'Memory inspection (x command)', 'Core dump post-mortem analysis'],
    links: [
      { title: 'GNU GDB Documentation', url: 'https://www.gnu.org/software/gdb/documentation/', type: 'doc' },
    ],
    order: 85,
  },
  {
    title: 'Valgrind: Memory Debugging & Profiling Suite',
    description: 'The standard open-source framework for detecting dynamic memory leaks, heap buffer overflows, and threading concurrency bugs in C/C++.',
    category: 'dev-tools',
    items: ['Memcheck memory leak detector', 'Invalid read/write detection', 'Uninitialized variable tracking', 'Massif heap profiler'],
    links: [
      { title: 'Valgrind Quick Start Guide', url: 'https://valgrind.org/docs/manual/quick-start.html', type: 'doc' },
    ],
    order: 86,
  },
  {
    title: 'GCC: The GNU Compiler Collection Documentation',
    description: 'The official documentation for GCC, covering compilation switches, warning flags (-Wall, -Wextra), optimization levels, and sanitizers.',
    category: 'dev-tools',
    items: ['Optimization flags (-O2, -O3)', 'Warning flags (-Werror, -pedantic)', 'AddressSanitizer (-fsanitize=address)', 'Linker options'],
    links: [
      { title: 'GCC Online Manuals', url: 'https://gcc.gnu.org/onlinedocs/', type: 'doc' },
    ],
    order: 87,
  },
  {
    title: 'The Missing Semester of Your CS Education (MIT)',
    description: 'MIT\'s renowned open course teaching the essential practical tools omitted from standard CS curricula: shell, text editors, Git, debuggers, and security.',
    category: 'dev-tools',
    items: ['Mastering the Command Shell', 'Vim editor', 'Data wrangling with sed & awk', 'Command-line productivity tools', 'Public key cryptography'],
    links: [
      { title: 'MIT Missing Semester Site', url: 'https://missing.csail.mit.edu/', type: 'course' },
    ],
    order: 88,
  },
  {
    title: 'ripgrep, fd & bat: Modern Coreutils Tools',
    description: 'High-performance Rust-powered terminal tools designed as blazing fast, developer-friendly modern replacements for grep, find, and cat.',
    category: 'dev-tools',
    items: ['ripgrep: Multi-threaded regex search', 'fd: Intuitive file finder', 'bat: Syntax-highlighted cat with Git diff', 'delta: Enhanced git pager'],
    links: [
      { title: 'ripgrep GitHub Repository', url: 'https://github.com/BurntSushi/ripgrep', type: 'repo' },
      { title: 'fd GitHub Repository', url: 'https://github.com/sharkdp/fd', type: 'repo' },
    ],
    order: 89,
  },
  {
    title: 'Dotfiles: Manage Your Linux Configuration',
    description: 'Best practices, tools, and community examples for version-controlling and syncing your Linux terminal dotfiles using Git and GNU Stow.',
    category: 'dev-tools',
    items: ['Dotfiles organization', 'Symlink management with GNU Stow', 'Shell customization (.bashrc, .zshrc)', 'Window manager dotfiles'],
    links: [
      { title: 'Dotfiles Community Portal', url: 'https://dotfiles.github.io/', type: 'doc' },
    ],
    order: 90,
  },

  // ==========================================
  // 10. C & SYSTEMS PROGRAMMING
  // ==========================================
  {
    title: 'Beej\'s Guide to C Programming',
    description: 'Brian "Beej" Hall\'s acclaimed, accessible, humorous, and comprehensive guide to modern C programming (C99, C11, C17, and C23).',
    category: 'systems-c-prog',
    items: ['Pointers and memory layout', 'Dynamic allocation (malloc, calloc, free)', 'Structs, unions, and bitfields', 'File I/O and standard library'],
    links: [
      { title: 'Beej\'s Guide to C (HTML)', url: 'https://beej.us/guide/bgc/', type: 'book' },
    ],
    order: 91,
  },
  {
    title: 'Beej\'s Guide to Network Programming (Sockets)',
    description: 'The universally praised, definitive tutorial on socket programming in C on Unix/Linux systems using IPv4, IPv6, TCP, and UDP.',
    category: 'systems-c-prog',
    items: ['Socket descriptors', 'struct sockaddr and getaddrinfo()', 'TCP client and server architecture', 'Non-blocking sockets with poll()'],
    links: [
      { title: 'Beej\'s Sockets Guide (HTML)', url: 'https://beej.us/guide/bgnet/', type: 'book' },
    ],
    order: 92,
  },
  {
    title: 'The C Programming Language (K&R Exercises)',
    description: 'Dennis Ritchie and Brian Kernighan\'s seminal classic that introduced C and shaped the architecture of modern operating systems.',
    category: 'systems-c-prog',
    items: ['C language syntax and control flow', 'Pointers and arrays', 'Functions and program structure', 'The UNIX system interface'],
    links: [
      { title: 'K&R2 Solutions Wiki', url: 'https://clc-wiki.net/wiki/K%26R2_solutions', type: 'doc' },
    ],
    order: 93,
  },
  {
    title: 'Modern C (Jens Gustedt)',
    description: 'An open-access book explaining C from basic levels up to modern ISO C standards, memory models, multithreading, and type genericity.',
    category: 'systems-c-prog',
    items: ['C memory model & pointers', 'Expressiveness and type safety', 'C11 threads and atomics', 'Performance and optimization'],
    links: [
      { title: 'Modern C Free Book (Inria)', url: 'https://modernc.gforge.inria.fr/', type: 'book' },
    ],
    order: 94,
  },
  {
    title: 'Linux man-pages Project (Section 2 & 3)',
    description: 'Michael Kerrisk\'s official manual pages documenting all Linux kernel system calls (section 2) and C standard library functions (section 3).',
    category: 'systems-c-prog',
    items: ['System calls: fork, execve, waitpid', 'File system calls: open, read, write, close', 'mmap & memory mapping', 'POSIX pthread functions'],
    links: [
      { title: 'Linux man-pages Online', url: 'https://man7.org/linux/man-pages/', type: 'doc' },
    ],
    order: 95,
  },
  {
    title: 'SEI CERT C Coding Standard (Carnegie Mellon)',
    description: 'Rules and recommendations for secure systems coding in C, preventing buffer overflows, integer wraparounds, and memory corruption.',
    category: 'systems-c-prog',
    items: ['Buffer overflow mitigation', 'Memory allocation safety', 'Integer overflow prevention', 'Pointer safety rules'],
    links: [
      { title: 'CERT C Rules Wiki', url: 'https://wiki.sei.cmu.edu/confluence/display/c', type: 'doc' },
    ],
    order: 96,
  },
  {
    title: 'GNU C Library (glibc) Reference Manual',
    description: 'The complete reference manual for the GNU C Library (glibc), the core systems library underpinning all GNU/Linux applications.',
    category: 'systems-c-prog',
    items: ['Memory management (malloc, free, brk, sbrk)', 'POSIX signal handling', 'Process creation and IPC', 'Low-level terminal I/O'],
    links: [
      { title: 'glibc Reference Manual', url: 'https://www.gnu.org/software/libc/manual/', type: 'doc' },
    ],
    order: 97,
  },
  {
    title: 'Build Your Own Text Editor (Kilo in C)',
    description: 'A step-by-step tutorial building a complete, real-time command-line text editor from scratch in pure C without external dependencies.',
    category: 'systems-c-prog',
    items: ['Raw terminal mode (termios)', 'ANSI escape sequences', 'Screen refresh and rendering', 'Append buffer data structures', 'Syntax highlighting'],
    links: [
      { title: 'Kilo Editor Tutorial (Snaptoken)', url: 'https://viewsourcecode.org/snaptoken/kilo/', type: 'interactive' },
    ],
    order: 98,
  },
  {
    title: 'Build Your Own Lisp (Daniel Holden)',
    description: 'Learn C and programming language implementation by building your own Lisp language interpreter and parser from the ground up.',
    category: 'systems-c-prog',
    items: ['Parsing using parser combinators', 'S-Expressions and ASTs', 'Functions and variable environments', 'Garbage collection principles'],
    links: [
      { title: 'Build Your Own Lisp Online', url: 'https://www.buildyourownlisp.com/', type: 'book' },
    ],
    order: 99,
  },
  {
    title: 'Linux Kernel Module Programming Guide (LKMPG)',
    description: 'A comprehensive hands-on guide to writing and loading kernel modules, character device drivers, procfs entries, and system calls in C.',
    category: 'systems-c-prog',
    items: ['Kernel module hello world', 'Module initialization & cleanup', 'Character device drivers', 'Communicating via procfs and sysfs', 'printk kernel logging'],
    links: [
      { title: 'LKMPG Online Guide', url: 'https://sysprog21.github.io/lkmpg/', type: 'book' },
      { title: 'GitHub Repository', url: 'https://github.com/sysprog21/lkmpg', type: 'repo' },
    ],
    order: 100,
  },
  {
    title: 'Julia Evans: Networking & Packet Inspection Comics',
    description: 'A collection of visual guides detailing how packets travel through Linux interfaces, Wireshark packet capture, and TCP handshakes.',
    category: 'systems-c-prog',
    items: ['TCP handshake & Teardown', 'Wireshark packet analysis', 'Network interface queues', 'DNS resolution path'],
    links: [
      { title: 'Wizard Zines Networking', url: 'https://wizardzines.com/zines/bite-size-networking/', type: 'doc' },
    ],
    order: 101,
  },
  {
    title: 'NeetCode 150 Core Practice Sheet',
    description: 'A curated list of 150 representative coding interview and algorithmic problems grouped by data structure and algorithmic pattern.',
    category: 'algorithms-dsa',
    items: ['Arrays & Hashing', 'Two Pointers & Sliding Window', 'Trees & Tries', 'Dynamic Programming 1D & 2D'],
    links: [
      { title: 'NeetCode 150 Sheet', url: 'https://neetcode.io/practice', type: 'interactive' },
    ],
    order: 102,
  },
  {
    title: 'Free Software Foundation (FSF): The GNU Operating System',
    description: 'Historical archive and philosophical essays on the origins of the GNU Project, Copyleft, and the social imperative for software freedom.',
    category: 'open-source',
    items: ['The GNU Manifesto', 'What is Copyleft?', 'Why Software Should Not Have Owners', 'Categories of Free and Nonfree Software'],
    links: [
      { title: 'GNU Philosophy Archives', url: 'https://www.gnu.org/philosophy/', type: 'doc' },
    ],
    order: 103,
  },
  {
    title: 'CS50\'s Understanding Technology',
    description: 'Harvard University\'s introductory course designed for students who use technology every day but want to understand how it works under the hood.',
    category: 'cs-intro',
    items: ['Hardware components', 'Internet routing & IP', 'Multimedia representation', 'Security & Encryption'],
    links: [
      { title: 'CS50 Understanding Technology', url: 'https://cs50.harvard.edu/technology/', type: 'course' },
    ],
    order: 104,
  },
];

async function seedResources() {
  console.log('[Seed Resources] Connecting to MongoDB...');
  await connectDB();

  console.log('[Seed Resources] Locating author @glug_jec...');
  let author = await User.findOne({ username: 'glug_jec' });

  if (!author) {
    console.log('[Seed Resources] User glug_jec not found by exact match. Checking case-insensitive...');
    author = await User.findOne({ username: { $regex: /^glug_jec$/i } });
  }

  if (!author) {
    console.log('[Seed Resources] User glug_jec still not found. Checking for admin users...');
    author = await User.findOne({ role: 'admin' });
  }

  if (!author) {
    console.error('[Seed Resources Error] No valid user found to attribute resources to. Please ensure at least one user exists.');
    process.exit(1);
  }

  console.log(`[Seed Resources] Attributing all resources to author: @${author.username} (${author._id})`);

  console.log(`[Seed Resources] Clearing existing Resource collection...`);
  const deleteResult = await Resource.deleteMany({});
  console.log(`[Seed Resources] Removed ${deleteResult.deletedCount} old resource document(s).`);

  console.log(`[Seed Resources] Inserting ${CURATED_RESOURCES.length} curated resources across 10 genres...`);

  const documents = CURATED_RESOURCES.map((res, index) => {
    const slug = res.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const sampleFiles = [];
    if (res.category === 'cs-intro' && index === 0) {
      sampleFiles.push(
        {
          name: 'CS50 Lecture Notes & Handouts',
          url: 'https://github.com/cs50/docs/archive/refs/heads/main.zip',
          format: 'pdf',
          size: '18.4 MB',
          description: 'Official lecture slide summaries and syllabus',
        },
        {
          name: 'Problem Sets & Starter Code',
          url: 'https://github.com/cs50/problems/archive/refs/heads/main.zip',
          format: 'zip',
          size: '24.1 MB',
          description: 'Weekly C and Python assignment templates',
        }
      );
    } else if (res.category === 'linux-basics' || res.category === 'linux-sysadmin') {
      sampleFiles.push({
        name: 'GLUG Linux Command Line Survival Kit',
        url: 'https://github.com/glugjec/resources-mirror/releases/download/v1.0/linux-cli-handbook.pdf',
        format: 'pdf',
        size: '4.8 MB',
        description: 'Comprehensive bash and sysadmin cheatsheet',
      });
    } else if (res.category === 'operating-systems') {
      sampleFiles.push({
        name: 'xv6 OS Source Code & Kernel Labs',
        url: 'https://github.com/mit-pdos/xv6-riscv/archive/refs/heads/riscv.zip',
        format: 'zip',
        size: '1.2 MB',
        description: 'RISC-V teaching operating system repository bundle',
      });
    } else if (res.category === 'algorithms-dsa') {
      sampleFiles.push({
        name: 'DSA Visual Cheat Sheets & Code Snippets',
        url: 'https://github.com/glugjec/dsa-notes/archive/refs/heads/main.zip',
        format: 'pdf',
        size: '8.2 MB',
        description: 'Time complexity charts and tree traversal diagrams',
      });
    }

    return {
      ...res,
      slug,
      difficulty: res.difficulty || (index % 3 === 0 ? 'beginner' : index % 3 === 1 ? 'intermediate' : 'advanced'),
      isFeatured: res.isFeatured ?? (index < 5 || index % 10 === 0),
      files: res.files && res.files.length > 0 ? res.files : sampleFiles,
      order: res.order || index + 1,
      createdBy: author._id,
    };
  });

  const inserted = await Resource.insertMany(documents);
  console.log(`[Seed Resources] Successfully inserted ${inserted.length} resources!`);

  // Print breakdown by category
  const categoryCounts = {};
  for (const doc of inserted) {
    categoryCounts[doc.category] = (categoryCounts[doc.category] || 0) + 1;
  }

  console.log('[Seed Resources] Category breakdown:');
  for (const [cat, count] of Object.entries(categoryCounts)) {
    console.log(`  - ${cat}: ${count} resources`);
  }

  console.log(`[Seed Resources] Total resources in database: ${await Resource.countDocuments()}`);
  console.log('[Seed Resources] Done!');

  await mongoose.disconnect();
  process.exit(0);
}

seedResources().catch((err) => {
  console.error('[Seed Resources Error]', err);
  process.exit(1);
});

