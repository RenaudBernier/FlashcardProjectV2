"use client";
import { useState } from "react";
import { Card } from "../firestore/functions";
import { useQueueContext } from "./DBContext";

export default function ReviewCard(folderId: string) {
  const [side, setSide] = useState("front");
  const [card, setCard] = useState<Card | null>(null);
  const [deck, setDeck] = useState<Card[] | null>(null);
  const { queue, setQueue } = useQueueContext();

  if (!deck) {
    if (!queue) {
      console.log("no queue");
      return;
    }
    const newDeck = [];
    for (const card of queue) {
      if (card.folderId === folderId) {
        newDeck.push(card);
      }
    }
    setDeck(newDeck);
  }
}
