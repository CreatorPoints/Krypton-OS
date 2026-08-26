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
import { openTaskManager } from './apps/taskmgr.js';
import { openBrowser } from './apps/browser.js';
import { openNotes } from './apps/notes.js';
import { openCalculator } from './apps/calculator.js';
import { openFileManager } from './apps/filemgr.js';
import { openSettings } from './apps/settings.js';
import { openSystemLogs } from './apps/messages.js';
import { appLoader } from './loader.js';
import { telemetry } from './telemetry.js';

// Expose core subsystem singletons on window for dynamic apps & plugins
window.wm = wm;
window.vfs = vfs;
window.story = story;
window.sound = sound;
window.appLoader = appLoader;
window.telemetry = telemetry;
window.openClockWindow = openClockWindow;
window.openTaskManager = openTaskManager;
window.openBrowser = openBrowser;
window.openSettings = openSettings;
window.openNotes = openNotes;
window.openCalculator = openCalculator;
window.openFileManager = openFileManager;
window.openSystemLogs = openSystemLogs;

// Register built-in core application launchers
appLoader.registerBuiltin('terminal', openTerminal);
appLoader.registerBuiltin('installer', openInstallerWizard);
appLoader.registerBuiltin('krypton-installer', openInstallerWizard);
appLoader.registerBuiltin('clock', (args) => openClockWindow(args || 'world'));
appLoader.registerBuiltin('taskmgr', openTaskManager);
appLoader.registerBuiltin('settings', openSettings);
appLoader.registerBuiltin('browser', openBrowser);
appLoader.registerBuiltin('notes', openNotes);
appLoader.registerBuiltin('calculator', openCalculator);
appLoader.registerBuiltin('filemgr', openFileManager);
appLoader.registerBuiltin('messages', openSystemLogs);

document.addEventListener('DOMContentLoaded', () => {
    initWallpaper();
    initDragAndDropWallpaper();
    checkEnvironmentState();
    initClock();
    initSystemTrayControls();
    initDesktopSelectionClear();
});

/* --------------------------------------------------------------------------
   Desktop Icon Grid Snapping, Drag & Drop, and Persistence (Real OS Style)
   -------------------------------------------------------------------------- */
export const DESKTOP_GRID = {
    cellWidth: 98,
    cellHeight: 104,
    startX: 20,
    startY: 20,
    taskbarHeight: 48
};

let savedIconPositions = {};
try {
    const raw = localStorage.getItem('krypton_desktop_icon_positions');
    if (raw) savedIconPositions = JSON.parse(raw);
} catch (e) {
    savedIconPositions = {};
}

function getOrInitDesktopGridGhost() {
    let ghost = document.getElementById('desktop-grid-ghost');
    if (!ghost) {
        ghost = document.createElement('div');
        ghost.id = 'desktop-grid-ghost';
        ghost.className = 'desktop-grid-ghost';
        const grid = document.getElementById('desktop-grid');
        if (grid) grid.appendChild(ghost);
    }
    return ghost;
}

export function snapToDesktopGrid(rawLeft, rawTop, excludeIconId = null) {
    const { cellWidth, cellHeight, startX, startY, taskbarHeight } = DESKTOP_GRID;

    const maxAvailableHeight = Math.max(200, window.innerHeight - taskbarHeight - 20);
    const maxRows = Math.max(1, Math.floor((maxAvailableHeight - startY) / cellHeight));
    const maxCols = Math.max(1, Math.floor((window.innerWidth - startX - 86) / cellWidth));

    let col = Math.round((rawLeft - startX) / cellWidth);
    let row = Math.round((rawTop - startY) / cellHeight);

    col = Math.max(0, Math.min(maxCols - 1, col));
    row = Math.max(0, Math.min(maxRows - 1, row));

    // Discover occupied grid cells to prevent overlaps
    const occupied = new Set();
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        const id = icon.getAttribute('data-app-id') || icon.id;
        if (id && id !== excludeIconId) {
            const l = parseFloat(icon.style.left);
            const t = parseFloat(icon.style.top);
            if (!isNaN(l) && !isNaN(t)) {
                const c = Math.round((l - startX) / cellWidth);
                const r = Math.round((t - startY) / cellHeight);
                occupied.add(`${c},${r}`);
            }
        }
    });

    // If target cell is occupied by another shortcut, find the nearest unoccupied slot
    if (occupied.has(`${col},${row}`)) {
        let bestDist = Infinity;
        let bestCol = col;
        let bestRow = row;

        for (let c = 0; c < maxCols; c++) {
            for (let r = 0; r < maxRows; r++) {
                if (!occupied.has(`${c},${r}`)) {
                    const dist = Math.hypot(c - col, r - row);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestCol = c;
                        bestRow = r;
                    }
                }
            }
        }
        col = bestCol;
        row = bestRow;
    }

    return {
        left: startX + col * cellWidth,
        top: startY + row * cellHeight,
        col,
        row
    };
}

