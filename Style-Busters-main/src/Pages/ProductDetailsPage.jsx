import { useParams } from "react-router-dom";
import ProductDetails from "../Components/ProductDetails/ProductDetails";

export default function Product() {
  const { productId } = useParams();

  return <ProductDetails productId={productId} />;
}