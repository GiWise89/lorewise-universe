import { spawn, spawnSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import WebSocket from "ws";
import { FAMILIAR_COLLECTION } from "../lib/famiglioMarketExpansion.ts";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browserExecutable = existsSync(chrome) ? chrome : edge;
const projectRoot = process.cwd();
const outputRoot = path.join(projectRoot, "artifacts", "famiglio-rebuild-qa");
const profileRoot = path.join(projectRoot, ".tmp", `famiglio-cdp-${Date.now()}`);
const port = 9331;
const previewBaseUrl = process.env.FAMIGLIO_QA_BASE_URL ?? "http://127.0.0.1:3016";
const cliArguments = process.argv.slice(2);
const requestedScreens = new Set(cliArguments.filter((argument) => !argument.startsWith("view:") && !argument.startsWith("mode:")));
const requestedViews = new Set(cliArguments.filter((argument) => argument.startsWith("view:")).map((argument) => argument.slice(5)));
const allRosterMode = !cliArguments.includes("mode:standard");
// Bootstrap the React experience at a stable desktop width, then apply mobile
// metrics. This avoids measuring the server-rendered starter screen before the
// local preview state has hydrated, while the final capture remains 390px wide.
const nativeMobileLaunch = false;
const launchViewport = nativeMobileLaunch ? { width: 390, height: 844 } : { width: 1440, height: 1100 };

await mkdir(outputRoot, { recursive: true });
await mkdir(profileRoot, { recursive: true });

let browser = null;
let socket = null;
let browserStderr = "";

async function waitForPage() {
  let targetRequested = false;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const pages = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(900) }).then((response) => response.json());
      const page = pages.find((entry) => entry.type === "page" && !String(entry.url).startsWith("edge://"));
      if (page?.webSocketDebuggerUrl) return page;
      if (!targetRequested && attempt >= 5) {
        targetRequested = true;
        const created = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
          method: "PUT",
          signal: AbortSignal.timeout(900),
        }).then((response) => response.json());
        if (created?.webSocketDebuggerUrl) return created;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  const exitState = browser
    ? `browserExit=${browser.exitCode ?? "running"}; signal=${browser.signalCode ?? "none"}`
    : "browser=not-started";
  throw new Error(`Pagina di debug browser non disponibile (${exitState}). ${browserStderr.trim()}`);
}

let commandId = 0;
const pending = new Map();

function settlePending(error) {
  for (const [id, request] of pending) {
    clearTimeout(request.timeout);
    request.reject(error);
    pending.delete(id);
  }
}

function handleSocketMessage(raw) {
  const message = JSON.parse(String(raw));
  const request = pending.get(message.id);
  if (!request) return;
  clearTimeout(request.timeout);
  pending.delete(message.id);
  if (message.error) request.reject(new Error(message.error.message));
  else request.resolve(message.result);
}

