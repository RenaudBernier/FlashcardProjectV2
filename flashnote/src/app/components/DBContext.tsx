"use client";
import Sidebar from "./Sidebar";
import { AuthProvider, useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { CircularProgress } from "@mui/material";
import {
  getCardsObject,
  getFoldersObject,
  getSheetsObject,
  Sheet,
  Card,
  Folder,
  getFolderOrder,
  getRootDoc,
  getCardsFromSheet,
  updateTemplates,
  setQueueBackend,
} from "@/app/firestore/functions";
import { getDoc } from "firebase/firestore";
import { Template } from "./Templates";
import { usePathname } from "next/navigation";

type activeSheetContextType = {
  activeSheet: Sheet | null;
  setActiveSheet: (sheet: Sheet | null) => void;
};
type cardsContextType = {
  cards: Record<string, Card> | null;
  setCards: (cards: Record<string, Card>) => void;
};
type sheetsContextType = {
  sheets: Record<string, Sheet> | null;
  setSheets: (sheets: Record<string, Sheet>) => void;
};
type foldersContextType = {
  folders: Record<string, Folder> | null;
  setFolders: (folders: Record<string, Folder>) => void;
};
type folderOrderContextType = {
  folderOrder: string[] | null;
  setFolderOrder: (folderOrder: string[]) => void;
};
type nextCardIdContextType = {
  nextCardId: number | null;
  setNextCardId: (id: number) => void;
};
type templatesContextType = {
  templates: Record<string, Template> | null;
  setTemplates: (templates: Record<string, Template>) => void;
};
type queueContextType = {
  queue: Card[] | null;
  setQueue: (queue: Card[]) => void;
};

//Make context into its own file with sheets, cards and folders
const activeSheetContext = createContext<activeSheetContextType>({
  activeSheet: null,
  setActiveSheet: () => {},
});
const cardsContext = createContext<cardsContextType>({
  cards: null,
  setCards: () => {},
});
const sheetsContext = createContext<sheetsContextType>({
  sheets: null,
  setSheets: () => {},
});
const foldersContext = createContext<foldersContextType>({
  folders: null,
  setFolders: () => {},
});
const folderOrderContext = createContext<folderOrderContextType>({
  folderOrder: null,
  setFolderOrder: () => {},
});
const nextCardIdContext = createContext<nextCardIdContextType>({
  nextCardId: null,
  setNextCardId: (id: number) => {},
});

const templatesContext = createContext<templatesContextType>({
  templates: null,
  setTemplates: (templates) => {},
});

const queueContext = createContext<queueContextType>({
  queue: null,
  setQueue: (cardsQueue) => {},
});

export const useActiveSheetContext = () => useContext(activeSheetContext);
export const useCardsContext = () => useContext(cardsContext);
export const useSheetsContext = () => useContext(sheetsContext);
export const useFoldersContext = () => useContext(foldersContext);
export const useFolderOrderContext = () => useContext(folderOrderContext);
export const useNextCardIdContext = () => useContext(nextCardIdContext);
export const useTemplatesContext = () => useContext(templatesContext);
export const useQueueContext = () => useContext(queueContext);

export function DBProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, ref } = useAuth();
  const [activeSheet, newActiveSheet] = useState<Sheet | null>(null);
  const [actSheet, setActiveSheet] = useState<Sheet | null>(null);
  const [cards, setCards] = useState<Record<string, Card>>({});
  const [sheets, setSheets] = useState<Record<string, Sheet>>({});
  const [folders, setFolders] = useState<Record<string, Folder>>({});
  const [folderOrder, setFolderOrder] = useState<string[]>([]);
  const [nextCardId, setNextCardId] = useState<number>(0);
  const [queue, newQueue] = useState<Card[]>([]);
  const cardsQueue = useRef<string[][]>([]);
  const nbCardsInMemory = useRef<number>(0);
  const [templates, setTemplates] = useState<Record<string, Template> | null>(
    null
  );
  const router = useRouter();

  function changeActiveSheet(sheetId: string) {
    setActiveSheet(sheets[sheetId]);
  }

  function changeTemplates(templates: Record<string, Template>) {
    if (!ref) return;
    setTemplates(templates);
    updateTemplates(ref, templates);
  }

  useEffect(() => {
    async function changeSheet() {
      if (!actSheet || !ref) {
        newActiveSheet(null);
        return;
      }
      if (!actSheet.cardOrder) {
        newActiveSheet(actSheet);
        return;
      }
      if (!actSheet.cardOrder.length || actSheet.cardOrder[0] in cards) {
        newActiveSheet(actSheet);
        return;
      }
      const newCards: Record<string, Card> = await getCardsFromSheet(
        ref,
        actSheet
      );
      cardsQueue.current.push(actSheet.cardOrder);
      nbCardsInMemory.current += actSheet.cardOrder.length;
      if (nbCardsInMemory.current > 1000) {
        if (cardsQueue.current.length === 0)
          throw new Error("cardsQueue is empty, but nbCardsInMemory > 1000");
        const cardsToRemove = cardsQueue.current.shift();
        if (!cardsToRemove) {
          throw new Error("cardsToRemove undefined");
        }
        for (const cardId of cardsToRemove) {
          delete cards[cardId];
          nbCardsInMemory.current -= 1;
        }
      }

      setCards({ ...cards, ...newCards });
      newActiveSheet(actSheet);
    }
    changeSheet();
  }, [actSheet]);

  function setQueue(queue: Record<string, Card>) {
    if (!ref) {
      throw Error("no ref");
    }
    newQueue(queue);
    setQueueBackend(ref, queue);
  }

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchData() {
      if (!user || !ref) return;

      const rootDocPromise = getRootDoc(ref);
      const foldersPromise = getFoldersObject(ref);
      const sheetsPromise = getSheetsObject(ref);
      const promises = [foldersPromise, sheetsPromise, rootDocPromise];
      const [folders, sheets, rootDoc, templates] = await Promise.all(promises);
      console.log(folders);

      setFolders(folders);
      setSheets(sheets);
      setFolderOrder(rootDoc.folderOrder);
      setNextCardId(rootDoc.nextCardId);
      setTemplates(rootDoc.templates);
      newQueue(rootDoc.cardsQueue);
    }
    fetchData();
  }, [user]);
  const pathname = usePathname();
  if (
    pathname != "/login" &&
    (loading ||
      !user ||
      !folderOrder ||
      !sheets ||
      !cards ||
      !folders ||
      !templates)
  ) {
    return <Spinner></Spinner>;
  }

  return (
    <templatesContext.Provider
      value={{ templates, setTemplates: changeTemplates }}
    >
      <nextCardIdContext.Provider value={{ nextCardId, setNextCardId }}>
        <activeSheetContext.Provider value={{ activeSheet, setActiveSheet }}>
          <cardsContext.Provider value={{ cards, setCards }}>
            <sheetsContext.Provider value={{ sheets, setSheets }}>
              <foldersContext.Provider value={{ folders, setFolders }}>
                <folderOrderContext.Provider
                  value={{ folderOrder, setFolderOrder }}
                >
                  <queueContext.Provider value={{ queue, setQueue }}>
                    {children}
                  </queueContext.Provider>
                </folderOrderContext.Provider>
              </foldersContext.Provider>
            </sheetsContext.Provider>
          </cardsContext.Provider>
        </activeSheetContext.Provider>
      </nextCardIdContext.Provider>
    </templatesContext.Provider>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <CircularProgress color="primary" size={64} />
        <div
          style={{
            textAlign: "center",
            marginTop: 16,
            color: "#1976d2",
            fontWeight: 500,
          }}
        >
          Loading Flashnote...
        </div>
      </div>
    </div>
  );
}
