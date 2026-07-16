import React from 'react'

export type ExcalidrawInitialElements = any[]

type ExcalidrawModalProps = {
  initialElements: ExcalidrawInitialElements
  initialFiles: Record<string, unknown>
  initialAppState: Record<string, unknown>
  isShown: boolean
  onDelete: () => void
  onClose: () => void
  onSave: (
    elements: ExcalidrawInitialElements,
    appState: Record<string, unknown>,
    files: Record<string, unknown>
  ) => void
  closeOnClickOutside?: boolean
}

const ExcalidrawModal = ({
  initialElements,
  initialFiles,
  initialAppState,
  isShown,
  onDelete,
  onClose,
  onSave,
  closeOnClickOutside = true,
}: ExcalidrawModalProps) => {
  if (!isShown) return null

  const handleBackdropClick = () => {
    if (closeOnClickOutside) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={handleBackdropClick}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Excalidraw</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Excalidraw editor is not available in this build.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onDelete}
            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            Delete
          </button>
          <button
            onClick={() => onSave(initialElements, initialAppState, initialFiles)}
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90 dark:bg-white dark:text-black"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExcalidrawModal
