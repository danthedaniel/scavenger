import React from "react";

import clsx from "clsx";

interface ButtonProps {
  text: string;
  className?: string;
  onClick?: () => void;
}

function Button({ text = "Button", className, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-4 py-2 focus:outline-none focus:ring-2 focus:ring-opacity-50",
        "rounded-lg border-4 border-black bg-white active:bg-gray-300",
        "font-chakra-petch text-xl font-bold",
        className
      )}
    >
      {text}
    </button>
  );
}

export default Button;
