import { exec, spawn, toast } from '../assets/kernelsu.js';
import { actionButton, renderPage } from './utils.js';

const execCode = `
import { exec, toast } from 'kernelsu';

// Check Magisk version (async)
const { errno, stdout, stderr } = await exec('magisk -V', { env: { PATH: '/data/adb/magisk' } });
if (errno === 0) {
    toast('Magisk version: ' + stdout);
    return;
}
toast('Not Magisk');

// Check APatch version
exec('apd -V', { env: { PATH: '/data/adb/ap/bin' } }).then(({ errno, stdout }) => {
    toast(errno === 0 ? 'APatch version: ' + stdout : 'Not APatch');
});
`;

const spawnCode = `
import { spawn, toast } from 'kernelsu';

// Check KernelSU version with spawn
const child = spawn('ksud', ['debug', 'version'], { env: { PATH: '/data/adb/ksu/bin' } });
child.stdout.on('data', (data) => {
    toast('KernelSU version: ' + data.split(':')[1].trim());
});
child.stderr.on('data', (data) => console.error(data));
child.on('exit', (code) => {
    if (code !== 0) toast('Not KernelSU');
});
child.on('error', (error) => console.error(error));
`;

const linkCode = `
import { exec } from 'kernelsu';

const link = 'https://github.com/KOWX712/ksu-webui-demo';

// Open link in system browser with exec
await exec('am start -a android.intent.action.VIEW -d ' + link).then(({ errno }) => {
    if (errno !== 0) {
        window.open(link, '_blank'); // fallback when ksu interface not available
    }
});
`;

const cards = [
    {
        title: 'Exec',
        sections: [
            { type: 'description', content: 'Run a command through shell, buffers all output and returns it in one callback. Simple but blocking and no streaming.' },
            { type: 'interactive', content: actionButton([
                { label: 'Magisk', action: checkMagisk },
                { label: 'APatch', action: checkApatch },
            ]) },
            { type: 'code', language: 'js', content: execCode.trim() },
        ],
    },
    {
        title: 'Spawn',
        sections: [
            { type: 'description', content: 'Spawn process, returns streaming stdout/stderr via events. Suitable for large/unbounded output, long-running processes.' },
            { type: 'interactive', content: actionButton([
                { label: 'KernelSU', action: checkKernelSU },
            ]) },
            { type: 'code', language: 'js', content: spawnCode.trim() },
        ],
    },
    {
        title: 'Open external link',
        sections: [
            { type: 'description', content: 'Open link in the system browser via exec.' },
            { type: 'interactive', content: actionButton([
                { label: 'Open Link', action: openGithub },
            ]) },
            { type: 'code', language: 'js', content: linkCode.trim() },
        ],
    },
];

async function checkMagisk() {
    const { errno, stdout, stderr } = await exec('magisk -V', { env: { PATH: '/data/adb/magisk' } });
    if (errno === 0) {
        toast(`Magisk version: ${stdout}`);
        return;
    }
    toast('Not Magisk');
    console.error(stderr);
}

function checkApatch() {
    exec('apd -V', { env: { PATH: '/data/adb/ap/bin' } }).then(({ errno, stdout }) => {
        toast(errno === 0 ? `APatch version: ${stdout}` : 'Not APatch');
    });
}

function checkKernelSU() {
    const output = spawn('ksud', ['debug', 'version'], { env: { PATH: '/data/adb/ksu/bin' } });
    output.stdout.on('data', (data) => toast(`KernelSU version: ${data.split(':')[1].trim()}`));
    output.stderr.on('data', (data) => console.error(data));
    output.on('exit', (code) => {
        if (code !== 0) toast('Not KernelSU');
    });
}

function openGithub() {
    const link = 'https://github.com/KOWX712/ksu-webui-demo';
    toast(`Redirecting to ${link}`);
    setTimeout(() => {
        exec(`am start -a android.intent.action.VIEW -d ${link}`, { env: { PATH: '/system/bin' } }).then(({ errno }) => {
            if (errno !== 0) window.open(link, '_blank');
        });
    }, 100);
}

export function init() {
    renderPage('Exec & Spawn', cards);
}
