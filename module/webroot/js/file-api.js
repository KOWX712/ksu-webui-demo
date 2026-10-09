import { io, toast } from '../assets/kernelsu.js';
import { actionButton, renderPage } from './utils.js';

const DEFAULT_PATH = '/data/adb/ksu-file-api-demo.txt';
const DEFAULT_RANDOM_ACCESS_PATH = '/data/adb/ksu-random-access-demo.bin';

const supportCode = `
import { io, toast } from 'kernelsu';

// Check whether the File API is available before using it
if (io.support) {
    toast('supported');
} else {
    toast('unavailable');
}
`;

const fileCode = `
import { io } from 'kernelsu';

const file = io.File('/data/adb/modules');

const result = {
    path: file.getPath(),
    name: file.getName(),
    parent: file.getParent(),
    absolutePath: file.getAbsolutePath(),
    canonicalPath: file.getCanonicalPath(),
    exists: file.exists(),
    isFile: file.isFile(),
    isDirectory: file.isDirectory(),
    isHidden: file.isHidden(),
    isSymlink: file.isSymlink(),
    canRead: file.canRead(),
    canWrite: file.canWrite(),
    canExecute: file.canExecute(),
    length: file.length(),
    lastModified: file.lastModified(),
    freeSpace: file.getFreeSpace(),
    totalSpace: file.getTotalSpace(),
    usableSpace: file.getUsableSpace(),
};
if (result.isDirectory) result.entries = file.listFiles().slice(0, 20);
console.log(result);
`;

const outputCode = `
import { io } from 'kernelsu';

const writer = io.FileOutputStream();
const id = writer.open('/data/adb/ksu-file-api-demo.txt');
if (!id || !writer.write(id, btoa('Hello from KernelSU!'))) {
    throw new Error('Failed to write file');
}
writer.flush(id);
writer.close(id);
`;

const inputCode = `
import { io } from 'kernelsu';

const reader = io.FileInputStream();
const id = reader.open('/data/adb/ksu-file-api-demo.txt');
if (!id) throw new Error('Failed to open file');

let text = '';
let chunk;
while ((chunk = reader.read(id, 8192)) !== '') text += atob(chunk);
reader.close(id);
console.log(text);
`;

const randomAccessCode = `
import { io } from 'kernelsu';

const random = io.RandomAccessFile();
const id = random.open('/data/adb/ksu-random-access-demo.bin', 'rw');
if (!id) throw new Error('Failed to open file');

random.seek(id, 16);
random.writeBase64(id, btoa('KernelSU'));
random.seek(id, 16);
const text = atob(random.readBytes(id, 8));
random.close(id);
console.log(text);
`;

function createControl({ label, value, type = 'text', checked = false }) {
    const wrapper = document.createElement('label');
    wrapper.className = type === 'checkbox' ? 'file-api-checkbox' : 'file-api-field';
    const text = document.createElement('span');
    text.textContent = label;
    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    input.checked = checked;
    wrapper.append(text, input);
    return { wrapper, input };
}

function createDemo({ controls, buttonLabel, onRun }) {
    const container = document.createElement('div');
    container.className = 'file-api-demo';
    const form = document.createElement('div');
    form.className = 'file-api-controls';
    const output = document.createElement('pre');
    output.className = 'file-api-output';
    output.textContent = 'Run the demo to see its result.';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn ripple-element';
    button.textContent = buttonLabel;

    controls.forEach(control => form.appendChild(control.wrapper));
    button.addEventListener('click', async () => {
        button.disabled = true;
        try {
            const result = await onRun();
            output.textContent = JSON.stringify(result, null, 2);
            toast('File API demo completed');
        } catch (error) {
            console.error(error);
            output.textContent = error.message;
            toast(error.message);
        } finally {
            button.disabled = false;
        }
    });
    container.append(form, button, output);
    return container;
}

function requirePath(value) {
    const path = value.trim();
    if (!path) throw new Error('A path is required');
    return path;
}

function encodeBase64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary);
}

function decodeBase64(value) {
    const binary = atob(value);
    return new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
}

function ensureParentDirectory(path) {
    const separator = path.lastIndexOf('/');
    if (separator <= 0) return;

    const parent = io.File(path.slice(0, separator));
    if (!parent.exists() && !parent.mkdirs()) {
        throw new Error(`Failed to create parent directory: ${parent.getPath()}`);
    }
}

function safeCall(action, fallback) {
    try {
        return action();
    } catch {
        return fallback;
    }
}

function inspectFile(path) {
    const file = io.File(path);
    const result = {
        path: safeCall(() => file.getPath(), path),
        name: safeCall(() => file.getName(), null),
        parent: safeCall(() => file.getParent(), null),
        absolutePath: safeCall(() => file.getAbsolutePath(), null),
        canonicalPath: safeCall(() => file.getCanonicalPath(), null),
        exists: safeCall(() => file.exists(), false),
        isFile: safeCall(() => file.isFile(), false),
        isDirectory: safeCall(() => file.isDirectory(), false),
        isHidden: safeCall(() => file.isHidden(), false),
        isSymlink: safeCall(() => file.isSymlink(), false),
        canRead: safeCall(() => file.canRead(), false),
        canWrite: safeCall(() => file.canWrite(), false),
        canExecute: safeCall(() => file.canExecute(), false),
        length: safeCall(() => file.length(), null),
        lastModified: safeCall(() => file.lastModified(), null),
        freeSpace: safeCall(() => file.getFreeSpace(), null),
        totalSpace: safeCall(() => file.getTotalSpace(), null),
        usableSpace: safeCall(() => file.getUsableSpace(), null),
    };

    if (result.isDirectory) result.entries = safeCall(() => file.listFiles().slice(0, 20), []);
    return result;
}

