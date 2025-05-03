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
