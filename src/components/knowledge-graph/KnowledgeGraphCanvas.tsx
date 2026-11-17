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

import dagre from "@dagrejs/dagre";

import type {
  CourseKnowledgeGraphDto,
  CourseKnowledgeTopicsDto,
  KnowledgeGraphSelection,
  KnowledgeGraphViewMode,
  KnowledgeRelationType,
} from "../../types/knowledgeGraph";

import { RELATION_INFO } from "../../utils/knowledgeGraph";

import "@xyflow/react/dist/style.css";

type KnowledgeNodeData = {
  label: string;
  subtitle: string;
  kind: "concept" | "topic";
  order?: number;
  dimmed: boolean;
} & Record<string, unknown>;

type KnowledgeFlowNode = Node<
  KnowledgeNodeData,
  "knowledge"
>;

interface KnowledgeGraphCanvasProps {
  graph: CourseKnowledgeGraphDto;
  topics: CourseKnowledgeTopicsDto | null;
  mode: KnowledgeGraphViewMode;
  selected: KnowledgeGraphSelection;
  search: string;
  relationFilter: KnowledgeRelationType | null;
  onSelect: (selection: KnowledgeGraphSelection) => void;
}

const CONCEPT_WIDTH = 252;
const CONCEPT_HEIGHT = 114;

const TOPIC_WIDTH = 280;
const TOPIC_HEIGHT = 132;

