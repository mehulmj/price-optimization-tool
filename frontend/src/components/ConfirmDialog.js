import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function ConfirmDialog({ open, onClose, onConfirm, children, title="Confirm" }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {title}
        <IconButton onClick={onClose} sx={{ position:"absolute", right:8, top:8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2">{children}</Typography>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="error" onClick={onConfirm}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
}
