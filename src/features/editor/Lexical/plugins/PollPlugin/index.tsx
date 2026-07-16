import type { LexicalEditor } from 'lexical'
import React from 'react'

export function InsertPollDialog({ onClose }: { activeEditor: LexicalEditor; onClose: () => void }) {
  return (
    <div className="p-6">
      <h3 className="text-base font-semibold">Polls</h3>
      <p className="mt-2 text-sm text-gray-500">Polls are not available in this build.</p>
      <button
        onClick={onClose}
        className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
      >
        Close
      </button>
    </div>
  )
}
