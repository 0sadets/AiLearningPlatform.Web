import { useEffect, useMemo, useState } from "react";

import { Info } from "lucide-react";

import type {
  CourseKnowledgeGraphDto,
  CourseKnowledgeTopicsDto,
  KnowledgeTopicDto,
} from "../../types/knowledgeGraph";

import KnowledgeGraphConfirmDialog from "./KnowledgeGraphConfirmDialog";

interface Props {
  isOpen: boolean;
  graph: CourseKnowledgeGraphDto;
  topics: CourseKnowledgeTopicsDto;
  topic: KnowledgeTopicDto | null;
  isProcessing: boolean;
  onClose: () => void;
  onDelete: (transferToTopicId?: number) => Promise<void>;
}

export default function KnowledgeTopicDeleteDialog({
  isOpen,
  graph,
  topics,
  topic,
  isProcessing,
  onClose,
  onDelete,
}: Props) {
  const [transferToTopicId, setTransferToTopicId] =
    useState<number | "">("");

  useEffect(() => {
    if (isOpen) {
      setTransferToTopicId("");
    }
  }, [isOpen, topic?.id]);

  const otherTopics = useMemo(
    () =>
      topics.topics
        .filter((item) => item.id !== topic?.id)
        .sort((a, b) => a.order - b.order),
    [topics.topics, topic?.id],
  );

  const orphanedConceptIds = useMemo(() => {
    if (!topic) {
      return [];
    }

    return topic.conceptIds.filter(
      (conceptId) =>
        !otherTopics.some((other) =>
          other.conceptIds.includes(conceptId),
        ),
    );
  }, [topic, otherTopics]);

  const orphanedConcepts = useMemo(
    () =>
      graph.concepts.filter((concept) =>
        orphanedConceptIds.includes(concept.id),
      ),
    [graph.concepts, orphanedConceptIds],
  );

  const isLastTopic = topics.topics.length <= 1;

  const requiresTransfer = orphanedConceptIds.length > 0;

  const canDelete =
    !isLastTopic &&
    (!requiresTransfer || transferToTopicId !== "");

  const handleConfirm = () => {
    if (!topic || !canDelete || isProcessing) {
      return;
    }

    void onDelete(
      requiresTransfer
        ? Number(transferToTopicId)
        : undefined,
    );
  };

  return (
    <KnowledgeGraphConfirmDialog
      isOpen={isOpen && topic !== null}
      title="Видалити навчальну тему?"
      description={
        topic
          ? `Тему «${topic.name}» буде видалено з актуальної тематичної структури графа.`
          : ""
      }
      confirmLabel="Видалити тему"
      isProcessing={isProcessing}
      confirmDisabled={!canDelete}
      onCancel={onClose}
      onConfirm={handleConfirm}
    >
      {isLastTopic ? (
        <div className="kg-topic-delete-info">
          <Info size={18} />
          <p>
            Неможливо видалити останню навчальну тему.
            У графі повинна залишатися хоча б одна тема.
          </p>
        </div>
      ) : requiresTransfer ? (
        <div className="kg-topic-transfer">
          <div className="kg-topic-transfer-warning">
            <Info size={18} />

            <p>
              {orphanedConceptIds.length} понять
              залишаться без навчальної теми.
              Щоб видалити цю тему, перенесіть
              їх до іншої.
            </p>
          </div>

          <div className="kg-topic-transfer-concepts">
            <strong>Поняття для перенесення</strong>

            <div>
              {orphanedConcepts.map((concept) => (
                <span key={concept.id}>
                  {concept.name}
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="kg-transfer-topic">
              Перенести до теми
              <span className="kg-required">*</span>
            </label>

            <select
              id="kg-transfer-topic"
              value={transferToTopicId}
              disabled={isProcessing}
              onChange={(event) =>
                setTransferToTopicId(
                  event.target.value === ""
                    ? ""
                    : Number(event.target.value),
                )
              }
            >
              <option value="">
                Оберіть навчальну тему
              </option>

              {otherTopics.map((other) => (
                <option
                  key={other.id}
                  value={other.id}
                >
                  {other.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="kg-topic-delete-info">
          <Info size={18} />

          <p>
            Усі поняття цієї теми вже належать
            до інших навчальних тем. Їх не буде
            видалено з графа.
          </p>
        </div>
      )}
    </KnowledgeGraphConfirmDialog>
  );
}