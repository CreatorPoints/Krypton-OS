/* ==========================================================================
   KryptonOS - Desktop & File Context Menu Engine & chmod Permissions Subsystem
   ========================================================================== */

import { wm } from './wm.js';
import { vfs } from './fs.js';
import { sound } from './sound.js';
import { story } from './story.js';
import { appLoader } from './loader.js';
import { openTerminal } from './apps/terminal.js';
import { openNotes } from './apps/notes.js';

let activeContextMenu = null;

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function closeActiveContextMenu() {
    if (activeContextMenu) {
        activeContextMenu.remove();
        activeContextMenu = null;
    }
}

document.addEventListener('click', (e) => {
    if (activeContextMenu && !activeContextMenu.contains(e.target)) {
        closeActiveContextMenu();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeContextMenu) {
        closeActiveContextMenu();
    }
});

/**
 * Show a sleek modern context menu at (x, y)
 * @param {MouseEvent} e
 * @param {Array<{label: string, icon?: string, shortcut?: string, action?: Function, separator?: boolean, submenu?: Array}>} items
 */
export function showContextMenu(e, items) {
    e.preventDefault();
    e.stopPropagation();
    closeActiveContextMenu();

    const menu = document.createElement('div');
    menu.className = 'krypton-context-menu';

    items.forEach(item => {
        if (item.separator) {
            const sep = document.createElement('div');
            sep.className = 'context-menu-separator';
            menu.appendChild(sep);
            return;
        }

        const itemEl = document.createElement('div');
        itemEl.className = 'context-menu-item';
        if (item.disabled) itemEl.classList.add('disabled');

        itemEl.innerHTML = `
            <div class="context-item-left">
                <span class="context-item-icon">${item.icon || ''}</span>
                <span class="context-item-label">${item.label}</span>
            </div>
            ${item.submenu ? '<span class="context-submenu-arrow">▶</span>' : (item.shortcut ? `<span class="context-item-shortcut">${item.shortcut}</span>` : '')}
        `;

        if (item.submenu && item.submenu.length > 0) {
            const subMenuEl = document.createElement('div');
            subMenuEl.className = 'krypton-context-menu context-submenu';
            item.submenu.forEach(sub => {
                if (sub.separator) {
                    const subSep = document.createElement('div');
                    subSep.className = 'context-menu-separator';
                    subMenuEl.appendChild(subSep);
                    return;
                }
                const subItemEl = document.createElement('div');
                subItemEl.className = 'context-menu-item';
                subItemEl.innerHTML = `
                    <div class="context-item-left">
                        <span class="context-item-icon">${sub.icon || ''}</span>
                        <span class="context-item-label">${sub.label}</span>
                    </div>
                `;
                subItemEl.addEventListener('click', (subE) => {
                    subE.stopPropagation();
                    closeActiveContextMenu();
                    if (typeof sub.action === 'function') {
                        sound.playClick();
                        sub.action();
                    }
                });
                subMenuEl.appendChild(subItemEl);
            });
            itemEl.appendChild(subMenuEl);
        } else {
            itemEl.addEventListener('click', (clickE) => {
                clickE.stopPropagation();
                closeActiveContextMenu();
                if (typeof item.action === 'function') {
                    sound.playClick();
                    item.action();
                }
            });
        }

        menu.appendChild(itemEl);
    });

    document.body.appendChild(menu);
    activeContextMenu = menu;

    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const menuWidth = menu.offsetWidth || 210;
    const menuHeight = menu.offsetHeight || 180;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let posX = mouseX;
    let posY = mouseY;

    if (posX + menuWidth > screenWidth - 10) {
        posX = screenWidth - menuWidth - 10;
    }
    if (posY + menuHeight > screenHeight - 10) {
        posY = screenHeight - menuHeight - 10;
    }

    menu.style.left = `${Math.max(10, posX)}px`;
    menu.style.top = `${Math.max(10, posY)}px`;
}

/**
 * Show Properties Dialog with general metadata and interactive chmod permissions
 * @param {string} fullPath 
 */
