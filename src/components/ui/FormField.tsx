import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

import "../../styles/form-field.css";

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

function FormField({
  id,
  label,
  required = false,
  error,
  hint,
  children,
}: FormFieldProps) {
  return (
    <div className={`form-field ${error ? "form-field--error" : ""}`}>
      <label htmlFor={id} className="form-field-label">
        {label}

        {required && (
          <span className="form-field-required">*</span>
        )}
      </label>

      <div className="form-field-control">
        {children}
      </div>

      {error ? (
        <p id={`${id}-error`} className="form-field-error" role="alert">
          <AlertCircle size={15} />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="form-field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default FormField;