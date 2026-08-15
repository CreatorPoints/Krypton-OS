/* ==========================================================================
   KryptonOS Application - Sandboxed Web Browser Engine & Live Search
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
            <button class="browser-nav-btn" id="b-go" title="Go / Search" style="background: var(--accent-primary); color: #000; font-weight: bold; border-radius: 4px; padding: 4px 10px; cursor: pointer;">Go</button>
            <div class="browser-adblock-indicator" id="b-adblock-tag" title="AdBlock status managed via APT (/apt/adblock.dpkg)">
                🛡️ <span id="b-adblock-state" style="color: ${story.adblockEnabled ? 'var(--accent-success)' : 'var(--accent-danger)'}; font-weight: bold;">
                    ${story.adblockEnabled ? 'SHIELD: ON' : 'SHIELD: OFF'}
                </span>
            </div>
        </div>
        <div class="browser-viewport" id="b-viewport">
            <!-- Live Web iframe or Search Results Engine -->
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
        width: 880,
        height: 580,
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
                    <div style="text-align: center; margin: 25px 0 20px 0;">
                        <h1 style="font-size: 36px; color: var(--accent-primary); font-weight: 800; letter-spacing: 1px;">Krypton Browser 🌐</h1>
                        <p style="color: var(--text-secondary); font-size: 14px;">Sandboxed Web Browser Engine & Live Web Search</p>
                    </div>
                    <div style="max-width: 560px; margin: 0 auto 28px auto; display: flex; gap: 8px;">
                        <input type="text" id="b-home-search-input" placeholder="Search the web with DuckDuckGo or enter URL..." style="flex: 1; padding: 12px 14px; border-radius: 8px; background: rgba(255,255,255,0.08); border: 1px solid var(--border-color); color: #fff; outline: none; font-size: 14px;">
                        <button id="b-home-search-btn" style="padding: 12px 24px; background: var(--accent-primary); color: #000; font-weight: 700; border-radius: 8px; cursor: pointer; border: none; font-size: 14px;">Search</button>
                    </div>
                    
                    <h3 style="border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 15px; font-size: 15px; color: #cfd8dc;">🌐 Verified Web Bookmarks & Services</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
                        <div class="b-card" style="background: rgba(255,255,255,0.04); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">
                            <span style="font-size: 11px; color: #00e5ff; font-weight: 700;">SEARCH ENGINE</span>
                            <h4 style="margin: 6px 0; font-size: 14px;"><a href="#" class="b-link" data-url="duckduckgo:linux" style="color: var(--accent-primary);">DuckDuckGo Live Search</a></h4>
                            <p style="font-size: 12px; color: var(--text-secondary);">Live instant answers & privacy search engine.</p>
                        </div>
                        <div class="b-card" style="background: rgba(255,255,255,0.04); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">
                            <span style="font-size: 11px; color: #55ff55; font-weight: 700;">ENCYCLOPEDIA</span>
                            <h4 style="margin: 6px 0; font-size: 14px;"><a href="#" class="b-link" data-url="https://en.m.wikipedia.org" style="color: var(--accent-primary);">Wikipedia (Live Mobile)</a></h4>
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

    // 5. Check if query is a Search Query vs Direct URL
    const isDomain = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(rawUrl);
    const isFullUrl = /^https?:\/\//i.test(rawUrl);
    const isDuckSearch = lowerUrl.startsWith('duckduckgo:') || lowerUrl.startsWith('ddg:');

    // If query is a search term or requested duckduckgo search
    if (isDuckSearch || (!isFullUrl && !isDomain)) {
        const query = isDuckSearch ? rawUrl.replace(/^(duckduckgo|ddg):/i, '').trim() : rawUrl.trim();
        renderLiveSearchResults(query, viewport, navigateTo);
        return;
    }

    // 6. Direct Full URL Navigation in Sandboxed Web Frame
    let targetLiveUrl = isFullUrl ? rawUrl : `https://${rawUrl}`;

    // If duckduckgo.com was specifically navigated to as a URL, convert to in-app live search
    if (targetLiveUrl.includes('duckduckgo.com')) {
        let extractedQuery = 'KryptonOS Linux';
        try {
            const urlObj = new URL(targetLiveUrl);
            const qParam = urlObj.searchParams.get('q');
            if (qParam) extractedQuery = qParam;
        } catch (e) {}
        renderLiveSearchResults(extractedQuery, viewport, navigateTo);
        return;
    }

    viewport.innerHTML = `
        <div style="background: #111422; padding: 8px 16px; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 12px; display: flex; justify-content: space-between; align-items: center; color: #8892b0;">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 65%;">
                🔒 Connected: <a href="${targetLiveUrl}" target="_blank" style="color: #00e5ff; text-decoration: none;">${targetLiveUrl}</a>
            </span>
            <div style="display: flex; gap: 8px; align-items: center;">
                <a href="${targetLiveUrl}" target="_blank" rel="noopener noreferrer" style="color: #55ff55; text-decoration: none; font-size: 11px; padding: 2px 8px; background: rgba(85,255,85,0.1); border: 1px solid #55ff55; border-radius: 4px;">↗️ Open Tab</a>
                <span style="color: #64748b; font-size: 11px;">Sandbox Frame</span>
            </div>
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

/* --------------------------------------------------------------------------
   Live Real-Time Web Search Engine (DuckDuckGo Instant Answers + Wikipedia)
   -------------------------------------------------------------------------- */
