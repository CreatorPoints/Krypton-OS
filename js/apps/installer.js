/* ==========================================================================
   KryptonOS - Calamares / Ubiquity Style Live Network Installer Wizard Engine
   ========================================================================== */

import { wm } from '../wm.js';
import { sound } from '../sound.js';
import { story } from '../story.js';
import { vfs, idbStore, downloadWithMetrics } from '../fs.js';
import { boot } from '../boot.js';

export function openInstallerWizard() {
    if (wm.windows.has('installer')) {
        wm.focusWindow('installer');
        return;
    }

    let currentStep = 0;
    let selectedLang = 'English (US)';
    let selectedTz = 'UTC+05:30 - Kolkata (India)';
    let connectedWifi = null;
    let wifiFailuresCount = 0;
    let userName = '';
    let userHostname = 'krypton-station';
    let userLogin = '';
    let userPassword = '';
    let confirmPassword = '';
    let requirePassword = true;
    let downloadRecommendedApps = true;
    let installInProgress = false;
    let installTimerInterval = null;

    const steps = [
        { id: 'lang', name: 'Language' },
        { id: 'timezone', name: 'Timezone' },
        { id: 'network', name: 'Network' },
        { id: 'user', name: 'User Setup' },
        { id: 'software', name: 'Software Selection' },
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
                <div id="step-body-container" style="flex: 1; display: flex; flex-direction: column;">
                    ${renderStepBody(currentStep)}
                </div>

                ${currentStep < 6 ? `
                    <div class="wizard-footer">
                        <button class="wizard-btn btn-prev" id="wiz-prev-btn" ${currentStep === 0 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>Back</button>
                        ${currentStep === 5 ? `
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
                <div class="step-title">Welcome to Krypton OS Installer</div>
                <div class="step-subtitle">Install Krypton OS 0.1 Alpha to your storage drive.</div>
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
                    <label style="font-size: 13px; font-weight: 600; color: #f8fafc;">Region / Timezone:</label>
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
                { ssid: 'pass-1234ABC', signal: '98%', locked: true, hint: true },
                { ssid: 'Neighbor_5G_Locked', signal: '100%', locked: true, neighborLocked: true },
                { ssid: 'Office_Gigabit_5G', signal: '85%', locked: true },
                { ssid: 'Guest_WiFi_Free', signal: '45%', locked: false },
                { ssid: 'Skip Network Setup (Offline)', signal: '--', locked: false, isOffline: true }
            ];

            return `
                <div class="step-title">Connect to Network</div>
                <div class="step-subtitle">Connect to a wireless or wired network to fetch system packages from GitHub upstream.</div>
                <div class="wifi-network-list">
                    ${wifis.map(w => {
                        const isConn = (connectedWifi === w.ssid) || (w.isOffline && connectedWifi === 'Offline Mode');
                        return `
                            <div class="wifi-card ${isConn ? 'connected' : ''}" data-ssid="${w.ssid}" data-locked="${w.locked}" data-neighbor="${w.neighborLocked || false}" data-offline="${w.isOffline || false}">
                                <div>
                                    <div class="wifi-name">${w.isOffline ? '⚡' : '📶'} ${w.ssid}</div>
                                    <div style="font-size: 11px; color: #94a3b8;">${w.isOffline ? 'Install base packages from local ISO image' : `Signal: ${w.signal} • ${w.locked ? '🔒 Encrypted WPA2-PSK' : '🔓 Open Network'}`}</div>
                                </div>
                                <div class="wifi-status-badge">${isConn ? (w.isOffline ? '✓ Selected' : '✓ Connected') : (w.isOffline ? 'Select' : (w.locked ? 'Connect' : 'Join'))}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else if (stepIdx === 3) {
            return `
                <div class="step-title">Who are you? (User & Account Setup)</div>
                <div class="step-subtitle">Configure your workstation account credentials. Passwords are required for sudo administration.</div>

                <div class="user-form-card">
                    <div class="user-form-row">
                        <label class="user-form-label" style="color: #f8fafc; font-weight: 600;">Your Name:</label>
                        <input type="text" class="user-form-input" id="wiz-realname-input" value="${userName}" placeholder="e.g. John Doe" autocomplete="off" spellcheck="false">
                    </div>
                    <div class="user-form-row">
                        <label class="user-form-label" style="color: #f8fafc; font-weight: 600;">Computer's Name (Hostname):</label>
                        <input type="text" class="user-form-input" id="wiz-hostname-input" value="${userHostname}" placeholder="e.g. krypton-station" autocomplete="off" spellcheck="false">
                        <span class="user-form-hint" style="color: #94a3b8;">Machine identifier used for terminal prompts (<code>${userLogin || 'username'}@${userHostname || 'krypton-station'}</code>).</span>
                    </div>
                    <div class="user-form-row">
                        <label class="user-form-label" style="color: #f8fafc; font-weight: 600;">Pick a Username <span style="color:#ef4444;">*</span>:</label>
                        <input type="text" class="user-form-input" id="wiz-username-input" value="${userLogin}" placeholder="e.g. jdoe" autocomplete="off" spellcheck="false">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="user-form-row">
                            <label class="user-form-label" style="color: #f8fafc; font-weight: 600;">Choose a Password <span style="color:#ef4444;">*</span>:</label>
                            <input type="password" class="user-form-input" id="wiz-password-input" value="${userPassword}" placeholder="Required password..." autocomplete="off">
                        </div>
                        <div class="user-form-row">
                            <label class="user-form-label" style="color: #f8fafc; font-weight: 600;">Confirm Password <span style="color:#ef4444;">*</span>:</label>
                            <input type="password" class="user-form-input" id="wiz-confirm-pass-input" value="${confirmPassword}" placeholder="Confirm password..." autocomplete="off">
                        </div>
                    </div>
                    <div style="margin-top: 10px; background: rgba(255,255,255,0.04); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #f8fafc; cursor: pointer;">
                            <input type="checkbox" id="wiz-requirepass-toggle" ${requirePassword ? 'checked' : ''} style="width:16px;height:16px;cursor:pointer;">
                            <span><strong>Require password to log in</strong> (Required for sudo administration)</span>
                        </label>
                    </div>
                </div>
            `;
        } else if (stepIdx === 4) {
            return `
                <div class="step-title">Software Selection</div>
                <div class="step-subtitle">Configure standard core system and optional recommended application packages.</div>

                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #334155; border-radius: 8px; padding: 16px;">
                        <div style="font-weight: 700; font-size: 14px; color: #38bdf8; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                            <span>⚙️</span> Essential Core System Utilities (Mandatory)
                        </div>
                        <div style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">
                            The following system packages are essential and will always be installed into <code>/usr/bin</code> and registered with system control:
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; font-size: 12px; color: #e2e8f0;">
                            <div style="padding: 6px 10px; background: rgba(255,255,255,0.04); border-radius: 4px;">• <strong>Settings</strong> (Display & Themes)</div>
                            <div style="padding: 6px 10px; background: rgba(255,255,255,0.04); border-radius: 4px;">• <strong>Task Manager</strong> (Process Manager)</div>
                            <div style="padding: 6px 10px; background: rgba(255,255,255,0.04); border-radius: 4px;">• <strong>File Manager</strong> (VFS Storage Explorer)</div>
                            <div style="padding: 6px 10px; background: rgba(255,255,255,0.04); border-radius: 4px;">• <strong>Terminal Shell</strong> (Bourne-Again Shell)</div>
                        </div>
                    </div>

                    <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #0284c7; border-radius: 8px; padding: 16px;">
                        <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer;">
                            <input type="checkbox" id="wiz-recommended-apps-toggle" ${downloadRecommendedApps ? 'checked' : ''} style="margin-top: 3px; width: 18px; height: 18px; cursor: pointer;">
                            <div>
                                <div style="font-weight: 700; font-size: 14px; color: #ffffff;">Download Recommended Optional Apps?</div>
                                <div style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 4px;">
                                    Downloads lightweight optional-essentials: <strong>Web Navigator</strong> (Alpha browser), <strong>Calculator</strong>, and <strong>Upgrade Notes</strong> editor.
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
            `;
        } else if (stepIdx === 5) {
            return `
                <div class="step-title">Select Destination Storage Disk</div>
                <div class="step-subtitle">Choose the target NVMe / SSD drive where KryptonOS will be installed.</div>

                <div class="drive-card selected">
                    <div class="drive-icon">💽</div>
                    <div class="drive-info">
                        <div class="drive-name" style="color: #ffffff; font-weight: 700;">[ Selected Target ] NVMe SSD: Samsung SSD 980 PRO 1TB (/dev/nvme0n1)</div>
                        <div class="drive-size" style="color: #94a3b8;">1000.2 GB (931.5 GiB) • Partition Table: GPT (ext4 / EFI / Swap)</div>
                    </div>
                </div>

                <div class="drive-card disabled">
                    <div class="drive-icon">💾</div>
                    <div class="drive-info">
                        <div class="drive-name" style="color: #94a3b8;">[ Read-Only / Live Media ] USB Flash Drive: SanDisk Ultra 32GB (/dev/sda)</div>
                        <div class="drive-size" style="color: #64748b;">31.2 GB • Live ISO Installer Medium</div>
                    </div>
                </div>

                <div style="background: rgba(239,68,68,0.15); border: 1px solid #ef4444; border-radius: 6px; padding: 12px; font-size: 12px; color: #fca5a5;">
                    ⚠️ <strong>Warning:</strong> Installation will format target partition <code>/dev/nvme0n1p2</code> and install genuine upstream Krypton OS 0.1 Alpha.
                </div>
            `;
        } else if (stepIdx === 6) {
            return `
                <div class="step-title">Installing Krypton OS 0.1 Alpha (Real Stream from Repo)</div>
                <div class="step-subtitle" id="installer-status-label">Connecting to upstream https://raw.githubusercontent.com/CreatorPoints/Krypton-Repo...</div>

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
                            <span class="metric-label">Estimated Time Left</span>
                            <span class="metric-value" id="inst-eta-text">Calculating...</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Elapsed Time</span>
                            <span class="metric-value" id="inst-timer-text">0.0s</span>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; margin-bottom: 4px;">
                        <span style="font-size: 11px; color: #94a3b8; font-family: monospace;">System Installation Console Logs</span>
                        <button id="inst-btn-copy-logs" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(0, 229, 255, 0.3); border-radius: 4px; padding: 3px 10px; font-size: 11px; color: #00e5ff; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;">
                            📋 Copy All Logs
                        </button>
                    </div>

                    <div class="installer-terminal-logs" id="inst-term-logs">
                        <div class="log-line">[  0.00s ] Initializing KryptonOS Real Stream Installer Engine...</div>
                    </div>
                </div>
            `;
        }
    };

    const showInstallationCompleteDialog = () => {
        if (wm.windows.has('installer-complete-dialog')) return;

        const dialog = document.createElement('div');
        dialog.style.cssText = 'display: flex; flex-direction: column; gap: 16px; padding: 6px; color: #fff; font-family: var(--font-sans);';

        dialog.innerHTML = `
            <div style="display: flex; gap: 14px; align-items: center;">
                <div style="font-size: 38px; line-height: 1;">🎉</div>
                <div>
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; color: #fff; font-weight: 700;">Installation Complete</h3>
                    <div style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
                        Installation is complete. You can continue testing Krypton OS now, but until you restart the computer, any changes you make will not be preserved.
                    </div>
                </div>
            </div>

            <div style="background: rgba(0, 229, 255, 0.08); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #e2e8f0; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">💡</span>
                <span>Restart the computer now to boot into your newly installed <strong>Krypton OS 0.1 Alpha</strong> environment on <code>/dev/nvme0n1</code>.</span>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
                <button id="inst-btn-continue" style="padding: 8px 16px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #fff; font-size: 12px; font-weight: 600; cursor: pointer;">
                    Continue Testing
                </button>
                <button id="inst-btn-restart-now" style="padding: 8px 20px; background: #10b981; border: none; border-radius: 6px; color: #000; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 10px rgba(16,185,129,0.3);">
                    ⏻ Restart Now
                </button>
            </div>
        `;

        wm.createWindow({
            id: 'installer-complete-dialog',
            title: 'Installation Finished - Krypton OS',
            icon: '🎉',
            width: 480,
            height: 250,
            content: dialog
        });

        dialog.querySelector('#inst-btn-continue')?.addEventListener('click', () => {
            sound.playClick();
            wm.closeWindow('installer-complete-dialog');
            story.showToast('Live Media Session', 'You can continue testing. Restart whenever you want to boot into installed Krypton OS.', 'info');
        });

        dialog.querySelector('#inst-btn-restart-now')?.addEventListener('click', () => {
            sound.playClick();
            wm.closeWindow('installer-complete-dialog');
            wm.closeWindow('installer');
            boot.triggerSystemRebootBroadcast('The system is going down for reboot NOW! (Krypton OS 0.1 Alpha Deployment)');
        });
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
                updateClock();
            });
            const updateClock = () => {
                const now = new Date();
                clockPreview.textContent = now.toTimeString().split(' ')[0] + ' ' + selectedTz.split(' - ')[0];
            };
            updateClock();
        }

        // Step 2: Wi-Fi
        content.querySelectorAll('.wifi-card').forEach(card => {
            card.addEventListener('click', () => {
                const ssid = card.getAttribute('data-ssid');
                const locked = card.getAttribute('data-locked') === 'true';
                const isNeighbor = card.getAttribute('data-neighbor') === 'true';
                const isOffline = card.getAttribute('data-offline') === 'true';

                if (isNeighbor) {
                    story.showToast('Access Denied', 'The neighbor found out you snuck into his Wi-Fi, so he locked it and upgraded his signal strength to 100%. You cannot connect to this network.', 'error');
                    return;
                }

                if (isOffline) {
                    sound.playClick();
                    connectedWifi = 'Offline Mode';
                    story.showToast('Offline Mode', 'Selected offline installation mode from local ISO.', 'info');
                    render();
                    return;
                }

                if (ssid === 'pass-1234ABC') {
                    showWifiPasswordWindow(ssid);
                } else if (!locked) {
                    connectedWifi = ssid;
                    story.showToast('Wi-Fi Connected', `Connected to open network "${ssid}".`, 'success');
                    render();
                } else {
                    story.showToast('Security Error', `WPA2 authentication required for "${ssid}".`, 'error');
                }
            });
        });

        // Step 3: User Inputs
        const realnameInput = content.querySelector('#wiz-realname-input');
        const hostnameInput = content.querySelector('#wiz-hostname-input');
        const usernameInput = content.querySelector('#wiz-username-input');
        const passwordInput = content.querySelector('#wiz-password-input');
        const confirmPassInput = content.querySelector('#wiz-confirm-pass-input');
        const requirePassToggle = content.querySelector('#wiz-requirepass-toggle');

        if (realnameInput) {
            realnameInput.addEventListener('input', (e) => {
                userName = e.target.value;
                if (!userLogin || userLogin === userName.slice(0, -1).toLowerCase().replace(/[^a-z0-9_]/g, '')) {
                    const slug = userName.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, '');
                    if (slug) {
                        userLogin = slug;
                        if (usernameInput) usernameInput.value = userLogin;
                    }
                }
            });
        }
        if (hostnameInput) hostnameInput.addEventListener('input', (e) => { userHostname = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''); e.target.value = userHostname; });
        if (usernameInput) usernameInput.addEventListener('input', (e) => { userLogin = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''); e.target.value = userLogin; });
        if (passwordInput) passwordInput.addEventListener('input', (e) => { userPassword = e.target.value; });
        if (confirmPassInput) confirmPassInput.addEventListener('input', (e) => { confirmPassword = e.target.value; });
        if (requirePassToggle) requirePassToggle.addEventListener('change', (e) => { requirePassword = e.target.checked; });

        // Step 4: Software Selection Toggle
        const recAppsToggle = content.querySelector('#wiz-recommended-apps-toggle');
        if (recAppsToggle) {
            recAppsToggle.addEventListener('change', (e) => {
                downloadRecommendedApps = e.target.checked;
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
                // Validation for Step 2 (Network)
                if (currentStep === 2 && !connectedWifi) {
                    connectedWifi = 'Offline Mode';
                }

                // Validation for Step 3 (User)
                if (currentStep === 3) {
                    if (!userLogin.trim()) {
                        showOSNoticeWindow('Username Required', 'Linux username cannot be empty.');
                        return;
                    }
                    if (!userPassword.trim()) {
                        showOSNoticeWindow('Password Required', 'Password is required to secure your account and allow sudo administration.');
                        return;
                    }
                    if (userPassword !== confirmPassword) {
                        showOSNoticeWindow('Password Mismatch', 'The passwords you entered do not match. Please verify them.');
                        return;
                    }
                }

                if (currentStep < 5) {
                    currentStep++;
                    render();
                }
            });
        }

        if (installBtn) {
            installBtn.addEventListener('click', () => {
                showDiskConfirmWindow(() => {
                    currentStep = 6;
                    render();
                    startDynamicOSInstallation();
                });
            });
        }

        // Step 6: Terminal Logs Copy & Selection Listener
        const copyLogsBtn = content.querySelector('#inst-btn-copy-logs');
        const termLogsEl = content.querySelector('#inst-term-logs');

        if (copyLogsBtn && termLogsEl) {
            copyLogsBtn.addEventListener('click', () => {
                const text = termLogsEl.innerText || termLogsEl.textContent || '';
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(text).then(() => {
                        sound.playClick();
                        story.showToast('📋 Logs Copied', 'All installer console logs copied to clipboard.', 'success');
                        copyLogsBtn.innerHTML = '✓ Copied!';
                        setTimeout(() => {
                            if (copyLogsBtn) copyLogsBtn.innerHTML = '📋 Copy All Logs';
                        }, 2000);
                    }).catch(() => {});
                }
            });
        }

        if (termLogsEl) {
            termLogsEl.addEventListener('copy', (e) => {
                const selection = window.getSelection()?.toString() || '';
                if (selection.length > 0 && e.clipboardData) {
                    e.clipboardData.setData('text/plain', selection);
                    e.preventDefault();
                }
            });
            termLogsEl.addEventListener('contextmenu', (e) => {
                const selection = window.getSelection()?.toString() || '';
                if (selection.length > 0) {
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(selection).catch(() => {});
                    }
                    story.showToast('📋 Copied', 'Selected installer logs copied to clipboard.', 'info');
                }
            });
        }
    };

    const showWifiPasswordWindow = (ssid) => {
        const dialogContent = document.createElement('div');
        dialogContent.style.cssText = 'display: flex; flex-direction: column; gap: 12px; color: #f8fafc; background: #0f172a; padding: 16px; font-family: "Outfit", sans-serif;';

        dialogContent.innerHTML = `
            <div style="font-size: 14px; font-weight: 700; color: #38bdf8;">
                🔒 Enter Security Key for "${ssid}"
            </div>
            <div style="font-size: 12px; color: #94a3b8;">
                This network requires WPA2/WPA3 Pre-Shared Key (PSK) authentication.
            </div>
            <input type="password" id="wifi-pass-input" placeholder="Security key..." style="width: 100%; padding: 8px 12px; border: 1px solid #334155; border-radius: 6px; background: #1e293b; color: #fff; font-family: monospace; font-size: 13px;">
            
            <div id="wifi-hint-msg" style="font-size: 12px; color: #f59e0b; background: rgba(245,158,11,0.1); border: 1px solid #f59e0b; padding: 8px; border-radius: 6px; display: ${wifiFailuresCount >= 3 ? 'block' : 'none'};">
                💡 <strong>Hint:</strong> Have you seen the name? (The password is in the network name: <code>pass-1234ABC</code>)
            </div>

            <div id="wifi-err-msg" style="font-size: 12px; color: #ef4444; display: none;">
                ❌ Authentication Error: Invalid Wi-Fi Password.
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px;">
                <button id="wifi-btn-cancel" style="padding: 6px 14px; background: #334155; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">Cancel</button>
                <button id="wifi-btn-connect" style="padding: 6px 14px; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">Connect</button>
            </div>
        `;

        const passInput = dialogContent.querySelector('#wifi-pass-input');
        const errMsg = dialogContent.querySelector('#wifi-err-msg');
        const hintMsg = dialogContent.querySelector('#wifi-hint-msg');
        const btnConnect = dialogContent.querySelector('#wifi-btn-connect');
        const btnCancel = dialogContent.querySelector('#wifi-btn-cancel');

        wm.createWindow({
            id: 'wifi-pass-dialog',
            title: `Wi-Fi Security - ${ssid}`,
            icon: '🔒',
            width: 400,
            height: 260,
            content: dialogContent
        });

        const tryConnect = () => {
            const pass = passInput.value.trim();
            if (pass === 'pass-1234ABC' || pass === '1234ABC') {
                connectedWifi = ssid;
                wm.closeWindow('wifi-pass-dialog');
                story.showToast('Wi-Fi Connected', `✓ Connected to "${ssid}" successfully!`, 'success');
                render();
            } else {
                wifiFailuresCount++;
                errMsg.style.display = 'block';
                if (wifiFailuresCount >= 3 && hintMsg) {
                    hintMsg.style.display = 'block';
                }
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
        dialogContent.style.cssText = 'display: flex; flex-direction: column; gap: 14px; color: #ffffff; background: #0f172a; padding: 18px; font-family: "Outfit", sans-serif;';

        dialogContent.innerHTML = `
            <div style="font-weight: 700; font-size: 15px; color: #ef4444; border-bottom: 1px solid #334155; padding-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                <span>⚠️</span> Confirm Disk Formatting & Upstream Installation
            </div>
            <div style="font-size: 13px; color: #ffffff; line-height: 1.6;">
                Write upstream KryptonOS rootfs image to <strong style="color: #38bdf8;">/dev/nvme0n1</strong>?<br>
                Target drive: <strong style="color: #ffffff;">Samsung SSD 980 PRO 1TB</strong>.<br>
                User: <strong style="color: #4ade80;">${userLogin}</strong> (${userName || 'Primary User'})
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;">
                <button id="disk-btn-cancel" style="padding: 7px 16px; background: #334155; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">Cancel</button>
                <button id="disk-btn-confirm" style="padding: 7px 18px; background: #dc2626; color: #ffffff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);">▶ Erase & Install</button>
            </div>
        `;

        wm.createWindow({
            id: 'disk-confirm-dialog',
            title: 'Confirm Installation Target',
            icon: '⚠️',
            width: 460,
            height: 240,
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

    const showOSNoticeWindow = (title, msg) => {
        const d = document.createElement('div');
        d.style.cssText = 'padding: 18px; color: #ffffff; background: #0f172a; font-family: "Outfit", sans-serif; font-size: 13px; line-height: 1.6; display: flex; flex-direction: column; gap: 12px;';
        d.innerHTML = `
            <div style="font-weight: 700; font-size: 15px; color: #38bdf8;">${title}</div>
            <div style="color: #ffffff;">${msg}</div>
            <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
                <button id="notice-ok-btn" style="padding: 7px 18px; background: #0284c7; color: #ffffff; font-weight: 700; border: none; border-radius: 6px; cursor: pointer;">OK</button>
            </div>
        `;

        wm.createWindow({
            id: 'os-notice-dialog',
            title: title,
            icon: 'ℹ️',
            width: 400,
            height: 200,
            content: d
        });

        d.querySelector('#notice-ok-btn').addEventListener('click', () => {
            wm.closeWindow('os-notice-dialog');
        });
    };

    // =========================================================================
    // REAL STREAMING NETWORK INSTALLER (FETCHES MANIFEST & REAL PACKAGES)
    // =========================================================================
    const startDynamicOSInstallation = async () => {
        if (installInProgress) return;
        installInProgress = true;

        const fillEl = content.querySelector('#inst-progress-fill');
        const percentEl = content.querySelector('#inst-percent-text');
        const speedEl = content.querySelector('#inst-speed-text');
        const etaEl = content.querySelector('#inst-eta-text');
        const timerEl = content.querySelector('#inst-timer-text');
        const statusLabel = content.querySelector('#installer-status-label');
        const logBox = content.querySelector('#inst-term-logs');

        const startTime = Date.now();
        let totalBytesDownloaded = 0;

        const appendLog = (msg, color = '#e2e8f0', isBold = false) => {
            if (!logBox) return;
            const line = document.createElement('div');
            line.className = 'log-line';
            line.style.color = color;
            if (isBold) line.style.fontWeight = 'bold';
            const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2).padStart(5, ' ');
            line.textContent = `[ ${elapsedSec}s ] ${msg}`;
            logBox.appendChild(line);
            logBox.scrollTop = logBox.scrollHeight;
        };

        appendLog('[ NET ] Initializing interface enp3s0 (IPv4: 192.168.1.142/24 via DHCP)...', '#00e5ff');
        appendLog('[ NET ] DNS resolved raw.githubusercontent.com -> 185.199.108.133:443 (TLS 1.3)', '#00e5ff');

        // 1. Fetch genuine OS RootFS manifest from Krypton-Repo
        appendLog('[ HTTP ] GET https://raw.githubusercontent.com/CreatorPoints/Krypton-Repo/main/Os/alpha/rootfs.json ...', '#cbd5e0');
        let rootfsPayload = null;
        let manifestMeta = null;

        try {
            manifestMeta = await downloadWithMetrics(
                'https://raw.githubusercontent.com/CreatorPoints/Krypton-Repo/main/Os/alpha/rootfs.json',
                './Os/alpha/rootfs.json',
                (chunk) => {
                    totalBytesDownloaded += chunk.receivedBytes;
                }
            );
            rootfsPayload = JSON.parse(manifestMeta.text);
            await idbStore.put('manifests', { id: 'alpha_rootfs', payload: rootfsPayload, sha256: manifestMeta.sha256 });
            appendLog(`[ HTTP ] 200 OK: Os/alpha/rootfs.json (${(manifestMeta.size / 1024).toFixed(1)} kB) [SHA256: ${manifestMeta.sha256.substring(0, 16)}...]`, '#48bb78', true);
        } catch (err) {
            appendLog('[ WARN ] Upstream repository unreachable. Falling back to local image archive...', '#ecc94b');
            try {
                const localRes = await fetch('./Os/alpha/rootfs.json');
                if (localRes.ok) {
                    rootfsPayload = await localRes.json();
                }
            } catch (e) {}
        }

        const filesToExtract = (rootfsPayload && rootfsPayload.files) ? Object.entries(rootfsPayload.files) : [
            ['/boot/grub/grub.cfg', '# GRUB 2.06\nset default=0\nmenuentry "Krypton OS 0.1 Alpha" { linux /boot/vmlinuz-2.0.0.14-generic-krypton root=UUID=7f8a-99b2-krypton ro quiet splash\ninitrd /boot/initrd.img-2.0.0.14-generic-krypton\n}\n'],
            ['/boot/vmlinuz-2.0.0.14-generic-krypton', 'ELF 64-bit LSB executable, x86-64, Linux 2.0.0.14-generic-krypton'],
            ['/boot/initrd.img-2.0.0.14-generic-krypton', 'ASCII cpio archive (SVR4 with CRC), initial ramdisk rootfs image'],
            ['/etc/os-release', 'NAME="KryptonOS"\nVERSION="0.1.0-alpha"\nID=krypton\nID_LIKE=debian\nPRETTY_NAME="Krypton OS 0.1 Alpha"\nVERSION_ID="0.1.0"\nVERSION_CODENAME=alpha\nHOME_URL="https://krypton-os.org/"\nSUPPORT_URL="https://krypton-os.org/support"\nBUG_REPORT_URL="https://bugs.krypton-os.org/"\n'],
            ['/etc/fstab', 'UUID=7f8a-99b2-krypton / ext4 errors=remount-ro 0 1\n'],
            ['/etc/apt/sources.list', 'deb https://deb.krypton-os.org/krypton beryllium main contrib non-free\ndeb https://raw.githubusercontent.com/CreatorPoints/Krypton-Repo/main/apt/ beryllium main\n']
        ];

        const totalSteps = filesToExtract.length + 14;
        let currentStepNum = 0;
        let simulatedTotalBytes = (manifestMeta ? manifestMeta.size : 50000) + (1024 * 1024 * 18);
        let transferredBytes = manifestMeta ? manifestMeta.size : 5000;

        const updateMetrics = () => {
            const elapsed = Math.max(0.1, (Date.now() - startTime) / 1000);
            const pct = Math.min(100, (currentStepNum / totalSteps) * 100);
            const speedBytesPerSec = transferredBytes / elapsed;
            const speedMBs = speedBytesPerSec / (1024 * 1024);
            const remainingBytes = Math.max(0, simulatedTotalBytes - transferredBytes);
            const etaSec = speedBytesPerSec > 0 ? (remainingBytes / speedBytesPerSec) : 0;

            if (fillEl) fillEl.style.width = `${pct.toFixed(1)}%`;
            if (percentEl) percentEl.textContent = `${pct.toFixed(1)}% Completed`;
            if (timerEl) timerEl.textContent = `${elapsed.toFixed(1)}s`;
            if (speedEl) speedEl.textContent = `⚡ ${(speedMBs + 12.4).toFixed(1)} MB/s`;
            if (etaEl) etaEl.textContent = pct >= 100 ? '✓ Completed' : `${etaSec.toFixed(1)}s remaining`;
        };

        const executeStep = async (desc, action, byteCost = 400000) => {
            currentStepNum++;
            transferredBytes += byteCost;
            if (statusLabel) statusLabel.textContent = desc;
            appendLog(desc, '#cbd5e0');
            updateMetrics();
            if (action) await action();
            await new Promise(r => setTimeout(r, 80 + Math.random() * 60));
        };

        // 2. Block Storage Partitioning & Format
        await executeStep('sfdisk /dev/nvme0n1: Writing GPT label (p1: EFI 512MB, p2: Root ext4 930GB, p3: Swap 4GB)...', () => {
            const coreDirs = [
                '/bin', '/sbin', '/boot', '/boot/grub', '/boot/efi',
                '/etc', '/etc/apt', '/etc/network',
                '/usr', '/usr/bin', '/usr/sbin', '/usr/lib', '/usr/local', '/usr/local/bin', '/usr/share', '/usr/share/applications',
                '/var', '/var/log', '/var/lib', '/var/lib/dpkg', '/var/lib/apt', '/var/lib/apt/lists', '/var/cache', '/var/cache/apt', '/var/cache/apt/archives', '/var/tmp',
                '/dev', '/proc', '/sys', '/tmp', '/run', '/mnt', '/media', '/opt', '/root'
            ];
            coreDirs.forEach(d => {
                if (!vfs.exists(d)) vfs.createDirectory(d);
            });

            // Populate core GNU binaries in /bin
            const binFiles = {
                bash: '#!/bin/bash\n# GNU Bourne-Again SHell binary',
                sh: '#!/bin/sh\n# POSIX shell binary',
                ls: '#!/bin/ls\n# List directory contents',
                cat: '#!/bin/cat\n# Concatenate files and print on standard output',
                grep: '#!/bin/grep\n# Pattern matching utility',
                cp: '#!/bin/cp\n# Copy files and directories',
                mv: '#!/bin/mv\n# Move and rename files',
                rm: '#!/bin/rm\n# Remove files and directories',
                mkdir: '#!/bin/mkdir\n# Make directories',
                rmdir: '#!/bin/rmdir\n# Remove empty directories',
                touch: '#!/bin/touch\n# Change file timestamps or create empty files',
                echo: '#!/bin/echo\n# Display a line of text',
                pwd: '#!/bin/pwd\n# Print name of current/working directory',
                uname: '#!/bin/uname\n# Print system information',
                date: '#!/bin/date\n# Print or set system date and time',
                whoami: '#!/bin/whoami\n# Print effective userid',
                id: '#!/bin/id\n# Print real and effective user and group IDs',
                ps: '#!/bin/ps\n# Report a snapshot of current processes',
                kill: '#!/bin/kill\n# Send a signal to a process',
                killall: '#!/bin/killall\n# Kill processes by name',
                ping: '#!/bin/ping\n# Send ICMP ECHO_REQUEST to network hosts',
                sed: '#!/bin/sed\n# Stream editor',
                awk: '#!/bin/awk\n# Pattern scanning and text processing language',
                find: '#!/bin/find\n# Search for files in a directory hierarchy',
                which: '#!/bin/which\n# Locate a command',
                tar: '#!/bin/tar\n# Archiving utility',
                gzip: '#!/bin/gzip\n# Compress or expand files',
                chmod: '#!/bin/chmod\n# Change file mode bits',
                chown: '#!/bin/chown\n# Change file owner and group',
                hostname: '#!/bin/hostname\n# Show or set system host name',
                df: '#!/bin/df\n# Report file system disk space usage',
                du: '#!/bin/du\n# Estimate file space usage',
                free: '#!/bin/free\n# Display amount of free and used memory in the system',
                uptime: '#!/bin/uptime\n# Tell how long the system has been running',
                dmesg: '#!/bin/dmesg\n# Print or control the kernel ring buffer',
                clear: '#!/bin/clear\n# Clear the terminal screen',
                sleep: '#!/bin/sleep\n# Delay for a specified amount of time'
            };

            for (const [name, content] of Object.entries(binFiles)) {
                vfs.writeFile(`/bin/${name}`, content);
            }

            // Populate core binaries in /sbin
            const sbinFiles = {
                reboot: '#!/sbin/reboot\n# Reboot the machine',
                shutdown: '#!/sbin/shutdown\n# Halt, power-off or reboot the machine',
                poweroff: '#!/sbin/poweroff\n# Power-off the machine',
                init: '#!/sbin/init\n# Systemd initialization daemon',
                ifconfig: '#!/sbin/ifconfig\n# Configure network interface parameters',
                ip: '#!/sbin/ip\n# Show / manipulate routing, devices, policy routing and tunnels',
                fdisk: '#!/sbin/fdisk\n# Manipulate disk partition table'
            };

            for (const [name, content] of Object.entries(sbinFiles)) {
                vfs.writeFile(`/sbin/${name}`, content);
            }

            // Populate /usr/bin utilities
            const usrBinFiles = {
                curl: '#!/usr/bin/curl\n# Transfer a URL',
                wget: '#!/usr/bin/wget\n# Non-interactive network downloader',
                python3: '#!/usr/bin/python3\n# Python interpreter',
                git: '#!/usr/bin/git\n# Revision control system',
                neofetch: '#!/usr/bin/neofetch\n# CLI system information tool',
                cmatrix: '#!/usr/bin/cmatrix\n# Matrix digital rain simulation',
                cowsay: '#!/usr/bin/cowsay\n# Configurable talking cow',
                sl: '#!/usr/bin/sl\n# Steam Locomotive display',
                diff: '#!/usr/bin/diff\n# Compare files line by line',
                stat: '#!/usr/bin/stat\n# Display file or file system status',
                wc: '#!/usr/bin/wc\n# Print newline, word, and byte counts',
                head: '#!/usr/bin/head\n# Output the first part of files',
                tail: '#!/usr/bin/tail\n# Output the last part of files',
                sort: '#!/usr/bin/sort\n# Sort lines of text files',
                uniq: '#!/usr/bin/uniq\n# Report or omit repeated lines',
                tree: '#!/usr/bin/tree\n# List contents of directories in a tree',
                top: '#!/usr/bin/top\n# Display Linux processes',
                htop: '#!/usr/bin/htop\n# Interactive process viewer',
                nano: '#!/usr/bin/nano\n# Nano easy-to-use text editor',
                vim: '#!/usr/bin/vim\n# Vi IMproved programmer text editor'
            };

            for (const [name, content] of Object.entries(usrBinFiles)) {
                vfs.writeFile(`/usr/bin/${name}`, content);
            }

            // Populate devices in /dev
            const devFiles = {
                null: '',
                zero: '',
                urandom: '',
                random: '',
                nvme0n1: 'BLOCK_DEVICE_NVME_RAW',
                nvme0n1p1: 'BLOCK_DEVICE_EFI_SYSTEM_PARTITION',
                nvme0n1p2: 'BLOCK_DEVICE_LINUX_ROOT_EXT4',
                nvme0n1p3: 'BLOCK_DEVICE_LINUX_SWAP',
                sda: 'BLOCK_DEVICE_USB_FLASH_DRIVE',
                sda1: 'BLOCK_DEVICE_USB_LIVE_ISO',
                tty: 'VIRTUAL_TELETYPE_CONSOLE'
            };

            for (const [name, content] of Object.entries(devFiles)) {
                vfs.writeFile(`/dev/${name}`, content);
            }
        }, 800000);

        await executeStep('mkfs.ext4 -F -O 64bit,dir_index,sparse_super -L "krypton-root" /dev/nvme0n1p2 (blocksize=4096)...', null, 1500000);
        await executeStep('mount -t ext4 -o rw,relatime,data=ordered /dev/nvme0n1p2 /mnt/target...', null, 400000);

        // 3. Extract Filesystem Manifest Chunks
        for (let i = 0; i < filesToExtract.length; i++) {
            const [path, content] = filesToExtract[i];
            await executeStep(`[${i + 1}/${filesToExtract.length}] Writing /mnt/target${path} (${(content ? content.length : 0)} B)...`, () => {
                vfs.writeFile(path, content);
            }, (content ? content.length * 100 : 80000));
        }

        // 4. Real Network Fetch of Deprecated Package Archives (.deb)
        let browserDeb = null;
        let clockDeb = null;

        try {
            appendLog('[ HTTP ] GET https://raw.githubusercontent.com/CreatorPoints/Krypton-Repo/main/apt/deprecated/kryp-browser.deb ...', '#00e5ff');
            browserDeb = await downloadWithMetrics(
                'https://raw.githubusercontent.com/CreatorPoints/Krypton-Repo/main/apt/deprecated/kryp-browser.deb',
                './apt/deprecated/kryp-browser.deb'
            );
            await idbStore.put('packages', { name: 'kryp-browser', data: browserDeb.text, sha256: browserDeb.sha256, size: browserDeb.size });
            appendLog(`[ HTTP ] 200 OK: kryp-browser.deb [SHA256: ${browserDeb.sha256.substring(0, 16)}...] cached in IndexedDB`, '#48bb78');
        } catch (e) {}

        try {
            appendLog('[ HTTP ] GET https://raw.githubusercontent.com/CreatorPoints/Krypton-Repo/main/apt/deprecated/clock.deb ...', '#00e5ff');
            clockDeb = await downloadWithMetrics(
                'https://raw.githubusercontent.com/CreatorPoints/Krypton-Repo/main/apt/deprecated/clock.deb',
                './apt/deprecated/clock.deb'
            );
            await idbStore.put('packages', { name: 'clock', data: clockDeb.text, sha256: clockDeb.sha256, size: clockDeb.size });
            appendLog(`[ HTTP ] 200 OK: clock.deb [SHA256: ${clockDeb.sha256.substring(0, 16)}...] cached in IndexedDB`, '#48bb78');
        } catch (e) {}

        // 5. Unpack Essential Core System Applications (Always Installed)
        await executeStep('dpkg -i /var/cache/apt/archives/krypton-settings.deb (Display & System Control)...', () => {
            vfs.writeFile('/usr/bin/krypton-settings', '#!/bin/bash\nexec /usr/lib/krypton-settings/index.js "$@"\n');
            vfs.writeFile('/usr/share/applications/settings.desktop', '[Desktop Entry]\nName=Settings\nExec=krypton-settings\nIcon=⚙️\nType=Application\nCategories=Settings;System;\nComment=Krypton Control Center\n');
        }, 1200000);

        await executeStep('dpkg -i /var/cache/apt/archives/krypton-taskmgr.deb (Process & Resource Monitor)...', () => {
            vfs.writeFile('/usr/bin/krypton-taskmgr', '#!/bin/bash\nexec /usr/lib/krypton-taskmgr/index.js "$@"\n');
            vfs.writeFile('/usr/share/applications/taskmgr.desktop', '[Desktop Entry]\nName=Task Manager\nExec=krypton-taskmgr\nIcon=📊\nType=Application\nCategories=System;Monitor;\nComment=Process & Performance Monitor\n');
        }, 1000000);

        await executeStep('dpkg -i /var/cache/apt/archives/krypton-filemgr.deb (VFS File Storage Explorer)...', () => {
            vfs.writeFile('/usr/bin/krypton-filemgr', '#!/bin/bash\nexec /usr/lib/krypton-filemgr/index.js "$@"\n');
            vfs.writeFile('/usr/share/applications/filemgr.desktop', '[Desktop Entry]\nName=File Manager\nExec=krypton-filemgr\nIcon=📁\nType=Application\nCategories=System;FileManager;\nComment=Virtual File System Browser\n');
        }, 1100000);

        // 5.1 Unpack Optional Recommended Applications (if selected)
        if (downloadRecommendedApps) {
            await executeStep('dpkg -i /var/cache/apt/archives/kryp-browser.deb (Web Navigator Alpha Legacy Edition)...', () => {
                vfs.writeFile('/usr/bin/kryp-browser', '#!/bin/bash\nexec /usr/bin/krypton-browser-alpha "$@"\n');
                vfs.writeFile('/usr/share/applications/browser.desktop', '[Desktop Entry]\nName=Web Navigator\nExec=krypton-browser\nIcon=🌐\nType=Application\nCategories=Network;WebBrowser;\nComment=Krypton Web Navigator Alpha\n');
            }, 1400000);

            await executeStep('dpkg -i /var/cache/apt/archives/clock.deb (Vintage Taskbar Clock & Panel Daemon)...', () => {
                vfs.writeFile('/usr/bin/clock', '#!/bin/bash\ndate\n');
                vfs.writeFile('/usr/share/applications/clock.desktop', '[Desktop Entry]\nName=System Clock\nExec=clock\nIcon=🕒\nType=Application\nCategories=Utility;Clock;\nComment=Vintage Taskbar Clock\n');
            }, 500000);

            await executeStep('dpkg -i /var/cache/apt/archives/krypton-notes.deb (Notes & Documentation Editor)...', () => {
                vfs.writeFile('/usr/bin/krypton-notes', '#!/bin/bash\nexec /usr/lib/krypton-notes/index.js "$@"\n');
                vfs.writeFile('/usr/share/applications/notes.desktop', '[Desktop Entry]\nName=Upgrade Notes\nExec=krypton-notes\nIcon=📝\nType=Application\nCategories=Utility;TextEditor;\nComment=System Upgrade Instructions\n');
            }, 700000);

            await executeStep('dpkg -i /var/cache/apt/archives/krypton-calculator.deb (Scientific Calculator)...', () => {
                vfs.writeFile('/usr/bin/krypton-calculator', '#!/bin/bash\nexec /usr/lib/krypton-calculator/index.js "$@"\n');
                vfs.writeFile('/usr/share/applications/calculator.desktop', '[Desktop Entry]\nName=Calculator\nExec=krypton-calculator\nIcon=🧮\nType=Application\nCategories=Utility;Calculator;\nComment=Scientific Calculator\n');
            }, 800000);
        }

        // 6. User Provisioning & Identity
        const effUser = userLogin.trim() || 'guest';
        const effHost = userHostname.trim() || 'krypton-station';

        await executeStep(`useradd -m -s /bin/bash -G sudo,adm,video,audio ${effUser}...`, () => {
            vfs.writeFile('/etc/hostname', `${effHost}\n`);
            vfs.writeFile('/etc/hosts', `127.0.0.1\tlocalhost\n127.0.1.1\t${effHost}\n\n::1     ip6-localhost ip6-loopback\n`);
            vfs.writeFile('/etc/passwd', `root:x:0:0:root:/root:/bin/bash\n${effUser}:x:1000:1000:${userName},,,:/home/${effUser}:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nbin:x:2:2:bin:/bin:/usr/sbin/nologin\nsys:x:3:3:sys:/dev:/usr/sbin/nologin\nnobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin\n`);
            vfs.writeFile('/etc/group', `root:x:0:\nadm:x:4:${effUser}\nsudo:x:27:${effUser}\naudio:x:29:${effUser}\nvideo:x:44:${effUser}\nplugdev:x:46:${effUser}\n${effUser}:x:1000:\n`);

            vfs.createDirectory(`/home/${effUser}`);
            vfs.createDirectory(`/home/${effUser}/Desktop`);
            vfs.createDirectory(`/home/${effUser}/Documents`);
            vfs.createDirectory(`/home/${effUser}/Downloads`);
            vfs.createDirectory(`/home/${effUser}/Pictures`);

            vfs.writeFile(`/home/${effUser}/.bashrc`, `export PATH=$PATH:/usr/local/bin\nalias ll='ls -la'\nalias la='ls -A'\nalias cls='clear'\n`);
            vfs.writeFile(`/home/${effUser}/.profile`, `if [ -f ~/.bashrc ]; then . ~/.bashrc; fi\n`);

            // Install Desktop Application Shortcuts
            vfs.writeFile(`/home/${effUser}/Desktop/terminal.desktop`, `[Desktop Entry]\nName=Terminal\nExec=terminal\nIcon=💻\nType=Application\nComment=GNU Bash Shell (Linux 2.0.0.14)\n`);
            vfs.writeFile(`/home/${effUser}/Desktop/browser.desktop`, `[Desktop Entry]\nName=Web Navigator\nExec=krypton-browser\nIcon=🌐\nType=Application\nComment=Krypton Web Navigator Alpha\n`);
            vfs.writeFile(`/home/${effUser}/Desktop/notes.desktop`, `[Desktop Entry]\nName=Upgrade Notes\nExec=krypton-notes\nIcon=📝\nType=Application\nComment=System Upgrade Instructions\n`);

            if (downloadRecommendedApps) {
                vfs.writeFile(`/home/${effUser}/Desktop/calculator.desktop`, `[Desktop Entry]\nName=Calculator\nExec=krypton-calculator\nIcon=🧮\nType=Application\nComment=Scientific Calculator\n`);
                vfs.writeFile(`/home/${effUser}/Desktop/filemgr.desktop`, `[Desktop Entry]\nName=File Manager\nExec=krypton-filemgr\nIcon=📁\nType=Application\nComment=Virtual Filesystem Browser\n`);
                vfs.writeFile(`/home/${effUser}/Desktop/taskmgr.desktop`, `[Desktop Entry]\nName=Task Manager\nExec=krypton-taskmgr\nIcon=📊\nType=Application\nComment=Process & Performance Monitor\n`);
                vfs.writeFile(`/home/${effUser}/Desktop/settings.desktop`, `[Desktop Entry]\nName=Settings\nExec=krypton-settings\nIcon=⚙️\nType=Application\nComment=Krypton Control Center\n`);
            }

            vfs.writeFile(`/home/${effUser}/Desktop/welcome_to_krypton.txt`, `=== Welcome to Krypton OS 0.1 Alpha ===\n\nUser: ${userName} (${effUser})\nWorkstation: ${effHost}\nStorage Target: Samsung SSD 980 PRO (/dev/nvme0n1p2)\nKernel: Linux 2.0.0.14-generic-krypton\n\nTo upgrade this system to the modern Linux 6.10 kernel and Krypton 1.0 LTS Desktop Suite:\nOpen Terminal and run:\n  sudo apt update && sudo apt upgrade\n`);
        }, 1200000);

        await executeStep('update-initramfs -c -k 2.0.0.14-generic-krypton (packing cpio modules)...', null, 2500000);
        await executeStep('grub-install --target=x86_64-efi --efi-directory=/mnt/target/boot/efi --bootloader-id=krypton /dev/nvme0n1...', null, 1000000);
        await executeStep('sync: Flushing virtual dirty pages to IndexedDB / localStorage and unmounting /mnt/target...', () => {
            const initialVersion = "0.1.0-alpha";
            const initialPrettyName = "Krypton OS 0.1 Alpha";

            vfs.writeFile('/etc/os-release', `NAME="KryptonOS"\nVERSION="${initialVersion}"\nID=krypton\nID_LIKE=debian\nPRETTY_NAME="${initialPrettyName}"\nVERSION_ID="0.1.0"\nVERSION_CODENAME=alpha\nHOME_URL="https://krypton-os.org/"\nSUPPORT_URL="https://krypton-os.org/support"\nBUG_REPORT_URL="https://bugs.krypton-os.org/"\n`);
            vfs.writeFile('/etc/issue', `${initialPrettyName} \\n \\l\n`);
            vfs.writeFile('/etc/motd', `\n=======================================================\n  Welcome to ${initialPrettyName} (Linux 2.0.0.14-generic-krypton)\n  * Base installation active on /dev/nvme0n1p2.\n  * Restricted Shell: Only 'sudo apt update && sudo apt upgrade' supported.\n  * Run 'sudo apt update && sudo apt upgrade' to upgrade to Linux 6.10.\n=======================================================\n`);
            
            if (!vfs.exists('/var/lib/dpkg')) {
                vfs.createDirectory('/var/lib');
                vfs.createDirectory('/var/lib/dpkg');
            }
            let initialDpkgStatus = `Package: base-files\nStatus: install ok installed\nPriority: required\nSection: admin\nInstalled-Size: 603\nMaintainer: Krypton Core Maintainers <packages@krypton-os.org>\nArchitecture: amd64\nVersion: 0.1.0-alpha\nDescription: KryptonOS Core System Files & OS Identity Manifest\n\nPackage: linux-image-2.0.0.14-generic-krypton\nStatus: install ok installed\nPriority: optional\nSection: kernel\nInstalled-Size: 512\nMaintainer: Krypton Kernel Team <kernel@krypton-os.org>\nArchitecture: amd64\nVersion: 2.0.0.14-1\nDescription: Linux Kernel Image 2.0.0.14 Vintage Subsystem\n\nPackage: krypton-browser\nStatus: install ok installed\nPriority: optional\nSection: web/browsers\nInstalled-Size: 1024\nMaintainer: Krypton Maintainers <packages@krypton-os.org>\nArchitecture: amd64\nVersion: 0.1.0-alpha\nDescription: Web Navigator Alpha Edition\n\nPackage: krypton-notes\nStatus: install ok installed\nPriority: optional\nSection: editors/text\nInstalled-Size: 512\nMaintainer: Krypton Maintainers <packages@krypton-os.org>\nArchitecture: amd64\nVersion: 0.1.0-alpha\nDescription: Upgrade Notes & System Documentation\n\n`;

            if (downloadRecommendedApps) {
                initialDpkgStatus += `Package: krypton-calculator\nStatus: install ok installed\nPriority: optional\nSection: math/calculators\nInstalled-Size: 512\nMaintainer: Krypton Maintainers <packages@krypton-os.org>\nArchitecture: amd64\nVersion: 0.1.0-alpha\nDescription: Scientific Calculator\n\nPackage: krypton-filemgr\nStatus: install ok installed\nPriority: optional\nSection: utils\nInstalled-Size: 512\nMaintainer: Krypton Maintainers <packages@krypton-os.org>\nArchitecture: amd64\nVersion: 0.1.0-alpha\nDescription: Virtual File Manager\n\nPackage: krypton-taskmgr\nStatus: install ok installed\nPriority: optional\nSection: admin\nInstalled-Size: 512\nMaintainer: Krypton Maintainers <packages@krypton-os.org>\nArchitecture: amd64\nVersion: 0.1.0-alpha\nDescription: System Task Manager\n\nPackage: krypton-settings\nStatus: install ok installed\nPriority: optional\nSection: admin\nInstalled-Size: 512\nMaintainer: Krypton Maintainers <packages@krypton-os.org>\nArchitecture: amd64\nVersion: 0.1.0-alpha\nDescription: Control Center Settings\n\n`;
            }
            vfs.writeFile('/var/lib/dpkg/status', initialDpkgStatus);
            vfs.saveFileSystem();

            localStorage.setItem('krypton_primary_user', effUser);
            localStorage.setItem('krypton_primary_password', userPassword);
            localStorage.setItem('krypton_require_password', requirePassword ? 'true' : 'false');
            localStorage.setItem('krypton_hostname', effHost);
            localStorage.setItem('krypton_os_version', initialVersion);
            localStorage.setItem('krypton_os_installed', 'true');
            localStorage.setItem('krypton_selected_recommended_apps', downloadRecommendedApps ? 'true' : 'false');
            localStorage.removeItem('krypton_upgraded_lts');
        }, 800000);

        // Completion
        currentStepNum = totalSteps;
        updateMetrics();
        if (fillEl) fillEl.style.width = '100%';
        if (percentEl) percentEl.textContent = '100.0% Completed';
        if (speedEl) speedEl.textContent = '✓ 0.0 MB/s (Done)';
        if (etaEl) etaEl.textContent = '0.0s (Finished)';
        if (statusLabel) statusLabel.textContent = `🎉 Krypton OS 0.1 Alpha Installed successfully!`;

        appendLog(`[ SUCCESS ] Krypton OS 0.1 Alpha rootfs deployed! Storage synchronized.`, '#ffff55', true);
        appendLog(`[ SYSTEM ] Installation finished. Prompting user to restart system...`, '#00e5ff', true);

        sound.playSuccess();
        story.showToast('🎉 Installation Complete!', `Krypton OS 0.1 Alpha is installed. Restart to finish setup.`, 'success');

        // Prompt user to reboot to finish installation
        setTimeout(() => {
            showInstallationCompleteDialog();
        }, 800);
    };

    render();

    wm.createWindow({
        id: 'installer',
        title: 'Install Krypton OS (Calamares Installer)',
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
