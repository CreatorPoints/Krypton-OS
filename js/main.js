/* ==========================================================================
   Krypton-OS - Main System Desktop Bootstrap & Dynamic Application Launcher
   ========================================================================== */

import { wm } from './wm.js';
import { vfs } from './fs.js';
import { story } from './story.js';
import { sound } from './sound.js';
import { openTerminal } from './apps/terminal.js';
import { openInstallerWizard } from './apps/installer.js';
import { openClockWindow } from './apps/clock.js';
import { appLoader } from './loader.js';

// Expose core subsystem singletons on window for dynamic apps & plugins
window.wm = wm;
window.vfs = vfs;
window.story = story;
window.sound = sound;
window.appLoader = appLoader;
window.openClockWindow = openClockWindow;

// Register built-in core application launchers
appLoader.registerBuiltin('terminal', openTerminal);
appLoader.registerBuiltin('installer', openInstallerWizard);
appLoader.registerBuiltin('clock', (args) => openClockWindow(args || 'world'));

document.addEventListener('DOMContentLoaded', () => {
    initWallpaper();
    initDragAndDropWallpaper();
    checkEnvironmentState();
    initClock();
    initSystemTrayControls();
});

export function checkEnvironmentState() {
    const isLiveBoot = sessionStorage.getItem('krypton_current_boot_medium') === 'live_usb';
    const isInstalled = localStorage.getItem('krypton_os_installed') === 'true';
    const isUpgraded = localStorage.getItem('krypton_upgraded_lts') === 'true';

    if (isLiveBoot || !isInstalled || !vfs.exists('/etc/os-release')) {
        // 1. Live USB Mode: Windows 98 styled Krypton Alpha OS with Terminal & Installer ONLY
        initLiveSessionDesktop();
    } else if (!isUpgraded) {
        // 2. Base Installed OS: Krypton Alpha OS (theme-win98) with Vintage Navigator + Terminal + Upgrade Notes
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
        { id: 'terminal', title: 'Terminal', icon: '💻', open: openTerminal },
        { id: 'installer', title: 'Install Krypton OS', icon: '💿', open: openInstallerWizard }
    ];

    setupStartMenu({
        title: 'Krypton Alpha OS',
        subtitle: 'Live Media (Linux 2.0.0.14-generic-krypton)',
        apps: liveApps,
        showSearch: false
    });
}

