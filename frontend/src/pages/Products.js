import React, { useEffect, useState } from "react";
import API_URL from "../services/api";
import "./Products.css";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
  const controller = new AbortController();

  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&page=${page}&sortBy=${sortBy}&order=${sortOrder}`,
        { signal: controller.signal }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Products load nahi ho sake");
      }

      setProducts(
        Array.isArray(data.products) ? data.products : []
      );

      setTotalPages(
        Number.isInteger(data.totalPages) && data.totalPages > 0
          ? data.totalPages
          : 1
      );
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  fetchProducts();

  return () => {
    controller.abort();
  };
}, [search, category, page, sortBy, sortOrder]);

  if (loading) {
    return <h2>Loading Products...</h2>;
  }

  if (error) {
    return <h2>{error}</h2>;
  }

  return (
    <div className="products-page">
      <h1>Our Products</h1>
      <p>Explore premium DTF printing products.</p>

      <input
        className="products-search"
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      <input
        className="products-search"
        type="text"
        placeholder="Filter by category..."
        value={category}
        onChange={(e) => {
          setCategory(e.target.value);
          setPage(1);
        }}
      />

      <select
        value={`${sortBy}-${sortOrder}`}
        onChange={(e) => {
          const [field, direction] = e.target.value.split("-");
          setSortBy(field);
          setSortOrder(direction);
          setPage(1);
        }}
      >
        <option value="createdAt-desc">Newest First</option>
        <option value="createdAt-asc">Oldest First</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="name-asc">Name: A to Z</option>
        <option value="name-desc">Name: Z to A</option>
      </select>

      <button
        type="button"
        onClick={() => {
          setSearch("");
          setCategory("");
          setPage(1);
        }}
      >
        Clear Filters
      </button>

      <div className="products-grid">
        {products.length === 0 ? (
          <p>Abhi koi product available nahi hai.</p>
        ) : (
          products.map((product) => (
            <div className="product-card" key={product._id}>
              <div className="product-image">
                {typeof product.image === "string" && product.image.trim() ? (
                  <img
                    src={product.image}
                    alt={product.name || "DTF Product"}
                  />
                ) : (
                  <span>DTF PRODUCT</span>
                )}
              </div>

              <h3>{product.name || "Unnamed Product"}</h3>
              <p>{product.description || "No description available."}</p>
              <p>Category: {product.category || "Uncategorized"}</p>
              <h4>
                ₹{Number.isFinite(Number(product.price))
                  ? Number(product.price).toFixed(2)
                  : "0.00"}
              </h4>
              <p>Stock: {product.stock}</p>

              <button
                onClick={() => addToCart(product)}
                disabled={!Number.isInteger(product.stock) || product.stock <= 0}
              >
                {!Number.isInteger(product.stock) || product.stock <= 0
                  ? "Out of Stock"
                  : "Add to Cart"}
              </button>

              <button
                onClick={() => addToWishlist(product)}
                disabled={isInWishlist(product._id)}
              >
                {isInWishlist(product._id)
                  ? "Added to Wishlist"
                  : "Add to Wishlist"}
              </button>

              <Link to={`/products/${product._id}`}>
                  View Details
              </Link>
            </div>
          ))
        )}
      </div>

      <div className="pagination">
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>

        <span>
          Page {Math.min(page, totalPages)} of {totalPages}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Products;