import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { 
  getCartByUser,
  createCart, 
  replaceCart, 
  clearCart as serviceClearCart, 
} from "../Services/cartService";
import { readLocalJSON, writeLocalJSON } from "../utils/storageHelpers";


const CartContext = createContext();

export function CartProvider({ children }) {

  const CART_STORAGE_KEY = "cart"; 
  const {isAuthenticated, user} = useAuth();
  const [cartId, setCartId] = useState(null); 
  const [items, setItems] = useState(() => 
    (readLocalJSON(CART_STORAGE_KEY) ?? []), 
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); 

  useEffect(() => {
    (writeLocalJSON(CART_STORAGE_KEY, items));
  }, [items]); 

  useEffect(() => {
    if (!isAuthenticated) {
      setCartId(null); 
      return; 
    }

    let cancelled = false; //funcion bandera, definir un valor como false o true, para que cuando cambie se realice una funcion/accion

    (async () => {
      const localItems = readLocalJSON(CART_STORAGE_KEY) ?? [];
      try {
        const serverCart = await getCartByUser(user.id);
        if (cancelled) return;

        const serverItems = serverCart.products.map((entry) => ({
          product: entry.product, 
          quantity: entry.quantity, 
        }));

        setCartId(serverCart._id);
        changeItems(mergeCarts(localItems, serverItems)); 

      } catch (error) {
        if (cancelled) return;
        if (error.kind !== "NOT_FOUND") {
          setError(error.kind ?? "SERVER_ERROR"); 
        }
      }
    })(); 
    return () => {
      cancelled = true; 
    }; 
  }, [isAuthenticated, user?.id]); 

  const mergeCarts = (localItems, serverItems) => {
    const merged = serverItems.map((serverItem) => {
      const localItem = localItems.find((item) => item.product._id === serverItem.product._id); 

      if (localItem) {
        return { ...serverItem, quantity: localItem.quantity}
      }

      return serverItem;
    }); 

    const onlyLocal = localItems.filter((localItem) => !serverItems.find (
      (item) => item.product._id === localItem.product._id, 
    ), ); 

    return [...merged, ...onlyLocal]; 
  };

  const count = useMemo(
    () => items.reduce((acc, it) => acc + it.quantity, 0),
    [items],
  );

  const total = useMemo(

    () =>{return items.reduce((acc,it) => acc + it.quantity*it.product.price,0)
      }
    , [items], 
  );

  const addItem = async (product, quantity = 1) => {

    const existingProduct = items.find(
      (item) => item.product._id === product._id,
    ); 

    const nextItems = existingProduct
      ? items.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      : [...items, { product, quantity }]; 

      changeItems(nextItems); 

    
  };

  const updateQuantity = async (itemId, quantity ) => {

    if (quantity < 1) {
      removeItem(itemId);
      return;
    }

    const nextItems = items.map((item) =>
      item.product._id === itemId ? { ...item, quantity } : item,
    );

    changeItems(nextItems);
  };

  const removeItem = async (itemId) => {

    changeItems (items.filter((item) => item.product._id !== itemId)); 
  };

  const clearCart = () => changeItems ([]); 

  const syncWithApi = async (nextItems) => {
    if (!isAuthenticated) return; 

    if (nextItems.length === 0){
      if(cartId){
        await serviceClearCart(cartId);
        setCartId(null);
      }
    }

    const products = nextItems.map((item) => ({
      product: item.product._id,
      quantity: item.quantity, 
    }));

    if(!cartId) {
      const created = await createCart(user.id, products); 
      setCartId(created._id); 
    } else {
      await replaceCart(cartId, user.id, products); 
    }
  };

  const changeItems = (nextItems) => {
    setItems(nextItems); 
    setError(null); 
    syncWithApi(nextItems).catch ((err) => {
      setError(err.kind ?? "SERVER_ERROR"); 
    }); 
  };

  const value = {
    items,
    count,
    total,
    addItem,
    updateQuantity,
    removeItem,
    clearCart, 
    loading,
    error,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context)
    throw new Error("useCart debe ser usado dentro de CartProvider");
  return context;
}