import React from "react"
import { AnimatePresence } from "framer-motion"

interface SectionHeaderProps {
  children: React.ReactNode
}

export function SectionHeader({ children }: SectionHeaderProps) {
  return (
    <div className="sticky top-0 z-20 flex h-[57px] items-center border-b border-white/[0.04] bg-[#06080c] pr-16 pl-10">
      <div className="flex w-full items-center justify-between">{children}</div>
    </div>
  )
}

interface BreadcrumbsProps {
  children: React.ReactNode
}

export function Breadcrumbs({ children }: BreadcrumbsProps) {
  return <div className="flex items-center gap-2 text-[13px] font-medium">{children}</div>
}

interface BreadcrumbProps {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  color?: string
}

export function Breadcrumb({ children, active, onClick, color }: BreadcrumbProps) {
  const baseColor = color || "text-white/45"

  if (onClick && !active) {
    return (
      <button
        onClick={onClick}
        className={`cursor-pointer border-none bg-transparent p-0 text-[13px] transition-all duration-200 focus:outline-none ${baseColor} font-medium tracking-wide hover:text-white`}>
        {children}
      </button>
    )
  }

  return (
    <span
      className={`text-[13px] transition-all duration-200 ${
        active ? "font-semibold tracking-wide text-white" : `${baseColor} font-medium tracking-wide`
      }`}>
      {children}
    </span>
  )
}

export function Separator() {
  return <span className="text-[13px] font-light text-white/15 select-none">/</span>
}

interface ActionsProps {
  children: React.ReactNode
}

export function Actions({ children }: ActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <AnimatePresence mode="wait">{children}</AnimatePresence>
    </div>
  )
}

SectionHeader.Breadcrumbs = Breadcrumbs
SectionHeader.Breadcrumb = Breadcrumb
SectionHeader.Separator = Separator
SectionHeader.Actions = Actions
