import { useState } from "react";

import type { PricebookItemDetail } from "../../pricebooks/pricebookApi";
import { classNames } from "../../../shared/utils/classNames";

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
                "mt-2",
                !expandedNotes[note.id] &&
                  "overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]"
              )}
            >
              {note.body_fa}
            </p>
            <button
              className="mt-1 text-xs font-bold text-emerald-200 transition hover:text-emerald-100 light:text-emerald-700 light:hover:text-emerald-900"
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
  onToggle,
  selectedNotes
}: {
  disabled: boolean;
  notes: PricebookItemDetail["footnotes"];
  onToggle: (noteId: number, checked: boolean) => void;
  selectedNotes: Record<number, boolean>;
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
                checked={Boolean(selectedNotes[note.id])}
                className="mt-2 h-4 w-4 accent-emerald-300"
                disabled={disabled}
                onChange={(event) => onToggle(note.id, event.target.checked)}
                type="checkbox"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-black text-slate-100 light:text-slate-900">
                  تبصره {index + 1}: {note.title_fa}
                </span>
                <span
                  className={classNames(
                    "mt-1 block",
                    !expandedNotes[note.id] &&
                      "overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]"
                  )}
                >
                  {note.body_fa}
                </span>
              </span>
            </label>
            <button
              className="mt-2 text-xs font-bold text-emerald-200 transition hover:text-emerald-100 light:text-emerald-700 light:hover:text-emerald-900"
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
