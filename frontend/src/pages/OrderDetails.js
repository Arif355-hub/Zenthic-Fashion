import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API_URL from "../services/api";
import "./OrderDetails.css";

function OrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setOrder(null);
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Order details dekhne ke liye pehle login karo.");
        }

        const response = await fetch(
          `${API_URL}/orders/${encodeURIComponent(id)}`,
          {
          headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Order nahi mila.");
        }

        if (!data.order || !data.order._id) {
          throw new Error("Invalid order response from server.");
        }

        setOrder(data.order);
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

    fetchOrder();
        return () => {
      controller.abort();
    };
  }, [id]);

  if (loading) return <h2>Loading order...</h2>;
  if (error) return <p>{error}</p>;
  if (!order) return <p>Order not found.</p>;

  return (
    <div className="order-details">
      <h1>Order Details</h1>

      <p><strong>Order ID:</strong> {order._id}</p>
      <p>
        <strong>Order Date:</strong> {
          order.createdAt && !Number.isNaN(Date.parse(order.createdAt))
            ? new Date(order.createdAt).toLocaleString("en-IN")
            : "Date unavailable"
        }
      </p>
      <p>
        <strong>Order Status:</strong> {order.orderStatus || "Status unavailable"}
      </p>
      <p>
        <strong>Payment Status:</strong> {order.paymentStatus || "Payment status unavailable"}
      </p>
      <p>
        <strong>Payment Method:</strong> {order.paymentMethod || "Payment method unavailable"}
      </p>
      <p>
        <strong>Total Amount:</strong> ₹{
          Number.isFinite(Number(order.totalAmount))
            ? Number(order.totalAmount).toFixed(2)
            : "0.00"
        }
      </p>

      <h3>Products</h3>

      {Array.isArray(order.products) ? (
        order.products
          .filter((product) => product && typeof product === "object")
          .map((product, index) => (
            <div key={index}>
              <p>{product.name || "Unnamed Product"} × {product.quantity || 0}</p>
              <p>
                Price: ₹{
                  Number.isFinite(Number(product.price))
                    ? Number(product.price).toFixed(2)
                    : "0.00"
                }
              </p>
            </div>
          ))
      ) : (
        <p>No product details available.</p>
      )}

      <h3>Shipping Address</h3>

      <p>
        {order.shippingAddress &&
        typeof order.shippingAddress === "object" &&
        !Array.isArray(order.shippingAddress) ? (
          [
            order.shippingAddress.name,
            order.shippingAddress.phone,
            order.shippingAddress.address,
            order.shippingAddress.city,
            order.shippingAddress.pincode,
          ]
            .filter(Boolean)
            .join(", ") || "Shipping address unavailable"
        ) : (
          order.shippingAddress || "Shipping address unavailable"
        )}
      </p>
    </div>
  );
}

export default OrderDetails;