async function renderLiveSearchResults(query, viewport, navigateTo) {
    viewport.innerHTML = `
        <div class="browser-inner-content" style="padding: 24px; max-width: 860px; margin: 0 auto;">
            <div style="display: flex; gap: 10px; margin-bottom: 20px; align-items: center;">
                <input type="text" id="srch-query-input" value="${escapeHtml(query)}" style="flex: 1; padding: 10px 14px; border-radius: 8px; background: rgba(255,255,255,0.08); border: 1px solid var(--border-color); color: #fff; font-size: 14px; outline: none;">
                <button id="srch-query-btn" style="padding: 10px 20px; background: var(--accent-primary); color: #000; font-weight: 700; border-radius: 8px; border: none; cursor: pointer;">Search</button>
            </div>
            <div id="srch-loading-indicator" style="color: var(--accent-primary); font-family: monospace; font-size: 13px; margin: 20px 0;">
                ⚡ Querying DuckDuckGo & Live Knowledge Graph for "${escapeHtml(query)}"...
            </div>
            <div id="srch-results-container"></div>
        </div>
    `;

    const qInput = viewport.querySelector('#srch-query-input');
    const qBtn = viewport.querySelector('#srch-query-btn');
    const resultsContainer = viewport.querySelector('#srch-results-container');
    const loadingEl = viewport.querySelector('#srch-loading-indicator');

    const handleNewSearch = () => {
        const nextQ = qInput.value.trim();
        if (nextQ) navigateTo(nextQ);
    };

    qBtn?.addEventListener('click', handleNewSearch);
    qInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleNewSearch();
    });

    try {
        // 1. Fetch live DuckDuckGo Instant Answer API
        const ddgPromise = fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&pretty=1`)
            .then(res => res.json())
            .catch(() => null);

        // 2. Fetch live Wikipedia OpenSearch API
        const wikiPromise = fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=6&namespace=0&format=json&origin=*`)
            .then(res => res.json())
            .catch(() => null);

        const [ddgData, wikiData] = await Promise.all([ddgPromise, wikiPromise]);

        if (loadingEl) loadingEl.remove();

        let html = '';

        // DuckDuckGo Abstract / Knowledge Box
        if (ddgData && (ddgData.AbstractText || ddgData.Heading || ddgData.Answer)) {
            const heading = ddgData.Heading || query;
            const abstract = ddgData.AbstractText || ddgData.Answer || '';
            const sourceUrl = ddgData.AbstractURL || '';
            const sourceName = ddgData.AbstractSource || 'DuckDuckGo Instant Answer';
            const imgUrl = ddgData.Image ? (ddgData.Image.startsWith('http') ? ddgData.Image : `https://duckduckgo.com${ddgData.Image}`) : '';

            html += `
                <div style="background: rgba(0, 229, 255, 0.06); border: 1px solid rgba(0, 229, 255, 0.25); border-radius: 10px; padding: 18px; margin-bottom: 22px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px;">
                        <div style="flex: 1;">
                            <span style="font-size: 11px; font-weight: bold; color: #00e5ff; text-transform: uppercase;">Instant Knowledge Card • ${sourceName}</span>
                            <h2 style="margin: 6px 0 10px 0; font-size: 20px; color: #ffffff;">${escapeHtml(heading)}</h2>
                            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 12px;">${escapeHtml(abstract)}</p>
                            ${sourceUrl ? `<a href="${sourceUrl}" target="_blank" class="search-nav-link" data-url="${sourceUrl}" style="color: #00e5ff; font-size: 13px; text-decoration: none; font-weight: 600;">Read more on ${sourceName} &rarr;</a>` : ''}
                        </div>
                        ${imgUrl ? `<img src="${imgUrl}" alt="${escapeHtml(heading)}" style="max-width: 110px; max-height: 110px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); object-fit: cover;">` : ''}
                    </div>
                </div>
            `;
        }

        // Wikipedia Live Search Results
        if (wikiData && Array.isArray(wikiData) && wikiData[1] && wikiData[1].length > 0) {
            const titles = wikiData[1];
            const snippets = wikiData[2] || [];
            const urls = wikiData[3] || [];

            html += `<h3 style="font-size: 15px; color: #94a3b8; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">Web & Encyclopedia Results for "${escapeHtml(query)}"</h3>`;
            html += `<div style="display: flex; flex-direction: column; gap: 16px;">`;

            titles.forEach((title, i) => {
                const snippet = snippets[i] || 'Explore encyclopedia documentation and details.';
                const url = urls[i] || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;

                html += `
                    <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 14px; transition: border-color 0.2s;">
                        <div style="font-size: 11px; color: #38bdf8; font-family: monospace; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${url}</div>
                        <h4 style="margin: 0 0 6px 0; font-size: 16px;"><a href="#" class="search-nav-link" data-url="${url}" style="color: var(--accent-primary); text-decoration: none;">${escapeHtml(title)}</a></h4>
                        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">${escapeHtml(snippet)}</p>
                        <div style="display: flex; gap: 10px;">
                            <a href="#" class="search-nav-link" data-url="${url}" style="font-size: 12px; color: #55ffff; text-decoration: none;">Browse inside Krypton &rarr;</a>
                            <a href="${url}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #64748b; text-decoration: none;">↗️ Open Direct</a>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }

        // DuckDuckGo Related Topics
        if (ddgData && Array.isArray(ddgData.RelatedTopics) && ddgData.RelatedTopics.length > 0) {
            const validTopics = ddgData.RelatedTopics.filter(t => t.Text && t.FirstURL).slice(0, 5);
            if (validTopics.length > 0) {
                html += `<h3 style="font-size: 15px; color: #94a3b8; margin: 24px 0 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">Related Topics</h3>`;
                html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px;">`;
                validTopics.forEach(t => {
                    html += `
                        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 10px;">
                            <p style="color: #cbd5e1; font-size: 12px; line-height: 1.4; margin: 0 0 6px 0;">${escapeHtml(t.Text)}</p>
                            <a href="#" class="search-nav-link" data-url="${t.FirstURL}" style="color: #00e5ff; font-size: 11px; text-decoration: none;">Explore Topic &rarr;</a>
                        </div>
                    `;
                });
                html += `</div>`;
            }
        }

        // External Search Hub Links
        const ddgLiteUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;

        html += `
            <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
                <span style="color: #64748b; font-size: 12px;">Search elsewhere:</span>
                <a href="${ddgLiteUrl}" target="_blank" rel="noopener noreferrer" style="padding: 6px 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; font-size: 12px; text-decoration: none;">🦆 DuckDuckGo Lite</a>
                <a href="${googleUrl}" target="_blank" rel="noopener noreferrer" style="padding: 6px 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; font-size: 12px; text-decoration: none;">🔍 Google</a>
                <a href="${bingUrl}" target="_blank" rel="noopener noreferrer" style="padding: 6px 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; font-size: 12px; text-decoration: none;">🌐 Bing</a>
            </div>
        `;

        if (resultsContainer) {
            resultsContainer.innerHTML = html;
            resultsContainer.querySelectorAll('.search-nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = link.getAttribute('data-url');
                    if (target) navigateTo(target);
                });
            });
        }
    } catch (err) {
        if (loadingEl) loadingEl.remove();
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div style="background: rgba(255,0,0,0.08); border: 1px solid rgba(255,0,0,0.2); border-radius: 8px; padding: 20px; text-align: center;">
                    <h3 style="color: #ff5555; margin-bottom: 8px;">Network Search Gateway</h3>
                    <p style="color: #94a3b8; font-size: 13px; margin-bottom: 14px;">Direct iframe embedding is restricted by DuckDuckGo CSP. You can search directly below:</p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <a href="https://duckduckgo.com/?q=${encodeURIComponent(query)}" target="_blank" style="padding: 8px 16px; background: var(--accent-primary); color: #000; font-weight: bold; border-radius: 6px; text-decoration: none;">Open DuckDuckGo in New Tab</a>
                        <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(query)}" target="_blank" style="padding: 8px 16px; background: rgba(255,255,255,0.1); color: #fff; border-radius: 6px; text-decoration: none;">Search Wikipedia</a>
                    </div>
                </div>
            `;
        }
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
