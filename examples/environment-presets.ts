import { createSandbox } from "../src/index";

const browser = createSandbox({ env: "browser" });
const wintercg = createSandbox({ env: "wintercg" });
const node = createSandbox({ env: "node" });
const minimal = createSandbox({ env: "minimal" });

const availability = {
  browser: {
    fetch: await browser.run<string>("typeof fetch"),
    console: await browser.run<string>("typeof console"),
    timers: await browser.run<string>("typeof setTimeout"),
  },
  wintercg: {
    fetch: await wintercg.run<string>("typeof fetch"),
    console: await wintercg.run<string>("typeof console"),
    timers: await wintercg.run<string>("typeof setTimeout"),
  },
  node: {
    fetch: await node.run<string>("typeof fetch"),
    console: await node.run<string>("typeof console"),
    timers: await node.run<string>("typeof setTimeout"),
    arrayBuffer: await node.run<string>("typeof ArrayBuffer"),
  },
  minimal: {
    math: await minimal.run<string>("typeof Math"),
    fetch: await minimal.run<string>("typeof fetch"),
    console: await minimal.run<string>("typeof console"),
  },
};

console.log(availability);
