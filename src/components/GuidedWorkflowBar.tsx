/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, Upload, ShieldCheck, TrendingUp, FileText, 
  ChevronRight, Sparkles, Check, HelpCircle 
} from 'lucide-react';

export type WorkflowStepId = 'entity' | 'upload' | 'validate' | 'analysis' | 'reports';

interface GuidedWorkflowBarProps {
  currentStep: WorkflowStepId;
  onSelectStep: (step: WorkflowStepId) => void;
  entityName?: string;
  hasDataUploaded: boolean;
  hasValidated: boolean;
  isGuidedModeActive: boolean;
  onToggleGuidedMode: () => void;
}

export default function GuidedWorkflowBar({
  currentStep,
  onSelectStep,
  entityName,
  hasDataUploaded,
  hasValidated,
  isGuidedModeActive,
  onToggleGuidedMode
}: GuidedWorkflowBarProps) {
  const steps: {
    id: WorkflowStepId;
    stepNumber: number;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    isCompleted: boolean;
  }[] = [
    {
      id: 'entity',
      stepNumber: 1,
      title: 'Entity & Scope',
      subtitle: entityName || 'Select Organisation',
      icon: Building2,
      isCompleted: Boolean(entityName)
    },
    {
      id: 'upload',
      stepNumber: 2,
      title: 'Ingest Statements',
      subtitle: 'Upload P&L, BS & Budget',
      icon: Upload,
      isCompleted: hasDataUploaded
    },
    {
      id: 'validate',
      stepNumber: 3,
      title: 'Validate & Map',
      subtitle: 'Integrity & Account COA',
      icon: ShieldCheck,
      isCompleted: hasValidated
    },
    {
      id: 'analysis',
      stepNumber: 4,
      title: 'Financial Health & Variances',
      subtitle: 'Ratios, DuPont & Risks',
      icon: TrendingUp,
      isCompleted: hasDataUploaded
    },
    {
      id: 'reports',
      stepNumber: 5,
      title: 'Reports & Export',
      subtitle: 'PDF, Word, Excel & Archive',
      icon: FileText,
      isCompleted: false
    }
  ];

  if (!isGuidedModeActive) {
    return (
      <div className="w-full mb-6 flex items-center justify-between px-4 py-2 bg-white/70 border border-[#E8E2D8] rounded-xl text-xs text-slate-500 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase font-bold text-[#D6AE55]">
            FinScope Workflow
          </span>
          <span className="text-slate-300">·</span>
          <span>Positioning: <strong className="text-[#0B192C]">Financial clarity. Better decisions.</strong></span>
        </div>
        <button
          type="button"
          onClick={onToggleGuidedMode}
          className="text-xs font-semibold text-[#0B1530] hover:text-[#D6AE55] underline underline-offset-2 cursor-pointer flex items-center gap-1"
        >
          <span>Enable Guided Assistant</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Determine Next Step recommendation
  const currentStepObj = steps.find(s => s.id === currentStep);
  const nextStepIdx = steps.findIndex(s => s.id === currentStep) + 1;
  const nextStepObj = nextStepIdx < steps.length ? steps[nextStepIdx] : null;

  return (
    <div className="w-full mb-8 bg-white border border-[#E8E2D8] rounded-2xl p-4 sm:p-5 shadow-xs text-left" id="guided-workflow-bar">
      
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E2D8]/70">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#D6AE55] animate-pulse" />
          <span className="text-[10px] font-mono uppercase font-bold text-[#D6AE55] tracking-wider">
            CFO DECISION SUPPORT WORKFLOW
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs italic text-slate-600 hidden md:inline">
            "Financial clarity. Better decisions."
          </span>
        </div>

        <div className="flex items-center gap-3">
          {nextStepObj && (
            <button
              type="button"
              onClick={() => onSelectStep(nextStepObj.id)}
              className="px-3 py-1 bg-[#0B1530] text-[#D6AE55] hover:text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Next: {nextStepObj.title}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onToggleGuidedMode}
            className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
            title="Minimize guide bar"
          >
            Minimize
          </button>
        </div>
      </div>

      {/* Stepper Steps Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isDone = step.isCompleted && !isActive;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelectStep(step.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer group flex flex-col justify-between ${
                isActive
                  ? 'bg-[#0B1530] text-white border-[#0B1530] shadow-sm'
                  : isDone
                  ? 'bg-[#FAF7F2] text-slate-800 border-[#E8E2D8] hover:border-[#D6AE55]/60'
                  : 'bg-white text-slate-600 border-[#E8E2D8] hover:bg-[#FAF7F2]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono font-bold ${
                  isActive ? 'text-[#D6AE55]' : isDone ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                  0{step.stepNumber}
                </span>

                <div className="shrink-0">
                  {isDone ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${
                      isActive ? 'text-[#D6AE55]' : 'text-slate-400 group-hover:text-slate-600'
                    }`} />
                  )}
                </div>
              </div>

              <div>
                <h4 className={`text-xs font-bold leading-tight truncate ${
                  isActive ? 'text-white' : 'text-[#0B192C]'
                }`}>
                  {step.title}
                </h4>
                <p className={`text-[10px] mt-0.5 truncate ${
                  isActive ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  {step.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
}
