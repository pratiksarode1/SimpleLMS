
import React, { useState } from 'react';
import { User, UserRole, UserStatus, SystemRole, Department } from '../types';
import { USERS, ROLES, DEPARTMENTS, updateUsers } from '../mockData';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Key, 
  Edit2, 
  UserCheck, 
  Shield, 
  Filter,
  MoreVertical,
  UserX,
  History,
  ShieldAlert,
  ShieldCheck,
  UserPlus
} from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACTIVE' | 'OBSOLETE'>('ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // --- Filtering Logic ---
  const getVisibleUsers = () => {
    let filtered = USERS;

    // 1. Role Scope
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      // Sees everyone
    } else if (currentUser.role === UserRole.ADMIN) {
      // Sees Managers & Staff (excludes Super Admins)
      filtered = filtered.filter(u => u.role !== UserRole.SUPER_ADMIN);
    } else if (currentUser.role === UserRole.MANAGER) {
      // Sees only direct reports
      filtered = filtered.filter(u => u.managerId === currentUser.id);
    } else {
      return [];
    }

    // 2. Tab Filter
    if (activeTab === 'PENDING') {
      filtered = filtered.filter(u => u.status === UserStatus.PENDING);
    } else if (activeTab === 'ACTIVE') {
      filtered = filtered.filter(u => u.status === UserStatus.ACTIVE || u.status === UserStatus.INACTIVE);
    } else {
      filtered = filtered.filter(u => u.status === UserStatus.OBSOLETE);
    }

    // 3. Search Filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(lower) || 
        u.username.toLowerCase().includes(lower) ||
        u.email?.toLowerCase().includes(lower)
      );
    }

    return filtered;
  };

  const visibleUsers = getVisibleUsers();
  const pendingCount = USERS.filter(u => u.status === UserStatus.PENDING).length;
  const activeCount = USERS.filter(u => u.status === UserStatus.ACTIVE || u.status === UserStatus.INACTIVE).length;

  // --- Actions ---

  const handleApprove = (userId: string) => {
    const updated = USERS.map(u => u.id === userId ? { ...u, status: UserStatus.ACTIVE } : u);
    updateUsers(updated);
    setSearchTerm(prev => prev + ' '); 
    setTimeout(() => setSearchTerm(prev => prev.trim()), 0);
  };

  const toggleStatus = (userId: string) => {
    const updated = USERS.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE };
      }
      return u;
    });
    updateUsers(updated);
    setSearchTerm(prev => prev + ' '); 
    setTimeout(() => setSearchTerm(prev => prev.trim()), 0);
  };

  const makeObsolete = (userId: string) => {
    const user = USERS.find(u => u.id === userId);
    if (!user || user.status !== UserStatus.INACTIVE) return;
    
    if (confirm(`Are you sure you want to mark ${user.name} as Obsolete? This user will be moved to History.`)) {
      const updated = USERS.map(u => u.id === userId ? { ...u, status: UserStatus.OBSOLETE } : u);
      updateUsers(updated);
      setSearchTerm(prev => prev + ' '); 
      setTimeout(() => setSearchTerm(prev => prev.trim()), 0);
    }
  };

  const handlePasswordReset = (email: string) => {
    alert(`Password reset link sent to ${email}`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    const updated = USERS.map(u => u.id === editingUser.id ? editingUser : u);
    updateUsers(updated);
    setEditingUser(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn">
      {/* Header Styled per Screenshot */}
      <div className="bg-white border-b border-slate-200 px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
            <p className="text-slate-500 mt-2 text-sm md:text-base font-medium max-w-lg leading-snug">
              Oversee system users, approvals, and access control.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('PENDING')}
              className={`flex-1 md:flex-none px-4 md:px-5 py-3 rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center gap-2.5 transition-all whitespace-nowrap ${
                activeTab === 'PENDING' 
                  ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200 shadow-sm' 
                  : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <History size={18} className={activeTab === 'PENDING' ? 'animate-pulse' : ''} />
              Pending
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'PENDING' ? 'bg-orange-200 text-orange-800' : 'bg-slate-100 text-slate-500'}`}>
                {pendingCount}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('ACTIVE')}
              className={`flex-1 md:flex-none px-4 md:px-5 py-3 rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center gap-2.5 transition-all whitespace-nowrap ${
                activeTab === 'ACTIVE' 
                  ? 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200 shadow-sm' 
                  : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <CheckCircle size={18} />
              Active
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                {activeCount}
              </span>
            </button>
            {activeTab === 'OBSOLETE' ? (
                <button onClick={() => setActiveTab('ACTIVE')} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50">
                    <UserPlus size={20} />
                </button>
            ) : (
                <button 
                  onClick={() => setActiveTab('OBSOLETE')}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"
                  title="View Obsolete Users"
                >
                    <UserX size={20} />
                </button>
            )}
          </div>
        </div>

        {/* Search Bar Styled per Screenshot */}
        <div className="mt-6 md:mt-8 relative max-w-3xl">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <div className="w-10 h-10 flex items-center justify-center">
                <Search className="text-slate-400" size={22} />
            </div>
          </div>
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, username or email..."
            className="w-full pl-14 pr-6 py-3 md:py-4 rounded-2xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none shadow-sm transition-all text-sm md:text-base placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-5">
          {visibleUsers.length === 0 ? (
            <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
              <Shield size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold text-lg">No {activeTab.toLowerCase()} users found.</p>
            </div>
          ) : (
            visibleUsers.map(user => {
              const roleName = ROLES.find(r => r.id === user.systemRoleId)?.name || 'Unassigned';
              const deptName = DEPARTMENTS.find(d => d.id === user.departmentId)?.name || 'Unassigned';
              const isInactive = user.status === UserStatus.INACTIVE;
              const isObsolete = user.status === UserStatus.OBSOLETE;

              return (
                <div key={user.id} className={`bg-white rounded-3xl border border-slate-200 p-5 md:p-7 shadow-sm hover:shadow-lg transition-all duration-300 relative group ${isInactive ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 md:gap-6 w-full">
                      {/* Avatar Styled per Screenshot */}
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-black text-lg md:text-xl text-white shadow-lg shrink-0 ${
                        isObsolete ? 'bg-slate-400' : isInactive ? 'bg-slate-300' : 'bg-emerald-400'
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-slate-800 text-lg md:text-xl tracking-tight leading-none truncate">{user.name}</h3>
                            {isInactive && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-lg border border-slate-200">Inactive</span>
                            )}
                        </div>
                        <p className="text-slate-400 font-bold text-xs md:text-sm mt-1.5 flex flex-wrap items-center gap-2">
                            <span>@{user.username}</span>
                            <span className="hidden md:inline w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="text-slate-400 font-medium truncate">{user.email}</span>
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                           <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 flex items-center gap-1.5 text-[10px] md:text-xs font-black uppercase tracking-tight">
                              <Shield size={12} className="text-slate-400" /> {roleName}
                           </span>
                           <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 text-[10px] md:text-xs font-black uppercase tracking-tight">
                              {deptName}
                           </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t border-slate-100 pt-4 md:border-0 md:pt-0">
                      {activeTab === 'PENDING' ? (
                        <button 
                          onClick={() => handleApprove(user.id)}
                          className="flex-1 md:flex-none px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={16} /> Approve
                        </button>
                      ) : !isObsolete ? (
                        <>
                          <div className="flex flex-col gap-1 items-end mr-0 md:mr-2">
                             <button 
                                onClick={() => toggleStatus(user.id)}
                                className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider border transition-all ${
                                    isInactive 
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200' 
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                                }`}
                             >
                                {isInactive ? 'Set Active' : 'Set Inactive'}
                             </button>
                             {isInactive && (
                                <button 
                                    onClick={() => makeObsolete(user.id)}
                                    className="px-4 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-red-100 transition-all flex items-center gap-1"
                                >
                                    Obsolete
                                </button>
                             )}
                          </div>

                          <div className="hidden md:block h-10 w-[1px] bg-slate-100 mx-1"></div>

                          <button 
                            onClick={() => setEditingUser(user)}
                            className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all border border-transparent hover:border-emerald-100"
                            title="Edit Profile"
                          >
                            <Edit2 size={20} />
                          </button>
                          <button 
                            onClick={() => handlePasswordReset(user.email || '')}
                            className="p-3 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-2xl transition-all border border-transparent hover:border-orange-100"
                            title="Reset Credentials"
                          >
                            <Key size={20} />
                          </button>
                        </>
                      ) : (
                        <div className="p-3 text-red-400 border border-red-100 rounded-2xl bg-red-50 flex items-center gap-2 font-black text-xs uppercase tracking-tighter shadow-inner">
                            <ShieldAlert size={18} /> Obsolete
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 ring-1 ring-black/5 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-xl md:text-2xl text-slate-800 tracking-tight">Edit Profile</h3>
                <p className="text-slate-400 text-xs md:text-sm font-medium">Update account information.</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-2 md:p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-2xl transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 md:p-10 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={editingUser.name} 
                  onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                  className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-sm md:text-base"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Hierarchy</label>
                  <select 
                    value={editingUser.role} 
                    onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                    className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none bg-white font-medium text-sm md:text-base"
                  >
                    <option value={UserRole.USER}>Staff (User)</option>
                    <option value={UserRole.MANAGER}>Manager</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Functional Role</label>
                  <select 
                    value={editingUser.systemRoleId} 
                    onChange={e => setEditingUser({...editingUser, systemRoleId: e.target.value})}
                    className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none bg-white font-medium text-sm md:text-base"
                  >
                    {ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Department</label>
                  <select 
                    value={editingUser.departmentId} 
                    onChange={e => setEditingUser({...editingUser, departmentId: e.target.value})}
                    className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none bg-white font-medium text-sm md:text-base"
                  >
                    {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
              </div>

              <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Reporting Manager</label>
                  <select 
                    value={editingUser.managerId} 
                    onChange={e => setEditingUser({...editingUser, managerId: e.target.value})}
                    className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none bg-white font-medium text-sm md:text-base"
                  >
                     <option value="">No Manager</option>
                    {USERS.filter(u => u.id !== editingUser.id && u.status !== UserStatus.OBSOLETE).map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
              </div>

              <div className="pt-4 md:pt-6 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-3 md:py-4 text-slate-500 font-bold bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 md:py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-900/20 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
