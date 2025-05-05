import {
  Button as MUIButton,
  ButtonProps as MUIButtonProps,
} from "@mui/material";
import { ReactNode } from "react";

export interface ButtonProps extends Omit<MUIButtonProps, "color"> {
  children: ReactNode;
  variant?: "contained" | "outlined" | "text";
  color?: "primary" | "secondary" | "error" | "success" | "warning";
  size?: "small" | "medium" | "large";
  isLoading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export const Button = ({
  children,
  variant = "contained",
  color = "primary",
  size = "medium",
  isLoading = false,
  startIcon,
  endIcon,
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <MUIButton
      variant={variant}
      color={color}
      size={size}
      disabled={disabled || isLoading}
      startIcon={isLoading ? undefined : startIcon}
      endIcon={isLoading ? undefined : endIcon}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </MUIButton>
  );
};
