import type { Unit } from "../geometry/types";

export function NumberField({
  label,
  value,
  step = 0.25,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        step={step}
        min={0}
        disabled={disabled}
        onChange={(event) => onChange(parseNumberFieldValue(event.target.value))}
      />
    </label>
  );
}

export function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="text" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function UnitSegment({ value, disabled = false, onChange }: { value: Unit; disabled?: boolean; onChange: (value: Unit) => void }) {
  return (
    <div className="segmented" role="group" aria-label="Units">
      <button type="button" className={value === "in" ? "active" : ""} disabled={disabled} onClick={() => onChange("in")}>
        in
      </button>
      <button type="button" className={value === "mm" ? "active" : ""} disabled={disabled} onClick={() => onChange("mm")}>
        mm
      </button>
    </div>
  );
}

function parseNumberFieldValue(value: string): number {
  return value.trim() === "" ? Number.NaN : Number(value);
}
