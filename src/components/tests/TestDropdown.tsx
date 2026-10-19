import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown } from "lucide-react";

export interface DropdownOption<T extends string | number> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface Props<T extends string | number> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  ariaLabel: string;
}

function TestDropdown<T extends string | number>({
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const currentLabel =
    options.find((option) => option.value === value)?.label ??
    "Оберіть";

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  function openList() {
    if (disabled) return;

    setActiveIndex(
      Math.max(0, options.findIndex((option) => option.value === value)),
    );
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];

    if (!option || option.disabled) return;

    onChange(option.value);
    setOpen(false);
    trigger.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;

    if (event.key === "Escape") {
      setOpen(false);
      trigger.current?.focus();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (!open) {
        openList();
        return;
      }

      const direction = event.key === "ArrowDown" ? 1 : -1;

      for (let step = 1; step <= options.length; step++) {
        const index =
          (activeIndex + direction * step + options.length * 2) %
          options.length;

        if (!options[index].disabled) {
          setActiveIndex(index);
          break;
        }
      }
    }

    if (open && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      choose(activeIndex);
    }
  }

  return (
    <div
      ref={container}
      className={`test-dropdown ${open ? "test-dropdown--open" : ""}`}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={trigger}
        type="button"
        className="test-dropdown-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={
          open ? `${listId}-${activeIndex}` : undefined
        }
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
      >
        <span>{currentLabel}</span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>

      {open && (
        <div
          className="test-dropdown-menu"
          role="listbox"
          id={listId}
          aria-label={ariaLabel}
        >
          {options.map((option, index) => (
            <button
              type="button"
              role="option"
              id={`${listId}-${index}`}
              key={option.value}
              aria-selected={value === option.value}
              className={`test-dropdown-option ${
                index === activeIndex
                  ? "test-dropdown-option--active"
                  : ""
              }`}
              disabled={option.disabled}
              onMouseEnter={() =>
                !option.disabled && setActiveIndex(index)
              }
              onClick={() => choose(index)}
            >
              <span>
                {option.label}
                {option.disabled ? " · незабаром" : ""}
              </span>

              {option.value === value && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TestDropdown;