import apiClient from "./apiClient";

const getCart = async () => {
    const response = await  apiClient.get("/cart");
    return response.data; 
};

const getCartByUser = async (userId) => {
    const response = await apiClient.get(`/cart/user/${userId}`); 
    return response.data;
}

const createCart = async (userId, products) => {
    const response = await apiClient.post("/cart", {user: userId, products});
    return response.data;
};



const replaceCart = async (cartId, userId, products ) => {
    const response = await apiClient.put(`/cart/${cartId}`, {
        user: userId, 
        products, 
    });
    return response.data; 
}; 

//const removeItem  = async (itemId) => {
//    return apiClient.delete(`/cart/${itemId}`);
//};

const clearCart = async (cartId) => {
    await apiClient.delete(`/cart/${cartId}`); 
};

export {getCart, getCartByUser, createCart, replaceCart, clearCart};
