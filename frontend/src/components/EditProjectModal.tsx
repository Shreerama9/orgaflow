import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2 } from 'lucide-react';
import { Modal, Button, Input, Textarea } from './ui';
import type { Project } from '../types';

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']),
  dueDate: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (projectId: string, data: Partial<ProjectFormData>) => Promise<void>;
  onDelete: (projectId: string) => Promise<void>;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'ACTIVE',
      dueDate: '',
    },
  });

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description || '',
        status: project.status,
        dueDate: project.dueDate ? project.dueDate.split('T')[0] : '',
      });
    }
  }, [project, reset]);

  const handleFormSubmit = async (data: ProjectFormData) => {
    if (!project) return;
    
    const sanitizedData = {
      ...data,
      dueDate: data.dueDate === '' ? null : data.dueDate,
    };
    
    await onSave(project.id, sanitizedData as any);
  };

  const handleDelete = async () => {
    if (!project) return;
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await onDelete(project.id);
    }
  };

  if (!project) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Project">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Project Name"
          placeholder="Project name"
          {...register('name')}
          error={errors.name?.message}
        />

        <Textarea
          label="Description"
          placeholder="Project description..."
          {...register('description')}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Status
            </label>
            <select
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
              {...register('status')}
            >
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
              {...register('dueDate')}
            />
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete Project
          </Button>
          
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} disabled={!isDirty}>
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
