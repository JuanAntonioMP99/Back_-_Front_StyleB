import { describe, it, expect } from "vitest";
import User from "../../../src/models/User.js";

// validateSync() ejecuta los validadores del schema sin tocar la BD.
// Solo el índice unique necesita la BD en memoria (ver último test).

describe("Modelo User", () => {
  it("exige name, email y password", () => {
    const error = new User({}).validateSync();

    expect(error).toBeDefined();
    expect(Object.keys(error.errors).sort()).toEqual([
      "email",
      "name",
      "password",
    ]);
  });

  it("aplica el default role=customer", () => {
    const user = new User({ name: "Ana", email: "a@t.com", password: "x" });

    expect(user.role).toBe("customer");
    expect(user.validateSync()).toBeUndefined();
  });

  it("acepta role=admin y rechaza un role fuera del enum", () => {
    expect(
      new User({
        name: "Root",
        email: "r@t.com",
        password: "x",
        role: "admin",
      }).validateSync(),
    ).toBeUndefined();

    const error = new User({
      name: "Mallory",
      email: "m@t.com",
      password: "x",
      role: "superadmin",
    }).validateSync();

    expect(error.errors).toHaveProperty("role");
  });

  it("normaliza el email a minúsculas y recorta espacios", () => {
    const user = new User({
      name: "  Ana  ",
      email: "  ANA@TEST.COM  ",
      password: "x",
    });

    expect(user.email).toBe("ana@test.com");
    expect(user.name).toBe("Ana");
  });

  it("rechaza un email duplicado por el índice unique", async () => {
    // El índice unique lo aplica MongoDB, no el schema: requiere BD real y que
    // los índices estén construidos (User.init()).
    await User.init();
    await User.create({ name: "Ana", email: "dup@test.com", password: "x" });

    await expect(
      User.create({ name: "Otra", email: "dup@test.com", password: "y" }),
    ).rejects.toMatchObject({ code: 11000 });
  });
});
