const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    products: {
      type: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
          },

          name: {
            type: String,
            required: true,
            trim: true,
          },

          quantity: {
            type: Number,
            required: true,
            min: 1,
            max: 100,
            validate: {
              validator: Number.isInteger,
              message: "Product quantity must be an integer.",
            },
          },

          price: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],
      required: true,
      validate: {
        validator: (products) =>
          products.length >= 1 && products.length <= 50,
        message: "Order must contain between 1 and 50 products.",
      },
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    shippingAddress: {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      address: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300,
      },

      city: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      pincode: {
        type: String,
        required: true,
        trim: true,
      },
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "Online"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "Processing",
        "Confirmed",
        "Printing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Processing",
    },
  },
  {
    timestamps: true,
  }
);

// Customer order history index
orderSchema.index({
  user: 1,
  createdAt: -1,
});

// Admin order listing index
orderSchema.index({
  createdAt: -1,
});

module.exports = mongoose.model("Order", orderSchema);