import { motion, AnimatePresence } from "framer-motion"
import { useGroupUIStore } from "@/components/group/stores"
import { Tooltip } from "@/components/shared"

interface RegistrationActionProps {
  memberId: string
  isRegistered: boolean
}

export function RegistrationAction({ memberId, isRegistered }: RegistrationActionProps) {
  const jumpToRegistration = useGroupUIStore((state) => state.jumpToRegistration)

  return (
    <div className="flex items-center justify-end">
      <AnimatePresence mode="wait" initial={false}>
        {!isRegistered ?
          <motion.button
            key="register"
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            onClick={() => jumpToRegistration(memberId)}
            className="rounded-lg border border-cyan-500/10 bg-cyan-500/[0.02] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-cyan-400/50 transition-all duration-200 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5 group-hover:text-cyan-400 hover:!border-cyan-500 hover:!bg-cyan-500/[0.16] hover:!text-cyan-300 active:scale-[0.97]">
            Register
          </motion.button>
        : <motion.div
            key="registered-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <Tooltip content="Re-register face">
              <button
                onClick={() => jumpToRegistration(memberId)}
                className="flex h-7 w-7 items-center justify-center rounded border-none bg-transparent text-white/55 transition-all hover:bg-white/10 hover:text-white">
                <i className="fa-solid fa-rotate-right text-[11px]" />
              </button>
            </Tooltip>
          </motion.div>
        }
      </AnimatePresence>
    </div>
  )
}
