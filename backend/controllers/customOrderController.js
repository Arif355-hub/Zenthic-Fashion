
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const CustomOrder = require("../models/CustomOrder");
const cloudinary = require("../config/cloudinary");

// Create custom order
const createCustomOrder = async (req, res) => {
  let uploadedPublicId = "";
  let uploadedResourceType = "";
  try {
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid custom order data.",
      });
    }

    const { productType, width, height, quantity, notes } = req.body;

    if (
      typeof productType !== "string" ||
      productType.trim().length < 2 ||
      productType.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Product type must be between 2 and 100 characters.",
      });
    }

    if (
      !Number.isFinite(Number(width)) ||
      Number(width) <= 0 ||
      !Number.isFinite(Number(height)) ||
      Number(height) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Width and height must be valid positive numbers.",
      });
    }

    if (
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1 ||
      Number(quantity) > 10000
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be between 1 and 10000.",
      });
    }

    if (
      notes !== undefined &&
      (typeof notes !== "string" || notes.trim().length> 1000)
    ) {
      return res.status(400).json({
        success: false,
        message: "Notes cannot exceed 1000 characters.",
      });
    }

    let designFile = "";

    if (req.file) {
      const uploadedFile = await uploadToCloudinary(req.file.buffer);

      designFile = uploadedFile.url;
      uploadedPublicId = uploadedFile.publicId;
      uploadedResourceType = uploadedFile.resourceType;
    }

    const customOrder = await CustomOrder.create({
      user: req.user._id,
      statusHistory: [
        {
          status: "Pending",
          changedBy: req.user._id,
        },
      ],
      productType: productType.trim(),
      width: Number(width),
      height: Number(height),
      quantity: Number(quantity),
      notes: notes?.trim() || "",
      designFile,
      designPublicId: uploadedPublicId,
      designResourceType: uploadedResourceType,
    });

    res.status(201).json({
      success: true,
      message: "Custom order submitted successfully.",
      customOrder,
    });
  } catch (error) {
    if (uploadedPublicId) {
    try {
      await cloudinary.uploader.destroy(uploadedPublicId, {
        resource_type: uploadedResourceType,
      });
    } catch (cleanupError) {
      console.error("Cloudinary cleanup failed:", cleanupError);
    }
  }
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to submit custom order.",
    });
  }
};

// Get logged-in customer's custom orders
const getMyCustomOrders = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = 10;
    const skip = (page - 1) * limit;
    const allowedOrderStatuses = [
      "Pending",
      "Approved",
      "In Production",
      "Completed",
      "Cancelled",
    ];

    const allowedQuoteStatuses = [
      "Pending",
      "Quoted",
      "Accepted",
      "Rejected",
    ];

    const filters = {
      user: req.user._id,
    };

    if (req.query.orderStatus) {
      if (!allowedOrderStatuses.includes(req.query.orderStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status filter.",
        });
      }

      filters.orderStatus = req.query.orderStatus;
    }

    if (req.query.quoteStatus) {
      if (!allowedQuoteStatuses.includes(req.query.quoteStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid quotation status filter.",
        });
      }

  filters.quoteStatus = req.query.quoteStatus;
}

    const [customOrders, totalOrders] = await Promise.all([
      CustomOrder.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      CustomOrder.countDocuments(filters),
    ]);

    res.status(200).json({
      success: true,
      customOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNextPage: page * limit < totalOrders,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch custom orders.",
    });
  }
};

