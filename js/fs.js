/* ==========================================================================
   KryptonOS - Comprehensive Virtual File System (VFS)
   ========================================================================== */

export class VirtualFileSystem {
    constructor() {
        this.storageKey = 'krypton_os_vfs_v2';
        this.sdaStorageKey = 'krypton_block_sda1';
        this.mountTable = [
            { device: '/dev/nvme0n1p2', mountPoint: '/', fsType: 'ext4', options: 'rw,relatime,errors=remount-ro', storageKey: this.storageKey },
            { device: 'udev', mountPoint: '/dev', fsType: 'devtmpfs', options: 'rw,nosuid,relatime,size=8150642k,nr_inodes=2037660,mode=755' },
            { device: 'tmpfs', mountPoint: '/run', fsType: 'tmpfs', options: 'rw,nosuid,nodev,noexec,relatime,size=1630128k,mode=755' },
            { device: 'tmpfs', mountPoint: '/dev/shm', fsType: 'tmpfs', options: 'rw,nosuid,nodev' },
            { device: '/dev/nvme0n1p1', mountPoint: '/boot/efi', fsType: 'vfat', options: 'rw,relatime,fmask=0077,dmask=0077,codepage=437,iocharset=iso8859-1,shortname=mixed,errors=remount-ro' },
            { device: '/dev/sda1', mountPoint: '/cdrom', fsType: 'iso9660', options: 'ro,nosuid,nodev,relatime,joliet,check=s,map=n,blocksize=2048', storageKey: this.sdaStorageKey }
        ];
        this.root = this.loadFileSystem() || this.getDefaultFileSystem();
        this.initPersistentSdaStorage();
    }

    initPersistentSdaStorage() {
        try {
            if (!localStorage.getItem(this.sdaStorageKey)) {
                const sdaInitial = {
                    name: 'sda1',
                    type: 'dir',
                    children: {
                        'README_USB.txt': { name: 'README_USB.txt', type: 'file', content: '=== SanDisk Ultra USB 3.0 Live Installation Media (/dev/sda1) ===\n\nThis partition represents persistent block storage on /dev/sda1 in localStorage.\nFiles written here persist across reboots in local persistent storage.\n' },
                        'krypton_live.iso': { name: 'krypton_live.iso', type: 'file', content: 'KRYPTON_OS_LIVE_ISO_IMAGE_v1.0.0.0_LTS\n' },
                        'md5sum.txt': { name: 'md5sum.txt', type: 'file', content: 'e2fc714c4727ee9395f324cd2e7f331f  krypton_live.iso\n' }
                    }
                };
                localStorage.setItem(this.sdaStorageKey, JSON.stringify(sdaInitial));
            }
        } catch (e) {}
    }

