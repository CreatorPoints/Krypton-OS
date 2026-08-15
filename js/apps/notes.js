/* ==========================================================================
   KryptonOS Application - Text Editor
   ========================================================================== */

import { wm } from '../wm.js';
import { vfs } from '../fs.js';
import { sound } from '../sound.js';
import { story } from '../story.js';

export function openNotes(fileName = 'untitled.txt', initialContent = '') {
    const primaryUser = localStorage.getItem('krypton_primary_user') || 'guest';
    const userDocs = vfs.getNode(`/home/${primaryUser}/Documents`) ? `/home/${primaryUser}/Documents` : '/home/guest/Documents';

    const content = document.createElement('div');
    content.className = 'notes-app';

    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; font-size: 13px; color: var(--accent-primary);">📝 ${fileName}</span>
            <button id="note-save-btn" style="padding: 6px 14px; background: var(--accent-primary); color: #000; font-weight: 700; border-radius: 6px; font-size: 12px; cursor: pointer;">Save File</button>
        </div>
        <textarea class="notes-editor" id="note-text" placeholder="Write text or code here...">${initialContent}</textarea>
    `;

    const textarea = content.querySelector('#note-text');
    const saveBtn = content.querySelector('#note-save-btn');

    saveBtn.addEventListener('click', () => {
        const text = textarea.value;
        const targetPath = `${userDocs}/${fileName}`;
        vfs.writeFile(targetPath, text);
        sound.playSuccess();
        story.showToast('💾 File Saved', `Saved to ${targetPath}`, 'success');
    });

    wm.createWindow({
        id: `note-${fileName.replace(/[^a-z0-9]/gi, '_')}`,
        title: `Text Editor - ${fileName}`,
        icon: '📝',
        width: 540,
        height: 400,
        content: content
    });
}
