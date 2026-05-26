import React from "react"
import { motion, AnimatePresence } from "framer-motion"

interface SectionHeaderProps {
  title: string
  eyebrow?: string
  eyebrowColor?: string
  onEyebrowClick?: () => void
  actions?: React.ReactNode
}

export function SectionHeader({
  title,
  eyebrow,
  eyebrowColor = "text-white/50",
  onEyebrowClick,
  actions,
}: SectionHeaderProps) {
  const isGroupOverview = eyebrow && title === "Overview"

  return (
    <div className="sticky top-0 z-20 flex h-[57px] items-center border-b border-white/[0.04] bg-[#06080c] pr-16 pl-10">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            {eyebrow && (
              <>
                {onEyebrowClick && !isGroupOverview ?
                  <button
                    onClick={onEyebrowClick}
                    className={`cursor-pointer border-none bg-transparent p-0 text-[13px] transition-all duration-200 focus:outline-none ${
                      isGroupOverview ?
                        "pointer-events-none cursor-default font-semibold tracking-wide text-white"
                      : `${eyebrowColor} font-medium tracking-wide hover:text-white`
                    }`}>
                    {eyebrow}
                  </button>
                : <span
                    className={`text-[13px] transition-all duration-200 ${
                      isGroupOverview ?
                        "font-semibold tracking-wide text-white"
                      : `${eyebrowColor} font-medium tracking-wide`
                    }`}>
                    {eyebrow}
                  </span>
                }
              </>
            )}

            <AnimatePresence mode="popLayout">
              {!isGroupOverview && (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  style={{ display: "inline-flex", alignItems: "center" }}
                  className="gap-2">
                  <span className="font-light text-white/15 select-none">/</span>
                  <span className="font-semibold text-white">{title}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {actions && (
              <motion.div
                key={title + "-actions"}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}>
                {actions}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
