import type { ActorRefFrom } from "xstate";
import { canAcceptUpdate, cartMachine } from "@/lib/cart-machine";

export type CartMutation =
  { type: "UPDATE_QUANTITY"; id: string; quantity: number } | { type: "REMOVE_ITEM"; id: string };

export type CartMutationResult = "saved" | "failed" | "invalid" | "busy";
export type CartActor = Pick<ActorRefFrom<typeof cartMachine>, "send" | "getSnapshot">;
export type CartMutationExecutor = (mutation: CartMutation) => Promise<void>;

let nextOperationId = 0;

export async function runOptimisticCartMutation(
  actor: CartActor,
  mutation: CartMutation,
  execute: CartMutationExecutor,
): Promise<CartMutationResult> {
  const { id } = mutation;
  const snapshot = actor.getSnapshot();
  if (snapshot.context.pending[id]) return "busy";

  const item = snapshot.context.items.find((entry) => entry.id === id);
  if (!item) return "invalid";
  if (
    mutation.type === "UPDATE_QUANTITY" &&
    !canAcceptUpdate(snapshot.context.items, id, mutation.quantity)
  ) {
    return "invalid";
  }

  const operationId = `cart-op-${++nextOperationId}`;
  actor.send(
    mutation.type === "UPDATE_QUANTITY"
      ? {
          type: "OPTIMISTIC_UPDATE",
          id,
          quantity: mutation.quantity,
          operationId,
        }
      : { type: "OPTIMISTIC_REMOVE", id, operationId },
  );

  if (actor.getSnapshot().context.pending[id]?.operationId !== operationId) {
    return "invalid";
  }

  try {
    await execute(mutation);
    actor.send({ type: "MUTATION_SUCCEEDED", id, operationId });
    return "saved";
  } catch {
    actor.send({ type: "MUTATION_FAILED", id, operationId });
    return "failed";
  }
}
