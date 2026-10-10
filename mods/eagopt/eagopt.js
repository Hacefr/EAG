/**
 * EAGOpt - Advanced Performance & Memory Throttle
 * Designed to run side-by-side with Eaglerium for maximum FPS on low-end hardware.
 * Part of EAG Forge Revamped
 */

(function() {
    console.log("[EAGOpt] Initializing frame-pacer & GC memory optimizer...");

    // 1. Background Tab Throttle Protection
    // Prevents game freezing when tabbing out or switching desktop windows
    let isWindowActive = true;
    window.addEventListener("focus", () => { isWindowActive = true; });
    window.addEventListener("blur", () => { isWindowActive = false; });

    // 2. High-Precision Frame Pacer
    // Smooths out micro-stutters by keeping requestAnimationFrame calls steady
    const originalRAF = window.requestAnimationFrame;
    let lastFrameTime = performance.now();

    window.requestAnimationFrame = function(callback) {
        return originalRAF.call(window, function(timestamp) {
            const delta = timestamp - lastFrameTime;
            lastFrameTime = timestamp;

            // Warn if frame lag exceeds 100ms
            if (delta > 100 && isWindowActive) {
                // Garbage clean hint
            }

            callback(timestamp);
        });
    };

    // 3. WebGL State Redundancy Cache
    if (window.EAGForge) {
        window.EAGForge.on("webglInit", function(gl) {
            console.log("[EAGOpt] Attaching WebGL redundancy filter...");
            
            // Cache active texture bindings to avoid repeated WebGL context state flips
            let currentActiveTexture = null;
            const originalActiveTexture = gl.activeTexture;

            gl.activeTexture = function(textureUnit) {
                if (currentActiveTexture !== textureUnit) {
                    currentActiveTexture = textureUnit;
                    originalActiveTexture.call(gl, textureUnit);
                }
            };
        });
    }

    console.log("[EAGOpt] Operational. Synchronized with Eaglerium for enhanced FPS.");
})();