/* --------------------------------------------------------------------------
   2. Base Installed Desktop (Krypton Alpha OS: Vintage Navigator + Terminal + APT)
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
        appLoader.launch('browser');
    });
    document.getElementById('icon-terminal')?.addEventListener('dblclick', () => {
        sound.playClick();
        openTerminal();
    });
    document.getElementById('icon-readme')?.addEventListener('dblclick', () => {
        sound.playClick();
        appLoader.launch('notes', ['upgrade_notes.txt', `=== Krypton OS 0.1 Alpha Base Installation ===\n\nKernel: Linux 2.0.0.14-generic-krypton (Vintage Alpha Subsystem)\nInstalled Packages: Base System, Web Navigator (Alpha), GNU Bash 2.0\n\nTo upgrade this system to the modern Linux 6.10 kernel and Krypton 1.0 LTS Desktop Suite:\n1. Open the Terminal\n2. Run the standard Debian upgrade command:\n     sudo apt update && sudo apt upgrade\n\nAll modern apps, Wayland compositor, and glass UI will be automatically unlocked!`]);
    });

    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
        });
    });

    const baseApps = [
        { id: 'browser', title: 'Web Navigator (Alpha)', icon: '🌐', open: () => appLoader.launch('browser') },
        { id: 'terminal', title: 'Terminal', icon: '💻', open: openTerminal },
        { id: 'notes', title: 'Upgrade Notes', icon: '📝', open: () => appLoader.launch('notes') }
    ];

    setupStartMenu({
        title: 'Krypton Alpha OS',
        subtitle: 'Base Install (Linux 2.0.0.14-generic-krypton)',
        apps: baseApps,
        showSearch: false
    });

    setTimeout(() => {
        const hasRec = localStorage.getItem('krypton_selected_recommended_apps') !== 'false';
        const msg = hasRec 
            ? "Base Alpha active (Linux 2.0.0.14). Recommended apps are staged for Krypton 1.0 LTS! Run 'sudo apt update && sudo apt upgrade' in Terminal to deploy."
            : "Base OS active (Linux 2.0.0.14). Run 'sudo apt update && sudo apt upgrade' to upgrade to Linux 6.10 & Krypton 1.0 LTS.";
        story.showToast('ℹ️ Krypton Alpha Base OS', msg, 'info');
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

    const renderAppList = (filterText = '') => {
        if (!startAppGrid) return;
        startAppGrid.innerHTML = '';

        const fLower = filterText.toLowerCase();
        const filtered = apps.filter(a => a.title.toLowerCase().includes(fLower) || a.id.toLowerCase().includes(fLower));

        if (filtered.length === 0) {
            startAppGrid.innerHTML = `<div style="grid-column: span 2; padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">No applications found matching "${filterText}"</div>`;
            return;
        }

        filtered.forEach(app => {
            const item = document.createElement('div');
            item.className = 'start-menu-item';
            item.innerHTML = `
                <span class="start-item-icon">${app.icon}</span>
                <span class="start-item-name">${app.title}</span>
            `;

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                sound.playClick();
                startMenu.classList.add('hidden');
                app.open();
            });

            startAppGrid.appendChild(item);
        });
    };

    renderAppList('');

    if (searchInput && showSearch) {
        searchInput.value = '';
        searchInput.oninput = (e) => renderAppList(e.target.value);
    }

    const btnSettings = startMenu.querySelector('#start-btn-settings');
    const btnTerminal = startMenu.querySelector('#start-btn-terminal');
    const btnRestart = startMenu.querySelector('#start-btn-restart');

    if (btnSettings) {
        btnSettings.onclick = (e) => {
            e.stopPropagation();
            startMenu.classList.add('hidden');
            appLoader.launch('settings');
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
            if (window.systemBoot) {
                window.systemBoot.triggerSystemRebootBroadcast('The system is going down for reboot NOW!');
            } else if (window.boot) {
                window.boot.triggerSystemRebootBroadcast('The system is going down for reboot NOW!');
            }
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
   4. Main Installed Desktop Environment (Full Modern 1.0 LTS OS)
   -------------------------------------------------------------------------- */
function initMainInstalledDesktop() {
    const savedTheme = localStorage.getItem('krypton_theme') || 'theme-cyberpunk';
    document.body.className = savedTheme;

    const startBtnSpan = document.querySelector('#start-button span');
    if (startBtnSpan) startBtnSpan.textContent = 'Krypton';

    const grid = document.getElementById('desktop-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // Discover installed applications dynamically from /usr/share/applications/
    let installedApps = appLoader.getInstalledApps();

    // Ensure Terminal is always available as built-in core tool
    if (!installedApps.some(a => a.id === 'terminal')) {
        installedApps.unshift({
            id: 'terminal',
            title: 'Terminal',
            icon: '💻',
            open: () => openTerminal()
        });
    }

    // Render Installed App Shortcuts Dynamically
    installedApps.forEach(app => {
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

    // Initialize Start Menu with Dynamically Discovered Applications
    setupStartMenu({
        title: `${u}@krypton-station`,
        subtitle: 'Krypton 1.0.0.0 LTS (Linux 6.10.0-krypton-generic)',
        apps: installedApps,
        showSearch: true
    });
}

// Listen for dynamic package install/remove events
window.addEventListener('krypton_packages_changed', () => {
    const isInstalled = localStorage.getItem('krypton_os_installed') === 'true';
    const isUpgraded = localStorage.getItem('krypton_upgraded_lts') === 'true';
    if (isInstalled && isUpgraded) {
        initMainInstalledDesktop();
    }
});

/* --------------------------------------------------------------------------
   5. Animated Wallpaper Canvas (CPU-Efficient & Visibility-Aware) & Clock
   -------------------------------------------------------------------------- */
let wallpaperAnimId = null;
let isWallpaperRunning = false;

export function applyWallpaper(wallId, customUrl = '') {
    localStorage.setItem('krypton_wallpaper', wallId);
    const desktop = document.getElementById('desktop-environment');
    const canvas = document.getElementById('wallpaper-canvas');

    if (!desktop) return;

    if (wallId === 'custom') {
        const effUrl = customUrl || localStorage.getItem('krypton_custom_wallpaper_url') || '';
        if (effUrl) {
            desktop.style.background = `url("${effUrl}") no-repeat center center / cover`;
            if (canvas) canvas.style.display = 'none';
        }
        return;
    }

    if (canvas) canvas.style.display = 'block';

    switch (wallId) {
        case 'geometric':
            desktop.style.background = '#0c0e18 url("assets/wallpapers/krypton_geometric.svg") no-repeat center center / cover';
            break;
        case 'topographic':
            desktop.style.background = '#05070c url("assets/wallpapers/krypton_topographic.svg") no-repeat center center / cover';
            break;
        case 'aurora':
        default:
            desktop.style.background = '#080a14 url("assets/wallpapers/krypton_aurora.svg") no-repeat center center / cover';
            break;
    }
}

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
    const TARGET_FPS_INTERVAL = 1000 / 25; // Smooth 25 FPS saves >60% CPU vs unthrottled loop

    function draw(timestamp) {
        if (!isWallpaperRunning) return;

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

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopLoop();
        else startLoop();
    });

    startLoop();
}

function initDragAndDropWallpaper() {
    const desktopEnv = document.getElementById('desktop-environment');
    if (!desktopEnv) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        desktopEnv.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    desktopEnv.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const customDataUrl = event.target.result;
                    localStorage.setItem('krypton_custom_wallpaper_url', customDataUrl);
                    applyWallpaper('custom', customDataUrl);
                    story.showToast('🖼️ Custom Wallpaper Applied', `Applied "${file.name}" as desktop background.`, 'success');
                };
                reader.readAsDataURL(file);
            }
        }
    });
}

