#!/usr/bin/env python3
"""
KryptonOS Package Builder & Repository Catalog Generator
Packages applications and system components into authentic .deb archives with real payloads,
calculates SHA-256 hashes, and outputs packages.json for Krypton-Repo.
"""

import os
import json
import hashlib
from pathlib import Path

REPO_ROOT = Path("/home/shrestangsu-dutta/Documents/Krypton-Repo")
OS_ROOT = Path("/home/shrestangsu-dutta/Documents/Krypton-OS")

def get_file_content(path: Path) -> str:
    alt_path = OS_ROOT / "js" / "apps" / path.name
    if alt_path.exists():
        with open(alt_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Also sync to repo src if repo root exists
            if path.parent.exists():
                try:
                    with open(path, 'w', encoding='utf-8') as rf:
                        rf.write(content)
                except Exception:
                    pass
            return content
    if path.exists():
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    raise FileNotFoundError(f"Cannot find source file at {alt_path} or {path}")

def sha256_str(content: str) -> str:
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def make_deb_payload(pkg_meta: dict, files: dict) -> str:
    """Create a structured JSON .deb package payload containing control metadata and files."""
    payload = {
        "format": "krypton-deb-1.0",
        "package": pkg_meta["id"],
        "version": pkg_meta["version"],
        "architecture": pkg_meta.get("arch", "amd64"),
        "maintainer": pkg_meta.get("maintainer", "Krypton Core Team <packages@krypton-os.org>"),
        "section": pkg_meta.get("section", "universe"),
        "description": pkg_meta.get("summary", pkg_meta.get("description", "")),
        "files": files
    }
    return json.dumps(payload, indent=2)

def build_all_packages():
    print("=" * 80)
    print("  KRYPTON-OS PACKAGE BUILDER")
    print("=" * 80)

    # Read base app sources from Krypton-Repo/src/apps/
    apps_dir = REPO_ROOT / "src" / "apps"

    system_packages = [
        {
            "id": "base-files",
            "name": "base-files",
            "file": "base-files.deb",
            "version": "1.0.0",
            "arch": "amd64",
            "section": "admin",
            "summary": "KryptonOS Core System Files & OS Identity Manifest",
            "files": {
                "/etc/os-release": 'NAME="KryptonOS"\nVERSION="1.0.0.0"\nID=krypton\nID_LIKE=debian\nPRETTY_NAME="Krypton 1.0.0.0 LTS"\nVERSION_ID="1.0.0.0"\nVERSION_CODENAME=beryllium\nHOME_URL="https://krypton-os.org/"\nSUPPORT_URL="https://krypton-os.org/support"\nBUG_REPORT_URL="https://bugs.krypton-os.org/"\n',
                "/etc/issue": "Krypton 1.0.0.0 LTS \\n \\l\n",
                "/etc/motd": "\n=======================================================\n  Welcome to Krypton 1.0.0.0 LTS (Linux 6.10.0-generic)\n  * Full Modern Desktop Suite Unlocked!\n  * Documentation:  https://krypton-os.org/docs\n  * Support:        https://krypton-os.org/support\n=======================================================\n"
            }
        },
        {
            "id": "linux-image-krypton-generic",
            "name": "linux-image-krypton-generic",
            "file": "linux-image-6.10.0-krypton-generic.deb",
            "version": "6.10.0-1",
            "arch": "amd64",
            "section": "kernel",
            "summary": "Linux Kernel Image 6.10.0 with Wayland, NVMe, and POSIX subsystems",
            "files": {
                "/boot/vmlinuz-6.10.0-krypton-generic": "ELF 64-bit LSB executable, x86-64, Linux 6.10.0-krypton-generic (gcc-13.2.0)",
                "/boot/initrd.img-6.10.0-krypton-generic": "ASCII cpio archive (SVR4 with CRC), initial ramdisk rootfs image",
                "/boot/grub/grub.cfg": "# GRUB 2.06\nset default=0\nset timeout=3\nmenuentry 'Krypton 1.0.0.0 LTS (Linux 6.10.0-krypton-generic)' {\n  linux /boot/vmlinuz-6.10.0-krypton-generic root=UUID=7f8a-99b2-krypton ro quiet splash\n  initrd /boot/initrd.img-6.10.0-krypton-generic\n}\nmenuentry 'Krypton OS 0.1 Alpha (Linux 2.0.0.14-generic-krypton)' {\n  linux /boot/vmlinuz-2.0.0.14-generic-krypton root=UUID=7f8a-99b2-krypton ro quiet splash\n  initrd /boot/initrd.img-2.0.0.14-generic-krypton\n}\n"
            }
        }
    ]

    packages_def = [
        {
            "id": "krypton-browser",
            "name": "krypton-browser",
            "file": "krypton-browser.deb",
            "version": "1.0.0-release",
            "arch": "amd64",
            "section": "web/browsers",
            "summary": "Quantum Sandboxed Web Browser with Google Search Engine & Tab Manager",
            "desktop_name": "Web Browser",
            "desktop_icon": "🌐",
            "src": apps_dir / "browser.js"
        },
        {
            "id": "krypton-calculator",
            "name": "krypton-calculator",
            "file": "krypton-calculator.deb",
            "version": "1.0.2-release",
            "arch": "amd64",
            "section": "math/calculators",
            "summary": "Scientific and standard desktop calculator with arithmetic parser",
            "desktop_name": "Calculator",
            "desktop_icon": "🧮",
            "src": apps_dir / "calculator.js"
        },
        {
            "id": "krypton-notes",
            "name": "krypton-notes",
            "file": "krypton-notes.deb",
            "version": "1.1.0-release",
            "arch": "amd64",
            "section": "editors/text",
            "summary": "Lightweight GUI text editor and markdown notepad for desktop workspace",
            "desktop_name": "Text Editor",
            "desktop_icon": "📝",
            "src": apps_dir / "notes.js"
        },
        {
            "id": "krypton-clock",
            "name": "krypton-clock",
            "file": "krypton-clock.deb",
            "version": "1.1.0-release",
            "arch": "amd64",
            "section": "utils/clock",
            "summary": "World Clock, Stopwatch, Countdown Timer and System Alarms",
            "desktop_name": "Clock & Alarms",
            "desktop_icon": "⏰",
            "src": apps_dir / "clock.js"
        },
        {
            "id": "krypton-filemgr",
            "name": "krypton-filemgr",
            "file": "krypton-filemgr.deb",
            "version": "1.0.4-release",
            "arch": "amd64",
            "section": "utils/files",
            "summary": "Interactive Virtual Filesystem File Explorer & Directory Navigator",
            "desktop_name": "File Explorer",
            "desktop_icon": "📁",
            "src": apps_dir / "filemgr.js"
        },
        {
            "id": "krypton-taskmgr",
            "name": "krypton-taskmgr",
            "file": "krypton-taskmgr.deb",
            "version": "1.3.0-release",
            "arch": "amd64",
            "section": "admin/monitoring",
            "summary": "GUI System Monitor, Real-Time 1Hz Telemetry Gauges, Component RAM Profiler & Process Killer",
            "desktop_name": "System Monitor",
            "desktop_icon": "📊",
            "src": apps_dir / "taskmgr.js"
        },
        {
            "id": "krypton-settings",
            "name": "krypton-settings",
            "file": "krypton-settings.deb",
            "version": "1.0.0-release",
            "arch": "amd64",
            "section": "admin/settings",
            "summary": "KryptonOS Control Center, Wallpaper Switcher, Accounts & Appearance",
            "desktop_name": "Settings",
            "desktop_icon": "⚙️",
            "src": apps_dir / "settings.js"
        },
        {
            "id": "krypton-messages",
            "name": "krypton-messages",
            "file": "krypton-messages.deb",
            "version": "1.0.1-release",
            "arch": "amd64",
            "section": "admin/logs",
            "summary": "Real-time systemd-journald Log Streamer and Diagnostics Monitor",
            "desktop_name": "System Logs",
            "desktop_icon": "📋",
            "src": apps_dir / "messages.js"
        }
    ]

    cli_packages = [
        {
            "id": "cmatrix",
            "name": "cmatrix",
            "file": "cmatrix.deb",
            "version": "2.0-3",
            "arch": "amd64",
            "section": "utils/console",
            "summary": "Matrix Digital Rain Terminal Screensaver",
            "files": {
                "/usr/bin/cmatrix": "#!/bin/bash\n# cmatrix binary executable\n",
                "/usr/share/man/man1/cmatrix.1.gz": "man page for cmatrix"
            }
        },
        {
            "id": "cowsay",
            "name": "cowsay",
            "file": "cowsay.deb",
            "version": "3.03+dfsg2-8",
            "arch": "all",
            "section": "games/toys",
            "summary": "Configurable talking and thinking ASCII cow",
            "files": {
                "/usr/games/cowsay": "#!/bin/bash\n# cowsay executable\n",
                "/usr/bin/cowsay": "#!/bin/bash\nexec /usr/games/cowsay \"$@\"\n",
                "/usr/share/man/man6/cowsay.6.gz": "man page for cowsay"
            }
        },
        {
            "id": "sl",
            "name": "sl",
            "file": "sl.deb",
            "version": "5.02-1",
            "arch": "amd64",
            "section": "games/toys",
            "summary": "Steam Locomotive animator for typo correction",
            "files": {
                "/usr/games/sl": "#!/bin/bash\n# sl steam locomotive executable\n",
                "/usr/bin/sl": "#!/bin/bash\nexec /usr/games/sl \"$@\"\n"
            }
        },
        {
            "id": "neofetch",
            "name": "neofetch",
            "file": "neofetch.deb",
            "version": "7.1.0-2",
            "arch": "all",
            "section": "utils/system",
            "summary": "Fast, highly customizable CLI system info diagnostic tool",
            "files": {
                "/usr/bin/neofetch": "#!/bin/bash\n# neofetch system info fetcher\n"
            }
        },
        {
            "id": "antigravity",
            "name": "antigravity",
            "file": "antigravity.deb",
            "version": "4.2.0-beryllium",
            "arch": "all",
            "section": "utils/fun",
            "summary": "Physics modifier setting gravitational constant to 0.0 for floating windows",
            "files": {
                "/usr/bin/antigravity": "#!/bin/bash\necho \"[ OK ] Gravity constant set to 0.0 m/s^2. Windows floating!\"\n"
            }
        }
    ]

    catalog = []

    # 1. Build System Packages
    for p in system_packages:
        deb_content = make_deb_payload(p, p["files"])
        deb_hash = sha256_str(deb_content)
        deb_size = len(deb_content.encode('utf-8'))
        uncompressed_size = sum(len(content.encode('utf-8')) for content in p["files"].values())

        repo_deb_path = REPO_ROOT / "apt" / p["file"]
        with open(repo_deb_path, 'w', encoding='utf-8') as f:
            f.write(deb_content)

        os_deb_path = OS_ROOT / "apt" / p["file"]
        with open(os_deb_path, 'w', encoding='utf-8') as f:
            f.write(deb_content)

        catalog.append({
            "id": p["id"],
            "name": p["name"],
            "version": p["version"],
            "architecture": p["arch"],
            "section": p["section"],
            "size": deb_size,
            "installed_size": uncompressed_size,
            "sha256": deb_hash,
            "file": p["file"],
            "summary": p["summary"],
            "maintainer": "Krypton Core Maintainers <packages@krypton-os.org>"
        })
        print(f"  [+] Built {p['file']:<35} | Size: {deb_size:>6} B | Installed: {uncompressed_size:>6} B")

    # 2. Build GUI Packages
    for p in packages_def:
        raw_code = get_file_content(p["src"])
        # Wrap module to ensure export launch function is available
        export_wrapped_code = raw_code
        if "export function launch" not in export_wrapped_code:
            export_wrapped_code += f"""

// Dynamic App Loader Entrypoint
export function launch({{ wm, vfs, sound, story, boot, args }}) {{
    if (typeof open{p['desktop_name'].replace(' ', '')} === 'function') {{
        return open{p['desktop_name'].replace(' ', '')}(args);
    }}
    const exportsList = Object.keys(exports || {{}});
    if (exportsList.length > 0 && typeof exports[exportsList[0]] === 'function') {{
        return exports[exportsList[0]](args);
    }}
}}
export default launch;
"""

        short_id = p["id"].replace("krypton-", "")
        files = {
            f"/usr/bin/{p['id']}": f"#!/bin/bash\nexec /usr/lib/{p['id']}/index.js \"$@\"\n",
            f"/usr/share/applications/{short_id}.desktop": f"[Desktop Entry]\nName={p['desktop_name']}\nExec={p['id']}\nIcon={p['desktop_icon']}\nType=Application\nCategories={p['section'].split('/')[0].capitalize()};\nComment={p['summary']}\n",
            f"/usr/lib/{p['id']}/index.js": export_wrapped_code
        }

        deb_content = make_deb_payload(p, files)
        deb_hash = sha256_str(deb_content)
        deb_size = len(deb_content.encode('utf-8'))
        uncompressed_size = sum(len(content.encode('utf-8')) for content in files.values())

        repo_deb_path = REPO_ROOT / "apt" / p["file"]
        with open(repo_deb_path, 'w', encoding='utf-8') as f:
            f.write(deb_content)

        os_deb_path = OS_ROOT / "apt" / p["file"]
        with open(os_deb_path, 'w', encoding='utf-8') as f:
            f.write(deb_content)

        catalog.append({
            "id": p["id"],
            "name": p["name"],
            "version": p["version"],
            "architecture": p["arch"],
            "section": p["section"],
            "size": deb_size,
            "installed_size": uncompressed_size,
            "sha256": deb_hash,
            "file": p["file"],
            "summary": p["summary"],
            "maintainer": "Krypton Maintainers <packages@krypton-os.org>"
        })
        print(f"  [+] Built {p['file']:<35} | Size: {deb_size:>6} B | Installed: {uncompressed_size:>6} B")

    # 3. Build CLI Packages
    for p in cli_packages:
        deb_content = make_deb_payload(p, p["files"])
        deb_hash = sha256_str(deb_content)
        deb_size = len(deb_content.encode('utf-8'))
        uncompressed_size = sum(len(content.encode('utf-8')) for content in p["files"].values())

        repo_deb_path = REPO_ROOT / "apt" / p["file"]
        with open(repo_deb_path, 'w', encoding='utf-8') as f:
            f.write(deb_content)

        os_deb_path = OS_ROOT / "apt" / p["file"]
        with open(os_deb_path, 'w', encoding='utf-8') as f:
            f.write(deb_content)

        catalog.append({
            "id": p["id"],
            "name": p["name"],
            "version": p["version"],
            "architecture": p["arch"],
            "section": p["section"],
            "size": deb_size,
            "installed_size": uncompressed_size,
            "sha256": deb_hash,
            "file": p["file"],
            "summary": p["summary"],
            "maintainer": "Krypton Maintainers <packages@krypton-os.org>"
        })
        print(f"  [+] Built {p['file']:<35} | Size: {deb_size:>6} B | Installed: {uncompressed_size:>6} B")

    # 4. Write packages.json catalog
    catalog_json = json.dumps(catalog, indent=2)
    with open(REPO_ROOT / "apt" / "packages.json", 'w', encoding='utf-8') as f:
        f.write(catalog_json)
    with open(OS_ROOT / "apt" / "packages.json", 'w', encoding='utf-8') as f:
        f.write(catalog_json)

    print("=" * 80)
    print(f"  SUCCESS: Built {len(catalog)} packages and generated apt/packages.json.")
    print("=" * 80)

if __name__ == "__main__":
    build_all_packages()