export function saveDesktopIconPosition(iconId, left, top) {
    savedIconPositions[iconId] = { left: Math.round(left), top: Math.round(top) };
    try {
        localStorage.setItem('krypton_desktop_icon_positions', JSON.stringify(savedIconPositions));
    } catch (e) {}
}

export function getDesktopIconPosition(iconId, defaultIndex = 0) {
    if (savedIconPositions && savedIconPositions[iconId]) {
        const p = savedIconPositions[iconId];
        const snapped = snapToDesktopGrid(p.left, p.top, iconId);
        return { left: snapped.left, top: snapped.top };
    }

    // Default column-first order (top to bottom, then next column to the right)
    const { cellWidth, cellHeight, startX, startY, taskbarHeight } = DESKTOP_GRID;
    const availableHeight = Math.max(200, window.innerHeight - taskbarHeight - 20);
    const rowsPerCol = Math.max(1, Math.floor((availableHeight - startY) / cellHeight));

    const col = Math.floor(defaultIndex / rowsPerCol);
    const row = defaultIndex % rowsPerCol;

    const left = startX + col * cellWidth;
    const top = startY + row * cellHeight;
    return { left, top };
}

export function makeDesktopIconMovable(iconEl, iconId, defaultIndex = 0) {
    const initialPos = getDesktopIconPosition(iconId, defaultIndex);
    iconEl.style.position = 'absolute';
    iconEl.style.left = `${initialPos.left}px`;
    iconEl.style.top = `${initialPos.top}px`;

    let isDragging = false;
    let dragThresholdPassed = false;
    let startX = 0;
    let startY = 0;
    let iconStartX = 0;
    let iconStartY = 0;
    let ignoreNextClick = false;

    const onPointerDown = (e) => {
        if (e.button !== undefined && e.button !== 0) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        startX = clientX;
        startY = clientY;
        iconStartX = parseFloat(iconEl.style.left) || iconEl.offsetLeft;
        iconStartY = parseFloat(iconEl.style.top) || iconEl.offsetTop;

        isDragging = true;
        dragThresholdPassed = false;

        document.addEventListener('mousemove', onPointerMove, { passive: false });
        document.addEventListener('mouseup', onPointerUp);
        document.addEventListener('touchmove', onPointerMove, { passive: false });
        document.addEventListener('touchend', onPointerUp);
    };

    const onPointerMove = (e) => {
        if (!isDragging) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const dx = clientX - startX;
        const dy = clientY - startY;

        if (!dragThresholdPassed) {
            if (Math.hypot(dx, dy) > 5) {
                dragThresholdPassed = true;
                iconEl.classList.add('dragging');
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                iconEl.classList.add('selected');
            }
        }

        if (dragThresholdPassed) {
            if (e.cancelable) e.preventDefault();

            const iconWidth = iconEl.offsetWidth || 86;
            const iconHeight = iconEl.offsetHeight || 90;
            const maxLeft = Math.max(10, window.innerWidth - iconWidth - 10);
            const maxTop = Math.max(10, window.innerHeight - 56 - iconHeight);

            let newLeft = iconStartX + dx;
            let newTop = iconStartY + dy;

            newLeft = Math.max(10, Math.min(maxLeft, newLeft));
            newTop = Math.max(10, Math.min(maxTop, newTop));

            iconEl.style.left = `${newLeft}px`;
            iconEl.style.top = `${newTop}px`;

            // Live Grid Snap Ghost Target Box
            const ghost = getOrInitDesktopGridGhost();
            const snapTarget = snapToDesktopGrid(newLeft, newTop, iconId);
            ghost.style.left = `${snapTarget.left}px`;
            ghost.style.top = `${snapTarget.top}px`;
            ghost.classList.add('active');
        }
    };

    const onPointerUp = (e) => {
        if (!isDragging) return;
        isDragging = false;

        document.removeEventListener('mousemove', onPointerMove);
        document.removeEventListener('mouseup', onPointerUp);
        document.removeEventListener('touchmove', onPointerMove);
        document.removeEventListener('touchend', onPointerUp);

        const ghost = getOrInitDesktopGridGhost();
        ghost.classList.remove('active');

        if (dragThresholdPassed) {
            iconEl.classList.remove('dragging');
            ignoreNextClick = true;
            setTimeout(() => { ignoreNextClick = false; }, 250);

            const rawLeft = parseFloat(iconEl.style.left);
            const rawTop = parseFloat(iconEl.style.top);

            // Snap cleanly to grid
            const target = snapToDesktopGrid(rawLeft, rawTop, iconId);

            iconEl.classList.add('snapping');
            iconEl.style.left = `${target.left}px`;
            iconEl.style.top = `${target.top}px`;

            saveDesktopIconPosition(iconId, target.left, target.top);

            setTimeout(() => {
                iconEl.classList.remove('snapping');
            }, 250);
        } else {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            iconEl.classList.add('selected');
        }
    };

    iconEl.addEventListener('mousedown', onPointerDown);
    iconEl.addEventListener('touchstart', onPointerDown, { passive: true });

    iconEl.addEventListener('click', (e) => {
        if (ignoreNextClick) {
            e.stopPropagation();
            e.preventDefault();
        }
    });
}

