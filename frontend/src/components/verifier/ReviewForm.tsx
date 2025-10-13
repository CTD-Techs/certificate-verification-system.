import React, { useState } from 'react';
import { Select, Textarea, Button } from '../common';
import { REVIEW_DECISIONS } from '../../utils/constants';

interface ReviewFormData {
  decision: string;
  comments: string;
  confidenceOverride?: number;
}

interface ReviewFormProps {
  onSubmit: (data: ReviewFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<ReviewFormData>({
    decision: '',
    comments: '',
    confidenceOverride: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.decision) {
      newErrors.decision = 'Decision is required';
    }

    if (!formData.comments || formData.comments.trim().length < 10) {
      newErrors.comments = 'Comments must be at least 10 characters';
    }

    if (formData.confidenceOverride !== undefined) {
      if (formData.confidenceOverride < 0 || formData.confidenceOverride > 100) {
        newErrors.confidenceOverride = 'Confidence must be between 0 and 100';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit({
        ...formData,
        confidenceOverride: formData.confidenceOverride
          ? formData.confidenceOverride / 100
          : undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Decision */}
      <Select
        label="Decision"
        value={formData.decision}
        onChange={(value) => {
          setFormData({ ...formData, decision: value });
          if (errors.decision) {
            setErrors({ ...errors, decision: '' });
          }
        }}
        options={REVIEW_DECISIONS}
        error={errors.decision}
        required
      />

      {/* Comments */}
      <Textarea
        label="Comments"
        value={formData.comments}
        onChange={(value) => {
          setFormData({ ...formData, comments: value });
          if (errors.comments) {
            setErrors({ ...errors, comments: '' });
          }
        }}
        placeholder="Provide detailed comments about your decision..."
        error={errors.comments}
        required
        rows={6}
        maxLength={1000}
      />

      {/* Confidence Override */}
      <div>
        <label className="block text-sm font-medium text-white mb-1">
          Confidence Score Override (Optional)
        </label>
        <input
          type="number"
          min="0"
          max="100"
          value={formData.confidenceOverride || ''}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : undefined;
            setFormData({ ...formData, confidenceOverride: value });
            if (errors.confidenceOverride) {
              setErrors({ ...errors, confidenceOverride: '' });
            }
          }}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.confidenceOverride
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300'
          }`}
          placeholder="0-100"
        />
        {errors.confidenceOverride && (
          <p className="mt-1 text-sm text-red-600">{errors.confidenceOverride}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Override the automated confidence score (0-100%)
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end border-t border-gray-200 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          Submit Review
        </Button>
      </div>
    </form>
  );
};