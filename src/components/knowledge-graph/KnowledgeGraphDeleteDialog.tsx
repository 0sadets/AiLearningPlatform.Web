import { useEffect, useState } from "react";

import type {
  CourseKnowledgeGraphDto,
  CourseKnowledgeTopicsDto,
} from "../../types/knowledgeGraph";

import KnowledgeGraphConfirmDialog from "./KnowledgeGraphConfirmDialog";

interface Props {
  isOpen: boolean;
  graph: CourseKnowledgeGraphDto | null;
  topics: CourseKnowledgeTopicsDto | null;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CONFIRMATION_TEXT = "ВИДАЛИТИ";

export default function KnowledgeGraphDeleteDialog({
  isOpen,
  graph,
  topics,
  isProcessing,
  onClose,
  onConfirm,
}: Props) {
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    if (isOpen) {
      setConfirmation("");
    }
  }, [isOpen]);

  const isConfirmed = confirmation.trim() === CONFIRMATION_TEXT;

  const handleConfirm = () => {
    if (!isConfirmed || isProcessing || !graph) {
      return;
    }

    onConfirm();
  };

  return (
    <KnowledgeGraphConfirmDialog
      isOpen={isOpen && graph !== null}
      title="Видалити весь граф знань?"
      description="Граф знань курсу буде видалено разом із його поняттями, семантичними зв'язками та навчальними темами."
      confirmLabel="Видалити граф"
      isProcessing={isProcessing}
      confirmDisabled={!isConfirmed}
      onCancel={onClose}
      onConfirm={handleConfirm}
    >
      <div className="kg-graph-delete-summary">
        <div>
          <span>Поняття</span>
          <strong>{graph?.concepts.length ?? 0}</strong>
        </div>

        <div>
          <span>Зв'язки</span>
          <strong>{graph?.relations.length ?? 0}</strong>
        </div>

        <div>
          <span>Навчальні теми</span>
          <strong>{topics?.topics.length ?? "—"}</strong>
        </div>
      </div>

      <div className="kg-graph-delete-warning">
        <strong>Зверніть увагу</strong>

        <p>
          Після видалення граф можна буде сформувати заново на основі матеріалів
          курсу, однак внесені вручну зміни можуть бути втрачені.
        </p>
      </div>

      <div className="kg-graph-delete-confirmation">
        <label htmlFor="kg-graph-delete-input">
          Для підтвердження введіть <strong>{CONFIRMATION_TEXT}</strong>
        </label>

        <input
          id="kg-graph-delete-input"
          type="text"
          value={confirmation}
          autoComplete="off"
          placeholder={CONFIRMATION_TEXT}
          disabled={isProcessing}
          onChange={(event) => setConfirmation(event.target.value)}
        />
      </div>
    </KnowledgeGraphConfirmDialog>
  );
}
