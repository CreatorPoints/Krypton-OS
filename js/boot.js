/* ==========================================================================
   Krypton-OS - Master Boot & Intel Aptio BIOS State Machine Engine
   ========================================================================== */

import { checkEnvironmentState } from './main.js';
import { vfs } from './fs.js';

export class MasterBootEngine {
    constructor() {
        this.container = document.getElementById('boot-screen');

        this.phase = 'BLACK_INIT'; // BLACK_INIT, OSD, APTIO_BIOS, BOOT_ERROR, KERNEL_BOOT
        this.keyInterruptActive = false;
        this.osdTimer = null;
        this.keyListener = null;

        this.activeTab = 3;
        this.selectedRow = 0;
        this.modalActive = false;
        this.popupActive = false;

        this.bootOptions = [
            'NVMe: Samsung SSD 980 PRO 1TB',
            'USB: SanDisk Ultra 32GB',
            'Disabled'
        ];

        this.bootPriority = [
            'NVMe: Samsung SSD 980 PRO 1TB',
            'USB: SanDisk Ultra 32GB'
        ];

        this.tabs = ['Main', 'Advanced', 'Security', 'Boot', 'Save & Exit'];
    }

    start() {
        if (!this.container) return;

        this.phase = 'OSD';
        this.container.innerHTML = '';
        this.container.style.display = 'flex';
        this.keyInterruptActive = true;
        this.showVendorMonitorOSD();
    }

