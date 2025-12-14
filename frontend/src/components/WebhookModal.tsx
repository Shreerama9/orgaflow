import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { Webhook, Trash2, Plus, AlertCircle } from 'lucide-react';
import { Modal, Button, Input, LoadingSkeleton } from './ui';
import { GET_MY_WEBHOOKS } from '../graphql/queries';
import { CREATE_WEBHOOK, DELETE_WEBHOOK } from '../graphql/mutations';
import { useOrg } from '../context/OrgContext';

interface WebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WebhookType {
  id: string;
  url: string;
  secret: string;
  isActive: boolean;
  events: string[];
  createdAt: string;
}

export const WebhookModal: React.FC<WebhookModalProps> = ({ isOpen, onClose }) => {
  const { currentOrg } = useOrg();
  const [showSecret, setShowSecret] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(GET_MY_WEBHOOKS, {
    variables: { organizationId: currentOrg?.id },
    skip: !currentOrg?.id,
  });

  const [createWebhook, { loading: creating }] = useMutation(CREATE_WEBHOOK, {
    onCompleted: () => {
      reset();
      refetch();
    },
  });

  const [deleteWebhook, { loading: deleting }] = useMutation(DELETE_WEBHOOK, {
    onCompleted: () => {
      refetch();
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ url: string }>();

  const onSubmit = async (formData: { url: string }) => {
    if (!currentOrg) return;
    
    await createWebhook({
      variables: {
        organizationId: currentOrg.id,
        url: formData.url,
        events: ["task.created", "task.updated"], // Default events
      },
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this webhook?')) {
      await deleteWebhook({ variables: { id } });
    }
  };

  const webhooks: WebhookType[] = data?.myWebhooks || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Webhook Settings">
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Webhooks</p>
            <p>
              Webhooks allow external services to be notified when events happen in your organization. 
              We'll send a POST request to your URL with event details.
            </p>
          </div>
        </div>

        {/* Add Webhook Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              label="Add Endpoint URL"
              placeholder="https://api.yourservice.com/webhook"
              {...register('url', { 
                required: 'URL is required',
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Must be a valid URL starting with http:// or https://'
                }
              })}
              error={errors.url?.message}
            />
          </div>
          <Button type="submit" isLoading={creating} className="mb-[2px]">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </form>

        {/* Webhooks List */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-900">Active Webhooks</h3>
          
          {loading ? (
            <div className="space-y-3">
              <LoadingSkeleton className="h-20 w-full" />
              <LoadingSkeleton className="h-20 w-full" />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
              <Webhook className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">No webhooks configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="border border-slate-200 rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-mono text-sm text-slate-700 break-all">
                      {webhook.url}
                    </div>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => handleDelete(webhook.id)}
                      isLoading={deleting}
                      className="ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <span className={`px-2 py-0.5 rounded-full ${webhook.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span>•</span>
                    <span>Created {new Date(webhook.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Secret Display */}
                  <div className="bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between group">
                    <div className="text-xs font-mono text-slate-600">
                      <span className="font-semibold text-slate-400 mr-2">Secret:</span>
                      {showSecret === webhook.id ? webhook.secret : '••••••••••••••••••••••••••••••••'}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setShowSecret(showSecret === webhook.id ? null : webhook.id)}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        {showSecret === webhook.id ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
