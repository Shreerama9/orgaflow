from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Task
from apps.organizations.models import Webhook
import requests
import threading
import json
import hmac
import hashlib

def send_webhook(url, secret, payload):
    """Send webhook payload with HMAC signature."""
    try:
        # Sign payload
        payload_json = json.dumps(payload)
        signature = hmac.new(
            secret.encode(),
            payload_json.encode(),
            hashlib.sha256
        ).hexdigest()
        
        headers = {
            'Content-Type': 'application/json',
            'X-Hub-Signature-256': f'sha256={signature}',
            'User-Agent': 'OrgaFlow-Webhook/1.0'
        }
        
        requests.post(url, data=payload_json, headers=headers, timeout=5)
    except Exception as e:
        print(f"Webhook failed for {url}: {e}")

@receiver(post_save, sender=Task)
def task_updated(sender, instance, created, **kwargs):
    """Trigger webhooks when a task is created or updated."""
    event = 'task.created' if created else 'task.updated'
    
    # Get organization webhooks
    try:
        webhooks = Webhook.objects.filter(
            organization=instance.project.organization,
            is_active=True
        )
        
        if not webhooks.exists():
            return
            
        payload = {
            'event': event,
            'timestamp': str(instance.updated_at),
            'task': {
                'id': instance.id,
                'title': instance.title,
                'status': instance.status,
                'priority': instance.priority,
                'project': {
                    'id': instance.project.id,
                    'name': instance.project.name
                },
                'assignee': instance.assignee.email if instance.assignee else None
            }
        }
        
        for webhook in webhooks:
            # Check if event is subscribed
            # events is a JSON list, e.g., ["task.created", "task.updated"]
            if event in webhook.events:
                threading.Thread(
                    target=send_webhook,
                    args=(webhook.url, webhook.secret, payload)
                ).start()
                
    except Exception as e:
        print(f"Error triggering webhooks: {e}")
