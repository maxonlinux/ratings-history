import puppeteer, { Browser } from "puppeteer-core";
import { resolve } from "path";

const CHROME_EXEC = resolve(__dirname, "../../../thorium/thorium");

class Chrome {
  browser: Browser | undefined;

  constructor() {}

  async get() {
    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    this.browser = await puppeteer.launch({
      headless: true,
      executablePath: CHROME_EXEC,
      defaultViewport: {
        width: 1280 + Math.floor(Math.random() * 100),
        height: 800 + Math.floor(Math.random() * 100),
        deviceScaleFactor: 1,
      },
      args: [
        "--no-sandbox", // Disable sandboxing (be cautious of security implications)
        "--disable-setuid-sandbox", // Disable setuid sandboxing
        "--disable-dev-shm-usage", // Prevent using /dev/shm for storage
        "--disable-accelerated-2d-canvas", // Disable 2D canvas acceleration
        "--disable-gpu", // Disable GPU acceleration
        "--disable-software-rasterizer", // Disable software rasterizer
        "--disable-features=VizDisplayCompositor,IsolateOrigins,site-per-process", // Disable the Viz Display Compositor and features related to site isolation, which may affect CPU usage.
        "--disable-background-timer-throttling", // Prevent throttling of background timers
        "--disable-backgrounding-occluded-windows", // Prevent background windows from being paused
        "--disable-extensions", // Disable all extensions
        "--disable-default-apps", // Disable default apps
        "--disable-infobars", // Hide info bars (e.g., the “Chrome is being controlled” bar)
        "--no-first-run", // Skip the first run setup
        "--noerrdialogs", // Disable error dialogs
        // "--single-process", // Run browser in a single process BREAKS CONTEXT!!!
        "--remote-debugging-port=0", // Disable remote debugging (reduces overhead)
        "--disable-blink-features=AutomationControlled", // Disable automation control features
        "--no-zygote", // Disables the Zygote process, which handles the creation of new processes
        "--disable-session-crashed-bubble", // Disables the crash recovery bubble
      ],
    });

    return this.browser;
  }
}

const chrome = new Chrome();

export default chrome;
