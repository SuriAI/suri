import { useState } from "react";
import { useUIStore } from "@/components/main/stores/uiStore";
import { Modal } from "@/components/common";

export function IntroModal() {
  const { setHasSeenIntro } = useUIStore();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Suri",
      content: (
        <div className="space-y-4">
          <p className="text-white/80">
            Suri is an offline attendance system focused on privacy.
          </p>
          <p className="text-white/40 text-[11px] font-medium leading-relaxed">
            Here are 3 distinct features regarding how the data works.
          </p>
        </div>
      ),
    },
    {
      title: "1. No Photos Stored",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <h4 className="text-red-200 font-bold mb-1">
              Suri does not save images
            </h4>
            <p className="text-red-200/50 text-[11px] font-medium leading-relaxed">
              The system converts faces into a unique digital code. It is
              impossible to rebuild a photo from this data.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "2. Offline by Default",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <h4 className="text-cyan-200 font-bold mb-1">
              Data stays on this device
            </h4>
            <p className="text-cyan-200/50 text-[11px] font-medium leading-relaxed">
              Everything runs locally. Nothing is sent to the internet unless
              you choose to enable sync features.
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
            Suri is Open Source (AGPL-3.0). You can inspect the code yourself,
            and you have full control over the local database file.
          </p>
          <p className="text-white/40 text-[11px] font-medium leading-relaxed">
            Built to be secure, simple, and transparent.
          </p>
          <div className="pt-3 border-t border-white/10 mt-2">
            <p className="text-white/30 text-[11px] text-center italic font-medium leading-relaxed">
              By clicking &quot;Get Started&quot;, you acknowledge that you
              understand how Suri handles your data locally.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setHasSeenIntro(true);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const currentStep = steps[step];

  return (
    <Modal isOpen={true} maxWidth="md" hideCloseButton={true}>
      <div className="relative overflow-hidden -m-5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
          <div
            className="h-full bg-cyan-500 transition-all duration-300 ease-out"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          <div className="mb-6 mt-2">
            <h2 className="text-lg font-semibold mb-2 text-white">
              {currentStep.title}
            </h2>
            <div className="min-h-[100px]">{currentStep.content}</div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className={`text-[11px] font-bold text-white/30 hover:text-white transition-colors px-2 py-1 ${
                step === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            >
              Back
            </button>

            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === step ? "bg-cyan-500" : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all text-[11px] font-bold active:scale-95"
            >
              {step === steps.length - 1 ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