function KnowledgeNode({
  data,
  selected,
}: NodeProps<KnowledgeFlowNode>) {
  return (
    <div
      className={[
        "kg-node",
        `kg-node--${data.kind}`,
        selected ? "kg-node--selected" : "",
        data.dimmed ? "kg-node--dimmed" : "",
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
  {data.kind === "topic"
    ? `Навчальна тема · №${data.order}`
    : "Поняття"}
</span>

    <strong
  className="kg-node-title"
  title={data.label}
>
  {data.label}
</strong>

{data.subtitle && (
  <span className="kg-node-subtitle">
    {data.subtitle}
  </span>
)}

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
  graph: CourseKnowledgeGraphDto,
  topics: CourseKnowledgeTopicsDto,
): KnowledgeFlowNode[] {
  const sortedTopics = [...topics.topics].sort(
    (a, b) => a.order - b.order || a.id - b.id,
  );

  const activeConceptIds = new Set(
    graph.concepts.map((concept) => concept.id),
  );

  const primaryTopicIds = new Map<number, number>();

  for (const topic of sortedTopics) {
    for (const conceptId of topic.conceptIds) {
      if (
        activeConceptIds.has(conceptId) &&
        !primaryTopicIds.has(conceptId)
      ) {
        primaryTopicIds.set(conceptId, topic.id);
      }
    }
  }

  const positions = new Map<
    string,
    { x: number; y: number }
  >();

  const topicX = 40;
  const conceptX = 470;
  const conceptStep = 148;
  const groupGap = 52;

  let currentY = 40;

  for (const topic of sortedTopics) {
    const groupConcepts = graph.concepts
      .filter(
        (concept) =>
          primaryTopicIds.get(concept.id) === topic.id,
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, "uk-UA"),
      );

    const groupHeight = Math.max(
      TOPIC_HEIGHT,
      groupConcepts.length * conceptStep,
    );

    positions.set(`topic-${topic.id}`, {
      x: topicX,
      y: currentY + (groupHeight - TOPIC_HEIGHT) / 2,
    });

    groupConcepts.forEach((concept, index) => {
      positions.set(String(concept.id), {
        x: conceptX,
        y:
          currentY +
          index * conceptStep +
          (conceptStep - CONCEPT_HEIGHT) / 2,
      });
    });

    currentY += groupHeight + groupGap;
  }

  const unassignedConcepts = graph.concepts
    .filter((concept) => !primaryTopicIds.has(concept.id))
    .sort((a, b) =>
      a.name.localeCompare(b.name, "uk-UA"),
    );

  unassignedConcepts.forEach((concept, index) => {
    positions.set(String(concept.id), {
      x: conceptX,
      y: currentY + index * conceptStep,
    });
  });

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
  onSelect,
}: KnowledgeGraphCanvasProps) {
  const flowRef = useRef<
    ReactFlowInstance<KnowledgeFlowNode, Edge> | null
  >(null);

  const { nodes, edges } = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("uk-UA");

    const conceptNodes: KnowledgeFlowNode[] =
      graph.concepts.map((concept) => ({
        id: String(concept.id),
        type: "knowledge",
        position: { x: 0, y: 0 },
        selected:
          selected?.kind === "concept" &&
          selected.id === concept.id,

       data: {
  label: concept.name,
  subtitle: concept.isManuallyEdited
    ? "Редаговано вручну"
    : "",
  kind: "concept",
          dimmed:
            query.length > 0 &&
            !concept.name
              .toLocaleLowerCase("uk-UA")
              .includes(query),
        },
      }));

    let flowNodes = conceptNodes;
    let flowEdges: Edge[] = [];

    if (mode === "topics") {
      const activeTopics = [...(topics?.topics ?? [])].sort(
        (a, b) => a.order - b.order || a.id - b.id,
        );

      const topicNodes: KnowledgeFlowNode[] =
        activeTopics.map((topic) => ({
          id: `topic-${topic.id}`,
          type: "knowledge",
          position: { x: 0, y: 0 },

          selected:
            selected?.kind === "topic" &&
            selected.id === topic.id,

       data: {
  label: topic.name,
  subtitle: `${topic.conceptIds.length} понять`,
  kind: "topic",
  order: topic.order,
  dimmed: false,
},
        }));

      const activeConceptIds = new Set(
        graph.concepts.map((concept) => concept.id),
      );

      flowNodes = [...topicNodes, ...conceptNodes];

      flowEdges = activeTopics.flatMap((topic) =>
        topic.conceptIds
          .filter((id) => activeConceptIds.has(id))
          .map((conceptId) => ({
            id: `membership-${topic.id}-${conceptId}`,
            source: `topic-${topic.id}`,
            target: String(conceptId),
            type: "smoothstep",
            selectable: false,
            style: {
              stroke: "#c7d2fe",
              strokeWidth: 1.5,
            },
          })),
      );
    } else {
      flowEdges = graph.relations
        .filter(
          (relation) =>
            relationFilter === null ||
            relation.type === relationFilter,
        )
        .map((relation) => {
          const info = RELATION_INFO[relation.type];

          return {
            id: String(relation.id),
            source: String(relation.sourceConceptId),
            target: String(relation.targetConceptId),
            type: "default",
            selected:
              selected?.kind === "relation" &&
              selected.id === relation.id,

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
              relation.type === 1
                ? undefined
                : {
                    type: MarkerType.ArrowClosed,
                    color: info.color,
                    width: 18,
                    height: 18,
                  },

            style: {
              stroke: info.color,
              strokeWidth: 1.8,
            },
          };
        });
    }

  return {
  nodes:
    mode === "topics" && topics?.isCurrent
      ? applyTopicsLayout(flowNodes, graph, topics)
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
  ]);

  useEffect(() => {
    if (!selected || selected.kind === "relation") {
      return;
    }

    const nodeId =
      selected.kind === "topic"
        ? `topic-${selected.id}`
        : String(selected.id);

    const node = nodes.find((item) => item.id === nodeId);

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
  }, [nodes, selected]);

  if (graph.concepts.length === 0) {
    return (
      <div className="kg-canvas-empty">
        <h3>У графі поки немає понять</h3>
        <p>
          Актуалізуйте граф на основі навчальних
          матеріалів курсу.
        </p>
      </div>
    );
  }

  return (
    <div className="kg-canvas">
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
          if (node.id.startsWith("topic-")) {
            onSelect({
              kind: "topic",
              id: Number(node.id.replace("topic-", "")),
            });
          } else {
            onSelect({
              kind: "concept",
              id: Number(node.id),
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

        <Controls
          showInteractive={false}
          position="bottom-left"
        />

        <MiniMap
          pannable
          zoomable
          nodeColor={(node) =>
            node.id.startsWith("topic-")
              ? "#a5b4fc"
              : "#cbd5e1"
          }
        />
      </ReactFlow>
    </div>
  );
}