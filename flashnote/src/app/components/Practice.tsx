import React from "react";
import { Folder } from "../firestore/functions";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import { useFoldersContext } from "./DBContext";

export default function Practice() {
  const { folders } = useFoldersContext(); // folders: Record<string, Folder>
  if (!folders) return null;

  const handleReview = (folderId: string) => {
    // TODO – navigate to the review page or set active folder in context
    console.log(`Reviewing folder ${folderId}`);
    
  };

  return (
    <Box
      sx={{
        width: "calc(100vw - 380px)",
        ml: "380px",
        overflowY: "auto",
        p: 2,
      }}
    >
      <TableContainer component={Paper} elevation={0}>
        <Table size="small" stickyHeader aria-label="folders table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Folder</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Cards Due
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Total Cards
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                {/* empty header cell for the button column */}
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {Object.entries(folders).map(([id, folder]) => (
              <TableRow hover key={id}>
                {/* Folder icon + name */}
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FolderIcon sx={{ color: folder.iconColor }} />
                    {folder.name}
                  </Box>
                </TableCell>

                {/* Numbers */}
                <TableCell align="right">{folder.cardsDue}</TableCell>
                <TableCell align="right">{folder.totalCards}</TableCell>

                {/* Review button */}
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleReview(id)}
                  >
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
