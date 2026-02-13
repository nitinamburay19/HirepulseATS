import React from 'react';
import { Card, Button, Input, Badge, Modal, SyncIndicator } from '../components/UI';
import { DataTable, Column } from '../components/DataTable';
import { CandidateArtifact, JobRequisition } from '../types';
import { api } from '../services/api';
// FIX: Imported 'Clock' and 'Upload' icons from 'lucide-react' as they were being used but not imported.
import { 
    Sparkles, 
    CheckCircle, 
    XCircle, 
    Users, 
    Briefcase, 
    Calendar, 
    Star, 
    Building2, 
    UserPlus, 
    Handshake, 
    UserX, 
    ShieldCheck, 
    ChevronRight,
    Building,
    Phone,
    Mail,
    FileText,
    CreditCard,
    Search,
    Ban,
    Trash2,
    ArrowRightCircle,
    AlertTriangle,
    Globe,
    Lock,
    Eye,
    Clock,
    Download,
    FilePenLine,
    Upload
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- Helper Components for Form ---

const Select = ({ label, options, ...props }: any) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">{label}</label>
    <div className="relative">
        <select 
            className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-[2rem] focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4 appearance-none outline-none transition-all hover:bg-white"
            {...props}
        >
            {options.map((opt: string) => <option key={opt}>{opt}</option>)}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
            <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
        </div>
    </div>
  </div>
);

