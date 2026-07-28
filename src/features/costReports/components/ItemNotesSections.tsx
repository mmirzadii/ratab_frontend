import { useState } from "react";

import type { PricebookItemDetail } from "../../pricebooks/pricebookApi";
import { classNames } from "../../../shared/utils/classNames";
import type { FootnoteInputErrors, FootnoteInputValues, TouchedFootnoteInputs } from "../costReportUtils";

export function ReadableNotesSection({
  notes,
  title
}: {
  notes: PricebookItemDetail["requirements"];
  title: string;
}) {
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});

  if (notes.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-base font-black text-white light:text-slate-950">{title}</h3>
      <div className="mt-3 space-y-2">
        {notes.map((note) => (
          <article
            className="rounded-lg border border-white/10 bg-white/7 p-4 text-sm leading-7 text-slate-300 light:border-slate-200 light:bg-slate-50 light:text-slate-700"
            key={note.id}
          >
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-black text-slate-100 light:text-slate-900">{note.title_fa}</h4>
              {note.affects_calculation ? (
                <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-100 light:text-amber-800">
                  اثرگذار در محاسبه
                </span>
              ) : null}
            </div>
            <p
              className={classNames(
                "mt-2 motion-safe:transition-all motion-safe:duration-150",
                !expandedNotes[note.id] &&
                  "overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]"
              )}
            >
              {note.body_fa}
            </p>
            <button
              className="mt-1 text-xs font-bold text-success-300 transition hover:text-success-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-400/60 light:text-success-600 light:hover:text-success-700"
              onClick={() =>
                setExpandedNotes((current) => ({
                  ...current,
                  [note.id]: !current[note.id]
                }))
              }
              type="button"
            >
              {expandedNotes[note.id] ? "کمتر" : "بیشتر ..."}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ChecklistNotesSection({
  disabled,
  notes,
  inputErrors,
  inputValues,
  onInputBlur,
  onInputChange,
  onToggle,
  selectedNotes,
  touchedInputs
}: {
  disabled: boolean;
  notes: PricebookItemDetail["footnotes"];
  inputErrors: FootnoteInputErrors;
  inputValues: FootnoteInputValues;
  onInputBlur: (noteCode: string, inputName: string) => void;
  onInputChange: (noteCode: string, inputName: string, value: string) => void;
  onToggle: (noteCode: string, checked: boolean) => void;
  selectedNotes: Record<string, boolean>;
  touchedInputs: TouchedFootnoteInputs;
}) {
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});

  if (notes.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-base font-black text-white light:text-slate-950">تبصره‌ها</h3>
      <p className="mt-2 text-xs leading-6 text-slate-400 light:text-slate-500">
        تبصره‌هایی را که برای این محاسبه برقرار هستند علامت بزنید.
      </p>
      <div className="mt-3 space-y-2">
        {notes.map((note, index) => (
          <article
            className={classNames(
              "rounded-lg border border-white/10 bg-white/7 p-4 text-sm leading-7 text-slate-300 light:border-slate-200 light:bg-slate-50 light:text-slate-700",
              disabled && "opacity-75"
            )}
            key={note.id}
          >
            <label className="flex items-start gap-3">
              <input
                checked={Boolean(selectedNotes[note.note_code])}
                className="mt-2 h-4 w-4 accent-emerald-300"
                disabled={disabled}
                onChange={(event) => onToggle(note.note_code, event.target.checked)}
                type="checkbox"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-black text-slate-100 light:text-slate-900">
                  تبصره {index + 1}: {note.checkbox_text_fa || note.title_fa}
                </span>
                <span
                  className={classNames(
                    "mt-1 block motion-safe:transition-all motion-safe:duration-150",
                    !expandedNotes[note.id] &&
                      "overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]"
                  )}
                >
                  {note.body_fa}
                </span>
              </span>
            </label>
            {selectedNotes[note.note_code] && note.requires_input ? (
              <div className="mr-7 mt-2 grid max-w-xs gap-2">
                {(note.inputs ?? []).map((input) => {
                  const error = touchedInputs[note.note_code]?.[input.name]
                    ? inputErrors[note.note_code]?.[input.name]
                    : null;
                  return (
                    <label className="block min-w-0 text-xs" key={input.name}>
                      <span className="mb-1 block font-bold text-slate-300 light:text-slate-700">
                        {input.label_fa}{input.unit ? ` (${input.unit})` : ""}
                      </span>
                      <input
                        className={classNames(
                          "h-8 w-full rounded-md border bg-slate-950/45 px-2 text-left text-sm outline-none transition light:bg-white light:text-slate-950",
                          error
                            ? "border-rose-400/60 text-rose-100 light:border-rose-400"
                            : "border-white/10 text-slate-100 focus:border-emerald-300/45 light:border-slate-200"
                        )}
                        dir={input.type === "number" ? "ltr" : "rtl"}
                        disabled={disabled}
                        inputMode={input.type === "number" ? "decimal" : undefined}
                        onBlur={() => onInputBlur(note.note_code, input.name)}
                        onChange={(event) => onInputChange(note.note_code, input.name, event.target.value)}
                        type="text"
                        value={inputValues[note.note_code]?.[input.name] ?? ""}
                      />
                      {error ? <span className="mt-1 block text-rose-300 light:text-rose-700">{error}</span> : null}
                    </label>
                  );
                })}
              </div>
            ) : null}
            <button
              className="mt-2 text-xs font-bold text-success-300 transition hover:text-success-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-400/60 light:text-success-600 light:hover:text-success-700"
              onClick={() =>
                setExpandedNotes((current) => ({
                  ...current,
                  [note.id]: !current[note.id]
                }))
              }
              type="button"
            >
              {expandedNotes[note.id] ? "کمتر" : "بیشتر ..."}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
