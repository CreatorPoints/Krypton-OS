/* ==========================================================================
   PhotonOS - Window Manager
   ========================================================================== */

import { sound } from './sound.js';

export class WindowManager {
    constructor() {
        this.windows = new Map();
        this.activeWindowId = null;
        this.topZIndex = 100;
        this.windowContainer = document.getElementById('window-layer');
        this.taskbarContainer = document.getElementById('taskbar-windows');
    }

    createWindow(config) {
        const {
            id,
            title,
            icon = '📱',
            width = 640,
            height = 440,
            minWidth = 300,
            minHeight = 200,
            content = '',
            onClose = null
        } = config;

        // If window already exists, focus it
        if (this.windows.has(id)) {
            this.restoreWindow(id);
            this.focusWindow(id);
            return this.windows.get(id);
        }

        // Calculate initial centered placement
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight - 48;
        const left = Math.max(30, (screenWidth - width) / 2 + (this.windows.size * 20) % 100);
        const top = Math.max(30, (screenHeight - height) / 2 + (this.windows.size * 20) % 100);

        // Build Window DOM Element
        const winEl = document.createElement('div');
        winEl.className = 'os-window glass-panel';
        winEl.id = `window-${id}`;
        winEl.style.width = `${width}px`;
        winEl.style.height = `${height}px`;
        winEl.style.left = `${left}px`;
        winEl.style.top = `${top}px`;
        winEl.style.zIndex = ++this.topZIndex;

        winEl.innerHTML = `
            <div class="window-titlebar">
                <div class="window-title-info">
                    <span class="window-icon">${icon}</span>
                    <span class="window-title-text">${title}</span>
                </div>
                <div class="window-controls">
                    <button class="window-control-btn btn-minimize" title="Minimize">_</button>
                    <button class="window-control-btn btn-maximize" title="Maximize">□</button>
                    <button class="window-control-btn btn-close" title="Close">✕</button>
                </div>
            </div>
            <div class="window-body" id="window-body-${id}">
                ${typeof content === 'string' ? content : ''}
            </div>
            <div class="window-resizer r-right"></div>
            <div class="window-resizer r-bottom"></div>
            <div class="window-resizer r-bottom-right"></div>
        `;

        if (typeof content !== 'string' && content instanceof HTMLElement) {
            winEl.querySelector(`.window-body`).appendChild(content);
        }

        this.windowContainer.appendChild(winEl);

        const winData = {
            id,
            title,
            icon,
            el: winEl,
            minimized: false,
            maximized: false,
            onClose,
            prevRect: { left, top, width, height }
        };

        this.windows.set(id, winData);
        this.setupWindowEvents(winData);
        this.createTaskbarButton(winData);
        this.focusWindow(id);
        sound.playWindowOpen();

        return winData;
    }

