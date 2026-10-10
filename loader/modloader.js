/**
 * EAG Forge Revamped - Core Runtime Engine & IndexedDB Storage
 */

(function() {
    window.EAGForgeEngine = {
        dbName: "EAGForge_DB",
        dbVersion: 1,
        db: null,

        // Initialize IndexedDB
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
                console.log("[EAG Forge] IndexedDB initialized successfully.");
                if (callback) callback();
            };

            request.onerror = function(e) {
                console.error("[EAG Forge] IndexedDB error:", e.target.error);
                if (callback) callback();
            };
        },

        // Save a mod into permanent storage
        saveMod: function(modObj, callback) {
            if (!this.db) return;
            const tx = this.db.transaction("mods", "readwrite");
            const store = tx.objectStore("mods");
            store.put(modObj);
            tx.oncomplete = () => {
                console.log(`[EAG Forge] Saved mod "${modObj.name}" to IndexedDB.`);
                if (callback) callback();
            };
        },

        // Load all saved mods on game launch
        loadSavedMods: function(callback) {
            if (!this.db) return;
            const tx = this.db.transaction("mods", "readonly");
            const store = tx.objectStore("mods");
            const req = store.getAll();

            req.onsuccess = function() {
                const mods = req.result || [];
                mods.forEach(mod => {
                    if (mod.enabled) {
                        window.EAGForgeEngine.executeMod(mod);
                    }
                });
                if (callback) callback(mods);
            };
        },

        // Delete a mod from storage
        deleteMod: function(id, callback) {
            if (!this.db) return;
            const tx = this.db.transaction("mods", "readwrite");
            const store = tx.objectStore("mods");
            store.delete(id);
            tx.oncomplete = () => {
                console.log(`[EAG Forge] Deleted mod ID "${id}" from IndexedDB.`);
                if (callback) callback();
            };
        },

        // Toggle a mod ON/OFF
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
                    tx.oncomplete = () => {
                        if (callback) callback();
                    };
                }
            };
        },

        // Safely execute JavaScript mod code
        executeMod: function(mod) {
            try {
                console.log(`[EAG Forge] Launching: ${mod.name} (${mod.id})`);
                const runner = new Function("EAGForge", mod.code);
                runner(window.EAGForge);
            } catch (err) {
                console.error(`[EAG Forge] Error running mod "${mod.name}":`, err);
            }
        }
    };
})();