const Toggle = ({ label, checked, onChange, helpText }: any) => (
  <div className="p-4 bg-slate-50 border border-slate-200 rounded-[2rem] flex items-center justify-between hover:bg-white transition-colors">
    <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</div>
        {helpText && <div className="text-[10px] text-slate-400 font-bold mt-1">{helpText}</div>}
    </div>
    <button 
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

// --- Sub-Screens ---

const DashboardOverview: React.FC = () => {
    const [summaryModalOpen, setSummaryModalOpen] = React.useState(false);
    const [summaryData, setSummaryData] = React.useState<{role: string, stage: string, count: number, candidates: any[]} | null>(null);
    const [matrixData, setMatrixData] = React.useState<any[]>([]);
    const [allCandidates, setAllCandidates] = React.useState<CandidateArtifact[]>([]);
    const [kpiStats, setKpiStats] = React.useState({
      poolStrength: 0,
      joinedEfficiency: 0,
      rejectionPool: 0,
      cycleHealth: "0%",
    });

    React.useEffect(() => {
        api.recruiter.getDashboardOverview()
          .then((data) => {
            setMatrixData(data.matrix || []);
            setKpiStats(data.kpis || kpiStats);
          })
          .catch((err) => console.error('Failed to load recruiter dashboard:', err));
        api.recruiter.getCandidates()
          .then((data) => setAllCandidates(data || []))
          .catch((err) => console.error('Failed to load recruiter candidates for drill-down:', err));
    }, []);

    const handleStageClick = (role: string, stage: string, count: number) => {
        const normalizedStage = stage.toLowerCase();
        let filtered = allCandidates;
        if (normalizedStage === 'shortlist') {
            filtered = allCandidates.filter(c => c.status === 'SHORTLISTED');
        } else if (normalizedStage === 'selection') {
            filtered = allCandidates.filter(c => c.status === 'INTERVIEW' || c.status === 'OFFER' || c.status === 'JOINED');
        } else if (normalizedStage === 'offer') {
            filtered = allCandidates.filter(c => c.status === 'OFFER' || c.status === 'JOINED');
        } else if (normalizedStage === 'respondents') {
            filtered = allCandidates.filter(c => c.status !== 'REJECTED');
        }

        const candidates = filtered.map((c) => ({
            id: c.id,
            name: c.name,
            score: c.matchScore,
            resumeUrl: c.resumeContent,
        }));
        setSummaryData({ role, stage, count: candidates.length || count, candidates });
        setSummaryModalOpen(true);
    };

    return (
        <div className="space-y-10 animate-[fadeIn_0.5s_ease-out]">
            {/* Top Row KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Total Pool Strength */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between h-48 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Pool Strength</div>
                        <div className="text-4xl font-black text-slate-800 tracking-tight">{kpiStats.poolStrength}</div>
                        <div className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">Active Pipeline</div>
                    </div>
                </div>

                {/* Card 2: Joined Efficiency */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between h-48 relative overflow-hidden group hover:shadow-md transition-all">
                     <div className="flex justify-between items-start">
                        <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                            <Handshake className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Joined Efficiency</div>
                        <div className="text-4xl font-black text-slate-800 tracking-tight">{kpiStats.joinedEfficiency}</div>
                        <div className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">Benchmark Secured</div>
                    </div>
                </div>

                {/* Card 3: Rejection Pool */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between h-48 relative overflow-hidden group hover:shadow-md transition-all">
                     <div className="flex justify-between items-start">
                        <div className="p-4 bg-rose-50 rounded-2xl text-rose-600">
                            <UserX className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Rejection Pool</div>
                        <div className="text-4xl font-black text-slate-800 tracking-tight">{kpiStats.rejectionPool}</div>
                        <div className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">Requires Audit</div>
                    </div>
                </div>

                {/* Card 4: Cycle Health (Dark) */}
                <div className="bg-indigo-950 rounded-[2.5rem] p-8 shadow-xl shadow-indigo-900/20 flex flex-col justify-between h-48 relative overflow-hidden text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-800 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                     <div className="flex justify-between items-start relative z-10">
                        <div className="p-4 bg-indigo-900/50 rounded-2xl text-indigo-300 border border-indigo-800">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Cycle Health</div>
                        <div className="text-4xl font-black tracking-tight">{kpiStats.cycleHealth}</div>
                        <div className="text-xs font-bold text-indigo-400 mt-2 uppercase tracking-wide">Compliance Pass</div>
                    </div>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400 w-64">Role Identifier</th>
                                <th className="py-6 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Respondents</th>
                                <th className="py-6 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Shortlist</th>
                                <th className="py-6 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Selection</th>
                                <th className="py-6 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Offer Release</th>
                                <th className="py-6 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-600 text-center">Joined</th>
                                <th className="py-6 px-4 text-[10px] font-black uppercase tracking-widest text-rose-500 text-center">DNJ</th>
                                <th className="py-6 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center border-l border-slate-100">Agency</th>
                                <th className="py-6 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Direct</th>
                                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Budget</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matrixData.map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors group">
                                    <td className="py-6 px-8">
                                        <div className="font-black text-slate-800 text-sm">{row.role}</div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-1">{row.id}</div>
                                    </td>
                                    
                                    {/* Interactive Cells */}
                                    {[
                                        { key: 'respondents', val: row.respondents, color: 'text-indigo-600' },
                                        { key: 'shortlist', val: row.shortlist, color: 'text-slate-800' },
                                        { key: 'selection', val: row.selection, color: 'text-slate-800' },
                                        { key: 'offer', val: row.offer, color: 'text-slate-800' },
                                    ].map((cell, i) => (
                                        <td key={i} className="py-6 px-4 text-center">
                                            <button 
                                                onClick={() => handleStageClick(row.role, cell.key, cell.val)}
                                                className={`text-sm font-bold ${cell.color} hover:scale-125 transition-transform cursor-pointer border-b-2 border-transparent hover:border-indigo-200`}
                                            >
                                                {cell.val}
                                            </button>
                                        </td>
                                    ))}

                                    <td className="py-6 px-4 text-center">
                                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                                            <span className="text-sm font-black text-emerald-600">{row.joined}</span>
                                        </div>
                                    </td>
                                    <td className="py-6 px-4 text-center">
                                        <span className="text-sm font-bold text-rose-400">{row.dnj}</span>
                                    </td>
                                    
                                    <td className="py-6 px-4 text-center border-l border-slate-100">
                                        <button onClick={() => handleStageClick(row.role, 'Agency', row.agency)} className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">{row.agency}</button>
                                    </td>
                                    <td className="py-6 px-4 text-center">
                                        <button onClick={() => handleStageClick(row.role, 'Direct', row.direct)} className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">{row.direct}</button>
                                    </td>
                                    
                                    <td className="py-6 px-8 text-right">
                                        <span className="font-mono font-bold text-slate-800">${(row.budget || 0).toLocaleString()}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Modal */}
            <Modal isOpen={summaryModalOpen} onClose={() => setSummaryModalOpen(false)} title="Stage Summary Drill-Down">
                {summaryData && (
                    <div className="space-y-6">
                        <div className="bg-indigo-50 rounded-2xl p-6 flex justify-between items-center">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Role Context</div>
                                <div className="text-lg font-black text-indigo-900">{summaryData.role}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Stage: {summaryData.stage}</div>
                                <div className="text-2xl font-black text-indigo-900">{summaryData.count} <span className="text-sm font-bold text-indigo-400">Candidates</span></div>
                            </div>
                        </div>

                        {summaryData.count === 0 ? (
                            <div className="py-12 text-center text-slate-400">
                                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-wide">No candidates in this stage</p>
                            </div>
                        ) : summaryData.candidates.length > 0 ? (
                            <div className="space-y-3">
                                {summaryData.candidates.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                {c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                                                <div className="text-[10px] font-mono text-slate-400">{c.id}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Match Score</div>
                                                <div className="text-sm font-bold text-emerald-600">{c.score}%</div>
                                            </div>
                                            <Button
                                                variant="secondary"
                                                className="h-8 text-xs"
                                                onClick={() => c.resumeUrl && window.open(c.resumeUrl, '_blank', 'noopener,noreferrer')}
                                                disabled={!c.resumeUrl}
                                            >
                                                View Artifact
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-slate-500 text-sm font-medium">
                                Candidate-level details for this stage are available in Candidate Artifact Repository.
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

const ApprovedAgencies: React.FC = () => {
    const [isEmpanelModalOpen, setIsEmpanelModalOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedAgency, setSelectedAgency] = React.useState<any | null>(null);
    const [agencies, setAgencies] = React.useState<any[]>([]);
    const [isSubmittingEmpanel, setIsSubmittingEmpanel] = React.useState(false);
    const [empanelForm, setEmpanelForm] = React.useState({
        agencyName: '',
        hq: '',
        type: 'Contingency Search',
        structure: 'Private Limited',
        spoc: '',
        spocPhone: '',
        spocEmail: '',
    });

    React.useEffect(() => {
        api.recruiter.getAgencies()
          .then((data) => setAgencies(data || []))
          .catch((err) => console.error('Failed to load agencies:', err));
    }, []);

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await api.recruiter.updateAgencyStatus(id, newStatus.toLowerCase());
            setAgencies(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
            setSelectedAgency(null);
        } catch (error) {
            console.error('Failed to update agency status:', error);
            alert(error instanceof Error ? error.message : 'Failed to update agency status');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.recruiter.deleteAgency(id);
            setAgencies(prev => prev.filter(a => a.id !== id));
            setSelectedAgency(null);
        } catch (error) {
            console.error('Failed to delete agency:', error);
            alert(error instanceof Error ? error.message : 'Failed to delete agency');
        }
    };

    const handleEmpanelSubmit = async () => {
        if (!empanelForm.agencyName.trim() || !empanelForm.spoc.trim() || !empanelForm.spocEmail.trim()) {
            alert('Agency name, SPOC name and email are required.');
            return;
        }

        setIsSubmittingEmpanel(true);
        try {
            const created = await api.recruiter.empanelAgency({
                agencyName: empanelForm.agencyName.trim(),
                hq: empanelForm.hq.trim() || undefined,
                type: empanelForm.type,
                structure: empanelForm.structure,
                spoc: empanelForm.spoc.trim(),
                spocPhone: empanelForm.spocPhone.trim(),
                spocEmail: empanelForm.spocEmail.trim(),
            });

            setAgencies(prev => [{
                id: String(created.id),
                name: created.name || empanelForm.agencyName.trim(),
                tier: String(created.tier || 'tier_3').toUpperCase(),
                sla: 30,
                status: String(created.status || 'active').toUpperCase(),
                location: empanelForm.hq.trim() || '-',
                spocName: empanelForm.spoc.trim(),
                spocEmail: empanelForm.spocEmail.trim(),
            }, ...prev]);

            setIsEmpanelModalOpen(false);
            setEmpanelForm({
                agencyName: '',
                hq: '',
                type: 'Contingency Search',
                structure: 'Private Limited',
                spoc: '',
                spocPhone: '',
                spocEmail: '',
            });
        } catch (error) {
            console.error('Failed to empanel agency:', error);
            alert(error instanceof Error ? error.message : 'Failed to empanel agency');
        } finally {
            setIsSubmittingEmpanel(false);
        }
    };

    const activeCount = agencies.filter(a => a.status === 'ACTIVE').length;
    const inactiveCount = agencies.filter(a => a.status !== 'ACTIVE').length;

    const filteredAgencies = agencies.filter(a => {
        const matchesTab = activeTab === 'ACTIVE' ? a.status === 'ACTIVE' : a.status !== 'ACTIVE';
        const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const columns: Column<(typeof agencies)[0]>[] = [
        { key: 'id', label: 'Agency ID', render: a => <span className="font-mono font-bold text-slate-500">{a.id}</span> },
        { key: 'name', label: 'Agency Name', render: a => <span className="font-bold text-slate-800">{a.name}</span> },
        { key: 'tier', label: 'Tier Level' },
        { key: 'sla', label: 'SLA Score', render: a => <span className={`font-bold ${a.sla > 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{a.sla}%</span> },
        { key: 'status', label: 'Status', render: a => {
            const color = a.status === 'ACTIVE' ? 'emerald' : a.status === 'INACTIVE' ? 'rose' : 'amber';
            return <Badge color={color}>{a.status}</Badge>;
        }},
        // Using 'actions_custom' key to avoid default actions and render the View Profile button
        { key: 'actions_custom' as any, label: 'Actions', render: (a) => <Button variant="secondary" className="h-8 text-xs" onClick={() => setSelectedAgency(a)}>View Profile</Button> }
    ];

    const renderEmpanelForm = () => (
        <div className="space-y-8">
             {/* Header */}
            <div className="flex items-center justify-between bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <div>
                     <h3 className="text-sm font-black uppercase tracking-wide text-slate-800">New Partner Artifact</h3>
                     <p className="text-xs text-slate-500 font-bold mt-1">Initialize Section 12 Vetting Protocol for new agency.</p>
                </div>
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <Building2 className="w-5 h-5" />
                </div>
            </div>

            {/* Module 1: Identity */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-500">Module 01: Corporate Identity</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                    <Input
                        label="Agency Legal Name"
                        placeholder="e.g. Acme Solutions Pvt Ltd"
                        value={empanelForm.agencyName}
                        onChange={(e) => setEmpanelForm(prev => ({ ...prev, agencyName: e.target.value }))}
                    />
                    <Input
                        label="Headquarters Location"
                        placeholder="e.g. San Francisco, CA"
                        value={empanelForm.hq}
                        onChange={(e) => setEmpanelForm(prev => ({ ...prev, hq: e.target.value }))}
                    />
                    
                    <div className="flex flex-col space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Empanelment Type</label>
                        <select
                            className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-[2rem] focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4 outline-none"
                            value={empanelForm.type}
                            onChange={(e) => setEmpanelForm(prev => ({ ...prev, type: e.target.value }))}
                        >
                            <option>Contingency Search</option>
                            <option>Retained Executive</option>
                            <option>RPO / Volume</option>
                            <option>Staff Augmentation</option>
                        </select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Entity Structure</label>
                        <select
                            className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-[2rem] focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4 outline-none"
                            value={empanelForm.structure}
                            onChange={(e) => setEmpanelForm(prev => ({ ...prev, structure: e.target.value }))}
                        >
                            <option>Private Limited</option>
                            <option>LLP</option>
                            <option>Proprietorship</option>
                            <option>Inc / Corp</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Module 2: Communication */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Module 02: Communication Matrix</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                    <Input
                        label="Primary SPOC Name"
                        placeholder="Relationship Manager"
                        value={empanelForm.spoc}
                        onChange={(e) => setEmpanelForm(prev => ({ ...prev, spoc: e.target.value }))}
                    />
                    <Input
                        label="Primary Mobile"
                        placeholder="+1 (XXX) XXX-XXXX"
                        value={empanelForm.spocPhone}
                        onChange={(e) => setEmpanelForm(prev => ({ ...prev, spocPhone: e.target.value }))}
                    />
                    
                    <Input label="Escalation SPOC Name" placeholder="Delivery Head / Director" />
                    <Input label="Escalation Mobile" placeholder="+1 (XXX) XXX-XXXX" />
                    
                    <Input
                        label="Official Correspondence Email"
                        placeholder="accounts@agency.com"
                        className="md:col-span-2"
                        value={empanelForm.spocEmail}
                        onChange={(e) => setEmpanelForm(prev => ({ ...prev, spocEmail: e.target.value }))}
                    />
                </div>
            </div>

            {/* Module 3: Commercials */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <span className="text-xs font-black uppercase tracking-widest text-rose-500">Module 03: Fiscal & Compliance</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex flex-col space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Fee Structure</label>
                        <select className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-[2rem] focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4 outline-none">
                            <option>8.33% (Standard)</option>
                            <option>10.0% (Preferred)</option>
                            <option>12.5% (Niche)</option>
                            <option>Flat Fee</option>
                        </select>
                    </div>
                    <Input label="Payment Terms" placeholder="e.g. 45 Days" />
                    <Input label="Replacement Guarantee" placeholder="e.g. 90 Days" />
                    
                    <Input label="Contract Validity" type="date" className="md:col-span-1" />
                    <Input label="Tax ID / GSTIN" placeholder="XX-XXXXX-XX" className="md:col-span-2" />
                </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-100">
                <Button variant="secondary" className="flex-1" onClick={() => setIsEmpanelModalOpen(false)}>Abort Sequence</Button>
                <Button
                    className="flex-1 bg-indigo-900 text-white shadow-xl shadow-indigo-900/20"
                    onClick={handleEmpanelSubmit}
                    isLoading={isSubmittingEmpanel}
                >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Authorize & Empanel
                </Button>
            </div>
        </div>
    );

    const renderAgencySummary = () => {
        if (!selectedAgency) return null;
        const isActive = selectedAgency.status === 'ACTIVE';

        return (
            <div className="space-y-6">
                 {/* Summary Header */}
                 <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800">{selectedAgency.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                             <span className="font-mono font-bold text-slate-400">{selectedAgency.id}</span>
                             <Badge color={isActive ? 'emerald' : selectedAgency.status === 'INACTIVE' ? 'rose' : 'amber'}>{selectedAgency.status}</Badge>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">SLA Performance</div>
                        <div className={`text-3xl font-black ${selectedAgency.sla > 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{selectedAgency.sla}%</div>
                    </div>
                 </div>

                 {/* Details Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tier Classification</div>
                        <div className="font-bold text-slate-800">{selectedAgency.tier}</div>
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Headquarters</div>
                        <div className="font-bold text-slate-800">{selectedAgency.location}</div>
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Primary Contact</div>
                        <div className="font-bold text-slate-800">{selectedAgency.contact}</div>
                    </div>
                     <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Corporate Email</div>
                        <div className="font-bold text-slate-800">{selectedAgency.email}</div>
                    </div>
                 </div>

                 {/* Action Buttons */}
                 <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-3">
                    {isActive ? (
                        <>
                            <Button variant="secondary" className="flex-1 text-slate-600 border-slate-200 hover:bg-slate-50" onClick={() => handleStatusChange(selectedAgency.id, 'INACTIVE')}>
                                <XCircle className="w-4 h-4 mr-2" /> Move to Inactive
                            </Button>
                            <Button variant="secondary" className="flex-1 text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-100" onClick={() => handleStatusChange(selectedAgency.id, 'BLACKLISTED')}>
                                <Ban className="w-4 h-4 mr-2" /> Blacklist
                            </Button>
                            <Button variant="danger" className="flex-1" onClick={() => handleDelete(selectedAgency.id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </Button>
                        </>
                    ) : (
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" onClick={() => handleStatusChange(selectedAgency.id, 'ACTIVE')}>
                            <ArrowRightCircle className="w-4 h-4 mr-2" /> Move to Active
                        </Button>
                    )}
                 </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Approved Agency Directory</h2>
                    <p className="text-sm text-slate-400 font-bold mt-1">Manage 3rd Party Recruitment Partners</p>
                </div>
                <Button onClick={() => setIsEmpanelModalOpen(true)} className="shadow-xl shadow-indigo-500/20">
                    <Building2 className="w-4 h-4 mr-2" />
                    EMPANEL NEW AGENCY
                </Button>
            </div>
            
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 flex items-center justify-between">
                    <div>
                         <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Active Empanelment</div>
                         <div className="text-3xl font-black text-emerald-900">{activeCount}</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl text-emerald-600 shadow-sm">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-200 flex items-center justify-between">
                    <div>
                         <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Inactive / Non-Renewed</div>
                         <div className="text-3xl font-black text-slate-700">{inactiveCount}</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl text-slate-400 shadow-sm">
                        <UserX className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center space-x-4">
                <button 
                    onClick={() => setActiveTab('ACTIVE')}
                    className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === 'ACTIVE' 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                        : 'bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    Active Empanelment ({activeCount})
                </button>
                <button 
                    onClick={() => setActiveTab('INACTIVE')}
                    className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === 'INACTIVE' 
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' 
                        : 'bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    Inactive / Non-Renewed ({inactiveCount})
                </button>
            </div>
            
            <Card title={activeTab === 'ACTIVE' ? "Active Vendor List" : "Inactive & Review Queue"}>
                <div className="mb-6 flex items-center bg-slate-50 rounded-[1.5rem] px-4 py-2 border border-slate-100">
                    <Search className="w-5 h-5 text-slate-400 mr-3" />
                    <input 
                        type="text" 
                        placeholder="Search Agencies by Name or ID..." 
                        className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder-slate-400 w-full p-2"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <DataTable data={filteredAgencies} columns={columns} />
            </Card>

            <Modal isOpen={isEmpanelModalOpen} onClose={() => setIsEmpanelModalOpen(false)} title="Vendor Empanelment Protocol">
                {renderEmpanelForm()}
            </Modal>

            <Modal isOpen={!!selectedAgency} onClose={() => setSelectedAgency(null)} title="Agency Profile & Compliance">
                {renderAgencySummary()}
            </Modal>
        </div>
    );
};

const AgencyProfiles: React.FC = () => {
    // State for toggles
    const [toggles, setToggles] = React.useState({
        nda: true,
        dpdpAgreement: true,
        dpdpConsent: true,
        relocate: false
    });

    const [degrees, setDegrees] = React.useState([{ id: 1 }]);
    const resumeInputRef = React.useRef<HTMLInputElement>(null);
    const [isSubmittingArtifact, setIsSubmittingArtifact] = React.useState(false);
    const [selectedResumeName, setSelectedResumeName] = React.useState('');
    const [artifactForm, setArtifactForm] = React.useState({
        candidateId: '',
        jobId: '',
        notes: '',
    });

    const addDegree = () => {
        setDegrees(prev => [...prev, { id: Date.now() }]);
    };

    const removeDegree = (id: number) => {
        if (degrees.length > 1) {
            setDegrees(prev => prev.filter(d => d.id !== id));
        }
    };

    const handleToggle = (key: keyof typeof toggles) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };
    
    const handleResumeUploadClick = () => {
        resumeInputRef.current?.click();
    };

    const handleResumeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedResumeName(file.name);
        }
    };

    const handleSubmitArtifact = async () => {
        if (!artifactForm.candidateId || !artifactForm.jobId) {
            alert('Candidate ID and Target Job ID are required.');
            return;
        }
        setIsSubmittingArtifact(true);
        try {
            await api.recruiter.submitAgencyCandidate({
                candidateId: Number(artifactForm.candidateId),
                jobId: Number(artifactForm.jobId),
                status: 'applied',
                notes: artifactForm.notes || undefined,
                applicationData: {
                    source: 'agency_submission',
                    nda: toggles.nda,
                    dpdpAgreement: toggles.dpdpAgreement,
                    dpdpConsent: toggles.dpdpConsent,
                    relocate: toggles.relocate,
                    resumeFileName: selectedResumeName || undefined,
                },
            });
            alert('Candidate artifact submitted successfully.');
            setArtifactForm({ candidateId: '', jobId: '', notes: '' });
            setSelectedResumeName('');
        } catch (error) {
            console.error('Failed to submit agency candidate artifact:', error);
            alert(error instanceof Error ? error.message : 'Failed to submit candidate artifact');
        } finally {
            setIsSubmittingArtifact(false);
        }
    };

    return (
        <div className="space-y-8 animate-[fadeIn_0.5s_ease-out] pb-12">
             {/* Header */}
             <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div>
                     <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Agency Submission Portal</h2>
                     <p className="text-sm text-slate-400 font-bold mt-1">New Candidate Artifact Submission & Vetting</p>
                </div>
                <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                    <FileText className="w-6 h-6" />
                </div>
            </div>

            {/* Module 1: Transaction Metadata */}
            <Card title="Module 1: Transaction Metadata">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Input label="Submission Reference" placeholder="e.g. SUB-2024-X99" />
                    <Input
                        label="Target Job ID"
                        placeholder="e.g. 101"
                        value={artifactForm.jobId}
                        onChange={(e) => setArtifactForm((prev) => ({ ...prev, jobId: e.target.value }))}
                    />
                    <Input label="Requirement Title" placeholder="e.g. Senior React Developer" />
                    <Select label="Submission Priority" options={['Low', 'Medium', 'High', 'Critical']} />
                    <Input label="Warranty Period (Days)" type="number" placeholder="90" />
                </div>
            </Card>

            {/* Module 2: Agency Identity Hub */}
            <Card title="Module 2: Agency Identity Hub">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Input label="Agency Name" placeholder="Agency Legal Name" />
                    <Input label="Agency Code" placeholder="AGY-XXX" />
                    <Input label="Primary Contact Name" placeholder="Full Name" />
                    <Input label="Primary Contact Email" placeholder="email@agency.com" />
                    <Input label="Registered Office Address" placeholder="Headquarters Address" className="md:col-span-2 lg:col-span-2" />
                 </div>
            </Card>

            {/* Module 3: Statutory & Compliance Audit */}
            <Card title="Module 3: Statutory & Compliance Audit">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Toggle label="NDA Signed" checked={toggles.nda} onChange={() => handleToggle('nda')} />
                    <Toggle label="DPDP Agreement" checked={toggles.dpdpAgreement} onChange={() => handleToggle('dpdpAgreement')} />
                    <Input label="GSTIN Number" placeholder="XX-XXXXX-XX" />
                    <Input label="PAN Number" placeholder="XXXXX0000X" />
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-[1.5rem] flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-600 mt-0.5" />
                    <p className="text-xs font-bold text-amber-800 leading-relaxed">
                        <span className="uppercase tracking-wider block mb-1">Compliance Check Required</span>
                        Ensure candidate data is processed as per Enterprise DPDP guidelines 2024. Unauthorized data processing will result in immediate blacklisting.
                    </p>
                </div>
            </Card>

            {/* Module 4: Candidate Identity Hub */}
            <Card title="Module 4: Candidate Identity Hub">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Candidate Profile ID"
                        placeholder="e.g. 24"
                        value={artifactForm.candidateId}
                        onChange={(e) => setArtifactForm((prev) => ({ ...prev, candidateId: e.target.value }))}
                    />
                    <Input label="First Name (As per ID)" placeholder="Given Name" />
                    <Input label="Last Name (As per ID)" placeholder="Family Name" />
                    <Input label="Personal Email" placeholder="candidate@email.com" />
                    <Input label="Mobile Number" placeholder="+1 (XXX) XXX-XXXX" />
                    <div className="md:col-span-2">
                        <Toggle 
                            label="DPDP Consent Obtained" 
                            helpText="Candidate has explicitly consented for job application processing."
                            checked={toggles.dpdpConsent} 
                            onChange={() => handleToggle('dpdpConsent')} 
                        />
                    </div>
                </div>
            </Card>

            {/* Module 5: Academic Repository */}
            <Card title="Module 5: Academic Repository">
                <div className="space-y-6">
                    {degrees.map((degree, index) => (
                        <div key={degree.id} className="relative p-6 bg-slate-50 border border-slate-200 rounded-[1.5rem] group transition-all hover:shadow-md hover:border-indigo-200">
                            {degrees.length > 1 && (
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button 
                                        onClick={() => removeDegree(degree.id)}
                                        className="p-2 bg-white text-rose-500 rounded-full shadow-sm hover:bg-rose-50 border border-slate-100 transition-colors"
                                        title="Remove Degree"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label={`Qualification ${index + 1}`} placeholder="e.g. Bachelor of Technology" />
                                <Input label={`Institution Name ${index + 1}`} placeholder="e.g. University of Technology" />
                            </div>
                        </div>
                    ))}
                    
                    <Button 
                        variant="secondary" 
                        onClick={addDegree}
                        className="w-full border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50"
                    >
                        <UserPlus className="w-4 h-4 mr-2" /> Add Degree
                    </Button>
                </div>
            </Card>

            {/* Module 6: Professional DNA */}
            <Card title="Module 6: Professional DNA">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Input label="Total Experience (Years)" type="number" placeholder="0.0" />
                    <Input label="Relevant Experience (Years)" type="number" placeholder="0.0" />
                    <Input label="Current Employer" placeholder="Company Name" />
                    <Input label="Current Designation" placeholder="Job Title" />
                    <Select label="Employment Type" options={['Permanent', 'Contract', 'Consultant', 'Freelancer']} />
                    <Input label="Notice Period (Days)" type="number" placeholder="30" />
                 </div>
            </Card>

            {/* Module 7: Skill & Competency DNA */}
            <Card title="Module 7: Skill & Competency DNA">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Input label="Primary Technical Skills" placeholder="React, Node, Python (Comma Separated)" className="md:col-span-2" />
                    <Select label="Skill Proficiency Level" options={['Beginner', 'Intermediate', 'Advanced', 'Expert/Lead']} />
                    <Input label="Domain Experience" placeholder="e.g. FinTech, HealthTech" />
                </div>
            </Card>

            {/* Module 8: Logistics & Mobility */}
            <Card title="Module 8: Logistics & Mobility">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label="Preferred Location (1st Choice)" placeholder="City, Country" />
                    <Input label="Preferred Location (2nd Choice)" placeholder="City, Country" />
                    <Input label="Preferred Location (3rd Choice)" placeholder="City, Country" />
                    <Select 
                        label="Notice Period" 
                        options={['Immediate Joinee', '< 15 Days', '30 Days', '60 Days', '90 Days']} 
                    />
                    <Select label="Work Mode Preference" options={['Onsite', 'Hybrid', 'Remote']} />
                    <Select label="Shift Preference" options={['General (9-6)', 'Rotational', 'Night Shift']} />
                     <div className="md:col-span-3">
                        <Toggle label="Willing to Relocate" checked={toggles.relocate} onChange={() => handleToggle('relocate')} />
                    </div>
                </div>
            </Card>

            {/* Module 9: Financials & Fee Audit */}
            <Card title="Module 9: Financials & Fee Audit">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Input label="Present CTC (Annual)" placeholder="Amount" />
                    <Input label="Expected Fixed CTC (Annual)" placeholder="Amount" />
                    <Input label="Expected Variable CTC" placeholder="Amount" />
                 </div>
                 
                 <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[80px] opacity-30"></div>
                     <div className="relative z-10">
                        <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4 border-b border-indigo-800 pb-2">Agency Fee Summary (Auto-Calculated)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Base Fee (Exclusive)</div>
                                <div className="text-2xl font-black mt-1">$ 0.00</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">GST (18%)</div>
                                <div className="text-2xl font-black mt-1">$ 0.00</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Net Agency Payable</div>
                                <div className="text-3xl font-black mt-1 text-emerald-400">$ 0.00</div>
                            </div>
                        </div>
                     </div>
                 </div>
            </Card>

            {/* Final Module: System Audit & Control Governance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="System Assigned Values">
                    <div className="space-y-4">
                        <Input label="Consultant Submitted By" value="Authenticated Recruiter Session" readOnly className="bg-slate-100 text-slate-500" />
                        <Input label="Recruiter Assigned" value="AUTO-ROUTING..." readOnly className="bg-slate-100 text-slate-500" />
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Submission Notes</label>
                            <textarea
                                className="w-full h-20 bg-slate-50 border border-slate-200 rounded-[1.5rem] p-4 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                value={artifactForm.notes}
                                onChange={(e) => setArtifactForm((prev) => ({ ...prev, notes: e.target.value }))}
                                placeholder="Optional recruiter notes for this agency submission"
                            />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Compliance Audit Flag</label>
                            <div className="px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-[2rem] text-emerald-700 text-sm font-bold flex items-center">
                                <CheckCircle className="w-4 h-4 mr-2" /> 
                                SYSTEM PASS
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="SLA & Record Lifecycle">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <Input label="SLA Start Date" value={new Date().toLocaleDateString()} readOnly className="bg-slate-100 text-slate-500" />
                             <Input label="SLA End Date" value="Calculated based on Priority" readOnly className="bg-slate-100 text-slate-500" />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                             <Input label="Record Created" value={new Date().toLocaleString()} readOnly className="bg-slate-100 text-slate-500" />
                             <Input label="Last Modified" value={new Date().toLocaleString()} readOnly className="bg-slate-100 text-slate-500" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Hidden file input for resume upload */}
            <input
                type="file"
                ref={resumeInputRef}
                onChange={handleResumeFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
            />

            {/* Seal Audit & Submit */}
            <div className="flex justify-end items-center gap-4 mt-12 pt-8 border-t border-slate-200">
                <Button variant="secondary" className="h-12 px-8 bg-white border-slate-300 text-slate-600 font-bold tracking-wide hover:border-indigo-400 hover:text-indigo-600 transition-all">
                    Save Draft Artifact
                </Button>
                <Button variant="ghost" onClick={handleResumeUploadClick} className="h-12 px-8 text-indigo-600 font-bold tracking-wide hover:bg-indigo-50 transition-all">
                    <Upload className="w-4 h-4 mr-2" />
                    {selectedResumeName ? `Resume: ${selectedResumeName}` : 'Upload Resume'}
                </Button>
                <Button
                    className="h-12 px-8 bg-indigo-900 text-white shadow-xl shadow-indigo-900/30 hover:bg-indigo-800 hover:scale-[1.02] transition-all font-black tracking-wide uppercase text-xs"
                    onClick={handleSubmitArtifact}
                    isLoading={isSubmittingArtifact}
                >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Seal Audit & Submit Artifact
                </Button>
            </div>
        </div>
    );
};

const JobPostings: React.FC = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'GENERAL' | 'INTERNAL'>('GENERAL');
    const [locations, setLocations] = React.useState<string[]>(['']);
    const [jobs, setJobs] = React.useState<any[]>([]);
    const [selectedJob, setSelectedJob] = React.useState<any | null>(null);
    const [jobToDelete, setJobToDelete] = React.useState<any | null>(null);
    const [jobToEdit, setJobToEdit] = React.useState<any | null>(null);
    const [isCreatingJob, setIsCreatingJob] = React.useState(false);
    const [isDeletingJob, setIsDeletingJob] = React.useState(false);
    const [isUpdatingJob, setIsUpdatingJob] = React.useState(false);
    const [isPublishingDrafts, setIsPublishingDrafts] = React.useState(false);
    const [isGeneratingAiDocs, setIsGeneratingAiDocs] = React.useState(false);
    const [aiSummary, setAiSummary] = React.useState('');
    const [jobForm, setJobForm] = React.useState({
        title: '',
        dept: '',
        designation: '',
        budgetMin: '',
        budgetMax: '',
        description: '',
    });
    const [editJobForm, setEditJobForm] = React.useState({
        title: '',
        dept: '',
        description: '',
    });

    React.useEffect(() => {
        api.recruiter.getJobPostings()
          .then((data) => setJobs(data || []))
          .catch((err) => console.error('Failed to load jobs:', err));
    }, []);

    const reloadJobs = async () => {
        const data = await api.recruiter.getJobPostings();
        setJobs(data || []);
    };

    const handleAddLocation = () => {
        setLocations(prev => [...prev, '']);
    };

    const handleRemoveLocation = (index: number) => {
        if (locations.length > 1) {
            setLocations(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleLocationChange = (index: number, value: string) => {
        const newLocations = [...locations];
        newLocations[index] = value;
        setLocations(newLocations);
    };

    const openCreateModal = () => {
        setLocations(['']);
        setActiveTab('GENERAL');
        setAiSummary('');
        setJobForm({
            title: '',
            dept: '',
            designation: '',
            budgetMin: '',
            budgetMax: '',
            description: '',
        });
        setIsCreateModalOpen(true);
    };

    const handleCreatePosting = async () => {
        if (!jobForm.title.trim() || !jobForm.dept.trim()) {
            alert('Job title and department are required.');
            return;
        }

        setIsCreatingJob(true);
        try {
            const created = await api.jobs.create({
                title: jobForm.title.trim(),
                dept: jobForm.dept.trim(),
                description: jobForm.description.trim() || `${jobForm.title.trim()} role in ${jobForm.dept.trim()}.`,
                budgetMin: jobForm.budgetMin ? Number(jobForm.budgetMin) : undefined,
                budgetMax: jobForm.budgetMax ? Number(jobForm.budgetMax) : undefined,
                location: locations.filter(Boolean).join(', '),
                visibility: activeTab === 'INTERNAL' ? 'internal' : 'public',
            });

            setJobs(prev => [{
                id: created.id,
                title: created.title,
                summary: jobForm.description.trim() || `${jobForm.title.trim()} role in ${jobForm.dept.trim()}.`,
                dept: created.department,
                posted: new Date().toLocaleDateString(),
                status: created.status === 'OPEN' ? 'LIVE' : created.status,
            }, ...prev]);
            setIsCreateModalOpen(false);
        } catch (error) {
            console.error('Failed to create job posting:', error);
            alert(error instanceof Error ? error.message : 'Failed to create job posting');
        } finally {
            setIsCreatingJob(false);
        }
    };

    const handlePublishDrafts = async () => {
        setIsPublishingDrafts(true);
        try {
            const result = await api.recruiter.publishDraftJobs();
            await reloadJobs();
            alert(result?.message || 'Draft jobs published successfully');
        } catch (error) {
            console.error('Failed to publish drafts:', error);
            alert(error instanceof Error ? error.message : 'Failed to publish draft jobs');
        } finally {
            setIsPublishingDrafts(false);
        }
    };

    const handleAutomateSummaryAndJd = async () => {
        if (!jobForm.title.trim()) {
            alert('Enter the job title first to generate AI summary and JD.');
            return;
        }

        setIsGeneratingAiDocs(true);
        try {
            const generated = await api.jobs.generateDescription(jobForm.title.trim());
            setAiSummary(generated.summary || '');
            setJobForm((prev) => ({ ...prev, description: generated.description || prev.description }));
        } catch (error) {
            console.error('Failed to generate AI summary/JD:', error);
            alert(error instanceof Error ? error.message : 'Failed to generate AI summary and JD');
        } finally {
            setIsGeneratingAiDocs(false);
        }
    };

    const columns: Column<(typeof jobs)[0]>[] = [
         { key: 'id', label: 'Req ID', render: j => <span className="font-mono font-bold text-slate-500">{j.id}</span> },
         { key: 'title', label: 'Job Title', render: j => <span className="font-bold text-slate-800">{j.title}</span> },
         { key: 'dept', label: 'Department' },
         { key: 'posted', label: 'Posted Date' },
         { key: 'status', label: 'Status', render: j => <Badge color={j.status === 'LIVE' ? 'emerald' : 'slate'}>{j.status}</Badge> },
         { key: 'actions', label: 'Actions' }
    ];

    const handleTableAction = (action: string, job: (typeof jobs)[0]) => {
        if (action === 'view') {
            setSelectedJob(job);
            return;
        }
        if (action === 'edit') {
            setJobToDelete(job);
        }
    };

    const handleDeleteJob = async () => {
        if (!jobToDelete) return;
        setIsDeletingJob(true);
        try {
            await api.recruiter.deleteJobPosting(String(jobToDelete.id));
            setJobs((prev) => prev.filter((j) => String(j.id) !== String(jobToDelete.id)));
            setJobToDelete(null);
            alert('Job deleted successfully');
        } catch (error) {
            console.error('Failed to delete job:', error);
            alert(error instanceof Error ? error.message : 'Failed to delete job');
        } finally {
            setIsDeletingJob(false);
        }
    };

    const openEditJobModal = () => {
        if (!jobToDelete) return;
        setEditJobForm({
            title: jobToDelete.title || '',
            dept: jobToDelete.dept || '',
            description: jobToDelete.summary || '',
        });
        setJobToEdit(jobToDelete);
        setJobToDelete(null);
    };

    const handleUpdateJob = async () => {
        if (!jobToEdit) return;
        if (!editJobForm.title.trim() || !editJobForm.dept.trim()) {
            alert('Job title and department are required.');
            return;
        }

        setIsUpdatingJob(true);
        try {
            await api.recruiter.updateJobPosting(String(jobToEdit.id), {
                title: editJobForm.title.trim(),
                dept: editJobForm.dept.trim(),
                description: editJobForm.description.trim(),
            });
            await reloadJobs();
            setJobToEdit(null);
            alert('Job updated successfully');
        } catch (error) {
            console.error('Failed to update job:', error);
            alert(error instanceof Error ? error.message : 'Failed to update job');
        } finally {
            setIsUpdatingJob(false);
        }
    };

    const renderCreateForm = () => (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-[1.5rem] w-fit">
                <button
                    onClick={() => setActiveTab('GENERAL')}
                    className={`px-6 py-3 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === 'GENERAL' ? 'bg-white shadow-sm text-indigo-900' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    General Requisition Info
                </button>
                <button
                    onClick={() => setActiveTab('INTERNAL')}
                    className={`px-6 py-3 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === 'INTERNAL' ? 'bg-white shadow-sm text-indigo-900' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    Internal (IJP) Eligibility
                </button>
            </div>

            {activeTab === 'GENERAL' && (
                <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                    {/* Module 1: Job Identity & Visibility */}
                    <Card title="Module 1: Job Identity & Visibility">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            <Input
                                label="Job Title"
                                placeholder="e.g. Principal Architect"
                                value={jobForm.title}
                                onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                            />
                            <Input
                                label="Designation"
                                placeholder="Internal Designation"
                                value={jobForm.designation}
                                onChange={(e) => setJobForm(prev => ({ ...prev, designation: e.target.value }))}
                            />
                            <Input
                                label="Department"
                                placeholder="e.g. Engineering"
                                value={jobForm.dept}
                                onChange={(e) => setJobForm(prev => ({ ...prev, dept: e.target.value }))}
                            />
                            
                            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                <Input
                                    label="Annual Budget (Min)"
                                    placeholder="Min Fixed CTC"
                                    type="number"
                                    value={jobForm.budgetMin}
                                    onChange={(e) => setJobForm(prev => ({ ...prev, budgetMin: e.target.value }))}
                                />
                                <Input
                                    label="Annual Budget (Max)"
                                    placeholder="Max Fixed CTC"
                                    type="number"
                                    value={jobForm.budgetMax}
                                    onChange={(e) => setJobForm(prev => ({ ...prev, budgetMax: e.target.value }))}
                                />
                            </div>
                            
                            <Select 
                                label="No of Positions" 
                                options={['1', '2', '3', '5', '6', '7', '8', '9', '10', '11', '12', '15', '20', '25', '30', '40', '50']} 
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                             <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Visibility Logic</label>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Internal job posting only', desc: 'Visible for 1 week (Existing employees)', icon: Lock },
                                        { label: 'External job posting only', desc: 'Visible for 2 weeks (Outside market)', icon: Globe },
                                        { label: 'Both Internal & External', desc: 'Parallel sourcing activated', icon: Users },
                                    ].map((opt, idx) => (
                                        <label key={idx} className="flex items-start p-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                                            <input type="radio" name="visibility" className="mt-1 accent-indigo-600" />
                                            <div className="ml-3">
                                                <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                    <opt.icon className="w-4 h-4 text-slate-400" />
                                                    {opt.label}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                             </div>

                             <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Source of Profile Channels</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Agency', 'Employee Referral', 'Job Portal', 'Campus', 'Job Fair', 'Company Website', 'Social Media', 'Print Media'].map(channel => (
                                        <label key={channel} className="flex items-center space-x-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300">
                                            <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300" />
                                            <span className="text-xs font-bold text-slate-700">{channel}</span>
                                        </label>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </Card>

                    {/* Module 2: AI Automated Documentation */}
                    <Card title="Module 2: AI Automated Documentation">
                        <div className="flex justify-end mb-4">
                            <Button
                                type="button"
                                className="bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 text-xs"
                                onClick={handleAutomateSummaryAndJd}
                                disabled={isGeneratingAiDocs}
                                isLoading={isGeneratingAiDocs}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Automate Summary & JD
                            </Button>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Job Summary (AI-Automated)</label>
                                <textarea
                                    className="w-full h-24 bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                    placeholder="AI will generate summary here..."
                                    value={aiSummary}
                                    onChange={(e) => setAiSummary(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Enhanced Job Description (AI-Automated)</label>
                                <textarea
                                    className="w-full h-40 bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                    placeholder="Detailed responsibilities and requirements will appear here..."
                                    value={jobForm.description}
                                    onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                                ></textarea>
                            </div>
                        </div>
                    </Card>

                    {/* Module 3: Vetting Framework */}
                    <Card title="Module 3: Vetting Framework">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Select label="Required Education" options={['Premier Institute', 'Others', 'Any']} />
                            <Input label="Required Technical Skills" placeholder="Comma separated (e.g. React, Node, AWS)" className="md:col-span-2" />
                            <Select label="Min Exp (Yrs)" options={['Fresher', '<1', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '14', '15', '16', '18', '20', '20+']} />
                            <Select label="Max Exp (Yrs)" options={['Fresher', '<1', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '14', '15', '16', '18', '20', '20+']} />
                            
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Location of Work</label>
                                    <Button type="button" variant="secondary" className="text-xs h-8 px-3" onClick={handleAddLocation}>
                                        <UserPlus className="w-4 h-4 mr-1"/> Add
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {locations.map((location, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                placeholder={`Location #${index + 1} (e.g. City, Country)`}
                                                value={location}
                                                onChange={(e) => handleLocationChange(index, e.target.value)}
                                                className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-[2rem] focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4 placeholder-slate-400 transition-all"
                                            />
                                            {locations.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveLocation(index)}
                                                    className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-full transition-colors flex-shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <Input label="Travel Requirement %" placeholder="0-100" type="number" />
                        </div>
                    </Card>

                    {/* Module 4: Working Logistics & Preferences */}
                    <Card title="Module 4: Working Logistics & Preferences">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                             <Select label="Working Type" options={['Work from office', 'Work from home', 'Hybrid', 'Freelancer', 'Contractual', 'Gig work', 'Part-time', 'Intern']} />
                             <Select label="Working Hours" options={['Regular shift', 'Night shift', 'Rotational shift']} />
                             <Select label="Weekly Working Days" options={['4 Days', '5 Days', '6 Days']} />
                             <Select label="Transport Provided" options={['Co provided', 'Subsidised', 'Own arrangement']} />
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Gender Diversity Requirement</label>
                                <div className="flex flex-wrap gap-3">
                                    {['Male', 'Female', 'Transgender', 'Any'].map(g => (
                                        <label key={g} className="flex items-center space-x-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300">
                                            <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300" />
                                            <span className="text-xs font-bold text-slate-700">{g}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                             <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Joining Time Preferred</label>
                                <div className="flex flex-wrap gap-3">
                                    {['Immediate Joiners', '<30 days', '2 months', '3 months'].map(t => (
                                        <label key={t} className="flex items-center space-x-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300">
                                            <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300" />
                                            <span className="text-xs font-bold text-slate-700">{t}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                         </div>
                    </Card>
                </div>
            )}

            {activeTab === 'INTERNAL' && (
                <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                    <div className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-start gap-4">
                        <div className="p-3 bg-white rounded-full text-amber-600 shadow-sm">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-wide text-amber-800">Internal Job Posting (IJP) Compliance</h3>
                            <p className="text-xs font-medium text-amber-700 mt-1 leading-relaxed max-w-2xl">
                                Specify eligibility criteria for existing employees. These values will be cross-referenced with the internal HRMS database during the application audit. 
                                Ensure alignment with corporate policy section 4.2.
                            </p>
                        </div>
                    </div>

                    <Card title="Eligibility Criteria">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <Input label="Minimum experience in current role (Months)" type="number" placeholder="e.g. 18" />
                            <Input label="Hometown Requirement / Preference" placeholder="City Name" />
                        </div>

                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Performance Rating Matrix (Min Required)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Select label="Last Performance Rating" options={['1', '2', '3', '4', '5']} />
                                <Select label="Previous Performance Rating" options={['1', '2', '3', '4', '5']} />
                                <Select label="Prev to Prev Rating" options={['1', '2', '3', '4', '5']} />
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end items-center gap-4 pt-6 border-t border-slate-200 mt-8">
                <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel Draft</Button>
                <Button
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
                    onClick={handleCreatePosting}
                    isLoading={isCreatingJob}
                >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finalize & Publish
                </Button>
            </div>
        </div>
    );

    return (
         <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Job Posting Engine</h2>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" onClick={handlePublishDrafts} isLoading={isPublishingDrafts}>
                        Publish All Drafts
                    </Button>
                    <Button onClick={openCreateModal}>+ Create Posting</Button>
                </div>
            </div>
            <Card>
                <DataTable data={jobs} columns={columns} onAction={handleTableAction} />
            </Card>

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Requisition">
                {renderCreateForm()}
            </Modal>

            <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title="Job Summary">
                {selectedJob && (
                    <div className="space-y-6">
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Requisition ID</div>
                            <div className="font-mono font-black text-slate-700 mt-1">{selectedJob.id}</div>
                            <div className="text-xl font-black text-slate-900 mt-3">{selectedJob.title}</div>
                            <div className="text-sm font-bold text-slate-500 mt-1">{selectedJob.dept}</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-white border border-slate-200 rounded-xl">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</div>
                                <div className="mt-2"><Badge color={selectedJob.status === 'LIVE' ? 'emerald' : 'slate'}>{selectedJob.status}</Badge></div>
                            </div>
                            <div className="p-4 bg-white border border-slate-200 rounded-xl">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Posted On</div>
                                <div className="mt-2 text-sm font-bold text-slate-700">{selectedJob.posted || '-'}</div>
                            </div>
                            <div className="p-4 bg-white border border-slate-200 rounded-xl">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department</div>
                                <div className="mt-2 text-sm font-bold text-slate-700">{selectedJob.dept || '-'}</div>
                            </div>
                        </div>

                        <div className="p-5 bg-white border border-slate-200 rounded-2xl">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Summary</div>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {selectedJob.summary || 'No summary available for this job.'}
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={reloadJobs}>Refresh List</Button>
                            <Button onClick={() => setSelectedJob(null)}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={!!jobToDelete} onClose={() => setJobToDelete(null)} title="Job Actions">
                {jobToDelete && (
                    <div className="space-y-6">
                        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl">
                            <div className="text-[10px] font-black uppercase tracking-widest text-rose-500">Manage Posting</div>
                            <p className="text-sm text-rose-700 mt-2">
                                Choose what to do with <span className="font-black">{jobToDelete.title}</span> ({jobToDelete.id}).
                            </p>
                            <p className="text-xs text-rose-600 mt-2">Delete is irreversible. Edit updates title, department, and summary.</p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setJobToDelete(null)}>Cancel</Button>
                            <Button onClick={openEditJobModal}>Edit Job</Button>
                            <Button variant="danger" onClick={handleDeleteJob} isLoading={isDeletingJob}>Delete Job</Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={!!jobToEdit} onClose={() => setJobToEdit(null)} title="Edit Job Posting">
                {jobToEdit && (
                    <div className="space-y-6">
                        <Input
                            label="Job Title"
                            value={editJobForm.title}
                            onChange={(e) => setEditJobForm((prev) => ({ ...prev, title: e.target.value }))}
                        />
                        <Input
                            label="Department"
                            value={editJobForm.dept}
                            onChange={(e) => setEditJobForm((prev) => ({ ...prev, dept: e.target.value }))}
                        />
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Job Summary</label>
                            <textarea
                                className="w-full h-40 bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                value={editJobForm.description}
                                onChange={(e) => setEditJobForm((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="Update job summary..."
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setJobToEdit(null)}>Cancel</Button>
                            <Button onClick={handleUpdateJob} isLoading={isUpdatingJob}>Save Changes</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const MPRHandling: React.FC = () => {
    const [summaryModalOpen, setSummaryModalOpen] = React.useState(false);
    const [summaryData, setSummaryData] = React.useState<{mprId: string, role: string, stage: string, count: number, candidates: any[]} | null>(null);
    const [mprs, setMprs] = React.useState<any[]>([]);

    React.useEffect(() => {
        api.recruiter.getMprs()
          .then((data) => setMprs(data || []))
          .catch((err) => console.error('Failed to load MPRs:', err));
    }, []);

    const handleToggleFreeze = async (id: string) => {
        const target = mprs.find((mpr) => mpr.id === id);
        if (!target) return;

        const nextStatus = target.freezeProtocol === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
        try {
            await api.recruiter.updateMprStatus(id, nextStatus);
            setMprs(prevMprs => prevMprs.map(mpr =>
                mpr.id === id
                    ? { ...mpr, freezeProtocol: nextStatus }
                    : mpr
            ));
        } catch (error) {
            console.error('Failed to update MPR status:', error);
            alert(error instanceof Error ? error.message : 'Failed to update MPR status');
        }
    };

    const handleStageClick = (mpr: (typeof mprs)[0], stage: string, count: number) => {
        setSummaryData({ mprId: mpr.id, role: mpr.jobRole, stage, count, candidates: [] });
        setSummaryModalOpen(true);
    };

    const columns: Column<(typeof mprs)[0]>[] = [
        { key: 'jobRole', label: 'Job Role & ID', render: m => (
            <div>
                <div className="font-bold text-slate-800">{m.jobRole}</div>
                <div className="text-xs font-mono text-slate-400">{m.id}</div>
            </div>
        )},
        { key: 'manager', label: 'Hiring Manager' },
        { key: 'mprDate', label: 'MPR Date' },
        { key: 'targetDate', label: 'Target Date' },
        { key: 'daysLeft', label: 'Days Left', render: m => {
            const color = m.daysLeft < 0 ? 'text-rose-600' : m.daysLeft < 15 ? 'text-amber-600' : 'text-emerald-600';
            return <span className={`font-bold text-center block ${color}`}>{m.daysLeft}</span>;
        }},
        { key: 'freezeProtocol', label: 'Freeze Protocol', render: m => {
            const isFrozen = m.freezeProtocol === 'FROZEN';
            return (
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleToggleFreeze(m.id)}>
                    <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isFrozen ? 'bg-rose-600' : 'bg-emerald-500'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isFrozen ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className={`text-xs font-bold whitespace-nowrap ${isFrozen ? 'text-rose-600' : 'text-slate-600'}`}>
                        {isFrozen ? 'Freeze Active' : 'Operational'}
                    </span>
                </div>
            );
        }},
        ...(['profilesInHand', 'interviewsScheduled', 'toBeScheduled', 'selection', 'rejected', 'onHold'] as const).map(key => ({
            key: key as any,
            label: key.replace(/([A-Z])/g, ' $1').replace('Hand', 'Hand.').replace('Scheduled', 'Sched.').trim(),
            render: (m: (typeof mprs)[0]) => (
                <button 
                    onClick={() => handleStageClick(m, key, m[key])}
                    className="w-full text-center font-bold text-indigo-600 hover:scale-125 transition-transform"
                >
                    {m[key]}
                </button>
            )
        })),
    ];

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Manpower Requisition Handling</h2>
            <Card>
                <DataTable data={mprs} columns={columns} />
            </Card>

            <Modal isOpen={summaryModalOpen} onClose={() => setSummaryModalOpen(false)} title="MPR Stage Drill-Down">
                 {summaryData && (
                    <div className="space-y-6">
                        <div className="bg-indigo-50 rounded-2xl p-6">
                            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Requisition Context</div>
                            <div className="text-lg font-black text-indigo-900">{summaryData.role} <span className="font-mono text-sm text-indigo-500">{summaryData.mprId}</span></div>
                            <div className="mt-2">
                                <Badge color="amber">{summaryData.stage.replace(/([A-Z])/g, ' $1').trim()}: {summaryData.count} Candidates</Badge>
                            </div>
                        </div>

                        {summaryData.count === 0 ? (
                            <div className="py-12 text-center text-slate-400">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-wide">No candidate artifacts in this stage</p>
                            </div>
                        ) : summaryData.candidates.length > 0 ? (
                            <div className="space-y-3">
                                {summaryData.candidates.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">{c.name.charAt(0)}</div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                                                <div className="text-[10px] font-mono text-slate-400">{c.id}</div>
                                            </div>
                                        </div>
                                        <div className="text-sm font-bold text-emerald-600">{c.score}% Match</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-slate-500 text-sm font-medium">
                                Candidate-level details for this stage are available in Candidate Artifact Repository.
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

const CandidateDirectory: React.FC = () => {
  const [candidates, setCandidates] = React.useState<CandidateArtifact[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedCandidate, setSelectedCandidate] = React.useState<CandidateArtifact | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const [isUpdatingDecision, setIsUpdatingDecision] = React.useState(false);
  const [scanResult, setScanResult] = React.useState<{score: number, summary: string} | null>(null);
  const [isResumeModalOpen, setIsResumeModalOpen] = React.useState(false);
  const [viewedResume, setViewedResume] = React.useState<CandidateArtifact | null>(null);
  const [candidateToManage, setCandidateToManage] = React.useState<CandidateArtifact | null>(null);
  const [isDeletingCandidate, setIsDeletingCandidate] = React.useState(false);
  const apiBaseUrl = ((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

  const loadCandidates = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.recruiter.getCandidates();
      setCandidates(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleScreening = async (candidate: CandidateArtifact) => {
    setSelectedCandidate(candidate);
    setIsScanning(true);
    setScanResult(null);
    try {
      const result = await api.recruiter.screenCandidate(candidate.id);
      setScanResult(result);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDecision = async (status: 'shortlisted' | 'rejected') => {
    if (!selectedCandidate) return;
    setIsUpdatingDecision(true);
    try {
      await api.recruiter.updateCandidateStatus(selectedCandidate.id, status);
      await loadCandidates();
      alert(`Candidate ${status === 'shortlisted' ? 'shortlisted' : 'rejected'} successfully.`);
      setSelectedCandidate(null);
      setScanResult(null);
    } catch (error) {
      console.error('Failed to update candidate status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update candidate status');
    } finally {
      setIsUpdatingDecision(false);
    }
  };

  const handleDeleteCandidate = async () => {
    if (!candidateToManage) return;
    setIsDeletingCandidate(true);
    try {
      await api.recruiter.deleteCandidate(candidateToManage.id);
      await loadCandidates();
      alert('Candidate deleted successfully.');
      setCandidateToManage(null);
    } catch (error) {
      console.error('Failed to delete candidate:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete candidate');
    } finally {
      setIsDeletingCandidate(false);
    }
  };

  const handleViewResume = (candidate: CandidateArtifact) => {
    setViewedResume(candidate);
    setIsResumeModalOpen(true);
  };

  const getResumeUrl = (candidate: CandidateArtifact | null): string => {
    if (!candidate?.resumeContent) return '';
    if (/^https?:\/\//i.test(candidate.resumeContent)) {
      return candidate.resumeContent;
    }
    const path = candidate.resumeContent.startsWith('/') ? candidate.resumeContent : `/${candidate.resumeContent}`;
    return `${apiBaseUrl}${path}`;
  };

  const handleExport = () => {
    if (!candidates.length) return;

    const headers = [
      "Slno",
      "Full Name",
      "Email",
      "Role Applied",
      "Total EXP (yrs)",
      "Current CTC",
      "Notice Period (days)",
      "Aadhaar Status",
      "PAN Status",
    ];

    const csvRows = candidates.map((c, index) => [
      index + 1,
      `"${c.name.replace(/"/g, '""')}"`, // Escape quotes
      `"${c.email}"`,
      `"${c.roleApplied.replace(/"/g, '""')}"`,
      c.totalExp,
      c.currentCtc,
      c.noticePeriod,
      c.aadhaarStatus,
      c.panStatus,
    ].join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "hirepulse_candidates.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const VaultStatus: React.FC<{status: 'VERIFIED' | 'PENDING' | 'MISSING'}> = ({ status }) => {
    const config = {
      VERIFIED: { icon: ShieldCheck, color: 'text-emerald-500', label: 'Verified' },
      PENDING: { icon: Clock, color: 'text-amber-500', label: 'Pending' },
      MISSING: { icon: XCircle, color: 'text-rose-500', label: 'Missing' },
    };
    const { icon: Icon, color, label } = config[status];
    return (
      <div className={`flex items-center gap-2 text-xs font-bold ${color}`}>
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
    );
  };

  const columns: Column<CandidateArtifact>[] = [
    { key: 'id', label: 'Slno', sticky: true, width: '120px', render: (c, index) => <span className="font-mono font-bold text-slate-500">{index + 1}</span> },
    { key: 'id', label: 'Candidate ID', sticky: true, width: '160px', render: c => <span className="font-mono font-bold text-indigo-700">{c.id}</span> },
    { key: 'name', label: 'Full Name', sticky: true, width: '200px', render: c => <span className="font-bold text-slate-800">{c.name}</span> },
    { key: 'roleApplied', label: 'Role Applied', render: c => <span className="font-semibold text-slate-700">{c.roleApplied || '-'}</span> },
    { key: 'status', label: 'Status', render: c => {
        const statusColors: Record<string, 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate'> = {
            APPLIED: 'slate',
            VETTING: 'amber',
            SHORTLISTED: 'indigo',
            INTERVIEW: 'indigo',
            OFFER: 'emerald',
            JOINED: 'emerald',
            REJECTED: 'rose',
        };
        return <Badge color={statusColors[c.status] || 'slate'}>{c.status}</Badge>;
    }},
    { key: 'totalExp', label: 'Total EXP', render: c => <span className="font-bold">{c.totalExp} yrs</span> },
    { key: 'currentCtc', label: 'Current CTC', render: c => <span className="font-mono">${c.currentCtc.toLocaleString()}</span> },
    { key: 'noticePeriod', label: 'Notice', render: c => `${c.noticePeriod} days` },
    { key: 'aadhaarStatus', label: 'Aadhaar Vault', render: c => <VaultStatus status={c.aadhaarStatus} /> },
    { key: 'panStatus', label: 'PAN Artifact', render: c => <VaultStatus status={c.panStatus} /> },
    { key: 'resumeContent', label: 'Resume', render: c => (
        <Button variant="secondary" className="h-8 text-xs flex items-center gap-2" onClick={() => handleViewResume(c)}>
            <Eye className="w-3 h-3"/> View
        </Button>
    )},
    { key: 'actions', label: 'Actions' }
  ];

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
        <div className="flex justify-between items-center">
             <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Candidate Artifact Repository</h2>
             <div className="flex gap-4">
                 <Input label="Search" placeholder="Search candidates" className="w-64" />
                 <Button onClick={handleExport}><Download className="w-4 h-4 mr-2" /> Export</Button>
             </div>
        </div>
        <Card>
            <DataTable 
                data={candidates} 
                columns={columns} 
                isLoading={isLoading}
                onAction={(action, item) => {
                    if (action === 'view') handleScreening(item);
                    if (action === 'edit') setCandidateToManage(item);
                }}
            />
        </Card>

        {/* AI Screening Modal */}
        <Modal 
            isOpen={!!selectedCandidate} 
            onClose={() => setSelectedCandidate(null)} 
            title="Artifact Screening: Section 12"
        >
            {selectedCandidate && (
            <div className="space-y-8">
                <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-400">
                    {selectedCandidate.name.charAt(0)}
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-800">{selectedCandidate.name}</h3>
                    <p className="text-slate-500 font-medium">{selectedCandidate.roleApplied} • {selectedCandidate.id}</p>
                    <div className="flex space-x-2 mt-2">
                    {selectedCandidate.skillDna.map(skill => (
                        <span key={skill} className="px-2 py-1 bg-slate-100 text-[10px] font-bold text-slate-600 rounded-md uppercase">{skill}</span>
                    ))}
                    </div>
                </div>
                </div>

                <div className="bg-slate-900 rounded-[2rem] p-8 relative overflow-hidden text-white min-h-[300px]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 blur-[80px] opacity-20 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600 blur-[80px] opacity-20 rounded-full"></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> AI Evaluation Protocol
                    </h4>
                    {isScanning && <SyncIndicator isSyncing={true} />}
                    </div>

                    {isScanning ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-6">
                        <div className="relative w-24 h-24">
                        <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-indigo-400 rounded-full animate-spin"></div>
                        <div className="absolute inset-4 bg-indigo-500/20 rounded-full blur-md animate-pulse"></div>
                        </div>
                        <p className="text-indigo-200 font-mono text-sm animate-pulse">Analyzing Resume Artifact...</p>
                    </div>
                    ) : scanResult ? (
                    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                        <div className="flex items-center space-x-4">
                        <div className="text-5xl font-black text-white">{scanResult.score}</div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Match Score</span>
                            <span className="text-sm text-slate-300">Based on Skill DNA & Exp.</span>
                        </div>
                        </div>
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                        <p className="text-slate-300 leading-relaxed">{scanResult.summary}</p>
                        </div>
                        <div className="flex space-x-4">
                        <Button variant="secondary" className="flex-1" onClick={() => handleViewResume(selectedCandidate)}>
                            <Eye className="w-4 h-4 mr-2" /> View Resume
                        </Button>
                        <Button
                            variant="primary"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                            onClick={() => handleDecision('shortlisted')}
                            isLoading={isUpdatingDecision}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" /> Shortlist Artifact
                        </Button>
                        <Button
                            variant="danger"
                            className="flex-1"
                            onClick={() => handleDecision('rejected')}
                            isLoading={isUpdatingDecision}
                        >
                            <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                        </div>
                    </div>
                    ) : null}
                </div>
                </div>
            </div>
            )}
        </Modal>

        {/* Resume Viewer Modal */}
        <Modal isOpen={isResumeModalOpen} onClose={() => setIsResumeModalOpen(false)} title="Resume Artifact">
            {viewedResume && (
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-black flex items-center justify-center text-lg">{viewedResume.name.charAt(0)}</div>
                        <div>
                            <h3 className="font-black text-slate-800">{viewedResume.name}</h3>
                            <p className="text-xs font-mono text-slate-400">{viewedResume.id}</p>
                        </div>
                    </div>
                    {getResumeUrl(viewedResume) ? (
                        <div className="space-y-3">
                            <iframe
                                src={getResumeUrl(viewedResume)}
                                className="w-full h-[60vh] rounded-2xl border border-slate-200 bg-white"
                                title="Candidate Resume"
                            />
                            <div className="flex justify-end">
                                <a href={getResumeUrl(viewedResume)} target="_blank" rel="noreferrer">
                                    <Button variant="secondary">Open In New Tab</Button>
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200 text-sm font-medium">
                            Resume not uploaded for this candidate.
                        </div>
                    )}
                </div>
            )}
        </Modal>

        <Modal isOpen={!!candidateToManage} onClose={() => setCandidateToManage(null)} title="Candidate Actions">
            {candidateToManage && (
                <div className="space-y-6">
                    <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl">
                        <div className="text-[10px] font-black uppercase tracking-widest text-rose-500">Manage Candidate</div>
                        <p className="text-sm text-rose-700 mt-2">
                            You are managing <span className="font-black">{candidateToManage.name || 'this candidate'}</span> ({candidateToManage.id}).
                        </p>
                        <p className="text-xs text-rose-600 mt-2">Delete will remove candidate profile and associated pipeline records.</p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setCandidateToManage(null)}>Cancel</Button>
                        <Button variant="danger" onClick={handleDeleteCandidate} isLoading={isDeletingCandidate}>Delete Candidate</Button>
                    </div>
                </div>
            )}
        </Modal>
    </div>
  );
};

const Interviews: React.FC = () => {
    const [isHubOpen, setIsHubOpen] = React.useState(false);
    const [selectedEvalCandidate, setSelectedEvalCandidate] = React.useState<any>(null);
    const [interviews, setInterviews] = React.useState<any[]>([]);
    const [viewedInterview, setViewedInterview] = React.useState<any | null>(null);
    const [interviewToDelete, setInterviewToDelete] = React.useState<any | null>(null);
    const [isDeletingInterview, setIsDeletingInterview] = React.useState(false);

    const loadInterviews = React.useCallback(() => {
        api.recruiter.getInterviews()
          .then((data) => setInterviews(data || []))
          .catch((err) => console.error('Failed to load interviews:', err));
    }, []);

    React.useEffect(() => {
        loadInterviews();
    }, []);

    const handleJoinDetails = (interview: any) => {
        setSelectedEvalCandidate(interview);
        setIsHubOpen(true);
    };

    const columns: Column<(typeof interviews)[0]>[] = [
        { key: 'id', label: 'Interview ID', render: i => <span className="font-mono font-bold text-slate-500">{i.id}</span> },
        { key: 'candidateId', label: 'Candidate ID', render: i => <span className="font-mono font-bold text-indigo-700">{i.candidateId}</span> },
        { key: 'candidate', label: 'Candidate Name', render: i => <span className="font-bold text-slate-800">{i.candidate}</span> },
        { key: 'round', label: 'Round Type' },
        { key: 'time', label: 'Scheduled Time' },
        { key: 'panel', label: 'Panel Members' },
        { key: 'mode', label: 'Mode', render: i => <Badge color={i.mode === 'Virtual' ? 'indigo' : 'emerald'}>{i.mode}</Badge> },
        { key: 'actions', label: 'Actions' }
    ];

    const handleTableAction = (action: string, interview: any) => {
        if (action === 'view') {
            setViewedInterview(interview);
            return;
        }
        if (action === 'edit') {
            setInterviewToDelete(interview);
        }
    };

    const handleDeleteInterview = async () => {
        if (!interviewToDelete) return;
        setIsDeletingInterview(true);
        try {
            await api.recruiter.deleteInterview(String(interviewToDelete.id));
            await loadInterviews();
            setInterviewToDelete(null);
        } catch (error) {
            console.error('Failed to delete interview:', error);
            alert(error instanceof Error ? error.message : 'Failed to delete interview');
        } finally {
            setIsDeletingInterview(false);
        }
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Interview Selection Hub</h2>
                <Button onClick={() => setIsHubOpen(true)}>
                    <FilePenLine className="w-4 h-4 mr-2"/>
                    Enter Evaluation Hub
                </Button>
            </div>
            <Card>
                <DataTable data={interviews} columns={columns} onAction={handleTableAction} />
            </Card>

            <Modal
                isOpen={isHubOpen}
                onClose={() => { setIsHubOpen(false); setSelectedEvalCandidate(null); }}
                title={!selectedEvalCandidate ? "Select Candidate for Evaluation" : `Evaluation Hub: ${selectedEvalCandidate.candidate}`}
            >
                {!selectedEvalCandidate ? (
                    <CandidateSelection onSelect={(candidate) => setSelectedEvalCandidate(candidate)} interviews={interviews} />
                ) : (
                    <EvaluationHub candidate={selectedEvalCandidate} onBack={() => setSelectedEvalCandidate(null)} />
                )}
            </Modal>

            <Modal isOpen={!!viewedInterview} onClose={() => setViewedInterview(null)} title="Candidate Summary">
                {viewedInterview && (
                    <div className="space-y-5">
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interview ID</div>
                            <div className="font-mono font-black text-slate-700 mt-1">{viewedInterview.id}</div>
                            <div className="text-xl font-black text-slate-900 mt-3">{viewedInterview.candidate}</div>
                            <div className="text-sm font-mono text-indigo-700 mt-1">Candidate ID: {viewedInterview.candidateId}</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-white border border-slate-200 rounded-xl">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Round</div>
                                <div className="mt-2 text-sm font-bold text-slate-700">{viewedInterview.round}</div>
                            </div>
                            <div className="p-4 bg-white border border-slate-200 rounded-xl">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduled Time</div>
                                <div className="mt-2 text-sm font-bold text-slate-700">{viewedInterview.time}</div>
                            </div>
                            <div className="p-4 bg-white border border-slate-200 rounded-xl">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Panel</div>
                                <div className="mt-2 text-sm font-bold text-slate-700">{viewedInterview.panel || '-'}</div>
                            </div>
                            <div className="p-4 bg-white border border-slate-200 rounded-xl">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mode / Status</div>
                                <div className="mt-2 flex gap-2">
                                    <Badge color={viewedInterview.mode === 'Virtual' ? 'indigo' : 'emerald'}>{viewedInterview.mode}</Badge>
                                    <Badge color="slate">{String(viewedInterview.status || '').toUpperCase()}</Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => handleJoinDetails(viewedInterview)}>Open Evaluation Hub</Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={!!interviewToDelete} onClose={() => setInterviewToDelete(null)} title="Delete Interview">
                {interviewToDelete && (
                    <div className="space-y-6">
                        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl">
                            <div className="text-[10px] font-black uppercase tracking-widest text-rose-500">Confirm Deletion</div>
                            <p className="text-sm text-rose-700 mt-2">
                                Delete interview <span className="font-black">{interviewToDelete.id}</span> for candidate{' '}
                                <span className="font-black">{interviewToDelete.candidate}</span> (ID {interviewToDelete.candidateId})?
                            </p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setInterviewToDelete(null)}>Cancel</Button>
                            <Button variant="danger" onClick={handleDeleteInterview} isLoading={isDeletingInterview}>Delete Interview</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

// --- Evaluation Hub Components ---
const CandidateSelection: React.FC<{onSelect: (candidate: any) => void, interviews: any[]}> = ({ onSelect, interviews }) => (
    <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Select Candidate for Evaluation</h2>
        {interviews.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-sm font-medium">
                No candidates available for interview evaluation yet. Shortlist candidates first and reopen this hub.
            </div>
        ) : (
        <div className="space-y-3">
            {interviews.map(interview => (
                <div 
                    key={interview.id}
                    onClick={() => onSelect(interview)}
                    className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                >
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                            {interview.candidate.charAt(0)}
                        </div>
                        <div>
                            <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-600">{interview.candidate}</div>
                            <div className="text-[10px] font-mono text-slate-400">{interview.id} • {interview.round}</div>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
            ))}
        </div>
        )}
    </div>
);

const initialPanelState = { id: 1, memberId: '', memberName: '', designation: '', rating: '', outcome: '', remarks: '' };
const initialRoundState = { communicationMode: '', scheduled: '', startTime: '', endTime: '', panels: [initialPanelState] };

const EvaluationHub: React.FC<{candidate: any, onBack: () => void}> = ({ candidate, onBack }) => {
    const [activeTab, setActiveTab] = React.useState('round1');
    const [round1Data, setRound1Data] = React.useState(initialRoundState);
    const [round2Data, setRound2Data] = React.useState(initialRoundState);
    const [finalData, setFinalData] = React.useState(initialRoundState);
    const [isSubmittingEvaluation, setIsSubmittingEvaluation] = React.useState(false);

    const tabs = [
        { id: 'round1', label: 'Round 1: Screening' },
        { id: 'round2', label: 'Round 2: Technical' },
        { id: 'final', label: 'Final/HR' }
    ];

    const isFinalRound = activeTab === 'final';

    const getCurrentData = () => {
        if (activeTab === 'round1') return round1Data;
        if (activeTab === 'round2') return round2Data;
        return finalData;
    };

    const setCurrentData = (data: any) => {
        if (activeTab === 'round1') setRound1Data(data);
        else if (activeTab === 'round2') setRound2Data(data);
        else setFinalData(data);
    };

    const handleAbortEvaluation = () => {
        setActiveTab('round1');
        setRound1Data(initialRoundState);
        setRound2Data(initialRoundState);
        setFinalData(initialRoundState);
        onBack();
    };

    const handleNextRound = () => {
        setActiveTab((prev) => (prev === 'round1' ? 'round2' : prev === 'round2' ? 'final' : 'final'));
    };

    const handleFinalizeEvaluation = async () => {
        const finalPanel = finalData.panels[0];
        if (!candidate?.id || !candidate?.candidateId) {
            alert('Invalid interview context. Please reopen Evaluation Hub.');
            return;
        }

        setIsSubmittingEvaluation(true);
        try {
            await api.recruiter.submitInterviewEvaluation({
                interviewId: Number(candidate.id),
                candidateId: Number(candidate.candidateId),
                overallRating: 4,
                outcome: (finalPanel?.outcome || 'SELECTED').toLowerCase(),
                feedback: finalPanel?.remarks?.trim() || 'Evaluation submitted from recruiter panel.',
                recommendation: finalPanel?.outcome || 'SELECTED',
            });
            alert('Interview evaluation submitted successfully.');
            onBack();
        } catch (error) {
            console.error('Failed to submit interview evaluation:', error);
            alert(error instanceof Error ? error.message : 'Failed to submit interview evaluation');
        } finally {
            setIsSubmittingEvaluation(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <button onClick={onBack} className="text-xs font-bold text-slate-500 hover:text-indigo-600 mb-2">&larr; Back to Selection</button>
                    <h2 className="text-xl font-black text-slate-800">{candidate.candidate}</h2>
                    <p className="text-sm text-slate-500 font-mono">{candidate.id}</p>
                </div>
                <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-[1.5rem] w-fit mt-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.id ? 'bg-white shadow-sm text-indigo-900' : 'text-slate-500 hover:bg-slate-200/50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <EvaluationRoundPanel 
                key={activeTab} // Force re-render on tab change
                roundTitle={tabs.find(t => t.id === activeTab)?.label || ''}
                data={getCurrentData()}
                onChange={setCurrentData}
                isFinal={isFinalRound}
                onFinalize={handleFinalizeEvaluation}
                isSubmitting={isSubmittingEvaluation}
                onAbort={handleAbortEvaluation}
                onNext={handleNextRound}
            />
        </div>
    );
};

const EvaluationRoundPanel: React.FC<{
    roundTitle: string,
    data: typeof initialRoundState,
    onChange: (data: any) => void,
    isFinal: boolean,
    onFinalize?: () => void,
    isSubmitting?: boolean,
    onAbort?: () => void,
    onNext?: () => void
}> = ({ roundTitle, data, onChange, isFinal, onFinalize, isSubmitting = false, onAbort, onNext }) => {
    
    const handlePanelChange = (id: number, field: string, value: string) => {
        const newPanels = data.panels.map(p => p.id === id ? { ...p, [field]: value } : p);
        onChange({ ...data, panels: newPanels });
    };

    const addPanelMember = () => {
        const newPanel = { ...initialPanelState, id: Date.now() };
        onChange({ ...data, panels: [...data.panels, newPanel] });
    };
    
    const removePanelMember = (id: number) => {
        const newPanels = data.panels.filter(p => p.id !== id);
        onChange({ ...data, panels: newPanels });
    };

    const RadioGroup: React.FC<{label: string, options: string[], selected: string, onSelect: (value: string) => void, name:string}> = ({label, options, selected, onSelect, name}) => (
        <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                {options.map(opt => (
                    <label key={opt} className="flex items-center space-x-2 text-sm font-medium cursor-pointer">
                        <input type="radio" name={name} value={opt} checked={selected === opt} onChange={() => onSelect(opt)} className="accent-indigo-600"/>
                        <span>{opt}</span>
                    </label>
                ))}
            </div>
        </div>
    );

    return (
        <div className="animate-[fadeIn_0.3s_ease-out]">
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <RadioGroup 
                        label="Communication Mode"
                        name="comm-mode"
                        options={['F2F', 'Video', 'Telecon']}
                        selected={data.communicationMode}
                        onSelect={val => onChange({...data, communicationMode: val})}
                    />
                    <Input label="Scheduled" type="date" value={data.scheduled} onChange={e => onChange({...data, scheduled: e.target.value})} />
                    <Input label="Start Time" type="time" value={data.startTime} onChange={e => onChange({...data, startTime: e.target.value})} />
                    <Input label="End Time" type="time" value={data.endTime} onChange={e => onChange({...data, endTime: e.target.value})} />
                </div>
            </Card>

            <div className="mt-6">
                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Multi-Panel Decisioning Workflow</h3>
                    <Button variant="secondary" onClick={addPanelMember} className="h-8 text-xs">
                        <UserPlus className="w-4 h-4 mr-2" /> Add Panel Member
                    </Button>
                </div>

                <div className="space-y-6">
                    {data.panels.map((panel) => (
                        <Card key={panel.id} className="relative bg-slate-50/50">
                             {data.panels.length > 1 && (
                                <button onClick={() => removePanelMember(panel.id)} className="absolute top-4 right-4 p-1.5 text-rose-400 hover:bg-rose-100 rounded-full">
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                             )}
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                                {/* Member Identity */}
                                <div className="space-y-4 p-4 border-r border-slate-200">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">A) Member Identity</h4>
                                    <Input label="Panel Member ID" value={panel.memberId} onChange={e => handlePanelChange(panel.id, 'memberId', e.target.value)} />
                                    <Input label="Panel Member Name" value={panel.memberName} onChange={e => handlePanelChange(panel.id, 'memberName', e.target.value)} />
                                    <Input label="Designation" value={panel.designation} onChange={e => handlePanelChange(panel.id, 'designation', e.target.value)} />
                                </div>
                                {/* Assessment Metrics */}
                                <div className="space-y-6 p-4">
                                     <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">B) Assessment Metrics</h4>
                                     <RadioGroup
                                        label="Assessment Rating"
                                        name={`rating-${panel.id}`}
                                        options={['OUTSTANDING', 'EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW AVERAGE']}
                                        selected={panel.rating}
                                        onSelect={val => handlePanelChange(panel.id, 'rating', val)}
                                     />
                                     <RadioGroup
                                        label="Feedback Outcome"
                                        name={`outcome-${panel.id}`}
                                        options={['SELECTED', 'REJECTED', 'ON HOLD', 'REFERRED TO ANOTHER ROLE']}
                                        selected={panel.outcome}
                                        onSelect={val => handlePanelChange(panel.id, 'outcome', val)}
                                     />
                                     <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reason & Remarks</label>
                                        <textarea 
                                            value={panel.remarks}
                                            onChange={e => handlePanelChange(panel.id, 'remarks', e.target.value)}
                                            placeholder="Provide detailed technical/behavioral justification for this rating..."
                                            className="mt-2 w-full h-24 bg-white border border-slate-200 rounded-2xl p-4 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                        ></textarea>
                                     </div>
                                </div>
                             </div>
                        </Card>
                    ))}
                </div>
            </div>
            
            <div className="flex justify-end items-center gap-4 mt-8 pt-6 border-t border-slate-100">
                <Button variant="secondary" onClick={onAbort}>Abort</Button>
                {isFinal ? (
                     <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" onClick={onFinalize} isLoading={isSubmitting}>Finalize Selection Audit</Button>
                ) : (
                     <Button onClick={onNext}>Next Round Evaluation</Button>
                )}
            </div>
        </div>
    )
};


const OffersJoining: React.FC = () => {
    type Offer = { id: string; candidate: string; role: string; ctc: string; status: 'OFFERED' | 'ACCEPTED' | 'RENEG' | 'JOINED' | 'DNJ'; joining: string; joinRequestPending?: boolean; };
    
    const [offers, setOffers] = React.useState<Offer[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedOffer, setSelectedOffer] = React.useState<Offer | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isReleaseOfferModalOpen, setIsReleaseOfferModalOpen] = React.useState(false);
    const [isReleasingOffer, setIsReleasingOffer] = React.useState(false);
    const [releaseForm, setReleaseForm] = React.useState({
        candidateId: '',
        jobId: '',
        jobTitle: '',
        ctcFixed: '',
        ctcVariable: '',
        doj: '',
        validityDays: '15',
    });

    React.useEffect(() => {
        api.recruiter.getOffers()
          .then((data) => setOffers(data || []))
          .catch((err) => console.error('Failed to load offers:', err));
    }, []);

    const filteredOffers = offers.filter(o => 
        o.candidate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAction = (action: string, offer: Offer) => {
        setSelectedOffer(offer);
        if (action === 'view') setIsViewModalOpen(true);
        if (action === 'edit') setIsEditModalOpen(true);
    };

    const handleUpdateOffer = async (updatedOffer: Offer) => {
        try {
            const statusMap: Record<string, string> = {
                OFFERED: 'offered',
                ACCEPTED: 'accepted',
                JOINED: 'joined',
                RENEG: 'declined',
                DNJ: 'declined',
            };
            await api.recruiter.updateOffer(updatedOffer.id, {
                status: statusMap[updatedOffer.status] || 'offered',
            });
            const refreshed = await api.recruiter.getOffers();
            setOffers(refreshed || []);
            setIsEditModalOpen(false);
            setSelectedOffer(null);
        } catch (error) {
            console.error('Failed to update offer:', error);
            alert(error instanceof Error ? error.message : 'Failed to update offer');
        }
    };

    const handleReleaseOffer = async () => {
        if (!releaseForm.candidateId || !releaseForm.jobId || !releaseForm.ctcFixed || !releaseForm.doj) {
            alert('Candidate ID, Job ID, Fixed CTC and Date of Joining are required.');
            return;
        }

        setIsReleasingOffer(true);
        try {
            await api.recruiter.releaseOffer({
                candidateId: Number(releaseForm.candidateId),
                jobId: Number(releaseForm.jobId),
                ctcFixed: Number(releaseForm.ctcFixed),
                ctcVariable: Number(releaseForm.ctcVariable || 0),
                doj: new Date(releaseForm.doj).toISOString(),
                validityDays: Number(releaseForm.validityDays || 15),
            });

            const refreshed = await api.recruiter.getOffers();
            setOffers(refreshed || []);
            setIsReleaseOfferModalOpen(false);
            setReleaseForm({
                candidateId: '',
                jobId: '',
                jobTitle: '',
                ctcFixed: '',
                ctcVariable: '',
                doj: '',
                validityDays: '15',
            });
        } catch (error) {
            console.error('Failed to release offer:', error);
            alert(error instanceof Error ? error.message : 'Failed to release offer');
        } finally {
            setIsReleasingOffer(false);
        }
    };

    const handleExportOffersReport = () => {
        const header = ['Offer ID', 'Candidate', 'Role', 'CTC', 'Status', 'Joining Date'];
        const rows = offers.map((offer) => [
            offer.id,
            offer.candidate,
            offer.role,
            offer.ctc,
            offer.status,
            offer.joining,
        ]);
        const csv = [header, ...rows]
            .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `offers-report-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const columns: Column<Offer>[] = [
        { key: 'id', label: 'Offer ID', render: o => <span className="font-mono font-bold text-slate-500">{o.id}</span> },
        {
            key: 'candidate',
            label: 'Candidate Name',
            render: o => (
                <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{o.candidate}</span>
                    {o.joinRequestPending ? <Badge color="amber">Join Request</Badge> : null}
                </div>
            ),
        },
        { key: 'role', label: 'Role' },
        { key: 'ctc', label: 'Offered CTC', render: o => <span className="font-mono font-bold text-indigo-700">${parseInt(o.ctc).toLocaleString()}</span> },
        { key: 'status', label: 'Status', render: o => {
            const colors: any = { OFFERED: 'indigo', ACCEPTED: 'amber', RENEG: 'rose', JOINED: 'emerald', DNJ: 'slate' };
            return <Badge color={colors[o.status]}>{o.status}</Badge>
        }},
        { key: 'joining', label: 'Joining Date' },
        { key: 'actions', label: 'Actions' }
    ];
    
    const kpiData = {
        released: offers.length,
        accepted: offers.filter(o => o.status === 'ACCEPTED' || o.status === 'JOINED').length,
        joined: offers.filter(o => o.status === 'JOINED').length,
        dnj: offers.filter(o => o.status === 'DNJ').length,
    };

    const renderReleaseOfferForm = () => (
        <div className="space-y-6">
            <Card title="Candidate & Role Details">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Input
                        label="Candidate ID"
                        placeholder="Numeric Candidate ID"
                        value={releaseForm.candidateId}
                        onChange={(e) => setReleaseForm(prev => ({ ...prev, candidateId: e.target.value }))}
                    />
                    <Input
                        label="Job ID"
                        placeholder="Numeric Job ID"
                        value={releaseForm.jobId}
                        onChange={(e) => setReleaseForm(prev => ({ ...prev, jobId: e.target.value }))}
                    />
                    <Input
                        label="Job Title (Optional)"
                        placeholder="Official Designation"
                        value={releaseForm.jobTitle}
                        onChange={(e) => setReleaseForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                    />
                </div>
            </Card>

            <Card title="Compensation & Joining">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Input
                        label="Annual Fixed CTC (USD)"
                        type="number"
                        placeholder="e.g., 120000"
                        value={releaseForm.ctcFixed}
                        onChange={(e) => setReleaseForm(prev => ({ ...prev, ctcFixed: e.target.value }))}
                    />
                    <Input
                        label="Annual Variable CTC (USD)"
                        type="number"
                        placeholder="e.g., 20000"
                        value={releaseForm.ctcVariable}
                        onChange={(e) => setReleaseForm(prev => ({ ...prev, ctcVariable: e.target.value }))}
                    />
                    <Input
                        label="Total Annual CTC (USD)"
                        readOnly
                        className="bg-slate-100"
                        value={String((Number(releaseForm.ctcFixed || 0) + Number(releaseForm.ctcVariable || 0)) || '')}
                    />
                    <Input
                        label="Date of Joining"
                        type="date"
                        value={releaseForm.doj}
                        onChange={(e) => setReleaseForm(prev => ({ ...prev, doj: e.target.value }))}
                    />
                    <Input
                        label="Offer Validity (Days)"
                        type="number"
                        value={releaseForm.validityDays}
                        onChange={(e) => setReleaseForm(prev => ({ ...prev, validityDays: e.target.value }))}
                    />
                </div>
            </Card>

            <Card title="Offer Letter Body">
                <textarea 
                    className="w-full h-64 bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-sm font-mono focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y"
                    defaultValue={`Dear [Candidate Name],

We are pleased to extend an offer of employment for the position of [Job Title] with HirePulse Enterprise.

Your starting date will be [Date of Joining]. Your annual compensation package will be as follows:
- Fixed Component: $[Annual Fixed CTC]
- Variable Component: $[Annual Variable CTC]

This offer is contingent upon the successful completion of your background verification.

Please review the attached detailed compensation breakdown and company policies. To accept this offer, please sign and return this letter by [Offer Expiration Date].

We look forward to you joining our team.

Sincerely,
The HirePulse Team`}
                />
            </Card>
            
            <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setIsReleaseOfferModalOpen(false)}>Abort</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30" onClick={handleReleaseOffer} isLoading={isReleasingOffer}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Generate & Send Offer
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Offers & Onboarding</h2>
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={handleExportOffersReport}><Download className="w-4 h-4 mr-2" /> Export Statutory Report</Button>
                    <Button onClick={() => setIsReleaseOfferModalOpen(true)}><FilePenLine className="w-4 h-4 mr-2" /> Release New Offer</Button>
                </div>
            </div>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card><div className="text-center"><div className="text-3xl font-black text-indigo-900">{kpiData.released}</div><div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Offers Released</div></div></Card>
                <Card><div className="text-center"><div className="text-3xl font-black text-amber-600">{kpiData.accepted}</div><div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Offers Accepted</div></div></Card>
                <Card><div className="text-center"><div className="text-3xl font-black text-emerald-600">{kpiData.joined}</div><div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Head Count Joined</div></div></Card>
                <Card><div className="text-center"><div className="text-3xl font-black text-rose-600">{kpiData.dnj}</div><div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Did Not Join (DNJ)</div></div></Card>
            </div>
            
            <Card>
                <div className="mb-6">
                    <Input label="Search by Candidate or Role" placeholder="Start typing to filter..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <DataTable data={filteredOffers} columns={columns} onAction={handleAction} />
            </Card>

            {/* View Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Offer Summary">
                {selectedOffer && (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                            <div><div className="text-[10px] font-black uppercase text-slate-400">Candidate</div><div className="font-bold text-slate-800">{selectedOffer.candidate}</div></div>
                            <div><div className="text-[10px] font-black uppercase text-slate-400">Role</div><div className="font-bold text-slate-800">{selectedOffer.role}</div></div>
                            <div><div className="text-[10px] font-black uppercase text-slate-400">Offer ID</div><div className="font-mono text-sm text-slate-600">{selectedOffer.id}</div></div>
                            <div><div className="text-[10px] font-black uppercase text-slate-400">Status</div><div><Badge color={({ OFFERED: 'indigo', ACCEPTED: 'amber', RENEG: 'rose', JOINED: 'emerald', DNJ: 'slate' } as any)[selectedOffer.status]}>{selectedOffer.status}</Badge></div></div>
                            <div><div className="text-[10px] font-black uppercase text-slate-400">Offered CTC</div><div className="font-mono text-lg font-bold text-indigo-700">${parseInt(selectedOffer.ctc).toLocaleString()}</div></div>
                            <div><div className="text-[10px] font-black uppercase text-slate-400">Joining Date</div><div className="font-bold text-slate-800">{selectedOffer.joining}</div></div>
                        </div>
                    </div>
                )}
            </Modal>
            
            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Offer Artifact">
                {selectedOffer && <EditOfferForm offer={selectedOffer} onSave={handleUpdateOffer} onCancel={() => setIsEditModalOpen(false)} />}
            </Modal>

            {/* Release New Offer Modal */}
             <Modal isOpen={isReleaseOfferModalOpen} onClose={() => setIsReleaseOfferModalOpen(false)} title="Release New Offer Artifact">
                {renderReleaseOfferForm()}
            </Modal>
        </div>
    );
};

const EditOfferForm: React.FC<{offer: any; onSave: (data: any) => void; onCancel: () => void;}> = ({ offer, onSave, onCancel }) => {
    const [formData, setFormData] = React.useState(offer);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="space-y-6">
            <Input label="Candidate Name" name="candidate" value={formData.candidate} onChange={handleChange} />
            <Input label="Role" name="role" value={formData.role} onChange={handleChange} />
            <Input label="Offered CTC (USD)" name="ctc" type="number" value={formData.ctc} onChange={handleChange} />
            <Input label="Joining Date" name="joining" type="date" value={formData.joining} onChange={handleChange} />
            <Select 
                label="Status" 
                name="status" 
                value={formData.status} 
                onChange={handleChange} 
                options={['OFFERED', 'ACCEPTED', 'RENEG', 'JOINED', 'DNJ']} 
            />
            <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button onClick={() => onSave(formData)}>Update Artifact</Button>
            </div>
        </div>
    );
};


// --- Main Container ---

export const RecruiterDashboard: React.FC<{ currentPage: string }> = ({ currentPage }) => {
    switch(currentPage) {
        case 'rec-agency-approved': return <ApprovedAgencies />;
        case 'rec-agency-profiles': return <AgencyProfiles />;
        case 'rec-jobs': return <JobPostings />;
        case 'rec-mpr': return <MPRHandling />;
        case 'rec-candidates': return <CandidateDirectory />;
        case 'rec-interviews': return <Interviews />;
        case 'rec-offers': return <OffersJoining />;
        case 'rec-dash':
        default: return <DashboardOverview />;
    }
};
