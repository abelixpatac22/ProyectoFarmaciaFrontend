import { useEffect, useRef, type ReactNode } from 'react'
import { XIcon } from '../components/icons'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Usamos el elemento nativo <dialog>: el navegador ya maneja el foco, la tecla Escape
 * y bloquea el resto de la página. Menos código y más accesible que un div "a mano".
 */
export function Modal({ open, title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault() // dejamos que React decida cerrar, así el estado no se desincroniza
        onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-zinc-950/40 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="grid size-9 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100"
              aria-label="Cerrar"
            >
              <XIcon className="size-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
        </div>
      )}
    </dialog>
  )
}
