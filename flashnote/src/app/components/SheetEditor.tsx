"use client";
import React, {
  useEffect,
  useState,
  useRef,
  createContext,
  useContext,
} from "react";
import {
  Box,
  Button,
  CircularProgress,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  InputLabel,
} from "@mui/material";
import {
  useActiveSheetContext,
  useCardsContext,
  useSheetsContext,
  useNextCardIdContext,
} from "./DBContext";
import MainBlock from "./tiptap/MainBlock";
import { getDoc, doc, DocumentReference } from "firebase/firestore";
import { db } from "../firebase";
import {
  Card,
  createCard,
  deleteCard,
  editCardSide,
  Sheet,
  updateSheet,
} from "../firestore/functions";
import { useAuth } from "@/app/components/AuthContext";
import { AddFromTemplateDialog } from "./Templates";
import Practice from "./Practice";

// Helper to fetch a card by ID from Firestore
async function fetchCard(
  sheetId: string,
  cardId: string
): Promise<Card | null> {
  const cardRef = doc(db, "sheets", sheetId, "cards", cardId);
  const cardSnap = await getDoc(cardRef);
  if (cardSnap.exists()) {
    return { id: cardSnap.id, ...cardSnap.data() } as Card;
  }
  return null;
}

type newCardContextType = {
  handleNewCard: (
    front: string | null,
    back: string | null,
    sheetId: string | null
  ) => void;
};
const handleNewCardContext = createContext<newCardContextType>({
  handleNewCard: (
    front: string | null,
    back: string | null,
    sheetId: string | null
  ) => {},
});
export const useHandleNewCardContext = () => useContext(handleNewCardContext);

