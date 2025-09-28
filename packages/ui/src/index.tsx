import React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export const Button: React.FC<ButtonProps> = ({ variant = "primary", className = "", ...rest }) => {
  const base = "px-3 py-1.5 rounded text-sm font-medium focus:outline-none focus:ring-2";
  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
      : "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400";
  return <button className={`${base} ${styles} ${className}`} {...rest} />;
};
