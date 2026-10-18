import { WebSocketServer } from "ws";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const INVENTORY_PATH = process.env.NORTHLINE_INVENTORY_PATH ?? path.join(process.cwd(), ".northline-inventory.json");
const DEFAULT_PRODUCTS_PATH = path.join(process.cwd(), "src", "data", "products.json");
const PORT = Number(process.env.NORTHLINE_WS_PORT ?? 8082);

const state = {
  inventory: {},
  clients: new Set(),
};

function normalizeQuantity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
}

function createDefaultInventory() {
  const payload = JSON.parse(readFileSync(DEFAULT_PRODUCTS_PATH, "utf8"));
  return Object.fromEntries(payload.map((product) => [product.id, product.stock]));
}

async function loadInventory() {
  try {
    const raw = await readFile(INVENTORY_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return createDefaultInventory();
    }
    const normalized = {};
    for (const [productId, rawValue] of Object.entries(parsed)) {
      normalized[productId] = normalizeQuantity(rawValue);
    }
    return normalized;
  } catch {
    const initial = createDefaultInventory();
    await writeInventory(initial);
    return initial;
  }
}

async function writeInventory(nextInventory) {
  await mkdir(path.dirname(INVENTORY_PATH), { recursive: true });
  await writeFile(INVENTORY_PATH, JSON.stringify(nextInventory, null, 2), "utf8");
}

function isValidProductId(productId) {
  return typeof productId === "string" && Boolean(productId) && productId in state.inventory;
}

function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const client of state.clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
}

function applyInventoryUpdate(productId, quantity, reason = "server") {
  if (!isValidProductId(productId)) {
    return { ok: false, error: "Unknown product ID" };
  }

  const nextQuantity = normalizeQuantity(quantity);
  state.inventory[productId] = nextQuantity;
  const version = Date.now();
  const event = {
    type: "UPDATE",
    productId,
    quantity: nextQuantity,
    version,
    updatedAt: new Date(version).toISOString(),
    reason,
  };
  broadcast(event);
  return { ok: true, ...event };
}

async function reconcileWithCatalog() {
  const defaultInventory = createDefaultInventory();
  state.inventory = { ...defaultInventory, ...state.inventory };
  await writeInventory(state.inventory);
}

async function startInventoryServer(port = PORT) {
  state.inventory = await loadInventory();
  const server = new WebSocketServer({
    port,
    host: "0.0.0.0",
    path: "/inventory",
  });

  server.on("connection", (socket) => {
    state.clients.add(socket);
    socket.send(
      JSON.stringify({
        type: "SYNC",
        products: { ...state.inventory },
        sentAt: new Date().toISOString(),
      }),
    );

    socket.on("message", async (rawMessage) => {
      try {
        const message = JSON.parse(rawMessage.toString());
        if (!message || typeof message !== "object") {
          throw new Error("Message must be an object");
        }

        if (message.type === "PING") {
          socket.send(JSON.stringify({ type: "PONG", sentAt: new Date().toISOString() }));
          return;
        }

        if (message.type === "SUBSCRIBE") {
          const productIds = Array.isArray(message.productIds) ? message.productIds : Object.keys(state.inventory);
          socket.productIds = productIds;
          socket.send(
            JSON.stringify({
              type: "SYNC",
              products: Object.fromEntries(
                Object.entries(state.inventory).filter(
                  ([productId]) => productIds.includes(productId) || productIds.includes("*"),
                ),
              ),
              sentAt: new Date().toISOString(),
            }),
          );
          return;
        }

        if (message.type === "UPDATE") {
          const productId = message.productId;
          const quantity = Number(message.quantity);

          if (!isValidProductId(productId) || !Number.isInteger(quantity) || quantity < 0) {
            socket.send(
              JSON.stringify({
                type: "ERROR",
                message: "Invalid inventory update payload",
                code: "INVALID_UPDATE",
              }),
            );
            return;
          }

          const result = applyInventoryUpdate(productId, quantity, "remote-client");
          if (!result.ok) {
            socket.send(JSON.stringify({ type: "ERROR", message: result.error, code: "INVALID_UPDATE" }));
          }
          return;
        }

        if (message.type === "RESERVE") {
          const { productId, quantity } = message;
          if (!isValidProductId(productId) || !Number.isInteger(quantity) || quantity < 1) {
            socket.send(
              JSON.stringify({
                type: "ERROR",
                message: "Invalid reservation request",
                code: "INVALID_RESERVATION",
              }),
            );
            return;
          }

          const current = state.inventory[productId] ?? 0;
          if (quantity > current) {
            socket.send(
              JSON.stringify({
                type: "ERROR",
                message: "Insufficient stock",
                code: "INSUFFICIENT_STOCK",
              }),
            );
            return;
          }

          const next = current - quantity;
          state.inventory[productId] = next;
          await writeInventory(state.inventory);
          broadcast({
            type: "UPDATE",
            productId,
            quantity: next,
            version: Date.now(),
            updatedAt: new Date().toISOString(),
            reason: "reservation",
          });
          return;
        }

        throw new Error(`Unsupported event type: ${message.type}`);
      } catch (error) {
        socket.send(
          JSON.stringify({
            type: "ERROR",
            message: error instanceof Error ? error.message : "Malformed message",
            code: "INVALID_MESSAGE",
          }),
        );
      }
    });

    socket.on("close", () => {
      state.clients.delete(socket);
    });
  });

  return server;
}

async function stopInventoryServer(server) {
  for (const client of state.clients) {
    client.close();
  }
  state.clients.clear();
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

export function getInventorySnapshot() {
  return { ...state.inventory };
}

export {
  applyInventoryUpdate,
  loadInventory,
  writeInventory,
  reconcileWithCatalog,
  startInventoryServer,
  stopInventoryServer,
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = await startInventoryServer(PORT);
  console.log(`Inventory WebSocket server listening at ws://0.0.0.0:${PORT}/inventory`);
  process.on("SIGINT", async () => {
    await stopInventoryServer(server);
    process.exit(0);
  });
}
