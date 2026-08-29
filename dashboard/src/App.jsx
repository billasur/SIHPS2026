import { useState, useEffect, useMemo, useCallback } from 'react'
import { RefreshCw, X, Database, Sun, Moon, Command } from 'lucide-react'
import Fuse from 'fuse.js'
import DataTable from './components/DataTable'
import DetailDrawer from './components/DetailDrawer'
import ExportMenu from './components/ExportMenu'
import BulkActionsBar from './components/BulkActionsBar'
import CommandPalette from './components/CommandPalette'
import { useLocalStorageMap } from './hooks/useLocalStorageState'
import { useDarkMode } from './hooks/useDarkMode'
import * as XLSX from 'xlsx'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
function getQueryParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    search: params.get('q') || '',
    categories: params.get('cat') ? params.get('cat').split(',') : [],
    themes: params.get('theme') ? params.get('theme').split(',') : [],
  }
}

function setQueryParams({ search, categories, themes }) {
  const params = new URLSearchParams()
  if (search) params.set('q', search)
  if (categories.length > 0) params.set('cat', categories.join(','))
  if (themes.length > 0) params.set('theme', themes.join(','))
  const qs = params.toString()
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
  window.history.replaceState(null, '', newUrl)
}

export default function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const initial = getQueryParams()
  const [searchTerm, setSearchTerm] = useState(initial.search)
  const [categoryFilter, setCategoryFilter] = useState(initial.categories)
  const [themeFilter, setThemeFilter] = useState(initial.themes)
  const [statusFilter, setStatusFilter] = useState([])

  const [selectedProblem, setSelectedProblem] = useState(null)
  const [cmdkOpen, setCmdkOpen] = useState(false)

  const statusStore = useLocalStorageMap('sih-status-map')
  const selectedStore = useLocalStorageMap('sih-selected-map')
  const { isDark, toggle: toggleDark } = useDarkMode()

  // Sync URL params
  useEffect(() => {
    setQueryParams({ search: searchTerm, categories: categoryFilter, themes: themeFilter })
  }, [searchTerm, categoryFilter, themeFilter])

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/problems`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await fetch(`${API_URL}/sync`, { method: 'POST' })
      setTimeout(() => { fetchData(); setSyncing(false) }, 3000)
    } catch {
      setSyncing(false)
    }
  }

  // Fuse.js
  const fuse = useMemo(() => new Fuse(data, {
    keys: [
      { name: 'ps_number', weight: 2.0 },
      { name: 'title', weight: 1.5 },
      'organization', 'category', 'theme',
      { name: 'description', weight: 0.5 },
    ],
    threshold: 0.3,
    ignoreLocation: true,
    includeScore: true,
  }), [data])

  const fuzzyFilteredIds = useMemo(() => {
    if (!searchTerm.trim()) return null
    return fuse.search(searchTerm.trim()).map(r => r.item.ps_number)
  }, [fuse, searchTerm])

  const isFuzzyActive = searchTerm.trim().length > 0

  const filteredCount = useMemo(() => {
    let result = data
    if (isFuzzyActive && fuzzyFilteredIds) {
      const idSet = new Set(fuzzyFilteredIds)
      result = result.filter(d => idSet.has(d.ps_number))
    }
    if (categoryFilter.length > 0) {
      const catSet = new Set(categoryFilter)
      result = result.filter(d => catSet.has(d.category))
    }
    if (themeFilter.length > 0) {
      const themeSet = new Set(themeFilter)
      result = result.filter(d => themeSet.has(d.theme))
    }
    if (statusFilter.length > 0) {
      const statusSet = new Set(statusFilter)
      result = result.filter(d => statusSet.has(statusStore.getValue(d.ps_number, 'To Review')))
    }
    return result.length
  }, [data, fuzzyFilteredIds, isFuzzyActive, categoryFilter, themeFilter, statusFilter, statusStore])

  const selectedCount = useMemo(() => {
    return data.filter(d => selectedStore.getValue(d.ps_number, false)).length
  }, [data, selectedStore])

  // Keyboard: Cmd+K to open palette, Escape to close drawer
  useEffect(() => {
    function onKey(e) {
      // Cmd+K or Ctrl+K — open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdkOpen(prev => !prev)
        return
      }
      // Escape — close drawer (but not if command palette is open, it handles its own escape)
      if (e.key === 'Escape' && !cmdkOpen) {
        setSelectedProblem(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cmdkOpen])

  const activeFilters = (isFuzzyActive ? 1 : 0) + (categoryFilter.length > 0 ? 1 : 0) + (themeFilter.length > 0 ? 1 : 0) + (statusFilter.length > 0 ? 1 : 0)

  const clearAll = () => {
    setSearchTerm('')
    setCategoryFilter([])
    setThemeFilter([])
    setStatusFilter([])
  }

  const handleBulkStatusChange = (newStatus) => {
    data.forEach(d => {
      if (selectedStore.getValue(d.ps_number, false)) {
        statusStore.setValue(d.ps_number, newStatus)
      }
    })
  }

  const handleClearSelection = () => {
    data.forEach(d => {
      if (selectedStore.getValue(d.ps_number, false)) {
        selectedStore.setValue(d.ps_number, false)
      }
    })
  }

  const handleExportSelected = (format = 'xlsx') => {
    const selectedData = data.filter(d => selectedStore.getValue(d.ps_number, false))
    if (!selectedData.length) return
    const rows = selectedData.map(item => ({
      'PS Number': item.ps_number || '',
      'Organization': item.organization || '',
      'Title': item.title || '',
      'Category': item.category || '',
      'Theme': item.theme || '',
      'Deadline': item.deadline || '',
      'Submissions': item.submissions ?? '',
      'Status': statusStore.getValue(item.ps_number, 'To Review'),
    }))

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Selected Problems')
      XLSX.writeFile(workbook, 'sih_selected_problems.xlsx')
    } else if (format === 'csv') {
      const headers = Object.keys(rows[0])
      const csvContent = [
        headers.join(','),
        ...rows.map(row =>
          headers.map(h => {
            const val = String(row[h] ?? '')
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
              return `"${val.replace(/"/g, '""')}"`
            }
            return val
          }).join(',')
        ),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'sih_selected_problems.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-950 p-4 sm:p-5 md:p-6">
      <div className="flex-1 flex flex-col overflow-hidden border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900 shadow-[4px_4px_0_0_#111] dark:shadow-[4px_4px_0_0_#000]">

        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden flex flex-col">
          <div className="min-w-[1200px] flex flex-col flex-1 min-h-0">

            {/* Header */}
            <header className="border-b-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center w-full">

              {/* Branding */}
              <div className="flex items-center gap-3 h-14 px-6" style={{ flex: '0 0 280px' }}>
                <div className="w-7 h-7 bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                  <Database size={14} className="text-white dark:text-black" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight uppercase text-black dark:text-white leading-none">SIH 2026</h1>
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 leading-none">Problem Statements</span>
                </div>
              </div>

              {/* Search trigger — just a clickable bar that opens Cmd+K */}
              <div className="flex items-center h-14 px-4" style={{ flex: '1 1 auto' }}>
                <button
                  onClick={() => setCmdkOpen(true)}
                  className="flex items-center gap-3 border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 h-10 w-full max-w-[420px] px-4 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors group"
                >
                  <span className="text-sm text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-1 text-left">
                    {searchTerm || 'Search problem statements…'}
                  </span>
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                    <Command size={10} />K
                  </kbd>
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 h-14 px-6" style={{ flex: '0 0 auto' }}>
                {activeFilters > 0 && (
                  <button
                    onClick={clearAll}
                    className="border-2 border-black dark:border-gray-500 px-3 h-9 text-[10px] font-mono uppercase font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer flex items-center justify-center tracking-wider text-black dark:text-gray-300"
                  >
                    <X size={12} className="mr-1" />
                    {activeFilters}
                  </button>
                )}
                <div className="text-[10px] font-mono border-2 border-black dark:border-gray-500 px-3 h-9 bg-black dark:bg-white text-white dark:text-black font-bold flex items-center justify-center tracking-wider tabular-nums">
                  {filteredCount} / {data.length}
                </div>
                <ExportMenu
                  data={data}
                  statusStore={statusStore}
                  selectedStore={selectedStore}
                  filteredCount={filteredCount}
                />
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  title={syncing ? 'Syncing…' : 'Sync from SIH'}
                  className={`border-2 border-black dark:border-gray-500 px-3 h-9 text-[10px] font-mono uppercase font-bold transition-colors flex items-center justify-center cursor-pointer tracking-wider ${syncing ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-black dark:text-gray-300'}`}
                >
                  <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={toggleDark}
                  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="border-2 border-black dark:border-gray-500 px-3 h-9 text-[10px] font-mono uppercase font-bold transition-colors flex items-center justify-center cursor-pointer hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-black dark:text-gray-300"
                >
                  {isDark ? <Sun size={13} /> : <Moon size={13} />}
                </button>
              </div>
            </header>

            {/* Main content */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
              <div className={`flex-1 min-h-0 flex flex-col overflow-hidden transition-all duration-200 ${selectedProblem ? 'w-[60vw]' : 'w-full'}`}>
                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-black dark:border-gray-500 border-t-transparent animate-spin mb-4 mx-auto" />
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-mono">Loading data</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center border-2 border-black dark:border-gray-700 p-10">
                      <p className="text-sm font-bold uppercase tracking-widest mb-2 text-gray-900 dark:text-gray-100">Connection Error</p>
                      <p className="text-xs text-gray-500 mb-1 font-mono">{error}</p>
                      <p className="text-[10px] text-gray-400 mb-5">Make sure the backend is running at {API_URL}</p>
                      <button
                        onClick={fetchData}
                        className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black text-xs uppercase tracking-widest cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : (
                  <DataTable
                    data={data}
                    fuzzyFilteredIds={fuzzyFilteredIds}
                    isFuzzyActive={isFuzzyActive}
                    statusStore={statusStore}
                    selectedStore={selectedStore}
                    onStatusChange={statusStore.setValue}
                    onSelectedChange={selectedStore.setValue}
                    onRowClick={setSelectedProblem}
                    selectedRowId={selectedProblem?.ps_number}
                    categoryFilter={categoryFilter}
                    themeFilter={themeFilter}
                    statusFilter={statusFilter}
                    onCategoryFilterChange={setCategoryFilter}
                    onThemeFilterChange={setThemeFilter}
                    onStatusFilterChange={setStatusFilter}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-6 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] font-mono">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[8px] font-bold rounded">⌘K</kbd>
              Search
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[8px] font-bold rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[8px] font-bold rounded">Esc</kbd>
              Close
            </span>
          </div>
          <span className="text-[9px] text-gray-300 dark:text-gray-600 font-mono uppercase tracking-widest">
            SIH 2026 Dashboard
          </span>
        </div>
      </div>

      {/* Detail drawer */}
      {selectedProblem && (
        <DetailDrawer
          problem={selectedProblem}
          onClose={() => setSelectedProblem(null)}
        />
      )}

      {/* Bulk actions bar */}
      <BulkActionsBar
        selectedCount={selectedCount}
        onClearSelection={handleClearSelection}
        onBulkStatusChange={handleBulkStatusChange}
        onExportSelected={handleExportSelected}
      />

      {/* Command palette */}
      <CommandPalette
        open={cmdkOpen}
        onClose={() => setCmdkOpen(false)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        data={data}
        fuzzyFilteredIds={fuzzyFilteredIds}
        onSelectProblem={(p) => { setSelectedProblem(p); setCmdkOpen(false) }}
        categoryFilter={categoryFilter}
        themeFilter={themeFilter}
        onCategoryFilterChange={setCategoryFilter}
        onThemeFilterChange={setThemeFilter}
        onClearAll={clearAll}
      />
    </div>
  )
}