    showVendorMonitorOSD() {
        this.phase = 'OSD';
        this.keyInterruptActive = true;

        this.container.innerHTML = `
            <div class="vendor-splash-screen">
                <div class="vendor-splash-header">
                    <div>
                        <div class="vendor-brand-title">American Megatrends (R)</div>
                        <div class="vendor-brand-sub">ASUSTeK ROG STRIX Z490-E GAMING BIOS Version 2403 • (C) 2024 American Megatrends, Inc.</div>
                    </div>
                    <div class="energy-star-badge">
                        ⚡ EPA ENERGY STAR<br>
                        POLLUTION PREVENTER
                    </div>
                </div>

                <div class="vividplay-osd-box">
                    <div class="vividplay-title">VividDisplay</div>
                    <div class="vividplay-sub">DisplayPort-1 • 2560x1440 @ 165Hz • HDR ON</div>
                    <div class="vividplay-hint">[ Press ESC / F2 / DEL for BIOS Setup ]</div>
                </div>

                <div class="vendor-post-content">
                    <div class="post-row"><span>CPU:</span><span class="post-highlight">Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz</span></div>
                    <div class="post-row"><span>Speed:</span><span>3800 MHz</span><span>• Count: 8 Cores / 16 Threads</span></div>
                    <div class="post-row"><span>Memory:</span><span class="post-ok">DDR4-3200 Dual-Channel (16384 MB OK)</span></div>
                    <div class="post-row"><span>Storage Devices:</span></div>
                    <div class="post-row" style="padding-left: 20px;"><span>M.2_1 (NVMe):</span><span class="post-highlight">Samsung SSD 980 PRO 1TB (PCIe 4.0 x4)</span></div>
                    <div class="post-row" style="padding-left: 20px;"><span>USB Port 1:</span><span class="post-highlight">SanDisk Ultra 3.0 32GB (Krypton Live Medium)</span></div>
                    <div class="post-row"><span>USB Devices:</span><span>1 Mass Storage Device, 1 Keyboard, 1 Mouse, 0 Hubs configured.</span></div>
                </div>

                <div class="vendor-splash-footer">
                    <div>Initializing System Hardware Components...</div>
                    <div class="splash-hotkey-group">
                        <button class="splash-hotkey-btn" id="splash-btn-bios">[ DEL / F2 ] BIOS Setup</button>
                        <button class="splash-hotkey-btn" id="splash-btn-boot">[ F11 ] Boot Menu</button>
                        <button class="splash-hotkey-btn" id="splash-btn-skip">[ ESC / ENTER ] Boot</button>
                    </div>
                </div>
            </div>
        `;

        const proceedToBoot = () => {
            this.clearOSDTimers();
            const isInstalled = localStorage.getItem('krypton_os_installed') === 'true';
            if (isInstalled) {
                this.bootIntoInstalledMainOS();
            } else {
                this.bootIntoKryptonOS();
            }
        };

        // Interactive Button Clicks
        document.getElementById('splash-btn-bios')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearOSDTimers();
            this.openAptioBIOSSetup();
        });

        document.getElementById('splash-btn-boot')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearOSDTimers();
            this.openAptioBIOSSetup();
        });

        document.getElementById('splash-btn-skip')?.addEventListener('click', (e) => {
            e.stopPropagation();
            proceedToBoot();
        });

        this.keyListener = (e) => {
            if (!this.keyInterruptActive) return;

            const isBios = (e.key === 'F2' || e.code === 'F2' || e.key === 'Delete' || e.code === 'Delete');
            const isBootMenu = (e.key === 'F11' || e.code === 'F11' || e.key === 'F12' || e.code === 'F12');
            const isSkip = (e.key === 'Escape' || e.code === 'Escape' || e.key === 'Enter' || e.code === 'Enter' || e.key === ' ');

            if (isBios || isBootMenu) {
                e.preventDefault();
                this.clearOSDTimers();
                this.openAptioBIOSSetup();
            } else if (isSkip) {
                e.preventDefault();
                proceedToBoot();
            }
        };

        document.addEventListener('keydown', this.keyListener);

        this.osdTimer = setTimeout(() => {
            if (this.phase === 'OSD') {
                proceedToBoot();
            }
        }, 1200);
    }

    clearOSDTimers() {
        this.keyInterruptActive = false;
        if (this.osdTimer) clearTimeout(this.osdTimer);
        if (this.keyListener) document.removeEventListener('keydown', this.keyListener);
    }

    openAptioBIOSSetup() {
        this.phase = 'APTIO_BIOS';
        this.modalActive = false;
        this.popupActive = false;
        this.renderAptioScreen();
    }

    renderAptioScreen() {
        if (this.phase !== 'APTIO_BIOS') return;

        const tabName = this.tabs[this.activeTab];

        this.container.innerHTML = `
            <div class="aptio-bios-screen">
                <div class="aptio-header">
                    <span class="aptio-header-title">Aptio Setup Utility - Copyright (C) 2026 American Megatrends, Inc.</span>
                </div>

                <div class="aptio-tabs-bar">
                    ${this.tabs.map((tab, idx) => `
                        <div class="aptio-tab ${this.activeTab === idx ? 'active' : ''}">
                            ${tab}
                        </div>
                    `).join('')}
                </div>

                <div class="aptio-body-grid">
                    <div class="aptio-main-panel">
                        ${this.renderAptioTabContent(tabName)}
                    </div>

                    <div class="aptio-help-panel">
                        <div class="aptio-help-title">Item Specific Help</div>
                        <div>${this.getAptioHelpText(tabName)}</div>
                    </div>
                </div>

                <div class="aptio-footer-bar">
                    <span>← → : Select Tab</span>
                    <span>↑ ↓ : Select Item</span>
                    <span>Enter : Change / Select</span>
                    <span>F10 : Save & Exit</span>
                    <span>Esc : Exit</span>
                </div>
            </div>
        `;

        this.attachAptioControls();
    }

    renderAptioTabContent(tabName) {
        if (tabName === 'Main') {
            return `
                <div class="aptio-row"><span class="aptio-label">BIOS Version</span><span class="aptio-val">American Megatrends 2403 (08/12/2024)</span></div>
                <div class="aptio-row"><span class="aptio-label">Processor Type</span><span class="aptio-val">Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz</span></div>
                <div class="aptio-row"><span class="aptio-label">System Memory</span><span class="aptio-val">16384 MB DDR4-3200 (Dual-Channel)</span></div>
                <div class="aptio-row"><span class="aptio-label">Primary Storage</span><span class="aptio-val">Samsung SSD 980 PRO 1TB (NVMe)</span></div>
                <div class="aptio-row"><span class="aptio-label">System Date</span><span class="aptio-val">[Sat 08/15/2026]</span></div>
                <div class="aptio-row"><span class="aptio-label">System Time</span><span class="aptio-val">[14:45:00]</span></div>
            `;
        } else if (tabName === 'Advanced') {
            return `
                <div class="aptio-section-header">CPU Configuration</div>
                <div class="aptio-row"><span class="aptio-label">Hyper-Threading</span><span class="aptio-val">[Enabled]</span></div>
                <div class="aptio-row"><span class="aptio-label">Virtualization Technology</span><span class="aptio-val">[Enabled]</span></div>
                <div class="aptio-section-header">USB Configuration</div>
                <div class="aptio-row"><span class="aptio-label">USB 3.0 Support</span><span class="aptio-val">[Enabled]</span></div>
                <div class="aptio-row"><span class="aptio-label">Legacy USB Support</span><span class="aptio-val">[Enabled]</span></div>
            `;
        } else if (tabName === 'Security') {
            return `
                <div class="aptio-row"><span class="aptio-label">Supervisor Password</span><span class="aptio-val">[Not Installed]</span></div>
                <div class="aptio-row"><span class="aptio-label">User Password</span><span class="aptio-val">[Not Installed]</span></div>
                <div class="aptio-row"><span class="aptio-label">Secure Boot State</span><span class="aptio-val">[Disabled]</span></div>
            `;
        } else if (tabName === 'Boot') {
            return `
                <div class="aptio-section-header">Boot Option Priorities</div>
                <div class="aptio-row ${this.selectedRow === 0 ? 'selected' : ''}">
                    <span class="aptio-label">Boot Option #1</span>
                    <span class="aptio-val">[ ${this.bootPriority[0]} ]</span>
                </div>
                <div class="aptio-row ${this.selectedRow === 1 ? 'selected' : ''}">
                    <span class="aptio-label">Boot Option #2</span>
                    <span class="aptio-val">[ ${this.bootPriority[1]} ]</span>
                </div>
                <div class="aptio-section-header">Boot Properties</div>
                <div class="aptio-row ${this.selectedRow === 2 ? 'selected' : ''}">
                    <span class="aptio-label">Fast Boot</span>
                    <span class="aptio-val">[Disabled]</span>
                </div>
            `;
        } else if (tabName === 'Save & Exit') {
            return `
                <div class="aptio-row ${this.selectedRow === 0 ? 'selected' : ''}">
                    <span class="aptio-label">Save Changes and Reset</span>
                </div>
                <div class="aptio-row ${this.selectedRow === 1 ? 'selected' : ''}">
                    <span class="aptio-label">Discard Changes and Exit</span>
                </div>
            `;
        }
        return '';
    }

    getAptioHelpText(tabName) {
        if (tabName === 'Boot') {
            return 'Sets the system boot order. Highlight a Boot Option and press Enter to select target device.';
        } else if (tabName === 'Save & Exit') {
            return 'Exit system setup after saving the changes. F10 can be used for this operation.';
        }
        return 'Use Arrow keys to select option. Press Enter to modify.';
    }

    attachAptioControls() {
        if (this.keyListener) document.removeEventListener('keydown', this.keyListener);

        this.keyListener = (e) => {
            if (this.phase !== 'APTIO_BIOS') return;
            if (this.modalActive || this.popupActive) return;

            if (e.key === 'F10') {
                e.preventDefault();
                this.showSaveModal();
                return;
            }

            if (e.key === 'ArrowRight') {
                this.activeTab = (this.activeTab + 1) % this.tabs.length;
                this.selectedRow = 0;
                this.renderAptioScreen();
            } else if (e.key === 'ArrowLeft') {
                this.activeTab = (this.activeTab - 1 + this.tabs.length) % this.tabs.length;
                this.selectedRow = 0;
                this.renderAptioScreen();
            } else if (e.key === 'ArrowUp') {
                this.selectedRow = Math.max(0, this.selectedRow - 1);
                this.renderAptioScreen();
            } else if (e.key === 'ArrowDown') {
                this.selectedRow++;
                this.renderAptioScreen();
            } else if (e.key === 'Enter') {
                const tabName = this.tabs[this.activeTab];
                if (tabName === 'Boot' && (this.selectedRow === 0 || this.selectedRow === 1)) {
                    this.showBootDeviceSelectionPopup(this.selectedRow);
                } else if (tabName === 'Save & Exit') {
                    if (this.selectedRow === 0) {
                        this.showSaveModal();
                    } else {
                        this.showBootDeviceFailure();
                    }
                }
            } else if (e.key === 'Escape') {
                this.showSaveModal();
            }
        };

        document.addEventListener('keydown', this.keyListener);
    }

    showBootDeviceSelectionPopup(bootIndex) {
        this.popupActive = true;
        const currentVal = this.bootPriority[bootIndex];

        let popupSelectedIdx = this.bootOptions.indexOf(currentVal);
        if (popupSelectedIdx === -1) popupSelectedIdx = 0;

        const popup = document.createElement('div');
        popup.className = 'aptio-selection-popup';

        const renderPopupContent = () => {
            popup.innerHTML = `
                <div class="aptio-popup-title">[ Boot Option #${bootIndex + 1} ]</div>
                ${this.bootOptions.map((opt, idx) => `
                    <div class="aptio-popup-item ${popupSelectedIdx === idx ? 'selected' : ''}">
                        ${opt}
                    </div>
                `).join('')}
            `;
        };

        renderPopupContent();
        this.container.appendChild(popup);

        const handlePopupKey = (e) => {
            if (!this.popupActive) return;

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                popupSelectedIdx = (popupSelectedIdx - 1 + this.bootOptions.length) % this.bootOptions.length;
                renderPopupContent();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                popupSelectedIdx = (popupSelectedIdx + 1) % this.bootOptions.length;
                renderPopupContent();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                document.removeEventListener('keydown', handlePopupKey);
                this.bootPriority[bootIndex] = this.bootOptions[popupSelectedIdx];
                popup.remove();
                this.popupActive = false;
                this.renderAptioScreen();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                document.removeEventListener('keydown', handlePopupKey);
                popup.remove();
                this.popupActive = false;
            }
        };

        document.addEventListener('keydown', handlePopupKey);
    }

    showSaveModal() {
        this.modalActive = true;
        const modal = document.createElement('div');
        modal.className = 'aptio-modal-overlay';
        modal.innerHTML = `
            <div class="aptio-modal-title">Save configuration and exit now?</div>
            <div class="aptio-modal-prompt">[ Yes (Y) ] &nbsp;&nbsp;&nbsp;&nbsp; [ No (N) ]</div>
        `;

        this.container.appendChild(modal);

        const handleModalKey = (e) => {
            if (e.key.toLowerCase() === 'y' || e.key === 'Enter') {
                document.removeEventListener('keydown', handleModalKey);
                modal.remove();
                this.modalActive = false;

                const isInstalled = localStorage.getItem('krypton_os_installed') === 'true';
                if (this.bootPriority[0].includes('PenDrive') || this.bootPriority[0].includes('USB')) {
                    this.bootIntoKryptonOS();
                } else if (this.bootPriority[0].includes('SATA') || this.bootPriority[0].includes('Samsung')) {
                    if (isInstalled) {
                        this.bootIntoInstalledMainOS();
                    } else {
                        this.showBootDeviceFailure();
                    }
                } else {
                    this.showBootDeviceFailure();
                }
            } else if (e.key.toLowerCase() === 'n' || e.key === 'Escape') {
                document.removeEventListener('keydown', handleModalKey);
                modal.remove();
                this.modalActive = false;
            }
        };

        document.addEventListener('keydown', handleModalKey);
    }

    showBootDeviceFailure() {
        this.phase = 'BOOT_ERROR';
        if (this.keyListener) document.removeEventListener('keydown', this.keyListener);

        this.container.innerHTML = `
            <div class="bios-error-viewport" id="bios-error-viewport">
                <div class="bios-error-wrapper" id="bios-error-lines">
                    <div class="bios-error-line">Reboot and Select proper Boot device</div>
                    <div class="bios-error-line">or Insert Boot Media in selected Boot device and press a key<span class="bios-underscore-cursor" id="bios-cursor"></span></div>
                </div>
            </div>
        `;

        this.attachErrorStateListeners();
    }

    attachErrorStateListeners() {
        const linesContainer = document.getElementById('bios-error-lines');

        this.keyListener = (e) => {
            if (this.phase !== 'BOOT_ERROR') return;

            const isCtrlShiftDel = (e.ctrlKey && e.shiftKey && (e.key === 'Delete' || e.code === 'Delete'));
            const isCtrlAltDel = (e.ctrlKey && e.altKey && (e.key === 'Delete' || e.code === 'Delete'));

            if (isCtrlShiftDel || isCtrlAltDel) {
                e.preventDefault();
                document.removeEventListener('keydown', this.keyListener);
                this.start();
                return;
            }

            if (e.key === 'Delete' || e.key === 'F2' || e.code === 'Delete' || e.code === 'F2') {
                e.preventDefault();
                document.removeEventListener('keydown', this.keyListener);
                this.openAptioBIOSSetup();
                return;
            }

            e.preventDefault();

            const oldCursor = document.getElementById('bios-cursor');
            if (oldCursor) oldCursor.remove();

            if (linesContainer) {
                const line1 = document.createElement('div');
                line1.className = 'bios-error-line';
                line1.textContent = 'Reboot and Select proper Boot device';

                const line2 = document.createElement('div');
                line2.className = 'bios-error-line';
                line2.innerHTML = `or Insert Boot Media in selected Boot device and press a key<span class="bios-underscore-cursor" id="bios-cursor"></span>`;

                linesContainer.appendChild(line1);
                linesContainer.appendChild(line2);

                const maxLines = Math.floor(window.innerHeight / 28);
                while (linesContainer.children.length > maxLines) {
                    linesContainer.removeChild(linesContainer.firstChild);
                }
            }
        };

        document.addEventListener('keydown', this.keyListener);
    }

    /* --------------------------------------------------------------------------
       STREAMING KERNEL BOOT WITH VARIABLE REALISTIC DELAYS
       -------------------------------------------------------------------------- */
    bootIntoKryptonOS() {
        this.phase = 'KERNEL_BOOT';
        if (this.keyListener) document.removeEventListener('keydown', this.keyListener);

        this.container.innerHTML = `
            <div class="bios-error-viewport" id="kernel-log-viewport" style="padding: 24px; color: #00ffaa;">
            </div>
        `;

        const viewport = document.getElementById('kernel-log-viewport');

        const kernelLogs = [
            { delay: 0, text: '[  0.000000] Initializing Krypton Linux Kernel 6.10-release...' },
            { delay: 250, text: '[  0.142091] Detected Boot Media: USB Flash Drive PenDrive 32GB' },
            { delay: 650, text: '[  0.412850] [ OK ] Mounted root virtual filesystem (/dev/sdb1)' },
            { delay: 1100, text: '[  0.890124] [ OK ] Started Krypton System Daemon (systemd 254)' },
            { delay: 1550, text: '[  1.200451] [ OK ] Loaded Krypton Live USB Environment' },
            { delay: 2100, text: '[  1.500000] Launching Krypton Desktop...' }
        ];

        kernelLogs.forEach(item => {
            setTimeout(() => {
                if (viewport) {
                    const line = document.createElement('div');
                    line.textContent = item.text;
                    viewport.appendChild(line);
                }
            }, item.delay);
        });

        setTimeout(() => {
            this.container.style.display = 'none';
            checkEnvironmentState();
            document.getElementById('desktop-environment').classList.remove('hidden');
        }, 2600);
    }

    bootIntoInstalledMainOS() {
        this.phase = 'KERNEL_BOOT';
        if (this.keyListener) document.removeEventListener('keydown', this.keyListener);

        // Check if root system is intact or broken by user experimentation
        const vmlinuz = vfs.getNode('/boot/vmlinuz-6.10.0-krypton-generic');
        const osRelease = vfs.getNode('/etc/os-release');
        const grubCfg = vfs.getNode('/boot/grub/grub.cfg');
        const bashBin = vfs.getNode('/bin/bash');

        if (!vmlinuz || !grubCfg || !osRelease || !bashBin) {
            this.showGrubRescueOrKernelPanic(!grubCfg ? 'GRUB_RESCUE' : 'KERNEL_PANIC');
            return;
        }

        this.container.innerHTML = `
            <div class="bios-error-viewport" id="kernel-log-viewport" style="padding: 24px; color: #00ffaa;">
            </div>
        `;

        const viewport = document.getElementById('kernel-log-viewport');

        const kernelLogs = [
            { delay: 0, text: '[  0.000000] Initializing Krypton Linux Kernel 6.10-release...' },
            { delay: 200, text: '[  0.098410] Loading system drive: SATA SSD Samsung 870 EVO 500GB (/dev/sda1)' },
            { delay: 500, text: '[  0.351290] [ OK ] Mounted ext4 root filesystem' },
            { delay: 900, text: '[  0.781920] [ OK ] Started Krypton Display Manager' },
            { delay: 1300, text: '[  1.100500] [ OK ] Loaded Virtual Companion Core (pet.exe)' },
            { delay: 1700, text: '[  1.400000] Welcome to KryptonOS Main Desktop!' }
        ];

        kernelLogs.forEach(item => {
            setTimeout(() => {
                if (viewport) {
                    const line = document.createElement('div');
                    line.textContent = item.text;
                    viewport.appendChild(line);
                }
            }, item.delay);
        });

        setTimeout(() => {
            this.container.style.display = 'none';
            checkEnvironmentState();
            document.getElementById('desktop-environment').classList.remove('hidden');
        }, 2200);
    }

    showGrubRescueOrKernelPanic(type) {
        this.phase = 'KERNEL_PANIC';
        if (this.keyListener) document.removeEventListener('keydown', this.keyListener);

        if (type === 'GRUB_RESCUE') {
            this.container.innerHTML = `
                <div class="bios-error-viewport" style="padding: 24px; color: #ff5555; font-family: monospace; font-size: 16px; line-height: 1.4;">
                    <div>error: no such partition or /boot/grub/grub.cfg missing.</div>
                    <div style="color: #ffffff;">Entering rescue mode...</div>
                    <div style="color: #00e5ff; margin-top: 12px;">grub rescue&gt; <span id="grub-cmd"></span><span class="bios-underscore-cursor" id="bios-cursor"></span></div>
                    <div id="grub-history" style="margin-top: 8px; color: #ccc;"></div>
                    <div style="color: #777; margin-top: 24px; font-size: 13px;">[ Tip: Type 'ls', 'help', or 'reboot'. Press DEL/F2 on reboot to enter BIOS and boot Live USB to reinstall/repair. ]</div>
                </div>
            `;

            let grubInput = '';
            const grubCmdEl = document.getElementById('grub-cmd');
            const grubHistory = document.getElementById('grub-history');

            this.keyListener = (e) => {
                if (this.phase !== 'KERNEL_PANIC') return;
                if (e.key === 'Backspace') {
                    e.preventDefault();
                    grubInput = grubInput.slice(0, -1);
                    if (grubCmdEl) grubCmdEl.textContent = grubInput;
                    return;
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const cmd = grubInput.trim();
                    grubInput = '';
                    if (grubCmdEl) grubCmdEl.textContent = '';
                    
                    const div = document.createElement('div');
                    div.innerHTML = `<span style="color: #00e5ff;">grub rescue&gt;</span> ${cmd}`;
                    grubHistory.appendChild(div);

                    if (cmd === 'ls') {
                        const res = document.createElement('div');
                        res.textContent = '(hd0) (hd0,msdos1) (hd0,msdos2) (hd1) (hd1,msdos1)';
                        res.style.color = '#fff';
                        grubHistory.appendChild(res);
                    } else if (cmd === 'reboot' || cmd === 'exit') {
                        document.removeEventListener('keydown', this.keyListener);
                        this.start();
                    } else if (cmd === 'help') {
                        const res = document.createElement('div');
                        res.innerHTML = `Available commands: ls, set, insmod, reboot<br>System files on SATA SSD are corrupted/deleted.<br>Enter BIOS Setup (DEL/F2) on reboot to boot PenDrive Live USB and repair.`;
                        res.style.color = '#ffff55';
                        grubHistory.appendChild(res);
                    } else if (cmd) {
                        const res = document.createElement('div');
                        res.textContent = `Unknown command '${cmd}'.`;
                        res.style.color = '#ff5555';
                        grubHistory.appendChild(res);
                    }
                    return;
                }
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                    grubInput += e.key;
                    if (grubCmdEl) grubCmdEl.textContent = grubInput;
                }
            };
            document.addEventListener('keydown', this.keyListener);
        } else {
            // KERNEL PANIC
            this.container.innerHTML = `
                <div class="bios-error-viewport" style="padding: 24px; color: #ff5555; font-family: monospace; font-size: 15px; line-height: 1.4;">
                    <div style="color: #fff; font-weight: bold; margin-bottom: 8px;">[    0.351290] Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(8,1)</div>
                    <div>[    0.351300] CPU: 0 PID: 1 Comm: swapper/0 Not tainted 6.10.0-krypton-generic #1</div>
                    <div>[    0.351310] Hardware name: American Megatrends Krypton Station KM-9000</div>
                    <div>[    0.351320] Call Trace:</div>
                    <div>[    0.351330]  dump_stack_lvl+0x48/0x70</div>
                    <div>[    0.351340]  panic+0x140/0x310</div>
                    <div>[    0.351350]  mount_block_root+0x210/0x240</div>
                    <div>[    0.351360]  mount_root+0x60/0x80</div>
                    <div>[    0.351370]  prepare_namespace+0x13c/0x170</div>
                    <div>[    0.351380]  kernel_init+0x18/0x130</div>
                    <div style="color: #fff;">[    0.351390] ---[ end Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(8,1) ]---</div>
                    <div style="color: #00ffaa; margin-top: 20px;">Press [DEL / F2] to enter BIOS Setup, or [ENTER / R] to Reboot.</div>
                </div>
            `;

            this.keyListener = (e) => {
                if (this.phase !== 'KERNEL_PANIC') return;
                if (e.key === 'Delete' || e.key === 'F2') {
                    e.preventDefault();
                    document.removeEventListener('keydown', this.keyListener);
                    this.openAptioBIOSSetup();
                } else if (e.key === 'Enter' || e.key.toLowerCase() === 'r') {
                    e.preventDefault();
                    document.removeEventListener('keydown', this.keyListener);
                    this.start();
                }
            };
            document.addEventListener('keydown', this.keyListener);
        }
    }
}

export const boot = new MasterBootEngine();

document.addEventListener('DOMContentLoaded', () => {
    boot.start();
});
