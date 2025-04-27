import { Select as MUISelect, SelectProps as MUISelectProps, MenuItem, FormControl, InputLabel, FormHelperText } from '@mui/material';
import { ReactNode } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends Omit<MUISelectProps, 'onChange' | 'variant'> {
  label?: string;
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  error?: boolean;
  helperText?: ReactNode;
  fullWidth?: boolean;
}

export const Select = ({
  label,
  options,
  value,
  onChange,
  error,
  helperText,
  fullWidth = true,
  ...props
}: SelectProps) => {
  return (
    <FormControl fullWidth={fullWidth} error={error}>
      {label && <InputLabel>{label}</InputLabel>}
      <MUISelect
        value={value}
        onChange={(e) => onChange(e.target.value as string | number)}
        label={label}
        variant="outlined"
        {...props}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </MUISelect>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}; 