"use client";

import type { JSONContent } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  FilePlus2,
  Focus,
  Map,
  Network,
  PanelLeft,
  PanelRight,
  Save,
  ScrollText,
  SlidersHorizontal,
  Sparkles,
  StickyNote,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import {
  analyzeChapterFromWorkspace,
  analyzeProjectFromWorkspace,
  createBlankManuscript,
  deleteWritingManuscript,
  saveWritingManuscript,
} from "@/app/actions";
import { EditorSettingsPanel } from "@/components/editor/editor-settings-panel";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { FocusModeShell } from "@/components/editor/focus-mode-shell";
import {
  RichManuscriptEditor,
  type RichEditorSnapshot,
} from "@/components/editor/rich-manuscript-editor";
import { SaveStatusBadge } from "@/components/editor/save-status-badge";
import {
  StoryInsightPanel,
  type StoryInsightData,
} from "@/components/editor/story-insight-panel";
import { WritingStatsBar } from "@/components/editor/writing-stats-bar";
import {
  parseEditorSettings,
  type EditorSettings,
} from "@/lib/editor-settings";
import { countCharacters, formatNumber } from "@/lib/format";
import { roleLabels } from "@/lib/labels";

type WritingManuscript = {
  body: string;
  chapterNumber: number;
  contentHtml: string | null;
  contentJson: string | null;
  editorSettings: string | null;
  id: string;
  memo: string;
  title: string;
  updatedAt: string;
};

type Draft = {
  body: string;
  chapterNumber: number;
  contentHtml: string;
  contentJson: string;
  manuscriptId: string | null;
  memo: string;
  title: string;
};

type BusyState = null | "save" | "new" | "delete" | "chapter" | "project";
type LayoutMode = "draft" | "splitLeft" | "splitRight";
type CompanionView =
  | "timeline"
  | "storyline"
  | "characters"
  | "plot"
  | "chapters"
  | "insight"
  | "settings"
  | "memo";
type CommandMenu = null | "project" | "chapters" | "reference" | "view" | "analysis";

const layoutLabels: Record<LayoutMode, string> = {
  draft: "원고만",
  splitLeft: "자료 + 원고",
  splitRight: "원고 + 자료",
};

const companionLabels: Record<CompanionView, string> = {
  timeline: "타임라인",
  storyline: "스토리라인",
  characters: "등장인물",
  plot: "플롯",
  chapters: "챕터",
  insight: "AI 인사이트",
  settings: "문서 설정",
  memo: "메모",
};

type WritingWorkspaceProps = {
  initialManuscriptId: string | null;
  insight: StoryInsightData | null;
  manuscripts: WritingManuscript[];
  nextChapterNumber: number;
  projectId: string;
};

