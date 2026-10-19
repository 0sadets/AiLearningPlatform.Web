import type { TestSettingsValues } from "../../utils/testForm";

interface TestSettingsFormProps {
  value: TestSettingsValues;
  onChange: (next: TestSettingsValues) => void;
  disabled?: boolean;
}

function TestSettingsForm({ value, onChange, disabled = false }: TestSettingsFormProps) {
  function patch(patchValue: Partial<TestSettingsValues>) {
    onChange({ ...value, ...patchValue });
  }

  return (
    <div className="test-settings-fields">
      <label className="test-field">
        <span className="test-field-label">Назва тесту <span aria-hidden="true">*</span></span>
        <input
          type="text"
          value={value.title}
          onChange={(event) => patch({ title: event.target.value })}
          placeholder="Наприклад: Основи програмування C#"
          maxLength={200}
          minLength={3}
          required
          disabled={disabled}
        />
        <small>{value.title.length}/200 символів</small>
      </label>

      <label className="test-field">
        <span className="test-field-label">Опис</span>
        <textarea
          rows={4}
          value={value.description}
          onChange={(event) => patch({ description: event.target.value })}
          placeholder="Що перевіряє цей тест?"
          maxLength={2000}
          disabled={disabled}
        />
        <small>{value.description.length}/2000 символів</small>
      </label>

      <div className="test-settings-pair">
        <div className="test-setting-box">
          <label className="test-check-label">
            <input
              type="checkbox"
              checked={value.attemptsLimited}
              onChange={(event) => patch({ attemptsLimited: event.target.checked })}
              disabled={disabled}
            />
            <span>Обмежити кількість спроб</span>
          </label>
          <p>Якщо вимкнено, студент може проходити тест необмежену кількість разів.</p>
          {value.attemptsLimited && (
            <label className="test-field test-setting-input">
              <span className="test-field-label">Максимальна кількість спроб</span>
              <input
                type="number"
                min={1}
                step={1}
                value={value.maxAttempts}
                onChange={(event) => patch({ maxAttempts: event.target.value })}
                disabled={disabled}
                required
              />
            </label>
          )}
        </div>

        <div className="test-setting-box">
          <label className="test-check-label">
            <input
              type="checkbox"
              checked={value.deadlineEnabled}
              onChange={(event) => patch({ deadlineEnabled: event.target.checked })}
              disabled={disabled}
            />
            <span>Встановити дедлайн</span>
          </label>
          <p>Після дедлайну студент не зможе розпочати нову спробу.</p>
          {value.deadlineEnabled && (
            <label className="test-field test-setting-input">
              <span className="test-field-label">Дата й час (місцевий час)</span>
              <input
                type="datetime-local"
                value={value.deadlineLocal}
                onChange={(event) => patch({ deadlineLocal: event.target.value })}
                disabled={disabled}
                required
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

export default TestSettingsForm;
