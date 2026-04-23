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

const cards = [
    {
        title: 'File upload',
        sections: [
            { type: 'description', content: 'Select a file and simulate chunked progress updates in the browser.' },
            { type: 'interactive', content: uploadContainer() },
            { type: 'code', language: 'js', content: demoCode.trim() },
        ],
    },
]

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

export function init() {
    renderPage('File upload', cards);
    setupFileUpload();
}
