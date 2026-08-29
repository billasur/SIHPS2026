import { useMemo, useRef, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import StatusDropdown from './StatusDropdown'
import FilterDropdown from './FilterDropdown'

function DataTable({
  data,
  fuzzyFilteredIds,
  isFuzzyActive,
  statusStore,
  selectedStore,
  onStatusChange,
  onSelectedChange,
  onRowClick,
  selectedRowId,
  categoryFilter,
  themeFilter,
  statusFilter,
  onCategoryFilterChange,
  onThemeFilterChange,
  onStatusFilterChange,
}) {
  const parentRef = useRef(null)

  const categoryOptions = useMemo(() => {
    const set = new Set(data.map(d => d.category).filter(Boolean))
    return [...set].sort()
  }, [data])

  const themeOptions = useMemo(() => {
    const set = new Set(data.map(d => d.theme).filter(Boolean))
    return [...set].sort()
  }, [data])

  const statusOptions = useMemo(() => {
    return ['To Review', 'Shortlisted', 'In Progress', 'Discarded']
  }, [])

  const filteredData = useMemo(() => {
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
    return result
  }, [data, fuzzyFilteredIds, isFuzzyActive, categoryFilter, themeFilter, statusFilter, statusStore])

  const columns = useMemo(() => [
    {
      id: 'rowNumber',
      header: () => (
        <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">#</span>
      ),
      size: 42,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">{row.index + 1}</span>
      ),
    },
    {
      id: 'selected',
      header: ({ table }) => {
        const allIds = table.getRowModel().rows.map(r => r.original.ps_number)
        const allSelected = allIds.length > 0 && allIds.every(id => selectedStore.getValue(id, false))
        const someSelected = allIds.some(id => selectedStore.getValue(id, false))
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = someSelected && !allSelected }}
              onChange={() => {
                const newVal = !allSelected
                allIds.forEach(id => onSelectedChange(id, newVal))
              }}
              className="w-3.5 h-3.5 cursor-pointer"
              onClick={e => e.stopPropagation()}
            />
          </div>
        )
      },
      size: 42,
      enableSorting: false,
      cell: ({ row }) => {
        const id = row.original.ps_number
        const checked = selectedStore.getValue(id, false)
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => {
                e.stopPropagation()
                onSelectedChange(id, !checked)
              }}
              onClick={e => e.stopPropagation()}
              className="w-3.5 h-3.5 cursor-pointer"
            />
          </div>
        )
      },
    },
    {
      accessorKey: 'ps_number',
      header: 'ID',
      size: 100,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs tracking-wide font-medium text-gray-900 dark:text-gray-200">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'organization',
      header: 'Organization',
      size: 180,
      cell: ({ getValue }) => (
        <span className="text-xs truncate block max-w-[165px] text-gray-700 dark:text-gray-300" title={getValue()}>
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Title',
      size: 280,
      cell: ({ getValue }) => (
        <span className="text-xs font-medium truncate block max-w-[260px] text-gray-900 dark:text-gray-100" title={getValue()}>
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'category',
      header: () => (
        <div className="flex items-center gap-2">
          <span>Category</span>
          <FilterDropdown
            label="Filter"
            options={categoryOptions}
            selected={categoryFilter}
            onChange={onCategoryFilterChange}
          />
        </div>
      ),
      size: 130,
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="sih-category-pill text-[11px] uppercase tracking-wider px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 inline-block font-medium rounded-sm">
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'theme',
      header: () => (
        <div className="flex items-center gap-2">
          <span>Theme</span>
          <FilterDropdown
            label="Filter"
            options={themeOptions}
            selected={themeFilter}
            onChange={onThemeFilterChange}
          />
        </div>
      ),
      size: 170,
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-xs truncate block max-w-[150px] text-gray-600 dark:text-gray-400" title={getValue()}>
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'deadline',
      header: 'Deadline',
      size: 110,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs tabular-nums text-gray-700 dark:text-gray-300">{getValue()}</span>
      ),
    },
    {
      id: 'status',
      header: () => (
        <div className="flex items-center gap-2">
          <span>Status</span>
          <FilterDropdown
            label="Filter"
            options={statusOptions}
            selected={statusFilter}
            onChange={onStatusFilterChange}
          />
        </div>
      ),
      size: 140,
      enableSorting: false,
      cell: ({ row }) => {
        const id = row.original.ps_number
        const status = statusStore.getValue(id, 'To Review')
        return (
          <StatusDropdown
            value={status}
            onChange={val => onStatusChange(id, val)}
          />
        )
      },
    },
  ], [
    categoryOptions, themeOptions, statusOptions,
    categoryFilter, themeFilter, statusFilter,
    onCategoryFilterChange, onThemeFilterChange, onStatusFilterChange,
    statusStore, selectedStore,
    onStatusChange, onSelectedChange,
  ])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const { rows } = table.getRowModel()

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 46,
    overscan: 20,
  })

  const virtualRows = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  // Keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (!selectedRowId || !rows.length) return
      const currentIndex = rows.findIndex(r => r.original.ps_number === selectedRowId)
      if (currentIndex === -1) return

      if (e.key === 'ArrowDown' && currentIndex < rows.length - 1) {
        e.preventDefault()
        onRowClick(rows[currentIndex + 1].original)
        virtualizer.scrollToIndex(currentIndex + 1, { align: 'auto' })
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault()
        onRowClick(rows[currentIndex - 1].original)
        virtualizer.scrollToIndex(currentIndex - 1, { align: 'auto' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedRowId, rows, onRowClick, virtualizer])

  return (
    <div className="flex flex-col h-full overflow-hidden min-h-0">
      {/* Results count bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 font-medium font-mono">
          {filteredData.length === data.length
            ? `${data.length} results`
            : `${filteredData.length} of ${data.length} results`
          }
        </span>
        {(categoryFilter.length > 0 || themeFilter.length > 0 || statusFilter.length > 0 || isFuzzyActive) && (
          <div className="flex items-center gap-2">
            {isFuzzyActive && (
              <span className="text-[10px] uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 font-mono">
                Search active
              </span>
            )}
            {categoryFilter.length > 0 && (
              <span className="text-[10px] uppercase tracking-widest bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 font-mono border border-gray-200 dark:border-gray-600">
                {categoryFilter.length} categor{categoryFilter.length === 1 ? 'y' : 'ies'}
              </span>
            )}
            {themeFilter.length > 0 && (
              <span className="text-[10px] uppercase tracking-widest bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 font-mono border border-gray-200 dark:border-gray-600">
                {themeFilter.length} theme{themeFilter.length === 1 ? '' : 's'}
              </span>
            )}
            {statusFilter.length > 0 && (
              <span className="text-[10px] uppercase tracking-widest bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 font-mono border border-gray-200 dark:border-gray-600">
                {statusFilter.length} status{statusFilter.length === 1 ? '' : 'es'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div ref={parentRef} className="flex-1 min-h-0 overflow-auto">
        <table className="w-full block">
          <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900 block w-full border-b-2 border-black dark:border-gray-600">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="flex w-full">
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize(), flex: `0 0 ${header.getSize()}px` }}
                    className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.15em] font-semibold text-gray-500 dark:text-gray-400 select-none overflow-visible"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-1 ${header.column.getCanSort() ? 'cursor-pointer hover:text-black dark:hover:text-white transition-colors' : ''}`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          header.column.getIsSorted() === 'asc'
                            ? <ArrowUp size={10} className="text-black dark:text-white" />
                            : header.column.getIsSorted() === 'desc'
                              ? <ArrowDown size={10} className="text-black dark:text-white" />
                              : <ArrowUpDown size={10} className="opacity-20" />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            style={{ height: `${totalSize}px`, position: 'relative' }}
            className="block w-full"
          >
            {virtualRows.map(virtualRow => {
              const row = rows[virtualRow.index]
              const isSelected = row.original.ps_number === selectedRowId
              const isChecked = selectedStore.getValue(row.original.ps_number, false)
              const isEven = virtualRow.index % 2 === 0
              return (
                <tr
                  key={row.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={`
                    flex w-full items-center border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors duration-75
                    ${isSelected
                      ? 'sih-selected-row bg-black dark:bg-gray-800 !text-white'
                      : isChecked
                        ? 'bg-blue-50/60 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                        : isEven
                          ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                          : 'bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                  onClick={() => onRowClick(row.original)}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      style={{ width: cell.column.getSize(), flex: `0 0 ${cell.column.getSize()}px` }}
                      className="px-4 py-3 overflow-hidden"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-gray-200 dark:border-gray-700 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-gray-300 dark:text-gray-600">∅</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 font-medium">No results</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Try adjusting your search or filters.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DataTable
