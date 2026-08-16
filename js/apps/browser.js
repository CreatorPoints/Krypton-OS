/* ==========================================================================
   KryptonOS Application - Universal Web Browser Engine with Google Integration
   Supports: Google Engine, Real Web Search, Gemini AI, YouTube Player, Wikipedia, Proxy & VFS
   ========================================================================== */

import { wm } from '../wm.js';
import { vfs } from '../fs.js';
import { story } from '../story.js';
import { sound } from '../sound.js';

export function openBrowser(initialUrl = 'google://home') {
    if (wm.windows.has('browser')) {
        wm.focusWindow('browser');
        return;
    }

    const content = document.createElement('div');
    content.className = 'browser-app';

    const getActiveGoogleUser = () => {
        try {
            const raw = localStorage.getItem('krypton_google_account');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    };

    let currentGoogleUser = getActiveGoogleUser();

    const isUpgraded = localStorage.getItem('krypton_upgraded_lts') === 'true' || localStorage.getItem('krypton_os_version') === '1.0.0.0';

    if (!isUpgraded) {
        // Intentionally Buggy Vintage 90s Alpha Browser Chrome
        content.innerHTML = `
            <div style="background: #c0c0c0; color: #000; font-size: 11px; font-family: 'Tahoma', 'MS Sans Serif', sans-serif; padding: 4px 8px; border-bottom: 2px solid #808080; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span>⚠️</span> <strong>Krypton Web Navigator (v0.1 Alpha — Intentionally Buggy)</strong>
                    <span style="color: #666;">• Legacy 90s HTML 3.2 Engine</span>
                </div>
                <span style="background: #ffff00; color: #000; padding: 1px 6px; font-weight: 700; border: 1px solid #000; font-size: 10px;">BUGGY ALPHA</span>
            </div>

            <div style="background: #ffffdd; border-bottom: 1px solid #d4d4aa; padding: 4px 10px; font-size: 11px; color: #854d0e; font-family: monospace; display: flex; align-items: center; justify-content: space-between;">
                <span>🚨 Warning: JS 1.0 Heap Overflow simulated. Run <code>sudo apt update && sudo apt upgrade</code> in Terminal for modern Chromium engine.</span>
                <span style="color: #059669; font-weight: bold;">[ 📞 56k Dial-Up: 28.8 Kbps OK ]</span>
            </div>

            <div class="browser-toolbar" style="display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: #c0c0c0; border-bottom: 2px solid #808080; border-top: 1px solid #fff;">
                <div style="display: flex; gap: 3px;">
                    <button class="browser-nav-btn" id="b-back" title="Back" style="background: #c0c0c0; border-top: 2px solid #fff; border-left: 2px solid #fff; border-right: 2px solid #404040; border-bottom: 2px solid #404040; color: #000; font-weight: bold; padding: 3px 8px; cursor: pointer; font-size: 11px;">◄ Back</button>
                    <button class="browser-nav-btn" id="b-forward" title="Forward" style="background: #c0c0c0; border-top: 2px solid #fff; border-left: 2px solid #fff; border-right: 2px solid #404040; border-bottom: 2px solid #404040; color: #000; font-weight: bold; padding: 3px 8px; cursor: pointer; font-size: 11px;">Forward ►</button>
                    <button class="browser-nav-btn" id="b-reload" title="Reload" style="background: #c0c0c0; border-top: 2px solid #fff; border-left: 2px solid #fff; border-right: 2px solid #404040; border-bottom: 2px solid #404040; color: #000; font-weight: bold; padding: 3px 8px; cursor: pointer; font-size: 11px;">🔄 Reload</button>
                    <button class="browser-nav-btn" id="b-home" title="Home" style="background: #c0c0c0; border-top: 2px solid #fff; border-left: 2px solid #fff; border-right: 2px solid #404040; border-bottom: 2px solid #404040; color: #000; font-weight: bold; padding: 3px 8px; cursor: pointer; font-size: 11px;">🏠 Home</button>
                </div>

                <div class="browser-address-bar" style="flex: 1; display: flex; align-items: center; background: #fff; border-top: 2px solid #404040; border-left: 2px solid #404040; border-right: 2px solid #fff; border-bottom: 2px solid #fff; padding: 2px 8px; gap: 6px;">
                    <span style="font-size: 11px; font-weight: bold; color: #000080; font-family: monospace;">Location:</span>
                    <input type="text" id="b-url-input" value="${initialUrl}" placeholder="Enter URL or search query..." style="flex: 1; background: transparent; border: none; color: #000; font-size: 12px; outline: none; padding: 2px 0; font-family: 'Tahoma', sans-serif;">
                </div>

                <button class="browser-nav-btn" id="b-go" title="Go" style="background: #c0c0c0; color: #000; font-weight: bold; border-top: 2px solid #fff; border-left: 2px solid #fff; border-right: 2px solid #404040; border-bottom: 2px solid #404040; padding: 3px 12px; cursor: pointer; font-size: 11px;">Go!</button>
                <div id="b-google-auth-badge" style="display: flex; align-items: center; cursor: pointer;"></div>
            </div>

            <div class="browser-viewport" id="b-viewport" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #fff; color: #000;">
                <!-- Web Engine Viewport -->
            </div>
        `;
    } else {
        // Modern Quantum Browser Chrome
        content.innerHTML = `
            <div style="background: linear-gradient(90deg, #00e5ff, #3b82f6); color: #000; font-size: 11px; font-weight: 700; padding: 3px 12px; display: flex; justify-content: space-between; align-items: center; letter-spacing: 0.5px; border-bottom: 1px solid rgba(0,0,0,0.3);">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span>🌐</span> <strong>Krypton Quantum Browser (1.0 LTS)</strong>
                    <span style="font-size: 10px; color: #003366; font-weight: 600;">• Real Web Search & Gemini AI Engine</span>
                </div>
                <span style="background: rgba(0,0,0,0.15); color: #000; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">1.0 LTS RELEASE</span>
            </div>

            <div class="browser-toolbar" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #0f131f; border-bottom: 1px solid rgba(255,255,255,0.08);">
                <div style="display: flex; gap: 4px;">
                    <button class="browser-nav-btn" id="b-back" title="Back" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; border-radius: 4px; padding: 5px 10px; cursor: pointer;">◄</button>
                    <button class="browser-nav-btn" id="b-forward" title="Forward" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; border-radius: 4px; padding: 5px 10px; cursor: pointer;">►</button>
                    <button class="browser-nav-btn" id="b-reload" title="Reload" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; border-radius: 4px; padding: 5px 10px; cursor: pointer;">🔄</button>
                    <button class="browser-nav-btn" id="b-home" title="Google Home" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; border-radius: 4px; padding: 5px 10px; cursor: pointer;">🏠</button>
                </div>

                <div class="browser-address-bar" style="flex: 1; display: flex; align-items: center; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; padding: 2px 14px; gap: 8px;">
                    <span style="font-size: 13px; color: #4285F4;">🔍</span>
                    <input type="text" id="b-url-input" value="${initialUrl}" placeholder="Search with Google or enter any URL (e.g. gemini.google.com, youtube.com, github.com)..." style="flex: 1; background: transparent; border: none; color: #fff; font-size: 13px; outline: none; padding: 6px 0; font-family: 'Outfit', sans-serif;">
                </div>

                <button class="browser-nav-btn" id="b-go" title="Go / Search" style="background: #4285F4; color: #fff; font-weight: bold; border-radius: 20px; padding: 6px 16px; border: none; cursor: pointer; font-size: 12px; box-shadow: 0 2px 6px rgba(66,133,244,0.3);">Go</button>

                <!-- Google Account Badge in Toolbar -->
                <div id="b-google-auth-badge" style="display: flex; align-items: center; cursor: pointer;"></div>
            </div>

            <div class="browser-viewport" id="b-viewport" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #121520;">
                <!-- Live Web Engine Viewport -->
            </div>
        `;
    }

    const urlInput = content.querySelector('#b-url-input');
    const viewport = content.querySelector('#b-viewport');
    const goBtn = content.querySelector('#b-go');
    const googleBadge = content.querySelector('#b-google-auth-badge');

    const historyStack = [initialUrl];
    let historyIndex = 0;

    const updateGoogleBadge = () => {
        currentGoogleUser = getActiveGoogleUser();
        if (currentGoogleUser) {
            const initial = (currentGoogleUser.name || currentGoogleUser.email || 'G')[0].toUpperCase();
            googleBadge.innerHTML = `
                <div title="Google Account: ${currentGoogleUser.email}" style="display: flex; align-items: center; gap: 6px; background: rgba(66, 133, 244, 0.12); border: 1px solid #4285F4; border-radius: 20px; padding: 3px 10px; font-size: 11px; color: #fff;">
                    <div style="width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(135deg, #4285F4, #34A853); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px;">
                        ${initial}
                    </div>
                    <span style="font-weight: 600; color: #e2e8f0;">${currentGoogleUser.name ? currentGoogleUser.name.split(' ')[0] : 'Google'}</span>
                </div>
            `;
        } else {
            googleBadge.innerHTML = `
                <button id="b-signin-quick-btn" style="display: flex; align-items: center; gap: 6px; background: #ffffff; color: #3c4043; font-weight: 600; font-size: 11px; padding: 4px 10px; border-radius: 16px; border: 1px solid #dadce0; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.15);">
                    <svg width="12" height="12" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                    Sign in
                </button>
            `;
            googleBadge.querySelector('#b-signin-quick-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                promptGoogleBrowserAuth(() => {
                    updateGoogleBadge();
                    navigateTo(historyStack[historyIndex] || 'google://home', false);
                });
            });
        }
    };

    googleBadge.addEventListener('click', () => {
        if (getActiveGoogleUser()) {
            showGoogleAccountManagerDialog(() => {
                updateGoogleBadge();
                navigateTo(historyStack[historyIndex] || 'google://home', false);
            });
        }
    });

    const navigateTo = (url, pushHistory = true) => {
        if (!url) url = 'google://home';
        url = url.trim();

        if (urlInput) urlInput.value = url;

        if (pushHistory) {
            if (historyIndex < historyStack.length - 1) {
                historyStack.splice(historyIndex + 1);
            }
            historyStack.push(url);
            historyIndex = historyStack.length - 1;
        }

        renderPage(url, viewport, navigateTo, updateGoogleBadge);
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
        navigateTo(historyStack[historyIndex] || 'google://home', false);
    });

    content.querySelector('#b-home').addEventListener('click', () => {
        sound.playClick();
        navigateTo('google://home');
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

    updateGoogleBadge();
    navigateTo(initialUrl, false);

    wm.createWindow({
        id: 'browser',
        title: isUpgraded ? 'Krypton Quantum Browser (1.0 LTS)' : 'Krypton Web Navigator (v0.1 Alpha - Buggy Browser)',
        icon: '🌐',
        width: 980,
        height: 660,
        content: content
    });
}

function renderPage(rawUrl, viewport, navigateTo, updateBadgeCallback) {
    const lowerUrl = rawUrl.toLowerCase().trim();

    // 1. Virtual Host routing via /etc/hosts
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
                if (ip === '127.0.0.1' || ip === '127.0.1.1' || ip === '::1') isLocalhostMapped = true;
                else if (ip === '0.0.0.0') isHostBlocked = true;
            }
        }
    }

    if (cleanHost === 'localhost' || cleanHost === '127.0.0.1' || isLocalhostMapped) {
        const webHtml = vfs.readFile('/var/www/html/index.html') || '<!DOCTYPE html><html><body><h1>Localhost</h1><p>Welcome to KryptonOS local HTTP server!</p></body></html>';
        viewport.innerHTML = `
            <div style="background: rgba(0,229,255,0.08); padding: 8px 16px; border-bottom: 1px solid rgba(0,229,255,0.2); font-family: monospace; font-size: 12px; color: #00e5ff; display: flex; justify-content: space-between; align-items: center;">
                <span>● LOCAL VIRTUAL HOST: ${cleanHost} &rarr; 127.0.0.1:80 (/var/www/html/index.html)</span>
                <span style="color: #55ff55;">HTTP/1.1 200 OK</span>
            </div>
            <div class="browser-inner-content" style="padding: 20px;">
                ${webHtml}
            </div>
        `;
        return;
    }

    if (isHostBlocked) {
        viewport.innerHTML = `
            <div class="browser-inner-content" style="text-align: center; padding: 60px 20px;">
                <h1 style="color: #ff5555; font-size: 28px;">🛡️ Host Blocked by /etc/hosts</h1>
                <p style="color: #94a3b8; margin: 15px 0;">The domain <code>${cleanHost}</code> is mapped to <code>0.0.0.0</code> in <code>/etc/hosts</code>.</p>
                <small style="color: #64748b;">To modify, run: sudo nano /etc/hosts</small>
            </div>
        `;
        return;
    }

    // 2. Google Homepage Engine
    if (lowerUrl === 'google://home' || lowerUrl === 'krypton://home' || lowerUrl === 'https://google.com' || lowerUrl === 'https://www.google.com' || lowerUrl === 'google.com' || lowerUrl === '' || lowerUrl === 'about:blank') {
        renderGoogleHomepage(viewport, navigateTo, updateBadgeCallback);
        return;
    }

    // 3. Google Gemini AI Engine
    if (lowerUrl.includes('gemini.google.com') || lowerUrl.startsWith('gemini://')) {
        renderGeminiPortal(viewport, navigateTo);
        return;
    }

    // 4. YouTube Embed & Player View
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
        renderYouTubeView(rawUrl, viewport, navigateTo);
        return;
    }

    // 5. Wikipedia Mobile Auto-Fix
    if (lowerUrl.includes('wikipedia.org') && !lowerUrl.includes('.m.wikipedia.org')) {
        const fixedWikiUrl = rawUrl.replace(/([a-zA-Z0-9]+)\.wikipedia\.org/, '$1.m.wikipedia.org');
        renderUniversalWebFrame(fixedWikiUrl, viewport, navigateTo);
        return;
    }

    // 6. Query Routing: Google Search vs Direct Live Web Page
    const isDomain = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(rawUrl);
    const isFullUrl = /^https?:\/\//i.test(rawUrl);
    const isGooglePrefix = lowerUrl.startsWith('google:') || lowerUrl.startsWith('g:');

    if (isGooglePrefix || (!isFullUrl && !isDomain)) {
        const query = isGooglePrefix ? rawUrl.replace(/^(google|g):/i, '').trim() : rawUrl.trim();
        renderGoogleSearchResults(query, viewport, navigateTo);
        return;
    }

    // 7. Live Universal Web Engine (Can open any site)
    const targetLiveUrl = isFullUrl ? rawUrl : `https://${rawUrl}`;
    renderUniversalWebFrame(targetLiveUrl, viewport, navigateTo);
}

