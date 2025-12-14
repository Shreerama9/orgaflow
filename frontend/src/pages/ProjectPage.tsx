/**
 * Project Detail Page - Task board with Kanban columns and drag-and-drop.
 * Shows tasks organized by status with create/edit functionality.
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus } from 'lucide-react';
import { GET_PROJECT, GET_TASKS, GET_ORGANIZATION_MEMBERS } from '../graphql/queries';
import { CREATE_TASK, UPDATE_TASK, DELETE_TASK } from '../graphql/mutations';
import { Button, Input, Textarea, Modal, LoadingPage, Card } from '../components/ui';
import { TaskBoard } from '../components/TaskBoard';
import { EditTaskModal } from '../components/EditTaskModal';
import type { Task, TaskStatus, TaskPriority, User } from '../types';

export const ProjectPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showNewTask, setShowNewTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch project
  const { data: projectData, loading: projectLoading } = useQuery(GET_PROJECT, {
    variables: { id },
  });

  // Fetch tasks
  const { data: tasksData, refetch: refetchTasks } = useQuery(GET_TASKS, {
    variables: { projectId: id },
  });



  // Fetch organization members for assignee dropdown
  const { data: membersData } = useQuery(GET_ORGANIZATION_MEMBERS, {
    variables: { organizationId: projectData?.project?.organization?.id },
    skip: !projectData?.project?.organization?.id,
  });

  // Mutations
  const [createTask, { loading: creatingTask }] = useMutation(CREATE_TASK, {
    onCompleted: () => {
      setShowNewTask(false);
      refetchTasks();
    },
  });

  const [updateTask, { loading: updatingTask }] = useMutation(UPDATE_TASK, {
    onCompleted: () => {
      refetchTasks();
      setShowEditModal(false);
      setSelectedTask(null);
    },
    onError: (error) => {
      console.error('Update task error:', error);
      alert(`Failed to update task: ${error.message}`);
    },
  });

  const [deleteTask, { loading: deletingTask }] = useMutation(DELETE_TASK, {
    onCompleted: () => {
      setSelectedTask(null);
      setShowEditModal(false);
      refetchTasks();
    },
    onError: (error) => {
      console.error('Delete task error:', error);
      alert(`Failed to delete task: ${error.message}`);
    },
  });



  // Forms
  const taskForm = useForm<{ title: string; description: string; priority: TaskPriority }>();

  const handleCreateTask = async (data: { title: string; description: string; priority: TaskPriority }) => {
    await createTask({
      variables: {
        projectId: id,
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
      },
    });
    taskForm.reset();
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    // Find the task to create an optimistic response
    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (!taskToUpdate) return;

    await updateTask({
      variables: { id: taskId, status },
      optimisticResponse: {
        __typename: 'Mutation',
        updateTask: {
          __typename: 'UpdateTask',
          success: true,
          task: {
            __typename: 'TaskType',
            ...taskToUpdate,
            status, // Optimistically update the status
            updatedAt: new Date().toISOString(),
          },
        },
      },
      update: (cache, { data }) => {
        // Update the cache with the new task status
        if (data?.updateTask?.task) {
          cache.modify({
            id: cache.identify({ __typename: 'TaskType', id: taskId }),
            fields: {
              status: () => status,
            },
          });
        }
      },
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowEditModal(true);
  };

  const handleSaveTask = async (taskId: string, data: Partial<Task>) => {
    await updateTask({
      variables: {
        id: taskId,
        ...data,
      },
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask({ variables: { id: taskId } });
  };



  if (projectLoading) return <LoadingPage />;

  const project = projectData?.project;
  const tasks: Task[] = tasksData?.tasks || [];
  const members: User[] = membersData?.organizationMembers?.map((m: { user: User }) => m.user) || [];

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Card className="text-center">
          <h2 className="text-xl font-semibold text-surface-900 mb-2">Project Not Found</h2>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 border-b border-surface-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-surface-900">{project.name}</h1>
                <p className="text-sm text-surface-500">{project.organization?.name}</p>
              </div>
            </div>
            <Button onClick={() => setShowNewTask(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Drag-and-Drop Task Board */}
        <TaskBoard
          tasks={tasks}
          onTaskClick={handleTaskClick}
          onStatusChange={handleStatusChange}
        />
      </main>

      {/* New Task Modal */}
      <Modal isOpen={showNewTask} onClose={() => setShowNewTask(false)} title="Create Task">
        <form onSubmit={taskForm.handleSubmit(handleCreateTask)} className="space-y-4">
          <Input
            label="Task Title"
            placeholder="What needs to be done?"
            {...taskForm.register('title', { required: true })}
          />
          <Textarea
            label="Description"
            placeholder="Add more details..."
            {...taskForm.register('description')}
          />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Priority</label>
            <select
              className="w-full px-4 py-2.5 bg-white border border-surface-300 rounded-lg text-surface-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              {...taskForm.register('priority')}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowNewTask(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={creatingTask}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        members={members}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        isSaving={updatingTask}
        isDeleting={deletingTask}
      />

      {/* Comments Section in Edit Modal - Optional Enhancement */}

    </div>
  );
};