export function showFilePropertiesDialog(fullPath) {
    const node = vfs.getNode(fullPath);
    if (!node) {
        story.showToast('Error', `File not found: ${fullPath}`, 'error');
        return;
    }

    const primaryUser = localStorage.getItem('krypton_primary_user') || 'guest';
    const isDir = node.type === 'dir';
    const fileName = node.name || fullPath.split('/').pop();
    const fullSizeText = isDir ? `${Object.keys(node.children || {}).length} items` : `${(node.content || '').length} bytes (${((node.content || '').length / 1024).toFixed(1)} KB)`;
    
    let currentMode = node.mode || (isDir ? '0755' : '0644');
    let octalStr = String(currentMode).replace(/^0o?/, '').padStart(3, '0').slice(-3);

    const parseOctalBits = (oct) => {
        const o = parseInt(oct[0] || '6', 10);
        const g = parseInt(oct[1] || '4', 10);
        const w = parseInt(oct[2] || '4', 10);
        return {
            owner: { r: (o & 4) !== 0, w: (o & 2) !== 0, x: (o & 1) !== 0 },
            group: { r: (g & 4) !== 0, w: (g & 2) !== 0, x: (g & 1) !== 0 },
            others: { r: (w & 4) !== 0, w: (w & 2) !== 0, x: (w & 1) !== 0 }
        };
    };

    let bits = parseOctalBits(octalStr);

    const dialog = document.createElement('div');
    dialog.className = 'properties-dialog-container';
    dialog.style.cssText = 'display: flex; flex-direction: column; height: 100%; font-family: "Outfit", sans-serif; color: #f8fafc; background: #0f172a; overflow: hidden; user-select: none;';

    dialog.innerHTML = `
        <!-- Tabs Header -->
        <div style="display: flex; background: #1e293b; border-bottom: 1px solid #334155; padding: 6px 12px; gap: 8px;">
            <button class="prop-tab-btn active" data-tab="general" style="padding: 6px 14px; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">📁 General</button>
            <button class="prop-tab-btn" data-tab="permissions" style="padding: 6px 14px; background: transparent; color: #94a3b8; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">🛡️ Permissions (chmod)</button>
        </div>

        <!-- Tab 1: General -->
        <div id="prop-tab-general" style="padding: 16px; display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
            <div style="display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #334155; padding-bottom: 12px;">
                <span style="font-size: 32px;">${isDir ? '📁' : (fileName.endsWith('.txt') ? '📝' : '📄')}</span>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 700; font-size: 15px; color: #38bdf8; word-break: break-all;">${escapeHtml(fileName)}</div>
                    <div style="font-size: 11px; color: #94a3b8;">${isDir ? 'Folder / Directory (POSIX ext4)' : 'Plain Text / Binary File'}</div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; line-height: 1.6;">
                <span style="color: #94a3b8;">Location:</span>
                <span style="font-family: monospace; color: #e2e8f0; word-break: break-all;">${escapeHtml(fullPath)}</span>
                <span style="color: #94a3b8;">Size:</span>
                <span style="color: #e2e8f0;">${fullSizeText}</span>
                <span style="color: #94a3b8;">Owner:</span>
                <span style="color: #e2e8f0;">${primaryUser} (UID 1000)</span>
                <span style="color: #94a3b8;">Group:</span>
                <span style="color: #e2e8f0;">${primaryUser} (GID 1000)</span>
                <span style="color: #94a3b8;">Filesystem:</span>
                <span style="color: #4ade80;">ext4 on /dev/nvme0n1p2</span>
            </div>
        </div>

        <!-- Tab 2: Permissions (chmod) -->
        <div id="prop-tab-permissions" style="padding: 16px; display: none; flex-direction: column; gap: 12px; font-size: 13px;">
            <div style="font-size: 12px; color: #94a3b8; border-bottom: 1px solid #334155; padding-bottom: 8px;">
                Standard Linux POSIX Permissions (read, write, execute):
            </div>

            <!-- Permission Table -->
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: center;">
                <thead>
                    <tr style="color: #38bdf8; border-bottom: 1px solid #334155;">
                        <th style="text-align: left; padding: 6px;">Scope</th>
                        <th style="padding: 6px;">Read (r)</th>
                        <th style="padding: 6px;">Write (w)</th>
                        <th style="padding: 6px;">Execute (x)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                        <td style="text-align: left; padding: 8px; font-weight: 600; color: #e2e8f0;">Owner</td>
                        <td><input type="checkbox" id="perm-owner-r" ${bits.owner.r ? 'checked' : ''}></td>
                        <td><input type="checkbox" id="perm-owner-w" ${bits.owner.w ? 'checked' : ''}></td>
                        <td><input type="checkbox" id="perm-owner-x" ${bits.owner.x ? 'checked' : ''}></td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                        <td style="text-align: left; padding: 8px; font-weight: 600; color: #e2e8f0;">Group</td>
                        <td><input type="checkbox" id="perm-group-r" ${bits.group.r ? 'checked' : ''}></td>
                        <td><input type="checkbox" id="perm-group-w" ${bits.group.w ? 'checked' : ''}></td>
                        <td><input type="checkbox" id="perm-group-x" ${bits.group.x ? 'checked' : ''}></td>
                    </tr>
                    <tr>
                        <td style="text-align: left; padding: 8px; font-weight: 600; color: #e2e8f0;">Others</td>
                        <td><input type="checkbox" id="perm-others-r" ${bits.others.r ? 'checked' : ''}></td>
                        <td><input type="checkbox" id="perm-others-w" ${bits.others.w ? 'checked' : ''}></td>
                        <td><input type="checkbox" id="perm-others-x" ${bits.others.x ? 'checked' : ''}></td>
                    </tr>
                </tbody>
            </table>

            <!-- Octal chmod display -->
            <div style="display: flex; align-items: center; justify-content: space-between; background: #1e293b; padding: 8px 12px; border-radius: 6px; margin-top: 4px;">
                <span style="font-size: 12px; color: #94a3b8; font-weight: 600;">chmod Octal Mode:</span>
                <input type="text" id="perm-octal-input" value="${octalStr}" maxlength="4" style="width: 70px; background: #0f172a; border: 1px solid #0284c7; border-radius: 4px; color: #38bdf8; text-align: center; font-family: monospace; font-size: 14px; font-weight: 700; padding: 3px;">
            </div>
        </div>

        <!-- Footer Buttons -->
        <div style="display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px; background: #1e293b; border-top: 1px solid #334155; margin-top: auto;">
            <button id="prop-btn-cancel" style="padding: 6px 14px; background: #334155; color: #e2e8f0; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">Close</button>
            <button id="prop-btn-apply" style="padding: 6px 16px; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">Apply Permissions</button>
        </div>
    `;

    const winId = `prop-${fullPath.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    wm.createWindow({
        id: winId,
        title: `Properties - ${fileName}`,
        icon: '🛡️',
        width: 440,
        height: 380,
        content: dialog
    });

    const tabBtns = dialog.querySelectorAll('.prop-tab-btn');
    const tabGeneral = dialog.querySelector('#prop-tab-general');
    const tabPerms = dialog.querySelector('#prop-tab-permissions');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = '#94a3b8';
            });
            btn.classList.add('active');
            btn.style.background = '#0284c7';
            btn.style.color = '#fff';

            if (btn.dataset.tab === 'general') {
                tabGeneral.style.display = 'flex';
                tabPerms.style.display = 'none';
            } else {
                tabGeneral.style.display = 'none';
                tabPerms.style.display = 'flex';
            }
        });
    });

    const octalInput = dialog.querySelector('#perm-octal-input');
    const checkboxes = {
        owner: { r: dialog.querySelector('#perm-owner-r'), w: dialog.querySelector('#perm-owner-w'), x: dialog.querySelector('#perm-owner-x') },
        group: { r: dialog.querySelector('#perm-group-r'), w: dialog.querySelector('#perm-group-w'), x: dialog.querySelector('#perm-group-x') },
        others: { r: dialog.querySelector('#perm-others-r'), w: dialog.querySelector('#perm-others-w'), x: dialog.querySelector('#perm-others-x') }
    };

    const calcOctalFromBoxes = () => {
        const o = (checkboxes.owner.r.checked ? 4 : 0) + (checkboxes.owner.w.checked ? 2 : 0) + (checkboxes.owner.x.checked ? 1 : 0);
        const g = (checkboxes.group.r.checked ? 4 : 0) + (checkboxes.group.w.checked ? 2 : 0) + (checkboxes.group.x.checked ? 1 : 0);
        const w = (checkboxes.others.r.checked ? 4 : 0) + (checkboxes.others.w.checked ? 2 : 0) + (checkboxes.others.x.checked ? 1 : 0);
        octalInput.value = `${o}${g}${w}`;
    };

    Object.values(checkboxes).forEach(scope => {
        Object.values(scope).forEach(cb => {
            cb.addEventListener('change', calcOctalFromBoxes);
        });
    });

    octalInput.addEventListener('input', () => {
        const val = octalInput.value.replace(/[^0-7]/g, '').slice(-3);
        if (val.length === 3) {
            const parsed = parseOctalBits(val);
            checkboxes.owner.r.checked = parsed.owner.r;
            checkboxes.owner.w.checked = parsed.owner.w;
            checkboxes.owner.x.checked = parsed.owner.x;
            checkboxes.group.r.checked = parsed.group.r;
            checkboxes.group.w.checked = parsed.group.w;
            checkboxes.group.x.checked = parsed.group.x;
            checkboxes.others.r.checked = parsed.others.r;
            checkboxes.others.w.checked = parsed.others.w;
            checkboxes.others.x.checked = parsed.others.x;
        }
    });

    dialog.querySelector('#prop-btn-cancel').addEventListener('click', () => wm.closeWindow(winId));
    dialog.querySelector('#prop-btn-apply').addEventListener('click', () => {
        calcOctalFromBoxes();
        const mode = octalInput.value.trim() || '0755';
        vfs.chmod(fullPath, mode);
        sound.playSuccess();
        story.showToast('🛡️ Permissions Applied', `chmod ${mode} applied to ${fileName}`, 'success');
        wm.closeWindow(winId);
    });
}

/**
 * Show Inline/Modal Rename Dialog
 * @param {string} fullPath 
 * @param {Function} onRenamed 
 */
export function showRenameDialog(fullPath, onRenamed) {
    const node = vfs.getNode(fullPath);
    if (!node) return;

    const oldName = node.name || fullPath.split('/').pop();
    const parentPath = fullPath.substring(0, fullPath.lastIndexOf('/')) || '/';

    const dialog = document.createElement('div');
    dialog.style.cssText = 'padding: 16px; display: flex; flex-direction: column; gap: 12px; font-family: "Outfit", sans-serif; color: #f8fafc; background: #0f172a;';

    dialog.innerHTML = `
        <div style="font-weight: 700; font-size: 14px; color: #38bdf8;">✏️ Rename Item</div>
        <div style="font-size: 12px; color: #94a3b8;">Enter a new name for <strong>${escapeHtml(oldName)}</strong>:</div>
        <input type="text" id="rename-input" value="${escapeHtml(oldName)}" style="width: 100%; padding: 8px 10px; background: #1e293b; border: 1px solid #475569; border-radius: 6px; color: #fff; font-size: 13px; font-family: inherit; outline: none; box-sizing: border-box;">
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;">
            <button id="rename-cancel" style="padding: 6px 14px; background: #334155; color: #e2e8f0; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">Cancel</button>
            <button id="rename-confirm" style="padding: 6px 16px; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer;">Rename</button>
        </div>
    `;

    const winId = 'rename-dialog';
    wm.createWindow({
        id: winId,
        title: `Rename - ${oldName}`,
        icon: '✏️',
        width: 360,
        height: 190,
        content: dialog
    });

    const input = dialog.querySelector('#rename-input');
    input.focus();
    input.select();

    const doRename = () => {
        const newName = input.value.trim().replace(/[\/\\:*?"<>|]/g, '_');
        if (!newName || newName === oldName) {
            wm.closeWindow(winId);
            return;
        }

        const newFullPath = `${parentPath === '/' ? '' : parentPath}/${newName}`;
        if (vfs.exists(newFullPath)) {
            story.showToast('Error', `An item named "${newName}" already exists.`, 'error');
            return;
        }

        const success = vfs.rename(fullPath, newFullPath);
        if (success) {
            sound.playSuccess();
            story.showToast('✏️ Renamed', `Renamed to ${newName}`, 'success');
            wm.closeWindow(winId);
            if (typeof onRenamed === 'function') onRenamed(newFullPath);
        } else {
            story.showToast('Error', `Could not rename item.`, 'error');
        }
    };

    dialog.querySelector('#rename-cancel').addEventListener('click', () => wm.closeWindow(winId));
    dialog.querySelector('#rename-confirm').addEventListener('click', doRename);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            doRename();
        } else if (e.key === 'Escape') {
            wm.closeWindow(winId);
        }
    });
}
