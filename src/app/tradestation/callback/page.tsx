"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CircularProgress, Box, Typography } from "@mui/material";

export default function CallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");
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
        // Exchange code for token using our API endpoint
        const response = await fetch("/api/tradestation/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error("Failed to exchange code for token");
        }

        const data = await response.json();

        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "TRADESTATION_AUTH_SUCCESS",
              accessToken: data.access_token,
              profile: data.profile,
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
  }, [searchParams]);

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
