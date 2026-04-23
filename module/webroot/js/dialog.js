import { renderPage } from './utils.js';

const dialogButton = (type, message) => {
    const button = document.createElement('button');
    button.className = 'btn ripple-element';
    button.textContent = `Open ${type} dialog`;
    button.onclick = () => window[type](message);

    return button;
}

const cards = [
    {
        title: 'Alert Dialog',
        sections: [
            { type: 'description', content: 'Show a simple alert dialog.' },
            { type: 'interactive', content: dialogButton('alert', 'Alert dialog demo') },
            { type: 'code', language: 'js', content: `window.alert('Alert dialog demo');` }
        ]
    },
    {
        title: 'Confirm Dialog',
        sections: [
            { type: 'description', content: 'Ask the user to confirm an action and return a boolean result.' },
            { type: 'interactive', content: dialogButton('confirm', 'Confirm dialog demo') },
            { type: 'code', language: 'js', content: `const result = window.confirm('Confirm dialog demo');` }
        ]
    },
    {
        title: 'Prompt Dialog',
        sections: [
            { type: 'description', content: 'Ask the user for input and return the result.' },
            { type: 'interactive', content: dialogButton('prompt', 'Prompt dialog demo') },
            { type: 'code', language: 'js', content: `const result = window.prompt('Prompt dialog demo');` }
        ]
    },
];

export function init() {
    renderPage('Dialog', cards);
}
