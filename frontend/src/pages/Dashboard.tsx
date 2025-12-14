import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Plus, FolderKanban, Calendar, CheckCircle2, Clock, Pause, Building } from 'lucide-react';
import { GET_MY_ORGANIZATIONS, GET_PROJECTS } from '../graphql/queries';
import { CREATE_PROJECT, CREATE_ORGANIZATION } from '../graphql/mutations';
import { useOrg } from '../context/OrgContext';
import { Button, Card, Input, Textarea, Modal, Badge, EmptyState, LoadingPage, LoadingSkeleton } from '../components/ui';
import { WebhookModal } from '../components/WebhookModal';
import type { Project, ProjectStatus } from '../types';



const statusConfig: Record<ProjectStatus, { label: string; icon: React.ReactNode; variant: 'success' | 'warning' | 'info' | 'default' }> = {
  ACTIVE: { label: 'Active', icon: <Clock className="w-3 h-3" />, variant: 'success' },
  ON_HOLD: { label: 'On Hold', icon: <Pause className="w-3 h-3" />, variant: 'warning' },
  COMPLETED: { label: 'Completed', icon: <CheckCircle2 className="w-3 h-3" />, variant: 'info' },
  ARCHIVED: { label: 'Archived', icon: null, variant: 'default' },
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentOrg, setCurrentOrg } = useOrg();
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewOrg, setShowNewOrg] = useState(false);
  const [showWebhooks, setShowWebhooks] = useState(false);

  // Fetch org
  const { data: orgsData, loading: orgsLoading } = useQuery(GET_MY_ORGANIZATIONS);

  // Fetch projects for current org
  const { data: projectsData, loading: projectsLoading, refetch: refetchProjects } = useQuery(GET_PROJECTS, {
    variables: { organizationId: currentOrg?.id },
    skip: !currentOrg?.id,
  });



  // Create project mutation
  const [createProject, { loading: creatingProject }] = useMutation(CREATE_PROJECT, {
    onCompleted: () => {
      setShowNewProject(false);
      refetchProjects();
    },
  });

  // Create organization mutation
  const [createOrg, { loading: creatingOrg }] = useMutation(CREATE_ORGANIZATION, {
    refetchQueries: [{ query: GET_MY_ORGANIZATIONS }],
    onCompleted: (data) => {
      if (data?.createOrganization?.organization) {
        setCurrentOrg(data.createOrganization.organization);
        setShowNewOrg(false);
      }
    },
  });

  // Forms
  const projectForm = useForm<{ name: string; description: string }>();
  const orgForm = useForm<{ name: string; contactEmail: string }>();

  const handleCreateProject = async (data: { name: string; description: string }) => {
    if (!currentOrg) return;
    await createProject({
      variables: {
        organizationId: currentOrg.id,
        name: data.name,
        description: data.description,
      },
    });
    projectForm.reset();
  };

  const handleCreateOrg = async (data: { name: string; contactEmail: string }) => {
    await createOrg({
      variables: {
        name: data.name,
        contactEmail: data.contactEmail,
      },
    });
    orgForm.reset();
  };

  if (orgsLoading) return <LoadingPage />;

  const organizations = orgsData?.myOrganizations || [];
  const projects: Project[] = projectsData?.projects || [];

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* No organizations */}
        {organizations.length === 0 ? (
          <Card className="text-center py-16">
            <Building className="w-16 h-16 mx-auto text-surface-400 mb-4" />
            <h2 className="text-xl font-semibold text-surface-900 mb-2">No Organizations</h2>
            <p className="text-surface-500 mb-6">Create your first organization to get started</p>
            <Button onClick={() => setShowNewOrg(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Organization
            </Button>
          </Card>
        ) : (
          <>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-surface-900">Projects</h1>
                <p className="text-surface-500 mt-1">
                  {projects.length} project{projects.length !== 1 ? 's' : ''} in {currentOrg?.name}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowNewOrg(true)}>
                  <Building className="w-4 h-4 mr-2" />
                  New Org
                </Button>
                <Button variant="secondary" onClick={() => setShowWebhooks(true)}>
                  <FolderKanban className="w-4 h-4 mr-2" />
                  Webhooks
                </Button>
                <Button onClick={() => setShowNewProject(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </div>
            </div>

            {/* Projects Grid */}
            {projectsLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <LoadingSkeleton className="h-6 w-3/4 mb-3" />
                    <LoadingSkeleton className="h-4 w-full mb-2" />
                    <LoadingSkeleton className="h-4 w-1/2" />
                  </Card>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <EmptyState
                icon={<FolderKanban className="w-16 h-16" />}
                title="No projects yet"
                description="Create your first project to start managing tasks"
                action={
                  <Button onClick={() => setShowNewProject(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project: Project) => (
                  <Card
                    key={project.id}
                    hover
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors">
                        {project.name}
                      </h3>
                      <Badge variant={statusConfig[project.status].variant}>
                        {statusConfig[project.status].icon}
                        <span className="ml-1">{statusConfig[project.status].label}</span>
                      </Badge>
                    </div>
                    
                    {project.description && (
                      <p className="text-sm text-surface-500 line-clamp-2 mb-4">
                        {project.description}
                      </p>
                    )}

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-surface-500 mb-1">
                        <span>{project.stats.completedTasks} / {project.stats.totalTasks} tasks</span>
                        <span>{Math.round(project.stats.completionRate)}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-600 to-primary-500 transition-all duration-300"
                          style={{ width: `${project.stats.completionRate}%` }}
                        />
                      </div>
                    </div>

                    {project.dueDate && (
                      <div className="flex items-center text-xs text-surface-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        Due {new Date(project.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* New Project Modal */}
      <Modal isOpen={showNewProject} onClose={() => setShowNewProject(false)} title="Create Project">
        <form onSubmit={projectForm.handleSubmit(handleCreateProject)} className="space-y-4">
          <Input
            label="Project Name"
            placeholder="My Awesome Project"
            {...projectForm.register('name', { required: true })}
          />
          <Textarea
            label="Description"
            placeholder="What is this project about?"
            {...projectForm.register('description')}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowNewProject(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={creatingProject}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Organization Modal */}
      <Modal isOpen={showNewOrg} onClose={() => setShowNewOrg(false)} title="Create Organization">
        <form onSubmit={orgForm.handleSubmit(handleCreateOrg)} className="space-y-4">
          <Input
            label="Organization Name"
            placeholder="My Company"
            {...orgForm.register('name', { required: true })}
          />
          <Input
            label="Contact Email"
            type="email"
            placeholder="contact@company.com"
            {...orgForm.register('contactEmail', { required: true })}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowNewOrg(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={creatingOrg}>
              Create Organization
            </Button>
          </div>
        </form>
      </Modal>
      {/* Webhook Modal */}
      <WebhookModal isOpen={showWebhooks} onClose={() => setShowWebhooks(false)} />
    </div>
  );
};
