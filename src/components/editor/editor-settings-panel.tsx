import type { EditorSettings } from "@/lib/editor-settings";
import { SettingSlider } from "./setting-slider";
import { SettingToggle } from "./setting-toggle";

const fontOptions = [
  { label: "기본", value: "system" },
  { label: "명조", value: "serif" },
  { label: "고딕", value: "sans" },
  { label: "모노", value: "mono" },
] as const;

export function EditorSettingsPanel({
  onChange,
  settings,
}: {
  onChange: (settings: EditorSettings) => void;
  settings: EditorSettings;
}) {
  function update(next: Partial<EditorSettings>) {
    onChange({ ...settings, ...next });
  }

  return (
    <div className="space-y-3">
      <label className="block rounded-md bg-[#f7f9f7] p-3">
        <span className="text-sm font-semibold text-[#34413b]">글꼴</span>
        <select
          className="mt-2 h-10 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
          onChange={(event) =>
            update({ fontFamily: event.target.value as EditorSettings["fontFamily"] })
          }
          value={settings.fontFamily}
        >
          {fontOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <SettingSlider
        label="글자 크기"
        max={22}
        min={14}
        onChange={(fontSize) => update({ fontSize })}
        suffix="px"
        value={settings.fontSize}
      />
      <SettingSlider
        label="문서 폭"
        max={920}
        min={620}
        onChange={(documentWidth) => update({ documentWidth })}
        suffix="px"
        value={settings.documentWidth}
      />
      <SettingSlider
        label="줄 간격"
        max={2.2}
        min={1.4}
        onChange={(lineHeight) => update({ lineHeight })}
        step={0.1}
        value={settings.lineHeight}
      />
      <SettingSlider
        label="문단 간격"
        max={28}
        min={0}
        onChange={(paragraphSpacing) => update({ paragraphSpacing })}
        suffix="px"
        value={settings.paragraphSpacing}
      />
      <SettingToggle
        checked={settings.smartQuotes}
        label="스마트 따옴표"
        onChange={(smartQuotes) => update({ smartQuotes })}
      />
      <SettingToggle
        checked={settings.typewriterMode}
        label="타이프리더 모드"
        onChange={(typewriterMode) => update({ typewriterMode })}
      />
      <SettingToggle
        checked={settings.showCharacterCount}
        label="글자 수 표시"
        onChange={(showCharacterCount) => update({ showCharacterCount })}
      />
    </div>
  );
}
