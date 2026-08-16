/* ==========================================================================
   KryptonOS Application - System Settings & Control Center (XFCE / Xubuntu style)
   Categories: Appearance (Wallpaper, Themes), Users & Accounts, Date & Time, Displays, About
   ========================================================================== */

import { wm } from '../wm.js';
import { vfs } from '../fs.js';
import { sound } from '../sound.js';
import { story } from '../story.js';

let settingsActiveTimer = null;

export function openSettings(initialTab = 'appearance') {
    const content = document.createElement('div');
    content.className = 'settings-app-container';

    let activeTab = initialTab;

    const render = () => {
        if (settingsActiveTimer) {
            clearInterval(settingsActiveTimer);
            settingsActiveTimer = null;
        }

        content.innerHTML = `
            <div class="settings-sidebar">
                <div class="settings-sidebar-header">
                    <span style="font-size: 16px;">⚙️</span>
                    <span style="font-weight: 700; font-size: 13px; letter-spacing: 0.5px;">SETTINGS</span>
                </div>
                <div class="settings-nav-list">
                    <button class="settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}" data-tab="appearance">
                        <span class="nav-icon">🎨</span>
                        <span class="nav-label">Appearance</span>
                    </button>
                    <button class="settings-nav-item ${activeTab === 'users' ? 'active' : ''}" data-tab="users">
                        <span class="nav-icon">👥</span>
                        <span class="nav-label">Users & Accounts</span>
                    </button>
                    <button class="settings-nav-item ${activeTab === 'datetime' ? 'active' : ''}" data-tab="datetime">
                        <span class="nav-icon">🕒</span>
                        <span class="nav-label">Date & Time</span>
                    </button>
                    <button class="settings-nav-item ${activeTab === 'display' ? 'active' : ''}" data-tab="display">
                        <span class="nav-icon">🖥️</span>
                        <span class="nav-label">Displays & Audio</span>
                    </button>
                    <button class="settings-nav-item ${activeTab === 'about' ? 'active' : ''}" data-tab="about">
                        <span class="nav-icon">ℹ️</span>
                        <span class="nav-label">About System</span>
                    </button>
                </div>
            </div>
            <div class="settings-main-pane" id="settings-pane-content">
                <!-- Tab specific view rendered dynamically -->
            </div>
        `;

        const pane = content.querySelector('#settings-pane-content');

        switch (activeTab) {
            case 'appearance':
                renderAppearanceTab(pane);
                break;
            case 'users':
                renderUsersTab(pane);
                break;
            case 'datetime':
                renderDateTimeTab(pane);
                break;
            case 'display':
                renderDisplayTab(pane);
                break;
            case 'about':
                renderAboutTab(pane);
                break;
        }

        // Sidebar navigation clicks
        content.querySelectorAll('.settings-nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                sound.playClick();
                activeTab = btn.getAttribute('data-tab');
                render();
            });
        });
    };

    render();

    wm.createWindow({
        id: 'settings',
        title: 'Settings - Krypton Control Center',
        icon: '⚙️',
        width: 760,
        height: 520,
        content: content,
        onClose: () => {
            if (settingsActiveTimer) {
                clearInterval(settingsActiveTimer);
                settingsActiveTimer = null;
            }
        }
    });
}

/* --------------------------------------------------------------------------
   1. Appearance Tab (Wallpapers, Themes, Accents)
   -------------------------------------------------------------------------- */
