
import graphene
from functools import wraps
from apps.organizations.models import OrganizationMember, Organization
from apps.projects.models import Project, Task

def get_member(user, organization_id):
    try:
        return OrganizationMember.objects.get(user=user, organization_id=organization_id)
    except OrganizationMember.DoesNotExist:
        return None

def can_manage_projects(member):
    return member and member.role in [OrganizationMember.Role.OWNER, OrganizationMember.Role.ADMIN]

def can_manage_tasks(member):
    return member and member.role in [OrganizationMember.Role.OWNER, OrganizationMember.Role.ADMIN, OrganizationMember.Role.MEMBER]

def can_view(member):
    return member is not None

def organization_member_required(min_role='VIEWER'):
    def decorator(fn):
        @wraps(fn)
        def wrapper(self, info, organization_id, **kwargs):
            user = info.context.user
            if not user.is_authenticated:
                raise Exception("Authentication required")

            try:
                member = OrganizationMember.objects.get(user=user, organization_id=organization_id)
                
                role_hierarchy = {
                    'OWNER': 3,
                    'ADMIN': 2,
                    'MEMBER': 1,
                    'VIEWER': 0
                }

                if role_hierarchy[member.role] < role_hierarchy[min_role]:
                    raise Exception(f"Permission denied: {min_role} role required")

                return fn(self, info, organization_id=organization_id, member=member, **kwargs)
            except OrganizationMember.DoesNotExist:
                raise Exception("Permission denied: You are not a member of this organization")
            except Exception as e:
                raise e
        return wrapper
    return decorator


def project_member_required(min_role='VIEWER'):
    def decorator(fn):
        @wraps(fn)
        def wrapper(self, info, id, **kwargs):
            user = info.context.user
            if not user.is_authenticated:
                raise Exception("Authentication required")

            try:
                project = Project.objects.get(pk=id)
                member = OrganizationMember.objects.get(user=user, organization=project.organization)

                role_hierarchy = {
                    'OWNER': 3,
                    'ADMIN': 2,
                    'MEMBER': 1,
                    'VIEWER': 0
                }

                if role_hierarchy[member.role] < role_hierarchy[min_role]:
                    raise Exception(f"Permission denied: {min_role} role required")
                
                kwargs['project'] = project

                return fn(self, info, id=id, member=member, **kwargs)
            except (Project.DoesNotExist, OrganizationMember.DoesNotExist):
                raise Exception("Permission denied or project not found")
            except Exception as e:
                raise e
        return wrapper
    return decorator


def task_member_required(min_role='VIEWER'):
    def decorator(fn):
        @wraps(fn)
        def wrapper(self, info, id, **kwargs):
            user = info.context.user
            if not user.is_authenticated:
                raise Exception("Authentication required")

            try:
                task = Task.objects.get(pk=id)
                member = OrganizationMember.objects.get(user=user, organization=task.project.organization)

                role_hierarchy = {
                    'OWNER': 3,
                    'ADMIN': 2,
                    'MEMBER': 1,
                    'VIEWER': 0
                }

                if role_hierarchy[member.role] < role_hierarchy[min_role]:
                    raise Exception(f"Permission denied: {min_role} role required")
                
                kwargs['task'] = task

                return fn(self, info, id=id, member=member, **kwargs)
            except (Task.DoesNotExist, OrganizationMember.DoesNotExist):
                raise Exception("Permission denied or task not found")
            except Exception as e:
                raise e
        return wrapper
    return decorator
