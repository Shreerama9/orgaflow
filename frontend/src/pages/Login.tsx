/**
 * Login Page - User authentication with email, password, and company UID.
 * Enhanced signup with organization create/join options.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, UserPlus, Building2, Users, Key } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card } from '../components/ui';
import { CREATE_ORGANIZATION, JOIN_ORGANIZATION } from '../graphql/mutations';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companyUid: z.string().optional(),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  orgChoice: z.enum(['create', 'join']).optional(),
  orgName: z.string().optional(),
  orgEmail: z.string().email().optional(),
  joinUid: z.string().optional(),
});

type SignupForm = z.infer<typeof signupSchema>;

type OrgChoice = 'create' | 'join' | null;

export const LoginPage: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [orgChoice, setOrgChoice] = useState<OrgChoice>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const [createOrganization] = useMutation(CREATE_ORGANIZATION);
  const [joinOrganization] = useMutation(JOIN_ORGANIZATION);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(isSignup ? signupSchema : loginSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setError(null);
    setSuccessMessage(null);
    
    try {
      if (isSignup) {
        await signup(data.email, data.password, data.fullName);
        
        await login(data.email, data.password);

        if (orgChoice === 'create') {
          if (!data.orgName) {
            setError('Organization name is required');
            return;
          }
          
          await createOrganization({
            variables: {
              name: data.orgName,
              contactEmail: data.orgEmail || data.email,
              description: '',
            },
          });
          
          navigate('/dashboard');
        } else if (orgChoice === 'join') {
          // User wants to join existing org
          if (!data.joinUid) {
            setError('Organization UID is required');
            return;
          }

          const { data: joinData } = await joinOrganization({
            variables: {
              uid: data.joinUid,
            },
          });

          if (joinData?.joinOrganization?.success) {
            navigate('/dashboard');
          } else {
            setError(joinData?.joinOrganization?.message || 'Failed to join organization');
          }
        } else {
          // No org choice - go to dashboard to create/join later
          navigate('/dashboard');
        }
      } else {
        // Login - store company UID for context
        if (data.companyUid) {
          localStorage.setItem('companyUid', data.companyUid.toUpperCase());
        }
        await login(data.email, data.password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="../../assets/logo_orgaflow.png" 
            alt="OrgaFlow" 
            className="h-28 mx-auto mb-4"
          />
          <p className="text-surface-500 mt-2">
            {isSignup ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="p-3 bg-green-900/30 border border-green-800 rounded-lg text-green-400 text-sm">
                {successMessage}
              </div>
            )}

            {isSignup && (
              <Input
                label="Full Name"
                placeholder="John Doe"
                {...register('fullName')}
                error={errors.fullName?.message}
              />
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />

            {!isSignup && (
              <div>
                <Input
                  label="Company UID (optional)"
                  placeholder="ORG-XXXXXX"
                  {...register('companyUid')}
                />
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  Get this from your organization admin
                </p>
              </div>
            )}

            {/* Organization Choice */}
            {isSignup && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                  Organization
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Create New Org */}
                  <button
                    type="button"
                    onClick={() => setOrgChoice(orgChoice === 'create' ? null : 'create')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      orgChoice === 'create'
                        ? 'border-primary-500 bg-primary-900/20'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <Building2 className={`w-6 h-6 mb-2 ${
                      orgChoice === 'create' ? 'text-primary-500' : 'text-slate-400'
                    }`} />
                    <div className={`font-medium ${
                      orgChoice === 'create' ? 'text-primary-500' : 'text-slate-700'
                    }`}>
                      Create New
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      You become Owner
                    </div>
                  </button>
                  
                  {/* Join Existing Org */}
                  <button
                    type="button"
                    onClick={() => setOrgChoice(orgChoice === 'join' ? null : 'join')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      orgChoice === 'join'
                        ? 'border-primary-500 bg-primary-900/20'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <Users className={`w-6 h-6 mb-2 ${
                      orgChoice === 'join' ? 'text-primary-500' : 'text-slate-500'
                    }`} />
                    <div className={`font-medium ${
                      orgChoice === 'join' ? 'text-primary-500' : 'text-slate-700'
                    }`}>
                      Join Existing
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Admin adds you
                    </div>
                  </button>
                </div>
                
                {/* Create Org Form */}
                {orgChoice === 'create' && (
                  <div className="space-y-3 mt-3 p-3 bg-primary-300 rounded-lg">
                    <Input
                      label="Organization Name"
                      placeholder="Acme Inc."
                      {...register('orgName')}
                    />
                    <Input
                      label="Organization Email (optional)"
                      type="email"
                      placeholder="contact@acme.com"
                      {...register('orgEmail')}
                    />
                  </div>
                )}
                
                {/* Join Org Form */}
                {orgChoice === 'join' && (
                  <div className="space-y-3 mt-3 p-3 bg-slate-300/50 rounded-lg">
                    <Input
                      label="Organization UID"
                      placeholder="ORG-XXXXXX"
                      {...register('joinUid')}
                    />
                    <p className="text-xs text-slate-800">
                      Ask your organization admin for this UID.
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSignup ? (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {orgChoice === 'create' ? 'Create Account & Organization' : 
                   orgChoice === 'join' ? 'Create Account' : 'Create Account'}
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setOrgChoice(null);
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              {isSignup
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </Card>

        {!isSignup && (
          <div className="mt-4 p-3 bg-slate-300 rounded-lg text-center text-md text-slate-800">
            <p><strong>Demo:</strong> demo@example.com / demo1234</p>
          </div>
        )}

        {isSignup && (
          <div className="mt-6 text-center text-xs text-slate-500">
            <p>Roles: <strong>Owner</strong> (full control) • <strong>Admin</strong> (manage) • <strong>Member</strong> (work) • <strong>Viewer</strong> (read-only)</p>
          </div>
        )}
      </div>
    </div>
  );
};
