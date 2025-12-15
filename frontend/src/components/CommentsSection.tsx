import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { Send, MessageSquare, Pencil, Trash2, X, Check } from 'lucide-react';
import { GET_TASK_COMMENTS } from '../graphql/queries';
import { CREATE_TASK_COMMENT, UPDATE_TASK_COMMENT, DELETE_TASK_COMMENT } from '../graphql/mutations';
import { Button, Textarea, LoadingSkeleton } from './ui';
import { useAuth } from '../context/AuthContext';
import type { TaskComment } from '../types';

interface CommentsSectionProps {
  taskId: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ taskId }) => {
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { data, loading, refetch } = useQuery(GET_TASK_COMMENTS, {
    variables: { taskId },
    fetchPolicy: 'network-only',
  });

  const [createComment, { loading: creating }] = useMutation(CREATE_TASK_COMMENT, {
    onCompleted: () => {
      reset();
      refetch();
    },
  });

  const [updateComment] = useMutation(UPDATE_TASK_COMMENT, {
    onCompleted: () => {
      setEditingId(null);
      refetch();
    },
  });

  const [deleteComment] = useMutation(DELETE_TASK_COMMENT, {
    onCompleted: () => {
      refetch();
    },
  });

  const { register, handleSubmit, reset } = useForm<{ content: string }>();
  const editForm = useForm<{ content: string }>();

  const onSubmit = async (formData: { content: string }) => {
    if (!formData.content.trim()) return;
    
    await createComment({
      variables: {
        taskId,
        content: formData.content,
      },
    });
  };

  const handleUpdate = async (id: string, content: string) => {
    if (!content.trim()) return;
    await updateComment({
      variables: { id, content },
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this comment?')) {
      await deleteComment({ variables: { id } });
    }
  };

  const startEditing = (comment: TaskComment) => {
    setEditingId(comment.id);
    editForm.setValue('content', comment.content);
  };

  const comments: TaskComment[] = data?.taskComments || [];

  return (
    <div className="mt-6 pt-6 border-t border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Comments ({comments.length})
      </h3>

      {/* Comments List */}
      <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
        {loading ? (
          <div className="space-y-3">
            <LoadingSkeleton className="h-16 w-full" />
            <LoadingSkeleton className="h-16 w-full" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-slate-500 text-sm italic text-center py-4">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 group">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm text-slate-900">
                  {comment.author.fullName || comment.author.email}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                  {user?.id === comment.author.id && !editingId && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEditing(comment)}
                        className="p-1 text-slate-400 hover:text-primary-600"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleDelete(comment.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {editingId === comment.id ? (
                <div className="mt-2">
                  <Textarea {...editForm.register('content')} className="mb-2 text-sm" />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                      <X className="w-3 h-3 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={editForm.handleSubmit((data) => handleUpdate(comment.id, data.content))}>
                      <Check className="w-3 h-3 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-700 text-sm whitespace-pre-wrap">{comment.content}</p>
              )}
            </div>
          ))
        )}
      </div>

      
      <form onSubmit={handleSubmit(onSubmit)} className="relative">
        <Textarea
          placeholder="Write a comment..."
          {...register('content', { required: true })}
          className="pr-12 min-h-[80px]"
        />
        <div className="absolute bottom-3 right-3">
          <Button 
            type="submit" 
            size="sm" 
            isLoading={creating}
            disabled={loading}
            className="!p-2 h-8 w-8 rounded-full flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
