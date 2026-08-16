/* ==========================================================================
   Krypton-OS - Main System Desktop Bootstrap & Application Launcher
   ========================================================================== */

import { wm } from './wm.js';
import { vfs } from './fs.js';
import { story } from './story.js';
import { sound } from './sound.js';
import { openBrowser } from './apps/browser.js';
import { openTerminal } from './apps/terminal.js';
import { openTaskManager } from './apps/taskmgr.js';
import { openFileManager } from './apps/filemgr.js';
import { openNotes } from './apps/notes.js';
import { openCalculator } from './apps/calculator.js';
import { openSettings, applyWallpaper } from './apps/settings.js';
import { openMessages } from './apps/messages.js';
import { openInstallerWizard } from './apps/installer.js';
import { boot } from './boot.js';

// Application Registry for Main OS
const MAIN_APPS = [
    { id: 'browser', title: 'Krypton Browser (WIP)', icon: '🌐', open: openBrowser },
    { id: 'terminal', title: 'Terminal', icon: '💻', open: openTerminal },
    { id: 'filemgr', title: 'File Explorer', icon: '📁', open: () => openFileManager() },
    { id: 'notes', title: 'Text Editor', icon: '📝', open: () => {
        const u = localStorage.getItem('krypton_primary_user') || 'guest';
        openNotes('welcome_to_krypton.txt', vfs.readFile(`/home/${u}/Desktop/welcome_to_krypton.txt`) || vfs.readFile('/home/guest/Desktop/welcome_to_krypton.txt') || '=== Welcome to KryptonOS 1.0 LTS ===\n\nKryptonOS is installed and running on NVMe storage (/dev/nvme0n1p2)!');
    } },
    { id: 'taskmgr', title: 'System Monitor', icon: '📊', open: openTaskManager },
    { id: 'calculator', title: 'Calculator', icon: '🧮', open: openCalculator },
    { id: 'logs', title: 'System Logs', icon: '📋', open: openMessages },
    { id: 'settings', title: 'Settings', icon: '⚙️', open: openSettings }
];

document.addEventListener('DOMContentLoaded', () => {
    initWallpaper();
    initDragAndDropWallpaper();
    checkEnvironmentState();
    initClock();
    initSystemTrayControls();
});

export function checkEnvironmentState() {
    const isInstalled = localStorage.getItem('krypton_os_installed') === 'true';
    const osVersion = localStorage.getItem('krypton_os_version') || '0.1.0-alpha';
    const isUpgraded = localStorage.getItem('krypton_upgraded_lts') === 'true' || osVersion === '1.0.0.0';

    if (!isInstalled) {
        // 1. Live USB Mode: Windows 98 styled Krypton Alpha OS with Terminal & Installer ONLY
        initLiveSessionDesktop();
    } else if (!isUpgraded) {
        // 2. Base Installed OS: Downloaded base Krypton Alpha OS with Buggy Web Navigator + Linux 6.10 Terminal + APT
        initBaseInstalledDesktop();
    } else {
        // 3. Upgraded Modern OS: Full modern Krypton 1.0 LTS desktop suite
        initMainInstalledDesktop();
    }
}

// System upgrade listener (when user executes sudo apt upgrade)
window.addEventListener('krypton_system_upgraded', () => {
    checkEnvironmentState();
});

/* --------------------------------------------------------------------------
   1. Live Session Desktop (Pre-Installation: Win98 Style Krypton Alpha OS)
   -------------------------------------------------------------------------- */
