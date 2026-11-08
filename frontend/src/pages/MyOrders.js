import React, { useEffect, useState } from "react";
import API_URL from "../services/api";
import { Link } from "react-router-dom";
import "./MyOrders.css";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const handleCancelOrder = async (orderId) => {
  const confirmed = window.confirm(
    "Are you sure you want to cancel this order?"
  );

  if (!confirmed) return;

  if (!orderId) {
    alert("Invalid order ID.");
    return;
  }

  if (cancellingOrderId) return;

  setCancellingOrderId(orderId);

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Order cancel karne ke liye pehle login karo.");
    }

    const response = await fetch(
      `${API_URL}/orders/${encodeURIComponent(orderId)}/cancel`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to cancel order.");
    }

    await fetchOrders();
      alert("Order cancelled successfully!");

   } catch (error) {
    alert(error.message);
  } finally {
    setCancellingOrderId(null);
  }
};

  const fetchOrders = async () => {
  try {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Orders dekhne ke liye pehle login karo.");
    }

    const response = await fetch(
      `${API_URL}/orders/my-orders`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Orders load nahi hue.");
    }

    if (!Array.isArray(data.orders)) {
      throw new Error("Invalid orders response from server.");
    }

    setOrders(data.orders);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchOrders();
}, []);

  if (loading) return <h2>Loading orders...</h2>;

  if (error) return <p>{error}</p>;

  return (
    <div className="my-orders">
      <h1>My Orders</h1>

      {orders.filter(
        (order) => order && typeof order === "object" && order._id
      ).length === 0 ? (
        <p>Abhi tak aapne koi order nahi kiya hai.</p>
      ) : (
        orders
        .filter((order) => order && typeof order === "object" && order._id)
        .map((order) => (
          <div key={order._id} className="order-card">
            <h3>Order ID: {order._id}</h3>

            <p>
              Status: {order.orderStatus || "Status unavailable"}
            </p>

           {order.orderStatus === "Processing" && (
              <button
                className="cancel-order-btn"
                onClick={() => handleCancelOrder(order._id)}
                disabled={Boolean(cancellingOrderId)}
              >
                {cancellingOrderId === order._id
                  ? "Cancelling..."
                  : "Cancel Order"}
              </button>
            )}

            <p>
              Payment: {order.paymentStatus || "Payment status unavailable"}
            </p>

            <p>
              Total: ₹{
                Number.isFinite(Number(order.totalAmount))
                  ? Number(order.totalAmount).toFixed(2)
                  : "0.00"
              }
            </p>

            <p>
              Date: {
                order.createdAt && !Number.isNaN(Date.parse(order.createdAt))
                  ? new Date(order.createdAt).toLocaleDateString("en-IN")
                  : "Date unavailable"
              }
            </p>

            <h4>Products:</h4>

            {Array.isArray(order.products) ? (
              order.products
                .filter((product) => product && typeof product === "object")
                .map((product, index) => (
                  <p key={index}>
                    {product.name || "Unnamed Product"} × {product.quantity || 0}
                  </p>
                ))
            ) : (
              <p>No product details available.</p>
            )}

            <Link to={`/orders/${order._id}`}>
                  View Order Details
            </Link>
          </div>
        ))
      )}
    </div>
  );
}

export default MyOrders;