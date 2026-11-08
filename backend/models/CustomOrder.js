
const mongoose = require("mongoose");

const customOrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    designFile: {
      type: String,
      default: "",
    },

    designPublicId: {
      type: String,
      default: "",
    },

    designResourceType: {
      type: String,
      default: "",
    },

    productType: {
      type: String,
      required: true,
      trim: true,
    },

    width: {
      type: Number,
      required: true,
      min: 1,
    },

    height: {
      type: Number,
      required: true,
      min: 1,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    quotedPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    quoteStatus: {
      type: String,
      enum: ["Pending", "Quoted", "Accepted", "Rejected"],
      default: "Pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "In Production",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
    },

    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "Pending",
            "Approved",
            "In Production",
            "Completed",
            "Cancelled",
          ],
          required: true,
        },

        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Customer order history index
customOrderSchema.index({
  user: 1,
  createdAt: -1,
});

// Admin order status index
customOrderSchema.index({
  orderStatus: 1,
  createdAt: -1,
});

// Admin quotation status index
customOrderSchema.index({
  quoteStatus: 1,
  createdAt: -1,
});

// Date-based search index
customOrderSchema.index({
  createdAt: -1,
});

module.exports = mongoose.model("CustomOrder", customOrderSchema);
