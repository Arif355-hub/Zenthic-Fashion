import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      const parsedCart = savedCart ? JSON.parse(savedCart) : [];

      return Array.isArray(parsedCart)
        ? parsedCart
            .filter(
              (item) =>
                item &&
                typeof item === "object" &&
                typeof item._id === "string" &&
                item._id.trim() !== "" &&
                Number.isFinite(Number(item.price)) &&
                Number(item.price) > 0 &&
                Number.isInteger(item.stock) &&
                item.stock >= 0
            )
            .map((item) => ({
              ...item,
              quantity: Math.max(
                1,
                Math.min(
                  Number.isInteger(item.quantity) ? item.quantity : 1,
                  item.stock
                )
              ),
            }))
            .filter((item) => item.stock > 0)
        : [];
    } catch (error) {
      localStorage.removeItem("cart");
      return [];
    }
  });

useEffect(() => {
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
  } catch (error) {
    console.error("Cart could not be saved:", error);
  }
}, [cart]);

  const addToCart = (product) => {
  if (
    !product ||
    typeof product._id !== "string" ||
    !product._id.trim() ||
    !Number.isFinite(Number(product.price)) ||
    Number(product.price) <= 0 ||
    !Number.isInteger(product.stock) ||
    product.stock <= 0
  ) {
    alert("Sorry, this product is out of stock.");
    return;
  }

  setCart((currentCart) => {
    const existing = currentCart.find(
      (item) => item._id === product._id
    );

    if (existing) {
      const currentQuantity = Number.isInteger(existing.quantity)
        ? existing.quantity
        : 1;

      if (currentQuantity >= product.stock) {
        alert("Maximum available stock reached.");
        return currentCart;
      }

      return currentCart.map((item) =>
        item._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    }

    return [...currentCart, { ...product, quantity: 1 }];
  });
};

  const removeFromCart = (productId) => {
    if (!productId) {
      return;
    }

    setCart((currentCart) =>
      currentCart.filter((item) => item._id !== productId)
    );
  };

  const updateQuantity = (productId, quantity) => {
    if (!productId) {
      return;
    }

    setCart((previousCart) =>
      previousCart.map((item) => {
        if (item._id !== productId) {
          return item;
        }

        if (
          !Number.isInteger(Number(quantity)) ||
          !Number.isInteger(item.stock) ||
          item.stock < 1
        ) {
          return item;
        }

        const newQuantity = Math.max(
          1,
          Math.min(Number(quantity), item.stock)
        );

        return { ...item, quantity: newQuantity };
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalAmount = cart.reduce((total, item) => {
  const price = Number(item.price);
  const quantity = Number(item.quantity);

    if (
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return total;
    }

    return total + price * quantity;
  }, 0);

  const totalItems = cart.reduce((total, item) => {
  const quantity = Number(item.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return total;
    }

    return total + quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalAmount,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}