export default function SheetEditor() {
  const { activeSheet, setActiveSheet } = useActiveSheetContext();
  const { cards, setCards } = useCardsContext();
  const { sheets, setSheets } = useSheetsContext();
  const { nextCardId, setNextCardId } = useNextCardIdContext();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { ref } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const keystrokeCount = useRef(0);

  // Helper to update sheet layout
  async function handleLayoutToggle() {
    if (!activeSheet || !ref) return;
    const newLayout =
      activeSheet.layout === "vertical" ? "horizontal" : "vertical";
    const updatedSheet = { ...activeSheet, layout: newLayout };
    setSheets({ ...sheets, [activeSheet.id]: updatedSheet });
    setActiveSheet(updatedSheet);
    updateSheet(ref, updatedSheet);
  }

  async function removeCard(
    ref: DocumentReference | null,
    cardId: string,
    card: Card
  ) {
    if (!activeSheet) return;
    const newCardOrder = activeSheet.cardOrder.filter((val) => val !== cardId);
    const newSheet = { ...activeSheet, cardOrder: newCardOrder };
    setActiveSheet(newSheet);
    setSheets({ ...sheets, [activeSheet.id]: newSheet });
    deleteCard(ref, cardId, card);
  }

  async function handleNewCard(
    front: string | null,
    back: string | null,
    currSheetId: string | null
  ) {
    if (!activeSheet || !ref) return;

    const newCard = {
      id: "",
      front: front ? front : "",
      back: back ? back : "",
      sheetId: currSheetId ? currSheetId : activeSheet.id,
      folderId: activeSheet.folderId,
    };
    if (!nextCardId) return;
    const newId = await createCard(ref, newCard, activeSheet.id, nextCardId);
    newCard.id = newId;
    setCards({ ...cards, [newId]: newCard });
    const newSheet = {
      ...activeSheet,
      cardOrder: [...(activeSheet.cardOrder || []), newId],
    };
    setSheets({ ...sheets, [activeSheet.id]: newSheet });
    setActiveSheet(newSheet);
    setNextCardId(nextCardId + 1);
  }

  // Helper to save card content
  function saveCard(cardId: string, side: string, newContent: string) {
    if (!activeSheet || !ref || !cards) return;
    editCardSide(ref, cardId, newContent, side);
    setCards({
      ...cards,
      [cardId]: {
        ...cards[cardId],
        [side]: newContent,
      },
    });
  }

  //Called on each keystroke, used for autosave
  function editCard(
    cardId: string,
    side: string,
    newContent: string,
    isBlur: boolean = false
  ) {
    if (!cards || !cards[cardId] || !ref) return;
    console.log("typed");
    keystrokeCount.current += 1;

    // Debounce save: reset timer on each keystroke, save after 0.5s of inactivity
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (keystrokeCount.current > 10 || isBlur) {
      console.log("Too many keystrokes or blur, saving immediately");
      saveCard(cardId, side, newContent);
      keystrokeCount.current = 0;
      return;
    }

    timerRef.current = setTimeout(() => {
      saveCard(cardId, side, newContent);
      keystrokeCount.current = 0;
      console.log(`Saved ${side} side of card ${cardId}: ${newContent}`);
    }, 500);
  }

  function save() {
    console.log("saved");
  }

  function test() {
    let tExp = false;
    const tRef = setTimeout(() => {
      save();
      tExp = true;
    }, 5000);

    function inner() {
      if (!tExp) {
        clearTimeout(tRef);
        save();
      }
    }
    return inner;
  }

  if (!activeSheet) {
    return <Practice />;
  }

  if (loading) {
    return (
      <Box p={4}>
        <CircularProgress />
      </Box>
    );
  }

  const cardOrder = activeSheet.cardOrder || [];
  const layout = activeSheet.layout || "horizontal";

  function handleClose() {
    setOpen(false);
  }

  return (
    <handleNewCardContext.Provider value={{ handleNewCard }}>
      <Box
        sx={{
          width: "calc(100vw - 380px)",
          overflowY: "auto",
          ml: "380px",
          position: "relative",
          p: 0, // Remove padding here, add it to content below
        }}
      >
        {/* Fixed top bar */}
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          sx={{
            position: "fixed",
            top: 0,
            left: "380px",
            width: "calc(100vw - 380px)",
            zIndex: 100,
            background: "white",
            py: 2,
            px: 4,
            borderBottom: "1px solid #eee",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <Button
            variant="contained"
            onClick={() => handleNewCard(null, null, null)}
          >
            Add New Card
          </Button>
          <Button onClick={() => setOpen(true)}>Add From Template</Button>
          <FormControlLabel
            control={
              <Switch
                checked={layout === "horizontal"}
                onChange={handleLayoutToggle}
                color="primary"
              />
            }
            label={layout === "horizontal" ? "Horizontal" : "Vertical"}
          />
        </Box>
        {/* Spacer to prevent content from being hidden under the fixed bar */}
        <Box sx={{ height: 72 /* adjust if needed */, mb: 2 }} />
        <Box p={4}>
          {cardOrder.length === 0 && <Box>No cards in this sheet.</Box>}
          {cardOrder.map((cardId: string) => {
            const card = cards && cards[cardId];
            if (!card) return null;
            return (
              <Box
                key={cardId}
                mb={4}
                p={2}
                sx={{ border: "1px solid #eee", borderRadius: 2 }}
              >
                <Box
                  display="flex"
                  flexDirection={layout === "horizontal" ? "row" : "column"}
                  gap={2}
                >
                  <Box
                    sx={
                      layout === "horizontal"
                        ? { width: "50%", minWidth: 0 }
                        : { width: "100%" }
                    }
                  >
                    <MainBlock
                      content={card.front}
                      editable={true}
                      editCard={(html: string) =>
                        editCard(cardId, "front", html)
                      }
                      onBlur={(html: string) =>
                        editCard(cardId, "front", html, true)
                      }
                      deleteCard={() => removeCard(ref, cardId, card)}
                    />
                  </Box>
                  <Box
                    sx={
                      layout === "horizontal"
                        ? { width: "50%", minWidth: 0 }
                        : { width: "100%" }
                    }
                  >
                    <MainBlock
                      content={card.back}
                      editable={true}
                      editCard={(html: string) =>
                        editCard(cardId, "back", html)
                      }
                      onBlur={(html: string) =>
                        editCard(cardId, "back", html, true)
                      }
                      deleteCard={() => removeCard(ref, cardId, card)}
                    />
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
      <AddFromTemplateDialog open={open} onClose={handleClose} />
    </handleNewCardContext.Provider>
  );
}
