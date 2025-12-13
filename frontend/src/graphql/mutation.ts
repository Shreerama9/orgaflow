import { gql } from '@apollo/client';
import { USER_FRAGMENT } from './queries';

// Auth mutations
export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    tokenAuth(email: $email, password: $password) {
      token
      payload
    }
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($token: String!) {
    refreshToken(token: $token) {
      token
      payload
    }
  }
`;

export const CREATE_USER = gql`
  ${USER_FRAGMENT}
  mutation CreateUser($email: String!, $password: String!, $fullName: String) {
    createUser(email: $email, password: $password, fullName: $fullName) {
      user {
        ...UserFields
      }
      success
      message
    }
  }
`;

// Organization mutations
export const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization($name: String!, $contactEmail: String!, $description: String) {
    createOrganization(name: $name, contactEmail: $contactEmail, description: $description) {
      organization {
        id
        name
        slug
        contactEmail
        description
        createdAt
      }
      success
    }
  }
`;

export const JOIN_ORGANIZATION = gql`
  mutation JoinOrganization($uid: String!) {
    joinOrganization(uid: $uid) {
      organization {
        id
        name
        slug
        contactEmail
        description
        createdAt
      }
      success
      message
    }
  }
`;

export const CREATE_WEBHOOK = gql`
  mutation CreateWebhook($organizationId: ID!, $url: String!, $events: [String]) {
    createWebhook(organizationId: $organizationId, url: $url, events: $events) {
      webhook {
        id
        url
        secret
        isActive
        events
        createdAt
      }
      success
    }
  }
`;

export const DELETE_WEBHOOK = gql`
  mutation DeleteWebhook($id: ID!) {
    deleteWebhook(id: $id) {
      success
    }
  }
`;

// Project mutations
export const CREATE_PROJECT = gql`
  mutation CreateProject($organizationId: ID!, $name: String!, $description: String, $dueDate: Date) {
    createProject(organizationId: $organizationId, name: $name, description: $description, dueDate: $dueDate) {
      project {
        id
        name
        description
        status
        dueDate
        createdAt
        stats {
          totalTasks
          completedTasks
          inProgressTasks
          todoTasks
          completionRate
        }
      }
      success
    }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ID!, $name: String, $description: String, $status: String, $dueDate: Date) {
    updateProject(id: $id, name: $name, description: $description, status: $status, dueDate: $dueDate) {
      project {
        id
        name
        description
        status
        dueDate
        updatedAt
      }
      success
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id) {
      success
    }
  }
`;

// Task mutations
export const CREATE_TASK = gql`
  ${USER_FRAGMENT}
  mutation CreateTask(
    $projectId: ID!
    $title: String!
    $description: String
    $priority: String
    $assigneeId: ID
    $dueDate: DateTime
  ) {
    createTask(
      projectId: $projectId
      title: $title
      description: $description
      priority: $priority
      assigneeId: $assigneeId
      dueDate: $dueDate
    ) {
      task {
        id
        title
        description
        status
        priority
        dueDate
        order
        commentCount
        createdAt
        assignee {
          ...UserFields
        }
      }
      success
    }
  }
`;

export const UPDATE_TASK = gql`
  ${USER_FRAGMENT}
  mutation UpdateTask(
    $id: ID!
    $title: String
    $description: String
    $status: String
    $priority: String
    $assigneeId: ID
    $dueDate: DateTime
    $order: Int
  ) {
    updateTask(
      id: $id
      title: $title
      description: $description
      status: $status
      priority: $priority
      assigneeId: $assigneeId
      dueDate: $dueDate
      order: $order
    ) {
      task {
        id
        title
        description
        status
        priority
        dueDate
        order
        updatedAt
        assignee {
          ...UserFields
        }
      }
      success
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id) {
      success
    }
  }
`;

// Comment mutations
export const CREATE_TASK_COMMENT = gql`
  ${USER_FRAGMENT}
  mutation CreateTaskComment($taskId: ID!, $content: String!) {
    createTaskComment(taskId: $taskId, content: $content) {
      comment {
        id
        content
        createdAt
        author {
          ...UserFields
        }
      }
      success
    }
  }
`;
