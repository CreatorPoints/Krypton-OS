/* ==========================================================================
   Krypton-OS - Phoenix-Award CMOS Setup Utility Engine
   ========================================================================== */

import { sound } from './sound.js';

export class BIOSSetupUtility {
    constructor(onExitAndBootCallback) {
        this.container = document.getElementById('boot-screen');
        this.onExitAndBoot = onExitAndBootCallback;

        this.currentView = 'main'; // 'main', 'submenu', 'dialog'
        this.selectedRow = 0; // Index in active menu
        this.activeSubmenuKey = null;
        this.dialogActive = false;
        this.bootDevice = 'USB-HDD: KryptonOS Live USB';

        // Main Menu Layout (Left Column 0-5, Right Column 6-11)
        this.mainMenuItems = [
            { id: 'standard', title: 'Standard CMOS Features', help: 'Time, Date, Hard Disk Type, Floppy Drive Type' },
            { id: 'advanced_bios', title: 'Advanced BIOS Features', help: 'Boot Device Priority, Quick Boot, Virus Warning' },
            { id: 'advanced_chipset', title: 'Advanced Chipset Features', help: 'Memory Timing, AGP Aperture Size, DRAM Frequency' },
            { id: 'peripherals', title: 'Integrated Peripherals', help: 'USB Controller, Onboard Audio, SATA Mode, LAN' },
            { id: 'power', title: 'Power Management Setup', help: 'ACPI Suspend Type, Power Button Behavior' },
            { id: 'health', title: 'PC Health Status', help: 'CPU Temperature, Fan Speeds, Voltages' },

            { id: 'failsafe', title: 'Load Fail-Safe Defaults', help: 'Load System Default Settings for Minimum Stability' },
            { id: 'optimized', title: 'Load Optimized Defaults', help: 'Load System Default Settings for Best Performance' },
            { id: 'supervisor_pass', title: 'Set Supervisor Password', help: 'Install or Change Supervisor Password' },
            { id: 'user_pass', title: 'Set User Password', help: 'Install or Change User Password' },
            { id: 'save_exit', title: 'Save & Exit Setup', help: 'Save Data to CMOS and Exit BIOS Setup' },
            { id: 'exit_nosave', title: 'Exit Without Saving', help: 'Abandon All Changes and Exit BIOS Setup' }
        ];

        this.submenus = {
            standard: {
                title: 'Standard CMOS Features',
                rows: [
                    { label: 'Date (mm:dd:yy)', value: 'Fri, Aug 14 2026' },
                    { label: 'Time (hh:mm:ss)', value: '21:09:40' },
                    { label: 'Primary Master', value: '[ None ]' },
                    { label: 'Primary Slave', value: '[ None ]' },
                    { label: 'Secondary Master', value: '[ None ]' },
                    { label: 'Secondary Slave', value: '[ None ]' },
                    { label: 'Drive A', value: '[ 1.44M, 3.5 in. ]' },
                    { label: 'Base Memory', value: '640K' },
                    { label: 'Extended Memory', value: '16383M' },
                    { label: 'Total Memory', value: '16384M' }
                ]
            },
            advanced_bios: {
                title: 'Advanced BIOS Features',
                rows: [
                    { label: 'First Boot Device', value: () => `[ ${this.bootDevice} ]`, toggleable: true },
                    { label: 'Second Boot Device', value: '[ Hard Disk ]' },
                    { label: 'Third Boot Device', value: '[ Disabled ]' },
                    { label: 'Boot Other Device', value: '[ Enabled ]' },
                    { label: 'Quick Power On Self Test', value: '[ Enabled ]' },
                    { label: 'Boot Up NumLock Status', value: '[ On ]' },
                    { label: 'APIC Mode', value: '[ Enabled ]' }
                ]
            },
            health: {
                title: 'PC Health Status',
                rows: [
                    { label: 'VCORE Voltage', value: '1.34V' },
                    { label: '+3.3V Voltage', value: '3.31V' },
                    { label: '+5.0V Voltage', value: '5.04V' },
                    { label: '+12.0V Voltage', value: '12.08V' },
                    { label: 'CPU Temperature', value: '42°C / 107°F' },
                    { label: 'System Temperature', value: '31°C / 87°F' },
                    { label: 'CPU Fan Speed', value: '2450 RPM' },
                    { label: 'System Fan Speed', value: '0 RPM' },
                    { label: 'Chassis Intrusion', value: '[ Reset ]' }
                ]
            }
        };

        this.keyListener = null;
    }

    render() {
        if (this.currentView === 'main') {
            this.renderMainMenu();
        } else if (this.currentView === 'submenu') {
            this.renderSubmenu();
        }
    }

