"""
Project and Task models for the project management system.
Projects belong to organizations, tasks belong to projects.
"""

from django.db import models
from apps.users.models import User
from apps.organizations.models import Organization


class Project(models.Model):
    """
    Organization-dependent project entity.
    Projects contain tasks and enable team collaboration on specific goals.
    """
    
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        ON_HOLD = 'ON_HOLD', 'On Hold'
        COMPLETED = 'COMPLETED', 'Completed'
        ARCHIVED = 'ARCHIVED', 'Archived'
    
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='projects',
        help_text='Organization this project belongs to'
    )
    name = models.CharField(
        max_length=200,
        help_text='Project name'
    )
    description = models.TextField(
        blank=True,
        help_text='Detailed project description'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_projects',
        help_text='User who created this project'
    )
    due_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Project deadline'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['due_date']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.organization.name})"
    
    def get_tasks(self):
        """Return all tasks in this project."""
        return self.tasks.all()
    
    def get_task_stats(self):
        """Return task statistics for this project."""
        tasks = self.tasks.all()
        total = tasks.count()
        completed = tasks.filter(status=Task.Status.DONE).count()
        in_progress = tasks.filter(status=Task.Status.IN_PROGRESS).count()
        todo = tasks.filter(status=Task.Status.TODO).count()
        
        return {
            'total_tasks': total,
            'completed_tasks': completed,
            'in_progress_tasks': in_progress,
            'todo_tasks': todo,
            'completion_rate': (completed / total * 100) if total > 0 else 0
        }


class Task(models.Model):
    """
    Project-dependent work items.
    Tasks support the Kanban-style board interface with status workflow.
    """
    
    class Status(models.TextChoices):
        TODO = 'TODO', 'To Do'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        DONE = 'DONE', 'Done'
    
    class Priority(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
        URGENT = 'URGENT', 'Urgent'
    
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks',
        help_text='Project this task belongs to'
    )
    title = models.CharField(
        max_length=200,
        help_text='Task title'
    )
    description = models.TextField(
        blank=True,
        help_text='Detailed task description'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TODO
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )
    assignee = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks',
        help_text='User assigned to this task'
    )
    due_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Task deadline'
    )
    
    # Ordering for drag-and-drop
    order = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tasks'
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['assignee']),
            models.Index(fields=['due_date']),
        ]
    
    def __str__(self):
        return self.title
    
    def get_comments(self):
        """Return all comments for this task."""
        return self.comments.all()


class TaskComment(models.Model):
    """
    Threaded discussion on tasks.
    Maintains audit trail of task-related communication.
    """
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments',
        help_text='Task this comment belongs to'
    )
    content = models.TextField(
        help_text='Comment content'
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='task_comments',
        help_text='User who wrote this comment'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'task_comments'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.author.email} on {self.task.title}"
