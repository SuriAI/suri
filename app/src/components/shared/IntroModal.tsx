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
          <p className="text-white/80">Suri is an offline attendance system focused on privacy.</p>
          <p className="text-[11px] leading-relaxed font-medium text-white/40">
            Here are 3 distinct features regarding how the data works.
          </p>
        </div>
      ),
    },
    {
      title: "1. No Photos Stored",
      content: (
        <div className="space-y-4">
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <h4 className="mb-1 font-bold text-red-200">Suri does not save images</h4>
            <p className="text-[11px] leading-relaxed font-medium text-red-200/50">
              The system converts faces into a unique digital code. It is impossible to rebuild a
              photo from this data.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "2. Offline by Default",
      content: (
        <div className="space-y-4">
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
            <h4 className="mb-1 font-bold text-cyan-200">Data stays on this device</h4>
            <p className="text-[11px] leading-relaxed font-medium text-cyan-200/50">
              Everything runs locally. Nothing is sent to the internet unless you choose to enable
              sync features.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "3. Open Source & Transparent",
      content: (
        <div className="space-y-4">
          <p className="text-white/80">
            Suri is Open Source (AGPL-3.0). You can inspect the code yourself, and you have full
            control over the local database file.
          </p>
          <p className="text-[11px] leading-relaxed font-medium text-white/40">
            Built to be secure, simple, and transparent.
          </p>
          <div className="mt-2 border-t border-white/10 pt-3">
            <p className="text-center text-[11px] leading-relaxed font-medium text-white/30 italic">
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
      <div className="relative -m-5 overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1 bg-white/5">
          <div
            className="h-full bg-cyan-500 transition-all duration-300 ease-out"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          <div className="mt-2 mb-6">
            <h2 className="mb-2 text-lg font-semibold text-white">{currentStep.title}</h2>
            <div className="min-h-[100px]">{currentStep.content}</div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className={`px-2 py-1 text-[11px] font-bold text-white/30 transition-colors hover:text-white ${
                step === 0 ? "pointer-events-none opacity-0" : "opacity-100"
              }`}>
              Back
            </button>

            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === step ? "bg-cyan-500" : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-5 py-2 text-[11px] font-bold text-cyan-400 transition-all hover:bg-cyan-500/20 active:scale-95">
              {step === steps.length - 1 ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
