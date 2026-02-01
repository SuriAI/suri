import { useState } from "react";
import { useUIStore } from "@/components/main/stores/uiStore";

export function IntroModal() {
  const { setHasSeenIntro } = useUIStore();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Suri",
      content: (
        <div className="space-y-4">
          <p className="text-white/80">
            Suri is a privacy-first, offline-capable attendance system.
          </p>
          <p className="text-white/60 text-sm">
            Before we get started, here are 3 things you need to know about how
            your data is handled.
          </p>
        </div>
      ),
    },
    {
      title: "1. Zero-Image Storage",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <h4 className="text-red-200 font-medium mb-1">
              We do NOT store photos
            </h4>
            <p className="text-red-200/70 text-sm">
              Suri converts faces into mathematical vectors. It is impossible to
              reconstruct a photo from your database.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "2. Offline by Default",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
            <h4 className="text-cyan-200 font-medium mb-1">
              Your Data Stays Here
            </h4>
            <p className="text-cyan-200/70 text-sm">
              Suri runs entirely on this device. No data is sent to the cloud
              unless you explicitly enable optional sync features.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "3. You Are In Control",
      content: (
        <div className="space-y-4">
          <p className="text-white/80">
            This application is Open Source (AGPL-3.0). You have full access to
            the code and full ownership of your local SQLite database.
          </p>
          <p className="text-white/60 text-sm">
            We built Suri to be transparent, secure, and sovereign.
          </p>
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] px-4 backdrop-blur-sm">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 w-full max-w-[420px] shadow-[0_40px_80px_rgba(0,0,0,0.8)] relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
          <div
            className="h-full bg-cyan-500 transition-all duration-300 ease-out"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

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
            className={`text-sm text-white/40 hover:text-white/80 transition-colors px-2 py-1 ${
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
            className="px-5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 hover:bg-cyan-500/30 transition-colors text-sm font-medium active:scale-95"
          >
            {step === steps.length - 1 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
