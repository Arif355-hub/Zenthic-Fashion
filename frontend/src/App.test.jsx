import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

describe("Zenthic Fashion App", () => {
  it("renders the main website layout", () => {
    render(
      <CartProvider>
        <WishlistProvider>
          <App />
        </WishlistProvider>
      </CartProvider>
    );

    expect(
      screen.getByRole("link", { name: /zenthic fashion/i })
    ).toBeInTheDocument();

    expect(
      screen.getAllByRole("link", { name: "Home" }).length
    ).toBeGreaterThan(0);

    expect(
      screen.getByText(/all rights reserved/i)
    ).toBeInTheDocument();
  });
});