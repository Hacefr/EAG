/**
 * Fullbright - Universal Gamma & Brightness Enhancer
 * Part of EAG Forge Revamped
 */

(function() {
    console.log("[Fullbright] Initializing gamma enhancement module...");

    let isFullbright = false;

    function toggleFullbright() {
        const canvas = window.EAGForge && window.EAGForge.canvas 
            ? window.EAGForge.canvas 
            : document.querySelector("canvas");

        if (!canvas) return;

        isFullbright = !isFullbright;

        if (isFullbright) {
            canvas.style.filter = "brightness(2.2) contrast(1.05)";
            console.log("[Fullbright] Status: ENABLED (Night Vision Active)");
            if (window.EAGForge && window.EAGForge.displayToChat) {
                window.EAGForge.displayToChat("§a[Fullbright] Enabled");
            }
        } else {
            canvas.style.filter = "none";
            console.log("[Fullbright] Status: DISABLED (Vanilla Lighting)");
            if (window.EAGForge && window.EAGForge.displayToChat) {
                window.EAGForge.displayToChat("§c[Fullbright] Disabled");
            }
        }
    }

    window.addEventListener("keydown", function(e) {
        // Press 'B' to toggle Fullbright
        if (e.code === "KeyB") {
            if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
                toggleFullbright();
            }
        }
    });

    console.log("[Fullbright] Loaded. Press 'B' in-game to toggle Night Vision.");
})();
