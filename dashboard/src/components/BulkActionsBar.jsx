import { memo, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, CheckSquare, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react'

function BulkActionsBar({ selectedCount, onClearSelection, onBulkStatusChange, onExportSelected }) {
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportBtnRef = useRef(null)
  const exportMenuRef = useRef(null)
  const [exportMenuPos, setExportMenuPos] = useState({ top: 0, right: 0 })

  // Position the export menu
  useEffect(() => {
    if (exportMenuOpen && exportBtnRef.current) {
      const rect = exportBtnRef.current.getBoundingClientRect()
      setExportMenuPos({
        top: rect.top - 124,
        right: window.innerWidth - rect.right,
      })
    }
  }, [exportMenuOpen])

  // Close export menu on outside click
  useEffect(() => {
    if (!exportMenuOpen) return
    function handleClickOutside(e) {
      if (
        exportBtnRef.current && !exportBtnRef.current.contains(e.target) &&
        exportMenuRef.current && !exportMenuRef.current.contains(e.target)
      ) {
        setExportMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [exportMenuOpen])

  const handleExportXLSX = () => {
    onExportSelected('xlsx')
    setExportMenuOpen(false)
  }

  const handleExportCSV = () => {
    onExportSelected('csv')
    setExportMenuOpen(false)
  }

  const exportOptions = [
    { icon: FileSpreadsheet, label: 'Export as XLSX', action: handleExportXLSX },
    { icon: FileText, label: 'Export as CSV', action: handleExportCSV },
  ]

  if (selectedCount <= 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-black dark:bg-gray-800 text-white border-t-4 border-white dark:border-gray-600 font-mono animate-slideUp">
        <div className="flex items-center justify-between px-8 py-3">
          <div className="flex items-center gap-3">
            <CheckSquare size={18} />
            <span className="uppercase text-sm font-bold tracking-wider">
              {selectedCount} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onBulkStatusChange('Shortlisted')}
              className="px-3 py-1.5 bg-emerald-500 text-white uppercase text-[10px] font-bold tracking-wider border-2 border-emerald-400 hover:bg-emerald-600 transition-colors cursor-pointer"
            >
              Shortlist
            </button>
            <button
              onClick={() => onBulkStatusChange('In Progress')}
              className="px-3 py-1.5 bg-blue-500 text-white uppercase text-[10px] font-bold tracking-wider border-2 border-blue-400 hover:bg-blue-600 transition-colors cursor-pointer"
            >
              In Progress
            </button>
            <button
              onClick={() => onBulkStatusChange('Discarded')}
              className="px-3 py-1.5 bg-transparent text-gray-400 uppercase text-[10px] font-bold tracking-wider border-2 border-gray-600 hover:border-white hover:text-white transition-colors cursor-pointer"
            >
              Discard
            </button>

            <div className="w-px h-6 bg-gray-600 mx-1" />

            <div className="relative">
              <button
                ref={exportBtnRef}
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black uppercase text-[10px] font-bold tracking-wider border-2 border-white hover:bg-gray-200 transition-colors cursor-pointer"
                title="Export selected"
              >
                <Download size={12} />
                <ChevronDown size={10} className={`transition-transform duration-100 ${exportMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {exportMenuOpen && createPortal(
                <div
                  ref={exportMenuRef}
                  className="fixed z-[9999] w-48 border-2 border-black dark:border-gray-600 bg-white dark:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] animate-slideInDown"
                  style={{ top: exportMenuPos.top, right: exportMenuPos.right }}
                >
                  <div className="border-b-2 border-black dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-900">
                    <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-black dark:text-gray-300">
                      Export Format
                    </p>
                  </div>
                  <div className="flex flex-col">
                    {exportOptions.map((opt, idx) => {
                      const Icon = opt.icon
                      return (
                        <button
                          key={idx}
                          onClick={opt.action}
                          className="flex items-center gap-3 px-4 py-2.5 text-left font-mono transition-colors duration-75 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black cursor-pointer text-gray-900 dark:text-gray-200"
                        >
                          <Icon size={15} strokeWidth={2} className="flex-shrink-0" />
                          <span className="text-[11px] font-bold uppercase tracking-wider truncate">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>,
                document.body
              )}
            </div>

            <button
              onClick={onClearSelection}
              className="flex items-center gap-1 px-2 py-1.5 bg-transparent text-gray-500 hover:text-white transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default memo(BulkActionsBar)