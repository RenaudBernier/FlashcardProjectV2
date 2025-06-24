"use client";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  dividerClasses,
  Input,
  InputLabel,
  ListItem,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
} from "@mui/material";
import {
  Dispatch,
  Ref,
  RefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTemplatesContext } from "./DBContext";
import { Card, updateTemplates } from "../firestore/functions";
import { useHandleNewCardContext } from "./SheetEditor";
import { useAuth } from "@/app/components/AuthContext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MainBlock from "./tiptap/MainBlock";
import AddIcon from "@mui/icons-material/Add";

export interface Template {
  front: string;
  back: string;
  fields: string[];
}
interface tProps {
  open: boolean;
  onClose: () => void;
}
interface fieldsProps {
  template: Template;
  onClose: () => void;
}

type templatesMenuProps = {
  templates: Record<string, Template>;
  setTemplates: (templates: Record<string, Template>) => void;
  onClose: () => void;
  setCreate: Dispatch<SetStateAction<boolean>>;
};

export function AddFromTemplateDialog({ open, onClose }: tProps) {
  const [selected, setSelected] = useState<string>("default");
  const [create, setCreate] = useState<boolean>(false);
  const { templates, setTemplates } = useTemplatesContext();

  if (!templates) {
    return null;
  }

  const myProp = {
    templates,
    setTemplates,
    onClose,
    selected,
    setCreate,
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false}>
      {create ? (
        <TemplatesCreation prop={myProp}></TemplatesCreation>
      ) : (
        <TemplatesSelect prop={myProp}></TemplatesSelect>
      )}
    </Dialog>
  );
}

function TemplatesSelect({ prop }: { prop: templatesMenuProps }) {
  const [selected, setSelected] = useState<string>("default");
  const { templates, onClose, setCreate } = prop;
  useEffect(() => {
    const lastTemplate = localStorage.getItem("lastTemplate");
    if (lastTemplate && lastTemplate in templates) setSelected(lastTemplate);
  }, []);

  function handleChange(event: SelectChangeEvent) {
    const templateName = event.target.value;
    setSelected(templateName);
    localStorage.setItem("lastTemplate", templateName);
  }
  return (
    <>
      <DialogTitle>Add from template</DialogTitle>
      <DialogContent sx={{ width: 600, minHeight: 700 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Select value={selected} onChange={handleChange}>
            {Object.keys(templates).map((k) => (
              <MenuItem value={k}>{k}</MenuItem>
            ))}
          </Select>
          <Button onClick={() => setCreate(true)}>Add New Template</Button>
        </Box>
        <TemplateFields template={templates[selected]} onClose={onClose} />
      </DialogContent>
    </>
  );
}

function TemplatesCreation({ prop }: { prop: templatesMenuProps }) {
  const { templates, setTemplates, onClose, setCreate } = prop;
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const name = useRef<HTMLInputElement | null>(null);
  const { ref } = useAuth();

  function handleAdd() {
    if (!name.current) throw new Error("No template name");
    if (!ref) throw new Error("No ref");
    const id = name.current.value;

    const left = "\\{";
    const right = "}\\";
    let side = front;
    const frontArr: number[] = [];
    const backArr: number[] = [];
    let arr = frontArr;
    let frontDone = false;

    //No need to loop over both front and back if we just concatenate them with front+back?
    while (true) {
      let lastLeft = false;
      for (let i = 0; i < side.length - 2; i++) {
        const curr = side.substring(i, i + 3);
        if (curr === left) {
          if (lastLeft) return; //ERROR, do smth
          lastLeft = true;
        } else if (curr === right) {
          if (!lastLeft) return;
          lastLeft = false;
        }
      }
      if (frontDone) break;
      frontDone = true;
      arr = backArr;
      side = back;
    }
    const frontWordsArr = front.split(/\\{|}\\/);
    const backWordsArr = back.split(/\\{|}\\/);
    let wordsArr = [...frontWordsArr, "\\{}\\", ...backWordsArr];

    frontDone = false;
    const fields: string[] = [];

    for (let i = 1; i < wordsArr.length; i += 2) {
      const word = wordsArr[i];
      if (word !== "\\{}\\") fields.push(wordsArr[i]); //Remove added element
    }

    const newTemplate: Template = { front, back, fields };
    const newTemplates = { ...templates, [id]: newTemplate };
    setTemplates(newTemplates);
    updateTemplates(ref, templates);
    localStorage.setItem("lastTemplate", id);
    setCreate(false);
  }

  return (
    <>
      <DialogTitle>Add new template</DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Button
          onClick={() => setCreate(false)}
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          sx={{
            borderRadius: 2,
            px: 2,
            py: 1,
            alignSelf: "start",
            mt: 2,
          }}
        >
          Return
        </Button>
        <Paper
          elevation={3}
          sx={{
            padding: 2,
            width: 1000,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box
              sx={{
                minWidth: 900,
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
              }}
            >
              <MainBlock
                content=""
                editCard={setFront}
                editable={true}
                onBlur={null}
                deleteCard={null}
              ></MainBlock>
              <MainBlock
                content=""
                editCard={setBack}
                editable={true}
                onBlur={null}
                deleteCard={null}
              ></MainBlock>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "end", gap: 2 }}>
              <TextField label="name" inputRef={name}></TextField>
              <Button
                endIcon={<AddIcon />}
                sx={{ borderRadius: "30px", px: 3 }}
                variant="contained"
                onClick={handleAdd}
              >
                Add
              </Button>
            </Box>
          </Box>
        </Paper>
      </DialogContent>
    </>
  );
}

function TemplateFields({ template, onClose }: fieldsProps) {
  const fields = [];
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { handleNewCard } = useHandleNewCardContext();

  function handleClick() {
    let front = template.front;
    let back = template.back;
    let side = front;
    let done = 0;
    let index = 0;
    let frontDone = false;
    let cardFront = "";
    let cardBack = "";

    while (true) {
      const sideArr = side.split(/\\{|}\\/);
      console.log(inputRefs.current);
      console.log(sideArr);
      for (let i = 1; i < sideArr.length; i += 2) {
        const currRef = inputRefs.current[index++];
        if (!currRef || !currRef.value) {
          throw new Error("Ref is null");
        }
        sideArr[i] = currRef.value;
      }
      if (!frontDone) {
        cardFront = sideArr.join("");
        side = back;
        frontDone = true;
      } else {
        cardBack = sideArr.join("");
        break;
      }
    }
    handleNewCard(cardFront, cardBack, null);
    onClose();
  }

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: 3,
        marginTop: 3,
      }}
    >
      {template.fields.map((f, i) => (
        <TextField
          key={i}
          variant="outlined"
          label={f}
          inputRef={(r) => (inputRefs.current[i] = r)}
          multiline={true}
        />
      ))}
      <Button onClick={handleClick}>Add</Button>
    </Paper>
  );
}
