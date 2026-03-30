import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes
} from "react";
import { cn } from "@/lib/utils";

export function FieldShell({
  label,
  children,
  className
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}

const baseFieldClassName =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary/35 focus:bg-white/[0.07]";

export function InputField(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(baseFieldClassName, props.className)}
    />
  );
}

export function SelectField(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        baseFieldClassName,
        "appearance-none bg-[linear-gradient(180deg,rgba(20,27,43,0.92),rgba(14,19,32,0.92))] pr-10",
        props.className
      )}
    />
  );
}

export function ComboField({
  options,
  onChange,
  onFocus,
  onBlur,
  value,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { options: string[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const inputValue = typeof value === "string" ? value : "";

  const normalizedOptions = useMemo(
    () => Array.from(new Set(options.map((item) => item.trim()).filter(Boolean))),
    [options]
  );

  const filteredOptions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return normalizedOptions;

    const exactMatches = normalizedOptions.filter((item) => item.toLowerCase() === query);
    const prefixMatches = normalizedOptions.filter(
      (item) => item.toLowerCase().startsWith(query) && item.toLowerCase() !== query
    );
    const containsMatches = normalizedOptions.filter(
      (item) => !item.toLowerCase().startsWith(query) && item.toLowerCase().includes(query)
    );

    return [...exactMatches, ...prefixMatches, ...containsMatches];
  }, [inputValue, normalizedOptions]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const emitChange = (nextValue: string) => {
    if (!onChange) return;
    onChange({ target: { value: nextValue } } as ChangeEvent<HTMLInputElement>);
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setOpen(true);
    onFocus?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);
  };

  const hasExactOption = normalizedOptions.some((item) => item.toLowerCase() === inputValue.trim().toLowerCase());
  const showUseTypedValue = inputValue.trim().length > 0 && !hasExactOption;

  return (
    <div ref={wrapperRef} className="relative">
      <input
        {...props}
        autoComplete="off"
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={(event) => {
          onChange?.(event);
          setOpen(true);
        }}
        className={cn(baseFieldClassName, className)}
      />

      {open ? (
        <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(11,16,27,0.98))] shadow-[0_18px_60px_rgba(0,0,0,0.38)] backdrop-blur-xl">
          <div className="max-h-56 overflow-y-auto p-2">
            {showUseTypedValue ? (
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-white transition hover:bg-white/8"
                onMouseDown={(event) => {
                  event.preventDefault();
                  emitChange(inputValue.trim());
                  setOpen(false);
                }}
              >
                <span>Use “{inputValue.trim()}”</span>
                <span className="text-xs text-muted">Custom</span>
              </button>
            ) : null}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => {
                const active = item === inputValue;
                return (
                  <button
                    key={item}
                    type="button"
                    className={cn(
                      "w-full rounded-xl px-3 py-2 text-left text-sm transition",
                      active ? "bg-primary text-black" : "text-white hover:bg-white/8"
                    )}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      emitChange(item);
                      setOpen(false);
                    }}
                  >
                    {item}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-muted">No matches yet.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TextareaField(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(baseFieldClassName, "min-h-[120px] resize-y", props.className)}
    />
  );
}
