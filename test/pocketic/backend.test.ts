import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";
import { registerCaller } from "./test-utils";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

const alice = createIdentity("alice");
const bob = createIdentity("bob");

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  if (BASELINE_WASM === undefined) {
    ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BACKEND_WASM }));
    return;
  }
  const installed = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BASELINE_WASM });
  await pic.tick();
  await pic.upgradeCanister({
    canisterId: installed.canisterId,
    wasm: BACKEND_WASM,
    upgradeModeOptions: { skip_pre_upgrade: [], wasm_memory_persistence: [{ keep: null }] },
  });
  ({ actor, canisterId } = installed);
});

afterAll(async () => {
  await pic?.tearDown();
});

/** A fresh actor for a caller, registered through the public sign-in path. */
async function callerActor(identity: ReturnType<typeof createIdentity>): Promise<Actor<_SERVICE>> {
  return registerCaller(pic!.createActor<_SERVICE>(idlFactory, canisterId), identity);
}

it("answers empty-state reads instead of trapping", async () => {
  const aliceActor = await callerActor(alice);
  await expect(aliceActor.listStudySessions()).resolves.toEqual([]);
  await expect(aliceActor.getPurchaseHistory()).resolves.toEqual([]);
  await expect(aliceActor.listStoreItems()).resolves.toEqual([]);
});

it("rejects an anonymous caller on a guarded write", async () => {
  const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  await expect(guest.startStudySession("Math")).rejects.toThrow();
});

it("round-trips a study session through the real canister", async () => {
  const aliceActor = await callerActor(alice);
  await aliceActor.createProfile("alice", "Alice");

  const started = await aliceActor.startStudySession("Mathematics");
  expect(started.subject).toBe("Mathematics");
  expect(started.status).toEqual({ running: null });
  expect(started.rewardedXp).toEqual([]);

  const finished = await aliceActor.finishStudySession(started.id);
  expect(finished.status).toEqual({ finished: null });
  // A session finished immediately has no verified elapsed time, so it earns
  // no XP: XP is derived from server-measured duration, never from the client.
  expect(finished.rewardedXp).toEqual([0n]);

  const history = await aliceActor.listStudySessions();
  expect(history).toHaveLength(1);
  expect(history[0]).toMatchObject({ id: started.id, subject: "Mathematics" });
});

it("refuses to reward the same session twice", async () => {
  const aliceActor = await callerActor(alice);
  const started = await aliceActor.startStudySession("Physics");
  await aliceActor.finishStudySession(started.id);
  await expect(aliceActor.finishStudySession(started.id)).rejects.toThrow();
});

it("does not show one caller's study sessions to another", async () => {
  const aliceActor = await callerActor(alice);
  const bobActor = await callerActor(bob);
  await bobActor.createProfile("bob", "Bob");

  const started = await aliceActor.startStudySession("Chemistry");
  await aliceActor.finishStudySession(started.id);

  const bobHistory = await bobActor.listStudySessions();
  expect(bobHistory).toEqual([]);
});

it("rejects a purchase with insufficient XP and never goes negative", async () => {
  const aliceActor = await callerActor(alice);
  // The first registered caller is the administrator.
  const item = await aliceActor.adminCreateStoreItem("Neon Frame", "A frame", { frame: null }, 500n);

  const bobActor = await callerActor(bob);
  await expect(bobActor.purchaseStoreItem(item.id)).rejects.toThrow();

  const profile = await bobActor.getCallerProfile();
  expect(profile[0]?.xp).toBe(0n);
  await expect(bobActor.getPurchaseHistory()).resolves.toEqual([]);
});

it("rejects buying an owned item a second time", async () => {
  const aliceActor = await callerActor(alice);
  // A free item so the purchase succeeds without earning XP first.
  const item = await aliceActor.adminCreateStoreItem("Starter Badge", "A badge", { badge: null }, 0n);

  const bobActor = await callerActor(bob);
  const purchase = await bobActor.purchaseStoreItem(item.id);
  expect(purchase.itemId).toBe(item.id);

  await expect(bobActor.purchaseStoreItem(item.id)).rejects.toThrow();
  const history = await bobActor.getPurchaseHistory();
  expect(history).toHaveLength(1);
});
