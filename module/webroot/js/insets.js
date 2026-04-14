import { enableEdgeToEdge, fullScreen, toast } from '../assets/kernelsu.js';
import { initPage, renderCode, codeFence } from './utils.js';

let insetState = true, fullScreenState = false;

const internalResource = (file) => `https://mui.kernelsu.org/internal/${file}`;
const importString = (file) => `@import url('${internalResource(file)}');`;

const fullScreenDemoCode = `
import { fullScreen } from 'kernelsu';

// Enter full screen (hide system bars)
fullScreen(true);

// Exit full screen (show system bars)
fullScreen(false);
`;

async function loadCodeFence({ language, path }) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Status: ${response.status}`);
        }
        const text = await response.text();
        return codeFence(text, language);
    } catch (error) {
        return codeFence(error.message, 'txt');
    }
}

async function renderFetchedCode(container, options) {
    const markdown = (await Promise.all(options.resources.map((resource) => loadCodeFence(resource, options.fallbackMessage)))).join('\n\n');

    renderCode(container, markdown);
}

function toggleInsetHint() {
    document.querySelectorAll('.inset-demo').forEach(el => {
        el.classList.toggle('hide');
    });
}

async function toggleInset() {
    insetState = !insetState;
    try {
        await enableEdgeToEdge(insetState);
        document.documentElement.style.setProperty('--inset-top', insetState ? 'var(--window-inset-top)' : '0px');
        document.documentElement.style.setProperty('--inset-bottom', insetState ? 'var(--window-inset-bottom)' : '0px');
    } catch {
        toast('unsupported');
    }
}

function toggleFullScreen() {
    fullScreenState = !fullScreenState;
    fullScreen(fullScreenState);
}

document.addEventListener('DOMContentLoaded', async () => {
    initPage();
    document.getElementById('toggleFullScreenButton').addEventListener('click', toggleFullScreen);
    document.getElementById('toggleInsetHintButton').addEventListener('click', toggleInsetHint);
    document.getElementById('toggleInsetButton').addEventListener('click', toggleInset);

    renderCode(document.getElementById('fullScreenCode'), codeFence(fullScreenDemoCode.trim(), 'javascript'));

    renderCode(document.getElementById('insetsImport'), codeFence(importString('insets.css'), 'css'));
    await renderFetchedCode(document.getElementById('insetsCode'), {
        resources: [
            { language: 'css', path: internalResource('insets.css') },
        ],
    });

    renderCode(document.getElementById('monetImport'), codeFence(importString('colors.css'), 'css'));
    await renderFetchedCode(document.getElementById('monetCode'), {
        resources: [
            { language: 'css', path: internalResource('colors.css') },
        ],
    });
});
