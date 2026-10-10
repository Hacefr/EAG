/**
 * EAG Forge Revamped - Injection Templates & Bootstrap
 * This contains the loader harness spliced into uploaded HTML clients.
 */

window.EAG_TEMPLATES = {
    // Generates the core loader wrapper injected directly into the HTML client
    generateBootstrap: function(detectedVersion, bundledMods = []) {
        const modsJSON = JSON.stringify(bundledMods);

        return `
<!-- === BEGIN: EAG FORGE REVAMPED MODLOADER === -->
<script type="text/javascript">
(function() {
    console.log("[EAG Forge Revamped] Initializing runtime loader for version: ${detectedVersion}");

    window.EAGForge = {
        version: "1.0.0-Revamped",
        targetMinecraft: "${detectedVersion}",
        mods: new Map(),
        events: {},
        bundledMods: ${modsJSON},

        // Event listener system
        on: function(event, callback) {
            if (!this.events[event]) this.events[event] = [];
            this.events[event].push(callback);
        },

        emit: function(event, ...args) {
            if (this.events[event]) {
                for (const cb of this.events[event]) {
                    try {
                        cb(...args);
                    } catch (err) {
                        console.error("[EAG Forge] Error in event listener '" + event + "':", err);
                    }
                }
            }
        },

        // Mod registration
        registerMod: function(metadata, runFunction) {
            const id = metadata.id || "mod_" + Math.random().toString(36).substring(2, 9);
            console.log("[EAG Forge] Registering mod: " + (metadata.name || id));
            this.mods.set(id, {
                metadata: metadata,
                run: runFunction,
                enabled: true
            });
            try {
                runFunction(this);
            } catch (e) {
                console.error("[EAG Forge] Failed to run mod " + id + ":", e);
            }
        }
    };

    // Hook standard browser events to trigger EAGForge events
    window.addEventListener("keydown", function(e) {
        if (window.EAGForge) window.EAGForge.emit("keydown", e);
    });

    window.addEventListener("keyup", function(e) {
        if (window.EAGForge) window.EAGForge.emit("keyup", e);
    });

    // Execute pre-bundled mods on boot
    window.addEventListener("DOMContentLoaded", function() {
        if (window.EAGForge && Array.isArray(window.EAGForge.bundledMods)) {
            window.EAGForge.bundledMods.forEach(function(mod) {
                try {
                    console.log("[EAG Forge] Executing bundled mod: " + mod.name);
                    const runMod = new Function("EAGForge", mod.code);
                    runMod(window.EAGForge);
                } catch (err) {
                    console.error("[EAG Forge] Failed to load bundled mod " + mod.name + ":", err);
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
