'use client';

import { useState } from 'react';
import { useCreateJob } from '@/hooks/use-job';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import type { CreateJobRequest } from '@/app/api/job/jobService';

interface CreateJobFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateJobForm({ onSuccess, onCancel }: CreateJobFormProps) {
  const createJobMutation = useCreateJob();
  const [formData, setFormData] = useState<CreateJobRequest>({
    aladinId: '',
    genieId: '',
    title: '',
    description: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateJobRequest, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateJobRequest, string>> = {};

    if (!formData.aladinId.trim()) {
      newErrors.aladinId = 'Aladin ID is required';
    } else if (!formData.aladinId.startsWith('stake')) {
      newErrors.aladinId = 'Aladin ID should be a valid stake address';
    }

    if (!formData.genieId.trim()) {
      newErrors.genieId = 'Genie ID is required';
    } else if (!formData.genieId.startsWith('stake')) {
      newErrors.genieId = 'Genie ID should be a valid stake address';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await createJobMutation.mutateAsync(formData);
      // Reset form
      setFormData({
        aladinId: '',
        genieId: '',
        title: '',
        description: '',
      });
      setErrors({});
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };

  const handleChange = (field: keyof CreateJobRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Create New Job</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in the details to create a new job posting
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Aladin ID */}
          <div className="space-y-2">
            <Label htmlFor="aladinId">
              Aladin ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="aladinId"
              type="text"
              placeholder="stake_test1urneev200c04gxqcpq5ss3km0mumpn4wsd609k98d928qxckht3z8"
              value={formData.aladinId}
              onChange={handleChange('aladinId')}
              className={errors.aladinId ? 'border-destructive' : ''}
              disabled={createJobMutation.isPending}
            />
            {errors.aladinId && (
              <p className="text-sm text-destructive">{errors.aladinId}</p>
            )}
          </div>

          {/* Genie ID */}
          <div className="space-y-2">
            <Label htmlFor="genieId">
              Genie ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="genieId"
              type="text"
              placeholder="stake_test1urneev200c04gxqcpq5ss3km0mumpn4wsd609k98d928qxckht3z8"
              value={formData.genieId}
              onChange={handleChange('genieId')}
              className={errors.genieId ? 'border-destructive' : ''}
              disabled={createJobMutation.isPending}
            />
            {errors.genieId && (
              <p className="text-sm text-destructive">{errors.genieId}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Test Job"
              value={formData.title}
              onChange={handleChange('title')}
              className={errors.title ? 'border-destructive' : ''}
              disabled={createJobMutation.isPending}
              maxLength={200}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Test description"
              value={formData.description}
              onChange={handleChange('description')}
              className={errors.description ? 'border-destructive' : ''}
              disabled={createJobMutation.isPending}
              rows={4}
              maxLength={1000}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/1000 characters
            </p>
          </div>

          {/* Error Alert */}
          {createJobMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {createJobMutation.error instanceof Error
                  ? createJobMutation.error.message
                  : 'Failed to create job. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={createJobMutation.isPending}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={createJobMutation.isPending}>
              {createJobMutation.isPending ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Creating...
                </>
              ) : (
                'Create Job'
              )}
            </Button>
          </div>
        </form>
    </div>
  );
}