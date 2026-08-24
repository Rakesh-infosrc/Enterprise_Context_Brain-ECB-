// frontend/src/components/OnboardingTour.tsx

import React, { useState } from 'react';
import {
  Sparkles,
  BrainCircuit,
  FileSearch,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Layers,
  GitMerge,
  Cpu,
} from 'lucide-react';
import { RippleButton } from "@/components/ui/ripple-button";

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAsk: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onNavigateToAsk,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to Enterprise Context Brain (ECB)',
      badge: 'Unified Organizational Memory',
      icon: BrainCircuit,
      iconColor: '#5ca8ff',
      description:
        'ECB acts as an intelligent operating system for your enterprise. It continuously synthesizes fragmented knowledge across Jira tickets, Git commits, Architecture Decision Records (ADRs), risk registers, and Slack channels into a single verifiable context plane.',
      highlight: 'Resolves context silos and prevents costly architectural misalignment.',
    },
    {
      title: 'Evidence-Grounded AI Command Center',
      badge: 'North-Star Flow: Ask → Evidence',
      icon: Sparkles,
      iconColor: '#9b7cff',
      description:
        'Ask complex cross-domain questions (e.g. "Why is Project Aegis delayed?"). ECB formulates a structured context plan, executes hybrid vector retrieval via Qdrant, and generates an answer where every factual claim has an auditable citation link [E1], [E2].',
      highlight: 'Over 98% factual groundedness verified by Chain-of-Verification (CoVe).',
    },
    {
      title: 'Live Evidence Rail & Contradiction Detection',
      badge: 'Automated Dispute Resolution',
      icon: FileSearch,
      iconColor: '#fb923c',
      description:
        'When sources disagree (e.g. Jira roadmap says Sept 15 while Git commit says Oct 30), ECB automatically flags the contradiction, inspects source authority, and alerts decision-makers before misalignment cascades.',
      highlight: 'Inspect supporting, conflicting, and superseded evidence side-by-side.',
    },
    {
      title: 'Governed Actions & Model Context Protocol (MCP)',
      badge: 'Two-Person Rule & Safe Execution',
      icon: ShieldCheck,
      iconColor: '#35d07f',
      description:
        'ECB does not just answer questions—it proposes governed actions (e.g. updating a Jira deadline or tagging a Git release). High-impact actions require explicit human review in the Approval Center and execute safely via MCP with immutable audit logs.',
      highlight: 'Zero unapproved production mutations. Total governance and compliance.',
    },
  ];

  const activeStepData = steps[currentStep];
  const StepIcon = activeStepData.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
      onNavigateToAsk();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 11, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        className="view-transition-enter"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.95) 0%, rgba(7, 17, 31, 0.98) 100%)',
          border: '1px solid rgba(92, 168, 255, 0.3)',
          borderRadius: '24px',
          padding: '2.25rem',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(92, 168, 255, 0.15)',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
        >
          <X size={16} />
        </RippleButton>

        {/* Step Indicator Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <span className="glass-pill active" style={{ fontSize: '0.72rem' }}>
            Step {currentStep + 1} of {steps.length}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {activeStepData.badge}
          </span>
        </div>

        {/* Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${activeStepData.iconColor}22 0%, ${activeStepData.iconColor}44 100%)`,
              border: `1px solid ${activeStepData.iconColor}66`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 20px ${activeStepData.iconColor}33`,
            }}
          >
            <StepIcon size={28} color={activeStepData.iconColor} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
              {activeStepData.title}
            </h2>
          </div>
        </div>

        {/* Description Body */}
        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          {activeStepData.description}
        </p>

        {/* Highlight Callout Box */}
        <div
          style={{
            background: 'rgba(92, 168, 255, 0.08)',
            borderLeft: `3px solid ${activeStepData.iconColor}`,
            borderRadius: '0 10px 10px 0',
            padding: '0.85rem 1.1rem',
            marginBottom: '2rem',
            fontSize: '0.825rem',
            color: '#f8fafc',
            fontWeight: 500,
          }}
        >
          💡 <strong>Key Takeaway:</strong> {activeStepData.highlight}
        </div>

        {/* Footer Navigation Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Progress Dots */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {steps.map((_, i) => (
              <div
                key={i}
                onClick={() => setCurrentStep(i)}
                style={{
                  width: i === currentStep ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  background: i === currentStep ? '#5ca8ff' : 'rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {currentStep > 0 && (
              <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
                onClick={handlePrev}
                className="glass-btn"
                style={{ padding: '0.55rem 1rem', fontSize: '0.825rem' }}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </RippleButton>
            )}

            <RippleButton rippleColor="rgba(255,255,255,0.35)" duration="600ms"
              onClick={handleNext}
              className="glass-btn glass-btn-primary"
              style={{ padding: '0.55rem 1.35rem', fontSize: '0.825rem' }}
            >
              <span>{currentStep === steps.length - 1 ? 'Start Asking ECB' : 'Next'}</span>
              <ArrowRight size={14} />
            </RippleButton>
          </div>
        </div>
      </div>
    </div>
  );
};