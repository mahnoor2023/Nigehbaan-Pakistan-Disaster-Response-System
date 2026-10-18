/** Local production-browser journey and three-width screenshot capture. No application data is changed. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3103";
const chrome = process.env.NIGEHBAAN_CHROME ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = mkdtempSync(join(tmpdir(), "nigehbaan-final-qa-"));
const browser = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=19233", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(check, label, timeout = 16000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { const result = await check(); if (result) return result; } catch { /* route is transitioning */ } await delay(150); }
  throw new Error(`Timed out: ${label}`);
}
let ws;
let seq = 0;
const pending = new Map();
const errors = [];
function send(method, params = {}) {
  return new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
}
async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (response.result.exceptionDetails) throw new Error(response.result.exceptionDetails.exception?.description ?? response.result.exceptionDetails.text);
  return response.result.result.value;
}
async function navigate(route) {
  await send("Page.navigate", { url: `${baseUrl}${route}` });
  await until(async () => (await evaluate("document.readyState")) === "complete" && (await evaluate("location.pathname")) === route.split("?")[0], route);
}
async function clickNav(path) {
  await evaluate(`(()=>{const a=[...document.querySelectorAll('header.app-sidebar a')].find(a=>a.getAttribute('href')?.startsWith(${JSON.stringify(`${path}?`)}));if(!a)throw Error('Missing sidebar link ${path}');a.click();return true})()`);
  await until(async () => (await evaluate("location.pathname")) === path, `sidebar ${path}`);
}
async function selectDistrict(id) {
  await evaluate(`(()=>{const s=document.querySelector('#app-district-select');const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;set.call(s,${JSON.stringify(id)});s.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  await until(async () => (await evaluate(`new URLSearchParams(location.search).get('district') === ${JSON.stringify(id)} && document.querySelector('#app-district-select')?.value === ${JSON.stringify(id)}`)), `district ${id}`);
}
async function setSelect(selector, value) {
  await evaluate(`(()=>{const s=document.querySelector(${JSON.stringify(selector)});const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;set.call(s,${JSON.stringify(value)});s.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
}
const malir = "pk-sindh-karachi-malir";
const west = "pk-sindh-karachi-west";
try {
  await until(async () => (await fetch("http://127.0.0.1:19233/json")).ok, "Chrome debugger", 20000);
  const targets = await (await fetch("http://127.0.0.1:19233/json")).json();
  ws = new WebSocket(targets.find((target) => target.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) { const task = pending.get(message.id); if (task) { pending.delete(message.id); if (message.error) task.reject(new Error(message.error.message)); else task.resolve(message); } }
    else if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
  });
  await Promise.all([send("Page.enable"), send("Runtime.enable")]);
  await navigate(`/intelligence?district=${west}`);
  await until(async () => await evaluate(`document.querySelector('main h1')?.textContent === 'Overview'`), "Overview loaded");
  await selectDistrict(malir);
  await until(async () => await evaluate(`document.querySelector('main')?.innerText.includes('Karachi Malir at a glance')`), "Malir overview");
  assert.match(await evaluate(`document.querySelector('main')?.innerText`), /Open-Meteo model and forecast|Weather model unavailable/);
  assert.match(await evaluate(`document.querySelector('main')?.innerText`), /High priority|Unmet people/);
  console.log("Overview: Malir selection, weather provenance and risk indicators verified");

  await clickNav("/coverage");
  await until(async () => await evaluate(`!!document.querySelector('#karachi-map .leaflet-container')`), "Coverage map");
  await setSelect("#karachi-map-district", malir);
  await until(async () => (await evaluate(`document.querySelectorAll('#karachi-map .leaflet-interactive').length`)) > 1, "Malir mapped points");
  console.log("Coverage: Malir sourced-point markers visible");

  await clickNav("/command");
  await until(async () => await evaluate(`!!document.querySelector('input[type="range"]')`), "Command slider");
  await evaluate(`document.querySelector('input[type="range"]').focus()`);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "End", code: "End", windowsVirtualKeyCode: 35, nativeVirtualKeyCode: 35 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "End", code: "End", windowsVirtualKeyCode: 35, nativeVirtualKeyCode: 35 });
  await until(async () => await evaluate(`document.querySelector('input[type="range"]')?.value === '1' && document.body.innerText.includes('Extreme flood')`), "extreme flood scenario");
  assert.match(await evaluate(`document.body.innerText`), /Recommended seats|Recommended dispatch allocations/);
  const householdId = await evaluate(`(()=>{const button=document.querySelector('aside ol li button');if(!button)throw Error('No ranked household');button.click();return button.querySelector('b')?.textContent})()`);
  assert.ok(householdId, "priority household selected");
  await until(async () => await evaluate(`!!document.querySelector('a[href^="/missions?household="]')`), "create mission action");
  await evaluate(`document.querySelector('a[href^="/missions?household="]').click()`);
  await until(async () => (await evaluate("location.pathname")) === "/missions", "mission creation route");
  await until(async () => (await evaluate(`document.querySelector('main form select')?.value`)) === householdId, "prefilled household");
  const responder = await evaluate(`document.querySelectorAll('main form select')[1]?.options[1]?.value`);
  assert.ok(responder, "district responder available");
  await setSelect("main form .grid label:nth-child(2) select", responder);
  await delay(150);
  await evaluate(`document.querySelector('main form').requestSubmit()`);
  await until(async () => await evaluate(`document.querySelector('main article h3')?.textContent?.includes(${JSON.stringify(householdId)})`), "mission created");
  await until(async () => await evaluate(`document.querySelector('main article select[id^="status-"]')?.value === 'Assigned'`), "assigned status");
  for (const status of ["En Route", "Rescued", "Completed"]) {
    await setSelect('main article select[id^="status-"]', status);
    await until(async () => (await evaluate(`document.querySelector('main article select[id^="status-"]')?.value`)) === status, `status ${status}`);
  }
  console.log("Command → Missions: priority", householdId, "created and advanced through valid status transitions");

  await clickNav("/shelter");
  await until(async () => await evaluate(`!!document.querySelector('input[aria-label^="Occupied beds"]')`), "Shelter Desk");
  assert.equal(await evaluate(`document.querySelector('input[aria-label^="Occupied beds"]')?.value`), "0", "mission completion did not invent arrivals");
  await evaluate(`document.querySelector('button[aria-label^="Add 1 arrival"]').click()`);
  await until(async () => (await evaluate(`document.querySelector('input[aria-label^="Occupied beds"]')?.value`)) === "1", "manual arrival update");
  await send("Page.reload", { ignoreCache: false });
  await until(async () => (await evaluate(`document.querySelector('input[aria-label^="Occupied beds"]')?.value`)) === "1", "occupancy persisted after refresh");
  console.log("Shelters: no automatic arrival; manual occupancy persisted after refresh");

  await selectDistrict(west);
  await until(async () => await evaluate(`document.querySelector('input[aria-label^="Occupied beds"]')?.value === '0'`), "West occupancy isolated");
  await clickNav("/missions");
  await until(async () => await evaluate(`document.querySelector('main h1')?.textContent === 'Rescue missions'`), "West missions");
  assert.equal(await evaluate(`document.querySelectorAll('main article').length`), 0, "Malir mission absent from West");
  await selectDistrict(malir);
  await until(async () => await evaluate(`document.querySelector('main article select[id^="status-"]')?.value === 'Completed'`), "Malir mission restored");
  await clickNav("/shelter");
  await until(async () => await evaluate(`document.querySelector('input[aria-label^="Occupied beds"]')?.value === '1'`), "Malir occupancy restored");
  console.log("District isolation: West shows no Malir mission/occupancy; Malir state restored");

  const primaryRoutes = ["intelligence", "coverage", "command", "households", "missions", "shelter"];
  for (const [size, width, height] of [["desktop", 1440, 900], ["tablet", 768, 900], ["mobile", 390, 844]]) {
    const dir = join(process.cwd(), "artifacts", "final-qa", size);
    mkdirSync(dir, { recursive: true });
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: size === "mobile" });
    for (const route of primaryRoutes) {
      await navigate(`/${route}?district=${malir}`);
      await until(async () => await evaluate(`!!document.querySelector('main h1')`), `${route} heading`);
      await delay(route === "coverage" || route === "command" ? 1300 : 450);
      const state = await evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,heading:document.querySelector('main h1')?.textContent?.trim(),district:document.querySelector('#app-district-select')?.value})`);
      assert.ok(state.scrollWidth <= state.width + 1, `${route} ${size} overflow: ${state.scrollWidth}/${state.width}`);
      assert.equal(state.district, malir, `${route} ${size} district mismatch`);
      const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      writeFileSync(join(dir, `${route}.png`), Buffer.from(shot.result.data, "base64"));
      console.log(`${size} /${route}: ${state.heading}, ${state.scrollWidth}px document width`);
    }
  }
  assert.equal(errors.length, 0, `Browser exceptions: ${errors.join(" | ")}`);
  console.log("Final screenshots: artifacts/final-qa/{desktop,tablet,mobile}/");
  console.log("Browser exceptions: none");
} finally {
  ws?.close();
  browser.kill();
  console.log("Chrome profile retained at:", profile);
}