function renderAppearanceTab(container) {
    const currentWallpaper = localStorage.getItem('krypton_wallpaper') || 'aurora';
    const currentTheme = localStorage.getItem('krypton_theme') || 'theme-cyberpunk';
    const customBgUrl = localStorage.getItem('krypton_custom_wallpaper_url') || '';

    const wallpapers = [
        { id: 'aurora', name: 'Krypton Aurora (SVG)', file: 'assets/wallpapers/krypton_aurora.svg', preview: 'url("assets/wallpapers/krypton_aurora.svg") center/cover' },
        { id: 'geometric', name: 'Geometric Slate (SVG)', file: 'assets/wallpapers/krypton_geometric.svg', preview: 'url("assets/wallpapers/krypton_geometric.svg") center/cover' },
        { id: 'topographic', name: 'Topographic Obsidian (SVG)', file: 'assets/wallpapers/krypton_topographic.svg', preview: 'url("assets/wallpapers/krypton_topographic.svg") center/cover' }
    ];

    const themes = [
        { id: 'theme-cyberpunk', name: 'Obsidian Dark (Default)', accent: '#00f0ff' },
        { id: 'theme-xubuntu', name: 'Xubuntu Greybird GTK', accent: '#3b82f6' },
        { id: 'theme-nord', name: 'Nord Minimal Slate', accent: '#88c0d0' },
        { id: 'theme-synthwave', name: 'Synthwave Neon 80s', accent: '#ff007f' },
        { id: 'theme-matrix', name: 'Matrix Terminal CRT', accent: '#00ff66' }
    ];

    container.innerHTML = `
        <div class="settings-header">
            <h3>🎨 Appearance & Desktop Styling</h3>
            <p class="settings-subtext">Customize desktop background wallpaper, interface themes, and typography.</p>
        </div>

        <!-- Wallpaper Section -->
        <div class="settings-section-box">
            <h4 class="section-title">Modern Vector Wallpapers (SVG)</h4>
            <div class="wallpaper-grid">
                ${wallpapers.map(w => `
                    <div class="wallpaper-card ${currentWallpaper === w.id ? 'selected' : ''}" data-wall-id="${w.id}">
                        <div class="wallpaper-preview" style="background: ${w.preview};"></div>
                        <div class="wallpaper-label">${w.name}</div>
                    </div>
                `).join('')}
            </div>

            <!-- Custom Wallpaper Controls -->
            <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 10px;">
                <span style="font-size: 12px; color: #94a3b8; font-weight: 600;">Custom Background (URL, File Upload, or Drag & Drop)</span>
                
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="custom-wall-input" value="${escapeHtml(customBgUrl.startsWith('data:') ? 'Local Image Loaded' : customBgUrl)}" placeholder="Paste image URL (e.g. https://...)" style="flex: 1; padding: 8px 12px; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); color: #fff; font-size: 12px;">
                    <button id="apply-custom-wall-btn" style="padding: 8px 16px; background: var(--accent-primary); color: #000; font-weight: 700; border-radius: 6px; border: none; cursor: pointer; font-size: 12px;">Apply URL</button>
                    <label style="padding: 8px 16px; background: rgba(255,255,255,0.08); border: 1px solid var(--border-color); border-radius: 6px; color: #fff; font-weight: 600; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        📁 Upload File
                        <input type="file" id="wall-file-input" accept="image/*" style="display: none;">
                    </label>
                </div>
                <small style="color: #64748b; font-size: 11px;">💡 Tip: You can also drag & drop any image file directly onto the desktop to set it as wallpaper!</small>
            </div>
        </div>

        <!-- Desktop Theme Section -->
        <div class="settings-section-box">
            <h4 class="section-title">Desktop Theme & Palette</h4>
            <div class="theme-select-grid">
                ${themes.map(t => `
                    <div class="theme-card ${currentTheme === t.id ? 'selected' : ''}" data-theme-id="${t.id}">
                        <div class="theme-color-dot" style="background: ${t.accent};"></div>
                        <div class="theme-name">${t.name}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Wallpaper Selection click
    container.querySelectorAll('.wallpaper-card').forEach(card => {
        card.addEventListener('click', () => {
            const wallId = card.getAttribute('data-wall-id');
            container.querySelectorAll('.wallpaper-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            applyWallpaper(wallId);
            sound.playClick();
            story.showToast('🖼️ Wallpaper Applied', `Set desktop wallpaper to ${wallId}.`, 'success');
        });
    });

    // Custom Wallpaper apply
    const customBtn = container.querySelector('#apply-custom-wall-btn');
    const customInput = container.querySelector('#custom-wall-input');
    customBtn?.addEventListener('click', () => {
        const url = customInput.value.trim();
        if (url && url !== 'Local Image Loaded') {
            localStorage.setItem('krypton_custom_wallpaper_url', url);
            applyWallpaper('custom', url);
            sound.playSuccess();
            story.showToast('🖼️ Custom Wallpaper', 'Loaded custom desktop background picture.', 'success');
        }
    });

    // File Upload input
    const fileInput = container.querySelector('#wall-file-input');
    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const dataUrl = evt.target.result;
                localStorage.setItem('krypton_custom_wallpaper_url', dataUrl);
                applyWallpaper('custom', dataUrl);
                sound.playSuccess();
                story.showToast('🖼️ File Uploaded', `Applied '${file.name}' as desktop wallpaper.`, 'success');
            };
            reader.readAsDataURL(file);
        }
    });

    // Theme Selection click
    container.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            const themeId = card.getAttribute('data-theme-id');
            container.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            localStorage.setItem('krypton_theme', themeId);
            document.body.className = themeId;
            sound.playSuccess();
            story.showToast('🎨 Theme Switched', `Active theme changed to ${themeId}.`, 'info');
        });
    });
}

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

