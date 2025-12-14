
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2 } from 'lucide-react';
import { Modal, Button, Input, Textarea } from './ui';
import { CommentsSection } from './CommentsSection';
import type { Task, User } from '../types';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  members?: User[];
  onSave: (taskId: string, data: Partial<TaskFormData>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  members = [],
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
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: '',
      dueDate: '',
    },
  });

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee?.id || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      });
    }
  }, [task, reset]);

  const handleFormSubmit = async (data: TaskFormData) => {
    if (!task) return;
    
    // Sanitize data: convert empty strings to null for optional fields to allow clearing them
    const sanitizedData = {
      ...data,
      assigneeId: data.assigneeId === '' ? null : data.assigneeId,
      dueDate: data.dueDate === '' ? null : data.dueDate,
    };
    
    // Cast to any to avoid type mismatch between TaskFormData and Task (which expects User object for assignee)
    await onSave(task.id, sanitizedData as any);
  };

  const handleDelete = async () => {
    if (!task) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      await onDelete(task.id);
    }
  };

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Task">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Title */}
        <Input
          label="Title"
          placeholder="Task title"
          {...register('title')}
          error={errors.title?.message}
        />

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Add more details..."
          {...register('description')}
        />

        {/* Status & Priority Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Status
            </label>
            <select
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
              {...register('status')}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Priority
            </label>
            <select
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
              {...register('priority')}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Assignee */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            Assignee
          </label>
          <select
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
            {...register('assigneeId')}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName || member.email}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date */}
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

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
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

      <CommentsSection taskId={task.id} />
    </Modal>
  );
};
