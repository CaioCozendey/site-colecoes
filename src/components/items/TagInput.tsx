import { useState, type KeyboardEvent } from "react";
import { normalizeTag } from "../../lib/utils";
import { inputCls } from "../../lib/ui";

export default function TagInput({
  value,
  onChange,
  suggestions = [],
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}) {
  const [text, setText] = useState("");

  const add = (raw: string) => {
    const t = normalizeTag(raw);
    if (t && !value.includes(t)) onChange([...value, t]);
    setText("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(text);
    } else if (e.key === "Backspace" && !text && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => text && add(text)}
        list="tag-suggestions"
        className={inputCls}
        placeholder="Digite e pressione Enter (ex: prata, imperio)"
      />
      <datalist id="tag-suggestions">
        {suggestions.filter((s) => !value.includes(s)).map((s) => <option key={s} value={s} />)}
      </datalist>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {value.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
              #{t}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remover ${t}`}>
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
