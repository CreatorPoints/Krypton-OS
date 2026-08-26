/* ==========================================================================
   KryptonOS Application - File Manager & Virtual Filesystem Navigator
   ========================================================================== */

import { wm } from '../wm.js';
import { vfs } from '../fs.js';
import { sound } from '../sound.js';
import { story } from '../story.js';
import { openNotes } from './notes.js';
import { openTerminal } from './terminal.js';
import { showContextMenu, showFilePropertiesDialog, showRenameDialog } from '../contextmenu.js';

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function openFileManager(initialPath = null) {
    if (Array.isArray(initialPath)) {
        initialPath = initialPath[0] || null;
    } else if (typeof initialPath === 'object' && initialPath !== null) {
        initialPath = initialPath.path || initialPath.dir || null;
    }

    const primaryUser = localStorage.getItem('krypton_primary_user') || 'guest';
    const userHome = vfs.getNode(`/home/${primaryUser}`) ? `/home/${primaryUser}` : '/home/guest';
    const userDesktop = `/home/${primaryUser}/Desktop`;
    let currentPath = (typeof initialPath === 'string' && initialPath && vfs.exists(initialPath)) ? initialPath : userHome;
    const historyStack = [];

    const content = document.createElement('div');
    content.className = 'filemgr-app';
    content.style.cssText = 'display: flex; flex-direction: column; height: 100%; font-family: "Outfit", sans-serif; color: #f8fafc; background: #0f172a; overflow: hidden; user-select: none;';

    content.innerHTML = `
        <!-- Top Toolbar & Navigation Header -->
        <div class="filemgr-toolbar" style="display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: #1e293b; border-bottom: 1px solid #334155; flex-shrink: 0;">
            <button id="fm-btn-back" title="Back" style="padding: 5px 9px; background: #334155; color: #fff; border: 1px solid #475569; border-radius: 6px; cursor: pointer; font-size: 12px;">◀</button>
            <button id="fm-btn-up" title="Up Directory" style="padding: 5px 9px; background: #334155; color: #fff; border: 1px solid #475569; border-radius: 6px; cursor: pointer; font-size: 12px;">⬆</button>
            <div style="flex: 1; display: flex; align-items: center; background: #0f172a; border: 1px solid #475569; border-radius: 6px; padding: 2px 8px;">
                <span style="color: #38bdf8; font-size: 13px; margin-right: 6px;">📁</span>
                <input type="text" id="fm-path-input" value="${escapeHtml(currentPath)}" style="flex: 1; background: transparent; border: none; outline: none; color: #fff; font-family: monospace; font-size: 12px;">
            </div>
            <button id="fm-btn-newfile" title="New File" style="padding: 5px 10px; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 11px;">➕ File</button>
            <button id="fm-btn-newfolder" title="New Folder" style="padding: 5px 10px; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 11px;">➕ Folder</button>
            <button id="fm-btn-terminal" title="Open Terminal Here" style="padding: 5px 10px; background: #334155; color: #38bdf8; border: 1px solid #475569; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 11px;">💻 Terminal</button>
        </div>

        <!-- Main Body: Sidebar + File Grid -->
        <div style="display: flex; flex: 1; min-height: 0;">
            <div class="filemgr-sidebar" style="width: 170px; background: #111827; border-right: 1px solid #1e293b; padding: 10px 6px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; flex-shrink: 0;">
                <div class="filemgr-item ${currentPath === userHome ? 'active' : ''}" data-path="${userHome}">🏠 Home</div>
                <div class="filemgr-item ${currentPath === userDesktop ? 'active' : ''}" data-path="${userDesktop}">🖥️ Desktop</div>
                <div class="filemgr-item ${currentPath === `${userHome}/Documents` ? 'active' : ''}" data-path="${userHome}/Documents">📁 Documents</div>
                <div class="filemgr-item ${currentPath === `${userHome}/Downloads` ? 'active' : ''}" data-path="${userHome}/Downloads">⬇️ Downloads</div>
                <div style="height: 1px; background: #1e293b; margin: 4px 6px;"></div>
                <div class="filemgr-item ${currentPath === '/etc' ? 'active' : ''}" data-path="/etc">⚙️ /etc</div>
                <div class="filemgr-item ${currentPath === '/var/log' ? 'active' : ''}" data-path="/var/log">📜 /var/log</div>
                <div class="filemgr-item ${currentPath === '/usr/bin' ? 'active' : ''}" data-path="/usr/bin">📦 /usr/bin</div>
                <div class="filemgr-item ${currentPath === '/' ? 'active' : ''}" data-path="/">💽 Root (/)</div>
            </div>
            <div class="filemgr-content" id="fm-grid" style="flex: 1; padding: 14px; display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 12px; align-content: flex-start; overflow-y: auto; background: #0b0f19;">
                <!-- Files & Folders -->
            </div>
        </div>

        <!-- Status Bar -->
        <div id="fm-status-bar" style="padding: 4px 12px; font-size: 11px; background: #1e293b; color: #94a3b8; border-top: 1px solid #334155; display: flex; justify-content: space-between;">
            <span id="fm-status-items">0 items</span>
            <span id="fm-status-user">guest@krypton-station</span>
        </div>
    `;

    const grid = content.querySelector('#fm-grid');
    const pathInput = content.querySelector('#fm-path-input');
    const btnBack = content.querySelector('#fm-btn-back');
    const btnUp = content.querySelector('#fm-btn-up');
    const btnNewFile = content.querySelector('#fm-btn-newfile');
    const btnNewFolder = content.querySelector('#fm-btn-newfolder');
    const btnTerminal = content.querySelector('#fm-btn-terminal');
    const statusItems = content.querySelector('#fm-status-items');

    const renderFolder = (targetPath, pushHistory = true) => {
        if (!vfs.exists(targetPath)) {
            vfs.mkdir(targetPath, true);
        }

        if (pushHistory && currentPath && currentPath !== targetPath) {
            historyStack.push(currentPath);
        }

        currentPath = targetPath;
        pathInput.value = currentPath;

        // Update active sidebar item
        content.querySelectorAll('.filemgr-item').forEach(item => {
            if (item.getAttribute('data-path') === currentPath) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        grid.innerHTML = '';
        const items = vfs.listDir(currentPath) || [];

        statusItems.textContent = `${items.length} item${items.length === 1 ? '' : 's'}`;

        if (items.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; color: #64748b; font-size: 13px; padding: 30px; text-align: center;">(This directory is empty)</div>`;
            return;
        }

        items.forEach(item => {
            const fullPath = `${currentPath === '/' ? '' : currentPath}/${item.name}`;
            const card = document.createElement('div');
            card.className = 'file-icon-card';
            card.style.cssText = 'display: flex; flex-direction: column; align-items: center; padding: 10px 6px; border-radius: 8px; cursor: pointer; transition: all 0.12s ease; text-align: center; border: 1px solid transparent;';

            let icon = '📄';
            if (item.type === 'dir') {
                icon = '📁';
            } else if (item.name.endsWith('.desktop')) {
                icon = '📦';
            } else if (item.name.endsWith('.txt') || item.name.endsWith('.md')) {
                icon = '📝';
            } else if (item.name.endsWith('.sh') || item.name.endsWith('.py') || item.name.endsWith('.js')) {
                icon = '📜';
            } else if (item.name.endsWith('.png') || item.name.endsWith('.jpg') || item.name.endsWith('.svg')) {
                icon = '🖼️';
            }

            card.innerHTML = `
                <div class="f-icon" style="font-size: 30px; margin-bottom: 4px;">${icon}</div>
                <div class="f-name" style="font-size: 11px; color: #e2e8f0; word-break: break-all; max-width: 80px; line-height: 1.2;">${escapeHtml(item.name)}</div>
            `;

            card.addEventListener('mouseenter', () => {
                card.style.background = 'rgba(56, 189, 248, 0.1)';
                card.style.borderColor = 'rgba(56, 189, 248, 0.3)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.background = 'transparent';
                card.style.borderColor = 'transparent';
            });

            // Double Click: Open
            card.addEventListener('dblclick', () => {
                sound.playClick();
                if (item.type === 'dir') {
                    renderFolder(fullPath);
                } else {
                    const text = vfs.readFile(fullPath) || '';
                    openNotes([fullPath, text]);
                }
            });

            // Right Click Context Menu on File/Folder Card
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                sound.playClick();

                showContextMenu(e, [
                    {
                        label: 'Open',
                        icon: '🚀',
                        action: () => {
                            if (item.type === 'dir') {
                                renderFolder(fullPath);
                            } else {
                                const text = vfs.readFile(fullPath) || '';
                                openNotes([fullPath, text]);
                            }
                        }
                    },
                    {
                        separator: true
                    },
                    {
                        label: 'Rename',
                        icon: '✏️',
                        action: () => {
                            showRenameDialog(fullPath, () => renderFolder(currentPath, false));
                        }
                    },
                    {
                        label: 'Delete',
                        icon: '🗑️',
                        action: () => {
                            vfs.remove(fullPath, true);
                            sound.playTrash();
                            story.showToast('🗑️ Deleted', `Removed ${item.name}`, 'info');
                            renderFolder(currentPath, false);
                        }
                    },
                    {
                        label: 'Create Desktop Shortcut',
                        icon: '🔗',
                        action: () => {
                            const baseName = item.name.replace(/\.[^/.]+$/, "");
                            const shortcutPath = `${userDesktop}/${baseName}_shortcut.desktop`;
                            const shortcutContent = `[Desktop Entry]\nName=${baseName}\nExec=${fullPath}\nIcon=${icon}\nType=Application\nComment=Shortcut to ${item.name}\n`;
                            vfs.writeFile(shortcutPath, shortcutContent);
                            sound.playSuccess();
                            story.showToast('🔗 Shortcut Created', `Created shortcut in Desktop`, 'success');
                        }
                    },
                    {
                        separator: true
                    },
                    {
                        label: 'Properties & Permissions (chmod)',
                        icon: '🛡️',
                        action: () => {
                            showFilePropertiesDialog(fullPath);
                        }
                    }
                ]);
            });

            grid.appendChild(card);
        });
    };

    // Right Click Context Menu on Empty Space in File Manager
    grid.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.file-icon-card')) return;

        e.preventDefault();
        sound.playClick();

        showContextMenu(e, [
            {
                label: 'Open Terminal Here',
                icon: '💻',
                action: () => {
                    openTerminal({ currentDir: currentPath });
                }
            },
            {
                separator: true
            },
            {
                label: 'New Empty Document',
                icon: '📝',
                action: () => {
                    let baseName = 'New_Document.txt';
                    let counter = 1;
                    while (vfs.exists(`${currentPath === '/' ? '' : currentPath}/${baseName}`)) {
                        baseName = `New_Document_${counter++}.txt`;
                    }
                    const fullP = `${currentPath === '/' ? '' : currentPath}/${baseName}`;
                    vfs.writeFile(fullP, '');
                    sound.playSuccess();
                    story.showToast('📝 Created File', `Created ${baseName}`, 'success');
                    renderFolder(currentPath, false);
                }
            },
            {
                label: 'New Folder',
                icon: '📁',
                action: () => {
                    let baseName = 'New_Folder';
                    let counter = 1;
                    while (vfs.exists(`${currentPath === '/' ? '' : currentPath}/${baseName}`)) {
                        baseName = `New_Folder_${counter++}`;
                    }
                    const fullP = `${currentPath === '/' ? '' : currentPath}/${baseName}`;
                    vfs.mkdir(fullP, true);
                    sound.playSuccess();
                    story.showToast('📁 Created Folder', `Created ${baseName}`, 'success');
                    renderFolder(currentPath, false);
                }
            },
            {
                separator: true
            },
            {
                label: 'Refresh Folder',
                icon: '🔄',
                action: () => {
                    sound.playClick();
                    renderFolder(currentPath, false);
                }
            }
        ]);
    });

    // Navigation buttons
    btnBack.addEventListener('click', () => {
        if (historyStack.length > 0) {
            const prev = historyStack.pop();
            renderFolder(prev, false);
        }
    });

    btnUp.addEventListener('click', () => {
        if (currentPath === '/' || !currentPath.includes('/')) return;
        const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
        renderFolder(parentPath);
    });

    pathInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = pathInput.value.trim();
            if (vfs.exists(val)) {
                renderFolder(val);
            } else {
                story.showToast('Error', `Path not found: ${val}`, 'error');
            }
        }
    });

    btnNewFile.addEventListener('click', () => {
        let baseName = 'New_Document.txt';
        let counter = 1;
        while (vfs.exists(`${currentPath === '/' ? '' : currentPath}/${baseName}`)) {
            baseName = `New_Document_${counter++}.txt`;
        }
        vfs.writeFile(`${currentPath === '/' ? '' : currentPath}/${baseName}`, '');
        sound.playSuccess();
        story.showToast('📝 Created File', `Created ${baseName}`, 'success');
        renderFolder(currentPath, false);
    });

    btnNewFolder.addEventListener('click', () => {
        let baseName = 'New_Folder';
        let counter = 1;
        while (vfs.exists(`${currentPath === '/' ? '' : currentPath}/${baseName}`)) {
            baseName = `New_Folder_${counter++}`;
        }
        vfs.mkdir(`${currentPath === '/' ? '' : currentPath}/${baseName}`, true);
        sound.playSuccess();
        story.showToast('📁 Created Folder', `Created ${baseName}`, 'success');
        renderFolder(currentPath, false);
    });

    btnTerminal.addEventListener('click', () => {
        openTerminal({ currentDir: currentPath });
    });

    content.querySelectorAll('.filemgr-item').forEach(btn => {
        btn.addEventListener('click', () => {
            renderFolder(btn.getAttribute('data-path'));
        });
    });

    renderFolder(currentPath, false);

    wm.createWindow({
        id: 'filemgr',
        title: 'File Manager - Krypton VFS',
        icon: '📁',
        width: 680,
        height: 440,
        content: content
    });
}

export { openFileManager as openFileMgr, openFileManager as openFileExplorer };
export default openFileManager;
