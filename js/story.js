/* ==========================================================================
   KryptonOS - Desktop Notifications & System State Services
   ========================================================================== */

import { vfs } from './fs.js';

export class SystemService {
    constructor() {
        this.petInstalled = false;
        this.antigravityInstalled = false;
        this.listeners = [];
    }

    logUserAction(action, detail) {
        // Safe no-op logger for legacy action hooks
    }

    showToast(title, message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'ℹ️';
        if (type === 'warning') icon = '⚠️';
        if (type === 'danger') icon = '🔴';
        if (type === 'success') icon = '✅';

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">✕</button>
        `;

        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(50px)';
                setTimeout(() => toast.remove(), 300);
            }
        }, 4500);
    }

    subscribe(fn) {
        this.listeners.push(fn);
    }

    notifyListeners() {
        this.listeners.forEach(fn => fn(this));
    }
}

export const story = new SystemService();
export const system = story;