// Admin: Get all custom orders
const getAllCustomOrders = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    const allowedOrderStatuses = [
      "Pending",
      "Approved",
      "In Production",
      "Completed",
      "Cancelled",
    ];

    const allowedQuoteStatuses = [
      "Pending",
      "Quoted",
      "Accepted",
      "Rejected",
    ];

    const filters = {};

    if (req.query.orderStatus) {
      if (!allowedOrderStatuses.includes(req.query.orderStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status filter.",
        });
      }

      filters.orderStatus = req.query.orderStatus;
    }

    if (req.query.quoteStatus) {
      if (!allowedQuoteStatuses.includes(req.query.quoteStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid quotation status filter.",
        });
      }

      filters.quoteStatus = req.query.quoteStatus;
    }

    if (req.query.search !== undefined) {
      if (
        typeof req.query.search !== "string" ||
        req.query.search.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Search must be a string of up to 100 characters.",
        });
      }

      const search = req.query.search.trim();

      if (search) {
        const escapedSearch = search.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        filters.productType = {
          $regex: escapedSearch,
          $options: "i",
        };
      }
    }

    if (req.query.notes !== undefined) {
      if (
        typeof req.query.notes !== "string" ||
        req.query.notes.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Notes search must be up to 100 characters.",
        });
      }

      const notesSearch = req.query.notes.trim();

      if (notesSearch) {
        const escapedNotesSearch = notesSearch.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        filters.notes = {
          $regex: escapedNotesSearch,
          $options: "i",
        };
      }
    }

    if (
      (req.query.startDate &&
        !/^\d{4}-\d{2}-\d{2}$/.test(req.query.startDate)) ||
      (req.query.endDate &&
        !/^\d{4}-\d{2}-\d{2}$/.test(req.query.endDate))
    ) {
      return res.status(400).json({
        success: false,
        message: "Dates must be in YYYY-MM-DD format.",
      });
    }

    const isValidCalendarDate = (dateString) => {
      if (!dateString) return true;

      const date = new Date(`${dateString}T00:00:00.000Z`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === dateString
      );
    };

    if (
      !isValidCalendarDate(req.query.startDate) ||
      !isValidCalendarDate(req.query.endDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar date.",
      });
    }
    
    if (req.query.startDate || req.query.endDate) {
      const dateFilter = {};

      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);

        if (Number.isNaN(startDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date.",
          });
        }

        dateFilter.$gte = startDate;
      }

      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);

        if (Number.isNaN(endDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date.",
          });
        }

        endDate.setUTCHours(23, 59, 59, 999);
        dateFilter.$lte = endDate;
      }

      if (
        dateFilter.$gte &&
        dateFilter.$lte &&
        dateFilter.$gte > dateFilter.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "Start date cannot be after end date.",
        });
      }

      filters.createdAt = dateFilter;
    }

    const [customOrders, totalOrders] = await Promise.all([
      CustomOrder.find(filters)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      CustomOrder.countDocuments(filters),
    ]);

    res.status(200).json({
      success: true,
      customOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNextPage: page * limit < totalOrders,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch custom orders.",
    });
  }
};

// Admin: Send quotation to customer
const updateCustomOrderQuote = async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid custom order ID.",
      });
    }

    if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid quotation data.",
        });
      }

const { quotedPrice } = req.body;
const existingOrder = await CustomOrder.findById(req.params.id);

if (!existingOrder) {
  return res.status(404).json({
    success: false,
    message: "Custom order not found.",
  });
}

if (existingOrder.quoteStatus === "Quoted") {
  return res.status(400).json({
    success: false,
    message: "Customer must respond to the existing quotation first.",
  });
}

if (existingOrder.quoteStatus === "Accepted") {
  return res.status(400).json({
    success: false,
    message: "An accepted quotation cannot be changed.",
  });
}

if (
  ["Approved", "In Production", "Completed", "Cancelled"].includes(
    existingOrder.orderStatus
  )
) {
  return res.status(400).json({
    success: false,
    message: "Quotation cannot be changed for this order.",
  });
}

    if (
      quotedPrice === undefined ||
      quotedPrice === null ||
      quotedPrice === "" ||
      !Number.isFinite(Number(quotedPrice)) ||
      Number(quotedPrice) < 0 ||
      Number(quotedPrice) > 10000000
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid quotation price.",
      });
    }

    const customOrder = await CustomOrder.findOneAndUpdate(
      {
        _id: req.params.id,
        orderStatus: "Pending",
        quoteStatus: {
          $in: ["Pending", "Rejected"],
        },
      },
      {
        $set: {
          quotedPrice: Number(quotedPrice),
          quoteStatus: "Quoted",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!customOrder) {
      return res.status(409).json({
        success: false,
        message: "Order or quotation status has changed. Please refresh and try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Quotation updated successfully.",
      customOrder,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update quotation.",
    });
  }
};

// Customer: Accept or reject quotation
const respondToCustomOrderQuote = async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid custom order ID.",
      });
    }

    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation response.",
      });
    }

    const { quoteStatus } = req.body;

    if (!["Accepted", "Rejected"].includes(quoteStatus)) {
      return res.status(400).json({
        success: false,
        message: "Response must be Accepted or Rejected.",
      });
    }

    const customOrder = await CustomOrder.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!customOrder) {
      return res.status(404).json({
        success: false,
        message: "Custom order not found.",
      });
    }

    if (customOrder.quoteStatus !== "Quoted") {
      return res.status(400).json({
        success: false,
        message: "No pending quotation is available.",
      });
    }

    const updatedOrder = await CustomOrder.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
        orderStatus: "Pending",
        quoteStatus: "Quoted",
      },
      {
        $set: {
          quoteStatus,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedOrder) {
      return res.status(409).json({
        success: false,
        message: "Quotation is no longer available for this order.",
      });
    }

    res.status(200).json({
      success: true,
      message: `Quotation ${quoteStatus.toLowerCase()} successfully.`,
      customOrder: updatedOrder,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to respond to quotation.",
    });
  }
};

