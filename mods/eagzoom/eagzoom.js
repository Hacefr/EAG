/**
 * EAGZoom - OptiFine-Style Smooth Camera Zoom
 * Part of EAG Forge Revamped
 */

(function() {
    console.log("[EAGZoom] Initializing OptiFine zoom module...");

    let isZooming = false;
    let currentScale = 1.0;
    const TARGET_ZOOM = 3.0; // 3x zoom factor
    const ZOOM_SPEED = 0.2; // Transition smoothness

    let animationFrame = null;

    function applyZoom() {
        const canvas = window.EAGForge && window.EAGForge.canvas 
            ? window.EAGForge.canvas 
            : document.querySelector("canvas");

        if (!canvas) return;

        if (isZooming) {
            currentScale += (TARGET_ZOOM - currentScale) * ZOOM_SPEED;
            if (currentScale > TARGET_ZOOM - 0.01) currentScale = TARGET_ZOOM;
        } else {
            currentScale += (1.0 - currentScale) * ZOOM_SPEED;
            if (currentScale < 1.01) currentScale = 1.0;
        }

        canvas.style.transformOrigin = "center center";
        canvas.style.transform = `scale(${currentScale.toFixed(3)})`;

        if ((isZooming && currentScale < TARGET_ZOOM) || (!isZooming && currentScale > 1.0)) {
            animationFrame = requestAnimationFrame(applyZoom);
        } else {
            animationFrame = null;
        }
    }

    function startZoom() {
        if (!isZooming) {
            isZooming = true;
            if (!animationFrame) animationFrame = requestAnimationFrame(applyZoom);
        }
    }

    function stopZoom() {
        if (isZooming) {
            isZooming = false;
            if (!animationFrame) animationFrame = requestAnimationFrame(applyZoom);
        }
    }

    // Key Listeners
    window.addEventListener("keydown", function(e) {
        if (e.code === "KeyC") {
            // Don't trigger zoom while typing in chat or text inputs
            if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
                startZoom();
            }
        }
    });

    window.addEventListener("keyup", function(e) {
        if (e.code === "KeyC") {
            stopZoom();
        }
    });

    console.log("[EAGZoom] Loaded. Hold 'C' in-game to zoom.");
})();
