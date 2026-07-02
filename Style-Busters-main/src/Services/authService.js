import apiClient from "./apiClient"; 


const register = async (name, email, password, phone) => {
    const payload = {
        name: name?.trim(), 
        email: email?.trim().toLowerCase(), 
        password: password, 
        phone: phone?.trim() || undefined,
    }; 

    const response = await apiClient.post("/auth/register", payload); 
    return response; 
}; 

/**
 * @param {Object} credentials 
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{token:string, refreshToken:string}>}
 */

const login = async (credentials) => {
    const payload = {
        email: credentials.email?.trim().toLowerCase(), 
        password: credentials.password, 
    }; 

    const response = await apiClient.post("/auth/login", payload); 

    return {
        token: response.data.token, 
        refreshToken: response.data.refreshToken,
    }; 
}

export { register, login }; 