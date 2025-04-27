import { Alert as MUIAlert, AlertProps as MUIAlertProps, AlertTitle } from '@mui/material';
import { ReactNode } from 'react';

export interface AlertProps extends Omit<MUIAlertProps, 'severity'> {
  title?: string;
  children: ReactNode;
  severity?: 'error' | 'warning' | 'info' | 'success';
  onClose?: () => void;
}

export const Alert = ({ title, children, severity = 'info', onClose, ...props }: AlertProps) => {
  return (
    <MUIAlert severity={severity} onClose={onClose} {...props}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {children}
    </MUIAlert>
  );
}; 