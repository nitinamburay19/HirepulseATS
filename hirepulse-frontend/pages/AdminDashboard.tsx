import React from 'react';
import { Card, Badge, Button, Input, Modal } from '../components/UI';
import { DataTable, Column } from '../components/DataTable';
import { api } from '../services/api';
import { UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { ShieldAlert, Activity, DollarSign, Users, Ban, AlertTriangle, ToggleLeft, ToggleRight, CheckCircle, XCircle, Trash2 } from 'lucide-react';

// --- Shared Components ---

const KPICard: React.FC<{ title: string; value: string; trend?: string; icon: any; color: string }> = ({ title, value, trend, icon: Icon, color }) => (
  <Card className="flex flex-col justify-between h-40 relative overflow-hidden group">
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${color}`}></div>
    <div className="relative z-10 flex justify-between items-start">
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{title}</h3>
        <span className="text-3xl font-black text-slate-800 tracking-tight">{value}</span>
      </div>
      <div className={`p-3 rounded-2xl ${color.replace('bg-', 'bg-opacity-10 text-')}`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
    {trend && (
      <div className="relative z-10 mt-auto">
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
          {trend}
        </span>
        <span className="text-xs text-slate-400 ml-2 font-medium">vs last month</span>
      </div>
    )}
  </Card>
);

// --- Sub-Screens ---

const CommandHub: React.FC = () => {
  const [chartData, setChartData] = React.useState([]);
  const [accessLogs, setAccessLogs] = React.useState<any[]>([]);
  const [kpiStats, setKpiStats] = React.useState({
    requisitions: { value: '0', trend: '+0%' },
    securityFlags: { value: '0', trend: '-0%' },
    budget: { value: '0%', trend: '+0%' },
    users: { value: '0', trend: '+0' },
  });

  React.useEffect(() => {
    api.admin.getDashboardData()
      .then((data) => {
        setChartData(data.chart || []);
        setAccessLogs(data.logs || []);
        setKpiStats(data.kpis || kpiStats);
      })
      .catch((err) => console.error('Failed to load admin dashboard:', err));
  }, []);

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Requisitions" value={kpiStats.requisitions.value} trend={kpiStats.requisitions.trend} icon={Activity} color="bg-indigo-600" />
        <KPICard title="Security Flags" value={kpiStats.securityFlags.value} trend={kpiStats.securityFlags.trend} icon={ShieldAlert} color="bg-rose-600" />
        <KPICard title="Budget Utilization" value={kpiStats.budget.value} trend={kpiStats.budget.trend} icon={DollarSign} color="bg-emerald-600" />
        <KPICard title="Active Users" value={kpiStats.users.value} trend={kpiStats.users.trend} icon={Users} color="bg-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card title="Recruitment Velocity by Dept" className="lg:col-span-2 min-h-[400px]">
          <div className="h-[300px] w-full min-w-0 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="hires" fill="#312e81" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Recent Identity Access Logs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-[10px] font-black uppercase text-slate-400">User Identity</th>
                  <th className="pb-3 text-[10px] font-black uppercase text-slate-400">Role</th>
                  <th className="pb-3 text-[10px] font-black uppercase text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {accessLogs.map((log: any, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 font-bold text-slate-700">{log.userId}</td>
                    <td className="py-3 text-slate-500">{log.role}</td>
                    <td className="py-3"><Badge color="emerald">{log.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

const IdentityManagement: React.FC = () => {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = React.useState(false);
  const [viewUser, setViewUser] = React.useState<any | null>(null);
  const [editUser, setEditUser] = React.useState<any | null>(null);

  const [newUser, setNewUser] = React.useState({
      code: '',
      name: '',
      manager: '',
      hod: '',
      role: 'Recruiter'
  });
  
  type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';
  const [users, setUsers] = React.useState<any[]>([]);

  React.useEffect(() => {
    api.admin.getUsers()
      .then((data) => setUsers(data || []))
      .catch((err) => console.error('Failed to load users:', err));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterUser = async () => {
      if (!newUser.code || !newUser.name) {
          alert('Please fill all required fields.');
          return;
      }
      try {
          const roleMap: Record<string, string> = {
              'Recruiter': 'recruiter',
              'Hiring Manager': 'manager',
              'Administrator': 'admin',
          };
          await api.admin.createUser({
              name: newUser.name.trim(),
              email: `${newUser.code.toLowerCase()}@hirepulse.com`,
              password: 'Password@123',
              role: roleMap[newUser.role] || 'candidate',
              employeeCode: newUser.code.trim(),
          });
          const refreshed = await api.admin.getUsers();
          setUsers(refreshed || []);
          setIsRegisterModalOpen(false);
          setNewUser({ code: '', name: '', manager: '', hod: '', role: 'Recruiter' });
      } catch (error: any) {
          alert(error?.message || 'Failed to register user');
      }
  };
  
  const handleAction = (action: string, user: any) => {
    if (action === 'view') {
        setViewUser(user);
    } else if (action === 'edit') {
        setEditUser(user);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
    try {
        await api.admin.deleteUser(id);
        setUsers(prev => prev.filter(u => String(u.id) !== String(id)));
        setEditUser(null);
    } catch (error: any) {
        alert(error?.message || 'Delete failed');
    }
  };

  const handleBlacklist = async (id: string) => {
      if (!window.confirm('Are you sure you want to blacklist this user? They will be unable to access the system.')) return;
      try {
          const target = users.find(u => String(u.id) === String(id));
          if (target) {
              await api.admin.addToBlacklist({
                  name: target.name,
                  reason: 'Policy Violation',
                  risk: 'high',
                  notes: `User ${target.id} blacklisted from Admin console.`,
              });
          }
          const updated = await api.admin.updateUserStatus(id, 'INACTIVE');
          setUsers(prev => prev.map(u => String(u.id) === String(id) ? { ...u, ...updated, status: 'BLACKLISTED' as UserStatus } : u));
          setEditUser(null);
      } catch (error: any) {
          alert(error?.message || 'Blacklist update failed');
      }
  };

  const columns: Column<typeof users[0]>[] = [
    { key: 'id', label: 'Identity ID', render: u => <span className="font-mono text-slate-500 font-bold">{u.id}</span> },
    { key: 'name', label: 'Full Name', render: u => (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-black text-slate-500">{u.name.charAt(0)}</div>
        <span className="font-bold text-slate-800">{u.name}</span>
      </div>
    )},
    { key: 'role', label: 'Role Assigned' },
    { key: 'lastLogin', label: 'Last Access' },
    { key: 'status', label: 'Security Status', render: u => {
        if (u.status === 'ACTIVE') return <Badge color="emerald">Active</Badge>;
        if (u.status === 'INACTIVE') return <Badge color="slate">Inactive</Badge>;
        if (u.status === 'BLACKLISTED') return <Badge color="rose">Blacklisted</Badge>;
        return null;
    }},
    { key: 'actions', label: 'Controls' }
  ];

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center">
         <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">User Management</h2>
         <Button onClick={() => setIsRegisterModalOpen(true)}>+ Register New Identity</Button>
      </div>
      <Card>
        <DataTable data={users} columns={columns} onAction={handleAction} />
      </Card>
      
      <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Register New Identity">
        <div className="space-y-6">
            <Input label="Employee Code" name="code" value={newUser.code} onChange={handleInputChange} placeholder="e.g., EMP-12345" />
            <Input label="Employee Name" name="name" value={newUser.name} onChange={handleInputChange} placeholder="e.g., John Doe" />
            <Input label="Reporting Manager Name" name="manager" value={newUser.manager} onChange={handleInputChange} placeholder="e.g., Jane Smith" />
            <Input label="HOD Name" name="hod" value={newUser.hod} onChange={handleInputChange} placeholder="e.g., Robert Brown" />
            <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Assign Role</label>
                <select 
                    name="role"
                    value={newUser.role}
                    onChange={handleInputChange}
                    className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-[2rem] focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4"
                >
                    <option>Recruiter</option>
                    <option>Hiring Manager</option>
                    <option>Administrator</option>
                </select>
            </div>
            <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setIsRegisterModalOpen(false)}>Cancel</Button>
                <Button onClick={handleRegisterUser}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Register Identity
                </Button>
            </div>
        </div>
      </Modal>

      <Modal isOpen={!!viewUser} onClose={() => setViewUser(null)} title="User Identity Summary">
        {viewUser && (
            <div className="space-y-6">
                <div className="flex items-center space-x-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-black text-indigo-400">{viewUser.name.charAt(0)}</div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800">{viewUser.name}</h3>
                        <p className="font-mono text-slate-500">{viewUser.id} • {viewUser.role}</p>
                        <div className="mt-2">
                              {viewUser.status === 'ACTIVE' && <Badge color="emerald">Active</Badge>}
                              {viewUser.status === 'INACTIVE' && <Badge color="slate">Inactive</Badge>}
                              {viewUser.status === 'BLACKLISTED' && <Badge color="rose">Blacklisted</Badge>}
                        </div>
                      </div>
                </div>

                <Card title="Activity Log">
                    <p className="text-sm text-slate-500">Last login: {viewUser.lastLogin}</p>
                    <p className="text-sm text-slate-500 mt-2">Recent Actions:</p>
                    <p className="text-xs text-slate-400 mt-2">No audit activity feed is configured for this user yet.</p>
                </Card>
                
                <div className="flex justify-end pt-4">
                    <Button variant="secondary" onClick={() => setViewUser(null)}>Close</Button>
                </div>
            </div>
        )}
      </Modal>
      
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Manage User Controls">
          {editUser && (
              <div className="space-y-6">
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-[1.5rem] flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
                        <p className="text-xs font-bold text-rose-800 leading-relaxed">
                            <span className="uppercase tracking-wider block mb-1">WARNING</span>
                            These actions are critical and may have irreversible consequences. Proceed with caution.
                        </p>
                  </div>
                  
                  <p className="text-center text-slate-600">
                      You are managing controls for <span className="font-bold text-slate-800">{editUser.name}</span> (<span className="font-mono text-sm">{editUser.id}</span>).
                  </p>

                  <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-slate-100">
                      <Button variant="danger" className="flex-1" onClick={() => handleBlacklist(editUser.id)}>
                          <Ban className="w-4 h-4 mr-2" />
                          Add to Blacklist
                      </Button>
                        <Button variant="danger" className="flex-1 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50" onClick={() => handleDelete(editUser.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Identity
                      </Button>
                  </div>
              </div>
          )}
      </Modal>
    </div>
  );
};

const MPRConfiguration: React.FC = () => {
  const [switches, setSwitches] = React.useState({
    freeze: false,
    strictVetting: true,
  });
  const [aiScore, setAiScore] = React.useState(85);
  const [budgetTolerance, setBudgetTolerance] = React.useState(5);

  React.useEffect(() => {
    api.admin.getMprConfig()
      .then((config) => {
        setSwitches({ freeze: !!config.freeze, strictVetting: !!config.strictVetting });
        setAiScore(Number(config.aiScore ?? 85));
        setBudgetTolerance(Number(config.budgetTolerance ?? 5));
      })
      .catch((err) => console.error('Failed to load MPR config:', err));
  }, []);

  const toggle = (key: keyof typeof switches) => setSwitches(s => ({ ...s, [key]: !s[key] }));

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
       <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">MPR Configuration</h2>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card title="Critical System Overrides">
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Enterprise Hiring Freeze</div>
                    <div className="text-xs text-slate-500">Halts all new Requisition creation immediately.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle('freeze')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${switches.freeze ? 'bg-rose-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${switches.freeze ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
               </div>
               <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Strict Section 12 Vetting</div>
                    <div className="text-xs text-slate-500">Mandates AI Document Audit before any human review.</div>
                  </div>
                   <button
                    type="button"
                    onClick={() => toggle('strictVetting')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${switches.strictVetting ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${switches.strictVetting ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
               </div>
            </div>
         </Card>

         <Card title="Automation Thresholds">
            <div className="space-y-6">
              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-800">Auto-Shortlist AI Score</span>
                    <span className="text-sm font-bold text-indigo-600 font-mono bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{aiScore}%</span>
                 </div>
                 <input 
                    type="range" 
                    min="50"
                    max="100"
                    value={aiScore}
                    onChange={(e) => setAiScore(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                 />
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-800">Budget Variance Tolerance</span>
                    <span className="text-sm font-bold text-emerald-600 font-mono bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">{budgetTolerance}%</span>
                 </div>
                 <input 
                    type="range" 
                    min="0"
                    max="20"
                    value={budgetTolerance}
                    onChange={(e) => setBudgetTolerance(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" 
                 />
              </div>
            </div>
         </Card>
       </div>

       <div className="flex justify-end">
          <Button
            onClick={() => api.admin.updateMprConfig({
              freeze: switches.freeze,
              strictVetting: switches.strictVetting,
              aiScore,
              budgetTolerance
            }).then(() => alert('Configuration saved')).catch((e: any) => alert(e?.message || 'Save failed'))}
          >
            Save Configuration
          </Button>
       </div>
    </div>
  );
};

const ComplianceVault: React.FC = () => {
  type BlacklistEntry = { id: string; name: string; reason: string; date: string; risk: string; notes: string; };
  const [blacklist, setBlacklist] = React.useState<BlacklistEntry[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const initialNewEntryState = { name: '', reason: 'Document Forgery', risk: 'MODERATE', notes: '' };
  const [newEntry, setNewEntry] = React.useState(initialNewEntryState);

  const [viewEntry, setViewEntry] = React.useState<BlacklistEntry | null>(null);
  const [editEntry, setEditEntry] = React.useState<BlacklistEntry | null>(null);

  React.useEffect(() => {
    api.admin.getBlacklist()
      .then((entries) => setBlacklist((entries || []).map((e: any) => ({
        id: String(e.id),
        name: e.name,
        reason: e.reason,
        date: e.date ? new Date(e.date).toISOString().split('T')[0] : '',
        risk: String(e.risk || 'MODERATE').toUpperCase(),
        notes: e.notes || '',
      }))))
      .catch((err) => console.error('Failed to load blacklist:', err));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({...prev, [name]: value}));
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.name || !newEntry.reason || !newEntry.risk) {
      alert('Please fill all required fields.');
      return;
    }
    try {
      const created = await api.admin.addToBlacklist(newEntry);
      if (!created?.id) {
        throw new Error('Blacklist entry was not persisted. Missing entry id in response.');
      }
      setBlacklist(prev => [{
        ...newEntry,
        id: String(created.id),
        date: new Date().toISOString().split('T')[0],
      }, ...prev]);
      setNewEntry(initialNewEntryState);
      setIsAddModalOpen(false);
    } catch (error: any) {
      alert(error?.message || 'Failed to add blacklist entry');
    }
  };

  const handleAction = (action: string, entry: BlacklistEntry) => {
    if (action === 'view') {
      setViewEntry(entry);
    } else if (action === 'edit') {
      setEditEntry(entry);
    }
  };

  const handleWhitelist = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this identity from the blacklist? This will re-enable their access if they are a registered user.')) return;
    try {
      await api.admin.whitelistUser(id);
      setBlacklist(prev => prev.filter(e => String(e.id) !== String(id)));
      setEditEntry(null);
    } catch (error: any) {
      alert(error?.message || 'Failed to whitelist');
    }
  };

  const columns: Column<BlacklistEntry>[] = [
    { key: 'id', label: 'Entry ID', render: i => <span className="font-mono text-rose-800 font-bold bg-rose-100 px-2 py-1 rounded">{i.id}</span> },
    { key: 'name', label: 'Identity Name', render: i => <span className="font-bold text-slate-800">{i.name}</span> },
    { key: 'reason', label: 'Flag Reason', render: i => <span className="text-rose-600 font-bold uppercase text-xs tracking-wider">{i.reason}</span> },
    { key: 'date', label: 'Date Flagged' },
    { key: 'risk', label: 'Risk Level', render: i => <Badge color="rose">{i.risk}</Badge> },
    { key: 'actions', label: 'Actions' }
  ];

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
       <div className="flex justify-between items-center">
         <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Blacklist Manager</h2>
            <p className="text-slate-500 font-medium text-sm">Manage high-risk identities and security artifacts.</p>
         </div>
         <Button variant="danger" className="shadow-rose-500/20" onClick={() => setIsAddModalOpen(true)}>
            <Ban className="w-4 h-4 mr-2" /> Add to Blacklist
         </Button>
      </div>
      <Card>
        <DataTable data={blacklist} columns={columns} onAction={handleAction} />
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Identity to Blacklist">
        <form className="space-y-6" onSubmit={handleAddEntry}>
            <Input 
                label="Identity Name" 
                name="name" 
                value={newEntry.name} 
                onChange={handleInputChange} 
                placeholder="Full name of the individual" 
                required 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Flag Reason</label>
                    <select
                        name="reason"
                        value={newEntry.reason}
                        onChange={handleInputChange}
                        required
                        className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-[2rem] focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4"
                    >
                        <option>Document Forgery</option>
                        <option>Previous Absconding</option>
                        <option>Bot Application</option>
                        <option>Policy Violation</option>
                        <option>Failed BGV</option>
                    </select>
                </div>
                 <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Risk Level</label>
                    <select
                        name="risk"
                        value={newEntry.risk}
                        onChange={handleInputChange}
                        required
                        className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-[2rem] focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4"
                    >
                        <option>CRITICAL</option>
                        <option>HIGH</option>
                        <option>MODERATE</option>
                        <option>LOW</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-2 block">Evidentiary Notes</label>
                <textarea
                    name="notes"
                    value={newEntry.notes}
                    onChange={handleInputChange}
                    placeholder="Provide a detailed justification for this action..."
                    className="w-full h-24 bg-slate-50 border border-slate-200 rounded-[2rem] p-4 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                />
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button variant="danger" type="submit">
                    <CheckCircle className="w-4 h-4 mr-2"/>
                    Confirm & Blacklist
                </Button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewEntry} onClose={() => setViewEntry(null)} title="Blacklist Case Review">
        {viewEntry && (
            <div className="space-y-6">
                <div className="flex items-center space-x-6 bg-rose-50 p-6 rounded-2xl border border-rose-200">
                    <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center text-rose-400">
                        <Ban className="w-10 h-10" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800">{viewEntry.name}</h3>
                        <p className="font-mono text-slate-500">{viewEntry.id}</p>
                        <div className="mt-2">
                            <Badge color="rose">{viewEntry.risk}</Badge>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-400 font-bold block text-xs">Flag Reason</span><span className="font-bold text-rose-600 uppercase tracking-wider">{viewEntry.reason}</span></div>
                    <div><span className="text-slate-400 font-bold block text-xs">Date Flagged</span><span className="font-mono">{viewEntry.date}</span></div>
                </div>
                <Card title="Auditor Notes">
                    <p className="text-sm text-slate-600 leading-relaxed">{viewEntry.notes || 'No detailed notes provided.'}</p>
                </Card>
                <div className="flex justify-end pt-4">
                    <Button variant="secondary" onClick={() => setViewEntry(null)}>Close</Button>
                </div>
            </div>
        )}
      </Modal>

      <Modal isOpen={!!editEntry} onClose={() => setEditEntry(null)} title="Manage Blacklist Entry">
        {editEntry && (
            <div className="space-y-6">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-[1.5rem] flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <p className="text-xs font-bold text-amber-800 leading-relaxed">
                        <span className="uppercase tracking-wider block mb-1">High-Impact Action</span>
                        Whitelisting an identity will remove them from the blacklist. Please ensure you have completed a thorough review of the case artifacts.
                    </p>
                </div>
                
                <p className="text-center text-slate-600">
                    You are about to whitelist <span className="font-bold text-slate-800">{editEntry.name}</span> (<span className="font-mono text-sm">{editEntry.id}</span>).
                </p>

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                    <Button variant="secondary" onClick={() => setEditEntry(null)}>Cancel</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20" onClick={() => handleWhitelist(editEntry.id)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm & Whitelist
                    </Button>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
};

const CompOffersAnalytics: React.FC = () => {
  const [criticalQueue, setCriticalQueue] = React.useState<any[]>([]);
  const [budgetConsumption, setBudgetConsumption] = React.useState<any[]>([]);
  const [offerVelocity, setOfferVelocity] = React.useState({ released: 0, joined: 0, declined: 0 });
  const [authorizingOfferId, setAuthorizingOfferId] = React.useState<string | null>(null);

  const loadOfferAnalytics = React.useCallback(() => {
    api.admin.getOffersAnalytics()
      .then((data) => {
        setCriticalQueue(data.queue || []);
        setBudgetConsumption(data.budget || []);
        setOfferVelocity(data.velocity || { released: 0, joined: 0, declined: 0 });
      })
      .catch((err) => console.error('Failed to load offer analytics:', err));
  }, []);

  React.useEffect(() => {
    loadOfferAnalytics();
  }, []);

  const handleAuthorizeOffer = async (offerId: string) => {
    setAuthorizingOfferId(offerId);
    try {
      await api.admin.authorizeOffer(offerId);
      await loadOfferAnalytics();
    } catch (error: any) {
      alert(error?.message || 'Failed to authorize offer');
    } finally {
      setAuthorizingOfferId(null);
    }
  };

  const columns: Column<(typeof criticalQueue)[0]>[] = [
    { key: 'id', label: 'Offer ID', render: i => <span className="font-mono font-bold text-slate-500">{i.id}</span> },
    { key: 'candidate', label: 'Candidate Name', render: i => <span className="font-bold text-slate-800">{i.candidate}</span> },
    { key: 'role', label: 'Role Context' },
    { key: 'offer', label: 'Total CTC', render: i => <span className="font-mono font-bold text-indigo-700">{i.offer}</span> },
    { key: 'variance', label: 'Budget Var', render: i => <span className={`font-bold ${i.variance.startsWith('+') ? 'text-rose-600' : 'text-emerald-600'}`}>{i.variance}</span> },
    { key: 'status', label: 'Audit Status', render: i => i.status === 'APPROVED' ? <Badge color="emerald">Approved</Badge> : <Badge color="amber">Pending</Badge> },
    {
      key: 'actions',
      label: 'Action',
      render: i => i.requiresApproval
        ? (
          <Button
            variant="primary"
            className="h-8 text-xs"
            onClick={() => handleAuthorizeOffer(String(i.id))}
            isLoading={authorizingOfferId === String(i.id)}
          >
            Authorize
          </Button>
        )
        : <span className="text-emerald-600"><CheckCircle className="w-5 h-5"/></span>
    }
  ];

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
       <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Comp & Offers</h2>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card title="Department Budget Consumption" className="lg:col-span-2">
             <div className="space-y-6 pt-4">
               {budgetConsumption.map((d, i) => (
                 <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-black uppercase text-slate-500">
                       <span>{d.dept}</span>
                       <span>{d.used}% of {d.total}</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                       <div 
                        className={`h-full rounded-full ${d.used > 75 ? 'bg-rose-500' : d.used > 50 ? 'bg-indigo-600' : 'bg-emerald-500'}`} 
                        style={{ width: `${d.used}%` }}
                       ></div>
                    </div>
                 </div>
               ))}
             </div>
          </Card>

          <Card title="Offer Velocity" className="flex items-center justify-center">
             <div className="text-center space-y-2">
               <div className="text-5xl font-black text-slate-800">{offerVelocity.released}</div>
               <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Offers Released (Q3)</div>
               <div className="flex justify-center gap-2 mt-4">
                  <Badge color="emerald">{offerVelocity.joined} Joined</Badge>
                  <Badge color="rose">{offerVelocity.declined} Declined</Badge>
               </div>
             </div>
          </Card>
       </div>

       <Card title="Critical Audit Queue (High Value / High Variance)">
          <DataTable data={criticalQueue} columns={columns} />
       </Card>
    </div>
  );
};

// --- Main Container ---

export const AdminDashboard: React.FC<{ currentPage: string }> = ({ currentPage }) => {
  switch (currentPage) {
    case 'admin-users': return <IdentityManagement />;
    case 'admin-config': return <MPRConfiguration />;
    case 'admin-compliance': return <ComplianceVault />;
    case 'admin-offers': return <CompOffersAnalytics />;
    case 'admin-dash':
    default:
      return <CommandHub />;
  }
};
