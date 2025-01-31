import React, { ChangeEvent, KeyboardEvent } from "react";

import clsx from "clsx";

interface InputProps {
  placeholder: string;
  className?: string;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
}

function Input({
  placeholder,
  className,
  onKeyDown,
  onChange,
  value,
}: InputProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      className={clsx(
        "px-4 py-2 focus:outline-hidden focus:ring-2 focus:ring-opacity-50",
        "w-32 grow rounded-lg border-4 placeholder:text-lg placeholder:text-gray-600",
        className
      )}
    />
  );
}

export default Input;
