/**
 * WorkServers - Live Unblocked Server & Relay Hub
 * Pre-populates the multiplayer server list with working community servers.
 * Part of EAG Forge Revamped.
 */

(function() {
    console.log("[WorkServers] Initializing unblocked community server list...");

    // Default verified working servers list
    const VERIFIED_SERVERS = [
        {
            name: "§aAyunboom SMP",
            addr: "wss://mc.ayunboom.org:443/"
        },
        {
            name: "§bEaglercraft Vanilla Hub",
            addr: "wss://reading-gs.hotcorn-ais5080.workers.dev/"
        },
        {
            name: "§6Asspull Network",
            addr: "wss://eagler.asspull.org/"
        },
        {
            name: "§eArchMC (Practice/PvP)",
            addr: "wss://web.arch.lol/"
        }
    ];

    // Inject verified servers into browser localStorage
    function injectServerList() {
        try {
            const STORAGE_KEY = "eaqlercraft_servers";
            const currentData = localStorage.getItem(STORAGE_KEY);
            let serverList = [];

            if (currentData) {
                try {
                    serverList = JSON.parse(currentData);
                } catch (e) {
                    serverList = [];
                }
            }

            let addedCount = 0;
            VERIFIED_SERVERS.forEach(function(verified) {
                const alreadyExists = serverList.some(function(s) {
                    return s.addr === verified.addr;
                });

                if (!alreadyExists) {
                    serverList.push(verified);
                    addedCount++;
                }
            });

            if (addedCount > 0) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(serverList));
                console.log("[WorkServers] Added " + addedCount + " verified servers to the multiplayer list.");
            } else {
                console.log("[WorkServers] All verified servers are already in your list.");
            }
        } catch (err) {
            console.error("[WorkServers] Could not write to localStorage:", err);
        }
    }

    // Run injection when DOM is ready
    if (document.readyState === "complete" || document.readyState === "interactive") {
        injectServerList();
    } else {
        window.addEventListener("DOMContentLoaded", injectServerList);
    }
})();
