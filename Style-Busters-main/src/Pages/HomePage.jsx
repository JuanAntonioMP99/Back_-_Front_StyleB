import { useEffect, useState } from "react";
import BannerCarousel from "../Components/BannerCarousel";
import List from "../Components/List/List";
import ErrorMessage from "../Components/Common/ErrorMessage/ErrorMessage";
import Loading from "../Components/Common/Loading/Loading";
import homeImages from "../Data/homeImages.json";
import { getAllProducts } from "../Services/productService";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null); 

  useEffect(() => {
    let cancelled = false; 
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllProducts();
        if (cancelled) return true;
        // GET /products devuelve un array; /search devuelve { products, pagination }.
        const list = Array.isArray(data) ? data : data?.products ?? [];
        setProducts(list);
        setPagination(Array.isArray(data) ? null : data?.pagination ?? null);

        
      } catch (error) {
        if(!cancelled)setError(error.kind || "UNKNOWN"); 
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProducts();
    return () => {
      cancelled = true; 
    }
  }, []);

  return (
    <div>
      <BannerCarousel banners={homeImages} />
      {loading && (
        <Loading>Cargando productos...</Loading>
      )}
      { !loading && error && error === "NETWORK" && (
        <ErrorMessage>No pudimos conectar. Revisa tu conexión a internet</ErrorMessage>
      )} 
      { !loading && error && error === "SERVER_ERROR" && (
        <ErrorMessage>Algo salió mal, intente más tarde</ErrorMessage>
      )} 
      { !loading && error && error !== "NETWORK" && error !== "SERVER_ERROR" && (
        <ErrorMessage>Ocurrió un error inesperado</ErrorMessage>
      )} 
      { !loading && !error && products.length === 0 && (
        <ErrorMessage>No hay productos en el catalogo</ErrorMessage>
      )} 
      { !loading && !error && products.length > 0 && (
        <List
          title="Productos recomendados"
          products={products}
          layout="grid"
        />
      )} 
    </div>
  );
}



