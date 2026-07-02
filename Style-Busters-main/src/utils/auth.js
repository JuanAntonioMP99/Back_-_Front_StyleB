const TOKEN_KEY = "authToken"; 

//Guarda el auth token en local storage 
export function saveToken(token) {
  if (!token) return; 
  localStorage.setItem(TOKEN_KEY, token); 
}

//Lee el token del local storage
export function getToken () {
  return localStorage.getItem(TOKEN_KEY) || null; 
}

//Elimina token (logout)
export function clearToken () {
  localStorage.removeItem(TOKEN_KEY); 
}

export function decodeToken(token) {
  try {
    const payloadBase64 = token.split(".")[1]; 
    const payload = JSON.parse(atob(payloadBase64)); 

    return payload; 
  } catch (error) {
    return null; 
  }
}


export function isTokenExpired (token) {
  const payload = decodeToken(token); 
  if (!payload?.exp) return true; 

  return Date.now() >= payload.exp * 1000; 
}
