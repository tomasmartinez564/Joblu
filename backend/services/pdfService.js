import puppeteer from "puppeteer";

let pdfBrowser = null;

const getPdfBrowser = async () => {
    if (pdfBrowser && pdfBrowser.isConnected()) return pdfBrowser;

    console.log("[PDF] Launching shared browser...");
    pdfBrowser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--no-zygote",
            "--disable-gpu"
        ]
    });

    pdfBrowser.on("disconnected", () => {
        console.log("[PDF] Browser disconnected. Resetting instance.");
        pdfBrowser = null;
    });

    return pdfBrowser;
};

export const logMemory = (label) => {
    const m = process.memoryUsage();
    console.log(`[MEM] ${label}`, {
        rss: `${Math.round(m.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(m.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(m.heapTotal / 1024 / 1024)} MB`
    });
};

export const generatePdf = async (htmlContent, styleTags) => {
    let page = null;
    try {
        logMemory("Antes de generar PDF");

        const browser = await getPdfBrowser();
        console.log("[PDF] Opening new page...");
        page = await browser.newPage();

        // Reducir consumo: bloquear recursos externos pesados
        await page.setRequestInterception(true);
        page.on("request", (request) => {
            const resourceType = request.resourceType();
            if (["media"].includes(resourceType)) {
                return request.abort();
            }
            request.continue();
        });

        const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          ${styleTags || ""}
          <style>
            @page { margin: 0; size: A4; }
            html, body {
              margin: 0;
              padding: 0;
              background: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .cv-preview-paper {
              box-shadow: none !important;
              margin: 0 !important;
              width: 100% !important;
              min-height: 297mm;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `;

        console.log("[PDF] Setting content...");
        await page.setContent(fullHtml, {
            waitUntil: "domcontentloaded",
            timeout: 60000 // 60s
        });

        // pausa para layout/fonts locales
        await new Promise((resolve) => setTimeout(resolve, 300));

        console.log("[PDF] Generating PDF buffer...");
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            preferCSSPageSize: true,
            margin: { top: "0", right: "0", bottom: "0", left: "0" }
        });

        logMemory("Después de generar PDF");
        return pdfBuffer;
    } catch (error) {
        console.error("[PDF] Error generando PDF con Puppeteer:", error);
        throw error;
    } finally {
        if (page) {
            try {
                await page.close();
                console.log("[PDF] Page closed.");
            } catch (e) {
                console.warn("[PDF] Error closing page:", e.message);
            }
        }
    }
};
