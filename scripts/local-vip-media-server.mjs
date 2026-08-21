import { createServer } from "node:http";
import path from "node:path";
import { Readable } from "node:stream";
import { Miniflare } from "miniflare";

const host = "127.0.0.1";
const port = Number(process.env.LOREWISE_LOCAL_VIP_MEDIA_PORT || 3011);
const root = process.cwd();

const miniflare = new Miniflare({
  resourcePersistencePath: path.join(root, ".wrangler", "state", "v3"),
  workers: [{
    config: {
      name: "lorewise-vip-media-local",
      type: "worker",
      compatibilityDate: "2026-08-21",
      manifest: {
        mainModule: "index.js",
        modules: {
          "index.js": {
            type: "esm",
            contents: "export default { async fetch() { return new Response('LoreWise VIP media'); } }",
          },
        },
      },
      env: { COMMISSION_UPLOADS: { type: "r2", name: "site-creator-r2" } },
    },
  }],
});

const bucket = await miniflare.getR2Bucket("COMMISSION_UPLOADS");
function contentTypeFor(key, storedType) {
  if (storedType && storedType !== "application/octet-stream") return storedType;
  const extension = path.extname(key).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${host}:${port}`);
    const key = url.searchParams.get("key") || "";
    if (url.pathname !== "/media" || !key.startsWith("vip-zone/")) {
      response.writeHead(404).end();
      return;
    }
    const object = await bucket.get(key);
    if (!object?.body) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      "Content-Type": contentTypeFor(key, object.httpMetadata?.contentType),
      "Content-Length": String(object.size),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    Readable.fromWeb(object.body).pipe(response);
  } catch {
    response.writeHead(500).end();
  }
});

server.listen(port, host, () => {
  console.log(`LoreWise VIP local media ready at http://${host}:${port}/media`);
});

async function close() {
  server.close();
  await miniflare.dispose();
}
process.once("SIGINT", close);
process.once("SIGTERM", close);