function initClock() {
    const timeEl = document.getElementById('clock-time') || document.getElementById('tray-time');
    const dateEl = document.getElementById('clock-date') || document.getElementById('tray-date');
    const trayClockEl = document.getElementById('tray-clock') || timeEl?.parentElement;
    if (!timeEl) return;

    const update = () => {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    update();
    setInterval(update, 1000);

    if (trayClockEl) {
        trayClockEl.style.cursor = 'pointer';
        trayClockEl.addEventListener('click', (e) => {
            e.stopPropagation();
            sound.playClick();
            openClockWindow('world');
        });
    }
}

function initSystemTrayControls() {
    const quickSettingsBtn = document.getElementById('tray-quick-settings');
    const quickPanel = document.getElementById('quick-settings-panel');
    const volSlider = document.getElementById('qs-vol-slider');
    const volVal = document.getElementById('qs-vol-val');
    const brightSlider = document.getElementById('qs-bright-slider');
    const brightVal = document.getElementById('qs-bright-val');

    if (quickSettingsBtn && quickPanel) {
        quickSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            quickPanel.classList.toggle('hidden');
            sound.playClick();
        });

        document.addEventListener('click', (e) => {
            if (!quickPanel.contains(e.target) && !quickSettingsBtn.contains(e.target)) {
                quickPanel.classList.add('hidden');
            }
        });
    }

    if (volSlider && volVal) {
        const savedVol = localStorage.getItem('krypton_volume') || '80';
        volSlider.value = savedVol;
        volVal.textContent = `${savedVol}%`;
        volSlider.addEventListener('input', (e) => {
            const v = e.target.value;
            volVal.textContent = `${v}%`;
            localStorage.setItem('krypton_volume', v);
        });
    }

    if (brightSlider && brightVal) {
        const savedBright = localStorage.getItem('krypton_brightness') || '100';
        brightSlider.value = savedBright;
        brightVal.textContent = `${savedBright}%`;
        const applyBrightness = (val) => {
            const overlay = document.getElementById('brightness-overlay');
            if (overlay) {
                overlay.style.opacity = (1 - (val / 100)) * 0.75;
            }
        };
        applyBrightness(savedBright);

        brightSlider.addEventListener('input', (e) => {
            const b = e.target.value;
            brightVal.textContent = `${b}%`;
            localStorage.setItem('krypton_brightness', b);
            applyBrightness(b);
        });
    }
}
