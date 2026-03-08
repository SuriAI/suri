interface ModalCloseButtonProps {
  onClick: () => void
}

export function ModalCloseButton({ onClick }: ModalCloseButtonProps) {
  return (
    <button
      onClick={onClick}
      className="-mt-3 -mr-3 flex h-7 w-7 items-center justify-center rounded-lg border-none bg-transparent p-0 text-white/50 shadow-none transition-all hover:bg-white/10 hover:text-white">
      <i className="fa-solid fa-xmark text-xs"></i>
    </button>
  )
}
