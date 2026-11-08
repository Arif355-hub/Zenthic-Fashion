import React from "react";
import "./Services.css";

const services = [
  {
    title: "DTF Gang Sheets",
    description: "High-quality custom DTF gang sheets for bulk printing."
  },
  {
    title: "Custom DTF Transfers",
    description: "Get your own artwork printed with premium quality."
  },
  {
    title: "Custom T-Shirt Printing",
    description: "Create personalized printed T-shirts for your brand."
  },
];

function Services() {
  return (
    <section className="services-section">
      <div className="section-heading">
        <span>WHAT WE OFFER</span>
        <h2>Our Printing Services</h2>
        <p>Professional DTF printing solutions for every creative idea.</p>
      </div>

      <div className="services-grid">
        {services.map((service, index) => (
          <div className="service-card" key={index}>
            <div className="service-number">
              0{index + 1}
            </div>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <button>Learn More →</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Services;