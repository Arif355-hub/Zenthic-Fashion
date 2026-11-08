const Product = require("../models/Product");

// Get all active products
const getProducts = async (req, res) => {
  try {
    const { search, category, sortBy, order } = req.query;

    if (
        sortBy !== undefined &&
        !["price", "name", "createdAt"].includes(sortBy)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product sorting field.",
        });
      }

      if (
        order !== undefined &&
        !["asc", "desc"].includes(order)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product sorting order.",
        });
      }

    if (
      search !== undefined &&
      (typeof search !== "string" || search.length > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Search query cannot exceed 100 characters.",
      });
    }

    if (
        category !== undefined &&
        (typeof category !== "string" || category.trim().length > 50)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product category.",
        });
      }

    const pageInput = req.query.page;

      if (
        pageInput !== undefined &&
        (!/^\d+$/.test(String(pageInput)) ||
          Number(pageInput) < 1 ||
          Number(pageInput) > 1000000)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid page number.",
        });
      }

const page = Number(pageInput) || 1;
const limit = 8;
    const skip = (page - 1) * limit;

    const filter = {
      isActive: true,
    };

    if (search) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.name = {
        $regex: escapedSearch,
        $options: "i",
      };
    }

    if (category) {
      filter.category = category.trim();
    }

    const totalProducts = await Product.countDocuments(filter);

    const allowedSortFields = ["price", "name", "createdAt"];

    const sortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const sortOrder = order === "asc" ? 1 : -1;

    const sortOptions = {
      [sortField]: sortOrder,
    };

    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      products,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch products.",
    });
  }
};

// Get single product
const getProductById = async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
      }

    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch product",
    });
  }
};

// Add product (Admin only)
const createProduct = async (req, res) => {
  try {
    if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product data.",
        });
      }

    const { name, description, category, price, image, stock } = req.body;

    if (
        (typeof price !== "number" && typeof price !== "string") ||
        String(price).trim() === "" ||
        !Number.isFinite(Number(price)) ||
        Number(price) <= 0 ||
        Number(price) > 10000000
      ) {
        return res.status(400).json({
          success: false,
          message: "Product price must be a valid number greater than 0.",
        });
      }

     if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Product name must be between 2 and 100 characters.",
      });
    }

    if (
          typeof description !== "string" ||
          description.trim().length < 5 ||
          description.trim().length > 2000
        ) {
          return res.status(400).json({
            success: false,
            message: "Product description must be between 5 and 2000 characters.",
          });
        }

        if (
          typeof category !== "string" ||
          category.trim().length < 2 ||
          category.trim().length > 50
        ) {
          return res.status(400).json({
            success: false,
            message: "Product category must be between 2 and 50 characters.",
          });
        }

        if (
          stock !== undefined &&
          (
            (typeof stock !== "number" && typeof stock !== "string") ||
            String(stock).trim() === "" ||
            !Number.isInteger(Number(stock)) ||
            Number(stock) < 0 ||
            Number(stock) > 1000000
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Product stock must be a valid non-negative integer.",
          });
        }

          if (image !== undefined && typeof image !== "string") {
              return res.status(400).json({
                success: false,
                message: "Product image must be valid text.",
              });
            }

            if (image && image.trim().length > 2048) {
              return res.status(400).json({
                success: false,
                message: "Product image URL is too long.",
              });
            }

            if (image?.trim()) {
                try {
                  const imageUrl = new URL(image.trim());

                  if (!["http:", "https:"].includes(imageUrl.protocol)) {
                    throw new Error("Invalid image URL");
                  }
                } catch (error) {
                  return res.status(400).json({
                    success: false,
                    message: "Product image must be a valid HTTP or HTTPS URL.",
                  });
                }
              }

    if (!name || !description || !category || price == null) {
      return res.status(400).json({
        message: "Please provide all required product details",
      });
    }

    const cleanStock = stock === undefined ? 0 : Number(stock);
    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      price: Number(price),
      image: image?.trim() || "",
      stock: cleanStock,
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
  if (
    error.name === "ValidationError" ||
    error.name === "CastError"
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid product data.",
    });
  }

  res.status(500).json({
    success: false,
    message: "Failed to create product.",
  });
 }
};


