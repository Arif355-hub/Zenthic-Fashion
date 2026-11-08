import React from "react";
import "./About.css";

function About() {
  return (
    <section className="about-section">

      <div className="about-content">
        <span>ABOUT ZENTHIC FASHION</span>

        <h1>
          Creativity Meets
          <br />
          <strong>Premium Printing</strong>
        </h1>

        <p>
          Welcome to Zenthic Fashion! We specialize in
          premium DTF printing solutions for clothing
          brands, businesses and creative individuals.
        </p>

        <p>
          Our mission is to turn your creative ideas
          into high-quality printed designs with
          excellent attention to detail.
        </p>

        <button>Explore Our Services</button>
      </div>

      <div className="about-features">
        <div>
          <h2>01</h2>
          <h3>Premium Quality</h3>
          <p>Quality-focused printing solutions.</p>
        </div>

        <div>
          <h2>02</h2>
          <h3>Custom Designs</h3>
          <p>Printing that brings your ideas to life.</p>
        </div>

        <div>
          <h2>03</h2>
          <h3>Bulk Orders</h3>
          <p>Solutions for brands and businesses.</p>
        </div>
      </div>

    </section>
  );
}

export default About;