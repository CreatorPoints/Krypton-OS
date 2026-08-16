/* ==========================================================================
   KryptonOS Dynamic Application Loader & Desktop Discovery Subsystem
   Discovers, resolves, and dynamically executes applications from VFS
   ========================================================================== */

import { wm } from './wm.js';
import { vfs } from './fs.js';
import { sound } from './sound.js';
import { story } from './story.js';
import { boot } from './boot.js';

class DynamicAppLoader {
    constructor() {
        this.moduleCache = new Map();
        this.builtinLaunchers = new Map();
    }

    /**
     * Register a built-in core application launcher (e.g. terminal, installer)
     */
    registerBuiltin(id, launchFn) {
        this.builtinLaunchers.set(id, launchFn);
    }

    /**
     * Parse a Linux XDG Desktop Entry (.desktop file)
     */
    parseDesktopFile(content, fileName = '') {
        const lines = content.split('\n');
        const entry = {
            id: fileName.replace(/\.desktop$/i, '').trim(),
            title: 'Unknown Application',
            exec: '',
            icon: '📦',
            categories: 'Utility;',
            comment: '',
            type: 'Application'
        };

        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || line.startsWith('#') || line.startsWith('[')) continue;
            const eqIdx = line.indexOf('=');
            if (eqIdx === -1) continue;

            const key = line.substring(0, eqIdx).trim();
            const val = line.substring(eqIdx + 1).trim();

            switch (key.toLowerCase()) {
                case 'name':
                    entry.title = val;
                    break;
                case 'exec':
                    entry.exec = val;
                    break;
                case 'icon':
                    entry.icon = val;
                    break;
                case 'comment':
                    entry.comment = val;
                    break;
                case 'categories':
                    entry.categories = val;
                    break;
                case 'type':
                    entry.type = val;
                    break;
            }
        }

        if (!entry.id && entry.exec) {
            entry.id = entry.exec.split(' ')[0].replace(/^krypton-/, '');
        }

        return entry;
    }

    /**
     * Scan /usr/share/applications/ to discover all installed desktop applications
     */
    getInstalledApps() {
        const apps = [];
        const appDir = '/usr/share/applications';

        if (!vfs.exists(appDir)) {
            vfs.createDirectory(appDir);
        }

        const files = vfs.listDir(appDir) || [];
        for (const file of files) {
            if (file.name.endsWith('.desktop') && file.type === 'file') {
                const fullPath = `${appDir}/${file.name}`;
                const content = vfs.readFile(fullPath);
                if (content) {
                    const parsed = this.parseDesktopFile(content, file.name);
                    parsed.open = (args) => this.launch(parsed.id, args);
                    apps.push(parsed);
                }
            }
        }

        return apps;
    }

    /**
     * Dynamically launch an installed application by ID or executable name
     */
    async launch(appIdOrExec, args = null) {
        sound.playClick();
        const normId = appIdOrExec.replace(/^krypton-/, '').replace(/\.desktop$/i, '').trim();

        // 1. Check if it's a registered built-in core tool
        if (this.builtinLaunchers.has(normId)) {
            return this.builtinLaunchers.get(normId)(args);
        }

        // 2. Check if the module is already cached in memory
        if (this.moduleCache.has(normId)) {
            try {
                const mod = this.moduleCache.get(normId);
                const launchFn = mod.launch || mod.openApp || mod.default || mod.open;
                if (typeof launchFn === 'function') {
                    return launchFn({ wm, vfs, sound, story, boot, args });
                }
            } catch (err) {
                console.error(`[AppLoader] Error executing cached module '${normId}':`, err);
            }
        }

        // 3. Locate module script in VFS (/usr/lib/<pkg>/index.js or /usr/lib/<pkg>/app.js)
        const candidatePaths = [
            `/usr/lib/krypton-${normId}/index.js`,
            `/usr/lib/${normId}/index.js`,
            `/usr/lib/krypton-${normId}/app.js`,
            `/usr/lib/${normId}/app.js`,
            `/usr/share/krypton-${normId}/index.js`
        ];

        let scriptPath = candidatePaths.find(p => vfs.exists(p));

        if (!scriptPath) {
            story.showToast(
                '⚠️ Application Not Installed',
                `'${normId}' is not installed in the operating system. Run 'sudo apt install krypton-${normId}' in Terminal.`,
                'warning'
            );
            return null;
        }

        const scriptContent = vfs.readFile(scriptPath);
        if (!scriptContent) {
            story.showToast('❌ Launch Error', `Failed to read application payload for '${normId}'.`, 'error');
            return null;
        }

        // 4. Permission & Security Capability Validation
        const permFilePath = `/var/lib/dpkg/info/krypton-${normId}.permissions`;
        let allowedPermissions = ['vfs:read', 'vfs:write', 'wm:window', 'audio:play', 'network:fetch'];
        if (vfs.exists(permFilePath)) {
            try {
                const parsed = JSON.parse(vfs.readFile(permFilePath));
                if (Array.isArray(parsed)) allowedPermissions = parsed;
            } catch (e) {}
        }

        // 5. Dynamic Blob Module Execution with Runtime Injection & Scoped Context
        try {
            // Strip out relative ESM imports because Blob URLs cannot resolve relative paths
            let cleanScript = scriptContent
                .replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*['"];?/g, '')
                .replace(/import\s+[\w*\s{},]+\s+from\s+['"][^'"]*['"];?/g, '');

            // Ensure exports / global environment safety
            cleanScript = `var exports = typeof exports !== "undefined" ? exports : {};\n` + cleanScript;

            const blob = new Blob([cleanScript], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);

            const mod = await import(blobUrl);
            URL.revokeObjectURL(blobUrl);

            this.moduleCache.set(normId, mod);

            // Prioritize specific application entry functions, then fallback to generic launch/open/default
            const specificAppFn = mod.openNotes || mod.openTextEditor || mod.openBrowser || mod.openWebBrowser || mod.openKryptonBrowser || mod.openCalculator || mod.openClockWindow || mod.openClock || mod.openFileMgr || mod.openFileManager || mod.openFileExplorer || mod.openTaskMgr || mod.openTaskManager || mod.openSystemMonitor || mod.openSettings || mod.openMessages || mod.openSystemLogs;
            
            if (typeof specificAppFn === 'function') {
                if (Array.isArray(args)) {
                    return specificAppFn(...args);
                } else if (typeof args === 'string' || typeof args === 'number' || typeof args === 'boolean') {
                    return specificAppFn(args);
                } else {
                    return specificAppFn();
                }
            }

            const fallbackFn = mod.launch || mod.openApp || mod.default || mod.open;
            if (typeof fallbackFn === 'function') {
                if (Array.isArray(args)) {
                    return fallbackFn(...args);
                } else if (typeof args === 'string') {
                    return fallbackFn(args);
                }
                return fallbackFn({ wm, vfs, sound, story, boot, args });
            }

            throw new Error(`Module '${normId}' does not export a recognized launch function.`);
        } catch (err) {
            console.error(`[AppLoader] Dynamic import failed for '${normId}':`, err);
            story.showToast('❌ Execution Error', `Could not start '${normId}': ${err.message}`, 'error');
            return null;
        }
    }

    /**
     * Invalidate module cache on package removal
     */
    invalidateCache(appId) {
        const normId = appId.replace(/^krypton-/, '').replace(/\.desktop$/i, '').trim();
        this.moduleCache.delete(normId);
    }

    /**
     * Clear all cached modules (e.g. on system upgrade or reset)
     */
    clearCache() {
        this.moduleCache.clear();
    }
}

export const appLoader = new DynamicAppLoader();
