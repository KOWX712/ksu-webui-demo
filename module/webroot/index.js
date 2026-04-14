import { codeFence, initPage, renderCode } from './js/utils.js';

const prerequisiteCode = `
# Package from official KernelSU
npm i kernelsu

# Alternative
npm i kernelsu-alt
`;

document.addEventListener('DOMContentLoaded', () => {
    initPage();
    renderCode(document.getElementById('catalogPrerequisiteCode'), codeFence(prerequisiteCode, 'bash'));
});
