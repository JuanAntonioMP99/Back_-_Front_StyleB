import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../Data/users.json", () => ({
  default: [
    { _id: "u1", name: "Ada Lovelace", email: "ada@example.com" },
    { _id: "u2", name: "Alan Turing", email: "alan@example.com" },
  ],
}));

import { fetchUsers, getUserById, searchUsers } from "./userService";

describe("userService (mock local)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fetchUsers resuelve la lista tras el delay simulado", async () => {
    const promise = fetchUsers();
    await vi.runAllTimersAsync();
    const users = await promise;
    expect(users).toHaveLength(2);
  });

  it("searchUsers filtra por nombre o email, sin distinguir mayúsculas", async () => {
    const promise = searchUsers("  ALAN ");
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe("u2");
  });

  it("searchUsers también encuentra por email", async () => {
    const promise = searchUsers("ada@example");
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.map((u) => u._id)).toEqual(["u1"]);
  });

  it("getUserById devuelve el usuario correspondiente", async () => {
    const promise = getUserById("u2");
    await vi.runAllTimersAsync();
    const user = await promise;
    expect(user.name).toBe("Alan Turing");
  });

  it("getUserById devuelve undefined si no existe", async () => {
    const promise = getUserById("nope");
    await vi.runAllTimersAsync();
    const user = await promise;
    expect(user).toBeUndefined();
  });
});
