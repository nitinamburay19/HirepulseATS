import React, { useState } from 'react';
import { UserRole } from '../types';
import { Button, Input, Modal } from '../components/UI';
import { ShieldCheck, Eye, EyeOff, Mail, UserPlus } from 'lucide-react';
import { api } from '../services/api';

interface AuthProps {
  onLogin: (email: string, password: string, role: UserRole) => Promise<void>;
  isLoading: boolean;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CANDIDATE);
  const [showPassword, setShowPassword] = useState(false);
  const [modalView, setModalView] = useState<'none' | 'forgotPassword' | 'register'>('none');

  // State for register modal
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<UserRole>(UserRole.CANDIDATE);
  
  // State for forgot password modal
  const [resetEmail, setResetEmail] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      await onLogin(email, password, selectedRole);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedName = registerName.trim();
    const normalizedEmail = registerEmail.trim().toLowerCase();

    if (normalizedName.length < 2) {
      alert("Please enter a valid full name.");
      return;
    }
    if (registerPassword.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    try {
      await api.auth.register(
        normalizedName,
        normalizedEmail,
        registerPassword,
        registerRole
      );
      alert(`Registration successful for ${normalizedEmail}`);
      setModalView('none');
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterConfirmPassword('');
      setRegisterRole(UserRole.CANDIDATE);
      setEmail(normalizedEmail);
      setPassword('');
      setSelectedRole(registerRole);
    } catch (error: any) {
      alert(error?.message || 'Registration failed');
    }
  };
  
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.auth.forgotPassword(resetEmail);
      alert(`Password reset link sent to ${resetEmail}`);
      setModalView('none');
    } catch (error: any) {
      alert(error?.message || 'Failed to request password reset');
    }
  };

  const roleOptions = [
    { value: UserRole.CANDIDATE, label: 'Candidate' },
    { value: UserRole.MANAGER, label: 'Hiring Manager' },
    { value: UserRole.RECRUITER, label: 'Recruiter' },
    { value: UserRole.ADMIN, label: 'Administrator' },
  ];

  return (
    <>
      <div className="flex min-h-screen bg-slate-50">
        {/* Brand Panel */}
        <div className="hidden lg:flex w-1/2 bg-indigo-950 relative overflow-hidden items-center justify-center p-12 text-white">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10 max-w-lg">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-indigo-500/50 mb-8">
              <span className="font-black text-white text-3xl">H</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight mb-6">HIREPULSE <span className="text-indigo-400">ENTERPRISE</span></h1>
            <p className="text-xl text-indigo-200 font-light leading-relaxed mb-8">
              Advanced Applicant Tracking System with Section 12 Artifact Vetting and Autonomous Recruitment Agents.
            </p>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure Enterprise Environment</span>
            </div>
          </div>
        </div>

        {/* Login Panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Identity Authorization</h2>
              <p className="mt-2 text-slate-500">Access the system artifact using your authorized credentials.</p>
            </div>

            <form className="space-y-6" onSubmit={handleLoginSubmit}>
              <Input 
                label="Email Address" 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="relative">
                 <Input 
                    label="Password" 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-12"
                 />
                 <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-8 right-0 flex items-center px-4 text-slate-400 hover:text-indigo-600 h-12"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                 >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Select Your Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  required
                  className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-[2rem] focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4 outline-none appearance-none"
                >
                  {roleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              <div className="flex items-center justify-end text-xs">
                <button 
                  type="button"
                  onClick={() => setModalView('forgotPassword')}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <Button type="submit" className="w-full h-14" isLoading={isLoading}>
                Authorize
              </Button>
            </form>

            <div className="text-center text-sm font-medium text-slate-500">
              Don't have an account?{' '}
              <button onClick={() => setModalView('register')} className="font-bold text-indigo-600 hover:underline">
                Register
              </button>
            </div>
            
            <div className="text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Authorized Personnel Only • Section 12 Artifact
            </div>
          </div>
        </div>
      </div>

      {/* Register Modal */}
      <Modal isOpen={modalView === 'register'} onClose={() => setModalView('none')} title="Create New Account">
        <form className="space-y-6" onSubmit={handleRegister}>
            <Input 
                label="Full Name"
                type="text"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                required
            />
            <Input 
                label="Email Address" 
                type="email" 
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
            />
            <Input 
                label="Password" 
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
            />
            <Input 
                label="Confirm Password" 
                type="password"
                value={registerConfirmPassword}
                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                required
            />
            <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Select Role</label>
                <select
                  value={registerRole}
                  onChange={(e) => setRegisterRole(e.target.value as UserRole)}
                  required
                  className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-[2rem] focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4 outline-none appearance-none"
                >
                  {roleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                <Button variant="secondary" type="button" onClick={() => setModalView('none')}>Cancel</Button>
                <Button type="submit">
                    <UserPlus className="w-4 h-4 mr-2"/>
                    Register
                </Button>
            </div>
        </form>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal isOpen={modalView === 'forgotPassword'} onClose={() => setModalView('none')} title="Reset Password">
        <form className="space-y-6" onSubmit={handleForgotPassword}>
            <p className="text-sm text-slate-500">Enter your email address and we'll send you a link to reset your password.</p>
            <Input 
                label="Email Address" 
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
            />
            <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                <Button variant="secondary" type="button" onClick={() => setModalView('none')}>Cancel</Button>
                <Button type="submit">
                    <Mail className="w-4 h-4 mr-2"/>
                    Send Reset Link
                </Button>
            </div>
        </form>
      </Modal>
    </>
  );
};
