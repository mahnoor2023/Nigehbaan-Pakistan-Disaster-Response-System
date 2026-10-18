/** Optional dependency-free Chrome/CDP smoke check against a running local build. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chromePath = process.env.NIGEHBAAN_CHROME ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.env.NIGEHBAAN_URL ?? process.argv[2] ?? "http://127.0.0.1:3101";
const port = 19231;
const profile = mkdtempSync(join(tmpdir(), "nigehbaan-map-smoke-"));
const browser = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const deadline = Date.now() + 25000;
async function until(check, message, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try { const value = await check(); if (value) return value; } catch { /* page may still be navigating */ }
    await delay(150);
  }
  throw new Error(`Timed out: ${message}`);
}

let ws;
let nextId = 0;
const pending = new Map();
const browserErrors = [];
const tileResponses = [];
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.result.value;
}
async function pageState() {
  return evaluate(`({path:location.pathname,query:new URLSearchParams(location.search).get('district'),district:document.querySelector('#karachi-map-district')?.value,topDistrict:document.querySelector('select[aria-label="Karachi district"]')?.value,maps:document.querySelectorAll('.leaflet-container').length,visibleMaps:[...document.querySelectorAll('.leaflet-container')].filter(e=>e.getBoundingClientRect().width>0).length,coverageVisible:!!document.querySelector('#karachi-map')?.getBoundingClientRect().width,tiles:[...document.querySelectorAll('.leaflet-tile-loaded')].filter(t=>t.naturalWidth>0).length,markers:document.querySelectorAll('#karachi-map .leaflet-interactive').length,fallback:!![...document.querySelectorAll('[role="status"]')].find(e=>e.textContent.includes('Map tiles could not load')),status:document.querySelector('#karachi-map-alternative')?.parentElement?.textContent})`);
}
try {
  await until(async () => {
    if (Date.now() > deadline) return false;
    const response = await fetch(`http://127.0.0.1:${port}/json`);
    return response.ok;
  }, "Chrome debugging endpoint", 25000);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const page = targets.find((item) => item.type === "page");
  assert.ok(page, "Chrome page target exists");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const task = pending.get(message.id);
      if (task) {
        pending.delete(message.id);
        if (message.error) task.reject(new Error(message.error.message));
        else task.resolve(message);
      }
    } else if (message.method === "Runtime.exceptionThrown") browserErrors.push(JSON.stringify(message.params.exceptionDetails));
    else if (message.method === "Log.entryAdded" && message.params.entry.level === "error") browserErrors.push(message.params.entry.text);
    else if (message.method === "Network.responseReceived" && message.params.response.url.includes("tile.openstreetmap.org")) tileResponses.push(message.params.response.status);
    else if (message.method === "Network.loadingFailed" && message.params.errorText && message.params.errorText !== "net::ERR_ABORTED") browserErrors.push(`Network: ${message.params.errorText}`);
  });
  await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Log.enable"), send("Network.enable")]);
  await send("Page.navigate", { url: `${baseUrl}/coverage?district=pk-sindh-karachi-malir` });
  await until(async () => (await pageState()).maps === 1, "coverage Leaflet mount");
  console.log("Initial:", await pageState());
  const districts = ["central", "east", "south", "west", "keamari", "korangi", "malir", "west", "malir"];
  for (const name of districts) {
    const id = `pk-sindh-karachi-${name}`;
    await evaluate(`(()=>{const s=document.querySelector('#karachi-map-district');const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;set.call(s,${JSON.stringify(id)});s.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
    const state = await until(async () => {
      const next = await pageState();
      return next.query === id && next.district === id && next.topDistrict === id && next.maps === 1 ? next : null;
    }, `${name} selection`);
    if (name === "malir") await until(async () => (await pageState()).markers > 1, "Malir sourced markers");
    else await until(async () => (await pageState()).markers === 1, `${name} has no Malir markers`);
    console.log(`${name}: URL, selectors, one map and marker isolation passed (${state.markers} immediate markers)`);
  }
  await until(async () => (await pageState()).tiles > 0, "loaded basemap image");
  assert.ok(tileResponses.some((status) => status === 200), "OSM tile returned HTTP 200");
  const beforeLayers = (await pageState()).markers;
  await evaluate(`document.querySelector('input[aria-label="Sourced geographic reference points"]').click()`);
  await until(async () => (await pageState()).markers < beforeLayers, "sourced points toggle off");
  console.log("Sourced points off:", (await pageState()).markers);
  await evaluate(`document.querySelector('input[aria-label="Sourced geographic reference points"]').click()`);
  await until(async () => (await pageState()).markers >= beforeLayers, "sourced points toggle on");
  await evaluate(`document.querySelector('input[aria-label="Malir sourced facility candidates"]').click()`);
  await until(async () => (await pageState()).markers < beforeLayers, "facility candidates toggle off");
  await evaluate(`document.querySelector('input[aria-label="Malir sourced facility candidates"]').click()`);
  await until(async () => (await pageState()).markers >= beforeLayers, "facility candidates toggle on");
  await evaluate(`document.querySelector('input[aria-label="Simulated Malir scenario markers"]').click()`);
  await until(async () => (await pageState()).markers > beforeLayers, "scenario toggle on");
  console.log("Scenario on:", (await pageState()).markers);
  await evaluate(`document.querySelector('#karachi-map button[aria-pressed]')?.click()`);
  await until(async () => (await pageState()).markers === 1, "city reset hides Malir points");
  console.log("City reset: one city reference point");
  const zoomBefore = await evaluate(`document.querySelector('#karachi-map .leaflet-tile-loaded')?.src?.match(/\\/(\\d+)\\/\\d+\\/\\d+\\.png/)?.[1]`);
  await evaluate(`document.querySelector('#karachi-map .leaflet-control-zoom-in')?.click()`);
  if (zoomBefore) await until(async () => Number(await evaluate(`document.querySelector('#karachi-map .leaflet-tile-loaded')?.src?.match(/\\/(\\d+)\\/\\d+\\/\\d+\\.png/)?.[1]`)) > Number(zoomBefore), "zoom-in tile level");
  console.log("Zoom control: tile level increased from", zoomBefore);
  await evaluate(`document.querySelector('#karachi-map .leaflet-container').scrollIntoView({block:'center'})`);
  await delay(300);
  const paneBefore = await evaluate(`document.querySelector('#karachi-map .leaflet-map-pane').style.transform`);
  const rect = await evaluate(`(()=>{const r=document.querySelector('#karachi-map .leaflet-container').getBoundingClientRect();return {x:r.x+r.width/2-100,y:r.y+r.height/2-70}})()`);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", buttons: 1, clickCount: 1 });
  for (let step = 1; step <= 5; step++) { await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: rect.x + step * 16, y: rect.y + step * 8, button: "left", buttons: 1 }); await delay(30); }
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x + 80, y: rect.y + 40, button: "left", buttons: 0, clickCount: 1 });
  await until(async () => (await evaluate(`document.querySelector('#karachi-map .leaflet-map-pane').style.transform`)) !== paneBefore, "map pan transform", 4000).catch(async (error) => { console.log("Pan diagnostic:", { before: paneBefore, after: await evaluate(`document.querySelector('#karachi-map .leaflet-map-pane').style.transform`), rect }); throw error; });
  console.log("Mouse pan: map pane moved");
  await evaluate(`document.querySelector('#karachi-map a[href^="/command?"]')?.click()`);
  const command = await until(async () => {
    const state = await pageState();
    return state.path === "/command" && state.query === "pk-sindh-karachi-malir" && state.visibleMaps === 1 && !state.coverageVisible ? state : null;
  }, `Command navigation after click`, 20000).catch(async (error) => {
    console.log("Command navigation diagnostic:", await pageState(), browserErrors);
    throw error;
  });
  console.log("Command navigation:", command.path, command.query);
  await delay(500);
  await send("Network.setBlockedURLs", { urls: ["*tile.openstreetmap.org*"] });
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Page.navigate", { url: `${baseUrl}/coverage?district=pk-sindh-karachi-west` });
  await until(async () => (await pageState()).district === "pk-sindh-karachi-west" && (await pageState()).maps === 1, "blocked-tile coverage page");
  await until(async () => (await pageState()).fallback, "visible tile failure fallback", 13000);
  assert.equal(await evaluate(`!!document.querySelector('#karachi-map-district')`), true, "district selector remains available without tiles");
  console.log("Blocked tiles: visible fallback and working district selector");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const mobile = await evaluate(`({selectorWidth:document.querySelector('#karachi-map-district').getBoundingClientRect().width,mapWidth:document.querySelector('#karachi-map .leaflet-container').getBoundingClientRect().width,viewport:innerWidth})`);
  assert.ok(mobile.selectorWidth > 300 && mobile.mapWidth > 300 && mobile.viewport === 390, "mobile selector and map retain usable width");
  console.log("Mobile 390px:", mobile);
  await evaluate(`document.querySelector('#karachi-map a[href^="/command?"]')?.click()`);
  await until(async () => {
    const state = await pageState();
    return state.path === "/command" && state.query === "pk-sindh-karachi-west" && state.topDistrict === "pk-sindh-karachi-west" && !state.coverageVisible;
  }, "West Command navigation on mobile");
  console.log("Mobile West Command: district URL and selector preserved");
  console.log("Tile HTTP 200 responses:", tileResponses.filter((status) => status === 200).length);
  console.log("Browser errors:", JSON.stringify(browserErrors));
  assert.equal(browserErrors.some((item) => /Map container is already initialized|_leaflet_id|_leaflet_pos|removeLayer/i.test(item)), false, "no Leaflet lifecycle errors");
} finally {
  ws?.close();
  browser.kill();
  console.log("Chrome profile retained at:", profile);
}
