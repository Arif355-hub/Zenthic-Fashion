
import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-about">
          <h2>ZENTHIC FASHION</h2>
          <p>
            Premium quality DTF printing and custom fashion
            products made to express your unique style.
          </p>
        </div>

        <div className="footer-links">
          <h3>Quick Links</h3>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/services">Services</Link>
          <Link to="/products">Products</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div className="footer-links">
          <h3>Customer</h3>
          <Link to="/my-orders">My Orders</Link>
          <Link to="/cart">Shopping Cart</Link>
          <Link to="/wishlist">Wishlist</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} Zenthic Fashion.
          All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;