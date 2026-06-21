import { useCallback, useEffect, useRef, useState } from "react";
import { classNames } from "../../../shared/utils/classNames";

type CellPos = [row: number, col: number];

export function MiniSpreadsheet({
  headers,
  onChange,
  value
}: {
  headers: string[];
  onChange: (value: string[][]) => void;
  value: string[][];
}) {
  const [selected, setSelected] = useState<CellPos | null>(null);
  const [editing, setEditing] = useState<CellPos | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const rowCount = value.length;
  const colCount = headers.length;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  function commitEdit() {
    if (!editing) return;
    const [r, c] = editing;
    const next = value.map((row) => [...row]);
    while (next.length <= r) next.push(Array(colCount).fill(""));
    while (next[r].length <= c) next[r].push("");
    next[r][c] = editValue;
    onChange(next);
    setEditing(null);
    setEditValue("");
  }

  function startEdit(r: number, c: number, initial?: string) {
    setSelected([r, c]);
    setEditing([r, c]);
    setEditValue(initial ?? value[r]?.[c] ?? "");
  }

  function move(dr: number, dc: number) {
    commitEdit();
    const cur = selected ?? [0, 0];
    const nr = Math.max(0, Math.min(rowCount - 1, cur[0] + dr));
    const nc = Math.max(0, Math.min(colCount - 1, cur[1] + dc));
    setSelected([nr, nc]);
  }

  const handleContainerKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!selected) return;
      const [r, c] = selected;

      if (editing) {
        if (event.key === "Enter") {
          event.preventDefault();
          commitEdit();
          setSelected([Math.min(r + 1, rowCount - 1), c]);
        } else if (event.key === "Tab") {
          event.preventDefault();
          commitEdit();
          if (c < colCount - 1) setSelected([r, c + 1]);
          else setSelected([Math.min(r + 1, rowCount - 1), 0]);
        } else if (event.key === "Escape") {
          setEditing(null);
          setEditValue("");
        }
        return;
      }

      if (event.key === "ArrowUp") { event.preventDefault(); move(-1, 0); }
      else if (event.key === "ArrowDown") { event.preventDefault(); move(1, 0); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); move(0, -1); }
      else if (event.key === "ArrowRight") { event.preventDefault(); move(0, 1); }
      else if (event.key === "Enter") { event.preventDefault(); startEdit(r, c); }
      else if (event.key === "Tab") {
        event.preventDefault();
        if (c < colCount - 1) setSelected([r, c + 1]);
        else setSelected([Math.min(r + 1, rowCount - 1), 0]);
      } else if (event.key === "Delete" || event.key === "Backspace") {
        const next = value.map((row) => [...row]);
        while (next.length <= r) next.push(Array(colCount).fill(""));
        while (next[r].length <= c) next[r].push("");
        next[r][c] = "";
        onChange(next);
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        startEdit(r, c, event.key);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, editing, editValue, value, rowCount, colCount]
  );

  function handlePaste(event: React.ClipboardEvent) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    if (!text || !selected) return;

    const pastedRows = text.split(/\r?\n/).map((row) => row.split("\t"));
    const [startR, startC] = selected;
    const next = value.map((row) => [...row]);

    pastedRows.forEach((pastedRow, dr) => {
      const r = startR + dr;
      while (next.length <= r) next.push(Array(colCount).fill(""));
      pastedRow.forEach((cell, dc) => {
        const c = startC + dc;
        if (c < colCount) {
          while (next[r].length <= c) next[r].push("");
          next[r][c] = cell.trim();
        }
      });
    });

    onChange(next);
  }

  const cellVal = (r: number, c: number) => value[r]?.[c] ?? "";
  const isSelected = (r: number, c: number) =>
    selected !== null && selected[0] === r && selected[1] === c;
  const isEditing = (r: number, c: number) =>
    editing !== null && editing[0] === r && editing[1] === c;

  return (
    <div
      className="overflow-auto rounded-lg border border-white/10 light:border-slate-200"
      onKeyDown={handleContainerKeyDown}
      onPaste={handlePaste}
      ref={containerRef}
      tabIndex={0}
      dir="ltr"
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-10 border-b border-l border-white/10 bg-slate-900/60 px-2 py-2 text-center text-xs text-slate-500 light:border-slate-200 light:bg-slate-100">
              #
            </th>
            {headers.map((header, c) => (
              <th
                className="border-b border-l border-white/10 bg-slate-900/60 px-3 py-2 text-left text-xs font-bold text-slate-300 light:border-slate-200 light:bg-slate-100 light:text-slate-600"
                key={c}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {value.map((_, r) => (
            <tr key={r}>
              <td className="border-b border-l border-white/5 bg-slate-900/30 px-2 py-1 text-center text-xs text-slate-600 light:border-slate-100 light:bg-slate-50 light:text-slate-400">
                {r + 1}
              </td>
              {Array.from({ length: colCount }, (__, c) => (
                <td
                  className={classNames(
                    "relative border-b border-l border-white/5 p-0 light:border-slate-100",
                    isSelected(r, c)
                      ? "outline outline-2 outline-emerald-400 outline-offset-[-2px]"
                      : ""
                  )}
                  key={c}
                  onClick={() => setSelected([r, c])}
                  onDoubleClick={() => startEdit(r, c)}
                >
                  {isEditing(r, c) ? (
                    <input
                      className="absolute inset-0 w-full bg-slate-800 px-2 text-sm text-slate-100 outline-none light:bg-white light:text-slate-900"
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      ref={inputRef}
                      value={editValue}
                    />
                  ) : (
                    <span className="block px-2 py-1.5 text-slate-200 light:text-slate-800">
                      {cellVal(r, c)}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
