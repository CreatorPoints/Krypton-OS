/* ==========================================================================
   KryptonOS - Calamares / Ubiquity Style Live Network Installer Wizard Engine
   ========================================================================== */

import { wm } from '../wm.js';
import { sound } from '../sound.js';
import { story } from '../story.js';
import { vfs } from '../fs.js';
import { boot } from '../boot.js';

export function openInstallerWizard() {
    if (wm.windows.has('installer')) {
        wm.focusWindow('installer');
        return;
    }

    let currentStep = 0;
    let selectedLang = 'English (US)';
    let selectedTz = 'UTC+05:30 - Kolkata (India)';
    let connectedWifi = 'pass-1234ABC';
    let userName = 'Shrestangsu Dutta';
    let userHostname = 'krypton-station';
    let userLogin = 'shrestangsu';
    let userPassword = '';
    let confirmPassword = '';
    let autoLogin = true;
    let installInProgress = false;
    let installTimerInterval = null;

    // Google Account Identity (Mandatory for Cloud-Backed Storage Buckets & Persistent VFS)
    let savedGoogleJson = localStorage.getItem('krypton_google_account');
    let googleAccount = null;
    try {
        if (savedGoogleJson) googleAccount = JSON.parse(savedGoogleJson);
    } catch (e) {}

    if (googleAccount) {
        userName = googleAccount.name || userName;
        userLogin = (googleAccount.email ? googleAccount.email.split('@')[0] : 'guest').toLowerCase().replace(/[^a-z0-9_]/g, '');
        userHostname = `${userLogin}-station`;
    }

    const steps = [
        { id: 'lang', name: 'Language' },
        { id: 'timezone', name: 'Timezone' },
        { id: 'network', name: 'Network' },
        { id: 'user', name: 'User & Google Auth' },
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
                <div class="step-subtitle">Connect to a wireless or wired network to fetch system packages from GitHub upstream.</div>
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
                <div class="step-title">Who are you? (User & Account Setup)</div>
                <div class="step-subtitle">Configure your workstation account. You can optionally link a Google Account.</div>

                <div style="margin-bottom: 14px;">
                    ${googleAccount ? `
                        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0, 229, 255, 0.08); border: 1px solid #00e5ff; border-radius: 8px; padding: 12px 16px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #4285F4, #34A853); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                                    ${googleAccount.picture ? `<img src="${googleAccount.picture}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : (googleAccount.name ? googleAccount.name[0].toUpperCase() : 'G')}
                                </div>
                                <div>
                                    <div style="font-weight: 700; color: #fff; font-size: 14px;">${googleAccount.name || userName}</div>
                                    <div style="font-size: 12px; color: #00e5ff;">${googleAccount.email}</div>
                                    <div style="font-size: 11px; color: #a0aec0; margin-top: 2px;">✓ Google Identity Linked</div>
                                </div>
                            </div>
                            <button id="wiz-google-unlink-btn" style="padding: 6px 12px; font-size: 11px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.2); color: #cbd5e0; border-radius: 4px; cursor: pointer;">Change Account</button>
                        </div>
                    ` : `
                        <div style="background: rgba(66, 133, 244, 0.08); border: 1px dashed #4285F4; border-radius: 8px; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 260px;">
                                <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: #fff; font-size: 13px; margin-bottom: 2px;">
                                    <span>🔗</span> <strong>Optional: Connect Google Account</strong>
                                </div>
                                <div style="font-size: 11px; color: #a0aec0; line-height: 1.4;">
                                    Connect your Google account for user identity integration across sessions.
                                </div>
                            </div>
                            <button id="wiz-google-signin-btn" style="display: inline-flex; align-items: center; gap: 8px; background: #ffffff; color: #3c4043; font-weight: 600; font-size: 12px; padding: 7px 14px; border-radius: 6px; border: 1px solid #dadce0; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: all 0.2s; white-space: nowrap;">
                                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                                Sign in with Google
                            </button>
                        </div>
                    `}
                </div>

                <div class="user-form-card">
                    <div class="user-form-row">
                        <label class="user-form-label">Full Name:</label>
                        <input type="text" class="user-form-input" id="wiz-realname-input" value="${userName}" placeholder="e.g. Shrestangsu Dutta" autocomplete="off" spellcheck="false">
                    </div>
                    <div class="user-form-row">
                        <label class="user-form-label">Workstation Hostname:</label>
                        <input type="text" class="user-form-input" id="wiz-hostname-input" value="${userHostname}" placeholder="e.g. krypton-station" autocomplete="off" spellcheck="false">
                        <span class="user-form-hint">Machine identifier used for terminal prompts (<code>${userLogin}@${userHostname}</code>).</span>
                    </div>
                    <div class="user-form-row">
                        <label class="user-form-label">Linux Username:</label>
                        <input type="text" class="user-form-input" id="wiz-username-input" value="${userLogin}" placeholder="e.g. guest" autocomplete="off" spellcheck="false">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="user-form-row">
                            <label class="user-form-label">Password <span style="font-weight: normal; color: #888;">(optional)</span>:</label>
                            <input type="password" class="user-form-input" id="wiz-password-input" value="${userPassword}" placeholder="Password..." autocomplete="off">
                        </div>
                        <div class="user-form-row">
                            <label class="user-form-label">Confirm Password:</label>
                            <input type="password" class="user-form-input" id="wiz-confirm-pass-input" value="${confirmPassword}" placeholder="Confirm password..." autocomplete="off">
                        </div>
                    </div>
                    <div style="margin-top: 6px;">
                        <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #e0e0e0; cursor: pointer;">
                            <input type="checkbox" id="wiz-autologin-toggle" ${autoLogin ? 'checked' : ''}>
                            Log in automatically on system startup
                        </label>
                    </div>
                </div>
            `;
        } else if (stepIdx === 4) {
            return `
                <div class="step-title">Select Destination Storage Disk</div>
                <div class="step-subtitle">Choose the target NVMe / SSD drive where KryptonOS will be installed.</div>

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
                    ⚠️ <strong>Warning:</strong> Installation will format target partition <code>/dev/nvme0n1p2</code> and install genuine upstream KryptonOS 1.0 LTS.
                </div>
            `;
        } else if (stepIdx === 5) {
            return `
                <div class="step-title">Installing KryptonOS 1.0 LTS (Real Stream from Repo)</div>
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

                    <div class="installer-terminal-logs" id="inst-term-logs">
                        <div class="log-line">[  0.00s ] Initializing KryptonOS Real Stream Installer Engine...</div>
                    </div>
                </div>
            `;
        }
    };

    const showGoogleAuthModal = () => {
        const dialog = document.createElement('div');
        dialog.style.cssText = 'display: flex; flex-direction: column; gap: 14px; color: #000; font-family: "Outfit", sans-serif;';

        dialog.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
                <svg width="24" height="24" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                <div style="font-weight: 700; font-size: 15px; color: #1a202c;">Sign in with Google Account</div>
            </div>
            <div style="font-size: 12px; color: #4a5568;">
                Enter your Google Account email to authenticate and initialize your cloud persistent storage bucket:
            </div>
            <input type="email" id="google-email-input" value="shrestangsu.dutta@gmail.com" placeholder="name@gmail.com" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 13px; font-family: inherit;">
            <input type="text" id="google-name-input" value="Shrestangsu Dutta" placeholder="Display Name" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 13px; font-family: inherit;">
            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;">
                <button id="google-btn-cancel" style="padding: 6px 14px; background: #edf2f7; border: 1px solid #cbd5e0; border-radius: 6px; cursor: pointer; font-size: 12px;">Cancel</button>
                <button id="google-btn-auth" style="padding: 6px 16px; background: #4285F4; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">Connect Google ID</button>
            </div>
        `;

        wm.createWindow({
            id: 'google-auth-dialog',
            title: 'Google Account Authentication',
            icon: '🔒',
            width: 390,
            height: 260,
            content: dialog
        });

        dialog.querySelector('#google-btn-cancel').addEventListener('click', () => wm.closeWindow('google-auth-dialog'));
        dialog.querySelector('#google-btn-auth').addEventListener('click', () => {
            const email = dialog.querySelector('#google-email-input').value.trim();
            const name = dialog.querySelector('#google-name-input').value.trim() || 'Google User';

            if (!email || !email.includes('@')) {
                story.showToast('Validation Error', 'Please enter a valid Google Account email address.', 'error');
                return;
            }

            googleAccount = {
                email: email,
                name: name,
                uid: `google_oauth2_${Math.random().toString(36).substring(2, 12)}`,
                linked_at: new Date().toISOString()
            };

            userName = name;
            userLogin = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
            userHostname = `${userLogin}-station`;

            localStorage.setItem('krypton_google_account', JSON.stringify(googleAccount));
            localStorage.setItem('krypton_google_email', email);

            wm.closeWindow('google-auth-dialog');
            story.showToast('✓ Google Account Connected', `Authenticated as ${email}. Cloud storage bucket configured!`, 'success');
            render();
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

                if (ssid === 'pass-1234ABC') {
                    showWifiPasswordWindow(ssid);
                } else if (!locked) {
                    connectedWifi = ssid;
                    story.showToast('Wi-Fi Connected', `Connected to open network "${ssid}".`, 'success');
                    render();
                } else {
                    story.showToast('Security Error', `Incorrect network security settings for "${ssid}".`, 'error');
                }
            });
        });

        // Step 3: Google Auth & User Inputs
        const googleBtn = content.querySelector('#wiz-google-signin-btn');
        if (googleBtn) googleBtn.addEventListener('click', showGoogleAuthModal);

        const unlinkBtn = content.querySelector('#wiz-google-unlink-btn');
        if (unlinkBtn) {
            unlinkBtn.addEventListener('click', () => {
                googleAccount = null;
                localStorage.removeItem('krypton_google_account');
                localStorage.removeItem('krypton_google_email');
                render();
            });
        }

        const realnameInput = content.querySelector('#wiz-realname-input');
        const hostnameInput = content.querySelector('#wiz-hostname-input');
        const usernameInput = content.querySelector('#wiz-username-input');
        const passwordInput = content.querySelector('#wiz-password-input');
        const confirmPassInput = content.querySelector('#wiz-confirm-pass-input');
        const autologinToggle = content.querySelector('#wiz-autologin-toggle');

        if (realnameInput) realnameInput.addEventListener('input', (e) => { userName = e.target.value; });
        if (hostnameInput) hostnameInput.addEventListener('input', (e) => { userHostname = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''); e.target.value = userHostname; });
        if (usernameInput) usernameInput.addEventListener('input', (e) => { userLogin = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''); e.target.value = userLogin; });
        if (passwordInput) passwordInput.addEventListener('input', (e) => { userPassword = e.target.value; });
        if (confirmPassInput) confirmPassInput.addEventListener('input', (e) => { confirmPassword = e.target.value; });
        if (autologinToggle) autologinToggle.addEventListener('change', (e) => { autoLogin = e.target.checked; });

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
                        userLogin = 'guest';
                    }
                    if (!userHostname.trim()) {
                        userHostname = 'krypton-station';
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
                story.showToast('Wi-Fi Connected', `✓ Connected to "${ssid}" successfully!`, 'success');
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
                ⚠️ Confirm Disk Formatting & Upstream Installation
            </div>
            <div style="font-size: 13px; color: #222;">
                Write upstream KryptonOS rootfs image to <strong>/dev/nvme0n1</strong>?<br>
                Target drive: <em>Samsung SSD 980 PRO 1TB</em>.<br>
                User: <strong>${userLogin}</strong> (${userName}) • Google: <strong>${googleAccount ? googleAccount.email : 'None'}</strong>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
                <button id="disk-btn-cancel" style="padding: 6px 14px; background: #c0c0c0; border-top: 2px solid #fff; border-left: 2px solid #fff; border-right: 2px solid #000; border-bottom: 2px solid #000; cursor: pointer; font-size: 12px;">Cancel</button>
                <button id="disk-btn-confirm" style="padding: 6px 14px; background: #c0c0c0; border-top: 2px solid #fff; border-left: 2px solid #fff; border-right: 2px solid #000; border-bottom: 2px solid #000; font-weight: bold; color: #cc0000; cursor: pointer; font-size: 12px;">▶ Erase & Install</button>
            </div>
        `;

        wm.createWindow({
            id: 'disk-confirm-dialog',
            title: 'Confirm Installation Target',
            icon: '⚠️',
            width: 440,
            height: 230,
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
        d.style.cssText = 'padding: 16px; color: #000; font-family: "Outfit", sans-serif; font-size: 13px; line-height: 1.5;';
        d.innerHTML = `
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; color: #1a202c;">${title}</div>
            <div style="color: #4a5568; margin-bottom: 16px;">${msg}</div>
            <div style="display: flex; justify-content: flex-end;">
                <button id="notice-ok-btn" style="padding: 6px 16px; background: #00e5ff; color: #000; font-weight: 700; border: none; border-radius: 4px; cursor: pointer;">OK</button>
            </div>
        `;
        wm.createWindow({
            id: 'installer-notice',
            title: title,
            icon: 'ℹ️',
            width: 360,
            height: 180,
            content: d
        });
        d.querySelector('#notice-ok-btn').addEventListener('click', () => wm.closeWindow('installer-notice'));
    };

    // =========================================================================
    // REAL STREAMING INSTALLATION ENGINE (FETCHES ROOTFS FROM KRYPTON-REPO)
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

        appendLog('Establishing TLS 1.3 socket to https://raw.githubusercontent.com/CreatorPoints/Krypton-Repo/main/Os/alpha/...', '#00e5ff');

        // Fetch genuine OS RootFS payload from Krypton-Repo/Os/alpha
        let rootfsPayload = null;
        try {
            const res = await fetch('https://raw.githubusercontent.com/CreatorPoints/Krypton-Repo/main/Os/alpha/rootfs.json');
            if (res.ok) {
                rootfsPayload = await res.json();
                appendLog('HTTP/2 200 OK: Synchronized Os/alpha/rootfs.json image from Krypton-Repo.', '#48bb78');
            }
        } catch (err) {
            appendLog('Warning: Upstream mirror offline/unreachable, failing over to local /Os/alpha/rootfs.json repository cache...', '#ecc94b');
        }

        if (!rootfsPayload) {
            try {
                const localRes = await fetch('./Os/alpha/rootfs.json');
                if (localRes.ok) {
                    rootfsPayload = await localRes.json();
                    appendLog('Local archive verified: /Os/alpha/rootfs.json (Krypton OS 0.1 Alpha image loaded).', '#48bb78');
                }
            } catch (e) {}
        }

        const filesToExtract = (rootfsPayload && rootfsPayload.files) ? Object.entries(rootfsPayload.files) : [
            ['/boot/grub/grub.cfg', '# GRUB 2.06\nset default=0\nmenuentry "Krypton OS 0.1 Alpha" { linux /boot/vmlinuz-6.10.0-krypton-generic root=UUID=7f8a-99b2-krypton ro quiet splash\ninitrd /boot/initrd.img-6.10.0-krypton-generic\n}\n'],
            ['/boot/vmlinuz-6.10.0-krypton-generic', 'ELF 64-bit LSB executable, x86-64, Linux 6.10.0-krypton-generic'],
            ['/boot/initrd.img-6.10.0-krypton-generic', 'ASCII cpio archive (SVR4 with CRC), initial ramdisk rootfs image'],
            ['/etc/os-release', 'NAME="KryptonOS"\nVERSION="0.1.0-alpha"\nID=krypton\nID_LIKE=debian\nPRETTY_NAME="Krypton OS 0.1 Alpha"\nVERSION_ID="0.1.0"\nVERSION_CODENAME=alpha\nHOME_URL="https://krypton-os.org/"\nSUPPORT_URL="https://krypton-os.org/support"\nBUG_REPORT_URL="https://bugs.krypton-os.org/"\n'],
            ['/etc/fstab', 'UUID=7f8a-99b2-krypton / ext4 errors=remount-ro 0 1\n'],
            ['/etc/apt/sources.list', 'deb https://deb.krypton-os.org/krypton beryllium main contrib non-free\ndeb https://raw.githubusercontent.com/CreatorPoints/Krypton-Repo/main/apt/ beryllium main\n']
        ];

        const totalSteps = filesToExtract.length + 12;
        let currentStepNum = 0;
        let totalBytesCalculated = filesToExtract.reduce((acc, [, val]) => acc + (val ? val.length : 100), 0) + (1024 * 1024 * 38);
        let transferredBytes = 0;

        const updateMetrics = () => {
            const elapsed = Math.max(0.1, (Date.now() - startTime) / 1000);
            const pct = Math.min(100, (currentStepNum / totalSteps) * 100);
            const speedBytesPerSec = transferredBytes / elapsed;
            const speedMBs = speedBytesPerSec / (1024 * 1024);
            const remainingBytes = Math.max(0, totalBytesCalculated - transferredBytes);
            const etaSec = speedBytesPerSec > 0 ? (remainingBytes / speedBytesPerSec) : 0;

            if (fillEl) fillEl.style.width = `${pct.toFixed(1)}%`;
            if (percentEl) percentEl.textContent = `${pct.toFixed(1)}% Completed`;
            if (timerEl) timerEl.textContent = `${elapsed.toFixed(1)}s`;
            if (speedEl) speedEl.textContent = `⚡ ${(speedMBs + 85.0).toFixed(1)} MB/s`;
            if (etaEl) etaEl.textContent = pct >= 100 ? '✓ Completed' : `${etaSec.toFixed(1)}s remaining`;
        };

        const executeStep = async (desc, action, byteCost = 500000) => {
            currentStepNum++;
            transferredBytes += byteCost;
            if (statusLabel) statusLabel.textContent = desc;
            appendLog(desc, '#cbd5e0');
            updateMetrics();
            if (action) await action();
            await new Promise(r => setTimeout(r, 90 + Math.random() * 80));
        };

        // 1. Partition & Mount
        await executeStep('sfdisk /dev/nvme0n1: Writing GPT label (p1: EFI 512MB, p2: Root ext4 930GB, p3: Swap 4GB)...', () => {
            vfs.createDirectory('/boot');
            vfs.createDirectory('/boot/grub');
            vfs.createDirectory('/etc');
            vfs.createDirectory('/etc/apt');
            vfs.createDirectory('/var');
            vfs.createDirectory('/var/log');
            vfs.createDirectory('/var/lib');
            vfs.createDirectory('/var/lib/dpkg');
            vfs.createDirectory('/var/lib/apt');
            vfs.createDirectory('/var/lib/apt/lists');
            vfs.createDirectory('/usr');
            vfs.createDirectory('/usr/bin');
            vfs.createDirectory('/usr/share');
            vfs.createDirectory('/usr/share/applications');
        }, 1000000);

        await executeStep('mkfs.ext4 -F -O 64bit -L "krypton-root" /dev/nvme0n1p2 (blocksize=4096)...', null, 2000000);
        await executeStep('mount -t ext4 /dev/nvme0n1p2 /mnt/target...', null, 500000);

        // 2. Stream Extract each real file from Os/alpha
        for (const [path, content] of filesToExtract) {
            await executeStep(`GET Krypton-Repo/Os/alpha:${path} -> extract /mnt/target${path}`, () => {
                vfs.writeFile(path, content);
            }, (content ? content.length * 150 : 200000));
        }

        // 3. Install Deprecated Alpha Packages (/apt/deprecated/kryp-browser.deb, /apt/deprecated/clock.deb)
        await executeStep('dpkg -i /apt/deprecated/kryp-browser.deb (Krypton Web Navigator 0.1 Alpha)...', () => {
            vfs.writeFile('/usr/bin/kryp-browser', '#!/bin/bash\nexec /usr/bin/krypton-browser-alpha "$@"\n');
            vfs.writeFile('/usr/share/applications/kryp-browser.desktop', '[Desktop Entry]\nName=Web Navigator\nExec=kryp-browser\nIcon=🌐\nType=Application\nCategories=Network;WebBrowser;\nComment=Krypton Alpha Web Browser\n');
        }, 1200000);

        await executeStep('dpkg -i /apt/deprecated/clock.deb (Vintage Taskbar Clock & Panel Daemon)...', () => {
            vfs.writeFile('/usr/bin/clock', '#!/bin/bash\ndate\n');
            vfs.writeFile('/usr/share/applications/clock.desktop', '[Desktop Entry]\nName=System Clock\nExec=clock\nIcon=🕒\nType=Application\nCategories=Utility;Clock;\nComment=Vintage Taskbar Clock\n');
        }, 800000);

        // 4. User & Google Cloud Persistent Storage Account Provisioning
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
            vfs.writeFile(`/home/${effUser}/Desktop/welcome_to_krypton.txt`, `=== Welcome to Krypton OS 0.1 Alpha ===\n\nUser: ${userName} (${effUser})\nWorkstation: ${effHost}\nStorage Target: Samsung SSD 980 PRO (/dev/nvme0n1p2)\n\nTo upgrade this system to the modern Krypton 1.0 LTS Desktop Suite:\nOpen Terminal and run:\n  sudo apt update && sudo apt upgrade\n`);
        }, 1500000);

        await executeStep('update-initramfs -c -k 6.10.0-krypton-generic (packing cpio modules)...', null, 3000000);
        await executeStep('grub-install --target=x86_64-efi --efi-directory=/mnt/target/boot/efi /dev/nvme0n1...', null, 1200000);
        await executeStep('sync: Flushing VFS dirty pages and unmounting /mnt/target...', () => {
            const initialVersion = "0.1.0-alpha";
            const initialPrettyName = "Krypton OS 0.1 Alpha";

            vfs.writeFile('/etc/os-release', `NAME="KryptonOS"\nVERSION="${initialVersion}"\nID=krypton\nID_LIKE=debian\nPRETTY_NAME="${initialPrettyName}"\nVERSION_ID="0.1.0"\nVERSION_CODENAME=alpha\nHOME_URL="https://krypton-os.org/"\nSUPPORT_URL="https://krypton-os.org/support"\nBUG_REPORT_URL="https://bugs.krypton-os.org/"\n`);
            vfs.writeFile('/etc/issue', `${initialPrettyName} \\n \\l\n`);
            vfs.writeFile('/etc/motd', `\n=======================================================\n  Welcome to ${initialPrettyName} (Linux 6.10.0-generic)\n  * Base installation active on /dev/nvme0n1p2.\n  * To upgrade to modern Krypton 1.0 LTS Desktop Suite:\n    sudo apt update && sudo apt upgrade\n=======================================================\n`);
            vfs.saveFileSystem();

            localStorage.setItem('krypton_primary_user', effUser);
            localStorage.setItem('krypton_hostname', effHost);
            localStorage.setItem('krypton_os_version', initialVersion);
            localStorage.setItem('krypton_os_installed', 'true');
            localStorage.removeItem('krypton_upgraded_lts');
            if (googleAccount) {
                localStorage.setItem('krypton_google_account', JSON.stringify(googleAccount));
                localStorage.setItem('krypton_google_email', googleAccount.email);
            }
        }, 800000);

        // Completion
        currentStepNum = totalSteps;
        updateMetrics();
        if (fillEl) fillEl.style.width = '100%';
        if (percentEl) percentEl.textContent = '100.0% Completed';
        if (speedEl) speedEl.textContent = '✓ 0.0 MB/s (Done)';
        if (etaEl) etaEl.textContent = '0.0s (Finished)';
        if (statusLabel) statusLabel.textContent = `🎉 Krypton OS 0.1 Alpha Installed successfully!`;

        appendLog(`[ SUCCESS ] Krypton OS 0.1 Alpha rootfs deployed! Unmounting /mnt/target...`, '#ffff55', true);
        appendLog(`[ SYSTEM ] Invoking "sudo reboot" in 2.5 seconds...`, '#00e5ff', true);

        sound.playSuccess();
        story.showToast('🎉 Installation Complete!', `Krypton OS 0.1 Alpha installed. Automatically rebooting...`, 'success');

        // Automatic sudo reboot call with broadcast message
        setTimeout(() => {
            wm.closeWindow('installer');
            boot.triggerSystemRebootBroadcast('The system is going down for reboot NOW! (Krypton OS 0.1 Alpha Deployment)');
        }, 2500);
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
