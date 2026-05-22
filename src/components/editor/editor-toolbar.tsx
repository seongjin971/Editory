import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { ToolbarButton } from "./toolbar-button";

export function EditorToolbar({
  busy,
  editor,
}: {
  busy: null | "save" | "new" | "delete" | "chapter" | "project" | "import";
  editor: Editor | null;
}) {
  const disabled = !editor || busy !== null;

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-2xl border-b border-[var(--line)] bg-[#f7faf8] px-3 py-2">
      <ToolbarButton
        disabled={disabled || !editor?.can().undo()}
        label="실행 취소"
        onClick={() => editor?.chain().focus().undo().run()}
      >
        <Undo2 aria-hidden="true" className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled || !editor?.can().redo()}
        label="다시 실행"
        onClick={() => editor?.chain().focus().redo().run()}
      >
        <Redo2 aria-hidden="true" className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        active={editor?.isActive("bold")}
        disabled={disabled}
        label="굵게"
        onClick={() => editor?.chain().focus().toggleBold().run()}
      >
        <Bold aria-hidden="true" className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive("italic")}
        disabled={disabled}
        label="기울임"
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <Italic aria-hidden="true" className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive("underline")}
        disabled={disabled}
        label="밑줄"
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
      >
        <Underline aria-hidden="true" className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive("strike")}
        disabled={disabled}
        label="취소선"
        onClick={() => editor?.chain().focus().toggleStrike().run()}
      >
        <Strikethrough aria-hidden="true" className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        active={editor?.isActive({ textAlign: "left" })}
        disabled={disabled}
        label="왼쪽 정렬"
        onClick={() => editor?.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft aria-hidden="true" className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive({ textAlign: "center" })}
        disabled={disabled}
        label="가운데 정렬"
        onClick={() => editor?.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter aria-hidden="true" className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive({ textAlign: "right" })}
        disabled={disabled}
        label="오른쪽 정렬"
        onClick={() => editor?.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight aria-hidden="true" className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        active={editor?.isActive("bulletList")}
        disabled={disabled}
        label="글머리 목록"
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      >
        <List aria-hidden="true" className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive("orderedList")}
        disabled={disabled}
        label="번호 목록"
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered aria-hidden="true" className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive("blockquote")}
        disabled={disabled}
        label="인용"
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
      >
        <Quote aria-hidden="true" className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled}
        label="구분선"
        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
      >
        <Minus aria-hidden="true" className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled}
        label="서식 지우기"
        onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
      >
        <Eraser aria-hidden="true" className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-6 w-px bg-[var(--line)]" />;
}
