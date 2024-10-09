import React from "react";
import clsx from "clsx";

interface ButtonProps {
  text: string;
  className?: string;
  onClick?: () => void;
}

const Button = ({ text = "Button", className, onClick }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-4 py-2 focus:outline-none focus:ring-2 focus:ring-opacity-50",
        "bg-white active:bg-gray-300 border-black rounded-lg border-4",
        "font-chakra-petch font-bold text-xl",
        className
      )}
    >
      {text}
    </button>
  );
};

export default Button;
