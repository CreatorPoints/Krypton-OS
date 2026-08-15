/* ==========================================================================
   KryptonOS Application - Sandboxed Web Browser Engine
   ========================================================================== */

import { wm } from '../wm.js';
import { vfs } from '../fs.js';
import { story } from '../story.js';
import { sound } from '../sound.js';

export function openBrowser(initialUrl = 'krypton://home') {
    const content = document.createElement('div');
    content.className = 'browser-app';

    content.innerHTML = `
        <div class="browser-toolbar">
            <button class="browser-nav-btn" id="b-back" title="Back">◄</button>
            <button class="browser-nav-btn" id="b-forward" title="Forward">►</button>
            <button class="browser-nav-btn" id="b-reload" title="Reload">🔄</button>
            <button class="browser-nav-btn" id="b-home" title="Home">🏠</button>
            <div class="browser-address-bar">
                <input type="text" id="b-url-input" value="${initialUrl}" placeholder="Search web with DuckDuckGo or enter URL (e.g. en.wikipedia.org)...">
            </div>
            <button class="browser-nav-btn" id="b-go" title="Go / Search" style="background: var(--accent-primary); color: #000; font-weight: bold; border-radius: 4px; padding: 4px 10px;">Go</button>
            <div class="browser-adblock-indicator" id="b-adblock-tag" title="AdBlock status managed via APT (/apt/adblock.dpkg)">
                🛡️ <span id="b-adblock-state" style="color: ${story.adblockEnabled ? 'var(--accent-success)' : 'var(--accent-danger)'}; font-weight: bold;">
                    ${story.adblockEnabled ? 'SHIELD: ON' : 'SHIELD: OFF'}
                </span>
            </div>
        </div>
        <div class="browser-viewport" id="b-viewport">
            <!-- Live Web iframe or Virtual Host -->
        </div>
    `;

    const urlInput = content.querySelector('#b-url-input');
    const viewport = content.querySelector('#b-viewport');
    const goBtn = content.querySelector('#b-go');

    const historyStack = [initialUrl];
    let historyIndex = 0;

    const navigateTo = (url, pushHistory = true) => {
        if (!url) url = 'krypton://home';
        url = url.trim();

        if (urlInput) urlInput.value = url;

        if (pushHistory) {
            if (historyIndex < historyStack.length - 1) {
                historyStack.splice(historyIndex + 1);
            }
            historyStack.push(url);
            historyIndex = historyStack.length - 1;
        }

        renderPage(url, viewport, navigateTo);
    };

    content.querySelector('#b-back').addEventListener('click', () => {
        if (historyIndex > 0) {
            historyIndex--;
            navigateTo(historyStack[historyIndex], false);
        }
    });

    content.querySelector('#b-forward').addEventListener('click', () => {
        if (historyIndex < historyStack.length - 1) {
            historyIndex++;
            navigateTo(historyStack[historyIndex], false);
        }
    });

    content.querySelector('#b-reload').addEventListener('click', () => {
        sound.playClick();
        navigateTo(historyStack[historyIndex] || 'krypton://home', false);
    });

    content.querySelector('#b-home').addEventListener('click', () => {
        sound.playClick();
        navigateTo('krypton://home');
    });

    goBtn.addEventListener('click', () => {
        sound.playClick();
        navigateTo(urlInput.value);
    });

    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sound.playClick();
            navigateTo(urlInput.value);
        }
    });

    navigateTo(initialUrl, false);

    wm.createWindow({
        id: 'browser',
        title: 'Krypton Browser',
        icon: '🌐',
        width: 860,
        height: 560,
        content: content
    });
}

