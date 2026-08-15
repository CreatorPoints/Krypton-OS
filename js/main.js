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
    { id: 'browser', title: 'Krypton Browser', icon: '🌐', open: openBrowser },
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
    checkEnvironmentState();
    initClock();
});

export function checkEnvironmentState() {
    const isInstalled = localStorage.getItem('krypton_os_installed') === 'true';

    if (isInstalled) {
        initMainInstalledDesktop();
    } else {
        initLiveSessionDesktop();
    }
}

/* --------------------------------------------------------------------------
   1. Live Session Desktop (Pre-Installation)
   -------------------------------------------------------------------------- */
function initLiveSessionDesktop() {
    const desktopEnv = document.getElementById('desktop-environment');
    if (desktopEnv) desktopEnv.className = '';

    const grid = document.getElementById('desktop-grid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="desktop-icon" id="icon-terminal">
            <div class="icon-image">💻</div>
            <div class="icon-label">Terminal</div>
        </div>
        <div class="desktop-icon" id="icon-install-krypton">
            <div class="icon-image">💿</div>
            <div class="icon-label">Install Krypton OS</div>
        </div>
    `;

    document.getElementById('icon-terminal')?.addEventListener('dblclick', openTerminal);
    document.getElementById('icon-install-krypton')?.addEventListener('dblclick', openInstallerWizard);

    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
        });
    });

    document.getElementById('start-button')?.addEventListener('click', openInstallerWizard);
}

/* --------------------------------------------------------------------------
   2. Main Installed Desktop Environment (Full OS)
   -------------------------------------------------------------------------- */
function initMainInstalledDesktop() {
    const desktopEnv = document.getElementById('desktop-environment');
    if (desktopEnv) desktopEnv.className = 'theme-cyberpunk';

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

    // Initialize Start Menu
    initStartMenu();

    // Welcome Notification
    setTimeout(() => {
        const u = localStorage.getItem('krypton_primary_user') || 'guest';
        story.showToast('🖥️ KryptonOS 1.0 LTS', `Session active for ${u}. System ready.`, 'info');
    }, 600);
}

/* --------------------------------------------------------------------------
   3. Start Menu & Search
   -------------------------------------------------------------------------- */
function initStartMenu() {
    const startBtn = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');
    const startAppGrid = document.getElementById('start-app-grid');
    const searchInput = document.getElementById('start-search-input');

    if (!startBtn || !startMenu) return;

    // Clone button to strip previous live session listeners
    const newStartBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newStartBtn, startBtn);

    newStartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu.classList.toggle('hidden');
        sound.playClick();
    });

    document.addEventListener('click', (e) => {
        if (!startMenu.contains(e.target) && !newStartBtn.contains(e.target)) {
            startMenu.classList.add('hidden');
        }
    });

    const renderStartApps = (filter = '') => {
        if (!startAppGrid) return;
        startAppGrid.innerHTML = '';
        MAIN_APPS.filter(a => a.title.toLowerCase().includes(filter.toLowerCase())).forEach(app => {
            const item = document.createElement('div');
            item.className = 'start-app-item';
            item.innerHTML = `
                <div class="start-app-icon">${app.icon}</div>
                <div class="start-app-label">${app.title}</div>
            `;
            item.addEventListener('click', () => {
                sound.playClick();
                app.open();
                startMenu.classList.add('hidden');
            });
            startAppGrid.appendChild(item);
        });
    };

    renderStartApps();
    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderStartApps(e.target.value));
    }

    document.getElementById('start-btn-settings')?.addEventListener('click', () => {
        openSettings();
        startMenu.classList.add('hidden');
    });
    document.getElementById('start-btn-terminal')?.addEventListener('click', () => {
        openTerminal();
        startMenu.classList.add('hidden');
    });
    document.getElementById('start-btn-restart')?.addEventListener('click', () => {
        sound.playWindowClose();
        startMenu.classList.add('hidden');
        wm.windows.forEach((_, id) => wm.closeWindow(id));
        document.getElementById('desktop-environment').classList.add('hidden');
        boot.start();
    });
}

/* --------------------------------------------------------------------------
   4. Animated Wallpaper Canvas & Clock
   -------------------------------------------------------------------------- */
function initWallpaper() {
    const savedWall = localStorage.getItem('krypton_wallpaper') || 'nebula';
    const savedCustom = localStorage.getItem('krypton_custom_wallpaper_url') || '';
    applyWallpaper(savedWall, savedCustom);

    const savedTheme = localStorage.getItem('krypton_theme') || 'theme-cyberpunk';
    document.body.className = savedTheme;

    const canvas = document.getElementById('wallpaper-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 48;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 35 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.4 + 0.2
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(0, 229, 255, 0.04)';
        ctx.lineWidth = 1;
        const gridSize = 60;
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.fillStyle = `rgba(0, 229, 255, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        });

        requestAnimationFrame(draw);
    }
    draw();
}

function initClock() {
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    if (!timeEl) return;

    const updateClock = () => {
        const now = new Date();
        const savedTz = localStorage.getItem('krypton_tz') || vfs.readFile('/etc/timezone')?.trim() || 'UTC';
        const is24Hour = localStorage.getItem('krypton_24h') !== 'false';
        const showSeconds = localStorage.getItem('krypton_show_sec') !== 'false';
        const showDate = localStorage.getItem('krypton_show_date') !== 'false';

        try {
            timeEl.textContent = now.toLocaleTimeString('en-US', {
                timeZone: savedTz,
                hour12: !is24Hour,
                hour: '2-digit',
                minute: '2-digit',
                second: showSeconds ? '2-digit' : undefined
            });

            if (dateEl) {
                if (showDate) {
                    dateEl.style.display = 'block';
                    dateEl.textContent = now.toLocaleDateString('en-US', {
                        timeZone: savedTz,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                } else {
                    dateEl.style.display = 'none';
                }
            }
        } catch (e) {
            timeEl.textContent = now.toLocaleTimeString([], { hour12: false });
        }
    };

    updateClock();
    setInterval(updateClock, 1000);
    window.addEventListener('krypton_clock_updated', updateClock);
}