    getDefaultFileSystem() {
        const createDir = (name, children = {}) => ({ name, type: 'dir', children });
        const createFile = (name, content = '') => ({ name, type: 'file', content });

        return createDir('/', {
            boot: createDir('boot', {
                'vmlinuz-6.10.0-krypton-generic': createFile('vmlinuz-6.10.0-krypton-generic', 'ELF 64-bit LSB executable, x86-64, Linux 6.10.0-krypton-generic (gcc-13.2.0)'),
                'initrd.img-6.10.0-krypton-generic': createFile('initrd.img-6.10.0-krypton-generic', 'ASCII cpio archive (SVR4 with CRC), initial ramdisk rootfs image'),
                grub: createDir('grub', {
                    'grub.cfg': createFile('grub.cfg', `# GNU GRUB 2.06 Configuration File\nset default="0"\nset timeout=3\nmenuentry 'Krypton 1.0 LTS (Linux 6.10.0-krypton-generic)' {\n\tlinux /boot/vmlinuz-6.10.0-krypton-generic root=UUID=7f8a-99b2-krypton ro quiet splash\n\tinitrd /boot/initrd.img-6.10.0-krypton-generic\n}\n`)
                })
            }),
            bin: createDir('bin', {
                bash: createFile('bash', '#!/bin/bash\n# GNU Bourne-Again SHell binary'),
                sh: createFile('sh', '#!/bin/sh\n# POSIX shell binary'),
                ls: createFile('ls', '#!/bin/ls\n# List directory contents'),
                cat: createFile('cat', '#!/bin/cat\n# Concatenate files and print on standard output'),
                grep: createFile('grep', '#!/bin/grep\n# Pattern matching utility'),
                cp: createFile('cp', '#!/bin/cp\n# Copy files and directories'),
                mv: createFile('mv', '#!/bin/mv\n# Move and rename files'),
                rm: createFile('rm', '#!/bin/rm\n# Remove files and directories'),
                mkdir: createFile('mkdir', '#!/bin/mkdir\n# Make directories'),
                rmdir: createFile('rmdir', '#!/bin/rmdir\n# Remove empty directories'),
                touch: createFile('touch', '#!/bin/touch\n# Change file timestamps or create empty files'),
                echo: createFile('echo', '#!/bin/echo\n# Display a line of text'),
                pwd: createFile('pwd', '#!/bin/pwd\n# Print name of current/working directory'),
                uname: createFile('uname', '#!/bin/uname\n# Print system information'),
                date: createFile('date', '#!/bin/date\n# Print or set system date and time'),
                whoami: createFile('whoami', '#!/bin/whoami\n# Print effective userid'),
                id: createFile('id', '#!/bin/id\n# Print real and effective user and group IDs'),
                ps: createFile('ps', '#!/bin/ps\n# Report a snapshot of current processes'),
                kill: createFile('kill', '#!/bin/kill\n# Send a signal to a process'),
                killall: createFile('killall', '#!/bin/killall\n# Kill processes by name'),
                ping: createFile('ping', '#!/bin/ping\n# Send ICMP ECHO_REQUEST to network hosts'),
                sed: createFile('sed', '#!/bin/sed\n# Stream editor for filtering and transforming text'),
                awk: createFile('awk', '#!/bin/awk\n# Pattern scanning and text processing language'),
                find: createFile('find', '#!/bin/find\n# Search for files in a directory hierarchy'),
                which: createFile('which', '#!/bin/which\n# Locate a command'),
                tar: createFile('tar', '#!/bin/tar\n# Archiving utility'),
                gzip: createFile('gzip', '#!/bin/gzip\n# Compress or expand files'),
                chmod: createFile('chmod', '#!/bin/chmod\n# Change file mode bits'),
                chown: createFile('chown', '#!/bin/chown\n# Change file owner and group'),
                hostname: createFile('hostname', '#!/bin/hostname\n# Show or set system host name'),
                df: createFile('df', '#!/bin/df\n# Report file system disk space usage'),
                du: createFile('du', '#!/bin/du\n# Estimate file space usage'),
                free: createFile('free', '#!/bin/free\n# Display amount of free and used memory in the system'),
                uptime: createFile('uptime', '#!/bin/uptime\n# Tell how long the system has been running'),
                dmesg: createFile('dmesg', '#!/bin/dmesg\n# Print or control the kernel ring buffer'),
                clear: createFile('clear', '#!/bin/clear\n# Clear the terminal screen'),
                sleep: createFile('sleep', '#!/bin/sleep\n# Delay for a specified amount of time')
            }),
            sbin: createDir('sbin', {
                reboot: createFile('reboot', '#!/sbin/reboot\n# Reboot the machine'),
                shutdown: createFile('shutdown', '#!/sbin/shutdown\n# Halt, power-off or reboot the machine'),
                poweroff: createFile('poweroff', '#!/sbin/poweroff\n# Power-off the machine'),
                init: createFile('init', '#!/sbin/init\n# Systemd initialization daemon'),
                ifconfig: createFile('ifconfig', '#!/sbin/ifconfig\n# Configure network interface parameters'),
                ip: createFile('ip', '#!/sbin/ip\n# Show / manipulate routing, devices, policy routing and tunnels'),
                fdisk: createFile('fdisk', '#!/sbin/fdisk\n# Manipulate disk partition table')
            }),
            usr: createDir('usr', {
                bin: createDir('bin', {
                    curl: createFile('curl', '#!/usr/bin/curl\n# Transfer a URL'),
                    wget: createFile('wget', '#!/usr/bin/wget\n# Non-interactive network downloader'),
                    python3: createFile('python3', '#!/usr/bin/python3\n# Python 3.12 interpreter'),
                    git: createFile('git', '#!/usr/bin/git\n# Fast, scalable, distributed revision control system'),
                    neofetch: createFile('neofetch', '#!/usr/bin/neofetch\n# CLI system information tool'),
                    cmatrix: createFile('cmatrix', '#!/usr/bin/cmatrix\n# Matrix digital rain simulation'),
                    cowsay: createFile('cowsay', '#!/usr/bin/cowsay\n# Configurable talking cow'),
                    figlet: createFile('figlet', '#!/usr/bin/figlet\n# Large ASCII letters banner'),
                    sl: createFile('sl', '#!/usr/bin/sl\n# Steam Locomotive display'),
                    fortune: createFile('fortune', '#!/usr/bin/fortune\n# Print random quote'),
                    bc: createFile('bc', '#!/usr/bin/bc\n# Arbitrary precision calculator'),
                    base64: createFile('base64', '#!/usr/bin/base64\n# Base64 encode/decode data'),
                    md5sum: createFile('md5sum', '#!/usr/bin/md5sum\n# Compute MD5 checksum'),
                    sha256sum: createFile('sha256sum', '#!/usr/bin/sha256sum\n# Compute SHA256 checksum'),
                    diff: createFile('diff', '#!/usr/bin/diff\n# Compare files line by line'),
                    stat: createFile('stat', '#!/usr/bin/stat\n# Display file or file system status'),
                    wc: createFile('wc', '#!/usr/bin/wc\n# Print newline, word, and byte counts for each file'),
                    head: createFile('head', '#!/usr/bin/head\n# Output the first part of files'),
                    tail: createFile('tail', '#!/usr/bin/tail\n# Output the last part of files'),
                    sort: createFile('sort', '#!/usr/bin/sort\n# Sort lines of text files'),
                    uniq: createFile('uniq', '#!/usr/bin/uniq\n# Report or omit repeated lines'),
                    tr: createFile('tr', '#!/usr/bin/tr\n# Translate or delete characters'),
                    cut: createFile('cut', '#!/usr/bin/cut\n# Remove sections from each line of files'),
                    tree: createFile('tree', '#!/usr/bin/tree\n# List contents of directories in a tree-like format'),
                    cal: createFile('cal', '#!/usr/bin/cal\n# Display a calendar'),
                    htop: createFile('htop', '#!/usr/bin/htop\n# Interactive process viewer'),
                    top: createFile('top', '#!/usr/bin/top\n# Display Linux processes'),
                    nano: createFile('nano', '#!/usr/bin/nano\n# Nano easy-to-use text editor'),
                    vim: createFile('vim', '#!/usr/bin/vim\n# Vi IMproved programmer text editor')
                }),
                lib: createDir('lib', {}),
                local: createDir('local', {
                    bin: createDir('bin', {})
                }),
                share: createDir('share', {})
            }),
            etc: createDir('etc', {
                hosts: createFile('hosts', `127.0.0.1\tlocalhost\n127.0.1.1\tkrypton-station\n\n# The following lines are desirable for IPv6 capable hosts\n::1     ip6-localhost ip6-loopback\nfe00::0 ip6-localnet\nff00::0 ip6-mcastprefix\nff02::1 ip6-allnodes\nff02::2 ip6-allrouters\n`),
                hostname: createFile('hostname', `krypton-station\n`),
                passwd: createFile('passwd', `root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nbin:x:2:2:bin:/bin:/usr/sbin/nologin\nsys:x:3:3:sys:/dev:/usr/sbin/nologin\nsync:x:4:65534:sync:/bin:/bin/sync\ngames:x:5:60:games:/usr/games:/usr/sbin/nologin\nman:x:6:12:man:/var/cache/man:/usr/sbin/nologin\nlp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin\nmail:x:8:8:mail:/var/mail:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nbackup:x:34:34:backup:/var/backups:/usr/sbin/nologin\n_apt:x:42:65534::/nonexistent:/usr/sbin/nologin\nnobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin\nsystemd-network:x:998:998:systemd Network Management:/:/usr/sbin/nologin\nguest:x:1000:1000:Krypton User,,,:/home/guest:/bin/bash\n`),
                shadow: createFile('shadow', `root:$6$krypton$8gKq2xVj7Yn9s1z:19920:0:99999:7:::\nguest:$6$krypton$0pL92wQz3Tm7k2x:19920:0:99999:7:::\n`),
                group: createFile('group', `root:x:0:\ndaemon:x:1:\nbin:x:2:\nsys:x:3:\nadm:x:4:guest\ntty:x:5:\ndisk:x:6:\nlp:x:7:\nmail:x:8:\nsudo:x:27:guest\naudio:x:29:guest\ndip:x:30:guest\nvideo:x:44:guest\nplugdev:x:46:guest\nusers:x:100:\nnogroup:x:65534:\nguest:x:1000:\n`),
                'os-release': createFile('os-release', `NAME="KryptonOS"\nVERSION="1.0 LTS"\nID=krypton\nID_LIKE=debian\nPRETTY_NAME="KryptonOS 1.0 LTS"\nVERSION_ID="1.0"\nVERSION_CODENAME=beryllium\nHOME_URL="https://krypton-os.org/"\nSUPPORT_URL="https://krypton-os.org/support"\nBUG_REPORT_URL="https://bugs.krypton-os.org/"\n`),
                'resolv.conf': createFile('resolv.conf', `# Generated by NetworkManager\nnameserver 1.1.1.1\nnameserver 8.8.8.8\noptions edns0 trust-ad\n`),
                fstab: createFile('fstab', `# /etc/fstab: static file system information.\nUUID=7f8a-99b2-krypton /               ext4    errors=remount-ro 0       1\n`),
                motd: createFile('motd', `\n=======================================================\n  Welcome to KryptonOS 1.0 LTS (Linux 6.10.0-krypton-generic)\n  * Full Desktop & Virtual Sandbox Environment Active.\n  * Documentation:  https://krypton-os.org/docs\n  * Community:      https://krypton-os.org/community\n=======================================================\n`),
                sudoers: createFile('sudoers', `Defaults\tenv_reset\nDefaults\tmail_badpass\nDefaults\tsecure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"\n\nroot\tALL=(ALL:ALL) ALL\n%admin ALL=(ALL) ALL\n%sudo\tALL=(ALL:ALL) ALL\nguest   ALL=(ALL:ALL) NOPASSWD: ALL\n`),
                environment: createFile('environment', `PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"\n`),
                timezone: createFile('timezone', `Asia/Kolkata\n`),
                issue: createFile('issue', `KryptonOS 1.0 LTS \\n \\l\n`),
                crontab: createFile('crontab', `# /etc/crontab: system-wide crontab\nSHELL=/bin/sh\nPATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin\n`),
                network: createDir('network', {
                    interfaces: createFile('interfaces', `auto lo\niface lo inet loopback\n\nauto eth0\niface eth0 inet dhcp\n`)
                }),
                apt: createDir('apt', {
                    'sources.list': createFile('sources.list', `deb https://deb.krypton-os.org/krypton beryllium main contrib non-free\ndeb https://raw.githubusercontent.com/CreatorPoints/Krypton-Repo/main/apt/ beryllium main\n`)
                }),
                shells: createFile('shells', `/bin/sh\n/bin/bash\n/usr/bin/bash\n/bin/dash\n/usr/bin/dash\n`),
                'adblock.conf': createFile('adblock.conf', `enabled=false\n`)
            }),
            proc: createDir('proc', {
                version: createFile('version', `Linux version 6.10.0-krypton-generic (gcc 13.2.0) #1 SMP PREEMPT_DYNAMIC\n`),
                cpuinfo: createFile('cpuinfo', `processor\t: 0\nvendor_id\t: GenuineIntel\ncpu family\t: 6\nmodel\t\t: 165\nmodel name\t: Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz\nstepping\t: 5\nmicrocode\t: 0xf8\ncpu MHz\t\t: 3800.000\ncache size\t: 16384 KB\nphysical id\t: 0\nsiblings\t: 16\ncore id\t\t: 0\ncpu cores\t: 8\napicid\t\t: 0\ninitial apicid\t: 0\nfpu\t\t: yes\nfpu_exception\t: yes\ncpuid level\t: 22\nwp\t\t: yes\nflags\t\t: fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush dts acpi mmx fxsr sse sse2 ss ht tm pbe syscall nx pdpe1gb rdtscp lm constant_tsc art arch_perfmon pebs bts rep_good nopl xtopology nonstop_tsc cpuid aperfmperf pni pclmulqdq dtes64 monitor ds_cpl vmx smx est tm2 ssse3 sdbg fma cx16 xtpr pdcm pcid sse4_1 sse4_2 x2apic movbe popcnt tsc_deadline_timer aes xsave avx f16c rdrand lahf_lm abm 3dnowprefetch cpuid_fault epb invpcid_single ssbd ibrs ibpb stibp ibrs_enhanced tpr_shadow vnmi flexpriority ept vpid ept_ad fsgsbase tsc_adjust bmi1 avx2 smep bmi2 erms invpcid mpx rdseed adx smap clflushopt intel_pt xsaveopt xsavec xgetbv1 xsaves dtherm ida arat pln pts hwp hwp_notify hwp_act_window hwp_epp md_clear flush_l1d arch_capabilities\nbogomips\t: 7599.80\nclflush size\t: 64\ncache_alignment\t: 64\naddress sizes\t: 39 bits physical, 48 bits virtual\n`),
                meminfo: createFile('meminfo', `MemTotal:       16301284 kB\nMemFree:         8412496 kB\nMemAvailable:   12104520 kB\nBuffers:          341208 kB\nCached:          3891400 kB\nSwapCached:            0 kB\nActive:          4512940 kB\nInactive:        2610480 kB\nSwapTotal:       2097148 kB\nSwapFree:        2097148 kB\nDirty:               144 kB\nWriteback:             0 kB\nAnonPages:       2890812 kB\nMapped:           781204 kB\nShmem:            210480 kB\nKReclaimable:     312940 kB\nSlab:             481200 kB\nSReclaimable:     312940 kB\nSUnreclaim:       168260 kB\nKernelStack:       18432 kB\nPageTables:        42108 kB\nVmallocTotal:   34359738367 kB\nVmallocUsed:       48192 kB\nVmallocChunk:          0 kB\nHugePages_Total:       0\nHugePages_Free:        0\nHugepagesize:       2048 kB\nDirectMap4k:      212864 kB\nDirectMap2M:     7102464 kB\nDirectMap1G:     9437184 kB\n`),
                uptime: createFile('uptime', `14285.42 113940.18\n`),
                loadavg: createFile('loadavg', `0.42 0.38 0.31 1/492 18942\n`),
                cmdline: createFile('cmdline', `BOOT_IMAGE=/boot/vmlinuz-2.0.0.14-generic-krypton boot=live quiet splash\n`),
                mounts: createFile('mounts', `/dev/nvme0n1p2 / ext4 rw,relatime,errors=remount-ro 0 0\nproc /proc proc rw,nosuid,nodev,noexec,relatime 0 0\nsysfs /sys sysfs rw,nosuid,nodev,noexec,relatime 0 0\ndevtmpfs /dev devtmpfs rw,nosuid,size=8150642k,nr_inodes=2037660,mode=755 0 0\n/dev/nvme0n1p1 /boot/efi vfat rw,relatime,fmask=0077,dmask=0077,codepage=437,iocharset=iso8859-1,shortname=mixed,errors=remount-ro 0 0\n`),
                partitions: createFile('partitions', `major minor  #blocks  name\n\n  259     0 1000204632 nvme0n1\n  259     1     524288 nvme0n1p1\n  259     2  997583196 nvme0n1p2\n  259     3    2097148 nvme0n1p3\n    8     0   31266816 sda\n    8     1   31265792 sda1\n`)
            }),
            sys: createDir('sys', {
                class: createDir('class', {
                    net: createDir('net', {
                        eth0: createDir('eth0', {
                            address: createFile('address', `52:54:00:12:34:56\n`),
                            operstate: createFile('operstate', `up\n`),
                            speed: createFile('speed', `1000\n`)
                        }),
                        lo: createDir('lo', {
                            address: createFile('address', `00:00:00:00:00:00\n`),
                            operstate: createFile('operstate', `unknown\n`)
                        })
                    }),
                    power_supply: createDir('power_supply', {
                        BAT0: createDir('BAT0', {
                            capacity: createFile('capacity', `98\n`),
                            status: createFile('status', `Discharging\n`),
                            technology: createFile('technology', `Li-ion\n`),
                            voltage_now: createFile('voltage_now', `11840000\n`)
                        })
                    })
                })
            }),
            var: createDir('var', {
                www: createDir('www', {
                    html: createDir('html', {
                        'index.html': createFile('index.html', `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Krypton Local Web Server</title>\n  <style>\n    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #080a14; color: #00e5ff; text-align: center; padding: 60px 20px; }\n    .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(0, 229, 255, 0.4); border-radius: 16px; padding: 40px; display: inline-block; max-width: 650px; box-shadow: 0 10px 40px rgba(0, 229, 255, 0.15); }\n    h1 { color: #ffff55; margin-bottom: 12px; font-size: 32px; }\n    p { color: #f8fafc; font-size: 16px; line-height: 1.6; }\n    .code { font-family: monospace; background: rgba(0,0,0,0.6); padding: 4px 10px; border-radius: 6px; color: #55ff55; border: 1px solid #333; }\n    .status-badge { display: inline-block; background: #10b981; color: #000; font-weight: bold; padding: 4px 12px; border-radius: 20px; font-size: 13px; margin-bottom: 16px; }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <div class="status-badge">● HTTPD SERVICE RUNNING</div>\n    <h1>🌐 Krypton Local HTTP Server</h1>\n    <p>Serving live HTML files directly from <span class="code">/var/www/html/index.html</span></p>\n    <p>You can edit this HTML file in <span class="code">nano</span> or <span class="code">Notes</span> to build your own personal sandbox website!</p>\n    <p>Add custom domain aliases to <span class="code">/etc/hosts</span> to test live virtual host routing.</p>\n  </div>\n</body>\n</html>\n`)
                    })
                }),
                log: createDir('log', {
                    syslog: createFile('syslog', `Aug 14 21:00:01 krypton-station systemd[1]: Started Krypton System Daemon.\nAug 14 21:00:02 krypton-station kernel: [  0.000000] Linux version 6.10.0-krypton-generic\nAug 14 21:00:04 krypton-station NetworkManager[420]: <info> [1692021604.12] device (eth0): state change: ip-config -> activated\nAug 14 21:00:06 krypton-station systemd[1]: Reached target Graphical Interface.\n`),
                    'auth.log': createFile('auth.log', `Aug 14 21:00:05 krypton-station sudo: pam_unix(sudo:session): session opened for user root(uid=0) by guest(uid=1000)\n`),
                    dmesg: createFile('dmesg', `[    0.000000] Linux version 6.10.0-krypton-generic (gcc 13.2.0)\n[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-6.10.0-krypton-generic root=UUID=a1b2c3d4-e5f6-7890-abcd-ef1234567890 ro quiet splash\n[    0.098410] nvme nvme0: pci function 02:00.0\n[    0.104210] nvme0n1: p1 p2 p3\n[    0.351290] [ OK ] Mounted ext4 root filesystem (UUID=a1b2c3d4-e5f6-7890-abcd-ef1234567890)\n[    0.781920] [ OK ] Started Krypton Wayland Compositor\n`),
                    'dpkg.log': createFile('dpkg.log', `2026-08-14 21:00:00 startup archives unpack\n2026-08-14 21:00:01 install base-files:amd64 <none> 12.4+deb12u1\n2026-08-14 21:00:02 status installed base-files:amd64 12.4+deb12u1\n`)
                }),
                tmp: createDir('tmp', {}),
                mail: createDir('mail', {}),
                cache: createDir('cache', {})
            }),
            dev: createDir('dev', {
                null: createFile('null', ''),
                zero: createFile('zero', ''),
                urandom: createFile('urandom', ''),
                random: createFile('random', ''),
                nvme0n1: createFile('nvme0n1', 'BLOCK_DEVICE_NVME_RAW'),
                nvme0n1p1: createFile('nvme0n1p1', 'BLOCK_DEVICE_EFI_SYSTEM_PARTITION'),
                nvme0n1p2: createFile('nvme0n1p2', 'BLOCK_DEVICE_LINUX_ROOT_EXT4'),
                nvme0n1p3: createFile('nvme0n1p3', 'BLOCK_DEVICE_LINUX_SWAP'),
                sda: createFile('sda', 'BLOCK_DEVICE_USB_FLASH_DRIVE'),
                sda1: createFile('sda1', 'BLOCK_DEVICE_USB_LIVE_ISO'),
                tty: createFile('tty', 'VIRTUAL_TELETYPE_CONSOLE')
            }),
            root: createDir('root', {
                '.bashrc': createFile('.bashrc', `export PATH=$PATH:/usr/local/bin:/usr/sbin:/sbin\nPS1='\\u@\\h:\\w\\# '\n`),
                'root_notes.txt': createFile('root_notes.txt', `KryptonOS Master Administrator Node\nSystem health: Nominal\nSecurity policy: Maximum\n`)
            }),
            home: createDir('home', {
                guest: createDir('guest', {
                    Desktop: createDir('Desktop', {
                        'welcome_to_krypton.txt': createFile('welcome_to_krypton.txt', `=== Welcome to KryptonOS 1.0 LTS ===\n\nKryptonOS is a fully simulated, breakable Linux operating system with real-world accuracy.\n\nTips:\n- Open the Krypton Browser to explore live websites and search engines.\n- Use the full Linux Terminal (sudo supported!) to explore /etc, /proc, and all standard GNU coreutils.\n- Package manager: apt and dpkg are fully functional with packages in /apt.\n- Manage system services with 'systemctl' or drop into headless TTY1 with 'systemctl stop krypton-desktop'.\n\nHave fun exploring!`),
                        'secret_notes.txt': createFile('secret_notes.txt', `DO NOT READ THIS FILE!\n\nSeriously, why are you reading this?\nOkay fine. If you want a secret, try installing 'antigravity' in the Terminal.\n  sudo apt install antigravity\n`)
                    }),
                    Documents: createDir('Documents', {
                        'todo_list.txt': createFile('todo_list.txt', `[x] Install KryptonOS\n[ ] Explore apps\n[ ] Download a virtual pet\n[ ] Don't let pet consume 94% CPU\n[ ] Stay curious\n`),
                        'system_specs.txt': createFile('system_specs.txt', `OS: KryptonOS 1.0 LTS x86_64\nHost: ASUSTeK COMPUTER INC. ROG STRIX Z490-E GAMING\nKernel: Linux 6.10.0-krypton-generic\nCPU: Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz (8C/16T)\nGPU: NVIDIA GeForce RTX 3080 10GB\nRAM: 16384 MB DDR4-3200 (Dual-Channel)\nStorage: Samsung SSD 980 PRO 1TB NVMe (/dev/nvme0n1)\nBattery: 98% (Discharging)\n`)
                    }),
                    Downloads: createDir('Downloads', {}),
                    Pictures: createDir('Pictures', {
                        'wallpaper_info.txt': createFile('wallpaper_info.txt', `You can change wallpapers in Settings app!\n`)
                    }),
                    Music: createDir('Music', {}),
                    Videos: createDir('Videos', {}),
                    '.bashrc': createFile('.bashrc', `export PATH=$PATH:/usr/local/bin\nalias ll='ls -la'\nalias la='ls -A'\nalias l='ls -CF'\nalias cls='clear'\n`),
                    '.profile': createFile('.profile', `# ~/.profile: executed by Bourne-compatible login shells.\nif [ "$BASH" ]; then\n  if [ -f ~/.bashrc ]; then\n    . ~/.bashrc\n  fi\nfi\n`),
                    '.bash_history': createFile('.bash_history', `uname -a\nls -la\ncat /etc/hosts\nneofetch\n`)
                })
            }),
            tmp: createDir('tmp', {})
        });
    }

