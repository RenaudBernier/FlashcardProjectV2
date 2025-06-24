// ShortcutsDialog.jsx
// Reusable pop‑up for displaying core TipTap keyboard shortcuts
// ------------------------------------------------------------
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Table,
    TableBody,
    TableRow,
    TableCell,
    IconButton,
    Divider,
    Box,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

/**
 * Data‑driven list of shortcuts – extend as you add more commands.
 */
const shortcuts = [
    {
        action: "Toggle Code Block",
        win: "Ctrl + Shift + A",
        mac: "⌘ + ⇧ + A",
    },
    {
        action: "Exit Code Block",
        win: "Shift + Enter",
        mac: "Shift + Enter",
    },
    {
        action: "Heading level 1–6",
        win: "Ctrl + Alt + 1…6",
        mac: "⌘ + 1…6",
    },
    {
        action: "Ordered List",
        win: "Ctrl + Shift + 7",
        mac: "⌘ + ⇧ + 7",
    },
    {
        action: "Bullet List",
        win: "Ctrl + Shift + 8",
        mac: "⌘ + ⇧ + 8",
    },
    {
        action: "Task List",
        win: "Ctrl + Shift + 9",
        mac: "⌘ + ⇧ + 9",
    },
];

/**
 * @param {boolean} open – controls visibility
 * @param {Function} onClose – handler to close the dialog
 */
export default function ShortcutsDialog({ open, onClose }) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                <Typography variant="h6">TipTap Keyboard Shortcuts</Typography>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        bgcolor: "action.hover",
                        "&:hover": { bgcolor: "action.selected" },
                    }}
                    size="small"
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ p: 0 }}>
                <Table>
                    <TableBody>
                        {shortcuts.map(row => (
                            <TableRow key={row.action} hover>
                                <TableCell sx={{ width: "40%", fontWeight: 500 }}>
                                    {row.action}
                                </TableCell>
                                <TableCell sx={{ whiteSpace: "nowrap" }}>{row.win}</TableCell>
                                <TableCell sx={{ whiteSpace: "nowrap" }}>{row.mac}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Box sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        Works with TipTap StarterKit defaults.
                    </Typography>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