function initLiveSessionDesktop() {
    document.body.className = 'theme-win98';

    const startBtnSpan = document.querySelector('#start-button span');
    if (startBtnSpan) startBtnSpan.textContent = 'Start';

    const grid = document.getElementById('desktop-grid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="desktop-icon" id="icon-terminal" title="Unix / MS-DOS Shell (Linux 2.0.0.14-generic-krypton)">
            <div class="icon-image">💻</div>
            <div class="icon-label">Terminal</div>
        </div>
        <div class="desktop-icon" id="icon-install-krypton" title="Install Krypton OS to Hard Disk">
            <div class="icon-image">💿</div>
            <div class="icon-label">Install Krypton OS</div>
        </div>
    `;

    document.getElementById('icon-terminal')?.addEventListener('dblclick', () => {
        sound.playClick();
        openTerminal();
    });
    document.getElementById('icon-install-krypton')?.addEventListener('dblclick', () => {
        sound.playClick();
        openInstallerWizard();
    });

    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
        });
    });

    const liveApps = [
        { id: 'term', title: 'Terminal', icon: '💻', open: openTerminal },
        { id: 'install', title: 'Install Krypton OS', icon: '💿', open: openInstallerWizard }
    ];

    setupStartMenu({
        title: 'Krypton Alpha OS',
        subtitle: 'Live Media (Linux 2.0.0.14-generic-krypton)',
        apps: liveApps,
        showSearch: false
    });
}

/* --------------------------------------------------------------------------
   2. Base Installed Desktop (Krypton Alpha OS: Buggy Browser + Terminal + APT)
   -------------------------------------------------------------------------- */
function initBaseInstalledDesktop() {
    document.body.className = 'theme-win98';

    const startBtnSpan = document.querySelector('#start-button span');
    if (startBtnSpan) startBtnSpan.textContent = 'Start';

    const grid = document.getElementById('desktop-grid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="desktop-icon" id="icon-browser" title="Krypton Web Navigator 0.1 Alpha">
            <div class="icon-image">🌐</div>
            <div class="icon-label">Web Navigator</div>
        </div>
        <div class="desktop-icon" id="icon-terminal" title="Terminal (Linux 2.0.0.14-generic-krypton)">
            <div class="icon-image">💻</div>
            <div class="icon-label">Terminal</div>
        </div>
        <div class="desktop-icon" id="icon-readme" title="System Upgrade Instructions">
            <div class="icon-image">📝</div>
            <div class="icon-label">Upgrade Notes</div>
        </div>
    `;

    document.getElementById('icon-browser')?.addEventListener('dblclick', () => {
        sound.playClick();
        openBrowser();
    });
    document.getElementById('icon-terminal')?.addEventListener('dblclick', () => {
        sound.playClick();
        openTerminal();
    });
    document.getElementById('icon-readme')?.addEventListener('dblclick', () => {
        sound.playClick();
        openNotes('upgrade_notes.txt', `=== Krypton OS 0.1 Alpha Base Installation ===\n\nKernel: Linux 2.0.0.14-generic-krypton (Vintage Alpha Subsystem)\nInstalled Packages: Base System, Web Navigator (Alpha), GNU Bash 2.0\n\nTo upgrade this system to the modern Linux 6.10 kernel and Krypton 1.0 LTS Desktop Suite:\n1. Open the Terminal\n2. Run the standard Debian upgrade command:\n     sudo apt update && sudo apt upgrade\n\nAll modern apps, Wayland compositor, and glass UI will be automatically unlocked!`);
    });

    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
        });
    });

    const baseApps = [
        { id: 'nav', title: 'Web Navigator (Alpha)', icon: '🌐', open: openBrowser },
        { id: 'term', title: 'Terminal', icon: '💻', open: openTerminal },
        { id: 'notes', title: 'Upgrade Notes', icon: '📝', open: () => openNotes('upgrade_notes.txt', `=== Krypton OS 0.1 Alpha ===\nRun 'sudo apt update && sudo apt upgrade' in Terminal to upgrade to Linux 6.10 and Krypton 1.0 LTS.`) }
    ];

    setupStartMenu({
        title: 'Krypton Alpha OS',
        subtitle: 'Base Install (Linux 2.0.0.14-generic-krypton)',
        apps: baseApps,
        showSearch: false
    });

    setTimeout(() => {
        story.showToast('ℹ️ Krypton Alpha Base OS', "Base OS active (Linux 2.0.0.14). Run 'sudo apt update && sudo apt upgrade' to upgrade to Linux 6.10 & Krypton 1.0 LTS.", 'info');
    }, 600);
}

