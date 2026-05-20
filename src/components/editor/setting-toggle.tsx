export function SettingToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md bg-[#f7f9f7] p-3 text-sm font-semibold text-[#34413b]">
      {label}
      <input
        checked={checked}
        className="h-4 w-4 accent-[var(--accent)]"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}
