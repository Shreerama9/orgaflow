import { gql } from '@apollo/client';

// Existing exports
export * from './mutations';

// Member Management Mutations
export const INVITE_MEMBER = gql`
  mutation InviteMember($organizationId: ID!, $email: String!, $role: String) {
    inviteMember(organizationId: $organizationId, email: $email, role: $role) {
      success
      message
      member {
        id
        role
        user {
          id
          email
          fullName
        }
      }
    }
  }
`;

export const REMOVE_MEMBER = gql`
  mutation RemoveMember($organizationId: ID!, $userId: ID!) {
    removeMember(organizationId: $organizationId, userId: $userId) {
      success
      message
    }
  }
`;

export const CHANGE_MEMBER_ROLE = gql`
  mutation ChangeMemberRole($organizationId: ID!, $userId: ID!, $newRole: String!) {
    changeMemberRole(organizationId: $organizationId, userId: $userId, newRole: $newRole) {
      success
      message
      member {
        id
        role
      }
    }
  }
`;
