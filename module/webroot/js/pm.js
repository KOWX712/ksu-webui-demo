import { pm, getPackagesInfo, listPackages, toast } from '../assets/kernelsu.js';
import { actionButton, renderPage } from './utils.js';

// Prefer the new pm namespace; fall back to the deprecated top-level exports
// on KernelSU versions without ksu.pm.
const packageApi = pm.support ? pm : { listPackages, getPackagesInfo };

const pmSupportCode = `
import { pm, toast } from 'kernelsu';

// Check whether the Package Manager API is available before using it
if (pm.support) {
    // pm.version is the API version reported by the manager (0 when unavailable)
    toast('supported, pm.version: ' + pm.version);
} else {
    toast('unavailable');
}
`;

const listPackagesCode = `
import { pm } from 'kernelsu';

// Get all packages
const allPackages = pm.listPackages();
console.log(allPackages);

// Get only user installed packages
const userPackages = pm.listPackages('user');
console.log(userPackages);

// Get only system packages
const systemPackages = pm.listPackages('system');
console.log(systemPackages);
`;

const getPackagesInfoCode = `
import { pm } from 'kernelsu';

// Get info for one or more packages (always an array of package names)
const infos = pm.getPackagesInfo([
    'com.android.settings',
    'com.android.shell'
]);
console.log(infos);

// PackagesInfo entry structure (pm.getPackagesInfo returns
// Array<PackagesInfoPerUid | PackageInfoError>):
// {
//   packageName: string,
//   versionName: string,
//   versionCode: number,
//   appLabel: string,
//   isSystem: boolean | null,
//   uid: number | null,
//   userId: number | null
// }
//
// Failed lookups are reported per package instead of throwing:
// {
//   packageName: string,
//   error: string
// }
`;

const legacyListPackagesCode = `
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

const legacyGetPackagesInfoCode = `
import { getPackagesInfo } from 'kernelsu';

// Get info for a single package
const info = await getPackagesInfo('com.android.settings');
console.log(info);

// Get info for multiple packages
const infos = await getPackagesInfo([
    'com.android.settings',
    'com.android.shell'
]);
console.log(infos);
`;

const iconJsCode = `
const icon = document.createElement('img');
icon.src = "ksu://icon/com.android.settings";
`;

const iconHtmlCode = `<img src="ksu://icon/com.android.settings" />`;

const cards = [
    {
        title: 'pm.support / pm.version',
        sections: [
            { type: 'description', content: 'pm.support reports whether ksu.pm is exposed by KernelSU, and pm.version reports the pm API version (0 when unavailable). Check them before using the pm interface.' },
            { type: 'interactive', content: actionButton([
                { label: 'Check support', action: () => toast(pm.support ? `supported, pm.version: ${pm.version}` : 'unavailable') },
            ]) },
            { type: 'code', language: 'js', content: pmSupportCode.trim() },
        ],
    },
    {
        title: 'pm.listPackages',
        sections: [
            { type: 'description', content: 'Lists installed packages through the new synchronous pm interface (requires pm.support).' },
            { type: 'code', language: 'js', content: listPackagesCode.trim() },
        ],
    },
    {
        title: 'pm.getPackagesInfo',
        sections: [
            { type: 'description', content: 'Retrieves detailed information for one or more packages. Returns Array<PackagesInfoPerUid | PackageInfoError>: each entry carries userId, nullable isSystem/uid, and unresolvable packages come back as { packageName, error }.' },
            { type: 'code', language: 'js', content: getPackagesInfoCode.trim() },
            { type: 'description', content: 'When getPackagesInfo is available, you can use ksu://icon/{packageName} to get app icon:' },
            { type: 'code', language: 'js', content: iconJsCode.trim() },
            { type: 'description', content: 'Or in HTML:' },
            { type: 'code', language: 'html', content: iconHtmlCode },
        ],
    },
    {
        title: 'listPackages / getPackagesInfo (deprecated)',
        sections: [
            { type: 'description', content: 'The top-level async exports are deprecated in favor of pm.listPackages / pm.getPackagesInfo. They remain as a fallback for KernelSU versions without ksu.pm.' },
            { type: 'code', language: 'js', content: legacyListPackagesCode.trim() },
            { type: 'code', language: 'js', content: legacyGetPackagesInfoCode.trim() },
        ],
    },
    {
        title: 'Demo',
        sections: [
            { type: 'description', content: demoDescription() },
            { type: 'interactive', content: await renderPackagesTable() },
        ],
    },
];

function setupIconLazyLoading(container) {
    const images = container.querySelectorAll('.app-icon[data-src]');
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
    const isError = typeof pkg.error === 'string';
    const row = document.createElement('tr');

    const iconCell = document.createElement('td');
    if (!isError) {
        const img = document.createElement('img');
        img.className = 'app-icon';
        img.dataset.src = `ksu://icon/${pkg.packageName}`;
        img.loading = 'lazy';
        iconCell.appendChild(img);
    }

    const infoCell = document.createElement('td');
    infoCell.className = 'app-info';

    const label = document.createElement('div');
    label.className = 'app-label';
    label.textContent = isError ? pkg.packageName : (pkg.appLabel || pkg.packageName);
    infoCell.appendChild(label);

    if (!isError) {
        const packageName = document.createElement('div');
        packageName.className = 'package-name';
        packageName.textContent = pkg.packageName;
        infoCell.appendChild(packageName);
    }

    const version = document.createElement('div');
    version.className = 'version';
    version.textContent = isError ? pkg.error : `${pkg.versionName} (${pkg.versionCode})`;
    infoCell.appendChild(version);

    const typeCell = document.createElement('td');
    typeCell.className = 'app-type';
    if (isError) {
        typeCell.classList.add('error');
        typeCell.textContent = 'error';
    } else if (pkg.isSystem === null || pkg.isSystem === undefined) {
        typeCell.classList.add('unknown');
        typeCell.textContent = 'unknown';
    } else {
        typeCell.classList.add(pkg.isSystem ? 'system' : 'user');
        typeCell.textContent = pkg.isSystem ? 'system' : 'user';
    }

    const uidCell = document.createElement('td');
    uidCell.className = 'app-uid';
    uidCell.textContent = pkg.uid === null || pkg.uid === undefined ? '—' : String(pkg.uid);

    row.appendChild(iconCell);
    row.appendChild(infoCell);
    row.appendChild(typeCell);
    row.appendChild(uidCell);

    return row;
}

function demoDescription() {
    const base = 'List installed packages and render app info with icons.';
    return pm.support
        ? `${base} Using the new pm interface.`
        : `${base} ksu.pm is not available, falling back to the deprecated listPackages/getPackagesInfo exports.`;
}

async function renderPackagesTable() {
    const container = document.createElement('div');
    container.className = 'pm-container';
    container.innerHTML = '<div class="loading">Loading packages...</div>';

    try {
        const packages = await packageApi.listPackages('all');
        const packageInfos = await packageApi.getPackagesInfo(packages);
        const table = document.createElement('table');
        table.className = 'pm-table';
        table.innerHTML = `<thead><tr><th>Icon</th><th>App Info</th><th>Type</th><th>UID</th></tr></thead><tbody></tbody>`;
        const tbody = table.querySelector('tbody');

        packageInfos.forEach((pkg) => {
            tbody.appendChild(createPackageRow(pkg));
        });

        container.innerHTML = '';
        container.appendChild(table);
        setupIconLazyLoading(container);
    } catch (error) {
        console.error('Error loading packages:', error);
        container.innerHTML = '<div class="pm-error">Error loading packages</div>';
    }
    return container;
}

export function init() {
    renderPage('Package Manager API', cards);
}
