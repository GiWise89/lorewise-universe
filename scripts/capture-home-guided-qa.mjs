import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import WebSocket from "ws";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browserExecutable = existsSync(edge) ? edge : chrome;
const outputRoot = path.join(process.cwd(), "artifacts", "home-guided-qa");
const profileRoot = path.join(process.cwd(), ".tmp", `home-guided-cdp-${Date.now()}`);
const baseUrl = process.env.LOREWISE_QA_URL ?? "http://127.0.0.1:3016";
const qaScope = process.env.LOREWISE_QA_SCOPE ?? "all";
const port = 9400 + Math.floor(Math.random() * 400);

await mkdir(outputRoot, { recursive: true });
await mkdir(profileRoot, { recursive: true });

let browser;
let socket;
let commandId = 0;
const pending = new Map();

function command(method, params = {}, timeoutMs = 15_000) {
  commandId += 1;
  return new Promise((resolve, reject) => {
    const id = commandId;
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method}: timeout`));
    }, timeoutMs);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function waitForPage() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const pages = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(800) }).then((response) => response.json());
      const page = pages.find((entry) => entry.type === "page");
      if (page?.webSocketDebuggerUrl) return page;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  throw new Error("Browser CDP non disponibile");
}

async function evaluate(expression) {
  const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  return result.result?.value;
}

async function screenshot(name) {
  const result = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
  await writeFile(path.join(outputRoot, `${name}.png`), Buffer.from(result.data, "base64"));
}

async function captureView(name, width, height) {
  await command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false, screenWidth: width, screenHeight: height });
  await command("Page.navigate", { url: baseUrl }, 30_000);
  await evaluate(`new Promise((resolve, reject) => {
    const started=Date.now();
    const ready=()=>{
      const paths=[...document.querySelectorAll('nav[aria-label="Tre modi per esplorare LoreWise Universe"] > :is(a, article)')];
      if(document.readyState==='complete' && paths.length===3 && paths.every((path)=>path.getBoundingClientRect().width>0)) return resolve(true);
      if(Date.now()-started>12000) return reject(new Error('Homepage non pronta'));
      setTimeout(ready,100);
    };
    ready();
  })`);
  await evaluate("Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1800))])");
  await evaluate("Promise.race([Promise.all([...document.images].map((image) => image.complete ? Promise.resolve() : image.decode().catch(() => {}))), new Promise((resolve) => setTimeout(resolve, 3500))])");
  await evaluate("new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))");

  const audit = await evaluate(`(() => {
    const rect = (element) => element ? (() => { const r = element.getBoundingClientRect(); return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height }; })() : null;
    const paths = [...document.querySelectorAll('nav[aria-label="Tre modi per esplorare LoreWise Universe"] > :is(a, article)')];
    const games = [...document.querySelectorAll('section[aria-labelledby="games-overview-title"] a[href^="/giochi/"]')];
    const services = [...document.querySelectorAll('nav[aria-label="Servizi e vantaggi di LoreWise Universe"] > a')];
    const visibleImages = [...document.images].filter((image) => { const r = image.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
    const overflow = [...document.querySelectorAll('body *')].filter((element) => { const r = element.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).slice(0, 10).map((element) => ({ tag:element.tagName, className:String(element.className).slice(0,100), rect:rect(element) }));
    return {
      viewport:{ width:innerWidth, height:innerHeight },
      document:{ width:document.documentElement.scrollWidth, height:document.documentElement.scrollHeight },
      mainCount:document.querySelectorAll('main').length,
      h1Count:document.querySelectorAll('h1').length,
      pathCount:paths.length,
      gameCount:games.length,
      gameLabels:games.map((game) => game.innerText.replace(/\\s+/g,' ').trim()),
      serviceCount:services.length,
      serviceLabels:services.map((service) => service.innerText.replace(/\\s+/g,' ').trim()),
      pathLabels:paths.map((path) => path.innerText.replace(/\\s+/g,' ').trim()),
      pathRects:paths.map(rect),
      brokenImages:[...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
      visibleImageFit:visibleImages.map((image) => ({ src:(image.currentSrc || image.src).split('/').slice(-2).join('/'), fit:getComputedStyle(image).objectFit, rect:rect(image) })).slice(0,12),
      overflow,
    };
  })()`);

  await evaluate("scrollTo(0,0)");
  await evaluate("new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
  await screenshot(`${name}-hero`);
  await evaluate("document.querySelector('section[aria-labelledby=\"games-overview-title\"]')?.scrollIntoView({block:'start'})");
  await evaluate("new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
  await screenshot(`${name}-games`);
  await evaluate("document.querySelector('section[aria-labelledby=\"guided-entry-title\"]')?.scrollIntoView({block:'start'})");
  await evaluate("new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
  await screenshot(`${name}-guided`);
  await evaluate("document.querySelector('nav[aria-label=\"Tre modi per esplorare LoreWise Universe\"] > article')?.scrollIntoView({block:'center'})");
  await evaluate("new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
  await screenshot(`${name}-create-or-collect`);
  await evaluate("document.querySelector('section[aria-labelledby=\"services-title\"]')?.scrollIntoView({block:'start'})");
  await evaluate("new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
  await screenshot(`${name}-services`);
  await evaluate("document.querySelector('section[aria-label=\"Come usare LoreWise Universe\"]')?.scrollIntoView({block:'start'})");
  await evaluate("new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
  await screenshot(`${name}-orientation`);

  if (width <= 1100) {
    await evaluate("scrollTo(0,0); document.querySelector('.mobile-menu-trigger')?.click()");
    const menuAudit = await evaluate(`(() => {
      const menu=document.querySelector('#mobile-navigation');
      const links=[...menu.querySelectorAll('a')];
      return { open:!menu.hidden, linkCount:links.length, labels:links.map((link)=>link.innerText.replace(/\\s+/g,' ').trim()), scrollHeight:menu.scrollHeight, clientHeight:menu.clientHeight };
    })()`);
    audit.menu = menuAudit;
    await screenshot(`${name}-menu`);
    await evaluate("document.querySelector('.mobile-menu-trigger')?.click()");
  }

  return audit;
}

async function captureWorlds(name, width, height) {
  await command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false, screenWidth: width, screenHeight: height });
  await command("Page.navigate", { url: `${baseUrl}/mondi` }, 30_000);
  await evaluate(`new Promise((resolve, reject) => {
    const started=Date.now();
    const ready=()=>{
      const routes=[...document.querySelectorAll('nav[aria-label="I tre percorsi dell’area Mondi"] > a')];
      if(document.readyState==='complete' && routes.length===3 && routes.every((route)=>route.getBoundingClientRect().width>0)) return resolve(true);
      if(Date.now()-started>12000) return reject(new Error('Mondi non pronta'));
      setTimeout(ready,100);
    };
    ready();
  })`);
  await evaluate("Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1800))])");
  await evaluate("Promise.race([Promise.all([...document.images].map((image) => image.complete ? Promise.resolve() : image.decode().catch(() => {}))), new Promise((resolve) => setTimeout(resolve, 3500))])");
  const audit = await evaluate(`(() => {
    const routes=[...document.querySelectorAll('nav[aria-label="I tre percorsi dell’area Mondi"] > a')];
    return {
      viewport:{width:innerWidth,height:innerHeight},
      documentWidth:document.documentElement.scrollWidth,
      h1:document.querySelector('h1')?.innerText,
      routeCount:routes.length,
      routeLabels:routes.map((route)=>route.innerText.replace(/\\s+/g,' ').trim()),
      containsCommunity:[...document.querySelectorAll('main a')].some((link)=>link.getAttribute('href')==='/community'),
      brokenImages:[...document.images].filter((image)=>image.complete && image.naturalWidth===0).map((image)=>image.currentSrc||image.src),
      overflow:[...document.querySelectorAll('body *')].filter((element)=>{const r=element.getBoundingClientRect();return r.left < -1 || r.right > innerWidth + 1;}).slice(0,10).map((element)=>String(element.className).slice(0,100)),
    };
  })()`);
  await screenshot(`${name}-worlds`);
  return audit;
}

async function captureArt(name, width, height) {
  await command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false, screenWidth: width, screenHeight: height });
  await command("Page.navigate", { url: `${baseUrl}/arte` }, 30_000);
  await evaluate(`new Promise((resolve, reject) => {
    const started=Date.now();
    const ready=()=>{
      const cards=[...document.querySelectorAll('.uniform-art-gallery .draft-artwork')];
      if(document.readyState==='complete' && cards.length>=6 && cards.every((card)=>card.getBoundingClientRect().width>0)) return resolve(true);
      if(Date.now()-started>12000) return reject(new Error('Arte non pronta'));
      setTimeout(ready,100);
    };
    ready();
  })`);
  await evaluate("Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1800))])");
  await evaluate("Promise.race([Promise.all([...document.images].map((image) => image.complete ? Promise.resolve() : image.decode().catch(() => {}))), new Promise((resolve) => setTimeout(resolve, 3500))])");
  const audit = await evaluate(`(() => {
    const hero=document.querySelector('.art-page-hero');
    const tools=document.querySelector('#art-index');
    const cards=[...document.querySelectorAll('.uniform-art-gallery .draft-artwork')];
    const rect=(element)=>{const r=element?.getBoundingClientRect();return r?{top:r.top,left:r.left,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null;};
    return {
      viewport:{width:innerWidth,height:innerHeight},
      document:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},
      hero:rect(hero),tools:rect(tools),firstCard:rect(cards[0]),cardCount:cards.length,
      cardWidths:[...new Set(cards.map((card)=>Math.round(card.getBoundingClientRect().width)))],
      brokenImages:[...document.images].filter((image)=>image.complete&&image.naturalWidth===0).map((image)=>image.currentSrc||image.src),
      overflow:[...document.querySelectorAll('body *')].filter((element)=>{const r=element.getBoundingClientRect();return r.left < -1 || r.right > innerWidth + 1;}).slice(0,10).map((element)=>String(element.className).slice(0,100)),
    };
  })()`);
  await evaluate("scrollTo(0,0)");
  await screenshot(`${name}-art-hero`);
  await evaluate("document.querySelector('#art-index')?.scrollIntoView({block:'start'})");
  await screenshot(`${name}-art-tools`);
  await evaluate("document.querySelector('.uniform-art-gallery')?.scrollIntoView({block:'start'})");
  await screenshot(`${name}-art-gallery`);
  return audit;
}

async function captureCommissions(name, width, height) {
  await command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false, screenWidth: width, screenHeight: height });
  await command("Page.navigate", { url: `${baseUrl}/commissioni` }, 30_000);
  await evaluate(`new Promise((resolve, reject) => {
    const started=Date.now();
    const ready=()=>{
      const packages=[...document.querySelectorAll('.commission-quick-start article')];
      const examples=[...document.querySelectorAll('.commission-featured-grid > a')];
      if(document.readyState==='complete' && packages.length===3 && examples.length===6) return resolve(true);
      if(Date.now()-started>12000) return reject(new Error('Commissioni non pronta'));
      setTimeout(ready,100);
    };
    ready();
  })`);
  await evaluate("Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1800))])");
  await evaluate("Promise.race([Promise.all([...document.images].map((image) => image.complete ? Promise.resolve() : image.decode().catch(() => {}))), new Promise((resolve) => setTimeout(resolve, 3500))])");
  const audit = await evaluate(`(() => {
    const rect=(element)=>{const r=element?.getBoundingClientRect();return r?{top:r.top,left:r.left,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null;};
    const hero=document.querySelector('.commission-hero');
    const quick=document.querySelector('.commission-quick-start');
    const chapters=[...document.querySelectorAll('.commission-chapter-navigation nav > a')];
    const examples=[...document.querySelectorAll('.commission-featured-grid > a')];
    const steps=[...document.querySelectorAll('.commission-overview-process ol > li')];
    return {
      viewport:{width:innerWidth,height:innerHeight},
      document:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},
      hero:rect(hero),quick:rect(quick),chapterCount:chapters.length,chapterRects:chapters.map(rect),
      exampleCount:examples.length,exampleWidths:[...new Set(examples.map((item)=>Math.round(item.getBoundingClientRect().width)))],stepCount:steps.length,
      brokenImages:[...document.images].filter((image)=>image.complete&&image.naturalWidth===0).map((image)=>image.currentSrc||image.src),
      overflow:[...document.querySelectorAll('body *')].filter((element)=>{const r=element.getBoundingClientRect();return r.left < -1 || r.right > innerWidth + 1;}).slice(0,10).map((element)=>String(element.className).slice(0,100)),
    };
  })()`);
  await evaluate("scrollTo(0,0)");
  await screenshot(`${name}-commission-hero`);
  await evaluate("document.querySelector('.commission-quick-start')?.scrollIntoView({block:'start'})");
  await screenshot(`${name}-commission-prices`);
  await evaluate("document.querySelector('.commission-chapter-navigation')?.scrollIntoView({block:'start'})");
  await screenshot(`${name}-commission-navigation`);
  await evaluate("document.querySelector('.commission-featured')?.scrollIntoView({block:'start'})");
  await screenshot(`${name}-commission-examples`);
  await evaluate("document.querySelector('.commission-overview-process')?.scrollIntoView({block:'start'})");
  await screenshot(`${name}-commission-process`);
  audit.chapters = {};
  for (const chapter of ["prezzi", "portfolio", "metodo"]) {
    await command("Page.navigate", { url: `${baseUrl}/commissioni?view=${chapter}` }, 30_000);
    await evaluate(`new Promise((resolve, reject) => {
      const started=Date.now();
      const ready=()=>{
        const title=document.querySelector('.commission-chapter-masthead h1');
        if(document.readyState==='complete' && title?.getBoundingClientRect().height>0) return resolve(true);
        if(Date.now()-started>12000) return reject(new Error('Capitolo Commissioni non pronto'));
        setTimeout(ready,100);
      };
      ready();
    })`);
    await evaluate("Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1800))])");
    audit.chapters[chapter] = await evaluate(`(() => {
      const eyebrow=document.querySelector('.commission-chapter-masthead .eyebrow')?.getBoundingClientRect();
      const title=document.querySelector('.commission-chapter-masthead h1')?.getBoundingClientRect();
      return {eyebrowBottom:eyebrow?.bottom,titleTop:title?.top,gap:title && eyebrow ? title.top-eyebrow.bottom : null,overflow:document.documentElement.scrollWidth>innerWidth};
    })()`);
    await screenshot(`${name}-commission-${chapter}`);
  }
  return audit;
}

async function captureFocusedRoute(name, width, height, route, readySelector, prefix, sections) {
  await command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false, screenWidth: width, screenHeight: height });
  await command("Page.navigate", { url: `${baseUrl}${route}` }, 30_000);
  await evaluate(`new Promise((resolve, reject) => {
    const started=Date.now();
    const ready=()=>{
      if(document.readyState==='complete' && document.querySelector(${JSON.stringify(readySelector)})) return resolve(true);
      if(Date.now()-started>12000) return reject(new Error('Percorso non pronto'));
      setTimeout(ready,100);
    };
    ready();
  })`);
  await evaluate("Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1800))])");
  await evaluate("Promise.race([Promise.all([...document.images].map((image) => image.complete ? Promise.resolve() : image.decode().catch(() => {}))), new Promise((resolve) => setTimeout(resolve, 3500))])");
  const audit = await evaluate(`(() => ({
    viewport:{width:innerWidth,height:innerHeight},document:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},
    h1:document.querySelector('h1')?.innerText,sectionCount:document.querySelectorAll('main > section').length,
    brokenImages:[...document.images].filter((image)=>image.complete&&image.naturalWidth===0).map((image)=>image.currentSrc||image.src),
    overflow:[...document.querySelectorAll('body *')].filter((element)=>{const r=element.getBoundingClientRect();return r.left < -1 || r.right > innerWidth + 1;}).slice(0,10).map((element)=>String(element.className).slice(0,100)),
    headingGaps:[...document.querySelectorAll('.eyebrow')].map((eyebrow)=>{const title=eyebrow.parentElement?.querySelector(':scope > h1, :scope > h2');if(!title)return null;const e=eyebrow.getBoundingClientRect();const t=title.getBoundingClientRect();return {eyebrow:eyebrow.textContent?.trim(),title:title.textContent?.trim(),gap:t.top-e.bottom,overlap:t.top<e.bottom};}).filter(Boolean)
  }))()`);
  audit.anchorNavigation = await evaluate(`(async () => {
    const link=document.querySelector('a[href="#vantaggi"]');
    const target=document.querySelector('#vantaggi');
    if(!link || !target) return null;
    scrollTo(0,0);
    const beforeY=scrollY;
    link.click();
    await new Promise((resolve)=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    return {beforeY,afterY:scrollY,hash:location.hash,targetTop:target.getBoundingClientRect().top,worked:location.hash==='#vantaggi' && scrollY>beforeY};
  })()`);
  await evaluate("scrollTo(0,0)");
  await screenshot(`${name}-${prefix}-hero`);
  for (const [label, selector] of sections) {
    await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'start'})`);
    await screenshot(`${name}-${prefix}-${label}`);
  }
  return audit;
}

try {
  browser = spawn(browserExecutable, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileRoot}`,
    "--window-size=1440,1100",
    "about:blank",
  ], { stdio: "ignore", windowsHide: true });
  const page = await waitForPage();
  socket = new WebSocket(page.webSocketDebuggerUrl);
  socket.on("message", (raw) => {
    const message = JSON.parse(String(raw));
    const request = pending.get(message.id);
    if (!request) return;
    clearTimeout(request.timeout);
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  await new Promise((resolve, reject) => { socket.once("open", resolve); socket.once("error", reject); });
  await command("Page.enable");
  await command("Runtime.enable");
  await command("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  const results = qaScope === "news" ? {
    newsDesktop: await captureFocusedRoute("desktop", 1440, 1000, "/cronache-del-nexus", "#nexus-calendar-title", "news", [["calendar", "#calendario"]]),
    newsMobile: await captureFocusedRoute("mobile", 390, 844, "/cronache-del-nexus", "#nexus-calendar-title", "news", [["calendar", "#calendario"]]),
  } : qaScope === "art" ? {
    artDesktop: await captureArt("desktop", 1440, 1000),
    artMobile: await captureArt("mobile", 390, 844),
  } : qaScope === "commission" ? {
    commissionDesktop: await captureCommissions("desktop", 1440, 1000),
    commissionMobile: await captureCommissions("mobile", 390, 844),
  } : qaScope === "journeys" ? {
    passDesktop: await captureFocusedRoute("desktop", 1440, 1000, "/abbonamento", "#pass-title", "pass", [["plans", "#piani"], ["benefits", "#vantaggi"], ["games", "section[aria-labelledby='pass-game-title']"]]),
    passMobile: await captureFocusedRoute("mobile", 390, 844, "/abbonamento", "#pass-title", "pass", [["plans", "#piani"], ["benefits", "#vantaggi"], ["games", "section[aria-labelledby='pass-game-title']"]]),
    communityDesktop: await captureFocusedRoute("desktop", 1440, 1000, "/community", "#community-title", "community", [["choices", "section[aria-labelledby='community-choose-title']"], ["world", "section[aria-labelledby='community-world-title']"], ["spaces", "section[aria-labelledby='community-spaces-title']"], ["social", "section[aria-labelledby='community-social-title']"]]),
    communityMobile: await captureFocusedRoute("mobile", 390, 844, "/community", "#community-title", "community", [["choices", "section[aria-labelledby='community-choose-title']"], ["world", "section[aria-labelledby='community-world-title']"], ["spaces", "section[aria-labelledby='community-spaces-title']"], ["social", "section[aria-labelledby='community-social-title']"]]),
    commissionDesktop: await captureCommissions("desktop", 1440, 1000),
    commissionMobile: await captureCommissions("mobile", 390, 844),
  } : qaScope === "redesign" ? {
    newsDesktop: await captureFocusedRoute("desktop", 1440, 1000, "/cronache-del-nexus", "#nexus-calendar-title", "news", [["calendar", "#calendario"]]),
    newsMobile: await captureFocusedRoute("mobile", 390, 844, "/cronache-del-nexus", "#nexus-calendar-title", "news", [["calendar", "#calendario"]]),
    accountDesktop: await captureFocusedRoute("desktop", 1440, 1000, "/account", "#account-title", "account", []),
    accountMobile: await captureFocusedRoute("mobile", 390, 844, "/account", "#account-title", "account", []),
    passDesktop: await captureFocusedRoute("desktop", 1440, 1000, "/abbonamento", "#pass-title", "pass-review", [["plans", "#piani"], ["benefits", "#vantaggi"]]),
    passMobile: await captureFocusedRoute("mobile", 390, 844, "/abbonamento", "#pass-title", "pass-review", [["plans", "#piani"], ["benefits", "#vantaggi"]]),
    codexDesktop: await captureFocusedRoute("desktop", 1440, 1000, "/enciclopedia", ".codex-home-copy h1", "codex", []),
    codexMobile: await captureFocusedRoute("mobile", 390, 844, "/enciclopedia", ".codex-home-copy h1", "codex", []),
    requestDesktop: await captureFocusedRoute("desktop", 1440, 1000, "/commissioni?request=preventivo&package=La%20mia%20versione%20corrotta&anteprima=halloween", ".commission-request-focus-intro h1", "commission-request", [["promotion", ".commission-request-promotion-summary"], ["form", "#richiesta"]]),
    requestMobile: await captureFocusedRoute("mobile", 390, 844, "/commissioni?request=preventivo&package=La%20mia%20versione%20corrotta&anteprima=halloween", ".commission-request-focus-intro h1", "commission-request", [["promotion", ".commission-request-promotion-summary"], ["form", "#richiesta"]]),
  } : {
    desktop: await captureView("desktop", 1440, 1000),
    mobile: await captureView("mobile", 390, 844),
    worldsDesktop: await captureWorlds("desktop", 1440, 1000),
    worldsMobile: await captureWorlds("mobile", 390, 844),
    artDesktop: await captureArt("desktop", 1440, 1000),
    artMobile: await captureArt("mobile", 390, 844),
    commissionDesktop: await captureCommissions("desktop", 1440, 1000),
    commissionMobile: await captureCommissions("mobile", 390, 844),
  };
  await writeFile(path.join(outputRoot, "report.json"), `${JSON.stringify(results, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(results, null, 2));
} finally {
  socket?.close();
  if (browser && browser.exitCode === null) {
    const exited = new Promise((resolve) => browser.once("exit", resolve));
    browser.kill();
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 3_000))]);
  }
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      await rm(profileRoot, { recursive: true, force: true });
      break;
    } catch (error) {
      if (attempt === 9) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}
