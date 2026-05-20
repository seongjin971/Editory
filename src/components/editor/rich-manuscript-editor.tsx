"use client";

import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, type Editor, type JSONContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { CSSProperties } from "react";
import type { EditorSettings } from "@/lib/editor-settings";

export type RichEditorSnapshot = {
  body: string;
  contentHtml: string;
  contentJson: string;
};

export function RichManuscriptEditor({
  initialContent,
  onChange,
  onEditorReady,
  onEscapeFocusMode,
  onSaveShortcut,
  settings,
}: {
  initialContent: JSONContent | string;
  onChange: (snapshot: RichEditorSnapshot) => void;
  onEditorReady: (editor: Editor | null) => void;
  onEscapeFocusMode: () => void;
  onSaveShortcut: () => void;
  settings: EditorSettings;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        underline: false,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder:
          "이 장면에서 무슨 일이 벌어지나요? 인물, 갈등, 결과를 자유롭게 적어보세요.",
      }),
      CharacterCount,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "story-editor-content",
      },
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
          event.preventDefault();
          onSaveShortcut();
          return true;
        }

        if (event.key === "Escape") {
          onEscapeFocusMode();
          return false;
        }

        return false;
      },
    },
    onCreate: ({ editor }) => {
      onEditorReady(editor);
    },
    onUpdate: ({ editor }) => {
      onChange(makeSnapshot(editor));
    },
    onDestroy: () => {
      onEditorReady(null);
    },
  });

  const style = {
    "--editor-document-width": `${settings.documentWidth}px`,
    "--editor-font-size": `${settings.fontSize}px`,
    "--editor-line-height": settings.lineHeight,
    "--editor-paragraph-spacing": `${settings.paragraphSpacing}px`,
    "--editor-font-family": fontFamilyValue(settings.fontFamily),
  } as CSSProperties;

  return (
    <div className="story-editor-shell" style={style}>
      <EditorContent editor={editor} />
    </div>
  );
}

function makeSnapshot(editor: Editor): RichEditorSnapshot {
  return {
    body: editor.getText(),
    contentHtml: editor.getHTML(),
    contentJson: JSON.stringify(editor.getJSON()),
  };
}

function fontFamilyValue(fontFamily: EditorSettings["fontFamily"]) {
  const families = {
    system:
      'var(--font-geist-sans), "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
    serif:
      '"Nanum Myeongjo", "Batang", "AppleMyungjo", "Times New Roman", serif',
    sans: 'var(--font-geist-sans), "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
    mono: 'var(--font-geist-mono), "Cascadia Mono", Consolas, monospace',
  };

  return families[fontFamily];
}
