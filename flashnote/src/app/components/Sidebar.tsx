"use client";
import { useState, useEffect } from "react";
import Folder from "./Folder";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { getAuth, signOut } from "firebase/auth";
import { app } from "../firebase";
import { useAuth } from "./AuthContext";
import {
  createFolder,
  createSheet,
  deleteCard,
  Sheet,
} from "@/app/firestore/functions";
import {
  useFolderOrderContext,
  useSheetsContext,
  useFoldersContext,
  useActiveSheetContext,
} from "./DBContext";
import { useRouter } from "next/navigation";

// Added missing declarations:
const folderOrderInitial = ["f1", "f2"];

interface FolderData {
  name: string;
  iconColor: string;
  sheetOrder: string[];
}

interface SheetData {
  name: string;
  iconColor: string;
}

const initialFolders: Record<string, FolderData> = {
  f1: {
    name: "Work",
    iconColor: "#1976d2",
    sheetOrder: ["s1", "s2"],
  },
  f2: {
    name: "Personal",
    iconColor: "#d32f2f",
    sheetOrder: ["s3", "s4"],
  },
};

const initialSheets: Record<string, Sheet> = {
  s1: { name: "Project Plan", iconColor: "#43a047", id: "s1", cardOrder: [] },
  s2: { name: "Project Plan 2", iconColor: "#d32f2f", id: "s2", cardOrder: [] },
  s3: { name: "Recipes", iconColor: "#8e24aa", id: "s3", cardOrder: [] },
  s4: { name: "Travel Plans", iconColor: "#fbc02d", id: "s4", cardOrder: [] },
};

const FOLDER_COLORS = [
  "#1976d2", // blue
  "#d32f2f", // red
  "#43a047", // green
  "#fbc02d", // yellow
  "#8e24aa", // purple
  "#ff9800", // orange
];

export default function Sidebar() {
  const router = useRouter();
  const { activeSheet, setActiveSheet } = useActiveSheetContext();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const { user, loading, ref } = useAuth();

  const { folderOrder, setFolderOrder } = useFolderOrderContext();
  const { sheets, setSheets } = useSheetsContext();
  const { folders, setFolders } = useFoldersContext();

  // Log all context values before conditional check.

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState(FOLDER_COLORS[0]);
  if (!mounted) return null;

  const handleAddFolder = async () => {
    const newFolder = {
      name: folderName,
      iconColor: folderColor,
      sheetOrder: [],
      id: "",
    };
    if (!ref) {
      throw new Error("Document reference is null");
    }
    const newId = await createFolder(ref, newFolder);
    newFolder.id = newId;
    setFolders({
      ...folders,
      [newId]: {
        name: folderName,
        id: newId,
        iconColor: folderColor,
        sheetOrder: [],
        totalCards: 0,
        cardsDue: 0,
      },
    });
    if (!folderOrder) {
      throw new Error("folderOrder is null");
    }
    setFolderOrder([...folderOrder, newId]);
    setAddDialogOpen(false);
    setFolderName("");
    setFolderColor(FOLDER_COLORS[0]);
  };

  // Add this function to handle adding a new sheet to a folder
  const handleAddSheet = async (
    folderId: string,
    sheetName: string,
    sheetColor: string
  ) => {
    if (!ref) {
      throw new Error("Document reference is null");
    }
    const newSheet: Sheet = {
      id: "",
      name: sheetName,
      iconColor: sheetColor,
      cardOrder: [],
      folderId: folderId,
    };
    const newSheetId = await createSheet(ref, newSheet, folderId);
    setSheets({
      ...sheets,
      [newSheetId]: {
        id: newSheetId,
        name: sheetName,
        iconColor: sheetColor,
        cardOrder: [],
        folderId: folderId,
      },
    });
    if (!folders || !folders[folderId]) {
      throw new Error(`Folder with ID ${folderId} does not exist`);
    }

    setFolders({
      ...folders,
      [folderId]: {
        ...folders[folderId],
        sheetOrder: [...folders[folderId].sheetOrder, newSheetId],
      },
    });
  };

  const handleLogout = () => {
    const auth = getAuth(app); // <-- Pass the initialized app to getAuth()
    signOut(auth).catch((error) => console.error("Error signing out:", error));
  };

  if (!folderOrder || !folders || !sheets) {
    console.log("Missing context value detected:", {
      folderOrder,
      folders,
      sheets,
    });
    return null;
  }

  return (
    <Box
      sx={{
        width: 380,
        bgcolor: "#f5f5f5",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 1200,
        boxShadow: 2,
      }}
    >
      <Box sx={{ p: 1, flex: 1, overflowY: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            color="primary"
            sx={{
              flex: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
            onClick={() => setAddDialogOpen(true)}
          >
            New Folder
          </Button>
        </Box>
        <Box style={{ position: "relative", minHeight: 40 }}>
          {folderOrder.map((folderId, folderIdx) => {
            const folder = folders[folderId];
            if (!folder) return null;
            const folderSheets = folder.sheetOrder
              .map((sheetId) => ({
                ...sheets[sheetId],
              }))
              .filter((s) => s.id && s.name);
            return (
              <div key={folderId} style={{ marginBottom: 8 }}>
                <Folder
                  id={folderId}
                  name={folder.name}
                  iconColor={folder.iconColor}
                  sheets={folderSheets}
                  sheetOrder={folder.sheetOrder}
                  onAddSheet={handleAddSheet}
                />
              </div>
            );
          })}
        </Box>
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
          <DialogTitle>New Folder</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Folder Name"
              fullWidth
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
            />
            <Box sx={{ mt: 2 }}>
              <span style={{ fontWeight: 500, fontSize: 14 }}>
                Folder Color
              </span>
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                {FOLDER_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setFolderColor(color)}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: color,
                      border:
                        folderColor === color
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
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddFolder} disabled={!folderName.trim()}>
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <Box sx={{ p: 1, pt: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => {
            console.log("null");
            setActiveSheet(null);
          }}
        >
          Practice
        </Button>
        <Button variant="outlined" onClick={handleLogout} fullWidth>
          Log Out
        </Button>
        <Button
          onClick={() => {
            for (let i = 0; i < 200; i++) {
              if (!ref) return;
              deleteCard(ref, i.toString(), null);
            }
          }}
        >
          Delete
        </Button>
      </Box>
    </Box>
  );
}
