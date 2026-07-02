import ProductCard from '../Components/ProductCard/ProductCard';
import './HomePage.css';
import BannerCarousel from '../Components/BannerCarousel/BannerCarousel';
import homeImages from '../Data/homeImages.json';
import products from '../Data/products';

const HomePage = () => {
    
  

  return (
        
        <div>
          <BannerCarousel banners={homeImages}></BannerCarousel>
            <div className="home-header">
                <h1 className="home-title">
                    Lo mejor de la cultura anime y rock. 
                </h1>
                <p className="home-subtitle">
                    Descubre nuestra colección exclusiva de playeras con diseños unicos.
                </p>
            </div>

            <div className="products-grid">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
};

export default HomePage;



