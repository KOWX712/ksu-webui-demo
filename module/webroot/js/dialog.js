import { codeFence, initPage, renderCode } from './utils.js';

const dialogDemos = [
    {
        buttonId: 'alertButton',
        containerId: 'alertCode',
        code: "window.alert('Alert dialog demo');",
        action: () => window.alert('Alert dialog demo'),
    },
    {
        buttonId: 'confirmButton',
        containerId: 'confirmCode',
        code: "window.confirm('Confirm dialog demo');",
        action: () => window.confirm('Confirm dialog demo'),
    },
    {
        buttonId: 'promptButton',
        containerId: 'promptCode',
        code: "window.prompt('Prompt dialog demo');",
        action: () => window.prompt('Prompt dialog demo'),
    },
];

document.addEventListener('DOMContentLoaded', () => {
    initPage();

    dialogDemos.forEach(({ buttonId, containerId, code, action }) => {
        document.getElementById(buttonId).addEventListener('click', action);
        renderCode(document.getElementById(containerId), codeFence(code, 'js'));
    });
});
