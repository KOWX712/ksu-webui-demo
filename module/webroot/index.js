import { exec, spawn, toast } from "./assets/kernelsu.js";

/**
 * ksu.exec demo
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
 * Another ksu.exec demo
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
        toast("KernelSU version:" + version);
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
 * Redirect to a link with am command
 * @param {string} link - The link to redirect in browser
 */
function linkRedirect(link) {
    toast("Redirecting to " + link);
    setTimeout(() => {
        exec(`am start -a android.intent.action.VIEW -d ${link}`, { env: { PATH: '/system/bin' }})
            .then(({ errno }) => {
                if (errno !== 0) toast("Failed to open link");
            });
    },100);
}
window.linkRedirect = linkRedirect;

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

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    checkWebuiX();
    applyRippleEffect();
});
