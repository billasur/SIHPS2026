import { useState, useRef, useEffect, memo } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, X, Search, Check, Filter } from 'lucide-react'

function FilterDropdown({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const searchRef = useRef(null)
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
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [open])

  const toggle = (value) => {
    const next = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value]
    onChange(next)
  }

  const clearAll = (e) => {
    e.stopPropagation()
    onChange([])
  }

  const selectAll = (e) => {
    e.stopPropagation()
    onChange([...filteredOptions])
  }

  const filteredOptions = search.trim()
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options

  return (
    <>
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className={`
          flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium uppercase tracking-widest
          border transition-colors duration-100 cursor-pointer
          ${selected.length > 0
            ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
            : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-gray-400 hover:text-black dark:hover:text-gray-200'
          }
        `}
      >
        {label === "Filter" ? (
          <Filter size={11} strokeWidth={2} className="text-current" />
        ) : (
          <span>{label}</span>
        )}
        {selected.length > 0 && (
          <span className="bg-white dark:bg-black text-black dark:text-white px-1 py-0 text-[10px] font-bold ml-1">
            {selected.length}
          </span>
        )}
        {selected.length > 0 ? (
          <X size={11} onClick={clearAll} className="cursor-pointer ml-1" />
        ) : (
          <ChevronDown size={11} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-600 min-w-[240px] max-h-[380px] overflow-hidden shadow-[2px_2px_0_0_#111] dark:shadow-[2px_2px_0_0_#000] animate-slideInDown flex flex-col"
          style={{ top: pos.top, left: pos.left }}
        >
          {/* Search within filter */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1.5 focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-colors">
              <Search size={12} className="text-gray-400 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 text-xs font-sans bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                onClick={e => e.stopPropagation()}
              />
              {search && (
                <button onClick={() => setSearch('')} className="cursor-pointer">
                  <X size={11} className="text-gray-400 hover:text-black dark:hover:text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Select all / Clear row */}
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium">
              {filteredOptions.length} option{filteredOptions.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white cursor-pointer font-medium"
              >
                All
              </button>
              {selected.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white cursor-pointer font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-[260px]">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400 uppercase tracking-widest">
                No matches
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isChecked = selected.includes(opt)
                return (
                  <label
                    key={opt}
                    className={`
                      flex items-center gap-2.5 px-3 py-2 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors duration-75
                      ${isChecked ? 'bg-gray-50 dark:bg-gray-700/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}
                    `}
                  >
                    <div className={`
                      w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center transition-colors
                      ${isChecked ? 'bg-black dark:bg-white border-black dark:border-white' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}
                    `}>
                      {isChecked && <Check size={10} className="text-white dark:text-black" strokeWidth={3} />}
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(opt)}
                      className="hidden"
                    />
                    <span className={`text-xs truncate ${isChecked ? 'font-medium text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {opt}
                    </span>
                  </label>
                )
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default memo(FilterDropdown)
