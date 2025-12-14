from django.test import TestCase
from django.test import TestCase
from apps.users.models import User
from apps.organizations.models import Organization, OrganizationMember
from apps.projects.models import Project, Task, TaskComment


class UserModelTest(TestCase):
    """Tests for the custom User model."""
    
    def test_create_user(self):
        """Test creating a user with email."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('testpass123'))
    
    def test_user_string_representation(self):
        """Test user __str__ returns email."""
        user = User.objects.create_user(email='test@example.com', password='test')
        self.assertEqual(str(user), 'test@example.com')


class OrganizationModelTest(TestCase):
    """Tests for Organization and OrganizationMember models."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='owner@example.com',
            password='testpass123'
        )
    
    def test_create_organization(self):
        """Test creating an organization with auto-slug."""
        org = Organization.objects.create(
            name='Test Company',
            contact_email='contact@test.com'
        )
        self.assertEqual(org.name, 'Test Company')
        self.assertEqual(org.slug, 'test-company')
    
    def test_organization_member_roles(self):
        """Test adding member with roles."""
        org = Organization.objects.create(
            name='Test Org',
            contact_email='test@org.com'
        )
        member = OrganizationMember.objects.create(
            user=self.user,
            organization=org,
            role=OrganizationMember.Role.OWNER
        )
        self.assertTrue(member.can_manage_projects())
        self.assertTrue(member.can_manage_members())
        self.assertTrue(member.can_edit_tasks())
        self.assertFalse(member.is_read_only())
    
    def test_viewer_is_read_only(self):
        """Test that viewer role has read-only access."""
        org = Organization.objects.create(name='Org', contact_email='o@o.com')
        member = OrganizationMember.objects.create(
            user=self.user,
            organization=org,
            role=OrganizationMember.Role.VIEWER
        )
        self.assertTrue(member.is_read_only())
        self.assertFalse(member.can_edit_tasks())


class ProjectModelTest(TestCase):
    """Tests for Project model."""
    
    def setUp(self):
        self.org = Organization.objects.create(
            name='Test Org',
            contact_email='test@org.com'
        )
    
    def test_create_project(self):
        """Test creating a project."""
        project = Project.objects.create(
            organization=self.org,
            name='Test Project',
            description='A test project'
        )
        self.assertEqual(project.name, 'Test Project')
        self.assertEqual(project.status, Project.Status.ACTIVE)
    
    def test_project_stats(self):
        """Test project statistics calculation."""
        project = Project.objects.create(
            organization=self.org,
            name='Project with Tasks'
        )
        # Create tasks with different statuses
        Task.objects.create(project=project, title='Task 1', status=Task.Status.TODO)
        Task.objects.create(project=project, title='Task 2', status=Task.Status.IN_PROGRESS)
        Task.objects.create(project=project, title='Task 3', status=Task.Status.DONE)
        Task.objects.create(project=project, title='Task 4', status=Task.Status.DONE)
        
        stats = project.get_task_stats()
        self.assertEqual(stats['total'], 4)
        self.assertEqual(stats['completed'], 2)
        self.assertEqual(stats['in_progress'], 1)
        self.assertEqual(stats['todo'], 1)
        self.assertEqual(stats['completion_rate'], 50.0)


class TaskModelTest(TestCase):
    """Tests for Task and TaskComment models."""
    
    def setUp(self):
        self.org = Organization.objects.create(
            name='Org', contact_email='o@o.com'
        )
        self.project = Project.objects.create(
            organization=self.org,
            name='Project'
        )
        self.user = User.objects.create_user(
            email='user@example.com',
            password='pass'
        )
    
    def test_create_task(self):
        """Test creating a task."""
        task = Task.objects.create(
            project=self.project,
            title='Test Task',
            status=Task.Status.TODO
        )
        self.assertEqual(task.title, 'Test Task')
        self.assertEqual(task.priority, Task.Priority.MEDIUM)
    
    def test_task_with_assignee(self):
        """Test assigning task to user."""
        task = Task.objects.create(
            project=self.project,
            title='Assigned Task',
            assignee=self.user
        )
        self.assertEqual(task.assignee.email, 'user@example.com')
    
    def test_task_comment(self):
        """Test adding comment to task."""
        task = Task.objects.create(
            project=self.project,
            title='Task with comment'
        )
        comment = TaskComment.objects.create(
            task=task,
            content='This is a comment',
            author=self.user
        )
        self.assertEqual(comment.content, 'This is a comment')
        self.assertEqual(task.comments.count(), 1)


class GraphQLAPITest(TestCase):
    """Tests for GraphQL API endpoints."""
    
    def setUp(self):
        from graphene_django.utils.testing import GraphQLTestCase
        self.user = User.objects.create_user(
            email='api@test.com',
            password='testpass'
        )
        self.org = Organization.objects.create(
            name='API Test Org',
            contact_email='api@org.com'
        )
        OrganizationMember.objects.create(
            user=self.user,
            organization=self.org,
            role=OrganizationMember.Role.OWNER
        )
    
    def test_create_user_mutation(self):
        """Test user creation via GraphQL."""
        from apps.graphql_api.schema import schema
        
        result = schema.execute('''
            mutation {
                createUser(email: "new@user.com", password: "password123") {
                    success
                    user { email }
                }
            }
        ''')
        
        self.assertIsNone(result.errors)
        self.assertTrue(result.data['createUser']['success'])
        self.assertEqual(result.data['createUser']['user']['email'], 'new@user.com')
