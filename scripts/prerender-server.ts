// Tiny static server used only during prerendering.
// Serves files from `dist/` and falls back to `dist/index.html` for
// unknown routes so the SPA router can render them.

import { createServer, IncomingMessage, ServerResponse } from "http";
import { readFile, stat } from "fs/promises";
import { resolve, extname, join } from "path";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

export function startPrerenderServer(distDir: string, port: number) {
  const root = resolve(distDir);
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = new URL(req.url || "/", `http://localhost:${port}`);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith("/")) pathname += "index.html";
      const filePath = join(root, pathname);
      if (!filePath.startsWith(root)) {
        res.writeHead(403).end("forbidden");
        return;
      }
      try {
        const s = await stat(filePath);
        if (s.isFile()) {
          const body = await readFile(filePath);
          const mime = MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
          res.writeHead(200, { "Content-Type": mime, "Cache-Control": "no-store" });
          res.end(body);
          return;
        }
      } catch {}
      // SPA fallback
      const shell = await readFile(join(root, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(shell);
    } catch (e) {
      res.writeHead(500).end(String(e));
    }
  });

  return new Promise<{ stop: () => Promise<void> }>((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(port, "127.0.0.1", () => {
      resolvePromise({
        stop: () =>
          new Promise<void>((r) => server.close(() => r())),
      });
    });
  });
}
