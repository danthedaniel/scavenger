import React from "react";

interface ButtonProps {
  text: string;
  className: string;
  onClick?: () => void;
}

const Button = ({ text = "Button", className = "", onClick }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 ${className}`}
    >
      {text}
    </button>
  );
};

export default Button;
