import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GitHubRepo } from "../lib/types";

interface Props {
  repos: GitHubRepo[];
}

// Tags that represent project type (shown as filter chips)
const TYPE_TAGS = ["automation", "chatbot", "game-tool", "research"];
// Tags that represent project status (shown as badge on card)
const STATUS_TAGS = ["active", "stable", "archived"];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-green-500/15 border-green-500/30", text: "text-green-400" },
  stable: { bg: "bg-blue-500/15 border-blue-500/30", text: "text-blue-400" },
  archived: { bg: "bg-gray-500/15 border-gray-500/30", text: "text-gray-400" },
};

export default function ProjectSearch({ repos }: Props) {
  const [search, setSearch] = useState("");
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const languages = useMemo(() => {
    const langSet = new Map<string, string>();
    for (const repo of repos) {
      if (repo.primaryLanguage) {
        langSet.set(repo.primaryLanguage.name, repo.primaryLanguage.color);
      }
    }
    return Array.from(langSet.entries())
      .map(([name, color]) => ({ name, color }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [repos]);

  // Extract type and status tags that actually exist in the repos
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    for (const repo of repos) {
      for (const topic of repo.topics) {
        if (TYPE_TAGS.includes(topic)) types.add(topic);
      }
    }
    return Array.from(types).sort();
  }, [repos]);

  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    for (const repo of repos) {
      for (const topic of repo.topics) {
        if (STATUS_TAGS.includes(topic)) statuses.add(topic);
      }
    }
    return Array.from(statuses).sort();
  }, [repos]);

  const filtered = useMemo(() => {
    return repos.filter((repo) => {
      const matchesSearch =
        !search ||
        repo.name.toLowerCase().includes(search.toLowerCase()) ||
        (repo.description || "").toLowerCase().includes(search.toLowerCase());
      const matchesLang =
        !selectedLang || repo.primaryLanguage?.name === selectedLang;
      const matchesType =
        !selectedType || repo.topics.includes(selectedType);
      const matchesStatus =
        !selectedStatus || repo.topics.includes(selectedStatus);
      return matchesSearch && matchesLang && matchesType && matchesStatus;
    });
  }, [repos, search, selectedLang, selectedType, selectedStatus]);

  const getStatusTag = (topics: string[]) =>
    topics.find((t) => STATUS_TAGS.includes(t));

  const getTypeTags = (topics: string[]) =>
    topics.filter((t) => TYPE_TAGS.includes(t));

  // Non-category topics (e.g. "python", "opencv" — anything not in TYPE_TAGS or STATUS_TAGS)
  const getOtherTopics = (topics: string[]) =>
    topics.filter((t) => !TYPE_TAGS.includes(t) && !STATUS_TAGS.includes(t));

  const clearAllFilters = () => {
    setSelectedLang(null);
    setSelectedType(null);
    setSelectedStatus(null);
    setSearch("");
  };

  const hasActiveFilters = search || selectedLang || selectedType || selectedStatus;

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };

  return (
    <div>
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="space-y-3 mb-8">
        {/* Type filters */}
        {availableTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium w-12 shrink-0">Type</span>
            {availableTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? null : type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedType === type
                    ? "bg-primary-500/20 text-primary-300 border border-primary-500/30"
                    : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        {/* Status filters */}
        {availableStatuses.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium w-12 shrink-0">Status</span>
            {availableStatuses.map((status) => {
              const style = STATUS_STYLES[status];
              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    selectedStatus === status
                      ? `${style.bg} ${style.text}`
                      : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        )}

        {/* Language filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium w-12 shrink-0">Lang</span>
          <button
            onClick={() => setSelectedLang(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              !selectedLang
                ? "bg-primary-500/20 text-primary-300 border border-primary-500/30"
                : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            All
          </button>
          {languages.map((lang) => (
            <button
              key={lang.name}
              onClick={() =>
                setSelectedLang(selectedLang === lang.name ? null : lang.name)
              }
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                selectedLang === lang.name
                  ? "bg-primary-500/20 text-primary-300 border border-primary-500/30"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: lang.color }}
              />
              {lang.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results count + clear */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {filtered.length} project{filtered.length !== 1 ? "s" : ""} found
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-gray-500 hover:text-primary-400 transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((repo) => {
            const statusTag = getStatusTag(repo.topics);
            const typeTags = getTypeTags(repo.topics);
            const otherTopics = getOtherTopics(repo.topics);
            const statusStyle = statusTag ? STATUS_STYLES[statusTag] : null;

            return (
              <motion.a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="group p-6 flex flex-col gap-3 glass-hover h-full"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-gray-100 group-hover:text-primary-400 transition-colors truncate">
                    {repo.name}
                  </h3>
                  <div className="flex items-center gap-2 shrink-0">
                    {statusTag && statusStyle && (
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusTag}
                      </span>
                    )}
                    <svg
                      className="w-4 h-4 text-gray-500 group-hover:text-primary-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 17L17 7M17 7H7M17 7v10"
                      />
                    </svg>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 line-clamp-2 flex-1">
                  {repo.description || "No description provided."}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                  <div className="flex items-center gap-3">
                    {repo.primaryLanguage && (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: repo.primaryLanguage.color,
                          }}
                        />
                        {repo.primaryLanguage.name}
                      </span>
                    )}
                    {repo.stargazerCount > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {repo.stargazerCount}
                      </span>
                    )}
                  </div>
                  <span>{timeAgo(repo.updatedAt)}</span>
                </div>

                {/* Tags */}
                {(typeTags.length > 0 || otherTopics.length > 0) && (
                  <div className="flex flex-wrap gap-1.5">
                    {typeTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-[10px] font-medium text-accent-400 bg-accent-500/10 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {otherTopics.slice(0, 3).map((topic) => (
                      <span
                        key={topic}
                        className="px-2 py-0.5 text-[10px] font-medium text-primary-300 bg-primary-500/10 rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </motion.a>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">No projects match your filters.</p>
        </div>
      )}
    </div>
  );
}
