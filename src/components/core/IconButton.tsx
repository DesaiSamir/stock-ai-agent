import React from "react";
import { IconButton as MuiIconButton } from "@mui/material";

interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
  tooltip?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  className,
  tooltip,
}) => {
  return (
    <MuiIconButton
      onClick={onClick}
      className={className}
      title={tooltip}
      sx={{
        color: "text.secondary",
        "&:hover": {
          color: "text.primary",
        },
      }}
    >
      {icon}
    </MuiIconButton>
  );
};