    saveFileSystem() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.root));

            // Synchronize any active mounts that have dedicated persistent storage keys
            this.mountTable.forEach(m => {
                if (m.storageKey && m.storageKey !== this.storageKey && m.mountPoint !== '/') {
                    const node = this.getNode(m.mountPoint);
                    if (node && node.type === 'dir') {
                        localStorage.setItem(m.storageKey, JSON.stringify({ name: node.name, type: 'dir', children: node.children || {} }));
                    }
                }
            });
        } catch (e) {
            console.warn('VFS save failed', e);
        }
    }

    resetToDefault() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.sdaStorageKey);
            localStorage.removeItem('krypton_upgraded_lts');
        } catch (e) {}
        this.root = this.createDefaultRootFS();
        this.mountTable = [];
        this.saveFileSystem();
    }

    loadFileSystem() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    mount(device, target, fsType = 'ext4', options = 'rw,relatime') {
        const normTarget = this.normalizePath(target);
        const targetNode = this.getNode(normTarget);
        if (!targetNode || targetNode.type !== 'dir') {
            return { success: false, error: `mount: mount point ${target} does not exist` };
        }

        let storageKey = null;
        if (device === '/dev/sda1' || device === '/dev/sda' || device === 'sda1') {
            storageKey = this.sdaStorageKey;
        } else if (device === '/dev/nvme0n1p2' || device === '/dev/nvme0n1') {
            storageKey = this.storageKey;
        }

        let mountedTree = null;
        if (storageKey) {
            try {
                const raw = localStorage.getItem(storageKey);
                if (raw) mountedTree = JSON.parse(raw);
            } catch (e) {}
        }

        if (!mountedTree) {
            mountedTree = { name: targetNode.name, type: 'dir', children: {} };
        }

        targetNode.children = mountedTree.children || {};
        targetNode._mountedDevice = device;
        targetNode._storageKey = storageKey;

        const existingIdx = this.mountTable.findIndex(m => m.mountPoint === normTarget);
        const mountEntry = { device, mountPoint: normTarget, fsType, options, storageKey };
        if (existingIdx !== -1) {
            this.mountTable[existingIdx] = mountEntry;
        } else {
            this.mountTable.push(mountEntry);
        }

        this.saveFileSystem();
        return { success: true, mountEntry };
    }

    umount(target) {
        const normTarget = this.normalizePath(target);
        if (normTarget === '/') {
            return { success: false, error: "umount: /: target is busy" };
        }

        const idx = this.mountTable.findIndex(m => m.mountPoint === normTarget || m.device === target);
        if (idx === -1) {
            return { success: false, error: `umount: ${target}: not mounted` };
        }

        const mountEntry = this.mountTable[idx];
        const targetNode = this.getNode(mountEntry.mountPoint);
        if (targetNode) {
            if (mountEntry.storageKey && mountEntry.storageKey !== this.storageKey) {
                try {
                    localStorage.setItem(mountEntry.storageKey, JSON.stringify({ name: targetNode.name, type: 'dir', children: targetNode.children || {} }));
                } catch (e) {}
            }
            targetNode.children = {};
            delete targetNode._mountedDevice;
            delete targetNode._storageKey;
        }

        this.mountTable.splice(idx, 1);
        this.saveFileSystem();
        return { success: true };
    }

    getMounts() {
        return [...this.mountTable];
    }

    reset() {
        this.root = this.getDefaultFileSystem();
        this.saveFileSystem();
    }

    // Resolve path object: e.g. "/home/guest/Desktop"
    getNode(pathStr) {
        if (!pathStr || pathStr === '/') return this.root;
        const normalized = this.normalizePath(pathStr);
        if (normalized === '/') return this.root;

        const parts = normalized.split('/').filter(Boolean);
        let curr = this.root;
        for (const part of parts) {
            if (!curr || curr.type !== 'dir' || !curr.children || !curr.children[part]) {
                return null;
            }
            curr = curr.children[part];
        }
        return curr;
    }

    normalizePath(pathStr) {
        if (!pathStr) return '/';
        const parts = pathStr.split('/');
        const stack = [];
        for (const part of parts) {
            if (!part || part === '.') continue;
            if (part === '..') {
                if (stack.length > 0) stack.pop();
            } else {
                stack.push(part);
            }
        }
        return '/' + stack.join('/');
    }

    readFile(pathStr) {
        const normalized = this.normalizePath(pathStr);
        if (normalized === '/proc/mounts') {
            return this.mountTable.map(m => `${m.device} ${m.mountPoint} ${m.fsType} ${m.options} 0 0`).join('\n') + '\n';
        }
        if (normalized === '/proc/cpuinfo') {
            if (typeof window !== 'undefined' && window.telemetry) {
                return window.telemetry.getProcCpuInfo();
            }
        }
        if (normalized === '/proc/meminfo') {
            if (typeof window !== 'undefined' && window.telemetry) {
                return window.telemetry.getProcMemInfo();
            }
        }
        if (normalized === '/sys/class/power_supply/BAT0/capacity') {
            const lvl = (typeof window !== 'undefined' && window.telemetry) ? window.telemetry.batteryInfo.level : 85;
            return `${lvl}\n`;
        }
        if (normalized === '/sys/class/power_supply/BAT0/status') {
            const charging = (typeof window !== 'undefined' && window.telemetry) ? window.telemetry.batteryInfo.charging : false;
            return `${charging ? 'Charging' : 'Discharging'}\n`;
        }
        if (normalized === '/sys/class/net/eth0/speed') {
            const dl = (typeof window !== 'undefined' && window.telemetry) ? window.telemetry.networkInfo.downlink : 100;
            return `${Math.round(dl * 10)}\n`;
        }
        if (normalized === '/etc/fstab') {
            const fstabHeader = '# /etc/fstab: static file system information.\n# <file system> <mount point>   <type>  <options>       <dump>  <pass>\n';
            const fstabBody = this.mountTable
                .filter(m => m.device.startsWith('/dev/'))
                .map(m => `${m.device.padEnd(16)} ${m.mountPoint.padEnd(16)} ${m.fsType.padEnd(8)} ${m.options.padEnd(16)} 0       0`)
                .join('\n');
            return fstabHeader + fstabBody + '\n';
        }
        const node = this.getNode(normalized);
        if (!node) return null;
        if (node.type === 'dir') return `[Directory: ${node.name}]`;
        return node.content || '';
    }

    writeFile(pathStr, content, append = false) {
        const normalized = this.normalizePath(pathStr);
        const parts = normalized.split('/').filter(Boolean);
        if (parts.length === 0) return false;

        const fileName = parts.pop();
        const parentPath = '/' + parts.join('/');
        let parentNode = this.getNode(parentPath);

        if (!parentNode) {
            this.mkdir(parentPath, true);
            parentNode = this.getNode(parentPath);
        }

        if (!parentNode || parentNode.type !== 'dir') return false;

        const existing = parentNode.children[fileName];
        let finalContent = content;
        if (append && existing && existing.type === 'file') {
            finalContent = (existing.content || '') + content;
        }

        parentNode.children[fileName] = {
            name: fileName,
            type: 'file',
            content: finalContent
        };
        this.saveFileSystem();
        return true;
    }

    mkdir(pathStr, recursive = true) {
        const normalized = this.normalizePath(pathStr);
        const parts = normalized.split('/').filter(Boolean);
        if (parts.length === 0) return true;

        let curr = this.root;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!curr.children[part]) {
                if (!recursive && i < parts.length - 1) return false;
                curr.children[part] = {
                    name: part,
                    type: 'dir',
                    children: {}
                };
            } else if (curr.children[part].type !== 'dir') {
                return false;
            }
            curr = curr.children[part];
        }

        this.saveFileSystem();
        return true;
    }

    createDirectory(pathStr, recursive = true) {
        return this.mkdir(pathStr, recursive);
    }

    remove(pathStr, recursive = false) {
        const normalized = this.normalizePath(pathStr);
        if (normalized === '/') return false;

        const parts = normalized.split('/').filter(Boolean);
        const name = parts.pop();
        const parentPath = '/' + parts.join('/');
        const parentNode = this.getNode(parentPath);

        if (!parentNode || parentNode.type !== 'dir' || !parentNode.children[name]) {
            return false;
        }

        const targetNode = parentNode.children[name];
        if (targetNode.type === 'dir' && Object.keys(targetNode.children).length > 0 && !recursive) {
            return false;
        }

        delete parentNode.children[name];
        this.saveFileSystem();
        return true;
    }

    copy(srcPath, destPath, recursive = false) {
        const srcNode = this.getNode(srcPath);
        if (!srcNode) return false;

        if (srcNode.type === 'file') {
            return this.writeFile(destPath, srcNode.content || '');
        }

        if (srcNode.type === 'dir') {
            if (!recursive) return false;
            this.mkdir(destPath, true);
            for (const childName in srcNode.children) {
                const child = srcNode.children[childName];
                this.copy(srcPath + '/' + childName, destPath + '/' + childName, true);
            }
            return true;
        }
        return false;
    }

    move(srcPath, destPath) {
        if (this.copy(srcPath, destPath, true)) {
            return this.remove(srcPath, true);
        }
        return false;
    }

    listDir(pathStr) {
        const node = this.getNode(pathStr);
        if (!node || node.type !== 'dir') return null;
        return Object.values(node.children).map(child => ({
            name: child.name,
            type: child.type,
            size: child.type === 'file' ? (child.content || '').length : 4096
        }));
    }

    list(pathStr) {
        return this.listDir(pathStr) || [];
    }

    exists(pathStr) {
        return this.getNode(pathStr) !== null;
    }
}

