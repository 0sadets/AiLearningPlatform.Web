import { useEffect, useMemo, useRef } from "react";

import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";

import {
  getGraphMasteryLabel,
  getGraphMasteryTone,
  type GraphMasteryData,
  type GraphMasteryTone,
} from "../../utils/knowledgeGraphMastery";

import dagre from "@dagrejs/dagre";

import type {
  CourseKnowledgeGraphDto,
  CourseKnowledgeTopicsDto,
  KnowledgeGraphSelection,
  KnowledgeGraphViewMode,
} from "../../types/knowledgeGraph";

import { KnowledgeRelationType } from "../../types/knowledgeGraph";

import { RELATION_INFO } from "../../utils/knowledgeGraph";
import KnowledgeTopicsNavigator from "./KnowledgeTopicsNavigator";

import "@xyflow/react/dist/style.css";

type KnowledgeNodeData = {
  label: string;
  subtitle: string;
  kind: "concept" | "topic";
  conceptId?: number;
  order?: number;
  dimmed: boolean;
  focusLevel?: "center" | "neighbor" | "muted";

  masteryTone?: GraphMasteryTone;
  masteryLabel?: string;
  masteryLimited?: boolean;
} & Record<string, unknown>;

type KnowledgeFlowNode = Node<KnowledgeNodeData, "knowledge">;

interface KnowledgeGraphCanvasProps {
  graph: CourseKnowledgeGraphDto;
  topics: CourseKnowledgeTopicsDto | null;
  mode: KnowledgeGraphViewMode;
  selected: KnowledgeGraphSelection;
  search: string;
  mastery?: GraphMasteryData | null;
  relationFilter: KnowledgeRelationType | null;
  focusedConceptId: number | null;
  onSelect: (selection: KnowledgeGraphSelection) => void;
}

const CONCEPT_WIDTH = 252;
const CONCEPT_HEIGHT = 114;

const TOPIC_WIDTH = 280;
const TOPIC_HEIGHT = 132;