function renderPage(rawUrl, viewport, navigateTo) {
    const lowerUrl = rawUrl.toLowerCase().trim();

    // 1. Check /etc/hosts mappings for experimental sandbox virtual host routing
    let isLocalhostMapped = false;
    let isHostBlocked = false;
    const cleanHost = lowerUrl.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];

    const hostsNode = vfs.getNode('/etc/hosts');
    if (hostsNode && hostsNode.content) {
        const lines = hostsNode.content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const parts = trimmed.split(/\s+/);
            const ip = parts[0];
            const hostnames = parts.slice(1);
            if (hostnames.includes(cleanHost)) {
                if (ip === '127.0.0.1' || ip === '127.0.1.1' || ip === '::1') {
                    isLocalhostMapped = true;
                } else if (ip === '0.0.0.0') {
                    isHostBlocked = true;
                }
            }
        }
    }

    // 2. Localhost & /var/www/html/index.html Web Server
    if (cleanHost === 'localhost' || cleanHost === '127.0.0.1' || cleanHost === 'localweb.test' || isLocalhostMapped) {
        const webHtml = vfs.readFile('/var/www/html/index.html') || '<!DOCTYPE html><html><body><h1>Localhost</h1><p>Welcome to KryptonOS local HTTP server!</p></body></html>';
        viewport.innerHTML = `
            <div style="background: rgba(0,229,255,0.08); padding: 8px 16px; border-bottom: 1px solid rgba(0,229,255,0.2); font-family: monospace; font-size: 12px; color: #00e5ff; display: flex; justify-content: space-between; align-items: center;">
                <span>● LOCAL VIRTUAL HOST: ${cleanHost} &rarr; 127.0.0.1:80 (/var/www/html/index.html)</span>
                <span style="color: #55ff55;">HTTP/1.1 200 OK</span>
            </div>
            <div class="browser-inner-content">
                ${webHtml}
            </div>
        `;
        return;
    }

    // 3. Blocked Host via /etc/hosts sinkhole
    if (isHostBlocked) {
        viewport.innerHTML = `
            <div class="browser-inner-content">
                <div class="fake-website" style="text-align: center; padding: 50px;">
                    <h1 style="color: #ff5555; font-size: 28px;">🛡️ Host Blocked by /etc/hosts</h1>
                    <p style="color: var(--text-secondary); margin: 15px 0;">The domain <code>${cleanHost}</code> is sinkholed to <code>0.0.0.0</code> in your virtual <code>/etc/hosts</code> database.</p>
                    <small style="color: var(--text-muted);">To unblock, edit /etc/hosts via terminal: sudo nano /etc/hosts</small>
                </div>
            </div>
        `;
        return;
    }

    // 4. Browser Home Portal
    if (lowerUrl === 'krypton://home' || lowerUrl === 'home' || lowerUrl === '' || lowerUrl === 'about:blank') {
        viewport.innerHTML = `
            <div class="browser-inner-content">
                <div class="fake-website">
                    <div style="text-align: center; margin: 30px 0 20px 0;">
                        <h1 style="font-size: 34px; color: var(--accent-primary); font-weight: 800;">Krypton Browser 🌐</h1>
                        <p style="color: var(--text-secondary); font-size: 14px;">Sandboxed Web Browser Engine for KryptonOS</p>
                    </div>
                    <div style="max-width: 540px; margin: 0 auto 30px auto; display: flex; gap: 8px;">
                        <input type="text" id="b-home-search-input" placeholder="Search the web with DuckDuckGo or enter URL..." style="flex: 1; padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.08); border: 1px solid var(--border-color); color: #fff; outline: none;">
                        <button id="b-home-search-btn" style="padding: 12px 22px; background: var(--accent-primary); color: #000; font-weight: 700; border-radius: 8px; cursor: pointer; border: none;">Search</button>
                    </div>
                    
                    <h3 style="border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 15px; font-size: 15px;">🌐 Verified Web Bookmarks & Local Services</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
                        <div class="b-card" style="background: rgba(255,255,255,0.04); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">
                            <span style="font-size: 11px; color: #00e5ff; font-weight: 700;">SEARCH ENGINE</span>
                            <h4 style="margin: 6px 0; font-size: 14px;"><a href="#" class="b-link" data-url="https://duckduckgo.com" style="color: var(--accent-primary);">DuckDuckGo Live</a></h4>
                            <p style="font-size: 12px; color: var(--text-secondary);">Privacy search engine with real web results.</p>
                        </div>
                        <div class="b-card" style="background: rgba(255,255,255,0.04); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">
                            <span style="font-size: 11px; color: #55ff55; font-weight: 700;">ENCYCLOPEDIA</span>
                            <h4 style="margin: 6px 0; font-size: 14px;"><a href="#" class="b-link" data-url="https://en.m.wikipedia.org" style="color: var(--accent-primary);">Wikipedia (Live)</a></h4>
                            <p style="font-size: 12px; color: var(--text-secondary);">Browse millions of free encyclopedia articles.</p>
                        </div>
                        <div class="b-card" style="background: rgba(255,255,255,0.04); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">
                            <span style="font-size: 11px; color: #ffaa00; font-weight: 700;">LOCAL SERVER</span>
                            <h4 style="margin: 6px 0; font-size: 14px;"><a href="#" class="b-link" data-url="http://localhost" style="color: var(--accent-primary);">Local Web Server (/var/www/html)</a></h4>
                            <p style="font-size: 12px; color: var(--text-secondary);">Your editable local website inside KryptonOS.</p>
                        </div>
                        <div class="b-card" style="background: rgba(255,255,255,0.04); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">
                            <span style="font-size: 11px; color: #ff007f; font-weight: 700;">TECH NEWS</span>
                            <h4 style="margin: 6px 0; font-size: 14px;"><a href="#" class="b-link" data-url="https://news.ycombinator.com" style="color: var(--accent-primary);">Hacker News (Live)</a></h4>
                            <p style="font-size: 12px; color: var(--text-secondary);">Live programming and technology discussions.</p>
                        </div>
                        <div class="b-card" style="background: rgba(255,255,255,0.04); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">
                            <span style="font-size: 11px; color: #aa00ff; font-weight: 700;">TEST BENCH</span>
                            <h4 style="margin: 6px 0; font-size: 14px;"><a href="#" class="b-link" data-url="https://example.com" style="color: var(--accent-primary);">Example Domain (Live)</a></h4>
                            <p style="font-size: 12px; color: var(--text-secondary);">Standard IANA illustrative website.</p>
                        </div>
                        <div class="b-card" style="background: rgba(255,255,255,0.04); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">
                            <span style="font-size: 11px; color: #38bdf8; font-weight: 700;">KERNEL</span>
                            <h4 style="margin: 6px 0; font-size: 14px;"><a href="#" class="b-link" data-url="https://www.kernel.org" style="color: var(--accent-primary);">The Linux Kernel Archives</a></h4>
                            <p style="font-size: 12px; color: var(--text-secondary);">Official Linux kernel source repositories.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const homeSearchInput = viewport.querySelector('#b-home-search-input');
        const homeSearchBtn = viewport.querySelector('#b-home-search-btn');
        if (homeSearchBtn && homeSearchInput) {
            const doSearch = () => {
                const query = homeSearchInput.value.trim();
                if (query) navigateTo(query);
            };
            homeSearchBtn.addEventListener('click', doSearch);
            homeSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') doSearch();
            });
        }

        viewport.querySelectorAll('.b-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetUrl = link.getAttribute('data-url');
                if (targetUrl) navigateTo(targetUrl);
            });
        });
        return;
    }

    // 5. Real Web URL or Web Search Query Handling
    let targetLiveUrl = rawUrl;

    const isDomain = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(rawUrl);
    const isFullUrl = /^https?:\/\//i.test(rawUrl);

    if (!isFullUrl && !isDomain) {
        targetLiveUrl = `https://duckduckgo.com/?q=${encodeURIComponent(rawUrl)}&ia=web`;
    } else if (!isFullUrl && isDomain) {
        targetLiveUrl = `https://${rawUrl}`;
    }

    viewport.innerHTML = `
        <div style="background: #111422; padding: 6px 14px; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 11px; display: flex; justify-content: space-between; align-items: center; color: #8892b0;">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%;">
                🔒 Connected: <a href="${targetLiveUrl}" target="_blank" style="color: #00e5ff; text-decoration: none;">${targetLiveUrl}</a>
            </span>
            <span style="color: #55ff55;">Live Sandbox Web Engine</span>
        </div>
        <iframe 
            class="browser-iframe" 
            src="${targetLiveUrl}" 
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            allow="fullscreen; clipboard-read; clipboard-write;"
            loading="lazy"
        ></iframe>
    `;
}
