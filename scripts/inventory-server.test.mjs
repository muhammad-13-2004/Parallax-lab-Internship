import assert from "node:assert/strict";
import { test } from "node:test";
import WebSocket from "ws";

process.env.NORTHLINE_WS_PORT = "19082";
const { startInventoryServer, stopInventoryServer, applyInventoryUpdate } = await import(
  new URL(`./inventory-server.mjs?test=${Date.now()}`, import.meta.url).href,
);

const BASE_PORT = Number(process.env.NORTHLINE_WS_PORT);

function nextPort(offset = 0) {
  return BASE_PORT + offset;
}

function awaitMessage(socket, predicate, timeoutMs = 2000) {
  socket.__messages ??= [];

  const queued = socket.__messages.find((message) => predicate(message));
  if (queued) {
    return Promise.resolve(queued);
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.removeListener("message", onMessage);
      reject(new Error("Timed out waiting for inventory message"));
    }, timeoutMs);

    function onMessage(raw) {
      try {
        const message = JSON.parse(raw.toString());
        socket.__messages.push(message);
        if (predicate(message)) {
          clearTimeout(timer);
          socket.removeListener("message", onMessage);
          resolve(message);
        }
      } catch {
        // Ignore malformed frames while waiting for matching events.
      }
    }

    socket.on("message", onMessage);
  });
}

async function connectClient(port) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:${port}/inventory`);
    socket.__messages = [];
    socket.on("message", (raw) => {
      try {
        socket.__messages.push(JSON.parse(raw.toString()));
      } catch {
        // ignore malformed frames until the test inspects them
      }
    });
    socket.once("open", () => resolve(socket));
    socket.once("error", reject);
  });
}

test("inventory server syncs initial state to multiple clients", { concurrency: false }, async () => {
  const port = nextPort(1);
  const server = await startInventoryServer(port);
  const clientA = await connectClient(port);
  const clientB = await connectClient(port);

  const syncA = await awaitMessage(clientA, (message) => message.type === "SYNC");
  const syncB = await awaitMessage(clientB, (message) => message.type === "SYNC");

  assert.equal(syncA.products["product-001"], 24);
  assert.equal(syncB.products["product-001"], 24);

  clientA.send(JSON.stringify({ type: "SUBSCRIBE", productIds: ["product-001"] }));
  clientB.send(JSON.stringify({ type: "SUBSCRIBE", productIds: ["product-001"] }));

  await awaitMessage(clientA, (message) => message.type === "SYNC" && message.products["product-001"] === 24);
  await awaitMessage(clientB, (message) => message.type === "SYNC" && message.products["product-001"] === 24);

  const update = applyInventoryUpdate("product-001", 12, "test");
  assert.equal(update.ok, true);

  const updateA = await awaitMessage(clientA, (message) => message.type === "UPDATE" && message.productId === "product-001");
  const updateB = await awaitMessage(clientB, (message) => message.type === "UPDATE" && message.productId === "product-001");

  assert.equal(updateA.quantity, 12);
  assert.equal(updateB.quantity, 12);

  clientA.close();
  clientB.close();
  await stopInventoryServer(server);
});

test("reconnecting client receives a fresh resync after disconnect", { concurrency: false }, async () => {
  const port = nextPort(2);
  const server = await startInventoryServer(port);
  const client = await connectClient(port);
  await awaitMessage(client, (message) => message.type === "SYNC");

  applyInventoryUpdate("product-001", 9, "test");
  await awaitMessage(client, (message) => message.type === "UPDATE" && message.productId === "product-001");

  client.close();

  const nextClient = await connectClient(port);
  const resynced = await awaitMessage(nextClient, (message) => message.type === "SYNC");
  assert.equal(resynced.products["product-001"], 9);

  nextClient.close();
  await stopInventoryServer(server);
});

test("malformed or unsupported inventory messages are rejected", { concurrency: false }, async () => {
  const port = nextPort(3);
  const server = await startInventoryServer(port);
  const client = await connectClient(port);
  await awaitMessage(client, (message) => message.type === "SYNC");

  client.send("not-json");
  const error = await awaitMessage(client, (message) => message.type === "ERROR");
  assert.equal(error.code, "INVALID_MESSAGE");

  client.send(JSON.stringify({ type: "UPDATE", productId: "product-001", quantity: "broken" }));
  const updateError = await awaitMessage(client, (message) => message.type === "ERROR" && message.code === "INVALID_UPDATE");
  assert.ok(updateError.message);

  client.close();
  await stopInventoryServer(server);
});
