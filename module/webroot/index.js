import { exec, spawn, toast, enableEdgeToEdge, listPackages, getPackagesInfo } from "./assets/kernelsu.js";

let insetState = true;

/**
 * async ksu.exec demo
 * suitable for short command, short response
 * example: grep -q
 * @returns {Promise<void>}
 */
async function checkMagisk() {
    const { errno, stdout, stderr } = await exec("magisk -V", { env: { PATH: '/data/adb/magisk' }});
    if (errno === 0) {
        toast("Magisk version: " + stdout);
    } else {
        toast("Not Magisk");
        console.error("Error:", stderr);
    }
}
window.checkMagisk = checkMagisk;

/**
 * ksu.exec demo
 * @returns {void}
 */
function checkApatch() {
    exec("apd -V", { env: { PATH: '/data/adb/ap/bin' }})
        .then(({ errno, stdout }) => {
            if (errno === 0) {
                toast("APatch version: " + stdout);
            } else {
                toast("Not APatch");
            }
        })
}
window.checkApatch = checkApatch;

/**
 * ksu.spawn demo
 * suitable for long command, long response, especially executing a shell script with multiple lines and outputs
 * example: sh script.sh
 * @returns {void}
 */
function checkKernelSU() {
    // Run ksud -V
    const output = spawn("ksud", ['debug', 'version'], { env: { PATH: '/data/adb/ksu/bin' }});
    output.stdout.on('data', (data) => {
        const version = data.split(':')[1].trim();
        toast("KernelSU version: " + version);
    });
    output.stderr.on('data', (data) => {
        console.error("Error:", data);
    });
    output.on('exit', (code) => {
        if (code !== 0) {
            toast("Not KernelSU");
        }
    });
}
window.checkKernelSU = checkKernelSU;

/**
 * Redirect to a link with am command / window.open
 * @param {string} link - The link to redirect in browser
 * @returns {void}
 */
function linkRedirect(link) {
    toast("Redirecting to " + link);
    setTimeout(() => {
        exec(`am start -a android.intent.action.VIEW -d ${link}`, { env: { PATH: '/system/bin' }})
            .then(({ errno }) => {
                if (errno !== 0) {
                    toast("Failed to open link with exec");
                    window.open(link, "_blank");
                }
            });
    }, 100);
}
window.linkRedirect = linkRedirect;

/**
 * Show or hide inset area hint
 * @returns {void}
 */
function toggleInsetHint() {
    document.querySelectorAll('.inset-demo').forEach(el => {
        el.classList.toggle('hide');
    });
}
window.toggleInsetHint = toggleInsetHint;

/**
 * Enable or disable Inset support
 * @returns {void}
 */
async function toggleInset() {
    insetState = !insetState;
    const result = await enableEdgeToEdge(insetState);
    if (result) {
        document.documentElement.style.setProperty('--inset-top', insetState ? 'var(--window-inset-top)' : '0px');
        document.documentElement.style.setProperty('--inset-bottom', insetState ? 'var(--window-inset-bottom)' : '0px');
    } else {
        toast("unsupported");
    }
}
window.toggleInset = toggleInset;

/**
 * Load and display packages in the PM container
 * @returns {Promise<void>}
 */
