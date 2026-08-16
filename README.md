# 🐧 KryptonOS: Realistic Linux Desktop & Sandbox Simulator

[![Live Demo](https://img.shields.io/badge/Live_Demo-krypton--os.web.app-00e5ff?style=for-the-badge&logo=firebase)](https://krypton-os.web.app)
[![Linux Standard](https://img.shields.io/badge/Standard-FHS_3.0_%26_POSIX-10b981?style=for-the-badge&logo=linux)](https://github.com/CreatorPoints/Krypton-OS)
[![Architecture](https://img.shields.io/badge/Arch-x86__64_%2F_Wayland-7928ca?style=for-the-badge)](https://github.com/CreatorPoints/Krypton-OS)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> **"An authentic, breakable, 1:1 realistic Linux operating system simulator in your browser with zero fictional tech jargon."**

**KryptonOS** is a client-side Linux workstation and sandbox operating system simulator engineered with pure modern web technologies (HTML5, Vanilla CSS3, ES Modules). It faithfully replicates hardware POST routines, UEFI setup, Linux FHS 3.0 directory trees, GNU Coreutils CLI behaviors, APT package management, and system destruction/recovery lifecycles.

---

## 🌐 Live Production Deployment

- **Official Web Instance**: **[https://krypton-os.web.app](https://krypton-os.web.app)**
- **Firebase Mirror**: [https://krypton-os.firebaseapp.com](https://krypton-os.firebaseapp.com)
- **Source Repository**: [https://github.com/CreatorPoints/Krypton-OS](https://github.com/CreatorPoints/Krypton-OS)

---

## ⚡ Core Engineering & Architecture

### 🖥️ 1. Hardware POST, BIOS/UEFI & Boot Sequence
- **Authentic Motherboard POST**: Accurate American Megatrends (AMI Aptio V) POST banner with real-world hardware telemetry:
  - **CPU**: `Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz` (8 Cores, 16 Threads)
  - **Memory**: `DDR4-3200 Dual-Channel 16384 MB OK`
  - **Storage**: `Samsung SSD 980 PRO 1TB (PCIe 4.0 NVMe)` + `SanDisk Ultra 32GB USB`
- **Interactive Aptio Setup Utility**: Navigate Main, Advanced, Security, and Boot priority tabs with keyboard navigation (`DEL` / `F2` / `F11`).
- **GNU GRUB 2.06 & Kernel Init**: Authentic `systemd` target initialization logs and fallback `grub rescue>` partition explorer.

---

### 📁 2. Linux FHS 3.0 Virtual Filesystem (VFS)
Strict adherence to the Linux Filesystem Hierarchy Standard:
- **`/proc/` & `/sys/` Dynamic Pseudo-Filesystems**:
  - `/proc/cpuinfo`, `/proc/meminfo`, `/proc/version`, `/proc/uptime`, `/proc/loadavg`, `/proc/partitions`, `/proc/cmdline`
  - `/sys/class/power_supply/BAT0/capacity`, `/sys/class/net/eth0/address`
- **`/etc/` Authentic Debian System Configurations**:
  - `/etc/os-release` (NAME="KryptonOS GNU/Linux", VERSION="1.0 LTS", ID=krypton, ID_LIKE=debian)
  - `/etc/passwd`, `/etc/group`, `/etc/shadow` (permission-restricted 0640/0600), `/etc/sudoers`
  - `/etc/fstab`, `/etc/hosts`, `/etc/resolv.conf`, `/etc/hostname`, `/etc/apt/sources.list`
- **`/dev/` Character & Block Devices**: Standard POSIX device nodes (`/dev/nvme0n1`, `/dev/nvme0n1p1..p3`, `/dev/sda`, `/dev/sda1`, `/dev/null`, `/dev/zero`, `/dev/urandom`, `/dev/tty`).
- **`/var/log/` System Logs**: Standard `/var/log/syslog`, `/var/log/auth.log`, `/var/log/dmesg`, and `/var/log/dpkg.log`.

---

### 💻 3. GNU Bash 5.x CLI & Coreutils Pipeline
- **POSIX Execution Pipeline**: Full support for input/output redirection (`>`, `>>`), pipes (`|`), logical chaining (`&&`), command sequencing (`;`), and environment parameter expansions (`$VAR`, `$?`).
- **Core GNU Utilities**: `ls (-la, -lh)`, `cat (-n)`, `grep (-i, -v, -n)`, `head`, `tail`, `wc`, `sort`, `uniq`, `find`, `chmod`, `chown`, `stat`, `diff`, `tree`.
- **System Diagnostics**:
  - `lscpu`: Replicates official `util-linux` CPU architecture tables.
  - `lspci`: Authentic PCI devices (Host Bridge, Comet Lake PCH, NVIDIA GeForce RTX 3080, NVMe Controller).
  - `lsusb`: Genuine USB vendor/product IDs (SanDisk, Logitech Unifying Receiver, Linux Foundation root hubs).
  - `lsblk`: Hierarchical NVMe/SATA partition tree mapping.
  - `neofetch`: Authentic distribution information, terminal telemetry, and memory metrics.
  - `free -h` & `df -h`: Accurate 1K-block and human-readable capacity calculations.

---

### 💿 4. Calamares / Ubiquity Style OS Installer
Step-by-step graphical operating system installation wizard:
1. **Language**: System locale configuration (`en_US.UTF-8`, `es_ES`, `de_DE`, etc.).
2. **Timezone**: Regional clock calibration.
3. **Network**: Wi-Fi & wired network selection.
4. **User ("Who are you?")**: Primary user provisioning (`Your Name`, `Hostname`, `Username`, `Password`, `Auto-login`).
5. **Destination Disk**: NVMe target selection (`/dev/nvme0n1`).
6. **Installation Engine**: Dynamic multi-stage package unpacking, kernel initramfs compilation, and GRUB EFI installation.

---

### 📦 5. APT & dpkg Package Management
- **Debian Control Packages**: Stored in `/apt/*.deb` with standard package control metadata.
- **Commands**:
  ```bash
  sudo apt update
  sudo apt install <pkg>
  sudo apt remove <pkg>
  sudo dpkg -i /apt/<pkg>.deb
  dpkg -s <pkg>
  dpkg -l
  ```
- **Included Packages**: `cmatrix`, `cowsay`, `neofetch`, `sl`, `krypton-desktop`, `krypton-browser`, `krypton-taskmgr`, `krypton-filemgr`, `krypton-notes`, `krypton-calculator`, `adblock`.

---

### 🌐 6. Integrated Desktop Applications
- **Krypton Browser**: Live sandboxed embedded web browser with DuckDuckGo search queries, live website rendering (`https://...`), `/var/www/html` local HTTP web server integration, and `/etc/hosts` DNS sinkhole filtering.
- **System Monitor (Task Manager)**: Live process monitoring of authentic Linux daemons (`systemd`, `systemd-journald`, `krypton-wm`, `bash`, `sshd`).
- **System Log Viewer**: Graphical diagnostics interface for `/var/log/syslog`, `/var/log/auth.log`, `/var/log/dmesg`, and `/var/log/dpkg.log`.
- **File Explorer**: Graphical VFS storage navigator rooted at `/home/<user>/`.
- **Text Editor**: Lightweight file and script editor.
- **Calculator**: Clean desktop arithmetic utility.
- **Settings**: Wayland display configuration, audio feedback, and visual themes.

---

### 💥 7. Destructive Sandbox & GRUB Rescue Mechanics
- Running `sudo rm -rf / --no-preserve-root` deletes virtual nodes in memory.
- Unlinking `/bin` breaks shell command execution (`No such file or directory`).
- Rebooting after `/boot` or `/etc/fstab` deletion drops into the authentic **GNU GRUB Rescue Shell (`grub rescue>`)** supporting real rescue commands (`ls`, `set root=`, `insmod normal`).
- Dropping out of GUI desktop with `systemctl stop krypton-desktop` drops into **TTY1 fullscreen teletype mode**; restore via `startx` or `systemctl start krypton-desktop`.

---

## 🚀 Running Locally

No compiler or build toolchain required! Simply serve the directory with any static web server:

```bash
# Using Python
python3 -m http.server 8080

# Or using Node http-server / npx serve
npx serve .
```

Then open `http://localhost:8080` in your web browser.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
