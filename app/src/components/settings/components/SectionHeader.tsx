import React from "react"
import { motion, AnimatePresence } from "framer-motion"

interface SectionHeaderProps {
  title: string
  eyebrow?: string
  eyebrowColor?: string
  actions?: React.ReactNode
}

export function SectionHeader({
  title,
  eyebrow,
  eyebrowColor = "text-white/50",
  actions,
}: SectionHeaderProps) {
  return (
    <div className="sticky top-0 z-20 flex h-[57px] items-center border-b border-white/[0.04] bg-[rgba(15,19,25,0.7)] pr-16 pl-10 backdrop-blur-md">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            {eyebrow && (
              <>
                <span className={`${eyebrowColor} tracking-wide`}>{eyebrow}</span>
                <span className="font-light text-white/15 select-none">/</span>
              </>
            )}
            <AnimatePresence mode="popLayout">
              <motion.span
                key={title}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="font-semibold text-white">
                {title}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AnimatePresence mode="popLayout">
            {actions && (
              <motion.div
                key={title + "-actions"}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}>
                {actions}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