/* --------------------------------------------------------------------------
   Google Homepage Portal & Authenticated Apps
   -------------------------------------------------------------------------- */
function renderGoogleHomepage(viewport, navigateTo, updateBadgeCallback) {
    const user = getActiveGoogleUser();

    viewport.innerHTML = `
        <div class="browser-inner-content" style="display: flex; flex-direction: column; height: 100%; box-sizing: border-box; background: #202124; color: #e8eaed; font-family: 'Outfit', -apple-system, Roboto, sans-serif; overflow-y: auto;">
            <!-- Top Google Navbar -->
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 16px; padding: 16px 24px;">
                <a href="#" class="b-link" data-url="https://gemini.google.com" style="color: #8ab4f8; text-decoration: none; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 4px;">✨ Gemini AI</a>
                <a href="#" class="b-link" data-url="https://mail.google.com" style="color: #bdc1c6; text-decoration: none; font-size: 13px;">Gmail</a>
                <a href="#" class="b-link" data-url="https://images.google.com" style="color: #bdc1c6; text-decoration: none; font-size: 13px;">Images</a>
                <div style="font-size: 16px; cursor: pointer; color: #bdc1c6;">⠿</div>

                ${user ? `
                    <div id="hp-user-chip" style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.06); padding: 4px 10px 4px 6px; border-radius: 20px; cursor: pointer; border: 1px solid rgba(255,255,255,0.12);">
                        <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #4285F4, #34A853); display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff; font-size: 14px;">
                            ${user.picture ? `<img src="${user.picture}" style="width:100%;height:100%;border-radius:50%;">` : (user.name ? user.name[0].toUpperCase() : 'G')}
                        </div>
                        <div style="display: flex; flex-direction: column; text-align: left;">
                            <span style="font-size: 12px; font-weight: 600; color: #fff;">${user.name || 'Google User'}</span>
                            <span style="font-size: 10px; color: #8ab4f8;">Google Account Linked</span>
                        </div>
                    </div>
                ` : `
                    <button id="hp-signin-btn" style="background: #1a73e8; color: #fff; font-weight: 600; font-size: 13px; padding: 8px 18px; border-radius: 4px; border: none; cursor: pointer;">Sign in</button>
                `}
            </div>

            <!-- Center Google Hero & Search Box -->
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
                <div style="margin-bottom: 26px; user-select: none;">
                    <span style="font-size: 68px; font-weight: 700; color: #4285F4; letter-spacing: -2px;">G</span>
                    <span style="font-size: 68px; font-weight: 700; color: #EA4335; letter-spacing: -2px;">o</span>
                    <span style="font-size: 68px; font-weight: 700; color: #FBBC05; letter-spacing: -2px;">o</span>
                    <span style="font-size: 68px; font-weight: 700; color: #4285F4; letter-spacing: -2px;">g</span>
                    <span style="font-size: 68px; font-weight: 700; color: #34A853; letter-spacing: -2px;">l</span>
                    <span style="font-size: 68px; font-weight: 700; color: #EA4335; letter-spacing: -2px;">e</span>
                </div>

                <div style="width: 100%; max-width: 580px; position: relative; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; background: #303134; border: 1px solid #5f6368; border-radius: 24px; padding: 10px 18px; gap: 12px; box-shadow: 0 1px 6px rgba(0,0,0,0.3);">
                        <span style="color: #9aa0a6; font-size: 16px;">🔍</span>
                        <input type="text" id="g-home-input" placeholder="Search Google or type a URL" style="flex: 1; background: transparent; border: none; color: #fff; font-size: 15px; outline: none; font-family: inherit;">
                        <span style="color: #4285F4; font-size: 16px; cursor: pointer;" title="Google Voice Search">🎙️</span>
                        <span style="color: #FBBC05; font-size: 16px; cursor: pointer;" title="Google Lens">📷</span>
                    </div>
                </div>

                <div style="display: flex; gap: 12px; margin-bottom: 36px;">
                    <button id="g-btn-search" style="padding: 10px 18px; background: #303134; color: #e8eaed; border: 1px solid #5f6368; border-radius: 4px; font-size: 13px; cursor: pointer;">Google Search</button>
                    <button id="g-btn-lucky" style="padding: 10px 18px; background: #303134; color: #e8eaed; border: 1px solid #5f6368; border-radius: 4px; font-size: 13px; cursor: pointer;">I'm Feeling Lucky</button>
                </div>

                <!-- Shortcuts Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); max-width: 580px; width: 100%; gap: 16px; justify-items: center;">
                    <div class="g-shortcut b-link" data-url="https://gemini.google.com" style="display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; text-decoration: none;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #1E88E5, #9C27B0); display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">✨</div>
                        <span style="font-size: 12px; color: #8ab4f8; font-weight: 600;">Gemini AI</span>
                    </div>
                    <div class="g-shortcut b-link" data-url="https://youtube.com" style="display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; text-decoration: none;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: #ff0000; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">▶</div>
                        <span style="font-size: 12px; color: #bdc1c6;">YouTube</span>
                    </div>
                    <div class="g-shortcut b-link" data-url="https://en.m.wikipedia.org" style="display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; text-decoration: none;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #000; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">W</div>
                        <span style="font-size: 12px; color: #bdc1c6;">Wikipedia</span>
                    </div>
                    <div class="g-shortcut b-link" data-url="https://github.com" style="display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; text-decoration: none;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: #181717; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; border: 1px solid rgba(255,255,255,0.2);">🐙</div>
                        <span style="font-size: 12px; color: #bdc1c6;">GitHub</span>
                    </div>
                    <div class="g-shortcut b-link" data-url="https://news.ycombinator.com" style="display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; text-decoration: none;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: #ff6600; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; font-weight: bold;">Y</div>
                        <span style="font-size: 12px; color: #bdc1c6;">Hacker News</span>
                    </div>
                    <div class="g-shortcut b-link" data-url="https://www.kernel.org" style="display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; text-decoration: none;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff;">🐧</div>
                        <span style="font-size: 12px; color: #bdc1c6;">Linux Kernel</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    const gInput = viewport.querySelector('#g-home-input');
    const gSearchBtn = viewport.querySelector('#g-btn-search');
    const gLuckyBtn = viewport.querySelector('#g-btn-lucky');

    const executeSearch = () => {
        const query = gInput.value.trim();
        if (query) navigateTo(query);
    };

    gSearchBtn?.addEventListener('click', executeSearch);
    gLuckyBtn?.addEventListener('click', () => {
        const query = gInput.value.trim();
        if (query) navigateTo(`https://www.google.com/search?btnI=1&q=${encodeURIComponent(query)}`);
    });

    gInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') executeSearch();
    });

    viewport.querySelectorAll('.b-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetUrl = link.getAttribute('data-url');
            if (targetUrl) navigateTo(targetUrl);
        });
    });

    viewport.querySelector('#hp-signin-btn')?.addEventListener('click', () => {
        promptGoogleBrowserAuth(() => {
            updateBadgeCallback();
            renderGoogleHomepage(viewport, navigateTo, updateBadgeCallback);
        });
    });

    viewport.querySelector('#hp-user-chip')?.addEventListener('click', () => {
        showGoogleAccountManagerDialog(() => {
            updateBadgeCallback();
            renderGoogleHomepage(viewport, navigateTo, updateBadgeCallback);
        });
    });
}

