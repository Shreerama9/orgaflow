import graphene
from graphene_django import DjangoObjectType
import graphql_jwt
from graphql_jwt.decorators import login_required
from django.db.models import Q, Count, Case, When, IntegerField

from apps.users.models import User
from apps.organizations.models import Organization, OrganizationMember, Webhook
from apps.projects.models import Project, Task, TaskComment

# --- Types ---

class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'avatar_url', 'date_joined')

class OrganizationType(DjangoObjectType):
    member_count = graphene.Int()
    project_count = graphene.Int()

    class Meta:
        model = Organization
        fields = ('id', 'name', 'slug', 'uid', 'contact_email', 'created_at')

    def resolve_member_count(self, info):
        return self.organizationmember_set.count()

    def resolve_project_count(self, info):
        return self.projects.count()

class OrganizationMemberType(DjangoObjectType):
    class Meta:
        model = OrganizationMember
        fields = ('id', 'user', 'organization', 'role')

class ProjectStatsType(graphene.ObjectType):
    total_tasks = graphene.Int()
    completed_tasks = graphene.Int()
    in_progress_tasks = graphene.Int()
    todo_tasks = graphene.Int()
    completion_rate = graphene.Float()

class ProjectType(DjangoObjectType):
    stats = graphene.Field(ProjectStatsType)

    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'status', 'due_date', 'organization', 'created_at', 'updated_at')

    def resolve_stats(self, info):
        return self.get_task_stats()

class TaskType(DjangoObjectType):
    comment_count = graphene.Int()

    class Meta:
        model = Task
        fields = ('id', 'title', 'description', 'status', 'priority', 'assignee', 'project', 'due_date', 'order', 'created_at', 'updated_at')

    def resolve_comment_count(self, info):
        return self.comments.count()

class TaskCommentType(DjangoObjectType):
    class Meta:
        model = TaskComment
        fields = ('id', 'task', 'content', 'author', 'created_at', 'updated_at')

class WebhookType(DjangoObjectType):
    class Meta:
        model = Webhook
        fields = ('id', 'url', 'secret', 'events', 'is_active', 'created_at')

# --- Mutations ---

class CreateUser(graphene.Mutation):
    user = graphene.Field(UserType)
    success = graphene.Boolean()
    message = graphene.String()

    class Arguments:
        email = graphene.String(required=True)
        password = graphene.String(required=True)
        full_name = graphene.String()

    def mutate(self, info, email, password, full_name=None):
        try:
            user = User.objects.create_user(email=email, password=password, full_name=full_name or "")
            return CreateUser(user=user, success=True)
        except Exception as e:
            return CreateUser(success=False, message=str(e))

class CreateOrganization(graphene.Mutation):
    organization = graphene.Field(OrganizationType)
    success = graphene.Boolean()

    class Arguments:
        name = graphene.String(required=True)
        contact_email = graphene.String(required=True)
        description = graphene.String()

    @login_required
    def mutate(self, info, name, contact_email, description=None):
        user = info.context.user

        from django.utils.text import slugify
        import uuid
        
        slug = slugify(name)
        # Simple uniqueness check/append
        if Organization.objects.filter(slug=slug).exists():
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        org = Organization.objects.create(
            name=name,
            contact_email=contact_email,
            slug=slug,
            uid=uuid.uuid4().hex[:12]
        )
        # Add creator as owner
        OrganizationMember.objects.create(user=user, organization=org, role=OrganizationMember.Role.OWNER)
        return CreateOrganization(organization=org, success=True)

class JoinOrganization(graphene.Mutation):
    organization = graphene.Field(OrganizationType)
    success = graphene.Boolean()
    message = graphene.String()

    class Arguments:
        uid = graphene.String(required=True)

    @login_required
    def mutate(self, info, uid):
        try:
            org = Organization.objects.get(uid=uid)
            if not OrganizationMember.objects.filter(user=info.context.user, organization=org).exists():
                OrganizationMember.objects.create(
                    user=info.context.user, 
                    organization=org, 
                    role=OrganizationMember.Role.MEMBER
                )
            return JoinOrganization(organization=org, success=True)
        except Organization.DoesNotExist:
            return JoinOrganization(success=False, message="Organization not found")

