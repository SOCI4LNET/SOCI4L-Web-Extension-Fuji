// SOCI4L Connector Content Script (Fuji Testnet)

const API_BASE_URL = "https://testnet.soci4l.net";

// Namespace prefix to avoid conflicts with mainnet extension
const NS = "soci4l-fuji";

console.log("[SOCI4L-Fuji] Extension loaded on X.com");

// Icon SVG (Branded Logo)
const BADGE_ICON = `
<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M59.3105 0V12.79L46.5205 26.4H33.7305V12.79L46.5205 0H59.3105Z" fill="currentColor"/>
  <path d="M25.58 32.7798V46.4398L12.8 59.2298H0V46.4398L12.8 32.7798H25.58Z" fill="currentColor"/>
  <path d="M59.3105 59.2298V46.4398L46.5205 32.7798H33.7305V46.4398L46.5205 59.2298H59.3105Z" fill="currentColor"/>
  <path d="M25.5804 26.3998V12.7898L21.2004 8.25977H8.40039V21.1898L12.8004 26.3998H25.5804Z" fill="currentColor"/>
</svg>`;

// Cache to prevent repetitive lookups
const processedHandles = new Set();
const verifiedHandles = new Map();

// Config
const SELECTORS = {
    userName: '[data-testid="UserName"], [data-testid="User-Name"]',
    userLink: 'a[href*="/"]',
};

/**
 * Extract handle from a User-Name element or URL
 */
function extractHandle(element) {
    const text = element.textContent;
    if (!text) return null;

    const match = text.match(/@([a-zA-Z0-9_]+)/);
    if (match) return match[1];

    const anchor = element.closest('a');
    if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href.startsWith('/') && !href.includes('/status/')) {
            const handle = href.substring(1).split('/')[0];
            if (!['home', 'explore', 'notifications', 'messages', 'i', 'settings'].includes(handle.toLowerCase())) {
                return handle;
            }
        }
    }
    return null;
}

/**
 * Sync Light/Dark theme from X.com
 */
function updateTheme() {
    const bgColor = getComputedStyle(document.body).backgroundColor;
    const rgb = bgColor.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
        const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
        if (brightness > 128) {
            document.body.classList.remove(`${NS}-dark-theme`);
            document.body.classList.add(`${NS}-light-theme`);
        } else {
            document.body.classList.remove(`${NS}-light-theme`);
            document.body.classList.add(`${NS}-dark-theme`);
        }
    }
}
setInterval(updateTheme, 1000);
updateTheme();

/**
 * Check API for verification status
 */
async function checkVerification(handle) {
    if (processedHandles.has(handle)) return verifiedHandles.get(handle);

    try {
        const response = await fetch(`${API_BASE_URL}/api/social/lookup?platform=twitter&handle=${handle}`);
        if (response.ok) {
            const data = await response.json();
            if (data.isVerified) {
                verifiedHandles.set(handle, data.profile);
                processedHandles.add(handle);
                return data.profile;
            }
        }
    } catch (err) {
        console.error("[SOCI4L-Fuji] Lookup failed:", err);
    }

    processedHandles.add(handle);
    return null;
}

// Global Tooltip Management
let globalTooltip = null;
let hideTimeout = null;

function createGlobalTooltip() {
    if (globalTooltip) return;
    globalTooltip = document.createElement('div');
    globalTooltip.className = `${NS}-global-tooltip`;

    globalTooltip.addEventListener('mouseenter', () => {
        if (hideTimeout) clearTimeout(hideTimeout);
    });
    globalTooltip.addEventListener('mouseleave', hideTooltip);

    document.body.appendChild(globalTooltip);
}