/* --------------------------------------------------------------------------
   Google Gemini AI Portal Engine (Interactive & Sandboxed)
   -------------------------------------------------------------------------- */
function renderGeminiPortal(viewport, navigateTo) {
    const user = getActiveGoogleUser();

    viewport.innerHTML = `
        <div class="browser-inner-content" style="background: #131314; color: #e3e3e3; font-family: 'Outfit', -apple-system, sans-serif; display: flex; flex-direction: column; height: 100%; box-sizing: border-box;">
            <!-- Gemini Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); background: #1e1f20;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 20px; background: linear-gradient(135deg, #1E88E5, #D81B60); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800;">
                        ✨ Gemini Advanced
                    </div>
                    <span style="font-size: 11px; background: rgba(66, 133, 244, 0.15); color: #8ab4f8; border: 1px solid #4285F4; border-radius: 12px; padding: 2px 8px;">1.5 Pro</span>
                </div>

                <div style="display: flex; align-items: center; gap: 14px;">
                    ${user ? `
                        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #8ab4f8;">
                            <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #4285F4, #34A853); display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff; font-size: 11px;">
                                ${(user.name || user.email)[0].toUpperCase()}
                            </div>
                            <span>${user.email}</span>
                        </div>
                    ` : `
                        <span style="font-size: 12px; color: #9aa0a6;">Guest Mode</span>
                    `}
                    <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" style="color: #8ab4f8; text-decoration: none; font-size: 12px; padding: 4px 10px; border: 1px solid rgba(138, 180, 248, 0.3); border-radius: 6px;">↗️ Direct Tab</a>
                </div>
            </div>

            <!-- Gemini Chat Viewport -->
            <div id="gemini-messages" style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; max-width: 840px; margin: 0 auto; width: 100%; box-sizing: border-box;">
                <!-- Welcome Greeting -->
                <div style="margin-top: 10px; text-align: left;">
                    <h1 style="font-size: 32px; font-weight: 700; background: linear-gradient(90deg, #4285F4, #9B72CB, #D96570); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 6px 0;">
                        Hello, ${user ? (user.name ? user.name.split(' ')[0] : 'there') : 'Guest'}
                    </h1>
                    <p style="color: #9aa0a6; font-size: 16px; margin: 0 0 24px 0;">How can I help you in KryptonOS today?</p>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
                        <div class="gemini-chip" data-prompt="Explain how Linux kernel handles memory management and VFS virtual filesystems" style="background: #1e1f20; padding: 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); cursor: pointer; font-size: 13px; color: #c4c7c5; transition: all 0.2s;">
                            🧠 Explain Linux Kernel & VFS architecture
                        </div>
                        <div class="gemini-chip" data-prompt="Write a modern bash script to monitor CPU, RAM, and disk usage with color alerts" style="background: #1e1f20; padding: 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); cursor: pointer; font-size: 13px; color: #c4c7c5; transition: all 0.2s;">
                            💻 Write a bash system monitor script
                        </div>
                        <div class="gemini-chip" data-prompt="What are the key architectural improvements in KryptonOS 1.0 LTS?" style="background: #1e1f20; padding: 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); cursor: pointer; font-size: 13px; color: #c4c7c5; transition: all 0.2s;">
                            ⚛️ KryptonOS 1.0 LTS technical specs
                        </div>
                    </div>
                </div>
            </div>

            <!-- Gemini Prompt Input Area -->
            <div style="padding: 16px 24px; background: #131314; border-top: 1px solid rgba(255,255,255,0.06);">
                <div style="max-width: 840px; margin: 0 auto; display: flex; align-items: center; background: #1e1f20; border: 1px solid #3c4043; border-radius: 28px; padding: 10px 18px; gap: 12px;">
                    <span style="color: #8ab4f8; font-size: 18px;">✨</span>
                    <input type="text" id="gemini-input" placeholder="Ask Gemini anything..." style="flex: 1; background: transparent; border: none; color: #fff; font-size: 14px; outline: none; font-family: inherit;">
                    <button id="gemini-send-btn" style="background: #8ab4f8; color: #131314; font-weight: 700; border: none; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">➔</button>
                </div>
                <div style="text-align: center; margin-top: 8px; font-size: 11px; color: #80868b;">Gemini may display inaccurate info, so double-check its responses.</div>
            </div>
        </div>
    `;

    const msgContainer = viewport.querySelector('#gemini-messages');
    const input = viewport.querySelector('#gemini-input');
    const sendBtn = viewport.querySelector('#gemini-send-btn');

    const handleSend = (text) => {
        const query = text || input.value.trim();
        if (!query) return;
        input.value = '';

        // Add user bubble
        const userDiv = document.createElement('div');
        userDiv.style.cssText = 'align-self: flex-end; background: #2b2c2f; color: #e3e3e3; padding: 12px 18px; border-radius: 18px 18px 4px 18px; max-width: 80%; font-size: 14px; line-height: 1.5;';
        userDiv.textContent = query;
        msgContainer.appendChild(userDiv);

        // Add Gemini thinking bubble
        const aiDiv = document.createElement('div');
        aiDiv.style.cssText = 'align-self: flex-start; display: flex; gap: 12px; max-width: 90%; font-size: 14px; line-height: 1.6; color: #e3e3e3;';
        aiDiv.innerHTML = `
            <div style="font-size: 18px; line-height: 1;">✨</div>
            <div class="gemini-response-body" style="background: #1e1f20; padding: 14px 20px; border-radius: 4px 18px 18px 18px; border: 1px solid rgba(255,255,255,0.06); flex: 1;">
                <span style="color: #8ab4f8; animation: pulse 1s infinite;">Generating real-time Gemini response...</span>
            </div>
        `;
        msgContainer.appendChild(aiDiv);
        msgContainer.scrollTop = msgContainer.scrollHeight;

        setTimeout(() => {
            const body = aiDiv.querySelector('.gemini-response-body');
            body.innerHTML = generateGeminiResponse(query);
            msgContainer.scrollTop = msgContainer.scrollHeight;
        }, 600 + Math.random() * 400);
    };

    sendBtn?.addEventListener('click', () => handleSend());
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSend(); });

    viewport.querySelectorAll('.gemini-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const prompt = chip.getAttribute('data-prompt');
            handleSend(prompt);
        });
    });
}

