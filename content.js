// SOCI4L Connector Content Script

const API_BASE_URL = "https://soci4l.net";
// const API_BASE_URL = "http://localhost:3000";

console.log("[SOCI4L] Extension loaded on X.com");

// Icon SVG (Branded Logo)
const BADGE_ICON = `
<svg viewBox="0 0 105.81 111.83" xmlns="http://www.w3.org/2000/svg">
  <g>
    <path d="M49.89,81.2H0c9.23,18.18,28.11,30.63,49.89,30.63,30.88,0,55.92-25.04,55.92-55.92S80.77,0,49.89,0v30.63c13.96,0,25.28,11.32,25.28,25.28s-11.32,25.28-25.28,25.28Z"/>
    <path d="M49.89,30.63v50.56c-13.97,0-25.28-11.32-25.28-25.28s11.31-25.28,25.28-25.28Z"/>
  </g>
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
    // Logic to find @username inside the element
    // On X, the handle is usually in a span starting with @
    const spans = element.querySelectorAll('span');
    for (const span of spans) {
        const text = span.innerText;
        const match = text.match(/@([a-zA-Z0-9_]+)/);
        if (match) return match[1];
    }

    const text = element.innerText;
    const match = text.match(/@([a-zA-Z0-9_]+)/);
    if (match) return match[1];

    // Fallback: check href of parent anchor
    const anchor = element.closest('a');
    if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href.startsWith('/') && !href.includes('/status/')) {
            const handle = href.substring(1);
            if (!['home', 'explore', 'notifications', 'messages', 'i', 'settings'].includes(handle.toLowerCase())) {
                return handle;
            }
        }
    }
    return null;
}

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
            <a href="${profileUrl}" target="_blank" class="soci4l-action-btn soci4l-btn-primary soci4l-donate-btn">Donate</a>
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
function injectBadge(element, profile) {
    if (element.querySelector('.soci4l-badge') || element.closest('.soci4l-badge-container')) return;

    const badge = document.createElement('a');
    badge.href = `${API_BASE_URL}/p/${profile.slug || profile.address}`;
    badge.target = '_blank';
    badge.className = 'soci4l-badge';
    badge.innerHTML = `
        <span class="soci4l-badge-icon">${BADGE_ICON}</span>
        <span class="soci4l-badge-text">SOCI4L</span>
    `;

    badge.addEventListener('mouseenter', () => showTooltip(badge, profile));
    badge.addEventListener('mouseleave', hideTooltip);
    badge.onclick = (e) => e.stopPropagation();

    // Precise Injection logic for X.com
    const verifiedIcon = element.querySelector('svg[aria-label*="Verified"], svg[aria-label*="doğrulanmış"], [data-testid="icon-verified"]');

    if (verifiedIcon) {
        let target = verifiedIcon;
        while (target.parentElement && target.parentElement !== element) {
            target = target.parentElement;
        }
        target.insertAdjacentElement('afterend', badge);
    } else {
        // No verified icon, just append to the end of the name container
        element.appendChild(badge);
    }
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
            const nameWrapper = el.querySelector('span'); // usually display name
            if (nameWrapper) {
                injectBadge(nameWrapper.parentElement || nameWrapper, profile);
            } else {
                injectBadge(el, profile);
            }
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
