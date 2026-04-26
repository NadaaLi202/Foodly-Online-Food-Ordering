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
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      "Accept-Charset": "utf-8",
    });

    // Block external font requests to prevent navigation timeout
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Strip Google Fonts <link> tags from HTML before rendering
    let cleanedHtml = injectArabicStyles(htmlContent);
    cleanedHtml = cleanedHtml.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>/gi, '');

    await page.setContent(cleanedHtml, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
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
