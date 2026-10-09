/**
 * Imported from https://www.npmjs.com/package/kernelsu
 * Modified version by KOWX712 - https://www.npmjs.com/package/kernelsu-alt
 */

let callbackCounter = 0;
function getUniqueCallbackName(prefix) {
    return `${prefix}_callback_${Date.now()}_${callbackCounter++}`;
}

/**
 * Execute shell command with ksu.exec
 * @param {string} command - The command to execute
 * @param {Object} [options={}] - Options object containing:
 *   - cwd <string> - Current working directory of the child process
 *   - env {Object} - Environment key-value pairs
 * @returns {Promise<Object>} Resolves with:
 *   - errno {number} - Exit code of the command
 *   - stdout {string} - Standard output from the command
 *   - stderr {string} - Standard error from the command
 */
function exec(command, options = {}) {
    return new Promise((resolve, reject) => {
        const callbackFuncName = getUniqueCallbackName("exec");
        window[callbackFuncName] = (errno, stdout, stderr) => {
            resolve({ errno, stdout, stderr });
            cleanup(callbackFuncName);
        };
        function cleanup(successName) {
            delete window[successName];
        }
        try {
            if (typeof ksu !== 'undefined') {
                ksu.exec(command, JSON.stringify(options), callbackFuncName);
            } else {
                resolve({ errno: 1, stdout: "", stderr: "ksu is not defined" });
            }
        } catch (error) {
            reject(error);
            cleanup(callbackFuncName);
        }
    });
}

/**
 * Standard I/O stream for a child process.
 * @class
 */
class Stdio {
    constructor() {
        this.listeners = {};
    }
    on(event, listener) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }
    emit(event, ...args) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(listener => listener(...args));
        }
    }
}

/**
 * Spawn shell process with ksu.spawn
 * @param {string} command - The command to execute
 * @param {string[]} [args=[]] - Array of arguments to pass to the command
 * @param {Object} [options={}] - Options object containing:
 *   - cwd <string> - Current working directory of the child process
 *   - env {Object} - Environment key-value pairs
 * @returns {Object} A child process object with:
 *   - stdout: Stream for standard output
 *   - stderr: Stream for standard error
 *   - stdin: Stream for standard input
 *   - on(event, listener): Attach event listener ('exit', 'error')
 *   - emit(event, ...args): Emit events internally
 */
function spawn(command, args = [], options = {}) {
    const child = {
        listeners: {},
        stdout: new Stdio(),
        stderr: new Stdio(),
        stdin: new Stdio(),
        on(event, listener) {
            if (!this.listeners[event]) this.listeners[event] = [];
            this.listeners[event].push(listener);
        },
        emit(event, ...args) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(listener => listener(...args));
            }
        }
    };
    const callbackName = getUniqueCallbackName("spawn");
    window[callbackName] = child;
    child.on("exit", () => delete window[callbackName]);
    try {
        if (typeof ksu !== 'undefined') {
            ksu.spawn(command, JSON.stringify(args), JSON.stringify(options), callbackName);
        } else {
            setTimeout(() => {
                child.stderr.emit("data", "ksu is not defined");
                child.emit("exit", 1);
            }, 0);
        }
    } catch (error) {
        child.emit("error", error);
        delete window[callbackName];
    }
    return child;
}

/**
 * Request the WebView enter/exit full screen.
 * @param {Boolean} isFullScreen - full screen state
 */
function fullScreen(isFullScreen) {
    if (typeof ksu !== 'undefined') {
        ksu.fullScreen(isFullScreen);
    }
}

/**
 * Added since KernelSU v3.0.0+
 * Renamed from enableInsets to enableEdgeToEdge since KernelSU 32294
 * Request the WebView to set padding to 0 or system bar insets
 * Disabled by default
 * Enabled automatically if there's a request on `internal/insets.css`
 * @param {Boolean} isEnable - insets enable state
 */
function enableEdgeToEdge(isEnable) {
    return new Promise((resolve, reject) => {
        if (typeof ksu !== 'undefined') {
            if (typeof ksu.enableEdgeToEdge === 'function') {
                ksu.enableEdgeToEdge(isEnable);
                resolve(true);
            } else if (typeof ksu.enableInsets === 'function') {
                ksu.enableInsets(isEnable); // Keep legacy support
                resolve(true);
            } else {
                reject(new Error("ksu.enableEdgeToEdge or ksu.enableInsets is not available."));
            }
        } else {
            reject(new Error("ksu is not defined."));
        }
    });
}

/**
 * Show android toast message
 * @param {string} message - The message to display in toast
 * @returns {void}
 */
