const Order = require("../models/Order");
const Product = require("../models/Product");

// Create new order
const createOrder = async (req, res) => {
  let session;

  try {
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order data.",
      });
    }

    const { products, shippingAddress, paymentMethod } = req.body;

    // Shipping address object validation
    if (
      !shippingAddress ||
      typeof shippingAddress !== "object" ||
      Array.isArray(shippingAddress)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid shipping address.",
      });
    }

    const requiredAddressFields = [
      "name",
      "phone",
      "address",
      "city",
      "pincode",
    ];

    for (const field of requiredAddressFields) {
      if (
        typeof shippingAddress[field] !== "string" ||
        !shippingAddress[field].trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide complete shipping address details.",
        });
      }
    }

    const cleanAddress = {
      name: shippingAddress.name.trim(),
      phone: shippingAddress.phone.trim(),
      address: shippingAddress.address.trim(),
      city: shippingAddress.city.trim(),
      pincode: shippingAddress.pincode.trim(),
    };

    if (
      cleanAddress.name.length < 2 ||
      cleanAddress.name.length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Shipping name must be between 2 and 50 characters.",
      });
    }

    if (
      cleanAddress.address.length > 300 ||
      cleanAddress.city.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Shipping address or city is too long.",
      });
    }

    if (!/^[0-9]{10}$/.test(cleanAddress.phone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number.",
      });
    }

    if (!/^[0-9]{6}$/.test(cleanAddress.pincode)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit pincode.",
      });
    }

    // Product array validation
    if (
      !Array.isArray(products) ||
      products.length === 0 ||
      products.length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Order must contain between 1 and 50 products.",
      });
    }

    for (const item of products) {
      if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product item in order.",
        });
      }

      if (
        typeof item.productId !== "string" ||
        !/^[0-9a-fA-F]{24}$/.test(item.productId)
      ) {
        return res.status(400).json({
          success: false,
          message: "One or more product IDs are invalid.",
        });
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid product quantity.",
        });
      }
    }

    const productIds = products.map((item) => item.productId);

    if (new Set(productIds).size !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate products are not allowed in an order.",
      });
    }

    // Payment validation
    const selectedPaymentMethod =
      paymentMethod === undefined ? "COD" : paymentMethod;

    if (selectedPaymentMethod !== "COD") {
      return res.status(400).json({
        success: false,
        message: "Currently, only Cash on Delivery is available.",
      });
    }

    session = await Order.startSession();

    let order;

    await session.withTransaction(async () => {
      const orderProducts = [];
      let totalAmount = 0;

      // Check products and calculate total
      for (const item of products) {
        const product = await Product.findById(item.productId).session(
          session
        );

        if (!product || !product.isActive) {
          const error = new Error(
            "One or more products are unavailable."
          );
          error.statusCode = 404;
          throw error;
        }

        if (product.stock < item.quantity) {
          const error = new Error(
            `Insufficient stock for ${product.name}. Available stock: ${product.stock}`
          );
          error.statusCode = 409;
          throw error;
        }

        orderProducts.push({
          product: product._id,
          name: product.name,
          quantity: item.quantity,
          price: product.price,
        });

        totalAmount += product.price * item.quantity;
      }

      totalAmount =
        Math.round((totalAmount + Number.EPSILON) * 100) / 100;

      // Create order
      const createdOrders = await Order.create(
        [
          {
            user: req.user._id,
            products: orderProducts,
            totalAmount,
            shippingAddress: cleanAddress,
            paymentMethod: selectedPaymentMethod,
            paymentStatus: "Pending",
            orderStatus: "Processing",
          },
        ],
        { session }
      );

      order = createdOrders[0];

      // Deduct stock atomically
      for (const item of products) {
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            isActive: true,
            stock: { $gte: item.quantity },
          },
          {
            $inc: {
              stock: -item.quantity,
            },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedProduct) {
          const error = new Error(
            "Product is unavailable or stock is insufficient."
          );
          error.statusCode = 409;
          throw error;
        }
      }
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to place order.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// Get logged-in customer's orders
const getMyOrders = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination values.",
      });
    }

    const skip = (page - 1) * limit;

    const filters = {
      user: req.user._id,
    };

    const [orders, totalOrders] = await Promise.all([
      Order.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Order.countDocuments(filters),
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch your orders.",
    });
  }
};