export function WritingWorkspace({
  initialManuscriptId,
  insight,
  manuscripts,
  nextChapterNumber,
  projectId,
}: WritingWorkspaceProps) {
  const router = useRouter();
  const basePath = `/projects/${projectId}`;
  const initialSelectedId =
    initialManuscriptId && manuscripts.some((item) => item.id === initialManuscriptId)
      ? initialManuscriptId
      : manuscripts[0]?.id ?? null;
  const initialManuscript =
    manuscripts.find((item) => item.id === initialSelectedId) ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [draft, setDraft] = useState<Draft>(() =>
    makeDraft(initialManuscript, nextChapterNumber),
  );
  const [settings, setSettings] = useState<EditorSettings>(() =>
    parseEditorSettings(initialManuscript?.editorSettings),
  );
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<BusyState>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const editorSnapshotRef = useRef<RichEditorSnapshot | null>(null);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const storageLoadedRef = useRef(false);
  const [focusMode, setFocusMode] = useState(false);
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>("splitLeft");
  const [companionView, setCompanionViewState] =
    useState<CompanionView>("timeline");
  const [companionPercent, setCompanionPercent] = useState(38);
  const [draggingSplit, setDraggingSplit] = useState(false);
  const [openMenu, setOpenMenu] = useState<CommandMenu>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const selectedManuscript = useMemo(
    () => manuscripts.find((manuscript) => manuscript.id === selectedId) ?? null,
    [manuscripts, selectedId],
  );
  const characterCount = countCharacters(draft.body);
  const paragraphCount = draft.body
    .split(/\r?\n\s*\r?\n|\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean).length;
  const saveStatus = busy === "save" ? "saving" : dirty ? "dirty" : "saved";
  const initialContent = getInitialEditorContent(draft);
  const showCompanion = layoutMode !== "draft";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedLayout = window.localStorage.getItem(
        `storylab:write-layout-v2:${projectId}`,
      );
      const storedCompanionView = window.localStorage.getItem(
        `storylab:companion-view:${projectId}`,
      );
      const storedPercent = Number(
        window.localStorage.getItem(`storylab:split-percent:${projectId}`),
      );

      if (isLayoutMode(storedLayout)) {
        setLayoutModeState(storedLayout);
      }

      if (isCompanionView(storedCompanionView)) {
        setCompanionViewState(storedCompanionView);
      }

      if (Number.isFinite(storedPercent)) {
        setCompanionPercent(clamp(storedPercent, 24, 56));
      }

      storageLoadedRef.current = true;
    }, 0);

    return () => window.clearTimeout(timer);
  }, [projectId]);

  useEffect(() => {
    if (!storageLoadedRef.current) {
      return;
    }

    window.localStorage.setItem(`storylab:write-layout-v2:${projectId}`, layoutMode);
  }, [layoutMode, projectId]);

  useEffect(() => {
    if (!storageLoadedRef.current) {
      return;
    }

    window.localStorage.setItem(`storylab:companion-view:${projectId}`, companionView);
  }, [companionView, projectId]);

  useEffect(() => {
    if (!storageLoadedRef.current) {
      return;
    }

    window.localStorage.setItem(
      `storylab:split-percent:${projectId}`,
      String(companionPercent),
    );
  }, [companionPercent, projectId]);

  useEffect(() => {
    if (!draggingSplit) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = splitRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      const rawPercent =
        layoutMode === "splitRight"
          ? ((rect.right - event.clientX) / rect.width) * 100
          : ((event.clientX - rect.left) / rect.width) * 100;
      setCompanionPercent(clamp(rawPercent, 24, 56));
    }

    function handlePointerUp() {
      setDraggingSplit(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingSplit, layoutMode]);

  function setLayoutMode(nextMode: LayoutMode) {
    setLayoutModeState(nextMode);
    setOpenMenu(null);
  }

  function setCompanionView(nextView: CompanionView) {
    setCompanionViewState(nextView);

    if (layoutMode === "draft") {
      setLayoutModeState("splitLeft");
    }

    setOpenMenu(null);
  }

  function updateDraft(next: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...next }));
    setDirty(true);
  }

  function updateSettings(next: EditorSettings) {
    setSettings(next);
    setDirty(true);
  }

  function handleEditorChange(snapshot: RichEditorSnapshot) {
    editorSnapshotRef.current = snapshot;
    setDraft((current) => ({ ...current, ...snapshot }));
    setDirty(true);
  }

  function handleEditorReady(nextEditor: Editor | null) {
    editorRef.current = nextEditor;
    setEditor(nextEditor);

    if (nextEditor) {
      editorSnapshotRef.current = makeEditorSnapshot(nextEditor);
    }
  }

  function selectManuscript(manuscriptId: string) {
    if (dirty && !window.confirm("저장하지 않은 변경을 버리고 이동할까요?")) {
      return;
    }

    const manuscript = manuscripts.find((item) => item.id === manuscriptId);
    if (!manuscript) {
      return;
    }

    setSelectedId(manuscriptId);
    setDraft(makeDraft(manuscript, nextChapterNumber));
    setSettings(parseEditorSettings(manuscript.editorSettings));
    setDirty(false);
    setEditor(null);
    setLastSavedAt(null);
    router.replace(`${basePath}/write?manuscriptId=${manuscriptId}`, {
      scroll: false,
    });
  }

  async function persistDraft() {
    const title = draft.title.trim();

    if (!title) {
      throw new Error("챕터 제목을 입력해 주세요.");
    }

    const liveEditor = editorRef.current ?? editor;
    const editorSnapshot = liveEditor
      ? makeEditorSnapshot(liveEditor)
      : editorSnapshotRef.current;
    const body = editorSnapshot?.body ?? draft.body;
    const contentHtml = editorSnapshot?.contentHtml ?? draft.contentHtml;
    const contentJson = editorSnapshot?.contentJson ?? draft.contentJson;
    const saved = await saveWritingManuscript({
      projectId,
      manuscriptId: draft.manuscriptId,
      chapterNumber: draft.chapterNumber,
      title,
      body,
      contentHtml,
      contentJson,
      editorSettings: JSON.stringify(settings),
      memo: draft.memo,
    });

    setSelectedId(saved.manuscriptId);
    setDraft((current) => ({
      ...current,
      body,
      contentHtml,
      contentJson,
      manuscriptId: saved.manuscriptId,
      title,
    }));
    setDirty(false);
    setLastSavedAt(saved.updatedAt);
    router.replace(`${basePath}/write?manuscriptId=${saved.manuscriptId}`, {
      scroll: false,
    });
    router.refresh();

    return saved.manuscriptId;
  }

  async function handleSave() {
    try {
      setBusy("save");
      await persistDraft();
    } finally {
      setBusy(null);
    }
  }

  async function handleCreateChapter() {
    if (dirty && !window.confirm("현재 변경 사항을 저장하지 않고 새 챕터를 만들까요?")) {
      return;
    }

    try {
      setOpenMenu(null);
      setBusy("new");
      const result = await createBlankManuscript(projectId);
      setSelectedId(result.manuscriptId);
      setDirty(false);
      setEditor(null);
      router.replace(`${basePath}/write?manuscriptId=${result.manuscriptId}`, {
        scroll: false,
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleDeleteChapter() {
    if (!draft.manuscriptId || !window.confirm("이 챕터를 삭제할까요?")) {
      return;
    }

    try {
      setOpenMenu(null);
      setBusy("delete");
      const result = await deleteWritingManuscript({
        projectId,
        manuscriptId: draft.manuscriptId,
      });

      setSelectedId(result.nextManuscriptId);
      setDirty(false);
      setEditor(null);
      router.replace(
        result.nextManuscriptId
          ? `${basePath}/write?manuscriptId=${result.nextManuscriptId}`
          : `${basePath}/write`,
        { scroll: false },
      );
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleAnalyzeChapter() {
    try {
      setBusy("chapter");
      const manuscriptId = await persistDraft();
      await analyzeChapterFromWorkspace({ projectId, manuscriptId });
      router.push(`${basePath}/analysis`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleAnalyzeProject() {
    try {
      setBusy("project");
      await persistDraft();
      await analyzeProjectFromWorkspace(projectId);
      router.push(`${basePath}/analysis`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const commandBar = (
    <header className="mb-4 rounded-2xl border border-[var(--line)] bg-white px-3 py-3 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent)]">
            집필 작업공간
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-bold text-[#1d2320]">
              {draft.title || "새 챕터"}
            </h1>
            <span className="rounded-full bg-[#eef2ef] px-2 py-1 text-xs font-semibold text-[#58615c]">
              {layoutLabels[layoutMode]}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CommandMenuButton
            label="프로젝트"
            menu="project"
            onToggle={setOpenMenu}
            openMenu={openMenu}
          >
            <MenuItem onClick={() => router.push(basePath)}>개요 열기</MenuItem>
            <MenuItem onClick={() => router.push(`${basePath}/analysis`)}>
              분석 리포트
            </MenuItem>
            <MenuItem onClick={() => router.push(`${basePath}/settings`)}>
              프로젝트 설정
            </MenuItem>
          </CommandMenuButton>

          <CommandMenuButton
            label="챕터"
            menu="chapters"
            onToggle={setOpenMenu}
            openMenu={openMenu}
          >
            <MenuItem
              icon={<PanelLeft aria-hidden="true" className="h-4 w-4" />}
              onClick={() => {
                setCompanionView("chapters");
                setLayoutModeState("splitLeft");
                setOpenMenu(null);
              }}
            >
              챕터 패널 열기
            </MenuItem>
            {manuscripts.map((chapter) => (
              <MenuItem
                active={chapter.id === selectedId}
                key={chapter.id}
                onClick={() => {
                  selectManuscript(chapter.id);
                  setOpenMenu(null);
                }}
              >
                {chapter.chapterNumber}장 · {chapter.title}
              </MenuItem>
            ))}
            <MenuDivider />
            <MenuItem
              icon={<FilePlus2 aria-hidden="true" className="h-4 w-4" />}
              onClick={handleCreateChapter}
            >
              새 챕터 만들기
            </MenuItem>
            <MenuItem
              danger
              disabled={!draft.manuscriptId}
              icon={<Trash2 aria-hidden="true" className="h-4 w-4" />}
              onClick={handleDeleteChapter}
            >
              현재 챕터 삭제
            </MenuItem>
          </CommandMenuButton>

          <CommandMenuButton
            label="자료"
            menu="reference"
            onToggle={setOpenMenu}
            openMenu={openMenu}
          >
            <MenuItem
              active={companionView === "timeline"}
              icon={<Map aria-hidden="true" className="h-4 w-4" />}
              onClick={() => setCompanionView("timeline")}
            >
              타임라인
            </MenuItem>
            <MenuItem
              active={companionView === "storyline"}
              icon={<Network aria-hidden="true" className="h-4 w-4" />}
              onClick={() => setCompanionView("storyline")}
            >
              스토리라인
            </MenuItem>
            <MenuItem
              active={companionView === "characters"}
              icon={<Users aria-hidden="true" className="h-4 w-4" />}
              onClick={() => setCompanionView("characters")}
            >
              등장인물
            </MenuItem>
            <MenuItem
              active={companionView === "plot"}
              icon={<ScrollText aria-hidden="true" className="h-4 w-4" />}
              onClick={() => setCompanionView("plot")}
            >
              플롯
            </MenuItem>
            <MenuItem
              active={companionView === "insight"}
              icon={<Sparkles aria-hidden="true" className="h-4 w-4" />}
              onClick={() => setCompanionView("insight")}
            >
              AI 인사이트
            </MenuItem>
            <MenuDivider />
            <MenuItem
              active={companionView === "settings"}
              icon={<SlidersHorizontal aria-hidden="true" className="h-4 w-4" />}
              onClick={() => setCompanionView("settings")}
            >
              문서 설정
            </MenuItem>
            <MenuItem
              active={companionView === "memo"}
              icon={<StickyNote aria-hidden="true" className="h-4 w-4" />}
              onClick={() => setCompanionView("memo")}
            >
              메모
            </MenuItem>
          </CommandMenuButton>

          <CommandMenuButton
            label="보기"
            menu="view"
            onToggle={setOpenMenu}
            openMenu={openMenu}
          >
            <MenuItem
              active={layoutMode === "draft"}
              icon={<BookOpen aria-hidden="true" className="h-4 w-4" />}
              onClick={() => setLayoutMode("draft")}
            >
              원고만
            </MenuItem>
            <MenuItem
              active={layoutMode === "splitLeft"}
              icon={<PanelLeft aria-hidden="true" className="h-4 w-4" />}
              onClick={() => setLayoutMode("splitLeft")}
            >
              왼쪽 자료 + 원고
            </MenuItem>
            <MenuItem
              active={layoutMode === "splitRight"}
              icon={<PanelRight aria-hidden="true" className="h-4 w-4" />}
              onClick={() => setLayoutMode("splitRight")}
            >
              원고 + 오른쪽 자료
            </MenuItem>
            <MenuDivider />
            <MenuItem
              icon={<ArrowLeftRight aria-hidden="true" className="h-4 w-4" />}
              onClick={() => {
                setCompanionPercent(50);
                setOpenMenu(null);
              }}
            >
              1:1로 나누기
            </MenuItem>
            <MenuItem
              icon={<Focus aria-hidden="true" className="h-4 w-4" />}
              onClick={() => {
                setFocusMode(true);
                setOpenMenu(null);
              }}
            >
              집중 모드
            </MenuItem>
          </CommandMenuButton>

          <CommandMenuButton
            label="분석"
            menu="analysis"
            onToggle={setOpenMenu}
            openMenu={openMenu}
            primary
          >
            <MenuItem
              icon={<Sparkles aria-hidden="true" className="h-4 w-4" />}
              onClick={handleAnalyzeChapter}
            >
              현재 챕터 분석
            </MenuItem>
            <MenuItem
              icon={<BarChart3 aria-hidden="true" className="h-4 w-4" />}
              onClick={handleAnalyzeProject}
            >
              전체 프로젝트 분석
            </MenuItem>
            <MenuDivider />
            <MenuItem onClick={() => router.push(`${basePath}/analysis`)}>
              최신 리포트 보기
            </MenuItem>
          </CommandMenuButton>

          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold transition hover:border-[#9aa6a0] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy !== null}
            onClick={handleSave}
            type="button"
          >
            <Save aria-hidden="true" className="h-4 w-4" />
            {busy === "save" ? "저장 중" : "저장"}
          </button>
        </div>
      </div>
    </header>
  );

  const editorPanel = (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
      <EditorToolbar busy={busy} editor={editor} />

      <div className="border-b border-[var(--line)] px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--accent)]">쓰기</p>
            <input
              className="mt-1 w-full border-0 bg-transparent p-0 text-2xl font-bold outline-none"
              maxLength={160}
              onChange={(event) => updateDraft({ title: event.target.value })}
              value={draft.title}
            />
          </div>
          <SaveStatusBadge status={saveStatus} />
        </div>
      </div>

      <div className={settings.typewriterMode ? "story-typewriter-mode" : ""}>
        <RichManuscriptEditor
          initialContent={initialContent}
          key={draft.manuscriptId ?? "new"}
          onChange={handleEditorChange}
          onEditorReady={handleEditorReady}
          onEscapeFocusMode={() => setFocusMode(false)}
          onSaveShortcut={handleSave}
          settings={settings}
        />
      </div>

      <WritingStatsBar
        characterCount={characterCount}
        paragraphCount={paragraphCount}
        showCharacterCount={settings.showCharacterCount}
      />
    </section>
  );

  if (focusMode) {
    return (
      <FocusModeShell onExit={() => setFocusMode(false)}>{editorPanel}</FocusModeShell>
    );
  }

  const companionPanel = showCompanion ? (
    <CompanionPanel
      busy={busy}
      characterCount={characterCount}
      companionView={companionView}
      dirty={dirty}
      draft={draft}
      insight={insight}
      lastSavedAt={lastSavedAt}
      manuscripts={manuscripts}
      onCreateChapter={handleCreateChapter}
      onDeleteChapter={handleDeleteChapter}
      onMemoChange={(memo) => updateDraft({ memo })}
      onSelectChapter={selectManuscript}
      onSettingsChange={updateSettings}
      onViewChange={setCompanionView}
      paragraphCount={paragraphCount}
      selectedId={selectedId}
      selectedManuscript={selectedManuscript}
      settings={settings}
    />
  ) : null;
  const companionStyle = { flexBasis: `${companionPercent}%` };
  const editorStyle = showCompanion
    ? { flexBasis: `${100 - companionPercent}%` }
    : undefined;
  const splitHandle = showCompanion ? (
    <SplitHandle onPointerDown={() => setDraggingSplit(true)} />
  ) : null;

  return (
    <div className="min-h-[calc(100vh-32px)]">
      {commandBar}

      <div
        className={clsx(
          "flex flex-col gap-3",
          showCompanion && "xl:flex-row xl:items-stretch",
        )}
        ref={splitRef}
      >
        {layoutMode === "splitLeft" && companionPanel ? (
          <div className="min-w-0 xl:min-w-[280px]" style={companionStyle}>
            {companionPanel}
          </div>
        ) : null}

        {layoutMode === "splitLeft" ? splitHandle : null}

        <div className="min-w-0 flex-1" style={editorStyle}>
          {editorPanel}
        </div>

        {layoutMode === "splitRight" ? splitHandle : null}

        {layoutMode === "splitRight" && companionPanel ? (
          <div className="min-w-0 xl:min-w-[280px]" style={companionStyle}>
            {companionPanel}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SplitHandle({ onPointerDown }: { onPointerDown: () => void }) {
  return (
    <button
      aria-label="분할 창 크기 조절"
      className="hidden w-3 cursor-col-resize items-center justify-center rounded-full transition hover:bg-[#dfe8e3] xl:flex"
      onPointerDown={onPointerDown}
      type="button"
    >
      <span className="h-12 w-1 rounded-full bg-[#c8d2cd]" />
    </button>
  );
}

function CompanionPanel({
  busy,
  characterCount,
  companionView,
  dirty,
  draft,
  insight,
  lastSavedAt,
  manuscripts,
  onCreateChapter,
  onDeleteChapter,
  onMemoChange,
  onSelectChapter,
  onSettingsChange,
  onViewChange,
  paragraphCount,
  selectedId,
  selectedManuscript,
  settings,
}: {
  busy: BusyState;
  characterCount: number;
  companionView: CompanionView;
  dirty: boolean;
  draft: Draft;
  insight: StoryInsightData | null;
  lastSavedAt: string | null;
  manuscripts: WritingManuscript[];
  onCreateChapter: () => void;
  onDeleteChapter: () => void;
  onMemoChange: (memo: string) => void;
  onSelectChapter: (manuscriptId: string) => void;
  onSettingsChange: (settings: EditorSettings) => void;
  onViewChange: (view: CompanionView) => void;
  paragraphCount: number;
  selectedId: string | null;
  selectedManuscript: WritingManuscript | null;
  settings: EditorSettings;
}) {
  return (
    <aside className="h-full min-h-[720px] overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
      <div className="border-b border-[var(--line)] p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent)]">
          보조 창
        </p>
        <h2 className="mt-1 text-lg font-bold">{companionLabels[companionView]}</h2>
        <CompanionTabs activeView={companionView} onViewChange={onViewChange} />
      </div>

      <div className="max-h-[calc(100vh-190px)] overflow-auto p-4">
        {companionView === "timeline" ? (
          <TimelineReferencePanel insight={insight} />
        ) : companionView === "storyline" ? (
          <StorylineReferencePanel insight={insight} />
        ) : companionView === "characters" ? (
          <CharacterReferencePanel insight={insight} />
        ) : companionView === "plot" ? (
          <PlotReferencePanel insight={insight} />
        ) : companionView === "chapters" ? (
          <ChapterReferencePanel
            busy={busy !== null}
            chapters={manuscripts}
            onCreateChapter={onCreateChapter}
            onSelectChapter={onSelectChapter}
            selectedId={selectedId}
          />
        ) : companionView === "insight" ? (
          <StoryInsightPanel insight={insight} />
        ) : companionView === "settings" ? (
          <EditorSettingsPanel onChange={onSettingsChange} settings={settings} />
        ) : (
          <ChapterMemoPanel
            busy={busy}
            characterCount={characterCount}
            dirty={dirty}
            draft={draft}
            lastSavedAt={lastSavedAt}
            manuscriptCount={manuscripts.length}
            onDeleteChapter={onDeleteChapter}
            onMemoChange={onMemoChange}
            paragraphCount={paragraphCount}
            selectedManuscript={selectedManuscript}
          />
        )}
      </div>
    </aside>
  );
}

function CompanionTabs({
  activeView,
  onViewChange,
}: {
  activeView: CompanionView;
  onViewChange: (view: CompanionView) => void;
}) {
  const tabs: Array<{ label: string; value: CompanionView }> = [
    { label: "타임라인", value: "timeline" },
    { label: "인물", value: "characters" },
    { label: "플롯", value: "plot" },
    { label: "챕터", value: "chapters" },
    { label: "설정", value: "settings" },
  ];

  return (
    <div className="mt-3 flex gap-1 overflow-x-auto rounded-md bg-[#eef2ef] p-1 text-sm font-semibold">
      {tabs.map((tab) => (
        <button
          className={clsx(
            "shrink-0 rounded px-3 py-2",
            activeView === tab.value
              ? "bg-white text-[#17484b] shadow-sm"
              : "text-[#58615c]",
          )}
          key={tab.value}
          onClick={() => onViewChange(tab.value)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function TimelineReferencePanel({ insight }: { insight: StoryInsightData | null }) {
  if (!insight || insight.timeline.length === 0) {
    return <ReferenceEmptyState message="분석 후 사건 타임라인이 여기에 표시됩니다." />;
  }

  return (
    <div className="space-y-3">
      {insight.timeline.map((event) => (
        <article className="rounded-lg border border-[var(--line)] bg-[#f7f9f7] p-4" key={event.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[var(--accent)]">
                시간 {event.chronologicalOrder} · 서술 {event.narrativeOrder}
              </p>
              <h3 className="mt-1 font-bold">{event.title}</h3>
            </div>
            <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-[#58615c]">
              {Math.round(event.confidence * 100)}%
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#4c5852]">{event.description}</p>
          <dl className="mt-3 grid gap-2 text-xs text-[var(--muted)]">
            <ReferenceMeta label="시간" value={event.estimatedTimeLabel} />
            <ReferenceMeta label="장소" value={event.location} />
            <ReferenceMeta label="인물" value={event.characters.join(", ")} />
          </dl>
        </article>
      ))}
    </div>
  );
}

function StorylineReferencePanel({ insight }: { insight: StoryInsightData | null }) {
  if (!insight || insight.beats.length === 0) {
    return <ReferenceEmptyState message="분석 후 스토리라인이 여기에 표시됩니다." />;
  }

  return (
    <div className="space-y-3">
      {insight.beats.map((beat, index) => (
        <article className="rounded-lg border border-[var(--line)] bg-[#f7f9f7] p-4" key={beat.id}>
          <p className="text-xs font-bold text-[var(--accent)]">
            비트 {index + 1} · {beat.sourceChapterTitle ?? "출처 미상"}
          </p>
          <h3 className="mt-1 font-bold">{beat.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#4c5852]">{beat.summary}</p>
        </article>
      ))}
    </div>
  );
}

function CharacterReferencePanel({ insight }: { insight: StoryInsightData | null }) {
  if (!insight || insight.characters.length === 0) {
    return <ReferenceEmptyState message="분석 후 캐릭터 컨셉이 여기에 표시됩니다." />;
  }

  return (
    <div className="space-y-3">
      {insight.characters.map((character) => (
        <details className="rounded-lg border border-[var(--line)] bg-white p-3" key={character.id}>
          <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold">{character.name}</h3>
                <span className="rounded-full bg-[#eef2ef] px-2 py-1 text-xs font-semibold text-[#58615c]">
                  {roleLabels[character.role] ?? character.role}
                </span>
              </div>
              <p className="mt-2 line-clamp-1 text-sm text-[#4c5852]">
                {character.arcSummary || character.desire}
              </p>
            </div>
            <div className="w-16">
              <p className="text-right text-xs font-bold text-[var(--accent)]">
                {character.importanceScore}
              </p>
              <div className="mt-2 h-2 rounded-full bg-[#e6ebe8]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{
                    width: `${Math.min(100, Math.max(0, character.importanceScore))}%`,
                  }}
                />
              </div>
            </div>
          </summary>
          <div className="mt-3 grid gap-2 text-sm leading-6 text-[#4c5852]">
            {character.desire ? <p>욕망: {character.desire}</p> : null}
            {character.arcSummary ? <p>아크: {character.arcSummary}</p> : null}
          </div>
        </details>
      ))}
    </div>
  );
}

function PlotReferencePanel({ insight }: { insight: StoryInsightData | null }) {
  if (!insight || insight.beats.length === 0) {
    return <ReferenceEmptyState message="분석 후 플롯 흐름과 갈등 단서가 여기에 표시됩니다." />;
  }

  return (
    <div className="space-y-3">
      {insight.beats.map((beat, index) => (
        <article className="rounded-lg border border-[var(--line)] bg-white p-4" key={beat.id}>
          <p className="text-xs font-bold text-[var(--accent)]">플롯 단계 {index + 1}</p>
          <h3 className="mt-1 font-bold">{beat.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#4c5852]">{beat.summary}</p>
          {beat.conflict ? (
            <p className="mt-3 rounded-md bg-[#f7f9f7] p-3 text-xs leading-5 text-[#4c5852]">
              갈등: {beat.conflict}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function ChapterReferencePanel({
  busy,
  chapters,
  onCreateChapter,
  onSelectChapter,
  selectedId,
}: {
  busy: boolean;
  chapters: WritingManuscript[];
  onCreateChapter: () => void;
  onSelectChapter: (manuscriptId: string) => void;
  selectedId: string | null;
}) {
  return (
    <div className="space-y-3">
      <button
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white text-sm font-semibold transition hover:border-[#9aa6a0]"
        disabled={busy}
        onClick={onCreateChapter}
        type="button"
      >
        <FilePlus2 aria-hidden="true" className="h-4 w-4" />
        새 챕터
      </button>
      {chapters.map((chapter) => (
        <button
          className={clsx(
            "w-full rounded-lg border px-3 py-3 text-left transition",
            chapter.id === selectedId
              ? "border-[#9cc2bc] bg-[#eef7f4]"
              : "border-[var(--line)] bg-white hover:border-[#b7c5bf]",
          )}
          key={chapter.id}
          onClick={() => onSelectChapter(chapter.id)}
          type="button"
        >
          <span className="block text-xs font-bold text-[var(--accent)]">
            {chapter.chapterNumber}장
          </span>
          <span className="mt-1 block truncate text-sm font-semibold">
            {chapter.title}
          </span>
          <span className="mt-1 block text-xs text-[var(--muted)]">
            {formatNumber(countCharacters(chapter.body))}자
          </span>
        </button>
      ))}
    </div>
  );
}

function ReferenceMeta({ label, value }: { label: string; value: string }) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-bold text-[#34413b]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ReferenceEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#cbd4cf] bg-[#f7f9f7] p-6 text-sm leading-6 text-[var(--muted)]">
      {message}
    </div>
  );
}

function CommandMenuButton({
  children,
  label,
  menu,
  onToggle,
  openMenu,
  primary = false,
}: {
  children: ReactNode;
  label: string;
  menu: Exclude<CommandMenu, null>;
  onToggle: (menu: CommandMenu) => void;
  openMenu: CommandMenu;
  primary?: boolean;
}) {
  const open = openMenu === menu;

  return (
    <div className="relative">
      <button
        className={clsx(
          "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition",
          primary
            ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]"
            : "border border-[var(--line)] bg-white text-[#25302b] hover:border-[#9aa6a0]",
        )}
        onClick={() => onToggle(open ? null : menu)}
        type="button"
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={clsx("h-4 w-4 transition", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-[var(--line)] bg-white p-2 shadow-xl">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  active = false,
  children,
  danger = false,
  disabled = false,
  icon,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={clsx(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
        active && "bg-[#eef7f4] text-[var(--accent-strong)]",
        danger
          ? "text-[var(--danger)] hover:bg-[#fff5f5]"
          : "text-[#34413b] hover:bg-[#f4f7f5]",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}

function MenuDivider() {
  return <div className="my-2 h-px bg-[var(--line)]" />;
}

function ChapterMemoPanel({
  busy,
  characterCount,
  dirty,
  draft,
  lastSavedAt,
  manuscriptCount,
  onDeleteChapter,
  onMemoChange,
  paragraphCount,
  selectedManuscript,
}: {
  busy: BusyState;
  characterCount: number;
  dirty: boolean;
  draft: Draft;
  lastSavedAt: string | null;
  manuscriptCount: number;
  onDeleteChapter: () => void;
  onMemoChange: (memo: string) => void;
  paragraphCount: number;
  selectedManuscript: WritingManuscript | null;
}) {
  return (
    <>
      <section className="rounded-lg border border-[var(--line)] bg-[#f7f9f7] p-4">
        <h2 className="font-bold">작업 상태</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Stat label="글자 수" value={formatNumber(characterCount)} />
          <Stat label="문단" value={formatNumber(paragraphCount)} />
          <Stat label="챕터" value={formatNumber(manuscriptCount)} />
          <Stat label="상태" value={dirty ? "수정 중" : "저장됨"} />
        </dl>
        <p className="mt-3 text-xs text-[var(--muted)]">
          {lastSavedAt
            ? `마지막 저장 ${formatSavedAt(lastSavedAt)}`
            : selectedManuscript
              ? `마지막 저장 ${formatSavedAt(selectedManuscript.updatedAt)}`
              : "새 원고"}
        </p>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-[#f7f9f7] p-4">
        <h2 className="font-bold">챕터 메모</h2>
        <textarea
          className="mt-3 min-h-36 w-full rounded-md border border-[var(--line)] bg-white p-3 text-sm leading-6 outline-none focus:border-[var(--accent)]"
          onChange={(event) => onMemoChange(event.target.value)}
          value={draft.memo}
        />
      </section>

      <section className="rounded-lg border border-[#e2b9b9] bg-white p-4">
        <h2 className="font-bold text-[var(--danger)]">챕터 삭제</h2>
        <button
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#e2b9b9] bg-white px-4 text-sm font-semibold text-[var(--danger)] transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:text-[#b89191]"
          disabled={busy !== null || !draft.manuscriptId}
          onClick={onDeleteChapter}
          type="button"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          {busy === "delete" ? "삭제 중" : "삭제"}
        </button>
      </section>
    </>
  );
}

function makeDraft(
  manuscript: WritingManuscript | null,
  nextChapterNumber: number,
): Draft {
  const contentHtml = manuscript?.contentHtml ?? plainTextToHtml(manuscript?.body ?? "");
  const contentJson = manuscript?.contentJson ?? "";

  return {
    body: manuscript?.body ?? "",
    chapterNumber: manuscript?.chapterNumber ?? nextChapterNumber,
    contentHtml,
    contentJson,
    manuscriptId: manuscript?.id ?? null,
    memo: manuscript?.memo ?? "",
    title: manuscript?.title ?? `${nextChapterNumber}장 초안`,
  };
}

function getInitialEditorContent(draft: Draft): JSONContent | string {
  if (draft.contentJson) {
    try {
      return JSON.parse(draft.contentJson) as JSONContent;
    } catch {
      return draft.contentHtml;
    }
  }

  return draft.contentHtml;
}

function makeEditorSnapshot(editor: Editor): RichEditorSnapshot {
  return {
    body: editor.getText(),
    contentHtml: editor.getHTML(),
    contentJson: JSON.stringify(editor.getJSON()),
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <dt className="text-xs font-bold text-[#6b746f]">{label}</dt>
      <dd className="mt-1 font-semibold text-[#25302b]">{value}</dd>
    </div>
  );
}

function plainTextToHtml(value: string) {
  const paragraphs = value
    .split(/\r?\n\s*\r?\n|\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return "<p></p>";
  }

  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatSavedAt(value: string) {
  const date = new Date(value);
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const year = String(kst.getUTCFullYear()).slice(2);
  const month = kst.getUTCMonth() + 1;
  const day = kst.getUTCDate();
  const hour = String(kst.getUTCHours()).padStart(2, "0");
  const minute = String(kst.getUTCMinutes()).padStart(2, "0");

  return `${year}. ${month}. ${day}. ${hour}:${minute}`;
}

function isLayoutMode(value: string | null): value is LayoutMode {
  return value === "draft" || value === "splitLeft" || value === "splitRight";
}

function isCompanionView(value: string | null): value is CompanionView {
  return (
    value === "timeline" ||
    value === "storyline" ||
    value === "characters" ||
    value === "plot" ||
    value === "chapters" ||
    value === "insight" ||
    value === "settings" ||
    value === "memo"
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
