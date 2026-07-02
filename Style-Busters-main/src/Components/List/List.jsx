import ProductCard from "../ProductCard/ProductCard";
import './List.css';

export default function List ({products = [], titile = "Nuestros productos", layout = "grid"}) {
    return (
        <div className="list-container">
            {layout === "grid" ? (
                <div className="list-grid">
                    {products.map((product) => (
                        <ProductCard
                        key={product.id}
                        product={product}
                        orientation = "vertical"
                        className="list-item"
                        />
                    ))}
                </div>
            ) : (
                <div className="list-vertical">
                    {products.map((product) => (
                        <ProductCard
                        key={product.id}
                        product={product}
                        orientation="horizontal"
                        className="list-item"
                        />
                    ))}
                </div>
            )}
        </div>
    );
};