    renderMainMenu() {
        const leftItems = this.mainMenuItems.slice(0, 6);
        const rightItems = this.mainMenuItems.slice(6, 12);
        const currentItem = this.mainMenuItems[this.selectedRow];

        this.container.innerHTML = `
            <div class="bios-setup-screen">
                <div>
                    <div class="bios-header-title">Phoenix - AwardBIOS CMOS Setup Utility</div>
                    <div class="bios-header-sub">Krypton Motherboard KM-9000 (C) 2026 All Rights Reserved</div>
                </div>

                <div class="bios-main-grid">
                    <div class="bios-menu-column">
                        ${leftItems.map((item, idx) => `
                            <div class="bios-menu-item ${this.selectedRow === idx ? 'selected' : ''}">
                                ${item.title}
                            </div>
                        `).join('')}
                    </div>
                    <div class="bios-menu-column">
                        ${rightItems.map((item, idx) => `
                            <div class="bios-menu-item ${this.selectedRow === (idx + 6) ? 'selected' : ''}">
                                ${item.title}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="bios-help-box">
                    Item Help: ${currentItem ? currentItem.help : ''}
                </div>

                <div class="bios-footer-bar">
                    <span>Esc : Quit</span>
                    <span>↑ ↓ ← → : Select Item</span>
                    <span>F10 : Save & Exit Setup</span>
                </div>
            </div>
        `;

        this.attachControls();
    }

    renderSubmenu() {
        const sub = this.submenus[this.activeSubmenuKey] || { title: 'Submenu', rows: [] };
        const currentSelected = sub.rows[this.selectedRow];

        this.container.innerHTML = `
            <div class="bios-setup-screen">
                <div>
                    <div class="bios-header-title">Phoenix - AwardBIOS CMOS Setup Utility</div>
                    <div class="bios-header-sub">${sub.title}</div>
                </div>

                <div class="bios-submenu-container">
                    ${sub.rows.map((row, idx) => {
                        const valStr = typeof row.value === 'function' ? row.value() : row.value;
                        return `
                            <div class="bios-table-row ${this.selectedRow === idx ? 'selected' : ''}">
                                <span class="bios-row-label">${row.label}</span>
                                <span class="bios-row-value">${valStr}</span>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="bios-help-box">
                    ${currentSelected && currentSelected.toggleable ? 'Press Enter or PageUp/PageDown to cycle boot devices.' : 'Press ESC to return to Main Menu.'}
                </div>

                <div class="bios-footer-bar">
                    <span>Esc : Back</span>
                    <span>↑ ↓ : Move</span>
                    <span>Enter / PgUp / PgDn : Modify</span>
                    <span>F10 : Save & Exit</span>
                </div>
            </div>
        `;

        this.attachControls();
    }

    attachControls() {
        if (this.keyListener) document.removeEventListener('keydown', this.keyListener);

        this.keyListener = (e) => {
            sound.playClick();
            if (this.dialogActive) return;

            if (e.key === 'F10') {
                e.preventDefault();
                this.showSaveDialog();
                return;
            }

            if (this.currentView === 'main') {
                if (e.key === 'ArrowUp') {
                    this.selectedRow = (this.selectedRow - 1 + 12) % 12;
                    this.render();
                } else if (e.key === 'ArrowDown') {
                    this.selectedRow = (this.selectedRow + 1) % 12;
                    this.render();
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    this.selectedRow = (this.selectedRow + 6) % 12;
                    this.render();
                } else if (e.key === 'Enter') {
                    const item = this.mainMenuItems[this.selectedRow];
                    if (item.id === 'save_exit') {
                        this.showSaveDialog();
                    } else if (item.id === 'exit_nosave') {
                        if (this.onExitAndBoot) this.onExitAndBoot(false);
                    } else if (this.submenus[item.id]) {
                        this.currentView = 'submenu';
                        this.activeSubmenuKey = item.id;
                        this.selectedRow = 0;
                        this.render();
                    }
                } else if (e.key === 'Escape') {
                    this.showSaveDialog();
                }
            } else if (this.currentView === 'submenu') {
                const sub = this.submenus[this.activeSubmenuKey];
                if (e.key === 'ArrowUp') {
                    this.selectedRow = (this.selectedRow - 1 + sub.rows.length) % sub.rows.length;
                    this.render();
                } else if (e.key === 'ArrowDown') {
                    this.selectedRow = (this.selectedRow + 1) % sub.rows.length;
                    this.render();
                } else if (e.key === 'Enter' || e.key === 'PageUp' || e.key === 'PageDown') {
                    const row = sub.rows[this.selectedRow];
                    if (row && row.toggleable) {
                        this.bootDevice = this.bootDevice.includes('USB') ? 'Hard Disk: Disabled' : 'USB-HDD: KryptonOS Live USB';
                        this.render();
                    }
                } else if (e.key === 'Escape') {
                    this.currentView = 'main';
                    this.selectedRow = 0;
                    this.render();
                }
            }
        };

        document.addEventListener('keydown', this.keyListener);
    }

    showSaveDialog() {
        this.dialogActive = true;
        const dialog = document.createElement('div');
        dialog.className = 'bios-dialog-overlay';
        dialog.innerHTML = `
            <div class="bios-dialog-title">SAVE to CMOS and EXIT (Y/N)?</div>
            <div class="bios-dialog-prompt">Press Y to Confirm, N to Cancel</div>
        `;

        this.container.appendChild(dialog);

        const handleDialogKey = (e) => {
            if (e.key.toLowerCase() === 'y' || e.key === 'Enter') {
                document.removeEventListener('keydown', handleDialogKey);
                dialog.remove();
                this.dialogActive = false;
                if (this.onExitAndBoot) this.onExitAndBoot(true, this.bootDevice);
            } else if (e.key.toLowerCase() === 'n' || e.key === 'Escape') {
                document.removeEventListener('keydown', handleDialogKey);
                dialog.remove();
                this.dialogActive = false;
            }
        };

        document.addEventListener('keydown', handleDialogKey);
    }
}
