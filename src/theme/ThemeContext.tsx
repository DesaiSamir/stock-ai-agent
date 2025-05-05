"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  PropsWithChildren,
} from "react";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [mode, setMode] = useState<ThemeMode>("light");

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "light"
            ? {
                // Light mode colors
                primary: { main: "#1976d2" },
                background: {
                  default: "#f5f5f5",
                  paper: "#ffffff",
                },
                text: {
                  primary: "#1a1a1a",
                  secondary: "#666666",
                },
              }
            : {
                // Dark mode colors
                primary: { main: "#90caf9" },
                background: {
                  default: "#131722",
                  paper: "#1e222d",
                },
                text: {
                  primary: "#ffffff",
                  secondary: "#b3b3b3",
                },
              }),
        },
      }),
    [mode],
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