class DeleteOrganization(graphene.Mutation):
    success = graphene.Boolean()
    message = graphene.String()

    class Arguments:
        id = graphene.ID(required=True)

    @login_required
    def mutate(self, info, id):
        user = info.context.user
        try:
            org = Organization.objects.get(pk=id)
            # Check if user is the OWNER
            member = OrganizationMember.objects.get(user=user, organization=org)
            if member.role != OrganizationMember.Role.OWNER:
                raise Exception("Permission denied: Only owners can delete organizations")
            
            org.delete()
            return DeleteOrganization(success=True)
        except Organization.DoesNotExist:
            return DeleteOrganization(success=False, message="Organization not found")
        except OrganizationMember.DoesNotExist:
            return DeleteOrganization(success=False, message="Permission denied")
        except Exception as e:
            return DeleteOrganization(success=False, message=str(e))

class CreateProject(graphene.Mutation):
    project = graphene.Field(ProjectType)
    success = graphene.Boolean()

    class Arguments:
        organization_id = graphene.ID(required=True)
        name = graphene.String(required=True)
        description = graphene.String()
        due_date = graphene.Date()

    @login_required
    def mutate(self, info, organization_id, name, description=None, due_date=None):
        user = info.context.user
        # Verify membership
        if not OrganizationMember.objects.filter(user=user, organization_id=organization_id).exists():
            raise Exception("Permission denied")
        
        project = Project.objects.create(
            organization_id=organization_id,
            name=name,
            description=description or "",
            due_date=due_date
        )
        return CreateProject(project=project, success=True)

class UpdateProject(graphene.Mutation):
    project = graphene.Field(ProjectType)
    success = graphene.Boolean()

    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        description = graphene.String()
        status = graphene.String()
        due_date = graphene.Date()

    @login_required
    def mutate(self, info, id, **kwargs):
        user = info.context.user
        try:
            project = Project.objects.get(pk=id)
            # Verify membership in org
            if not OrganizationMember.objects.filter(user=user, organization=project.organization).exists():
                raise Exception("Permission denied")
            
            for key, value in kwargs.items():
                if value is not None:
                    setattr(project, key, value)
            project.save()
            return UpdateProject(project=project, success=True)
        except Project.DoesNotExist:
            return UpdateProject(success=False)

class DeleteProject(graphene.Mutation):
    success = graphene.Boolean()

    class Arguments:
        id = graphene.ID(required=True)

    @login_required
    def mutate(self, info, id):
        user = info.context.user
        try:
            project = Project.objects.get(pk=id)
            # Check if admin/owner
            member = OrganizationMember.objects.get(user=user, organization=project.organization)
            if member.role not in [OrganizationMember.Role.OWNER, OrganizationMember.Role.ADMIN]:
                raise Exception("Permission denied")
            
            project.delete()
            return DeleteProject(success=True)
        except (Project.DoesNotExist, OrganizationMember.DoesNotExist):
            return DeleteProject(success=False)

class CreateTask(graphene.Mutation):
    task = graphene.Field(TaskType)
    success = graphene.Boolean()

    class Arguments:
        project_id = graphene.ID(required=True)
        title = graphene.String(required=True)
        description = graphene.String()
        priority = graphene.String()
        assignee_id = graphene.ID()
        due_date = graphene.DateTime()

    @login_required
    def mutate(self, info, project_id, title, description="", priority="MEDIUM", assignee_id=None, due_date=None):
        user = info.context.user
        try:
            project = Project.objects.get(pk=project_id)
            if not OrganizationMember.objects.filter(user=user, organization=project.organization).exists():
                raise Exception("Permission denied")

            task = Task.objects.create(
                project=project,
                title=title,
                description=description or "",
                priority=priority,
                assignee_id=assignee_id,
                due_date=due_date
            )
            return CreateTask(task=task, success=True)
        except Project.DoesNotExist:
            return CreateTask(success=False)

