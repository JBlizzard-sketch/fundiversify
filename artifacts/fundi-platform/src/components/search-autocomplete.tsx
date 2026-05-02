import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";

interface SearchAutocompleteProps {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  suggestions: string[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function SearchAutocomplete({
  value,
  onChange,
  onKeyDown,
  suggestions,
  placeholder,
  icon,
  className = "",
}: SearchAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = value.trim().length === 0
    ? []
    : suggestions.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()
      ).slice(0, 6);

  useEffect(() => {
    setCursor(-1);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (open && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, -1));
        return;
      }
      if (e.key === "Enter" && cursor >= 0) {
        e.preventDefault();
        onChange(filtered[cursor]);
        setOpen(false);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
    }
    onKeyDown?.(e);
  }

  return (
    <div ref={containerRef} className={`relative flex-1 ${className}`}>
      {icon && (
        <span className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none">
          {icon}
        </span>
      )}
      <Input
        placeholder={placeholder}
        className={`h-11 text-base border-0 focus-visible:ring-0 bg-transparent ${icon ? "pl-10" : ""}`}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && filtered.length > 0}
        aria-autocomplete="list"
      />
      {open && filtered.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-background border rounded-xl shadow-lg overflow-hidden"
          role="listbox"
        >
          {filtered.map((item, i) => (
            <button
              key={item}
              role="option"
              aria-selected={cursor === i}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(item);
                setOpen(false);
              }}
              onMouseEnter={() => setCursor(i)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                cursor === i ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