function toast(message) {
    if (typeof ksu !== 'undefined') {
        ksu.toast(message);
    } else {
        console.log(message);
    }
}

/**
 * Added since KernelSU v2.1.2
 * List installed packages
 * @deprecated Use {@link pm.listPackages} instead (requires ksu.pm).
 * @param {string} [type="all"] - The type of packages to list: "user", "system", or "all".
 * @returns {Promise<string[]>} A promise that resolves to an array of package names.
 */
async function listPackages(type) {
    if (typeof globalThis.ksu?.listPackages === 'function') {
        try {
            return JSON.parse(ksu.listPackages(type));
        } catch (error) {
            // Fallback to pm list package
        }
    }

    return new Promise((resolve, reject) => {
        const pmArgs = {
            all: [],
            user: ['-3'],
            system: ['-s'],
        };

        if (!(type in pmArgs)) {
            return reject(new Error(`Unknown listPackages type: ${type}`));
        }

        let pkgs = [];
        let stderr = '';

        const pm = spawn('pm', ['list', 'packages', ...pmArgs[type]]);
        pm.stdout.on('data', (data) => {
            if (data.trim() !== '') {
                pkgs.push(data.trim().replace(/^package:/, ''));
            }
        });
        pm.stderr.on('data', (data) => (stderr += data));
        pm.on('exit', (code) => {
            if (code !== 0) {
                return reject(new Error(`pm process exited with code ${code}: ${stderr.trim()}`));
            }
            resolve(pkgs);
        });
        pm.on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * @typedef {object} PackagesInfo
 * @property {string} packageName - Package name of the application.
 * @property {string} versionName - Version of the application.
 * @property {number} versionCode - Version code of the application.
 * @property {string} appLabel - Display name of the application.
 * @property {boolean} isSystem - Whether the application is a system app.
 * @property {number} uid - UID of the application.
 */

/**
 * Added since KernelSU v2.1.2
 * Retrieves detailed information for one or more packages.
 * @deprecated Use {@link pm.getPackagesInfo} instead (requires ksu.pm).
 * @param {string|string[]} pkg - A single package name or an array of package names.
 * @returns {Promise<PackagesInfo|PackagesInfo[]>} Resolves with:
 *   - a single package information object if one package is provided
 *   - {}
 *   - an array of package information objects if multiple packages are provided
 *   - [{},{}]
 */
function getPackagesInfo(pkg) {
    return new Promise((resolve, reject) => {
        if (!pkg) {
            return resolve([]);
        }

        if (typeof globalThis.ksu?.getPackagesInfo !== 'function') {
            return reject(new Error("ksu.getPackagesInfo is not available."));
        }

        const pkgs = Array.isArray(pkg) ? pkg : [pkg];
        if (pkgs.length === 0) {
            return resolve([]);
        }

        try {
            const infoJson = ksu.getPackagesInfo(JSON.stringify(pkgs));
            const result = JSON.parse(infoJson);
            
            if (!Array.isArray(pkg) && result.length === 1) {
                resolve(result[0]);
            } else {
                resolve(result);
            }
        } catch (error) {
            reject(new Error(`Failed to get package info: ${error.message}`));
        }
    });
}

/**
 * Package manager APIs added by KernelSU's modern WebUI Package Manager API.
 * Synchronous, unlike the deprecated top-level listPackages/getPackagesInfo.
 */
const pm = {
    get support() {
        return typeof globalThis.ksu?.pm === 'function';
    },

    listPackages(type) {
        try {
            return JSON.parse(globalThis.ksu.pm().listPackages(type) || '[]');
        } catch {
            return [];
        }
    },

    /**
     * @param {string[]} packages - Array of package names.
     * @returns {Array<PackagesInfo & {userId: number|null} | {packageName: string, error: string}>}
     *   Package entries (with userId, nullable isSystem/uid) or per-package error entries.
     */
    getPackagesInfo(packages) {
        try {
            const payload = typeof packages === 'string' ? packages : JSON.stringify(packages);
            return JSON.parse(globalThis.ksu.pm().getPackagesInfo(payload) || '[]');
        } catch {
            return [];
        }
    },
};

/**
 * Root-backed file system APIs added by KernelSU's modern WebUI File API.
 */
const io = {
    get support() {
        return typeof globalThis.ksu?.io === 'function';
    },

    File(path) {
        const impl = globalThis.ksu.io().File(path);
        return {
            exists() { return impl.exists(); },
            isFile() { return impl.isFile(); },
            isDirectory() { return impl.isDirectory(); },
            canRead() { return impl.canRead(); },
            canWrite() { return impl.canWrite(); },
            canExecute() { return impl.canExecute(); },
            createNewFile() { return impl.createNewFile(); },
            delete() { return impl.delete(); },
            deleteRecursive() { return impl.deleteRecursive(); },
            mkdir() { return impl.mkdir(); },
            mkdirs() { return impl.mkdirs(); },
            renameTo(destPath) { return impl.renameTo(destPath); },
            list() {
                try {
                    return JSON.parse(impl.list() || '[]');
                } catch {
                    return [];
                }
            },
            listFiles() {
                try {
                    return JSON.parse(impl.listFiles() || '[]');
                } catch {
                    return [];
                }
            },
            length() { return impl.length(); },
            lastModified() { return impl.lastModified(); },
            setLastModified(time) { return impl.setLastModified(time); },
            getAbsolutePath() { return impl.getAbsolutePath(); },
            getCanonicalPath() { return impl.getCanonicalPath(); },
            getParent() { return impl.getParent(); },
            getPath() { return impl.getPath(); },
            getName() { return impl.getName(); },
            isHidden() { return impl.isHidden(); },
            isBlock() { return impl.isBlock(); },
            isCharacter() { return impl.isCharacter(); },
            isSymlink() { return impl.isSymlink(); },
            createNewSymlink(target) { return impl.createNewSymlink(target); },
            createNewLink(existing) { return impl.createNewLink(existing); },
            clear() { return impl.clear(); },
            setReadOnly() { return impl.setReadOnly(); },
            setReadable(readable, ownerOnly) { return impl.setReadable(readable, ownerOnly); },
            setWritable(writable, ownerOnly) { return impl.setWritable(writable, ownerOnly); },
            setExecutable(executable, ownerOnly) { return impl.setExecutable(executable, ownerOnly); },
            getFreeSpace() { return impl.getFreeSpace(); },
            getTotalSpace() { return impl.getTotalSpace(); },
            getUsableSpace() { return impl.getUsableSpace(); },
            newInputStream() { return impl.newInputStream(); },
            newOutputStream(append) { return append === undefined ? impl.newOutputStream() : impl.newOutputStream(append); },
            toString() { return impl.toString(); },
        };
    },

    FileInputStream() {
        const impl = globalThis.ksu.io().FileInputStream();
        return {
            open(path) { return impl.open(path); },
            read(id, maxBytes) { return maxBytes === undefined ? impl.read(id) : impl.read(id, maxBytes); },
            available(id) { return impl.available(id); },
            close(id) { return impl.close(id); },
        };
    },

    FileOutputStream() {
        const impl = globalThis.ksu.io().FileOutputStream();
        return {
            open(path, append) { return append === undefined ? impl.open(path) : impl.open(path, append); },
            write(id, base64) { return impl.write(id, base64); },
            writeByte(id, byte) { return impl.writeByte(id, byte); },
            flush(id) { return impl.flush(id); },
            close(id) { return impl.close(id); },
        };
    },

    RandomAccessFile() {
        const impl = globalThis.ksu.io().RandomAccessFile();
        return {
            open(path, mode) { return impl.open(path, mode); },
            read(id) { return impl.read(id); },
            readBytes(id, length) { return impl.readBytes(id, length); },
            readBoolean(id) { return impl.readBoolean(id); },
            readByte(id) { return impl.readByte(id); },
            readInt(id) { return impl.readInt(id); },
            readLong(id) { return impl.readLong(id); },
            readShort(id) { return impl.readShort(id); },
            readFloat(id) { return impl.readFloat(id); },
            readDouble(id) { return impl.readDouble(id); },
            readUTF(id) { return impl.readUTF(id); },
            readLine(id) { return impl.readLine(id); },
            write(id, byte) { impl.write(id, byte); },
            writeBase64(id, base64) { impl.writeBase64(id, base64); },
            writeBoolean(id, value) { impl.writeBoolean(id, value); },
            writeByte(id, value) { impl.writeByte(id, value); },
            writeInt(id, value) { impl.writeInt(id, value); },
            writeLong(id, value) { impl.writeLong(id, value); },
            writeShort(id, value) { impl.writeShort(id, value); },
            writeFloat(id, value) { impl.writeFloat(id, value); },
            writeDouble(id, value) { impl.writeDouble(id, value); },
            writeUTF(id, value) { impl.writeUTF(id, value); },
            seek(id, position) { return impl.seek(id, position); },
            getFilePointer(id) { return impl.getFilePointer(id); },
            length(id) { return impl.length(id); },
            setLength(id, length) { return impl.setLength(id, length); },
            close(id) { return impl.close(id); },
        };
    },
};

export { exec, spawn, fullScreen, enableEdgeToEdge, toast, listPackages, getPackagesInfo, pm, io };