    setupWindowEvents(winData) {
        const { el, id } = winData;
        const titlebar = el.querySelector('.window-titlebar');
        const btnClose = el.querySelector('.btn-close');
        const btnMin = el.querySelector('.btn-minimize');
        const btnMax = el.querySelector('.btn-maximize');

        // Focus on click
        el.addEventListener('mousedown', () => this.focusWindow(id));

        // Close button
        btnClose.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeWindow(id);
        });

        // Minimize button
        btnMin.addEventListener('click', (e) => {
            e.stopPropagation();
            this.minimizeWindow(id);
        });

        // Maximize button
        btnMax.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMaximize(id);
        });

        // Titlebar double click maximize
        titlebar.addEventListener('dblclick', () => this.toggleMaximize(id));

        // Dragging Logic (Optimized with RAF coalescing & passive listeners)
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        let dragRaf = null;
        let targetLeft = 0, targetTop = 0;

        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('window-control-btn')) return;
            if (winData.maximized) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = el.offsetLeft;
            startTop = el.offsetTop;
            document.addEventListener('mousemove', onMouseMove, { passive: true });
            document.addEventListener('mouseup', onMouseUp);
        });

        const onMouseMove = (e) => {
            if (!isDragging) return;
            targetLeft = Math.max(0, startLeft + (e.clientX - startX));
            targetTop = Math.max(0, startTop + (e.clientY - startY));
            if (!dragRaf) {
                dragRaf = requestAnimationFrame(() => {
                    el.style.left = `${targetLeft}px`;
                    el.style.top = `${targetTop}px`;
                    dragRaf = null;
                });
            }
        };

        const onMouseUp = () => {
            isDragging = false;
            if (dragRaf) {
                cancelAnimationFrame(dragRaf);
                dragRaf = null;
            }
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        // Resizing Logic (Optimized with RAF coalescing)
        const resizerBR = el.querySelector('.r-bottom-right');
        const resizerR = el.querySelector('.r-right');
        const resizerB = el.querySelector('.r-bottom');

        const initResize = (e, resizeX, resizeY) => {
            e.stopPropagation();
            if (winData.maximized) return;
            let rStartX = e.clientX;
            let rStartY = e.clientY;
            let rStartW = el.offsetWidth;
            let rStartH = el.offsetHeight;
            let resizeRaf = null;
            let targetW = rStartW, targetH = rStartH;

            const onResizing = (eMove) => {
                if (resizeX) {
                    targetW = Math.max(260, rStartW + (eMove.clientX - rStartX));
                }
                if (resizeY) {
                    targetH = Math.max(180, rStartH + (eMove.clientY - rStartY));
                }
                if (!resizeRaf) {
                    resizeRaf = requestAnimationFrame(() => {
                        if (resizeX) el.style.width = `${targetW}px`;
                        if (resizeY) el.style.height = `${targetH}px`;
                        resizeRaf = null;
                    });
                }
            };

            const stopResizing = () => {
                if (resizeRaf) {
                    cancelAnimationFrame(resizeRaf);
                    resizeRaf = null;
                }
                document.removeEventListener('mousemove', onResizing);
                document.removeEventListener('mouseup', stopResizing);
            };

            document.addEventListener('mousemove', onResizing, { passive: true });
            document.addEventListener('mouseup', stopResizing);
        };

        if (resizerBR) resizerBR.addEventListener('mousedown', (e) => initResize(e, true, true));
        if (resizerR) resizerR.addEventListener('mousedown', (e) => initResize(e, true, false));
        if (resizerB) resizerB.addEventListener('mousedown', (e) => initResize(e, false, true));
    }

    createTaskbarButton(winData) {
        const btn = document.createElement('button');
        btn.className = 'taskbar-btn active';
        btn.id = `taskbar-btn-${winData.id}`;
        btn.innerHTML = `
            <span>${winData.icon}</span>
            <span class="btn-title">${winData.title}</span>
        `;

        btn.addEventListener('click', () => {
            if (winData.minimized) {
                this.restoreWindow(winData.id);
                this.focusWindow(winData.id);
            } else if (this.activeWindowId === winData.id) {
                this.minimizeWindow(winData.id);
            } else {
                this.focusWindow(winData.id);
            }
        });

        this.taskbarContainer.appendChild(btn);
    }

    focusWindow(id) {
        const win = this.windows.get(id);
        if (!win) return;

        this.windows.forEach(w => w.el.classList.remove('focused'));
        document.querySelectorAll('.taskbar-btn').forEach(b => b.classList.remove('active'));

        win.el.style.zIndex = ++this.topZIndex;
        win.el.classList.add('focused');
        this.activeWindowId = id;

        const taskbarBtn = document.getElementById(`taskbar-btn-${id}`);
        if (taskbarBtn) taskbarBtn.classList.add('active');
    }

    minimizeWindow(id) {
        const win = this.windows.get(id);
        if (!win) return;
        win.minimized = true;
        win.el.classList.add('minimized');
        win.el.classList.remove('focused');

        const taskbarBtn = document.getElementById(`taskbar-btn-${id}`);
        if (taskbarBtn) taskbarBtn.classList.remove('active');
        sound.playWindowClose();
    }

    restoreWindow(id) {
        const win = this.windows.get(id);
        if (!win) return;
        win.minimized = false;
        win.el.classList.remove('minimized');
    }

    toggleMaximize(id) {
        const win = this.windows.get(id);
        if (!win) return;

        if (win.maximized) {
            win.maximized = false;
            win.el.classList.remove('maximized');
        } else {
            win.maximized = true;
            win.el.classList.add('maximized');
        }
    }

    closeWindow(id) {
        const win = this.windows.get(id);
        if (!win) return;

        if (win.onClose) win.onClose();

        win.el.remove();
        const taskbarBtn = document.getElementById(`taskbar-btn-${id}`);
        if (taskbarBtn) taskbarBtn.remove();

        this.windows.delete(id);
        sound.playWindowClose();

        if (this.activeWindowId === id) {
            this.activeWindowId = null;
        }
    }
}

export const wm = new WindowManager();
