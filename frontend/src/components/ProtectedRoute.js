import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  let isExpired = false;

  if (token) {
    try {
      const payload = token.split(".")[1];

      if (!payload) {
        throw new Error("Invalid token");
      }

      const decodedPayload = JSON.parse(
        atob(
          payload
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(Math.ceil(payload.length / 4) * 4, "=")
        )
      );

      if (
        decodedPayload.exp &&
        Date.now() >= decodedPayload.exp * 1000
      ) {
        isExpired = true;
      }
    } catch (error) {
      isExpired = true;
    }
  }

  if (!token || isExpired) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return (
      <Navigate
        to="/login"
        state={{ from: window.location.pathname }}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;