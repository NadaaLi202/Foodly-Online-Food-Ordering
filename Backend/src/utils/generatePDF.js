import puppeteer from "puppeteer";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fontToDataUri = (fileName) => {
  const fontPath = join(__dirname, "../assets/fonts", fileName);
  const fontBuffer = readFileSync(fontPath);
  return `data:font/ttf;base64,${fontBuffer.toString("base64")}`;
};

const cairoRegular = fontToDataUri("Cairo-Regular.ttf");
const cairoBold = fontToDataUri("Cairo-Bold.ttf");
const PDF_RENDER_TIMEOUT_MS = 15000;
const REMOTE_IMAGE_TIMEOUT_MS = 5000;
const EMPTY_IMAGE_DATA_URI = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const toRemoteImageDataUri = async (src) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REMOTE_IMAGE_TIMEOUT_MS);

  try {
    const response = await fetch(src.replace(/&amp;/g, "&"), {
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/")) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const inlineRemoteImages = async (htmlContent) => {
  const remoteImagePattern = /(<img\b[^>]*\bsrc=["'])(https?:\/\/[^"']+)(["'][^>]*>)/gi;
  const matches = [...String(htmlContent || "").matchAll(remoteImagePattern)];
  if (matches.length === 0) return htmlContent;

  const replacements = await Promise.all(
    matches.map(async (match) => ({
      original: match[0],
      replacement: `${match[1]}${await toRemoteImageDataUri(match[2]) || EMPTY_IMAGE_DATA_URI}${match[3]}`,
    }))
  );

  return replacements.reduce(
    (content, { original, replacement }) => content.replace(original, replacement),
    htmlContent
  );
};

const injectArabicStyles = (htmlContent) => {
  const isBilingual = htmlContent && htmlContent.includes('bilingual-template');
  const styles = `
      <style id="pdf-arabic-fonts">
        @font-face {
          font-family: "Cairo";
          src: url("${cairoRegular}") format("truetype");
          font-weight: 400;
          font-style: normal;
        }
        @font-face {
          font-family: "Cairo";
          src: url("${cairoBold}") format("truetype");
          font-weight: 700;
          font-style: normal;
        }
        ${!isBilingual ? `
        * {
          direction: rtl !important;
          text-align: right !important;
          font-family: "Cairo", "Arial Unicode MS", "Tahoma", sans-serif !important;
          unicode-bidi: embed;
        }
        ` : ''}
        body {
          direction: rtl;
          unicode-bidi: embed;
          font-family: "Cairo", "Arial Unicode MS", "Tahoma", sans-serif ${isBilingual ? '' : '!important'};
        }
        table {
          direction: rtl;
          width: 100%;
          border-collapse: collapse;
        }
        th,
        td {
          direction: rtl;
          text-align: right;
          border: 1px solid #333;
          padding: 8px 10px;
          font-family: "Cairo", "Arial Unicode MS", "Tahoma", sans-serif ${isBilingual ? '' : '!important'};
        }
        .number,
        td.amount,
        td.qty {
          direction: ltr;
          text-align: left;
          unicode-bidi: embed;
        }
      </style>
    `;

  const withUtf8 = String(htmlContent || "").replace(
    /<head>/i,
    `<head><meta charset="UTF-8" />`
  );

  if (withUtf8.includes("</head>")) {
    return withUtf8.replace("</head>", `${styles}</head>`);
  }
  return `${styles}${withUtf8}`;
};

export async function generatePDF(htmlContent, pdfOptions = {}) {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: puppeteer.executablePath(),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote"
    ],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(PDF_RENDER_TIMEOUT_MS);
    page.setDefaultNavigationTimeout(PDF_RENDER_TIMEOUT_MS);

    await page.setExtraHTTPHeaders({
      "Accept-Charset": "utf-8",
    });

    // Block external requests after images are inlined so the browser does not fetch assets.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      if (
        url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.includes('fonts.googleapis.com') ||
        url.includes('fonts.gstatic.com')
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Strip Google Fonts <link> tags from HTML before rendering
    let cleanedHtml = injectArabicStyles(htmlContent);
    cleanedHtml = cleanedHtml.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>/gi, '');
    cleanedHtml = await inlineRemoteImages(cleanedHtml);

    await page.setContent(cleanedHtml, {
      waitUntil: "domcontentloaded",
      timeout: PDF_RENDER_TIMEOUT_MS,
    });
    await page.emulateMediaType("print");
    await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        bottom: "15mm",
        left: "15mm",
        right: "15mm",
      },
      ...pdfOptions,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
