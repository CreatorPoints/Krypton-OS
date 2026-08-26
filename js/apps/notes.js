/* ==========================================================================
   KryptonOS Application - Text Editor
   ========================================================================== */

import { wm } from '../wm.js';
import { vfs } from '../fs.js';
import { sound } from '../sound.js';
import { story } from '../story.js';

let notesWindowCounter = 0;

export function openNotes(arg1 = null, arg2 = '') {
    notesWindowCounter++;
    const primaryUser = localStorage.getItem('krypton_primary_user') || 'guest';
    const userDocs = vfs.getNode(`/home/${primaryUser}/Documents`) ? `/home/${primaryUser}/Documents` : `/home/${primaryUser}`;
    
    let filePath = '';
    let fileName = 'untitled.txt';
    let initialContent = '';

    if (Array.isArray(arg1)) {
        const first = arg1[0];
        const second = arg1[1];
        if (typeof first === 'string') {
            if (first.startsWith('/')) {
                filePath = first;
                fileName = first.split('/').pop() || 'untitled.txt';
            } else {
                fileName = first;
                filePath = `${userDocs}/${fileName}`;
            }
        }
        if (typeof second === 'string') {
            initialContent = second;
        }
    } else if (typeof arg1 === 'object' && arg1 !== null) {
        filePath = arg1.path || arg1.filePath || '';
        fileName = arg1.fileName || arg1.name || (filePath ? filePath.split('/').pop() : 'untitled.txt');
        initialContent = typeof arg1.content === 'string' ? arg1.content : (typeof arg1.text === 'string' ? arg1.text : '');
        if (!filePath) {
            filePath = `${userDocs}/${fileName}`;
        }
    } else if (typeof arg1 === 'string' && arg1.trim()) {
        if (arg1.startsWith('/')) {
            filePath = arg1;
            fileName = arg1.split('/').pop() || 'untitled.txt';
        } else {
            fileName = arg1;
            filePath = `${userDocs}/${fileName}`;
        }
        initialContent = typeof arg2 === 'string' ? arg2 : '';
    } else {
        filePath = `${userDocs}/untitled.txt`;
        fileName = 'untitled.txt';
    }

    // If file exists and no initialContent was provided, load directly from VFS
    if (filePath && !initialContent && vfs.exists(filePath)) {
        initialContent = vfs.readFile(filePath) || '';
    }

    const winId = `note-${notesWindowCounter}-${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    const content = document.createElement('div');
    content.className = 'notes-app';
    content.style.cssText = 'display: flex; flex-direction: column; height: 100%; width: 100%; background: #0f172a; color: #f8fafc; font-family: "Outfit", sans-serif; overflow: hidden; padding: 0; box-sizing: border-box;';

    content.innerHTML = `
        <!-- Top Toolbar -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #1e293b; border-bottom: 1px solid #334155; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                <span style="font-size: 15px;">📝</span>
                <span style="font-size: 12px; color: #94a3b8; font-weight: 600; white-space: nowrap;">Path:</span>
                <input type="text" id="note-path-input" value="${filePath}" placeholder="/home/.../file.txt" style="flex: 1; min-width: 140px; background: #0f172a; border: 1px solid #475569; border-radius: 4px; padding: 4px 8px; color: #38bdf8; font-family: monospace; font-size: 12px; outline: none;">
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
                <button id="note-new-btn" title="Create New Document" style="padding: 4px 10px; background: #334155; color: #f1f5f9; border: 1px solid #475569; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                    <span>➕</span> New
                </button>
                <button id="note-save-btn" title="Save File (Ctrl+S)" style="padding: 4px 12px; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                    <span>💾</span> Save
                </button>
            </div>
        </div>

        <!-- Editor Area -->
        <textarea id="note-editor" style="flex: 1; width: 100%; border: none; background: #0b0f19; color: #f8fafc; font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace; font-size: 13px; line-height: 1.5; padding: 12px; resize: none; outline: none; box-sizing: border-box; tab-size: 4;" placeholder="Type your text or code here...">${initialContent}</textarea>

        <!-- Status Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 12px; background: #1e293b; border-top: 1px solid #334155; font-size: 11px; color: #94a3b8;">
            <div id="note-status-info" style="display: flex; align-items: center; gap: 6px;">
                <span id="note-status-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block;"></span>
                <span id="note-status-text">Saved</span>
            </div>
            <div style="display: flex; gap: 14px; font-family: monospace;">
                <span id="note-pos-info">Ln 1, Col 1</span>
                <span id="note-len-info">${initialContent.length} chars</span>
                <span>UTF-8</span>
            </div>
        </div>
    `;

    const textarea = content.querySelector('#note-editor');
    const pathInput = content.querySelector('#note-path-input');
    const saveBtn = content.querySelector('#note-save-btn');
    const newBtn = content.querySelector('#note-new-btn');
    const statusDot = content.querySelector('#note-status-dot');
    const statusText = content.querySelector('#note-status-text');
    const posInfo = content.querySelector('#note-pos-info');
    const lenInfo = content.querySelector('#note-len-info');

    let isModified = false;

    const setModified = (val) => {
        isModified = val;
        if (isModified) {
            statusDot.style.background = '#eab308';
            statusText.textContent = 'Unsaved changes';
            statusText.style.color = '#fde047';
        } else {
            statusDot.style.background = '#22c55e';
            statusText.textContent = 'Saved';
            statusText.style.color = '#86efac';
        }
    };

    const updateCursorPosition = () => {
        const selStart = textarea.selectionStart;
        const textUpToCursor = textarea.value.substring(0, selStart);
        const lines = textUpToCursor.split('\n');
        const lineNum = lines.length;
        const colNum = lines[lines.length - 1].length + 1;
        posInfo.textContent = `Ln ${lineNum}, Col ${colNum}`;
        lenInfo.textContent = `${textarea.value.length} chars`;
    };

    const doSave = () => {
        let target = pathInput.value.trim();
        if (!target) {
            target = `${userDocs}/untitled.txt`;
            pathInput.value = target;
        } else if (!target.startsWith('/')) {
            target = `${userDocs}/${target}`;
            pathInput.value = target;
        }

        const text = textarea.value;
        const success = vfs.writeFile(target, text);

        if (success) {
            sound.playSuccess();
            setModified(false);
            const baseName = target.split('/').pop() || 'file.txt';
            story.showToast('💾 File Saved', `Successfully saved to ${target}`, 'success');
            
            const win = wm.windows.get(winId);
            if (win && win.element) {
                const titleSpan = win.element.querySelector('.window-title span:last-child');
                if (titleSpan) titleSpan.textContent = `Text Editor - ${baseName}`;
            }
        } else {
            story.showToast('❌ Save Error', `Could not write to path: ${target}`, 'error');
        }
    };

    saveBtn.addEventListener('click', () => {
        sound.playClick();
        doSave();
    });

    newBtn.addEventListener('click', () => {
        sound.playClick();
        pathInput.value = `${userDocs}/untitled_${Date.now().toString().slice(-4)}.txt`;
        textarea.value = '';
        setModified(false);
        updateCursorPosition();
        textarea.focus();
    });

    textarea.addEventListener('input', () => {
        setModified(true);
        updateCursorPosition();
    });

    textarea.addEventListener('keyup', updateCursorPosition);
    textarea.addEventListener('click', updateCursorPosition);

    textarea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            doSave();
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 4;
            setModified(true);
            updateCursorPosition();
        }
    });

    pathInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            doSave();
        }
    });

    wm.createWindow({
        id: winId,
        title: `Text Editor - ${fileName}`,
        icon: '📝',
        width: 580,
        height: 420,
        content: content
    });
}

export { openNotes as openTextEditor };
export default openNotes;