/* --------------------------------------------------------------------------
   3. Unified Start Menu Engine
   -------------------------------------------------------------------------- */
let activeStartMenuCloser = null;

function setupStartMenu({ title, subtitle, apps, showSearch = true }) {
    const startBtn = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');
    const startAppGrid = document.getElementById('start-app-grid');
    const searchInput = document.getElementById('start-search-input');
    const userNameEl = startMenu?.querySelector('.user-name');
    const userStatusEl = startMenu?.querySelector('.user-status');
    const searchContainer = startMenu?.querySelector('.start-menu-search');

    if (!startBtn || !startMenu) return;

    if (userNameEl) userNameEl.textContent = title;
    if (userStatusEl) userStatusEl.innerHTML = `<span class="status-dot"></span> ${subtitle}`;
    if (searchContainer) {
        searchContainer.style.display = showSearch ? 'block' : 'none';
    }

    const renderApps = (filter = '') => {
        if (!startAppGrid) return;
        startAppGrid.innerHTML = '';
        apps.filter(a => a.title.toLowerCase().includes(filter.toLowerCase())).forEach(app => {
            const item = document.createElement('div');
            item.className = 'start-app-item';
            item.innerHTML = `
                <div class="start-app-icon">${app.icon}</div>
                <div class="start-app-label">${app.title}</div>
            `;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                sound.playClick();
                app.open();
                startMenu.classList.add('hidden');
            });
            startAppGrid.appendChild(item);
        });
    };

    renderApps();

    if (searchInput && showSearch) {
        searchInput.value = '';
        searchInput.oninput = (e) => renderApps(e.target.value);
    }

    // Bind action footer buttons
    const btnSettings = document.getElementById('start-btn-settings');
    const btnTerminal = document.getElementById('start-btn-terminal');
    const btnRestart = document.getElementById('start-btn-restart');

    if (btnSettings) {
        btnSettings.onclick = (e) => {
            e.stopPropagation();
            startMenu.classList.add('hidden');
            const isUpgraded = localStorage.getItem('krypton_upgraded_lts') === 'true';
            if (isUpgraded) {
                openSettings();
            } else {
                story.showToast('⚠️ Alpha Notice', "Settings control center requires Krypton 1.0 LTS. Run 'sudo apt update && sudo apt upgrade' to install.", 'warning');
            }
        };
    }

    if (btnTerminal) {
        btnTerminal.onclick = (e) => {
            e.stopPropagation();
            startMenu.classList.add('hidden');
            openTerminal();
        };
    }

    if (btnRestart) {
        btnRestart.onclick = (e) => {
            e.stopPropagation();
            sound.playWindowClose();
            startMenu.classList.add('hidden');
            boot.triggerSystemRebootBroadcast('The system is going down for reboot NOW!');
        };
    }

    // Toggle menu
    startBtn.onclick = (e) => {
        e.stopPropagation();
        const willShow = startMenu.classList.contains('hidden');
        startMenu.classList.toggle('hidden');
        sound.playClick();
        if (willShow && searchInput && showSearch) {
            setTimeout(() => searchInput.focus(), 100);
        }
    };

    if (activeStartMenuCloser) {
        document.removeEventListener('click', activeStartMenuCloser);
    }

    activeStartMenuCloser = (e) => {
        if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) {
            startMenu.classList.add('hidden');
        }
    };

    document.addEventListener('click', activeStartMenuCloser);
}

/* --------------------------------------------------------------------------
   3. Main Installed Desktop Environment (Full Modern 1.0 LTS OS)
   -------------------------------------------------------------------------- */
