/**
 * GraphQL queries for fetching data.
 * All queries enforce organization-based access control.
 */

import { gql } from '@apollo/client';

// User fragments
export const USER_FRAGMENT = gql`
  fragment UserFields on UserType {
    id
    email
    fullName
    avatarUrl
    createdAt
  }
`;

// Organization queries
export const GET_MY_ORGANIZATIONS = gql`
  query GetMyOrganizations {
    myOrganizations {
      id
      name
      slug
      contactEmail
      description
      memberCount
      projectCount
      createdAt
    }
  }
`;

export const GET_ORGANIZATION = gql`
  query GetOrganization($slug: String!) {
    organization(slug: $slug) {
      id
      name
      slug
      contactEmail
      description
      memberCount
      projectCount
      createdAt
    }
  }
`;

export const GET_MY_WEBHOOKS = gql`
  query GetMyWebhooks($organizationId: ID!) {
    myWebhooks(organizationId: $organizationId) {
      id
      url
      secret
      isActive
      events
      createdAt
    }
  }
`;

export const GET_ORGANIZATION_MEMBERS = gql`
  ${USER_FRAGMENT}
  query GetOrganizationMembers($organizationId: ID!) {
    organizationMembers(organizationId: $organizationId) {
      id
      user {
        ...UserFields
      }
      role
      joinedAt
    }
  }
`;

// Project queries
export const GET_PROJECTS = gql`
  query GetProjects($organizationId: ID!, $status: String) {
    projects(organizationId: $organizationId, status: $status) {
      id
      name
      description
      status
      dueDate
      createdAt
      updatedAt
      stats {
        totalTasks
        completedTasks
        inProgressTasks
        todoTasks
        completionRate
      }
    }
  }
`;

export const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      name
      description
      status
      dueDate
      createdAt
      updatedAt
      organization {
        id
        name
        slug
      }
      stats {
        totalTasks
        completedTasks
        inProgressTasks
        todoTasks
        completionRate
      }
    }
  }
`;

// Task queries
export const GET_TASKS = gql`
  ${USER_FRAGMENT}
  query GetTasks($projectId: ID!, $status: String, $assigneeId: ID) {
    tasks(projectId: $projectId, status: $status, assigneeId: $assigneeId) {
      id
      title
      description
      status
      priority
      dueDate
      order
      commentCount
      createdAt
      updatedAt
      assignee {
        ...UserFields
      }
    }
  }
`;

export const GET_TASK = gql`
  ${USER_FRAGMENT}
  query GetTask($id: ID!) {
    task(id: $id) {
      id
      title
      description
      status
      priority
      dueDate
      order
      commentCount
      createdAt
      updatedAt
      assignee {
        ...UserFields
      }
      project {
        id
        name
      }
    }
  }
`;

// Comment queries
export const GET_TASK_COMMENTS = gql`
  ${USER_FRAGMENT}
  query GetTaskComments($taskId: ID!) {
    taskComments(taskId: $taskId) {
      id
      content
      createdAt
      updatedAt
      author {
        ...UserFields
      }
    }
  }
`;

// Current user query
export const GET_ME = gql`
  ${USER_FRAGMENT}
  query GetMe {
    me {
      ...UserFields
    }
  }
`;