function createFileDemo() {
    const path = createControl({ label: 'Path', value: '/data/adb/modules' });
    return createDemo({
        controls: [path],
        buttonLabel: 'Inspect path',
        onRun: () => inspectFile(requirePath(path.input.value)),
    });
}

function createOutputDemo() {
    const path = createControl({ label: 'Target path', value: DEFAULT_PATH });
    const text = createControl({ label: 'Text to write', value: 'Hello from KernelSU!' });
    const append = createControl({ label: 'Append', type: 'checkbox', checked: false });
    return createDemo({
        controls: [path, text, append],
        buttonLabel: 'Write file',
        onRun: () => {
            const target = requirePath(path.input.value);
            ensureParentDirectory(target);
            const writer = io.FileOutputStream();
            const id = writer.open(target, append.input.checked);
            if (!id) throw new Error('Failed to open file for writing');

            try {
                if (!writer.write(id, encodeBase64(text.input.value)) || !writer.flush(id)) {
                    throw new Error('Failed to write file');
                }
            } finally {
                writer.close(id);
            }

            const file = io.File(target);
            return { path: target, append: append.input.checked, bytesWritten: text.input.value.length, fileLength: file.length() };
        },
    });
}

function createInputDemo() {
    const path = createControl({ label: 'Source path', value: DEFAULT_PATH });
    return createDemo({
        controls: [path],
        buttonLabel: 'Read file',
        onRun: () => {
            const target = requirePath(path.input.value);
            const reader = io.FileInputStream();
            const id = reader.open(target);
            if (!id) throw new Error('Failed to open file for reading');

            let binary = '';
            let chunkCount = 0;
            try {
                let chunk;
                while ((chunk = reader.read(id, 8192)) !== '') {
                    binary += atob(chunk);
                    chunkCount += 1;
                }
            } finally {
                reader.close(id);
            }

            const text = new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
            return { path: target, bytesRead: binary.length, chunkCount, text };
        },
    });
}

function createRandomAccessDemo() {
    const path = createControl({ label: 'Target path', value: DEFAULT_RANDOM_ACCESS_PATH });
    const offset = createControl({ label: 'Offset in bytes', value: '16', type: 'number' });
    const text = createControl({ label: 'Text to write', value: 'KernelSU' });
    return createDemo({
        controls: [path, offset, text],
        buttonLabel: 'Seek, write, and read',
        onRun: () => {
            const target = requirePath(path.input.value);
            const position = Number.parseInt(offset.input.value, 10);
            if (!Number.isInteger(position) || position < 0) throw new Error('Offset must be a non-negative integer');
            ensureParentDirectory(target);

            const random = io.RandomAccessFile();
            const id = random.open(target, 'rw');
            if (!id) throw new Error('Failed to open random-access file');

            try {
                if (!random.seek(id, position)) throw new Error('Failed to seek before write');
                random.writeBase64(id, encodeBase64(text.input.value));
                if (!random.seek(id, position)) throw new Error('Failed to seek before read');
                const read = decodeBase64(random.readBytes(id, new TextEncoder().encode(text.input.value).length));
                return { path: target, offset: position, length: random.length(id), written: text.input.value, read };
            } finally {
                random.close(id);
            }
        },
    });
}

const cards = [
    {
        title: 'io.support',
        sections: [
            { type: 'description', content: 'io.support reports whether ksu.io is exposed by KernelSU. Check it before using the io interface.' },
            { type: 'interactive', content: actionButton([
                { label: 'Check support', action: () => toast(io.support ? 'supported' : 'unavailable') },
            ]) },
            { type: 'code', language: 'js', content: supportCode.trim() },
        ],
    },
    {
        title: 'io.File',
        sections: [
            { type: 'description', content: 'Inspect file metadata, permissions, storage space, and up to 20 directory entries.' },
            { type: 'interactive', content: createFileDemo() },
            { type: 'code', language: 'js', content: fileCode.trim() }
        ],
    },
    {
        title: 'io.FileOutputStream',
        sections: [
            { type: 'description', content: 'Create or append a text payload using a base64 write, then flush and close the stream.' },
            { type: 'interactive', content: createOutputDemo() },
            { type: 'code', language: 'js', content: outputCode.trim() }
        ]
    },
    {
        title: 'io.FileInputStream',
        sections: [
            { type: 'description', content: 'Read the selected file as 8 KiB base64 chunks, then decode the complete byte sequence.' },
            { type: 'interactive', content: createInputDemo() },
            { type: 'code', language: 'js', content: inputCode.trim() }
        ]
    },
    {
        title: 'io.RandomAccessFile',
        sections: [
            { type: 'description', content: 'Seek to an offset, write base64 data, then seek back and read the same bytes. Use stream APIs for sequential data.' },
            { type: 'interactive', content: createRandomAccessDemo() },
            { type: 'code', language: 'js', content: randomAccessCode.trim() }
        ]
    },
];

export function init() {
    renderPage('File API', cards);
}
