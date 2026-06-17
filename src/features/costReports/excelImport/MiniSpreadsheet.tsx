import { useCallback, useEffect, useRef, useState } from "react";

const ROWS = 30;
const COLS = 5;

function makeEmpty(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () => Array(cols).fill("") as string[]);
}

function ensureSize(data: string[][], rows: number, cols: number): string[][] {
  const out = makeEmpty(rows, cols);
  data.forEach((row, r) => {
    if (r < rows) {
      row.forEach((cell, c) => {
        if (c < cols) out[r][c] = cell;
      });
    }
  });
  return out;
}

export function MiniSpreadsheet({
  data,
  onChange
}: {
  data: string[][];
  onChange: (next: string[][]) => void;
}) {
  const rows = Math.max(ROWS, data.length + 5);
  const cols = Math.max(COLS, (data[0]?.length ?? 0) + 2);
  const cells = ensureSize(data, rows, cols);

  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const [editingVal, setEditingVal] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const commitEdit = useCallback(
    (r: number, c: number, val: string) => {
      const next = cells.map((row) => [...row]);
      next[r][c] = val;
      onChange(next);
    },
    [cells, onChange]
  );

  const startEdit = (r: number, c: number) => {
    setSel({ r, c });
    setEditingVal(cells[r][c]);
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing, sel]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) {
    if (e.key === "Tab") {
      e.preventDefault();
      commitEdit(r, c, editingVal);
      const nextC = c + 1 < cols ? c + 1 : c;
      setSel({ r, c: nextC });
      setEditingVal(cells[r][nextC]);
    } else if (e.key === "Enter") {
      e.preventDefault();
      commitEdit(r, c, editingVal);
      const nextR = r + 1 < rows ? r + 1 : r;
      setSel({ r: nextR, c });
      setEditingVal(cells[nextR][c]);
    } else if (e.key === "Escape") {
      setEditingVal(cells[r][c]);
      setIsEditing(false);
    } else if (e.key.startsWith("Arrow")) {
      commitEdit(r, c, editingVal);
      setIsEditing(false);
      const dr = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
      const dc = e.key === "ArrowRight" ? -1 : e.key === "ArrowLeft" ? 1 : 0;
      setSel({ r: Math.max(0, Math.min(rows - 1, r + dr)), c: Math.max(0, Math.min(cols - 1, c + dc)) });
    }
  }

  function handleTableKeyDown(e: React.KeyboardEvent<HTMLTableElement>) {
    if (!sel || isEditing) return;
    const { r, c } = sel;
    if (e.key === "ArrowDown") { e.preventDefault(); setSel({ r: Math.min(rows - 1, r + 1), c }); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel({ r: Math.max(0, r - 1), c }); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setSel({ r, c: Math.min(cols - 1, c + 1) }); }
    else if (e.key === "ArrowRight") { e.preventDefault(); setSel({ r, c: Math.max(0, c - 1) }); }
    else if (e.key === "Enter" || e.key === "F2") { e.preventDefault(); startEdit(r, c); }
    else if (e.key === "Delete" || e.key === "Backspace") {
      commitEdit(r, c, "");
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      setEditingVal(e.key);
      setIsEditing(true);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    if (!sel) return;
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    const pastedRows = text.split(/\r?\n/).map((row) => row.split("\t"));
    const next = cells.map((row) => [...row]);
    pastedRows.forEach((pastedRow, dr) => {
      pastedRow.forEach((val, dc) => {
        const tr = sel.r + dr;
        const tc = sel.c + dc;
        if (tr < rows && tc < cols) next[tr][tc] = val;
      });
    });
    onChange(next);
    if (isEditing) setIsEditing(false);
  }

  const colHeaders = Array.from({ length: cols }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  return (
    <div className="overflow-auto rounded-lg border border-white/10 light:border-slate-200" dir="ltr">
      <table
        className="min-w-full border-collapse text-sm"
        onKeyDown={handleTableKeyDown}
        onPaste={handlePaste}
        ref={tableRef}
        tabIndex={0}
        style={{ outline: "none" }}
      >
        <thead>
          <tr>
            <th className="w-10 border-b border-r border-white/10 bg-slate-900/60 px-2 py-1 text-center text-xs text-slate-500 light:border-slate-200 light:bg-slate-100 light:text-slate-400" />
            {colHeaders.map((h) => (
              <th
                className="min-w-[100px] border-b border-r border-white/10 bg-slate-900/60 px-2 py-1 text-center text-xs font-bold text-slate-400 light:border-slate-200 light:bg-slate-100 light:text-slate-500"
                key={h}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              <td className="border-b border-r border-white/10 bg-slate-900/40 px-2 py-0.5 text-center text-xs text-slate-500 light:border-slate-200 light:bg-slate-50 light:text-slate-400">
                {r + 1}
              </td>
              {Array.from({ length: cols }, (_, c) => {
                const isSelected = sel?.r === r && sel?.c === c;
                const isActiveEdit = isSelected && isEditing;
                return (
                  <td
                    className={[
                      "relative border-b border-r border-white/10 p-0 light:border-slate-200",
                      isSelected && !isActiveEdit
                        ? "bg-emerald-400/15 ring-1 ring-inset ring-emerald-400/50"
                        : "hover:bg-white/5 light:hover:bg-slate-50"
                    ].join(" ")}
                    key={c}
                    onClick={() => {
                      if (isSelected) {
                        startEdit(r, c);
                      } else {
                        if (isEditing && sel) commitEdit(sel.r, sel.c, editingVal);
                        setSel({ r, c });
                        setIsEditing(false);
                      }
                    }}
                    onDoubleClick={() => startEdit(r, c)}
                  >
                    {isActiveEdit ? (
                      <input
                        className="absolute inset-0 w-full bg-emerald-950/70 px-2 py-0.5 text-sm text-slate-100 outline-none ring-1 ring-emerald-400 light:bg-emerald-50 light:text-slate-900"
                        onBlur={() => {
                          commitEdit(r, c, editingVal);
                          setIsEditing(false);
                        }}
                        onChange={(e) => setEditingVal(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, r, c)}
                        ref={inputRef}
                        type="text"
                        value={editingVal}
                      />
                    ) : (
                      <span className="block min-h-[24px] px-2 py-0.5 text-slate-200 light:text-slate-800">
                        {cells[r][c]}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
