
import React, { useEffect, useState } from "react";
import API_URL from "../services/api";
import "./AdminOrders.css";

const orderStatusOptions = {
  Processing: ["Processing", "Confirmed", "Cancelled"],
  Confirmed: ["Confirmed", "Printing", "Cancelled"],
  Printing: ["Printing", "Shipped", "Cancelled"],
  Shipped: ["Shipped", "Delivered"],
  Delivered: ["Delivered"],
  Cancelled: ["Cancelled"],
};

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Fetch Orders
const fetchOrders = async () => {
  try {
    const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Orders manage karne ke liye pehle admin login karo.");
      }

      const response = await fetch(`${API_URL}/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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

  // Update Order Status
  const updateStatus = async (orderId, orderStatus) => {
    if (!orderId) {
        alert("Invalid order ID.");
        return;
      }

      const currentOrder = orders.find((order) => order._id === orderId);

      if (
        !currentOrder ||
        !orderStatusOptions[currentOrder.orderStatus]?.includes(orderStatus)
      ) {
        alert("Invalid order status transition.");
        return;
      }

      if (currentOrder.orderStatus === orderStatus) {
        return;
      }

      if (updatingOrderId) {
        return;
      }

      setUpdatingOrderId(orderId);

      try {
      const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Status update karne ke liye pehle admin login karo.");
        }

        const response = await fetch(
        `${API_URL}/orders/${encodeURIComponent(orderId)}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orderStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Status update nahi hua.");
      }

      await fetchOrders();
      alert("Order status updated successfully!");
        } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loading) return <h2>Loading orders...</h2>;
  if (error) return <p>{error}</p>;

  return (
    <div className="admin-orders">
      <h1>Manage Orders</h1>

      {orders.length === 0 ? (
        <p>Abhi koi order nahi hai.</p>
      ) : (
        orders
        .filter((order) => order && typeof order === "object" && order._id)
        .map((order) => (
          <div className="admin-order-card" key={order._id}>
            <h3>Order ID: {order._id}</h3>

            <p>
              Customer: {
                order.user && typeof order.user === "object"
                  ? order.user.name || "Unknown"
                  : "Unknown"
              }
            </p>
            <p>
              Email: {
                order.user && typeof order.user === "object"
                  ? order.user.email || "N/A"
                  : "N/A"
              }
            </p>
            <p>
              Total: ₹{
                Number.isFinite(Number(order.totalAmount))
                  ? Number(order.totalAmount).toFixed(2)
                  : "0.00"
              }
            </p>

            <p>
              <strong>Status:</strong>
              <select
                disabled={Boolean(updatingOrderId)}
                value={order.orderStatus || "Processing"}
                onChange={(e) =>
                  updateStatus(order._id, e.target.value)
                }
              >
                {(orderStatusOptions[order.orderStatus] || [order.orderStatus || "Processing"]).map(
                  (status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  )
                )}
              </select>
              {updatingOrderId === order._id && (
                <span> Updating...</span>
              )}
            </p>

            <p>
              Payment: {order.paymentStatus || "Payment status unavailable"}
            </p>

            <h4>Products</h4>

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
          </div>
        ))
      )}
    </div>
  );
}

export default AdminOrders;
