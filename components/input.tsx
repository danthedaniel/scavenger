import React, { ChangeEvent, KeyboardEvent } from "react";

interface InputProps {
  placeholder: string;
  className: string;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
}

const Input = ({
  placeholder,
  className = "",
  onKeyDown,
  onChange,
  value,
}: InputProps) => {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      className={[
        "px-4 py-2 focus:outline-none focus:ring-2 focus:ring-opacity-50",
        "border-4 w-48 flex-grow rounded-lg placeholder:text-gray-600 placeholder:text-lg",
        className,
      ].join(" ")}
    />
  );
};

export default Input;
