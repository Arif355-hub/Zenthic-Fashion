
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API_URL from "../services/api";
import { useCart } from "../context/CartContext";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch(
          `${API_URL}/products?page=1&sortBy=createdAt&order=desc`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error("Products load nahi ho sake.");
        }

        setProducts(
          Array.isArray(data.products)
            ? data.products.slice(0, 4)
            : []
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          setProducts([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchFeaturedProducts();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="home">

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-tag">
            PREMIUM DTF PRINTING SERVICES
          </span>

          <h1>
            Bring Your Designs
            <br />
            To <span>Life</span>
          </h1>

          <p>
            Premium quality DTF printing for custom
            T-shirts, clothing brands and businesses.
            Make your creativity stand out with
            Zenthic Fashion.
          </p>

          <div className="hero-buttons">
            <button onClick={() => navigate("/products")}>
              Explore Products
            </button>

            <button
              className="outline-btn"
              onClick={() => navigate("/contact")}
            >
              Get Custom Quote
            </button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="home-featured">
        <div className="featured-heading">
          <span>OUR COLLECTION</span>
          <h2>Featured Products</h2>
          <p>
            Discover our latest DTF printed products.
          </p>
        </div>

        {loading ? (
          <p className="featured-message">
            Loading Products...
          </p>
        ) : products.length === 0 ? (
          <p className="featured-message">
            Products will be available soon.
          </p>
        ) : (
          <div className="featured-grid">
            {products.map((product) => (
              <div className="featured-card" key={product._id}>

                <Link
                  to={`/products/${product._id}`}
                  className="featured-image"
                >
                  {typeof product.image === "string" &&
                  product.image.trim() ? (
                    <img
                      src={product.image}
                      alt={product.name || "DTF Product"}
                    />
                  ) : (
                    <span>DTF PRODUCT</span>
                  )}
                </Link>

                <div className="featured-info">
                  <span className="featured-category">
                    {product.category || "Fashion"}
                  </span>

                  <h3>{product.name || "Unnamed Product"}</h3>

                  <h4>
                    ₹
                    {Number.isFinite(Number(product.price))
                      ? Number(product.price).toFixed(2)
                      : "0.00"}
                  </h4>

                  <button
                    onClick={() => addToCart(product)}
                    disabled={
                      !Number.isInteger(product.stock) ||
                      product.stock <= 0
                    }
                  >
                    {!Number.isInteger(product.stock) ||
                    product.stock <= 0
                      ? "Out of Stock"
                      : "Add to Cart"}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

        <button
          className="featured-view-all"
          onClick={() => navigate("/products")}
        >
          View All Products
        </button>
      </section>

      {/* Features Section */}
      <section className="home-features">
        <div className="section-heading">
          <span>WHY CHOOSE US</span>
          <h2>Quality That Makes You Stand Out</h2>
          <p>
            We bring creativity, quality and style
            together in every print.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">✦</div>
            <h3>Premium Quality</h3>
            <p>
              High-quality printing with vibrant
              colours and beautiful details.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">✧</div>
            <h3>Custom Designs</h3>
            <p>
              Turn your creative ideas into
              unique custom printed clothing.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">♛</div>
            <h3>Made With Care</h3>
            <p>
              Every order receives attention
              to detail and quality.
            </p>
          </div>
        </div>
      </section>

      {/* Collection Section */}
      <section className="home-collection">
        <div className="collection-content">
          <span>EXPLORE OUR COLLECTION</span>
          <h2>Wear Your Creativity.</h2>
          <p>
            Discover stylish products and
            bring your personal style to life
            with Zenthic Fashion.
          </p>

          <button onClick={() => navigate("/products")}>
            Shop Now
          </button>
        </div>
      </section>

      {/* Custom Printing Section */}
      <section className="home-custom">
        <div>
          <span>YOUR IDEA, OUR PRINT</span>
          <h2>Have a Custom Design in Mind?</h2>
          <p>
            Let's create something unique.
            Contact us for your custom DTF
            printing requirements.
          </p>
        </div>

        <button onClick={() => navigate("/contact")}>
          Contact Us
        </button>
      </section>

    </div>
  );
}

export default Home;
