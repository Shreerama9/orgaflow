import graphene
from graphene_django import DjangoObjectType
from graphql_jwt import login_required
from apps.users.models import User
from apps.organizations.models import Organization, OrganizationMember

from apps.projects.models import Project, Task


class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'avatar_url')


class OrganizationType(DjangoObjectType):
    class Meta:
        model = Organization
        fields = ('id', 'name', 'slug', 'uid')

class ProjectType(DjangoObjectType):
    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'status')


class TaskType(DjangoObjectType):
    class Meta:
        model = Task
        field = ('id','title','status', 'priority', 'assignee')



class Query(graphene.ObjectType):
    me = graphene.Field(UserType)
    my_organizations = graphene.List(OrganizationType)
    projects = graphene.List(ProjectType, organization_id = graphene.ID(required=True))
    tasks = graphene.List(TaskType, project_id = graphene.ID(required = True))

    @login_required
    def resolve_me(self, info):
        return info.context.user
    
    @login_required
    def resolve_my_organization(self, info):
        return Organization.objects.filter(members__user=info.context.user)
    

class CreateTask(graphene.Mutation):
    class Arguments:
        project_id = graphene.ID(required = True)
        title = graphene.String(required = True)

    task = graphene.Field(TaskType)
    success = graphene.Boolean()

    @login_required
    def mutate(self, info, project_id, title):
        project = Project.objects.get(pk = project_id)
        task = Task.objects.create(project=project, title= title)
        return CreateTask(task= task, success = True)
    
class Mutation(graphene.ObjectType):
    create_task =CreateTask.Field()

schema = graphene.Schema(query=Query, mutation = Mutation) 
