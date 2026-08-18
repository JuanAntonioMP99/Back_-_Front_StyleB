// Helper de test: fabrica un JWT "de mentira" pero con payload decodificable por
// utils/auth.decodeToken (atob del segmento central). isTokenExpired exige `exp`,
// así que por defecto se pone una expiración futura para que la sesión se restaure.
export function makeToken(payload = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(
    JSON.stringify({
      userId: "u1",
      name: "Ada",
      role: "customer",
      exp: now + 3600,
      ...payload,
    }),
  );
  return `${header}.${body}.sig`;
}
