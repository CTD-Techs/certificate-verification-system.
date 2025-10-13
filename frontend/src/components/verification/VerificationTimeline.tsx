import React from 'react';
import { VerificationStep } from '../../types';
import { formatDate } from '../../utils/format';

interface VerificationTimelineProps {
  steps: VerificationStep[];
}

export const VerificationTimeline: React.FC<VerificationTimelineProps> = ({ steps }) => {
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'FAILED':
        return (
          <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'IN_PROGRESS':
        return (
          <svg className="h-6 w-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {steps.map((step, stepIdx) => (
          <li key={step.id}>
            <div className="relative pb-8">
              {stepIdx !== steps.length - 1 && (
                <span
                  className="absolute top-6 left-3 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div className="flex h-6 w-6 items-center justify-center">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{step.stepType}</p>
                    {step.result && (
                      <p className="mt-1 text-sm text-gray-600">
                        Result: {typeof step.result === 'object' ? JSON.stringify(step.result) : step.result}
                      </p>
                    )}
                    {step.error && (
                      <p className="mt-1 text-sm text-red-600">Error: {step.error}</p>
                    )}
                    {step.metadata && Object.keys(step.metadata).length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700">Details:</p>
                        <div className="mt-1 text-xs text-gray-600 bg-gray-50 rounded p-2">
                          {Object.entries(step.metadata).map(([key, value]) => (
                            <div key={key} className="flex justify-between py-1">
                              <span className="font-medium">{key}:</span>
                              <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <p>{formatDate(step.startedAt)}</p>
                    {step.completedAt && (
                      <p className="text-xs">
                        Duration: {Math.round((new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime()) / 1000)}s
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};