/**
 * Drag-and-Drop Task Board Component using DnD Kit.
 * Allows reordering tasks between status columns.
 */

import React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare, User, GripVertical } from 'lucide-react';
import { Badge, Card } from './ui';
import type { Task, TaskStatus, TaskPriority } from '../types';

interface TaskBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
}

const priorityConfig: Record<TaskPriority, { label: string; variant: 'default' | 'info' | 'warning' | 'danger' }> = {
  LOW: { label: 'Low', variant: 'default' },
  MEDIUM: { label: 'Medium', variant: 'info' },
  HIGH: { label: 'High', variant: 'warning' },
  URGENT: { label: 'Urgent', variant: 'danger' },
};

const statusColumns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'TODO', label: 'To Do', color: 'border-surface-400' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: 'border-primary-600' },
  { status: 'DONE', label: 'Done', color: 'border-success' },
];

// Sortable Task Card
const SortableTaskCard: React.FC<TaskCardProps & { id: string }> = ({ id, task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card hover className="group relative">
        {/* Drag Handle */}
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        
        <div className="ml-6 cursor-pointer" onClick={onClick}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-medium text-slate-800 group-hover:text-primary-600 transition-colors flex-1">
              {task.title}
            </h4>
            <Badge variant={priorityConfig[task.priority].variant}>
              {priorityConfig[task.priority].label}
            </Badge>
          </div>
          
          {task.description && (
            <p className="text-sm text-slate-500 line-clamp-2 mb-3">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-slate-500">
            {task.assignee && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {task.assignee.fullName || task.assignee.email}
              </div>
            )}
            {task.commentCount > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {task.commentCount}
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

// Static Task Card for Drag Overlay
const TaskCardOverlay: React.FC<{ task: Task }> = ({ task }) => (
  <Card className="shadow-2xl border-primary-500">
    <div className="flex items-start justify-between gap-2 mb-2">
      <h4 className="font-medium text-slate-800 flex-1">{task.title}</h4>
      <Badge variant={priorityConfig[task.priority].variant}>
        {priorityConfig[task.priority].label}
      </Badge>
    </div>
    {task.description && (
      <p className="text-sm text-slate-500 line-clamp-2">{task.description}</p>
    )}
  </Card>
);

// Droppable Column
const DroppableColumn: React.FC<{
  status: TaskStatus;
  label: string;
  color: string;
  children: React.ReactNode;
  taskCount: number;
}> = ({ status, label, color, children, taskCount }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col transition-all ${isOver ? 'bg-primary-100/50 rounded-lg' : ''}`}
    >
      {/* Column Header */}
      <div className={`flex items-center gap-2 pb-3 mb-3 border-b-2 ${color}`}>
        <h3 className="font-semibold text-slate-700">{label}</h3>
        <span className="px-2 py-0.5 bg-primary-100 rounded-full text-xs text-primary-700 font-medium">
          {taskCount}
        </span>
      </div>

      {/* Droppable Area */}
      <div className={`flex-1 space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
        isOver ? 'bg-primary-50 border-2 border-dashed border-primary-400' : ''
      }`}>
        {children}
      </div>
    </div>
  );
};

// Main TaskBoard Component
export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onTaskClick,
  onStatusChange,
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const activeTask = tasks.find((t) => t.id === activeId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = () => {
    // Optional: Handle drag over for visual feedback
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Find the task being dragged
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Check if dropped on a column directly
    const droppedOnColumn = statusColumns.find((col) => col.status === overId);
    if (droppedOnColumn && task.status !== droppedOnColumn.status) {
      console.log(`Moving task ${taskId} to ${droppedOnColumn.status}`);
      onStatusChange(taskId, droppedOnColumn.status);
      return;
    }

    // Check if dropped on another task - get that task's status
    const targetTask = tasks.find((t) => t.id === overId);
    if (targetTask && task.status !== targetTask.status) {
      console.log(`Moving task ${taskId} to ${targetTask.status} (dropped on task)`);
      onStatusChange(taskId, targetTask.status);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statusColumns.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.status);
          const taskIds = columnTasks.map((t) => t.id);

          return (
            <DroppableColumn
              key={column.status}
              status={column.status}
              label={column.label}
              color={column.color}
              taskCount={columnTasks.length}
            >
              <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                {columnTasks.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                    Drop tasks here
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <SortableTaskCard
                      key={task.id}
                      id={task.id}
                      task={task}
                      onClick={() => onTaskClick(task)}
                    />
                  ))
                )}
              </SortableContext>
            </DroppableColumn>
          );
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask && <TaskCardOverlay task={activeTask} />}
      </DragOverlay>
    </DndContext>
  );
};
