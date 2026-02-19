import React, { useState } from 'react';
import { SUPER_ADMIN_CODE, COMPANY_NAME } from '../constants';
import { UserRole, UserStatus } from '../types';
import { ROLES, DEPARTMENTS, USERS, updateUsers } from '../mockData';
import { Box, Lock, ShieldCheck, Mail, ArrowRight, User, UserPlus, CheckCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'SUPER_ADMIN'>('LOGIN');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Super Admin State
  const [adminCode, setAdminCode] = useState('');
  const [adminError, setAdminError] = useState('');

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Signup State
  const [signupData, setSignupData] = useState({
    fullName: '',
    username: '',
    password: '',
    systemRoleId: '',
    departmentId: '',
    managerId: ''
  });

  const handleSuperAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCode === SUPER_ADMIN_CODE) {
      const superUser = USERS.find(u => u.role === UserRole.SUPER_ADMIN) || {
        id: 'super',
        name: 'Super Admin',
        username: 'superadmin',
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE
      };
      onLoginSuccess(superUser);
    } else {
      setAdminError('Invalid access code.');
    }
  };

  const handleRegularLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    // Mock authentication
    const user = USERS.find(u => 
      (u.email === loginEmail || u.username === loginEmail) && 
      // In a real app check password hash
      true 
    );

    if (user) {
      if (user.status === UserStatus.PENDING) {
        setLoginError('Your account is pending approval. Please contact your manager.');
      } else if (user.status === UserStatus.INACTIVE) {
        setLoginError('Your account has been deactivated.');
      } else {
        onLoginSuccess(user);
      }
    } else {
      setLoginError('Invalid credentials.');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new pending user
    const newUser = {
      id: Date.now().toString(),
      name: signupData.fullName,
      username: signupData.username,
      email: `${signupData.username}@frankston.com`, // Auto-generate or add email field
      role: UserRole.USER, // Default to USER, Admin can promote
      status: UserStatus.PENDING,
      systemRoleId: signupData.systemRoleId,
      departmentId: signupData.departmentId,
      managerId: signupData.managerId,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    // Update mock store
    updateUsers([...USERS, newUser]);

    setSuccessMsg('Request sent for approval! You will be notified once active.');
    setMode('LOGIN');
    // Reset form
    setSignupData({
      fullName: '',
      username: '',
      password: '',
      systemRoleId: '',
      departmentId: '',
      managerId: ''
    });
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fullName = e.target.value;
    
    // Auto-generate username logic
    // Format: First Initial + First 3 of Last Name + 01 (target 6 chars)
    let generatedUsername = signupData.username;
    
    if (fullName) {
      const cleanName = fullName.replace(/[^a-zA-Z\s]/g, '');
      const parts = cleanName.trim().split(/\s+/);
      
      if (parts.length > 0) {
        const firstInitial = parts[0].charAt(0).toLowerCase();
        // Use last name if exists, else empty
        const lastName = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
        
        // Take up to 3 chars from last name
        const lastNamePart = lastName.substring(0, 3);
        
        // Combine
        const base = `${firstInitial}${lastNamePart}`;
        
        // Add '01'
        generatedUsername = `${base}01`;
      }
    }

    setSignupData({
      ...signupData,
      fullName: fullName,
      username: generatedUsername
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Side - Brand & Info */}
        <div className="w-full md:w-1/2 bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-10"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-900/80 to-slate-900/90 z-0"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-emerald-600 p-2.5 rounded-lg">
                <Box size={32} />
              </div>
              <span className="text-xl font-bold tracking-wide">Simple-LMS</span>
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">Learning Management Simplified.</h2>
            <p className="text-slate-300 text-lg">
              Streamline your workflow, ensure compliance, and boost productivity with our customized solution for {COMPANY_NAME}.
            </p>
          </div>
          
          {/* Removed Copyright as requested */}
        </div>

        {/* Right Side - Forms */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-center animate-fadeIn overflow-y-auto">
          
          {/* Header for Form */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-900">
              {mode === 'SUPER_ADMIN' ? 'Super Admin Access' : mode === 'SIGNUP' ? 'Request Access' : 'Welcome Back'}
            </h3>
            <p className="text-slate-500 mt-2">
              {mode === 'SUPER_ADMIN' 
                ? 'Enter your secure access code to continue.' 
                : mode === 'SIGNUP' 
                  ? 'Fill in details to request system access.' 
                  : 'Please enter your details to log in.'}
            </p>
            {successMsg && mode === 'LOGIN' && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2 border border-green-100">
                <CheckCircle size={16} /> {successMsg}
              </div>
            )}
            {loginError && mode === 'LOGIN' && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {loginError}
              </div>
            )}
          </div>

          {/* Super Admin Form */}
          {mode === 'SUPER_ADMIN' && (
            <form onSubmit={handleSuperAdminLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Access Code</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input
                    type="password"
                    value={adminCode}
                    onChange={(e) => {
                      setAdminCode(e.target.value);
                      setAdminError('');
                    }}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    placeholder="Enter admin code"
                    autoFocus
                  />
                </div>
                {adminError && <p className="text-red-500 text-sm mt-2">{adminError}</p>}
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                Access System <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className="w-full text-slate-500 text-sm hover:text-slate-800 transition-colors"
              >
                Back to regular login
              </button>
            </form>
          )}

          {/* Login Form */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleRegularLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Username or Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    placeholder="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
              >
                Log In
              </button>
              
              <div className="flex flex-col gap-4 mt-6">
                 <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                  Don't have an account?
                  <button 
                    type="button"
                    onClick={() => { setMode('SIGNUP'); setSuccessMsg(''); }}
                    className="text-emerald-600 font-semibold hover:underline"
                  >
                    Request Access
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">Or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMode('SUPER_ADMIN')}
                  className="w-full py-2.5 border-2 border-slate-200 rounded-lg text-slate-600 font-medium hover:border-slate-400 hover:text-slate-800 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={16} />
                  Login as Super Admin
                </button>
              </div>
            </form>
          )}

          {/* Signup Form */}
          {mode === 'SIGNUP' && (
            <form onSubmit={handleSignup} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-sm"
                      placeholder="John Doe"
                      value={signupData.fullName}
                      onChange={handleFullNameChange}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Username</label>
                    <input
                      required
                      type="text"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-sm bg-slate-50"
                      placeholder="Auto-generated"
                      value={signupData.username}
                      onChange={e => setSignupData({...signupData, username: e.target.value})}
                    />
                 </div>
               </div>

               <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Password</label>
                <input
                  required
                  type="password"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-sm"
                  placeholder="Create a strong password"
                  value={signupData.password}
                  onChange={e => setSignupData({...signupData, password: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Functional Role</label>
                <select
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-sm bg-white"
                  value={signupData.systemRoleId}
                  onChange={e => setSignupData({...signupData, systemRoleId: e.target.value})}
                >
                  <option value="">Select Role...</option>
                  {ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Department</label>
                <select
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-sm bg-white"
                  value={signupData.departmentId}
                  onChange={e => setSignupData({...signupData, departmentId: e.target.value})}
                >
                  <option value="">Select Department...</option>
                  {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Reporting Manager</label>
                <select
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-sm bg-white"
                  value={signupData.managerId}
                  onChange={e => setSignupData({...signupData, managerId: e.target.value})}
                >
                  <option value="">Select Manager...</option>
                  {USERS.filter(u => u.status === UserStatus.ACTIVE).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 mt-2"
              >
                <UserPlus size={18} /> Send for Approval
              </button>
              
              <div className="text-center mt-4">
                <button 
                  type="button"
                  onClick={() => setMode('LOGIN')}
                  className="text-slate-500 text-sm hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoginScreen;