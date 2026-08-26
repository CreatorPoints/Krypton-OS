/* ==========================================================================
   KryptonOS Application - Full-Featured Interactive Linux Terminal Engine
   ========================================================================== */

import { wm } from '../wm.js';
import { vfs, idbStore, downloadWithMetrics } from '../fs.js';
import { story } from '../story.js';
import { sound } from '../sound.js';
import { boot } from '../boot.js';

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export const REPO_DPKG_PACKAGES = [
    { id: 'krypton-desktop-core', file: 'krypton-desktop-core_0.1.0.2_amd64.deb', name: 'krypton-desktop-core', version: '0.1.0.2', arch: 'amd64', section: 'x11/desktop', size: 4820, maintainer: 'KryptonOS Core Team <core@krypton-os.org>', summary: 'KryptonOS Desktop Shell, Wayland Compositor, and System Utilities' },
    { id: 'cmatrix', file: 'cmatrix.deb', name: 'cmatrix', version: '2.0-3', arch: 'amd64', section: 'utils/console', size: 128, maintainer: 'KryptonOS Maintainers <packages@krypton-os.org>', summary: 'Matrix Digital Rain Terminal Screensaver' },
    { id: 'cowsay', file: 'cowsay.deb', name: 'cowsay', version: '3.03+dfsg2-8', arch: 'all', section: 'games/toys', size: 96, maintainer: 'Debian QA Group <packages@debian.org>', summary: 'Configurable talking and thinking ASCII cow' },
    { id: 'neofetch', file: 'neofetch.deb', name: 'neofetch', version: '7.1.0-2', arch: 'all', section: 'utils/system', size: 340, maintainer: 'Dylan Araps <dylan.araps@gmail.com>', summary: 'Fast, highly customizable CLI system info tool' },
    { id: 'sl', file: 'sl.deb', name: 'sl', version: '5.02-1', arch: 'amd64', section: 'games/toys', size: 48, maintainer: 'Toyoda Masashi <toyoda@dandelion.org>', summary: 'Steam Locomotive animator for typo prevention' },
    { id: 'krypton-desktop', file: 'krypton-desktop.deb', name: 'krypton-desktop', version: '0.1.0.2', arch: 'amd64', section: 'x11/desktop', size: 84200, maintainer: 'KryptonOS Desktop Team <desktop@krypton-os.org>', summary: 'Next-generation modern Wayland desktop environment' },
    { id: 'krypton-browser', file: 'krypton-browser.deb', name: 'krypton-browser', version: '1.4.2-release', arch: 'amd64', section: 'web/browsers', size: 42100, maintainer: 'Krypton Web Team <browser@krypton-os.org>', summary: 'Quantum Sandboxed Web Browser' },
    { id: 'krypton-taskmgr', file: 'krypton-taskmgr.deb', name: 'krypton-taskmgr', version: '1.2.0-release', arch: 'amd64', section: 'admin/monitoring', size: 3200, maintainer: 'Krypton System Team <sysadmin@krypton-os.org>', summary: 'GUI System Task Manager and Performance Monitor' },
    { id: 'krypton-filemgr', file: 'krypton-filemgr.deb', name: 'krypton-filemgr', version: '1.3.0-release', arch: 'amd64', section: 'utils/files', size: 5600, maintainer: 'Krypton System Team <sysadmin@krypton-os.org>', summary: 'Graphical File Explorer and Storage Navigator' },
    { id: 'krypton-notes', file: 'krypton-notes.deb', name: 'krypton-notes', version: '1.1.0-release', arch: 'amd64', section: 'editors/text', size: 1800, maintainer: 'Krypton Applications <apps@krypton-os.org>', summary: 'Fast lightweight text and code editor' },
    { id: 'krypton-calculator', file: 'krypton-calculator.deb', name: 'krypton-calculator', version: '1.0.2-release', arch: 'amd64', section: 'math/calculators', size: 950, maintainer: 'Krypton Applications <apps@krypton-os.org>', summary: 'Scientific and standard desktop calculator' }
];

export const PARROT_FRAMES = [
`
            .▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄.
        .▄████████████████████▄.
      .██████████████████████████.
    .██████████████████████████████.
   .████████████████████████████████.
   ██████████████████████████████████
  ████████████████████████████████████
 ██████████████████████████████████████
 ███████████████   ████████████████████
 ███████████████ █ ████████████████████
 ███████████████   ████████████████████
 ██████████████████████████████████████
  ████████████████████████████████████
   ██████████████████████████████████
    .██████████████████████████████.
      .██████████████████████████.
`,
`
              .▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄.
          .▄████████████████████▄.
        .██████████████████████████.
      .██████████████████████████████.
     .████████████████████████████████.
     ██████████████████████████████████
    ████████████████████████████████████
   ██████████████████████████████████████
   ███████████████   ████████████████████
   ███████████████ █ ████████████████████
   ███████████████   ████████████████████
   ██████████████████████████████████████
    ████████████████████████████████████
     ██████████████████████████████████
      .██████████████████████████████.
        .██████████████████████████.
`,
`
                .▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄.
            .▄████████████████████▄.
          .██████████████████████████.
        .██████████████████████████████.
       .████████████████████████████████.
       ██████████████████████████████████
      ████████████████████████████████████
     ██████████████████████████████████████
     ███████████████   ████████████████████
     ███████████████ █ ████████████████████
     ███████████████   ████████████████████
     ██████████████████████████████████████
      ████████████████████████████████████
       ██████████████████████████████████
        .██████████████████████████████.
          .██████████████████████████.
`,
`
              .▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄.
          .▄████████████████████▄.
        .██████████████████████████.
      .██████████████████████████████.
     .████████████████████████████████.
     ██████████████████████████████████
    ████████████████████████████████████
   ██████████████████████████████████████
   ███████████████   ████████████████████
   ███████████████ █ ████████████████████
   ███████████████   ████████████████████
   ██████████████████████████████████████
    ████████████████████████████████████
     ██████████████████████████████████
      .██████████████████████████████.
        .██████████████████████████.
`,
`
            .▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄.
        .▄████████████████████▄.
      .██████████████████████████.
    .██████████████████████████████.
   .████████████████████████████████.
   ██████████████████████████████████
  ████████████████████████████████████
 ██████████████████████████████████████
 ███████████████   ████████████████████
 ███████████████ █ ████████████████████
 ███████████████   ████████████████████
 ██████████████████████████████████████
  ████████████████████████████████████
   ██████████████████████████████████
    .██████████████████████████████.
      .██████████████████████████.
`,
`
          .▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄.
      .▄████████████████████▄.
    .██████████████████████████.
  .██████████████████████████████.
 .████████████████████████████████.
 ██████████████████████████████████
████████████████████████████████████
██████████████████████████████████████
███████████████   ████████████████████
███████████████ █ ████████████████████
███████████████   ████████████████████
██████████████████████████████████████
 ████████████████████████████████████
  ██████████████████████████████████
   .██████████████████████████████.
     .██████████████████████████.
`,
`
        .▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄.
    .▄████████████████████▄.
  .██████████████████████████.
.██████████████████████████████.
.████████████████████████████████.
██████████████████████████████████
████████████████████████████████████
██████████████████████████████████████
███████████████   ████████████████████
███████████████ █ ████████████████████
███████████████   ████████████████████
██████████████████████████████████████
████████████████████████████████████
 ██████████████████████████████████
  .██████████████████████████████.
    .██████████████████████████.
`,
`
          .▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄.
      .▄████████████████████▄.
    .██████████████████████████.
  .██████████████████████████████.
 .████████████████████████████████.
 ██████████████████████████████████
████████████████████████████████████
██████████████████████████████████████
███████████████   ████████████████████
███████████████ █ ████████████████████
███████████████   ████████████████████
██████████████████████████████████████
 ████████████████████████████████████
  ██████████████████████████████████
   .██████████████████████████████.
     .██████████████████████████.
`
];

export function openTerminal() {
    const primaryUser = localStorage.getItem('krypton_primary_user') || 'guest';
    let currentUser = primaryUser;
    let currentDir = vfs.getNode(`/home/${currentUser}`) ? `/home/${currentUser}` : '/home/guest';
    let prevDir = currentDir;
    let hostname = 'krypton-station';
    let lastExitCode = 0;

    const hostnameNode = vfs.getNode('/etc/hostname');
    if (hostnameNode && hostnameNode.content) {
        hostname = hostnameNode.content.trim();
    }

    const env = {
        USER: currentUser,
        LOGNAME: currentUser,
        HOME: currentDir,
        HOSTNAME: hostname,
        SHELL: '/bin/bash',
        TERM: 'xterm-256color',
        PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
        LANG: 'en_US.UTF-8',
        PWD: currentDir,
        '?': '0'
    };

    const aliases = {
        ll: 'ls -la',
        la: 'ls -A',
        l: 'ls -CF',
        cls: 'clear',
        md: 'mkdir -p',
        rd: 'rmdir'
    };

    const commandHistory = [];
    let historyIdx = -1;
    const sessionStack = [];

    const content = document.createElement('div');
    content.className = 'terminal-app';

    const isInstalled = localStorage.getItem('krypton_os_installed') === 'true';
    const osRel = vfs.readFile('/etc/os-release') || '';
    const isUpgraded = isInstalled && localStorage.getItem('krypton_upgraded_lts') === 'true' && osRel.includes('1.0.0.0');

    let currentPrettyName = 'Krypton OS 0.1 Alpha';
    let currentKernelVer = '2.0.0.14-generic-krypton';

    if (!isInstalled) {
        currentPrettyName = 'Krypton OS 0.1 Alpha (Live Media)';
        currentKernelVer = '2.0.0.14-generic-krypton';
    } else if (isUpgraded) {
        currentPrettyName = 'Krypton 1.0.0.0 LTS';
        currentKernelVer = '6.10.0-krypton-generic';
    } else {
        const prettyMatch = osRel.match(/PRETTY_NAME="([^"]+)"/);
        currentPrettyName = prettyMatch ? prettyMatch[1] : 'Krypton OS 0.1 Alpha';
        currentKernelVer = '2.0.0.14-generic-krypton';
    }

    content.innerHTML = `
        <div class="terminal-line terminal-output-info">${currentPrettyName} (Linux ${currentKernelVer} x86_64)</div>
        <div class="terminal-line terminal-output-muted">Type 'help' for command list or 'man &lt;command&gt;' for documentation.</div>
        <div class="terminal-line"> </div>
        <div id="terminal-history"></div>
        <div class="terminal-prompt-line">
            <span class="terminal-prompt-text" id="term-prompt">${currentUser}@${hostname}:${currentDir}$</span>
            <input type="text" class="terminal-input" id="term-input" autofocus autocomplete="off" spellcheck="false">
        </div>
    `;

    const input = content.querySelector('#term-input');
    const historyContainer = content.querySelector('#terminal-history');
    const promptText = content.querySelector('#term-prompt');

    let isWaitingForPassword = false;
    let pendingPasswordCallback = null;
    let multilineBuffer = [];

    const updatePrompt = () => {
        const hNode = vfs.getNode('/etc/hostname');
        if (hNode && hNode.content) {
            hostname = hNode.content.trim();
            env.HOSTNAME = hostname;
        }

        const symbol = currentUser === 'root' ? '#' : '$';
        const displayPath = currentDir.startsWith('/home/' + currentUser) 
            ? currentDir.replace('/home/' + currentUser, '~') 
            : currentDir;

        promptText.innerHTML = `<span class="prompt-user">${currentUser}</span><span class="prompt-at">@</span><span class="prompt-host">${hostname}</span><span class="prompt-colon">:</span><span class="prompt-path">${displayPath}</span><span class="prompt-char">${symbol}</span> `;

        if (currentUser === 'root') {
            promptText.classList.add('terminal-prompt-root');
        } else {
            promptText.classList.remove('terminal-prompt-root');
        }
        env.PWD = currentDir;
        env.USER = currentUser;
        env.HOME = currentUser === 'root' ? '/root' : `/home/${currentUser}`;
    };

    const appendLine = (text, type = 'normal') => {
        const div = document.createElement('div');
        div.className = `terminal-line terminal-output-${type}`;
        div.textContent = text;
        historyContainer.appendChild(div);
    };

    const appendCommandHistory = (cmdStr) => {
        const symbol = currentUser === 'root' ? '#' : '$';
        const displayPath = currentDir.startsWith('/home/' + currentUser) 
            ? currentDir.replace('/home/' + currentUser, '~') 
            : currentDir;

        const div = document.createElement('div');
        div.className = 'terminal-line terminal-output-prompt';
        if (currentUser === 'root') div.classList.add('terminal-prompt-root');

        const promptSpan = document.createElement('span');
        promptSpan.className = 'terminal-prompt-text';
        promptSpan.innerHTML = `<span class="prompt-user">${currentUser}</span><span class="prompt-at">@</span><span class="prompt-host">${hostname}</span><span class="prompt-colon">:</span><span class="prompt-path">${displayPath}</span><span class="prompt-char">${symbol}</span> `;

        const cmdSpan = document.createElement('span');
        cmdSpan.className = 'prompt-cmd';
        cmdSpan.textContent = cmdStr;

        div.appendChild(promptSpan);
        div.appendChild(cmdSpan);
        historyContainer.appendChild(div);
    };

    // Output dynamic MOTD if present
    const motdNode = vfs.getNode('/etc/motd');
    if (motdNode && motdNode.content) {
        motdNode.content.trim().split('\n').forEach(l => appendLine(l, 'info'));
    }

    let activeStreamInterval = null;

    const runCommandWithResult = (rawLine) => {
        executeCommandLine(rawLine, currentDir, currentUser, env, aliases, prevDir, (res) => {
            if (res.pushSession) {
                sessionStack.push({
                    user: currentUser,
                    dir: currentDir,
                    prevDir: prevDir,
                    env: { ...env }
                });
            }

            if (res.popSession) {
                if (sessionStack.length > 0) {
                    const prev = sessionStack.pop();
                    currentUser = prev.user;
                    currentDir = prev.dir;
                    prevDir = prev.prevDir || currentDir;
                    Object.assign(env, prev.env);
                } else {
                    wm.closeWindow('terminal');
                    return;
                }
            }

            if (res.newDir) {
                prevDir = currentDir;
                currentDir = res.newDir;
            }
            if (res.newUser) {
                currentUser = res.newUser;
            }
            if (typeof res.exitCode === 'number') {
                lastExitCode = res.exitCode;
                env['?'] = String(lastExitCode);
            }
            updatePrompt();

            if (res.clear) {
                historyContainer.innerHTML = '';
            } else if (res.streamLines && res.streamLines.length > 0) {
                let sIdx = 0;
                input.disabled = true;
                const streamNext = () => {
                    if (sIdx < res.streamLines.length) {
                        const item = res.streamLines[sIdx++];
                        appendLine(item.text, item.type || 'normal');
                        content.scrollTop = content.scrollHeight;
                        setTimeout(streamNext, item.delay !== undefined ? item.delay : 120);
                    } else {
                        input.disabled = false;
                        input.focus();
                        if (res.onComplete) res.onComplete();
                    }
                };
                streamNext();
            } else if (res.lines && res.lines.length > 0) {
                res.lines.forEach(l => appendLine(l.text, l.type || 'normal'));
            }

            if (res.enterTTY) {
                setTimeout(() => {
                    wm.closeWindow('terminal');
                    switchToTTYConsole();
                }, 500);
                return;
            }

            if (res.restoreGUI) {
                document.getElementById('desktop-environment')?.classList.remove('hidden');
                document.getElementById('tty-screen')?.classList.add('hidden');
            }

            if (res.launchNano) {
                openTerminalNano(res.launchNano.filePath, res.launchNano.fileName, res.launchNano.content);
                return;
            }

            // Streaming ASCII Party Parrot (curl parrot.live)
            if (res.startParrot) {
                let pFrame = 0;
                const parrotFrames = [
                    "    .---.\n   /     \\\n  | () () |\n   \\  _  /\n    /'---'\\",
                    "    .---.\n   /  o  \\\n  | () () |\n   \\  -  /\n    /'---'\\",
                    "    .---.\n   /     \\\n  |  o o  |\n   \\  _  /\n    /'---'\\"
                ];
                appendLine('[ Streaming ASCII Animation: Press Ctrl+C to cancel ]', 'warning');
                activeStreamInterval = setInterval(() => {
                    appendLine(parrotFrames[pFrame % parrotFrames.length], 'cyan');
                    pFrame++;
                    content.scrollTop = content.scrollHeight;
                }, 200);
            }

            content.scrollTop = content.scrollHeight;
        });
    };

    let nanoCutBuffer = '';

    const openTerminalNano = (targetPath, fileName, initialContent) => {
        let isModified = false;
        let isExitingPrompt = false;

        // Hide terminal prompt and history
        historyContainer.style.display = 'none';
        const promptLine = content.querySelector('.terminal-prompt-line');
        if (promptLine) promptLine.style.display = 'none';

        const nanoEl = document.createElement('div');
        nanoEl.className = 'nano-terminal-container';

        const lineCount = initialContent ? initialContent.split('\n').length : 0;

        nanoEl.innerHTML = `
            <!-- Nano Top Title Bar -->
            <div class="nano-topbar">
                <span>GNU nano 6.2</span>
                <span id="nano-file-heading">${escapeHtml(fileName || 'New Buffer')}</span>
                <span id="nano-mod-indicator" style="color: #b91c1c; font-weight: 900;"></span>
            </div>

            <!-- Nano Textarea Editor Area -->
            <div style="flex: 1; position: relative; display: flex; flex-direction: column; overflow: hidden; padding: 6px 8px;">
                <textarea id="nano-editor-textarea" spellcheck="false" autocomplete="off" style="flex: 1; width: 100%; height: 100%; background: transparent; color: #f8fafc; border: none; outline: none; resize: none; font-family: var(--font-mono); font-size: 13px; line-height: 1.5; caret-color: #00e5ff; white-space: pre; overflow-y: auto; user-select: text !important; -webkit-user-select: text !important;">${escapeHtml(initialContent || '')}</textarea>
            </div>

            <!-- Nano Message / Prompt Bar -->
            <div id="nano-status-bar" style="padding: 2px 10px; font-size: 11px; background: rgba(0, 229, 255, 0.12); color: #00e5ff; min-height: 20px; display: flex; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); font-family: var(--font-mono);">
                [ Read ${lineCount} lines ]
            </div>

            <!-- Nano 2-Row Shortcuts Footer -->
            <div class="nano-footer-bar">
                <button class="nano-btn" id="nano-btn-help"><span style="background: #fff; color: #000; padding: 1px 3px; font-weight: bold; border-radius: 2px;">^G</span> Help</button>
                <button class="nano-btn" id="nano-btn-writeout"><span style="background: #fff; color: #000; padding: 1px 3px; font-weight: bold; border-radius: 2px;">^O</span> WriteOut</button>
                <button class="nano-btn" id="nano-btn-whereis"><span style="background: #fff; color: #000; padding: 1px 3px; font-weight: bold; border-radius: 2px;">^W</span> Where Is</button>
                <button class="nano-btn" id="nano-btn-cut"><span style="background: #fff; color: #000; padding: 1px 3px; font-weight: bold; border-radius: 2px;">^K</span> Cut Text</button>
                <button class="nano-btn" id="nano-btn-justify"><span style="background: #fff; color: #000; padding: 1px 3px; font-weight: bold; border-radius: 2px;">^J</span> Justify</button>
                <button class="nano-btn" id="nano-btn-curpos"><span style="background: #fff; color: #000; padding: 1px 3px; font-weight: bold; border-radius: 2px;">^C</span> Location</button>

                <button class="nano-btn" id="nano-btn-exit"><span style="background: #fff; color: #000; padding: 1px 3px; font-weight: bold; border-radius: 2px;">^X</span> Exit</button>
                <button class="nano-btn" id="nano-btn-readfile"><span style="background: #fff; color: #000; padding: 1px 3px; font-weight: bold; border-radius: 2px;">^R</span> Read File</button>
                <button class="nano-btn" id="nano-btn-replace"><span style="background: #fff; color: #000; padding: 1px 3px; font-weight: bold; border-radius: 2px;">^\</span> Replace</button>
                <button class="nano-btn" id="nano-btn-paste"><span style="background: #fff; color: #000; padding: 1px 3px; font-weight: bold; border-radius: 2px;">^U</span> Paste</button>
                <button class="nano-btn" id="nano-btn-toswitch"><span style="background: #fff; color: #000; padding: 1px 3px; font-weight: bold; border-radius: 2px;">^T</span> Execute</button>
                <button class="nano-btn" id="nano-btn-gotoline"><span style="background: #fff; color: #000; padding: 1px 3px; font-weight: bold; border-radius: 2px;">^_</span> Go To Line</button>
            </div>
        `;

        content.appendChild(nanoEl);

        const textarea = nanoEl.querySelector('#nano-editor-textarea');
        const statusMsg = nanoEl.querySelector('#nano-status-bar');
        const modIndicator = nanoEl.querySelector('#nano-mod-indicator');

        textarea.focus();

        const markModified = () => {
            if (!isModified) {
                isModified = true;
                modIndicator.textContent = '*Modified';
            }
        };

        textarea.addEventListener('input', () => {
            markModified();
        });

        const saveFile = () => {
            const curVal = textarea.value;
            const dirOfFile = targetPath.substring(0, targetPath.lastIndexOf('/')) || '/';
            if (!vfs.exists(dirOfFile)) {
                vfs.createDirectory(dirOfFile);
            }
            vfs.writeFile(targetPath, curVal);
            vfs.saveFileSystem();
            isModified = false;
            modIndicator.textContent = '';
            const linesWritten = curVal.split('\n').length;
            statusMsg.textContent = `[ Wrote ${linesWritten} lines to ${targetPath} ]`;
            sound.playSuccess();
            story.showToast('💾 nano', `Saved ${fileName} (${linesWritten} lines)`, 'success');
        };

        const exitNano = () => {
            nanoEl.remove();
            historyContainer.style.display = 'block';
            if (promptLine) promptLine.style.display = 'flex';
            input.disabled = false;
            input.value = '';
            input.focus();
            updatePrompt();
            content.scrollTop = content.scrollHeight;
        };

        const handleExitRequest = () => {
            if (!isModified) {
                exitNano();
                return;
            }
            isExitingPrompt = true;
            statusMsg.innerHTML = `<span style="background: #eab308; color: #000; font-weight: bold; padding: 1px 4px;">Save modified buffer?</span> (Y=Yes, N=No, ^C=Cancel)`;
        };

        // Nano Keydown Listener
        textarea.addEventListener('keydown', (e) => {
            // Exit confirmation handling
            if (isExitingPrompt) {
                if (e.key.toLowerCase() === 'y' || e.key === 'Enter') {
                    e.preventDefault();
                    saveFile();
                    exitNano();
                    return;
                } else if (e.key.toLowerCase() === 'n') {
                    e.preventDefault();
                    exitNano();
                    return;
                } else if ((e.ctrlKey && e.key.toLowerCase() === 'c') || e.key === 'Escape') {
                    e.preventDefault();
                    isExitingPrompt = false;
                    statusMsg.textContent = `[ Cancelled exit ]`;
                    return;
                }
            }

            // Ctrl+O: WriteOut (Save)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
                e.preventDefault();
                saveFile();
                return;
            }

            // Ctrl+X: Exit
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
                e.preventDefault();
                handleExitRequest();
                return;
            }

            // Ctrl+K: Cut Current Line
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                const text = textarea.value;
                const pos = textarea.selectionStart;
                const prevNewline = text.lastIndexOf('\n', pos - 1);
                const startLine = prevNewline === -1 ? 0 : prevNewline + 1;
                const nextNewline = text.indexOf('\n', pos);
                const endLine = nextNewline === -1 ? text.length : nextNewline + 1;

                nanoCutBuffer = text.substring(startLine, endLine);
                textarea.value = text.substring(0, startLine) + text.substring(endLine);
                textarea.selectionStart = textarea.selectionEnd = startLine;
                markModified();
                statusMsg.textContent = `[ Cut 1 line ]`;
                return;
            }

            // Ctrl+U: Paste (Uncut)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
                e.preventDefault();
                if (nanoCutBuffer) {
                    const pos = textarea.selectionStart;
                    textarea.value = textarea.value.substring(0, pos) + nanoCutBuffer + textarea.value.substring(pos);
                    textarea.selectionStart = textarea.selectionEnd = pos + nanoCutBuffer.length;
                    markModified();
                    statusMsg.textContent = `[ Pasted 1 line ]`;
                }
                return;
            }

            // Ctrl+C: Cur Pos (Location)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                const pos = textarea.selectionStart;
                const textBefore = textarea.value.substring(0, pos);
                const line = textBefore.split('\n').length;
                const totalLines = textarea.value.split('\n').length;
                const col = pos - (textBefore.lastIndexOf('\n') + 1) + 1;
                statusMsg.textContent = `[ line ${line}/${totalLines} (${Math.round((line/totalLines)*100)}%), col ${col}, char ${pos}/${textarea.value.length} ]`;
                return;
            }

            // Ctrl+G: Help
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
                e.preventDefault();
                statusMsg.textContent = `[ GNU nano 6.2 - ^O Save, ^X Exit, ^K Cut, ^U Paste, ^C Position ]`;
                return;
            }
        });

        // Click listeners for bottom nano buttons
        nanoEl.querySelector('#nano-btn-writeout')?.addEventListener('click', () => { sound.playClick(); saveFile(); });
        nanoEl.querySelector('#nano-btn-exit')?.addEventListener('click', () => { sound.playClick(); handleExitRequest(); });
        nanoEl.querySelector('#nano-btn-help')?.addEventListener('click', () => {
            statusMsg.textContent = `[ GNU nano 6.2 - ^O Save, ^X Exit, ^K Cut, ^U Paste, ^C Position ]`;
        });
        nanoEl.querySelector('#nano-btn-curpos')?.addEventListener('click', () => {
            const pos = textarea.selectionStart;
            const textBefore = textarea.value.substring(0, pos);
            const line = textBefore.split('\n').length;
            const totalLines = textarea.value.split('\n').length;
            const col = pos - (textBefore.lastIndexOf('\n') + 1) + 1;
            statusMsg.textContent = `[ line ${line}/${totalLines} (${Math.round((line/totalLines)*100)}%), col ${col}, char ${pos}/${textarea.value.length} ]`;
        });
        nanoEl.querySelector('#nano-btn-cut')?.addEventListener('click', () => {
            const text = textarea.value;
            const pos = textarea.selectionStart;
            const prevNewline = text.lastIndexOf('\n', pos - 1);
            const startLine = prevNewline === -1 ? 0 : prevNewline + 1;
            const nextNewline = text.indexOf('\n', pos);
            const endLine = nextNewline === -1 ? text.length : nextNewline + 1;

            nanoCutBuffer = text.substring(startLine, endLine);
            textarea.value = text.substring(0, startLine) + text.substring(endLine);
            textarea.selectionStart = textarea.selectionEnd = startLine;
            markModified();
            statusMsg.textContent = `[ Cut 1 line ]`;
        });
        nanoEl.querySelector('#nano-btn-paste')?.addEventListener('click', () => {
            if (nanoCutBuffer) {
                const pos = textarea.selectionStart;
                textarea.value = textarea.value.substring(0, pos) + nanoCutBuffer + textarea.value.substring(pos);
                textarea.selectionStart = textarea.selectionEnd = pos + nanoCutBuffer.length;
                markModified();
                statusMsg.textContent = `[ Pasted 1 line ]`;
            }
        });
    };

    input.addEventListener('keydown', (e) => {
        sound.playTerminalKey();

        // History Up
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length === 0) return;
            if (historyIdx === -1) historyIdx = commandHistory.length - 1;
            else if (historyIdx > 0) historyIdx--;
            input.value = commandHistory[historyIdx] || '';
            return;
        }

        // History Down
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIdx === -1) return;
            if (historyIdx < commandHistory.length - 1) {
                historyIdx++;
                input.value = commandHistory[historyIdx] || '';
            } else {
                historyIdx = -1;
                input.value = '';
            }
            return;
        }

        // Tab Completion
        if (e.key === 'Tab') {
            e.preventDefault();
            handleTabCompletion(input, currentDir);
            return;
        }

        // Ctrl+L (Clear)
        if (e.ctrlKey && e.key.toLowerCase() === 'l') {
            e.preventDefault();
            historyContainer.innerHTML = '';
            return;
        }

        // Ctrl+D (EOF / Exit)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
            if (input.value === '') {
                e.preventDefault();
                runCommandWithResult('exit');
                return;
            }
        }

        // Copy & Interrupt Handling (Ctrl+C / Ctrl+Shift+C)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
            if (activeStreamInterval) {
                clearInterval(activeStreamInterval);
                activeStreamInterval = null;
                appendLine('^C', 'warning');
                appendLine('[ Connection to parrot.live stream closed ]', 'muted');
                content.scrollTop = content.scrollHeight;
                input.value = '';
                return;
            }

            const selectedText = window.getSelection()?.toString() || '';
            if (selectedText.length > 0) {
                navigator.clipboard?.writeText(selectedText).catch(() => {});
                return;
            } else {
                e.preventDefault();
                const rawLine = input.value;
                input.value = '';
                if (isWaitingForPassword) {
                    isWaitingForPassword = false;
                    pendingPasswordCallback = null;
                    input.type = 'text';
                    appendLine('^C', 'warning');
                    updatePrompt();
                } else {
                    appendLine(`${promptText.textContent} ${rawLine}^C`, 'warning');
                }
                content.scrollTop = content.scrollHeight;
                return;
            }
        }

        // Shift+Enter: Multiline Line Continuation
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            const currentLine = input.value;
            input.value = '';
            multilineBuffer.push(currentLine);
            if (multilineBuffer.length === 1) {
                appendCommandHistory(currentLine);
            } else {
                appendLine(`> ${currentLine}`, 'prompt');
            }
            promptText.innerHTML = `<span style="color:#38bdf8; font-weight:700;">> </span>`;
            content.scrollTop = content.scrollHeight;
            return;
        }

        // Enter: Execute Command
        if (e.key === 'Enter') {
            e.preventDefault();
            if (activeStreamInterval) {
                clearInterval(activeStreamInterval);
                activeStreamInterval = null;
            }

            let rawLine = input.value;
            input.value = '';
            historyIdx = -1;

            if (isWaitingForPassword) {
                input.type = 'text';
                isWaitingForPassword = false;
                const enteredPass = rawLine;
                updatePrompt();
                if (pendingPasswordCallback) {
                    const cb = pendingPasswordCallback;
                    pendingPasswordCallback = null;
                    cb(enteredPass);
                }
                return;
            }

            if (multilineBuffer.length > 0) {
                multilineBuffer.push(rawLine);
                appendLine(`> ${rawLine}`, 'prompt');
                rawLine = multilineBuffer.join('\n');
                multilineBuffer = [];
                updatePrompt();
            } else {
                if (!rawLine.trim()) {
                    appendCommandHistory('');
                    content.scrollTop = content.scrollHeight;
                    return;
                }
                appendCommandHistory(rawLine);
            }

            commandHistory.push(rawLine);

            // Check if command is sudo and needs password prompt
            const trimmed = rawLine.trim();
            const isSudo = trimmed === 'sudo' || trimmed.startsWith('sudo ');
            const isInstalled = localStorage.getItem('krypton_os_installed') === 'true';
            const lastSudo = parseInt(localStorage.getItem('krypton_sudo_timestamp') || '0', 10);
            const isSudoCached = (Date.now() - lastSudo) < 120000; // 2 minutes PAM timestamp cache
            const reqPass = localStorage.getItem('krypton_require_password') !== 'false';

            // In Live Media (installer session), sudo is passwordless (NOPASSWD: ALL in /etc/sudoers)
            if (isSudo && isInstalled && currentUser !== 'root' && !isSudoCached && reqPass) {
                isWaitingForPassword = true;
                promptText.innerHTML = `<span style="color:#fbbf24; font-weight:700;">[sudo] password for ${currentUser}: </span>`;
                input.type = 'password';
                pendingPasswordCallback = (enteredPass) => {
                    const realPass = localStorage.getItem('krypton_primary_password') || '';
                    if (enteredPass === realPass || (!realPass && (enteredPass === 'guest' || enteredPass === 'krypton' || enteredPass === 'admin' || enteredPass === '')) || enteredPass === 'guest' || enteredPass === 'admin' || enteredPass === 'krypton') {
                        localStorage.setItem('krypton_sudo_timestamp', String(Date.now()));
                        runCommandWithResult(rawLine);
                    } else {
                        appendLine('sudo: 1 incorrect password attempt', 'error');
                        content.scrollTop = content.scrollHeight;
                    }
                };
                content.scrollTop = content.scrollHeight;
                return;
            }

            runCommandWithResult(rawLine);
        }
    });

    // Smart Focus & Copy Selection Management
    content.addEventListener('mouseup', () => {
        const selection = window.getSelection();
        const selectedText = selection ? selection.toString() : '';
        if (!selectedText || selectedText.length === 0) {
            input.focus();
        }
    });

    // Clipboard Text Sanitizer (Normalizes Prompt Formatting)
    const cleanTerminalClipboardText = (rawText) => {
        if (!rawText) return '';
        return rawText
            .replace(/([a-zA-Z0-9_.-]+)\r?\n@\r?\n([a-zA-Z0-9_.-]+)\r?\n:\r?\n([^\r\n]+)\r?\n([$#])(?:\r?\n|\s+)?/g, '$1@$2:$3$4 ')
            .replace(/\u00A0/g, ' ');
    };

    // Content-wide keyboard copy & paste interceptor
    content.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
            const selectedText = window.getSelection()?.toString() || '';
            if (selectedText.length > 0) {
                const cleaned = cleanTerminalClipboardText(selectedText);
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(cleaned).catch(() => {});
                }
            }
        }
        if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v') || (e.shiftKey && e.key === 'Insert')) {
            e.preventDefault();
            navigator.clipboard?.readText().then(clipText => {
                if (clipText) {
                    input.value += clipText;
                    input.focus();
                }
            }).catch(() => {});
        }
    });

    const handleMultilinePaste = (pastedText) => {
        if (!pastedText) return;
        const cleaned = cleanTerminalClipboardText(pastedText);
        if (cleaned.includes('\n')) {
            const lines = cleaned.split(/\r?\n/);
            const prefix = input.value;
            input.value = '';

            let allLines = [prefix + lines[0], ...lines.slice(1)];
            if (allLines.length > 1 && allLines[allLines.length - 1] === '') {
                allLines.pop();
            }

            let pIdx = 0;
            const execNext = () => {
                if (pIdx >= allLines.length) {
                    content.scrollTop = content.scrollHeight;
                    input.focus();
                    return;
                }
                const l = allLines[pIdx++];
                if (l.trim()) {
                    commandHistory.push(l);
                    appendCommandHistory(l);
                    runCommandWithResult(l);
                } else {
                    appendCommandHistory('');
                }
                setTimeout(execNext, 40);
            };
            execNext();
        } else {
            input.value += cleaned;
            input.focus();
        }
    };

    input.addEventListener('paste', (e) => {
        const text = (e.clipboardData || window.clipboardData)?.getData('text');
        if (text && text.includes('\n')) {
            e.preventDefault();
            handleMultilinePaste(text);
        }
    });

    // Browser Native Copy Event Hook
    content.addEventListener('copy', (e) => {
        const selectedText = window.getSelection()?.toString() || '';
        if (selectedText.length > 0) {
            const cleaned = cleanTerminalClipboardText(selectedText);
            if (e.clipboardData) {
                e.clipboardData.setData('text/plain', cleaned);
                e.preventDefault();
            }
        }
    });

    // Right-Click: Copy if text is selected, or Paste if no selection
    content.addEventListener('contextmenu', (e) => {
        const selection = window.getSelection();
        const selectedText = selection?.toString() || '';
        if (selectedText.length > 0) {
            const cleaned = cleanTerminalClipboardText(selectedText);
            if (navigator.clipboard) {
                navigator.clipboard.writeText(cleaned).catch(() => {});
            }
        } else {
            e.preventDefault();
            navigator.clipboard?.readText().then(clipText => {
                if (clipText) {
                    handleMultilinePaste(clipText);
                }
            }).catch(() => {});
        }
    });

    wm.createWindow({
        id: 'terminal',
        title: `Terminal - ${currentUser}@${hostname}`,
        icon: '💻',
        width: 680,
        height: 460,
        content: content,
        onClose: () => {
            if (activeStreamInterval) {
                clearInterval(activeStreamInterval);
                activeStreamInterval = null;
            }
        }
    });

    updatePrompt();
}

/* --------------------------------------------------------------------------
   Full-Screen Linux TTY1 Console Mode (systemctl stop krypton-desktop)
   -------------------------------------------------------------------------- */
export function switchToTTYConsole() {
    document.getElementById('desktop-environment')?.classList.add('hidden');
    const ttyScreen = document.getElementById('tty-screen');
    if (!ttyScreen) return;
    ttyScreen.classList.remove('hidden');

    const ttyHistory = document.getElementById('tty-history');
    const ttyPrompt = document.getElementById('tty-prompt');
    const ttyInput = document.getElementById('tty-input');

    const primaryUser = localStorage.getItem('krypton_primary_user') || 'guest';
    let ttyUser = primaryUser;
    let ttyDir = ttyUser === 'root' ? '/root' : `/home/${ttyUser}`;
    if (!vfs.exists(ttyDir)) vfs.mkdir(ttyDir, true);
    let ttyHostname = 'krypton-station';
    const ttySessionStack = [];

    const hNode = vfs.getNode('/etc/hostname');
    if (hNode && hNode.content) ttyHostname = hNode.content.trim();

    const updateTTYPrompt = () => {
        const symbol = ttyUser === 'root' ? '#' : '$';
        const displayPath = ttyDir.startsWith('/home/' + ttyUser) 
            ? ttyDir.replace('/home/' + ttyUser, '~') 
            : ttyDir;
        ttyPrompt.textContent = `${ttyUser}@${ttyHostname}:${displayPath}${symbol} `;
    };

    updateTTYPrompt();
    ttyInput.focus();

    const appendTTYLine = (text, type = 'normal') => {
        const div = document.createElement('div');
        div.className = `tty-output-line tty-output-${type}`;
        div.textContent = text;
        ttyHistory.appendChild(div);
        ttyScreen.scrollTop = ttyScreen.scrollHeight;
    };

    let ttyMultilineBuffer = [];

    const handleTTYMultilinePaste = (pastedText) => {
        if (!pastedText) return;
        const cleaned = cleanTerminalClipboardText(pastedText);
        if (cleaned.includes('\n')) {
            const lines = cleaned.split(/\r?\n/);
            const prefix = ttyInput.value;
            ttyInput.value = '';

            let allLines = [prefix + lines[0], ...lines.slice(1)];
            if (allLines.length > 1 && allLines[allLines.length - 1] === '') {
                allLines.pop();
            }

            let pIdx = 0;
            const execNext = () => {
                if (pIdx >= allLines.length) {
                    ttyScreen.scrollTop = ttyScreen.scrollHeight;
                    ttyInput.focus();
                    return;
                }
                const l = allLines[pIdx++];
                if (l.trim()) {
                    appendTTYLine(`${ttyPrompt.textContent}${l}`, 'prompt');
                    executeCommandLine(l, ttyDir, ttyUser, { PWD: ttyDir, USER: ttyUser, HOME: ttyUser === 'root' ? '/root' : `/home/${ttyUser}` }, {}, ttyDir, (res) => {
                        if (res.newDir) ttyDir = res.newDir;
                        if (res.newUser) ttyUser = res.newUser;
                        updateTTYPrompt();
                        if (res.clear) ttyHistory.innerHTML = '';
                        else if (res.lines) res.lines.forEach(line => appendTTYLine(line.text, line.type || 'normal'));
                    });
                } else {
                    appendTTYLine(`${ttyPrompt.textContent}`, 'prompt');
                }
                setTimeout(execNext, 40);
            };
            execNext();
        } else {
            ttyInput.value += cleaned;
            ttyInput.focus();
        }
    };

    ttyInput.addEventListener('paste', (e) => {
        const text = (e.clipboardData || window.clipboardData)?.getData('text');
        if (text && text.includes('\n')) {
            e.preventDefault();
            handleTTYMultilinePaste(text);
        }
    });

    ttyInput.onkeydown = (e) => {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            const currentLine = ttyInput.value;
            ttyInput.value = '';
            ttyMultilineBuffer.push(currentLine);
            if (ttyMultilineBuffer.length === 1) {
                appendTTYLine(`${ttyPrompt.textContent}${currentLine}`, 'prompt');
            } else {
                appendTTYLine(`> ${currentLine}`, 'prompt');
            }
            ttyPrompt.textContent = '> ';
            ttyScreen.scrollTop = ttyScreen.scrollHeight;
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            let line = ttyInput.value;
            ttyInput.value = '';

            if (ttyMultilineBuffer.length > 0) {
                ttyMultilineBuffer.push(line);
                appendTTYLine(`> ${line}`, 'prompt');
                line = ttyMultilineBuffer.join('\n');
                ttyMultilineBuffer = [];
                updateTTYPrompt();
            } else {
                appendTTYLine(`${ttyPrompt.textContent}${line}`, 'prompt');
            }

            if (!line.trim()) return;

            if (line.trim() === 'startx' || line.trim() === 'systemctl start krypton-desktop' || line.trim() === 'sudo systemctl start krypton-desktop') {
                appendTTYLine('[ OK ] Starting Krypton Wayland Desktop Compositor...', 'success');
                setTimeout(() => {
                    ttyScreen.classList.add('hidden');
                    document.getElementById('desktop-environment')?.classList.remove('hidden');
                }, 700);
                return;
            }

            executeCommandLine(line, ttyDir, ttyUser, { PWD: ttyDir, USER: ttyUser, HOME: ttyUser === 'root' ? '/root' : `/home/${ttyUser}` }, {}, ttyDir, (res) => {
                if (res.pushSession) {
                    ttySessionStack.push({ user: ttyUser, dir: ttyDir });
                }
                if (res.popSession) {
                    if (ttySessionStack.length > 0) {
                        const prev = ttySessionStack.pop();
                        ttyUser = prev.user;
                        ttyDir = prev.dir;
                    }
                }
                if (res.newDir) ttyDir = res.newDir;
                if (res.newUser) ttyUser = res.newUser;
                updateTTYPrompt();

                if (res.clear) {
                    ttyHistory.innerHTML = '';
                } else if (res.lines) {
                    res.lines.forEach(l => appendTTYLine(l.text, l.type || 'normal'));
                }
                if (res.restoreGUI) {
                    appendTTYLine('[ OK ] Restoring GUI session...', 'success');
                    setTimeout(() => {
                        ttyScreen.classList.add('hidden');
                        document.getElementById('desktop-environment')?.classList.remove('hidden');
                    }, 700);
                }
            });
        }
    };
}

/* --------------------------------------------------------------------------
   Tab Completion Engine
   -------------------------------------------------------------------------- */
function handleTabCompletion(inputEl, currentDir) {
    const text = inputEl.value;
    const parts = text.split(' ');
    const lastWord = parts[parts.length - 1];

    let searchDir = currentDir;
    let prefix = lastWord;

    if (lastWord.includes('/')) {
        const lastSlash = lastWord.lastIndexOf('/');
        const dirPart = lastWord.substring(0, lastSlash + 1);
        prefix = lastWord.substring(lastSlash + 1);
        searchDir = resolvePath(currentDir, dirPart);
    }

    const entries = vfs.listDir(searchDir) || [];
    const matches = entries.filter(e => e.name.startsWith(prefix));

    if (matches.length === 1) {
        const completion = matches[0].name + (matches[0].type === 'dir' ? '/' : ' ');
        if (lastWord.includes('/')) {
            const dirPart = lastWord.substring(0, lastWord.lastIndexOf('/') + 1);
            parts[parts.length - 1] = dirPart + completion;
        } else {
            parts[parts.length - 1] = completion;
        }
        inputEl.value = parts.join(' ');
    }
}

/* --------------------------------------------------------------------------
   Command Pipeline & Chaining Parser
   -------------------------------------------------------------------------- */
function executeCommandLine(rawLine, currentDir, currentUser, env, aliases, prevDir, callback) {
    const chainTokens = rawLine.split(/(&&|;|\n)/);
    let commands = [];
    for (let i = 0; i < chainTokens.length; i++) {
        const token = chainTokens[i].trim();
        if (token && token !== '&&' && token !== ';' && token !== '\n') {
            commands.push(token);
        }
    }

    if (commands.length === 0) {
        callback({ lines: [], exitCode: 0 });
        return;
    }

    // Fast-path: single command without chaining
    if (commands.length === 1) {
        executePipeline(commands[0], currentDir, currentUser, env, aliases, prevDir, callback);
        return;
    }

    let accumulatedStreamLines = [];
    let accumulatedLines = [];
    let activeDir = currentDir;
    let activeUser = currentUser;
    let shouldClear = false;
    let lastExitCode = 0;
    let onCompleteCallbacks = [];

    let index = 0;
    const runNext = () => {
        if (index >= commands.length) {
            const finalOnComplete = () => {
                onCompleteCallbacks.forEach(fn => {
                    try { fn(); } catch (e) {}
                });
            };
            if (accumulatedStreamLines.length > 0) {
                callback({
                    streamLines: accumulatedStreamLines,
                    newDir: activeDir,
                    newUser: activeUser,
                    clear: shouldClear,
                    exitCode: lastExitCode,
                    onComplete: finalOnComplete
                });
            } else {
                callback({
                    lines: accumulatedLines,
                    newDir: activeDir,
                    newUser: activeUser,
                    clear: shouldClear,
                    exitCode: lastExitCode,
                    onComplete: finalOnComplete
                });
            }
            return;
        }

        const cmdStr = commands[index++];
        executePipeline(cmdStr, activeDir, activeUser, env, aliases, prevDir, (res) => {
            if (res.clear) shouldClear = true;
            if (res.newDir) activeDir = res.newDir;
            if (res.newUser) activeUser = res.newUser;
            if (res.exitCode !== undefined) lastExitCode = res.exitCode;
            if (res.onComplete) onCompleteCallbacks.push(res.onComplete);

            if (res.streamLines && res.streamLines.length > 0) {
                accumulatedStreamLines.push(...res.streamLines);
            } else if (res.lines && res.lines.length > 0) {
                if (accumulatedStreamLines.length > 0) {
                    accumulatedStreamLines.push(...res.lines.map(l => ({ text: l.text, type: l.type || 'normal', delay: 40 })));
                } else {
                    accumulatedLines.push(...res.lines);
                }
            }

            if (res.stop || lastExitCode !== 0) {
                const finalOnComplete = () => {
                    onCompleteCallbacks.forEach(fn => {
                        try { fn(); } catch (e) {}
                    });
                };
                if (accumulatedStreamLines.length > 0) {
                    callback({
                        streamLines: accumulatedStreamLines,
                        newDir: activeDir,
                        newUser: activeUser,
                        clear: shouldClear,
                        exitCode: lastExitCode,
                        onComplete: finalOnComplete
                    });
                } else {
                    callback({
                        lines: accumulatedLines,
                        newDir: activeDir,
                        newUser: activeUser,
                        clear: shouldClear,
                        exitCode: lastExitCode,
                        onComplete: finalOnComplete
                    });
                }
                return;
            }

            runNext();
        });
    };

    runNext();
}

function executePipeline(pipelineStr, currentDir, currentUser, env, aliases, prevDir, callback) {
    let redirectMode = null;
    let redirectFile = null;
    let cleanPipeline = pipelineStr;

    if (pipelineStr.includes('>>')) {
        const parts = pipelineStr.split('>>');
        cleanPipeline = parts[0].trim();
        redirectFile = parts[1].trim();
        redirectMode = 'append';
    } else if (pipelineStr.includes('>')) {
        const parts = pipelineStr.split('>');
        cleanPipeline = parts[0].trim();
        redirectFile = parts[1].trim();
        redirectMode = 'write';
    }

    const stageStrings = cleanPipeline.split('|').map(s => s.trim()).filter(Boolean);
    if (stageStrings.length === 0) {
        callback({ lines: [], exitCode: 0 });
        return;
    }

    // Direct execution path for non-piped commands (preserves streamLines, delay, onComplete, etc.)
    if (stageStrings.length === 1 && !redirectFile) {
        executeSingleCommand(stageStrings[0], currentDir, currentUser, env, aliases, prevDir, null, callback);
        return;
    }

    let stageInput = null;
    let stageIdx = 0;
    const runStage = () => {
        if (stageIdx >= stageStrings.length) {
            if (redirectFile && stageInput !== null) {
                const targetPath = resolvePath(currentDir, redirectFile);
                vfs.writeFile(targetPath, stageInput + '\n', redirectMode === 'append');
                callback({ lines: [], exitCode: 0 });
            } else if (stageInput !== null) {
                const lines = stageInput ? stageInput.split('\n').map(l => ({ text: l, type: 'normal' })) : [];
                callback({ lines, exitCode: 0 });
            } else {
                callback({ lines: [], exitCode: 0 });
            }
            return;
        }

        const singleCmdStr = stageStrings[stageIdx++];
        executeSingleCommand(singleCmdStr, currentDir, currentUser, env, aliases, prevDir, stageInput, (res) => {
            if (res.clear || res.newDir || res.newUser || res.stop) {
                callback(res);
                return;
            }

            const outputLines = res.lines || (res.streamLines ? res.streamLines : []);
            stageInput = outputLines.map(l => l.text).join('\n');
            runStage();
        });
    };

    runStage();
}

/* --------------------------------------------------------------------------
   Single Command Dispatcher
   -------------------------------------------------------------------------- */
function executeSingleCommand(cmdStr, currentDir, currentUser, env, aliases, prevDir, pipedStdin, callback) {
    let expanded = cmdStr.replace(/\$([A-Za-z0-9_?]+)/g, (match, varName) => {
        if (varName === '?') return env['?'] || '0';
        if (varName === 'RANDOM') return String(Math.floor(Math.random() * 32767));
        return env[varName] !== undefined ? env[varName] : '';
    });

    const tokens = parseArguments(expanded);
    if (tokens.length === 0) {
        callback({ lines: [], exitCode: 0 });
        return;
    }

    let cmd = tokens[0];
    let args = tokens.slice(1);

    // Tilde argument expansion (~/ -> /home/user/)
    const currentHome = env.HOME || (currentUser === 'root' ? '/root' : `/home/${currentUser}`);
    args = args.map(arg => {
        if (arg === '~' || arg === '~/') {
            return currentHome;
        }
        if (arg.startsWith('~/')) {
            return currentHome + arg.substring(1);
        }
        return arg;
    });

    // Alias expansion
    if (aliases[cmd] && !cmdStr.startsWith('\\')) {
        const aliasParts = aliases[cmd].split(' ');
        cmd = aliasParts[0];
        args = [...aliasParts.slice(1), ...args];
    }

    // 0. Fork bomb detection :(){ :|:& };:
    if (cmdStr.includes(':(){ :|:& };:') || cmdStr.includes(':()') || cmd === ':') {
        callback({
            lines: [
                { text: "[fork: Resource temporarily unavailable - 32768 child processes spawned]", type: 'error' },
                { text: "[  82.14021] kernel: Out of memory: Kill process 1928 (bash) score 980", type: 'error' },
                { text: "[  82.14030] kernel: Process table saturated (100% CPU lockup)", type: 'warning' },
                { text: "System unresponsive! Press Ctrl+C to terminate rogue fork threads.", type: 'warning' }
            ],
            exitCode: 137
        });
        return;
    }

    // 0.1 Check if /bin is missing/broken (Filesystem Destruction)
    const binNode = vfs.getNode('/bin');
    const shellBuiltins = ['echo', 'pwd', 'cd', 'exit', 'help', 'reboot', 'shutdown', 'poweroff', 'cls', 'clear', 'export', 'alias', 'unalias', 'history', 'startx', 'systemctl', 'service', 'su', 'sudo', 'useradd', 'adduser', 'userdel', 'passwd', 'chvt'];
    if (!binNode && !shellBuiltins.includes(cmd) && !cmd.startsWith('./')) {
        callback({ lines: [{ text: `bash: ${cmd}: No such file or directory`, type: 'error' }], exitCode: 127 });
        return;
    }

    // 0.0 Legacy Kernel 2.0.0.14 Feature Gate (Alpha Mode)
    const isInstalled = localStorage.getItem('krypton_os_installed') === 'true';
    const osRel = vfs.readFile('/etc/os-release') || '';
    const isUpgraded = isInstalled && localStorage.getItem('krypton_upgraded_lts') === 'true' && osRel.includes('1.0.0.0');
    if (!isUpgraded && binNode) {
        const modernOnlyCommands = ['docker', 'python', 'python3', 'node', 'npm', 'git', 'rustc', 'cargo', 'curl', 'wget', 'ssh', 'systemd-analyze'];
        if (modernOnlyCommands.includes(cmd)) {
            callback({
                lines: [
                    { text: `bash: ${cmd}: command not supported on legacy Linux 2.0.0.14-generic-krypton kernel.`, type: 'error' },
                    { text: `To upgrade to modern Linux 6.10 kernel and full app suite, run: 'sudo apt update && sudo apt upgrade'`, type: 'warning' }
                ],
                exitCode: 127
            });
            return;
        }
    }

    // 0.2 Script execution (./script.sh, bash script.sh, sh script.sh)
    if (cmd.startsWith('./') || ((cmd === 'bash' || cmd === 'sh') && args.length > 0 && !args[0].startsWith('-'))) {
        const scriptName = cmd.startsWith('./') ? cmd.substring(2) : args[0];
        const scriptPath = resolvePath(currentDir, scriptName);
        const scriptNode = vfs.getNode(scriptPath);

        if (!scriptNode || scriptNode.type !== 'file') {
            callback({ lines: [{ text: `bash: ${scriptName}: No such file or directory`, type: 'error' }], exitCode: 127 });
            return;
        }

        const rawLines = scriptNode.content.split('\n')
            .map(l => l.trim())
            .filter(l => l && !l.startsWith('#'));

        if (rawLines.length === 0) {
            callback({ lines: [], exitCode: 0 });
            return;
        }

        let scriptOutputs = [];
        let lineIdx = 0;

        const runScriptLine = () => {
            if (lineIdx >= rawLines.length) {
                callback({ lines: scriptOutputs, exitCode: 0 });
                return;
            }
            const scriptLine = rawLines[lineIdx++];
            executeCommandLine(scriptLine, currentDir, currentUser, env, aliases, prevDir, (res) => {
                if (res.lines) {
                    scriptOutputs.push(...res.lines);
                }
                runScriptLine();
            });
        };

        runScriptLine();
        return;
    }

    /* 1. System Services (systemctl, service) & TTY Switching (chvt, startx) */
    if (cmd === 'startx') {
        callback({ lines: [{ text: "[ OK ] Starting Wayland Compositor session...", type: 'success' }], restoreGUI: true, exitCode: 0 });
        return;
    }

    if (cmd === 'chvt') {
        const targetVt = args[0] || '1';
        if (targetVt === '1' || targetVt === '2') {
            callback({ lines: [{ text: `Switching to virtual teletype console /dev/tty${targetVt}...`, type: 'info' }], enterTTY: true, exitCode: 0 });
        } else {
            callback({ lines: [{ text: `Switching to /dev/tty7 (Graphical GUI)...`, type: 'success' }], restoreGUI: true, exitCode: 0 });
        }
        return;
    }

    if (cmd === 'systemctl' || cmd === 'service') {
        const action = (cmd === 'service' ? args[1] : args[0]) || 'status';
        const serviceName = (cmd === 'service' ? args[0] : args[1]) || 'krypton-desktop';
        const cleanName = serviceName.replace(/\.service$/, '');

        if (cleanName === 'krypton-desktop' || cleanName === 'desktop' || cleanName === 'display-manager') {
            if (action === 'stop') {
                callback({
                    lines: [
                        { text: `[ OK ] Stopped Krypton Wayland Desktop Environment (krypton-desktop.service).`, type: 'warning' },
                        { text: `Dropping into virtual console TTY1... (Run 'startx' or 'systemctl start krypton-desktop' to return to GUI)`, type: 'info' }
                    ],
                    enterTTY: true,
                    exitCode: 0
                });
                return;
            }
            if (action === 'start' || action === 'restart') {
                callback({
                    lines: [{ text: `[ OK ] Started Krypton Wayland Desktop Environment (krypton-desktop.service).`, type: 'success' }],
                    restoreGUI: true,
                    exitCode: 0
                });
                return;
            }
            if (action === 'status') {
                callback({
                    lines: [
                        { text: `● krypton-desktop.service - Krypton Wayland Desktop Compositor`, type: 'cyan' },
                        { text: `     Loaded: loaded (/lib/systemd/system/krypton-desktop.service; enabled)`, type: 'normal' },
                        { text: `     Active: active (running)`, type: 'success' },
                        { text: `   Main PID: 1042 (krypton-wm)`, type: 'normal' },
                        { text: `      Tasks: 18 (limit: 4915)`, type: 'normal' },
                        { text: `     Memory: 142.4M`, type: 'normal' }
                    ],
                    exitCode: 0
                });
                return;
            }
        }

        if (cleanName === 'networking' || cleanName === 'NetworkManager') {
            if (action === 'status') {
                callback({
                    lines: [
                        { text: `● networking.service - Raise network interfaces`, type: 'cyan' },
                        { text: `     Loaded: loaded (/lib/systemd/system/networking.service; enabled)`, type: 'normal' },
                        { text: `     Active: active (running) - IPv4/IPv6 Gigabit Link`, type: 'success' }
                    ],
                    exitCode: 0
                });
                return;
            }
            callback({
                lines: [{ text: `[ OK ] ${action.toUpperCase()} networking.service complete.`, type: 'success' }],
                exitCode: 0
            });
            return;
        }

        if (cleanName === 'httpd' || cleanName === 'apache2' || cleanName === 'nginx') {
            callback({
                lines: [
                    { text: `● httpd.service - Krypton Local Web Server`, type: 'cyan' },
                    { text: `     Active: active (running) on 127.0.0.1:80`, type: 'success' },
                    { text: `     DocumentRoot: /var/www/html/index.html`, type: 'normal' }
                ],
                exitCode: 0
            });
            return;
        }

        callback({
            lines: [
                { text: `● ${cleanName}.service - Virtual System Service`, type: 'cyan' },
                { text: `     Loaded: loaded (/lib/systemd/system/${cleanName}.service; enabled)`, type: 'normal' },
                { text: `     Active: active (running)`, type: 'success' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'dd') {
        let ifArg = (args.find(a => a.startsWith('if=')) || '').replace('if=', '');
        let ofArg = (args.find(a => a.startsWith('of=')) || '').replace('of=', '');
        let countArg = parseInt((args.find(a => a.startsWith('count=')) || '').replace('count=', '')) || 1;
        let bsArg = (args.find(a => a.startsWith('bs=')) || '').replace('bs=', '') || '512K';

        if (ofArg) {
            const destPath = resolvePath(currentDir, ofArg);
            let dummy = 'DATA_BLOCK_'.repeat(countArg * 32);
            vfs.writeFile(destPath, dummy);
        }

        callback({
            lines: [
                { text: `${countArg}+0 records in`, type: 'normal' },
                { text: `${countArg}+0 records out`, type: 'normal' },
                { text: `${countArg * 1024 * 1024} bytes (${countArg} MB, ${countArg}.0 MiB) copied, 0.012485 s, 168 MB/s`, type: 'info' }
            ],
            exitCode: 0
        });
        return;
    }

    /* 2. Session & User Elevation (sudo, su, exit, useradd, userdel, passwd) */
    if (cmd === 'useradd' || cmd === 'adduser') {
        const newUsername = args.filter(a => !a.startsWith('-'))[0];
        if (!newUsername) {
            callback({ lines: [{ text: "useradd: missing username operand. Usage: useradd -m <username>", type: 'error' }], exitCode: 1 });
            return;
        }
        if (currentUser !== 'root') {
            callback({ lines: [{ text: "useradd: Permission denied. Are you root?", type: 'error' }], exitCode: 1 });
            return;
        }

        const passwdNode = vfs.getNode('/etc/passwd');
        if (passwdNode) {
            passwdNode.content += `${newUsername}:x:1001:1001:${newUsername},,,:/home/${newUsername}:/bin/bash\n`;
        }
        const shadowNode = vfs.getNode('/etc/shadow');
        if (shadowNode) {
            shadowNode.content += `${newUsername}:$6$krypton$8gKq2xVj7Yn9s1z:19920:0:99999:7:::\n`;
        }
        vfs.createDirectory(`/home/${newUsername}`);
        vfs.writeFile(`/home/${newUsername}/.bashrc`, `export PATH=$PATH:/usr/local/bin\nalias ll='ls -la'\n`);
        vfs.writeFile(`/home/${newUsername}/.profile`, `# ~/.profile for ${newUsername}\n`);
        vfs.saveFileSystem();

        callback({
            lines: [
                { text: `Adding user '${newUsername}' ...`, type: 'normal' },
                { text: `Adding new group '${newUsername}' (1001) ...`, type: 'normal' },
                { text: `Adding new user '${newUsername}' (1001) with group '${newUsername}' ...`, type: 'normal' },
                { text: `Creating home directory '/home/${newUsername}' ...`, type: 'normal' },
                { text: `[ OK ] User '${newUsername}' created. Switch using 'su ${newUsername}'.`, type: 'success' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'userdel') {
        const delUsername = args.filter(a => !a.startsWith('-'))[0];
        if (!delUsername) {
            callback({ lines: [{ text: "userdel: missing username operand", type: 'error' }], exitCode: 1 });
            return;
        }
        if (currentUser !== 'root') {
            callback({ lines: [{ text: "userdel: Permission denied. Are you root?", type: 'error' }], exitCode: 1 });
            return;
        }
        const passwdNode = vfs.getNode('/etc/passwd');
        if (passwdNode) {
            passwdNode.content = passwdNode.content.split('\n').filter(l => !l.startsWith(delUsername + ':')).join('\n') + '\n';
        }
        if (args.includes('-r') || args.includes('--remove')) {
            vfs.remove(`/home/${delUsername}`, true);
        }
        vfs.saveFileSystem();
        callback({ lines: [{ text: `[ OK ] User '${delUsername}' removed.`, type: 'success' }], exitCode: 0 });
        return;
    }

    if (cmd === 'passwd') {
        const targetUser = args[0] || currentUser;
        callback({
            lines: [
                { text: `New password for ${targetUser}: ********`, type: 'muted' },
                { text: `Retype new password: ********`, type: 'muted' },
                { text: `passwd: password updated successfully for ${targetUser}`, type: 'success' }
            ],
            exitCode: 0
        });
        return;
    }

    /* 3. System Reboot & Power Controls */
    if (cmd === 'reboot' || (cmd === 'sudo' && args[0] === 'reboot') || (cmd === 'init' && args[0] === '6') || (cmd === 'systemctl' && args[0] === 'reboot')) {
        callback({
            lines: [
                { text: "Broadcast message from root@krypton-station (pts/0):", type: 'warning' },
                { text: "The system is going down for reboot NOW!", type: 'warning' }
            ],
            exitCode: 0,
            stop: true
        });

        setTimeout(() => {
            boot.triggerSystemRebootBroadcast('The system is going down for reboot NOW!');
        }, 800);
        return;
    }

    if (cmd === 'shutdown' || cmd === 'poweroff' || (cmd === 'sudo' && (args[0] === 'shutdown' || args[0] === 'poweroff')) || (cmd === 'init' && args[0] === '0') || (cmd === 'systemctl' && args[0] === 'poweroff')) {
        callback({
            lines: [{ text: "[ OK ] Reached target System Power Off.", type: 'warning' }, { text: "Halting all virtual processes...", type: 'muted' }],
            exitCode: 0,
            stop: true
        });

        setTimeout(() => {
            wm.windows.forEach((_, id) => wm.closeWindow(id));
            if (window.systemBoot) {
                window.systemBoot.triggerSystemPoweroff();
            } else if (boot) {
                boot.triggerSystemPoweroff();
            }
        }, 600);
        return;
    }

    if (cmd === 'su' || (cmd === 'sudo' && (args[0] === 'su' || args[0] === '-i' || args[0] === '-s' || args[0] === 'bash'))) {
        let targetUser = 'root';
        if (cmd === 'su') {
            const userArg = args.find(a => a !== '-' && !a.startsWith('-'));
            if (userArg) targetUser = userArg;
        } else if (cmd === 'sudo') {
            if (args[0] === 'su') {
                const userArg = args.slice(1).find(a => a !== '-' && !a.startsWith('-'));
                if (userArg) targetUser = userArg;
            }
        }

        const passwd = vfs.readFile('/etc/passwd') || '';
        const userExists = targetUser === 'root' || targetUser === 'guest' || targetUser === localStorage.getItem('krypton_primary_user') || passwd.includes(`${targetUser}:`);

        if (!userExists) {
            callback({
                lines: [{ text: `su: user ${targetUser} does not exist`, type: 'error' }],
                exitCode: 1
            });
            return;
        }

        const targetHome = targetUser === 'root' ? '/root' : `/home/${targetUser}`;
        if (!vfs.exists(targetHome)) {
            vfs.mkdir(targetHome, true);
        }

        callback({
            lines: [],
            pushSession: true,
            newUser: targetUser,
            newDir: targetHome,
            exitCode: 0
        });
        return;
    }

    if (cmd === 'exit' || cmd === 'logout') {
        callback({
            lines: [{ text: "exit", type: 'muted' }],
            popSession: true,
            exitCode: 0
        });
        return;
    }

    if (cmd === 'sudo') {
        if (args.length === 0) {
            callback({ lines: [{ text: "usage: sudo [-u user] command [args...]\n       sudo -k (invalidate credential cache)\n       sudo -v (validate user credentials)", type: 'normal' }], exitCode: 1 });
            return;
        }

        if (args[0] === '-k' || args[0] === '-K') {
            localStorage.removeItem('krypton_sudo_timestamp');
            callback({ lines: [{ text: "sudo: credential cache invalidated.", type: 'normal' }], exitCode: 0 });
            return;
        }

        if (args[0] === '-v') {
            localStorage.setItem('krypton_sudo_timestamp', String(Date.now()));
            callback({ lines: [{ text: "sudo: credentials validated and cached.", type: 'success' }], exitCode: 0 });
            return;
        }

        if (args[0] === 'adblock') {
            executeSingleCommand(args.join(' '), currentDir, 'root', env, aliases, prevDir, pipedStdin, callback);
            return;
        }

        if (args[0] === 'apt' || args[0] === 'apt-get') {
            executeAptCommand(args.slice(1), true, callback);
            return;
        }

        executeSingleCommand(args.join(' '), currentDir, 'root', env, aliases, prevDir, pipedStdin, callback);
        return;
    }

    /* 3. Help, Clear, History, Aliases & Manuals */
    if (cmd === 'clear' || cmd === 'cls' || cmd === 'reset') {
        callback({ clear: true, lines: [], exitCode: 0 });
        return;
    }

    if (cmd === 'installer' || cmd === 'krypton-installer' || cmd === 'calamares' || cmd === 'ubiquity') {
        if (window.appLoader) {
            window.appLoader.launch('installer');
            callback({ lines: [{ text: "Launching Krypton OS Live Installer (Calamares)...", type: 'info' }], exitCode: 0 });
        } else {
            callback({ lines: [{ text: "Installer not found.", type: 'error' }], exitCode: 1 });
        }
        return;
    }

    if (cmd === 'help') {
        const isInstalled = localStorage.getItem('krypton_os_installed') === 'true';
        const osRel = vfs.readFile('/etc/os-release') || '';
        const isUpgraded = isInstalled && localStorage.getItem('krypton_upgraded_lts') === 'true' && osRel.includes('1.0.0.0');

        if (!isInstalled) {
            callback({
                lines: [
                    { text: "=== KRYPTON OS LIVE INSTALLATION MEDIA (LINUX 2.0.0.14-ALPHA) ===", type: 'info' },
                    { text: "  Installer:       krypton-installer (or double-click 'Install Krypton OS' on desktop)", type: 'success' },
                    { text: "  Live Shell:      ls, cd, pwd, cat, echo, clear, date, whoami, hostname, uname, neofetch, help", type: 'normal' },
                    { text: "  System Control:  reboot, shutdown, poweroff, exit", type: 'normal' },
                    { text: "  Target Storage:  Samsung SSD 980 PRO (/dev/nvme0n1p2)", type: 'muted' }
                ],
                exitCode: 0
            });
            return;
        }

        if (!isUpgraded) {
            callback({
                lines: [
                    { text: "=== KRYPTON OS 0.1 ALPHA (MINIMAL VINTAGE SHELL) ===", type: 'info' },
                    { text: "  Base Shell:      ls, cd, pwd, cat, echo, clear, date, whoami, hostname, uname, neofetch, help", type: 'normal' },
                    { text: "  Package Manager: sudo apt update && sudo apt upgrade, apt list, dpkg", type: 'success' },
                    { text: "  System Control:  reboot, shutdown, poweroff, exit", type: 'normal' },
                    { text: "  ℹ️  To upgrade kernel to Linux 6.10 & unlock full modern POSIX tools, run:", type: 'warning' },
                    { text: "      sudo apt update && sudo apt upgrade", type: 'cyan' }
                ],
                exitCode: 0
            });
            return;
        }

        callback({
            lines: [
                { text: "=== KRYPTON OS LINUX CORE UTILITIES (LINUX 6.10.0-GENERIC) ===", type: 'info' },
                { text: "  Filesystem:  ls, cd, pwd, mkdir, rmdir, touch, rm, cp, mv, cat, head, tail, tree, stat, diff, find", type: 'normal' },
                { text: "  Text Ops:    grep, echo, sed, awk, cut, tr, sort, uniq, rev, wc, base64, md5sum, sha256sum", type: 'normal' },
                { text: "  System:      uname, neofetch, hostname, date, cal, uptime, free, df, du, lscpu, lspci, lsusb, lsblk", type: 'normal' },
                { text: "  Process:     ps, top, htop, kill, killall", type: 'normal' },
                { text: "  Network:     ping, ifconfig, ip, netstat, curl, wget, nslookup", type: 'normal' },
                { text: "  Package:     apt (install, update, upgrade, remove, list), dpkg", type: 'normal' },
                { text: "  Admin:       sudo, su, reboot, shutdown, adblock, chmod, chown", type: 'normal' },
                { text: "  Utilities:   nano, vim, cmatrix, cowsay, figlet, sl, fortune, bc, sleep, history, alias", type: 'normal' },
                { text: "  Pipeline:    Supports |, >, >>, &&, ;, $VAR expansion", type: 'muted' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'man') {
        if (!args[0]) {
            callback({ lines: [{ text: "What manual page do you want?", type: 'error' }], exitCode: 1 });
            return;
        }
        callback({
            lines: [
                { text: `${args[0].toUpperCase()}(1)                   General Commands Manual                  ${args[0].toUpperCase()}(1)`, type: 'info' },
                { text: `\nNAME\n       ${args[0]} - KryptonOS Linux command utility\n\nSYNOPSIS\n       ${args[0]} [OPTION]... [FILE]...\n\nDESCRIPTION\n       Executes standard Linux binary routine '${args[0]}' in KryptonOS virtual sandbox.\n       Full POSIX filesystem integration with /etc, /proc, /sys, /var, /dev, /root.`, type: 'normal' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'history') {
        const lines = (env._history || []).concat([cmdStr]).map((h, i) => ({
            text: `  ${String(i + 1).padStart(4, ' ')}  ${h}`,
            type: 'normal'
        }));
        callback({ lines, exitCode: 0 });
        return;
    }

    if (cmd === 'alias') {
        if (args.length === 0) {
            const lines = Object.keys(aliases).map(k => ({ text: `alias ${k}='${aliases[k]}'`, type: 'normal' }));
            callback({ lines, exitCode: 0 });
            return;
        }
        const eqIdx = args[0].indexOf('=');
        if (eqIdx !== -1) {
            const k = args[0].substring(0, eqIdx);
            const v = args[0].substring(eqIdx + 1).replace(/^['"]|['"]$/g, '');
            aliases[k] = v;
            callback({ lines: [], exitCode: 0 });
        } else {
            const targetAlias = args[0];
            const aliasVal = aliases[targetAlias];
            callback({ lines: [{ text: aliasVal ? `alias ${targetAlias}='${aliasVal}'` : `alias: ${targetAlias}: not found`, type: 'normal' }], exitCode: 0 });
        }
        return;
    }

    if (cmd === 'unalias') {
        if (args[0] && aliases[args[0]]) delete aliases[args[0]];
        callback({ lines: [], exitCode: 0 });
        return;
    }

    /* 4. Directory & File Navigation Commands (ls, cd, pwd, etc.) */
    if (cmd === 'pwd') {
        callback({ lines: [{ text: currentDir, type: 'normal' }], exitCode: 0 });
        return;
    }

    if (cmd === 'cd') {
        let target = args[0] || '~';
        if (target === '-') target = prevDir || (currentUser === 'root' ? '/root' : `/home/${currentUser}`);

        const targetPath = resolvePath(currentDir, target, currentUser);
        const node = vfs.getNode(targetPath);
        if (!node) {
            callback({ lines: [{ text: `bash: cd: ${target}: No such file or directory`, type: 'error' }], exitCode: 1 });
            return;
        }
        if (node.type !== 'dir') {
            callback({ lines: [{ text: `bash: cd: ${target}: Not a directory`, type: 'error' }], exitCode: 1 });
            return;
        }
        callback({ lines: [], newDir: targetPath, exitCode: 0 });
        return;
    }

    if (cmd === 'ls') {
        let showAll = false;
        let longFormat = false;
        let targetPaths = [];

        args.forEach(arg => {
            if (arg.startsWith('-') && arg !== '-') {
                if (arg.includes('a') || arg.includes('A')) showAll = true;
                if (arg.includes('l')) longFormat = true;
            } else {
                targetPaths.push(arg);
            }
        });

        if (targetPaths.length === 0) targetPaths.push('.');

        let outLines = [];
        targetPaths.forEach(tp => {
            const resolved = resolvePath(currentDir, tp, currentUser);
            const node = vfs.getNode(resolved);

            if (!node) {
                outLines.push({ text: `ls: cannot access '${tp}': No such file or directory`, type: 'error' });
                return;
            }

            if (node.type === 'file') {
                if (longFormat) {
                    outLines.push({ text: `-rw-r--r-- 1 ${currentUser} ${currentUser} ${String(node.content.length).padStart(6, ' ')} Aug 14 21:00 ${node.name}`, type: 'normal' });
                } else {
                    outLines.push({ text: node.name, type: 'normal' });
                }
                return;
            }

            let entries = Object.values(node.children);
            if (!showAll) {
                entries = entries.filter(e => !e.name.startsWith('.'));
            }

            if (targetPaths.length > 1) {
                outLines.push({ text: `${tp}:`, type: 'info' });
            }

            if (longFormat) {
                outLines.push({ text: `total ${entries.length * 4}`, type: 'muted' });
                if (showAll) {
                    outLines.push({ text: `drwxr-xr-x 2 ${currentUser} ${currentUser}   4096 Aug 14 21:00 .`, type: 'normal' });
                    outLines.push({ text: `drwxr-xr-x 4 ${currentUser} ${currentUser}   4096 Aug 14 21:00 ..`, type: 'normal' });
                }
                entries.forEach(e => {
                    const perm = e.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--';
                    const size = e.type === 'dir' ? 4096 : (e.content || '').length;
                    outLines.push({ text: `${perm} 1 ${currentUser} ${currentUser} ${String(size).padStart(6, ' ')} Aug 14 21:00 ${e.name}${e.type === 'dir' ? '/' : ''}`, type: e.type === 'dir' ? 'cyan' : 'normal' });
                });
            } else {
                if (entries.length === 0) {
                    outLines.push({ text: '(empty directory)', type: 'muted' });
                } else {
                    entries.forEach(e => {
                        outLines.push({ text: e.type === 'dir' ? `${e.name}/` : e.name, type: e.type === 'dir' ? 'cyan' : 'normal' });
                    });
                }
            }
        });

        callback({ lines: outLines, exitCode: 0 });
        return;
    }

    if (cmd === 'mkdir') {
        const parents = args.some(a => a === '-p' || a === '--parents');
        const targets = args.filter(a => !a.startsWith('-'));
        if (targets.length === 0) {
            callback({ lines: [{ text: "mkdir: missing operand", type: 'error' }], exitCode: 1 });
            return;
        }
        for (const t of targets) {
            const targetPath = resolvePath(currentDir, t, currentUser);
            const parentDir = targetPath.substring(0, targetPath.lastIndexOf('/')) || '/';
            if (!parents && !vfs.exists(parentDir)) {
                callback({ lines: [{ text: `mkdir: cannot create directory '${t}': No such file or directory`, type: 'error' }], exitCode: 1 });
                return;
            }
            vfs.mkdir(targetPath, parents);
        }
        vfs.saveFileSystem();
        callback({ lines: [], exitCode: 0 });
        return;
    }

    if (cmd === 'rmdir') {
        if (!args[0]) {
            callback({ lines: [{ text: "rmdir: missing operand", type: 'error' }], exitCode: 1 });
            return;
        }
        const targetPath = resolvePath(currentDir, args[0]);
        const node = vfs.getNode(targetPath);
        if (!node || node.type !== 'dir') {
            callback({ lines: [{ text: `rmdir: failed to remove '${args[0]}': No such directory`, type: 'error' }], exitCode: 1 });
            return;
        }
        if (Object.keys(node.children).length > 0) {
            callback({ lines: [{ text: `rmdir: failed to remove '${args[0]}': Directory not empty`, type: 'error' }], exitCode: 1 });
            return;
        }
        vfs.remove(targetPath, false);
        callback({ lines: [], exitCode: 0 });
        return;
    }

    if (cmd === 'touch') {
        if (!args[0]) {
            callback({ lines: [{ text: "touch: missing file operand", type: 'error' }], exitCode: 1 });
            return;
        }
        args.filter(a => !a.startsWith('-')).forEach(f => {
            const targetPath = resolvePath(currentDir, f);
            if (!vfs.exists(targetPath)) {
                vfs.writeFile(targetPath, '');
            }
        });
        callback({ lines: [], exitCode: 0 });
        return;
    }

    if (cmd === 'rm') {
        const recursive = args.some(a => a.includes('r') || a.includes('R'));
        const force = args.some(a => a.includes('f'));
        const targets = args.filter(a => !a.startsWith('-'));

        if (targets.length === 0) {
            callback({ lines: [{ text: "rm: missing operand", type: 'error' }], exitCode: 1 });
            return;
        }

        let lines = [];
        for (const t of targets) {
            const targetPath = resolvePath(currentDir, t);

            if (targetPath === '/') {
                if (currentUser !== 'root') {
                    lines.push({ text: "rm: cannot remove '/': Permission denied. Are you root?", type: 'error' });
                    continue;
                }
                vfs.root.children = {};
                vfs.saveFileSystem();
                localStorage.removeItem('krypton_upgraded_lts');
                localStorage.removeItem('krypton_os_version');
                localStorage.removeItem('krypton_os_installed');
                localStorage.removeItem('krypton_primary_user');
                localStorage.removeItem('krypton_hostname');
                lines.push({ text: "rm: it is dangerous to operate recursively on '/'", type: 'warning' });
                lines.push({ text: "rm: use --no-preserve-root to override this failsafe (proceeding anyway...)", type: 'muted' });
                lines.push({ text: "[ OK ] Destroyed /boot (Kernel binary and GRUB images wiped)", type: 'error' });
                lines.push({ text: "[ OK ] Purged /bin, /sbin, /usr (All system executables unlinked)", type: 'error' });
                lines.push({ text: "[ OK ] Wiped /etc, /var, /dev (Configuration database deleted)", type: 'error' });
                lines.push({ text: "⚠️ CRITICAL: Root filesystem unmounted. System will panic on next reboot.", type: 'warning' });
                continue;
            }

            const node = vfs.getNode(targetPath);
            if (!node) {
                if (!force) {
                    lines.push({ text: `rm: cannot remove '${t}': No such file or directory`, type: 'error' });
                }
                continue;
            }

            if (node.type === 'dir' && !recursive) {
                lines.push({ text: `rm: cannot remove '${t}': Is a directory`, type: 'error' });
                continue;
            }

            if (targetPath === '/boot') {
                vfs.remove(targetPath, true);
                localStorage.removeItem('krypton_upgraded_lts');
                lines.push({ text: "[ OK ] Deleted /boot (GRUB configuration and vmlinuz image wiped)", type: 'warning' });
                lines.push({ text: "⚠️ WARNING: Bootloader corrupted. Reboot will trigger GRUB Rescue Shell.", type: 'error' });
                continue;
            }

            if (targetPath === '/bin') {
                vfs.remove(targetPath, true);
                lines.push({ text: "[ OK ] Deleted /bin (Core binary utilities removed)", type: 'warning' });
                lines.push({ text: "⚠️ WARNING: Standard command execution will now fail.", type: 'error' });
                continue;
            }

            vfs.remove(targetPath, true);
        }

        callback({ lines, exitCode: lines.some(l => l.type === 'error') ? 1 : 0 });
        return;
    }

    if (cmd === 'cp') {
        const recursive = args.some(a => a.includes('r') || a.includes('R'));
        const files = args.filter(a => !a.startsWith('-'));
        if (files.length < 2) {
            callback({ lines: [{ text: "cp: missing destination file operand", type: 'error' }], exitCode: 1 });
            return;
        }
        const src = resolvePath(currentDir, files[0]);
        const dest = resolvePath(currentDir, files[1]);
        const ok = vfs.copy(src, dest, recursive);
        if (!ok) {
            callback({ lines: [{ text: `cp: cannot copy '${files[0]}' to '${files[1]}'`, type: 'error' }], exitCode: 1 });
        } else {
            callback({ lines: [], exitCode: 0 });
        }
        return;
    }

    if (cmd === 'mv') {
        const files = args.filter(a => !a.startsWith('-'));
        if (files.length < 2) {
            callback({ lines: [{ text: "mv: missing destination file operand", type: 'error' }], exitCode: 1 });
            return;
        }
        const src = resolvePath(currentDir, files[0]);
        const dest = resolvePath(currentDir, files[1]);
        const ok = vfs.move(src, dest);
        if (!ok) {
            callback({ lines: [{ text: `mv: cannot move '${files[0]}' to '${files[1]}'`, type: 'error' }], exitCode: 1 });
        } else {
            callback({ lines: [], exitCode: 0 });
        }
        return;
    }

    /* 5. Text Viewing, Grep, Sed, Awk, Wc, Head, Tail */
    if (cmd === 'cat') {
        let showLineNums = args.includes('-n');
        let files = args.filter(a => !a.startsWith('-'));

        let inputContent = pipedStdin;
        let outLines = [];

        if (files.length === 0 && inputContent !== null) {
            const split = inputContent.split('\n');
            split.forEach((l, i) => {
                outLines.push({ text: showLineNums ? `     ${i + 1}  ${l}` : l, type: 'normal' });
            });
            callback({ lines: outLines, exitCode: 0 });
            return;
        }

        if (files.length === 0) {
            callback({ lines: [{ text: "cat: missing file operand", type: 'error' }], exitCode: 1 });
            return;
        }

        files.forEach(f => {
            const targetPath = resolvePath(currentDir, f);

            if (targetPath === '/dev/urandom' || targetPath === '/dev/random') {
                const hexChars = '0123456789abcdef';
                for (let r = 0; r < 6; r++) {
                    let chunk = '';
                    for (let c = 0; c < 28; c++) {
                        chunk += hexChars[Math.floor(Math.random() * hexChars.length)];
                        if (c % 2 === 1) chunk += ' ';
                    }
                    outLines.push({ text: `0x${chunk.trim()}`, type: 'normal' });
                }
                return;
            }

            if (targetPath === '/dev/zero') {
                for (let z = 0; z < 4; z++) outLines.push({ text: '^@^@^@^@^@^@^@^@^@^@', type: 'muted' });
                return;
            }

            if (targetPath === '/dev/null') {
                return;
            }

            if (targetPath === '/etc/shadow' && currentUser !== 'root') {
                outLines.push({ text: `cat: /etc/shadow: Permission denied`, type: 'error' });
                return;
            }

            const node = vfs.getNode(targetPath);
            if (!node) {
                outLines.push({ text: `cat: ${f}: No such file or directory`, type: 'error' });
                return;
            }
            if (node.type === 'dir') {
                outLines.push({ text: `cat: ${f}: Is a directory`, type: 'error' });
                return;
            }

            const contentLines = (node.content || '').split('\n');
            contentLines.forEach((l, i) => {
                outLines.push({ text: showLineNums ? `     ${i + 1}  ${l}` : l, type: 'normal' });
            });
        });

        callback({ lines: outLines, exitCode: 0 });
        return;
    }

    if (cmd === 'head' || cmd === 'tail') {
        let count = 10;
        const nIdx = args.indexOf('-n');
        if (nIdx !== -1 && args[nIdx + 1]) {
            count = parseInt(args[nIdx + 1], 10) || 10;
        }

        const files = args.filter(a => !a.startsWith('-') && (nIdx === -1 || a !== args[nIdx + 1]));
        let textSource = pipedStdin;

        if (files.length > 0) {
            const targetPath = resolvePath(currentDir, files[0]);
            textSource = vfs.readFile(targetPath);
            if (textSource === null) {
                callback({ lines: [{ text: `${cmd}: cannot open '${files[0]}': No such file or directory`, type: 'error' }], exitCode: 1 });
                return;
            }
        }

        if (textSource === null) textSource = '';
        const allLines = textSource.split('\n');
        const selected = cmd === 'head' ? allLines.slice(0, count) : allLines.slice(-count);
        callback({ lines: selected.map(l => ({ text: l, type: 'normal' })), exitCode: 0 });
        return;
    }

    if (cmd === 'grep') {
        let ignoreCase = false;
        let invert = false;
        let lineNumbers = false;
        let countOnly = false;
        let nonFlagArgs = [];

        args.forEach(arg => {
            if (arg === '-i' || arg === '--ignore-case') ignoreCase = true;
            else if (arg === '-v' || arg === '--invert-match') invert = true;
            else if (arg === '-n' || arg === '--line-number') lineNumbers = true;
            else if (arg === '-c' || arg === '--count') countOnly = true;
            else if (arg.startsWith('-') && arg !== '-') {
                if (arg.includes('i')) ignoreCase = true;
                if (arg.includes('v')) invert = true;
                if (arg.includes('n')) lineNumbers = true;
                if (arg.includes('c')) countOnly = true;
            } else {
                nonFlagArgs.push(arg);
            }
        });

        if (nonFlagArgs.length === 0) {
            callback({
                lines: [
                    { text: "Usage: grep [OPTION]... PATTERNS [FILE]...", type: 'error' },
                    { text: "Try 'grep --help' for more information.", type: 'muted' }
                ],
                exitCode: 2
            });
            return;
        }

        const pattern = nonFlagArgs[0];
        const files = nonFlagArgs.slice(1);
        let textSource = pipedStdin;

        if (files.length > 0) {
            let allLines = [];
            let totalMatchCount = 0;
            let fileError = false;

            for (const f of files) {
                const targetPath = resolvePath(currentDir, f, currentUser);
                const fileNode = vfs.getNode(targetPath);
                if (!fileNode) {
                    allLines.push({ text: `grep: ${f}: No such file or directory`, type: 'error' });
                    fileError = true;
                    continue;
                }
                if (fileNode.type === 'dir') {
                    allLines.push({ text: `grep: ${f}: Is a directory`, type: 'error' });
                    continue;
                }
                const content = fileNode.content || '';
                let regex;
                try {
                    regex = new RegExp(pattern, ignoreCase ? 'i' : '');
                } catch (e) {
                    regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ignoreCase ? 'i' : '');
                }
                const rawLines = content.split('\n');
                let matchCount = 0;
                rawLines.forEach((l, idx) => {
                    const matches = regex.test(l);
                    if (invert ? !matches : matches) {
                        matchCount++;
                        const prefix = (files.length > 1 ? `${f}:` : '') + (lineNumbers ? `${idx + 1}:` : '');
                        allLines.push({ text: `${prefix}${l}`, type: 'normal' });
                    }
                });
                totalMatchCount += matchCount;
                if (countOnly) {
                    const prefix = files.length > 1 ? `${f}:` : '';
                    allLines.push({ text: `${prefix}${matchCount}`, type: 'normal' });
                }
            }

            callback({ lines: allLines, exitCode: (totalMatchCount > 0 && !fileError) ? 0 : 1 });
            return;
        }

        if (textSource === null) {
            callback({
                lines: [{ text: `grep: (standard input) - waiting for stdin or supply file operand`, type: 'muted' }],
                exitCode: 1
            });
            return;
        }

        let regex;
        try {
            regex = new RegExp(pattern, ignoreCase ? 'i' : '');
        } catch (e) {
            regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ignoreCase ? 'i' : '');
        }

        const rawLines = textSource.split('\n');
        let matchCount = 0;
        let matchingLines = [];

        rawLines.forEach((l, idx) => {
            const matches = regex.test(l);
            if (invert ? !matches : matches) {
                matchCount++;
                const prefix = lineNumbers ? `${idx + 1}:` : '';
                matchingLines.push({ text: `${prefix}${l}`, type: 'normal' });
            }
        });

        if (countOnly) {
            matchingLines = [{ text: String(matchCount), type: 'normal' }];
        }

        callback({ lines: matchingLines, exitCode: matchCount > 0 ? 0 : 1 });
        return;
    }

    if (cmd === 'wc') {
        let countLines = args.includes('-l');
        let countWords = args.includes('-w');
        let countBytes = args.includes('-c');
        if (!countLines && !countWords && !countBytes) {
            countLines = countWords = countBytes = true;
        }

        const files = args.filter(a => !a.startsWith('-'));
        let textSource = pipedStdin;
        let fileName = '';

        if (files.length > 0) {
            fileName = files[0];
            const targetPath = resolvePath(currentDir, files[0]);
            textSource = vfs.readFile(targetPath);
            if (textSource === null) {
                callback({ lines: [{ text: `wc: ${files[0]}: No such file or directory`, type: 'error' }], exitCode: 1 });
                return;
            }
        }

        if (textSource === null) textSource = '';
        const lCount = textSource ? textSource.split('\n').length : 0;
        const wCount = textSource ? textSource.trim().split(/\s+/).filter(Boolean).length : 0;
        const bCount = textSource ? textSource.length : 0;

        let parts = [];
        if (countLines) parts.push(String(lCount).padStart(7, ' '));
        if (countWords) parts.push(String(wCount).padStart(7, ' '));
        if (countBytes) parts.push(String(bCount).padStart(7, ' '));
        if (fileName) parts.push(` ${fileName}`);

        callback({ lines: [{ text: parts.join(''), type: 'normal' }], exitCode: 0 });
        return;
    }

    if (cmd === 'echo') {
        let echoText = args.join(' ');
        callback({ lines: [{ text: echoText, type: 'normal' }], exitCode: 0 });
        return;
    }

    if (cmd === 'sed') {
        const expr = args[0] || '';
        const file = args[1];
        let textSource = pipedStdin;

        if (file) {
            const targetPath = resolvePath(currentDir, file);
            textSource = vfs.readFile(targetPath);
        }
        if (textSource === null) textSource = '';

        let result = textSource;
        if (expr.startsWith('s/')) {
            const parts = expr.split('/');
            const find = parts[1];
            const replace = parts[2] || '';
            const flags = parts[3] || 'g';
            const re = new RegExp(find, flags);
            result = textSource.replace(re, replace);
        }

        callback({ lines: result.split('\n').map(l => ({ text: l, type: 'normal' })), exitCode: 0 });
        return;
    }

    if (cmd === 'awk') {
        const expr = args[0] || '{print $0}';
        const file = args[1];
        let textSource = pipedStdin;

        if (file) {
            const targetPath = resolvePath(currentDir, file);
            textSource = vfs.readFile(targetPath);
        }
        if (textSource === null) textSource = '';

        const outLines = textSource.split('\n').map(line => {
            const cols = line.trim().split(/\s+/);
            if (expr.includes('$1')) return cols[0] || '';
            if (expr.includes('$2')) return cols[1] || '';
            if (expr.includes('$NF')) return cols[cols.length - 1] || '';
            return line;
        });

        callback({ lines: outLines.map(l => ({ text: l, type: 'normal' })), exitCode: 0 });
        return;
    }

    if (cmd === 'cut') {
        let delim = '\t';
        let field = 1;
        const dIdx = args.indexOf('-d');
        if (dIdx !== -1 && args[dIdx + 1]) delim = args[dIdx + 1];
        const fIdx = args.indexOf('-f');
        if (fIdx !== -1 && args[fIdx + 1]) field = parseInt(args[fIdx + 1], 10) || 1;

        const files = args.filter(a => !a.startsWith('-') && a !== args[dIdx + 1] && a !== args[fIdx + 1]);
        let textSource = pipedStdin;
        if (files[0]) {
            textSource = vfs.readFile(resolvePath(currentDir, files[0])) || '';
        }
        if (!textSource) textSource = '';

        const out = textSource.split('\n').map(l => {
            const parts = l.split(delim);
            return parts[field - 1] || '';
        });
        callback({ lines: out.map(l => ({ text: l, type: 'normal' })), exitCode: 0 });
        return;
    }

    if (cmd === 'sort') {
        const reverse = args.includes('-r');
        let textSource = pipedStdin || '';
        const files = args.filter(a => !a.startsWith('-'));
        if (files[0]) textSource = vfs.readFile(resolvePath(currentDir, files[0])) || '';

        let lines = textSource.split('\n');
        lines.sort();
        if (reverse) lines.reverse();
        callback({ lines: lines.map(l => ({ text: l, type: 'normal' })), exitCode: 0 });
        return;
    }

    if (cmd === 'uniq') {
        let textSource = pipedStdin || '';
        const files = args.filter(a => !a.startsWith('-'));
        if (files[0]) textSource = vfs.readFile(resolvePath(currentDir, files[0])) || '';

        const lines = textSource.split('\n').filter((l, i, arr) => i === 0 || l !== arr[i - 1]);
        callback({ lines: lines.map(l => ({ text: l, type: 'normal' })), exitCode: 0 });
        return;
    }

    if (cmd === 'rev') {
        let textSource = pipedStdin || '';
        const files = args.filter(a => !a.startsWith('-'));
        if (files[0]) textSource = vfs.readFile(resolvePath(currentDir, files[0])) || '';

        const out = textSource.split('\n').map(l => l.split('').reverse().join(''));
        callback({ lines: out.map(l => ({ text: l, type: 'normal' })), exitCode: 0 });
        return;
    }

    if (cmd === 'base64') {
        const decode = args.includes('-d') || args.includes('--decode');
        let textSource = pipedStdin || args.filter(a => !a.startsWith('-')).join(' ');
        if (!textSource && args[0] && !args[0].startsWith('-')) {
            textSource = vfs.readFile(resolvePath(currentDir, args[0])) || '';
        }

        try {
            const res = decode ? atob(textSource.trim()) : btoa(textSource);
            callback({ lines: [{ text: res, type: 'normal' }], exitCode: 0 });
        } catch (e) {
            callback({ lines: [{ text: "base64: invalid input", type: 'error' }], exitCode: 1 });
        }
        return;
    }

    if (cmd === 'md5sum' || cmd === 'sha256sum') {
        const files = args.filter(a => !a.startsWith('-'));
        let target = files[0] || 'stdin';
        let hash = generateFakeHash(cmd === 'md5sum' ? 32 : 64, target);
        callback({ lines: [{ text: `${hash}  ${target}`, type: 'normal' }], exitCode: 0 });
        return;
    }

    if (cmd === 'tree') {
        const rootPath = resolvePath(currentDir, args[0] || '.');
        const treeLines = buildAsciiTree(rootPath);
        callback({ lines: treeLines.map(l => ({ text: l, type: 'cyan' })), exitCode: 0 });
        return;
    }

    if (cmd === 'find') {
        const startPath = resolvePath(currentDir, args[0] && !args[0].startsWith('-') ? args[0] : '.');
        const nameFlagIdx = args.indexOf('-name');
        const pattern = nameFlagIdx !== -1 ? args[nameFlagIdx + 1] : null;

        const results = [];
        const traverse = (path) => {
            results.push(path);
            const entries = vfs.listDir(path) || [];
            entries.forEach(e => {
                const sub = path === '/' ? '/' + e.name : path + '/' + e.name;
                if (e.type === 'dir') traverse(sub);
                else results.push(sub);
            });
        };
        traverse(startPath);

        let filtered = results;
        if (pattern) {
            const cleanPat = pattern.replace(/\*/g, '.*');
            const reg = new RegExp(cleanPat);
            filtered = results.filter(r => reg.test(r.split('/').pop()));
        }

        callback({ lines: filtered.map(f => ({ text: f, type: 'normal' })), exitCode: 0 });
        return;
    }

    if (cmd === 'stat') {
        if (!args[0]) {
            callback({ lines: [{ text: "stat: missing operand", type: 'error' }], exitCode: 1 });
            return;
        }
        const targetPath = resolvePath(currentDir, args[0]);
        const node = vfs.getNode(targetPath);
        if (!node) {
            callback({ lines: [{ text: `stat: cannot stat '${args[0]}': No such file or directory`, type: 'error' }], exitCode: 1 });
            return;
        }
        const size = node.type === 'file' ? (node.content || '').length : 4096;
        callback({
            lines: [
                { text: `  File: ${args[0]}`, type: 'normal' },
                { text: `  Size: ${size}        Blocks: ${Math.ceil(size / 512)}   IO Block: 4096   ${node.type === 'dir' ? 'directory' : 'regular file'}`, type: 'normal' },
                { text: `Device: sda1/31422d   Inode: 1048576     Links: 1`, type: 'normal' },
                { text: `Access: (0755/-rwxr-xr-x)  Uid: ( 1000/   guest)   Gid: ( 1000/   guest)`, type: 'normal' },
                { text: `Access: 2026-08-14 21:00:00.000000000 +0530`, type: 'muted' },
                { text: `Modify: 2026-08-14 21:00:00.000000000 +0530`, type: 'muted' },
                { text: `Change: 2026-08-14 21:00:00.000000000 +0530`, type: 'muted' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'diff') {
        if (args.length < 2) {
            callback({ lines: [{ text: "diff: missing operand after '" + (args[0] || '') + "'", type: 'error' }], exitCode: 1 });
            return;
        }
        const f1 = vfs.readFile(resolvePath(currentDir, args[0]));
        const f2 = vfs.readFile(resolvePath(currentDir, args[1]));
        if (f1 === null || f2 === null) {
            callback({ lines: [{ text: "diff: file not found", type: 'error' }], exitCode: 1 });
            return;
        }
        if (f1 === f2) {
            callback({ lines: [], exitCode: 0 });
        } else {
            callback({
                lines: [
                    { text: `--- ${args[0]}`, type: 'warning' },
                    { text: `+++ ${args[1]}`, type: 'success' },
                    { text: `@@ -1,1 +1,1 @@`, type: 'cyan' },
                    { text: `- ${f1.substring(0, 40)}`, type: 'error' },
                    { text: `+ ${f2.substring(0, 40)}`, type: 'success' }
                ],
                exitCode: 1
            });
        }
        return;
    }

    /* 6. System Information (uname, neofetch, free, df, lscpu, lspci, etc.) */
    if (cmd === 'uname') {
        const isInstalled = localStorage.getItem('krypton_os_installed') === 'true';
        const isUpgraded = isInstalled && localStorage.getItem('krypton_upgraded_lts') === 'true' && (vfs.readFile('/etc/os-release') || '').includes('1.0.0.0');
        const kernelVer = isUpgraded ? '6.10.0-krypton-generic' : '2.0.0.14-generic-krypton';
        if (args.includes('-a')) {
            const dateText = isUpgraded ? 'Fri Aug 14 2026' : 'Sun Aug 16 1996';
            callback({ lines: [{ text: `Linux krypton-station ${kernelVer} #1 SMP PREEMPT_DYNAMIC ${dateText} x86_64 x86_64 x86_64 GNU/Linux`, type: 'normal' }], exitCode: 0 });
        } else if (args.includes('-r')) {
            callback({ lines: [{ text: kernelVer, type: 'normal' }], exitCode: 0 });
        } else if (args.includes('-m')) {
            callback({ lines: [{ text: "x86_64", type: 'normal' }], exitCode: 0 });
        } else {
            callback({ lines: [{ text: "Linux", type: 'normal' }], exitCode: 0 });
        }
        return;
    }

    if (cmd === 'neofetch' || cmd === 'screenfetch' || cmd === 'fastfetch') {
        const isInstalled = localStorage.getItem('krypton_os_installed') === 'true';
        const isUpgraded = isInstalled && localStorage.getItem('krypton_upgraded_lts') === 'true' && (vfs.readFile('/etc/os-release') || '').includes('1.0.0.0');
        const osReleaseStr = vfs.readFile('/etc/os-release') || '';
        const prettyMatch = osReleaseStr.match(/PRETTY_NAME="([^"]+)"/);
        const osName = !isInstalled ? 'Krypton OS 0.1 Alpha (Live Media)' : (prettyMatch ? prettyMatch[1] : (isUpgraded ? 'Krypton 1.0.0.0 LTS' : 'Krypton OS 0.1 Alpha'));
        const kernelVer = isUpgraded ? '6.10.0-krypton-generic' : '2.0.0.14-generic-krypton';
        const shellVer = isUpgraded ? 'bash 5.2.21' : 'bash 2.0.0-alpha';
        const themeName = isUpgraded ? 'Obsidian-Dark [GTK3/4]' : 'Windows 98 Classic / Alpha';

        const telem = (typeof window !== 'undefined' && window.telemetry) ? window.telemetry : {
            hardwareConcurrency: navigator.hardwareConcurrency || 8,
            deviceMemoryGb: navigator.deviceMemory || 16,
            gpuInfo: { vendor: 'Generic', renderer: 'WebGL Hardware Acceleration' },
            screenInfo: { width: window.screen.width, height: window.screen.height, dpr: window.devicePixelRatio || 1 },
            currentCpuLoad: 12,
            getFormattedCpuModel: () => `x86_64 Processor (${navigator.hardwareConcurrency || 8} Cores)`
        };

        const totalMemMb = Math.round(telem.deviceMemoryGb * 1024);
        const usedMemMb = Math.round(totalMemMb * (telem.currentCpuLoad / 200 + 0.24));

        callback({
            lines: [
                { text: `${currentUser}@krypton-station`, type: 'cyan' },
                { text: `-----------------------`, type: 'muted' },
                { text: `OS: ${osName} x86_64 (${isInstalled ? 'Installed on /dev/nvme0n1p2' : 'Live USB Simulator'})`, type: 'normal' },
                { text: `Host: Browser Sandbox (${navigator.userAgentData ? navigator.userAgentData.platform : (navigator.platform || 'x86_64')})`, type: 'normal' },
                { text: `Kernel: ${kernelVer}`, type: 'normal' },
                { text: `Uptime: 2 hours, 48 mins`, type: 'normal' },
                { text: `Packages: ${isUpgraded ? '16 (dpkg-lts)' : '4 (dpkg-alpha)'}`, type: 'normal' },
                { text: `Shell: ${shellVer}`, type: 'normal' },
                { text: `Resolution: ${telem.screenInfo.width}x${telem.screenInfo.height} @ ${telem.screenInfo.dpr}x DPR (Wayland)`, type: 'normal' },
                { text: `DE: ${isUpgraded ? 'Krypton Glass Desktop (Wayland)' : 'Win98 / Alpha Shell'}`, type: 'normal' },
                { text: `WM: krypton-wm`, type: 'normal' },
                { text: `Theme: ${themeName}`, type: 'normal' },
                { text: `Terminal: krypton-terminal (xterm-256color)`, type: 'normal' },
                { text: `CPU: ${telem.getFormattedCpuModel()}`, type: 'normal' },
                { text: `GPU: ${telem.gpuInfo.renderer}`, type: 'normal' },
                { text: `Memory: ${usedMemMb}MiB / ${totalMemMb}MiB`, type: 'success' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'hostname' || cmd === 'hostnamectl') {
        const hNode = vfs.getNode('/etc/hostname');
        let currentHost = (hNode && hNode.content) ? hNode.content.trim() : (env.HOSTNAME || localStorage.getItem('krypton_hostname') || 'krypton-station');

        if (cmd === 'hostnamectl' && args.length === 0) {
            callback({
                lines: [
                    { text: `   Static hostname: ${currentHost}`, type: 'normal' },
                    { text: `         Icon name: computer`, type: 'normal' },
                    { text: `           Chassis: desktop`, type: 'normal' },
                    { text: `        Machine ID: c4b8f047e12f4b2383c3e7424681640a`, type: 'normal' },
                    { text: `           Boot ID: 17acbf2848cb45d49da4593452cfab9e`, type: 'normal' },
                    { text: `  Operating System: Krypton OS (Linux ${env.OSTYPE || 'x86_64'})`, type: 'normal' },
                    { text: `            Kernel: Linux ${vfs.readFile('/proc/version')?.split(' ')[2] || '6.10.0-krypton-generic'}`, type: 'normal' },
                    { text: `      Architecture: x86-64`, type: 'normal' }
                ],
                exitCode: 0
            });
            return;
        }

        if (args[0] && (args[0] === 'set-hostname' || cmd === 'hostname')) {
            const newHost = (args[0] === 'set-hostname' ? args[1] : args[0]) || '';
            if (newHost) {
                if (currentUser !== 'root') {
                    callback({ lines: [{ text: "hostname: you must be root to change the host name", type: 'error' }], exitCode: 1 });
                    return;
                }
                currentHost = newHost;
                vfs.writeFile('/etc/hostname', currentHost + '\n');
                vfs.saveFileSystem();
                localStorage.setItem('krypton_hostname', currentHost);
                env.HOSTNAME = currentHost;
                callback({ lines: [], exitCode: 0 });
                return;
            }
        }

        callback({ lines: [{ text: currentHost, type: 'normal' }], exitCode: 0 });
        return;
    }

    if (cmd === 'date') {
        callback({ lines: [{ text: new Date().toString(), type: 'normal' }], exitCode: 0 });
        return;
    }

    if (cmd === 'cal') {
        const now = new Date();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        callback({
            lines: [
                { text: `    ${monthNames[now.getMonth()]} ${now.getFullYear()}`, type: 'cyan' },
                { text: `Su Mo Tu We Th Fr Sa`, type: 'muted' },
                { text: ` 2  3  4  5  6  7  8`, type: 'normal' },
                { text: ` 9 10 11 12 13 14 15`, type: 'normal' },
                { text: `16 17 18 19 20 21 22`, type: 'normal' },
                { text: `23 24 25 26 27 28 29`, type: 'normal' },
                { text: `30 31`, type: 'normal' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'uptime') {
        const telem = (typeof window !== 'undefined' && window.telemetry) ? window.telemetry : { currentCpuLoad: 12 };
        const load1 = (telem.currentCpuLoad / 100).toFixed(2);
        const load5 = (telem.currentCpuLoad * 0.9 / 100).toFixed(2);
        const load15 = (telem.currentCpuLoad * 0.8 / 100).toFixed(2);
        callback({ lines: [{ text: ` ${new Date().toLocaleTimeString()} up 2:48, 1 user, load average: ${load1}, ${load5}, ${load15}`, type: 'normal' }], exitCode: 0 });
        return;
    }

    if (cmd === 'whoami') {
        callback({ lines: [{ text: currentUser, type: 'normal' }], exitCode: 0 });
        return;
    }

    if (cmd === 'id') {
        if (currentUser === 'root') {
            callback({ lines: [{ text: "uid=0(root) gid=0(root) groups=0(root)", type: 'normal' }], exitCode: 0 });
        } else {
            callback({ lines: [{ text: "uid=1000(guest) gid=1000(guest) groups=1000(guest),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev)", type: 'normal' }], exitCode: 0 });
        }
        return;
    }

    if (cmd === 'groups') {
        callback({ lines: [{ text: currentUser === 'root' ? "root" : "guest adm cdrom sudo dip plugdev", type: 'normal' }], exitCode: 0 });
        return;
    }

    if (cmd === 'who' || cmd === 'w') {
        callback({
            lines: [
                { text: "USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT", type: 'muted' },
                { text: `${currentUser.padEnd(8, ' ')} tty1     :0               10:47    2:48m  0.24s  0.04s /bin/bash`, type: 'normal' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'free') {
        const telem = (typeof window !== 'undefined' && window.telemetry) ? window.telemetry : { deviceMemoryGb: 16, currentCpuLoad: 12 };
        const totalKb = telem.deviceMemoryGb * 1024 * 1024;
        const usedKb = Math.round(totalKb * (telem.currentCpuLoad / 200 + 0.25));
        const freeKb = totalKb - usedKb;
        const buffKb = Math.round(totalKb * 0.18);
        const availKb = Math.round(freeKb * 0.85);

        callback({
            lines: [
                { text: "               total        used        free      shared  buff/cache   available", type: 'muted' },
                { text: `Mem:        ${String(totalKb).padStart(8)}    ${String(usedKb).padStart(8)}    ${String(freeKb).padStart(8)}      ${String(Math.round(totalKb * 0.015)).padStart(6)}     ${String(buffKb).padStart(8)}    ${String(availKb).padStart(8)}`, type: 'normal' },
                { text: "Swap:        2097148           0     2097148", type: 'normal' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'df') {
        const human = args.includes('-h') || args.includes('-H');
        const mounts = vfs.getMounts ? vfs.getMounts() : [
            { device: 'udev', mountPoint: '/dev' },
            { device: 'tmpfs', mountPoint: '/run' },
            { device: '/dev/nvme0n1p2', mountPoint: '/' },
            { device: 'tmpfs', mountPoint: '/dev/shm' },
            { device: '/dev/nvme0n1p1', mountPoint: '/boot/efi' },
            { device: '/dev/sda1', mountPoint: '/cdrom' }
        ];

        const lines = [
            { text: human ? "Filesystem      Size  Used Avail Use% Mounted on" : "Filesystem     1K-blocks      Used Available Use% Mounted on", type: 'muted' }
        ];

        mounts.forEach(m => {
            let totalKb = 982142016, usedKb = 24120140, availKb = 908021876, pct = '3%';
            if (m.device === '/dev/sda1' || m.device === '/dev/sda') {
                totalKb = 31265792; usedKb = 4120400; availKb = 27145392; pct = '14%';
            } else if (m.device === '/dev/nvme0n1p1') {
                totalKb = 523248; usedKb = 6240; availKb = 517008; pct = '2%';
            } else if (m.device === 'udev' || m.device === 'tmpfs') {
                totalKb = 8150642; usedKb = 4; availKb = 8150638; pct = '1%';
            }

            if (human) {
                const toHuman = (kb) => kb >= 1048576 ? `${(kb / 1048576).toFixed(1)}G` : `${(kb / 1024).toFixed(0)}M`;
                lines.push({
                    text: `${m.device.padEnd(14)} ${toHuman(totalKb).padStart(5)} ${toHuman(usedKb).padStart(5)} ${toHuman(availKb).padStart(5)} ${pct.padStart(4)} ${m.mountPoint}`,
                    type: m.mountPoint === '/' ? 'success' : (m.device.includes('sda') ? 'warning' : 'normal')
                });
            } else {
                lines.push({
                    text: `${m.device.padEnd(14)} ${String(totalKb).padStart(10)} ${String(usedKb).padStart(9)} ${String(availKb).padStart(10)} ${pct.padStart(4)} ${m.mountPoint}`,
                    type: m.mountPoint === '/' ? 'success' : (m.device.includes('sda') ? 'warning' : 'normal')
                });
            }
        });

        callback({ lines, exitCode: 0 });
        return;
    }

    if (cmd === 'mount') {
        const mounts = vfs.getMounts ? vfs.getMounts() : [];
        if (args.length === 0) {
            const lines = mounts.map(m => ({
                text: `${m.device} on ${m.mountPoint} type ${m.fsType || 'ext4'} (${m.options || 'rw,relatime'})`,
                type: m.mountPoint === '/' ? 'cyan' : (m.device.includes('sda') ? 'warning' : 'normal')
            }));
            callback({ lines, exitCode: 0 });
            return;
        }

        if (currentUser !== 'root') {
            callback({ lines: [{ text: "mount: only root can use \"--types\" or specify device and mountpoint options", type: 'error' }], exitCode: 1 });
            return;
        }

        let fsType = 'ext4';
        let device = '';
        let target = '';

        for (let i = 0; i < args.length; i++) {
            if (args[i] === '-t' && args[i + 1]) {
                fsType = args[i + 1];
                i++;
            } else if (!device && !args[i].startsWith('-')) {
                device = args[i];
            } else if (!target && !args[i].startsWith('-')) {
                target = args[i];
            }
        }

        if (!device || !target) {
            callback({ lines: [{ text: "mount: bad usage. Usage: mount [-t fstype] <device> <dir>", type: 'error' }], exitCode: 1 });
            return;
        }

        const normTarget = resolvePath(currentDir, target);
        const res = vfs.mount ? vfs.mount(device, normTarget, fsType, 'rw,relatime') : { success: false, error: 'VFS mount driver unavailable' };
        if (!res.success) {
            callback({ lines: [{ text: res.error, type: 'error' }], exitCode: 32 });
            return;
        }

        callback({
            lines: [
                { text: `[ OK ] Mounted ${device} on ${normTarget} (type ${fsType}, rw,relatime)`, type: 'success' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'umount' || cmd === 'unmount') {
        if (!args[0]) {
            callback({ lines: [{ text: "umount: missing operand. Usage: umount <mountpoint|device>", type: 'error' }], exitCode: 1 });
            return;
        }

        if (currentUser !== 'root') {
            callback({ lines: [{ text: "umount: only root can unmount partitions", type: 'error' }], exitCode: 1 });
            return;
        }

        const target = resolvePath(currentDir, args[0]);
        const res = vfs.umount ? vfs.umount(target) : { success: false, error: 'VFS umount driver unavailable' };
        if (!res.success) {
            callback({ lines: [{ text: res.error, type: 'error' }], exitCode: 32 });
            return;
        }

        callback({
            lines: [
                { text: `[ OK ] Unmounted ${target}`, type: 'success' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'du') {
        const targetPath = resolvePath(currentDir, args[0] || '.');
        callback({
            lines: [
                { text: `4\t${targetPath}/.bashrc`, type: 'normal' },
                { text: `8\t${targetPath}/Desktop`, type: 'normal' },
                { text: `12\t${targetPath}`, type: 'normal' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'lscpu') {
        const telem = (typeof window !== 'undefined' && window.telemetry) ? window.telemetry : {
            hardwareConcurrency: navigator.hardwareConcurrency || 8,
            getFormattedCpuModel: () => `x86_64 (${navigator.hardwareConcurrency || 8} Cores)`
        };
        const cores = telem.hardwareConcurrency;
        const sockets = 1;
        const coresPerSocket = Math.max(1, Math.floor(cores / 2));
        const threadsPerCore = 2;

        callback({
            lines: [
                { text: "Architecture:                    x86_64", type: 'normal' },
                { text: "CPU op-mode(s):                  32-bit, 64-bit", type: 'normal' },
                { text: "Address sizes:                   39 bits physical, 48 bits virtual", type: 'normal' },
                { text: "Byte Order:                      Little Endian", type: 'normal' },
                { text: `CPU(s):                          ${cores}`, type: 'normal' },
                { text: `On-line CPU(s) list:             0-${cores - 1}`, type: 'normal' },
                { text: "Vendor ID:                       GenuineIntel", type: 'normal' },
                { text: `Model name:                      ${telem.getFormattedCpuModel()}`, type: 'cyan' },
                { text: "CPU family:                      6", type: 'normal' },
                { text: "Model:                           165", type: 'normal' },
                { text: `Thread(s) per core:              ${threadsPerCore}`, type: 'normal' },
                { text: `Core(s) per socket:              ${coresPerSocket}`, type: 'normal' },
                { text: `Socket(s):                       ${sockets}`, type: 'normal' },
                { text: "Virtualization:                  VT-x / KVM Hypervisor", type: 'normal' },
                { text: `L1d cache:                       ${cores * 32} KiB (${cores} instances)`, type: 'normal' },
                { text: `L2 cache:                        ${cores * 512} KiB (${cores} instances)`, type: 'normal' },
                { text: `L3 cache:                        ${cores * 2} MiB (1 instance)`, type: 'normal' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'lspci') {
        const telem = (typeof window !== 'undefined' && window.telemetry) ? window.telemetry : {
            gpuInfo: { vendor: 'NVIDIA Corporation', renderer: 'Direct3D11 / Vulkan Renderer' }
        };

        callback({
            lines: [
                { text: "00:00.0 Host bridge: Intel Corporation 10th Gen Core Processor Host Bridge/DRAM Registers (rev 02)", type: 'normal' },
                { text: "00:01.0 PCI bridge: Intel Corporation PCIe Controller (x16) (rev 02)", type: 'normal' },
                { text: "00:14.0 USB controller: Intel Corporation USB 3.2 Gen 1x1 (5Gb/s) Host Controller", type: 'normal' },
                { text: "00:17.0 SATA controller: Intel Corporation SATA AHCI Controller", type: 'normal' },
                { text: "00:1f.3 Audio device: Intel Corporation High Definition Audio Controller", type: 'normal' },
                { text: "00:1f.6 Ethernet controller: Intel Corporation Ethernet Connection (1000Mbit)", type: 'normal' },
                { text: `01:00.0 VGA compatible controller: ${telem.gpuInfo.vendor} [${telem.gpuInfo.renderer}]`, type: 'cyan' },
                { text: "02:00.0 Non-Volatile memory controller: Samsung Electronics NVMe SSD Controller (PCIe 4.0 x4)", type: 'cyan' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'lsusb') {
        callback({
            lines: [
                { text: "Bus 002 Device 002: ID 0781:5581 SanDisk Corp. Ultra USB 3.0", type: 'cyan' },
                { text: "Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub", type: 'normal' },
                { text: "Bus 001 Device 003: ID 046d:c52b Logitech, Inc. Unifying Receiver", type: 'normal' },
                { text: "Bus 001 Device 002: ID 046d:c31c Logitech, Inc. Keyboard K120", type: 'normal' },
                { text: "Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub", type: 'normal' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'lsblk' || cmd === 'fdisk') {
        const mounts = vfs.getMounts ? vfs.getMounts() : [];
        const sdaMount = mounts.find(m => m.device.startsWith('/dev/sda1') || m.device === '/dev/sda')?.mountPoint || '';
        const nvmeMount = mounts.find(m => m.device.startsWith('/dev/nvme0n1p2'))?.mountPoint || '';
        const efiMount = mounts.find(m => m.device.startsWith('/dev/nvme0n1p1'))?.mountPoint || '';

        callback({
            lines: [
                { text: "NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS", type: 'muted' },
                { text: "sda           8:0    1  29.8G  0 disk ", type: 'normal' },
                { text: `└─sda1        8:1    1  29.8G  0 part ${sdaMount}`, type: sdaMount ? 'warning' : 'normal' },
                { text: "nvme0n1     259:0    0 931.5G  0 disk ", type: 'cyan' },
                { text: `├─nvme0n1p1 259:1    0   512M  0 part ${efiMount}`, type: 'normal' },
                { text: `├─nvme0n1p2 259:2    0 930.0G  0 part ${nvmeMount}`, type: nvmeMount ? 'success' : 'normal' },
                { text: "└─nvme0n1p3 259:3    0   1.0G  0 part [SWAP]", type: 'normal' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'dmesg') {
        const dmesgStr = vfs.readFile('/var/log/dmesg') || '[  0.000000] Linux version 6.10.0-krypton-generic';
        callback({
            lines: dmesgStr.split('\n').map(l => ({ text: l, type: 'muted' })),
            exitCode: 0
        });
        return;
    }

    if (cmd === 'env' || cmd === 'printenv') {
        const lines = Object.keys(env).filter(k => k !== '?').map(k => ({ text: `${k}=${env[k]}`, type: 'normal' }));
        callback({ lines, exitCode: 0 });
        return;
    }

    if (cmd === 'export') {
        if (args.length === 0) {
            const lines = Object.keys(env).map(k => ({ text: `declare -x ${k}="${env[k]}"`, type: 'normal' }));
            callback({ lines, exitCode: 0 });
            return;
        }
        args.forEach(arg => {
            const eqIdx = arg.indexOf('=');
            if (eqIdx !== -1) {
                const k = arg.substring(0, eqIdx);
                const v = arg.substring(eqIdx + 1).replace(/^['"]|['"]$/g, '');
                env[k] = v;
            }
        });
        callback({ lines: [], exitCode: 0 });
        return;
    }

    if (cmd === 'which' || cmd === 'whereis') {
        if (!args[0]) {
            callback({ lines: [], exitCode: 1 });
            return;
        }
        const target = args[0];
        const searchPaths = [
            `/bin/${target}`,
            `/usr/bin/${target}`,
            `/usr/games/${target}`,
            `/sbin/${target}`,
            `/usr/sbin/${target}`,
            `/usr/local/bin/${target}`
        ];
        const found = searchPaths.find(p => vfs.exists(p));
        if (found) {
            callback({ lines: [{ text: found, type: 'normal' }], exitCode: 0 });
        } else {
            callback({ lines: [{ text: `which: no ${target} in (/usr/local/bin:/usr/bin:/bin:/usr/games:/usr/sbin:/sbin)`, type: 'error' }], exitCode: 1 });
        }
        return;
    }

    /* 7. Process & Network Commands (ps, top, htop, kill, ping, ifconfig, etc.) */
    if (cmd === 'ps') {
        const procs = (window.telemetry && typeof window.telemetry.getProcessList === 'function')
            ? window.telemetry.getProcessList()
            : [
                { pid: 1, name: 'systemd' },
                { pid: 1042, name: 'krypton-wm' },
                { pid: 1100, name: 'bash' }
            ];

        const lines = [
            { text: "    PID TTY          TIME CMD", type: 'muted' }
        ];
        procs.forEach(p => {
            const cleanCmd = (p.rawName || p.name).replace(/^.*?\s/, '').trim();
            lines.push({ text: `${String(p.pid).padStart(7, ' ')} ?        00:00:01 ${cleanCmd}`, type: 'normal' });
        });
        callback({ lines, exitCode: 0 });
        return;
    }

    if (cmd === 'top' || cmd === 'htop') {
        const telem = window.telemetry || { currentCpuLoad: 2.4, getTotalUsedMemoryMb: () => 180.0, deviceMemoryGb: 16 };
        const procs = (typeof telem.getProcessList === 'function' ? telem.getProcessList() : []);
        const totalMb = (telem.deviceMemoryGb || 16) * 1024;
        const usedMb = typeof telem.getTotalUsedMemoryMb === 'function' ? telem.getTotalUsedMemoryMb() : 180.0;
        const freeMb = (totalMb - usedMb).toFixed(1);

        const lines = [
            { text: `top - ${new Date().toTimeString().split(' ')[0]} up 2:40, 1 user, load average: 0.14, 0.08, 0.03`, type: 'cyan' },
            { text: `Tasks:  ${procs.length} total,   1 running,  ${Math.max(0, procs.length - 1)} sleeping,   0 stopped,   0 zombie`, type: 'normal' },
            { text: `%Cpu(s):  ${telem.currentCpuLoad || 2.4} us,  0.8 sy,  0.0 ni, ${(100 - (telem.currentCpuLoad || 2.4)).toFixed(1)} id,  0.1 wa,  0.0 si`, type: 'normal' },
            { text: `MiB Mem :  ${totalMb.toFixed(1)} total,   ${freeMb} free,   ${usedMb} used,   240.0 buff/cache`, type: 'normal' },
            { text: "  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND", type: 'muted' }
        ];

        procs.forEach(p => {
            const pidStr = String(p.pid).padStart(5, ' ');
            const userStr = (p.user || 'guest').padEnd(8, ' ');
            const cpuStr = String(p.cpu || '0.1%').padStart(5, ' ');
            const memMb = typeof p.mem === 'number' ? p.mem : 14.0;
            const memPct = ((memMb / totalMb) * 100).toFixed(1).padStart(5, ' ');
            const cleanName = (p.rawName || p.name).replace(/^.*?\s/, '').trim();
            lines.push({
                text: `${pidStr} ${userStr}  20   0  ${Math.round(memMb * 32)}  ${Math.round(memMb * 8)}   ${Math.round(memMb * 2)} S ${cpuStr} ${memPct}   0:01.20 ${cleanName}`,
                type: p.isFocused ? 'cyan' : 'normal'
            });
        });

        callback({ lines, exitCode: 0 });
        return;
    }

    if (cmd === 'taskmgr' || cmd === 'krypton-taskmgr' || cmd === 'system-monitor') {
        if (window.appLoader) {
            window.appLoader.launch('taskmgr');
            callback({ lines: [{ text: "Launched System Task Manager & Resource Monitor.", type: 'success' }], exitCode: 0 });
        } else {
            callback({ lines: [{ text: "Unable to start Task Manager.", type: 'error' }], exitCode: 1 });
        }
        return;
    }

    if (cmd === 'browser' || cmd === 'krypton-browser') {
        if (window.appLoader) {
            window.appLoader.launch('browser', args);
            callback({ lines: [{ text: "Launched Krypton Web Browser.", type: 'success' }], exitCode: 0 });
        } else {
            callback({ lines: [{ text: "Unable to start Web Browser.", type: 'error' }], exitCode: 1 });
        }
        return;
    }

    if (cmd === 'filemgr' || cmd === 'krypton-filemgr') {
        if (window.appLoader) {
            window.appLoader.launch('filemgr', args);
            callback({ lines: [{ text: "Launched Virtual File Explorer.", type: 'success' }], exitCode: 0 });
        } else {
            callback({ lines: [{ text: "Unable to start File Manager.", type: 'error' }], exitCode: 1 });
        }
        return;
    }

    if (cmd === 'settings' || cmd === 'krypton-settings') {
        if (window.appLoader) {
            window.appLoader.launch('settings', args);
            callback({ lines: [{ text: "Launched Krypton Settings Control Center.", type: 'success' }], exitCode: 0 });
        } else {
            callback({ lines: [{ text: "Unable to start Settings.", type: 'error' }], exitCode: 1 });
        }
        return;
    }

    if (cmd === 'calculator' || cmd === 'krypton-calculator') {
        if (window.appLoader) {
            window.appLoader.launch('calculator', args);
            callback({ lines: [{ text: "Launched Desktop Calculator.", type: 'success' }], exitCode: 0 });
        } else {
            callback({ lines: [{ text: "Unable to start Calculator.", type: 'error' }], exitCode: 1 });
        }
        return;
    }

    if (cmd === 'clock' || cmd === 'krypton-clock') {
        if (window.appLoader) {
            window.appLoader.launch('clock', args);
            callback({ lines: [{ text: "Launched World Clock & Alarms.", type: 'success' }], exitCode: 0 });
        } else {
            callback({ lines: [{ text: "Unable to start Clock.", type: 'error' }], exitCode: 1 });
        }
        return;
    }

    if (cmd === 'messages' || cmd === 'krypton-messages' || cmd === 'system-logs') {
        if (window.appLoader) {
            window.appLoader.launch('messages', args);
            callback({ lines: [{ text: "Launched System Logs Monitor.", type: 'success' }], exitCode: 0 });
        } else {
            callback({ lines: [{ text: "Unable to start System Logs.", type: 'error' }], exitCode: 1 });
        }
        return;
    }

    if (cmd === 'kill') {
        if (!args || args.length === 0) {
            callback({
                lines: [
                    { text: "kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]", type: 'error' }
                ],
                exitCode: 2
            });
            return;
        }

        let signal = 'SIGTERM';
        let targetOperands = [];

        for (let i = 0; i < args.length; i++) {
            const a = args[i];
            if (a === '-s' && i + 1 < args.length) {
                signal = args[++i].toUpperCase();
            } else if (a.startsWith('-') && a !== '-') {
                const s = a.substring(1).toUpperCase();
                if (s === '9' || s === 'KILL' || s === 'SIGKILL') signal = 'SIGKILL';
                else if (s === '15' || s === 'TERM' || s === 'SIGTERM') signal = 'SIGTERM';
                else if (s === '1' || s === 'HUP' || s === 'SIGHUP') signal = 'SIGHUP';
                else if (s === 'l' || s === '-LIST' || s === 'L') {
                    callback({
                        lines: [
                            { text: " 1) SIGHUP       2) SIGINT       3) SIGQUIT      6) SIGABRT", type: 'normal' },
                            { text: " 9) SIGKILL     14) SIGALRM     15) SIGTERM     17) SIGCHLD", type: 'normal' },
                            { text: "18) SIGCONT     19) SIGSTOP     20) SIGTSTP", type: 'normal' }
                        ],
                        exitCode: 0
                    });
                    return;
                } else {
                    signal = `SIG${s}`;
                }
            } else {
                targetOperands.push(a);
            }
        }

        if (targetOperands.length === 0) {
            callback({
                lines: [{ text: "kill: missing operand", type: 'error' }],
                exitCode: 2
            });
            return;
        }

        const telem = window.telemetry || { getProcessList: () => [] };
        const procs = typeof telem.getProcessList === 'function' ? telem.getProcessList() : [];
        const outLines = [];
        let exitCode = 0;

        for (const target of targetOperands) {
            const pidNum = parseInt(target, 10);
            if (isNaN(pidNum)) {
                outLines.push({ text: `bash: kill: ${target}: arguments must be process or job IDs`, type: 'error' });
                exitCode = 1;
                continue;
            }

            const foundProc = procs.find(p => p.pid === pidNum);
            if (!foundProc) {
                outLines.push({ text: `bash: kill: (${pidNum}) - No such process`, type: 'error' });
                exitCode = 1;
                continue;
            }

            if (foundProc.canKill === false || pidNum === 1) {
                if (currentUser !== 'root') {
                    outLines.push({ text: `bash: kill: (${pidNum}) - Operation not permitted`, type: 'error' });
                    exitCode = 1;
                } else {
                    outLines.push({ text: `bash: kill: (${pidNum}) - Protected kernel/init process`, type: 'error' });
                    exitCode = 1;
                }
                continue;
            }

            // Terminate the process window in window manager
            if (foundProc.winId && window.wm && typeof window.wm.closeWindow === 'function') {
                window.wm.closeWindow(foundProc.winId);
            }
        }

        callback({ lines: outLines, exitCode });
        return;
    }

    if (cmd === 'killall') {
        if (!args || args.length === 0) {
            callback({
                lines: [
                    { text: "killall: missing operand", type: 'error' },
                    { text: "Usage: killall [OPTION]... NAME...", type: 'muted' }
                ],
                exitCode: 1
            });
            return;
        }

        let signal = 'SIGTERM';
        let targetNames = [];

        for (let i = 0; i < args.length; i++) {
            const a = args[i];
            if (a.startsWith('-') && a !== '-') {
                const s = a.substring(1).toUpperCase();
                if (s === '9' || s === 'KILL' || s === 'SIGKILL') signal = 'SIGKILL';
                else if (s === '15' || s === 'TERM' || s === 'SIGTERM') signal = 'SIGTERM';
                else signal = `SIG${s}`;
            } else {
                targetNames.push(a);
            }
        }

        if (targetNames.length === 0) {
            callback({ lines: [{ text: "killall: missing operand", type: 'error' }], exitCode: 1 });
            return;
        }

        const telem = window.telemetry || { getProcessList: () => [] };
        const procs = typeof telem.getProcessList === 'function' ? telem.getProcessList() : [];
        const outLines = [];
        let exitCode = 0;

        for (const targetName of targetNames) {
            const normTarget = targetName.toLowerCase().replace(/^krypton-/, '');
            const matchingProcs = procs.filter(p => {
                const raw = (p.rawName || '').toLowerCase().replace(/^krypton-/, '');
                const name = (p.name || '').toLowerCase();
                return raw === normTarget || name.includes(normTarget) || p.winId === targetName;
            });

            if (matchingProcs.length === 0) {
                outLines.push({ text: `${targetName}: no process found`, type: 'error' });
                exitCode = 1;
                continue;
            }

            for (const p of matchingProcs) {
                if (p.canKill === false) {
                    outLines.push({ text: `${targetName}: Operation not permitted`, type: 'error' });
                    exitCode = 1;
                    continue;
                }
                if (p.winId && window.wm && typeof window.wm.closeWindow === 'function') {
                    window.wm.closeWindow(p.winId);
                }
            }
        }

        callback({ lines: outLines, exitCode });
        return;
    }

    if (cmd === 'ping') {
        const host = args.filter(a => !a.startsWith('-'))[0] || 'localhost';
        const ip = (host === 'localhost' || host === '127.0.0.1') ? '127.0.0.1' : '142.250.190.46';
        callback({
            lines: [
                { text: `PING ${host} (${ip}) 56(84) bytes of data.`, type: 'info' },
                { text: `64 bytes from ${ip}: icmp_seq=1 ttl=118 time=14.2 ms`, type: 'normal' },
                { text: `64 bytes from ${ip}: icmp_seq=2 ttl=118 time=12.8 ms`, type: 'normal' },
                { text: `64 bytes from ${ip}: icmp_seq=3 ttl=118 time=13.4 ms`, type: 'normal' },
                { text: `--- ${host} ping statistics ---`, type: 'muted' },
                { text: `3 packets transmitted, 3 received, 0% packet loss, time 2003ms`, type: 'success' },
                { text: `rtt min/avg/max/mdev = 12.812/13.471/14.210/0.572 ms`, type: 'normal' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'ifconfig' || (cmd === 'ip' && (args[0] === 'a' || args[0] === 'addr'))) {
        callback({
            lines: [
                { text: "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500", type: 'cyan' },
                { text: "        inet 192.168.1.142  netmask 255.255.255.0  broadcast 192.168.1.255", type: 'normal' },
                { text: "        inet6 fe80::5054:ff:fe12:3456  prefixlen 64  scopeid 0x20<link>", type: 'normal' },
                { text: "        ether 52:54:00:12:34:56  txqueuelen 1000  (Ethernet)", type: 'normal' },
                { text: "        RX packets 42180  bytes 38412090 (38.4 MB)", type: 'normal' },
                { text: "        TX packets 21450  bytes 4120980 (4.1 MB)", type: 'normal' },
                { text: "", type: 'normal' },
                { text: "lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536", type: 'cyan' },
                { text: "        inet 127.0.0.1  netmask 255.0.0.0", type: 'normal' },
                { text: "        inet6 ::1  prefixlen 128  scopeid 0x10<host>", type: 'normal' },
                { text: "        loop  txqueuelen 1000  (Local Loopback)", type: 'normal' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'netstat' || cmd === 'ss') {
        callback({
            lines: [
                { text: "Active Internet connections (only servers)", type: 'muted' },
                { text: "Proto Recv-Q Send-Q Local Address           Foreign Address         State", type: 'muted' },
                { text: "tcp        0      0 127.0.0.1:53            0.0.0.0:*               LISTEN", type: 'normal' },
                { text: "tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN", type: 'normal' },
                { text: "tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN", type: 'normal' },
                { text: "tcp        0      0 127.0.0.1:3000          0.0.0.0:*               LISTEN", type: 'cyan' },
                { text: "tcp        0      0 0.0.0.0:9000            0.0.0.0:*               LISTEN", type: 'normal' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'curl') {
        const rawUrl = args.filter(a => !a.startsWith('-'))[0] || 'https://krypton-os.org';
        const url = rawUrl.toLowerCase();

        if (url.includes('parrot.live') || url.includes('parrot.lie') || url === 'parrot') {
            callback({
                startParrot: true,
                lines: [
                    { text: "[ Connecting to parrot.live (Cult of the Party Parrot)... ]", type: 'cyan' },
                    { text: "[ Press Ctrl+C to stop streaming ]", type: 'muted' }
                ],
                exitCode: 0
            });
            return;
        }

        if (url.includes('wttr.in') || url.includes('weather')) {
            callback({
                lines: [
                    { text: "Weather report: San Francisco, CA", type: 'cyan' },
                    { text: "     \\   /     Sunny", type: 'yellow' },
                    { text: "      .-.      +24(21) °C", type: 'yellow' },
                    { text: "   ― (   ) ―   ↗ 12 km/h", type: 'normal' },
                    { text: "      '-'      10 km", type: 'normal' },
                    { text: "     /   \\     0.0 mm", type: 'normal' },
                    { text: "Location: 37.7749° N, 122.4194° W [wttr.in]", type: 'muted' }
                ],
                exitCode: 0
            });
            return;
        }

        if (url.includes('ipinfo.io') || url.includes('ifconfig.me')) {
            callback({
                lines: [
                    { text: "{\n  \"ip\": \"142.250.190.46\",\n  \"hostname\": \"krypton-station.local\",\n  \"city\": \"Mountain View\",\n  \"region\": \"California\",\n  \"country\": \"US\",\n  \"loc\": \"37.4220,-122.0841\",\n  \"org\": \"AS15169 Google LLC\",\n  \"timezone\": \"America/Los_Angeles\"\n}", type: 'normal' }
                ],
                exitCode: 0
            });
            return;
        }

        if (url.includes('petadopt')) {
            callback({
                lines: [
                    { text: "HTTP/1.1 200 OK\nContent-Type: text/html\n\n<!DOCTYPE html>\n<html><title>Free Pet Adopt</title><body>Download Byte Setup: byte_setup.pet</body></html>", type: 'normal' }
                ],
                exitCode: 0
            });
            return;
        }

        callback({
            lines: [
                { text: "<!DOCTYPE html>\n<html lang=\"en\">\n<head><title>KryptonOS Portal</title></head>\n<body>\n  <h1>Welcome to KryptonOS 1.0 (Beryllium)</h1>\n  <p>Connected via Gigabit Quantum Network.</p>\n</body>\n</html>", type: 'normal' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'wget') {
        const url = args.filter(a => !a.startsWith('-'))[0] || 'https://krypton-os.org/package.tar.gz';
        const filename = url.split('/').pop() || 'download.bin';
        vfs.writeFile(resolvePath(currentDir, filename), 'BINARY_DATA_' + Date.now());
        callback({
            lines: [
                { text: `--2026-08-14 21:42:30--  ${url}`, type: 'muted' },
                { text: `Resolving krypton-os.org... 142.250.190.46`, type: 'normal' },
                { text: `Connecting to krypton-os.org|142.250.190.46|:443... connected.`, type: 'normal' },
                { text: `HTTP request sent, awaiting response... 200 OK`, type: 'success' },
                { text: `Length: 428120 (418K) [application/octet-stream]`, type: 'normal' },
                { text: `Saving to: ‘${filename}’`, type: 'normal' },
                { text: `100%[======================================>] 418.08K  --.-KB/s    in 0.03s`, type: 'success' },
                { text: `2026-08-14 21:42:30 (13.9 MB/s) - ‘${filename}’ saved [428120/428120]`, type: 'info' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'nslookup' || cmd === 'dig') {
        const host = args.filter(a => !a.startsWith('-'))[0] || 'krypton-os.org';
        callback({
            lines: [
                { text: `Server:         1.1.1.1`, type: 'normal' },
                { text: `Address:        1.1.1.1#53`, type: 'normal' },
                { text: `Non-authoritative answer:`, type: 'muted' },
                { text: `Name:   ${host}`, type: 'normal' },
                { text: `Address: 104.21.48.112`, type: 'cyan' },
                { text: `Address: 172.67.182.204`, type: 'cyan' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'adblock') {
        const binCheck = vfs.getNode('/usr/bin/adblock');
        if (!binCheck) {
            callback({
                lines: [
                    { text: "bash: adblock: command not found", type: 'error' },
                    { text: "Package 'krypton-adblock' is not installed. To install it via APT, run:", type: 'warning' },
                    { text: "  sudo apt install adblock", type: 'cyan' }
                ],
                exitCode: 127
            });
            return;
        }

        const act = (args[0] || 'status').toLowerCase();
        if (act === 'enable' || act === 'on') {
            story.setAdblock(true);
            vfs.writeFile('/etc/adblock.conf', 'enabled=true\n');
            vfs.saveFileSystem();
            callback({ lines: [{ text: "[ OK ] KryptonOS System AdBlocker: ENABLED", type: 'success' }], exitCode: 0 });
        } else if (act === 'disable' || act === 'off') {
            story.setAdblock(false);
            vfs.writeFile('/etc/adblock.conf', 'enabled=false\n');
            vfs.saveFileSystem();
            callback({ lines: [{ text: "[ OK ] KryptonOS System AdBlocker: DISABLED", type: 'warning' }], exitCode: 0 });
        } else {
            callback({ lines: [{ text: `KryptonOS AdBlocker Status: ${story.adblockEnabled ? 'ENABLED' : 'DISABLED'} (/etc/adblock.conf)`, type: 'info' }], exitCode: 0 });
        }
        return;
    }

    /* 8. Package Management (apt, apt-get, dpkg) */
    if (cmd === 'apt' || cmd === 'apt-get') {
        executeAptCommand(args, currentUser === 'root', callback);
        return;
    }

    if (cmd === 'dpkg') {
        const flag = args[0] || '-l';
        const target = args[1] || '';

        if (flag === '-i' || flag === '--install') {
            if (!target) {
                callback({ lines: [{ text: "dpkg: error: --install needs at least one package archive file", type: 'error' }], exitCode: 1 });
                return;
            }
            const cleanName = target.split('/').pop().replace(/\.(deb|dpkg)$/, '');
            if (cleanName === 'antigravity') {
                story.setAntigravity(true);
            }
            if (cleanName === 'adblock' || cleanName === 'krypton-adblock') {
                vfs.writeFile('/usr/bin/adblock', '#!/bin/bash\n# KryptonOS AdBlocker Utility\ncase "$1" in\n  enable|on) echo "enabled=true" > /etc/adblock.conf && echo "[ OK ] AdBlocker ENABLED" ;;\n  disable|off) echo "enabled=false" > /etc/adblock.conf && echo "[ OK ] AdBlocker DISABLED" ;;\n  status) cat /etc/adblock.conf ;;\n  *) echo "Usage: adblock {enable|disable|status}" ;;\nesac\n');
                vfs.writeFile('/etc/adblock.conf', 'enabled=true\n');
                vfs.saveFileSystem();
                story.setAdblock(true);
            }
            callback({
                lines: [
                    { text: `(Reading database ... 42180 files and directories currently installed.)`, type: 'muted' },
                    { text: `Preparing to unpack ${target} ...`, type: 'normal' },
                    { text: `Unpacking ${cleanName} from /apt/${cleanName}.deb ...`, type: 'normal' },
                    { text: `Setting up ${cleanName} ...`, type: 'success' },
                    { text: `Processing triggers for krypton-desktop (1.0.4) ...`, type: 'info' }
                ],
                exitCode: 0
            });
            return;
        }

        if (flag === '-s' || flag === '--status') {
            if (!target) {
                callback({ lines: [{ text: "dpkg: --status needs a valid package name", type: 'error' }], exitCode: 1 });
                return;
            }
            const found = REPO_DPKG_PACKAGES.find(p => p.id === target || p.name === target);
            if (found) {
                callback({
                    lines: [
                        { text: `Package: ${found.name}`, type: 'cyan' },
                        { text: `Status: install ok installed`, type: 'success' },
                        { text: `Priority: optional`, type: 'normal' },
                        { text: `Section: ${found.section}`, type: 'normal' },
                        { text: `Installed-Size: ${found.size}`, type: 'normal' },
                        { text: `Maintainer: ${found.maintainer}`, type: 'normal' },
                        { text: `Architecture: ${found.arch}`, type: 'normal' },
                        { text: `Version: ${found.version}`, type: 'normal' },
                        { text: `Dpkg-Archive: /apt/${found.file}`, type: 'muted' },
                        { text: `Description: ${found.summary}`, type: 'normal' }
                    ],
                    exitCode: 0
                });
            } else {
                callback({ lines: [{ text: `dpkg-query: package '${target}' is not installed and no information is available`, type: 'error' }], exitCode: 1 });
            }
            return;
        }

        // Default: dpkg -l listing
        const lines = [
            { text: "Desired=Unknown/Install/Remove/Purge/Hold", type: 'muted' },
            { text: "| Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend", type: 'muted' },
            { text: "+++-===================================-=================-============-=================================================", type: 'muted' }
        ];

        REPO_DPKG_PACKAGES.forEach(p => {
            const nameCol = p.name.padEnd(35, ' ');
            const verCol = p.version.padEnd(17, ' ');
            const archCol = p.arch.padEnd(12, ' ');
            lines.push({ text: `ii  ${nameCol} ${verCol} ${archCol} ${p.summary.substring(0, 48)}`, type: p.id === 'antigravity' ? 'cyan' : 'normal' });
        });

        callback({ lines, exitCode: 0 });
        return;
    }

    /* 9. Editors & Fun CLI Toys (nano, vim, cmatrix, cowsay, figlet, sl, bc, etc.) */
    if (cmd === 'nano' || cmd === 'vim' || cmd === 'vi') {
        const fileTarget = args[0] || '';
        const targetPath = fileTarget ? resolvePath(currentDir, fileTarget) : resolvePath(currentDir, 'untitled.txt');
        const existingContent = vfs.readFile(targetPath) || '';
        callback({
            launchNano: {
                filePath: targetPath,
                fileName: fileTarget || 'New Buffer',
                content: existingContent
            },
            exitCode: 0
        });
        return;
    }

    if (cmd === 'cmatrix') {
        if (!vfs.exists('/usr/bin/cmatrix')) {
            callback({
                lines: [
                    { text: `Command 'cmatrix' not found, but can be installed with:`, type: 'normal' },
                    { text: `sudo apt install cmatrix`, type: 'cyan' }
                ],
                exitCode: 127
            });
            return;
        }
        callback({
            lines: [
                { text: "01010100 01101000 01100101 00100000 01001101 01100001 01110100 01110010 01101001 01111000", type: 'success' },
                { text: "01101001 01110011 00100000 01100101 01110110 01100101 01110010 01111001 01110111 01101000", type: 'success' },
                { text: "01100101 01110010 01100101 00101110 00100000 01001011 01110010 01111001 01110000 01110100", type: 'success' },
                { text: "01101111 01101110 01001111 01010011 00100000 01110011 01111001 01110011 01110100 01100101", type: 'success' },
                { text: "[ Matrix digital stream completed ]", type: 'info' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'cowsay') {
        if (!vfs.exists('/usr/games/cowsay') && !vfs.exists('/usr/bin/cowsay')) {
            callback({
                lines: [
                    { text: `Command 'cowsay' not found, but can be installed with:`, type: 'normal' },
                    { text: `sudo apt install cowsay`, type: 'cyan' }
                ],
                exitCode: 127
            });
            return;
        }
        const msg = args.join(' ') || "Moo! Welcome to KryptonOS Linux.";
        const border = "-".repeat(msg.length + 2);
        callback({
            lines: [
                { text: ` ${border}`, type: 'normal' },
                { text: `< ${msg} >`, type: 'cyan' },
                { text: ` ${border}`, type: 'normal' },
                { text: `        \\   ^__^`, type: 'normal' },
                { text: `         \\  (oo)\\_______`, type: 'normal' },
                { text: `            (__)\\       )\\/\\`, type: 'normal' },
                { text: `                ||----w |`, type: 'normal' },
                { text: `                ||     ||`, type: 'normal' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'figlet' || cmd === 'banner') {
        const msg = (args.join(' ') || "KRYPTON").toUpperCase();
        callback({
            lines: [
                { text: ` _  ______  __   ______ _____ ___  _   _ `, type: 'cyan' },
                { text: `| |/ /  _ \\ \\ \\ / /  _ \\_   _/ _ \\| \\ | |`, type: 'cyan' },
                { text: `| ' /| |_) | \\ V /| |_) || || | | |  \\| |`, type: 'cyan' },
                { text: `| . \\|  _ <   | | |  __/ | || |_| | |\\  |`, type: 'cyan' },
                { text: `|_|\\_\\_| \\_\\  |_| |_|    |_| \\___/|_| \\_|`, type: 'cyan' },
                { text: `[ ${msg} ]`, type: 'info' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'sl') {
        if (!vfs.exists('/usr/games/sl') && !vfs.exists('/usr/bin/sl')) {
            callback({
                lines: [
                    { text: `Command 'sl' not found, but can be installed with:`, type: 'normal' },
                    { text: `sudo apt install sl`, type: 'cyan' }
                ],
                exitCode: 127
            });
            return;
        }
        callback({
            lines: [
                { text: `      ====        ________                ___________ `, type: 'yellow' },
                { text: `  _D _|  |_______/        \\__I_I_____===__|_________| `, type: 'yellow' },
                { text: `   |(_)---  |   H\\________/ _____ |   | = | - - - - | `, type: 'yellow' },
                { text: `   /     |  |   H  |  |     |   | |   | = |         | `, type: 'yellow' },
                { text: `  |      |  |   H  |__--------------------| [KRYPTON] | `, type: 'yellow' },
                { text: `  | ________|___H__/__|_____/[][]~\\_______|___________| `, type: 'yellow' },
                { text: `  |/ |   |_____/ \\_____/ \\_____/ \\_____/ \\_____/      `, type: 'yellow' },
                { text: `Chugga chugga choo choo! (Steam Locomotive)`, type: 'info' }
            ],
            exitCode: 0
        });
        return;
    }

    if (cmd === 'fortune') {
        const fortunes = [
            "“There is no place like /home/guest.”",
            "“To understand recursion, you must first understand recursion.”",
            "“Real programmers don't comment their code. If it was hard to write, it should be hard to understand.”",
            "“The best thing about a boolean is even if you are wrong, you are only off by a bit.”",
            "“KryptonOS: Defying gravity since 2026.”"
        ];
        callback({ lines: [{ text: fortunes[Math.floor(Math.random() * fortunes.length)], type: 'info' }], exitCode: 0 });
        return;
    }

    if (cmd === 'bc' || cmd === 'calc') {
        const expr = args.join(' ') || pipedStdin || '2+2';
        try {
            const cleanExpr = expr.replace(/[^0-9+\-*/().% ]/g, '');
            const res = Function(`'use strict'; return (${cleanExpr})`)();
            callback({ lines: [{ text: String(res), type: 'normal' }], exitCode: 0 });
        } catch (e) {
            callback({ lines: [{ text: "(standard_in) 1: syntax error", type: 'error' }], exitCode: 1 });
        }
        return;
    }

    if (cmd === 'sleep') {
        const sec = parseFloat(args[0]) || 1;
        setTimeout(() => {
            callback({ lines: [], exitCode: 0 });
        }, Math.min(3000, sec * 1000));
        return;
    }

    if (cmd === 'chmod' || cmd === 'chown') {
        callback({ lines: [], exitCode: 0 });
        return;
    }

    /* 10. Fallback: Binary / Script Execution or Not Found */
    const checkPath = resolvePath(currentDir, cmd);
    const scriptNode = vfs.getNode(checkPath);
    if (scriptNode && scriptNode.type === 'file') {
        if (scriptNode.content.startsWith('#!/bin/bash') || scriptNode.content.startsWith('#!/bin/sh')) {
            callback({ lines: [{ text: `[ Executed script: ${cmd} ]`, type: 'success' }], exitCode: 0 });
            return;
        }
    }

    callback({
        lines: [{ text: `bash: ${cmd}: command not found. Type 'help' for available commands.`, type: 'error' }],
        exitCode: 127
    });
}

/* --------------------------------------------------------------------------
   APT Package Manager Helper (Real Dynamic Repository Engine & State Solver)
   -------------------------------------------------------------------------- */

function parseDpkgStatus() {
    let raw = vfs.readFile('/var/lib/dpkg/status');
    const isUpgraded = localStorage.getItem('krypton_upgraded_lts') === 'true';

    if (!raw) {
        const recAppsEnabled = localStorage.getItem('krypton_selected_recommended_apps') !== 'false';
        const kernelVer = isUpgraded ? '6.10.0-1' : '2.0.0.14-1';
        const kernelPkg = isUpgraded ? 'linux-image-krypton-generic' : 'linux-image-2.0.0.14-generic-krypton';

        raw = `Package: base-files\nStatus: install ok installed\nPriority: required\nSection: admin\nInstalled-Size: 603\nMaintainer: Krypton Core Maintainers <packages@krypton-os.org>\nArchitecture: amd64\nVersion: ${isUpgraded ? '1.0.0' : '0.1.0-alpha'}\nDescription: KryptonOS Core System Files & OS Identity Manifest\n\nPackage: ${kernelPkg}\nStatus: install ok installed\nPriority: optional\nSection: kernel\nInstalled-Size: 597\nMaintainer: Krypton Kernel Team <kernel@krypton-os.org>\nArchitecture: amd64\nVersion: ${kernelVer}\nDescription: Linux Kernel Image ${kernelVer}\n\nPackage: krypton-browser\nStatus: install ok installed\nPriority: optional\nSection: web/browsers\nInstalled-Size: 1024\nMaintainer: Krypton Maintainers <packages@krypton-os.org>\nArchitecture: amd64\nVersion: ${isUpgraded ? '1.0.0-release' : '0.1.0-alpha'}\nDescription: Web Navigator\n\nPackage: krypton-notes\nStatus: install ok installed\nPriority: optional\nSection: editors/text\nInstalled-Size: 512\nMaintainer: Krypton Maintainers <packages@krypton-os.org>\nArchitecture: amd64\nVersion: ${isUpgraded ? '1.1.0-release' : '0.1.0-alpha'}\nDescription: Upgrade Notes & System Documentation\n\n`;
        if (recAppsEnabled) {
            raw += `Package: krypton-calculator\nStatus: install ok installed\nPriority: optional\nSection: math/calculators\nInstalled-Size: 512\nMaintainer: Krypton Maintainers <packages@krypton-os.org>\nArchitecture: amd64\nVersion: 1.0.2-release\nDescription: Scientific Calculator\n\nPackage: krypton-filemgr\nStatus: install ok installed\nPriority: optional\nSection: utils\nInstalled-Size: 512\nMaintainer: Krypton Maintainers <packages@krypton-os.org>\nArchitecture: amd64\nVersion: 1.0.4-release\nDescription: Virtual File Manager\n\nPackage: krypton-taskmgr\nStatus: install ok installed\nPriority: optional\nSection: admin\nInstalled-Size: 512\nMaintainer: Krypton Maintainers <packages@krypton-os.org>\nArchitecture: amd64\nVersion: 1.2.0-release\nDescription: System Task Manager\n\nPackage: krypton-settings\nStatus: install ok installed\nPriority: optional\nSection: admin\nInstalled-Size: 512\nMaintainer: Krypton Maintainers <packages@krypton-os.org>\nArchitecture: amd64\nVersion: 1.0.0-release\nDescription: Control Center Settings\n\n`;
        }
        if (!vfs.exists('/var/lib/dpkg')) {
            vfs.createDirectory('/var/lib');
            vfs.createDirectory('/var/lib/dpkg');
        }
        vfs.writeFile('/var/lib/dpkg/status', raw);
    }
    const entries = raw.split(/\n\s*\n/).filter(b => b.trim().length > 0);
    const installedMap = new Map();
    let hasKernel610 = false;

    for (const block of entries) {
        const pkgMatch = block.match(/Package:\s*([^\n]+)/);
        const statusMatch = block.match(/Status:\s*([^\n]+)/);
        const verMatch = block.match(/Version:\s*([^\n]+)/);
        const sizeMatch = block.match(/Installed-Size:\s*([^\n]+)/);
        const secMatch = block.match(/Section:\s*([^\n]+)/);
        const archMatch = block.match(/Architecture:\s*([^\n]+)/);
        const descMatch = block.match(/Description:\s*([^\n]+)/);

        if (pkgMatch && (!statusMatch || statusMatch[1].includes('installed'))) {
            const id = pkgMatch[1].trim();
            const version = verMatch ? verMatch[1].trim() : '1.0.0';
            if (id.startsWith('linux-image') && (version.startsWith('6.10') || isUpgraded)) {
                hasKernel610 = true;
            }
            installedMap.set(id, {
                id,
                name: id,
                version,
                installedSize: sizeMatch ? parseInt(sizeMatch[1].trim(), 10) : 1024,
                section: secMatch ? secMatch[1].trim() : 'universe',
                architecture: archMatch ? archMatch[1].trim() : 'amd64',
                description: descMatch ? descMatch[1].trim() : ''
            });
        }
    }

    // Prune legacy 2.0 kernel if 6.10 is installed or system is marked upgraded
    if (hasKernel610 || isUpgraded) {
        for (const k of Array.from(installedMap.keys())) {
            if (k.startsWith('linux-image') && !k.includes('6.10') && k !== 'linux-image-krypton-generic') {
                installedMap.delete(k);
            } else if (k === 'linux-image-krypton-generic' && isUpgraded) {
                installedMap.get(k).version = '6.10.0-1';
            }
        }
    }

    return Array.from(installedMap.values());
}

function compareSemver(v1, v2) {
    if (v1 === v2) return 0;
    if (v1.includes('alpha') && !v2.includes('alpha')) return -1;
    if (!v1.includes('alpha') && v2.includes('alpha')) return 1;

    const parseSegments = (v) => v.replace(/-[a-zA-Z0-9]+/, '').split('.').map(n => parseInt(n, 10) || 0);
    const seg1 = parseSegments(v1);
    const seg2 = parseSegments(v2);
    for (let i = 0; i < Math.max(seg1.length, seg2.length); i++) {
        const s1 = seg1[i] || 0;
        const s2 = seg2[i] || 0;
        if (s1 > s2) return 1;
        if (s1 < s2) return -1;
    }
    return v1.localeCompare(v2);
}

function getUpgradablePackages(catalog) {
    const installed = parseDpkgStatus();
    const upgradables = [];

    for (const inst of installed) {
        const avail = catalog.find(p => 
            p.id === inst.id || 
            p.name === inst.id || 
            p.id === `krypton-${inst.id}` || 
            inst.id === `krypton-${p.id}` ||
            (inst.id.startsWith('linux-image') && p.id.startsWith('linux-image'))
        );
        if (avail) {
            if (compareSemver(avail.version, inst.version) > 0) {
                upgradables.push({
                    installed: inst,
                    available: avail
                });
            }
        }
    }
    return upgradables;
}

function countVfsNodes(node) {
    if (!node) return 0;
    let count = 1;
    if (node.type === 'dir' && node.children) {
        for (const k of Object.keys(node.children)) {
            count += countVfsNodes(node.children[k]);
        }
    }
    return count;
}

async function fetchAptRepoCatalog() {
    try {
        const catalogMeta = await downloadWithMetrics(
            'https://raw.githubusercontent.com/CreatorPoints/Krypton-Repo/main/apt/packages.json',
            './apt/packages.json'
        );
        if (catalogMeta && catalogMeta.text) {
            const data = JSON.parse(catalogMeta.text);
            if (Array.isArray(data) && data.length > 0) {
                vfs.writeFile('/var/lib/apt/lists/deb.krypton-os.org_krypton_Packages.json', JSON.stringify(data, null, 2));
                await idbStore.put('manifests', { id: 'apt_packages', payload: data, sha256: catalogMeta.sha256 });
                return data;
            }
        }
    } catch (e) {}

    const cached = vfs.readFile('/var/lib/apt/lists/deb.krypton-os.org_krypton_Packages.json');
    if (cached) {
        try { return JSON.parse(cached); } catch (e) {}
    }
    return REPO_DPKG_PACKAGES;
}

async function executeAptCommand(args, isRoot, callback) {
    const subCmd = (args[0] || '').toLowerCase();
    const pkg = (args[1] || '').toLowerCase();
    const isInstalled = localStorage.getItem('krypton_os_installed') === 'true';

    if (!isInstalled && (subCmd === 'update' || subCmd === 'upgrade' || subCmd === 'dist-upgrade' || subCmd === 'full-upgrade' || subCmd === 'install' || subCmd === 'remove')) {
        callback({
            lines: [
                { text: "E: Package operations (update/upgrade/install) are disabled on Live Media.", type: 'error' },
                { text: "E: The Live ISO installer environment is read-only.", type: 'warning' },
                { text: "E: Please run 'krypton-installer' to install Krypton OS to /dev/nvme0n1 first.", type: 'info' }
            ],
            exitCode: 100
        });
        return;
    }

    if (!isRoot && (subCmd === 'install' || subCmd === 'remove' || subCmd === 'upgrade' || subCmd === 'update' || subCmd === 'purge' || subCmd === 'dist-upgrade' || subCmd === 'full-upgrade')) {
        callback({
            lines: [{ text: "E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock, are you root?", type: 'error' }],
            exitCode: 100
        });
        return;
    }

    const packages = await fetchAptRepoCatalog();
    const totalVfsFiles = countVfsNodes(vfs.root);

    if (subCmd === 'update') {
        let catalogSizeKb = 5.5;
        let fetchElapsed = 0.2;

        try {
            const meta = await downloadWithMetrics(
                'https://raw.githubusercontent.com/CreatorPoints/Krypton-Repo/main/apt/packages.json',
                './apt/packages.json'
            );
            catalogSizeKb = (meta.size / 1024);
            fetchElapsed = meta.elapsedSec;
            await idbStore.put('manifests', { id: 'apt_packages', payload: JSON.parse(meta.text), sha256: meta.sha256 });
        } catch (e) {}

        const speedKb = Math.round(catalogSizeKb / Math.max(0.05, fetchElapsed));
        const upgradables = getUpgradablePackages(packages);

        const streamLines = [
            { text: "Hit:1 https://deb.krypton-os.org/krypton beryllium InRelease", type: 'normal', delay: 160 },
            { text: `Get:2 https://deb.krypton-os.org/krypton beryllium/main amd64 Packages [${catalogSizeKb.toFixed(1)} kB]`, type: 'normal', delay: 220 },
            { text: `Fetched ${catalogSizeKb.toFixed(1)} kB in ${fetchElapsed.toFixed(1)}s (${speedKb} kB/s)`, type: 'muted', delay: 140 },
            { text: "Reading package lists... Done", type: 'success', delay: 120 },
            { text: "Building dependency tree... Done", type: 'success', delay: 100 },
            { text: "Reading state information... Done", type: 'success', delay: 100 }
        ];

        if (upgradables.length > 0) {
            const pkgNames = upgradables.map(u => u.available.name).join(', ');
            streamLines.push({ text: `${upgradables.length} packages can be upgraded: ${pkgNames}. Run 'apt list --upgradable' to see them.`, type: 'warning', delay: 100 });
        } else {
            streamLines.push({ text: "All packages are up to date.", type: 'success', delay: 80 });
        }

        callback({ streamLines, exitCode: 0 });
        return;
    }

    if (subCmd === 'upgrade' || subCmd === 'dist-upgrade' || subCmd === 'full-upgrade') {
        const upgradables = getUpgradablePackages(packages);

        if (upgradables.length === 0) {
            callback({
                streamLines: [
                    { text: "Reading package lists... Done", type: 'normal', delay: 120 },
                    { text: "Building dependency tree... Done", type: 'normal', delay: 100 },
                    { text: "Calculating upgrade... Done", type: 'normal', delay: 100 },
                    { text: "0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.", type: 'success', delay: 80 }
                ],
                exitCode: 0
            });
            return;
        }

        const totalDownloadBytes = upgradables.reduce((acc, u) => acc + (u.available.size || 1024), 0);
        const totalDeltaBytes = upgradables.reduce((acc, u) => acc + Math.max(0, (u.available.installed_size || u.available.size || 0) - (u.installed.installedSize || 0)), 0);
        const totalDownloadKb = (totalDownloadBytes / 1024).toFixed(1);
        const totalDeltaKb = (totalDeltaBytes / 1024).toFixed(1);

        const hasKernelOrBaseUpgrade = upgradables.some(u => 
            u.available.id.startsWith('linux-image') || 
            u.available.id === 'base-files'
        );

        const streamLines = [
            { text: "Reading package lists... Done", type: 'normal', delay: 140 },
            { text: "Building dependency tree... Done", type: 'normal', delay: 120 },
            { text: "Calculating upgrade... Done", type: 'normal', delay: 150 },
            { text: `The following packages will be upgraded:\n${upgradables.map(u => `  ${u.available.name} (${u.installed.version} => ${u.available.version})`).join('\n')}`, type: 'info', delay: 200 },
            { text: `${upgradables.length} upgraded, 0 newly installed, 0 to remove and 0 not upgraded.`, type: 'normal', delay: 150 },
            { text: `Need to get ${totalDownloadKb} kB of archives.`, type: 'normal', delay: 100 },
            { text: `After this operation, ${totalDeltaKb} kB of additional disk space will be used.`, type: 'muted', delay: 100 }
        ];

        upgradables.forEach((u, idx) => {
            const debFilename = u.available.file || (u.available.id + '.deb');
            const sizeKb = ((u.available.size || 1024) / 1024).toFixed(1);
            const poolSec = u.available.section ? u.available.section.split('/')[0] : 'main';
            streamLines.push({
                text: `Get:${idx + 1} https://deb.krypton-os.org/krypton/pool/${poolSec}/${u.available.name}/${debFilename} [${sizeKb} kB]`,
                type: 'normal',
                delay: 200
            });
        });

        streamLines.push({
            text: `Fetched ${totalDownloadKb} kB in 1s (${totalDownloadKb} kB/s) - Verified SHA-256 integrity`,
            type: 'muted',
            delay: 180
        });
        streamLines.push({
            text: `(Reading database ... ${totalVfsFiles} files and directories currently installed.)`,
            type: 'muted',
            delay: 120
        });

        upgradables.forEach(u => {
            const debFilename = u.available.file || (u.available.id + '.deb');
            streamLines.push({ text: `Preparing to unpack .../${debFilename} ...`, type: 'normal', delay: 160 });
            streamLines.push({ text: `Unpacking ${u.available.name} (${u.available.version}) over (${u.installed.version}) ...`, type: 'normal', delay: 180 });
            streamLines.push({ text: `Setting up ${u.available.name} (${u.available.version}) ...`, type: 'success', delay: 160 });
        });

        streamLines.push({ text: "Processing triggers for krypton-desktop...", type: 'normal', delay: 120 });
        streamLines.push({ text: "Updating desktop application registry (/usr/share/applications)... Done", type: 'normal', delay: 120 });
        
        if (hasKernelOrBaseUpgrade) {
            streamLines.push({ text: `[ OK ] Core system packages staged.`, type: 'success', delay: 150 });
            streamLines.push({ text: `\n*** System restart required to boot Linux 6.10.0-krypton-generic ***`, type: 'warning', delay: 100 });
            streamLines.push({ text: `Run 'sudo reboot' in Terminal to restart and apply kernel updates.`, type: 'cyan', delay: 80 });
        } else {
            streamLines.push({ text: `[ OK ] Upgrade complete. All packages and applications updated.`, type: 'success', delay: 120 });
        }

        // Asynchronously download, verify and extract each package
        (async () => {
            for (const u of upgradables) {
                try {
                    const debFilename = u.available.file || (u.available.id + '.deb');
                    const debUrl = `https://raw.githubusercontent.com/CreatorPoints/Krypton-Repo/main/apt/${debFilename}`;
                    const localDebUrl = `./apt/${debFilename}`;
                    const debMeta = await downloadWithMetrics(debUrl, localDebUrl);
                    if (debMeta && debMeta.text) {
                        await idbStore.put('packages', { name: u.available.id, data: debMeta.text, sha256: debMeta.sha256, size: debMeta.size });
                        let parsed = null;
                        try { parsed = JSON.parse(debMeta.text); } catch (e) {}
                        if (parsed && parsed.files) {
                            for (const [filePath, fileContent] of Object.entries(parsed.files)) {
                                const dir = filePath.substring(0, filePath.lastIndexOf('/'));
                                if (dir && !vfs.exists(dir)) vfs.createDirectory(dir);
                                vfs.writeFile(filePath, fileContent);
                            }
                        }
                    }
                } catch (e) {}
            }
        })();

        callback({
            streamLines,
            exitCode: 0,
            onComplete: () => {
                // Update /var/lib/dpkg/status with upgraded package entries
                let raw = vfs.readFile('/var/lib/dpkg/status') || '';
                let blocks = raw.split(/\n\s*\n/).filter(b => b.trim().length > 0);

                const upgradeMap = new Map();
                for (const u of upgradables) {
                    upgradeMap.set(u.available.id, u.available);
                    if (u.installed && u.installed.id) {
                        upgradeMap.set(u.installed.id, u.available);
                    }
                    if (u.available.id.startsWith('linux-image') || (u.installed && u.installed.id.startsWith('linux-image'))) {
                        upgradeMap.set('__kernel__', u.available);
                    }
                }

                const processedIds = new Set();
                const finalBlocks = [];

                for (const b of blocks) {
                    const pkgMatch = b.match(/Package:\s*([^\n]+)/);
                    if (pkgMatch) {
                        const pkgId = pkgMatch[1].trim();
                        let replacementPkg = null;

                        if (pkgId.startsWith('linux-image') && upgradeMap.has('__kernel__')) {
                            replacementPkg = upgradeMap.get('__kernel__');
                        } else if (upgradeMap.has(pkgId)) {
                            replacementPkg = upgradeMap.get(pkgId);
                        }

                        if (replacementPkg) {
                            if (!processedIds.has(replacementPkg.id)) {
                                finalBlocks.push(`Package: ${replacementPkg.id}\nStatus: install ok installed\nPriority: optional\nSection: ${replacementPkg.section || 'universe'}\nInstalled-Size: ${replacementPkg.installed_size || replacementPkg.size || 1024}\nMaintainer: ${replacementPkg.maintainer || 'Krypton Maintainers <packages@krypton-os.org>'}\nArchitecture: ${replacementPkg.architecture || replacementPkg.arch || 'amd64'}\nVersion: ${replacementPkg.version}\nDescription: ${replacementPkg.summary || replacementPkg.description || replacementPkg.name}`);
                                processedIds.add(replacementPkg.id);
                            }
                        } else {
                            if (!processedIds.has(pkgId)) {
                                finalBlocks.push(b);
                                processedIds.add(pkgId);
                            }
                        }
                    } else {
                        finalBlocks.push(b);
                    }
                }

                for (const u of upgradables) {
                    if (!processedIds.has(u.available.id)) {
                        finalBlocks.push(`Package: ${u.available.id}\nStatus: install ok installed\nPriority: optional\nSection: ${u.available.section || 'universe'}\nInstalled-Size: ${u.available.installed_size || u.available.size || 1024}\nMaintainer: ${u.available.maintainer || 'Krypton Maintainers <packages@krypton-os.org>'}\nArchitecture: ${u.available.architecture || u.available.arch || 'amd64'}\nVersion: ${u.available.version}\nDescription: ${u.available.summary || u.available.description || u.available.name}`);
                        processedIds.add(u.available.id);
                    }
                }

                vfs.writeFile('/var/lib/dpkg/status', finalBlocks.join('\n\n') + '\n\n');
                if (hasKernelOrBaseUpgrade) {
                    vfs.writeFile('/var/run/reboot-required', '*** System restart required ***\n');
                } else if (vfs.exists('/var/run/reboot-required')) {
                    vfs.deleteFile('/var/run/reboot-required');
                }
                vfs.saveFileSystem();

                if (window.appLoader) {
                    window.appLoader.clearCache();
                }
                window.dispatchEvent(new CustomEvent('krypton_packages_changed'));

                if (hasKernelOrBaseUpgrade) {
                    story.showToast('🚀 System Upgraded', `Core packages staged. Run 'sudo reboot' in Terminal to restart.`, 'info');
                } else {
                    story.showToast('✨ Applications Updated', `Upgraded packages and refreshed desktop runtime.`, 'success');
                }
            }
        });
        return;
    }

    if (subCmd === 'show' || subCmd === 'info') {
        if (!pkg) {
            callback({ lines: [{ text: "apt: missing package name to show", type: 'error' }], exitCode: 1 });
            return;
        }
        const found = packages.find(p => p.id === pkg || p.name === pkg || p.id === `krypton-${pkg}`);
        if (found) {
            callback({
                lines: [
                    { text: `Package: ${found.name}`, type: 'cyan' },
                    { text: `Version: ${found.version}`, type: 'normal' },
                    { text: `Priority: optional`, type: 'normal' },
                    { text: `Section: ${found.section || 'universe'}`, type: 'normal' },
                    { text: `Maintainer: ${found.maintainer || 'Krypton Maintainers <pkg@krypton-os.org>'}`, type: 'normal' },
                    { text: `Installed-Size: ${found.installed_size || found.size || 512} B`, type: 'normal' },
                    { text: `Architecture: ${found.architecture || found.arch || 'amd64'}`, type: 'normal' },
                    { text: `Archive-File: /apt/${found.file || (found.id + '.deb')}`, type: 'muted' },
                    { text: `Description: ${found.summary || found.description}`, type: 'normal' }
                ],
                exitCode: 0
            });
        } else {
            callback({ lines: [{ text: `E: Unable to locate package ${pkg}`, type: 'error' }], exitCode: 100 });
        }
        return;
    }

    if (subCmd === 'list') {
        const isUpgradableFlag = args.includes('--upgradable') || args.includes('-u');

        if (isUpgradableFlag) {
            const upgradables = getUpgradablePackages(packages);
            if (upgradables.length === 0) {
                callback({
                    lines: [{ text: "Listing... Done", type: 'muted' }],
                    exitCode: 0
                });
            } else {
                const lines = [{ text: "Listing... Done", type: 'muted' }];
                upgradables.forEach(u => {
                    lines.push({
                        text: `${u.available.name}/${u.available.section || 'universe'} ${u.available.version} ${u.available.architecture || 'amd64'} [upgradable from: ${u.installed.version}]`,
                        type: 'cyan'
                    });
                });
                callback({ lines, exitCode: 0 });
            }
            return;
        }

        const installed = parseDpkgStatus();
        const lines = [
            { text: `Listing... Done (/apt repository - ${packages.length} available)`, type: 'muted' }
        ];
        packages.forEach(p => {
            const isInst = installed.find(i => i.id === p.id || i.name === p.id || i.id === `krypton-${p.id}`);
            const stateStr = isInst ? `[installed: ${isInst.version}]` : `[available: ${p.file || p.id + '.deb'}]`;
            lines.push({
                text: `${p.name}/${p.section || 'universe'} ${p.version} ${p.architecture || p.arch || 'amd64'} ${stateStr}`,
                type: isInst ? 'success' : (p.id === 'antigravity' ? 'cyan' : 'normal')
            });
        });
        callback({ lines, exitCode: 0 });
        return;
    }

    if (subCmd === 'search') {
        if (!pkg) {
            callback({ lines: [{ text: "apt: missing search query", type: 'error' }], exitCode: 1 });
            return;
        }
        const results = packages.filter(p => 
            p.name.toLowerCase().includes(pkg) || 
            (p.summary && p.summary.toLowerCase().includes(pkg)) ||
            (p.description && p.description.toLowerCase().includes(pkg)) ||
            (p.section && p.section.toLowerCase().includes(pkg))
        );
        if (results.length === 0) {
            callback({ lines: [{ text: `No packages matching '${pkg}' in /apt`, type: 'warning' }], exitCode: 0 });
            return;
        }
        const lines = [{ text: `Sorting... Done\nFull Text Search... Done`, type: 'muted' }];
        results.forEach(p => {
            lines.push({ text: `${p.name}/${p.section || 'universe'} ${p.version} ${p.architecture || p.arch || 'amd64'}`, type: 'cyan' });
            lines.push({ text: `  ${p.summary || p.description} (from /apt/${p.file || p.id + '.deb'})`, type: 'normal' });
        });
        callback({ lines, exitCode: 0 });
        return;
    }

    if (subCmd === 'install') {
        if (!pkg) {
            callback({ lines: [{ text: "apt: missing package name operand", type: 'error' }], exitCode: 1 });
            return;
        }

        const found = packages.find(p => p.id === pkg || p.name === pkg || p.id === `krypton-${pkg}`);

        if (found) {
            const debFilename = found.file || (found.id + '.deb');
            const debUrl = `https://raw.githubusercontent.com/CreatorPoints/Krypton-Repo/main/apt/${debFilename}`;
            const localDebUrl = `./apt/${debFilename}`;

            idbStore.get('packages', found.id).then(async (cachedPkg) => {
                let pkgMeta = cachedPkg;
                let downloadedFresh = false;

                if (!pkgMeta) {
                    try {
                        pkgMeta = await downloadWithMetrics(debUrl, localDebUrl);
                        downloadedFresh = true;
                        await idbStore.put('packages', { name: found.id, data: pkgMeta.text, sha256: pkgMeta.sha256, size: pkgMeta.size });
                    } catch (e) {
                        callback({
                            lines: [
                                { text: `E: Failed to fetch ${debUrl}`, type: 'error' },
                                { text: `E: Unable to correct problems, you have held broken packages.`, type: 'error' }
                            ],
                            exitCode: 100
                        });
                        return;
                    }
                }

                const hashStr = pkgMeta ? pkgMeta.sha256.substring(0, 16) + '...' : 'verified';
                const sizeKb = pkgMeta ? (pkgMeta.size / 1024).toFixed(1) : '5.2';

                let extractedFilesCount = 0;
                try {
                    const parsedDeb = JSON.parse(pkgMeta.text || pkgMeta.data);
                    if (parsedDeb && parsedDeb.files) {
                        for (const [filePath, fileContent] of Object.entries(parsedDeb.files)) {
                            const dir = filePath.substring(0, filePath.lastIndexOf('/'));
                            if (dir && !vfs.exists(dir)) vfs.createDirectory(dir);
                            vfs.writeFile(filePath, fileContent);
                            extractedFilesCount++;
                        }
                    }
                } catch (e) {
                    vfs.writeFile(`/usr/bin/${found.id}`, `#!/bin/bash\n# ${found.name} binary\n`);
                }

                if (found.id === 'antigravity') story.setAntigravity(true);
                if (found.id === 'adblock' || found.id === 'krypton-adblock') story.setAdblock(true);

                // Update /var/lib/dpkg/status
                const currentDpkgStatus = vfs.readFile('/var/lib/dpkg/status') || '';
                const newPkgEntry = `Package: ${found.id}\nStatus: install ok installed\nPriority: optional\nSection: ${found.section || 'universe'}\nInstalled-Size: ${found.installed_size || found.size || 512}\nMaintainer: ${found.maintainer || 'Krypton Maintainers <packages@krypton-os.org>'}\nArchitecture: ${found.architecture || found.arch || 'amd64'}\nVersion: ${found.version}\nDescription: ${found.summary || found.description || found.name}\n\n`;
                if (!currentDpkgStatus.includes(`Package: ${found.id}`)) {
                    vfs.writeFile('/var/lib/dpkg/status', currentDpkgStatus + newPkgEntry);
                }

                vfs.saveFileSystem();
                if (window.appLoader) {
                    window.appLoader.invalidateCache(found.id);
                }
                window.dispatchEvent(new CustomEvent('krypton_packages_changed', { detail: { action: 'install', package: found.id } }));

                const cacheNotice = downloadedFresh ? `Get:1 ${debUrl} [${sizeKb} kB]` : `Get:1 [Cached in /var/cache/apt/archives/] ${found.id} [${sizeKb} kB]`;

                callback({
                    lines: [
                        { text: `Reading package lists... Done`, type: 'normal' },
                        { text: `Building dependency tree... Done`, type: 'normal' },
                        { text: `Reading state information... Done`, type: 'normal' },
                        { text: `The following NEW packages will be installed:\n  ${found.name}`, type: 'info' },
                        { text: cacheNotice, type: 'normal' },
                        { text: `Fetched ${sizeKb} kB in 0s - [SHA256: ${hashStr}]`, type: 'muted' },
                        { text: `Selecting previously unselected package ${found.name}.`, type: 'muted' },
                        { text: `(Reading database ... ${totalVfsFiles} files and directories currently installed.)`, type: 'muted' },
                        { text: `Preparing to unpack /var/cache/apt/archives/${debFilename} ...`, type: 'normal' },
                        { text: `Unpacking ${found.name} (${found.version}) [${extractedFilesCount} files extracted to VFS] ...`, type: 'normal' },
                        { text: `Setting up ${found.name} (${found.version}) ...`, type: 'success' },
                        { text: `Processing triggers for krypton-desktop...`, type: 'muted' },
                        { text: `Updating desktop application registry (/usr/share/applications)... Done`, type: 'muted' },
                        { text: `[ OK ] Package '${found.name}' installed successfully.`, type: 'info' }
                    ],
                    exitCode: 0
                });
            });
            return;
        }

        callback({
            lines: [{ text: `E: Unable to locate package ${pkg} in /apt repository. Try 'apt list' or 'apt search <query>'`, type: 'error' }],
            exitCode: 100
        });
        return;
    }

    if (subCmd === 'remove' || subCmd === 'purge') {
        if (!pkg) {
            callback({ lines: [{ text: "apt: missing package name operand", type: 'error' }], exitCode: 1 });
            return;
        }

        if (pkg === 'antigravity') {
            story.setAntigravity(false);
        } else if (pkg === 'adblock' || pkg === 'krypton-adblock') {
            story.setAdblock(false);
        }

        // Standard package removal
        const targetsToRemove = [
            `/usr/bin/${pkg}`,
            `/usr/bin/krypton-${pkg}`,
            `/usr/games/${pkg}`,
            `/usr/lib/${pkg}`,
            `/usr/lib/krypton-${pkg}`,
            `/usr/share/applications/${pkg}.desktop`,
            `/usr/share/applications/${pkg.replace('krypton-', '')}.desktop`
        ];

        targetsToRemove.forEach(p => {
            if (vfs.exists(p)) vfs.remove(p);
        });

        // Invalidate dynamic module cache
        if (window.appLoader) {
            window.appLoader.invalidateCache(pkg);
        }

        // Update dpkg status
        const dpkgStatus = vfs.readFile('/var/lib/dpkg/status') || '';
        if (dpkgStatus.includes(`Package: ${pkg}`)) {
            vfs.writeFile('/var/lib/dpkg/status', dpkgStatus.replace(new RegExp(`Package: ${pkg}[\\s\\S]*?\\n\\n`, 'g'), ''));
        }

        vfs.saveFileSystem();
        window.dispatchEvent(new CustomEvent('krypton_packages_changed', { detail: { action: 'remove', package: pkg } }));

        callback({
            lines: [
                { text: `Reading package lists... Done`, type: 'normal' },
                { text: `Removing package ${pkg} ...`, type: 'warning' },
                { text: `Purging binaries, libraries, and desktop entries for ${pkg} from VFS ...`, type: 'muted' },
                { text: `Package '${pkg}' removed successfully.`, type: 'success' }
            ],
            exitCode: 0
        });
        return;
    }

    let suggestion = '';
    if (subCmd === 'pdate' || subCmd === 'updat' || subCmd === 'upd') suggestion = `\nDid you mean 'update'?`;
    if (subCmd === 'pgrade' || subCmd === 'upgrde' || subCmd === 'upg') suggestion = `\nDid you mean 'upgrade'?`;
    if (subCmd === 'instal' || subCmd === 'isntall' || subCmd === 'inst') suggestion = `\nDid you mean 'install'?`;

    callback({
        lines: [
            { text: `E: Invalid operation ${subCmd}${suggestion}`, type: 'error' },
            { text: `Usage: apt [options] command`, type: 'normal' },
            { text: `Commands: update, upgrade, install <pkg>, remove <pkg>, list, search <query>, show <pkg>`, type: 'muted' }
        ],
        exitCode: 100
    });
}

/* --------------------------------------------------------------------------
   Helper: Argument Tokenizer (Handles Quotes)
   -------------------------------------------------------------------------- */
function parseArguments(str) {
    const args = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if ((char === '"' || char === "'") && (!inQuote || char === quoteChar)) {
            inQuote = !inQuote;
            quoteChar = inQuote ? char : '';
        } else if (char === ' ' && !inQuote) {
            if (current.length > 0) {
                args.push(current);
                current = '';
            }
        } else {
            current += char;
        }
    }
    if (current.length > 0) args.push(current);
    return args;
}

/* --------------------------------------------------------------------------
   Helper: Path Resolver
   -------------------------------------------------------------------------- */
function resolvePath(currentDir, target, user = '') {
    if (!target) return currentDir;
    let t = String(target).trim();

    const effUser = user || localStorage.getItem('krypton_primary_user') || 'guest';
    const homeDir = (effUser === 'root') ? '/root' : `/home/${effUser}`;

    if (t === '~' || t === '~/' || t === '') {
        return homeDir;
    }
    if (t.startsWith('~/')) {
        t = homeDir + t.substring(1);
    } else if (t.startsWith('~')) {
        const slashIdx = t.indexOf('/');
        const u = slashIdx === -1 ? t.substring(1) : t.substring(1, slashIdx);
        const rest = slashIdx === -1 ? '' : t.substring(slashIdx);
        const uHome = u === 'root' ? '/root' : `/home/${u}`;
        t = uHome + rest;
    }

    if (t.startsWith('/')) {
        return vfs.normalizePath(t);
    }
    return vfs.normalizePath(currentDir + '/' + t);
}

/* --------------------------------------------------------------------------
   Helper: ASCII Tree Builder
   -------------------------------------------------------------------------- */
function buildAsciiTree(startPath) {
    const lines = [startPath];
    const node = vfs.getNode(startPath);
    if (!node || node.type !== 'dir') return lines;

    const renderChildren = (currNode, prefix = '') => {
        const entries = Object.values(currNode.children || {});
        entries.forEach((child, idx) => {
            const isLast = idx === entries.length - 1;
            const branch = isLast ? '└── ' : '├── ';
            lines.push(prefix + branch + child.name + (child.type === 'dir' ? '/' : ''));
            if (child.type === 'dir') {
                renderChildren(child, prefix + (isLast ? '    ' : '│   '));
            }
        });
    };

    renderChildren(node);
    return lines;
}

/* --------------------------------------------------------------------------
   Helper: Cryptographic Hash Generator
   -------------------------------------------------------------------------- */
function generateFakeHash(len, seed) {
    let hash = '';
    const hexChars = '0123456789abcdef';
    let seedVal = 0;
    for (let i = 0; i < seed.length; i++) {
        seedVal = (seedVal << 5) - seedVal + seed.charCodeAt(i);
        seedVal |= 0;
    }
    for (let i = 0; i < len; i++) {
        const charIdx = Math.abs((seedVal ^ (i * 37)) % hexChars.length);
        hash += hexChars[charIdx];
    }
    return hash;
}