// Get single order details
const getOrderById = async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch order details.",
    });
  }
};

// Get all orders (Admin only)
const getAllOrders = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination values.",
      });
    }

    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
      Order.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Order.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch all orders.",
    });
  }
};

// Admin: Update order status
const updateOrderStatus = async (req, res) => {
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID.",
    });
  }

  if (
    !req.body ||
    typeof req.body !== "object" ||
    Array.isArray(req.body)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid order status data.",
    });
  }

  const { orderStatus } = req.body;

  if (
    typeof orderStatus !== "string" ||
    !orderStatus.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Order status must be valid text.",
    });
  }

  const normalizedOrderStatus = orderStatus.trim();

  const allowedStatuses = [
    "Processing",
    "Confirmed",
    "Printing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];

  if (!allowedStatuses.includes(normalizedOrderStatus)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order status.",
    });
  }

  const orderTransitions = {
    Processing: ["Confirmed", "Cancelled"],
    Confirmed: ["Printing", "Cancelled"],
    Printing: ["Shipped", "Cancelled"],
    Shipped: ["Delivered"],
    Delivered: [],
    Cancelled: [],
  };

  let session;

  try {
    session = await Order.startSession();

    let updatedOrder;

    await session.withTransaction(async () => {
      const currentOrder = await Order.findById(req.params.id).session(
        session
      );

      if (!currentOrder) {
        const error = new Error("Order not found.");
        error.statusCode = 404;
        throw error;
      }

      if (
        !orderTransitions[currentOrder.orderStatus]?.includes(
          normalizedOrderStatus
        )
      ) {
        const error = new Error(
          `Cannot change order status from ${currentOrder.orderStatus} to ${normalizedOrderStatus}.`
        );
        error.statusCode = 400;
        throw error;
      }

      // Cancellation: restore product stock
      if (normalizedOrderStatus === "Cancelled") {
        updatedOrder = await Order.findOneAndUpdate(
          {
            _id: req.params.id,
            orderStatus: currentOrder.orderStatus,
          },
          {
            $set: {
              orderStatus: "Cancelled",
            },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedOrder) {
          const error = new Error(
            "Order status changed. Please refresh and try again."
          );
          error.statusCode = 409;
          throw error;
        }

        for (const item of updatedOrder.products) {
          const product = await Product.findByIdAndUpdate(
            item.product,
            {
              $inc: {
                stock: item.quantity,
              },
            },
            {
              new: true,
              session,
            }
          );

          if (!product) {
            throw new Error("Failed to restore product stock.");
          }
        }
      } else {
        updatedOrder = await Order.findOneAndUpdate(
          {
            _id: req.params.id,
            orderStatus: currentOrder.orderStatus,
          },
          {
            $set: {
              orderStatus: normalizedOrderStatus,
            },
          },
          {
            new: true,
            runValidators: true,
            session,
          }
        );

        if (!updatedOrder) {
          const error = new Error(
            "Order status changed. Please refresh and try again."
          );
          error.statusCode = 409;
          throw error;
        }
      }
    });

    res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to update order status.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

const cancelMyOrder = async (req, res) => {
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID.",
    });
  }

  if (
    req.body !== undefined &&
    req.body !== null &&
    (typeof req.body !== "object" || Array.isArray(req.body))
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid cancellation request.",
    });
  }

  let session;

  try {
    session = await Order.startSession();

    let cancelledOrder;

    await session.withTransaction(async () => {
      const order = await Order.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user._id,
          orderStatus: "Processing",
        },
        {
          $set: {
            orderStatus: "Cancelled",
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!order) {
        const error = new Error(
          "Order not found or cannot be cancelled."
        );
        error.statusCode = 400;
        throw error;
      }

      for (const item of order.products) {
        const updatedProduct = await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: {
              stock: item.quantity,
            },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedProduct) {
          throw new Error("Failed to restore product stock.");
        }
      }

      cancelledOrder = order;
    });

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      order: cancelledOrder,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to cancel order.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

module.exports = { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, cancelMyOrder };