/* ==========================================================================
   KryptonOS - IndexedDB Storage & Real Streaming Network Download Manager
   ========================================================================== */
export class IndexedDBStorage {
    constructor() {
        this.dbName = 'krypton_os_storage_db';
        this.dbVersion = 1;
        this.db = null;
        this.initPromise = this.initDB();
    }

    async initDB() {
        if (typeof window === 'undefined' || !('indexedDB' in window)) return null;
        return new Promise((resolve) => {
            try {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('packages')) {
                        db.createObjectStore('packages', { keyPath: 'name' });
                    }
                    if (!db.objectStoreNames.contains('manifests')) {
                        db.createObjectStore('manifests', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('block_ext4')) {
                        db.createObjectStore('block_ext4', { keyPath: 'blockId' });
                    }
                };
                request.onsuccess = (e) => {
                    this.db = e.target.result;
                    resolve(this.db);
                };
                request.onerror = () => resolve(null);
            } catch (e) {
                resolve(null);
            }
        });
    }

    async put(storeName, item) {
        await this.initPromise;
        if (!this.db) return false;
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const req = store.put(item);
                req.onsuccess = () => resolve(true);
                req.onerror = () => resolve(false);
            } catch (e) {
                resolve(false);
            }
        });
    }

    async get(storeName, key) {
        await this.initPromise;
        if (!this.db) return null;
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const req = store.get(key);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            } catch (e) {
                resolve(null);
            }
        });
    }

    async computeSha256(contentStr) {
        try {
            if (typeof crypto !== 'undefined' && crypto.subtle) {
                const buffer = new TextEncoder().encode(contentStr);
                const digest = await crypto.subtle.digest('SHA-256', buffer);
                const hashArray = Array.from(new Uint8Array(digest));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }
        } catch (e) {}
        // Fallback simple fast hash representation
        let hash = 0;
        for (let i = 0; i < contentStr.length; i++) {
            hash = ((hash << 5) - hash) + contentStr.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(16).padStart(16, '0') + 'kryptonhash';
    }
}

