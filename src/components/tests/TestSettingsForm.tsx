import FormField from "../ui/FormField";

import type {
  TestSettingsErrors,
  TestSettingsValues,
} from "../../utils/testForm";

interface TestSettingsFormProps {
  value: TestSettingsValues;
  onChange: (next: TestSettingsValues) => void;
  onFieldBlur: (field: keyof TestSettingsErrors) => void;
  errors?: TestSettingsErrors;
  disabled?: boolean;
}

function TestSettingsForm({
  value,
  onChange,
  onFieldBlur,
  errors = {},
  disabled = false,
}: TestSettingsFormProps) {
  function patch(patchValue: Partial<TestSettingsValues>) {
    onChange({ ...value, ...patchValue });
  }

  return (
    <div className="test-settings-fields">
      <FormField
        id="testTitle"
        label="Назва тесту"
        required
        error={errors.title}
        hint={`${value.title.length}/200 символів`}
      >
        <input
          id="testTitle"
          type="text"
          value={value.title}
          maxLength={200}
          placeholder="Наприклад: Основи програмування C#"
          disabled={disabled}
          aria-invalid={!!errors.title}
          aria-describedby={
            errors.title ? "testTitle-error" : "testTitle-hint"
          }
          onBlur={() => onFieldBlur("title")}
          onChange={(event) =>
            patch({ title: event.target.value })
          }
        />
      </FormField>

      <FormField
        id="testDescription"
        label="Опис"
        error={errors.description}
        hint={`${value.description.length}/2000 символів`}
      >
        <textarea
          id="testDescription"
          rows={4}
          value={value.description}
          maxLength={2000}
          placeholder="Що перевіряє цей тест?"
          disabled={disabled}
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description
              ? "testDescription-error"
              : "testDescription-hint"
          }
          onBlur={() => onFieldBlur("description")}
          onChange={(event) =>
            patch({ description: event.target.value })
          }
        />
      </FormField>

      <div className="test-settings-pair">
        <div className="test-setting-box">
          <label className="test-check-label">
            <input
              type="checkbox"
              checked={value.attemptsLimited}
              onChange={(event) =>
                patch({
                  attemptsLimited: event.target.checked,
                })
              }
              disabled={disabled}
            />

            <span>Обмежити кількість спроб</span>
          </label>

          <p>
            Якщо вимкнено, студент може проходити тест
            необмежену кількість разів.
          </p>

          {value.attemptsLimited && (
            <div className="test-setting-input">
              <FormField
                id="testMaxAttempts"
                label="Максимальна кількість спроб"
                required
                error={errors.maxAttempts}
              >
                <input
                  id="testMaxAttempts"
                  type="number"
                  min={1}
                  step={1}
                  value={value.maxAttempts}
                  disabled={disabled}
                  aria-invalid={!!errors.maxAttempts}
                  aria-describedby={
                    errors.maxAttempts
                      ? "testMaxAttempts-error"
                      : undefined
                  }
                  onBlur={() => onFieldBlur("maxAttempts")}
                  onChange={(event) =>
                    patch({
                      maxAttempts: event.target.value,
                    })
                  }
                />
              </FormField>
            </div>
          )}
        </div>

        <div className="test-setting-box">
          <label className="test-check-label">
            <input
              type="checkbox"
              checked={value.deadlineEnabled}
              onChange={(event) =>
                patch({
                  deadlineEnabled: event.target.checked,
                })
              }
              disabled={disabled}
            />

            <span>Встановити дедлайн</span>
          </label>

          <p>
            Після дедлайну студент не зможе розпочати
            нову спробу.
          </p>

          {value.deadlineEnabled && (
            <div className="test-setting-input">
              <FormField
                id="testDeadline"
                label="Дата й час (місцевий час)"
                required
                error={errors.deadlineLocal}
              >
                <input
                  id="testDeadline"
                  type="datetime-local"
                  value={value.deadlineLocal}
                  disabled={disabled}
                  aria-invalid={!!errors.deadlineLocal}
                  aria-describedby={
                    errors.deadlineLocal
                      ? "testDeadline-error"
                      : undefined
                  }
                  onBlur={() =>
                    onFieldBlur("deadlineLocal")
                  }
                  onChange={(event) =>
                    patch({
                      deadlineLocal: event.target.value,
                    })
                  }
                />
              </FormField>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TestSettingsForm;