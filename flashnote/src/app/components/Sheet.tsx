"use client";
import { useState, MouseEvent } from "react";
import { Box, Typography, IconButton, Menu, MenuItem } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import SettingsIcon from "@mui/icons-material/Settings";

interface SheetProps {
  sheet: {
    id: string;
    name: string;
    iconColor: string;
  };
  setActiveSheet?: () => void;
  isSelected?: boolean;
}

export default function Sheet({
  sheet,
  setActiveSheet,
  isSelected,
}: SheetProps) {
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null
  );

  const name = sheet.name;
  const iconColor = sheet.iconColor;

  const handleSettingsClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        py: 0.5,
        px: 1,
        borderRadius: 1,
        cursor: "grab",
        position: "relative",
        zIndex: 0,
        bgcolor: isSelected ? "action.selected" : undefined,
        "&:hover": { bgcolor: isSelected ? "action.selected" : "action.hover" },
        minWidth: 0,
        isolation: "isolate",
        border: isSelected ? "2px solid #2196F3" : "none",
        boxShadow: isSelected ? "0 4px 12px rgba(33,150,243,0.20)" : "none",
        transition: "background 0.2s, box-shadow 0.2s",
        userSelect: "none",
      }}
      onClick={() => {
        setActiveSheet && setActiveSheet();
        console.log("Sheet selected:", sheet.id);
      }}
    >
      <DescriptionIcon sx={{ color: iconColor }} fontSize="small" />
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          flex: 1,
          minWidth: 0,
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </Typography>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          handleSettingsClick(e);
        }}
        aria-label="Sheet settings"
        sx={{
          ml: 0.5,
          bgcolor: "background.paper",
          boxShadow: 1,
          "&:hover": { bgcolor: "grey.100" },
          position: "relative",
          zIndex: 2,
        }}
      >
        <SettingsIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={handleSettingsClose}
      >
        <MenuItem onClick={handleSettingsClose}>Rename</MenuItem>
        <MenuItem onClick={handleSettingsClose}>Change Icon Color</MenuItem>
        <MenuItem onClick={handleSettingsClose}>Delete</MenuItem>
      </Menu>
    </Box>
  );
}
