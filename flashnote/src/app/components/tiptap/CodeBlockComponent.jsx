"use client";
import "./CodeBlockComponent.scss";

import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { useEffect, useState } from "react";
export default ({
  node,
  updateAttributes,
  extension,
  editor,
  getPos,
  enterText,
}) => {
  let { language: defaultLanguage } = node.attrs;
  const [language, setLanguage] = useState(defaultLanguage ?? "auto");
  const languageList = extension.options.lowlight.listLanguages();

  const checkLanguage = () => {
    const curr = node.textContent;
    const end = curr.slice(-1);
    let beg = curr.slice(0, curr.length - 1);
    if (beg === "js") beg = "javascript";
    else if (beg === "ts") beg = "typescript";
    if (end === "\n" && languageList.includes(beg)) {
      updateAttributes({ language: beg });
      setLanguage(beg);
      editor
        .chain()
        .focus()
        .deleteRange({ from: getPos() + 1, to: getPos() + curr.length + 1 })
        .run();
    }
  };
  useEffect(() => {
    checkLanguage();
  });
  return (
    <NodeViewWrapper
      className="code-block"
      onKeyDown={() => console.log("Keydown")}
    >
      <select
        contentEditable={false}
        value={language}
        onChange={(event) => {
          updateAttributes({ language: event.target.value });
          setLanguage(event.target.value);
        }}
      >
        <option value="null">auto</option>
        <option disabled>—</option>
        {extension.options.lowlight.listLanguages().map((lang, index) => (
          <option key={index} value={lang}>
            {lang}
          </option>
        ))}
      </select>
      <pre>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
};
