// Runs after `npm install`. WebViewer loads its UI and core engine as static
// files, so copy them from the npm package into public/ where Vite serves them.
const fs = require("node:fs");
const path = require("node:path");

const source = path.join(__dirname, "..", "node_modules", "@pdftron", "webviewer", "public");
const destination = path.join(__dirname, "..", "public", "webviewer", "lib");

try {
  fs.cpSync(source, destination, { recursive: true });
  console.log("WebViewer files copied to public/webviewer/lib");
} catch (error) {
  console.error("Could not copy the WebViewer files:", error.message);
  process.exit(1);
}
