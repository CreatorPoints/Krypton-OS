/* ==========================================================================
   PhotonOS Application - File Manager
   ========================================================================== */

import { wm } from '../wm.js';
import { vfs } from '../fs.js';
import { sound } from '../sound.js';
import { openNotes } from './notes.js';

export function openFileManager(initialPath = null) {
    const primaryUser = localStorage.getItem('krypton_primary_user') || 'guest';
    const userHome = vfs.getNode(`/home/${primaryUser}`) ? `/home/${primaryUser}` : '/home/guest';
    let currentPath = initialPath || userHome;

    const content = document.createElement('div');
    content.className = 'filemgr-app';

    content.innerHTML = `
        <div class="filemgr-sidebar">
            <div class="filemgr-item active" data-path="${userHome}">🏠 Home (${primaryUser})</div>
            <div class="filemgr-item" data-path="${userHome}/Desktop">🖥️ Desktop</div>
            <div class="filemgr-item" data-path="${userHome}/Documents">📁 Documents</div>
            <div class="filemgr-item" data-path="${userHome}/Downloads">⬇️ Downloads</div>
            <div class="filemgr-item" data-path="/etc">⚙️ /etc</div>
            <div class="filemgr-item" data-path="/var/log">📜 /var/log</div>
            <div class="filemgr-item" data-path="/">💽 Filesystem (/)</div>
        </div>
        <div class="filemgr-content" id="fm-grid">
            <!-- Files & Folders -->
        </div>
    `;

    const grid = content.querySelector('#fm-grid');

    const renderFolder = (path) => {
        currentPath = path;
        grid.innerHTML = '';
        const items = vfs.listDir(path) || [];

        if (items.length === 0) {
            grid.innerHTML = `<div style="color: var(--text-muted); font-size: 13px; padding: 20px;">(This folder is empty)</div>`;
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'file-icon-card';
            const icon = item.type === 'dir' ? '📁' : (item.name.endsWith('.txt') ? '📄' : '⚙️');
            card.innerHTML = `
                <div class="f-icon">${icon}</div>
                <div class="f-name">${item.name}</div>
            `;

            card.addEventListener('click', () => {
                sound.playClick();
                if (item.type === 'dir') {
                    renderFolder(`${path === '/' ? '' : path}/${item.name}`);
                } else {
                    const fullPath = `${path === '/' ? '' : path}/${item.name}`;
                    const text = vfs.readFile(fullPath);
                    openNotes(item.name, text);
                }
            });

            grid.appendChild(card);
        });
    };

    content.querySelectorAll('.filemgr-item').forEach(btn => {
        btn.addEventListener('click', () => {
            content.querySelectorAll('.filemgr-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderFolder(btn.getAttribute('data-path'));
        });
    });

    renderFolder(initialPath);

    wm.createWindow({
        id: 'filemgr',
        title: 'File Explorer - ' + initialPath,
        icon: '📁',
        width: 640,
        height: 420,
        content: content
    });
}