function generateGeminiResponse(prompt) {
    const lower = prompt.toLowerCase();

    if (lower.includes('kernel') || lower.includes('vfs') || lower.includes('memory')) {
        return `
            <strong>Linux Kernel & VFS Architecture Analysis:</strong><br><br>
            The Linux kernel abstracts hardware storage into a unified hierarchical tree through the <strong>Virtual Filesystem Switch (VFS)</strong> standard (FHS 3.0). Key architectural layers include:<br>
            <ul>
                <li><strong>Superblock & Inodes:</strong> Stores filesystem metadata and file index blocks (/dev/nvme0n1p2).</li>
                <li><strong>Dentry Cache (dcache):</strong> Speeds up path lookups in memory (/etc, /boot, /usr/bin).</li>
                <li><strong>Page Cache & Dirty Buffers:</strong> Asynchronously batches writes to NVMe storage.</li>
            </ul>
            <div style="background: #000; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 12px; color: #00e5ff; margin-top: 8px;">
                $ cat /proc/version<br>
                Linux version 6.10.0-krypton-generic (x86_64) SMP PREEMPT_DYNAMIC
            </div>
        `;
    }

    if (lower.includes('bash') || lower.includes('script') || lower.includes('monitor')) {
        return `
            Here is a production-ready Bash monitoring script for your KryptonOS workstation:<br><br>
            <pre style="background: #000; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; color: #55ff55; overflow-x: auto;">
#!/bin/bash
# KryptonOS Performance Diagnostics
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')
MEM_USED=$(free -m | awk '/Mem:/ { printf("%3.1f%%", $3/$2*100) }')
DISK_USED=$(df -h / | awk '/\\// {print $(NF-1)}')

echo "================================"
echo "Workstation: $(hostname)"
echo "CPU Load:    $CPU_USAGE%"
echo "RAM Usage:   $MEM_USED"
echo "Disk Usage:  $DISK_USED (/dev/nvme0n1p2)"
echo "================================"</pre>
            You can save this to <code>/home/guest/monitor.sh</code> using <code>nano</code> or <code>vim</code>!
        `;
    }

    return `
        <strong>Gemini Insights for:</strong> <em>"${escapeHtml(prompt)}"</em><br><br>
        KryptonOS 1.0 LTS provides a 1:1 sandbox POSIX virtual kernel environment running Linux 6.10.0 on an emulated Samsung SSD 980 PRO NVMe with APT repository integration.<br><br>
        • <strong>Real Repository Stream:</strong> APT packages and rootfs are fetched from upstream GitHub repositories.<br>
        • <strong>Google Account Integration:</strong> User identity linked across system sessions.<br>
        • <strong>Full Web Engine:</strong> Connect to any website or API via the sandboxed engine.
    `;
}

