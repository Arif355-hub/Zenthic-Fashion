import React from "react";
import "./Contact.css";

function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Thank you! Your enquiry has been submitted.");
  };

  return (
    <section className="contact-section">

      <div className="contact-heading">
        <span>GET IN TOUCH</span>
        <h1>Contact Zenthic Fashion</h1>
        <p>
          Have a DTF printing project? Let's discuss
          your requirements.
        </p>
      </div>

      <div className="contact-container">

        <div className="contact-info">
          <h2>Let's Talk</h2>

          <p>Have questions about our printing services?</p>

          <div className="contact-detail">
            <h3>Email</h3>
            <p>info@zenthicfashion.com</p>
          </div>

          <div className="contact-detail">
            <h3>Phone</h3>
            <p>+91 XXXXX XXXXX</p>
          </div>

          <div className="contact-detail">
            <h3>Business</h3>
            <p>DTF Printing & Custom Apparel</p>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Your Name"
            required
          />

          <input
            type="email"
            placeholder="Your Email"
            required
          />

          <input
            type="tel"
            placeholder="Your Phone Number"
          />

          <select required defaultValue="">
            <option value="" disabled>
              Select Service
            </option>
            <option>DTF Gang Sheets</option>
            <option>Custom DTF Transfers</option>
            <option>T-Shirt Printing</option>
            <option>Bulk Orders</option>
          </select>

          <textarea
            placeholder="Tell us about your requirements..."
            rows="5"
            required
          ></textarea>

          <button type="submit">
            Send Enquiry
          </button>

        </form>

      </div>

    </section>
  );
}

export default Contact;