async function loadPackages() {
    const container = document.querySelector('.pm-container');

    try {
        const packages = await listPackages();
        const packageInfos = await getPackagesInfo(packages);

        const table = document.createElement('table');
        table.className = 'pm-table';
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Icon</th>
                <th>App Info</th>
                <th>Type</th>
                <th>UID</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        packageInfos.forEach(pkg => {
            const row = document.createElement('tr');

            // Icon column with lazy loading
            const iconCell = document.createElement('td');
            const img = document.createElement('img');
            img.className = 'app-icon';
            img.dataset.src = `ksu://icon/${pkg.packageName}`;
            img.loading = 'lazy';
            iconCell.appendChild(img);
            row.appendChild(iconCell);

            // App info column
            const infoCell = document.createElement('td');
            infoCell.className = 'app-info';
            infoCell.innerHTML = `
                <div class="app-label">${pkg.appLabel}</div>
                <div class="package-name">${pkg.packageName}</div>
                <div class="version">${pkg.versionName} (${pkg.versionCode})</div>
            `;
            row.appendChild(infoCell);

            // Type column
            const typeCell = document.createElement('td');
            typeCell.className = `app-type ${pkg.isSystem ? 'system' : 'user'}`;
            typeCell.textContent = pkg.isSystem ? 'system' : 'user';
            row.appendChild(typeCell);

            // UID column
            const uidCell = document.createElement('td');
            uidCell.className = 'app-uid';
            uidCell.textContent = pkg.uid;
            row.appendChild(uidCell);

            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        container.innerHTML = '';
        container.appendChild(table);

        // Setup lazy loading for icons
        setupIconLazyLoading();
    } catch (error) {
        console.error('Error loading packages:', error);
        container.innerHTML = '<div class="pm-error">Error loading packages</div>';
    }
}

/**
 * Setup IntersectionObserver for lazy loading app icons
 * @returns {void}
 */
function setupIconLazyLoading() {
    const images = document.querySelectorAll('.app-icon[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '100px',
        threshold: 0.1
    });
    images.forEach(img => {
        img.classList.add('lazy');
        imageObserver.observe(img);
    });
}

/**
 * Check if running on WebUI X
 * more reference on https://mmrl.dev/guide/webuix/sanitized-ids
 * @returns {Promise<void>}
 */
async function checkWebuiX() {
    if (Object.keys($ksuwebui_demo).length > 0) {
        console.log("Running on WebUI X");

        // Set status bar theme based on webui theme
        $ksuwebui_demo.setLightStatusBars(!$ksuwebui_demo.isDarkMode());
    }
}

/**
 * Simulate MD3 ripple animation
 * Usage: class="ripple-element" style="position: relative; overflow: hidden;"
 * Note: Require background-color to work properly
 * @return {void}
 */
function applyRippleEffect() {
    document.querySelectorAll('.ripple-element').forEach(element => {
        if (element.dataset.rippleListener !== "true") {
            element.addEventListener("pointerdown", async (event) => {
                // Pointer up event
                const handlePointerUp = () => {
                    ripple.classList.add("end");
                    setTimeout(() => {
                        ripple.classList.remove("end");
                        ripple.remove();
                    }, duration * 1000);
                    element.removeEventListener("pointerup", handlePointerUp);
                    element.removeEventListener("pointercancel", handlePointerUp);
                };
                element.addEventListener("pointerup", () => setTimeout(handlePointerUp, 80));
                element.addEventListener("pointercancel", () => setTimeout(handlePointerUp, 80));

                const ripple = document.createElement("span");
                ripple.classList.add("ripple");

                // Calculate ripple size and position
                const rect = element.getBoundingClientRect();
                const width = rect.width;
                const size = Math.max(rect.width, rect.height);
                const x = event.clientX - rect.left - size / 2;
                const y = event.clientY - rect.top - size / 2;

                // Determine animation duration
                let duration = 0.2 + (width / 800) * 0.4;
                duration = Math.min(0.8, Math.max(0.2, duration));

                // Set ripple styles
                ripple.style.width = ripple.style.height = `${size}px`;
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                ripple.style.animationDuration = `${duration}s`;
                ripple.style.transition = `opacity ${duration}s ease`;

                // Adaptive color
                const computedStyle = window.getComputedStyle(element);
                const bgColor = computedStyle.backgroundColor || "rgba(0, 0, 0, 0)";
                const isDarkColor = (color) => {
                    const rgb = color.match(/\d+/g);
                    if (!rgb) return false;
                    const [r, g, b] = rgb.map(Number);
                    return (r * 0.299 + g * 0.587 + b * 0.114) < 96; // Luma formula
                };
                ripple.style.backgroundColor = isDarkColor(bgColor) ? "rgba(255, 255, 255, 0.2)" : "";

                // Append ripple if not scrolling
                await new Promise(resolve => setTimeout(resolve, 80));
                if (isScrolling) return;
                element.appendChild(ripple);
            });
            element.dataset.rippleListener = "true";
        }
    });
}

// Scroll event
let isScrolling = false, scrollTimeout;
window.addEventListener('scroll', () => {
    isScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => isScrolling = false, 200);
});

/**
 * Setup file upload demo with simulated progress
 * @returns {void}
 */
function setupFileUpload() {
    const fileInput = document.getElementById('fileUpload');
    const fileInfo = document.getElementById('fileInfo');
    const progressContainer = document.getElementById('uploadProgress');
    const progressFill = progressContainer.querySelector('.progress-fill');
    const progressText = document.getElementById('progressText');

    if (!fileInput || !progressContainer) return;

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) {
            fileInfo.textContent = 'No file selected';
            return;
        }

        fileInfo.textContent = file.name + " | ";
        progressContainer.classList.remove('hide');
        progressFill.style.width = '0%';
        progressText.textContent = '0%';

        const totalSize = file.size;
        let offset = 0;
        const chunkSize = 1024 * 1024; // 1MB chunks
        const reader = new FileReader();

        while (offset < totalSize) {
            const blob = file.slice(offset, offset + chunkSize);
                await new Promise((resolve, reject) => {
                reader.onload = (e) => {
                    const bytesRead = e.target.result.byteLength;
                    offset += bytesRead;
                    const percent = Math.min(100, Math.round((offset / totalSize) * 100));
                    
                    progressFill.style.width = `${percent}%`;
                    progressText.textContent = `${percent}% (${(offset / 1024 / 1024).toFixed(2)} / ${(totalSize / 1024 / 1024).toFixed(2)} MB)`;
                    resolve();
                };
                reader.onerror = () => {
                    toast("Error reading file");
                    reject(new Error("File read error"));
                };
                reader.readAsArrayBuffer(blob);
            });

            if (totalSize < 50 * 1024 * 1024) {
                await new Promise(r => setTimeout(r, 50));
            }
        }

        setTimeout(() => {
            fileInput.value = '';
        }, 2000);
    });
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    checkWebuiX();
    applyRippleEffect();
    loadPackages();
    setupFileUpload();
});
