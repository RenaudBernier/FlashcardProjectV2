import {
  collection,
  DocumentReference,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase";
import { Template } from "../components/Templates";

export interface Sheet {
  layout?: string;
  id: string;
  name: string;
  iconColor: string;
  cardOrder: any[];
  folderId: string;
}
export interface Folder {
  id: string;
  name: string;
  iconColor: string;
  sheetOrder: string[];
  totalCards: number;
  cardsDue: number;
}
export interface Card {
  id: string;
  front: string;
  back: string;
  sheetId: string;
  folderId: string;
  reviewDate?: Date;
  lastReview?: Date;
  s?: number;
  d?: number;
}

function getCardsRef(ref: DocumentReference) {
  return collection(ref, "cards");
}

function getFoldersRef(ref: DocumentReference) {
  return collection(ref, "folders");
}

function getSheetsRef(ref: DocumentReference) {
  return collection(ref, "sheets");
}

function getSheetRef(ref: DocumentReference, sheetId: string) {
  return doc(ref, "sheets", sheetId);
}
function getFolderRef(ref: DocumentReference, folderId: string) {
  return doc(ref, "folders", folderId);
}

async function getRootDoc(ref: DocumentReference) {
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    throw new Error("No such document!");
  }
}

async function getCard(ref: DocumentReference, cardId: string) {
  const colRef = getCardsRef(ref);
  const cardRef = doc(colRef, cardId);
  const snapshot = await getDoc(cardRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Card;
  } else {
    throw new Error("Card not found");
  }
}
async function getCardsFromSheet(ref: DocumentReference, sheet: Sheet) {
  const cardOrder = sheet.cardOrder;
  if (!cardOrder) {
    throw new Error("No card order found for this sheet");
  }
  const cards = await Promise.all(
    cardOrder.map((cardId) => getCard(ref, cardId))
  );
  const cardsObj = cards.reduce((acc: any, card) => {
    acc[card.id] = card;
    return acc;
  }, {});
  return cardsObj;
}

async function getCardsArr(ref: DocumentReference) {
  const colRef = getCardsRef(ref);
  const snapshot = await getDocs(colRef);
  const cardsArr = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return cardsArr;
}
async function getCardsObject(ref: DocumentReference) {
  const cardsArr = await getCardsArr(ref);
  const cardsObj = cardsArr.reduce((acc: any, doc) => {
    acc[doc.id] = doc;
    return acc;
  }, {});
  return cardsObj;
}
async function deleteCard(
  ref: DocumentReference | null,
  cardId: string | null,
  card: Card | null
) {
  if (!cardId) {
    throw new Error("No card ID provided");
  }
  if (!ref) throw new Error("No ref provided");
  const colRef = getCardsRef(ref);
  const cardRef = doc(colRef, cardId);
  if (!card) {
    card = await getCard(ref, cardId);
  }
  const sheetId = card.sheetId;
  const sheetRef = getSheetRef(ref, sheetId);
  const sheetDoc = await getDoc(sheetRef);
  if (sheetDoc.exists()) {
    const sheetData = sheetDoc.data();
    if (sheetData && sheetData.cardOrder) {
      const newCardOrder = sheetData.cardOrder.filter(
        (id: string) => id !== cardId
      );
      await updateDoc(sheetRef, { cardOrder: newCardOrder });
    }
  }

  await deleteDoc(cardRef);
}

async function editCard(ref: DocumentReference, cardId: string, card: any) {
  const colRef = collection(ref, "cards");
  const cardRef = doc(colRef, cardId);
  await setDoc(cardRef, card, { merge: true });
}
async function editCardSide(
  ref: DocumentReference,
  cardId: string,
  newContent: string,
  side: string
) {
  const colRef = collection(ref, "cards");
  const cardRef = doc(colRef, cardId);
  await updateDoc(cardRef, {
    [side]: newContent,
  });
}

async function getFoldersArr(ref: DocumentReference) {
  const colRef = collection(ref, "folders");
  const snapshot = await getDocs(colRef);
  const foldersArr = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return foldersArr;
}
async function getFoldersObject(ref: DocumentReference) {
  const foldersArr = await getFoldersArr(ref);
  const foldersObj = foldersArr.reduce((acc: any, doc) => {
    acc[doc.id] = doc;
    return acc;
  }, {});
  return foldersObj;
}

async function getSheetsArr(ref: DocumentReference) {
  const colRef = collection(ref, "sheets");

  const snapshot = await getDocs(colRef);
  console.log("2");
  const sheetsArr = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  console.log("3");
  return sheetsArr;
}

async function getSheetsObject(ref: DocumentReference) {
  const sheetsArr = await getSheetsArr(ref);
  const sheetsObj = sheetsArr.reduce((acc: any, doc) => {
    acc[doc.id] = doc;
    return acc;
  }, {});
  return sheetsObj;
}

