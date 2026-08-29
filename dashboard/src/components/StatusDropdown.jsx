import { memo, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'To Review', label: 'To Review', color: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600', dot: 'bg-gray-400' },
  { value: 'Shortlisted', label: 'Shortlisted', color: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-700', dot: 'bg-emerald-500' },
  { value: 'In Progress', label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-700', dot: 'bg-blue-500' },
  { value: 'Discarded', label: 'Discarded', color: 'bg-gray-50 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700', dot: 'bg-gray-300 dark:bg-gray-600' },
]

function StatusDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  // Position the portal dropdown
  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
      })
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const current = STATUS_OPTIONS.find(o => o.value === value) || STATUS_OPTIONS[0]

  return (
    <>
      <button
        ref={btnRef}
        onClick={e => { e.stopPropagation(); setOpen(!open) }}
        className={`
          flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider
          border rounded-none transition-all duration-100 cursor-pointer w-full
          ${current.color}
        `}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${current.dot}`} />
        <span className="truncate">{current.label}</span>
        <ChevronDown size={10} className={`ml-auto transition-transform duration-150 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-600 min-w-[150px] animate-slideInDown shadow-[2px_2px_0_0_#111] dark:shadow-[2px_2px_0_0_#000]"
          style={{ top: pos.top, left: pos.left }}
        >
          {STATUS_OPTIONS.map(opt => {
            const isActive = opt.value === value
            return (
              <button
                key={opt.value}
                onClick={e => {
                  e.stopPropagation()
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`
                  flex items-center gap-2 w-full px-3 py-2 text-xs font-medium uppercase tracking-wider
                  border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer transition-colors duration-75
                  ${isActive
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200'
                  }
                `}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-white dark:bg-black' : opt.dot}`} />
                {opt.label}
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </>
  )
}

export default memo(StatusDropdown)
