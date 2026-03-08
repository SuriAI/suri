import { useState } from "react"
import { useUIStore } from "@/components/main/stores/uiStore"
import { Modal } from "@/components/common"

export function IntroModal() {
  const { setHasSeenIntro } = useUIStore()
  const [step, setStep] = useState(0)

  const steps = [
    {
      title: "Welcome to Suri",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-white/90">
            Suri is a <strong>local-first</strong> attendance system built with a focus on privacy and transparency.
          </p>
          <div className="rounded-lg border border-white/5 bg-white/5 p-4">
            <p className="text-xs leading-relaxed font-medium text-white/50">
              Your data is processed and stored on this machine. Here's a quick overview of how we protect your privacy.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "No Photos Stored",
      content: (
        <div className="space-y-4">
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
            <h4 className="mb-2 text-sm font-bold text-cyan-300">
              Suri does not save image files
            </h4>
            <p className="text-xs leading-relaxed font-medium text-white/60">
              The system converts facial features into an <strong>encrypted biometric template</strong>. It is mathematically impossible to reconstruct a photo from this digital signature.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Offline by Default",
      content: (
        <div className="space-y-4">
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
            <h4 className="mb-2 text-sm font-bold text-cyan-300">
              Data stays on this device
            </h4>
            <p className="text-xs leading-relaxed font-medium text-white/60">
              Everything runs locally. Your attendance records and biometric data never leave this device unless you explicitly enable sync features.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Transparent & Secure",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-white/80">
            Suri is open source and designed for transparency. You have full control over your data and how it is managed.
          </p>
          <div className="mt-2 border-t border-white/10 pt-4">
            <p className="text-center text-[10px] leading-relaxed font-medium text-white/40 italic">
              By clicking &quot;Get Started&quot;, you acknowledge that you understand how Suri
              handles your data locally.
            </p>
          </div>
        </div>
      ),
    },
  ]

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      setHasSeenIntro(true)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const currentStep = steps[step]

  return (
    <Modal isOpen={true} maxWidth="md" hideCloseButton={true}>
      <div className="relative -m-5 overflow-hidden bg-black/40">
        {/* Progress Bar */}
        <div className="absolute top-0 right-0 left-0 h-1 bg-white/5">
          <div
            className="h-full bg-cyan-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-8">
          <div className="mt-4 mb-8">
            <h2 className="text-xl font-bold tracking-tight text-white mb-4">{currentStep.title}</h2>
            <div className="min-h-[120px]">{currentStep.content}</div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className={`btn-premium btn-premium-secondary px-4! py-2! text-xs! border-none! bg-transparent! transition-all ${step === 0 ? "pointer-events-none opacity-0" : "opacity-60 hover:opacity-100"
                }`}>
              Back
            </button>

            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-4 rounded-full transition-all duration-300 ${i === step ? "bg-cyan-400 w-8" : "bg-white/10"
                    }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="btn-premium btn-premium-primary px-6! py-2! text-xs! active:scale-95">
              {step === steps.length - 1 ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