async function getSheet(ref: DocumentReference, sheetId: string) {
  const colRef = collection(ref, "sheets");
  const sheetRef = doc(colRef, sheetId);
  const snapshot = await getDoc(sheetRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Sheet;
  } else {
    throw new Error("Sheet not found");
  }
}

async function updateSheet(ref: DocumentReference, sheet: any) {
  const sheetId = sheet.id;
  const sheetRef = getSheetRef(ref, sheetId);
  console.log(sheetRef);
  await setDoc(sheetRef, sheet, { merge: true });
}

export async function updateTemplates(
  ref: DocumentReference,
  templates: Record<string, Template>
) {
  await setDoc(
    ref,
    {
      templates: templates,
    },
    { merge: true }
  );
}

async function createSheet(
  ref: DocumentReference,
  sheet: any,
  folderId: string
) {
  const sheets = await getSheetsArr(ref);
  const sheetIds = sheets.map((sheet: any) => sheet.id);
  const sheetIdsInt = sheetIds.map((id: string) => parseInt(id));
  const newSheetId = (
    sheetIdsInt.length > 0 ? Math.max(...sheetIdsInt) + 1 : 1
  ).toString();
  const newSheet: Sheet = {
    ...sheet,
    id: newSheetId,
  };
  console.log(4);
  await updateSheet(ref, newSheet);
  console.log(5);
  console.log("Folder ID:", folderId);
  await addToSheetOrder(ref, folderId, newSheetId);
  return newSheetId;
}

async function addToSheetOrder(
  ref: DocumentReference,
  folderId: string,
  sheetId: string
) {
  const folderRef = getFolderRef(ref, folderId);
  await updateDoc(folderRef, {
    sheetOrder: arrayUnion(sheetId),
  });
}

async function addToCardOrder(
  ref: DocumentReference,
  sheetId: string,
  cardId: string
) {
  const sheetRef = getSheetRef(ref, sheetId);
  await updateDoc(sheetRef, {
    cardOrder: arrayUnion(cardId),
  });
}

async function getNextCardId(ref: DocumentReference) {
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    return docSnap.data().nextCardId.toString();
  } else {
    throw new Error("No such document!");
  }
}
async function setNextCardId(ref: DocumentReference, id: number) {
  updateDoc(ref, {
    nextCardId: id,
  });
}

async function createCard(
  ref: DocumentReference,
  card: Card,
  sheetId: string,
  newCardId: number
) {
  const idStr = newCardId.toString();
  const newCard: Card = {
    ...card,
    id: idStr,
  };

  editCard(ref, idStr, newCard); //Create the card in the cards collection
  addToCardOrder(ref, sheetId, idStr); //Add the card to the cardOrder of the sheet
  setNextCardId(ref, newCardId + 1); //Increment the nextCardId in the root document
  appendToReviewQueue(ref, card); //Add the card to the review queue

  return idStr;
}

async function createFolder(ref: DocumentReference, folder: any) {
  const folders = await getFoldersArr(ref);
  console.log(folders);
  const folderIds = folders.map((folder: any) => folder.id);
  console.log(folderIds);
  const folderIdsInt = folderIds.map((id: string) => parseInt(id));
  const newFolderId = (
    folderIdsInt.length > 0 ? Math.max(...folderIdsInt) + 1 : 1
  ).toString();
  const newFolder: Folder = {
    ...folder,
    id: newFolderId,
  };
  await setDoc(getFolderRef(ref, newFolderId), newFolder);
  await updateDoc(ref, {
    folderOrder: arrayUnion(newFolderId),
  });
  console.log("New folder created with ID:", newFolderId);
  return newFolderId;
}

async function getFolderOrder(ref: DocumentReference) {
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    return docSnap.data().folderOrder;
  } else {
    console.log("No such document!");
    return [];
  }
}

export async function appendToReviewQueue(ref: DocumentReference, card: Card) {
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    await updateDoc(ref, { reviewQueue: arrayUnion(card) });
  } else {
    console.log("No such document!");
  }
}

export async function setQueueBackend(
  ref: DocumentReference,
  queue: Record<string, Card>
) {
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    await updateDoc(ref, { reviewQueue: queue });
  } else {
    console.log("No such document!");
  }
}

export async function updateSheetOrderInFolder(
  ref: DocumentReference,
  folderId: string,
  sheetOrder: string[]
) {
  const folderDoc = getFolderRef(ref, folderId);
  await updateDoc(folderDoc, { sheetOrder });
}

export {
  createCard,
  createSheet,
  createFolder,
  getCardsArr,
  getSheetsArr,
  getFoldersArr,
  getCardsObject,
  getSheetsObject,
  getFoldersObject,
  deleteCard,
  editCard,
  updateSheet,
  getFolderOrder,
  getRootDoc,
  editCardSide,
  getCardsFromSheet,
};
