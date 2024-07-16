import puppeteer, { Browser, Page } from "puppeteer";
import { CustomHeaders, FileMetaData } from "./types";
import unzipper from "unzipper";
import axios from "axios";
import path from "path";
import fs from "fs/promises";
import pidusage from "pidusage";
import os from "os";
import { config } from "./config";

const convertCookiesToAxiosHeaders = (cookies: any[]): CustomHeaders => {
  const cookieStrings = cookies.map(
    (cookie) => `${cookie.name}=${cookie.value};`
  );

  const cookieString = cookieStrings.join(" ");

  return {
    Cookie: cookieString,
  };
};

const getAbsoluteLinkFromElement = async (page: Page, selector: string) => {
  const href = await page.evaluate((sel) => {
    const element = document.querySelector(sel);

    if (element) {
      const href = element.getAttribute("href");

      if (!href) {
        return null;
      }

      return new URL(href, window.location.origin).href;
    }

    return null;
  }, selector);

  return href;
};

const exists = async (path: string) => {
  try {
    await fs.access(path);
    return true;
  } catch (error) {
    const err = error as any;
    if (err.code === "ENOENT") {
      return false;
    } else {
      throw err;
    }
  }
};
const flattenFolder = async (dirPath: string) => {
  const filesInDirectory = async (
    dir: string,
    recursive = true,
    acc: string[] = []
  ): Promise<string[]> => {
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const name = path.join(dir, file);
        const stat = await fs.stat(name);

        if (stat.isDirectory() && recursive) {
          await filesInDirectory(name, recursive, acc);
        } else if (stat.isFile()) {
          acc.push(name);
        }
      }
      return acc;
    } catch (e) {
      return acc;
    }
  };
  const move = async (oldPath: string, newPath: string) => {
    try {
      await fs.rename(oldPath, newPath);
    } catch (e: any) {
      if (e.code === "EXDEV") {
        await fs.copyFile(oldPath, newPath);
        await fs.unlink(oldPath);
      } else {
        throw e;
      }
    }
  };

  const files = await filesInDirectory(dirPath, true);

  for (const orig of files) {
    const destFileName = orig
      .slice(dirPath.length)
      .split(path.sep)
      .filter(Boolean)
      .join("-")
      .split(" ")
      .join("-");

    const dest = path.resolve(dirPath, destFileName);

    await move(orig, dest);
  }
};

const downloadAndExtract = async (
  url: string,
  customHeaders?: CustomHeaders
) => {
  const subDirName = performance.now().toString();

  try {
    const response = await axios.get(url, {
      responseType: "stream",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        ...customHeaders,
      },
    });

    // Ensure the 'temp' directory exists
    await fs.mkdir(config.tempDirPath, { recursive: true });

    // Create subfolder within 'temp' based on performance.now()
    const tempSubDirPath = path.join(config.tempDirPath, subDirName);
    await fs.mkdir(tempSubDirPath, { recursive: true });

    // Pipe the response stream directly to unzipper and extract to the temp directory
    const unzipStream = response.data.pipe(
      unzipper.Extract({ path: tempSubDirPath })
    );

    // Wait for the unzip process to complete
    await new Promise((resolve, reject) => {
      unzipStream.on("close", resolve);
      unzipStream.on("error", reject);
    });

    return tempSubDirPath;
  } catch (error) {
    const err = String(error);
    throw new Error(err);
  }
};

const extractFromFile = async (filePath: string) => {
  const subDirName = performance.now().toString();

  // Ensure the 'temp' directory exists
  await fs.mkdir(config.tempDirPath, { recursive: true });

  // Create subfolder within 'temp' based on performance.now()
  const tempSubDirPath = path.join(config.tempDirPath, subDirName);
  await fs.mkdir(tempSubDirPath, { recursive: true });

  const directory = await unzipper.Open.file(filePath);
  await directory.extract({ path: tempSubDirPath });

  return tempSubDirPath;
};

const escapeCsvValue = (value: string | undefined) =>
  typeof value === "string" &&
  (value.includes(",") || value.includes('"') || value.includes("\n"))
    ? `"${value.replace(/"/g, '""')}"`
    : value;

const emptyFolder = async (folderPath: string) => {
  try {
    const files = await fs.readdir(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);

      await fs.rm(filePath, { recursive: true, force: true });
    }

    console.log(`The folder ${folderPath} has been emptied successfully.`);
  } catch (error) {
    throw new Error(`Error emptying folder ${folderPath}: ${error}`);
  }
};

const initializeBrowser = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  //Randomize viewport size
  await page.setViewport({
    width: 1280 + Math.floor(Math.random() * 100),
    height: 800 + Math.floor(Math.random() * 100),
    deviceScaleFactor: 1,
  });

  return { page, browser };
};

const closeBrowser = async (browser: Browser) => {
  await browser.close();
};

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const countLinesInFile = async (filePath: string): Promise<number> => {
  const fileContents = await fs.readFile(filePath, "utf-8");
  return fileContents.split("\n").length;
};

const extractMetadataFromFile = async (
  filePath: string
): Promise<FileMetaData> => {
  const stats = await fs.stat(filePath);
  const lineCount = await countLinesInFile(filePath);
  const fileName = path.basename(filePath);

  const metadata = {
    name: fileName,
    date: stats.birthtime.toISOString(),
    lines: lineCount,
    size: stats.size,
  };

  return metadata;
};

const getSystemResources = () => {
  // Calculate overall CPU usage
  const cpus = os.cpus();
  const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const totalTick = cpus.reduce(
    (acc, cpu) => acc + Object.values(cpu.times).reduce((a, b) => a + b, 0),
    0
  );
  const cpuUsagePercentage = 100 - (totalIdle / totalTick) * 100;

  return {
    cpuUsagePercentage: cpuUsagePercentage.toFixed(2),
  };
};

const getProcessMemoryUsage = async (pid: number) => {
  const stats = await pidusage(pid);

  const totalMemory = os.totalmem();
  const usedMemory = stats.memory;
  const memoryUsagePercentage = (usedMemory / totalMemory) * 100;

  const memoryUsageMb = usedMemory / (1024 * 1024);

  return {
    memoryUsagePercentage: memoryUsagePercentage.toFixed(2),
    memoryUsageMb: memoryUsageMb.toFixed(2),
  };
};

const monitorSystemResources = async () => {
  const systemResources = getSystemResources();
  const currentProcessMemoryUsage = await getProcessMemoryUsage(process.pid);

  return {
    ...systemResources,
    ...currentProcessMemoryUsage,
  };
};

export {
  convertCookiesToAxiosHeaders,
  getAbsoluteLinkFromElement,
  downloadAndExtract,
  extractFromFile,
  initializeBrowser,
  closeBrowser,
  escapeCsvValue,
  flattenFolder,
  emptyFolder,
  exists,
  extractMetadataFromFile,
  monitorSystemResources,
  sleep,
};
