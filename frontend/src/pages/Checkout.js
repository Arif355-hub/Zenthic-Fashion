import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import API_URL from "../services/api";
import "./Checkout.css";

function Checkout() {
  const { cart, totalAmount, clearCart } = useCart();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    paymentMethod: "COD",
  });

  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (loading) {
    return;
  }

  setMessage("");

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please login before placing your order.");
      return;
    }

    if (cart.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    if (formData.paymentMethod !== "COD") {
      setMessage("Please select a valid payment method.");
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.city.trim() || !formData.pincode.trim()) {
  setMessage("Please fill in all shipping details.");
  return;
}

if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
  setMessage("Please enter a valid 10-digit phone number.");
  return;
}

if (!/^[0-9]{6}$/.test(formData.pincode.trim())) {
  setMessage("Please enter a valid 6-digit pincode.");
  return;
}
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          products: cart.map((item) => ({
            productId: item._id,
            quantity: item.quantity,
          })),
          shippingAddress: {
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
            city: formData.city.trim(),
            pincode: formData.pincode.trim(),
          },
          paymentMethod: formData.paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Order failed.");
      }

      if (!data.order || !data.order._id) {
        throw new Error("Invalid order response from server.");
      }

      setOrderId(data.order._id);
      clearCart();
      setMessage("Your order has been placed successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
  return (
    <div className="checkout-container">
      {message ? (
        <>
          <h2>{message}</h2>

          {orderId && (
            <p>Your Order ID: {orderId}</p>
          )}
        </>
      ) : (
        <h2>Your cart is empty.</h2>
      )}
    </div>
  );
}

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <h2>Order Total: ₹{Number(totalAmount).toFixed(2)}</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
        />

        <textarea
          name="address"
          placeholder="Full Delivery Address"
          value={formData.address}
          onChange={handleChange}
          required
        />

        <input
          name="city"
          placeholder="City"
          value={formData.city}
          onChange={handleChange}
          required
        />

        <input
          name="pincode"
          placeholder="PIN Code"
          value={formData.pincode}
          onChange={handleChange}
          required
        />

        <select
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleChange}
        >
          <option value="COD">Cash on Delivery</option>
          <option value="Online" disabled>
            Online Payment (Coming Soon)
          </option>
        </select>

        <p className="payment-note">
            Online payment is not available yet. Please select Cash on Delivery.
        </p>

        <button type="submit" disabled={loading}>
          {loading ? "Placing Order..." : "Place Order"}
        </button>
      </form>

      {message && (
        <div className="checkout-message">
          <p>{message}</p>
          {message.includes("successfully") && orderId && (
            <p>Your Order ID: {orderId}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Checkout;