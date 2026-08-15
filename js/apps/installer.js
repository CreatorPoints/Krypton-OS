/* ==========================================================================
   KryptonOS - Calamares / Ubiquity Style Installer Wizard Engine
   ========================================================================== */

import { wm } from '../wm.js';
import { sound } from '../sound.js';
import { story } from '../story.js';
import { vfs } from '../fs.js';

export function openInstallerWizard() {
    if (wm.windows.has('installer')) {
        wm.focusWindow('installer');
        return;
    }

    let currentStep = 0;
    let selectedLang = 'English (US)';
    let selectedTz = 'UTC+05:30 - Kolkata (India)';
    let connectedWifi = null;
    let userName = 'Krypton User';
    let userHostname = 'krypton-station';
    let userLogin = 'guest';
    let userPassword = '';
    let confirmPassword = '';
    let autoLogin = true;
    let installInProgress = false;

    const steps = [
        { id: 'lang', name: 'Language' },
        { id: 'timezone', name: 'Timezone' },
        { id: 'network', name: 'Network' },
        { id: 'user', name: 'User' },
        { id: 'disk', name: 'Destination Disk' },
        { id: 'install', name: 'Install' }
    ];

    const content = document.createElement('div');
    content.className = 'calamares-installer-app';

    const render = () => {
        content.innerHTML = `
            <div class="installer-sidebar">
                ${steps.map((step, idx) => `
                    <div class="sidebar-step ${currentStep === idx ? 'active' : ''} ${currentStep > idx ? 'completed' : ''}">
                        <div class="step-num">${currentStep > idx ? '✓' : idx + 1}</div>
                        <div>${step.name}</div>
                    </div>
                `).join('')}
            </div>

            <div class="installer-content-area">
                <div id="step-body-container" style="flex: 1;">
                    ${renderStepBody(currentStep)}
                </div>

                ${currentStep < 5 ? `
                    <div class="wizard-footer">
                        <button class="wizard-btn btn-prev" id="wiz-prev-btn" ${currentStep === 0 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>Back</button>
                        ${currentStep === 4 ? `
                            <button class="wizard-btn btn-install" id="wiz-install-btn">Install Now ▶</button>
                        ` : `
                            <button class="wizard-btn btn-next" id="wiz-next-btn">Next ➔</button>
                        `}
                    </div>
                ` : ''}
            </div>
        `;

        attachStepListeners();
    };

    const renderStepBody = (stepIdx) => {
        if (stepIdx === 0) {
            const languages = ['English (US)', 'Español (España)', 'Deutsch (Deutschland)', 'Français (France)', '日本語 (Japanese)', 'Italiano (Italia)', 'Português (Brasil)'];
            return `
                <div class="step-title">Welcome to KryptonOS 1.0</div>
                <div class="step-subtitle">Select your preferred system language for installation.</div>
                <div class="lang-list-container">
                    ${languages.map(lang => `
                        <div class="lang-item ${selectedLang === lang ? 'selected' : ''}" data-lang="${lang}">
                            <span>${lang}</span>
                            ${selectedLang === lang ? '<span>✓</span>' : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (stepIdx === 1) {
            return `
                <div class="step-title">Date & Time Location</div>
                <div class="step-subtitle">Select your regional timezone to calibrate system clock.</div>
                <div class="tz-selector-card">
                    <label style="font-size: 13px; font-weight: 600;">Region / Timezone:</label>
                    <select class="tz-select" id="tz-dropdown">
                        <option value="UTC+05:30 - Kolkata (India)" ${selectedTz.includes('Kolkata') ? 'selected' : ''}>UTC+05:30 - Asia / Kolkata</option>
                        <option value="UTC+00:00 - London (GMT)" ${selectedTz.includes('London') ? 'selected' : ''}>UTC+00:00 - Europe / London</option>
                        <option value="UTC-05:00 - New York (EST)" ${selectedTz.includes('New York') ? 'selected' : ''}>UTC-05:00 - America / New York</option>
                        <option value="UTC+09:00 - Tokyo (JST)" ${selectedTz.includes('Tokyo') ? 'selected' : ''}>UTC+09:00 - Asia / Tokyo</option>
                        <option value="UTC+01:00 - Paris (CET)" ${selectedTz.includes('Paris') ? 'selected' : ''}>UTC+01:00 - Europe / Paris</option>
                    </select>
                    <div class="clock-preview" id="tz-clock-preview">00:00:00 UTC</div>
                </div>
            `;
        } else if (stepIdx === 2) {
            const wifis = [
                { ssid: 'pass-1234ABC', signal: '98%', locked: true },
                { ssid: 'Office_Gigabit_5G', signal: '85%', locked: true },
                { ssid: 'Lab_Internal_Network', signal: '60%', locked: true },
                { ssid: 'Guest_WiFi_Free', signal: '45%', locked: false },
                { ssid: 'Station_5GHz', signal: '80%', locked: true }
            ];

            return `
                <div class="step-title">Connect to Network</div>
                <div class="step-subtitle">Connect to a wireless or wired network to fetch system packages.</div>
                <div class="wifi-network-list">
                    ${wifis.map(w => {
                        const isConn = connectedWifi === w.ssid;
                        return `
                            <div class="wifi-card ${isConn ? 'connected' : ''}" data-ssid="${w.ssid}" data-locked="${w.locked}">
                                <div>
                                    <div class="wifi-name">📶 ${w.ssid}</div>
                                    <div style="font-size: 11px; color: #888;">Signal: ${w.signal} • ${w.locked ? '🔒 Encrypted WPA2-PSK' : '🔓 Open Network'}</div>
                                </div>
                                <div class="wifi-status-badge">${isConn ? '✓ Connected' : (w.locked ? 'Connect' : 'Join')}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else if (stepIdx === 3) {
            return `
                <div class="step-title">Who are you?</div>
                <div class="step-subtitle">Configure your primary user identity and workstation hostname.</div>
                <div class="user-form-card">
                    <div class="user-form-row">
                        <label class="user-form-label">Your name:</label>
                        <input type="text" class="user-form-input" id="wiz-realname-input" value="${userName}" placeholder="e.g. John Doe" autocomplete="off" spellcheck="false">
                    </div>
                    <div class="user-form-row">
                        <label class="user-form-label">Your computer's name (hostname):</label>
                        <input type="text" class="user-form-input" id="wiz-hostname-input" value="${userHostname}" placeholder="e.g. krypton-station" autocomplete="off" spellcheck="false">
                        <span class="user-form-hint">The name it uses when identifying itself on local networks and terminal prompts.</span>
                    </div>
                    <div class="user-form-row">
                        <label class="user-form-label">Pick a username:</label>
                        <input type="text" class="user-form-input" id="wiz-username-input" value="${userLogin}" placeholder="e.g. guest" autocomplete="off" spellcheck="false">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="user-form-row">
                            <label class="user-form-label">Choose a password <span style="font-weight: normal; color: #888;">(optional)</span>:</label>
                            <input type="password" class="user-form-input" id="wiz-password-input" value="${userPassword}" placeholder="Password..." autocomplete="off">
                        </div>
                        <div class="user-form-row">
                            <label class="user-form-label">Confirm password <span style="font-weight: normal; color: #888;">(optional)</span>:</label>
                            <input type="password" class="user-form-input" id="wiz-confirm-pass-input" value="${confirmPassword}" placeholder="Confirm password..." autocomplete="off">
                        </div>
                    </div>
                    <div style="margin-top: 6px;">
                        <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #e0e0e0; cursor: pointer;">
                            <input type="checkbox" id="wiz-autologin-toggle" ${autoLogin ? 'checked' : ''}>
                            Log in automatically without asking for password
                        </label>
                    </div>
                </div>
            `;
        } else if (stepIdx === 4) {
            return `
                <div class="step-title">Select Destination Storage Disk</div>
                <div class="step-subtitle">Choose the target hard drive where KryptonOS will be installed.</div>

                <div class="drive-card selected">
                    <div class="drive-icon">💽</div>
                    <div class="drive-info">
                        <div class="drive-name">[ Selected Target ] NVMe SSD: Samsung SSD 980 PRO 1TB (/dev/nvme0n1)</div>
                        <div class="drive-size">1000.2 GB (931.5 GiB) • Partition Table: GPT (ext4 / EFI / Swap)</div>
                    </div>
                </div>

                <div class="drive-card disabled">
                    <div class="drive-icon">💾</div>
                    <div class="drive-info">
                        <div class="drive-name">[ Read-Only / Live Media ] USB Flash Drive: SanDisk Ultra 32GB (/dev/sda)</div>
                        <div class="drive-size">31.2 GB • Live ISO Installer Medium</div>
                    </div>
                </div>

                <div style="background: rgba(239,68,68,0.15); border: 1px solid #ef4444; border-radius: 6px; padding: 12px; font-size: 12px; color: #fca5a5;">
                    ⚠️ <strong>Warning:</strong> Installation will partition and format target drive <code>/dev/nvme0n1</code>.
                </div>
            `;
        } else if (stepIdx === 5) {
            return `
                <div class="step-title">Installing KryptonOS 1.0 LTS</div>
                <div class="step-subtitle" id="installer-status-label">Initializing package download and disk installation...</div>

                <div class="installer-progress-container">
                    <div class="progress-track">
                        <div class="progress-fill" id="inst-progress-fill"></div>
                    </div>

                    <div class="installer-metrics-grid">
                        <div class="metric-item">
                            <span class="metric-label">Progress</span>
                            <span class="metric-value highlight" id="inst-percent-text">0.0% Completed</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Download Speed</span>
                            <span class="metric-value speed-badge" id="inst-speed-text">⚡ 0.0 MB/s</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Data Transferred</span>
                            <span class="metric-value" id="inst-downloaded-text">0 MB / 3,840 MB</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Elapsed Time</span>
                            <span class="metric-value" id="inst-timer-text">0.0s / 45.0s max</span>
                        </div>
                    </div>

                    <div class="installer-terminal-logs" id="inst-term-logs">
                        <div class="log-line">[  0.00s ] Starting KryptonOS Ubiquity Live Installer...</div>
                    </div>
                </div>
            `;
        }
    };

    const attachStepListeners = () => {
        // Step 0: Language
        content.querySelectorAll('.lang-item').forEach(item => {
            item.addEventListener('click', () => {
                selectedLang = item.getAttribute('data-lang');
                render();
            });
        });

        // Step 1: Timezone
        const tzSelect = content.querySelector('#tz-dropdown');
        const clockPreview = content.querySelector('#tz-clock-preview');
        if (tzSelect && clockPreview) {
            tzSelect.addEventListener('change', (e) => {
                selectedTz = e.target.value;
            });

            const updateClock = () => {
                const now = new Date();
                if (clockPreview) {
                    clockPreview.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ` (${selectedTz.split(' - ')[0]})`;
                }
            };
            updateClock();
        }

        // Step 2: Wi-Fi
        content.querySelectorAll('.wifi-card').forEach(card => {
            card.addEventListener('click', () => {
                const ssid = card.getAttribute('data-ssid');
                const locked = card.getAttribute('data-locked') === 'true';

                if (ssid === 'pass-1234ABC') {
                    showWifiPasswordWindow(ssid);
                } else if (!locked) {
                    connectedWifi = ssid;
                    showOSNoticeWindow('Wi-Fi Connected', `Connected to open network "${ssid}".`);
                    render();
                } else {
                    showOSNoticeWindow('Security Error', `Incorrect network security settings for "${ssid}".`);
                }
            });
        });

        // Step 3: User Inputs
        const realnameInput = content.querySelector('#wiz-realname-input');
        const hostnameInput = content.querySelector('#wiz-hostname-input');
        const usernameInput = content.querySelector('#wiz-username-input');
        const passwordInput = content.querySelector('#wiz-password-input');
        const confirmPassInput = content.querySelector('#wiz-confirm-pass-input');
        const autologinToggle = content.querySelector('#wiz-autologin-toggle');

        if (realnameInput) {
            realnameInput.addEventListener('input', (e) => {
                userName = e.target.value;
                // Auto-suggest username if default
                if (userLogin === 'guest' || userLogin === '') {
                    const clean = userName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (clean && usernameInput) {
                        userLogin = clean;
                        usernameInput.value = userLogin;
                    }
                }
            });
        }

        if (hostnameInput) {
            hostnameInput.addEventListener('input', (e) => {
                userHostname = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '');
                e.target.value = userHostname;
            });
        }

        if (usernameInput) {
            usernameInput.addEventListener('input', (e) => {
                userLogin = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                e.target.value = userLogin;
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                userPassword = e.target.value;
            });
        }

        if (confirmPassInput) {
            confirmPassInput.addEventListener('input', (e) => {
                confirmPassword = e.target.value;
            });
        }

        if (autologinToggle) {
            autologinToggle.addEventListener('change', (e) => {
                autoLogin = e.target.checked;
            });
        }

        // Navigation Buttons
        const prevBtn = content.querySelector('#wiz-prev-btn');
        const nextBtn = content.querySelector('#wiz-next-btn');
        const installBtn = content.querySelector('#wiz-install-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentStep > 0) {
                    currentStep--;
                    render();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                // Validation for User step
                if (currentStep === 3) {
                    if (!userLogin.trim()) {
                        showOSNoticeWindow('Configuration Required', 'Please pick a username for your account.');
                        return;
                    }
                    if (!userHostname.trim()) {
                        showOSNoticeWindow('Configuration Required', 'Please provide a computer name (hostname).');
                        return;
                    }
                    if (userPassword && userPassword !== confirmPassword) {
                        showOSNoticeWindow('Password Mismatch', 'The passwords you entered do not match. Please verify them.');
                        return;
                    }
                }

                if (currentStep < 4) {
                    currentStep++;
                    render();
                }
            });
        }

        if (installBtn) {
            installBtn.addEventListener('click', () => {
                showDiskConfirmWindow(() => {
                    currentStep = 5;
                    render();
                    startDynamicOSInstallation();
                });
            });
        }
    };

    const showWifiPasswordWindow = (ssid) => {
        const dialogContent = document.createElement('div');
        dialogContent.style.cssText = 'display: flex; flex-direction: column; gap: 12px; color: #000; font-family: "Fira Code", monospace;';

        dialogContent.innerHTML = `
            <div style="font-size: 13px; font-weight: bold; color: #000;">
                Enter WPA2 Security Key for "${ssid}":
            </div>
            <input type="password" id="wifi-pass-input" placeholder="Security key..." style="width: 100%; padding: 8px 10px; border: 2px inset #808080; background: #fff; font-family: inherit; font-size: 13px;">
            <div id="wifi-err-msg" style="font-size: 12px; color: #cc0000; display: none;">
                ❌ Authentication Error: Invalid Wi-Fi Password.
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px;">
                <button id="wifi-btn-cancel" style="padding: 6px 14px; background: #c0c0c0; border-top: 2px solid #fff; border-left: 2px solid #fff; border-right: 2px solid #000; border-bottom: 2px solid #000; cursor: pointer; font-size: 12px;">Cancel</button>
                <button id="wifi-btn-connect" style="padding: 6px 14px; background: #c0c0c0; border-top: 2px solid #fff; border-left: 2px solid #fff; border-right: 2px solid #000; border-bottom: 2px solid #000; font-weight: bold; cursor: pointer; font-size: 12px;">Connect</button>
            </div>
        `;

        const passInput = dialogContent.querySelector('#wifi-pass-input');
        const errMsg = dialogContent.querySelector('#wifi-err-msg');
        const btnConnect = dialogContent.querySelector('#wifi-btn-connect');
        const btnCancel = dialogContent.querySelector('#wifi-btn-cancel');

        wm.createWindow({
            id: 'wifi-pass-dialog',
            title: `Wi-Fi Authentication - ${ssid}`,
            icon: '🔒',
            width: 380,
            height: 220,
            content: dialogContent
        });

        const tryConnect = () => {
            const pass = passInput.value.trim();
            if (pass === 'pass-1234ABC') {
                connectedWifi = ssid;
                wm.closeWindow('wifi-pass-dialog');
                showOSNoticeWindow('Wi-Fi Connected', `✓ Connected to "${ssid}" successfully!`);
                render();
            } else {
                errMsg.style.display = 'block';
            }
        };

        btnConnect.addEventListener('click', tryConnect);
        passInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') tryConnect();
        });
        btnCancel.addEventListener('click', () => wm.closeWindow('wifi-pass-dialog'));
    };

    const showDiskConfirmWindow = (onConfirm) => {
        const dialogContent = document.createElement('div');
        dialogContent.style.cssText = 'display: flex; flex-direction: column; gap: 12px; color: #000; font-family: "Fira Code", monospace;';

        dialogContent.innerHTML = `
            <div style="font-weight: bold; font-size: 14px; color: #cc0000; border-bottom: 1px solid #808080; padding-bottom: 6px;">
                ⚠️ Confirm Disk Formatting & Installation
            </div>
            <div style="font-size: 13px; color: #222;">
                Are you sure you want to write changes to <strong>/dev/nvme0n1</strong>?<br>
                Target drive: <em>Samsung SSD 980 PRO 1TB</em>.<br>
                User: <strong>${userLogin}</strong> (${userName}) • Hostname: <strong>${userHostname}</strong>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
                <button id="disk-btn-cancel" style="padding: 6px 14px; background: #c0c0c0; border-top: 2px solid #fff; border-left: 2px solid #fff; border-right: 2px solid #000; border-bottom: 2px solid #000; cursor: pointer; font-size: 12px;">Cancel</button>
                <button id="disk-btn-confirm" style="padding: 6px 14px; background: #c0c0c0; border-top: 2px solid #fff; border-left: 2px solid #fff; border-right: 2px solid #000; border-bottom: 2px solid #000; font-weight: bold; color: #cc0000; cursor: pointer; font-size: 12px;">▶ Erase & Install Now</button>
            </div>
        `;

        wm.createWindow({
            id: 'disk-confirm-dialog',
            title: 'Confirm Installation Target',
            icon: '⚠️',
            width: 440,
            height: 250,
            content: dialogContent
        });

        dialogContent.querySelector('#disk-btn-confirm').addEventListener('click', () => {
            wm.closeWindow('disk-confirm-dialog');
            onConfirm();
        });
        dialogContent.querySelector('#disk-btn-cancel').addEventListener('click', () => {
            wm.closeWindow('disk-confirm-dialog');
        });
    };

    const showOSNoticeWindow = (title, message) => {
        const dialogContent = document.createElement('div');
        dialogContent.style.cssText = 'display: flex; flex-direction: column; gap: 14px; color: #000; font-family: "Fira Code", monospace;';

        dialogContent.innerHTML = `
            <div style="font-size: 13px; color: #111;">${message}</div>
            <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
                <button id="notice-btn-ok" style="padding: 6px 16px; background: #c0c0c0; border-top: 2px solid #fff; border-left: 2px solid #fff; border-right: 2px solid #000; border-bottom: 2px solid #000; font-weight: bold; cursor: pointer; font-size: 12px;">OK</button>
            </div>
        `;

        const winId = `notice-${Date.now()}`;
        wm.createWindow({
            id: winId,
            title: title,
            icon: 'ℹ️',
            width: 360,
            height: 180,
            content: dialogContent
        });

        dialogContent.querySelector('#notice-btn-ok').addEventListener('click', () => wm.closeWindow(winId));
    };

    let installTimerInterval = null;

    /* Dynamic, Fluctuating OS Download & Installation Engine (Strictly <= 45s) */
    const startDynamicOSInstallation = () => {
        if (installInProgress) return;
        installInProgress = true;

        const maxAllowedDuration = 45.0; // Hard ceiling: NEVER exceeds 45s
        const targetDuration = Math.min(41.0, 22.0 + Math.random() * 16.0);
        const totalBytesMB = 3840;

        let elapsed = 0;
        let progress = 0;
        let currentSpeedMBs = 48.0;
        let nextSpeedChange = 0;
        let currentMode = 'NORMAL';

        const fillEl = content.querySelector('#inst-progress-fill');
        const percentEl = content.querySelector('#inst-percent-text');
        const speedEl = content.querySelector('#inst-speed-text');
        const downloadedEl = content.querySelector('#inst-downloaded-text');
        const timerEl = content.querySelector('#inst-timer-text');
        const statusLabel = content.querySelector('#installer-status-label');
        const logBox = content.querySelector('#inst-term-logs');

        const milestoneLogs = [
            { pct: 0.5, text: 'Formatting target disk /dev/nvme0n1p2 as ext4 journaled filesystem...' },
            { pct: 4.0, text: 'Creating swap partition on /dev/nvme0n1p3 (2048 MB)...' },
            { pct: 9.0, text: 'Connecting to package mirror: https://archive.krypton-os.org/pool/main...' },
            { pct: 15.0, text: 'Speed burst detected: downloading core base-files & glibc (680 MB)...' },
            { pct: 26.0, text: 'Downloading linux-image-6.10.0-krypton-generic & kernel headers (450 MB)...' },
            { pct: 36.0, text: 'Mirror latency variation detected: downloading desktop runtime libraries...' },
            { pct: 47.0, text: `Creating primary user account '${userLogin}' (${userName})...` },
            { pct: 58.0, text: 'Extracting Wayland compositor, X11 libraries, and Krypton Desktop UI...' },
            { pct: 69.0, text: `Generating system locales and configuring timezone (${selectedTz.split(' - ')[0]})...` },
            { pct: 78.0, text: 'Building initial ramdisk: update-initramfs -c -k 6.10.0-krypton...' },
            { pct: 88.0, text: 'Installing GRUB2 EFI bootloader into /boot/efi (/dev/nvme0n1p1)...' },
            { pct: 95.0, text: `Configuring system hostname: ${userHostname}...` },
            { pct: 100.0, text: 'Installation and user configuration completed successfully!' }
        ];

        let loggedMilestones = new Set();
        const dt = 0.1;

        const pickNewSpeedMode = (currentPct) => {
            const rand = Math.random();
            if (currentPct > 75 && currentPct < 85) {
                return rand < 0.6 ? 'UNPACK_STALL' : 'SLOW_DIP';
            }
            if (currentPct > 88 && currentPct < 98) {
                return rand < 0.5 ? 'NORMAL' : 'BURST';
            }
            if (currentPct >= 98) {
                return 'FINAL_SYNC';
            }

            if (rand < 0.35) return 'BURST';
            if (rand < 0.65) return 'NORMAL';
            if (rand < 0.85) return 'SLOW_DIP';
            return 'UNPACK_STALL';
        };

        installTimerInterval = setInterval(() => {
            elapsed += dt;

            if (elapsed >= nextSpeedChange) {
                currentMode = pickNewSpeedMode(progress);
                nextSpeedChange = elapsed + 1.2 + Math.random() * 2.8;
            }

            let baseSpeed = 50;
            let speedBadgeClass = '';
            let speedLabelPrefix = '⚡';

            switch (currentMode) {
                case 'BURST':
                    baseSpeed = 110 + Math.random() * 75;
                    speedBadgeClass = 'burst';
                    speedLabelPrefix = '🚀';
                    break;
                case 'NORMAL':
                    baseSpeed = 40 + Math.random() * 45;
                    speedBadgeClass = '';
                    speedLabelPrefix = '⚡';
                    break;
                case 'SLOW_DIP':
                    baseSpeed = 12 + Math.random() * 20;
                    speedBadgeClass = 'slow';
                    speedLabelPrefix = '🐢';
                    break;
                case 'UNPACK_STALL':
                    baseSpeed = 2 + Math.random() * 9;
                    speedBadgeClass = 'stall';
                    speedLabelPrefix = '📦';
                    break;
                case 'FINAL_SYNC':
                    baseSpeed = 85 + Math.random() * 65;
                    speedBadgeClass = 'burst';
                    speedLabelPrefix = '💽';
                    break;
            }

            currentSpeedMBs = baseSpeed;

            const nominalIncrement = (100 / targetDuration) * dt;
            const speedMultiplier = currentSpeedMBs / 65.0;
            let deltaProgress = nominalIncrement * speedMultiplier;

            if (elapsed > 39.0 && progress < 88) {
                const remainingTime = Math.max(0.5, maxAllowedDuration - elapsed);
                deltaProgress = Math.max(deltaProgress, (100 - progress) / (remainingTime / dt));
                currentSpeedMBs = 140 + Math.random() * 40;
                speedBadgeClass = 'burst';
                speedLabelPrefix = '🚀';
            }

            progress = Math.min(100, progress + deltaProgress);

            if (progress >= 100 || elapsed >= maxAllowedDuration || (elapsed >= targetDuration && progress >= 99)) {
                progress = 100;
            }

            const downloadedMB = Math.min(totalBytesMB, Math.round((progress / 100) * totalBytesMB));

            if (fillEl) fillEl.style.width = `${progress.toFixed(1)}%`;
            if (percentEl) percentEl.textContent = `${progress.toFixed(1)}% Completed`;
            if (downloadedEl) downloadedEl.textContent = `${downloadedMB.toLocaleString()} MB / ${totalBytesMB.toLocaleString()} MB`;
            if (timerEl) timerEl.textContent = `${elapsed.toFixed(1)}s / ${maxAllowedDuration.toFixed(1)}s max`;

            if (speedEl) {
                speedEl.className = `metric-value speed-badge ${speedBadgeClass}`;
                if (progress >= 100) {
                    speedEl.textContent = `✓ 0.0 MB/s (Done)`;
                } else {
                    speedEl.textContent = `${speedLabelPrefix} ${currentSpeedMBs.toFixed(1)} MB/s`;
                }
            }

            milestoneLogs.forEach((milestone, idx) => {
                if (progress >= milestone.pct && !loggedMilestones.has(idx)) {
                    loggedMilestones.add(idx);
                    if (logBox) {
                        const line = document.createElement('div');
                        line.className = 'log-line';
                        const timeTag = `[ ${elapsed.toFixed(2).padStart(5, ' ')}s ]`;
                        line.textContent = `${timeTag} ${milestone.text}`;
                        logBox.appendChild(line);
                        logBox.scrollTop = logBox.scrollHeight;
                    }
                    if (statusLabel) {
                        statusLabel.textContent = milestone.text;
                    }
                }
            });

            // Completion Handler
            if (progress >= 100) {
                clearInterval(installTimerInterval);
                installTimerInterval = null;

                // Provision customized user account and hostname into VFS
                const effUser = userLogin.trim() || 'guest';
                const effHost = userHostname.trim() || 'krypton-station';

                vfs.writeFile('/etc/hostname', `${effHost}\n`);
                vfs.writeFile('/etc/hosts', `127.0.0.1\tlocalhost\n127.0.1.1\t${effHost}\n\n::1     ip6-localhost ip6-loopback\nfe00::0 ip6-localnet\nff00::0 ip6-mcastprefix\nff02::1 ip6-allnodes\nff02::2 ip6-allrouters\n`);
                
                const passwdNode = vfs.getNode('/etc/passwd');
                if (passwdNode) {
                    passwdNode.content = `root:x:0:0:root:/root:/bin/bash\n${effUser}:x:1000:1000:${userName},,,:/home/${effUser}:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nbin:x:2:2:bin:/bin:/usr/sbin/nologin\nsys:x:3:3:sys:/dev:/usr/sbin/nologin\nnobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin\n`;
                }

                const groupNode = vfs.getNode('/etc/group');
                if (groupNode) {
                    groupNode.content = `root:x:0:\nadm:x:4:${effUser}\nsudo:x:27:${effUser}\naudio:x:29:${effUser}\ndip:x:30:${effUser}\nvideo:x:44:${effUser}\nplugdev:x:46:${effUser}\n${effUser}:x:1000:\n`;
                }

                vfs.createDirectory(`/home/${effUser}`);
                vfs.createDirectory(`/home/${effUser}/Desktop`);
                vfs.createDirectory(`/home/${effUser}/Documents`);
                vfs.createDirectory(`/home/${effUser}/Downloads`);
                vfs.createDirectory(`/home/${effUser}/Pictures`);
                vfs.createDirectory(`/home/${effUser}/Music`);
                vfs.createDirectory(`/home/${effUser}/Videos`);

                vfs.writeFile(`/home/${effUser}/.bashrc`, `export PATH=$PATH:/usr/local/bin\nalias ll='ls -la'\nalias la='ls -A'\nalias l='ls -CF'\nalias cls='clear'\n`);
                vfs.writeFile(`/home/${effUser}/.profile`, `# ~/.profile for ${effUser}\nif [ -f ~/.bashrc ]; then\n  . ~/.bashrc\nfi\n`);
                vfs.writeFile(`/home/${effUser}/.bash_history`, `uname -a\nneofetch\nls -la\n`);
                vfs.writeFile(`/home/${effUser}/Desktop/welcome_to_krypton.txt`, `=== Welcome to KryptonOS 1.0 LTS ===\n\nWelcome, ${userName} (${effUser})!\nYour workstation '${effHost}' has been provisioned on Samsung SSD 980 PRO NVMe storage.\n\nEnjoy your authentic Linux sandbox!`);
                vfs.writeFile(`/home/${effUser}/Documents/system_specs.txt`, `OS: KryptonOS 1.0 LTS x86_64\nHost: ASUSTeK COMPUTER INC. ROG STRIX Z490-E GAMING\nUser: ${userName} (${effUser})\nHostname: ${effHost}\nKernel: Linux 6.10.0-krypton-generic\nCPU: Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz (8C/16T)\nGPU: NVIDIA GeForce RTX 3080 10GB\nRAM: 16384 MB DDR4-3200 (Dual-Channel)\nStorage: Samsung SSD 980 PRO 1TB NVMe (/dev/nvme0n1p2)\n`);

                vfs.saveFileSystem();

                localStorage.setItem('krypton_primary_user', effUser);
                localStorage.setItem('krypton_hostname', effHost);
                localStorage.setItem('krypton_os_installed', 'true');

                sound.playSuccess();
                story.showToast('🎉 Installation Complete!', `KryptonOS installed successfully for user '${effUser}'. Reboot to launch full OS.`, 'success');

                if (statusLabel) {
                    statusLabel.textContent = `🎉 KryptonOS 1.0 Installed for user '${effUser}'!`;
                }
                if (logBox) {
                    const finishLine = document.createElement('div');
                    finishLine.className = 'log-line';
                    finishLine.style.color = '#ffff55';
                    finishLine.style.fontWeight = 'bold';
                    finishLine.textContent = `[ SUCCESS ] System installed in ${elapsed.toFixed(1)}s! Type "sudo reboot" in Terminal to boot into installed OS as ${effUser}@${effHost}.`;
                    logBox.appendChild(finishLine);
                    logBox.scrollTop = logBox.scrollHeight;
                }
            }
        }, dt * 1000);
    };

    render();

    wm.createWindow({
        id: 'installer',
        title: 'KryptonOS 1.0 Installer (Ubiquity / Calamares)',
        icon: '💿',
        width: 720,
        height: 540,
        content: content,
        onClose: () => {
            if (installTimerInterval) {
                clearInterval(installTimerInterval);
                installTimerInterval = null;
            }
        }
    });
}
