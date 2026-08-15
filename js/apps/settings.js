/* ==========================================================================
   KryptonOS Application - Desktop & System Settings
   ========================================================================== */

import { wm } from '../wm.js';
import { vfs } from '../fs.js';
import { sound } from '../sound.js';
import { story } from '../story.js';

export function openSettings() {
    const content = document.createElement('div');
    content.className = 'settings-app';

    const hostnameNode = vfs.getNode('/etc/hostname');
    const curHostname = hostnameNode ? hostnameNode.content.trim() : 'krypton-station';

    content.innerHTML = `
        <div class="settings-card">
            <h4>🎨 Desktop Theme & Visuals</h4>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="theme-opt-btn" data-theme="theme-cyberpunk" style="padding: 8px 14px; background: rgba(0,229,255,0.2); border: 1px solid var(--accent-primary); border-radius: 6px; color: #fff; cursor: pointer;">Cyberpunk Dark</button>
                <button class="theme-opt-btn" data-theme="theme-synthwave" style="padding: 8px 14px; background: rgba(255,0,127,0.2); border: 1px solid var(--accent-secondary); border-radius: 6px; color: #fff; cursor: pointer;">Synthwave Neon</button>
                <button class="theme-opt-btn" data-theme="theme-matrix" style="padding: 8px 14px; background: rgba(0,255,102,0.2); border: 1px solid #00ff66; border-radius: 6px; color: #fff; cursor: pointer;">Matrix Terminal</button>
            </div>
        </div>

        <div class="settings-card">
            <h4>🖥️ Display & Compositor (Wayland)</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
                <div>Resolution: <strong>2560x1440 (16:9)</strong></div>
                <div>Refresh Rate: <strong>165.00 Hz</strong></div>
                <div>Scale: <strong>100% (1.0x)</strong></div>
                <div>Compositor: <strong>krypton-wm (Wayland)</strong></div>
            </div>
        </div>

        <div class="settings-card">
            <h4>🔊 System Audio</h4>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
                <input type="checkbox" id="snd-toggle" ${sound.enabled ? 'checked' : ''}> Enable UI sound feedback and terminal bells
            </label>
        </div>

        <div class="settings-card">
            <h4>🌐 Network Hostname</h4>
            <div style="font-size: 13px; color: var(--text-secondary);">Current Hostname: <code>${curHostname}</code> (/etc/hostname)</div>
        </div>
    `;

    // Theme Switchers
    content.querySelectorAll('.theme-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            document.body.className = theme;
            sound.playSuccess();
            story.showToast('🎨 Theme Updated', `Switched desktop theme to ${theme}.`, 'info');
        });
    });

    // Sound Switcher
    content.querySelector('#snd-toggle').addEventListener('change', (e) => {
        sound.enabled = e.target.checked;
        if (sound.enabled) sound.playClick();
    });

    wm.createWindow({
        id: 'settings',
        title: 'System Settings - KryptonOS',
        icon: '⚙️',
        width: 560,
        height: 440,
        content: content
    });
}
