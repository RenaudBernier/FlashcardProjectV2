"use client";
import "./styles.scss";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import ImageResize from "tiptap-extension-resize-image";
import { Underline } from "@tiptap/extension-underline";

import {
  ReactNodeViewRenderer,
  EditorProvider,
  useCurrentEditor,
} from "@tiptap/react";

// load all languages with "all" or common languages with "common"
import { common, createLowlight } from "lowlight";
import React, { useState } from "react";
import StarterKit from "@tiptap/starter-kit";

import "katex/dist/katex.min.css";
import { MathExtension } from "@aarkue/tiptap-math-extension";

// eslint-disable-next-line
import CodeBlockComponent from "./CodeBlockComponent";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import TextAlign from "@tiptap/extension-text-align";

// create a lowlight instance
const lowlight = createLowlight(common);

const MenuBar = () => {
  const { editor, editCard } = useCurrentEditor();
  if (!editor) {
    return null;
  }

  return (
    <div className="control-group">
      <div className="button-group">
        <Button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive("codeBlock") ? "is-active" : ""}
        >
          Toggle code block
        </Button>
      </div>
    </div>
  );
};

export default ({ content, editCard, editable, onBlur, deleteCard }) => {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmCallback, setConfirmCallback] = useState(null);

  const handleDeleteRequest = (callback) => {
    if (!deleteCard) return;
    setConfirmCallback(() => callback);
    setOpenConfirm(true);
  };
  const handleConfirm = () => {
    if (confirmCallback) confirmCallback();
    deleteCard();
    setOpenConfirm(false);
  };
  const handleCancel = () => {
    setOpenConfirm(false);
  };
  async function readClipboardText() {
    try {
      const text = await navigator.clipboard.readText();
      console.log("Clipboard text:", text);
      return text;
    } catch (err) {
      console.error("Failed to read clipboard: ", err);
    }
  }

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <EditorProvider
          extensions={[
            StarterKit.configure({ codeBlock: false }).extend({
              addKeyboardShortcuts() {
                return {
                  "Mod-V": () => console.log("ctrl v"),
                  "Mod-Shift-A": () => this.editor.commands.toggleCodeBlock(),
                  "Mod-Shift-H": () => {
                    const { state } = this.editor;
                    const doc = this.editor.doc;
                    const { from, to } = state.selection;
                    const selectedText = state.doc.textBetween(from, to, " ");
                    console.log(selectedText);
                    readClipboardText();
                    this.editor.commands.insertContentAt(
                      { from, to },
                      {
                        type: "image",
                        attrs: { src: selectedText },
                      }
                    );
                    editCard(this.editor.getHTML());
                    return true;
                  },
                  "Mod-1": () =>
                    this.editor.commands.toggleHeading({ level: 1 }),
                  "Mod-2": () =>
                    this.editor.commands.toggleHeading({ level: 2 }),
                  "Mod-3": () =>
                    this.editor.commands.toggleHeading({ level: 3 }),
                  "Mod-4": () =>
                    this.editor.commands.toggleHeading({ level: 4 }),
                  "Mod-5": () =>
                    this.editor.commands.toggleHeading({ level: 5 }),
                  "Mod-6": () =>
                    this.editor.commands.toggleHeading({ level: 6 }),
                  "Shift-Alt-Backspace": () => {
                    handleDeleteRequest(() => {
                      // Place your delete logic here
                      // e.g. call a prop or function to delete the flashcard
                    });
                    return true;
                  },
                  Backspace: () => {
                    const { state } = this.editor;
                    const html = this.editor.getHTML();
                    const rightBrackets = Array.from(html).reduce(
                      (acc, char) => {
                        if (char === ">") return acc + 1;
                        return acc;
                      },
                      0
                    );
                    if (
                      state.selection.$from.parent.isBlock &&
                      state.selection.$from.parent.textContent.length === 0 &&
                      rightBrackets <= 2
                    ) {
                      handleDeleteRequest(() => {
                        // Place your delete logic here
                        // e.g. call a prop or function to delete the flashcard
                      });
                      return true;
                    }
                  },
                };
              },
            }),
            CodeBlockLowlight.extend({
              addNodeView() {
                return ReactNodeViewRenderer(CodeBlockComponent);
              },
              addKeyboardShortcuts() {
                return {
                  Tab: () => {
                    const { state, view } = this.editor;
                    const { selection } = state;
                    if (
                      selection.empty &&
                      selection.$from.parent.type.name === "codeBlock"
                    ) {
                      const indent = "    "; // 4 spaces
                      view.dispatch(view.state.tr.insertText(indent));
                      return true; // Prevent default tab behavior
                    }
                    return false;
                  },
                };
              },
            }).configure({ lowlight }),
            MathExtension.configure({
              evaluation: true,
              katexOptions: {
                macros: { "\\B": "\\mathbb{B}" },
              },
              delimiters: "dollar",
            }),
            TextAlign.configure({
              types: ["paragraph", "heading"],
              defaultAlignment: "center",
            }),
            Underline,
            ImageResize,
          ]}
          immediatelyRender={false}
          content={content}
          editorProps={{
            attributes: {
              class: "tiptap",
            },
            editable: () => editable,
            handleDOMEvents: {
              blur: (view, event) => {
                const text = view.state.doc.textContent;
                const html =
                  text.trim() === "" ? "<p></p>" : view.dom.innerHTML;

                onBlur?.(html);
                return false;
              },
            },
          }}
          onUpdate={({ editor }) => {
            const html = editor.getHTML();
            editCard(html);
            console.log("EDIT");
          }}
        />
      </Box>
      <Dialog open={openConfirm} onClose={handleCancel}>
        <DialogTitle>Delete Flashcard?</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this flashcard?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
