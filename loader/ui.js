/**
 * EAG Forge Revamped - In-Game Mod Manager UI
 */

(function() {
    window.EAGForgeUI = {
        isOpen: false,

        init: function() {
            this.injectStyles();
            this.buildModal();
            this.bindEvents();
            this.refreshList();
        },

        injectStyles: function() {
            const css = `
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
            `;
            const style = document.createElement("style");
            style.textContent = css;
            document.head.appendChild(style);
        },

        buildModal: function() {
            // Floating toggle button
            const toggleBtn = document.createElement("button");
            toggleBtn.id = "eag-forge-toggle-btn";
            toggleBtn.textContent = "⚡ EAG Mods (Press M)";
            toggleBtn.onclick = () => this.toggle();
            document.body.appendChild(toggleBtn);

            // Modal overlay
            const modal = document.createElement("div");
            modal.id = "eag-forge-modal";
            modal.innerHTML = `
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
                    <div id="eagInstalledModsList">
                        <!-- Loaded dynamically -->
                    </div>
                </div>
                <div class="eag-modal-footer">
                    <div>EAG Forge Revamped is a community recode & modernization.</div>
                    <div>Credits: <strong>EaglerForge Team</strong>, <strong>LAX1DUDE</strong>, and modern port devs.</div>
                </div>
            `;
            document.body.appendChild(modal);
        },

        bindEvents: function() {
            const modal = document.getElementById("eag-forge-modal");
            const closeBtn = document.getElementById("eagCloseBtn");
            const uploadBtn = document.getElementById("eagUploadBtn");
            const fileInput = document.getElementById("eagModFileInput");

            closeBtn.onclick = () => this.close();
            uploadBtn.onclick = () => fileInput.click();

            // Handle file upload inside the game
            fileInput.onchange = (e) => {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const code = event.target.result;
                        const modObj = {
                            id: "mod_" + Date.now(),
                            name: file.name.replace(".js", ""),
                            code: code,
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

            // Keyboard shortcut 'M' toggles the mod menu
            window.addEventListener("keydown", (e) => {
                if (e.key === "m" || e.key === "M") {
                    // Only trigger if player isn't typing in chat or input
                    if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
                        this.toggle();
                    }
                }
            });
        },

        toggle: function() {
            this.isOpen ? this.close() : this.open();
        },

        open: function() {
            // Exit mouse lock if in-game
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
            container.innerHTML = "<small style='color:#9ca3af;'>Loading active mods...</small>";

            window.EAGForgeEngine.loadSavedMods((mods) => {
                if (mods.length === 0) {
                    container.innerHTML = "<small style='color:#9ca3af;'>No custom mods uploaded yet. Click 'Upload .JS Mod' above!</small>";
                    return;
                }
                container.innerHTML = "";
                mods.forEach(mod => {
                    const item = document.createElement("div");
                    item.className = "eag-mod-item";
                    item.innerHTML = `
                        <div class="eag-mod-info">
                            <strong>${mod.name}</strong>
                            <small>Status: ${mod.enabled ? '<span style="color:#10b981;">Enabled</span>' : '<span style="color:#ef4444;">Disabled</span>'}</small>
                        </div>
                        <div style="display:flex; gap:8px;">
                            <button class="eag-btn" style="background:${mod.enabled ? '#374151' : '#10b981'};" id="toggle_${mod.id}">
                                ${mod.enabled ? 'Disable' : 'Enable'}
                            </button>
                            <button class="eag-btn" style="background:#dc2626;" id="del_${mod.id}">Delete</button>
                        </div>
                    `;
                    container.appendChild(item);

                    document.getElementById(`toggle_${mod.id}`).onclick = () => {
                        window.EAGForgeEngine.toggleMod(mod.id, !mod.enabled, () => this.refreshList());
                    };
                    document.getElementById(`del_${mod.id}`).onclick = () => {
                        window.EAGForgeEngine.deleteMod(mod.id, () => this.refreshList());
                    };
                });
            });
        }
    };
})();