export const idbStore = new IndexedDBStorage();

/**
 * Real Streaming Network Download Client with Live Byte Counters & Progress
 */
export async function downloadWithMetrics(url, fallbackUrl = null, onChunk = null) {
    const startTime = Date.now();
    let response = null;

    const isLocalHost = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' || 
        window.location.port === '8080' || 
        window.location.port === '8000'
    );

    // Prioritize local repository on local development server
    const primaryUrl = (isLocalHost && fallbackUrl) ? fallbackUrl : url;
    const secondaryUrl = (isLocalHost && fallbackUrl) ? url : fallbackUrl;
    let usedUrl = primaryUrl;

    try {
        response = await fetch(primaryUrl);
        usedUrl = primaryUrl;
        if (!response.ok && secondaryUrl) {
            response = await fetch(secondaryUrl);
            usedUrl = secondaryUrl;
        }
    } catch (err) {
        if (secondaryUrl) {
            try {
                response = await fetch(secondaryUrl);
                usedUrl = secondaryUrl;
            } catch (e2) {}
        }
    }

    if (!response || !response.ok) {
        throw new Error(`Failed to download from ${url} or ${fallbackUrl}`);
    }

    const contentLength = +(response.headers.get('Content-Length') || 0);
    const reader = response.body && response.body.getReader ? response.body.getReader() : null;
    let receivedBytes = 0;
    let chunks = [];

    if (reader) {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            receivedBytes += value.length;
            if (onChunk) {
                const elapsed = Math.max(0.01, (Date.now() - startTime) / 1000);
                const speedBytesPerSec = receivedBytes / elapsed;
                onChunk({
                    receivedBytes,
                    totalBytes: contentLength || receivedBytes,
                    speedBytesPerSec,
                    percent: contentLength ? Math.min(100, (receivedBytes / contentLength) * 100) : 100
                });
            }
        }
    } else {
        const text = await response.text();
        const textBytes = new TextEncoder().encode(text);
        receivedBytes = textBytes.length;
        chunks.push(textBytes);
    }

    const allBytes = new Uint8Array(receivedBytes);
    let offset = 0;
    for (const chunk of chunks) {
        allBytes.set(chunk, offset);
        offset += chunk.length;
    }

    const textContent = new TextDecoder().decode(allBytes);
    const sha256 = await idbStore.computeSha256(textContent);

    return {
        url: usedUrl,
        size: receivedBytes,
        text: textContent,
        bytes: allBytes,
        sha256,
        elapsedSec: (Date.now() - startTime) / 1000
    };
}

export const vfs = new VirtualFileSystem();
