import {
  Card as MUICard,
  CardProps as MUICardProps,
  CardContent,
  CardHeader,
  CardActions,
} from "@mui/material";
import { ReactNode } from "react";

export interface CardProps extends MUICardProps {
  title?: string;
  subheader?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export const Card = ({
  title,
  subheader,
  children,
  actions,
  ...props
}: CardProps) => {
  return (
    <MUICard {...props}>
      {title && <CardHeader title={title} subheader={subheader} />}
      <CardContent>{children}</CardContent>
      {actions && <CardActions>{actions}</CardActions>}
    </MUICard>
  );
};
