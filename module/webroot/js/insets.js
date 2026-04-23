import { enableEdgeToEdge, fullScreen, toast } from '../assets/kernelsu.js';
import { actionButton, renderPage } from './utils.js';

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

const monetDemo = async () => {
    const container = document.createElement('div');
    container.className = 'monet-color-container';

    try {
        const response = await fetch('./theme.css');
        const cssText = await response.text();
        const variableRegex = /--color-([\w-]+):/g;
        const allKeys = [...new Set([...cssText.matchAll(variableRegex)].map(m => m[1]))];
        const baseKeys = allKeys.filter(key => !key.startsWith('on-'));

        baseKeys.forEach(key => {
            const hasOnVariant = allKeys.includes(`on-${key}`);
            const textColorVar = hasOnVariant ? `var(--color-on-${key})` : 'inherit';
            const label = key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

            const colorBlock = document.createElement('div');
            colorBlock.className = 'color-block';
            colorBlock.classList.add(label.charAt(0).toLowerCase() + label.slice(1).replace(/ /g, ''));
            colorBlock.style.backgroundColor = `var(--color-${key})`;
            colorBlock.style.color = textColorVar;
            colorBlock.textContent = label;

            container.appendChild(colorBlock);
        });
    } catch (error) {
        console.error("Theme parsing failed:", error);
        container.innerText = "Error loading theme variables.";
    }

    return container;
};

const cards = [
    {
        title: 'Full Screen',
        sections: [
            { type: 'description', content: 'Request the webview to enter full screen and hide system bars.' },
            { type: 'interactive', content: actionButton([{ label: 'Full Screen Toggle', action: toggleFullScreen }]) },
            { type: 'code', language: 'js', content: fullScreenDemoCode.trim() },
        ],
    },
    {
        title: 'Insets',
        sections: [
            { type: 'description', content: 'Toggle edge-to-edge support.' },
            { type: 'interactive', content: actionButton([
                { label: 'Inset Hint', action: toggleInsetHint },
                { label: 'Inset Toggle', action: toggleInset },
            ]) },
            { type: 'description', content: 'To use insets, you need to include this in your css:' },
            { type: 'code', language: 'css', content: importString('insets.css') },
            { type: 'description', content: 'Example data from imported insets.css' },
            { type: 'code', language: 'css', content: await loadCodeText('insets.css') },
        ],
    },
    {
        title: 'Monet colors',
        sections: [
            { type: 'description', content: 'Preview the active Monet palette exposed through the theme CSS variables.' },
            { type: 'interactive', content: await monetDemo() },
            { type: 'description', content: 'To use monet color, you need to include this in your css:' },
            { type: 'code', language: 'css', content: importString('colors.css') },
            { type: 'description', content: 'Example data from imported colors.css' },
            { type: 'code', language: 'css', content: await loadCodeText('colors.css') },
        ],
    },
];

async function loadCodeText(resource) {
    try {
        const response = await fetch(internalResource(resource));
        if (!response.ok) {
            throw new Error(`Status: ${response.status}`);
        }
        return await response.text();
    } catch {
        return resource + ' is not available in current environment.';
    }
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

export async function init() {
    renderPage('Insets & Monet', cards);
}
