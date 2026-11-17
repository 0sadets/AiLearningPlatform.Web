import {
  KnowledgeRelationType,
  type CourseKnowledgeGraphDto,
  type CreateKnowledgeRelationDto,
} from "../types/knowledgeGraph";

export function validateKnowledgeRelation(
  graph: CourseKnowledgeGraphDto,
  dto: CreateKnowledgeRelationDto,
  editingRelationId?: number,
): string | null {
  const {
    sourceConceptId,
    targetConceptId,
    type,
  } = dto;

  const activeConceptIds = new Set(
    graph.concepts.map((concept) => concept.id),
  );

  // Обидва поняття мають існувати
  if (
    !activeConceptIds.has(sourceConceptId) ||
    !activeConceptIds.has(targetConceptId)
  ) {
    return "Виберіть два поняття графа.";
  }

  // Поняття не може посилатися саме на себе
  if (sourceConceptId === targetConceptId) {
    return "Не можна створити зв'язок поняття із самим собою.";
  }

  // Перевірка типу
  if (
    !Object.values(KnowledgeRelationType).includes(type)
  ) {
    return "Оберіть коректний тип зв'язку.";
  }

  // Один зв'язок на одну пару понять,
  // незалежно від типу та напрямку
  const duplicate = graph.relations.some((relation) => {
    if (relation.id === editingRelationId) {
      return false;
    }

    const sameDirection =
      relation.sourceConceptId === sourceConceptId &&
      relation.targetConceptId === targetConceptId;

    const reverseDirection =
      relation.sourceConceptId === targetConceptId &&
      relation.targetConceptId === sourceConceptId;

    return sameDirection || reverseDirection;
  });

  if (duplicate) {
    return "Між вибраними поняттями вже існує семантичний зв'язок. Ви можете відредагувати наявний.";
  }

  // Ненапрямлений зв'язок не утворює
  // напрямленого циклу
  if (type === KnowledgeRelationType.RelatedTo) {
    return null;
  }

  // Будуємо список напрямлених зв'язків
  // лише відповідного типу
  const adjacency = new Map<number, number[]>();

  graph.relations.forEach((relation) => {
    if (
      relation.id === editingRelationId ||
      relation.type !== type
    ) {
      return;
    }

    const targets =
      adjacency.get(relation.sourceConceptId) ?? [];

    targets.push(relation.targetConceptId);

    adjacency.set(relation.sourceConceptId, targets);
  });

  // Якщо з цільового поняття вже існує
  // шлях до вихідного, нове ребро утворить цикл
  const visited = new Set<number>();
  const stack = [targetConceptId];

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (current === sourceConceptId) {
      return "Цей зв'язок утворить цикл між поняттями. Змініть напрямок або тип відношення.";
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    const next = adjacency.get(current) ?? [];

    for (const target of next) {
      if (!visited.has(target)) {
        stack.push(target);
      }
    }
  }

  return null;
}