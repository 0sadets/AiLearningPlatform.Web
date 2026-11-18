import { useMemo, useState } from "react";
import {
  ChevronDown,
  Layers3,
  Search,
} from "lucide-react";

import type {
  KnowledgeTopicDto,
} from "../../types/knowledgeGraph";

interface Props {
  topics: KnowledgeTopicDto[];
  selectedTopicId: number | null;
  onNavigate: (topicId: number) => void;
}

export default function KnowledgeTopicsNavigator({
  topics,
  selectedTopicId,
  onNavigate,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const sortedTopics = useMemo(
    () =>
      [...topics].sort(
        (a, b) => a.order - b.order || a.id - b.id,
      ),
    [topics],
  );

  const filteredTopics = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("uk-UA");

    if (!query) {
      return sortedTopics;
    }

    return sortedTopics.filter((topic) =>
      topic.name
        .toLocaleLowerCase("uk-UA")
        .includes(query),
    );
  }, [sortedTopics, search]);

  const handleNavigate = (topicId: number) => {
    setIsOpen(false);
    setSearch("");
    onNavigate(topicId);
  };

  return (
    <div className="kg-topics-nav">
      <button
        type="button"
        className={`kg-topics-nav-trigger ${
          isOpen ? "kg-topics-nav-trigger--active" : ""
        }`}
        aria-expanded={isOpen}
        aria-controls="kg-topics-nav-panel"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="kg-topics-nav-trigger-icon">
          <Layers3 size={18} />
        </span>

        <span className="kg-topics-nav-trigger-text">
          <strong>Перейти до теми</strong>
          <small>Навчальних тем: {topics.length}</small>
        </span>

        <ChevronDown
          size={17}
          className={`kg-topics-nav-chevron ${
            isOpen ? "kg-topics-nav-chevron--open" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          id="kg-topics-nav-panel"
          className="kg-topics-nav-panel"
        >
          <div className="kg-topics-nav-search">
            <Search size={16} />

            <input
              type="search"
              value={search}
              placeholder="Знайти навчальну тему..."
              aria-label="Пошук навчальної теми"
              onChange={(event) =>
                setSearch(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setIsOpen(false);
                  setSearch("");
                }
              }}
            />
          </div>

          <div className="kg-topics-nav-list">
            {filteredTopics.length === 0 ? (
              <div className="kg-topics-nav-empty">
                Тем за таким запитом не знайдено.
              </div>
            ) : (
              filteredTopics.map((topic) => {
                const isSelected =
                  selectedTopicId === topic.id;

                return (
                  <button
                    key={topic.id}
                    type="button"
                    className={`kg-topics-nav-item ${
                      isSelected
                        ? "kg-topics-nav-item--active"
                        : ""
                    }`}
                    aria-current={
                      isSelected ? "location" : undefined
                    }
                    title={topic.name}
                    onClick={() =>
                      handleNavigate(topic.id)
                    }
                  >
                    <span className="kg-topics-nav-number">
                      {String(topic.order).padStart(2, "0")}
                    </span>

                    <span className="kg-topics-nav-item-info">
                      <strong>{topic.name}</strong>
                      <small>
                        Понять: {topic.conceptIds.length}
                      </small>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="kg-topics-nav-footer">
            Оберіть тему для переходу до неї
          </div>
        </div>
      )}
    </div>
  );
}