// Admin: Update custom order production status
const updateCustomOrderStatus = async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid custom order ID.",
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

    const transitions = {
      Pending: ["Approved", "Cancelled"],
      Approved: ["In Production", "Cancelled"],
      "In Production": ["Completed"],
      Completed: [],
      Cancelled: [],
    };

    const validPreviousStatuses = Object.keys(transitions).filter(
  (status) => transitions[status].includes(orderStatus)
);

if (validPreviousStatuses.length === 0) {
  return res.status(400).json({
    success: false,
    message: "Invalid custom order status transition.",
  });
}

const updateFilter = {
  _id: req.params.id,
  orderStatus: { $in: validPreviousStatuses },
};

if (orderStatus === "Approved") {
  updateFilter.quoteStatus = "Accepted";
}

const customOrder = await CustomOrder.findOneAndUpdate(
  updateFilter,
  {
  $set: {
    orderStatus,
  },

  $push: {
    statusHistory: {
      status: orderStatus,
      changedBy: req.user._id,
      changedAt: new Date(),
    },
  },
},
  {
    new: true,
    runValidators: true,
  }
);

if (!customOrder) {
  const orderExists = await CustomOrder.exists({
    _id: req.params.id,
  });

  return res.status(orderExists ? 409 : 404).json({
    success: false,
    message: orderExists
      ? "Order status has changed or the requested transition is not allowed."
      : "Custom order not found.",
  });
}

    res.status(200).json({
      success: true,
      message: "Custom order status updated successfully.",
      customOrder,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update custom order status.",
    });
  }
};

// Customer: Cancel pending custom order
const cancelCustomOrder = async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid custom order ID.",
      });
    }

    const customOrder = await CustomOrder.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
        orderStatus: "Pending",
      },
      {
        $set: {
          orderStatus: "Cancelled",
        },

        $push: {
          statusHistory: {
            status: "Cancelled",
            changedBy: req.user._id,
            changedAt: new Date(),
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!customOrder) {
      const orderExists = await CustomOrder.exists({
        _id: req.params.id,
        user: req.user._id,
      });

      return res.status(orderExists ? 409 : 404).json({
        success: false,
        message: orderExists
          ? "Only pending custom orders can be cancelled."
          : "Custom order not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Custom order cancelled successfully.",
      customOrder,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to cancel custom order.",
    });
  }
};

// Customer: Get details of one custom order
const getMyCustomOrderById = async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid custom order ID.",
      });
    }

    const customOrder = await CustomOrder.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!customOrder) {
      return res.status(404).json({
        success: false,
        message: "Custom order not found.",
      });
    }

    res.status(200).json({
      success: true,
      customOrder,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch custom order details.",
    });
  }
};

// Admin: Get details of one custom order
const getCustomOrderById = async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid custom order ID.",
      });
    }

    const customOrder = await CustomOrder.findById(req.params.id)
      .populate("user", "name email");

    if (!customOrder) {
      return res.status(404).json({
        success: false,
        message: "Custom order not found.",
      });
    }

    res.status(200).json({
      success: true,
      customOrder,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch custom order details.",
    });
  }
};

// Admin: Get custom order dashboard statistics
const getCustomOrderStats = async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      approvedOrders,
      productionOrders,
      completedOrders,
      cancelledOrders,
      pendingQuotes,
      quotedOrders,
      acceptedQuotes,
      rejectedQuotes,
    ] = await Promise.all([
      CustomOrder.countDocuments(),
      CustomOrder.countDocuments({ orderStatus: "Pending" }),
      CustomOrder.countDocuments({ orderStatus: "Approved" }),
      CustomOrder.countDocuments({ orderStatus: "In Production" }),
      CustomOrder.countDocuments({ orderStatus: "Completed" }),
      CustomOrder.countDocuments({ orderStatus: "Cancelled" }),
      CustomOrder.countDocuments({ quoteStatus: "Pending" }),
      CustomOrder.countDocuments({ quoteStatus: "Quoted" }),
      CustomOrder.countDocuments({ quoteStatus: "Accepted" }),
      CustomOrder.countDocuments({ quoteStatus: "Rejected" }),
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        totalOrders,
        orderStatus: {
          pending: pendingOrders,
          approved: approvedOrders,
          inProduction: productionOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
        },
        quoteStatus: {
          pending: pendingQuotes,
          quoted: quotedOrders,
          accepted: acceptedQuotes,
          rejected: rejectedQuotes,
        },
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch custom order statistics.",
    });
  }
};

