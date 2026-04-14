import { getPackagesInfo, listPackages } from '../assets/kernelsu.js';
import { codeFence, initPage, renderCode } from './utils.js';

const listPackagesCode = `
import { listPackages } from 'kernelsu';

// Get all packages
const allPackages = await listPackages();
console.log(allPackages);

// Get only user installed packages
const userPackages = await listPackages('user');
console.log(userPackages);

// Get only system packages
const systemPackages = await listPackages('system');
console.log(systemPackages);
`;

const getPackagesInfoCode = `
import { getPackagesInfo } from 'kernelsu';

// Get info for a single package
const info = await getPackagesInfo('com.android.settings');
console.log(info);

// Get info for multiple packages
const infos = await getPackagesInfo(['com.android.settings', 'com.android.shell']);
console.log(infos);

// PackagesInfo structure:
// {
//   packageName: string,
//   versionName: string,
//   versionCode: number,
//   appLabel: string,
//   isSystem: boolean,
//   uid: number
// }
`;

const iconJsCode = `
const icon = document.createElement('img');
icon.src = "ksu://icon/com.android.settings";
`;

const iconHtmlCode = `<img src="ksu://icon/com.android.settings" />`;

function setupIconLazyLoading() {
    const images = document.querySelectorAll('.app-icon[data-src]');
    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            currentObserver.unobserve(img);
        });
    }, { rootMargin: '100px', threshold: 0.1 });

    images.forEach((img) => {
        img.classList.add('lazy');
        observer.observe(img);
    });
}

function createPackageRow(pkg) {
    const row = document.createElement('tr');

    const iconCell = document.createElement('td');
    const img = document.createElement('img');
    img.className = 'app-icon';
    img.dataset.src = `ksu://icon/${pkg.packageName}`;
    img.loading = 'lazy';
    iconCell.appendChild(img);

    const infoCell = document.createElement('td');
    infoCell.className = 'app-info';

    const label = document.createElement('div');
    label.className = 'app-label';
    label.textContent = pkg.appLabel;

    const packageName = document.createElement('div');
    packageName.className = 'package-name';
    packageName.textContent = pkg.packageName;

    const version = document.createElement('div');
    version.className = 'version';
    version.textContent = `${pkg.versionName} (${pkg.versionCode})`;

    infoCell.appendChild(label);
    infoCell.appendChild(packageName);
    infoCell.appendChild(version);

    const typeCell = document.createElement('td');
    typeCell.className = `app-type ${pkg.isSystem ? 'system' : 'user'}`;
    typeCell.textContent = pkg.isSystem ? 'system' : 'user';

    const uidCell = document.createElement('td');
    uidCell.className = 'app-uid';
    uidCell.textContent = String(pkg.uid);

    row.appendChild(iconCell);
    row.appendChild(infoCell);
    row.appendChild(typeCell);
    row.appendChild(uidCell);

    return row;
}

async function loadPackages() {
    const container = document.querySelector('.pm-container');
    try {
        const packages = await listPackages('all');
        const packageInfos = await getPackagesInfo(packages);
        const table = document.createElement('table');
        table.className = 'pm-table';
        table.innerHTML = `<thead><tr><th>Icon</th><th>App Info</th><th>Type</th><th>UID</th></tr></thead><tbody></tbody>`;
        const tbody = table.querySelector('tbody');

        packageInfos.forEach((pkg) => {
            tbody.appendChild(createPackageRow(pkg));
        });

        container.innerHTML = '';
        container.appendChild(table);
        setupIconLazyLoading();
    } catch (error) {
        console.error('Error loading packages:', error);
        container.innerHTML = '<div class="pm-error">Error loading packages</div>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initPage();
    renderCode(document.getElementById('listPackagesCode'), codeFence(listPackagesCode.trim(), 'javascript'));
    renderCode(document.getElementById('getPackagesInfoCode'), codeFence(getPackagesInfoCode.trim(), 'javascript'));
    renderCode(document.getElementById('iconJsCode'), codeFence(iconJsCode.trim(), 'javascript'));
    renderCode(document.getElementById('iconHtmlCode'), codeFence(iconHtmlCode.trim(), 'html'));
    
    loadPackages();
});
