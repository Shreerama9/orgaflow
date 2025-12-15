import os
import django
import random
from datetime import timedelta
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.organizations.models import Organization, OrganizationMember
from apps.projects.models import Project, Task, TaskComment

def populate():
    print("Populating database...")

    # Create Users
    print("Creating users...")
    owner = User.objects.create_user(
        email='owner@example.com',
        password='password123',
        full_name='Alice Owner'
    )
    
    member = User.objects.create_user(
        email='member@example.com',
        password='password123',
        full_name='Bob Member'
    )

    # Create Organization
    print("Creating organization...")
    import uuid
    org = Organization.objects.create(
        name='Acme Corp',
        contact_email='contact@acme.com',
        description='A sample organization for testing.',
        uid=uuid.uuid4().hex[:12].upper()
    )
    
    # Add members
    OrganizationMember.objects.create(user=owner, organization=org, role=OrganizationMember.Role.OWNER)
    OrganizationMember.objects.create(user=member, organization=org, role=OrganizationMember.Role.MEMBER)

    # Create Projects
    print("Creating projects...")
    projects = []
    
    # Project 1: Website Redesign
    p1 = Project.objects.create(
        organization=org,
        name='Website Redesign',
        description='Overhaul the company website with new branding.',
        status='ACTIVE',
        due_date=timezone.now().date() + timedelta(days=30),
        created_by=owner
    )
    projects.append(p1)

    # Project 2: Mobile App
    p2 = Project.objects.create(
        organization=org,
        name='Mobile App Launch',
        description='Launch the new iOS and Android apps.',
        status='ON_HOLD',
        due_date=timezone.now().date() + timedelta(days=60),
        created_by=owner
    )
    projects.append(p2)

    # Create Tasks
    print("Creating tasks...")
    statuses = ['TODO', 'IN_PROGRESS', 'DONE']
    priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    
    for project in projects:
        for i in range(1, 6):
            task = Task.objects.create(
                project=project,
                title=f'Task {i} for {project.name}',
                description=f'This is a detailed description for task {i}.',
                status=random.choice(statuses),
                priority=random.choice(priorities),
                assignee=random.choice([owner, member, None]),
                due_date=timezone.now() + timedelta(days=random.randint(1, 14)),
                order=i
            )
            
            # Add comments
            if i % 2 == 0:
                TaskComment.objects.create(
                    task=task,
                    author=owner,
                    content='Can you update the status on this?'
                )
                TaskComment.objects.create(
                    task=task,
                    author=member,
                    content='Working on it now.'
                )

    print("Database populated successfully!")
    print(f"Owner: {owner.email} / password123")
    print(f"Member: {member.email} / password123")

if __name__ == '__main__':
    populate()