// Admin: Export custom orders as CSV
const exportCustomOrdersCSV = async (req, res) => {
  try {
    const filters = {};

const allowedOrderStatuses = [
  "Pending",
  "Approved",
  "In Production",
  "Completed",
  "Cancelled",
];

const allowedQuoteStatuses = [
  "Pending",
  "Quoted",
  "Accepted",
  "Rejected",
];

if (req.query.orderStatus) {
  if (!allowedOrderStatuses.includes(req.query.orderStatus)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order status filter.",
    });
  }

  filters.orderStatus = req.query.orderStatus;
}

if (req.query.quoteStatus) {
  if (!allowedQuoteStatuses.includes(req.query.quoteStatus)) {
    return res.status(400).json({
      success: false,
      message: "Invalid quotation status filter.",
    });
  }

  filters.quoteStatus = req.query.quoteStatus;
}

if (req.query.search) {
  if (
    typeof req.query.search !== "string" ||
    req.query.search.trim().length > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid search value.",
    });
  }

  const search = req.query.search.trim().replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  filters.productType = {
    $regex: search,
    $options: "i",
  };
}

if (req.query.notes !== undefined) {
  if (
    typeof req.query.notes !== "string" ||
    req.query.notes.trim().length > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "Notes search must be up to 100 characters.",
    });
  }

  const notesSearch = req.query.notes.trim();

  if (notesSearch) {
    const escapedNotesSearch = notesSearch.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    filters.notes = {
      $regex: escapedNotesSearch,
      $options: "i",
    };
  }
}

if (req.query.startDate || req.query.endDate) {
  const dateFilter = {};

  if (
  req.query.startDate &&
  !/^\d{4}-\d{2}-\d{2}$/.test(req.query.startDate)
) {
  return res.status(400).json({
    success: false,
    message: "Start date must be in YYYY-MM-DD format.",
  });
}

if (
  req.query.endDate &&
  !/^\d{4}-\d{2}-\d{2}$/.test(req.query.endDate)
) {
  return res.status(400).json({
    success: false,
    message: "End date must be in YYYY-MM-DD format.",
  });
}

const isValidDate = (dateString) => {
  if (!dateString) return true;

  const date = new Date(`${dateString}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === dateString
  );
};

if (
  !isValidDate(req.query.startDate) ||
  !isValidDate(req.query.endDate)
) {
  return res.status(400).json({
    success: false,
    message: "Invalid calendar date.",
  });
}
  if (req.query.startDate) {
    const startDate = new Date(req.query.startDate);

    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date.",
      });
    }

    dateFilter.$gte = startDate;
  }

  if (req.query.endDate) {
    const endDate = new Date(req.query.endDate);

    if (Number.isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid end date.",
      });
    }

    endDate.setUTCHours(23, 59, 59, 999);
    dateFilter.$lte = endDate;
  }

  if (
    dateFilter.$gte &&
    dateFilter.$lte &&
    dateFilter.$gte > dateFilter.$lte
  ) {
    return res.status(400).json({
      success: false,
      message: "Start date cannot be after end date.",
    });
  }

  filters.createdAt = dateFilter;
}

const customOrders = await CustomOrder.find(filters)
  .populate("user", "name email")
  .sort({ createdAt: -1 })
  .limit(5000);

    const headers = [
      "Order ID",
      "Customer Name",
      "Customer Email",
      "Product Type",
      "Width",
      "Height",
      "Quantity",
      "Notes",
      "Quoted Price",
      "Quote Status",
      "Order Status",
      "Created At",
    ];

    const escapeCSV = (value) => {
    let stringValue =
      value === null || value === undefined
        ? ""
        : String(value);

    if (/^[\s\uFEFF]*[=+\-@]/.test(stringValue)) {
      stringValue = `'${stringValue}`;
    }

    if (/^[\t\r\n]/.test(stringValue)) {
      stringValue = `'${stringValue}`;
    }

    return `"${stringValue.replace(/"/g, '""')}"`;
  };

    const rows = customOrders.map((order) => [
      order._id,
      order.user?.name || "",
      order.user?.email || "",
      order.productType,
      order.width,
      order.height,
      order.quantity,
      order.notes,
      order.quotedPrice ?? "",
      order.quoteStatus,
      order.orderStatus,
      order.createdAt?.toISOString() || "",
    ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="custom-orders.csv"'
    );

    res.status(200).send("\uFEFF" + csv);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to export custom orders.",
    });
  }
};

module.exports = {
  createCustomOrder,
  getMyCustomOrders,
  getAllCustomOrders,
  updateCustomOrderQuote,
  respondToCustomOrderQuote,
  updateCustomOrderStatus,
  cancelCustomOrder,
  getMyCustomOrderById,
  getCustomOrderById,
  getCustomOrderStats,
  exportCustomOrdersCSV,
};