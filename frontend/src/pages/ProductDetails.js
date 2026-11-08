
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API_URL from "../services/api";
import { useCart } from "../context/CartContext";
import "./ProductDetails.css";

function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
  const controller = new AbortController();

  const fetchProduct = async () => {
    setLoading(true);
    setError("");
    setProduct(null);

    try {
      const response = await fetch(
        `${API_URL}/products/${id}`,
        { signal: controller.signal }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Product nahi mila.");
      }

      const fetchedProduct = data.product || data;

    if (!fetchedProduct || !fetchedProduct._id) {
      throw new Error("Invalid product response from server.");
    }

    setProduct(fetchedProduct);
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

  fetchProduct();

  return () => {
    controller.abort();
  };
}, [id]);

  const handleReviewSubmit = async (e) => {
  e.preventDefault();

  if (submitting) {
    return;
  }

  setReviewMessage("");
  setReviewError("");

  if (!comment.trim()) {
    setReviewError("Please write a review.");
    return;
  }

  if (![1, 2, 3, 4, 5].includes(Number(rating))) {
  setReviewError("Please select a valid rating.");
  return;
}

    setReviewError("");

    const token = localStorage.getItem("token");

    if (!token) {
      setReviewError("Review dene ke liye pehle login karo.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/products/${id}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: Number(rating),
            comment: comment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Review submit nahi hua.");
      }

      const updatedProduct = data.product || data;

      if (!updatedProduct || !updatedProduct._id) {
        throw new Error("Invalid product response from server.");
      }

      setProduct(updatedProduct);
      setComment("");
      setRating(5);
      setReviewMessage("Your review submitted successfully!");
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <h2>Loading product...</h2>;
  if (error) return <p>{error}</p>;
  if (!product) return <p>Product not found.</p>;

  return (
    <div className="product-details">
      <img
        src={
          typeof product.image === "string" && product.image.trim()
            ? product.image
            : "https://placehold.co/500x400?text=Product"
        }
        alt={product.name || "DTF Product"}
      />

      <div>
        <h1>{product.name || "Unnamed Product"}</h1>
        <p>{product.description || "No description available."}</p>
        <h2>
          ₹{Number.isFinite(Number(product.price))
            ? Number(product.price).toFixed(2)
            : "0.00"}
        </h2>
        <p>Category: {product.category || "Uncategorized"}</p>
        <p>Stock: {product.stock}</p>

        <button
          disabled={!Number.isInteger(product.stock) || product.stock <= 0}
          onClick={() => addToCart(product)}
        >
          {!Number.isInteger(product.stock) || product.stock <= 0
            ? "Out of Stock"
            : "Add to Cart"}
        </button>
      </div>

      <div className="product-reviews">
        <h2>Customer Reviews</h2>

        <p>
          Average Rating: {
            Number.isFinite(Number(product.rating))
              ? Number(product.rating).toFixed(1)
              : "0.0"
          } / 5
        </p>

        <p>
          Total Reviews: {
            Number.isInteger(product.numReviews) && product.numReviews >= 0
              ? product.numReviews
              : 0
          }
        </p>

        {Array.isArray(product.reviews) && product.reviews.length > 0 ? (
          product.reviews
          .filter((review) => review && typeof review === "object")
          .map((review, index) => (
            <div key={review._id || index} className="review-card">
              <h3>{review.name || "Anonymous Customer"}</h3>
              <p>
                Rating: {"⭐".repeat(
                  Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5
                    ? review.rating
                    : 0
                )}
              </p>
              <p>{review.comment || "No review comment provided."}</p>
            </div>
          ))
        ) : (
          <p>No reviews yet. Be the first to review!</p>
        )}

        <h2>Write a Review</h2>

        <form onSubmit={handleReviewSubmit}>
          <label>Rating:</label>

          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          >
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Very Good</option>
            <option value="3">3 - Good</option>
            <option value="2">2 - Fair</option>
            <option value="1">1 - Poor</option>
          </select>

          <label>Your Review:</label>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your product review..."
            required
          />

          <button
            type="submit"
            disabled={submitting || !comment.trim()}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>

        {reviewMessage && <p>{reviewMessage}</p>}
        {reviewError && <p>{reviewError}</p>}
      </div>
    </div>
  );
}

export default ProductDetails;