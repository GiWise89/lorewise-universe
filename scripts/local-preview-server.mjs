import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const port = Number(process.argv[2] ?? 3000);
const clientRoot = resolve("dist/client");
const workerUrl = pathToFileURL(resolve("dist/server/index.js"));
workerUrl.searchParams.set("preview", String(Date.now()));
const { default: worker } = await import(workerUrl.href);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

async function serveAsset(request) {
  const pathname = decodeURIComponent(new URL(request.url).pathname).replace(/^\/+/, "");
  if (!pathname) return new Response("Not found", { status: 404 });
  const filePath = resolve(clientRoot, pathname);
  if (filePath !== clientRoot && !filePath.startsWith(`${clientRoot}${sep}`)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const info = await stat(filePath);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    return new Response(await readFile(filePath), {
      headers: {
        "cache-control": "no-store",
        "content-type": contentTypes.get(extname(filePath).toLowerCase()) ?? "application/octet-stream",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

const server = createServer(async (incoming, outgoing) => {
  try {
    const url = `http://${incoming.headers.host ?? `localhost:${port}`}${incoming.url ?? "/"}`;
    const request = new Request(url, { method: incoming.method, headers: incoming.headers });
    const assetResponse = await serveAsset(request);
    const response = assetResponse.status === 404
      ? await worker.fetch(request, { ASSETS: { fetch: serveAsset } }, { waitUntil() {}, passThroughOnException() {} })
      : assetResponse;
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    outgoing.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    outgoing.end(error instanceof Error ? error.message : "Preview server error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`LoreWise preview disponibile su http://localhost:${port}`);
});
