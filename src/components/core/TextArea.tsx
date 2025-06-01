import React from "react";

interface TextAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  value,
  onChange,
  onKeyPress,
  disabled = false,
  placeholder = "",
  rows = 1,
  className = "",
}) => (
  <textarea
    value={value}
    onChange={onChange}
    onKeyPress={onKeyPress}
    placeholder={placeholder}
    disabled={disabled}
    rows={rows}
    className={`max-h-[80px] min-h-[40px] flex-1 resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#24A76A] sm:text-base ${className}`}
  />
);
