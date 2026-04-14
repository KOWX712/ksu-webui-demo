import { toast } from '../assets/kernelsu.js';
import { codeFence, initPage, renderCode } from './utils.js';

const demoCode = `
// Or element in HTML
// <input type="file" multiple accept=".jpg,.png,">

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
`;

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

document.addEventListener('DOMContentLoaded', () => {
    initPage();
    renderCode(document.getElementById('fileCode'), codeFence(demoCode, 'js'));
    setupFileUpload();
});