function KnowledgeNode({ data, selected }: NodeProps<KnowledgeFlowNode>) {
  return (
    <div
      className={[
        "kg-node",
        `kg-node--${data.kind}`,
        selected ? "kg-node--selected" : "",
        data.dimmed ? "kg-node--dimmed" : "",
        data.focusLevel ? `kg-node--focus-${data.focusLevel}` : "",
        data.masteryTone ? `kg-node--mastery-${data.masteryTone}` : "",
        data.masteryLimited ? "kg-node--mastery-limited" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="kg-node-handle"
        isConnectable={false}
      />

      <span className="kg-node-kind">
        {data.kind === "topic" ? `Навчальна тема · №${data.order}` : "Поняття"}
      </span>

      <strong className="kg-node-title" title={data.label}>
        {data.label}
      </strong>

      {data.masteryLabel ? (
        <span
          className="kg-node-mastery"
          title={
            data.masteryLimited
              ? "Попередній результат. Для точнішого оцінювання потрібно більше відповідей."
              : data.masteryLabel
          }
        >
          {data.masteryLabel}
        </span>
      ) : data.subtitle ? (
        <span className="kg-node-subtitle">{data.subtitle}</span>
      ) : null}

      <Handle
        type="source"
        position={Position.Right}
        className="kg-node-handle"
        isConnectable={false}
      />
    </div>
  );
}

const nodeTypes = {
  knowledge: KnowledgeNode,
};

function getNodeSize(node: KnowledgeFlowNode) {
  return node.data.kind === "topic"
    ? { width: TOPIC_WIDTH, height: TOPIC_HEIGHT }
    : { width: CONCEPT_WIDTH, height: CONCEPT_HEIGHT };
}

function getNodeMastery(
  mastery: GraphMasteryData | null,
  kind: "concept" | "topic",
  id: number,
): Pick<KnowledgeNodeData, "masteryTone" | "masteryLabel" | "masteryLimited"> {
  if (!mastery) {
    return {};
  }

  const value =
    kind === "concept" ? mastery.concepts.get(id) : mastery.topics.get(id);

  return {
    masteryTone: getGraphMasteryTone(value),
    masteryLabel: getGraphMasteryLabel(value),
    masteryLimited: value?.dataStatus === "Limited",
  };
}

function applyAutomaticLayout(
  nodes: KnowledgeFlowNode[],
  edges: Edge[],
): KnowledgeFlowNode[] {
  if (nodes.length === 0) {
    return [];
  }

  const layoutGraph = new dagre.graphlib.Graph();

  layoutGraph.setDefaultEdgeLabel(() => ({}));

  layoutGraph.setGraph({
    rankdir: "LR",
    nodesep: 38,
    ranksep: 120,
    marginx: 48,
    marginy: 48,
  });

  nodes.forEach((node) => {
    const size = getNodeSize(node);

    layoutGraph.setNode(node.id, size);
  });

  edges.forEach((edge) => {
    layoutGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(layoutGraph);

  return nodes.map((node) => {
    const position = layoutGraph.node(node.id) as {
      x: number;
      y: number;
    };

    const size = getNodeSize(node);

    return {
      ...node,
      position: {
        x: position.x - size.width / 2,
        y: position.y - size.height / 2,
      },
    };
  });
}

function applyTopicsLayout(
  nodes: KnowledgeFlowNode[],
  topics: CourseKnowledgeTopicsDto,
): KnowledgeFlowNode[] {
  const sortedTopics = [...topics.topics].sort(
    (a, b) => a.order - b.order || a.id - b.id,
  );

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const positions = new Map<string, { x: number; y: number }>();

  const topicX = 40;
  const conceptX = 470;
  const conceptStep = 148;
  const groupGap = 52;

  let currentY = 40;

  for (const topic of sortedTopics) {
    const topicConceptNodes = topic.conceptIds
      .map((conceptId) =>
        nodeById.get(`topic-concept-${topic.id}-${conceptId}`),
      )
      .filter((node): node is KnowledgeFlowNode => node !== undefined)
      .sort((a, b) => a.data.label.localeCompare(b.data.label, "uk-UA"));

    const groupHeight = Math.max(
      TOPIC_HEIGHT,
      topicConceptNodes.length * conceptStep,
    );

    positions.set(`topic-${topic.id}`, {
      x: topicX,
      y: currentY + (groupHeight - TOPIC_HEIGHT) / 2,
    });

    topicConceptNodes.forEach((node, index) => {
      positions.set(node.id, {
        x: conceptX,
        y: currentY + index * conceptStep + (conceptStep - CONCEPT_HEIGHT) / 2,
      });
    });

    currentY += groupHeight + groupGap;
  }

  return nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) ?? node.position,
  }));
}

