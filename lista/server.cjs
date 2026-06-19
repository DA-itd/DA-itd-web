var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_axios = __toESM(require("axios"), 1);
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/fetch-sheet", async (req, res) => {
    try {
      const { spreadsheetId, gid, sheetName, isPublished } = req.query;
      if (!spreadsheetId) {
        return res.status(400).json({ error: "spreadsheetId is required" });
      }
      let url = "";
      if (isPublished === "true") {
        const gidParam = gid ? `&gid=${gid}` : "";
        url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/pub?output=csv${gidParam}`;
      } else if (sheetName) {
        url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
      } else {
        const gidParam = gid ? `&gid=${gid}` : "";
        url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${gidParam}`;
      }
      const response = await import_axios.default.get(url, { responseType: "text" });
      res.setHeader("Content-Type", "text/csv");
      res.send(response.data);
    } catch (error) {
      console.error("Error fetching sheet:", error.message);
      if (error.response && error.response.status === 401 || error.response?.status === 403) {
        return res.status(400).json({ error: "La hoja de c\xE1lculo no es p\xFAblica o no se tienen permisos. Por favor aseg\xFArate de que el enlace sea 'Cualquier persona con el enlace puede leer'." });
      }
      res.status(500).json({ error: "Error al descargar la hoja de c\xE1lculo. Revisa que el ID sea correcto y sea p\xFAblica." });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
