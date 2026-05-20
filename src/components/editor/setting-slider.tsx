export function SettingSlider({
  label,
  max,
  min,
  onChange,
  step = 1,
  suffix = "",
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  suffix?: string;
  value: number;
}) {
  function handleValueChange(value: string) {
    onChange(Number(value));
  }

  return (
    <label className="block rounded-md bg-[#f7f9f7] p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-[#34413b]">{label}</span>
        <span className="text-xs font-bold text-[var(--accent)]">
          {value}
          {suffix}
        </span>
      </div>
      <input
        className="mt-3 w-full accent-[var(--accent)]"
        max={max}
        min={min}
        onChange={(event) => handleValueChange(event.target.value)}
        onInput={(event) => handleValueChange(event.currentTarget.value)}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}
