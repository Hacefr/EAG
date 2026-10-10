/**
 * EAG Forge Revamped - Main Injector Logic
 */

document.addEventListener("DOMContentLoaded", () => {
    // UI Elements
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("clientFileInput");
    const clientStatus = document.getElementById("clientStatus");
    const detectedClientName = document.getElementById("detectedClientName");
    const detectedVersionText = document.getElementById("detectedVersionText");
    const modListContainer = document.getElementById("modListContainer");
    const injectBtn = document.getElementById("injectBtn");
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");

    // State
    let clientFile = null;
    let clientHTMLContent = "";
    let detectedVersion = null;
    let availableMods = [];
    let selectedModIds = new Set();

    // 1. File Upload & Drag-and-Drop Handlers
    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // 2. Read and Analyze the Uploaded Client
    function handleFileSelect(file) {
        if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
            alert("Please upload a valid .html or .htm Eaglercraft client.");
            return;
        }

        clientFile = file;
        detectedClientName.textContent = file.name;
        detectedVersionText.textContent = "Analyzing client architecture...";
        clientStatus.classList.remove("hidden");

        const reader = new FileReader();
        reader.onload = function(e) {
            clientHTMLContent = e.target.result;
            detectClientVersion(clientHTMLContent);
            loadManifestAndRenderMods();
            injectBtn.disabled = false;
        };
        reader.readAsText(file);
    }

    // 3. Version Detection Heuristics
    function detectClientVersion(html) {
        // Look for signature markers in the HTML content
        const lower = html.toLowerCase();

        if (lower.includes("eymenwsmc") || lower.includes("1.21")) {
            detectedVersion = "1.21.6";
        } else if (lower.includes("o_xer") || lower.includes("26.2")) {
            detectedVersion = "26.2 (WASM)";
        } else if (lower.includes("1.12.2") || lower.includes("1.12")) {
            detectedVersion = "1.12.2";
        } else if (lower.includes("1.8.8") || lower.includes("teavm") || lower.includes("lax1dude")) {
            detectedVersion = "1.8.8";
        } else {
            // Default fallback if modern WASM markers are detected
            if (lower.includes(".wasm") || lower.includes("webassembly")) {
                detectedVersion = "Modern (WASM)";
            } else {
                detectedVersion = "1.8.8 (Universal Legacy)";
            }
        }

        detectedVersionText.textContent = `Architecture Detected: ${detectedVersion}`;
    }

    // 4. Fetch Mod Manifest and Populate Checklist
    async function loadManifestAndRenderMods() {
        modListContainer.innerHTML = '<div class="mod-placeholder">Loading available addons...</div>';

        try {
            const response = await fetch("mods/manifest.json");
            if (!response.ok) throw new Error("Manifest not found");
            availableMods = await response.json();
        } catch (err) {
            console.warn("[Injector] Could not fetch manifest.json, using built-in defaults:", err);
            // Default fallback mods if running locally without a web server
            availableMods = [
                {
                    id: "eaglerium",
                    name: "Eaglerium (Lithium Math Port)",
                    description: "Optimizes physics, tick rate, and pathfinding math to boost FPS.",
                    supportedVersions: ["1.8.8", "1.12.2", "1.21.6", "26.2 (WASM)"],
                    file: "mods/eaglerium/eaglerium.js",
                    default: true
                },
                {
                    id: "workservers",
                    name: "WorkServers (Unblocked Live List)",
                    description: "Pre-fills multiplayer with verified, unblocked community servers.",
                    supportedVersions: ["1.8.8", "1.12.2", "1.21.6", "26.2 (WASM)"],
                    file: "mods/workservers/workservers.js",
                    default: true
                }
            ];
        }

        renderModList();
    }

    function renderModList() {
        modListContainer.innerHTML = "";
        selectedModIds.clear();

        // Filter mods compatible with the detected version
        const compatibleMods = availableMods.filter(mod => {
            if (!mod.supportedVersions || mod.supportedVersions.includes("all")) return true;
            return mod.supportedVersions.some(v => detectedVersion.includes(v));
        });

        if (compatibleMods.length === 0) {
            modListContainer.innerHTML = '<div class="mod-placeholder">No specific pre-baked mods found for this version. The client will still be injected with EAG Forge Revamped!</div>';
            return;
        }

        compatibleMods.forEach(mod => {
            const card = document.createElement("div");
            card.className = "mod-card";

            const info = document.createElement("div");
            info.className = "mod-card-info";
            info.innerHTML = `<h4>${mod.name}</h4><p>${mod.description}</p>`;

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = !!mod.default;
            if (checkbox.checked) selectedModIds.add(mod.id);

            checkbox.addEventListener("change", (e) => {
                if (e.target.checked) {
                    selectedModIds.add(mod.id);
                } else {
                    selectedModIds.delete(mod.id);
                }
            });

            card.appendChild(info);
            card.appendChild(checkbox);
            modListContainer.appendChild(card);
        });
    }

    // 5. Injection & Download Action
    injectBtn.addEventListener("click", async () => {
        if (!clientHTMLContent) return;

        injectBtn.disabled = true;
        progressContainer.classList.remove("hidden");
        updateProgress(20, "Fetching selected mods...");

        const bundledMods = [];

        // Fetch selected mod codes
        for (const modId of selectedModIds) {
            const mod = availableMods.find(m => m.id === modId);
            if (mod && mod.file) {
                try {
                    const res = await fetch(mod.file);
                    if (res.ok) {
                        const code = await res.text();
                        bundledMods.push({ id: mod.id, name: mod.name, code: code });
                    }
                } catch (e) {
                    console.warn(`[Injector] Could not fetch code for mod ${mod.name}, skipping bundle.`);
                }
            }
        }

        updateProgress(60, "Splicing EAG Forge Revamped harness...");

        // Generate bootstrap snippet
        const bootstrapHTML = window.EAG_TEMPLATES.generateBootstrap(detectedVersion, bundledMods);

        // Inject before </head>, </body>, or at the end
        let patchedHTML = "";
        if (clientHTMLContent.includes("</body>")) {
            patchedHTML = clientHTMLContent.replace("</body>", `${bootstrapHTML}\n</body>`);
        } else if (clientHTMLContent.includes("</head>")) {
            patchedHTML = clientHTMLContent.replace("</head>", `${bootstrapHTML}\n</head>`);
        } else {
            patchedHTML = clientHTMLContent + "\n" + bootstrapHTML;
        }

        updateProgress(90, "Packaging client blob...");

        // Trigger automatic download
        setTimeout(() => {
            const blob = new Blob([patchedHTML], { type: "text/html;charset=utf-8" });
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const cleanName = clientFile.name.replace(/\.[^/.]+$/, "");
            a.href = downloadUrl;
            a.download = `${cleanName}-EAGForge-Revamped.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            updateProgress(100, "Done! Downloading your modded client.");
            injectBtn.disabled = false;
        }, 500);
    });

    function updateProgress(percent, text) {
        progressBar.style.width = percent + "%";
        progressText.textContent = text;
    }
});
