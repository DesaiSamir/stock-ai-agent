"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircularProgress, Box, Typography } from "@mui/material";

const CALLBACK_HANDLED_KEY = 'ts_callback_handled';

export default function CallbackPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [isHandlingCallback, setIsHandlingCallback] = useState(() => {
    // Initialize from sessionStorage if available
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(CALLBACK_HANDLED_KEY) === 'true';
    }
    return false;
  });

  useEffect(() => {
    console.log('Callback page mounted/reloaded', {
      isHandlingCallback,
      hasCode: !!code,
      timestamp: new Date().toISOString()
    });
  }, []);

  useEffect(() => {
    async function handleCallback() {
      // Check sessionStorage first
      if (typeof window !== 'undefined' && sessionStorage.getItem(CALLBACK_HANDLED_KEY) === 'true') {
        console.log('Callback already handled according to sessionStorage, skipping...');
        return;
      }

      if (!code) {
        console.error("No authorization code received");
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "TRADESTATION_AUTH_ERROR",
              error: "No authorization code received",
            },
            window.location.origin
          );
          window.close();
        }
        return;
      }

      try {
        // Set both state and sessionStorage
        setIsHandlingCallback(true);
        sessionStorage.setItem(CALLBACK_HANDLED_KEY, 'true');
        console.log('Starting code exchange...', {
          code: code.substring(0, 10) + '...',
          timestamp: new Date().toISOString()
        });
        
        // Exchange code for token using our API endpoint with GET request
        const response = await fetch(`/api/tradestation/callback?code=${encodeURIComponent(code)}`, {
          method: "GET",
          headers: {
            "Accept": "application/json",
          }
        });

        if (!response.ok) {
          throw new Error("Failed to exchange code for token");
        }

        const data = await response.json();
        console.log('Token exchange successful, sending to parent window');
        
        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "TRADESTATION_AUTH_SUCCESS",
              ...data,
            },
            window.location.origin
          );

          // Close popup after successful message
          console.log("Authentication successful, closing popup...");
          window.close();
        } else {
          console.error("No parent window found");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        // Send error message to parent window
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "TRADESTATION_AUTH_ERROR",
              error:
                error instanceof Error
                  ? error.message
                  : "Authentication failed",
            },
            window.location.origin
          );
          window.close();
        }
      }
    }

    // Execute callback handling
    handleCallback();
  }, [code]); // Only depend on code, not on isHandlingCallback

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: 2,
        p: 3,
        bgcolor: "background.paper",
      }}
    >
      <CircularProgress />
      <Typography variant="h6" align="center">
        Completing Authentication...
      </Typography>
      <Typography variant="body2" align="center" color="text.secondary">
        This window will close automatically once complete.
      </Typography>
    </Box>
  );
}
