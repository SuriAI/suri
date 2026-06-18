import { useState } from "react"
import { useUIStore } from "@/components/main/stores/uiStore"
import { Modal } from "@/components/common"
import { motion, AnimatePresence } from "framer-motion"

export function IntroModal() {
  const { setHasSeenIntro } = useUIStore()
  const [step, setStep] = useState(0)
  const [isOpen, setIsOpen] = useState(true)

  const steps = [
    {
      title: "Welcome to Facenox",
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-white/80">
            Facenox is an <strong>offline-first, privacy-focused</strong> face recognition system
            designed for real-time attendance tracking. Everything is processed directly on this
            device to keep your information secure and under local control.
          </p>
          <p className="text-xs text-white/65">
            Here is a quick overview of how information is protected.
          </p>
        </div>
      ),
    },
    {
      title: "No Photos Stored",
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-white/80">
            Facenox <strong>never saves actual photos</strong> of people. Instead, it creates a
            secure face template.
          </p>
          <p className="text-xs leading-relaxed text-white/65">
            This template is encrypted and cannot be turned back into a photo, keeping
            everyone&apos;s biometric identity private and safe from data breaches.
          </p>
        </div>
      ),
    },
    {
      title: "It stays on this computer",
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-white/80">
            All face detection, tracking, liveness verification, and recognition are processed{" "}
            <strong>entirely on this device</strong>.
          </p>
          <p className="text-xs leading-relaxed text-white/65">
            Your biometric face template never leaves this machine unencrypted. Basic profile info
            (like names) and attendance logs are also shared if you choose to sync with the
            dashboard.
          </p>
        </div>
      ),
    },
    {
      title: "Privacy & Security",
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-white/80">
            Facenox aligns with global privacy standards, ensuring your biometric information is
            protected.
          </p>
          <p className="text-xs leading-relaxed text-white/65">
            Our codebase is fully{" "}
            <a
              href="https://github.com/facenox/facenox"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded px-0.5 text-cyan-400/80 underline decoration-cyan-400/30 underline-offset-4 transition-colors hover:text-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:outline-none">
              open-source
            </a>
            , offering complete transparency into how we manage and secure local assets.
          </p>

          <div className="border-t border-white/5 pt-2 text-center">
            <a
              href="https://github.com/facenox/facenox/blob/main/docs/PRIVACY.md"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded px-0.5 text-[11px] text-white/55 underline decoration-white/10 underline-offset-2 transition-colors hover:text-white/65 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none">
              View Full Privacy Manual
            </a>
          </div>

          <p className="pt-1 text-center text-[11px] text-white/55 italic">
            By clicking &quot;Finish&quot;, you acknowledge the on-device management of your
            personal information.
          </p>
        </div>
      ),
    },
  ]

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      setIsOpen(false)
      setTimeout(() => {
        setHasSeenIntro(true)
      }, 250)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const currentStep = steps[step]

  return (
    <Modal isOpen={isOpen} maxWidth="md" hideCloseButton={true}>
      <div className="relative -m-5 overflow-hidden bg-[var(--bg-secondary)]">
        {/* Progress Bar */}
        <div className="absolute top-0 right-0 left-0 h-1 bg-[rgba(255,255,255,0.06)]">
          <div
            className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.3)] transition-all duration-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-10">
          <div className="mt-2 mb-10 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{ willChange: "opacity, transform" }}>
                <h2 className="mb-6 text-2xl font-bold tracking-tight text-white">
                  {currentStep.title}
                </h2>
                <div className="flex min-h-[120px] flex-col justify-center">
                  {currentStep.content}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className={`rounded-lg border-none! bg-transparent! px-8 pr-5 text-[11px] font-medium shadow-none! transition-all focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none ${
                step === 0 ? "pointer-events-none opacity-0" : "text-white/55 hover:text-white"
              }`}>
              Back
            </button>

            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === step ? "w-6 bg-cyan-500" : "w-2 bg-white/10"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="btn-premium btn-premium-primary px-8! py-2! text-[11px]! font-bold! tracking-wider focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-secondary)] focus-visible:outline-none active:scale-95">
              {step === steps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
