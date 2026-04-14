import { toast } from '../assets/kernelsu.js';

let isScrolling = false, scrollTimeout;
let markedInstance;

function getHighlightJsInstance() {
    const highlightJsInstance = globalThis.hljs;

    if (!highlightJsInstance?.highlight || !highlightJsInstance?.getLanguage) {
        throw new Error('highlight.min.js is not loaded');
    }

    return highlightJsInstance;
}

function getMarkedHighlightPlugin() {
    return globalThis.markedHighlight?.markedHighlight ?? globalThis.markedHighlight;
}

function createMarkedInstance() {
    const markedLibrary = globalThis.marked;
    const Marked = markedLibrary?.Marked;
    const highlightJsInstance = getHighlightJsInstance();
    const markedHighlightPlugin = getMarkedHighlightPlugin();

    if (typeof Marked !== 'function') {
        throw new Error('marked.umd.js is not loaded');
    }

    if (typeof markedHighlightPlugin !== 'function') {
        throw new Error('marked-highlight.umd.js is not loaded');
    }

    return new Marked(markedHighlightPlugin({
        emptyLangClass: 'hljs',
        langPrefix: 'hljs language-',
        highlight(code, language) {
            const resolvedLanguage = highlightJsInstance.getLanguage(language) ? language : 'plaintext';
            return highlightJsInstance.highlight(code, { language: resolvedLanguage }).value;
        },
    }));
}

function getMarkedInstance() {
    if (!markedInstance) {
        markedInstance = createMarkedInstance();
    }

    return markedInstance;
}

function codeFence(text, language = '') {
    return `\`\`\`${language}\n${text.trim()}\n\`\`\``;
}

function renderCode(container, markdown) {
    const markdownContainer = container.querySelector('.code-demo-markdown');
    const copyButton = container.querySelector('.copy-code-button');

    markdownContainer.innerHTML = getMarkedInstance().parse(markdown);
    copyButton.addEventListener('click', async () => {
        const text = markdownContainer.textContent.trim();
        navigator.clipboard.writeText(text).catch(() => {});
        toast('Copied!');
    });

    applyRippleEffect();
}

function checkWebuiX() {
    if (Object.keys(globalThis.$ksuwebui_demo ?? {}).length > 0) {
        $ksuwebui_demo.setLightStatusBars(!$ksuwebui_demo.isDarkMode());
    }
}

/**
 * Simulate MD3 ripple animation
 * Usage: class="ripple-element" style="position: relative; overflow: hidden;"
 * Note: Require background-color to work properly
 * @return {void}
 */
function applyRippleEffect() {
    document.querySelectorAll('.ripple-element').forEach(element => {
        if (element.dataset.rippleListener !== "true") {
            element.addEventListener("pointerdown", async (event) => {
                // Pointer up event
                const handlePointerUp = () => {
                    ripple.classList.add("end");
                    setTimeout(() => {
                        ripple.classList.remove("end");
                        ripple.remove();
                    }, duration * 1000);
                    element.removeEventListener("pointerup", handlePointerUp);
                    element.removeEventListener("pointercancel", handlePointerUp);
                };
                element.addEventListener("pointerup", () => setTimeout(handlePointerUp, 80));
                element.addEventListener("pointercancel", () => setTimeout(handlePointerUp, 80));

                const ripple = document.createElement("span");
                ripple.classList.add("ripple");

                // Calculate ripple size and position
                const rect = element.getBoundingClientRect();
                const width = rect.width;
                const size = Math.max(rect.width, rect.height);
                const x = event.clientX - rect.left - size / 2;
                const y = event.clientY - rect.top - size / 2;

                // Determine animation duration
                let duration = 0.2 + (width / 800) * 0.4;
                duration = Math.min(0.8, Math.max(0.2, duration));

                // Set ripple styles
                ripple.style.width = ripple.style.height = `${size}px`;
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                ripple.style.animationDuration = `${duration}s`;
                ripple.style.transition = `opacity ${duration}s ease`;

                // Adaptive color
                const computedStyle = window.getComputedStyle(element);
                const bgColor = computedStyle.backgroundColor || "rgba(0, 0, 0, 0)";
                const isDarkColor = (color) => {
                    const rgb = color.match(/\d+/g);
                    if (!rgb) return false;
                    const [r, g, b] = rgb.map(Number);
                    return (r * 0.299 + g * 0.587 + b * 0.114) < 96; // Luma formula
                };
                ripple.style.backgroundColor = isDarkColor(bgColor) ? "rgba(255, 255, 255, 0.2)" : "";

                // Append ripple if not scrolling
                await new Promise(resolve => setTimeout(resolve, 80));
                if (isScrolling) return;
                element.appendChild(ripple);
            });
            element.dataset.rippleListener = "true";
        }
    });
}

function initPage() {
    checkWebuiX();
    applyRippleEffect();

    // Scroll event
    window.onscroll = () => {
        isScrolling = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => isScrolling = false, 200);
    };
}

export { applyRippleEffect, checkWebuiX, codeFence, initPage, renderCode };
