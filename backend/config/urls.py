"""
URL configuration for Project Management System.
GraphQL endpoint at /graphql/ with optional GraphiQL interface.
"""

from django.contrib import admin
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from graphene_django.views import GraphQLView

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),
    
    # GraphQL API endpoint with GraphiQL interface for development
    path('graphql/', csrf_exempt(GraphQLView.as_view(graphiql=True))),
]
