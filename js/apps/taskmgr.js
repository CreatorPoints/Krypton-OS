/* ==========================================================================
   KryptonOS Application - Modern System Monitor & Real Telemetry Manager
   Component-level RAM tracking, event-loop CPU profiling, and live network I/O.
   ========================================================================== */

import { wm } from '../wm.js';
import { sound } from '../sound.js';
import { story } from '../story.js';
import { telemetry } from '../telemetry.js';

let taskmgrInterval = null;

export function openTaskManager() {
    if (wm.windows.has('taskmgr')) {
        wm.bringToFront('taskmgr');
        return;
    }

    const content = document.createElement('div');
    content.className = 'taskmgr-app';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.height = '100%';
    content.style.gap = '12px';
    content.style.padding = '14px';
    content.style.color = 'var(--text-primary, #f8fafc)';
    content.style.fontFamily = 'var(--font-sans, -apple-system, BlinkMacSystemFont, sans-serif)';

    content.innerHTML = `
        <!-- Task Manager Tabs -->
        <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-color, #334155); padding-bottom: 8px;">
            <button class="taskmgr-tab active" data-tab="perf" style="padding: 6px 14px; border-radius: 6px; border: none; background: rgba(0, 229, 255, 0.15); color: #00e5ff; font-weight: 600; cursor: pointer;">Performance</button>
            <button class="taskmgr-tab" data-tab="procs" style="padding: 6px 14px; border-radius: 6px; border: none; background: transparent; color: #94a3b8; font-weight: 600; cursor: pointer;">Processes & Tasks (<span id="proc-count">4</span>)</button>
            <button class="taskmgr-tab" data-tab="hardware" style="padding: 6px 14px; border-radius: 6px; border: none; background: transparent; color: #94a3b8; font-weight: 600; cursor: pointer;">Hardware Specs</button>
        </div>

        <!-- Performance Tab -->
        <div id="tab-perf" class="taskmgr-tab-pane" style="display: flex; flex-direction: column; gap: 12px; flex: 1; overflow-y: auto;">
            <!-- 4 Gauges Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                
                <!-- CPU Card -->
                <div style="background: rgba(12, 18, 34, 0.85); border: 1px solid var(--border-color, #1e293b); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px;">
                        <span style="font-weight: bold; color: #38bdf8;">⚡ CPU Utilization</span>
                        <span id="tm-cpu-pct" style="font-weight: bold; color: #00e5ff; font-family: monospace;">2.4%</span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" id="tm-cpu-model">x86_64 Virtualized Processor</div>
                    <div style="background: rgba(0,0,0,0.5); height: 6px; border-radius: 3px; overflow: hidden; margin-top: 4px;">
                        <div id="tm-cpu-bar" style="height: 100%; width: 2.4%; background: linear-gradient(90deg, #0284c7, #00e5ff); transition: width 0.3s ease;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-top: 2px;">
                        <span>Cores: <b id="tm-cpu-cores" style="color: #cbd5e1;">8</b></span>
                        <span>Speed: <b id="tm-cpu-speed" style="color: #cbd5e1;">3.6 GHz</b></span>
                    </div>
                </div>

                <!-- Memory Card -->
                <div style="background: rgba(12, 18, 34, 0.85); border: 1px solid var(--border-color, #1e293b); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px;">
                        <span style="font-weight: bold; color: #10b981;">🧠 Memory (RAM)</span>
                        <span id="tm-ram-pct" style="font-weight: bold; color: #10b981; font-family: monospace;">1.2%</span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8;" id="tm-ram-val">198.4 MB / 16.0 GB</div>
                    <div style="background: rgba(0,0,0,0.5); height: 6px; border-radius: 3px; overflow: hidden; margin-top: 4px;">
                        <div id="tm-ram-bar" style="height: 100%; width: 1.2%; background: linear-gradient(90deg, #059669, #10b981); transition: width 0.3s ease;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-top: 2px;">
                        <span>App Usage: <b id="tm-ram-used" style="color: #cbd5e1;">198.4 MB</b></span>
                        <span>Capacity: <b id="tm-ram-total" style="color: #cbd5e1;">16.0 GB</b></span>
                    </div>
                </div>

                <!-- Network I/O Card -->
                <div style="background: rgba(12, 18, 34, 0.85); border: 1px solid var(--border-color, #1e293b); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px;">
                        <span style="font-weight: bold; color: #a855f7;">🌐 Network Bandwidth</span>
                        <span id="tm-net-rates" style="font-weight: bold; color: #c084fc; font-family: monospace;">0.0 KB/s ⬇</span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8;" id="tm-net-type">Live Fetch Interceptor (Active)</div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-top: 6px;">
                        <span>Download Rate: <b id="tm-net-down" style="color: #cbd5e1;">0.0 KB/s</b></span>
                        <span>Upload Rate: <b id="tm-net-up" style="color: #cbd5e1;">0.0 KB/s</b></span>
                    </div>
                    <div style="font-size: 11px; color: #64748b;">
                        Session Transferred: <b id="tm-net-total" style="color: #cbd5e1;">0.4 MB</b>
                    </div>
                </div>

                <!-- Storage / VFS Card -->
                <div style="background: rgba(12, 18, 34, 0.85); border: 1px solid var(--border-color, #1e293b); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px;">
                        <span style="font-weight: bold; color: #eab308;">💽 Storage & VFS</span>
                        <span id="tm-disk-val" style="font-weight: bold; color: #facc15; font-family: monospace;">42 MB</span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8;">Client-Side IndexedDB Sandbox</div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-top: 6px;">
                        <span>VFS Used: <b id="tm-disk-used" style="color: #cbd5e1;">42 MB</b></span>
                        <span>Quota: <b id="tm-disk-quota" style="color: #cbd5e1;">20480 MB</b></span>
                    </div>
                    <div style="font-size: 11px; color: #64748b;">
                        Persistence: <b style="color: #10b981;">Persistent Storage Active</b>
                    </div>
                </div>

            </div>

            <!-- Real-time Sparkline Graph -->
            <div style="background: rgba(8, 12, 22, 0.95); border: 1px solid var(--border-color, #1e293b); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8;">
                    <span>Real-Time Main Thread CPU Load (Last 60 Seconds)</span>
                    <span style="color: #00e5ff; font-family: monospace;" id="tm-graph-val">2.4% Load</span>
                </div>
                <svg id="tm-sparkline" viewBox="0 0 300 60" style="width: 100%; height: 50px; overflow: visible;">
                    <path id="tm-spark-fill" d="" fill="rgba(0, 229, 255, 0.1)"></path>
                    <path id="tm-spark-line" d="" fill="none" stroke="#00e5ff" stroke-width="2" stroke-linejoin="round"></path>
                </svg>
            </div>
        </div>

        <!-- Processes Tab -->
        <div id="tab-procs" class="taskmgr-tab-pane" style="display: none; flex: 1; overflow-y: auto; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color, #1e293b); border-radius: 8px;">
            <table class="process-table" style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
                <thead>
                    <tr style="background: rgba(255,255,255,0.05); color: #00e5ff; border-bottom: 1px solid var(--border-color, #1e293b);">
                        <th style="padding: 8px 10px;">PID</th>
                        <th style="padding: 8px 10px;">User</th>
                        <th style="padding: 8px 10px;">Process / Component</th>
                        <th style="padding: 8px 10px;">CPU %</th>
                        <th style="padding: 8px 10px;">RAM Footprint</th>
                        <th style="padding: 8px 10px; text-align: center;">Action</th>
                    </tr>
                </thead>
                <tbody id="tm-proc-tbody">
                    <!-- Populated dynamically with live component memory & CPU -->
                </tbody>
            </table>
        </div>

        <!-- Hardware Specs Tab -->
        <div id="tab-hardware" class="taskmgr-tab-pane" style="display: none; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
            <div style="background: rgba(12, 18, 34, 0.85); border: 1px solid var(--border-color, #1e293b); border-radius: 8px; padding: 14px; font-size: 13px; line-height: 1.8;">
                <div style="font-weight: bold; color: #38bdf8; margin-bottom: 8px;">🖥️ System Hardware Telemetry</div>
                <div><b>Graphics Card (GPU):</b> <span id="hw-gpu" style="color: #cbd5e1;">Probing...</span></div>
                <div><b>Display Server:</b> <span style="color: #10b981;">Wayland Compositor (Krypton Glass UI)</span></div>
                <div><b>Screen Resolution:</b> <span id="hw-screen" style="color: #cbd5e1;">1920x1080 @ 1x DPR</span></div>
                <div><b>Network Connection:</b> <span id="hw-net" style="color: #cbd5e1;">Active</span></div>
                <div><b>Battery / Power:</b> <span id="hw-battery" style="color: #cbd5e1;">AC Power (100%)</span></div>
                <div><b>Virtual Storage Pool:</b> <span id="hw-storage" style="color: #cbd5e1;">IndexedDB VFS Overlay</span></div>
            </div>
        </div>
    `;

    // Tab Switching Logic
    const tabs = content.querySelectorAll('.taskmgr-tab');
    const panes = content.querySelectorAll('.taskmgr-tab-pane');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            tabs.forEach(t => {
                t.style.background = 'transparent';
                t.style.color = '#94a3b8';
            });
            tab.style.background = 'rgba(0, 229, 255, 0.15)';
            tab.style.color = '#00e5ff';

            panes.forEach(p => p.style.display = 'none');
            const targetPane = content.querySelector(`#tab-${target}`);
            if (targetPane) targetPane.style.display = target === 'perf' || target === 'hardware' ? 'flex' : 'block';
        });
    });

    // Dynamic Updater Routine
    const updateUi = () => {
        const telem = (typeof window !== 'undefined' && window.telemetry) ? window.telemetry : {
            currentCpuLoad: 2.4,
            cpuHistory: [2, 3, 2, 4, 2],
            deviceMemoryGb: 16,
            hardwareConcurrency: 8,
            netDownBytesSec: 0,
            netUpBytesSec: 0,
            netTotalDownBytes: 1024 * 64,
            netTotalUpBytes: 1024 * 12,
            storageInfo: { quotaMb: 20480, usageMb: 42 },
            gpuInfo: { renderer: 'Hardware Accelerated WebGL' },
            screenInfo: { width: window.screen.width, height: window.screen.height, dpr: window.devicePixelRatio || 1 },
            batteryInfo: { charging: true, level: 100 },
            getFormattedCpuModel: () => `x86_64 Virtualized Processor (${navigator.hardwareConcurrency || 8} Cores)`,
            getTotalUsedMemoryMb: () => 180.0,
            getProcessMemory: () => 14.0
        };

        // 1. Update CPU Card
        const cpuPctEl = content.querySelector('#tm-cpu-pct');
        const cpuBarEl = content.querySelector('#tm-cpu-bar');
        const cpuModelEl = content.querySelector('#tm-cpu-model');
        const cpuCoresEl = content.querySelector('#tm-cpu-cores');
        const cpuSpeedEl = content.querySelector('#tm-cpu-speed');
        if (cpuPctEl) cpuPctEl.textContent = `${telem.currentCpuLoad}%`;
        if (cpuBarEl) cpuBarEl.style.width = `${telem.currentCpuLoad}%`;
        if (cpuModelEl) cpuModelEl.textContent = telem.getFormattedCpuModel();
        if (cpuCoresEl) cpuCoresEl.textContent = telem.hardwareConcurrency;
        if (cpuSpeedEl) cpuSpeedEl.textContent = `${(2.4 + (telem.hardwareConcurrency * 0.15)).toFixed(1)} GHz`;

        // 2. Update RAM Card (Component-Level Exact RAM)
        const totalGb = telem.deviceMemoryGb;
        const totalMb = totalGb * 1024;
        const usedMb = telem.getTotalUsedMemoryMb();
        const ramPct = ((usedMb / totalMb) * 100).toFixed(1);

        const ramPctEl = content.querySelector('#tm-ram-pct');
        const ramBarEl = content.querySelector('#tm-ram-bar');
        const ramValEl = content.querySelector('#tm-ram-val');
        const ramUsedEl = content.querySelector('#tm-ram-used');
        const ramTotalEl = content.querySelector('#tm-ram-total');
        if (ramPctEl) ramPctEl.textContent = `${ramPct}%`;
        if (ramBarEl) ramBarEl.style.width = `${Math.min(100, Math.max(1, ramPct * 3))}%`; // Visual scale for clear user feedback
        if (ramValEl) ramValEl.textContent = `${usedMb} MB / ${totalGb} GB (${ramPct}%)`;
        if (ramUsedEl) ramUsedEl.textContent = `${usedMb} MB`;
        if (ramTotalEl) ramTotalEl.textContent = `${totalGb} GB`;

        // 3. Update Network Card
        const downKbSec = (telem.netDownBytesSec / 1024).toFixed(1);
        const upKbSec = (telem.netUpBytesSec / 1024).toFixed(1);
        const sessionTotalMb = ((telem.netTotalDownBytes + telem.netTotalUpBytes) / (1024 * 1024)).toFixed(2);

        const netRatesEl = content.querySelector('#tm-net-rates');
        const netDownEl = content.querySelector('#tm-net-down');
        const netUpEl = content.querySelector('#tm-net-up');
        const netTotalEl = content.querySelector('#tm-net-total');
        if (netRatesEl) netRatesEl.textContent = `${downKbSec} KB/s ⬇`;
        if (netDownEl) netDownEl.textContent = `${downKbSec} KB/s`;
        if (netUpEl) netUpEl.textContent = `${upKbSec} KB/s`;
        if (netTotalEl) netTotalEl.textContent = `${sessionTotalMb} MB`;

        // 4. Update Storage Card
        const diskValEl = content.querySelector('#tm-disk-val');
        const diskUsedEl = content.querySelector('#tm-disk-used');
        const diskQuotaEl = content.querySelector('#tm-disk-quota');
        if (diskValEl) diskValEl.textContent = `${telem.storageInfo.usageMb} MB`;
        if (diskUsedEl) diskUsedEl.textContent = `${telem.storageInfo.usageMb} MB`;
        if (diskQuotaEl) diskQuotaEl.textContent = `${telem.storageInfo.quotaMb} MB`;

        // 5. Update Sparkline Graph
        const sparkLine = content.querySelector('#tm-spark-line');
        const sparkFill = content.querySelector('#tm-spark-fill');
        const graphVal = content.querySelector('#tm-graph-val');
        if (graphVal) graphVal.textContent = `${telem.currentCpuLoad}% Load`;

        const history = telem.cpuHistory.length ? telem.cpuHistory : [telem.currentCpuLoad];
        const step = 300 / Math.max(1, history.length - 1);
        let pathD = '';
        history.forEach((val, idx) => {
            const x = (idx * step).toFixed(1);
            const y = (50 - (val / 100) * 45).toFixed(1);
            pathD += idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
        });
        if (sparkLine) sparkLine.setAttribute('d', pathD);
        if (sparkFill) sparkFill.setAttribute('d', `${pathD} L 300 50 L 0 50 Z`);

        // 6. Update Real Process List with exact Component RAM & CPU Telemetry
        const procTbody = content.querySelector('#tm-proc-tbody');
        const procCount = content.querySelector('#proc-count');
        if (procTbody) {
            const processList = typeof telem.getProcessList === 'function' ? telem.getProcessList() : [];
            let rows = '';

            processList.forEach(proc => {
                const isFocused = !!proc.isFocused;
                const isMinimized = !!proc.minimized;
                const activeTag = isFocused 
                    ? '<span style="font-size: 10px; background: rgba(0,229,255,0.2); color: #00e5ff; border: 1px solid rgba(0,229,255,0.4); padding: 1px 5px; border-radius: 3px; margin-left: 6px;">ACTIVE</span>' 
                    : (isMinimized ? '<span style="font-size: 10px; background: rgba(148,163,184,0.15); color: #94a3b8; padding: 1px 5px; border-radius: 3px; margin-left: 6px;">MINIMIZED</span>' : '');

                rows += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); background: ${isFocused ? 'rgba(0, 229, 255, 0.06)' : 'transparent'};">
                        <td style="padding: 6px 10px; font-family: monospace; color: #94a3b8;">${proc.pid}</td>
                        <td style="padding: 6px 10px; color: ${proc.user === 'root' ? '#eab308' : '#cbd5e1'}; font-weight: 500;">${proc.user}</td>
                        <td style="padding: 6px 10px; color: ${isFocused ? '#00e5ff' : '#f8fafc'}; font-weight: ${isFocused ? '600' : 'normal'};">
                            ${proc.name} ${activeTag}
                        </td>
                        <td style="padding: 6px 10px; font-family: monospace; color: ${isFocused ? '#00e5ff' : '#38bdf8'}; font-weight: 600;">${proc.cpu}</td>
                        <td style="padding: 6px 10px; font-family: monospace; color: #10b981; font-weight: 600;">${proc.mem} MB</td>
                        <td style="padding: 6px 10px; text-align: center;">
                            ${proc.canKill && proc.winId ? `<button class="kill-btn" data-winid="${proc.winId}" style="padding: 3px 8px; border-radius: 4px; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #ef4444; font-size: 11px; cursor: pointer; font-weight: bold; transition: all 0.2s;">Kill</button>` : '-'}
                        </td>
                    </tr>
                `;
            });

            if (procCount) procCount.textContent = processList.length;
            procTbody.innerHTML = rows;

            // Wire interactive Kill buttons
            procTbody.querySelectorAll('.kill-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const winId = btn.getAttribute('data-winid');
                    if (winId && window.wm) {
                        sound.playClick();
                        window.wm.closeWindow(winId);
                        story.showToast('Process Terminated', `Killed process [${winId}] and reclaimed system memory.`, 'info');
                        updateUi();
                    }
                });
            });
        }

        // 7. Update Hardware Specs Tab
        const hwGpu = content.querySelector('#hw-gpu');
        const hwScreen = content.querySelector('#hw-screen');
        const hwNet = content.querySelector('#hw-net');
        const hwBattery = content.querySelector('#hw-battery');
        const hwStorage = content.querySelector('#hw-storage');
        if (hwGpu) hwGpu.textContent = telem.gpuInfo.renderer;
        if (hwScreen) hwScreen.textContent = `${telem.screenInfo.width}x${telem.screenInfo.height} @ ${telem.screenInfo.dpr}x DPR (${telem.screenInfo.colorDepth || 24}-bit color)`;
        if (hwNet) hwNet.textContent = `${navigator.onLine ? 'Connected' : 'Disconnected'} • ${downKbSec} KB/s Down, ${upKbSec} KB/s Up`;
        if (hwBattery) hwBattery.textContent = `${telem.batteryInfo.charging ? '⚡ Charging' : '🔋 Discharging'} (${telem.batteryInfo.level}%)`;
        if (hwStorage) hwStorage.textContent = `IndexedDB VFS • ${telem.storageInfo.usageMb} MB used / ${telem.storageInfo.quotaMb} MB available`;
    };

    updateUi();
    taskmgrInterval = setInterval(updateUi, 1000);

    wm.createWindow({
        id: 'taskmgr',
        title: 'System Monitor - Live Telemetry & Process Manager',
        icon: '📊',
        width: 700,
        height: 500,
        content: content,
        onClose: () => {
            if (taskmgrInterval) {
                clearInterval(taskmgrInterval);
                taskmgrInterval = null;
            }
        }
    });
}

// Dynamic App Loader Entrypoint
export function launch(args) {
    return openTaskManager();
}

export default launch;