class UpdateTask(graphene.Mutation):
    task = graphene.Field(TaskType)
    success = graphene.Boolean()

    class Arguments:
        id = graphene.ID(required=True)
        title = graphene.String()
        description = graphene.String()
        status = graphene.String()
        priority = graphene.String()
        assignee_id = graphene.ID()
        due_date = graphene.DateTime()
        order = graphene.Int()

    @login_required
    def mutate(self, info, id, **kwargs):
        user = info.context.user
        try:
            task = Task.objects.get(pk=id)
            if not OrganizationMember.objects.filter(user=user, organization=task.project.organization).exists():
                raise Exception("Permission denied")

            for key, value in kwargs.items():
                if value is not None:
                    setattr(task, key, value)
            task.save()
            return UpdateTask(task=task, success=True)
        except Task.DoesNotExist:
            return UpdateTask(success=False)

class DeleteTask(graphene.Mutation):
    success = graphene.Boolean()

    class Arguments:
        id = graphene.ID(required=True)

    @login_required
    def mutate(self, info, id):
        user = info.context.user
        try:
            task = Task.objects.get(pk=id)
            if not OrganizationMember.objects.filter(user=user, organization=task.project.organization).exists():
                raise Exception("Permission denied")
            task.delete()
            return DeleteTask(success=True)
        except Task.DoesNotExist:
            return DeleteTask(success=False)

class CreateTaskComment(graphene.Mutation):
    comment = graphene.Field(TaskCommentType)
    success = graphene.Boolean()

    class Arguments:
        task_id = graphene.ID(required=True)
        content = graphene.String(required=True)

    @login_required
    def mutate(self, info, task_id, content):
        user = info.context.user
        try:
            task = Task.objects.get(pk=task_id)
            if not OrganizationMember.objects.filter(user=user, organization=task.project.organization).exists():
                raise Exception("Permission denied")
            
            comment = TaskComment.objects.create(
                task=task,
                author=user,
                content=content
            )
            return CreateTaskComment(comment=comment, success=True)
        except Task.DoesNotExist:
            return CreateTaskComment(success=False)

class CreateWebhook(graphene.Mutation):
    webhook = graphene.Field(WebhookType)
    success = graphene.Boolean()

    class Arguments:
        organization_id = graphene.ID(required=True)
        url = graphene.String(required=True)
        events = graphene.List(graphene.String)

    @login_required
    def mutate(self, info, organization_id, url, events=None):
        user = info.context.user
        try:
            org = Organization.objects.get(pk=organization_id)
            member = OrganizationMember.objects.get(user=user, organization=org)
            if member.role not in [OrganizationMember.Role.OWNER, OrganizationMember.Role.ADMIN]:
                raise Exception("Permission denied")
            
            import secrets
            webhook = Webhook.objects.create(
                organization=org,
                url=url,
                events=events or [],
                secret=secrets.token_hex(20)
            )
            return CreateWebhook(webhook=webhook, success=True)
        except Exception:
            return CreateWebhook(success=False)

class DeleteWebhook(graphene.Mutation):
    success = graphene.Boolean()

    class Arguments:
        id = graphene.ID(required=True)

    @login_required
    def mutate(self, info, id):
        user = info.context.user
        try:
            webhook = Webhook.objects.get(pk=id)
            member = OrganizationMember.objects.get(user=user, organization=webhook.organization)
            if member.role not in [OrganizationMember.Role.OWNER, OrganizationMember.Role.ADMIN]:
                raise Exception("Permission denied")
            webhook.delete()
            return DeleteWebhook(success=True)
        except:
            return DeleteWebhook(success=False)


class Mutation(graphene.ObjectType):
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()
    
    create_user = CreateUser.Field()
    
    create_organization = CreateOrganization.Field()
    join_organization = JoinOrganization.Field()
    delete_organization = DeleteOrganization.Field()
    
    create_project = CreateProject.Field()
    update_project = UpdateProject.Field()
    delete_project = DeleteProject.Field()
    
    create_task = CreateTask.Field()
    update_task = UpdateTask.Field()
    delete_task = DeleteTask.Field()
    
    create_task_comment = CreateTaskComment.Field()

    create_webhook = CreateWebhook.Field()
    delete_webhook = DeleteWebhook.Field()

