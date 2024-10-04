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
      className={`px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 ${className}`}
    />
  );
};

export default Input;
