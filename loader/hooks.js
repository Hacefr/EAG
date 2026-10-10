/**
 * EAG Forge Revamped - Universal Browser & WebGL Hooks
 */

(function() {
    window.EAGForgeHooks = {
        init: function() {
            console.log("[EAG Forge] Attaching universal hooks...");
            this.hookWebGL();
            this.hookInput();
        },

        // Hook WebGL context to allow HUD overlays & shader interceptors
        hookWebGL: function() {
            const originalGetContext = HTMLCanvasElement.prototype.getContext;

            HTMLCanvasElement.prototype.getContext = function(type, attributes) {
                const ctx = originalGetContext.apply(this, arguments);
                if (type === "webgl" || type === "webgl2") {
                    if (window.EAGForge && !window.EAGForge.gl) {
                        window.EAGForge.gl = ctx;
                        window.EAGForge.canvas = this;
                        window.EAGForge.emit("webglInit", ctx);
                    }
                }
                return ctx;
            };
        },

        // Hook keyboard and mouse
        hookInput: function() {
            window.addEventListener("keydown", (e) => {
                if (window.EAGForge) window.EAGForge.emit("keydown", e);
            });

            window.addEventListener("keyup", (e) => {
                if (window.EAGForge) window.EAGForge.emit("keyup", e);
            });
        }
    };
})();
