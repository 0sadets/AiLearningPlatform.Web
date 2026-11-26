import { Link } from "react-router-dom";

import type {
  KnowledgeGraphSelection,
} from "../../types/knowledgeGraph";

import {
  getGraphMasteryLabel,
  getGraphMasteryTone,
  type GraphMasteryData,
} from "../../utils/knowledgeGraphMastery";

interface Props {
  courseId: number;
  mastery: GraphMasteryData;
  selected: KnowledgeGraphSelection;
  isOwner: boolean;
}

export default function KnowledgeGraphMasteryDetails({
  courseId,
  mastery,
  selected,
  isOwner,
}: Props) {
  if (!selected || selected.kind === "relation") {
    return (
      <section className="kg-mastery-details">
        <strong>Результати навчання</strong>
        <p>
          Виберіть поняття або навчальну тему на графі,
          щоб переглянути результати.
        </p>
      </section>
    );
  }

  const isConcept = selected.kind === "concept";

  const value = isConcept
    ? mastery.concepts.get(selected.id)
    : mastery.topics.get(selected.id);

  const tone = getGraphMasteryTone(value);

  return (
    <section className="kg-mastery-details">
      <div className="kg-mastery-details-heading">
        <strong>
          {isConcept
            ? "Засвоєння поняття"
            : "Засвоєння теми"}
        </strong>

        <span
          className={`kg-mastery-detail-indicator kg-mastery-detail-indicator--${tone}`}
          aria-hidden="true"
        />
      </div>

      <div className="kg-mastery-details-result">
        {getGraphMasteryLabel(value)}
      </div>

      {tone === "none" ? (
        <p>
          Поки немає результатів тестування,
          за якими можна оцінити цей навчальний матеріал.
        </p>
      ) : (
        <p>
          {isOwner
            ? "Середній результат студентів за перевіреними поняттями."
            : "Ваш результат за питаннями, пов'язаними з цим навчальним матеріалом."}
        </p>
      )}

      {value?.dataStatus === "Limited" && (
        <p className="kg-mastery-preliminary">
          Це попередній результат. Для точнішого
          висновку потрібно більше відповідей.
        </p>
      )}

      {isOwner &&
        value?.studentsAssessed !== undefined && (
          <p>
            Студентів із результатами:{" "}
            <strong>{value.studentsAssessed}</strong>
          </p>
        )}

      {!isConcept &&
        value?.totalConcepts !== undefined && (
          <p>
            Оцінено понять:{" "}
            <strong>
              {value.assessedConcepts ?? 0} із{" "}
              {value.totalConcepts}
            </strong>
          </p>
        )}

      {isOwner && value?.hasGroupDifficulty && (
        <p className="kg-mastery-preliminary">
          За цим поняттям виявлено можливі труднощі
          в навчанні. Перегляньте детальну аналітику,
          щоб дізнатися більше.
        </p>
      )}

      <Link
        className="kg-mastery-details-link"
        to={
          isOwner
            ? `/courses/${courseId}/analytics/overview`
            : `/courses/${courseId}/analytics/me`
        }
      >
        Переглянути детальну аналітику
      </Link>
    </section>
  );
}