import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import WebSocket from "ws";

const baseUrl = process.env.LAYOUT_AUDIT_BASE_URL ?? "http://127.0.0.1:3017";
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9332;
const output = path.join(process.cwd(), "artifacts", "layout-audit");
const profile = path.join(process.cwd(), ".tmp", `layout-audit-${Date.now()}`);
const routes = process.argv.slice(2).filter((item) => item.startsWith("/"));
const targets = routes.length ? routes : [
  "/",
  "/giochi",
  "/enciclopedia",
  "/shop",
  "/commissioni",
  "/community",
  "/cronache-del-nexus",
  "/giochi/the-wound-remembers-il-patto-delle-ceneri",
];

await mkdir(output, { recursive: true });
await mkdir(profile, { recursive: true });

const browser = spawn(chrome, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let page;
for (let attempt = 0; attempt < 80; attempt += 1) {
  try {
    const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
    page = pages.find((entry) => entry.type === "page");
    if (page?.webSocketDebuggerUrl) break;
  } catch {}
  await wait(150);
}
if (!page?.webSocketDebuggerUrl) throw new Error("Chrome DevTools non disponibile");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.once("open", resolve); socket.once("error", reject); });
let id = 0;
const pending = new Map();
socket.on("message", (raw) => {
  const message = JSON.parse(String(raw));
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(message.error.message));
  else request.resolve(message.result);
});
const command = (method, params = {}) => new Promise((resolve, reject) => {
  const requestId = ++id;
  pending.set(requestId, { resolve, reject });
  socket.send(JSON.stringify({ id: requestId, method, params }));
});

await command("Page.enable");
await command("Runtime.enable");
await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true, screenWidth: 390, screenHeight: 844 });
await command("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });

const report = [];
for (const route of targets) {
  await command("Page.navigate", { url: `${baseUrl}${route}` });
  await wait(2600);
  const result = await command("Runtime.evaluate", { returnByValue: true, expression: `(() => {
    const visible = (element) => { const style=getComputedStyle(element); const rect=element.getBoundingClientRect(); return style.display!=='none' && style.visibility!=='hidden' && rect.width>0 && rect.height>0; };
    const textElements=[...document.querySelectorAll('h1,h2,h3,h4,p,a,button,li,dt,dd,figcaption,summary')].filter(visible);
    const clipped=textElements.filter((element)=>{ const rect=element.getBoundingClientRect(); const style=getComputedStyle(element); const horizontal=rect.left < -1 || rect.right > innerWidth + 1; const internal=element.scrollWidth > element.clientWidth + 2 && !['auto','scroll'].includes(style.overflowX); return horizontal || internal; }).slice(0,30).map((element)=>({tag:element.tagName,text:(element.textContent||'').trim().replace(/\\s+/g,' ').slice(0,100),left:Math.round(element.getBoundingClientRect().left),right:Math.round(element.getBoundingClientRect().right),width:Math.round(element.getBoundingClientRect().width),scrollWidth:element.scrollWidth,className:String(element.className).slice(0,100)}));
    return { title:document.title, innerWidth, bodyWidth:document.body.scrollWidth, documentWidth:document.documentElement.scrollWidth, clipped };
  })()` });
  const value = result.result.value;
  report.push({ route, ...value });
  const metrics = await command("Page.getLayoutMetrics");
  const height = Math.min(2600, Math.max(844, Math.ceil(metrics.cssContentSize.height)));
  const screenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: 390, height, scale: 1 } });
  const filename = route === "/" ? "home" : route.replace(/^\//, "").replaceAll("/", "-");
  await import("node:fs/promises").then(({ writeFile }) => writeFile(path.join(output, `${filename}-mobile.png`), Buffer.from(screenshot.data, "base64")));
  if (route.includes("the-wound-remembers-il-patto-delle-ceneri")) {
    for (let tabIndex = 1; tabIndex < 5; tabIndex += 1) {
      await command("Runtime.evaluate", { expression: `document.querySelectorAll('[role="tab"]')[${tabIndex}]?.click()` });
      await wait(250);
      const tabResult = await command("Runtime.evaluate", { returnByValue: true, expression: `(() => { const clipped=[...document.querySelectorAll('h1,h2,h3,h4,p,a,button,li,figcaption')].filter((element)=>{const rect=element.getBoundingClientRect();const style=getComputedStyle(element);return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&(rect.left < -1 || rect.right > innerWidth + 1 || (element.scrollWidth > element.clientWidth + 2 && !['auto','scroll'].includes(style.overflowX)));}).slice(0,20).map((element)=>({tag:element.tagName,text:(element.textContent||'').trim().replace(/\\s+/g,' ').slice(0,100)}));return{innerWidth,bodyWidth:document.body.scrollWidth,documentWidth:document.documentElement.scrollWidth,clipped};})()` });
      report.push({ route: `${route}#tab-${tabIndex + 1}`, ...tabResult.result.value });
      const tabMetrics = await command("Page.getLayoutMetrics");
      const tabHeight = Math.min(2600, Math.max(844, Math.ceil(tabMetrics.cssContentSize.height)));
      const tabShot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: 390, height: tabHeight, scale: 1 } });
      await import("node:fs/promises").then(({ writeFile }) => writeFile(path.join(output, `${filename}-tab-${tabIndex + 1}-mobile.png`), Buffer.from(tabShot.data, "base64")));
    }
  }
}

console.log(JSON.stringify(report, null, 2));
socket.close();
browser.kill();
