import React, { ElementType } from "react";

import clsx from "clsx";

interface ButtonProps {
  text?: string;
  icon?: ElementType;
  className?: string;
  onClick?: () => void;
}

function Button({ text, icon: Icon, className, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-2 py-2 focus:outline-none focus:ring-2 focus:ring-opacity-50",
        "rounded-lg border-4 border-black bg-white active:bg-gray-300",
        "font-chakra-petch text-xl font-bold",
        "flex items-center justify-center",
        className
      )}
    >
      {Icon && <Icon className={clsx("h-6 w-6", text && "mr-2")} />}
      {text}
    </button>
  );
}

export default Button;
