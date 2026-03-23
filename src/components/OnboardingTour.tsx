"use client";

import { useState, useEffect } from "react";

export interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

interface OnboardingTourProps {
  steps: TourStep[];
  tourKey: string;
  onComplete?: () => void;
}

export function OnboardingTour({ steps, tourKey, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Check if tour has been completed before
  useEffect(() => {
    const completed = localStorage.getItem(`edlog-tour-${tourKey}`);
    if (!completed) {
      const timer = setTimeout(() => setIsActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [tourKey]);

  // Prevent background scrolling when tour is active
  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isActive]);

  // Find and measure the target element for the current step
  useEffect(() => {
    if (!isActive) return;
    const step = steps[currentStep];
    if (!step) return;

    let retryCount = 0;
    const maxRetries = 5;

    const findTarget = () => {
      const el = document.querySelector(step.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setTargetRect(null);
        // Retry a few times for elements that may not have rendered yet
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(findTarget, 400);
        }
      }
    };

    findTarget();

    const handleResize = () => {
      const el = document.querySelector(step.target);
      if (el) setTargetRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isActive, currentStep, steps]);

  function handleNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }

  function handleSkip() {
    handleComplete();
  }

  function handleComplete() {
    setIsActive(false);
    localStorage.setItem(`edlog-tour-${tourKey}`, "completed");
    onComplete?.();
  }

  if (!isActive) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  // Calculate tooltip position (prefer below, fall back to above)
  let tooltipTop: number;
  let tooltipLeft: number;
  let useTransform = false;

  if (targetRect) {
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const tooltipHeight = 200; // approx

    if (spaceBelow >= tooltipHeight + 20 || spaceBelow >= spaceAbove) {
      tooltipTop = Math.min(targetRect.bottom + 16, window.innerHeight - tooltipHeight - 16);
    } else {
      tooltipTop = Math.max(16, targetRect.top - tooltipHeight - 16);
    }
    tooltipLeft = Math.max(16, Math.min(targetRect.left, window.innerWidth - 316));
    tooltipTop = Math.max(16, Math.min(tooltipTop, window.innerHeight - 200));
  } else {
    tooltipTop = 0;
    tooltipLeft = 0;
    useTransform = true;
  }

  return (
    <div className="fixed inset-0 z-[9998]" onClick={handleSkip}>
      {/* Spotlight overlay */}
      {targetRect ? (
        <div
          className="fixed z-[9998] transition-all duration-300 ease-out"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: "12px",
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
            pointerEvents: "none",
          }}
        />
      ) : (
        <div
          className="fixed inset-0 z-[9998]"
          style={{ background: "rgba(0,0,0,0.6)", pointerEvents: "none" }}
        />
      )}

      {/* Tooltip card */}
      <div
        className="fixed z-[9999] transition-all duration-300 ease-out"
        style={{
          top: useTransform ? "50%" : tooltipTop,
          left: useTransform ? "50%" : tooltipLeft,
          transform: useTransform ? "translate(-50%, -50%)" : "none",
          maxWidth: "300px",
          width: "calc(100vw - 32px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: "hsl(var(--surface-elevated))",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "var(--shadow-elevated)",
            border: "1px solid var(--border-primary)",
          }}
        >
          {/* Step counter */}
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-tertiary)",
              marginBottom: "8px",
            }}
          >
            {currentStep + 1} of {steps.length}
          </p>

          {/* Title */}
          <h3
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "6px",
            }}
          >
            {step.title}
          </h3>

          {/* Description */}
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: "16px",
            }}
          >
            {step.description}
          </p>

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={handleSkip}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-tertiary)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 12px",
              }}
            >
              Skip tour
            </button>
            <button
              onClick={handleNext}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 700,
                color: "white",
                background: isLastStep
                  ? "hsl(var(--success))"
                  : "hsl(var(--accent))",
                border: "none",
                borderRadius: "12px",
                padding: "10px 20px",
                cursor: "pointer",
                boxShadow: isLastStep
                  ? "0 4px 12px -4px hsl(var(--success) / 0.3)"
                  : "0 4px 12px -4px hsl(var(--accent) / 0.3)",
              }}
            >
              {isLastStep ? "Get Started!" : "Next →"}
            </button>
          </div>

          {/* Progress dots */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "4px",
              marginTop: "12px",
            }}
          >
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentStep ? "16px" : "6px",
                  height: "6px",
                  borderRadius: "6px",
                  background:
                    i === currentStep
                      ? "var(--accent)"
                      : i < currentStep
                        ? "var(--accent-muted, hsl(var(--accent-strong)))"
                        : "hsl(var(--surface-tertiary))",
                  transition: "all 0.2s ease",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
