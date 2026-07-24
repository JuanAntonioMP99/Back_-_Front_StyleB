import { MongoMemoryServer } from "mongodb-memory-server";

// Un ÚNICO mongod para toda la ejecución, en vez de uno por archivo de test.
// Antes, con setupFiles levantando una instancia por archivo, 18 archivos
// significaban 18 procesos mongod: ~8s de setup y, bajo carga, arranques que
// expiraban y tumbaban archivos enteros de forma intermitente.
// Cada archivo se conecta a su propia base dentro de esta instancia (ver setup.js),
// así que siguen aislados entre sí.

let mongoServer;

export async function setup({ provide }) {
  mongoServer = await MongoMemoryServer.create();
  provide("mongoUri", mongoServer.getUri());
}

export async function teardown() {
  await mongoServer?.stop();
}
