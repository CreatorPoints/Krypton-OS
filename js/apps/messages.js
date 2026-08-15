/* ==========================================================================
   KryptonOS Application - System Log Viewer & Diagnostics (systemd-journald)
   ========================================================================== */

import { wm } from '../wm.js';
import { vfs } from '../fs.js';
import { sound } from '../sound.js';

export function openMessages() {
    const content = document.createElement('div');
    content.className = 'messages-app';

    content.innerHTML = `
        <div style="width: 170px; background: rgba(0,0,0,0.3); border-right: 1px solid var(--border-color); padding: 12px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 11px; font-weight: bold; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Log Streams</div>
            <div class="log-tab-btn active" data-log="/var/log/syslog" style="padding: 8px 10px; border-radius: 6px; background: rgba(0,229,255,0.15); color: #fff; font-size: 12px; cursor: pointer;">
                📜 /var/log/syslog
            </div>
            <div class="log-tab-btn" data-log="/var/log/auth.log" style="padding: 8px 10px; border-radius: 6px; background: transparent; color: var(--text-secondary); font-size: 12px; cursor: pointer;">
                🔐 /var/log/auth.log
            </div>
            <div class="log-tab-btn" data-log="/var/log/dmesg" style="padding: 8px 10px; border-radius: 6px; background: transparent; color: var(--text-secondary); font-size: 12px; cursor: pointer;">
                🐧 /var/log/dmesg
            </div>
            <div class="log-tab-btn" data-log="/var/log/dpkg.log" style="padding: 8px 10px; border-radius: 6px; background: transparent; color: var(--text-secondary); font-size: 12px; cursor: pointer;">
                📦 /var/log/dpkg.log
            </div>
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; padding: 12px; gap: 8px; background: #0c0d12;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                <span id="log-active-title" style="font-family: monospace; font-size: 12px; color: #00e5ff;">Viewing: /var/log/syslog</span>
                <input type="text" id="log-filter-input" placeholder="Filter logs (e.g. systemd, kernel)..." style="padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.06); border: 1px solid var(--border-color); color: #fff; font-size: 11px; width: 220px;">
            </div>
            <div id="log-content-box" style="flex: 1; overflow-y: auto; font-family: 'Fira Code', monospace; font-size: 11px; line-height: 1.5; color: #b0bec5; white-space: pre-wrap; word-break: break-all;">
            </div>
        </div>
    `;

    const logBox = content.querySelector('#log-content-box');
    const titleEl = content.querySelector('#log-active-title');
    const filterInput = content.querySelector('#log-filter-input');
    const tabBtns = content.querySelectorAll('.log-tab-btn');

    let currentLogPath = '/var/log/syslog';

    const renderLog = (path, filter = '') => {
        currentLogPath = path;
        titleEl.textContent = `Viewing: ${path}`;
        let raw = vfs.readFile(path) || `[ NO LOG ENTRIES FOUND FOR ${path} ]`;

        if (filter.trim()) {
            const fLower = filter.toLowerCase();
            const lines = raw.split('\n').filter(l => l.toLowerCase().includes(fLower));
            raw = lines.join('\n');
        }

        logBox.textContent = raw;
        logBox.scrollTop = logBox.scrollHeight;
    };

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => {
                b.style.background = 'transparent';
                b.style.color = 'var(--text-secondary)';
                b.classList.remove('active');
            });
            btn.style.background = 'rgba(0,229,255,0.15)';
            btn.style.color = '#fff';
            btn.classList.add('active');
            sound.playClick();
            renderLog(btn.getAttribute('data-log'), filterInput.value);
        });
    });

    filterInput.addEventListener('input', (e) => {
        renderLog(currentLogPath, e.target.value);
    });

    renderLog('/var/log/syslog');

    wm.createWindow({
        id: 'messages',
        title: 'System Logs - KryptonOS',
        icon: '📋',
        width: 720,
        height: 460,
        content: content
    });
}