export default function KnowledgeGraphCanvas({
  graph,
  topics,
  mode,
  selected,
  search,
  relationFilter,
  focusedConceptId,
  mastery = null,
  onSelect,
}: KnowledgeGraphCanvasProps) {
  const flowRef = useRef<ReactFlowInstance<KnowledgeFlowNode, Edge> | null>(
    null,
  );
  const skipNextAutoFocusRef = useRef(false);

  const lastAutoFocusKeyRef = useRef<string | null>(null);

  const { nodes, edges } = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("uk-UA");

    const visibleRelations = graph.relations.filter(
      (relation) => relationFilter === null || relation.type === relationFilter,
    );

    const focusNeighborIds = new Set<number>();

    if (mode === "relations" && focusedConceptId !== null) {
      for (const relation of visibleRelations) {
        if (relation.sourceConceptId === focusedConceptId) {
          focusNeighborIds.add(relation.targetConceptId);
        }

        if (relation.targetConceptId === focusedConceptId) {
          focusNeighborIds.add(relation.sourceConceptId);
        }
      }
    }

    const conceptNodes: KnowledgeFlowNode[] = graph.concepts.map((concept) => ({
      id: String(concept.id),
      type: "knowledge",
      position: { x: 0, y: 0 },
      selected: selected?.kind === "concept" && selected.id === concept.id,

      data: {
        label: concept.name,
        subtitle: concept.isManuallyEdited ? "Редаговано вручну" : "",
        kind: "concept",
        ...getNodeMastery(mastery, "concept", concept.id),

        focusLevel:
          mode !== "relations" || focusedConceptId === null
            ? undefined
            : concept.id === focusedConceptId
              ? "center"
              : focusNeighborIds.has(concept.id)
                ? "neighbor"
                : "muted",

        dimmed:
          focusedConceptId === null &&
          query.length > 0 &&
          !concept.name.toLocaleLowerCase("uk-UA").includes(query),
      },
    }));

    let flowNodes = conceptNodes;
    let flowEdges: Edge[] = [];

    if (mode === "topics") {
      const activeTopics = [...(topics?.topics ?? [])].sort(
        (a, b) => a.order - b.order || a.id - b.id,
      );

      const conceptById = new Map(
        graph.concepts.map((concept) => [concept.id, concept]),
      );

      const membershipCounts = new Map<number, number>();

      activeTopics.forEach((topic) => {
        topic.conceptIds.forEach((conceptId) => {
          membershipCounts.set(
            conceptId,
            (membershipCounts.get(conceptId) ?? 0) + 1,
          );
        });
      });

      const topicNodes: KnowledgeFlowNode[] = activeTopics.map((topic) => ({
        id: `topic-${topic.id}`,
        type: "knowledge",
        position: { x: 0, y: 0 },

        selected: selected?.kind === "topic" && selected.id === topic.id,

        data: {
          label: topic.name,
          subtitle: `${topic.conceptIds.length} понять`,
          kind: "topic",
          order: topic.order,
          dimmed: false,

          ...getNodeMastery(mastery, "topic", topic.id),
        },
      }));

      const topicConceptNodes: KnowledgeFlowNode[] = activeTopics.flatMap(
        (topic) =>
          topic.conceptIds.flatMap((conceptId): KnowledgeFlowNode[] => {
            const concept = conceptById.get(conceptId);

            if (!concept) {
              return [];
            }

            const isShared = (membershipCounts.get(concept.id) ?? 0) > 1;

            const subtitle = [
              concept.isManuallyEdited ? "Редаговано вручну" : null,
              isShared ? "Є також в інших темах" : null,
            ]
              .filter(Boolean)
              .join(" · ");

            return [
              {
                id: `topic-concept-${topic.id}-${concept.id}`,
                type: "knowledge",
                position: { x: 0, y: 0 },

                selected:
                  selected?.kind === "concept" && selected.id === concept.id,

                data: {
                  label: concept.name,
                  subtitle,
                  kind: "concept",
                  conceptId: concept.id,

                  ...getNodeMastery(mastery, "concept", concept.id),

                  dimmed:
                    query.length > 0 &&
                    !concept.name.toLocaleLowerCase("uk-UA").includes(query),
                },
              },
            ];
          }),
      );

      flowNodes = [...topicNodes, ...topicConceptNodes];

      flowEdges = activeTopics.flatMap((topic) =>
        topic.conceptIds
          .filter((conceptId) => conceptById.has(conceptId))
          .map((conceptId) => ({
            id: `membership-${topic.id}-${conceptId}`,
            source: `topic-${topic.id}`,
            target: `topic-concept-${topic.id}-${conceptId}`,
            type: "smoothstep",
            selectable: false,
            style: {
              stroke: "#c7d2fe",
              strokeWidth: 1.5,
            },
          })),
      );
    } else {
      flowEdges = visibleRelations.map((relation) => {
        const info = RELATION_INFO[relation.type];

        const isFocusedRelation =
          focusedConceptId !== null &&
          (relation.sourceConceptId === focusedConceptId ||
            relation.targetConceptId === focusedConceptId);

        return {
          id: String(relation.id),
          source: String(relation.sourceConceptId),
          target: String(relation.targetConceptId),
          type: "default",

          selected:
            selected?.kind === "relation" && selected.id === relation.id,

          className:
            focusedConceptId === null
              ? undefined
              : isFocusedRelation
                ? "kg-edge--focus-active"
                : "kg-edge--focus-muted",

          label: info.label,
          labelStyle: {
            fontSize: 11,
            fontWeight: 600,
            fill: info.color,
          },

          labelBgStyle: {
            fill: "#ffffff",
            fillOpacity: 0.94,
          },

          labelBgPadding: [6, 4],
          labelBgBorderRadius: 5,

          markerEnd:
            relation.type === KnowledgeRelationType.RelatedTo
              ? undefined
              : {
                  type: MarkerType.ArrowClosed,
                  color: info.color,
                  width: 18,
                  height: 18,
                },

          style: {
            stroke: info.color,
            strokeWidth: isFocusedRelation ? 2.8 : 1.8,
          },
        };
      });
    }

    return {
      nodes:
        mode === "topics" && topics?.isCurrent
          ? applyTopicsLayout(flowNodes, topics)
          : applyAutomaticLayout(flowNodes, flowEdges),
      edges: flowEdges,
    };
  }, [
    graph,
    topics,
    mode,
    selected,
    search,
    relationFilter,
    focusedConceptId,
    mastery,
  ]);

  useEffect(() => {
    const selectionKey =
      selected && selected.kind !== "relation"
        ? `${mode}:${selected.kind}:${selected.id}`
        : null;

    if (selectionKey === lastAutoFocusKeyRef.current) {
      skipNextAutoFocusRef.current = false;
      return;
    }

    lastAutoFocusKeyRef.current = selectionKey;

    if (skipNextAutoFocusRef.current) {
      skipNextAutoFocusRef.current = false;
      return;
    }

    if (!selected || selected.kind === "relation") {
      return;
    }

    const node = nodes.find((item) => {
      if (selected.kind === "topic") {
        return item.id === `topic-${selected.id}`;
      }

      return (
        item.data.kind === "concept" &&
        (item.data.conceptId ?? Number(item.id)) === selected.id
      );
    });

    if (!node || !flowRef.current) {
      return;
    }

    const size = getNodeSize(node);

    void flowRef.current.setCenter(
      node.position.x + size.width / 2,
      node.position.y + size.height / 2,
      {
        zoom: 1,
        duration: 350,
      },
    );
  }, [mode, nodes, selected]);

  const handleNavigateToTopic = (topicId: number) => {
    if (mode !== "topics" || !flowRef.current) {
      return;
    }

    const node = nodes.find((item) => item.id === `topic-${topicId}`);

    if (!node) {
      return;
    }

    skipNextAutoFocusRef.current = true;

    onSelect({
      kind: "topic",
      id: topicId,
    });

    void flowRef.current.setCenter(
      node.position.x + TOPIC_WIDTH / 2,
      node.position.y + TOPIC_HEIGHT / 2,
      {
        zoom: 0.95,
        duration: 550,
      },
    );
  };

  if (graph.concepts.length === 0) {
    return (
      <div className="kg-canvas-empty">
        <h3>У графі поки немає понять</h3>
        <p>Актуалізуйте граф на основі навчальних матеріалів курсу.</p>
      </div>
    );
  }

  return (
    <div className="kg-canvas">
      {mode === "topics" && topics?.isCurrent && topics.topics.length > 0 && (
        <KnowledgeTopicsNavigator
          topics={topics.topics}
          selectedTopicId={selected?.kind === "topic" ? selected.id : null}
          onNavigate={handleNavigateToTopic}
        />
      )}

      <ReactFlow<KnowledgeFlowNode, Edge>
        key={mode}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesReconnectable={false}
        elementsSelectable
        minZoom={0.12}
        maxZoom={2}
        fitView
        fitViewOptions={{
          padding: 0.16,
          maxZoom: 1.15,
        }}
        onInit={(instance) => {
          flowRef.current = instance;
        }}
        onNodeClick={(_, node) => {
          skipNextAutoFocusRef.current = true;

          if (node.data.kind === "topic") {
            onSelect({
              kind: "topic",
              id: Number(node.id.replace("topic-", "")),
            });
          } else {
            onSelect({
              kind: "concept",
              id: node.data.conceptId ?? Number(node.id),
            });
          }
        }}
        onEdgeClick={(_, edge) => {
          if (mode === "relations") {
            onSelect({
              kind: "relation",
              id: Number(edge.id),
            });
          }
        }}
        onPaneClick={() => onSelect(null)}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="#e5e7eb"
        />

        <Controls showInteractive={false} position="bottom-left" />

        <MiniMap
          pannable
          zoomable
          nodeColor={(node) => {
            if (!mastery) {
              return node.data?.kind === "topic" ? "#a5b4fc" : "#cbd5e1";
            }

            switch (node.data?.masteryTone) {
              case "high":
                return "#22c55e";

              case "medium":
                return "#f59e0b";

              case "low":
                return "#ef4444";

              default:
                return "#94a3b8";
            }
          }}
        />
      </ReactFlow>
    </div>
  );
}
