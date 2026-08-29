import { memo, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Download, FileSpreadsheet, FileText, ExternalLink, ChevronDown } from 'lucide-react'
import * as XLSX from 'xlsx'

function prepareRows(data, statusStore, selectedStore, onlySelected) {
  return data
    .filter((item) => {
      if (onlySelected) return selectedStore?.store?.[item.ps_number] === true
      return true
    })
    .map((item) => ({
      'PS Number': item.ps_number || '',
      'Organization': item.organization || '',
      'Title': item.title || '',
      'Category': item.category || '',
      'Theme': item.theme || '',
      'Deadline': item.deadline || '',
      'Submissions': item.submissions ?? '',
      'Status': statusStore?.store?.[item.ps_number] || '',
      'Selected': selectedStore?.store?.[item.ps_number] ? 'Yes' : 'No',
    }))
}

function exportCSV(rows, filename) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
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
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function exportXLSX(rows, filename) {
  if (!rows.length) return
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Problem Statements')
  XLSX.writeFile(workbook, filename)
}

function ExportMenu({ data, statusStore, selectedStore, filteredCount }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, right: 0 })

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      })
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const selectedCount = data
    ? data.filter((item) => selectedStore?.store?.[item.ps_number] === true).length
    : 0

  const handleExportCSV = () => {
    exportCSV(prepareRows(data, statusStore, selectedStore, false), 'sih_problem_statements.csv')
    setOpen(false)
  }
  const handleExportXLSX = () => {
    exportXLSX(prepareRows(data, statusStore, selectedStore, false), 'sih_problem_statements.xlsx')
    setOpen(false)
  }
  const handleExportSelectedCSV = () => {
    exportCSV(prepareRows(data, statusStore, selectedStore, true), 'sih_selected_statements.csv')
    setOpen(false)
  }
  const handleExportSelectedXLSX = () => {
    exportXLSX(prepareRows(data, statusStore, selectedStore, true), 'sih_selected_statements.xlsx')
    setOpen(false)
  }
  const handleOpenGoogleSheets = () => {
    const rows = prepareRows(data, statusStore, selectedStore, false)
    if (!rows.length) return
    const headers = Object.keys(rows[0])
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => {
        const val = String(row[h] ?? '')
        if (val.includes(',') || val.includes('"') || val.includes('\n')) return `"${val.replace(/"/g, '""')}"`
        return val
      }).join(',')),
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    window.open('https://docs.google.com/spreadsheets/d/create?usp=sharing', '_blank')
    const link = document.createElement('a')
    link.href = url
    link.download = 'sih_problem_statements_for_sheets.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  const options = [
    { icon: FileText, label: 'Download CSV', sublabel: `.csv · ${filteredCount ?? data?.length ?? 0} rows`, action: handleExportCSV },
    { icon: FileSpreadsheet, label: 'Download Excel', sublabel: `.xlsx · ${filteredCount ?? data?.length ?? 0} rows`, action: handleExportXLSX },
    { icon: FileText, label: 'Selected → CSV', sublabel: `${selectedCount} selected`, action: handleExportSelectedCSV, disabled: selectedCount === 0 },
    { icon: FileSpreadsheet, label: 'Selected → Excel', sublabel: `${selectedCount} selected`, action: handleExportSelectedXLSX, disabled: selectedCount === 0 },
    { icon: ExternalLink, label: 'Google Sheets', sublabel: `Open + download csv`, action: handleOpenGoogleSheets },
  ]

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-1.5 border-2 border-black dark:border-gray-500 bg-white dark:bg-gray-800 px-3 h-9 font-mono text-[10px] uppercase tracking-wider font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors duration-100 cursor-pointer text-black dark:text-gray-200"
        title="Export data"
      >
        <Download size={13} strokeWidth={2.5} />
        <ChevronDown size={10} strokeWidth={2.5} className={`transition-transform duration-100 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] w-64 border-2 border-black dark:border-gray-600 bg-white dark:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] animate-slideInDown"
          style={{ top: pos.top, right: pos.right }}
        >
          <div className="border-b-2 border-black dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-900">
            <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-black dark:text-gray-300">
              Export
            </p>
          </div>
          <div className="flex flex-col">
            {options.map((opt, idx) => {
              const Icon = opt.icon
              return (
                <button
                  key={idx}
                  onClick={opt.action}
                  disabled={opt.disabled}
                  className={`flex items-center gap-3 px-4 py-2.5 text-left font-mono transition-colors duration-75 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                    opt.disabled
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black cursor-pointer'
                  } text-gray-900 dark:text-gray-200`}
                >
                  <Icon size={15} strokeWidth={2} className="flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider truncate">{opt.label}</span>
                    <span className="text-[10px] tracking-wider opacity-50">{opt.sublabel}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default memo(ExportMenu)