# --- Queries ---

class Query(graphene.ObjectType):
    me = graphene.Field(UserType)
    my_organizations = graphene.List(OrganizationType)
    organization = graphene.Field(OrganizationType, slug=graphene.String(required=True))
    organization_members = graphene.List(OrganizationMemberType, organization_id=graphene.ID(required=True))
    
    projects = graphene.List(
        ProjectType, 
        organization_id=graphene.ID(required=True),
        status=graphene.String()
    )
    project = graphene.Field(ProjectType, id=graphene.ID(required=True))
    
    tasks = graphene.List(
        TaskType, 
        project_id=graphene.ID(required=True),
        status=graphene.String(),
        assignee_id=graphene.ID()
    )
    task = graphene.Field(TaskType, id=graphene.ID(required=True))
    
    task_comments = graphene.List(TaskCommentType, task_id=graphene.ID(required=True))
    
    my_webhooks = graphene.List(WebhookType, organization_id=graphene.ID(required=True))

    @login_required
    def resolve_me(self, info):
        return info.context.user

    @login_required
    def resolve_my_organizations(self, info):
        return Organization.objects.filter(members__user=info.context.user)

    @login_required
    def resolve_organization(self, info, slug):
        return Organization.objects.get(slug=slug, members__user=info.context.user)

    @login_required
    def resolve_organization_members(self, info, organization_id):
        # Verify membership first
        if not OrganizationMember.objects.filter(user=info.context.user, organization_id=organization_id).exists():
            raise Exception("Permission denied")
        return OrganizationMember.objects.filter(organization_id=organization_id)

    @login_required
    def resolve_projects(self, info, organization_id, status=None):
        if not OrganizationMember.objects.filter(user=info.context.user, organization_id=organization_id).exists():
            raise Exception("Permission denied")
        
        qs = Project.objects.filter(organization_id=organization_id)
        if status:
            qs = qs.filter(status=status)
        return qs

    @login_required
    def resolve_project(self, info, id):
        try:
            project = Project.objects.get(pk=id)
            if not OrganizationMember.objects.filter(user=info.context.user, organization=project.organization).exists():
                raise Exception("Permission denied")
            return project
        except Project.DoesNotExist:
            return None

    @login_required
    def resolve_tasks(self, info, project_id, status=None, assignee_id=None):
        try:
            project = Project.objects.get(pk=project_id)
            if not OrganizationMember.objects.filter(user=info.context.user, organization=project.organization).exists():
                raise Exception("Permission denied")
            
            qs = Task.objects.filter(project_id=project_id)
            if status:
                qs = qs.filter(status=status)
            if assignee_id:
                qs = qs.filter(assignee_id=assignee_id)
            return qs.order_by('order', '-created_at')
        except Project.DoesNotExist:
            return []

    @login_required
    def resolve_task(self, info, id):
        try:
            task = Task.objects.get(pk=id)
            if not OrganizationMember.objects.filter(user=info.context.user, organization=task.project.organization).exists():
                raise Exception("Permission denied")
            return task
        except Task.DoesNotExist:
            return None

    @login_required
    def resolve_task_comments(self, info, task_id):
        try:
            task = Task.objects.get(pk=task_id)
            if not OrganizationMember.objects.filter(user=info.context.user, organization=task.project.organization).exists():
                raise Exception("Permission denied")
            return task.comments.all()
        except Task.DoesNotExist:
            return []

    @login_required
    def resolve_my_webhooks(self, info, organization_id):
        try:
            member = OrganizationMember.objects.get(user=info.context.user, organization_id=organization_id)
            if member.role not in [OrganizationMember.Role.OWNER, OrganizationMember.Role.ADMIN]:
                raise Exception("Permission denied")
            return Webhook.objects.filter(organization_id=organization_id)
        except OrganizationMember.DoesNotExist:
            return []

schema = graphene.Schema(query=Query, mutation=Mutation)
 
