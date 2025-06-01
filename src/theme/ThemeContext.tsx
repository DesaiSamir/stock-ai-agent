"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  PropsWithChildren,
} from "react";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";

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
                primary: { main: "#0ea5e9", light: "#38bdf8", dark: "#0284c7" },
                secondary: { main: "#6b7280", light: "#9ca3af", dark: "#4b5563" },
                background: { default: "#f9fafb", paper: "#ffffff" },
                text: { primary: "#1a1a1a", secondary: "#666666" },
              }
            : {
                primary: { main: "#90caf9" },
                background: { default: "#131722", paper: "#1e222d" },
                text: { primary: "#ffffff", secondary: "#b3b3b3" },
              }),
        },
        typography: {
          fontFamily: "Inter, sans-serif",
          h1: { fontSize: "2.5rem", fontWeight: 600 },
          h2: { fontSize: "2rem", fontWeight: 600 },
          h3: { fontSize: "1.75rem", fontWeight: 600 },
          h4: { fontSize: "1.5rem", fontWeight: 600 },
          h5: { fontSize: "1.25rem", fontWeight: 600 },
          h6: { fontSize: "1rem", fontWeight: 600 },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: "none",
                borderRadius: 8,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow:
                  "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
