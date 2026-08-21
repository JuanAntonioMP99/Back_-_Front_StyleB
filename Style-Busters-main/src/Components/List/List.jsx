import ProductCard from "../ProductCard/ProductCard";
import './List.css';

export default function List ({products = [], layout = "grid"}) {
    return (
        <div className="list-container">
            {layout === "grid" ? (
                <div className="list-grid">
                    {products.map((product) => (
                        <ProductCard
                        key={product._id ?? product.id}
                        product={product}
                        orientation = "vertical"
                        />
                    ))}
                </div>
            ) : (
                <div className="list-vertical">
                    {products.map((product) => (
                        <ProductCard
                        key={product._id ?? product.id}
                        product={product}
                        orientation="horizontal"
                        />
                    ))}
                </div>
            )}
        </div>
    );
};