/* ==========================================================================
   KryptonOS Application - Text Editor
   ========================================================================== */

import { wm } from '../wm.js';
import { vfs } from '../fs.js';
import { sound } from '../sound.js';
import { story } from '../story.js';

export function openNotes(arg1 = 'untitled.txt', arg2 = '') {
    let fileName = 'untitled.txt';
    let initialContent = '';

    if (Array.isArray(arg1)) {
        fileName = (typeof arg1[0] === 'string' && arg1[0]) ? arg1[0] : 'untitled.txt';
        initialContent = (typeof arg1[1] === 'string') ? arg1[1] : '';
    } else if (typeof arg1 === 'object' && arg1 !== null) {
        fileName = (typeof arg1.fileName === 'string' && arg1.fileName) || (typeof arg1.name === 'string' && arg1.name) || 'untitled.txt';
        initialContent = (typeof arg1.initialContent === 'string') ? arg1.initialContent : ((typeof arg1.content === 'string') ? arg1.content : '');
    } else if (typeof arg1 === 'string' && arg1) {
        fileName = arg1;
        initialContent = (typeof arg2 === 'string') ? arg2 : '';
    }

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

export { openNotes as openTextEditor };
export default openNotes;
