/* ==========================================================================
   KryptonOS - Master Boot Engine & American Megatrends Aptio BIOS
   ========================================================================== */

import { checkEnvironmentState } from './main.js';
import { vfs } from './fs.js';

export class MasterBootEngine {
    constructor() {
        this.container = document.getElementById('boot-screen');

        this.phase = 'BLACK_INIT'; // SPLASH, APTIO_BIOS, BOOT_ERROR, GRUB_RESCUE, KERNEL_BOOT
        this.keyInterruptActive = false;
        this.splashTimer = null;
        this.keyListener = null;

        this.activeTab = 3; // Default to Boot tab in BIOS
        this.selectedRow = 0;
        this.modalActive = false;
        this.popupActive = false;

        this.bootOptions = [
            'USB: SanDisk Ultra 32GB',
            'NVMe: Samsung SSD 980 PRO 1TB',
            'Disabled'
        ];

        // Load persisted boot priority or default for new users (1: SSD, 2: Disabled)
        const savedPriority = localStorage.getItem('krypton_boot_priority');
        if (savedPriority) {
            try {
                this.bootPriority = JSON.parse(savedPriority);
            } catch (e) {
                this.bootPriority = [
                    'NVMe: Samsung SSD 980 PRO 1TB',
                    'Disabled'
                ];
            }
        } else {
            this.bootPriority = [
                'NVMe: Samsung SSD 980 PRO 1TB',
                'Disabled'
            ];
        }

        this.tabs = ['Main', 'Advanced', 'Security', 'Boot', 'Save & Exit'];
    }

    start() {
        this.container = document.getElementById('boot-screen');
        if (!this.container) return;

        this.clearTimers();
        this.phase = 'SPLASH';
        this.container.innerHTML = '';
        this.container.style.display = 'flex';
        document.getElementById('desktop-environment')?.classList.add('hidden');
        document.getElementById('tty-screen')?.classList.add('hidden');
        this.showVividDisplaySplash();
    }

    /* --------------------------------------------------------------------------
       1. STEP 1: MONITOR SPLASH ONLY (VividDisplay for 1.2s)
       -------------------------------------------------------------------------- */
    showVividDisplaySplash() {
        this.phase = 'SPLASH';
        this.keyInterruptActive = true;

        this.container.innerHTML = `
            <div class="vivid-splash-screen" id="vivid-splash">
                <div class="vivid-logo-wrapper">
                    <svg viewBox="0 0 740 180" class="vivid-logo-svg" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="vividAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#00f0ff" />
                                <stop offset="50%" stop-color="#00b4d8" />
                                <stop offset="100%" stop-color="#7209b7" />
                            </linearGradient>
                            <linearGradient id="silverShine" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#ffffff" />
                                <stop offset="60%" stop-color="#e0e6ed" />
                                <stop offset="100%" stop-color="#94a3b8" />
                            </linearGradient>
                            <filter id="vividGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="8" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        <!-- Stylized Geometric Display Emblem -->
                        <g transform="translate(30, 20)">
                            <rect x="0" y="0" width="110" height="76" rx="14" fill="none" stroke="url(#vividAccent)" stroke-width="7" filter="url(#vividGlow)" />
                            <polygon points="40,24 82,38 40,52" fill="url(#vividAccent)" />
                            <path d="M 32,94 L 78,94 M 55,76 L 55,94" stroke="url(#vividAccent)" stroke-width="6" stroke-linecap="round" />
                        </g>
                        <!-- Stylized Monitor Brand Typography -->
                        <text x="175" y="86" font-family="'Outfit', 'Montserrat', system-ui, sans-serif" font-size="68" font-weight="900" letter-spacing="4" fill="url(#silverShine)">
                            Vivid<tspan fill="url(#vividAccent)">Display</tspan>
                        </text>
                    </svg>
                </div>
                <div class="vivid-splash-hint" id="vivid-hint-btn">
                    [ Press ESC for BIOS Setup ]
                </div>
            </div>
        `;

        // Click on hint to enter BIOS
        document.getElementById('vivid-hint-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearTimers();
            this.openAptioBIOSSetup();
        });

        // Key listener: strictly ESC for BIOS during 2.4s splash
        this.keyListener = (e) => {
            if (!this.keyInterruptActive) return;

            const isBios = (e.key === 'Escape' || e.code === 'Escape');

            if (isBios) {
                e.preventDefault();
                this.clearTimers();
                this.openAptioBIOSSetup();
            }
        };

        document.addEventListener('keydown', this.keyListener);

