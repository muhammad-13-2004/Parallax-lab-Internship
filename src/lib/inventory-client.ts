"use client";

import { useEffect, useState } from "react";

export type InventoryStatus = "connected" | "reconnecting" | "offline";
export type InventoryMessage =
  | { type: "SYNC"; products: Record<string, number>; sentAt: string }
  | { type: "UPDATE"; productId: string; quantity: number; version: number; updatedAt: string }
  | { type: "ERROR"; message: string; code?: string };

const listeners = new Set<() => void>();
let socket: WebSocket | null = null;
let retryHandle: number | null = null;
let retryCount = 0;

const snapshot = {
  status: "offline" as InventoryStatus,
  products: {} as Record<string, number>,
  error: null as string | null,
};

function emit() {
  for (const listener of listeners) listener();
}

export function getInventorySocketUrl() {
  if (typeof window === "undefined") return "ws://127.0.0.1:8082/inventory";
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.hostname || "127.0.0.1";
  return `${protocol}://${host}:8082/inventory`;
}

function clearRetry() {
  if (retryHandle !== null && typeof window !== "undefined") {
    window.clearTimeout(retryHandle);
    retryHandle = null;
  }
}

function scheduleReconnect() {
  if (typeof window === "undefined") return;
  clearRetry();
  const baseDelay = 1000;
  const maxDelay = 15000;
  const spread = Math.random() * 400;
  const delay = Math.min(baseDelay * 2 ** Math.min(retryCount, 6), maxDelay) + spread;
  retryCount += 1;
  snapshot.status = "reconnecting";
  emit();
  retryHandle = window.setTimeout(() => {
    connect();
  }, delay);
}

function connect() {
  if (typeof window === "undefined") return;
  clearRetry();
  if (socket && socket.readyState === WebSocket.OPEN) {
    return;
  }
  if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
    return;
  }

  socket = new WebSocket(getInventorySocketUrl());
  snapshot.status = "connected";
  emit();

  socket.onopen = () => {
    snapshot.status = "connected";
    snapshot.error = null;
    retryCount = 0;
    emit();
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data) as InventoryMessage;
      if (message.type === "SYNC") {
        snapshot.products = message.products ?? {};
        emit();
        return;
      }
      if (message.type === "UPDATE") {
        snapshot.products = { ...snapshot.products, [message.productId]: message.quantity };
        emit();
        return;
      }
      if (message.type === "ERROR") {
        snapshot.error = message.message;
        emit();
      }
    } catch {
      snapshot.error = "Inventory update message was invalid.";
      emit();
    }
  };

  socket.onerror = () => {
    snapshot.error = "Inventory updates are currently unavailable.";
    emit();
  };

  socket.onclose = () => {
    socket = null;
    scheduleReconnect();
  };
}

export function useInventoryStream() {
  const [state, setState] = useState({
    status: snapshot.status,
    products: snapshot.products,
    error: snapshot.error,
  });

  useEffect(() => {
    const update = () => {
      setState({
        status: snapshot.status,
        products: snapshot.products,
        error: snapshot.error,
      });
    };

    listeners.add(update);
    update();
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      connect();
    }

    return () => {
      listeners.delete(update);
    };
  }, []);

  return state;
}
