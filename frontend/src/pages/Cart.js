import React from "react";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import "./Cart.css";

function Cart() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalAmount,
    totalItems,
  } = useCart();

  return (
    <div className="cart-container">
      <h1>My Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <h2>Your Cart is Empty!</h2>
          <p>You haven't added any products to your cart yet.</p>
          <Link to="/products">Continue Shopping</Link>
          </div>
      ) : (
        <>
          {cart
          .filter((item) => item && item._id)
          .map((item) => (
            <div className="cart-item" key={item._id}>
              <div>
                <h3>{item.name || "Unnamed Product"}</h3>
                <p>
                  Price: ₹{Number.isFinite(Number(item.price))
                    ? Number(item.price).toFixed(2)
                    : "0.00"}
                </p>
                <p>
                  Quantity:
                  <button
                    onClick={() =>
                      updateQuantity(item._id, item.quantity - 1)
                    }
                    disabled={!Number.isInteger(item.quantity) || item.quantity <= 1}
                  >
                    -
                  </button>

                  {Number(item.quantity) || 1}

                  <button
                    onClick={() =>
                      updateQuantity(item._id, item.quantity + 1)
                    }
                    disabled={
                      !Number.isInteger(item.quantity) ||
                      !Number.isInteger(item.stock) ||
                      item.quantity >= item.stock
                    }
                  >
                    +
                  </button>
                </p>
                <p>
                  Subtotal: ₹{(
                    (Number(item.price) || 0) *
                    (Number(item.quantity) || 0)
                  ).toFixed(2)}
                </p>
              </div>

              <button onClick={() => removeFromCart(item._id)}>
                Remove
              </button>
            </div>
          ))}

        <div className="cart-summary">
          <p>Total Items: {totalItems}</p>
          <h2>Total: ₹{Number(totalAmount).toFixed(2)}</h2>
        </div>

          <Link to="/checkout">
              <button>Proceed to Checkout</button>
          </Link>

          <button onClick={clearCart}>Clear Cart</button>
        </>
      )}
    </div>
  );
}

export default Cart;