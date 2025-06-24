"use client";
import { useState, MouseEvent, MouseEventHandler } from "react";
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Collapse,
  Typography,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AddIcon from "@mui/icons-material/Add";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import Sheet from "./Sheet";
import { useActiveSheetContext, useSheetsContext } from "./DBContext";
import { Folder as FolderType } from "../firestore/functions";

interface SheetData {
  id: string;
  name: string;
  iconColor: string;
  cardOrder: string[];
}

interface FolderProps {
  name: string;
  id: string;
  iconColor: string;
  sheets: SheetData[];
  dragHandleProps?: any;
  onAddSheet?: (
    folderId: string,
    sheetName: string,
    sheetColor: string
  ) => void;
  sheetOrder: string[];
}

const SHEET_COLORS = [
  "#43a047", // green
  "#fbc02d", // yellow
  "#8e24aa", // purple
  "#1976d2", // blue
  "#d32f2f", // red
  "#ff9800", // orange
];

export default function Folder({
  name,
  id,
  iconColor,
  sheets,
  dragHandleProps,
  onAddSheet,
  sheetOrder,
}: FolderProps) {
  const { activeSheet, setActiveSheet } = useActiveSheetContext();
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [sheetName, setSheetName] = useState("");
  const [sheetColor, setSheetColor] = useState(SHEET_COLORS[0]);
  const [open, setOpen] = useState(false);

  const handleSetActiveSheet = (sheet: SheetData) => {
    setActiveSheet(sheet);
  };

  // Settings menu handlers
  const handleSettingsClick = (event: MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };
  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  // Add sheet dialog handlers
  const handleAddClick = () => setAddDialogOpen(true);
  const handleAddClose = () => {
    setAddDialogOpen(false);
    setSheetName("");
    setSheetColor(SHEET_COLORS[0]);
  };
  const handleAddSheet = () => {
    if (sheetName.trim() && onAddSheet) {
      onAddSheet(id, sheetName, sheetColor);
    }
    handleAddClose();
  };

  // Toggle folder open/close
  const handleToggle = () => setOpen((o) => !o);

  return (
    <Box sx={{ mb: 2, position: "relative", width: "100%" }}>
      {/* FOLDER HEADER - only icon is drag handle */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          gap: 1,
          isolation: "isolate",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* DRAG HANDLE - only this triggers folder drag */}
        <Box
          {...dragHandleProps}
          sx={{
            cursor: "grab",
            display: "flex",
            alignItems: "center",
            minWidth: 24,
            mr: 1,
            p: 0.5,
            borderRadius: 1,
            "&:hover": { bgcolor: "action.hover" },
            background: "transparent",
            zIndex: 2,
          }}
          onClick={(e: any) => e.stopPropagation()}
        >
          <DragIndicatorIcon fontSize="small" sx={{ color: "text.disabled" }} />
        </Box>
        {/* FOLDER BUTTON */}

        <FolderButton
          minW={220}
          maxW={320}
          onClick={handleToggle}
          iconColor={iconColor}
          name={name}
        ></FolderButton>

        {/* ACTION BUTTONS */}
        <Box sx={{ display: "flex", flexDirection: "row", gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleAddClick();
            }}
            aria-label="Add sheet"
            sx={{
              bgcolor: "background.paper",
              boxShadow: 1,
              "&:hover": { bgcolor: "grey.100" },
            }}
          >
            <AddIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleSettingsClick(e);
            }}
            aria-label="Folder settings"
            sx={{
              bgcolor: "background.paper",
              boxShadow: 1,
              "&:hover": { bgcolor: "grey.100" },
            }}
          >
            <SettingsOutlinedIcon />
          </IconButton>
        </Box>
        {/* MENUS AND DIALOGS */}
        <Menu
          anchorEl={settingsAnchorEl}
          open={Boolean(settingsAnchorEl)}
          onClose={handleSettingsClose}
        >
          <MenuItem onClick={handleSettingsClose}>Rename</MenuItem>
          <MenuItem onClick={handleSettingsClose}>Change Icon Color</MenuItem>
          <MenuItem onClick={handleSettingsClose}>Delete</MenuItem>
        </Menu>
        <Dialog open={addDialogOpen} onClose={handleAddClose}>
          <DialogTitle>New Sheet</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Sheet Name"
              fullWidth
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
            />
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Sheet Color
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {SHEET_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setSheetColor(color)}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: color,
                      border:
                        sheetColor === color
                          ? "2px solid #333"
                          : "2px solid transparent",
                      cursor: "pointer",
                      transition: "border 0.2s",
                    }}
                  />
                ))}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAddClose}>Cancel</Button>
            <Button onClick={handleAddSheet} disabled={!sheetName.trim()}>
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      {/* SHEETS CONTAINER */}
      <Box sx={{ position: "relative", zIndex: 1, pointerEvents: "none" }}>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box
            sx={{
              pl: 4,
              pt: 1,
              pointerEvents: "auto",
              isolation: "isolate",
              minHeight: 32,
            }}
          >
            {sheets.map((sheet, idx) => (
              <div
                key={sheet.id}
                style={{
                  marginBottom: 4,
                  background: "transparent",
                  borderRadius: 6,
                  transition: "background 0.2s, box-shadow 0.2s",
                }}
              >
                <Sheet
                  sheet={sheet}
                  setActiveSheet={() => handleSetActiveSheet(sheet)}
                  isSelected={activeSheet?.id === sheet.id}
                />
              </div>
            ))}
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}

type Props = {
  iconColor: string;
  minW?: number;
  maxW?: number;
  onClick: MouseEventHandler<HTMLButtonElement>;
  name: string;
};

function FolderButton({ iconColor, minW, maxW, onClick, name }: Props) {
  return (
    <Button
      startIcon={<FolderIcon sx={{ color: iconColor }} />}
      sx={{
        flex: 1,
        justifyContent: "flex-start",
        textTransform: "none",
        fontWeight: 600,
        fontSize: 16,
        px: 2,
        color: "text.primary",
        borderRadius: 2,
        boxShadow: 1,
        bgcolor: "background.paper",
        minWidth: minW,
        maxWidth: maxW,
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: 3, bgcolor: "grey.100" },
      }}
      variant="outlined"
      onClick={onClick}
    >
      {name}
    </Button>
  );
}