function showTooltip(target, profile) {
    if (hideTimeout) clearTimeout(hideTimeout);
    createGlobalTooltip();

    const rect = target.getBoundingClientRect();
    const shortAddress = profile.address ? `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}` : 'No Address';
    const profileUrl = `${API_BASE_URL}/p/${profile.slug || profile.address}`;

    globalTooltip.innerHTML = `
        <div class="${NS}-tooltip-header">
            <div class="${NS}-tooltip-verified">
                <span>✓ SOCI4L Verified</span>
            </div>
        </div>
        
        <div class="${NS}-tooltip-address-row">
            <span class="${NS}-tooltip-address" title="${profile.address}">${shortAddress}</span>
            <button class="${NS}-copy-btn" id="${NS}-copy-trigger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
        </div>
        
        <div class="${NS}-tooltip-actions">
            <a href="${profileUrl}" target="_blank" class="${NS}-action-btn ${NS}-btn-secondary">View Profile</a>
            <button class="${NS}-action-btn ${NS}-btn-primary ${NS}-donate-trigger" data-address="${profile.address}" data-slug="${profile.slug || ''}">Donate</button>
        </div>
    `;

    const copyBtn = globalTooltip.querySelector(`#${NS}-copy-trigger`);
    if (copyBtn) {
        copyBtn.onclick = (e) => {
            e.preventDefault();
            navigator.clipboard.writeText(profile.address).then(() => {
                const originalColor = copyBtn.style.color;
                copyBtn.style.color = '#10b981';
                setTimeout(() => { copyBtn.style.color = originalColor; }, 1000);
            });
        };
    }

    const donateBtn = globalTooltip.querySelector(`.${NS}-donate-trigger`);
    if (donateBtn) {
        donateBtn.onclick = (e) => {
            e.preventDefault();
            const address = donateBtn.dataset.address;
            const slug = donateBtn.dataset.slug;
            const donateUrl = `${API_BASE_URL}/p/${slug || address}?action=donate`;
            window.open(donateUrl, '_blank');
        };
    }

    globalTooltip.style.left = `${rect.left + rect.width / 2}px`;
    globalTooltip.style.top = `${rect.top - 8}px`;
    globalTooltip.classList.add('visible');
}

function hideTooltip() {
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
        if (globalTooltip) {
            globalTooltip.classList.remove('visible');
        }
    }, 200);
}

/**
 * Inject Badge
 */
function injectBadge(container, profile) {
    if (container.querySelector(`.${NS}-badge`) || container.closest(`.${NS}-badge-container`)) return;

    const badge = document.createElement('span');
    badge.className = `${NS}-badge`;

    if (!container.closest('[data-testid="tweet"]')) {
        badge.classList.add(`${NS}-badge-profile`);
    }
    badge.innerHTML = `
        <span class="${NS}-badge-icon">${BADGE_ICON}</span>
        <span class="${NS}-badge-text">SOCI4L</span>
    `;

    badge.addEventListener('mouseenter', () => showTooltip(badge, profile));
    badge.addEventListener('mouseleave', hideTooltip);
    badge.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(`${API_BASE_URL}/p/${profile.slug || profile.address}`, '_blank');
    };

    // Strategy 1: Find the verified icon wrapper
    const verifiedIcon = container.querySelector('[data-testid="icon-verified"]');
    if (verifiedIcon) {
        const flexRow = verifiedIcon.closest('.r-18u37iz') || verifiedIcon.parentElement;
        if (flexRow) {
            flexRow.style.flexWrap = 'nowrap';
            flexRow.appendChild(badge);
            return;
        }
    }

    // Strategy 2: Find the main display name flex container
    const nameStr = container.querySelector('span[dir="ltr"]') || container.querySelector('div[dir="ltr"]');
    if (nameStr) {
        const flexRow = nameStr.closest('.r-18u37iz') || nameStr;
        flexRow.style.flexWrap = 'nowrap';
        flexRow.appendChild(badge);
        return;
    }

    // Strategy 3: Fallback
    container.style.flexWrap = 'nowrap';
    container.appendChild(badge);
}

/**
 * Main Observer
 */
function scanPage() {
    const userNameElements = document.querySelectorAll(SELECTORS.userName);

    userNameElements.forEach(async (el) => {
        const currentHandle = extractHandle(el);
        if (!currentHandle) return;

        const processedHandle = el.getAttribute(`data-${NS}-handle`);

        if (processedHandle && processedHandle !== currentHandle) {
            const oldBadge = el.querySelector(`.${NS}-badge`);
            if (oldBadge) oldBadge.remove();
            el.removeAttribute(`data-${NS}-processed`);
            el.removeAttribute(`data-${NS}-handle`);
        }

        if (el.hasAttribute(`data-${NS}-processed`)) return;
        el.setAttribute(`data-${NS}-processed`, 'true');
        el.setAttribute(`data-${NS}-handle`, currentHandle);

        const profile = await checkVerification(currentHandle);

        if (profile) {
            injectBadge(el, profile);
        }
    });
}

// Run scanner
let timeout = null;
const observer = new MutationObserver(() => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(scanPage, 150);
});

observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener('scroll', hideTooltip, { passive: true });

setTimeout(scanPage, 600);
console.log("[SOCI4L-Fuji] Observer started");
