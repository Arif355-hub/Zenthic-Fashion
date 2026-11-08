const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    price: {
      type: Number,
      required: true,
      min: 0.01,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number.",
      },
    },

    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        name: {
          type: String,
          required: true,
          trim: true,
        },

        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
          validate: {
            validator: Number.isInteger,
            message: "Review rating must be a whole number.",
          },
        },

        comment: {
          type: String,
          required: true,
          trim: true,
          maxlength: 1000,
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    numReviews: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Review count must be a whole number.",
      },
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Product listing indexes
productSchema.index({
  isActive: 1,
  createdAt: -1,
});

productSchema.index({
  category: 1,
  isActive: 1,
});

module.exports = mongoose.model("Product", productSchema);