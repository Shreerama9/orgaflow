import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge, LoadingSpinner, EmptyState } from '../components/ui';
import { Trash2, Users } from 'lucide-react';

const GET_MY_ORGANIZATIONS = gql`
  query GetMyOrganizations {
    myOrganizations {
      id
      uid
      name
    }
  }
`;

const GET_ORG_MEMBERS = gql`
  query GetOrgMembers($organizationId: ID!) {
    organizationMembers(organizationId: $organizationId) {
      id
      role
      joinedAt
      user {
        id
        email
        fullName
        avatarUrl
      }
    }
  }
`;

const REMOVE_MEMBER = gql`
  mutation RemoveMember($organizationId: ID!, $userId: ID!) {
    removeMember(organizationId: $organizationId, userId: $userId) {
      success
      message
    }
  }
`;

const CHANGE_ROLE = gql`
  mutation ChangeMemberRole($organizationId: ID!, $userId: ID!, $newRole: String!) {
    changeMemberRole(organizationId: $organizationId, userId: $userId, newRole: $newRole) {
      member {
        id
        role
      }
      success
      message
    }
  }
`;

export const TeamManagement: React.FC = () => {
  const { user } = useAuth();
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(
    localStorage.getItem('currentOrgId')
  );

  // First, fetch all organizations the user belongs to
  const { data: orgsData, loading: orgsLoading } = useQuery(GET_MY_ORGANIZATIONS);
  
  // Once we have orgs, use the first one if currentOrgId is not set
  const currentOrg = orgsData?.myOrganizations?.find((o: any) => o.id === currentOrgId) 
    || orgsData?.myOrganizations?.[0];
  
  // Update currentOrgId when we find an org
  useEffect(() => {
    if (currentOrg?.id && currentOrg.id !== currentOrgId) {
      setCurrentOrgId(currentOrg.id);
      localStorage.setItem('currentOrgId', currentOrg.id);
    }
  }, [currentOrg, currentOrgId]);

  // Fetch members only when we have an org ID
  const { data: membersData, loading: membersLoading, refetch } = useQuery(GET_ORG_MEMBERS, {
    variables: { organizationId: currentOrg?.id || '' },
    skip: !currentOrg?.id,
  });

  const [removeMember] = useMutation(REMOVE_MEMBER);
  const [changeRole] = useMutation(CHANGE_ROLE);

  const handleRemove = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await removeMember({
        variables: { organizationId: currentOrg.id, userId },
      });
      refetch();
    } catch (err) {
      alert('Failed to remove member');
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await changeRole({
        variables: { organizationId: currentOrg.id, userId, newRole },
      });
      refetch();
    } catch (err) {
      alert('Failed to change role');
    }
  };

  if (orgsLoading || membersLoading) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;
  if (!currentOrg) return <div className="p-8 text-center text-slate-500">No organization found. <br/> Please create or join an organization first.</div>;

  const members = membersData?.organizationMembers || [];
  const currentUserMember = members.find((m: any) => m.user.id === user?.id);
  const isOwner = currentUserMember?.role === 'OWNER';
  const isAdmin = currentUserMember?.role === 'ADMIN';
  const canManage = isOwner || isAdmin;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Management</h1>
          <p className="text-slate-500">Manage members of {currentOrg.name}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-400 uppercase font-bold mb-1">Organization UID</p>
          <code className="text-lg font-mono text-primary-600">{currentOrg.uid}</code>
          <p className="text-xs text-slate-400 mt-1">Share this UID to invite members</p>
        </div>
      </div>

      <div className="grid gap-4">
        {members.map((member: any) => (
          <Card key={member.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                {member.user.fullName?.[0] || member.user.email[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-medium text-slate-900">
                  {member.user.fullName || 'Unnamed User'}
                  {member.user.id === user?.id && <span className="ml-2 text-xs text-slate-400">(You)</span>}
                </h3>
                <p className="text-sm text-slate-500">{member.user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant={
                member.role === 'OWNER' ? 'info' :
                member.role === 'ADMIN' ? 'success' :
                member.role === 'VIEWER' ? 'warning' : 'default'
              }>
                {member.role}
              </Badge>

              {canManage && member.role !== 'OWNER' && member.user.id !== user?.id && (
                <div className="flex items-center gap-2">
                  {isOwner && (
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.user.id, e.target.value)}
                      className="text-sm border-slate-200 rounded-md"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleRemove(member.user.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
        
        {members.length === 0 && (
          <EmptyState
            icon={<Users className="w-12 h-12 text-slate-400" />}
            title="No team members"
            description="Invite people to join your organization using the UID above."
          />
        )}
      </div>
    </div>
  );
};
