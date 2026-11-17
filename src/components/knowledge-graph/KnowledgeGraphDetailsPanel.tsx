import {
  BookOpen,
  Info,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import {
  KnowledgeRelationEvidenceRole,
  type CourseKnowledgeGraphDto,
  type CourseKnowledgeTopicsDto,
  type KnowledgeGraphConceptEvidenceDto,
  type KnowledgeGraphRelationEvidenceDto,
  type KnowledgeGraphSelection,
} from "../../types/knowledgeGraph";

import {
  EVIDENCE_ROLE_LABELS,
  RELATION_INFO,
} from "../../utils/knowledgeGraph";

type Evidence =
  | KnowledgeGraphConceptEvidenceDto
  | KnowledgeGraphRelationEvidenceDto;

interface Props {
  graph: CourseKnowledgeGraphDto;
  topics: CourseKnowledgeTopicsDto | null;
  selected: KnowledgeGraphSelection;
  onSelect: (selection: KnowledgeGraphSelection) => void;

  isOwner: boolean;
  isBusy: boolean;

  onEditConcept: (conceptId: number) => void;
  onDeleteConcept: (conceptId: number) => void;

  onEditRelation: (relationId: number) => void;
  onDeleteRelation: (relationId: number) => void;

  onEditTopic: (topicId: number) => void;
  onDeleteTopic: (topicId: number) => void;
}

function EvidenceList({
  evidences,
}: {
  evidences: Evidence[];
}) {
  return (
    <div className="kg-details-section">
      <h4>
        <BookOpen size={16} />
        Підтвердження з матеріалів
      </h4>

      {evidences.length === 0 ? (
        <p className="kg-details-muted">
          Для цього об'єкта немає збережених
          підтверджувальних фрагментів.
        </p>
      ) : (
        <div className="kg-evidence-list">
          {evidences.map((evidence) => {
            const role =
              "role" in evidence
                ? evidence.role
                : undefined;

            return (
              <div
                key={evidence.id}
                className="kg-evidence-card"
              >
                <div className="kg-evidence-source">
                  <BookOpen size={14} />
                  <span>{evidence.materialTitle}</span>
                </div>

                {role !== undefined && (
                  <span className="kg-evidence-role">
                    {
                      EVIDENCE_ROLE_LABELS[
                        role as KnowledgeRelationEvidenceRole
                      ]
                    }
                  </span>
                )}

                <blockquote>
                  {evidence.excerpt}
                </blockquote>

                <span className="kg-evidence-chunk">
                  Фрагмент матеріалу №
                  {evidence.chunkIndex}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function KnowledgeGraphDetailsPanel({
  graph,
  topics,
  selected,
  onSelect,
  isOwner,
  isBusy,
  onEditConcept,
  onDeleteConcept,
  onEditRelation,
  onDeleteRelation,
  onEditTopic,
  onDeleteTopic,
}: Props) {
  if (!selected) {
    return (
      <aside className="kg-details-panel">
        <div className="kg-details-placeholder">
          <div className="kg-details-placeholder-icon">
            <Info size={24} />
          </div>

          <h3>Деталі графа</h3>

          <p>
            Виберіть поняття, навчальну тему або
            семантичний зв'язок, щоб переглянути
            його інформацію та джерела.
          </p>
        </div>
      </aside>
    );
  }

  const concept =
    selected.kind === "concept"
      ? graph.concepts.find(
          (item) => item.id === selected.id,
        )
      : undefined;

  const relation =
    selected.kind === "relation"
      ? graph.relations.find(
          (item) => item.id === selected.id,
        )
      : undefined;

  const topic =
    selected.kind === "topic"
      ? topics?.topics.find(
          (item) => item.id === selected.id,
        )
      : undefined;

  const sourceConcept = relation
    ? graph.concepts.find(
        (item) =>
          item.id === relation.sourceConceptId,
      )
    : undefined;

  const targetConcept = relation
    ? graph.concepts.find(
        (item) =>
          item.id === relation.targetConceptId,
      )
    : undefined;

  const conceptTopics = concept
    ? topics?.topics.filter((item) =>
        item.conceptIds.includes(concept.id),
      ) ?? []
    : [];

  const title =
    concept?.name ??
    topic?.name ??
    (relation
      ? RELATION_INFO[relation.type].label
      : "Деталі");

  const category =
    concept
      ? "Поняття"
      : relation
        ? "Семантичний зв'язок"
        : "Навчальна тема";

  return (
    <aside className="kg-details-panel">
      <div className="kg-details-header">
        <div>
          <span className="kg-details-category">
            {category}
          </span>

          <h3>{title}</h3>
        </div>

        <button
          type="button"
          className="kg-icon-button"
          onClick={() => onSelect(null)}
          aria-label="Закрити деталі"
          title="Закрити"
        >
          <X size={18} />
        </button>
          </div>

      {/* Дії власника для вибраного поняття */}

      {concept && isOwner && (
        <div className="kg-details-actions">
          <button
            type="button"
            className="secondary-button kg-details-edit-button"
            disabled={isBusy}
            onClick={() => onEditConcept(concept.id)}
          >
            <Pencil size={15} />
            Редагувати
          </button>

          <button
            type="button"
            className="kg-details-delete-button"
            disabled={isBusy}
            onClick={() => onDeleteConcept(concept.id)}
            title="Видалити поняття"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
{/* Дії власника для семантичного зв'язку */}

{relation && isOwner && (
  <div className="kg-details-actions">
    <button
      type="button"
      className="secondary-button kg-details-edit-button"
      disabled={isBusy}
      onClick={() => onEditRelation(relation.id)}
    >
      <Pencil size={15} />
      Редагувати
    </button>

    <button
      type="button"
      className="kg-details-delete-button"
      disabled={isBusy}
      onClick={() => onDeleteRelation(relation.id)}
      aria-label="Видалити семантичний зв'язок"
      title="Видалити зв'язок"
    >
      <Trash2 size={16} />
    </button>
  </div>
)}

{topic && isOwner && topics?.isCurrent && (
  <div className="kg-details-actions">
    <button
      type="button"
      className="secondary-button kg-details-edit-button"
      disabled={isBusy}
      onClick={() => onEditTopic(topic.id)}
    >
      <Pencil size={15} />
      Редагувати
    </button>

    <button
      type="button"
      className="kg-details-delete-button"
      disabled={isBusy || topics.topics.length <= 1}
      onClick={() => onDeleteTopic(topic.id)}
      aria-label="Видалити навчальну тему"
      title={
        topics.topics.length <= 1
          ? "Не можна видалити останню навчальну тему"
          : "Видалити навчальну тему"
      }
    >
      <Trash2 size={16} />
    </button>
  </div>
)}
      <div className="kg-details-body">
        {concept && (
          <>
            {concept.description && (
              <div className="kg-details-section">
                <h4>Опис</h4>
                <p>{concept.description}</p>
              </div>
            )}

            <div className="kg-details-section">
              <h4>Навчальні теми</h4>

              {conceptTopics.length > 0 ? (
                <div className="kg-details-tags">
                  {conceptTopics.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="kg-topic-tag"
                      onClick={() =>
                        onSelect({
                          kind: "topic",
                          id: item.id,
                        })
                      }
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="kg-details-muted">
                  Актуальних тематичних прив'язок немає.
                </p>
              )}
            </div>

            {concept.isManuallyEdited && (
              <span className="kg-manual-label">
                Редаговано вручну
              </span>
            )}

            <EvidenceList
              evidences={concept.evidences}
            />
          </>
        )}

        {relation && (
          <>
            <div className="kg-details-section">
              <h4>Напрямок зв'язку</h4>

              <div className="kg-relation-direction">
                <button
                  type="button"
                  onClick={() =>
                    onSelect({
                      kind: "concept",
                      id: relation.sourceConceptId,
                    })
                  }
                >
                  {sourceConcept?.name ??
                    `Поняття ${relation.sourceConceptId}`}
                </button>

                <span>
                  {relation.type === 1 ? "↔" : "→"}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    onSelect({
                      kind: "concept",
                      id: relation.targetConceptId,
                    })
                  }
                >
                  {targetConcept?.name ??
                    `Поняття ${relation.targetConceptId}`}
                </button>
              </div>
            </div>

            <div className="kg-details-section">
              <h4>Значення відношення</h4>
              <p>
                {
                  RELATION_INFO[relation.type]
                    .description
                }
              </p>
            </div>

            {relation.isManuallyEdited && (
              <span className="kg-manual-label">
                Редаговано вручну
              </span>
            )}

            <EvidenceList
              evidences={relation.evidences}
            />
          </>
        )}

        {topic && (
          <>
            {topic.description && (
              <div className="kg-details-section">
                <h4>Опис теми</h4>
                <p>{topic.description}</p>
              </div>
            )}

            <div className="kg-details-section">
              <h4>Інформація</h4>

              <div className="kg-detail-row">
                <span>Порядок</span>
                <strong>{topic.order}</strong>
              </div>

              <div className="kg-detail-row">
                <span>Кількість понять</span>
                <strong>
                  {topic.conceptIds.length}
                </strong>
              </div>
            </div>

          <div className="kg-details-section">
  <h4>Ключові поняття</h4>

  <p className="kg-details-muted kg-topic-concepts-description">
    Поняття, які охоплює ця навчальна тема.
  </p>

  <div className="kg-topic-concepts">
                {topic.conceptIds.map((conceptId) => {
                  const item = graph.concepts.find(
                    (candidate) =>
                      candidate.id === conceptId,
                  );

                  if (!item) {
                    return null;
                  }

                  return (
                    <button
                      key={conceptId}
                      type="button"
                      onClick={() =>
                        onSelect({
                          kind: "concept",
                          id: conceptId,
                        })
                      }
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {topic.isManuallyEdited && (
              <span className="kg-manual-label">
                Редаговано вручну
              </span>
            )}
          </>
        )}
      </div>
    </aside>
  );
}