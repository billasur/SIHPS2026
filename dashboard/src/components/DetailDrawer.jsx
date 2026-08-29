import { memo, useRef, useState } from 'react'
import { X, Hash, Building2, Tag, Layers, Clock, FileText, Users, ExternalLink, Copy, Check } from 'lucide-react'

const formatDescription = (text) => {
  if (!text) return <p className="text-sm text-gray-400 italic">No description available.</p>

  const headerRegex = /(Background:|Detailed Description:|Expected Solution:|Objective:|Problem Statement:|Note:|Description:)/gi
  const parts = text.split(headerRegex)

  return parts.map((part, index) => {
    if (!part.trim()) return null

    if (headerRegex.test(part)) {
      return (
        <div key={index} className="mt-8 mb-3 first:mt-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-black dark:bg-white flex-shrink-0" />
            <h3 className="text-sm font-black uppercase tracking-[0.15em] text-gray-900 dark:text-gray-100">
              {part.replace(':', '')}
            </h3>
          </div>
          <div className="h-[2px] bg-black dark:bg-white mt-2" />
        </div>
      )
    }

    // Strict regex for list markers: single letter, numbers, specific roman numerals, or parenthesized markers
    // Prevents matching normal words/acronyms like "(NER)", "(AI)", "(ML)", "NER.", "gaps.", "app.", etc.
    const BASE_MARKER = '[a-zA-Z]|\\d{1,3}|viii|vii|vi|iv|iii|ii|ix|VIII|VII|VI|IV|III|II|IX'
    const VALID_MARKER = `(?:${BASE_MARKER})[\\.\\)]|\\((?:${BASE_MARKER})\\)`
    const structuralRegex = new RegExp(`(?=\\n|(?:^|\\s)(?:${VALID_MARKER}|[-•*–—·])\\s+)`, 'g')
    const primaryMatchRegex = new RegExp(`^(${VALID_MARKER})\\s+(.*)$`, 's')
    const textChunks = part.split(structuralRegex)

    return (
      <div key={index} className="mb-4 text-gray-800 dark:text-gray-300 leading-relaxed space-y-2">
        {textChunks.map((rawChunk, i) => {
          const chunk = rawChunk.trim()
          if (!chunk) return null

          // 1. Check for nested bullet sub-items (e.g. • Medicines, - Hydration)
          const bulletMatch = chunk.match(/^([-•*–—·])\s+(.*)$/s)
          if (bulletMatch) {
            const [, , body] = bulletMatch
            return (
              <div key={i} className="ml-8 my-1 flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-2 shrink-0" />
                <span className="flex-1 leading-relaxed">{body}</span>
              </div>
            )
          }

          // 2. Check for primary numbered/lettered items (e.g. a. Reminders, 1. First, e) Alert)
          const primaryMatch = chunk.match(primaryMatchRegex)
          if (primaryMatch) {
            const [, marker, body] = primaryMatch
            return (
              <div key={i} className="my-2.5 flex items-start gap-2.5">
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 shrink-0">
                  {marker}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed pt-0.5">
                  {body}
                </span>
              </div>
            )
          }

          // 3. Regular paragraph
          return (
            <p key={i} className="my-2.5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {chunk}
            </p>
          )
        })}
      </div>
    )
  })
}

function DetailDrawer({ problem, onClose }) {
  const [copied, setCopied] = useState(false)
  const drawerRef = useRef(null)

  if (!problem) return null

  const copyToClipboard = () => {
    const text = `${problem.ps_number} — ${problem.title}\n\nOrganization: ${problem.organization}\nCategory: ${problem.category}\nTheme: ${problem.theme}\nDeadline: ${problem.deadline}\n\n${problem.description || ''}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fields = [
    { icon: Hash, label: 'PS Number', value: problem.ps_number, mono: true },
    { icon: Building2, label: 'Organization', value: problem.organization },
    { icon: Tag, label: 'Category', value: problem.category },
    { icon: Layers, label: 'Theme', value: problem.theme },
    { icon: Clock, label: 'Deadline', value: problem.deadline, mono: true },
    { icon: Users, label: 'Submissions', value: problem.submissions, mono: true },
  ]

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40 animate-fadeIn backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 h-full z-50 bg-white dark:bg-gray-900 border-l-4 border-black dark:border-gray-600 overflow-hidden flex flex-col animate-slideInRight"
        style={{ width: 'min(42vw, 600px)', minWidth: '380px' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b-2 border-black dark:border-gray-600 bg-white dark:bg-gray-900">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 font-mono font-medium bg-gray-100 dark:bg-gray-800 px-2 py-0.5 border border-gray-200 dark:border-gray-700">
                {problem.ps_number}
              </span>
              {problem.category && (
                <span className="text-[10px] uppercase tracking-[0.15em] font-medium bg-black dark:bg-white text-white dark:text-black px-2 py-0.5">
                  {problem.category}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold leading-tight text-gray-900 dark:text-gray-100">
              {problem.title}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-100 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer"
              title="Copy to clipboard"
            >
              {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} className="text-gray-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100 border border-transparent hover:border-black dark:hover:border-white cursor-pointer text-gray-600 dark:text-gray-300"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Meta fields */}
        <div className="grid grid-cols-2 gap-0 border-b-2 border-black dark:border-gray-600">
          {fields.map(({ icon: Icon, label, value, mono }, i) => (
            <div
              key={label}
              className={`
                p-5
                ${i % 2 === 0 ? 'border-r border-gray-200 dark:border-gray-700' : ''}
                ${i < fields.length - 2 ? 'border-b border-gray-200 dark:border-gray-700' : ''}
              `}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon size={11} className="text-gray-400 dark:text-gray-500" />
                <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 font-medium">
                  {label}
                </span>
              </div>
              <p className={`text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug ${mono ? 'font-mono' : ''}`}>
                {value || '—'}
              </p>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={12} className="text-gray-400 dark:text-gray-500" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 font-medium">
                Description
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2" />
            </div>
            <div className="text-sm leading-relaxed text-gray-900 dark:text-gray-200">
              {formatDescription(problem.description)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t-2 border-black dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 font-mono">
            {problem.category} · {problem.theme}
          </p>
          <button
            onClick={() => {
              const q = encodeURIComponent(`SIH 2026 ${problem.ps_number} ${problem.title}`)
              window.open(`https://www.google.com/search?q=${q}`, '_blank')
            }}
            className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white cursor-pointer transition-colors"
          >
            <ExternalLink size={10} />
            Search
          </button>
        </div>
      </div>
    </>
  )
}

export default memo(DetailDrawer)