function initMainInstalledDesktop() {
    const savedTheme = localStorage.getItem('krypton_theme') || 'theme-cyberpunk';
    document.body.className = savedTheme;

    const startBtnSpan = document.querySelector('#start-button span');
    if (startBtnSpan) startBtnSpan.textContent = 'Krypton';

    const grid = document.getElementById('desktop-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // Render Full App Shortcuts
    MAIN_APPS.forEach(app => {
        const iconEl = document.createElement('div');
        iconEl.className = 'desktop-icon';
        iconEl.setAttribute('data-app-id', app.id);
        iconEl.innerHTML = `
            <div class="icon-image">${app.icon}</div>
            <div class="icon-label">${app.title}</div>
        `;

        iconEl.addEventListener('click', () => {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            iconEl.classList.add('selected');
        });

        iconEl.addEventListener('dblclick', () => {
            sound.playClick();
            app.open();
        });

        grid.appendChild(iconEl);
    });

    const u = localStorage.getItem('krypton_primary_user') || 'guest';

    // Initialize Start Menu with Full App Suite
    setupStartMenu({
        title: `${u}@krypton-station`,
        subtitle: 'Krypton 1.0.0.0 LTS (Linux 6.10.0-krypton-generic)',
        apps: MAIN_APPS,
        showSearch: true
    });

    // Welcome Notification
    setTimeout(() => {
        story.showToast('🖥️ KryptonOS 1.0 LTS', `Session active for ${u}. System ready.`, 'info');
    }, 600);
}

/* --------------------------------------------------------------------------
   4. Animated Wallpaper Canvas (CPU-Efficient & Visibility-Aware) & Clock
   -------------------------------------------------------------------------- */
let wallpaperAnimId = null;
let isWallpaperRunning = false;

function initWallpaper() {
    const savedWall = localStorage.getItem('krypton_wallpaper') || 'aurora';
    const savedCustom = localStorage.getItem('krypton_custom_wallpaper_url') || '';
    applyWallpaper(savedWall, savedCustom);

    const savedTheme = localStorage.getItem('krypton_theme') || 'theme-cyberpunk';
    document.body.className = savedTheme;

    const canvas = document.getElementById('wallpaper-canvas');
    const desktopEnv = document.getElementById('desktop-environment');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });

    let resizeDebounce = null;
    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 46;
    };
    resize();
    window.addEventListener('resize', () => {
        clearTimeout(resizeDebounce);
        resizeDebounce = setTimeout(resize, 150);
    });

    const particles = Array.from({ length: 24 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.3 + 0.15
    }));

    let lastDraw = 0;
    const TARGET_FPS_INTERVAL = 1000 / 25; // Smooth 25 FPS saves >60% CPU vs 60/120Hz unthrottled loop

    function draw(timestamp) {
        if (!isWallpaperRunning) return;

        // Skip render if tab is hidden, canvas is hidden, or desktop is not active
        if (document.hidden || canvas.style.display === 'none' || (desktopEnv && desktopEnv.classList.contains('hidden'))) {
            isWallpaperRunning = false;
            return;
        }

        wallpaperAnimId = requestAnimationFrame(draw);

        if (timestamp - lastDraw < TARGET_FPS_INTERVAL) {
            return;
        }
        lastDraw = timestamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const len = particles.length;
        for (let i = 0; i < len; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = canvas.width;
            else if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            else if (p.y > canvas.height) p.y = 0;

            ctx.fillStyle = `rgba(0, 229, 255, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function startLoop() {
        if (isWallpaperRunning) return;
        if (document.hidden || canvas.style.display === 'none') return;
        isWallpaperRunning = true;
        lastDraw = performance.now();
        wallpaperAnimId = requestAnimationFrame(draw);
    }

    function stopLoop() {
        isWallpaperRunning = false;
        if (wallpaperAnimId) {
            cancelAnimationFrame(wallpaperAnimId);
            wallpaperAnimId = null;
        }
    }

    // Pause canvas completely when browser tab is inactive
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopLoop();
        } else {
            startLoop();
        }
    });

    startLoop();
}

function initDragAndDropWallpaper() {
    const desktopEnv = document.getElementById('desktop-environment');
    const dropIndicator = document.getElementById('desktop-drop-indicator');
    if (!desktopEnv) return;

    let dragCounter = 0;

    window.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        if (dropIndicator) dropIndicator.classList.add('active');
    });

    window.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    window.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter <= 0) {
            dragCounter = 0;
            if (dropIndicator) dropIndicator.classList.remove('active');
        }
    });

    window.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        if (dropIndicator) dropIndicator.classList.remove('active');

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const dataUrl = evt.target.result;
                    localStorage.setItem('krypton_custom_wallpaper_url', dataUrl);
                    applyWallpaper('custom', dataUrl);
                    sound.playSuccess();
                    story.showToast('🖼️ Wallpaper Dropped', `Applied '${file.name}' as desktop background picture.`, 'success');
                };
                reader.readAsDataURL(file);
            } else {
                story.showToast('⚠️ Unsupported File', 'Please drop an image file (PNG, JPG, SVG, WebP).', 'warning');
            }
        }
    });
}

function initSystemTrayControls() {
    document.getElementById('tray-clock')?.addEventListener('click', () => {
        sound.playClick();
        openSettings('datetime');
    });

    document.getElementById('tray-sound-toggle')?.addEventListener('click', () => {
        sound.enabled = !sound.enabled;
        const iconEl = document.getElementById('tray-sound-toggle');
        if (iconEl) iconEl.textContent = sound.enabled ? '🔊' : '🔇';
        if (sound.enabled) sound.playClick();
        story.showToast('🔊 Audio Feedback', `System sound ${sound.enabled ? 'enabled' : 'muted'}.`, 'info');
    });

    document.getElementById('tray-adblock-status')?.addEventListener('click', () => {
        sound.playClick();
        story.setAdblock(!story.adblockEnabled);
    });
}

function initClock() {
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    if (!timeEl) return;

    // Cache settings in memory to eliminate repeated localStorage reads every second
    let cachedTz = 'UTC';
    let cached24Hour = true;
    let cachedShowSeconds = true;
    let cachedShowDate = true;

    const reloadConfig = () => {
        cachedTz = localStorage.getItem('krypton_tz') || vfs.readFile('/etc/timezone')?.trim() || 'UTC';
        cached24Hour = localStorage.getItem('krypton_24h') !== 'false';
        cachedShowSeconds = localStorage.getItem('krypton_show_sec') !== 'false';
        cachedShowDate = localStorage.getItem('krypton_show_date') !== 'false';
    };

    reloadConfig();

    const updateClock = () => {
        // Skip clock DOM calculation when tab is hidden
        if (document.hidden) return;

        const now = new Date();
        try {
            const timeStr = now.toLocaleTimeString('en-US', {
                timeZone: cachedTz,
                hour12: !cached24Hour,
                hour: '2-digit',
                minute: '2-digit',
                second: cachedShowSeconds ? '2-digit' : undefined
            });

            if (timeEl.textContent !== timeStr) {
                timeEl.textContent = timeStr;
            }

            if (dateEl) {
                if (cachedShowDate) {
                    if (dateEl.style.display !== 'block') dateEl.style.display = 'block';
                    const dateStr = now.toLocaleDateString('en-US', {
                        timeZone: cachedTz,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                    if (dateEl.textContent !== dateStr) {
                        dateEl.textContent = dateStr;
                    }
                } else {
                    if (dateEl.style.display !== 'none') dateEl.style.display = 'none';
                }
            }
        } catch (e) {
            const fallbackStr = now.toLocaleTimeString([], { hour12: false });
            if (timeEl.textContent !== fallbackStr) timeEl.textContent = fallbackStr;
        }
    };

    updateClock();
    setInterval(updateClock, 1000);
    window.addEventListener('krypton_clock_updated', () => {
        reloadConfig();
        updateClock();
    });
}