/* --------------------------------------------------------------------------
   Google Live Search Results (Extracts Real Web & Knowledge Graph)
   -------------------------------------------------------------------------- */
async function renderGoogleSearchResults(query, viewport, navigateTo) {
    const user = getActiveGoogleUser();

    viewport.innerHTML = `
        <div class="browser-inner-content" style="background: #202124; color: #bdc1c6; font-family: 'Outfit', -apple-system, Roboto, sans-serif; display: flex; flex-direction: column; height: 100%; overflow-y: auto;">
            <!-- Google Search Top Bar -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; border-bottom: 1px solid #3c4043; gap: 16px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 20px; flex: 1; max-width: 720px;">
                    <div style="font-size: 26px; font-weight: 700; cursor: pointer; user-select: none;" id="g-res-logo">
                        <span style="color: #4285F4;">G</span><span style="color: #EA4335;">o</span><span style="color: #FBBC05;">o</span><span style="color: #4285F4;">g</span><span style="color: #34A853;">l</span><span style="color: #EA4335;">e</span>
                    </div>
                    <div style="flex: 1; display: flex; align-items: center; background: #303134; border: 1px solid #5f6368; border-radius: 24px; padding: 8px 16px; gap: 10px;">
                        <input type="text" id="g-res-input" value="${escapeHtml(query)}" style="flex: 1; background: transparent; border: none; color: #fff; font-size: 14px; outline: none; font-family: inherit;">
                        <span style="color: #4285F4; cursor: pointer;" id="g-res-search-icon">🔍</span>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 12px;">
                    ${user ? `
                        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #8ab4f8;">
                            <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #4285F4, #34A853); display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff; font-size: 11px;">
                                ${(user.name || user.email)[0].toUpperCase()}
                            </div>
                            <span>${user.email}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Search Tabs -->
            <div style="display: flex; gap: 20px; padding: 10px 24px; font-size: 13px; border-bottom: 1px solid #3c4043; color: #9aa0a6;">
                <span style="color: #8ab4f8; border-bottom: 3px solid #8ab4f8; padding-bottom: 6px; font-weight: 600;">All</span>
                <span style="cursor: pointer;" class="g-tab-link" data-url="https://images.google.com/search?q=${encodeURIComponent(query)}">Images</span>
                <span style="cursor: pointer;" class="g-tab-link" data-url="https://youtube.com/results?search_query=${encodeURIComponent(query)}">Videos</span>
                <span style="cursor: pointer;" class="g-tab-link" data-url="https://gemini.google.com">✨ Ask Gemini</span>
                <span style="cursor: pointer;" class="g-tab-link" data-url="https://news.google.com/search?q=${encodeURIComponent(query)}">News</span>
            </div>

            <!-- Results Content Container -->
            <div style="padding: 20px 24px; max-width: 840px;" id="g-results-box">
                <div id="g-loading-tag" style="color: #8ab4f8; font-size: 13px; margin: 12px 0;">⚡ Querying live Google Web Search & Knowledge Graph for "${escapeHtml(query)}"...</div>
            </div>
        </div>
    `;

    viewport.querySelector('#g-res-logo')?.addEventListener('click', () => navigateTo('google://home'));

    const resInput = viewport.querySelector('#g-res-input');
    const resIcon = viewport.querySelector('#g-res-search-icon');
    const handleNewSearch = () => {
        const q = resInput.value.trim();
        if (q) navigateTo(q);
    };

    resIcon?.addEventListener('click', handleNewSearch);
    resInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleNewSearch(); });

    viewport.querySelectorAll('.g-tab-link').forEach(tab => {
        tab.addEventListener('click', () => {
            const u = tab.getAttribute('data-url');
            if (u) navigateTo(u);
        });
    });

    const resultsBox = viewport.querySelector('#g-results-box');
    const loadingTag = viewport.querySelector('#g-loading-tag');

    try {
        // 1. DuckDuckGo Instant Answer
        const ddgPromise = fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&pretty=1`)
            .then(res => res.json()).catch(() => null);

        // 2. Real Organic Search Web Results from live search scraper
        const webSearchPromise = fetch(`https://r.jina.ai/https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`)
            .then(res => res.text()).catch(() => null);

        // 3. OpenSearch Wikipedia API
        const wikiPromise = fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=4&namespace=0&format=json&origin=*`)
            .then(res => res.json()).catch(() => null);

        const [ddgData, webSearchMd, wikiData] = await Promise.all([ddgPromise, webSearchPromise, wikiPromise]);

        if (loadingTag) loadingTag.remove();

        let out = '';

        // Google Knowledge Graph Panel
        if (ddgData && (ddgData.AbstractText || ddgData.Heading || ddgData.Answer)) {
            const heading = ddgData.Heading || query;
            const abstract = ddgData.AbstractText || ddgData.Answer || '';
            const sourceUrl = ddgData.AbstractURL || '';
            const imgUrl = ddgData.Image ? (ddgData.Image.startsWith('http') ? ddgData.Image : `https://duckduckgo.com${ddgData.Image}`) : '';

            out += `
                <div style="background: #303134; border: 1px solid #3c4043; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; gap: 16px; align-items: flex-start;">
                        <div style="flex: 1;">
                            <span style="font-size: 11px; color: #8ab4f8; text-transform: uppercase; font-weight: bold;">Google Knowledge Panel</span>
                            <h2 style="font-size: 22px; color: #e8eaed; margin: 4px 0 10px 0;">${escapeHtml(heading)}</h2>
                            <p style="font-size: 14px; color: #bdc1c6; line-height: 1.6; margin-bottom: 12px;">${escapeHtml(abstract)}</p>
                            ${sourceUrl ? `<a href="${sourceUrl}" class="b-res-link" data-url="${sourceUrl}" style="color: #8ab4f8; font-size: 13px; text-decoration: none; font-weight: 600;">View full article &rarr;</a>` : ''}
                        </div>
                        ${imgUrl ? `<img src="${imgUrl}" alt="${escapeHtml(heading)}" style="max-width: 120px; max-height: 120px; border-radius: 6px; object-fit: cover;">` : ''}
                    </div>
                </div>
            `;
        }

        // Parse Real Organic Live Web Results
        const organicResults = [];
        if (webSearchMd) {
            const headerRegex = /##\s*\[([^\]]+)\]\((https:\/\/duckduckgo\.com\/l\/\?[^\)]+)\)/g;
            let match;
            while ((match = headerRegex.exec(webSearchMd)) !== null) {
                const title = match[1];
                const rawLink = match[2];
                try {
                    const urlObj = new URL(rawLink);
                    const realTarget = urlObj.searchParams.get("uddg");
                    if (realTarget && !realTarget.includes("duckduckgo.com")) {
                        const afterPos = match.index + match[0].length;
                        const snippetPart = webSearchMd.substring(afterPos, afterPos + 350);
                        const cleanedSnippet = snippetPart.replace(/\[!\[Image \d+\]\([^\)]+\)\]\([^\)]+\)/g, "")
                                                          .replace(/\[[^\]]+\]\([^\)]+\)/g, "")
                                                          .replace(/[#\*_]/g, "")
                                                          .trim().split("\n").filter(l => l.length > 20)[0] || "Explore official documentation, articles, and full website.";
                        organicResults.push({ title, url: realTarget, snippet: cleanedSnippet });
                    }
                } catch (err) {}
            }
        }

        // If organic results were parsed from the web search stream
        if (organicResults.length > 0) {
            out += `<div style="font-size: 12px; color: #9aa0a6; margin-bottom: 16px;">About ${organicResults.length * 1280000} results (0.19 seconds)</div>`;
            out += `<div style="display: flex; flex-direction: column; gap: 22px;">`;

            organicResults.slice(0, 10).forEach(r => {
                const hostStr = r.url.replace(/^https?:\/\//, '').split('/')[0];
                out += `
                    <div>
                        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #bdc1c6; margin-bottom: 3px;">
                            <img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostStr)}&sz=16" style="width: 14px; height: 14px; border-radius: 2px;" onerror="this.style.display='none'">
                            <span style="color: #9aa0a6;">${escapeHtml(hostStr)}</span>
                        </div>
                        <h3 style="margin: 0 0 4px 0; font-size: 18px;">
                            <a href="${r.url}" class="b-res-link" data-url="${r.url}" style="color: #8ab4f8; text-decoration: none; font-weight: 500;">${escapeHtml(r.title)}</a>
                        </h3>
                        <p style="margin: 0; font-size: 13px; color: #bdc1c6; line-height: 1.5;">${escapeHtml(r.snippet)}</p>
                    </div>
                `;
            });
            out += `</div>`;
        } else if (wikiData && Array.isArray(wikiData) && wikiData[1] && wikiData[1].length > 0) {
            // Secondary Fallback: Wiki OpenSearch
            const titles = wikiData[1];
            const snippets = wikiData[2] || [];
            const urls = wikiData[3] || [];

            out += `<div style="display: flex; flex-direction: column; gap: 20px;">`;
            titles.forEach((title, idx) => {
                const snip = snippets[idx] || 'Read full web article and overview.';
                const target = urls[idx] || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
                const hostStr = target.replace(/^https?:\/\//, '').split('/')[0];

                out += `
                    <div>
                        <div style="font-size: 12px; color: #9aa0a6; margin-bottom: 2px;">${escapeHtml(hostStr)}</div>
                        <h3 style="margin: 0 0 4px 0; font-size: 18px;">
                            <a href="${target}" class="b-res-link" data-url="${target}" style="color: #8ab4f8; text-decoration: none; font-weight: 500;">${escapeHtml(title)}</a>
                        </h3>
                        <p style="margin: 0; font-size: 13px; color: #bdc1c6; line-height: 1.5;">${escapeHtml(snip)}</p>
                    </div>
                `;
            });
            out += `</div>`;
        } else {
            out += `
                <div style="background: #303134; padding: 20px; border-radius: 8px;">
                    <h3 style="color: #e8eaed; margin-bottom: 8px;">Search query for "${escapeHtml(query)}"</h3>
                    <p style="font-size: 13px; color: #9aa0a6; margin-bottom: 14px;">Open directly as a live web URL or ask Gemini AI.</p>
                    <div style="display: flex; gap: 10px;">
                        <button class="b-res-link" data-url="https://gemini.google.com" style="padding: 8px 16px; background: #8ab4f8; color: #131314; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
                            ✨ Ask Gemini AI
                        </button>
                        <button class="b-res-link" data-url="https://youtube.com/results?search_query=${encodeURIComponent(query)}" style="padding: 8px 16px; background: #ff0000; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
                            ▶ Search YouTube
                        </button>
                    </div>
                </div>
            `;
        }

        resultsBox.innerHTML = out;

        resultsBox.querySelectorAll('.b-res-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const u = link.getAttribute('data-url');
                if (u) navigateTo(u);
            });
        });
    } catch (e) {
        if (loadingTag) loadingTag.textContent = `Search completed with direct URL fallback.`;
    }
}

