# PROJECT MASTER DIRECTIVE: KryptonOS Realistic Linux Sandbox & Desktop Simulator

You are acting as a Senior Systems Architect, Linux Kernel Engineer, and Frontend Virtualization Specialist. Your goal is to engineer KryptonOS into an authentic, production-grade, 1:1 sandbox operating system simulator with zero fictional/hallucinated tech jargon.

================================================================================
1. HARDWARE POST, BIOS/UEFI & BOOT LIFECYCLE
================================================================================
- Authentic BIOS/POST Screen:
  * Emulate exact American Megatrends (AMI Aptio) or Award BIOS POST screens.
  * Real hardware strings: Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz or AMD Ryzen 7 5800X 8-Core Processor.
  * Real RAM timings & standards (e.g., "DDR4-3200 Dual-Channel 16384MB OK").
  * Real storage identification: "SATA Port 1: Samsung SSD 870 EVO 500GB (ext4)", "NVMe M.2_1: Samsung SSD 980 PRO 1TB (PCIe 4.0 x4)", "USB Port 1: SanDisk Ultra USB 3.0 32GB".
  * Standard key bindings: DEL / F2 (Setup), F11 / F12 (Boot Menu).
- GRUB & Kernel Init:
  * Real GNU GRUB 2.06 menu and fallback `grub rescue>` environment.
  * Authentic Linux boot sequence (`/sbin/init` or systemd target outputs: `[  OK  ] Started D-Bus System Message Bus`, `[  OK  ] Mounted /boot`, etc.).

================================================================================
2. VIRTUAL FILESYSTEM (VFS) & DIRECTORY HIERARCHY
================================================================================
- Strict adherence to Linux Filesystem Hierarchy Standard (FHS 3.0):
  * `/bin`, `/sbin`, `/usr/bin`, `/usr/sbin`: Symlinked or containing standard GNU Coreutils binaries.
  * `/etc/`: Authentic config files with exact Debian/Ubuntu syntax:
    - `/etc/os-release` (NAME="KryptonOS GNU/Linux", VERSION="1.0 LTS", ID=krypton, ID_LIKE=debian)
    - `/etc/passwd`, `/etc/group`, `/etc/shadow` (permission-restricted 0640/0600), `/etc/sudoers`
    - `/etc/fstab`, `/etc/hosts`, `/etc/resolv.conf`, `/etc/hostname`, `/etc/apt/sources.list`
  * `/proc/` & `/sys/`: Dynamic pseudo-filesystems:
    - `/proc/version`, `/proc/cpuinfo`, `/proc/meminfo`, `/proc/uptime`, `/proc/loadavg`, `/proc/partitions`, `/proc/cmdline`
    - `/sys/class/power_supply/BAT0/capacity`, `/sys/class/net/eth0/address`
  * `/dev/`: Character and block device nodes (`/dev/nvme0n1`, `/dev/nvme0n1p1..p3`, `/dev/sda`, `/dev/sda1`, `/dev/null`, `/dev/zero`, `/dev/urandom`, `/dev/tty`).
  * `/var/log/`: Real syslog, auth.log, dpkg.log, dmesg format with ISO/system timestamps.
  * `/home/guest/` and `/root/`: User homes with `.bashrc`, `.profile`, `.bash_history`.

================================================================================
3. SHELL ENGINE, COMMANDS & POSIX COMPLIANCE
================================================================================
- Authentic GNU Bash 5.x emulation:
  * Standard prompt: `guest@krypton-station:~$ ` (and `#` for root).
  * Exact standard error strings:
    - `bash: <cmd>: command not found`
    - `ls: cannot access '<path>': No such file or directory`
    - `cat: <file>: Permission denied`
    - `rm: cannot remove '<file>': Is a directory`
- Execution Pipeline:
  * Support pipes (`|`), overwrite (`>`), append (`>>`), logical AND (`&&`), sequence (`;`), and `$VAR` parameter expansion.
  * Shell Builtins vs Executables: Proper handling of `cd`, `pwd`, `echo`, `export`, `alias`, `history`, `clear`.
  * Core Utilities: `ls (-la, -lh)`, `cat (-n)`, `grep (-i, -v, -n)`, `head`, `tail`, `wc`, `sort`, `uniq`, `find`, `chmod`, `chown`, `stat`, `diff`, `tree`.
  * Diagnostics: `uname (-a)`, `neofetch`, `free (-h)`, `df (-h)`, `uptime`, `lscpu`, `lspci`, `lsusb`, `lsblk`, `top`/`htop`, `ping`, `ifconfig`/`ip a`.

================================================================================
4. PACKAGE MANAGER ARCHITECTURE (APT & DPKG)
================================================================================
- Realistic APT workflow:
  * Repository storage mapped to `/apt/<appname>.deb` or structured JSON packages.
  * Commands: `sudo apt update`, `sudo apt install <pkg>`, `sudo apt remove <pkg>`, `dpkg -s <pkg>`, `dpkg -l`, `dpkg -i <archive.deb>`.
  * Authentic terminal spinners and progress bars (`Reading package lists... Done`, `Unpacking...`, `Setting up...`).
  * App deployment: Unpacks binaries into `/bin` or `/usr/bin`, registers control metadata, and creates Desktop `.desktop` launcher shortcuts if GUI-enabled.

================================================================================
5. SYSTEM INTEGRITY, DESTRUCTION & RECOVERY MECHANICS
================================================================================
- Destructive Sandbox Logic:
  * Running `sudo rm -rf / --no-preserve-root` methodically deletes nodes from the VFS tree in memory.
  * Unlinking `/bin` immediately breaks shell commands (returns `No such file or directory`).
  * Rebooting after `/boot` or `/etc/fstab` deletion drops into the authentic `grub rescue>` shell with real partition commands (`ls`, `set root=`, `insmod normal`).
  * Live USB / Recovery Environment allows mounting partition to repair or reinstall.

================================================================================
6. RESEARCH & VERIFICATION MANDATE
================================================================================
- NEVER guess or invent syntax, hardware models, or command outputs.
- Search the web or reference official Debian/GNU documentation and man pages whenever implementing any new tool, file structure, or visual aesthetic.
- Prioritize realistic layout fidelity, ANSI color accuracy, and authentic Unix behaviors.

================================================================================
7. DEPLOYMENT & VERSION CONTROL LIFECYCLE (FIREBASE & GITHUB)
================================================================================
- Selective Firebase Deployment:
  * Deploy to Firebase Hosting (`firebase deploy --only hosting`) ONLY when changes affect web-facing assets, frontend files, styles, scripts, or hosting configuration (`index.html`, `js/**`, `css/**`, `apt/**`, `firebase.json`).
  * Provide the live URL (`https://krypton-os.web.app`) in the summary when deployed.
- Mandatory GitHub Synchronization:
  * Every completed modification, feature update, or bug fix MUST be committed and pushed to the remote GitHub repository at `https://github.com/CreatorPoints/Krypton-OS`:
    `git add -A && git commit -m "<concise message>" && git push origin <branch>`
