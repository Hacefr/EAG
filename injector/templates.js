/**
 * EAG Forge Revamped - Injection Templates & Bootstrap
 * Standalone offline runtime with ModAPI bridge, WebSocket packet hooks, and in-game UI.
 */

window.EAG_TEMPLATES = {
    generateBootstrap: function(detectedVersion, bundledMods = []) {
        const modsJSON = JSON.stringify(bundledMods);

        return `
<!-- === BEGIN: EAG FORGE REVAMPED MODLOADER === -->
<style>
    #eag-forge-toggle-btn {
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 999999;
        background: #1e1b4b;
        color: #a5b4fc;
        border: 1px solid #4338ca;
        padding: 8px 14px;
        border-radius: 6px;
        cursor: pointer;
        font-family: sans-serif;
        font-weight: bold;
        font-size: 13px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    }
    #eag-forge-toggle-btn:hover { background: #312e81; }

    #eag-forge-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 580px;
        max-width: 90vw;
        max-height: 85vh;
        background: #0f1117;
        border: 1px solid #2d3748;
        border-radius: 12px;
        z-index: 1000000;
        color: #f3f4f6;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: none;
        flex-direction: column;
        box-shadow: 0 20px 40px rgba(0,0,0,0.8);
    }

    .eag-modal-header {
        padding: 16px 20px;
        border-bottom: 1px solid #1f293d;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .eag-modal-header h3 { margin: 0; font-size: 1.1rem; color: #10b981; }
    .eag-close-btn { background: none; border: none; color: #9ca3af; font-size: 20px; cursor: pointer; }

    .eag-modal-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
    }

    .eag-upload-bar {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        flex-wrap: wrap;
    }
    .eag-btn {
        background: #4f46e5;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
    }
    .eag-btn:hover { background: #4338ca; }

    .eag-link-btn {
        background: #1f2937;
        color: #38bdf8;
        border: 1px solid #374151;
        padding: 8px 14px;
        border-radius: 6px;
        text-decoration: none;
        font-size: 0.85rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
    }
    .eag-link-btn:hover { background: #374151; }

    .eag-mod-item {
        background: #181b24;
        border: 1px solid #262b3a;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .eag-mod-info strong { display: block; font-size: 0.9rem; }
    .eag-mod-info small { color: #9ca3af; font-size: 0.75rem; }

    .eag-modal-footer {
        padding: 12px 20px;
        border-top: 1px solid #1f293d;
        font-size: 0.75rem;
        color: #9ca3af;
        text-align: center;
        line-height: 1.5;
    }
</style>

<script type="text/javascript">
(function() {
    console.log("[EAG Forge Revamped] Initializing runtime loader for target: ${detectedVersion}");

    // 1. GLOBAL API & EVENT BUS
    window.EAGForge = {
        version: "1.0.0-Revamped",
        targetMinecraft: "${detectedVersion}",
        mods: new Map(),
        events: {},
        bundledMods: ${modsJSON},

        // Universal event listener
        on: function(event, callback) {
            if (!this.events[event]) this.events[event] = [];
            this.events[event].push(callback);
        },

        // Legacy EaglerForge ModAPI alias
        addEventListener: function(event, callback) {
            this.on(event, callback);
        },

        emit: function(event, ...args) {
            if (this.events[event]) {
                for (const cb of this.events[event]) {
                    try { cb(...args); } catch (err) { console.error("[EAG Forge] Event error in '" + event + "':", err); }
                }
            }
        },

        // Quick chat display utility
        displayToChat: function(message) {
            console.log("[Chat] " + message);
            this.emit("chatDisplay", message);
        }
    };

    // Make ModAPI globally point to EAGForge for legacy compatibility
    window.ModAPI = window.EAGForge;

    // 2. NETWORK & WEBSOCKET PACKET HOOKS
    (function hookSockets() {
        const OriginalWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
            const ws = protocols ? new OriginalWebSocket(url, protocols) : new OriginalWebSocket(url);

            // Hook incoming packets/messages
            ws.addEventListener("message", function(event) {
                if (window.EAGForge) window.EAGForge.emit("packetReceive", event.data);
            });

            // Hook outgoing packets/messages
            const origSend = ws.send;
            ws.send = function(data) {
                if (window.EAGForge) window.EAGForge.emit("packetSend", data);
                return origSend.apply(this, arguments);
            };

            return ws;
        };
        window.WebSocket.prototype = OriginalWebSocket.prototype;
    })();

    // 3. STORAGE ENGINE (IndexedDB)
    window.EAGForgeEngine = {
        dbName: "EAGForge_DB",
        dbVersion: 1,
        db: null,

        initStorage: function(callback) {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onupgradeneeded = function(e) {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("mods")) {
                    db.createObjectStore("mods", { keyPath: "id" });
                }
            };
            request.onsuccess = function(e) {
                window.EAGForgeEngine.db = e.target.result;
                if (callback) callback();
            };
            request.onerror = function(e) {
                console.error("[EAG Forge] Storage failed:", e.target.error);
                if (callback) callback();
            };
        },

        saveMod: function(modObj, callback) {
            if (!this.db) return;
            const tx = this.db.transaction("mods", "readwrite");
            tx.objectStore("mods").put(modObj);
            tx.oncomplete = () => { if (callback) callback(); };
        },

        loadSavedMods: function(callback) {
            if (!this.db) return;
            const tx = this.db.transaction("mods", "readonly");
            const req = tx.objectStore("mods").getAll();
            req.onsuccess = function() {
                const mods = req.result || [];
                mods.forEach(mod => {
                    if (mod.enabled) window.EAGForgeEngine.executeMod(mod);
                });
                if (callback) callback(mods);
            };
        },

        deleteMod: function(id, callback) {
            if (!this.db) return;
            const tx = this.db.transaction("mods", "readwrite");
            tx.objectStore("mods").delete(id);
            tx.oncomplete = () => { if (callback) callback(); };
        },

        toggleMod: function(id, enabled, callback) {
            if (!this.db) return;
            const tx = this.db.transaction("mods", "readwrite");
            const store = tx.objectStore("mods");
            const req = store.get(id);
            req.onsuccess = function() {
                const mod = req.result;
                if (mod) {
                    mod.enabled = enabled;
                    store.put(mod);
                    tx.oncomplete = () => { if (callback) callback(); };
                }
            };
        },

        executeMod: function(mod) {
            try {
                console.log("[EAG Forge] Launching mod: " + mod.name);
                const runner = new Function("EAGForge", "ModAPI", mod.code);
                runner(window.EAGForge, window.ModAPI);
            } catch (err) {
                console.error("[EAG Forge] Error in mod '" + mod.name + "':", err);
            }
        }
    };

    // 4. CANVAS & INPUT HOOKS
    window.EAGForgeHooks = {
        init: function() {
            const origGetContext = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function(type, attributes) {
                const ctx = origGetContext.apply(this, arguments);
                if (type === "webgl" || type === "webgl2") {
                    if (window.EAGForge && !window.EAGForge.gl) {
                        window.EAGForge.gl = ctx;
                        window.EAGForge.canvas = this;
                        window.EAGForge.emit("webglInit", ctx);
                    }
                }
                return ctx;
            };

            window.addEventListener("keydown", (e) => {
                if (window.EAGForge) window.EAGForge.emit("keydown", e);
            });
            window.addEventListener("keyup", (e) => {
                if (window.EAGForge) window.EAGForge.emit("keyup", e);
            });
        }
    };

    // 5. IN-GAME UI MANAGER
    window.EAGForgeUI = {
        isOpen: false,

        init: function() {
            this.buildModal();
            this.bindEvents();
            this.refreshList();
        },

        buildModal: function() {
            const toggleBtn = document.createElement("button");
            toggleBtn.id = "eag-forge-toggle-btn";
            toggleBtn.textContent = "⚡ EAG Mods (Press M)";
            toggleBtn.onclick = () => this.toggle();
            document.body.appendChild(toggleBtn);

            const modal = document.createElement("div");
            modal.id = "eag-forge-modal";
            modal.innerHTML = \`
                <div class="eag-modal-header">
                    <h3>⚡ EAG Forge Revamped - Mod Manager</h3>
                    <button class="eag-close-btn" id="eagCloseBtn">&times;</button>
                </div>
                <div class="eag-modal-body">
                    <div class="eag-upload-bar">
                        <input type="file" id="eagModFileInput" accept=".js" hidden>
                        <button class="eag-btn" id="eagUploadBtn">➕ Upload .JS Mod</button>
                        <a href="https://github.com" target="_blank" class="eag-link-btn" id="eagBrowseModsLink">
                            🌐 Download More Mods
                        </a>
                    </div>
                    <div id="eagInstalledModsList"></div>
                </div>
                <div class="eag-modal-footer">
                    <div>EAG Forge Revamped is an open-source community recode.</div>
                    <div>Credits: <strong>EaglerForge Team</strong>, <strong>LAX1DUDE</strong>, and modern port devs.</div>
                </div>
            \`;
            document.body.appendChild(modal);
        },

        bindEvents: function() {
            const closeBtn = document.getElementById("eagCloseBtn");
            const uploadBtn = document.getElementById("eagUploadBtn");
            const fileInput = document.getElementById("eagModFileInput");

            closeBtn.onclick = () => this.close();
            uploadBtn.onclick = () => fileInput.click();

            fileInput.onchange = (e) => {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const modObj = {
                            id: "mod_" + Date.now(),
                            name: file.name.replace(".js", ""),
                            code: event.target.result,
                            enabled: true
                        };
                        window.EAGForgeEngine.saveMod(modObj, () => {
                            window.EAGForgeEngine.executeMod(modObj);
                            this.refreshList();
                        });
                    };
                    reader.readAsText(file);
                }
            };

            window.addEventListener("keydown", (e) => {
                if (e.key === "m" || e.key === "M") {
                    if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
                        this.toggle();
                    }
                }
            });
        },

        toggle: function() { this.isOpen ? this.close() : this.open(); },

        open: function() {
            if (document.pointerLockElement) document.exitPointerLock();
            document.getElementById("eag-forge-modal").style.display = "flex";
            this.isOpen = true;
            this.refreshList();
        },

        close: function() {
            document.getElementById("eag-forge-modal").style.display = "none";
            this.isOpen = false;
        },

        refreshList: function() {
            const container = document.getElementById("eagInstalledModsList");
            if (!container) return;
            container.innerHTML = "<small style='color:#9ca3af;'>Loading mods...</small>";

            window.EAGForgeEngine.loadSavedMods((mods) => {
                if (!mods || mods.length === 0) {
                    container.innerHTML = "<small style='color:#9ca3af;'>No custom mods uploaded yet. Click 'Upload .JS Mod' above!</small>";
                    return;
                }
                container.innerHTML = "";
                mods.forEach(mod => {
                    const item = document.createElement("div");
                    item.className = "eag-mod-item";
                    item.innerHTML = \`
                        <div class="eag-mod-info">
                            <strong>\${mod.name}</strong>
                            <small>Status: \${mod.enabled ? '<span style="color:#10b981;">Enabled</span>' : '<span style="color:#ef4444;">Disabled</span>'}</small>
                        </div>
                        <div style="display:flex; gap:8px;">
                            <button class="eag-btn" style="background:\${mod.enabled ? '#374151' : '#10b981'};" id="toggle_\${mod.id}">
                                \${mod.enabled ? 'Disable' : 'Enable'}
                            </button>
                            <button class="eag-btn" style="background:#dc2626;" id="del_\${mod.id}">Delete</button>
                        </div>
                    \`;
                    container.appendChild(item);

                    document.getElementById("toggle_" + mod.id).onclick = () => {
                        window.EAGForgeEngine.toggleMod(mod.id, !mod.enabled, () => this.refreshList());
                    };
                    document.getElementById("del_" + mod.id).onclick = () => {
                        window.EAGForgeEngine.deleteMod(mod.id, () => this.refreshList());
                    };
                });
            });
        }
    };

    // 6. INITIALIZATION SEQUENCE
    window.addEventListener("DOMContentLoaded", function() {
        window.EAGForgeHooks.init();
        window.EAGForgeEngine.initStorage(function() {
            window.EAGForgeEngine.loadSavedMods();
            window.EAGForgeUI.init();
        });

        // Run pre-bundled mods
        if (window.EAGForge && Array.isArray(window.EAGForge.bundledMods)) {
            window.EAGForge.bundledMods.forEach(function(mod) {
                try {
                    const runMod = new Function("EAGForge", "ModAPI", mod.code);
                    runMod(window.EAGForge, window.ModAPI);
                } catch (err) {
                    console.error("[EAG Forge] Failed to run bundled mod " + mod.name + ":", err);
                }
            });
        }
    });
})();
</script>
<!-- === END: EAG FORGE REVAMPED MODLOADER === -->
`;
    }
};