/* --------------------------------------------------------------------------
   YouTube Player View Engine (Embedded + Unrestricted Playback)
   -------------------------------------------------------------------------- */
function renderYouTubeView(url, viewport, navigateTo) {
    let videoId = extractYouTubeVideoId(url);
    const activeVideoId = videoId || 'jfKfPfyJRdk';

    const curatedVideos = [
        { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Radio - Beats to Relax/Study to', creator: 'Lofi Girl', tag: 'MUSIC' },
        { id: 'RRuz4hU2WpE', title: 'How The Linux Kernel Actually Works', creator: 'Low Level JavaScript', tag: 'LINUX' },
        { id: 'z1kWX_v8p3k', title: 'Linux from Scratch - The Ultimate Guide', creator: 'Mental Outlaw', tag: 'SYSTEMS' },
        { id: 'kO_QYpQ0r3E', title: 'Cyberpunk Synthwave 24/7 Neon Coding Stream', creator: 'Nightride FM', tag: 'MUSIC' },
        { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)', creator: 'Rick Astley', tag: 'CLASSIC' }
    ];

    viewport.innerHTML = `
        <div class="browser-inner-content" style="padding: 16px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box; background: #0a0b10;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="background: #ff0000; color: #fff; font-weight: 900; font-size: 14px; padding: 4px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px;">
                        <span>▶</span> YouTube
                    </div>
                    <span style="color: #94a3b8; font-size: 12px;">Universal Media Player (X-Frame Unblocked)</span>
                </div>
                <div style="display: flex; gap: 8px; flex: 1; max-width: 480px;">
                    <input type="text" id="yt-search-input" placeholder="Paste YouTube link or enter video title..." style="flex: 1; padding: 8px 12px; border-radius: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 13px; outline: none;">
                    <button id="yt-search-btn" style="padding: 8px 16px; background: #ff0000; color: #fff; font-weight: bold; border: none; border-radius: 6px; cursor: pointer;">Play</button>
                </div>
                <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #64748b; font-size: 12px; text-decoration: none; padding: 4px 8px; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;">↗️ Direct Tab</a>
            </div>

            <div style="display: flex; flex: 1; gap: 16px; flex-direction: column; overflow-y: auto;">
                <div style="position: relative; width: 100%; min-height: 380px; background: #000; border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 24px rgba(0,0,0,0.6);">
                    <iframe 
                        id="yt-active-iframe"
                        src="https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&rel=0" 
                        title="YouTube video player" 
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowfullscreen
                    ></iframe>
                </div>

                <div style="margin-top: 6px;">
                    <div style="font-size: 13px; font-weight: bold; color: #cbd5e1; margin-bottom: 10px;">📺 Featured Channels & Streams</div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
                        ${curatedVideos.map(v => `
                            <div class="yt-card" data-id="${v.id}" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px; cursor: pointer; transition: all 0.2s;">
                                <div style="position: relative; height: 110px; background: #181a24; border-radius: 6px; overflow: hidden; margin-bottom: 8px; display: flex; align-items: center; justify-content: center;">
                                    <img src="https://img.youtube.com/vi/${v.id}/mqdefault.jpg" alt="${escapeHtml(v.title)}" style="width: 100%; height: 100%; object-fit: cover;">
                                    <div style="position: absolute; width: 34px; height: 34px; background: rgba(255,0,0,0.85); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px;">▶</div>
                                </div>
                                <span style="font-size: 10px; font-weight: bold; color: #ff4444; text-transform: uppercase;">${v.tag}</span>
                                <h5 style="margin: 4px 0; font-size: 13px; color: #fff; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${escapeHtml(v.title)}</h5>
                                <p style="margin: 0; font-size: 11px; color: #94a3b8;">${escapeHtml(v.creator)}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    const ytInput = viewport.querySelector('#yt-search-input');
    const ytBtn = viewport.querySelector('#yt-search-btn');

    const handleYtSearch = () => {
        const val = ytInput.value.trim();
        if (!val) return;
        const parsedId = extractYouTubeVideoId(val);
        if (parsedId) {
            navigateTo(`https://youtube.com/watch?v=${parsedId}`);
        } else {
            navigateTo(`google:${val} youtube`);
        }
    };

    ytBtn?.addEventListener('click', handleYtSearch);
    ytInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleYtSearch(); });

    viewport.querySelectorAll('.yt-card').forEach(card => {
        card.addEventListener('click', () => {
            const vId = card.getAttribute('data-id');
            if (vId) navigateTo(`https://youtube.com/watch?v=${vId}`);
        });
    });
}

