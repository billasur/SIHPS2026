import { memo, useState, useEffect, useRef, useMemo } from 'react';
import { Search, Command, ArrowRight, Hash, X } from 'lucide-react';

function CommandPalette({
  open,
  onClose,
  searchTerm,
  onSearchChange,
  data,
  fuzzyFilteredIds,
  onSelectProblem,
  categoryFilter,
  themeFilter,
  onCategoryFilterChange,
  onThemeFilterChange,
  onClearAll,
}) {
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const itemRefs = useRef([]);

  // Derive unique categories and themes for quick actions
  const categories = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map((d) => d.category).filter(Boolean))].sort();
  }, [data]);

  const themes = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map((d) => d.theme).filter(Boolean))].sort();
  }, [data]);

  // Filter results based on search term
  const results = useMemo(() => {
    if (!searchTerm || !searchTerm.trim() || !data) return [];
    if (fuzzyFilteredIds) {
      const idSet = new Set(fuzzyFilteredIds);
      return data.filter(d => idSet.has(d.ps_number)).slice(0, 50);
    }
    return [];
  }, [searchTerm, data, fuzzyFilteredIds]);

  // Reset highlighted index when results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [results]);

  // Auto-focus input and manage keyboard events when open changes
  useEffect(() => {
    if (!open) return;

    // Focus the input after a brief delay to ensure the modal is rendered
    const focusTimeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      const itemCount = results.length;
      if (itemCount === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % itemCount);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + itemCount) % itemCount);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[highlightedIndex]) {
          onSelectProblem(results[highlightedIndex]);
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimeout);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, results, highlightedIndex, onClose, onSelectProblem]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [highlightedIndex]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Toggle a category filter
  const toggleCategory = (cat) => {
    if (categoryFilter.includes(cat)) {
      onCategoryFilterChange(categoryFilter.filter((c) => c !== cat));
    } else {
      onCategoryFilterChange([...categoryFilter, cat]);
    }
  };

  // Toggle a theme filter
  const toggleTheme = (theme) => {
    if (themeFilter.includes(theme)) {
      onThemeFilterChange(themeFilter.filter((t) => t !== theme));
    } else {
      onThemeFilterChange([...themeFilter, theme]);
    }
  };

  if (!open) return null;

  const hasSearchTerm = searchTerm && searchTerm.trim().length > 0;
  const hasActiveFilters =
    (categoryFilter && categoryFilter.length > 0) ||
    (themeFilter && themeFilter.length > 0);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="max-w-2xl w-full mx-4 bg-white dark:bg-gray-900 rounded-lg shadow-2xl dark:shadow-black/50 border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <Search
            size={20}
            className="text-gray-400 dark:text-gray-500 shrink-0"
          />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search problem statements..."
            className="flex-1 text-lg bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:outline-none focus:ring-0 border-none"
          />
          {hasSearchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
            <Command size={12} />K
          </kbd>
        </div>

        {/* Content Area */}
        <div
          ref={listRef}
          className="max-h-[360px] overflow-y-auto overscroll-contain"
        >
          {hasSearchTerm ? (
            // Search Results
            results.length > 0 ? (
              <ul className="py-2">
                {results.map((item, index) => (
                  <li
                    key={item.ps_number || index}
                    ref={(el) => (itemRefs.current[index] = el)}
                    onClick={() => {
                      onSelectProblem(item);
                      onClose();
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      index === highlightedIndex
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-1.5 py-0.5 rounded shrink-0">
                          {item.ps_number}
                        </span>
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                          {item.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="truncate">{item.organization}</span>
                        {item.category && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">
                              •
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 shrink-0">
                              {item.category}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <ArrowRight
                      size={16}
                      className={`shrink-0 transition-opacity ${
                        index === highlightedIndex
                          ? 'opacity-100 text-blue-500 dark:text-blue-400'
                          : 'opacity-0'
                      }`}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-12 text-center">
                <Search
                  size={40}
                  className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No results found for{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    "{searchTerm}"
                  </span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Try searching by PS number, title, organization, or theme
                </p>
              </div>
            )
          ) : (
            // Quick Actions (shown when no search term)
            <div className="py-3">
              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="px-4 pb-3 mb-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Active Filters
                    </span>
                    <button
                      onClick={onClearAll}
                      className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {categoryFilter.map((cat) => (
                      <button
                        key={`active-cat-${cat}`}
                        onClick={() => toggleCategory(cat)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/70 transition-colors"
                      >
                        {cat}
                        <X size={12} />
                      </button>
                    ))}
                    {themeFilter.map((theme) => (
                      <button
                        key={`active-theme-${theme}`}
                        onClick={() => toggleTheme(theme)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/70 transition-colors"
                      >
                        {theme}
                        <X size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Shortcuts */}
              <div className="px-4 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Hash
                    size={14}
                    className="text-gray-400 dark:text-gray-500"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Filter by Category
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => {
                    const isActive = categoryFilter.includes(cat);
                    return (
                      <button
                        key={`cat-${cat}`}
                        onClick={() => toggleCategory(cat)}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Theme Shortcuts */}
              <div className="px-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hash
                    size={14}
                    className="text-gray-400 dark:text-gray-500"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Filter by Theme
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto">
                  {themes.map((theme) => {
                    const isActive = themeFilter.includes(theme);
                    return (
                      <button
                        key={`theme-${theme}`}
                        onClick={() => toggleTheme(theme)}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                          isActive
                            ? 'bg-purple-600 text-white dark:bg-purple-500 dark:text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {theme}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Hints */}
        <div className="flex items-center justify-center gap-4 px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-600">
              ↑↓
            </kbd>
            Navigate
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-600">
              ↵
            </kbd>
            Select
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-600">
              Esc
            </kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(CommandPalette);
