import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import {
  getCartByUser,
  createCart,
  replaceCart,
  clearCart as serviceClearCart,
} from "../Services/cartService";
import { readLocalJSON, writeLocalJSON } from "../utils/storageHelpers";


const CartContext = createContext();
// Contexto separado SOLO con las acciones. Su valor nunca cambia, así que un
// consumidor que solo necesita `addItem` (ProductCard, una rejilla entera de
// tarjetas) no se repinta cada vez que cambia el contenido del carrito.
const CartActionsContext = createContext();

export function CartProvider({ children }) {

  const CART_STORAGE_KEY = "cart";
  const {isAuthenticated, user} = useAuth();
  const [cartId, setCartId] = useState(null);
  const [items, setItems] = useState(() =>
    (readLocalJSON(CART_STORAGE_KEY) ?? []),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Espejos del estado para que las acciones puedan leer el valor actual sin
  // declararlo como dependencia: es lo que las mantiene estables entre renders.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const cartIdRef = useRef(cartId);
  cartIdRef.current = cartId;
  const authRef = useRef({ isAuthenticated, userId: user?.id });
  authRef.current = { isAuthenticated, userId: user?.id };

  useEffect(() => {
    (writeLocalJSON(CART_STORAGE_KEY, items));
  }, [items]);

  const syncWithApi = useCallback(async (nextItems) => {
    const { isAuthenticated: authed, userId } = authRef.current;
    if (!authed) return;

    const currentCartId = cartIdRef.current;

    if (nextItems.length === 0){
      if(currentCartId){
        await serviceClearCart(currentCartId);
        setCartId(null);
      }
    }

    const products = nextItems.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
    }));

    if(!currentCartId) {
      const created = await createCart(userId, products);
      setCartId(created._id);
    } else {
      await replaceCart(currentCartId, userId, products);
    }
  }, []);

  const changeItems = useCallback((nextItems) => {
    setItems(nextItems);
    setError(null);
    syncWithApi(nextItems).catch ((err) => {
      setError(err.kind ?? "SERVER_ERROR");
    });
  }, [syncWithApi]);

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
  }, [isAuthenticated, user?.id, changeItems]);

  const count = useMemo(
    () => items.reduce((acc, it) => acc + it.quantity, 0),
    [items],
  );

  const total = useMemo(

    () =>{return items.reduce((acc,it) => acc + it.quantity*it.product.price,0)
      }
    , [items],
  );

  const addItem = useCallback(async (product, quantity = 1) => {
    const current = itemsRef.current;

    const existingProduct = current.find(
      (item) => item.product._id === product._id,
    );

    const nextItems = existingProduct
      ? current.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      : [...current, { product, quantity }];

    changeItems(nextItems);
  }, [changeItems]);

  const removeItem = useCallback(async (itemId) => {
    changeItems(itemsRef.current.filter((item) => item.product._id !== itemId));
  }, [changeItems]);

  const updateQuantity = useCallback(async (itemId, quantity ) => {

    if (quantity < 1) {
      removeItem(itemId);
      return;
    }

    const nextItems = itemsRef.current.map((item) =>
      item.product._id === itemId ? { ...item, quantity } : item,
    );

    changeItems(nextItems);
  }, [changeItems, removeItem]);

  const clearCart = useCallback(() => changeItems([]), [changeItems]);

  // Estables mientras viva el provider: es lo que permite que ProductCard no
  // se repinte al cambiar el carrito.
  const actions = useMemo(
    () => ({ addItem, updateQuantity, removeItem, clearCart }),
    [addItem, updateQuantity, removeItem, clearCart],
  );

  const value = useMemo(
    () => ({
      items,
      count,
      total,
      loading,
      error,
      ...actions,
    }),
    [items, count, total, loading, error, actions],
  );

  return (
    <CartActionsContext.Provider value={actions}>
      <CartContext.Provider value={value}>{children}</CartContext.Provider>
    </CartActionsContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context)
    throw new Error("useCart debe ser usado dentro de CartProvider");
  return context;
}

/**
 * Para componentes que solo disparan acciones y no leen el carrito.
 * No se suscribe al contenido, así que no se repinta cuando este cambia.
 */
export function useCartActions() {
  const context = useContext(CartActionsContext);
  if (!context)
    throw new Error("useCartActions debe ser usado dentro de CartProvider");
  return context;
}