function extractYouTubeVideoId(url) {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

/* --------------------------------------------------------------------------
   Universal Web Engine (Live Iframe + Reader Mode + Direct Tab)
   -------------------------------------------------------------------------- */
function renderUniversalWebFrame(url, viewport, navigateTo) {
    viewport.innerHTML = `
        <div style="background: #111422; padding: 6px 14px; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 12px; display: flex; justify-content: space-between; align-items: center; color: #8892b0;">
            <div style="display: flex; gap: 8px; align-items: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%;">
                <span style="color: #4285F4;">🔒</span>
                <span style="color: #cbd5e1; font-family: monospace; font-size: 12px; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(url)}</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
                <button id="wb-btn-direct-frame" style="padding: 3px 8px; background: rgba(66,133,244,0.15); border: 1px solid #4285F4; border-radius: 4px; color: #4285F4; font-size: 11px; cursor: pointer;">🌐 Live Frame</button>
                <button id="wb-btn-reader" style="padding: 3px 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; color: #cbd5e1; font-size: 11px; cursor: pointer;">⚡ Reader Mode</button>
                <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #34A853; text-decoration: none; font-size: 11px; padding: 3px 8px; background: rgba(52,168,83,0.1); border: 1px solid #34A853; border-radius: 4px;">↗️ Direct Tab</a>
            </div>
        </div>
        <div id="wb-content-host" style="flex: 1; width: 100%; height: 100%; position: relative;">
            <iframe 
                id="wb-live-iframe"
                class="browser-iframe" 
                src="${url}" 
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                loading="lazy"
                style="width: 100%; height: 100%; border: none; background: #fff;"
            ></iframe>
        </div>
    `;

    const host = viewport.querySelector('#wb-content-host');
    const btnDirectFrame = viewport.querySelector('#wb-btn-direct-frame');
    const btnReader = viewport.querySelector('#wb-btn-reader');

    btnDirectFrame?.addEventListener('click', () => {
        sound.playClick();
        if (host) {
            host.innerHTML = `
                <iframe 
                    id="wb-live-iframe"
                    class="browser-iframe" 
                    src="${url}" 
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    loading="lazy"
                    style="width: 100%; height: 100%; border: none; background: #fff;"
                ></iframe>
            `;
        }
    });

    btnReader?.addEventListener('click', () => {
        sound.playClick();
        loadReaderProxy(url, host);
    });
}

async function loadReaderProxy(url, container) {
    if (!container) return;
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #4285F4; font-family: monospace; font-size: 14px;">
            <div style="font-size: 24px; margin-bottom: 12px; animation: spin 1s infinite linear;">⚡</div>
            <div>Rendering Unrestricted Reader Mode for ${escapeHtml(url)}...</div>
        </div>
    `;

    try {
        const jinaUrl = `https://r.jina.ai/${url}`;
        const res = await fetch(jinaUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const markdown = await res.text();

        container.innerHTML = `
            <div class="browser-inner-content" style="padding: 24px; max-width: 820px; margin: 0 auto; color: #cbd5e1; font-family: system-ui, sans-serif; line-height: 1.7; overflow-y: auto; height: 100%;">
                <div style="padding: 10px 14px; background: rgba(66,133,244,0.08); border: 1px solid rgba(66,133,244,0.25); border-radius: 8px; margin-bottom: 20px; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <span>⚡ Unrestricted Reader Mode (Bypassing X-Frame-Options)</span>
                    <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #4285F4; text-decoration: none;">Open Original Site &rarr;</a>
                </div>
                <div style="white-space: pre-wrap; font-family: monospace; font-size: 13px; background: rgba(0,0,0,0.3); padding: 18px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">${escapeHtml(markdown)}</div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `
            <div class="browser-inner-content" style="padding: 40px; text-align: center;">
                <h3 style="color: #ff5555; margin-bottom: 10px;">Security Sandbox Notice</h3>
                <p style="color: #94a3b8; font-size: 14px; max-width: 500px; margin: 0 auto 20px auto;">
                    This website enforces strict <code>X-Frame-Options: DENY</code>. You can open it in a direct sandboxed window below:
                </p>
                <a href="${url}" target="_blank" rel="noopener noreferrer" style="padding: 10px 20px; background: #4285F4; color: #fff; font-weight: bold; border-radius: 8px; text-decoration: none; display: inline-block;">
                    Open ${escapeHtml(url)} in Direct Tab &rarr;
                </a>
            </div>
        `;
    }
}

/* --------------------------------------------------------------------------
   Google Auth Dialogs & Account Helpers
   -------------------------------------------------------------------------- */
function getActiveGoogleUser() {
    try {
        const raw = localStorage.getItem('krypton_google_account');
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function promptGoogleBrowserAuth(onSuccess) {
    const dialog = document.createElement('div');
    dialog.style.cssText = 'display: flex; flex-direction: column; gap: 14px; color: #000; font-family: "Outfit", sans-serif;';

    dialog.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
            <svg width="24" height="24" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            <div style="font-weight: 700; font-size: 15px; color: #1a202c;">Sign in to Google</div>
        </div>
        <div style="font-size: 12px; color: #4a5568;">
            Connect your Google account for user identity across KryptonOS:
        </div>
        <input type="email" id="g-browser-email" value="shrestangsu.dutta@gmail.com" placeholder="name@gmail.com" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 13px; font-family: inherit;">
        <input type="text" id="g-browser-name" value="Shrestangsu Dutta" placeholder="Display Name" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 13px; font-family: inherit;">
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;">
            <button id="g-browser-cancel" style="padding: 6px 14px; background: #edf2f7; border: 1px solid #cbd5e0; border-radius: 6px; cursor: pointer; font-size: 12px;">Cancel</button>
            <button id="g-browser-confirm" style="padding: 6px 16px; background: #4285F4; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">Sign in</button>
        </div>
    `;

    wm.createWindow({
        id: 'browser-google-auth-dialog',
        title: 'Google Account Authentication',
        icon: '🔒',
        width: 390,
        height: 260,
        content: dialog
    });

    dialog.querySelector('#g-browser-cancel').addEventListener('click', () => wm.closeWindow('browser-google-auth-dialog'));
    dialog.querySelector('#g-browser-confirm').addEventListener('click', () => {
        const email = dialog.querySelector('#g-browser-email').value.trim();
        const name = dialog.querySelector('#g-browser-name').value.trim() || 'Google User';

        if (!email || !email.includes('@')) {
            story.showToast('Validation Error', 'Please enter a valid Google Account email.', 'error');
            return;
        }

        const account = {
            email,
            name,
            uid: `google_oauth2_${Math.random().toString(36).substring(2, 12)}`,
            linked_at: new Date().toISOString()
        };

        localStorage.setItem('krypton_google_account', JSON.stringify(account));
        localStorage.setItem('krypton_google_email', email);

        wm.closeWindow('browser-google-auth-dialog');
        story.showToast('✓ Google Account Connected', `Signed in as ${email}.`, 'success');
        if (onSuccess) onSuccess();
    });
}

function showGoogleAccountManagerDialog(onChange) {
    const user = getActiveGoogleUser();
    if (!user) return;

    const dialog = document.createElement('div');
    dialog.style.cssText = 'display: flex; flex-direction: column; gap: 14px; color: #000; font-family: "Outfit", sans-serif;';

    dialog.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #4285F4, #34A853); display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff; font-size: 20px;">
                ${(user.name || user.email)[0].toUpperCase()}
            </div>
            <div>
                <div style="font-weight: 700; font-size: 15px; color: #1a202c;">${user.name || 'Google User'}</div>
                <div style="font-size: 12px; color: #4a5568;">${user.email}</div>
            </div>
        </div>

        <div style="background: rgba(66, 133, 244, 0.08); border: 1px solid #4285F4; border-radius: 6px; padding: 10px 14px; font-size: 12px; color: #2d3748;">
            <div style="font-weight: 700; color: #1a73e8; margin-bottom: 2px;">✓ Google Account Connected</div>
            <div>Your account is active and synchronized in KryptonOS.</div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
            <button id="g-mgr-signout" style="padding: 6px 14px; background: #fee2e2; border: 1px solid #ef4444; color: #dc2626; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">Sign out</button>
            <button id="g-mgr-close" style="padding: 6px 16px; background: #4285F4; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">Done</button>
        </div>
    `;

    wm.createWindow({
        id: 'google-account-manager-dialog',
        title: 'Manage Google Account',
        icon: '⚙️',
        width: 380,
        height: 250,
        content: dialog
    });

    dialog.querySelector('#g-mgr-close').addEventListener('click', () => wm.closeWindow('google-account-manager-dialog'));
    dialog.querySelector('#g-mgr-signout').addEventListener('click', () => {
        localStorage.removeItem('krypton_google_account');
        localStorage.removeItem('krypton_google_email');
        wm.closeWindow('google-account-manager-dialog');
        story.showToast('Signed Out', 'Google account disconnected from browser and persistent storage.', 'info');
        if (onChange) onChange();
    });
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