function initDesktopSelectionClear() {
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.desktop-icon') && 
            !e.target.closest('#start-menu') && 
            !e.target.closest('#start-button') && 
            !e.target.closest('.taskbar')) {
            document.querySelectorAll('.desktop-icon.selected').forEach(i => i.classList.remove('selected'));
        }
    });

    window.addEventListener('resize', () => {
        document.querySelectorAll('.desktop-icon').forEach(iconEl => {
            const iconId = iconEl.getAttribute('data-app-id') || iconEl.id;
            let left = parseFloat(iconEl.style.left) || 20;
            let top = parseFloat(iconEl.style.top) || 20;

            const snapped = snapToDesktopGrid(left, top, iconId);
            iconEl.style.left = `${snapped.left}px`;
            iconEl.style.top = `${snapped.top}px`;
            saveDesktopIconPosition(iconId, snapped.left, snapped.top);
        });
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* --------------------------------------------------------------------------
   Dynamic Desktop Icon Renderer (Synchronized with ~/Desktop in VFS)
   -------------------------------------------------------------------------- */
export function renderDynamicDesktopIcons(grid, isLiveBoot = false) {
    if (!grid) return;
    grid.innerHTML = '';

    const primaryUser = isLiveBoot ? 'guest' : (localStorage.getItem('krypton_primary_user') || 'guest');
    const desktopPath = `/home/${primaryUser}/Desktop`;

    const desktopNode = vfs.getNode(desktopPath);
    if (!desktopNode || desktopNode.type !== 'dir') {
        // ~/Desktop folder was removed via rm -rf ~/Desktop: render clean empty desktop canvas
        return;
    }

    const items = vfs.listDir(desktopPath) || [];
    let idx = 0;

    items.forEach(item => {
        const fullPath = `${desktopPath}/${item.name}`;
        const iconEl = document.createElement('div');
        iconEl.className = 'desktop-icon';
        iconEl.setAttribute('data-path', fullPath);

        let iconEmoji = '📄';
        let label = item.name;
        let title = item.name;
        let onDoubleClick = null;

        if (item.name.endsWith('.desktop') && item.type === 'file') {
            const content = vfs.readFile(fullPath) || '';
            const parsed = appLoader.parseDesktopFile(content, item.name);
            iconEmoji = parsed.icon || '📦';
            label = parsed.title || item.name.replace('.desktop', '');
            title = parsed.comment || parsed.title || label;

            onDoubleClick = () => {
                sound.playClick();
                if (parsed.id === 'terminal' || parsed.exec === 'terminal') {
                    openTerminal();
                } else if (parsed.id === 'installer' || parsed.exec === 'krypton-installer' || parsed.id === 'live-installer') {
                    openInstallerWizard();
                } else {
                    appLoader.launch(parsed.id);
                }
            };
        } else if (item.type === 'dir') {
            iconEmoji = '📁';
            label = item.name;
            title = `Directory: ${fullPath}`;
            onDoubleClick = () => {
                sound.playClick();
                appLoader.launch('filemgr', [fullPath]);
            };
        } else {
            // Regular file
            const ext = item.name.substring(item.name.lastIndexOf('.')).toLowerCase();
            if (['.txt', '.md', '.log', '.conf', '.cfg', '.json'].includes(ext)) {
                iconEmoji = '📝';
            } else if (['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'].includes(ext)) {
                iconEmoji = '🖼️';
            } else if (['.sh', '.bash', '.py', '.js', '.c', '.cpp'].includes(ext)) {
                iconEmoji = '📜';
            } else {
                iconEmoji = '📄';
            }
            label = item.name;
            title = `File: ${fullPath}`;
            onDoubleClick = () => {
                sound.playClick();
                const fileContent = vfs.readFile(fullPath) || '';
                appLoader.launch('notes', [item.name, fileContent]);
            };
        }

        iconEl.setAttribute('title', title);
        iconEl.innerHTML = `
            <div class="icon-image">${iconEmoji}</div>
            <div class="icon-label">${escapeHtml(label)}</div>
        `;

        makeDesktopIconMovable(iconEl, `vfs-icon-${primaryUser}-${item.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`, idx++);

        if (onDoubleClick) {
            iconEl.addEventListener('dblclick', onDoubleClick);
        }

        grid.appendChild(iconEl);
    });
}

export function checkEnvironmentState() {
    const isLiveBoot = sessionStorage.getItem('krypton_current_boot_medium') === 'live_usb';
    const isInstalled = localStorage.getItem('krypton_os_installed') === 'true';
    const isUpgraded = localStorage.getItem('krypton_upgraded_lts') === 'true';

    if (isLiveBoot) {
        // Live USB Mode: Windows 98 styled Krypton Alpha OS with Terminal & Installer ONLY
        initLiveSessionDesktop();
    } else if (isInstalled && !isUpgraded) {
        initBaseInstalledDesktop();
    } else {
        // Main Modern Desktop: Full Krypton 1.0 LTS desktop suite
        initMainInstalledDesktop();
    }
}

// Listen for dynamic filesystem modifications across the entire OS
window.addEventListener('krypton_vfs_changed', () => {
    const grid = document.getElementById('desktop-grid');
    if (grid) {
        const isLiveBoot = sessionStorage.getItem('krypton_current_boot_medium') === 'live_usb';
        renderDynamicDesktopIcons(grid, isLiveBoot);
    }
});

// System change listener
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

    if (!vfs.exists('/home/guest/Desktop')) {
        vfs.mkdir('/home/guest/Desktop', true);
    }
    if (!vfs.exists('/home/guest/Desktop/installer.desktop')) {
        vfs.writeFile('/home/guest/Desktop/installer.desktop', '[Desktop Entry]\nName=Install Krypton OS\nExec=krypton-installer\nIcon=💿\nType=Application\nComment=Install Krypton OS to Hard Disk\n');
    }
    if (!vfs.exists('/home/guest/Desktop/terminal.desktop')) {
        vfs.writeFile('/home/guest/Desktop/terminal.desktop', '[Desktop Entry]\nName=Terminal\nExec=terminal\nIcon=💻\nType=Application\nComment=Unix / MS-DOS Shell (Linux 2.0.0.14-generic-krypton)\n');
    }

    renderDynamicDesktopIcons(grid, true);

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

    const primaryUser = localStorage.getItem('krypton_primary_user') || 'guest';
    const userDesktop = `/home/${primaryUser}/Desktop`;

    if (!vfs.exists(userDesktop) && !localStorage.getItem('krypton_desktop_initialized')) {
        localStorage.setItem('krypton_desktop_initialized', 'true');
        vfs.mkdir(userDesktop, true);
        vfs.writeFile(`${userDesktop}/browser.desktop`, '[Desktop Entry]\nName=Web Navigator\nExec=krypton-browser\nIcon=🌐\nType=Application\nComment=Krypton Web Navigator 0.1 Alpha\n');
        vfs.writeFile(`${userDesktop}/terminal.desktop`, '[Desktop Entry]\nName=Terminal\nExec=terminal\nIcon=💻\nType=Application\nComment=Terminal (Linux 2.0.0.14-generic-krypton)\n');
        vfs.writeFile(`${userDesktop}/notes.desktop`, '[Desktop Entry]\nName=Upgrade Notes\nExec=krypton-notes\nIcon=📝\nType=Application\nComment=System Upgrade Instructions\n');
    }

    renderDynamicDesktopIcons(grid, false);

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
    const btnPoweroff = startMenu.querySelector('#start-btn-poweroff');

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

    if (btnPoweroff) {
        btnPoweroff.onclick = (e) => {
            e.stopPropagation();
            sound.playWindowClose();
            startMenu.classList.add('hidden');
            if (window.systemBoot) {
                window.systemBoot.triggerSystemPoweroff();
            } else if (window.boot) {
                window.boot.triggerSystemPoweroff();
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

    const primaryUser = localStorage.getItem('krypton_primary_user') || 'guest';
    const userDesktop = `/home/${primaryUser}/Desktop`;

    if (!vfs.exists(userDesktop) && !localStorage.getItem('krypton_desktop_initialized')) {
        localStorage.setItem('krypton_desktop_initialized', 'true');
        vfs.mkdir(userDesktop, true);
        vfs.writeFile(`${userDesktop}/browser.desktop`, '[Desktop Entry]\nName=Web Browser\nExec=krypton-browser\nIcon=🌐\nType=Application\nComment=Quantum Sandboxed Web Browser\n');
        vfs.writeFile(`${userDesktop}/terminal.desktop`, '[Desktop Entry]\nName=Terminal\nExec=terminal\nIcon=💻\nType=Application\nComment=GNU Bash Terminal\n');
        vfs.writeFile(`${userDesktop}/filemgr.desktop`, '[Desktop Entry]\nName=File Manager\nExec=krypton-filemgr\nIcon=📁\nType=Application\nComment=Virtual Filesystem Browser\n');
        vfs.writeFile(`${userDesktop}/settings.desktop`, '[Desktop Entry]\nName=Settings\nExec=krypton-settings\nIcon=⚙️\nType=Application\nComment=Krypton Control Center\n');
    }

    renderDynamicDesktopIcons(grid, false);

    // Discover installed applications dynamically from /usr/share/applications/ for the Start Menu
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

    // Initialize Start Menu with Dynamically Discovered Applications
    setupStartMenu({
        title: `${primaryUser}@krypton-station`,
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
    // 1. Taskbar Volume Control & Sound Flyout Panel
    const traySoundBtn = document.getElementById('tray-sound-toggle');
    const soundFlyout = document.getElementById('tray-sound-flyout');
    const soundSlider = document.getElementById('sound-volume-slider');
    const soundVolBadge = document.getElementById('sound-vol-badge');
    const soundMuteBtn = document.getElementById('sound-mute-btn');
    const flyoutSoundIcon = document.getElementById('flyout-sound-icon');
    const soundEnabledCheckbox = document.getElementById('sound-system-enabled-checkbox');
    const soundTestBtn = document.getElementById('sound-test-btn');
    const presetBtns = document.querySelectorAll('.sound-preset-btn');

    const updateSoundUi = (vol, isMuted, isEnabled) => {
        const pct = Math.round(vol * 100);
        let icon = '🔊';
        if (isMuted || pct === 0 || !isEnabled) {
            icon = '🔇';
        } else if (pct <= 50) {
            icon = '🔉';
        }

        if (traySoundBtn) {
            traySoundBtn.textContent = icon;
            traySoundBtn.setAttribute('title', isMuted || !isEnabled ? 'Sound: Muted (Click for Controls)' : `Volume: ${pct}% (Click for Controls, Scroll to Adjust)`);
        }

        if (flyoutSoundIcon) flyoutSoundIcon.textContent = icon;
        if (soundMuteBtn) {
            soundMuteBtn.textContent = icon;
            soundMuteBtn.classList.toggle('muted', isMuted || pct === 0 || !isEnabled);
        }

        if (soundSlider && document.activeElement !== soundSlider) {
            soundSlider.value = isMuted ? '0' : pct.toString();
        }

        if (soundVolBadge) {
            soundVolBadge.textContent = isMuted || !isEnabled ? 'MUTED' : `${pct}%`;
        }

        if (soundEnabledCheckbox) {
            soundEnabledCheckbox.checked = !!isEnabled;
        }
    };

    // Initialize UI with current sound engine state
    updateSoundUi(sound.volume, sound.muted, sound.enabled);

    // Listen to sound engine state changes
    window.addEventListener('krypton_sound_volume_changed', (e) => {
        const { volume, muted, enabled } = e.detail;
        updateSoundUi(volume, muted, enabled);
    });

    if (traySoundBtn && soundFlyout) {
        traySoundBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            soundFlyout.classList.toggle('hidden');
            sound.playClick();
        });

        // Mouse wheel volume scroll directly on the taskbar tray icon
        traySoundBtn.addEventListener('wheel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const delta = e.deltaY < 0 ? 0.05 : -0.05;
            const newVol = Math.max(0, Math.min(1, sound.volume + delta));
            sound.setVolume(newVol);
            sound.playTone(600 + newVol * 400, 'sine', 0.03, 0.08);
        }, { passive: false });

        document.addEventListener('click', (e) => {
            if (!soundFlyout.contains(e.target) && !traySoundBtn.contains(e.target)) {
                soundFlyout.classList.add('hidden');
            }
        });
    }

    if (soundSlider) {
        soundSlider.addEventListener('input', (e) => {
            const pct = parseInt(e.target.value, 10);
            sound.setVolume(pct / 100);
        });

        soundSlider.addEventListener('change', () => {
            sound.playTone(700, 'sine', 0.05, 0.1);
        });
    }

    if (soundMuteBtn) {
        soundMuteBtn.addEventListener('click', () => {
            sound.toggleMute();
            sound.playClick();
        });
    }

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const volPct = parseInt(btn.getAttribute('data-vol'), 10);
            if (volPct === 0) {
                sound.setMuted(true);
            } else {
                sound.setVolume(volPct / 100);
            }
            sound.playClick();
        });
    });

    if (soundEnabledCheckbox) {
        soundEnabledCheckbox.addEventListener('change', (e) => {
            sound.setEnabled(e.target.checked);
            if (e.target.checked) sound.playSuccess();
        });
    }

    if (soundTestBtn) {
        soundTestBtn.addEventListener('click', () => {
            sound.playSuccess();
        });
    }

    // 2. Adblock Shield Status Indicator Click
    const adblockTray = document.getElementById('tray-adblock-status');
    if (adblockTray) {
        adblockTray.addEventListener('click', () => {
            sound.playClick();
            story.showToast('🛡️ Shield Status', 'KryptonOS Sandbox Network Shield is Active.', 'info');
        });
    }
}
