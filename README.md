# SOCI4L Donate Web Extension

SOCI4L Donate is a Chrome Web Extension that displays verified SOCI4L badges on X (Twitter) profiles. It empowers users to easily identify verified SOCI4L identities and seamlessly send direct crypto donations to their favorite creators or friends.

## How It Works

1. **DOM Parsing**: The extension injects a lightweight content script (`content.js`) that quietly observes the X (Twitter) feed and profile pages to identify user handles (e.g., `@username`).
2. **Verification Check**: For each unique handle discovered on the screen, the extension queries the official public SOCI4L API (`https://soci4l.net/api/social/lookup`) to check if the user has connected and verified their X account on SOCI4L.
3. **Badge Injection**: If the API confirms the user is verified, the extension dynamically injects a visually distinct SOCI4L badge right next to the user's display name on X.
4. **Donation Interface**: Hovering over the injected badge reveals a sleek, glassmorphism-styled tooltip displaying the user's connected Web3 wallet address. From there, users can instantly copy the address or click the "Donate" button, which redirects them directly to the user's SOCI4L profile donation page.

## Data Privacy & Access

**Privacy First:** This extension strictly respects user privacy and **does not collect, store, or transmit any sensitive, personal data.** 

- **Read Access:** The extension only reads the public HTML DOM elements of X.com (Twitter) to find visible usernames on the screen. It does not read your private messages, passwords, or account details.
- **Network Requests:** The only outbound network requests made are zero-auth, read-only GET requests to the public SOCI4L API. It asks one simple question: *"Is this public username verified on SOCI4L?"*
- **No Tracking:** There are no analytics, trackers, background data collection, or telemetry mechanisms bundled within this extension.

## Development Roadmap & Future Plans

- [ ] **Performance Optimizations**: Continuously refine our DOM observers to ensure absolute zero impact on X.com's browser performance and adapt to any UI layout updates from X.
- [ ] **Interactive Popup UI**: Add a browser action popup window when clicking the extension icon in the toolbar, to allow users to toggle badge visibility or manage preferences.
- [ ] **On-Page Donation Widget**: Investigate the feasibility of a mini Web3 injection that allows sending crypto transactions securely without ever leaving the X.com interface.
- [ ] **Multi-Platform Support**: Expand badge injection beyond X (Twitter) to other relevant social platforms (e.g., Farcaster, Lens, GitHub).
- [ ] **Cross-Browser Ports**: Package and release the extension natively for Firefox, Brave, and macOS/iOS Safari.

## Installation (Developer Mode)

1. Clone this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the extension directory.