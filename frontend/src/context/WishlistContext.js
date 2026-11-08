import React, { createContext, useContext, useState, useEffect } from "react";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem("wishlist");
      const parsedWishlist = savedWishlist
        ? JSON.parse(savedWishlist)
        : [];

      return Array.isArray(parsedWishlist) ? parsedWishlist : [];
    } catch (error) {
      localStorage.removeItem("wishlist");
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (product) => {
    if (!product || !product._id) {
      return;
    }

    setWishlist((previous) => {
      if (previous.some((item) => item._id === product._id)) {
        return previous;
      }

      return [...previous, product];
    });
  };

  const removeFromWishlist = (productId) => {
    if (!productId) {
      return;
    }

    setWishlist((previous) =>
      previous.filter((item) => item._id !== productId)
    );
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item._id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);