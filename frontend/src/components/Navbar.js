import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/authService";
import "./Navbar.css";
import { useCart } from "../context/CartContext";

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        logoutUser();
      }
    }
  }, []);

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    navigate("/", { replace: true });
  };

  const { totalItems } = useCart();

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        ZENTHIC FASHION
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/services">Services</Link>
        <Link to="/products">Products</Link>
        <Link to="/contact">Contact</Link>
        {user && (
          <Link to="/my-orders">My Orders</Link>
        )}

        {user && user.role === "admin" && (
          <Link to="/admin/orders">Manage Orders</Link>
        )}

        {user ? (
          <>
            <span>Hi, {user.name}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}

        <Link to="/cart">Cart ({totalItems})</Link>
        <Link to="/wishlist">Wishlist</Link>
      </div>
    </nav>
  );
}

export default Navbar;