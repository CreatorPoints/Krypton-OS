/* ==========================================================================
   KryptonOS Application - System Monitor & Process Manager
   ========================================================================== */

import { wm } from '../wm.js';
import { sound } from '../sound.js';
import { story } from '../story.js';

export function openTaskManager() {
    const content = document.createElement('div');
    content.className = 'taskmgr-app';

    content.innerHTML = `
        <div class="taskmgr-gauges">
            <div class="gauge-card">
                <span class="gauge-title">CPU Utilization (Intel Core i7-10700K @ 3.80GHz)</span>
                <span class="gauge-val" id="cpu-val">4.2%</span>
                <div class="stat-track"><div class="stat-fill" id="cpu-bar" style="width: 4.2%; background: var(--accent-primary);"></div></div>
            </div>
            <div class="gauge-card">
                <span class="gauge-title">Memory Allocation (16384 MB DDR4-3200)</span>
                <span class="gauge-val" id="ram-val">2.84 / 15.9 GiB (17.8%)</span>
                <div class="stat-track"><div class="stat-fill" id="ram-bar" style="width: 17.8%; background: var(--accent-success);"></div></div>
            </div>
        </div>

        <div style="flex: 1; overflow-y: auto; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 8px;">
            <table class="process-table">
                <thead>
                    <tr>
                        <th>PID</th>
                        <th>User</th>
                        <th>Command / Process</th>
                        <th>CPU %</th>
                        <th>Memory</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="process-list">
                    <tr><td>1</td><td>root</td><td>/sbin/init (systemd 254)</td><td>0.0%</td><td>18.4 MB</td><td>-</td></tr>
                    <tr><td>380</td><td>root</td><td>/lib/systemd/systemd-journald</td><td>0.1%</td><td>24.2 MB</td><td>-</td></tr>
                    <tr><td>412</td><td>root</td><td>/lib/systemd/systemd-udevd</td><td>0.0%</td><td>14.8 MB</td><td>-</td></tr>
                    <tr><td>980</td><td>root</td><td>/usr/sbin/sshd -D</td><td>0.0%</td><td>8.4 MB</td><td>-</td></tr>
                    <tr><td>1042</td><td>guest</td><td>krypton-wm --wayland</td><td>1.4%</td><td>142.4 MB</td><td>-</td></tr>
                    <tr><td>1120</td><td>guest</td><td>krypton-browser</td><td>2.1%</td><td>384.0 MB</td><td><button class="kill-btn" data-pid="1120" data-name="krypton-browser">Kill</button></td></tr>
                    <tr><td>1250</td><td>guest</td><td>/bin/bash (tty1)</td><td>0.0%</td><td>12.8 MB</td><td><button class="kill-btn" data-pid="1250" data-name="bash">Kill</button></td></tr>
                    <tr><td>1890</td><td>guest</td><td>krypton-taskmgr</td><td>0.6%</td><td>58.2 MB</td><td>-</td></tr>
                </tbody>
            </table>
        </div>
    `;

    content.querySelectorAll('.kill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pid = btn.getAttribute('data-pid');
            const name = btn.getAttribute('data-name');
            sound.playClick();
            btn.closest('tr').remove();
            story.showToast('Process Terminated', `Sent SIGKILL to process ${pid} (${name}).`, 'info');
        });
    });

    wm.createWindow({
        id: 'taskmgr',
        title: 'System Monitor - KryptonOS',
        icon: '📊',
        width: 660,
        height: 440,
        content: content
    });
}
