/* ==========================================================================
   KryptonOS - Clock, World Time, Stopwatch & Countdown Timer Subsystem
   ========================================================================== */

import { wm } from '../wm.js';
import { sound } from '../sound.js';
import { story } from '../story.js';

export function openClockWindow(defaultTab = 'world') {
    if (wm.windows.has('krypton-clock')) {
        wm.focusWindow('krypton-clock');
        return;
    }

    const content = document.createElement('div');
    content.className = 'clock-app-container';
    content.style.cssText = 'display: flex; flex-direction: column; height: 100%; background: #0b0f19; color: #f8fafc; font-family: "Outfit", sans-serif; overflow: hidden; user-select: none;';

    content.innerHTML = `
        <!-- Top Nav Navigation Tabs -->
        <div style="display: flex; background: #0f172a; border-bottom: 1px solid #1e293b; padding: 6px 12px; gap: 8px;">
            <button class="clock-tab-btn active" data-tab="world" style="padding: 8px 16px; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                🌐 World Clock
            </button>
            <button class="clock-tab-btn" data-tab="stopwatch" style="padding: 8px 16px; background: transparent; color: #94a3b8; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                ⏱️ Stopwatch
            </button>
            <button class="clock-tab-btn" data-tab="timer" style="padding: 8px 16px; background: transparent; color: #94a3b8; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                ⏳ Timer
            </button>
            <button class="clock-tab-btn" data-tab="alarms" style="padding: 8px 16px; background: transparent; color: #94a3b8; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                ⏰ Alarms
            </button>
        </div>

        <!-- Viewport Panels -->
        <div id="clock-viewport" style="flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column;">
            <!-- Tab contents dynamically mounted below -->
        </div>
    `;

    const viewport = content.querySelector('#clock-viewport');
    const tabBtns = content.querySelectorAll('.clock-tab-btn');
    let currentTab = defaultTab;

    // Timers & State
    let worldClockInterval = null;
    let stopwatchInterval = null;
    let timerCountdownInterval = null;

    // Stopwatch State
    let swStartTime = 0;
    let swElapsedTime = 0;
    let swIsRunning = false;
    let swLaps = [];

    // Timer State
    let timerTotalSeconds = 300; // default 5 minutes
    let timerRemainingSeconds = 300;
    let timerIsRunning = false;

    // Alarms State
    let alarmsList = JSON.parse(localStorage.getItem('krypton_alarms') || '[]');
    if (alarmsList.length === 0) {
        alarmsList = [
            { id: 1, label: 'Morning Wakeup', time: '07:30', enabled: true },
            { id: 2, label: 'Kernel Sync Standup', time: '10:00', enabled: false }
        ];
    }

    // World Clock Cities List
    const worldCities = [
        { city: 'London', tz: 'Europe/London', country: 'United Kingdom', flag: '🇬🇧' },
        { city: 'New York', tz: 'America/New_York', country: 'United States', flag: '🇺🇸' },
        { city: 'Tokyo', tz: 'Asia/Tokyo', country: 'Japan', flag: '🇯🇵' },
        { city: 'Kolkata', tz: 'Asia/Kolkata', country: 'India', flag: '🇮🇳' },
        { city: 'San Francisco', tz: 'America/Los_Angeles', country: 'United States', flag: '🇺🇸' },
        { city: 'Berlin', tz: 'Europe/Berlin', country: 'Germany', flag: '🇩🇪' },
        { city: 'Sydney', tz: 'Australia/Sydney', country: 'Australia', flag: '🇦🇺' },
        { city: 'Dubai', tz: 'Asia/Dubai', country: 'United Arab Emirates', flag: '🇦🇪' }
    ];

    /* --------------------------------------------------------------------------
       1. WORLD CLOCK TAB
       -------------------------------------------------------------------------- */
    function renderWorldClockTab() {
        clearInterval(worldClockInterval);

        viewport.innerHTML = `
            <!-- Primary Local Hero Display -->
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid #334155; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 16px rgba(0,0,0,0.3); margin-bottom: 20px;">
                <div>
                    <div style="font-size: 13px; color: #38bdf8; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                        📍 Local System Station
                    </div>
                    <div id="local-clock-digits" style="font-size: 38px; font-weight: 800; font-family: 'Fira Code', monospace; color: #ffffff; letter-spacing: 2px;">
                        00:00:00
                    </div>
                    <div id="local-clock-date" style="font-size: 14px; color: #94a3b8; margin-top: 4px;">
                        Loading date...
                    </div>
                </div>
                <div style="text-align: right;">
                    <div id="local-clock-tz-name" style="font-size: 13px; background: rgba(56,189,248,0.15); border: 1px solid rgba(56,189,248,0.3); color: #38bdf8; padding: 4px 10px; border-radius: 20px; font-weight: 600;">
                        ${Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
                        NTP Synced (krypton-ntpd)
                    </div>
                </div>
            </div>

            <!-- Global Cities Grid -->
            <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <span>Major Global Timezones</span>
                <span style="font-size: 12px; color: #64748b; font-weight: normal;">Live 1-second interval sync</span>
            </div>

            <div id="world-cities-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;">
                <!-- Filled in tick -->
            </div>
        `;

        const digitsEl = viewport.querySelector('#local-clock-digits');
        const dateEl = viewport.querySelector('#local-clock-date');
        const gridEl = viewport.querySelector('#world-cities-grid');

        const updateWorldClocks = () => {
            const now = new Date();
            if (digitsEl) digitsEl.textContent = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            if (dateEl) dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            if (gridEl) {
                gridEl.innerHTML = worldCities.map(c => {
                    let timeStr = '00:00:00';
                    let dateSub = '';
                    try {
                        timeStr = new Intl.DateTimeFormat('en-US', { timeZone: c.tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
                        dateSub = new Intl.DateTimeFormat('en-US', { timeZone: c.tz, weekday: 'short', month: 'short', day: 'numeric' }).format(now);
                    } catch (e) {}

                    return `
                        <div style="background: #131d31; border: 1px solid #1e293b; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.15s ease;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-weight: 700; font-size: 14px; color: #ffffff;">${c.flag} ${c.city}</span>
                                <span style="font-size: 11px; color: #64748b;">${c.country}</span>
                            </div>
                            <div style="font-size: 22px; font-weight: 700; color: #38bdf8; font-family: 'Fira Code', monospace;">
                                ${timeStr}
                            </div>
                            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
                                ${dateSub} • ${c.tz}
                            </div>
                        </div>
                    `;
                }).join('');
            }
        };

        updateWorldClocks();
        worldClockInterval = setInterval(updateWorldClocks, 1000);
    }

    /* --------------------------------------------------------------------------
       2. STOPWATCH TAB
       -------------------------------------------------------------------------- */
    function formatStopwatchTime(ms) {
        const totalSec = Math.floor(ms / 1000);
        const hours = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;
        const hundredths = Math.floor((ms % 1000) / 10);

        const pad = (n, len = 2) => String(n).padStart(len, '0');
        if (hours > 0) {
            return `${pad(hours)}:${pad(mins)}:${pad(secs)}.${pad(hundredths)}`;
        }
        return `${pad(mins)}:${pad(secs)}.${pad(hundredths)}`;
    }

    function renderStopwatchTab() {
        clearInterval(worldClockInterval);

        viewport.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px 0;">
                <div id="sw-display" style="font-size: 54px; font-weight: 900; font-family: 'Fira Code', monospace; color: #38bdf8; letter-spacing: 2px; margin-bottom: 24px; text-shadow: 0 0 20px rgba(56,189,248,0.3);">
                    ${formatStopwatchTime(swElapsedTime)}
                </div>

                <div style="display: flex; gap: 14px; margin-bottom: 24px;">
                    <button id="sw-btn-start" style="padding: 10px 24px; background: ${swIsRunning ? '#ef4444' : '#10b981'}; color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                        ${swIsRunning ? '⏸️ Pause' : '▶️ Start'}
                    </button>
                    <button id="sw-btn-lap" style="padding: 10px 20px; background: #334155; color: #fff; border: none; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer;" ${!swIsRunning ? 'disabled' : ''}>
                        🚩 Lap
                    </button>
                    <button id="sw-btn-reset" style="padding: 10px 20px; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer;">
                        🔄 Reset
                    </button>
                </div>
            </div>

            <!-- Laps Container -->
            <div style="flex: 1; display: flex; flex-direction: column; background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 14px; overflow-y: auto;">
                <div style="font-size: 13px; font-weight: 700; color: #94a3b8; border-bottom: 1px solid #1e293b; padding-bottom: 8px; margin-bottom: 8px; display: grid; grid-template-columns: 80px 1fr 1fr;">
                    <span>Lap #</span>
                    <span>Lap Split</span>
                    <span>Total Time</span>
                </div>
                <div id="sw-laps-list" style="display: flex; flex-direction: column; gap: 6px;">
                    <!-- Render Laps -->
                </div>
            </div>
        `;

        const swDisplay = viewport.querySelector('#sw-display');
        const btnStart = viewport.querySelector('#sw-btn-start');
        const btnLap = viewport.querySelector('#sw-btn-lap');
        const btnReset = viewport.querySelector('#sw-btn-reset');
        const lapsList = viewport.querySelector('#sw-laps-list');

        const updateLapsTable = () => {
            if (!lapsList) return;
            if (swLaps.length === 0) {
                lapsList.innerHTML = `<div style="text-align: center; color: #475569; font-size: 12px; padding: 12px;">No recorded laps yet.</div>`;
                return;
            }
            lapsList.innerHTML = swLaps.map(l => `
                <div style="display: grid; grid-template-columns: 80px 1fr 1fr; font-family: 'Fira Code', monospace; font-size: 13px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); color: #f8fafc;">
                    <span style="color: #38bdf8; font-weight: 700;">#${l.index}</span>
                    <span style="color: #94a3b8;">+${formatStopwatchTime(l.split)}</span>
                    <span style="color: #ffffff; font-weight: 600;">${formatStopwatchTime(l.total)}</span>
                </div>
            `).join('');
        };

        updateLapsTable();

        const updateSwTick = () => {
            if (swIsRunning) {
                const now = performance.now();
                swElapsedTime += (now - swStartTime);
                swStartTime = now;
                if (swDisplay) swDisplay.textContent = formatStopwatchTime(swElapsedTime);
            }
        };

        btnStart.addEventListener('click', () => {
            sound.playClick();
            if (swIsRunning) {
                // Pause
                swIsRunning = false;
                clearInterval(stopwatchInterval);
                btnStart.textContent = '▶️ Start';
                btnStart.style.background = '#10b981';
                btnLap.disabled = true;
            } else {
                // Start
                swIsRunning = true;
                swStartTime = performance.now();
                clearInterval(stopwatchInterval);
                stopwatchInterval = setInterval(updateSwTick, 30);
                btnStart.textContent = '⏸️ Pause';
                btnStart.style.background = '#ef4444';
                btnLap.disabled = false;
            }
        });

        btnLap.addEventListener('click', () => {
            if (!swIsRunning) return;
            sound.playClick();
            const prevTotal = swLaps.length > 0 ? swLaps[0].total : 0;
            const split = swElapsedTime - prevTotal;
            swLaps.unshift({
                index: swLaps.length + 1,
                split: Math.max(0, split),
                total: swElapsedTime
            });
            updateLapsTable();
        });

        btnReset.addEventListener('click', () => {
            sound.playClick();
            swIsRunning = false;
            clearInterval(stopwatchInterval);
            swElapsedTime = 0;
            swLaps = [];
            if (swDisplay) swDisplay.textContent = '00:00.00';
            btnStart.textContent = '▶️ Start';
            btnStart.style.background = '#10b981';
            btnLap.disabled = true;
            updateLapsTable();
        });

        if (swIsRunning) {
            swStartTime = performance.now();
            clearInterval(stopwatchInterval);
            stopwatchInterval = setInterval(updateSwTick, 30);
        }
    }

    /* --------------------------------------------------------------------------
       3. COUNTDOWN TIMER TAB
       -------------------------------------------------------------------------- */
    function renderTimerTab() {
        clearInterval(worldClockInterval);

        viewport.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                
                <!-- Circular/Linear Progress View -->
                <div style="width: 100%; max-width: 420px; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);">
                    <div id="tm-digits" style="font-size: 52px; font-weight: 800; font-family: 'Fira Code', monospace; color: #38bdf8; letter-spacing: 2px; margin-bottom: 12px;">
                        ${formatSeconds(timerRemainingSeconds)}
                    </div>

                    <div style="width: 100%; height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden; margin-bottom: 18px;">
                        <div id="tm-progress-bar" style="height: 100%; width: ${(timerRemainingSeconds / Math.max(1, timerTotalSeconds)) * 100}%; background: linear-gradient(90deg, #0284c7, #38bdf8); transition: width 0.5s ease;"></div>
                    </div>

                    <!-- Preset Time Buttons -->
                    <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
                        <button class="tm-preset-btn" data-sec="60" style="padding: 6px 12px; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 6px; cursor: pointer; font-size: 12px;">1 min</button>
                        <button class="tm-preset-btn" data-sec="300" style="padding: 6px 12px; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 6px; cursor: pointer; font-size: 12px;">5 min</button>
                        <button class="tm-preset-btn" data-sec="600" style="padding: 6px 12px; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 6px; cursor: pointer; font-size: 12px;">10 min</button>
                        <button class="tm-preset-btn" data-sec="1500" style="padding: 6px 12px; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 6px; cursor: pointer; font-size: 12px;">25 min</button>
                        <button class="tm-preset-btn" data-sec="3600" style="padding: 6px 12px; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 6px; cursor: pointer; font-size: 12px;">1 hr</button>
                    </div>

                    <div style="display: flex; justify-content: center; gap: 12px;">
                        <button id="tm-btn-start" style="padding: 10px 28px; background: ${timerIsRunning ? '#ef4444' : '#0284c7'}; color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                            ${timerIsRunning ? '⏸️ Pause' : '▶️ Start Timer'}
                        </button>
                        <button id="tm-btn-reset" style="padding: 10px 20px; background: #334155; color: #fff; border: none; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer;">
                            🔄 Reset
                        </button>
                    </div>
                </div>
            </div>
        `;

        const digits = viewport.querySelector('#tm-digits');
        const progressBar = viewport.querySelector('#tm-progress-bar');
        const btnStart = viewport.querySelector('#tm-btn-start');
        const btnReset = viewport.querySelector('#tm-btn-reset');

        function formatSeconds(s) {
            const h = Math.floor(s / 3600);
            const m = Math.floor((s % 3600) / 60);
            const sec = s % 60;
            const pad = n => String(n).padStart(2, '0');
            return `${pad(h)}:${pad(m)}:${pad(sec)}`;
        }

        const updateTimerDisplay = () => {
            if (digits) digits.textContent = formatSeconds(timerRemainingSeconds);
            if (progressBar) {
                const pct = (timerRemainingSeconds / Math.max(1, timerTotalSeconds)) * 100;
                progressBar.style.width = `${Math.max(0, pct)}%`;
            }
        };

        viewport.querySelectorAll('.tm-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                sound.playClick();
                timerIsRunning = false;
                clearInterval(timerCountdownInterval);
                const s = parseInt(btn.getAttribute('data-sec'), 10);
                timerTotalSeconds = s;
                timerRemainingSeconds = s;
                btnStart.textContent = '▶️ Start Timer';
                btnStart.style.background = '#0284c7';
                updateTimerDisplay();
            });
        });

        btnStart.addEventListener('click', () => {
            sound.playClick();
            if (timerIsRunning) {
                timerIsRunning = false;
                clearInterval(timerCountdownInterval);
                btnStart.textContent = '▶️ Resume Timer';
                btnStart.style.background = '#0284c7';
            } else {
                if (timerRemainingSeconds <= 0) {
                    timerRemainingSeconds = timerTotalSeconds;
                }
                timerIsRunning = true;
                btnStart.textContent = '⏸️ Pause';
                btnStart.style.background = '#ef4444';
                clearInterval(timerCountdownInterval);
                timerCountdownInterval = setInterval(() => {
                    if (timerRemainingSeconds > 0) {
                        timerRemainingSeconds--;
                        updateTimerDisplay();
                    } else {
                        timerIsRunning = false;
                        clearInterval(timerCountdownInterval);
                        btnStart.textContent = '▶️ Start Timer';
                        btnStart.style.background = '#0284c7';
                        sound.playSuccess();
                        story.showToast('⏰ Timer Finished!', `Countdown of ${formatSeconds(timerTotalSeconds)} completed.`, 'success');
                    }
                }, 1000);
            }
        });

        btnReset.addEventListener('click', () => {
            sound.playClick();
            timerIsRunning = false;
            clearInterval(timerCountdownInterval);
            timerRemainingSeconds = timerTotalSeconds;
            btnStart.textContent = '▶️ Start Timer';
            btnStart.style.background = '#0284c7';
            updateTimerDisplay();
        });
    }

    /* --------------------------------------------------------------------------
       4. ALARMS TAB
       -------------------------------------------------------------------------- */
    function renderAlarmsTab() {
        clearInterval(worldClockInterval);

        viewport.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div style="font-size: 15px; font-weight: 700; color: #ffffff;">Saved System Alarms</div>
                <button id="alarm-add-btn" style="padding: 7px 14px; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                    ➕ New Alarm
                </button>
            </div>

            <div id="alarms-container" style="display: flex; flex-direction: column; gap: 10px;">
                <!-- Alarms Items -->
            </div>
        `;

        const alarmsContainer = viewport.querySelector('#alarms-container');
        const addBtn = viewport.querySelector('#alarm-add-btn');

        const updateAlarmsList = () => {
            if (alarmsList.length === 0) {
                alarmsContainer.innerHTML = `<div style="text-align: center; color: #64748b; font-size: 13px; padding: 24px;">No alarms configured. Click 'New Alarm' to set one.</div>`;
                return;
            }

            alarmsContainer.innerHTML = alarmsList.map(a => `
                <div style="background: #131d31; border: 1px solid #1e293b; border-radius: 10px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 28px; font-weight: 800; font-family: 'Fira Code', monospace; color: ${a.enabled ? '#38bdf8' : '#64748b'};">
                            ${a.time}
                        </div>
                        <div style="font-size: 13px; color: #94a3b8; margin-top: 2px;">
                            ${a.label}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <input type="checkbox" class="alarm-toggle" data-id="${a.id}" ${a.enabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                        <button class="alarm-delete-btn" data-id="${a.id}" style="padding: 6px 10px; background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid #ef4444; border-radius: 6px; cursor: pointer; font-size: 12px;">🗑️</button>
                    </div>
                </div>
            `).join('');

            alarmsContainer.querySelectorAll('.alarm-toggle').forEach(t => {
                t.addEventListener('change', (e) => {
                    const id = parseInt(e.target.getAttribute('data-id'), 10);
                    const item = alarmsList.find(x => x.id === id);
                    if (item) {
                        item.enabled = e.target.checked;
                        localStorage.setItem('krypton_alarms', JSON.stringify(alarmsList));
                        sound.playClick();
                        renderAlarmsTab();
                    }
                });
            });

            alarmsContainer.querySelectorAll('.alarm-delete-btn').forEach(b => {
                b.addEventListener('click', () => {
                    const id = parseInt(b.getAttribute('data-id'), 10);
                    alarmsList = alarmsList.filter(x => x.id !== id);
                    localStorage.setItem('krypton_alarms', JSON.stringify(alarmsList));
                    sound.playClick();
                    renderAlarmsTab();
                });
            });
        };

        updateAlarmsList();

        addBtn.addEventListener('click', () => {
            const time = prompt('Enter alarm time (HH:MM in 24h format):', '08:00');
            if (time && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time.trim())) {
                const label = prompt('Enter alarm label:', 'General Alarm') || 'Alarm';
                alarmsList.push({
                    id: Date.now(),
                    time: time.trim(),
                    label: label.trim(),
                    enabled: true
                });
                localStorage.setItem('krypton_alarms', JSON.stringify(alarmsList));
                sound.playSuccess();
                renderAlarmsTab();
            }
        });
    }

    // Switch Tabs Router
    function switchTab(tabId) {
        currentTab = tabId;
        tabBtns.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.style.background = '#0284c7';
                btn.style.color = '#ffffff';
                btn.classList.add('active');
            } else {
                btn.style.background = 'transparent';
                btn.style.color = '#94a3b8';
                btn.classList.remove('active');
            }
        });

        if (tabId === 'world') renderWorldClockTab();
        else if (tabId === 'stopwatch') renderStopwatchTab();
        else if (tabId === 'timer') renderTimerTab();
        else if (tabId === 'alarms') renderAlarmsTab();
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sound.playClick();
            switchTab(btn.getAttribute('data-tab'));
        });
    });

    switchTab(defaultTab);

    wm.createWindow({
        id: 'krypton-clock',
        title: 'Clock & Time Manager',
        icon: '🕒',
        width: 580,
        height: 480,
        content: content,
        onClose: () => {
            clearInterval(worldClockInterval);
            clearInterval(stopwatchInterval);
            clearInterval(timerCountdownInterval);
        }
    });
}

// Dynamic App Loader Entrypoint
export function launch(args) {
    if (typeof args === 'string') {
        return openClockWindow(args);
    }
    return openClockWindow('world');
}

export default launch;