/* --------------------------------------------------------------------------
   2. Users & Accounts Tab
   -------------------------------------------------------------------------- */
function renderUsersTab(container) {
    const passwdContent = vfs.readFile('/etc/passwd') || 'root:x:0:0:root:/root:/bin/bash\nguest:x:1000:1000:Guest User,,,:/home/guest:/bin/bash';
    const users = [];

    passwdContent.split('\n').forEach(line => {
        const parts = line.trim().split(':');
        if (parts.length >= 7) {
            const [username, , uid, gid, gecos, home, shell] = parts;
            const fullName = (gecos || '').split(',')[0] || username;
            users.push({ username, uid: parseInt(uid, 10), gid: parseInt(gid, 10), fullName, home, shell });
        }
    });

    const activeUser = localStorage.getItem('krypton_primary_user') || 'guest';
    const activeUserData = users.find(u => u.username === activeUser) || users.find(u => u.username === 'guest') || users[0];

    container.innerHTML = `
        <div class="settings-header">
            <h3>👥 User Accounts & Access Control</h3>
            <p class="settings-subtext">Manage system accounts, user groups, and credentials (/etc/passwd).</p>
        </div>

        <!-- Active User Profile Card -->
        <div class="settings-section-box">
            <div style="display: flex; gap: 16px; align-items: center;">
                <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); display: flex; align-items: center; justify-content: center; font-size: 26px; color: #000;">
                    👤
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <h4 style="margin: 0; font-size: 18px; color: #fff;">${escapeHtml(activeUserData.fullName)}</h4>
                        <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(0,229,255,0.15); border: 1px solid var(--accent-primary); color: #00e5ff; font-weight: bold;">
                            ${activeUserData.uid === 0 ? 'Superuser (root)' : (activeUserData.uid === 1000 ? 'Administrator (sudo)' : 'Standard User')}
                        </span>
                    </div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px; font-family: monospace;">
                        Login: <strong>${escapeHtml(activeUserData.username)}</strong> • UID: ${activeUserData.uid} • Home: ${escapeHtml(activeUserData.home)} • Shell: ${escapeHtml(activeUserData.shell)}
                    </div>
                </div>
            </div>
        </div>

        <!-- User Accounts Table -->
        <div class="settings-section-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h4 class="section-title" style="margin: 0;">Registered System Accounts</h4>
                <button id="add-user-modal-btn" style="padding: 6px 12px; background: rgba(0,229,255,0.2); border: 1px solid var(--accent-primary); border-radius: 6px; color: #fff; font-size: 12px; cursor: pointer;">+ Add User Account</button>
            </div>
            <table class="settings-table" style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8; text-align: left;">
                        <th style="padding: 8px 6px;">Username</th>
                        <th style="padding: 8px 6px;">Full Name</th>
                        <th style="padding: 8px 6px;">UID / GID</th>
                        <th style="padding: 8px 6px;">Home Dir</th>
                        <th style="padding: 8px 6px;">Privilege</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.filter(u => u.uid === 0 || u.uid >= 1000).map(u => `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <td style="padding: 8px 6px; font-family: monospace; font-weight: bold; color: var(--accent-primary);">${escapeHtml(u.username)}</td>
                            <td style="padding: 8px 6px;">${escapeHtml(u.fullName)}</td>
                            <td style="padding: 8px 6px; font-family: monospace; color: #94a3b8;">${u.uid}:${u.gid}</td>
                            <td style="padding: 8px 6px; font-family: monospace; color: #94a3b8;">${escapeHtml(u.home)}</td>
                            <td style="padding: 8px 6px;">
                                <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: ${u.uid === 0 ? 'rgba(255,0,0,0.2)' : 'rgba(85,255,85,0.1)'}; color: ${u.uid === 0 ? '#ff5555' : '#55ff55'};">
                                    ${u.uid === 0 ? 'root' : 'sudo'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Add User Form (Hidden by default or toggled) -->
        <div id="add-user-form" style="display: none; background: rgba(0,0,0,0.4); border: 1px solid var(--accent-primary); border-radius: 8px; padding: 14px; margin-top: 10px;">
            <h4 style="margin: 0 0 10px 0; font-size: 14px; color: var(--accent-primary);">Provision New User Account</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                    <label style="font-size: 11px; color: #94a3b8;">Username (e.g. alice)</label>
                    <input type="text" id="new-user-name" placeholder="username" style="width: 100%; padding: 6px 10px; background: rgba(255,255,255,0.08); border: 1px solid var(--border-color); border-radius: 4px; color: #fff; font-size: 12px;">
                </div>
                <div>
                    <label style="font-size: 11px; color: #94a3b8;">Full Real Name</label>
                    <input type="text" id="new-user-fullname" placeholder="Alice Smith" style="width: 100%; padding: 6px 10px; background: rgba(255,255,255,0.08); border: 1px solid var(--border-color); border-radius: 4px; color: #fff; font-size: 12px;">
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px;">
                <button id="cancel-user-btn" style="padding: 6px 12px; background: transparent; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff; font-size: 12px; cursor: pointer;">Cancel</button>
                <button id="save-user-btn" style="padding: 6px 16px; background: var(--accent-primary); border: none; border-radius: 4px; color: #000; font-weight: bold; font-size: 12px; cursor: pointer;">Create Account</button>
            </div>
        </div>
    `;

    const toggleBtn = container.querySelector('#add-user-modal-btn');
    const formBox = container.querySelector('#add-user-form');
    const cancelBtn = container.querySelector('#cancel-user-btn');
    const saveBtn = container.querySelector('#save-user-btn');

    toggleBtn?.addEventListener('click', () => {
        formBox.style.display = formBox.style.display === 'none' ? 'block' : 'none';
    });

    cancelBtn?.addEventListener('click', () => {
        formBox.style.display = 'none';
    });

    saveBtn?.addEventListener('click', () => {
        const uName = container.querySelector('#new-user-name').value.trim().toLowerCase();
        const fName = container.querySelector('#new-user-fullname').value.trim() || uName;

        if (!uName || !/^[a-z_][a-z0-9_-]*$/.test(uName)) {
            alert('Invalid username. Must start with a letter and contain lowercase alphanumeric characters.');
            return;
        }

        const nextUid = 1000 + users.filter(u => u.uid >= 1000).length;
        const newPasswdEntry = `\n${uName}:x:${nextUid}:${nextUid}:${fName},,,:/home/${uName}:/bin/bash`;
        const newGroupEntry = `\n${uName}:x:${nextUid}:\nsudo:x:27:${uName}`;

        const existingPasswd = vfs.readFile('/etc/passwd') || '';
        vfs.writeFile('/etc/passwd', existingPasswd + newPasswdEntry);

        const existingGroup = vfs.readFile('/etc/group') || '';
        vfs.writeFile('/etc/group', existingGroup + newGroupEntry);

        vfs.createDirectory(`/home/${uName}`);
        vfs.createDirectory(`/home/${uName}/Desktop`);
        vfs.createDirectory(`/home/${uName}/Documents`);
        vfs.createDirectory(`/home/${uName}/Downloads`);

        sound.playSuccess();
        story.showToast('👤 User Created', `Created user account '${uName}' (UID ${nextUid}).`, 'success');
        renderUsersTab(container);
    });
}

/* --------------------------------------------------------------------------
   3. Date & Time Tab
   -------------------------------------------------------------------------- */
function renderDateTimeTab(container) {
    const savedTz = localStorage.getItem('krypton_tz') || vfs.readFile('/etc/timezone')?.trim() || 'UTC';
    const is24Hour = localStorage.getItem('krypton_24h') !== 'false';
    const showSeconds = localStorage.getItem('krypton_show_sec') !== 'false';
    const showDateInPanel = localStorage.getItem('krypton_show_date') !== 'false';

    const timezones = [
        { tz: 'UTC', label: 'UTC (Universal Coordinated Time)' },
        { tz: 'America/New_York', label: 'America/New_York (EST / EDT, UTC-5/4)' },
        { tz: 'America/Chicago', label: 'America/Chicago (CST / CDT, UTC-6/5)' },
        { tz: 'America/Los_Angeles', label: 'America/Los_Angeles (PST / PDT, UTC-8/7)' },
        { tz: 'Europe/London', label: 'Europe/London (GMT / BST, UTC+0/1)' },
        { tz: 'Europe/Paris', label: 'Europe/Paris (CET / CEST, UTC+1/2)' },
        { tz: 'Europe/Berlin', label: 'Europe/Berlin (CET / CEST, UTC+1/2)' },
        { tz: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+5:30)' },
        { tz: 'Asia/Singapore', label: 'Asia/Singapore (SGT, UTC+8)' },
        { tz: 'Asia/Tokyo', label: 'Asia/Tokyo (JST, UTC+9)' },
        { tz: 'Australia/Sydney', label: 'Australia/Sydney (AEST, UTC+10/11)' }
    ];

    container.innerHTML = `
        <div class="settings-header">
            <h3>🕒 Date & Time Preferences</h3>
            <p class="settings-subtext">Configure system clock, time zone (/etc/timezone), and panel format.</p>
        </div>

        <!-- Real-Time Clock Display Box -->
        <div class="settings-section-box">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">Current System Time</span>
                    <div id="settings-live-clock" style="font-size: 32px; font-family: monospace; font-weight: bold; color: var(--accent-primary); margin-top: 4px;">--:--:--</div>
                    <div id="settings-live-date" style="font-size: 13px; color: #cbd5e1; margin-top: 2px;">----/--/--</div>
                </div>
                <div style="background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.25); border-radius: 8px; padding: 10px 16px; font-size: 12px; color: #00e5ff;">
                    ● NTP: <strong>systemd-timesyncd active (synchronized)</strong>
                </div>
            </div>
        </div>

        <!-- Time Zone Configuration -->
        <div class="settings-section-box">
            <h4 class="section-title">Time Zone (/etc/timezone)</h4>
            <select id="tz-select" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.4); border: 1px solid var(--border-color); border-radius: 6px; color: #fff; font-size: 13px; outline: none; margin-top: 6px;">
                ${timezones.map(t => `
                    <option value="${t.tz}" ${savedTz === t.tz ? 'selected' : ''}>${t.label}</option>
                `).join('')}
            </select>
        </div>

        <!-- Clock Format Options -->
        <div class="settings-section-box">
            <h4 class="section-title">Panel Clock Formatting</h4>
            <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
                <label style="display: flex; align-items: center; gap: 10px; font-size: 13px; cursor: pointer;">
                    <input type="checkbox" id="chk-24h" ${is24Hour ? 'checked' : ''}>
                    <span>Use 24-Hour Format (e.g. 21:40 instead of 09:40 PM)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 10px; font-size: 13px; cursor: pointer;">
                    <input type="checkbox" id="chk-sec" ${showSeconds ? 'checked' : ''}>
                    <span>Display Seconds in Taskbar Clock</span>
                </label>
                <label style="display: flex; align-items: center; gap: 10px; font-size: 13px; cursor: pointer;">
                    <input type="checkbox" id="chk-date" ${showDateInPanel ? 'checked' : ''}>
                    <span>Display Date in Taskbar Clock Panel</span>
                </label>
            </div>
        </div>
    `;

    const clockEl = container.querySelector('#settings-live-clock');
    const dateEl = container.querySelector('#settings-live-date');
    const tzSelect = container.querySelector('#tz-select');
    const chk24h = container.querySelector('#chk-24h');
    const chkSec = container.querySelector('#chk-sec');
    const chkDate = container.querySelector('#chk-date');

    const updateClock = () => {
        const curTz = tzSelect?.value || 'UTC';
        const now = new Date();
        try {
            const timeStr = now.toLocaleTimeString('en-US', {
                timeZone: curTz,
                hour12: !chk24h.checked,
                hour: '2-digit',
                minute: '2-digit',
                second: chkSec.checked ? '2-digit' : undefined
            });
            const dateStr = now.toLocaleDateString('en-US', {
                timeZone: curTz,
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            if (clockEl && clockEl.textContent !== timeStr) clockEl.textContent = timeStr;
            if (dateEl && dateEl.textContent !== dateStr) dateEl.textContent = dateStr;
        } catch (e) {
            if (clockEl) clockEl.textContent = now.toTimeString();
        }
    };

    updateClock();
    if (settingsActiveTimer) clearInterval(settingsActiveTimer);
    settingsActiveTimer = setInterval(updateClock, 1000);

    // Save changes listener
    const syncTimeSettings = () => {
        const selectedTz = tzSelect.value;
        localStorage.setItem('krypton_tz', selectedTz);
        localStorage.setItem('krypton_24h', String(chk24h.checked));
        localStorage.setItem('krypton_show_sec', String(chkSec.checked));
        localStorage.setItem('krypton_show_date', String(chkDate.checked));

        vfs.writeFile('/etc/timezone', `${selectedTz}\n`);
        window.dispatchEvent(new CustomEvent('krypton_clock_updated'));
        updateClock();
        sound.playClick();
    };

    tzSelect?.addEventListener('change', () => {
        syncTimeSettings();
        story.showToast('🕒 Timezone Updated', `Switched timezone to ${tzSelect.value}.`, 'info');
    });
    chk24h?.addEventListener('change', syncTimeSettings);
    chkSec?.addEventListener('change', syncTimeSettings);
    chkDate?.addEventListener('change', syncTimeSettings);
}

/* --------------------------------------------------------------------------
   4. Displays & Audio Tab
   -------------------------------------------------------------------------- */
function renderDisplayTab(container) {
    container.innerHTML = `
        <div class="settings-header">
            <h3>🖥️ Displays & System Audio</h3>
            <p class="settings-subtext">Manage screen resolution, scale factors, compositor, and audio feedback.</p>
        </div>

        <div class="settings-section-box">
            <h4 class="section-title">Display Output (VividDisplay 27" QHD)</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; margin-top: 8px;">
                <div>Resolution: <strong>2560 x 1440 (16:9)</strong></div>
                <div>Refresh Rate: <strong>165.00 Hz (FreeSync Active)</strong></div>
                <div>Display Scale: <strong>100% (1.0x HiDPI)</strong></div>
                <div>Compositor: <strong>krypton-wm (Wayland / wlroots)</strong></div>
            </div>
        </div>

        <div class="settings-section-box">
            <h4 class="section-title">🔊 System Audio & Sound Effects</h4>
            <label style="display: flex; align-items: center; gap: 10px; font-size: 13px; cursor: pointer; margin-top: 6px;">
                <input type="checkbox" id="snd-toggle" ${sound.enabled ? 'checked' : ''}>
                <span>Enable UI click sounds, window actions, and terminal bell alerts</span>
            </label>
        </div>
    `;

    container.querySelector('#snd-toggle')?.addEventListener('change', (e) => {
        sound.enabled = e.target.checked;
        if (sound.enabled) sound.playClick();
        story.showToast('🔊 Audio Settings', `System sound feedback ${sound.enabled ? 'enabled' : 'muted'}.`, 'info');
    });
}

/* --------------------------------------------------------------------------
   5. About System Tab
   -------------------------------------------------------------------------- */
function renderAboutTab(container) {
    const hostnameNode = vfs.getNode('/etc/hostname');
    const curHostname = hostnameNode ? hostnameNode.content.trim() : 'krypton-station';

    const osRel = vfs.readFile('/etc/os-release') || '';
    const prettyMatch = osRel.match(/PRETTY_NAME="([^"]+)"/);
    const osTitle = prettyMatch ? prettyMatch[1] : 'Krypton 1.0.0.0 LTS';

    container.innerHTML = `
        <div class="settings-header">
            <h3>ℹ️ About ${escapeHtml(osTitle)}</h3>
            <p class="settings-subtext">System architecture, kernel specs, and hardware environment.</p>
        </div>

        <div class="settings-section-box" style="display: flex; gap: 18px; align-items: center;">
            <div style="font-size: 42px;">⚛️</div>
            <div>
                <h4 style="margin: 0; font-size: 20px; color: #fff;">${escapeHtml(osTitle)}</h4>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                    Production-Grade Linux Sandbox & Virtualized Desktop Simulator
                </div>
            </div>
        </div>

        <div class="settings-section-box">
            <table class="settings-table" style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tbody>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                        <td style="padding: 8px 6px; color: #94a3b8; width: 140px;">Kernel Version</td>
                        <td style="padding: 8px 6px; font-family: monospace; color: #00e5ff;">Linux 6.10.0-krypton-generic (x86_64)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                        <td style="padding: 8px 6px; color: #94a3b8;">Processor</td>
                        <td style="padding: 8px 6px; font-family: monospace; color: #fff;">Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz (16 Threads)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                        <td style="padding: 8px 6px; color: #94a3b8;">System Memory</td>
                        <td style="padding: 8px 6px; font-family: monospace; color: #fff;">16384 MB DDR4-3200 Dual-Channel</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                        <td style="padding: 8px 6px; color: #94a3b8;">Storage Drive</td>
                        <td style="padding: 8px 6px; font-family: monospace; color: #fff;">Samsung SSD 980 PRO 1TB (PCIe 4.0 NVMe M.2)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                        <td style="padding: 8px 6px; color: #94a3b8;">System Hostname</td>
                        <td style="padding: 8px 6px; font-family: monospace; color: #fff;">${escapeHtml(curHostname)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
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
