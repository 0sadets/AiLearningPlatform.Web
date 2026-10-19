import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { QuestionType, type CreateQuestionDto, type QuestionDto } from "../../types/testQuestion";
import { getTestApiError, isUnauthorizedError } from "../../utils/testForm";

interface OptionDraft {
  key: number;
  text: string;
  isCorrect: boolean;
}

interface QuestionEditorModalProps {
  question: QuestionDto | null;
  onClose: () => void;
  onSave: (payload: CreateQuestionDto) => Promise<void>;
}

const defaultOptions = (): OptionDraft[] => [
  { key: 1, text: "", isCorrect: false },
  { key: 2, text: "", isCorrect: false },
];

const trueFalseOptions = (): OptionDraft[] => [
  { key: 1, text: "Так", isCorrect: true },
  { key: 2, text: "Ні", isCorrect: false },
];

function QuestionEditorModal({ question, onClose, onSave }: QuestionEditorModalProps) {
  const { showToast } = useToast();
  const nextKey = useRef(Math.max(2, question?.answerOptions.length ?? 2) + 1);
  const [text, setText] = useState(question?.text ?? "");
  const [type, setType] = useState<QuestionType>(question?.type ?? QuestionType.SingleChoice);
  const [points, setPoints] = useState(String(question?.points ?? 1));
  const [options, setOptions] = useState<OptionDraft[]>(() =>
    question
      ? [...question.answerOptions].sort((a, b) => a.order - b.order).map((item, index) => ({
          key: index + 1,
          text: item.text,
          isCorrect: item.isCorrect,
        }))
      : defaultOptions(),
  );
  const [validationMessage, setValidationMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isSaving, onClose]);

  const changeOption = (key: number, patch: Partial<OptionDraft>) => {
    setOptions((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item));
    setValidationMessage("");
  };

  const changeType = (newType: QuestionType) => {
    if (newType === type) return;
    if (newType === QuestionType.TrueFalse) {
      setOptions(trueFalseOptions());
      nextKey.current = 3;
    } else if (type === QuestionType.TrueFalse) {
      setOptions(defaultOptions());
      nextKey.current = 3;
    } else if (newType === QuestionType.SingleChoice) {
      setOptions((current) => {
        const chosen = current.findIndex((option) => option.isCorrect);
        return current.map((option, index) => ({ ...option, isCorrect: index === chosen }));
      });
    }
    setType(newType);
    setValidationMessage("");
  };

  const toggleCorrect = (key: number) => {
    if (type === QuestionType.MultipleChoice) {
      setOptions((current) => current.map((item) =>
        item.key === key ? { ...item, isCorrect: !item.isCorrect } : item,
      ));
    } else {
      setOptions((current) => current.map((item) => ({ ...item, isCorrect: item.key === key })));
    }
    setValidationMessage("");
  };

  const addOption = () => {
    const key = nextKey.current++;
    setOptions((current) => [...current, { key, text: "", isCorrect: false }]);
  };

  const removeOption = (key: number) => {
    setOptions((current) => current.filter((item) => item.key !== key));
  };

  const validate = (): string | null => {
    if (!text.trim() || text.trim().length > 2000) return "Вкажіть текст питання (до 2000 символів).";
    if (!/^\d+$/.test(points.trim()) || !Number.isSafeInteger(Number(points)) || Number(points) <= 0) {
      return "Бали за питання повинні бути цілим додатним числом.";
    }
    if (options.length < 2) return "Додайте щонайменше два варіанти відповіді.";
    if (options.some((option) => !option.text.trim() || option.text.trim().length > 1000)) {
      return "Заповніть усі варіанти відповіді (до 1000 символів кожен).";
    }
    const correctCount = options.filter((option) => option.isCorrect).length;
    if (type === QuestionType.SingleChoice && correctCount !== 1) {
      return "Оберіть одну правильну відповідь.";
    }
    if (type === QuestionType.MultipleChoice && correctCount < 2) {
      return "Для питання з декількома відповідями оберіть щонайменше два правильні варіанти.";
    }
    if (type === QuestionType.TrueFalse && (options.length !== 2 || correctCount !== 1)) {
      return "Для питання «Так / Ні» має бути одна правильна відповідь.";
    }
    return null;
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    const error = validate();
    if (error) {
      setValidationMessage(error);
      return;
    }
    const payload: CreateQuestionDto = {
      text: text.trim(),
      type,
      points: Number(points),
      answerOptions: options.map((option) => ({ text: option.text.trim(), isCorrect: option.isCorrect })),
    };
    setIsSaving(true);
    try {
      await onSave(payload);
      onClose();
    } catch (error) {
      if (!isUnauthorizedError(error)) showToast(getTestApiError(error, "Не вдалося зберегти питання."), "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="test-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose();
    }}>
      <section className="test-modal test-question-modal" role="dialog" aria-modal="true" aria-labelledby="test-question-dialog-title">
        <header className="test-modal-header">
          <div>
            <h2 id="test-question-dialog-title">{question ? "Редагувати питання" : "Нове питання"}</h2>
            <p>Вкажіть питання, кількість балів і правильні відповіді.</p>
          </div>
          <button type="button" className="test-icon-btn" title="Закрити" aria-label="Закрити" onClick={onClose} disabled={isSaving}><X size={20} /></button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="test-modal-body">
            <label className="test-field">
              <span className="test-field-label">Питання <span aria-hidden="true">*</span></span>
              <textarea rows={3} value={text} maxLength={2000} required placeholder="Введіть текст питання..." onChange={(event) => {
                setText(event.target.value);
                setValidationMessage("");
              }} disabled={isSaving} />
              <small>{text.length}/2000 символів</small>
            </label>
            <div className="test-question-meta-fields">
              <label className="test-field">
                <span className="test-field-label">Тип питання</span>
                <select value={type} onChange={(event) => changeType(Number(event.target.value) as QuestionType)} disabled={isSaving}>
                  <option value={QuestionType.SingleChoice}>Одна правильна відповідь</option>
                  <option value={QuestionType.MultipleChoice}>Декілька правильних</option>
                  <option value={QuestionType.TrueFalse}>Так / Ні</option>
                </select>
              </label>
              <label className="test-field">
                <span className="test-field-label">Бали</span>
                <input type="number" min={1} step={1} value={points} onChange={(event) => setPoints(event.target.value)} disabled={isSaving} required />
              </label>
            </div>

            <div className="test-options-heading">
              <div>
                <h3>Варіанти відповідей</h3>
                <p>{type === QuestionType.MultipleChoice
                  ? "Позначте всі правильні варіанти (мінімум два)."
                  : "Позначте один правильний варіант."}</p>
              </div>
            </div>

            <div className="test-option-drafts">
              {options.map((option, index) => (
                <div className="test-option-draft" key={option.key}>
                  <label className="test-correct-choice" title="Правильна відповідь">
                    <input
                      type={type === QuestionType.MultipleChoice ? "checkbox" : "radio"}
                      name={type === QuestionType.MultipleChoice ? undefined : "correct-option"}
                      checked={option.isCorrect}
                      onChange={() => toggleCorrect(option.key)}
                      disabled={isSaving}
                      aria-label={`Правильність варіанта ${index + 1}`}
                    />
                  </label>
                  <input
                    className="test-option-text-input"
                    value={option.text}
                    onChange={(event) => changeOption(option.key, { text: event.target.value })}
                    placeholder={`Варіант ${index + 1}`}
                    disabled={isSaving || type === QuestionType.TrueFalse}
                    maxLength={1000}
                    required
                    aria-label={`Текст варіанта ${index + 1}`}
                  />
                  {type !== QuestionType.TrueFalse && (
                    <button type="button" className="test-icon-btn test-icon-btn--danger" aria-label={`Видалити варіант ${index + 1}`} title="Видалити варіант" onClick={() => removeOption(option.key)} disabled={isSaving || options.length <= 2}><Trash2 size={17} /></button>
                  )}
                </div>
              ))}
            </div>
            {type !== QuestionType.TrueFalse && (
              <button type="button" className="test-add-option" onClick={addOption} disabled={isSaving}>
                <Plus size={16} /> Додати варіант
              </button>
            )}
            {validationMessage && <div className="test-inline-error" role="alert">{validationMessage}</div>}
          </div>
          <footer className="test-modal-footer">
            <button type="button" className="test-btn test-btn--secondary" onClick={onClose} disabled={isSaving}>Скасувати</button>
            <button type="submit" className="test-btn test-btn--primary" disabled={isSaving}>
              <Check size={17} /> {isSaving ? "Збереження..." : "Зберегти питання"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default QuestionEditorModal;