        // Exactly 2.4 seconds (2400ms) splash
        this.splashTimer = setTimeout(() => {
            if (this.phase === 'SPLASH') {
                this.clearTimers();
                this.resolveActiveBootDevice();
            }
        }, 2400);
    }

    clearTimers() {
        this.keyInterruptActive = false;
        if (this.splashTimer) clearTimeout(this.splashTimer);
        if (this.keyListener) document.removeEventListener('keydown', this.keyListener);
    }

    /* --------------------------------------------------------------------------
       2. STEP 2: BOOT RESOLUTION & PRIORITY EVALUATION
       -------------------------------------------------------------------------- */
    resolveActiveBootDevice() {
        this.clearTimers();

        // Evaluate first active boot candidate according to priority slots
        let candidate = null;
        const p1 = this.bootPriority[0] || 'Disabled';
        const p2 = this.bootPriority[1] || 'Disabled';

        if (!p1.includes('Disabled')) {
            candidate = p1;
        } else if (!p2.includes('Disabled')) {
            candidate = p2;
        }

        // If both slots are disabled -> show BIOS boot device failure
        if (!candidate) {
            this.showBootDeviceFailure();
            return;
        }

        // 1. USB PenDrive is the active boot medium
        if (candidate.includes('SanDisk') || candidate.includes('USB') || candidate.includes('PenDrive')) {
            const isInstalled = localStorage.getItem('krypton_os_installed') === 'true';
            const isDeleted = localStorage.getItem('krypton_os_deleted') === 'true';
            const vmlinuz = vfs.getNode('/boot/vmlinuz-6.10.0-krypton-generic') || vfs.getNode('/boot/vmlinuz-2.0.0.14-generic-krypton');
            const grubCfg = vfs.getNode('/boot/grub/grub.cfg');
            const osRelease = vfs.getNode('/etc/os-release');

            // If the OS has been installed to the SSD, but the Live USB is taking 1st priority:
            if (isInstalled && !isDeleted && vmlinuz && grubCfg && osRelease) {
                this.showPostInstallBootOrderNotice();
                return;
            }

            this.bootIntoLiveUSB();
            return;
        }

        // 2. NVMe SSD is the active boot medium -> check OS status
        if (candidate.includes('Samsung') || candidate.includes('NVMe') || candidate.includes('SSD')) {
            const isInstalled = localStorage.getItem('krypton_os_installed') === 'true';
            const isDeleted = localStorage.getItem('krypton_os_deleted') === 'true';
            const vmlinuz = vfs.getNode('/boot/vmlinuz-6.10.0-krypton-generic') || vfs.getNode('/boot/vmlinuz-2.0.0.14-generic-krypton');
            const grubCfg = vfs.getNode('/boot/grub/grub.cfg');
            const osRelease = vfs.getNode('/etc/os-release');

            // If OS is present and healthy -> Boot into main installed OS
            if (isInstalled && !isDeleted && vmlinuz && grubCfg && osRelease) {
                this.bootIntoInstalledMainOS();
                return;
            }

            // If OS was wiped/destroyed via sudo rm -rf /* or deleted /boot -> Show GRUB Rescue
            if (isDeleted || (isInstalled && (!vmlinuz || !grubCfg || !osRelease))) {
                this.showGrubRescueOrKernelPanic(!grubCfg ? 'GRUB_RESCUE' : 'KERNEL_PANIC');
                return;
            }

            // Blank brand new SSD (never installed) -> Show "Reboot and Select proper Boot device"
            this.showBootDeviceFailure();
            return;
        }

        // Default fallback
        this.showBootDeviceFailure();
    }

    /* --------------------------------------------------------------------------
       3. APTIO CLASSIC BIOS SETUP UTILITY
       -------------------------------------------------------------------------- */
    openAptioBIOSSetup() {
        this.phase = 'APTIO_BIOS';
        this.clearTimers();

        this.renderAptioScreen();
        this.attachAptioKeyboardNav();
    }

    renderAptioScreen() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="aptio-bios-screen" id="aptio-viewport">
                <!-- Top Header -->
                <div class="aptio-header">
                    <div class="aptio-header-title">Aptio Setup Utility - American Megatrends, Inc.</div>
                    <div>ASUSTeK ROG STRIX Z490-E GAMING BIOS 2403</div>
                </div>

                <!-- Tabs Bar -->
                <div class="aptio-tabs-bar">
                    ${this.tabs.map((tab, idx) => `
                        <div class="aptio-tab ${idx === this.activeTab ? 'active' : ''}" data-tab="${idx}">
                            ${tab}
                        </div>
                    `).join('')}
                </div>

                <!-- Main Body Grid -->
                <div class="aptio-body-grid">
                    <div class="aptio-main-panel" id="aptio-main-content">
                        ${this.renderAptioTabContent()}
                    </div>
                    <div class="aptio-help-panel">
                        <div class="aptio-help-title">Item Specific Help</div>
                        <div id="aptio-help-text">
                            ${this.getHelpTextForSelectedRow()}
                        </div>
                    </div>
                </div>

                <!-- Bottom Legend Bar -->
                <div class="aptio-footer-bar">
                    <div>[ &larr; &rarr; ] Select Screen &nbsp;&nbsp; [ &uarr; &darr; ] Select Item &nbsp;&nbsp; [ Enter ] Select / SubMenu</div>
                    <div>[ F10 ] Save & Exit &nbsp;&nbsp; [ ESC ] Exit Setup</div>
                </div>
            </div>
        `;

        // Interactive mouse click on tabs
        this.container.querySelectorAll('.aptio-tab').forEach(tabEl => {
            tabEl.addEventListener('click', () => {
                this.activeTab = parseInt(tabEl.getAttribute('data-tab'), 10);
                this.selectedRow = 0;
                this.renderAptioScreen();
            });
        });

        // Interactive mouse click on rows
        this.container.querySelectorAll('.aptio-row').forEach((rowEl, rIdx) => {
            rowEl.addEventListener('click', () => {
                this.selectedRow = rIdx;
                this.renderAptioScreen();
                this.handleRowSelect();
            });
        });
    }

    renderAptioTabContent() {
        if (this.activeTab === 0) {
            // Main Tab
            return `
                <div class="aptio-section-header">System Information</div>
                <div class="aptio-row ${this.selectedRow === 0 ? 'selected' : ''}">
                    <span class="aptio-label">BIOS Version</span>
                    <span class="aptio-val">2403 (08/12/2024)</span>
                </div>
                <div class="aptio-row ${this.selectedRow === 1 ? 'selected' : ''}">
                    <span class="aptio-label">Processor Type</span>
                    <span class="aptio-val">Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz</span>
                </div>
                <div class="aptio-row ${this.selectedRow === 2 ? 'selected' : ''}">
                    <span class="aptio-label">Total Memory</span>
                    <span class="aptio-val">16384 MB (DDR4-3200)</span>
                </div>
                <div class="aptio-section-header">System Date & Time</div>
                <div class="aptio-row ${this.selectedRow === 3 ? 'selected' : ''}">
                    <span class="aptio-label">System Date</span>
                    <span class="aptio-val">[${new Date().toLocaleDateString()}]</span>
                </div>
                <div class="aptio-row ${this.selectedRow === 4 ? 'selected' : ''}">
                    <span class="aptio-label">System Time</span>
                    <span class="aptio-val">[${new Date().toLocaleTimeString()}]</span>
                </div>
            `;
        } else if (this.activeTab === 1) {
            // Advanced Tab
            return `
                <div class="aptio-section-header">Advanced CPU Configuration</div>
                <div class="aptio-row ${this.selectedRow === 0 ? 'selected' : ''}">
                    <span class="aptio-label">Intel Virtualization Technology (VT-x)</span>
                    <span class="aptio-val">[Enabled]</span>
                </div>
                <div class="aptio-row ${this.selectedRow === 1 ? 'selected' : ''}">
                    <span class="aptio-label">Hyper-Threading</span>
                    <span class="aptio-val">[Enabled]</span>
                </div>
                <div class="aptio-section-header">Storage Configuration</div>
                <div class="aptio-row ${this.selectedRow === 2 ? 'selected' : ''}">
                    <span class="aptio-label">SATA Mode Selection</span>
                    <span class="aptio-val">[AHCI]</span>
                </div>
                <div class="aptio-row ${this.selectedRow === 3 ? 'selected' : ''}">
                    <span class="aptio-label">NVMe Controller</span>
                    <span class="aptio-val">[Samsung 980 PRO 1TB]</span>
                </div>
            `;
        } else if (this.activeTab === 2) {
            // Security Tab
            return `
                <div class="aptio-section-header">Security Settings</div>
                <div class="aptio-row ${this.selectedRow === 0 ? 'selected' : ''}">
                    <span class="aptio-label">Administrator Password</span>
                    <span class="aptio-val">[Not Installed]</span>
                </div>
                <div class="aptio-row ${this.selectedRow === 1 ? 'selected' : ''}">
                    <span class="aptio-label">Secure Boot</span>
                    <span class="aptio-val">[Disabled]</span>
                </div>
                <div class="aptio-row ${this.selectedRow === 2 ? 'selected' : ''}">
                    <span class="aptio-label">TPM 2.0 State</span>
                    <span class="aptio-val">[Enabled]</span>
                </div>
            `;
        } else if (this.activeTab === 3) {
            // Boot Tab (Boot Priority Configuration)
            return `
                <div class="aptio-section-header">Boot Option Priorities</div>
                <div class="aptio-row ${this.selectedRow === 0 ? 'selected' : ''}" data-action="boot1">
                    <span class="aptio-label">Boot Option #1</span>
                    <span class="aptio-val">[ ${this.bootPriority[0]} ]</span>
                </div>
                <div class="aptio-row ${this.selectedRow === 1 ? 'selected' : ''}" data-action="boot2">
                    <span class="aptio-label">Boot Option #2</span>
                    <span class="aptio-val">[ ${this.bootPriority[1]} ]</span>
                </div>
                <div class="aptio-section-header">Fast Boot & CSM</div>
                <div class="aptio-row ${this.selectedRow === 2 ? 'selected' : ''}">
                    <span class="aptio-label">Fast Boot</span>
                    <span class="aptio-val">[Enabled]</span>
                </div>
                <div class="aptio-row ${this.selectedRow === 3 ? 'selected' : ''}">
                    <span class="aptio-label">Launch CSM</span>
                    <span class="aptio-val">[Disabled]</span>
                </div>
            `;
        } else if (this.activeTab === 4) {
            // Save & Exit Tab
            return `
                <div class="aptio-section-header">Save & Exit Operations</div>
                <div class="aptio-row ${this.selectedRow === 0 ? 'selected' : ''}" data-action="save">
                    <span class="aptio-label">Save Changes and Reset</span>
                    <span class="aptio-val"></span>
                </div>
                <div class="aptio-row ${this.selectedRow === 1 ? 'selected' : ''}" data-action="discard">
                    <span class="aptio-label">Discard Changes and Exit</span>
                    <span class="aptio-val"></span>
                </div>
                <div class="aptio-row ${this.selectedRow === 2 ? 'selected' : ''}" data-action="defaults">
                    <span class="aptio-label">Restore Optimized Defaults</span>
                    <span class="aptio-val"></span>
                </div>
            `;
        }
        return '';
    }

    getHelpTextForSelectedRow() {
        if (this.activeTab === 3) {
            if (this.selectedRow === 0) return 'Sets the primary system boot device order. Press [Enter] to select between USB PenDrive, NVMe SSD, or Disabled.';
            if (this.selectedRow === 1) return 'Sets the secondary system boot device order if primary fails.';
            return 'Enables or disables boot optimizations.';
        }
        if (this.activeTab === 4) {
            return 'Exit system setup with or without saving your changes.';
        }
        return 'Standard system parameter. Use arrow keys to select, [Enter] to view details.';
    }

    attachAptioKeyboardNav() {
        if (this.keyListener) document.removeEventListener('keydown', this.keyListener);

        this.keyListener = (e) => {
            if (this.phase !== 'APTIO_BIOS' || this.modalActive || this.popupActive) return;

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.activeTab = (this.activeTab + 1) % this.tabs.length;
                this.selectedRow = 0;
                this.renderAptioScreen();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.activeTab = (this.activeTab - 1 + this.tabs.length) % this.tabs.length;
                this.selectedRow = 0;
                this.renderAptioScreen();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const maxRows = this.getMaxRowsForTab();
                this.selectedRow = (this.selectedRow + 1) % maxRows;
                this.renderAptioScreen();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const maxRows = this.getMaxRowsForTab();
                this.selectedRow = (this.selectedRow - 1 + maxRows) % maxRows;
                this.renderAptioScreen();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.handleRowSelect();
            } else if (e.key === 'F10') {
                e.preventDefault();
                this.showSaveModal();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.activeTab = 4;
                this.selectedRow = 1;
                this.renderAptioScreen();
            }
        };

        document.addEventListener('keydown', this.keyListener);
    }

    getMaxRowsForTab() {
        if (this.activeTab === 0) return 5;
        if (this.activeTab === 1) return 4;
        if (this.activeTab === 2) return 3;
        if (this.activeTab === 3) return 4;
        if (this.activeTab === 4) return 3;
        return 1;
    }

    handleRowSelect() {
        if (this.activeTab === 3 && (this.selectedRow === 0 || this.selectedRow === 1)) {
            // Open Boot Option Selection Popup
            this.showBootOptionPopup(this.selectedRow);
        } else if (this.activeTab === 4) {
            if (this.selectedRow === 0) {
                this.showSaveModal();
            } else if (this.selectedRow === 1) {
                // Discard changes & exit
                this.resolveActiveBootDevice();
            } else if (this.selectedRow === 2) {
                // Restore defaults
                this.bootPriority = [
                    'NVMe: Samsung SSD 980 PRO 1TB',
                    'Disabled'
                ];
                localStorage.setItem('krypton_boot_priority', JSON.stringify(this.bootPriority));
                this.renderAptioScreen();
            }
        }
    }

    showBootOptionPopup(bootIndex) {
        this.popupActive = true;
        let selectedPopupIdx = 0;

        const currentVal = this.bootPriority[bootIndex];
        const matchIdx = this.bootOptions.indexOf(currentVal);
        if (matchIdx !== -1) selectedPopupIdx = matchIdx;

        const popup = document.createElement('div');
        popup.className = 'aptio-selection-popup';

        const updatePopupHTML = () => {
            popup.innerHTML = `
                <div class="aptio-popup-title">Boot Option #${bootIndex + 1}</div>
                ${this.bootOptions.map((opt, idx) => `
                    <div class="aptio-popup-item ${idx === selectedPopupIdx ? 'selected' : ''}" data-idx="${idx}">
                        ${opt}
                    </div>
                `).join('')}
            `;

            popup.querySelectorAll('.aptio-popup-item').forEach(itemEl => {
                itemEl.addEventListener('click', () => {
                    const idx = parseInt(itemEl.getAttribute('data-idx'), 10);
                    this.bootPriority[bootIndex] = this.bootOptions[idx];
                    localStorage.setItem('krypton_boot_priority', JSON.stringify(this.bootPriority));
                    document.removeEventListener('keydown', handlePopupKey);
                    popup.remove();
                    this.popupActive = false;
                    this.renderAptioScreen();
                });
            });
        };

        updatePopupHTML();
        this.container.appendChild(popup);

        const handlePopupKey = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedPopupIdx = (selectedPopupIdx + 1) % this.bootOptions.length;
                updatePopupHTML();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedPopupIdx = (selectedPopupIdx - 1 + this.bootOptions.length) % this.bootOptions.length;
                updatePopupHTML();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.bootPriority[bootIndex] = this.bootOptions[selectedPopupIdx];
                localStorage.setItem('krypton_boot_priority', JSON.stringify(this.bootPriority));
                document.removeEventListener('keydown', handlePopupKey);
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

                localStorage.setItem('krypton_boot_priority', JSON.stringify(this.bootPriority));
                this.resolveActiveBootDevice();
            } else if (e.key.toLowerCase() === 'n' || e.key === 'Escape') {
                document.removeEventListener('keydown', handleModalKey);
                modal.remove();
                this.modalActive = false;
            }
        };

        document.addEventListener('keydown', handleModalKey);
    }

    /* --------------------------------------------------------------------------
       4. AUTHENTIC "REBOOT AND SELECT PROPER BOOT DEVICE"
       -------------------------------------------------------------------------- */
    showBootDeviceFailure() {
        this.phase = 'BOOT_ERROR';
        this.clearTimers();

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

            const isRebootKey = (e.ctrlKey && (e.key === 'Delete' || e.code === 'Delete'));

            if (isRebootKey) {
                e.preventDefault();
                document.removeEventListener('keydown', this.keyListener);
                this.start();
                return;
            }

            const isBios = (e.key === 'Escape' || e.code === 'Escape');

            if (isBios) {
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
       5. STREAMING KERNEL / LIVE USB SESSION INIT
       -------------------------------------------------------------------------- */
    bootIntoLiveUSB() {
        this.phase = 'KERNEL_BOOT';
        this.clearTimers();
        sessionStorage.setItem('krypton_current_boot_medium', 'live_usb');

        this.container.innerHTML = `
            <div class="krypton-boot-loader">
                <div class="krypton-loader-logo">
                    <div class="krypton-atom-icon">⚛️</div>
                    <div class="krypton-loader-title">KRYPTON<span style="color: #00e5ff;">OS</span></div>
                    <div class="krypton-loader-sub">Live USB & Installer Session</div>
                </div>
                <div class="krypton-progress-bar-container">
                    <div class="krypton-progress-bar-fill" id="krypton-boot-fill"></div>
                </div>
                <div class="krypton-loader-status" id="krypton-boot-status">Loading installer image into memory...</div>
            </div>
        `;

        const fill = document.getElementById('krypton-boot-fill');
        const status = document.getElementById('krypton-boot-status');

        setTimeout(() => { if (fill) fill.style.width = '35%'; if (status) status.textContent = 'Mounting squashfs root...'; }, 300);
        setTimeout(() => { if (fill) fill.style.width = '70%'; if (status) status.textContent = 'Starting Wayland display server...'; }, 900);
        setTimeout(() => { if (fill) fill.style.width = '100%'; if (status) status.textContent = 'Starting Live desktop session...'; }, 1500);

        setTimeout(() => {
            this.container.style.display = 'none';
            checkEnvironmentState();
            document.getElementById('desktop-environment').classList.remove('hidden');
        }, 1900);
    }

    triggerSystemRebootBroadcast(reason = 'The system is going down for reboot NOW!') {
        this.clearTimers();
        this.container = document.getElementById('boot-screen');
        if (!this.container) return;

        this.container.innerHTML = '';
        this.container.style.display = 'flex';
        document.getElementById('desktop-environment')?.classList.add('hidden');
        document.getElementById('tty-screen')?.classList.add('hidden');
        if (window.wm && window.wm.windows) {
            window.wm.windows.forEach((_, id) => window.wm.closeWindow(id));
        }

        const now = new Date();
        const timeString = now.toTimeString().split(' ')[0];
        const dayStr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
        const monStr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()];
        const dateStr = `${dayStr} ${monStr} ${now.getDate()} ${timeString} ${now.getFullYear()}`;

        this.container.innerHTML = `
            <div class="bios-error-viewport" style="background: #000000; color: #ffffff; font-family: 'VT323', monospace; font-size: 24px; padding: 28px; line-height: 1.4; height: 100vh; box-sizing: border-box;">
                <div style="margin-bottom: 16px;">Broadcast message from root@krypton-station (pts/0) (${dateStr}):</div>
                <div style="margin-bottom: 24px; color: #ffff55;">${reason}</div>
                <div style="color: #888888;">[  OK  ] Stopped target Graphical Interface.</div>
                <div style="color: #888888;">[  OK  ] Unmounted all active partitions (/mnt/target).</div>
                <div style="color: #888888;">[  OK  ] Reached target System Reboot.</div>
                <div style="margin-top: 16px; color: #38bdf8;">Please remove the installation medium, then press ENTER:</div>
                <div style="margin-top: 10px;">Rebooting system...<span class="bios-underscore-cursor" id="bios-cursor"></span></div>
            </div>
        `;

        const onRebootKey = (e) => {
            if (e.key === 'Enter' || e.code === 'Enter') {
                document.removeEventListener('keydown', onRebootKey);
                this.start();
            }
        };
        document.addEventListener('keydown', onRebootKey);

        setTimeout(() => {
            document.removeEventListener('keydown', onRebootKey);
            this.start();
        }, 3600);
    }

    bootIntoInstalledMainOS() {
        this.phase = 'KERNEL_BOOT';
        this.clearTimers();
        sessionStorage.setItem('krypton_current_boot_medium', 'ssd');

        // Check if staged upgrade reboot is pending
        if (vfs.exists('/var/run/reboot-required') || vfs.exists('/boot/vmlinuz-6.10.0-krypton-generic')) {
            localStorage.setItem('krypton_upgraded_lts', 'true');
            localStorage.setItem('krypton_os_version', '1.0.0.0');
            vfs.remove('/var/run/reboot-required');
            vfs.writeFile('/proc/version', 'Linux version 6.10.0-krypton-generic (gcc 13.2.0) #1 SMP PREEMPT_DYNAMIC\n');
            vfs.writeFile('/etc/os-release', 'NAME="KryptonOS"\nVERSION="1.0.0.0"\nID=krypton\nID_LIKE=debian\nPRETTY_NAME="Krypton 1.0.0.0 LTS"\nVERSION_ID="1.0.0.0"\nVERSION_CODENAME=beryllium\nHOME_URL="https://krypton-os.org/"\nSUPPORT_URL="https://krypton-os.org/support"\nBUG_REPORT_URL="https://bugs.krypton-os.org/"\n');
            vfs.writeFile('/etc/issue', 'Krypton 1.0.0.0 LTS \\n \\l\n');
            vfs.writeFile('/etc/motd', '\n=======================================================\n  Welcome to Krypton 1.0.0.0 LTS (Linux 6.10.0-generic)\n  * Full Modern Desktop Suite Unlocked!\n  * Documentation:  https://krypton-os.org/docs\n  * Support:        https://krypton-os.org/support\n=======================================================\n');
            vfs.saveFileSystem();
        }

        // Silent Graphical Plymouth Boot Screen (No text log clutter)
        this.container.innerHTML = `
            <div class="krypton-boot-loader" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #000000;">
                <div class="krypton-loader-logo" style="text-align: center; margin-bottom: 28px;">
                    <div class="krypton-atom-icon" style="font-size: 64px; animation: atomPulse 2s infinite ease-in-out;">⚛️</div>
                    <div class="krypton-loader-title" style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 28px; letter-spacing: 4px; color: #ffffff; margin-top: 12px;">
                        KRYPTON<span style="color: #00e5ff;">OS</span>
                    </div>
                </div>
                <div class="krypton-progress-bar-container" style="width: 240px; height: 4px; background: rgba(255,255,255,0.12); border-radius: 4px; overflow: hidden;">
                    <div class="krypton-progress-bar-fill" id="krypton-boot-fill" style="height: 100%; width: 0%; background: #00e5ff; transition: width 1.2s ease;"></div>
                </div>
            </div>
        `;

        const fill = document.getElementById('krypton-boot-fill');

        setTimeout(() => { if (fill) fill.style.width = '45%'; }, 250);
        setTimeout(() => { if (fill) fill.style.width = '85%'; }, 800);
        setTimeout(() => { if (fill) fill.style.width = '100%'; }, 1300);

        setTimeout(() => {
            const reqPass = localStorage.getItem('krypton_require_password');
            if (reqPass === 'true') {
                this.showLoginScreen();
            } else {
                this.container.style.display = 'none';
                checkEnvironmentState();
                document.getElementById('desktop-environment').classList.remove('hidden');
            }
        }, 1700);
    }

    showLoginScreen() {
        this.phase = 'LOGIN_SCREEN';
        const primaryUser = localStorage.getItem('krypton_primary_user') || 'guest';
        const hostname = localStorage.getItem('krypton_hostname') || 'krypton-station';
        const googleAcc = localStorage.getItem('krypton_google_account');
        let avatarContent = primaryUser[0].toUpperCase();
        let displayName = primaryUser;
        if (googleAcc) {
            try {
                const g = JSON.parse(googleAcc);
                if (g.name) displayName = g.name;
                if (g.picture) avatarContent = `<img src="${g.picture}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            } catch (e) {}
        }

        this.container.style.display = 'block';
        this.container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: radial-gradient(circle at center, #0f172a 0%, #020617 100%); color: #ffffff; font-family: 'Outfit', sans-serif;">
                <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 36px 40px; width: 360px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.8); backdrop-filter: blur(24px);">
                    <div style="width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #0284c7, #06b6d4); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 28px; font-weight: 700; color: #fff; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.4);">
                        ${avatarContent}
                    </div>
                    <div style="font-size: 20px; font-weight: 700; color: #f8fafc; margin-bottom: 2px;">${displayName}</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-bottom: 20px;">${primaryUser}@${hostname}</div>

                    <form id="login-form" style="display: flex; flex-direction: column; gap: 12px;">
                        <input type="password" id="login-pass-input" placeholder="Enter password..." autofocus style="width: 100%; padding: 10px 14px; border: 1px solid #334155; border-radius: 8px; background: #1e293b; color: #fff; font-size: 14px; outline: none; box-sizing: border-box;">
                        <div id="login-err-msg" style="font-size: 12px; color: #ef4444; display: none;">Invalid password. Please try again.</div>
                        <button type="submit" id="login-submit-btn" style="padding: 10px; background: #0284c7; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);">
                            Log In ➔
                        </button>
                    </form>
                </div>
            </div>
        `;

        const form = document.getElementById('login-form');
        const passInput = document.getElementById('login-pass-input');
        const errMsg = document.getElementById('login-err-msg');

        if (form && passInput) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const entered = passInput.value;
                const realPass = localStorage.getItem('krypton_primary_password') || '';
                if (entered === realPass || !realPass) {
                    localStorage.setItem('krypton_sudo_timestamp', String(Date.now()));
                    this.container.style.display = 'none';
                    checkEnvironmentState();
                    document.getElementById('desktop-environment').classList.remove('hidden');
                } else {
                    if (errMsg) errMsg.style.display = 'block';
                    passInput.value = '';
                    passInput.focus();
                }
            });
        }
    }

    triggerSystemPoweroff() {
        this.clearTimers();
        const desktop = document.getElementById('desktop-environment');
        if (desktop) desktop.classList.add('hidden');
        const tty = document.getElementById('tty-screen');
        if (tty) tty.classList.add('hidden');

        this.container.style.display = 'block';
        this.container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #000000; color: #ffffff; font-family: 'Outfit', sans-serif;">
                <div id="poweroff-shutdown-text" style="font-size: 18px; color: #94a3b8; margin-bottom: 24px; transition: opacity 1s;">
                    System is powering off...
                </div>
                <div id="poweroff-btn-container" style="display: none;">
                    <button id="power-on-btn" style="display: inline-flex; align-items: center; gap: 10px; padding: 14px 28px; background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; border: 1px solid #38bdf8; border-radius: 30px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 0 24px rgba(56, 189, 248, 0.4); transition: transform 0.2s, box-shadow 0.2s;">
                        <span style="font-size: 20px;">⏻</span> Power On System
                    </button>
                </div>
            </div>
        `;

        setTimeout(() => {
            const shutdownText = document.getElementById('poweroff-shutdown-text');
            if (shutdownText) shutdownText.style.opacity = '0';
        }, 1200);

        setTimeout(() => {
            const shutdownText = document.getElementById('poweroff-shutdown-text');
            if (shutdownText) shutdownText.style.display = 'none';
            const btnContainer = document.getElementById('poweroff-btn-container');
            if (btnContainer) btnContainer.style.display = 'block';

            const powerBtn = document.getElementById('power-on-btn');
            if (powerBtn) {
                powerBtn.addEventListener('click', () => {
                    this.container.innerHTML = '';
                    this.start();
                });
            }
        }, 2500);
    }

    showPostInstallBootOrderNotice() {
        this.phase = 'BOOT_ORDER_NOTICE';
        this.clearTimers();

        const osRel = vfs.readFile('/etc/os-release') || '';
        const prettyMatch = osRel.match(/PRETTY_NAME="([^"]+)"/);
        const osTitle = prettyMatch ? prettyMatch[1] : 'Krypton OS 0.1 Alpha';
        const primaryUser = localStorage.getItem('krypton_primary_user') || 'guest';
        const hostname = localStorage.getItem('krypton_hostname') || 'krypton-station';

        this.container.innerHTML = `
            <div class="krypton-boot-loader">
                <div class="krypton-loader-logo">
                    <div class="krypton-atom-icon">⚛️</div>
                    <div class="krypton-loader-title">KRYPTON<span style="color: #00e5ff;">OS</span></div>
                    <div class="krypton-loader-sub">${osTitle} (Installed on Samsung SSD 980 PRO)</div>
                </div>

                <div class="krypton-progress-bar-container" style="max-width: 480px;">
                    <div class="krypton-progress-bar-fill" style="width: 100%; background: linear-gradient(90deg, #f59e0b, #eab308);"></div>
                </div>

                <div style="margin-top: 24px; background: rgba(15, 23, 42, 0.96); border: 1px solid #f59e0b; border-radius: 12px; padding: 22px 28px; max-width: 620px; text-align: center; box-shadow: 0 16px 36px rgba(0,0,0,0.6); backdrop-filter: blur(20px);">
                    <div style="font-size: 18px; font-weight: 700; color: #fbbf24; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span>⚠️</span> Reboot to change boot order to continue
                    </div>
                    <div style="font-size: 13px; color: #e2e8f0; line-height: 1.6; margin-bottom: 18px;">
                        KryptonOS is installed on <strong>Samsung SSD 980 PRO NVMe</strong> for user <strong>${primaryUser}@${hostname}</strong>.<br>
                        Because the <strong>Live USB</strong> is currently configured as 1st boot device, please enter BIOS Setup to set <strong>Samsung SSD 980 PRO</strong> as the 1st Boot Priority.
                    </div>
                    <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
                        <button id="postinst-btn-bios" style="padding: 9px 18px; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                            ⚙️ Enter BIOS Setup (ESC)
                        </button>
                        <button id="postinst-btn-boot-ssd" style="padding: 9px 18px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                            💽 Boot from NVMe SSD Directly
                        </button>
                        <button id="postinst-btn-live-session" style="padding: 9px 16px; background: rgba(255,255,255,0.08); color: #cbd5e0; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; cursor: pointer; font-size: 13px;">
                            💿 Continue in Live USB Session
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('postinst-btn-bios')?.addEventListener('click', () => {
            this.activeTab = 3; // Jump directly to Boot tab in BIOS Setup
            this.openAptioBIOSSetup();
        });

        document.getElementById('postinst-btn-boot-ssd')?.addEventListener('click', () => {
            this.bootPriority = [
                'NVMe: Samsung SSD 980 PRO 1TB',
                'Disabled'
            ];
            localStorage.setItem('krypton_boot_priority', JSON.stringify(this.bootPriority));
            this.bootIntoInstalledMainOS();
        });

        document.getElementById('postinst-btn-live-session')?.addEventListener('click', () => {
            this.bootIntoLiveUSB();
        });

        // Key listeners for ESC
        this.keyListener = (e) => {
            if (this.phase !== 'BOOT_ORDER_NOTICE') return;
            if (e.key === 'Escape' || e.code === 'Escape') {
                e.preventDefault();
                this.activeTab = 3;
                this.openAptioBIOSSetup();
            }
        };
        document.addEventListener('keydown', this.keyListener);
    }

    /* --------------------------------------------------------------------------
       6. GNU GRUB RESCUE SHELL & KERNEL PANIC
       -------------------------------------------------------------------------- */
    showGrubRescueOrKernelPanic(type) {
        this.phase = 'GRUB_RESCUE';
        this.clearTimers();

        if (type === 'GRUB_RESCUE') {
            this.container.innerHTML = `
                <div class="bios-error-viewport" style="padding: 24px; color: #ff5555; font-family: monospace; font-size: 16px; line-height: 1.4;">
                    <div>error: file '/boot/grub/i386-pc/normal.mod' not found.</div>
                    <div style="color: #ffffff;">Entering rescue mode...</div>
                    <div style="color: #00e5ff; margin-top: 12px;">grub rescue&gt; <span id="grub-cmd"></span><span class="bios-underscore-cursor" id="bios-cursor"></span></div>
                    <div id="grub-history" style="margin-top: 8px; color: #ccc;"></div>
                    <div style="color: #777; margin-top: 24px; font-size: 13px;">[ Tip: Type 'ls', 'help', or 'reboot'. Press DEL / F2 on reboot to enter BIOS Setup and switch boot priority to Live USB to reinstall/repair. ]</div>
                </div>
            `;

            let grubInput = '';
            const grubCmdEl = document.getElementById('grub-cmd');
            const grubHistory = document.getElementById('grub-history');

            this.keyListener = (e) => {
                if (this.phase !== 'GRUB_RESCUE') return;
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
                        res.textContent = '(hd0) (hd0,gpt1) (hd0,gpt2) (hd1) (hd1,msdos1)';
                        res.style.color = '#fff';
                        grubHistory.appendChild(res);
                    } else if (cmd === 'reboot' || cmd === 'exit') {
                        document.removeEventListener('keydown', this.keyListener);
                        this.start();
                    } else if (cmd === 'help') {
                        const res = document.createElement('div');
                        res.innerHTML = `Available commands: ls, set, insmod, reboot<br>System files on NVMe SSD (/dev/nvme0n1p2) are missing or damaged.<br>Reboot (type 'reboot') and press ESC to boot Live USB and repair/reinstall.`;
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
                    <div style="color: #fff; font-weight: bold; margin-bottom: 8px;">[    0.351290] Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(259,2)</div>
                    <div>[    0.351300] CPU: 0 PID: 1 Comm: swapper/0 Not tainted 6.10.0-krypton-generic #1</div>
                    <div>[    0.351310] Hardware name: ASUSTeK ROG STRIX Z490-E GAMING</div>
                    <div>[    0.351320] Call Trace:</div>
                    <div>[    0.351330]  dump_stack_lvl+0x48/0x70</div>
                    <div>[    0.351340]  panic+0x140/0x310</div>
                    <div>[    0.351350]  mount_block_root+0x210/0x240</div>
                    <div>[    0.351360]  mount_root+0x60/0x80</div>
                    <div>[    0.351370]  prepare_namespace+0x13c/0x170</div>
                    <div>[    0.351380]  kernel_init+0x18/0x130</div>
                    <div style="color: #fff;">[    0.351390] ---[ end Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(259,2) ]---</div>
                    <div style="color: #00ffaa; margin-top: 20px;">Press [ESC] to enter BIOS Setup, or [ENTER / R] to Reboot.</div>
                </div>
            `;

            this.keyListener = (e) => {
                if (this.phase !== 'GRUB_RESCUE') return;
                const isRebootKey = (e.ctrlKey && (e.key === 'Delete' || e.code === 'Delete'));
                if (isRebootKey) {
                    e.preventDefault();
                    document.removeEventListener('keydown', this.keyListener);
                    this.start();
                    return;
                }

                const isBios = (e.key === 'Escape' || e.code === 'Escape');
                if (isBios) {
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
window.systemBoot = boot;

// Global Hardware Reset Key Listener (Ctrl+Alt+Del or Ctrl+Shift+Del)
window.addEventListener('keydown', (e) => {
    const isReboot = e.ctrlKey && (e.altKey || e.shiftKey) && (e.key === 'Delete' || e.code === 'Delete');
    if (isReboot) {
        e.preventDefault();
        boot.start();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    boot.start();
});
