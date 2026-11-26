import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  title: string;
  description?: string;
  countLabel?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function AnalyticsCollapsibleSection({
  title,
  description,
  countLabel,
  defaultOpen = false,
  children,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section className="ka-section ka-section--collapsible">
      <header className="ka-collapsible-header">
        <h2>
          <button
            type="button"
            className="ka-collapsible-trigger"
            aria-expanded={isOpen}
            aria-controls={contentId}
            onClick={() => setIsOpen((current) => !current)}
          >
            <span className="ka-collapsible-title">
              {title}
            </span>

            <span className="ka-collapsible-right">
              {countLabel && (
                <span className="ka-collapsible-count">
                  {countLabel}
                </span>
              )}

              <ChevronDown
                size={20}
                className={`ka-collapsible-chevron ${
                  isOpen
                    ? "ka-collapsible-chevron--open"
                    : ""
                }`}
              />
            </span>
          </button>
        </h2>

        {description && (
          <p className="ka-collapsible-description">
            {description}
          </p>
        )}
      </header>

      <div
        id={contentId}
        className="ka-collapsible-content"
        hidden={!isOpen}
      >
        {children}
      </div>
    </section>
  );
}