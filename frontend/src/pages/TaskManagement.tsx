
import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { UserPlus, Trash2, Shield, Eye, User, Users, Crown } from 'lucide-react';
import { GET_ORGANIZATION_MEMBERS } from '../graphql/queries';
import { INVITE_MEMBER, REMOVE_MEMBER, CHANGE_MEMBER_ROLE } from '../graphql/memberMutations';
import { Button, Card, Input, Modal, Badge } from './ui';
import type { User as UserType } from '../types';

interface TeamManagementProps {
  organizationId: string;
  currentUserRole: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
}

interface Member {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  user: UserType;
  joinedAt: string;
}

const roleConfig = {
  OWNER: { label: 'Owner', icon: Crown, color: 'text-yellow-400', variant: 'warning' as const },
  ADMIN: { label: 'Admin', icon: Shield, color: 'text-purple-400', variant: 'info' as const },
  MEMBER: { label: 'Member', icon: User, color: 'text-blue-400', variant: 'default' as const },
  VIEWER: { label: 'Viewer', icon: Eye, color: 'text-slate-400', variant: 'default' as const },
};

export const TeamManagement: React.FC<TeamManagementProps> = ({
  organizationId,
  currentUserRole,
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canManageMembers = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const canChangeRoles = currentUserRole === 'OWNER';

  // Fetch members
  const { data, refetch } = useQuery(GET_ORGANIZATION_MEMBERS, {
    variables: { organizationId },
  });

  // Mutations
  const [inviteMember, { loading: inviting }] = useMutation(INVITE_MEMBER, {
    onCompleted: (data) => {
      if (data.inviteMember.success) {
        setMessage({ type: 'success', text: data.inviteMember.message });
        setShowInviteModal(false);
        setInviteEmail('');
        refetch();
      } else {
        setMessage({ type: 'error', text: data.inviteMember.message });
      }
    },
    onError: (err) => setMessage({ type: 'error', text: err.message }),
  });

  const [removeMember, { loading: removing }] = useMutation(REMOVE_MEMBER, {
    onCompleted: (data) => {
      if (data.removeMember.success) {
        setMessage({ type: 'success', text: 'Member removed' });
        refetch();
      } else {
        setMessage({ type: 'error', text: data.removeMember.message });
      }
    },
  });

  const [changeMemberRole] = useMutation(CHANGE_MEMBER_ROLE, {
    onCompleted: (data) => {
      if (data.changeMemberRole.success) {
        setMessage({ type: 'success', text: data.changeMemberRole.message });
        refetch();
      } else {
        setMessage({ type: 'error', text: data.changeMemberRole.message });
      }
    },
  });

  const members: Member[] = data?.organizationMembers || [];

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteMember({
      variables: {
        organizationId,
        email: inviteEmail,
        role: inviteRole,
      },
    });
  };

  const handleRemove = (userId: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      removeMember({
        variables: { organizationId, userId },
      });
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    changeMemberRole({
      variables: { organizationId, userId, newRole },
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-100">Team Members</h3>
          <span className="px-2 py-0.5 bg-slate-700 rounded-full text-xs text-slate-400">
            {members.length}
          </span>
        </div>
        {canManageMembers && (
          <Button size="sm" onClick={() => setShowInviteModal(true)}>
            <UserPlus className="w-4 h-4 mr-1" />
            Invite
          </Button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-900/30 border border-green-800 text-green-400'
              : 'bg-red-900/30 border border-red-800 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Members List */}
      <div className="space-y-2">
        {members.map((member) => {
          const config = roleConfig[member.role];
          const RoleIcon = config.icon;
          const isOwner = member.role === 'OWNER';

          return (
            <Card key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {(member.user.fullName || member.user.email)[0].toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div>
                  <div className="font-medium text-slate-100">
                    {member.user.fullName || 'No name'}
                  </div>
                  <div className="text-sm text-slate-400">{member.user.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Role Badge or Selector */}
                {canChangeRoles && !isOwner ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.user.id, e.target.value)}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                ) : (
                  <Badge variant={config.variant}>
                    <RoleIcon className={`w-3 h-3 mr-1 ${config.color}`} />
                    {config.label}
                  </Badge>
                )}

                {/* Remove Button */}
                {canManageMembers && !isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(member.user.id)}
                    disabled={removing}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Role Legend */}
      <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
        <div className="text-xs text-slate-500 mb-2">Role Permissions:</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><Crown className="w-3 h-3 inline mr-1 text-yellow-400" /> Owner: Full control, change roles</div>
          <div><Shield className="w-3 h-3 inline mr-1 text-purple-400" /> Admin: Manage projects, tasks, members</div>
          <div><User className="w-3 h-3 inline mr-1 text-blue-400" /> Member: Create/edit tasks, comments</div>
          <div><Eye className="w-3 h-3 inline mr-1 text-slate-400" /> Viewer: Read-only access</div>
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
      >
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
            >
              <option value="ADMIN">Admin - Can manage projects and members</option>
              <option value="MEMBER">Member - Can work on tasks</option>
              <option value="VIEWER">Viewer - Read-only access</option>
            </select>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-lg text-sm text-slate-400">
            <strong>Note:</strong> The user must have an account first. If they don't, ask them to sign up at the login page.
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} isLoading={inviting} disabled={!inviteEmail.trim()}>
              <UserPlus className="w-4 h-4 mr-1" />
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
