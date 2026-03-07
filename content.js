// SOCI4L Connector Content Script

const API_BASE_URL = "https://testnet.soci4l.net";
// const API_BASE_URL = "http://localhost:3000";

console.log("[SOCI4L] Extension loaded on X.com");

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
const verifiedHandles = new Map(); // handle -> profile data

// Config
const SELECTORS = {
    // X.com uses UserName and User-Name in different places
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

    // Fallback: check href of parent anchor
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
            document.body.classList.remove('soci4l-dark-theme');
            document.body.classList.add('soci4l-light-theme');
        } else {
            document.body.classList.remove('soci4l-light-theme');
            document.body.classList.add('soci4l-dark-theme');
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
        console.error("[SOCI4L] Lookup failed:", err);
    }

    // If not verified, we still add to processed to skip repeated failed requests
    processedHandles.add(handle);
    return null;
}

// Global Tooltip Management
let globalTooltip = null;
let hideTimeout = null;

function createGlobalTooltip() {
    if (globalTooltip) return;
    globalTooltip = document.createElement('div');
    globalTooltip.className = 'soci4l-global-tooltip';

    // Prevent hiding tooltip when hovering it
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
        <div class="soci4l-tooltip-header">
            <div class="soci4l-tooltip-verified">
                <span>✓ SOCI4L Verified</span>
            </div>
        </div>
        
        <div class="soci4l-tooltip-address-row">
            <span class="soci4l-tooltip-address" title="${profile.address}">${shortAddress}</span>
            <button class="soci4l-copy-btn" id="soci4l-copy-trigger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
        </div>
        
        <div class="soci4l-tooltip-actions">
            <a href="${profileUrl}" target="_blank" class="soci4l-action-btn soci4l-btn-secondary">View Profile</a>
            <button class="soci4l-action-btn soci4l-btn-primary soci4l-donate-trigger" data-address="${profile.address}" data-slug="${profile.slug || ''}">Donate</button>
        </div>
    `;

    // Setup copy listener
    const copyBtn = globalTooltip.querySelector('#soci4l-copy-trigger');
    if (copyBtn) {
        copyBtn.onclick = (e) => {
            e.preventDefault();
            navigator.clipboard.writeText(profile.address).then(() => {
                const originalColor = copyBtn.style.color;
                copyBtn.style.color = '#10b981'; // Success green
                setTimeout(() => { copyBtn.style.color = originalColor; }, 1000);
            });
        };
    }

    // Setup donate listener
    const donateBtn = globalTooltip.querySelector('.soci4l-donate-trigger');
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
    globalTooltip.style.top = `${rect.top - 8}px`; // Balanced offset
    globalTooltip.classList.add('visible');
}

function hideTooltip() {
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
        if (globalTooltip) {
            globalTooltip.classList.remove('visible');
        }
    }, 200); // Small grace period
}

/**
 * Inject Badge
 */
function injectBadge(container, profile) {
    if (container.querySelector('.soci4l-badge') || container.closest('.soci4l-badge-container')) return;

    // Use a SPAN instead of A to prevent DOM destruction from nested anchor tags inside Twitter components
    const badge = document.createElement('span');
    badge.className = 'soci4l-badge';

    // Add specific class for main profile view (which does not sit inside a post)
    if (!container.closest('[data-testid="tweet"]')) {
        badge.classList.add('soci4l-badge-profile');
    }
    badge.innerHTML = `
        <span class="soci4l-badge-icon">${BADGE_ICON}</span>
        <span class="soci4l-badge-text">SOCI4L</span>
    `;

    badge.addEventListener('mouseenter', () => showTooltip(badge, profile));
    badge.addEventListener('mouseleave', hideTooltip);
    badge.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(`${API_BASE_URL}/p/${profile.slug || profile.address}`, '_blank');
    };

    // Strategy 1: Find the verified icon wrapper and append to the nearest flex row
    const verifiedIcon = container.querySelector('[data-testid="icon-verified"]');
    if (verifiedIcon) {
        // Twitter uses CSS class 'r-18u37iz' for row-based flex containers.
        // If we append inside the row container, it stays strictly side-by-side.
        const flexRow = verifiedIcon.closest('.r-18u37iz') || verifiedIcon.parentElement;
        if (flexRow) {
            flexRow.style.flexWrap = 'nowrap';
            flexRow.appendChild(badge);
            return;
        }
    }

    // Strategy 2: Find the main display name flex container (first inner row)
    const nameStr = container.querySelector('span[dir="ltr"]') || container.querySelector('div[dir="ltr"]');
    if (nameStr) {
        const flexRow = nameStr.closest('.r-18u37iz') || nameStr;
        flexRow.style.flexWrap = 'nowrap';
        flexRow.appendChild(badge);
        return;
    }

    // Strategy 3: Fallback generic append
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

        // Check if the element was already processed for a DIFFERENT handle
        const processedHandle = el.getAttribute('data-soci4l-handle');

        if (processedHandle && processedHandle !== currentHandle) {
            // Handle changed! Someone navigated or the element was recycled.
            // Remove the old badge to trigger fresh injection
            const oldBadge = el.querySelector('.soci4l-badge');
            if (oldBadge) oldBadge.remove();
            el.removeAttribute('data-soci4l-processed');
            el.removeAttribute('data-soci4l-handle');
        }

        if (el.hasAttribute('data-soci4l-processed')) return;
        el.setAttribute('data-soci4l-processed', 'true');
        el.setAttribute('data-soci4l-handle', currentHandle);

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

// Scroll listener to hide tooltip on scroll
window.addEventListener('scroll', hideTooltip, { passive: true });

// Initial scan
setTimeout(scanPage, 600);
console.log("[SOCI4L] Observer started");