function command(method, params = {}, timeoutMs = 8_000) {
  commandId += 1;
  return new Promise((resolve, reject) => {
    const id = commandId;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      reject(new Error(`${method}: collegamento CDP non disponibile`));
      return;
    }
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method}: timeout dopo ${timeoutMs} ms`));
    }, timeoutMs);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }), (error) => {
      if (!error) return;
      clearTimeout(timeout);
      pending.delete(id);
      reject(error);
    });
  });
}

const auditResults = [];

async function setResponsiveViewport(width, height) {
  await command("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: width,
    screenHeight: height,
  }, 30_000);
}

async function capture(name, url, width, height, mobile, setup = "") {
  let setupResult = null;
  console.log(`[qa] ${name}: avvio`);
  if (!mobile || !nativeMobileLaunch) await setResponsiveViewport(mobile ? 1024 : width, mobile ? Math.max(height, 768) : height);
  await command("Page.enable");
  await command("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await command("Page.navigate", { url }, 30_000);
  console.log(`[qa] ${name}: navigazione`);
  if (mobile && nativeMobileLaunch) await new Promise((resolve) => setTimeout(resolve, 12_000));
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const ready = await command("Runtime.evaluate", {
      expression: `Boolean(document.querySelector('.famiglio-game-root'))`,
      returnByValue: true,
    }, 30_000);
    if (ready.result?.value) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  await command("Runtime.evaluate", {
    expression: "Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((resolve) => setTimeout(resolve, 1500))])",
    awaitPromise: true,
  });
  if (mobile) {
    if (!nativeMobileLaunch) {
      await setResponsiveViewport(width, height);
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
    const viewport = await command("Runtime.evaluate", {
      expression: "({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio })",
      returnByValue: true,
    });
    if (viewport.result?.value?.width !== width) throw new Error(`${name}: viewport mobile ${viewport.result?.value?.width ?? "assente"}, atteso ${width}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 450));
  console.log(`[qa] ${name}: esperienza pronta`);
  if (setup) {
    setupResult = await command("Runtime.evaluate", { expression: setup, awaitPromise: true, returnByValue: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  const audit = await command("Runtime.evaluate", { expression: `(() => {
    const screen = document.querySelector('[aria-label="Mercato del Nexus"]')
      || document.querySelector('[aria-label="Spedizioni del Nexus"]')
      || document.querySelector('[aria-label="Sentieri del Nexus"]')
      || document.querySelector('[aria-label="Arena dei Famigli"]')
      || document.querySelector('[aria-label="Missioni giornaliere del Famiglio"]')
      || document.querySelector('[aria-label^="Diario di "]')
      || document.querySelector('.famiglio-game-root');
    const cards = screen ? [...screen.querySelectorAll('article')] : [];
    const controls = screen ? [...screen.querySelectorAll('button')] : [];
    const intersects = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
    const overlaps = [];
    for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i].getBoundingClientRect(), b = cards[j].getBoundingClientRect();
      if (intersects(a, b)) overlaps.push([cards[i].innerText.slice(0,40), cards[j].innerText.slice(0,40)]);
    }
    const clippedButtons = controls.filter((button) => {
      const style = getComputedStyle(button);
      const r = button.getBoundingClientRect(); const p = button.parentElement?.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden' || r.width === 0 || r.height === 0) return false;
      if (p) {
        const parentStyle = getComputedStyle(button.parentElement);
        if (['auto','scroll'].includes(parentStyle.overflowY) && button.parentElement.scrollHeight > button.parentElement.clientHeight) return false;
        if (['auto','scroll'].includes(parentStyle.overflowX) && button.parentElement.scrollWidth > button.parentElement.clientWidth) return false;
      }
      return p && (r.left < p.left - 1 || r.right > p.right + 1 || r.top < p.top - 1 || r.bottom > p.bottom + 1);
    }).map((button) => button.innerText);
    const scrollables = [...document.querySelectorAll('*')].filter((node) => node.scrollHeight > node.clientHeight + 2 && ['auto','scroll'].includes(getComputedStyle(node).overflowY)).length;
    const horizontalScrollables = [...document.querySelectorAll('*')].filter((node) => node.scrollWidth > node.clientWidth + 2 && ['auto','scroll'].includes(getComputedStyle(node).overflowX)).map((node) => ({
      tag: node.tagName.toLowerCase(),
      className: typeof node.className === 'string' ? node.className : '',
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
      children: [...node.children].map((child) => ({
        tag: child.tagName.toLowerCase(),
        className: typeof child.className === 'string' ? child.className : '',
        left: Number(child.getBoundingClientRect().left.toFixed(2)),
        right: Number(child.getBoundingClientRect().right.toFixed(2)),
        width: Number(child.getBoundingClientRect().width.toFixed(2)),
        clientWidth: child.clientWidth,
        scrollWidth: child.scrollWidth,
      })),
    }));
    const dialogNode = document.querySelector('[role="dialog"]');
    const dialog = dialogNode?.getBoundingClientRect();
    const dialogStyle = dialogNode ? getComputedStyle(dialogNode) : null;
    const homeCanvasNode = document.querySelector('canvas[aria-label^="Casa di "]');
    const homeCanvas = homeCanvasNode?.getBoundingClientRect();
    const shellNode = document.querySelector('.famiglio-game-root > section');
    const shell = shellNode?.getBoundingClientRect();
    const shellTop = shellNode?.querySelector(':scope > header')?.getBoundingClientRect();
    const shellIntro = shellNode?.querySelector(':scope > section')?.getBoundingClientRect();
    const shellStage = shellNode?.querySelector(':scope > section + section')?.getBoundingClientRect();
    const shellControls = shellNode?.querySelector(':scope > nav')?.getBoundingClientRect();
    const rect = (value) => value ? Object.fromEntries(['left','top','right','bottom','width','height'].map((key) => [key, Number(value[key].toFixed(2))])) : null;
    return {
      deviceGeometry: { viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio }, shell: rect(shell), top: rect(shellTop), introduction: rect(shellIntro), stage: rect(shellStage), controls: rect(shellControls) },
      screen: screen ? { clientHeight: screen.clientHeight, scrollHeight: screen.scrollHeight, overflowY: getComputedStyle(screen).overflowY } : null,
      home: homeCanvas ? {
        label: homeCanvasNode.getAttribute('aria-label'),
        left: homeCanvas.left,
        top: homeCanvas.top,
        right: homeCanvas.right,
        bottom: homeCanvas.bottom,
        width: homeCanvas.width,
        height: homeCanvas.height,
        bitmapWidth: homeCanvasNode.width,
        bitmapHeight: homeCanvasNode.height,
        fullyVisible: homeCanvas.left >= 0 && homeCanvas.right <= innerWidth && homeCanvas.top >= 0 && homeCanvas.bottom <= innerHeight,
      } : null,
      dialog: dialog ? { top: dialog.top, left: dialog.left, right: dialog.right, bottom: dialog.bottom, opacity: dialogStyle.opacity, visibility: dialogStyle.visibility, display: dialogStyle.display, zIndex: dialogStyle.zIndex, background: dialogStyle.backgroundImage, text: dialogNode.innerText.slice(0, 80) } : null,
      overlaps,
      clippedButtons,
      scrollables,
      horizontalScrollables,
      rootHorizontalOverflow: document.documentElement.scrollWidth > innerWidth + 2,
      screenHorizontalOverflow: Boolean(screen && screen.scrollWidth > screen.clientWidth + 2),
      horizontalOverflowElements: screen ? (() => {
        const screenRect = screen.getBoundingClientRect();
        return [...screen.querySelectorAll('*')].filter((node) => {
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          if (rect.width <= 0 || rect.height <= 0 || style.visibility === 'hidden' || style.display === 'none') return false;
          const escapesScreen = rect.left < screenRect.left - 2 || rect.right > screenRect.right + 2;
          const ownsUnexpectedOverflow = node.scrollWidth > node.clientWidth + 2 && !['auto', 'scroll'].includes(style.overflowX);
          return escapesScreen || ownsUnexpectedOverflow;
        }).slice(0, 20).map((node) => ({
          tag: node.tagName.toLowerCase(),
          className: typeof node.className === 'string' ? node.className : '',
          text: node.textContent?.trim().slice(0, 70) ?? '',
          clientWidth: node.clientWidth,
          scrollWidth: node.scrollWidth,
        }));
      })() : [],
      visibleTextOverflow: screen ? [...screen.querySelectorAll('h1,h2,h3,p,strong,small,button,span,label')].filter((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
          && style.textOverflow !== 'ellipsis' && style.clipPath === 'none'
          && node.scrollWidth > node.clientWidth + 3 && !['auto', 'scroll'].includes(style.overflowX);
      }).map((node) => node.textContent.trim().slice(0, 70)) : [],
      failedFamiglioAssets: performance.getEntriesByType('resource').filter((entry) => entry.name.includes('/famiglio/') && entry.transferSize === 0 && entry.decodedBodySize === 0).map((entry) => entry.name),
      adventure: ['Spedizioni del Nexus', 'Sentieri del Nexus'].includes(screen?.getAttribute('aria-label')) ? {
        dungeonCards: screen.querySelectorAll('article').length,
        battleVisible: Boolean(screen.querySelector('[data-outcome]')),
        timerVisible: Boolean(screen.querySelector('[role="timer"]')),
        tenacity: [...screen.querySelectorAll('progress')].map((bar) => ({ value: bar.value, max: bar.max })),
        combatLog: [...screen.querySelectorAll('[aria-live="polite"] p')].map((line) => line.textContent.trim()),
        textOverflow: [...screen.querySelectorAll('h2,h3,p,strong,small,button')].filter((node) => node.scrollWidth > node.clientWidth + 2).map((node) => node.textContent.trim().slice(0, 60)),
      } : null,
      combat: screen?.getAttribute('aria-label') === 'Arena dei Famigli' ? (() => {
        const scene = [...screen.querySelectorAll('[aria-label]')].find((node) => node.getAttribute('aria-label')?.includes(' contro '));
        const sceneRect = scene?.getBoundingClientRect();
        const battleStage = scene?.parentElement;
        const battleStageRect = battleStage?.getBoundingClientRect();
        const battleColumn = battleStage?.parentElement;
        const battleColumnRect = battleColumn?.getBoundingClientRect();
        const battleControls = screen.querySelector('aside');
        const battleControlsRect = battleControls?.getBoundingClientRect();
        const combatMoveButtons = [...(battleControls?.querySelectorAll('button') ?? [])].filter((button) => button.querySelector('strong'));
        const battleMoveGrid = combatMoveButtons[0]?.parentElement;
        const battleMoveGridRect = battleMoveGrid?.getBoundingClientRect();
        const battleScroller = scene ? [...screen.querySelectorAll('*')].find((node) => node.contains(scene) && ['auto', 'scroll'].includes(getComputedStyle(node).overflowY)) : null;
        const battleScrollerRect = battleScroller?.getBoundingClientRect();
        const battleCanvas = screen.querySelector('canvas[aria-label*=" contro "]');
        const battleCanvasRect = battleCanvas?.getBoundingClientRect();
        const previewCanvases = [...screen.querySelectorAll('canvas[aria-label^="Anteprima animata"]')];
        const circuitNav = screen.querySelector('nav[aria-label="Circuiti dell\\'Arena"]');
        const circuitNavRect = circuitNav?.getBoundingClientRect();
        const circuitNodes = [...(circuitNav?.querySelectorAll('button') ?? [])];
        const circuitLayout = circuitNodes.map((button) => {
          const rect = button.getBoundingClientRect();
          const style = getComputedStyle(button);
          return {
            label: button.textContent.trim().slice(0, 70),
            width: Number(rect.width.toFixed(2)),
            height: Number(rect.height.toFixed(2)),
            fullyInsideRail: Boolean(circuitNavRect && rect.left >= circuitNavRect.left - 1 && rect.right <= circuitNavRect.right + 1 && rect.top >= circuitNavRect.top - 1 && rect.bottom <= circuitNavRect.bottom + 1),
            textFits: button.scrollWidth <= button.clientWidth + 2 && button.scrollHeight <= button.clientHeight + 2,
            visible: style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0,
          };
        });
        const premiumOpponentCards = [...screen.querySelectorAll('button[aria-label]')].filter((button) => /affinit.+ruolo.+livello.+HP.+attacco.+difesa.+velocit/i.test(button.getAttribute('aria-label') ?? ''));
        const hudInsets = sceneRect ? [...screen.querySelectorAll('[data-critical][data-side]')].map((hud) => {
          const rect = hud.getBoundingClientRect();
          return {
            side: hud.getAttribute('data-side'),
            left: Number((rect.left - sceneRect.left).toFixed(2)),
            right: Number((sceneRect.right - rect.right).toFixed(2)),
            top: Number((rect.top - sceneRect.top).toFixed(2)),
            bottom: Number((sceneRect.bottom - rect.bottom).toFixed(2)),
            fullyInsideScene: rect.left >= sceneRect.left && rect.right <= sceneRect.right && rect.top >= sceneRect.top && rect.bottom <= sceneRect.bottom,
            outsideArena: rect.right <= sceneRect.left + 1 || rect.left >= sceneRect.right - 1 || rect.bottom <= sceneRect.top + 1,
            insideStage: Boolean(battleStageRect && rect.left >= battleStageRect.left - 1 && rect.right <= battleStageRect.right + 1 && rect.top >= battleStageRect.top - 1 && rect.bottom <= battleStageRect.bottom + 1),
          };
        }) : [];
        const familiarCanvases = [...previewCanvases, ...(battleCanvas ? [battleCanvas] : [])];
        const visibleTextOverflow = [...screen.querySelectorAll('h2,h3,p,strong,small,button,span')].filter((node) => {
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && node.scrollWidth > node.clientWidth + 3 && !['auto', 'scroll'].includes(style.overflowX);
        }).map((node) => node.textContent.trim().slice(0, 70));
        return {
          testOpponentOptions: screen.querySelectorAll('select[aria-label], label select').length ? Math.max(...[...screen.querySelectorAll('select')].map((select) => select.options.length)) : 0,
          circuitButtons: circuitNodes.length,
          circuitLayout,
          circuitsNotClipped: circuitLayout.length === 6 && circuitLayout.every((entry) => entry.visible && entry.fullyInsideRail && entry.textFits),
          opponentCards: premiumOpponentCards.length,
          premiumOpponentCards: premiumOpponentCards.filter((card) => card.querySelector('canvas[aria-label^="Anteprima animata"]') && card.querySelector('[aria-label="Statistiche di combattimento"]')).length,
          animatedOpponentPreviews: previewCanvases.length,
          familiarCanvasCssAnimations: familiarCanvases.map((canvas) => ({ label: canvas.getAttribute('aria-label'), animationName: getComputedStyle(canvas).animationName })),
          familiarsAreCanvasAnimatedOnly: familiarCanvases.length > 0 && familiarCanvases.every((canvas) => getComputedStyle(canvas).animationName === 'none'),
          moveButtons: [...screen.querySelectorAll('button')].filter((button) => button.querySelector('strong') && (/Potenza|Cura|Precisione|Supporto/.test(button.textContent) || /Mossa da sbloccare/.test(button.textContent))).length,
          activeMoveButtons: [...screen.querySelectorAll('button')].filter((button) => !button.disabled && button.querySelector('strong') && /Potenza|Cura|Precisione|Supporto/.test(button.textContent)).length,
          fighterSprites: battleCanvas ? 2 : 0,
          canvasDrivenBattle: Boolean(battleCanvas),
          eventMessage: screen.querySelector('[aria-live="polite"] strong')?.textContent?.trim() ?? null,
          scene: sceneRect ? { left: sceneRect.left, top: sceneRect.top, width: sceneRect.width, height: sceneRect.height, ratio: Number((sceneRect.width / sceneRect.height).toFixed(3)), fullyInsideViewport: sceneRect.left >= 0 && sceneRect.right <= innerWidth + 1 } : null,
          battleCanvas: battleCanvasRect ? { width: battleCanvasRect.width, height: battleCanvasRect.height, ratio: Number((battleCanvasRect.width / battleCanvasRect.height).toFixed(3)), bitmapWidth: battleCanvas.width, bitmapHeight: battleCanvas.height, bitmapRatio: Number((battleCanvas.width / battleCanvas.height).toFixed(3)) } : null,
          battleLayout: sceneRect && battleColumnRect ? {
            columnTop: battleColumnRect.top,
            columnBottom: battleColumnRect.bottom,
            sceneTop: sceneRect.top,
            sceneBottom: sceneRect.bottom,
            controlsTop: battleControlsRect?.top ?? null,
            controlsBottom: battleControlsRect?.bottom ?? null,
            moveGridTop: battleMoveGridRect?.top ?? null,
            moveGridBottom: battleMoveGridRect?.bottom ?? null,
            controlsOverlapScene: Boolean(battleMoveGridRect && battleMoveGridRect.left < sceneRect.right && battleMoveGridRect.right > sceneRect.left && battleMoveGridRect.top < sceneRect.bottom && battleMoveGridRect.bottom > sceneRect.top),
            movesVisibleWithoutScroll: combatMoveButtons.length === 4 && combatMoveButtons.every((button) => {
              const rect = button.getBoundingClientRect();
              return battleScrollerRect && rect.top >= battleScrollerRect.top - 1 && rect.bottom <= battleScrollerRect.bottom + 1;
            }),
          } : null,
          hudInsets,
          hudOutsideArena: hudInsets.length === 2 && hudInsets.every((hud) => hud.outsideArena && hud.insideStage),
          rootHorizontalOverflow: document.documentElement.scrollWidth > innerWidth + 2,
          screenHorizontalOverflow: screen.scrollWidth > screen.clientWidth + 2,
          visibleTextOverflow,
          backgroundFailures: performance.getEntriesByType('resource').filter((entry) => entry.name.includes('/famiglio/rebuild/combat/') && entry.transferSize === 0 && entry.decodedBodySize === 0).map((entry) => entry.name),
        };
      })() : null,
    };
  })()`, returnByValue: true });
  auditResults.push({ name, setupException: setupResult?.exceptionDetails?.text ?? null, ...audit.result.value });
  const screenshot = await command("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    fromSurface: true,
  });
  await writeFile(path.join(outputRoot, name), Buffer.from(screenshot.data, "base64"));
  console.log(`[qa] ${name}: salvata`);
}

async function captureTimeline(name, url, width, height, mobile) {
  if (!mobile || !nativeMobileLaunch) await setResponsiveViewport(mobile ? 1024 : width, mobile ? Math.max(height, 768) : height);
  await command("Page.enable");
  await command("Page.navigate", { url });
  await command("Runtime.evaluate", {
    expression: `(async () => {
      for (let attempt = 0; attempt < 50; attempt += 1) {
        const canvas = document.querySelector('canvas[aria-label^="Casa di "]');
        if (canvas && canvas.width > 1) return true;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return false;
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (mobile) {
    if (!nativeMobileLaunch) {
      await setResponsiveViewport(width, height);
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
  }
  const checkpoints = requestedScreens.has("meal-timeline")
    ? [400, 2_000, 4_000, 6_000, 9_000, 12_000]
    : [400, 1_150, 2_050, 3_100];
  let previous = 0;
  for (const checkpoint of checkpoints) {
    await new Promise((resolve) => setTimeout(resolve, checkpoint - previous));
    previous = checkpoint;
    const state = await command("Runtime.evaluate", {
      expression: `(() => {
        const canvas = document.querySelector('canvas[aria-label^="Casa di "]');
        const rect = canvas?.getBoundingClientRect();
        return rect ? { label: canvas.getAttribute('aria-label'), left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null;
      })()`,
      returnByValue: true,
    });
    auditResults.push({ name, checkpoint, viewport: { width, height, mobile }, home: state.result.value });
    const screenshot = await command("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
      fromSurface: true,
      clip: { x: 0, y: 0, width, height, scale: 1 },
    });
    await writeFile(path.join(outputRoot, `${name}-t${String(checkpoint).padStart(4, "0")}.png`), Buffer.from(screenshot.data, "base64"));
  }
}

async function captureMealContract(pet, stage, view, width, height, mobile) {
  await setResponsiveViewport(1440, 1100);
  await command("Page.navigate", { url: `${previewBaseUrl}/famiglio?preview=home&growth=${stage}&test=all&familiar=${pet.id}` });
  await new Promise(resolve => setTimeout(resolve, 250));
  for (let attempt = 0; attempt < 70; attempt++) {
    const ready = await command("Runtime.evaluate", { expression: `document.querySelector('canvas[aria-label="Casa di ${pet.name}"]')?.width > 1`, returnByValue: true });
    if (ready.result.value) break;
    await new Promise(resolve => setTimeout(resolve, 100));
    if (attempt === 69) throw new Error(`${pet.id}: casa non pronta`);
  }
  await setResponsiveViewport(width, height);
  await new Promise(resolve => setTimeout(resolve, 250));
  await command("Runtime.evaluate", { expression: `(() => {
    const nativeNow = performance.now.bind(performance), realStart = nativeNow();
    const nativeRaf = window.requestAnimationFrame.bind(window);
    const clock = value => realStart + (value - realStart) * 6;
    performance.now = () => clock(nativeNow());
    window.requestAnimationFrame = callback => nativeRaf(timestamp => callback(clock(timestamp)));
    const realDate = Date.now.bind(Date), dateStart = realDate();
    Date.now = () => dateStart + (realDate() - dateStart) * 6;
    window.__mealFrames = [];
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.clearRect = function(...args) {
      if (this.canvas.getAttribute('aria-label')?.startsWith('Casa di ')) {
        if (this.__mealFrame?.draws.length) window.__mealFrames.push(this.__mealFrame);
        this.__mealFrame = { at: performance.now(), draws: [] };
      }
      return clear.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
      if (this.__mealFrame && image?.src && (/\\/house\\//.test(image.src) || /moon-meal/.test(image.src))) {
        const t = this.getTransform();
        this.__mealFrame.draws.push({ src: new URL(image.src).pathname, args, facing: t.a, x: t.e });
      }
      return draw.call(this, image, ...args);
    };
    const feedButton = [...document.querySelectorAll('button')].find(button => /nutri/i.test(button.textContent));
    if (!feedButton) throw new Error('Nutri button not found');
    feedButton.click();
  })()` });
  await new Promise(resolve => setTimeout(resolve, 750));
  const screenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
  const name = `meal-contract-${pet.id}-${stage}-${view}`;
  await writeFile(path.join(outputRoot, `${name}.png`), Buffer.from(screenshot.data, "base64"));
  await new Promise(resolve => setTimeout(resolve, 1_500));
  const result = await command("Runtime.evaluate", { expression: `(() => {
    const frames = window.__mealFrames || [];
    const sprite = frame => frame.draws.find(d => d.src.includes('/house/'));
    const meals = frame => frame.draws.filter(d => d.src.includes('moon-meal'));
    const fed = frames.filter(frame => sprite(frame)?.src.endsWith('/feed-v3.png'));
    const first = fed[0]?.at, last = fed.at(-1)?.at;
    const walked = frames.filter(frame => /\\/walk(?:-v3)?\\.png$/.test(sprite(frame)?.src || '') && (!first || frame.at < first));
    const errors = [];
    if (!fed.length) errors.push('missing-new-feeding-sequence');
    if (!walked.length) errors.push('missing-approach');
    if (walked.some(frame => meals(frame).some(d => d.args[1] !== 0))) errors.push('food-consumed-during-approach');
    if (frames.some(frame => meals(frame).length > 1)) errors.push('duplicate-meal');
    if (fed.some(frame => meals(frame).length !== 1)) errors.push('meal-flicker');
    if (fed.some(frame => sprite(frame).facing >= 0)) errors.push('not-facing-food');
    const xs = frames.flatMap(frame => meals(frame).map(d => d.args[4] + d.args[6] / 2));
    if (xs.length && Math.max(...xs) - Math.min(...xs) > .1) errors.push('meal-position-changes');
    const indexes = [...new Set(fed.map(frame => sprite(frame).args[0] / 128))];
    if (indexes.length !== 4) errors.push('missing-animation-frames');
    const consumed = [...new Set(fed.flatMap(frame => meals(frame).map(d => d.args[1])))];
    if (consumed.length < 4) errors.push('incomplete-consumption');
    const returned = frames.some(frame => frame.at > last && /\\/idle(?:-v3)?\\.png$/.test(sprite(frame)?.src || ''));
    if (!returned) errors.push('no-return-to-idle');
    const rect = document.querySelector('canvas[aria-label^="Casa di "]')?.getBoundingClientRect();
    if (!rect || rect.left < 0 || rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1) errors.push('canvas-clipped');
    return { frames: frames.length, approachFrames: walked.length, eatingFrames: fed.length, indexes, consumed,
      duration: last - first, returned, errors, trace: frames.map(frame => ({ at: frame.at, pet: sprite(frame), meals: meals(frame) })) };
  })()`, returnByValue: true });
  const data = result.result.value;
  await writeFile(path.join(outputRoot, `${name}.json`), JSON.stringify(data, null, 2));
  auditResults.push({ name, id: pet.id, stage, view, mobile, ...data, trace: undefined });
  console.log(`[meal] ${pet.id}/${stage}/${view}: ${data.errors.join(', ') || 'OK'}`);
}

async function removeProfileWhenReleased() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await rm(profileRoot, { recursive: true, force: true });
      return;
    } catch (error) {
      if (error?.code !== "EBUSY") throw error;
      if (attempt === 19) {
        console.warn(`[qa] profilo Edge ancora bloccato, verrà pulito dal processo QA principale: ${profileRoot}`);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

async function waitForBrowserExit(timeoutMs = 4_000) {
  if (!browser || browser.exitCode !== null) return;
  await Promise.race([
    new Promise((resolve) => browser.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

try {
  browser = spawn(browserExecutable, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-gpu-compositing",
    "--disable-accelerated-2d-canvas",
    "--disable-gpu-sandbox",
    "--disable-extensions",
    "--disable-background-networking",
    "--no-first-run",
    `--window-size=${launchViewport.width},${launchViewport.height}`,
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileRoot}`,
    `${previewBaseUrl}/famiglio?preview=combat&growth=adulto&test=all&familiar=cat`,
  ], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
  browser.stderr?.on("data", (chunk) => {
    browserStderr = `${browserStderr}${String(chunk)}`.slice(-4_000);
  });
  const page = await waitForPage();
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Apertura WebSocket CDP: timeout")), 5_000);
    socket.once("open", () => {
      clearTimeout(timeout);
      resolve();
    });
    socket.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
  socket.on("message", handleSocketMessage);
  socket.on("close", () => settlePending(new Error("Collegamento CDP chiuso")));
  socket.on("error", (error) => settlePending(error));

  const allViews = [["desktop", 1440, 1100, false], ["short", 1366, 768, false], ["compact", 760, 650, false], ["mobile", 390, 844, true], ["phone", 360, 640, true], ["android-viewport", 760, 1400, false], ["android-wide-css", 980, 1800, false]];
  const views = requestedViews.size ? allViews.filter(([view]) => requestedViews.has(view)) : allViews;
  const screens = [
    ["onboarding-eggs", "", "", "choosing"],
    ["onboarding-confirm", "", "", "confirming"],
    ["onboarding-hatching", "", "", "hatching"],
    ["onboarding-hatched", "", "", "hatched"],
    ["nora", "&vendor=daily", ""], ["mirra", "&vendor=arcane", ""], ["iris", "&vendor=cosmetics", ""],
    ["iris-bright", "&vendor=cosmetics", `(async () => { for (let page = 0; page < 7; page += 1) { document.querySelector('nav[aria-label="Pagine delle cover"] button:last-child')?.click(); await new Promise((resolve) => setTimeout(resolve, 90)); } })()`],
    ["nora-info", "&vendor=daily", `document.querySelector('button[aria-label^="Informazioni su "]')?.click()`],
    ["atelier-cover", "&wing=atelier", ""],
    ["atelier-cover-new", "&wing=atelier", `(async () => { const next = () => document.querySelector('button[aria-label="Pagina successiva"]'); for (let page = 0; page < 6; page += 1) { next()?.click(); await new Promise((resolve) => setTimeout(resolve, 100)); } [...document.querySelectorAll('button')].find((button) => button.textContent.includes('Prova cover'))?.click(); await new Promise((resolve) => setTimeout(resolve, 300)); })()`],
    ["atelier-famigli", "&wing=atelier", `([...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Famigli'))?.click()`],
    ["atelier-famigli-magici", "&wing=atelier", `(async () => { ([...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Famigli'))?.click(); await new Promise((resolve) => setTimeout(resolve, 250)); const button = document.querySelector('button[aria-label="Informazioni su Grifone"]'); button?.scrollIntoView({ block: 'center' }); })()`],
    ["atelier-famiglio-info", "&wing=atelier", `(async () => { ([...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Famigli'))?.click(); await new Promise((resolve) => setTimeout(resolve, 250)); const button = document.querySelector('button[aria-label="Informazioni su Grifone"]'); button?.scrollIntoView({ block: 'center' }); button?.click(); })()`],
    ["atelier-dinosaur-info", "&wing=atelier", `(async () => { ([...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Famigli'))?.click(); await new Promise((resolve) => setTimeout(resolve, 250)); const button = document.querySelector('button[aria-label="Informazioni su Pachicefalosauro"]'); button?.scrollIntoView({ block: 'center' }); button?.click(); })()`],
    ["atelier-bundle", "&wing=atelier", `([...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Bundle'))?.click()`],
    ["atelier-bundle-info", "&wing=atelier", `(async () => { ([...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Bundle'))?.click(); await new Promise((resolve) => setTimeout(resolve, 250)); document.querySelector('button[aria-label^="Informazioni sul bundle"]')?.click(); })()`],
    ["notturno", "&wing=night&time=night", ""],
    ["notturno-bottom", "&wing=night&time=night", `(() => { const panel = document.querySelector('[class*="nightMerchantDetail"]'); if (panel) panel.scrollTop = panel.scrollHeight; })()`],
    ["notturno-info", "&wing=night&time=night", `document.querySelector('button[aria-label="Informazioni su Fodero del viandante"]')?.click()`],
    ["notturno-zaino", "&wing=night&time=night", `(async () => { const info = document.querySelector('button[aria-label="Informazioni su Fodero del viandante"]'); const card = info?.closest('article'); [...(card?.querySelectorAll('button') ?? [])].find((button) => button.textContent.trim() === 'Scambia')?.click(); await new Promise((resolve) => setTimeout(resolve, 150)); [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Torna alla Casa')?.click(); await new Promise((resolve) => setTimeout(resolve, 250)); document.querySelector('button[aria-label="Apri zaino"]')?.click(); })()`],
    ["site-pip", "", `(async () => { localStorage.setItem('lorewise.famiglio-rebuild.v1', JSON.stringify({ activeHouseIndex: 0, houses: [{ rebuild: { stage: 'home', selectedId: 'cat', familiarName: 'Derry', colorVariant: 'black', unlockedIds: ['cat'] }, home: { needs: { hunger: 93, energy: 100, happiness: 100, hygiene: 98, affection: 100 }, growth: { stage: 'cucciolo', bondXp: 40 } }, activeFamiliarId: 'cat' }, null, null] })); window.dispatchEvent(new Event('lorewise:famiglio-rebuild-updated')); await new Promise((resolve) => setTimeout(resolve, 250)); document.querySelector('button[aria-label^="Apri il PiP di "]')?.click(); })()`, "site"],
    ["home-akita-feed", "&familiar=akita&action=feed", "", "home"],
    ["home-akita-play", "&familiar=akita&action=play", "", "home"],
    ["home-great-dane-care", "&familiar=great-dane&action=care", "", "home"],
    ["home-griffin-feed", "&familiar=griffin&action=feed", "", "home"],
    ["home-griffin-rest", "&familiar=griffin&action=rest", "", "home"],
    ["home-faerie-dragon-idle", "&familiar=faerie-dragon", "", "home"],
    ["home-faerie-dragon-play", "&familiar=faerie-dragon&action=play", "", "home"],
    ["home-red-dragon-feed", "&familiar=adult-red-dragon&action=feed", "", "home"],
    ["home-cat-feed", "&familiar=cat&action=feed", "", "home"],
    ["home-cat-black-rest", "&familiar=cat&color=black&action=rest", "", "home"],
    ["home-triceratops-feed", "&familiar=triceratops&action=feed", "", "home"],
    ["home-parrot-feed", "&familiar=parrot&action=feed", "", "home"],
    ["home-panda-feed", "&familiar=panda&action=feed", "", "home"],
    ["home-red-dragon-rest", "&familiar=adult-red-dragon&action=rest", "", "home"],
    ["home-brachiosaurus-rest", "&familiar=brachiosaurus&action=rest", "", "home"],
    ["home-panda-rest", "&familiar=panda&action=rest", "", "home"],
    ["home-pachycephalosaurus-play", "&familiar=pachycephalosaurus&action=play", "", "home"],
    ["home-bird-play", "&familiar=bird&action=play", "", "home"],
    ["home-cat-idle", "&familiar=cat", "", "home"],
    ["home-inventory", "", `document.querySelector('button[aria-label="Apri zaino"]')?.click()`, "home"],
    ["tutorial-care", "&tutorial=on", "", "home", "adulto"],
    ["progression-growth", "&familiar=cat", "", "progression", "adulto"],
    ["progression-moves", "&familiar=cat", `([...document.querySelectorAll('nav[aria-label="Rami del Percorso del Legame"] button')].find((entry) => entry.textContent.includes('Mosse')))?.click()`, "progression", "adulto"],
    ["progression-rewards", "&familiar=cat", `([...document.querySelectorAll('nav[aria-label="Rami del Percorso del Legame"] button')].find((entry) => entry.textContent.includes('Ricompense')))?.click()`, "progression", "adulto"],
    ["missions", "&familiar=cat", "", "missions", "adulto"],
    ["diary", "&familiar=cat", "", "diary", "adulto"],
    ["adventure-map", "&familiar=cat", "", "adventure", "adulto"],
    ["adventure-active", "&familiar=cat", `(async () => { [...document.querySelectorAll('button')].find((entry) => entry.textContent.trim() === 'Parti')?.click(); await new Promise((resolve) => setTimeout(resolve, 350)); })()`, "adventure", "adulto"],
    ["adventure-reward", "&familiar=cat", `(async () => { const button = (label) => [...document.querySelectorAll('button')].find((entry) => entry.textContent.trim() === label); button('Parti')?.click(); await new Promise((resolve) => setTimeout(resolve, 180)); button('Completa subito · prova')?.click(); await new Promise((resolve) => setTimeout(resolve, 180)); button('Concludi la spedizione')?.click(); await new Promise((resolve) => setTimeout(resolve, 350)); })()`, "adventure", "adulto"],
    ["battle-cat", "&familiar=cat&dungeon=twilight-woods", "", "battle", "adulto"],
    ["battle-faerie-dragon", "&familiar=faerie-dragon&dungeon=astral-gardens", "", "battle", "giovane"],
    ["battle-brachiosaurus", "&familiar=brachiosaurus&dungeon=fossil-valley", "", "battle", "adulto"],
    ["adventure-select-twilight", "&familiar=cat", `([...document.querySelectorAll('button')].filter((entry) => entry.textContent.trim() === 'Parti')[0])?.click()`, "adventure", "adulto"],
    ["adventure-select-astral", "&familiar=cat", `([...document.querySelectorAll('button')].filter((entry) => entry.textContent.trim() === 'Parti')[1])?.click()`, "adventure", "adulto"],
    ["adventure-select-crypt", "&familiar=cat", `([...document.querySelectorAll('button')].filter((entry) => entry.textContent.trim() === 'Parti')[2])?.click()`, "adventure", "adulto"],
    ["adventure-select-fossil", "&familiar=cat", `([...document.querySelectorAll('button')].filter((entry) => entry.textContent.trim() === 'Parti')[3])?.click()`, "adventure", "adulto"],
    ["adventure-complete-flow", "&familiar=cat", `(async () => { const button = (label) => [...document.querySelectorAll('button')].find((entry) => entry.textContent.trim() === label); button('Parti')?.click(); await new Promise((resolve) => setTimeout(resolve, 120)); button('Completa subito · prova')?.click(); await new Promise((resolve) => setTimeout(resolve, 120)); button('Concludi la spedizione')?.click(); })()`, "adventure", "adulto"],
    ["battle-real-turn", "&familiar=faerie-dragon&dungeon=astral-gardens", `(async () => { const move = [...document.querySelectorAll('button')].find((entry) => entry.querySelector('strong')?.textContent.trim() === 'Legame del Nexus'); move?.click(); })()`, "battle", "adulto"],
    ["combat-selection", "&familiar=cat", "", "combat", "adulto"],
    ["combat-player-golden", "&familiar=cat", `(() => { const select = [...document.querySelectorAll('select')].find((entry) => entry.previousElementSibling?.textContent.includes('Famiglio combattente')); if (!select) return false; select.value = 'golden'; select.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`, "combat", "adulto"],
    ["combat-arenas", "&familiar=cat", `([...document.querySelectorAll('button')].find((entry) => entry.textContent.includes('Conferma Famiglio')))?.click()`, "combat", "adulto"],
    ["combat-opponents", "&familiar=cat", `(async () => { const click = (text) => [...document.querySelectorAll('button')].find((entry) => entry.textContent.includes(text))?.click(); click('Conferma Famiglio'); await new Promise((resolve) => setTimeout(resolve, 80)); click('Cortile delle Prime Orme'); })()`, "combat", "adulto"],
    ["combat-mode", "&familiar=cat", `(async () => { const click = (text) => [...document.querySelectorAll('button')].find((entry) => entry.textContent.includes(text))?.click(); click('Conferma Famiglio'); await new Promise((resolve) => setTimeout(resolve, 80)); click('Cortile delle Prime Orme'); await new Promise((resolve) => setTimeout(resolve, 80)); click('Conferma rivale'); })()`, "combat", "adulto"],
    ["combat-moves", "&familiar=cat", `(async () => { const click = (text) => [...document.querySelectorAll('button')].find((entry) => entry.textContent.includes(text))?.click(); click('Conferma Famiglio'); await new Promise((resolve) => setTimeout(resolve, 80)); click('Cortile delle Prime Orme'); await new Promise((resolve) => setTimeout(resolve, 80)); click('Conferma rivale'); await new Promise((resolve) => setTimeout(resolve, 80)); click('Normale'); })()`, "combat", "adulto"],
    ["combat-moves-bottom", "&familiar=cat", `(async () => { const click = (text) => [...document.querySelectorAll('button')].find((entry) => entry.textContent.includes(text))?.click(); click('Conferma Famiglio'); await new Promise((resolve) => setTimeout(resolve, 80)); click('Cortile delle Prime Orme'); await new Promise((resolve) => setTimeout(resolve, 80)); click('Conferma rivale'); await new Promise((resolve) => setTimeout(resolve, 80)); click('Normale'); await new Promise((resolve) => setTimeout(resolve, 120)); [...document.querySelectorAll('button')].find((entry) => entry.textContent.includes('Conferma le mosse'))?.scrollIntoView({ block: 'end' }); })()`, "combat", "adulto"],
    ["combat-moves-changed", "&familiar=cat", `(async () => { const click = (text) => [...document.querySelectorAll('button')].find((entry) => entry.textContent.includes(text))?.click(); click('Conferma Famiglio'); await new Promise((resolve) => setTimeout(resolve, 80)); click('Cortile delle Prime Orme'); await new Promise((resolve) => setTimeout(resolve, 80)); click('Conferma rivale'); await new Promise((resolve) => setTimeout(resolve, 80)); click('Normale'); await new Promise((resolve) => setTimeout(resolve, 120)); const select = document.querySelectorAll('select')[0]; if (select && select.options.length > 2) { select.value = select.options[2].value; select.dispatchEvent(new Event('change', { bubbles: true })); } await new Promise((resolve) => setTimeout(resolve, 160)); })()`, "combat", "adulto"],
    ["combat-ready", "&familiar=cat", `(async () => { const click = (text) => [...document.querySelectorAll('button')].find((entry) => entry.textContent.includes(text))?.click(); click('Conferma Famiglio'); await new Promise((resolve) => setTimeout(resolve, 80)); click('Cortile delle Prime Orme'); await new Promise((resolve) => setTimeout(resolve, 80)); click('Conferma rivale'); await new Promise((resolve) => setTimeout(resolve, 80)); click('Normale'); await new Promise((resolve) => setTimeout(resolve, 80)); click('Conferma le mosse'); })()`, "combat", "adulto"],
    ["combat-tower-ready", "&familiar=cat", `(async () => { const click = (text) => [...document.querySelectorAll('button')].find((entry) => entry.textContent.includes(text))?.click(); click('Conferma Famiglio'); await new Promise((resolve) => setTimeout(resolve, 100)); click('Torre del Nexus'); await new Promise((resolve) => setTimeout(resolve, 100)); click('Normale'); await new Promise((resolve) => setTimeout(resolve, 100)); click('Conferma le mosse'); })()`, "combat", "adulto"],
    ["combat-tower-battle", "&familiar=cat", `(async () => { const click = (text) => [...document.querySelectorAll('button')].find((entry) => entry.textContent.includes(text))?.click(); click('Conferma Famiglio'); await new Promise((resolve) => setTimeout(resolve, 100)); click('Torre del Nexus'); await new Promise((resolve) => setTimeout(resolve, 100)); click('Normale'); await new Promise((resolve) => setTimeout(resolve, 100)); click('Conferma le mosse'); await new Promise((resolve) => setTimeout(resolve, 100)); click('Inizia il duello'); })()`, "combat", "adulto"],
    ["combat-initiative", "&familiar=faerie-dragon&opponent=tyrannosaurus&circuit=valle-titani&difficulty=nexus", "", "battle", "adulto"],
    ["combat-battle", "&familiar=faerie-dragon&opponent=tyrannosaurus&circuit=valle-titani&difficulty=nexus", `([...document.querySelectorAll('button')].find((entry) => entry.textContent.includes("Entra nell'Arena")))?.click()`, "battle", "adulto"],
    ["combat-status-panel", "&familiar=faerie-dragon&opponent=tyrannosaurus&circuit=valle-titani&difficulty=nexus", `(() => { ([...document.querySelectorAll('button')].find((entry) => entry.textContent.includes("Entra nell'Arena")))?.click(); document.querySelector('button[aria-label="Apri gli stati attivi"]')?.click(); })()`, "battle", "adulto"],
    ["combat-log-panel", "&familiar=faerie-dragon&opponent=tyrannosaurus&circuit=valle-titani&difficulty=nexus", `(() => { ([...document.querySelectorAll('button')].find((entry) => entry.textContent.includes("Entra nell'Arena")))?.click(); document.querySelector('button[aria-label="Apri la cronaca del combattimento"]')?.click(); })()`, "battle", "adulto"],
    ["combat-move-info", "&familiar=faerie-dragon&opponent=tyrannosaurus&circuit=valle-titani&difficulty=nexus", `(() => { ([...document.querySelectorAll('button')].find((entry) => entry.textContent.includes("Entra nell'Arena")))?.click(); document.querySelector('button[aria-label^="Informazioni sulla mossa"]')?.click(); })()`, "battle", "adulto"],
    ["combat-status", "&familiar=golden&opponent=cat&circuit=prime-orme&difficulty=normal", "", "battle", "adulto"],
    ["combat-victory", "&familiar=faerie-dragon&opponent=tyrannosaurus&circuit=valle-titani&difficulty=nexus&result=victory", "", "battle", "adulto"],
    ["combat-defeat", "&familiar=faerie-dragon&opponent=tyrannosaurus&circuit=valle-titani&difficulty=nexus&result=defeat", "", "battle", "adulto"],
    ["combat-real-turn", "&familiar=faerie-dragon&opponent=tyrannosaurus&circuit=valle-titani&difficulty=nexus", `(async () => { ([...document.querySelectorAll('button')].find((entry) => entry.textContent.includes("Entra nell'Arena")))?.click(); const move = [...document.querySelectorAll('button')].find((entry) => entry.querySelector('strong') && !entry.disabled); move?.click(); await new Promise((resolve) => setTimeout(resolve, 1050)); })()`, "battle", "adulto"],
    ["combat-contact-small-large", "&familiar=bird&opponent=brachiosaurus&circuit=valle-titani&difficulty=normal", `(async () => { const move = [...document.querySelectorAll('button')].find((entry) => entry.querySelector('strong') && !entry.disabled); move?.click(); await new Promise((resolve) => setTimeout(resolve, 1050)); })()`, "battle", "adulto"],
    ["combat-contact-large-small", "&familiar=adult-red-dragon&opponent=turtle&circuit=prime-orme&difficulty=normal", `(async () => { const move = [...document.querySelectorAll('button')].find((entry) => entry.querySelector('strong') && !entry.disabled); move?.click(); await new Promise((resolve) => setTimeout(resolve, 1050)); })()`, "battle", "adulto"],
    ["growth-cat-cucciolo", "&familiar=cat", "", "home", "cucciolo"],
    ["growth-cat-giovane", "&familiar=cat", "", "home", "giovane"],
    ["growth-brachiosaurus-cucciolo", "&familiar=brachiosaurus", "", "home", "cucciolo"],
  ];
  const selectedScreens = requestedScreens.has("meal-roster")
    ? FAMILIAR_COLLECTION.map((entry) => [`meal-${entry.id}`, `&familiar=${entry.id}&action=feed`, "new Promise(resolve => setTimeout(resolve, 1600))", "home", "adulto"])
    : requestedScreens.size > 0 ? screens.filter(([screen]) => requestedScreens.has(screen)) : screens;
  if (requestedScreens.has("meal-contract")) {
    const selectedIds = new Set((process.env.FAMIGLIO_IDS ?? "").split(",").filter(Boolean));
    const pets = FAMILIAR_COLLECTION.filter(pet => !selectedIds.size || selectedIds.has(pet.id));
    const stages = (process.env.FAMIGLIO_STAGES ?? "adulto,giovane,cucciolo").split(",");
    for (const [view, width, height, mobile] of views.filter(([v]) => v !== "compact")) {
      for (const stage of stages) for (const pet of pets) await captureMealContract(pet, stage, view, width, height, mobile);
    }
  }
  for (const [view, width, height, mobile] of views) for (const [screen, query, setup, preview = "market", growth = "adulto"] of selectedScreens) {
    const testQuery = allRosterMode ? "&test=all" : "";
    const targetUrl = preview === "site"
      ? `${previewBaseUrl}/cronache-del-nexus?sezione=arte#arte`
      : `${previewBaseUrl}/famiglio?preview=${preview}&growth=${growth}${testQuery}${query}`;
    await capture(`market-${screen}-${view}.png`, targetUrl, width, height, mobile, setup);
  }
  if (requestedScreens.has("home-action-timeline") || requestedScreens.has("meal-timeline")) {
    const timelineViews = [["desktop", 1440, 1100, false], ["mobile", 390, 844, true]];
    const timelineActions = requestedScreens.has("meal-timeline") ? [
      ["cat-feed", "cat", "feed"],
      ["fiddle-dog-feed", "fiddle-dog", "feed"],
      ["ankylosaurus-feed", "ankylosaurus", "feed"],
      ["panda-feed", "panda", "feed"],
      ["brachiosaurus-feed", "brachiosaurus", "feed"],
      ["bird-feed", "bird", "feed"],
    ] : [
      ["cat-feed", "cat", "feed"],
      ["cat-play", "cat", "play"],
      ["cat-care", "cat", "care"],
      ["triceratops-feed", "triceratops", "feed"],
      ["brachiosaurus-care", "brachiosaurus", "care"],
      ["pachycephalosaurus-play", "pachycephalosaurus", "play"],
    ];
    for (const [view, width, height, mobile] of timelineViews) for (const [name, familiar, action] of timelineActions) {
      await captureTimeline(
        `timeline-${name}-${view}`,
        `${previewBaseUrl}/famiglio?preview=home&growth=adulto&test=all&familiar=${familiar}&action=${action}`,
        width,
        height,
        mobile,
      );
    }
  }
  const auditSlug = [...requestedScreens].join("-");
  const auditName = requestedScreens.size === 0
    ? "market-layout-audit.json"
    : auditSlug.length <= 120
      ? `market-layout-audit-${auditSlug}.json`
      : `market-layout-audit-selection-${requestedScreens.size}.json`;
  await writeFile(path.join(outputRoot, auditName), JSON.stringify(auditResults, null, 2));
  if (requestedScreens.has("meal-contract") && auditResults.some(result => result.errors?.length)) process.exitCode = 1;
} finally {
  if (socket && socket.readyState !== WebSocket.CLOSED) socket.terminate();
  settlePending(new Error("Cattura QA conclusa"));
  if (browser?.pid && browser.exitCode === null) {
    spawnSync("taskkill.exe", ["/PID", String(browser.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    if (browser.exitCode === null) browser.kill();
  }
  await waitForBrowserExit();
  await removeProfileWhenReleased();
  if (browser?.exitCode && browserStderr) console.error(browserStderr.trim());
}

console.log(outputRoot);
