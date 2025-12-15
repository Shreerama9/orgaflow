from django.db import models
from django.utils.text import slugify
from apps.users.models import User


class Organization(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    uid = models.CharField(max_length=12, unique=True, blank=True)
    contact_email = models.EmailField()
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class OrganizationMember(models.Model):
    class Role(models.TextChoices):
        OWNER = 'OWNER', 'Owner'
        ADMIN = 'ADMIN', 'Admin'
        MEMBER = 'MEMBER', 'Member'
        VIEWER = 'VIEWER', 'Viewer'

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def can_manage_projects(self):
        return self.role in [self.Role.OWNER, self.Role.ADMIN]

    def can_manage_members(self):
        return self.role in [self.Role.OWNER, self.Role.ADMIN]

    def can_edit_tasks(self):
        return self.role in [self.Role.OWNER, self.Role.ADMIN, self.Role.MEMBER]

    def is_read_only(self):
        return self.role == self.Role.VIEWER


class Webhook(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='webhooks')
    url = models.URLField(max_length=500)
    secret = models.CharField(max_length=255)
    events = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Webhook for {self.organization.name} - {self.url}"
