"""
Management command to seed demo data for demonstration purposes.
Creates a demo organization with projects, tasks, and comments.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.organizations.models import Organization, OrganizationMember
from apps.projects.models import Project, Task, TaskComment

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds the database with demo data for demonstration'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding demo data...\n')

        # Create demo user
        demo_user, created = User.objects.get_or_create(
            email='demo@example.com',
            defaults={
                'full_name': 'Demo User',
                'is_active': True,
            }
        )
        if created:
            demo_user.set_password('demo1234')
            demo_user.save()
            self.stdout.write(self.style.SUCCESS('✅ Created demo user: demo@example.com / demo1234'))
        else:
            self.stdout.write('ℹ️  Demo user already exists')

        # Create team members
        team_members = [
            ('alice@demo.com', 'Alice Johnson'),
            ('bob@demo.com', 'Bob Smith'),
            ('carol@demo.com', 'Carol Williams'),
        ]
        
        users = [demo_user]
        for email, name in team_members:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={'full_name': name, 'is_active': True}
            )
            if created:
                user.set_password('demo1234')
                user.save()
            users.append(user)

        # Create demo organization
        demo_org, created = Organization.objects.get_or_create(
            slug='demo-company',
            defaults={
                'name': 'Demo Company',
                'contact_email': 'contact@demo-company.com',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('✅ Created demo organization: Demo Company'))
        else:
            self.stdout.write('ℹ️  Demo organization already exists')

        # Add members to organization
        roles = [
            OrganizationMember.Role.OWNER,
            OrganizationMember.Role.ADMIN,
            OrganizationMember.Role.MEMBER,
            OrganizationMember.Role.VIEWER,
        ]
        for i, user in enumerate(users):
            OrganizationMember.objects.get_or_create(
                user=user,
                organization=demo_org,
                defaults={'role': roles[i % len(roles)]}
            )

        # Create projects
        projects_data = [
            {
                'name': 'Website Redesign',
                'description': 'Complete overhaul of the company website with modern design and improved UX.',
                'status': Project.Status.ACTIVE,
            },
            {
                'name': 'Mobile App Launch',
                'description': 'Develop and launch iOS and Android mobile applications.',
                'status': Project.Status.ACTIVE,
            },
            {
                'name': 'Q4 Marketing Campaign',
                'description': 'End-of-year marketing push across all channels.',
                'status': Project.Status.ON_HOLD,
            },
        ]

        projects = []
        for proj_data in projects_data:
            project, created = Project.objects.get_or_create(
                organization=demo_org,
                name=proj_data['name'],
                defaults={
                    'description': proj_data['description'],
                    'status': proj_data['status'],
                }
            )
            projects.append(project)
            if created:
                self.stdout.write(f'  📁 Created project: {project.name}')

        # Create tasks for Website Redesign project
        website_project = projects[0]
        tasks_data = [
            # To Do
            {'title': 'Design homepage mockup', 'description': 'Create high-fidelity mockup for the new homepage', 'status': Task.Status.TODO, 'priority': Task.Priority.HIGH},
            {'title': 'Review competitor websites', 'description': 'Analyze top 5 competitor websites for inspiration', 'status': Task.Status.TODO, 'priority': Task.Priority.MEDIUM},
            {'title': 'Set up analytics tracking', 'description': 'Implement Google Analytics 4 and event tracking', 'status': Task.Status.TODO, 'priority': Task.Priority.LOW},
            
            # In Progress
            {'title': 'Implement responsive navigation', 'description': 'Build mobile-friendly hamburger menu with smooth animations', 'status': Task.Status.IN_PROGRESS, 'priority': Task.Priority.HIGH, 'assignee': users[1]},
            {'title': 'Optimize image loading', 'description': 'Implement lazy loading and WebP format support', 'status': Task.Status.IN_PROGRESS, 'priority': Task.Priority.MEDIUM, 'assignee': users[2]},
            
            # Done
            {'title': 'Project kickoff meeting', 'description': 'Initial meeting with stakeholders to define scope', 'status': Task.Status.DONE, 'priority': Task.Priority.URGENT},
            {'title': 'Create wireframes', 'description': 'Low-fidelity wireframes for all main pages', 'status': Task.Status.DONE, 'priority': Task.Priority.HIGH},
            {'title': 'Set up development environment', 'description': 'Configure local dev, staging, and CI/CD pipeline', 'status': Task.Status.DONE, 'priority': Task.Priority.MEDIUM, 'assignee': users[1]},
        ]

        for i, task_data in enumerate(tasks_data):
            assignee = task_data.pop('assignee', None)
            task, created = Task.objects.get_or_create(
                project=website_project,
                title=task_data['title'],
                defaults={
                    **task_data,
                    'assignee': assignee,
                    'order': i,
                }
            )
            if created:
                self.stdout.write(f'    ✓ Created task: {task.title}')
                
                # Add comments to some tasks
                if task.status == Task.Status.DONE:
                    TaskComment.objects.create(
                        task=task,
                        author=demo_user,
                        content='Great work on this! ✅'
                    )
                elif task.status == Task.Status.IN_PROGRESS:
                    TaskComment.objects.create(
                        task=task,
                        author=users[1] if len(users) > 1 else demo_user,
                        content='Working on this now, should be done by EOD.'
                    )
                    TaskComment.objects.create(
                        task=task,
                        author=demo_user,
                        content='Let me know if you need any help!'
                    )

        # Create tasks for Mobile App project
        mobile_project = projects[1]
        mobile_tasks = [
            {'title': 'Define app architecture', 'status': Task.Status.DONE, 'priority': Task.Priority.URGENT},
            {'title': 'Design onboarding flow', 'status': Task.Status.DONE, 'priority': Task.Priority.HIGH},
            {'title': 'Implement user authentication', 'status': Task.Status.IN_PROGRESS, 'priority': Task.Priority.HIGH, 'assignee': users[2] if len(users) > 2 else demo_user},
            {'title': 'Build dashboard screen', 'status': Task.Status.TODO, 'priority': Task.Priority.MEDIUM},
            {'title': 'Integrate push notifications', 'status': Task.Status.TODO, 'priority': Task.Priority.LOW},
        ]

        for i, task_data in enumerate(mobile_tasks):
            assignee = task_data.pop('assignee', None)
            Task.objects.get_or_create(
                project=mobile_project,
                title=task_data['title'],
                defaults={
                    'description': '',
                    'status': task_data['status'],
                    'priority': task_data['priority'],
                    'assignee': assignee,
                    'order': i,
                }
            )

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('🎉 Demo data seeded successfully!'))
        self.stdout.write('')
        self.stdout.write('📋 Demo Credentials:')
        self.stdout.write('   Email: demo@example.com')
        self.stdout.write('   Password: demo1234')
        self.stdout.write('')
        self.stdout.write('🏢 Demo Organization: Demo Company')
        self.stdout.write(f'   Projects: {len(projects)}')
        self.stdout.write(f'   Team Members: {len(users)}')