// Update product (Admin only)
const updateProduct = async (req, res) => {
  try {
    if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product data.",
        });
      }

    const { name, description, category, price, image, stock } = req.body;

    if (
        name === undefined &&
        description === undefined &&
        category === undefined &&
        price === undefined &&
        image === undefined &&
        stock === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "At least one product field is required for update.",
        });
      }

    if (
        name !== undefined &&
        (typeof name !== "string" ||
          name.trim().length < 2 ||
          name.trim().length > 100)
      ) {
        return res.status(400).json({
          success: false,
          message: "Product name must be between 2 and 100 characters.",
        });
      }

      if (
          description !== undefined &&
          (typeof description !== "string" ||
            description.trim().length < 5 ||
            description.trim().length > 2000)
        ) {
          return res.status(400).json({
            success: false,
            message: "Product description must be between 5 and 2000 characters.",
          });
        }

        if (
          category !== undefined &&
          (typeof category !== "string" ||
            category.trim().length < 2 ||
            category.trim().length > 50)
        ) {
          return res.status(400).json({
            success: false,
            message: "Product category must be between 2 and 50 characters.",
          });
        }

        if (
            price !== undefined &&
            ((typeof price !== "number" && typeof price !== "string") ||
              String(price).trim() === "" ||
              !Number.isFinite(Number(price)) ||
              Number(price) <= 0 ||
              Number(price) > 10000000)
          ) {
            return res.status(400).json({
              success: false,
              message: "Product price must be a valid number greater than 0.",
            });
          }

        if (
            stock !== undefined &&
            ((typeof stock !== "number" && typeof stock !== "string") ||
              String(stock).trim() === "" ||
              !Number.isInteger(Number(stock)) ||
              Number(stock) < 0 ||
              Number(stock) > 1000000)
          ) {
            return res.status(400).json({
              success: false,
              message: "Product stock must be a valid non-negative integer.",
            });
          }

          if (image !== undefined && typeof image !== "string") {
              return res.status(400).json({
                success: false,
                message: "Product image must be valid text.",
              });
            }

            if (image !== undefined && image.trim().length > 2048) {
              return res.status(400).json({
                success: false,
                message: "Product image URL is too long.",
              });
            }

            if (image?.trim()) {
              try {
                const imageUrl = new URL(image.trim());

                if (!["http:", "https:"].includes(imageUrl.protocol)) {
                  throw new Error("Invalid image URL");
                }
              } catch (error) {
                return res.status(400).json({
                  success: false,
                  message: "Product image must be a valid HTTP or HTTPS URL.",
                });
              }
            }

    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    product.name = name !== undefined ? name.trim() : product.name;
    product.description = description !== undefined ? description.trim() : product.description;
    product.category = category !== undefined ? category.trim() : product.category;
    product.price = price !== undefined ? Number(price) : product.price;
    product.image = image !== undefined ? image.trim() : product.image;
    product.stock = stock !== undefined ? Number(stock) : product.stock;

    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product: updatedProduct,
    });
    } catch (error) {
    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product data.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update product.",
    });
  }
};

// Delete product (Admin only)
const deleteProduct = async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete product.",
    });
  }
};

// Add product review
const addProductReview = async (req, res) => {
  try {
    if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid review data.",
        });
      }

    const { rating, comment } = req.body;

    if (typeof rating !== "number" || !Number.isInteger(rating)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a valid number.",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5.",
      });
    }

    if (typeof comment !== "string") {
      return res.status(400).json({
        success: false,
        message: "Review comment must be valid text.",
      });
    }

    if (comment.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Review comment cannot exceed 1000 characters.",
        });
      }

      if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
      }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: "Reviews cannot be added to an inactive product.",
      });
    }

    const alreadyReviewed = product.reviews.some(
      (review) => review.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        message: "You have already reviewed this product.",
      });
    }

    if (
      !Number.isInteger(Number(rating)) ||
      Number(rating) < 1 ||
      Number(rating) > 5 ||
      !comment ||
      !comment.trim()
    ) {
      return res.status(400).json({
        message: "Valid rating and comment are required.",
      });
    }

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment: comment.trim(),
    };

    product.reviews.push(review);

    product.numReviews = product.reviews.length;

    product.rating =
      product.reviews.reduce((sum, item) => sum + item.rating, 0) /
      product.reviews.length;

    await product.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully.",
      product,
    });
    } catch (error) {
    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid review data.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add product review.",
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  addProductReview,
  deleteProduct,
  updateProduct,
};