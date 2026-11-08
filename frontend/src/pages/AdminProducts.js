import React, { useEffect, useState } from "react";
import API_URL from "../services/api";
import "./AdminProducts.css";

function AdminProducts() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    image: "",
    stock: "",
  });

  const [message, setMessage] = useState("");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);

        try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Products load nahi hue");
        }

        if (!Array.isArray(data.products)) {
          throw new Error("Invalid products response from server.");
        }

        setProducts(data.products);
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    };

const handleDelete = async (productId) => {
  if (!productId) {
    setMessage("Invalid product ID.");
    return;
  }

  const confirmDelete = window.confirm(
    "Kya aap sach mein ye product delete karna chahte hain?"
  );

  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Product delete karne ke liye pehle admin login karo.");
      }

      const response = await fetch(
      `${API_URL}/products/${encodeURIComponent(productId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Product delete nahi hua.");
    }

    setMessage("Product successfully deleted!");
    await fetchProducts();
  } catch (error) {
    setMessage(error.message);
  }
};


const handleEdit = async (product) => {
    if (!product || !product._id) {
    setMessage("Invalid product details.");
    return;
  }
  const name = window.prompt("Product Name:", product.name);
  if (name === null) return;

  const description = window.prompt(
    "Product Description:",
    product.description
  );
  if (description === null) return;

  const category = window.prompt("Category:", product.category);
  if (category === null) return;

  const price = window.prompt("Price:", product.price);
  if (price === null) return;

  const image = window.prompt("Image URL:", product.image || "");
  if (image === null) return;

  const stock = window.prompt("Stock:", product.stock);
  if (stock === null) return;

  if (
      !name.trim() ||
      !description.trim() ||
      !category.trim() ||
      price.trim() === "" ||
      stock.trim() === "" ||
      Number(price) <= 0 ||
      Number(price) > 10000000 ||
      Number(stock) < 0 ||
      Number(stock) > 1000000 ||
      !Number.isFinite(Number(price)) ||
      !Number.isInteger(Number(stock)) ||
      (image.trim() !== "" && !/^https?:\/\/\S+$/i.test(image.trim()))
    ) {
      setMessage("Please enter valid product details.");
      return;
    }

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Product edit karne ke liye pehle admin login karo.");
    }

    const response = await fetch(
  `${API_URL}/products/${encodeURIComponent(product._id)}`,
  {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      price: Number(price),
      image: image.trim(),
      stock: Number(stock),
    }),
  }
);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Product update nahi hua.");
    }

    setMessage("Product successfully updated!");
    await fetchProducts();
      } catch (error) {
        setMessage(error.message);
      }
    };

    useEffect(() => {
      fetchProducts();
    }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Product add karne ke liye pehle admin login karo.");
      }

      if (
        (formData.image.trim() !== "" && !/^https?:\/\/\S+$/i.test(formData.image.trim())) ||
        !formData.name.trim() ||
        !formData.description.trim() ||
        !formData.category.trim() ||
        !Number.isFinite(Number(formData.price)) ||
        Number(formData.price) <= 0 ||
        Number(formData.price) > 10000000 ||
        !Number.isInteger(Number(formData.stock)) ||
        Number(formData.stock) < 0 ||
        Number(formData.stock) > 1000000
      ) {
        throw new Error("Please enter valid product details.");
      }

      const response = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Product add nahi hua");
      }

      setMessage("Product successfully added!");
      await fetchProducts();

      setFormData({
        name: "",
        description: "",
        category: "",
        price: "",
        image: "",
        stock: "",
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
    };

  return (
    <div className="admin-products">
      <h1>Add New Product</h1>

      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Product Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Product Description"
          value={formData.description}
          onChange={handleChange}
          required
        />

        <input
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
          required
        />

        <input
          name="price"
          type="number"
          placeholder="Price"
          min="0.01"
          max="10000000"
          step="0.01"
          value={formData.price}
          onChange={handleChange}
          required
        />

        <input
          name="image"
          placeholder="Image URL (optional)"
          value={formData.image}
          onChange={handleChange}
        />

        <input
          name="stock"
          type="number"
          placeholder="Stock Quantity"
          min="0"
          max="1000000"
          step="1"
          value={formData.stock}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Adding Product..." : "Add Product"}
        </button>
      </form>

      <h2>All Products</h2>

        {loading ? (
          <p>Loading products...</p>
        ) : (
          <div className="admin-product-list">
            {products.length === 0 ? (
              <p>Abhi koi product available nahi hai.</p>
            ) : (
              products.map((product) => (
                <div className="admin-product-card" key={product._id}>
                  <h3>{product.name}</h3>
                  <p>Price: ₹{product.price}</p>
                  <p>Category: {product.category}</p>
                  <p>Stock: {product.stock}</p>

                  <button
                    type="button"
                    onClick={() => handleEdit(product)}
                  >
                    Edit Product
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(product._id)}
                  >
                    Delete Product
                  </button>
                </div>
              ))
            )}
          </div>
        )}
    </div>
  );
}

export default AdminProducts;