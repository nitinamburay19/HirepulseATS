import React from 'react';
import { Card, Button, Input, Badge, Modal } from '../components/UI';
import { DataTable, Column } from '../components/DataTable';
import { api } from '../services/api';
import { FileText, Check, AlertCircle, Users, BarChart2, Calendar, Star, CheckCircle, Briefcase, Sparkles, CheckSquare, Eye, Clock, XCircle, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- Sub-Screens ---

const ManagerHub: React.FC = () => {
  const [summaryModalOpen, setSummaryModalOpen] = React.useState(false);
  const [summaryData, setSummaryData] = React.useState<{jobTitle: string, stage: string, count: number, candidates: any[]} | null>(null);
  const [artifactModalOpen, setArtifactModalOpen] = React.useState(false);
  const [viewedCandidate, setViewedCandidate] = React.useState<any | null>(null);
  const [requisitionData, setRequisitionData] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState([
    { label: 'My Headcount', value: '0', icon: Users, color: 'indigo', dark: true },
    { label: 'Open Reqs', value: '0', icon: FileText, color: 'emerald', dark: false },
    { label: 'Pending Offers', value: '0', icon: Check, color: 'amber', dark: false },
    { label: 'Interviews Today', value: '0', icon: Calendar, color: 'rose', dark: true },
  ]);

  React.useEffect(() => {
    api.manager.getHubData()
      .then((data) => {
        const rawStats = data?.stats || {};
        setStats([
          { label: 'My Headcount', value: String(rawStats.headcount ?? 0), icon: Users, color: 'indigo', dark: true },
          { label: 'Open Reqs', value: String(rawStats.openReq ?? 0), icon: FileText, color: 'emerald', dark: false },
          { label: 'Pending Offers', value: String(rawStats.pendingOffers ?? 0), icon: Check, color: 'amber', dark: false },
          { label: 'Interviews Today', value: String(rawStats.interviewsToday ?? 0), icon: Calendar, color: 'rose', dark: true },
        ]);
        setRequisitionData((data?.requisitions || []).map((r: any) => ({
          jobTitle: r.jobTitle,
          profilesReceived: r.profilesReceived ?? 0,
          profileShortlisted: r.shortlisted ?? 0,
          interviewed: r.interviewed ?? 0,
          scheduled: r.interviewed ?? 0,
          toBeScheduled: 0,
          targetClosureDate: '-',
          expectedDOJ: '-',
          selected: r.hired ?? 0,
          rejected: 0,
          onHold: 0,
          offered: r.offered ?? 0,
          positionsClosed: r.hired ?? 0,
          dnj: 0,
        })));
      })
      .catch((err) => console.error('Failed to load manager hub:', err));
  }, []);

  const handleStageClick = async (jobTitle: string, stage: string, count: number) => {
    if (count === 0) return;
    try {
      const candidates = await api.manager.getPipelineCandidates(jobTitle, stage);
      setSummaryData({ jobTitle, stage, count: candidates.length || count, candidates: candidates || [] });
    } catch (error) {
      console.error('Failed to load manager pipeline candidates:', error);
      setSummaryData({ jobTitle, stage, count, candidates: [] });
    }
    setSummaryModalOpen(true);
  };
  
  const handleViewArtifact = (candidate: any) => {
    setViewedCandidate(candidate);
    setArtifactModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className={`rounded-[2.5rem] p-8 shadow-sm border flex flex-col justify-between h-48 relative overflow-hidden group hover:shadow-md transition-all ${
            s.dark 
              ? 'bg-indigo-950 text-white border-indigo-900 shadow-xl shadow-indigo-900/20' 
              : 'bg-white border-slate-100'
          }`}>
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 bg-${s.color}-500`}></div>
            <div className="flex justify-between items-start relative z-10">
              <div className={`p-4 rounded-2xl ${s.dark ? `bg-${s.color}-900/50 border border-${s.color}-800 text-${s.color}-300` : `bg-${s.color}-50 text-${s.color}-600`}`}>
                <s.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="relative z-10">
              <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${s.dark ? `text-${s.color}-400` : 'text-slate-400'}`}>{s.label}</div>
              <div className={`text-4xl font-black tracking-tight ${s.dark ? 'text-white' : 'text-slate-800'}`}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <Card title="My Requisition Pipeline">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                        {['Job Title', 'Profiles Received', 'Shortlisted', 'Interviewed', 'Scheduled', 'To be Scheduled', 'Target Closure', 'Expected DOJ', 'Selected', 'Rejected', 'On Hold', 'Offered', 'Positions Closed', 'DNJ'].map(header => (
                            <th key={header} className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center whitespace-nowrap first:text-left first:w-48">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {requisitionData.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/30 transition-colors">
                            <td className="py-4 px-4 text-sm font-bold text-slate-800">{row.jobTitle}</td>
                            
                            {[
                                { stage: 'Profiles Received', count: row.profilesReceived },
                                { stage: 'Profile Shortlisted', count: row.profileShortlisted },
                                { stage: 'Interviewed', count: row.interviewed },
                                { stage: 'Scheduled', count: row.scheduled },
                                { stage: 'To be Scheduled', count: row.toBeScheduled },
                            ].map((cell, i) => (
                                <td key={i} className="py-4 px-4 text-center">
                                    <button onClick={() => handleStageClick(row.jobTitle, cell.stage, cell.count)} className="font-bold text-indigo-600 hover:scale-125 transition-transform disabled:text-slate-400 disabled:cursor-default disabled:scale-100" disabled={cell.count === 0}>{cell.count}</button>
                                </td>
                            ))}
                            
                            <td className="py-4 px-4 text-center text-xs font-mono text-slate-600">{row.targetClosureDate}</td>
                            <td className="py-4 px-4 text-center text-xs font-mono text-slate-600">{row.expectedDOJ}</td>
                            
                             {[
                                { stage: 'Selected', count: row.selected },
                                { stage: 'Rejected', count: row.rejected },
                                { stage: 'On Hold', count: row.onHold },
                                { stage: 'Offered', count: row.offered },
                                { stage: 'Positions Closed', count: row.positionsClosed },
                                { stage: 'DNJ', count: row.dnj },
                            ].map((cell, i) => (
                                <td key={i} className="py-4 px-4 text-center">
                                    <button onClick={() => handleStageClick(row.jobTitle, cell.stage, cell.count)} className="font-bold text-indigo-600 hover:scale-125 transition-transform disabled:text-slate-400 disabled:cursor-default disabled:scale-100" disabled={cell.count === 0}>{cell.count}</button>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </Card>
      
      <Modal isOpen={summaryModalOpen} onClose={() => setSummaryModalOpen(false)} title="Pipeline Drill-Down">
        {summaryData && (
            <div className="space-y-6">
                <div className="bg-indigo-50 rounded-2xl p-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Requisition</div>
                    <div className="text-lg font-black text-indigo-900">{summaryData.jobTitle}</div>
                    <div className="mt-2">
                        <Badge color="amber">{summaryData.stage}: {summaryData.count} Candidate(s)</Badge>
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
                            <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                <div className="flex items-center space-x-4">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">{c.name.charAt(0)}</div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                                        <div className="text-[10px] font-mono text-slate-400">{c.id}</div>
                                    </div>
                                </div>
                                <Button variant="secondary" className="h-8 text-xs" onClick={() => handleViewArtifact(c)}>View Artifact</Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center text-slate-500 text-sm font-medium">
                        Candidate-level artifacts are available in recruiter candidate repository.
                    </div>
                )}
            </div>
        )}
      </Modal>

      <Modal isOpen={artifactModalOpen} onClose={() => setArtifactModalOpen(false)} title="Candidate Artifact">
        {viewedCandidate && (
            <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-black flex items-center justify-center text-lg">{viewedCandidate.name.charAt(0)}</div>
                    <div>
                        <h3 className="font-black text-slate-800">{viewedCandidate.name}</h3>
                        <p className="text-xs font-mono text-slate-400">{viewedCandidate.id}</p>
                    </div>
                </div>
                {viewedCandidate.resumeUrl ? (
                    <div className="bg-slate-900 text-white text-xs p-6 rounded-2xl whitespace-pre-wrap font-mono max-h-[50vh] overflow-y-auto">
                        <div className="text-slate-300 mb-4">Resume artifact URL</div>
                        <a
                            href={viewedCandidate.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-300 underline break-all"
                        >
                            {viewedCandidate.resumeUrl}
                        </a>
                    </div>
                ) : (
                    <div className="bg-slate-900 text-white text-xs p-6 rounded-2xl">No resume uploaded.</div>
                )}
            </div>
        )}
      </Modal>
    </div>
  );
};

const MyRequests: React.FC = () => {
    const [jobType, setJobType] = React.useState('New Vacancy');
    const [visibility, setVisibility] = React.useState('external');
    const [isSubmittingMpr, setIsSubmittingMpr] = React.useState(false);
    const [isGeneratingAiDocs, setIsGeneratingAiDocs] = React.useState(false);
    const [myRequests, setMyRequests] = React.useState<any[]>([]);
    const [submittedRequestStatus, setSubmittedRequestStatus] = React.useState<string>('PENDING');
    const [aiSummary, setAiSummary] = React.useState('');
    const [mprForm, setMprForm] = React.useState({
        jobTitle: '',
        designation: '',
        budgetMin: '',
        budgetMax: '',
        positionsRequested: '1',
        skillsRequired: '',
        jobDescription: '',
    });
    const [replacementDetails, setReplacementDetails] = React.useState({
        employeeId: '',
        employeeName: '',
        resignationDate: '',
        lastWorkingDay: '',
        ctc: ''
    });

    const [isSubmitted, setIsSubmitted] = React.useState(false);
    const [hodApproval, setHodApproval] = React.useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
    const [cfoApproval, setCfoApproval] = React.useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

    const loadMyRequests = React.useCallback(async () => {
        try {
            const requests = await api.manager.getMyRequests();
            setMyRequests(requests || []);
        } catch (error) {
            console.error('Failed to load manager requests:', error);
        }
    }, []);

    React.useEffect(() => {
        loadMyRequests();
    }, [loadMyRequests]);

    const resetDraft = () => {
        setJobType('New Vacancy');
        setVisibility('external');
        setAiSummary('');
        setMprForm({
            jobTitle: '',
            designation: '',
            budgetMin: '',
            budgetMax: '',
            positionsRequested: '1',
            skillsRequired: '',
            jobDescription: '',
        });
        setReplacementDetails({
            employeeId: '',
            employeeName: '',
            resignationDate: '',
            lastWorkingDay: '',
            ctc: ''
        });
        setHodApproval('PENDING');
        setCfoApproval('PENDING');
        setSubmittedRequestStatus('PENDING');
        setIsSubmitted(false);
    };

    const handleFinalize = async () => {
        if (!mprForm.jobTitle.trim() || !mprForm.budgetMin || !mprForm.budgetMax) {
            alert('Job title and budget range are required.');
            return;
        }

        setIsSubmittingMpr(true);
        try {
            const created = await api.manager.createMpr({
                jobTitle: mprForm.jobTitle.trim(),
                department: mprForm.designation.trim() || 'General',
                jobDescription: mprForm.jobDescription.trim() || `${mprForm.jobTitle.trim()} role`,
                jobType: jobType.toLowerCase().replace(/\s+/g, '_'),
                positionsRequested: Number(mprForm.positionsRequested || 1),
                budgetMin: Number(mprForm.budgetMin),
                budgetMax: Number(mprForm.budgetMax),
                experienceRequired: Math.floor(minExpValue),
                skillsRequired: mprForm.skillsRequired.split(',').map(s => s.trim()).filter(Boolean),
            });
            setSubmittedRequestStatus(String(created?.status || 'pending').toUpperCase());
            setIsSubmitted(true);
            await loadMyRequests();
        } catch (error) {
            console.error('Failed to create MPR:', error);
            alert(error instanceof Error ? error.message : 'Failed to create MPR');
        } finally {
            setIsSubmittingMpr(false);
        }
    };

    const handleAutomateSummaryAndJd = async () => {
        if (!mprForm.jobTitle.trim()) {
            alert('Enter the job title first to generate AI summary and JD.');
            return;
        }

        setIsGeneratingAiDocs(true);
        try {
            const generated = await api.jobs.generateDescription(mprForm.jobTitle.trim());
            setAiSummary(generated.summary || '');
            setMprForm((prev) => ({ ...prev, jobDescription: generated.description || prev.jobDescription }));
        } catch (error) {
            console.error('Failed to generate AI summary/JD:', error);
            alert(error instanceof Error ? error.message : 'Failed to generate AI summary and JD');
        } finally {
            setIsGeneratingAiDocs(false);
        }
    };

    const mprStatus = React.useMemo(() => {
        if (!isSubmitted) return 'DRAFT';
        if (submittedRequestStatus) return submittedRequestStatus;
        if (hodApproval === 'REJECTED' || cfoApproval === 'REJECTED') return 'REJECTED';
        if (hodApproval === 'APPROVED' && cfoApproval === 'APPROVED') return 'APPROVED';
        return 'PENDING';
    }, [isSubmitted, submittedRequestStatus, hodApproval, cfoApproval]);

    const handleReplacementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        const newDetails = { ...replacementDetails, [name]: value };

        if (name === 'resignationDate' && newDetails.lastWorkingDay && newDetails.lastWorkingDay < value) {
            newDetails.lastWorkingDay = value;
        }

        setReplacementDetails(newDetails);
    };

    React.useEffect(() => {
        if (jobType === 'Confidential') {
            setVisibility('external');
        }
    }, [jobType]);
    
    // Helper component for dropdowns
    const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[] }> = ({ label, options, className, ...props }) => (
        <div className={`flex flex-col space-y-1.5 ${className}`}>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">{label}</label>
            <select
                className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-[2rem] focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                {...props}
            >
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );

    // Helper for Radio Group
    const RadioOption: React.FC<{ name: string; label: string; description: string; value: string; checked: boolean; onChange: (val: string) => void; disabled?: boolean; }> = ({ name, label, description, value, checked, onChange, disabled }) => (
        <label className={`flex items-start p-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] transition-colors ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'cursor-pointer hover:bg-indigo-50 hover:border-indigo-200'}`}>
            <input 
                type="radio" 
                name={name} 
                value={value}
                checked={checked}
                onChange={() => !disabled && onChange(value)}
                disabled={disabled}
                className="mt-1 accent-indigo-600 disabled:cursor-not-allowed" 
            />
            <div className="ml-3">
                <div className="text-sm font-bold text-slate-800">{label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{description}</div>
            </div>
        </label>
    );
    
    // Helper for Checkbox Group
    const CheckboxOption: React.FC<{label: string, disabled?: boolean}> = ({ label, disabled }) => (
        <label className={`flex items-center space-x-3 p-3 bg-white border border-slate-200 rounded-xl ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-300'}`}>
            <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300" disabled={disabled} />
            <span className="text-xs font-bold text-slate-700">{label}</span>
        </label>
    );
    
    // Helper for Approval Row
    const ApprovalRow: React.FC<{
        title: string;
        subtitle: string;
        status: 'PENDING' | 'APPROVED' | 'REJECTED';
        onApprove: () => void;
        onReject: () => void;
        disabled: boolean;
    }> = ({ title, subtitle, status, onApprove, onReject, disabled }) => {
        const statusConfig = {
            PENDING: { color: 'amber' as const, icon: <Clock className="w-4 h-4" /> },
            APPROVED: { color: 'emerald' as const, icon: <CheckCircle className="w-4 h-4" /> },
            REJECTED: { color: 'rose' as const, icon: <XCircle className="w-4 h-4" /> }
        };

        return (
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                    <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
                    <p className="text-xs text-slate-500">{subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge color={statusConfig[status].color}>
                        <div className="flex items-center gap-2">
                            {statusConfig[status].icon}
                            {status}
                        </div>
                    </Badge>
                    {status === 'PENDING' && !disabled && (
                        <>
                            <Button onClick={onApprove} variant="secondary" className="h-9 text-xs bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100">Approve</Button>
                            <Button onClick={onReject} variant="secondary" className="h-9 text-xs bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100">Reject</Button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    const experienceLevels = React.useMemo(() => [
        { label: 'Fresher', value: 0 }, { label: '<1', value: 0.5 }, { label: '1', value: 1 },
        { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 },
        { label: '5', value: 5 }, { label: '6', value: 6 }, { label: '7', value: 7 },
        { label: '8', value: 8 }, { label: '9', value: 9 }, { label: '10', value: 10 },
        { label: '12', value: 12 }, { label: '14', value: 14 }, { label: '15', value: 15 },
        { label: '16', value: 16 }, { label: '18', value: 18 }, { label: '20', value: 20 },
        { label: '20+', value: 21 },
    ], []);

    const [minExpValue, setMinExpValue] = React.useState<number>(experienceLevels[0].value);
    const [maxExpValue, setMaxExpValue] = React.useState<number>(experienceLevels[0].value);

    const handleMinExpChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedLabel = e.target.value;
        const selectedLevel = experienceLevels.find(level => level.label === selectedLabel);
        if (selectedLevel) {
            const newMinVal = selectedLevel.value;
            setMinExpValue(newMinVal);
            if (maxExpValue < newMinVal) {
                setMaxExpValue(newMinVal);
            }
        }
    };

    const handleMaxExpChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedLabel = e.target.value;
        const selectedLevel = experienceLevels.find(level => level.label === selectedLabel);
        if (selectedLevel) {
            setMaxExpValue(selectedLevel.value);
        }
    };

    const minExpOptions = experienceLevels.map(e => e.label);
    const maxExpOptions = experienceLevels
        .filter(e => e.value >= minExpValue)
        .map(e => e.label);

    const minExpLabel = experienceLevels.find(e => e.value === minExpValue)?.label;
    const maxExpLabel = experienceLevels.find(e => e.value === maxExpValue)?.label;

    return (
        <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
            {/* Header */}
            <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Job Requisition Engineering</h2>
                <p className="text-sm text-slate-400 font-bold mt-1">End-to-End Placement Protocol</p>
            </div>

            <Card title="My Requests (Backend)">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Req Code</th>
                                <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Job Title</th>
                                <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Department</th>
                                <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Created</th>
                                <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myRequests.length === 0 ? (
                                <tr>
                                    <td className="py-6 px-2 text-sm text-slate-500" colSpan={5}>
                                        No requests found in backend for this manager.
                                    </td>
                                </tr>
                            ) : (
                                myRequests.slice(0, 8).map((req) => (
                                    <tr key={req.id} className="border-b border-slate-50">
                                        <td className="py-3 px-2 font-mono text-xs text-slate-600">{req.requisitionCode}</td>
                                        <td className="py-3 px-2 text-sm font-bold text-slate-800">{req.jobTitle}</td>
                                        <td className="py-3 px-2 text-sm text-slate-600">{req.department}</td>
                                        <td className="py-3 px-2 text-sm text-slate-600">{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '-'}</td>
                                        <td className="py-3 px-2">
                                            <Badge color={String(req.status || '').toUpperCase() === 'APPROVED' ? 'emerald' : String(req.status || '').toUpperCase() === 'REJECTED' ? 'rose' : 'amber'}>
                                                {String(req.status || 'PENDING').toUpperCase()}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
            
            <Input label="Auto-Captured Date" value={new Date().toLocaleDateString('en-CA')} readOnly className="bg-slate-100 text-slate-500 font-mono" />
            
            {/* Module 1 */}
            <Card title="Module 1: Job Identity & Visibility">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <Input
                        label="Job Title"
                        placeholder="e.g. Principal Architect"
                        disabled={isSubmitted}
                        value={mprForm.jobTitle}
                        onChange={e => setMprForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                    />
                    <Input
                        label="Designation"
                        placeholder="Internal Designation"
                        disabled={isSubmitted}
                        value={mprForm.designation}
                        onChange={e => setMprForm(prev => ({ ...prev, designation: e.target.value }))}
                    />
                     <Select 
                        label="Job Type" 
                        options={['New Vacancy', 'Replacement', 'Confidential']}
                        value={jobType}
                        onChange={e => setJobType(e.target.value)}
                        disabled={isSubmitted}
                    />
                    <Input
                        label="Annual Budget (Min)"
                        placeholder="Min Fixed CTC"
                        type="number"
                        disabled={isSubmitted}
                        value={mprForm.budgetMin}
                        onChange={e => setMprForm(prev => ({ ...prev, budgetMin: e.target.value }))}
                    />
                    <Input
                        label="Annual Budget (Max)"
                        placeholder="Max Fixed CTC"
                        type="number"
                        disabled={isSubmitted}
                        value={mprForm.budgetMax}
                        onChange={e => setMprForm(prev => ({ ...prev, budgetMax: e.target.value }))}
                    />
                    <Select 
                        label="No of Positions" 
                        options={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '15', '20', '25', '30', '40', '50']} 
                        value={mprForm.positionsRequested}
                        onChange={e => setMprForm(prev => ({ ...prev, positionsRequested: e.target.value }))}
                        disabled={isSubmitted}
                    />
                </div>

                {jobType === 'Replacement' && (
                    <div className="mb-6 pt-6 border-t border-slate-100 animate-[fadeIn_0.3s_ease-out]">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500 ml-4 mb-4">Resignee Employee Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            <Input 
                                label="Employee ID" 
                                name="employeeId" 
                                value={replacementDetails.employeeId} 
                                onChange={handleReplacementChange} 
                                placeholder="Resignee's Code" 
                                disabled={isSubmitted}
                            />
                            <Input 
                                label="Employee Name" 
                                name="employeeName" 
                                value={replacementDetails.employeeName} 
                                onChange={handleReplacementChange} 
                                placeholder="Resignee's Full Name" 
                                className="lg:col-span-2" 
                                disabled={isSubmitted}
                            />
                            <Input 
                                label="Date of Resignation" 
                                name="resignationDate" 
                                type="date" 
                                value={replacementDetails.resignationDate} 
                                onChange={handleReplacementChange}
                                disabled={isSubmitted} 
                            />
                            <Input 
                                label="Last Working Day" 
                                name="lastWorkingDay" 
                                type="date" 
                                value={replacementDetails.lastWorkingDay} 
                                onChange={handleReplacementChange} 
                                min={replacementDetails.resignationDate}
                                disabled={isSubmitted}
                            />
                            <Input 
                                label="CTC" 
                                name="ctc" 
                                value={replacementDetails.ctc} 
                                onChange={handleReplacementChange} 
                                placeholder="Last Drawn Annual CTC"
                                disabled={isSubmitted} 
                            />
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block ml-4">Visibility Logic</label>
                        <div className="space-y-3">
                            <RadioOption name="visibility" label="Internal job posting only" description="Visible for 1 week (Existing employees)" value="internal" checked={visibility === 'internal'} onChange={setVisibility} disabled={isSubmitted || jobType === 'Confidential'} />
                            <RadioOption name="visibility" label="External job posting only" description="Visible for 2 weeks (Outside market)" value="external" checked={visibility === 'external'} onChange={setVisibility} disabled={isSubmitted} />
                            <RadioOption name="visibility" label="Both Internal & External" description="Parallel sourcing activated" value="both" checked={visibility === 'both'} onChange={setVisibility} disabled={isSubmitted || jobType === 'Confidential'} />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block ml-4">Source of Profile Channels</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['AGENCY', 'EMPLOYEE REFERRAL', 'JOB PORTAL', 'CAMPUS', 'JOB FAIR', 'COMPANY WEBSITE', 'SOCIAL MEDIA', 'PRINT MEDIA'].map(channel => (
                                <CheckboxOption key={channel} label={channel} disabled={isSubmitted}/>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Module 2 */}
            <Card title="Module 2: AI Automated Documentation">
                <div className="flex justify-end mb-4">
                    <Button
                        type="button"
                        className="bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 text-xs"
                        onClick={handleAutomateSummaryAndJd}
                        disabled={isSubmitted || isGeneratingAiDocs}
                        isLoading={isGeneratingAiDocs}
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Automate Summary & JD
                    </Button>
                </div>
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-2 block">Job Summary (AI-Automated)</label>
                        <textarea
                            className="w-full h-24 bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                            placeholder="AI will generate summary here..."
                            disabled={isSubmitted || isGeneratingAiDocs}
                            value={aiSummary}
                            onChange={(e) => setAiSummary(e.target.value)}
                        ></textarea>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-2 block">Enhanced Job Description (AI-Automated)</label>
                        <textarea
                            className="w-full h-40 bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                            placeholder="Detailed responsibilities and requirements will appear here..."
                            disabled={isSubmitted}
                            value={mprForm.jobDescription}
                            onChange={e => setMprForm(prev => ({ ...prev, jobDescription: e.target.value }))}
                        ></textarea>
                    </div>
                </div>
            </Card>

            {/* Module 3 */}
            <Card title="Module 3: Vetting Framework">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Select label="Required Education qualification" options={['Premier Institute', 'others', 'Any']} disabled={isSubmitted} />
                    <Select
                        label="Min Exp in yrs"
                        options={minExpOptions}
                        value={minExpLabel}
                        onChange={handleMinExpChange}
                        disabled={isSubmitted}
                    />
                    <Select
                        label="Max Exp in yrs"
                        options={maxExpOptions}
                        value={maxExpLabel}
                        onChange={handleMaxExpChange}
                        disabled={isSubmitted}
                    />
                    <Input
                        label="Required Technical Skills"
                        placeholder="Comma separated"
                        className="lg:col-span-3"
                        disabled={isSubmitted}
                        value={mprForm.skillsRequired}
                        onChange={e => setMprForm(prev => ({ ...prev, skillsRequired: e.target.value }))}
                    />
                    <Input label="Location of work" placeholder="City, Country" disabled={isSubmitted} />
                    <Input label="Travel Requirement %" placeholder="0-100" type="number" disabled={isSubmitted} />
                </div>
            </Card>

            {/* Module 4 */}
            <Card title="Module 4: Working Logistics & Preferences">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Select label="Working type" options={['Work from office', 'Work from home', 'Hybrid', 'Freelancer', 'contractual', 'Gig work', 'Part-time', 'Intern']} disabled={isSubmitted}/>
                    <Select label="Working hours" options={['Regular shift', 'Night shift', 'Rotational shift']} disabled={isSubmitted}/>
                    <Select label="Weekly Working days" options={['4days', '5days', '6days']} disabled={isSubmitted}/>
                    <Select label="Transport provided" options={['co-provided', 'subsidised', 'own arrangement']} disabled={isSubmitted}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block ml-4">Gender Diversity Requirement</label>
                        <div className="flex flex-wrap gap-3">
                            {['Male', 'Female', 'Transgender', 'Any'].map(g => <CheckboxOption key={g} label={g} disabled={isSubmitted}/>)}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block ml-4">Joining time preferred</label>
                        <div className="flex flex-wrap gap-3">
                            {['IMMEDIATE JOINERS', '<30DAYS', '2MONTHS', '3MONTHS'].map(t => <CheckboxOption key={t} label={t} disabled={isSubmitted}/>)}
                        </div>
                    </div>
                </div>
            </Card>
            
            {/* Module 5: Approval Matrix */}
            {isSubmitted && (
                <Card title="Module 5: Executive Approval Matrix">
                    <div className="space-y-4">
                        <div className={`p-4 border rounded-2xl flex items-start gap-3 ${
                            mprStatus === 'APPROVED' ? 'bg-emerald-50 border-emerald-200' :
                            mprStatus === 'REJECTED' ? 'bg-rose-50 border-rose-200' :
                            'bg-indigo-50 border-indigo-200'
                        }`}>
                            {mprStatus === 'APPROVED' ? <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" /> :
                             mprStatus === 'REJECTED' ? <XCircle className="w-5 h-5 text-rose-600 mt-0.5" /> :
                             <Clock className="w-5 h-5 text-indigo-600 mt-0.5" />
                            }
                            <p className={`text-xs font-bold leading-relaxed ${
                                 mprStatus === 'APPROVED' ? 'text-emerald-800' :
                                 mprStatus === 'REJECTED' ? 'text-rose-800' :
                                 'text-indigo-800'
                            }`}>
                                This MPR has been submitted for executive approval. The fields are now locked. Current Status: <span className="font-black uppercase">{mprStatus}</span>
                            </p>
                        </div>
                        <ApprovalRow
                            title="HOD Approval"
                            subtitle="Head of Department"
                            status={hodApproval}
                            onApprove={() => setHodApproval('APPROVED')}
                            onReject={() => setHodApproval('REJECTED')}
                            disabled={true}
                        />
                        <ApprovalRow
                            title="CFO Approval"
                            subtitle="Chief Financial Officer"
                            status={cfoApproval}
                            onApprove={() => setCfoApproval('APPROVED')}
                            onReject={() => setCfoApproval('REJECTED')}
                            disabled={true}
                        />
                    </div>
                </Card>
            )}

            {/* Action Buttons */}
            {!isSubmitted && (
                <div className="flex justify-end items-center gap-4 pt-6 mt-8 border-t border-slate-100">
                    <Button variant="secondary" onClick={resetDraft}>Cancel Draft</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30" onClick={handleFinalize} isLoading={isSubmittingMpr}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Finalize & Publish
                    </Button>
                </div>
            )}
        </div>
    );
};

const InterviewPanel: React.FC = () => {
    const [selectedInterview, setSelectedInterview] = React.useState<any | null>(null);
    const [interviews, setInterviews] = React.useState<any[]>([]);

    const loadInterviews = React.useCallback(() => {
        api.manager.getInterviews()
          .then((data) => setInterviews(data || []))
          .catch((err) => console.error('Failed to load manager interviews:', err));
    }, []);

    React.useEffect(() => {
        loadInterviews();
    }, [loadInterviews]);

    const CheckboxGroup: React.FC<{ name: string; options: string[]; }> = ({ name, options }) => (
        <div className="flex flex-wrap gap-x-6 gap-y-3">
            {options.map(opt => (
                <label key={opt} className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" name={name} value={opt} className="accent-indigo-600 h-4 w-4 rounded border-slate-300" />
                    <span className="text-sm font-medium text-slate-700">{opt}</span>
                </label>
            ))}
        </div>
    );

    const EvaluationForm = ({ interview, onBack }: { interview: any, onBack: () => void }) => {
        const [outcome, setOutcome] = React.useState<'pass' | 'fail' | 'hold'>('pass');
        const [remarks, setRemarks] = React.useState('');
        const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false);

        const handleSubmitFeedback = async () => {
            setIsSubmittingFeedback(true);
            try {
                await api.manager.submitFeedback(String(interview.id), {
                    rating: 4,
                    outcome,
                    remarks: remarks.trim() || 'Feedback submitted by hiring manager.',
                });
                await loadInterviews();
                onBack();
            } catch (error) {
                console.error('Failed to submit manager feedback:', error);
                alert(error instanceof Error ? error.message : 'Failed to submit feedback');
            } finally {
                setIsSubmittingFeedback(false);
            }
        };

        return (
            <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
                <div className="flex justify-between items-center">
                     <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Interview Evaluation Protocol</h2>
                     <Button variant="secondary" onClick={onBack}>&larr; Back to Selection Hub</Button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <div className="text-sm font-black uppercase tracking-widest text-slate-400">Evaluating Candidate</div>
                    <div className="text-2xl font-black text-slate-800">{interview.candidate}</div>
                    <div className="text-sm font-bold text-indigo-600 mt-1">{interview.role}</div>
                </div>

                <Card title="Module 1: Temporal Log">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Input label="Job Title Artifact" value={interview.role} readOnly className="bg-slate-100"/>
                        <Input label="Interview Date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                        <Input label="Scheduled Start Time" type="time" defaultValue="14:00" />
                        <Input label="Scheduled End Time" type="time" defaultValue="15:00" />
                    </div>
                </Card>

                <Card title="Module 2: Evaluation DNA">
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-3 block">Active Round Selector</label>
                            <CheckboxGroup name="round-selector" options={['ROUND1', 'ROUND2', 'ROUND3']} />
                        </div>
                        <div className="pt-6 border-t border-slate-100">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-3 block">Mode of Interview</label>
                            <CheckboxGroup name="mode-selector" options={['F2F', 'VIDEO', 'TELECON']} />
                        </div>
                         <div className="pt-6 border-t border-slate-100">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-3 block">Interviewer Panel</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <Input label="" placeholder="# Interviewer Name1" />
                               <Input label="" placeholder="# Interviewer Name2 (Optional)" />
                               <Input label="" placeholder="# Interviewer Name3 (Optional)" />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Module 3: Outcome Protocol">
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-3 block">Final Status Assignment</label>
                            <CheckboxGroup name="status-selector" options={['SELECTED', 'REJECTED', 'HOLD']} />
                            <div className="mt-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Outcome</label>
                                <select
                                    value={outcome}
                                    onChange={(e) => setOutcome(e.target.value as 'pass' | 'fail' | 'hold')}
                                    className="mt-2 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-[2rem] focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4 outline-none"
                                >
                                    <option value="pass">PASS</option>
                                    <option value="fail">FAIL</option>
                                    <option value="hold">HOLD</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-slate-100">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-2 block">Evidentiary Audit Remarks</label>
                            <textarea
                                className="w-full h-32 bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                placeholder="Provide a detailed summary of the candidate's performance, strengths, and weaknesses..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            ></textarea>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end items-center gap-4 pt-6 mt-8 border-t border-slate-100">
                    <Button variant="secondary" onClick={onBack}>ABORT AUDIT</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30" onClick={handleSubmitFeedback} isLoading={isSubmittingFeedback}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        FINALIZE DECISION ARTICRAFT
                    </Button>
                </div>
            </div>
        );
    };

    const InterviewSelectionList = () => (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Interview Selection Hub</h2>
            <Card>
                <div className="space-y-4">
                    {interviews.map(interview => (
                        <div key={interview.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xl">
                                    {interview.candidate.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800">{interview.candidate}</div>
                                    <p className="text-sm text-slate-500">{interview.role} &bull; {interview.type}</p>
                                    <div className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-2">
                                        <Calendar className="w-3 h-3"/> {interview.time}
                                    </div>
                                </div>
                            </div>
                             <div className="flex items-center gap-4">
                                <Badge color={interview.status === 'COMPLETED' ? 'emerald' : 'indigo'}>{interview.status}</Badge>
                                {interview.status === 'COMPLETED' ? (
                                    <Button variant="ghost" className="h-10 text-xs" disabled>
                                        <CheckCircle className="w-4 h-4 mr-2" /> Submitted
                                    </Button>
                                ) : (
                                    <Button className="h-10 text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setSelectedInterview(interview)}>
                                        Select for Evaluation <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
    
    return selectedInterview 
        ? <EvaluationForm interview={selectedInterview} onBack={() => { setSelectedInterview(null); loadInterviews(); }} /> 
        : <InterviewSelectionList />;
};


// --- Main Container ---

export const ManagerDashboard: React.FC<{ currentPage: string }> = ({ currentPage }) => {
    switch(currentPage) {
        case 'mgr-requests': return <MyRequests />;
        case 'mgr-interviews': return <InterviewPanel />;
        case 'mgr-hub': 
        default: return <ManagerHub />;
    }
};
