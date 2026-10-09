import { toast } from '../assets/kernelsu.js';
import { renderPage } from './utils.js';

const demoCode = `
const fileEl = document.createElement('input');
fileEl.type = 'file';
fileEl.multiple = true; // Set this to enable multiple file selection
fileEl.accept = '.txt'; // Set this to filter file types
fileEl.accept = 'image/*'; // Alternative mime type filter
fileEl.click();
fileEl.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
});

// Or element in HTML
// <input type="file" multiple accept=".jpg,.png,">
`;

const generatedDownloadCode = `
// Download generated content
const blob = new Blob(['KernelSU WebUI demo'], { type: 'text/plain' });
const blobUrl = URL.createObjectURL(blob);
const generated = document.createElement('a');
generated.href = blobUrl;
generated.download = 'webui-demo-report.txt';
generated.click();
setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
`;

const urlDownloadCode = `
// Download a URL target
const remote = document.createElement('a');
remote.href = 'https://github.com/tiann/KernelSU/releases/download/v3.3.0/KernelSU_v3.3.0_32601-release.apk;
remote.download = '';
remote.click();
`;

const uploadContainer = () => {
    const container = document.createElement('div');
    container.className = 'upload-container';
    container.innerHTML = `
        <button type="button" id="selectFileButton" class="btn ripple-element">Select File</button>
        <input type="file" id="fileUpload" class="hide">
        <div id="uploadProgress" class="progress-container hide">
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div class="progress-status">
                <span id="fileInfo">No file selected</span>
                <span id="progressText">0%</span>
            </div>
        </div>
    `;

    return container;
}

const generatedDownloadContainer = () => {
    const container = document.createElement('div');
    container.className = 'download-container';
    container.innerHTML = `
        <label class="download-field">
            <span>Generated file name</span>
            <input id="generatedDownloadName" type="text" value="webui-demo-report.txt">
        </label>
        <button type="button" id="generatedDownloadButton" class="btn ripple-element">Download report</button>
        <div id="generatedDownloadStatus" class="download-status"></div>
    `;

    return container;
}

const urlDownloadContainer = () => {
    const container = document.createElement('div');
    container.className = 'download-container';
    container.innerHTML = `
        <label class="download-field">
            <span>URL</span>
            <input id="urlDownloadUrl" type="url" value="https://github.com/tiann/KernelSU/releases/download/v3.3.0/KernelSU_v3.3.0_32601-release.apk">
        </label>
        <button type="button" id="urlDownloadButton" class="btn ripple-element">Download URL</button>
    `;

    return container;
}

const cards = [
    {
        title: 'Basic File Interface',
        sections: [
            { type: 'description', content: 'Select a file and simulate chunked progress updates in the browser.' },
            { type: 'interactive', content: uploadContainer() },
            { type: 'code', language: 'js', content: demoCode.trim() },
        ],
    },
    {
        title: 'Download',
        sections: [
            { type: 'description', content: 'Download a generated file.' },
            { type: 'interactive', content: generatedDownloadContainer() },
            { type: 'code', language: 'js', content: generatedDownloadCode.trim() },
            { type: 'description', content: 'Download a file from URL will be handled by system default browser.' },
            { type: 'interactive', content: urlDownloadContainer() },
            { type: 'code', language: 'js', content: urlDownloadCode.trim() },
        ],
    },
];

function setupFileUpload() {
    const trigger = document.getElementById('selectFileButton');
    const fileInput = document.getElementById('fileUpload');
    const fileInfo = document.getElementById('fileInfo');
    const progressContainer = document.getElementById('uploadProgress');
    const progressFill = progressContainer.querySelector('.progress-fill');
    const progressText = document.getElementById('progressText');

    trigger.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) {
            fileInfo.textContent = 'No file selected';
            return;
        }

        const reader = new FileReader();
        const chunkSize = 1024 * 1024;
        let offset = 0;
        progressContainer.classList.remove('hide');
        fileInfo.textContent = `${file.name} | `;

        while (offset < file.size) {
            const blob = file.slice(offset, offset + chunkSize);
            await new Promise((resolve, reject) => {
                reader.onload = (loadEvent) => {
                    offset += loadEvent.target.result.byteLength;
                    const percent = Math.min(100, Math.round((offset / file.size) * 100));
                    progressFill.style.width = `${percent}%`;
                    progressText.textContent = `${percent}%`;
                    resolve();
                };
                reader.onerror = () => reject(new Error('File read error'));
                reader.readAsArrayBuffer(blob);
            }).catch((error) => {
                toast('Error reading file');
                throw error;
            });
        }

        setTimeout(() => {
            fileInput.value = '';
        }, 2000);
    });
}

function requireValue(value, label) {
    const trimmed = value.trim();
    if (!trimmed) throw new Error(`${label} is required`);
    return trimmed;
}

function triggerDownload(url, fileName) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}

function setupDownloads() {
    const generatedName = document.getElementById('generatedDownloadName');
    const generatedButton = document.getElementById('generatedDownloadButton');
    const generatedStatus = document.getElementById('generatedDownloadStatus');

    generatedButton.addEventListener('click', () => {
        try {
            const fileName = requireValue(generatedName.value, 'Generated file name');
            const report = `KernelSU WebUI demo\ngeneratedAt=${new Date().toISOString()}\n`;
            const blobUrl = URL.createObjectURL(new Blob([report], { type: 'text/plain' }));
            triggerDownload(blobUrl, fileName);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            generatedStatus.textContent = `Started generated download: ${fileName}`;
        } catch (error) {
            generatedStatus.textContent = error.message;
            toast(error.message);
        }
    });
}

export function init() {
    renderPage('Basic File Interface', cards);
    setupFileUpload();
    setupDownloads();
}
