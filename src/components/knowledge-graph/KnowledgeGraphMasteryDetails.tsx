import { Link } from "react-router-dom";
import { BookOpen, ChevronRight, Lightbulb } from "lucide-react";

import type { KnowledgeGraphSelection } from "../../types/knowledgeGraph";

import {
  getGraphMasteryLabel,
  getGraphMasteryTone,
  type GraphMasteryData,
  getGraphTopicMasteryTone,
} from "../../utils/knowledgeGraphMastery";

import {
  formatAnalyticsPercent,
  getRecommendationPriorityLabel,
} from "../../utils/knowledgeAnalytics";

interface Props {
  courseId: number;
  mastery: GraphMasteryData;
  selected: KnowledgeGraphSelection;
  isOwner: boolean;
  onOpenConcept: (conceptId: number) => void;
}

export default function KnowledgeGraphMasteryDetails({
  courseId,
  mastery,
  selected,
  isOwner,
  onOpenConcept,
}: Props) {
  if (!selected || selected.kind === "relation") {
    return (
      <section className="kg-mastery-details">
        <strong>Результати навчання</strong>
        <p>
          Виберіть поняття або навчальну тему на графі, щоб переглянути
          результати.
        </p>
      </section>
    );
  }

  const isConcept = selected.kind === "concept";

  const value = isConcept
    ? mastery.concepts.get(selected.id)
    : mastery.topics.get(selected.id);

  const tone = isConcept
    ? getGraphMasteryTone(value)
    : getGraphTopicMasteryTone(value);

  const hasResult = value?.percent != null && value.dataStatus !== "NoData";

  const conceptDetails =
    !isOwner && isConcept
      ? mastery.studentConceptDetails?.get(selected.id)
      : undefined;

  const recommendation =
    !isOwner && isConcept
      ? mastery.studentRecommendations?.get(selected.id)
      : undefined;

  const hasRecommendedMaterials = (recommendation?.materials.length ?? 0) > 0;

  const sourceMaterials = hasRecommendedMaterials
    ? (recommendation?.materials ?? [])
    : (conceptDetails?.materials ?? []);

  const materials = sourceMaterials.filter(
    (material, index) =>
      sourceMaterials.findIndex(
        (item) => item.materialId === material.materialId,
      ) === index,
  );

  const weakPrerequisiteIds = conceptDetails?.weakPrerequisiteConceptIds ?? [];

  return (
    <section className="kg-mastery-details">
      <div className="kg-mastery-details-heading">
        <strong>{isConcept ? "Засвоєння поняття" : "Засвоєння теми"}</strong>

        <span
          className={`kg-mastery-detail-indicator kg-mastery-detail-indicator--${tone}`}
          aria-hidden="true"
        />
      </div>

      <div className="kg-mastery-details-result">
        {getGraphMasteryLabel(value)}
      </div>

      {!hasResult ? (
        <p>Поки немає результатів тестування для цього поняття або теми.</p>
      ) : !isConcept && tone === "none" ? (
        <p className="kg-mastery-coverage-warning">
          Оцінено {value?.assessedConcepts ?? 0} із {value?.totalConcepts ?? 0}{" "}
          понять. Цей результат стосується лише перевіреної частини теми. Даних
          поки недостатньо, щоб оцінювати засвоєння всієї теми.
        </p>
      ) : (
        <p>
          {isOwner
            ? "Середній результат студентів за оціненими поняттями."
            : "Ваш результат за перевіреними поняттями."}
        </p>
      )}

      {value?.dataStatus === "Limited" && (
        <p className="kg-mastery-preliminary">
          Результат попередній. Для точнішого висновку потрібно більше
          відповідей.
        </p>
      )}

      {isOwner && value?.studentsAssessed !== undefined && (
        <p>
          Студентів із результатами: <strong>{value.studentsAssessed}</strong>
        </p>
      )}

      {!isConcept && value?.totalConcepts !== undefined && (
        <p>
          Оцінено понять:{" "}
          <strong>
            {value.assessedConcepts ?? 0} із {value.totalConcepts}
          </strong>
        </p>
      )}

      {isOwner && value?.hasGroupDifficulty && (
        <p className="kg-mastery-preliminary">
          За цим поняттям є сигнал про навчальні труднощі. Перегляньте аналітику
          курсу для детальнішої інформації.
        </p>
      )}

      {!isOwner && isConcept && (
        <div className="kg-mastery-personal">
          <div className="kg-mastery-personal-heading">
            <Lightbulb size={17} />
            <h4>Що варто повторити?</h4>
          </div>

          {recommendation ? (
            <div className="kg-mastery-recommendation">
              <span
                className={`kg-mastery-priority kg-mastery-priority--${recommendation.priority.toLowerCase()}`}
              >
                {getRecommendationPriorityLabel(recommendation.priority)}
              </span>

              <p>{recommendation.reason}</p>
            </div>
          ) : (
            <p className="kg-mastery-no-recommendation">
              Для цього поняття поки немає персональної рекомендації щодо
              повторення.
            </p>
          )}

          {conceptDetails?.prerequisiteRiskPercent != null && (
            <div className="kg-mastery-prerequisite-risk">
              <span>Можливі труднощі через базові знання</span>

              <strong>
                {formatAnalyticsPercent(conceptDetails.prerequisiteRiskPercent)}
              </strong>
            </div>
          )}

          {weakPrerequisiteIds.length > 0 && (
            <div className="kg-mastery-personal-section">
              <h5>Спочатку варто повторити</h5>

              <p>
                Ці базові поняття можуть допомогти краще зрозуміти вибраний
                матеріал.
              </p>

              <div className="kg-mastery-prerequisite-list">
                {weakPrerequisiteIds.map((id) => {
                  const prerequisite = mastery.studentConceptDetails?.get(id);

                  return (
                    <button
                      key={id}
                      type="button"
                      className="kg-mastery-prerequisite-button"
                      disabled={!prerequisite}
                      onClick={() => onOpenConcept(id)}
                    >
                      <span>{prerequisite?.name ?? "Базове поняття"}</span>

                      <ChevronRight size={15} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {materials.length > 0 && (
            <div className="kg-mastery-personal-section">
              <h5>
                {hasRecommendedMaterials
                  ? "Матеріали для повторення"
                  : "Матеріали за цим поняттям"}
              </h5>

              <div className="kg-mastery-materials">
                {materials.map((material) => (
                  <div
                    key={material.materialId}
                    className="kg-mastery-material-card"
                  >
                    <Link
                      to={`/courses/${courseId}#material-${material.materialId}`}
                      className="kg-mastery-material-link"
                    >
                      <BookOpen size={15} />

                      <span>{material.materialTitle}</span>

                      <ChevronRight size={15} />
                    </Link>

                    {material.excerpt && (
                      <blockquote>{material.excerpt}</blockquote>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!isOwner && !isConcept && (
        <p className="kg-mastery-topic-hint">
          Виберіть окреме поняття на графі, щоб переглянути персональні
          рекомендації та навчальні матеріали.
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
