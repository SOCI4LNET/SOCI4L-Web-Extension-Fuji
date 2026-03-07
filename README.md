# SOCI4L Donate — Chrome Extension (Fuji Testnet)

> ⚠️ **This is the Fuji Testnet build** — all donations go to the **Avalanche Fuji Testnet** and use testnet AVAX. This build is intended for evaluation by the **Avalanche Build Games jury**.
>
> For the production (Mainnet) extension, see: [SOCI4L-Web-Extension](https://github.com/SOCI4LNET/SOCI4L-Web-Extension)

---

## What It Does

The **SOCI4L Donate** extension enhances your X (Twitter) experience by:

1. **Badge Injection**: As you browse X, the extension detects Twitter/X handles visible on the page. For each one, it looks up whether that user has a verified SOCI4L profile.
2. **Verification Check**: For each unique handle discovered on the screen, the extension queries the **Fuji Testnet** SOCI4L API (`https://testnet.soci4l.net/api/social/lookup`) to check if the user has verified their X account on SOCI4L.
3. **Interactive Badge**: If a match is found, a small **SOCI4L badge** is injected next to the username. Hovering over it shows a tooltip with:
   - The user's verified wallet address (with a copy button)
   - A **View Profile** button linking directly to their SOCI4L testnet profile
   - A **Donate** button that opens the donation modal in a new tab on `testnet.soci4l.net`

---

## Installation (Unpacked / Developer Mode)

This testnet extension is not available on the Chrome Web Store. Install it manually:

1. **Download or clone** this repository to your local machine.
2. Open **Google Chrome** and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **"Load unpacked"**.
5. Select the folder where you cloned/downloaded this repository.
6. The **SOCI4L Donate (Fuji Testnet)** extension will appear in your extensions list.

---

## How to Test

1. Make sure you have a SOCI4L profile on [testnet.soci4l.net](https://testnet.soci4l.net) with your **X (Twitter) account verified**.
2. Browse to any profile on [x.com](https://x.com) — if that user has a verified SOCI4L account, you'll see the SOCI4L badge appear next to their name.
3. Hover over the badge to see their wallet address and donation options.
4. Click **Donate** to send testnet AVAX directly to their wallet via the SOCI4L platform.

> **Note:** Donations made with this extension target the **Fuji Testnet** (Chain ID: 43113). You need Fuji testnet AVAX to complete transactions. You can get testnet AVAX from the [Avalanche Faucet](https://faucet.avax.network/).

---

## Tech Stack

- **Manifest V3** Chrome Extension
- Vanilla JavaScript (no framework dependencies)
- API: `https://testnet.soci4l.net/api/social/lookup`
- Network: Avalanche Fuji Testnet (Chain ID: 43113)

---

## Links

- 🌐 Testnet Platform: [testnet.soci4l.net](https://testnet.soci4l.net)
- 🏗️ Mainnet Extension: [SOCI4L-Web-Extension](https://github.com/SOCI4LNET/SOCI4L-Web-Extension)
- 📄 Project Showcase: [SOCI4L-Showcase](https://github.com/SOCI4LNET/SOCI4L-Showcase)
- 🐦 Follow us: [@SOCI4LNET](https://x.com/SOCI4LNET)