const { join } = require("path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    // En Render, descargar Chrome en una carpeta .cache persistente
    // ayuda a evitar que se pierda el binario entre builds
    cacheDirectory: join(__dirname, ".cache", "puppeteer"),
};