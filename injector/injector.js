/**
 * EAG Forge Revamped - Main Injector Logic & Mod Hub
 */

document.addEventListener("DOMContentLoaded", () => {
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

    let clientFile = null;
    let clientHTMLContent = "";
    let detectedVersion = null;
    let availableMods = [];
    let selectedModIds = new Set();

    // 1. Initial Load: Fetch Manifest Immediately so Raw Downloads Work Even Before Uploading Client
    loadManifest();

    async function loadManifest() {
        try {
            const response = await fetch("mods/manifest.json");
            if (!response.ok) throw new Error("Manifest not found");
            availableMods = await response.json();
            renderModList(false); // Render initial view with raw download buttons enabled
        } catch (err) {
            console.warn("[Injector] Could not fetch manifest.json, using built-in defaults:", err);
            availableMods = [
                {
                    id: "eaglerium",
                    name: "Eaglerium (Lithium Math Port)",
                    description: "Fast trigonometry lookup tables, vector memory caching, and physics optimization.",
                    supportedVersions: ["1.8.8", "1.12.2", "1.21.6", "26.2 (WASM)"],
                    file: "mods/eaglerium/eaglerium.js",
                    default: true
                },
                {
                    id: "eagopt",
                    name: "EAGOpt (Frame Pacer & Redundancy Filter)",
                    description: "Smooths frame pacing and eliminates duplicate WebGL texture flips.",
                    supportedVersions: ["1.8.8", "1.12.2", "1.21.6", "26.2 (WASM)"],
                    file: "mods/eagopt/eagopt.js",
                    default: true
                },
                {
                    id: "eagzoom",
                    name: "EAGZoom (OptiFine Camera Zoom)",
                    description: "Hold 'C' in-game for smooth cinematic zoom.",
                    supportedVersions: ["1.8.8", "1.12.2", "1.21.6", "26.2 (WASM)"],
                    file: "mods/eagzoom/eagzoom.js",
                    default: true
                },
                {
                    id: "fullbright",
                    name: "Fullbright (Night Vision Gamma)",
                    description: "Press 'B' in-game to toggle full lighting brightness.",
                    supportedVersions: ["1.8.8", "1.12.2", "1.21.6", "26.2 (WASM)"],
                    file: "mods/fullbright/fullbright.js",
                    default: false
                },
                {
                    id: "workservers",
                    name: "WorkServers (Unblocked Live Hub)",
                    description: "Pre-fills multiplayer list with verified community servers.",
                    supportedVersions: ["1.8.8", "1.12.2", "1.21.6", "26.2 (WASM)"],
                    file: "mods/workservers/workservers.js",
                    default: true
                }
            ];
            renderModList(false);
        }
    }

    // 2. Drag & Drop File Handlers
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

    // 3. File Processing & Version Detection
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
            renderModList(true); // Re-render with version compatibility filtering active
            injectBtn.disabled = false;
        };
        reader.readAsText(file);
    }

    function detectClientVersion(html) {
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
            if (lower.includes(".wasm") || lower.includes("webassembly")) {
                detectedVersion = "Modern (WASM)";
            } else {
                detectedVersion = "1.8.8 (Universal Legacy)";
            }
        }

        detectedVersionText.textContent = `Architecture Detected: ${detectedVersion}`;
    }

    // 4. Mod Catalog Rendering with Direct Raw Download Buttons
    function renderModList(hasUploadedClient) {
        modListContainer.innerHTML = "";
        selectedModIds.clear();

        const modsToDisplay = hasUploadedClient && detectedVersion
            ? availableMods.filter(mod => {
                if (!mod.supportedVersions || mod.supportedVersions.includes("all")) return true;
                return mod.supportedVersions.some(v => detectedVersion.includes(v));
            })
            : availableMods;

        if (modsToDisplay.length === 0) {
            modListContainer.innerHTML = '<div class="mod-placeholder">No addons configured for this client architecture.</div>';
            return;
        }

        modsToDisplay.forEach(mod => {
            const card = document.createElement("div");
            card.className = "mod-card";

            const info = document.createElement("div");
            info.className = "mod-card-info";
            info.innerHTML = `<h4>${mod.name}</h4><p>${mod.description}</p>`;

            const actions = document.createElement("div");
            actions.style.display = "flex";
            actions.style.alignItems = "center";
            actions.style.gap = "12px";

            // Direct Raw Download Link
            const rawDownloadLink = document.createElement("a");
            rawDownloadLink.href = mod.file;
            rawDownloadLink.download = `${mod.id}.js`;
            rawDownloadLink.className = "badge";
            rawDownloadLink.style.textDecoration = "none";
            rawDownloadLink.style.color = "#38bdf8";
            rawDownloadLink.style.borderColor = "#0284c7";
            rawDownloadLink.style.cursor = "pointer";
            rawDownloadLink.textContent = "⬇ Raw .JS";

            // Bundle Checkbox
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.title = "Bundle into client download";
            checkbox.checked = !!mod.default;
            if (checkbox.checked) selectedModIds.add(mod.id);

            checkbox.addEventListener("change", (e) => {
                if (e.target.checked) {
                    selectedModIds.add(mod.id);
                } else {
                    selectedModIds.delete(mod.id);
                }
            });

            actions.appendChild(rawDownloadLink);
            actions.appendChild(checkbox);

            card.appendChild(info);
            card.appendChild(actions);
            modListContainer.appendChild(card);
        });
    }

    // 5. Injection & Client Assembly
    injectBtn.addEventListener("click", async () => {
        if (!clientHTMLContent) return;

        injectBtn.disabled = true;
        progressContainer.classList.remove("hidden");
        updateProgress(20, "Fetching selected mods...");

        const bundledMods = [];

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

        const bootstrapHTML = window.EAG_TEMPLATES.generateBootstrap(detectedVersion, bundledMods);

        let patchedHTML = "";
        if (clientHTMLContent.includes("</body>")) {
            patchedHTML = clientHTMLContent.replace("</body>", `${bootstrapHTML}\n</body>`);
        } else if (clientHTMLContent.includes("</head>")) {
            patchedHTML = clientHTMLContent.replace("</head>", `${bootstrapHTML}\n</head>`);
        } else {
            patchedHTML = clientHTMLContent + "\n" + bootstrapHTML;
        }

        updateProgress(90, "Packaging client blob...");

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

            updateProgress(100, "Done! Modded client downloaded.");
            injectBtn.disabled = false;
        }, 500);
    });

    function updateProgress(percent, text) {
        progressBar.style.width = percent + "%";
        progressText.textContent = text;
    }
});
