/** Optional Chrome/CDP visual and responsive smoke test for a local production server. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const mode = process.argv[2] === "before" ? "before" : "after";
const baseUrl = process.env.NIGEHBAAN_URL ?? "http://127.0.0.1:3102";
const chrome = process.env.NIGEHBAAN_CHROME ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = mkdtempSync(join(tmpdir(), "nigehbaan-ui-qa-"));
const outputDir = join(process.cwd(), "artifacts", "phase2-ui", mode);
mkdirSync(outputDir, { recursive: true });
const browser = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=19232", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(check, label, ms = 15000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { try { const value = await check(); if (value) return value; } catch { /* navigation in progress */ } await delay(150); }
  throw new Error(`Timed out: ${label}`);
}
let ws;
let seq = 0;
const pending = new Map();
const errors = [];
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (response.result.exceptionDetails) throw new Error(response.result.exceptionDetails.text);
  return response.result.result.value;
}
const routes = ["intelligence", "coverage", "command", "households", "missions", "shelter", "field", "analytics", "about"];
try {
  await until(async () => (await fetch("http://127.0.0.1:19232/json")).ok, "Chrome debugger", 20000);
  const targets = await (await fetch("http://127.0.0.1:19232/json")).json();
  ws = new WebSocket(targets.find((target) => target.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const task = pending.get(message.id);
      if (task) { pending.delete(message.id); if (message.error) task.reject(new Error(message.error.message)); else task.resolve(message); }
    } else if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
  });
  await Promise.all([send("Page.enable"), send("Runtime.enable")]);
  for (const width of [1365, 390]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: width === 390 ? 844 : 900, deviceScaleFactor: 1, mobile: width === 390 });
    for (const route of mode === "before" ? ["intelligence", "coverage", "command"] : routes) {
      const district = "?district=pk-sindh-karachi-west";
      await send("Page.navigate", { url: `${baseUrl}/${route}${district}` });
      await until(async () => (await evaluate("document.readyState")) === "complete" && (await evaluate("location.pathname")) === `/${route}`, `${route} navigation`);
      await until(async () => await evaluate(`!!document.querySelector('h1')`), `${route} heading`);
      await delay(route === "coverage" || route === "command" ? 1700 : 600);
      const state = await evaluate(`({heading:document.querySelector('main h1,h1')?.textContent?.trim(),width:innerWidth,scrollWidth:document.documentElement.scrollWidth,district:document.querySelector('#app-district-select')?.value,main:!!document.querySelector('main'),map:!!document.querySelector('.leaflet-container'),range:!!document.querySelector('input[type="range"]'),body:document.body.innerText.slice(0,10000)})`);
      assert.ok(state.heading, `${route}: heading exists`);
      if (mode === "after") {
        assert.ok(state.main, `${route}: main landmark exists`);
        assert.ok(state.scrollWidth <= state.width + 1, `${route}: no page-level horizontal overflow at ${width}px (${state.scrollWidth}px)`);
        assert.equal(state.district, "pk-sindh-karachi-west", `${route}: district selector is URL-synchronized`);
        assert.match(state.body, /synthetic|simulation|simulated|demonstration/i, `${route}: simulation disclosure is visible`);
        if (route === "command") assert.ok(state.range, "Command flood slider is present");
        if (route === "coverage") assert.ok(state.map, "Coverage map is mounted");
      }
      console.log(`${mode} ${width}px /${route}:`, { heading: state.heading, scrollWidth: state.scrollWidth, map: state.map });
      const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      writeFileSync(join(outputDir, `${route}-${width}.png`), Buffer.from(screenshot.result.data, "base64"));
    }
  }
  if (mode === "after") {
    await send("Page.navigate", { url: `${baseUrl}/shelter?district=pk-sindh-karachi-west` });
    await until(async () => await evaluate(`!!document.querySelector('button[aria-label^="Add 1 arrival"]')`), "Shelter controls");
    await evaluate(`document.querySelector('button[aria-label^="Add 1 arrival"]').click()`);
    await until(async () => (await evaluate(`document.querySelector('input[aria-label^="Occupied beds"]')?.value`)) === "1", "shelter arrival control");
    console.log("Shelter Desk: +1 browser-local arrival control updated occupancy");
    await evaluate(`document.querySelector('a[href^="/missions?district="]')?.click()`);
    await until(async () => (await evaluate(`location.pathname`)) === "/missions", "sidebar Missions navigation");
    await until(async () => await evaluate(`!!document.querySelector('main form select')`), "mission form");
    const householdId = await evaluate(`(()=>{const form=document.querySelector('main form');const select=form.querySelector('select');const value=select.options[1].value;const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;set.call(select,value);select.dispatchEvent(new Event('change',{bubbles:true}));return value})()`);
    await delay(150);
    await evaluate(`document.querySelector('main form').requestSubmit()`);
    await until(async () => await evaluate(`document.querySelector('main article h3')?.textContent?.includes(${JSON.stringify(householdId)})`), "mission creation");
    console.log("Missions: browser-local exercise mission created for", householdId);
    await evaluate(`document.querySelector('a[href^="/command?district="]')?.click()`);
    await until(async () => (await evaluate(`location.pathname`)) === "/command", "sidebar Command navigation");
    await until(async () => await evaluate(`!!document.querySelector('input[type="range"]')`), "flood slider");
    await evaluate(`document.querySelector('input[type="range"]').focus()`);
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "End", code: "End", windowsVirtualKeyCode: 35, nativeVirtualKeyCode: 35 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "End", code: "End", windowsVirtualKeyCode: 35, nativeVirtualKeyCode: 35 });
    await until(async () => await evaluate(`document.querySelector('input[type="range"]')?.value === "1" && document.body.innerText.includes('Extreme flood')`), "flood scenario interaction");
    console.log("Command: keyboard flood slider changed scenario to extreme");
    await send("Page.navigate", { url: `${baseUrl}/command?district=pk-sindh-karachi-malir` });
    await until(async () => (await evaluate(`document.querySelector('#app-district-select')?.value`)) === "pk-sindh-karachi-malir", "Malir selector");
    await until(async () => await evaluate(`!!document.querySelector('.leaflet-container')`), "Malir Command map");
    console.log("Malir Command: sourced-point map mounted");
    assert.equal(errors.length, 0, `Browser exceptions: ${errors.join(" | ")}`);
  }
  console.log("Screenshots:", outputDir);
  console.log("Browser exceptions:", errors.length);
} finally {
  ws?.close();
  browser.kill();
  console.log("Chrome profile retained at:", profile);
}
