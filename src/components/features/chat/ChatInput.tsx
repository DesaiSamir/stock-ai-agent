import React from "react";
import { Box, InputBase, IconButton, CircularProgress } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  isLoading: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onKeyDown,
  onSend,
  isLoading,
  placeholder = "Type your message...",
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      bgcolor: "background.paper",
      border: 1,
      borderColor: "primary.main",
      borderRadius: 9999,
      boxShadow: 1,
      px: 1.5,
      py: 0.5,
      width: "100%",
      minHeight: 32,
    }}
  >
    <InputBase
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={isLoading}
      multiline
      minRows={1}
      maxRows={4}
      sx={{
        flex: 1,
        fontSize: 15,
        border: "none",
        outline: "none",
        bgcolor: "transparent",
        px: 0.5,
        py: 0.25,
        borderRadius: 9999,
        "& textarea": {
          resize: "none",
        },
      }}
      inputProps={{
        "aria-label": placeholder,
      }}
      autoFocus
    />
    <IconButton
      color="primary"
      onClick={onSend}
      disabled={isLoading || !value.trim()}
      sx={{ ml: 0.5, borderRadius: "50%", width: 32, height: 32 }}
      aria-label="Send message"
    >
      {isLoading ? <CircularProgress size={18} /> : <SendIcon fontSize="small" />}
    </IconButton>
  </Box>
);
