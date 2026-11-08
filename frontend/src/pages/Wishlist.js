
import React from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import "./Wishlist.css";

function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const [message, setMessage] = React.useState("");
  const { cart, addToCart } = useCart();

  return (
    <div className="wishlist-page">
      <h1>My Wishlist</h1>

      {message && <p className="wishlist-message">{message}</p>}

      {wishlist.length === 0 ? (
        <p>Your wishlist is empty.</p>
      ) : (
        <div className="wishlist-list">
          {wishlist
          .filter((product) => product && product._id)
          .map((product) => (
            <div className="wishlist-card" key={product._id}>
              <img
                src={
                  typeof product.image === "string" && product.image.trim()
                    ? product.image
                    : "https://placehold.co/300x250?text=Product"
                }
                alt={product.name || "Product"}
              />

              <h3>{product.name || "Unnamed Product"}</h3>
              <p>
                ₹{Number.isFinite(Number(product.price))
                  ? Number(product.price).toFixed(2)
                  : "0.00"}
              </p>

              <Link to={`/products/${product._id}`}>
                View Product
              </Link>

              <button
                disabled={!Number.isInteger(product.stock) || product.stock <= 0}
                  onClick={() => {
                    const cartItem = cart.find(
                      (item) => item._id === product._id
                    );

                    if (cartItem && cartItem.quantity >= product.stock) {
                      setMessage("Maximum available stock reached.");
                      return;
                    }

                    addToCart(product);
                    setMessage("Product added to cart.");
                  }}
              >
                Add to Cart
              </button>

              <button
                onClick={() => {
                  removeFromWishlist(product._id);
                  setMessage("Product removed from wishlist.");
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
