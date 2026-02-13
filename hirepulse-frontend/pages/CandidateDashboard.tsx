import React from 'react';
import { Card, Button, Input, Badge, Modal } from '../components/UI';
import { api } from '../services/api';
import { JobRequisition } from '../types';
import { 
    Search, 
    MapPin, 
    Clock, 
    Briefcase, 
    ChevronRight, 
    User, 
    FileText, 
    CheckCircle, 
    Shield, 
    Upload, 
    Hash,
    Filter,
    Activity,
    Trash2,
    PlusCircle,
    AlertTriangle,
    Download
} from 'lucide-react';


// --- Helper Components for Application Form ---

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[] }> = ({ label, options, className = '', ...props }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">{label}</label>
    <select 
      className={`bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-[2rem] focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4 placeholder-slate-400 transition-all ${className}`} 
      {...props} 
    >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; helpText?: string }> = ({ label, checked, onChange, helpText }) => (
    <div>
        <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-bold text-slate-800">{label}</span>
            <button 
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </label>
        {helpText && <p className="text-xs text-slate-400 mt-1">{helpText}</p>}
    </div>
);

const FileInput: React.FC<{ label: string; onFileSelect?: (file: File | null) => void }> = ({ label, onFileSelect }) => {
    const [fileName, setFileName] = React.useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileName(e.target.files[0].name);
            onFileSelect?.(e.target.files[0]);
        } else {
            setFileName(null);
            onFileSelect?.(null);
        }
    };

    return (
        <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">{label}</label>
            <div className="relative">
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleChange} />
                <div className={`text-sm rounded-[2rem] block w-full p-4 text-center cursor-pointer transition-colors truncate ${
                    fileName
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}>
                    {fileName || 'BROWSE'}
                </div>
            </div>
        </div>
    );
};


// --- Sub-Screens ---

const ApplicationForm: React.FC<{ job: JobRequisition, onCancel: () => void }> = ({ job, onCancel }) => {
    type EducationEntry = {
        id: number;
        qualification: string;
        degree: string;
        institution: string;
        board: string;
        year: string;
        score: string;
    };
    type ExperienceEntry = {
        id: number;
        employer: string;
        designation: string;
        annualCtc: string;
        startDate: string;
        endDate: string;
        reason: string;
        responsibilities: string;
    };
    const [toggles, setToggles] = React.useState({
        consent: false,
        relocate: false,
        buyout: false,
        negotiable: false,
        bgv: false,
        criminal: false,
        relative: false,
        friend: false,
        veteran: false,
        careerBreak: false,
        socialConsent: false,
        digilockerConsent: false,
    });
    const [educations, setEducations] = React.useState<EducationEntry[]>([{
        id: 1, qualification: '', degree: '', institution: '', board: '', year: '', score: '',
    }]);
    const [experiences, setExperiences] = React.useState<ExperienceEntry[]>([{
        id: 1, employer: '', designation: '', annualCtc: '', startDate: '', endDate: '', reason: '', responsibilities: '',
    }]);
    const [languages, setLanguages] = React.useState([{ id: 1, name: '', read: false, write: false, speak: false }]);
    const [relativeInfo, setRelativeInfo] = React.useState({ code: '', name: '', contact: '' });
    const [friendInfo, setFriendInfo] = React.useState({ code: '', name: '', contact: '' });
    const [resumeFile, setResumeFile] = React.useState<File | null>(null);
    const [aadhaarFile, setAadhaarFile] = React.useState<File | null>(null);
    const [panFile, setPanFile] = React.useState<File | null>(null);
    const [aadhaarNumber, setAadhaarNumber] = React.useState('');
    const [panNumber, setPanNumber] = React.useState('');
    const [isSubmittingApplication, setIsSubmittingApplication] = React.useState(false);
    const [isAutoFilling, setIsAutoFilling] = React.useState(false);
    const [resumeUploadedForApplication, setResumeUploadedForApplication] = React.useState(false);
    const [applicationFields, setApplicationFields] = React.useState({
        firstName: '',
        middleName: '',
        lastName: '',
        personalEmail: '',
        primaryPhone: '',
        currentAddress: '',
        city: '',
        state: '',
        zipCode: '',
        nativePlace: '',
        currentCompany: '',
        currentDesignation: '',
        primarySkills: '',
    });

    const handleToggle = (key: keyof typeof toggles) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };
    
    const handleRelativeInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRelativeInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleFriendInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFriendInfo(prev => ({ ...prev, [name]: value }));
    };

    const addEducation = () => setEducations(prev => [...prev, {
        id: Date.now(), qualification: '', degree: '', institution: '', board: '', year: '', score: '',
    }]);
    const removeEducation = (id: number) => {
        if (educations.length > 1) setEducations(prev => prev.filter(e => e.id !== id));
    };
    const handleEducationChange = (id: number, field: keyof Omit<EducationEntry, 'id'>, value: string) => {
        setEducations((prev) => prev.map((edu) => edu.id === id ? { ...edu, [field]: value } : edu));
    };
    
    const addExperience = () => setExperiences(prev => [...prev, {
        id: Date.now(), employer: '', designation: '', annualCtc: '', startDate: '', endDate: '', reason: '', responsibilities: '',
    }]);
    const removeExperience = (id: number) => {
        if (experiences.length > 1) setExperiences(prev => prev.filter(e => e.id !== id));
    };

    const handleExperienceChange = (id: number, field: keyof Omit<ExperienceEntry, 'id'>, value: string) => {
        setExperiences(prev => prev.map(exp => {
            if (exp.id === id) {
                const updatedExp = { ...exp, [field]: value };
                // Ensure end date is not before start date
                if (field === 'startDate' && updatedExp.endDate && value > updatedExp.endDate) {
                    updatedExp.endDate = value;
                }
                return updatedExp;
            }
            return exp;
        }));
    };

    const calculateExperience = (startDateStr: string, endDateStr: string): { years: number, months: number } => {
        if (!startDateStr || !endDateStr) return { years: 0, months: 0 };
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return { years: 0, months: 0 };

        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        
        if (end.getDate() < start.getDate()) {
            months--;
        }
        if (months < 0) {
            years--;
            months += 12;
        }
        return { years, months };
    };

    const addLanguage = () => setLanguages(prev => [...prev, { id: Date.now(), name: '', read: false, write: false, speak: false }]);
    const removeLanguage = (id: number) => {
        if (languages.length > 1) setLanguages(prev => prev.filter(l => l.id !== id));
    };

    const handleFieldChange = (field: keyof typeof applicationFields, value: string) => {
        setApplicationFields((prev) => ({ ...prev, [field]: value }));
    };

    const handleResumeSelect = async (file: File | null) => {
        setResumeFile(file);
        setResumeUploadedForApplication(false);
        if (!file) return;

        setIsAutoFilling(true);
        try {
            await api.candidate.uploadDocument(file, 'resume', true);
            setResumeUploadedForApplication(true);
            const autoFilled = await api.candidate.autoFillForJob(job.id);
            const personal = autoFilled?.application_data?.personal_info || {};
            const professional = autoFilled?.application_data?.professional || {};
            const autoEducations = Array.isArray(autoFilled?.application_data?.education) ? autoFilled.application_data.education : [];
            const autoExperiences = Array.isArray(autoFilled?.application_data?.work_experience) ? autoFilled.application_data.work_experience : [];
            const fullName = String(personal?.name || '').trim();
            const parts = fullName ? fullName.split(/\s+/) : [];
            const firstName = parts.length > 0 ? parts[0] : '';
            const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
            const middleName = parts.length > 2 ? parts.slice(1, -1).join(' ') : '';

            setApplicationFields((prev) => ({
                ...prev,
                firstName: prev.firstName || firstName,
                middleName: prev.middleName || middleName,
                lastName: prev.lastName || lastName,
                personalEmail: prev.personalEmail || String(personal?.email || ''),
                primaryPhone: prev.primaryPhone || String(personal?.phone || ''),
                currentAddress: prev.currentAddress || String(personal?.address || ''),
                city: prev.city || String(personal?.city || ''),
                nativePlace: prev.nativePlace || String(personal?.city || ''),
                currentCompany: prev.currentCompany || String(professional?.current_company || ''),
                currentDesignation: prev.currentDesignation || String(professional?.current_position || ''),
                primarySkills: prev.primarySkills || (Array.isArray(professional?.skills) ? professional.skills.join(', ') : ''),
            }));

            if (autoEducations.length > 0) {
                setEducations(autoEducations.slice(0, 5).map((item: any, index: number) => ({
                    id: Date.now() + index,
                    qualification: String(item?.qualification || item?.level || ''),
                    degree: String(item?.degree || item?.course || ''),
                    institution: String(item?.institution || item?.school || item?.college || ''),
                    board: String(item?.board || item?.university || ''),
                    year: String(item?.year || item?.year_of_passing || ''),
                    score: String(item?.score || item?.percentage || item?.cgpa || ''),
                })));
            }

            if (autoExperiences.length > 0) {
                setExperiences(autoExperiences.slice(0, 5).map((item: any, index: number) => ({
                    id: Date.now() + 100 + index,
                    employer: String(item?.company || item?.employer || ''),
                    designation: String(item?.position || item?.designation || ''),
                    annualCtc: String(item?.annualCtc || item?.ctc || ''),
                    startDate: String(item?.startDate || item?.start_date || ''),
                    endDate: String(item?.endDate || item?.end_date || ''),
                    reason: String(item?.reason || ''),
                    responsibilities: String(item?.responsibilities || item?.summary || ''),
                })));
            }
        } catch (error) {
            console.error('Resume auto-fill failed:', error);
            alert(error instanceof Error ? error.message : 'Failed to parse and auto-fill from resume');
        } finally {
            setIsAutoFilling(false);
        }
    };

    const handleSubmitApplication = async () => {
        if (!resumeFile) {
            alert('Please upload your resume before submitting application.');
            return;
        }
        setIsSubmittingApplication(true);
        try {
            if (!resumeUploadedForApplication) {
                await api.candidate.uploadDocument(resumeFile, 'resume', true);
            }
            if (aadhaarFile) {
                await api.candidate.uploadDocument(aadhaarFile, 'aadhaar', false);
            }
            if (panFile) {
                await api.candidate.uploadDocument(panFile, 'pan', false);
            }

            await api.candidate.applyForJob(job.id, {
                personal_info: {
                    name: [applicationFields.firstName, applicationFields.middleName, applicationFields.lastName]
                        .filter(Boolean)
                        .join(' ')
                        .trim(),
                    email: applicationFields.personalEmail || null,
                    phone: applicationFields.primaryPhone || null,
                    address: applicationFields.currentAddress || null,
                    city: applicationFields.city || null,
                    state: applicationFields.state || null,
                },
                professional: {
                    current_company: applicationFields.currentCompany || null,
                    current_position: applicationFields.currentDesignation || null,
                    skills: applicationFields.primarySkills
                        ? applicationFields.primarySkills.split(',').map((s) => s.trim()).filter(Boolean)
                        : [],
                },
                education: educations.map((edu) => ({
                    qualification: edu.qualification || null,
                    degree: edu.degree || null,
                    institution: edu.institution || null,
                    board: edu.board || null,
                    year: edu.year || null,
                    score: edu.score || null,
                })),
                work_experience: experiences.map((exp) => ({
                    company: exp.employer || null,
                    position: exp.designation || null,
                    annualCtc: exp.annualCtc || null,
                    startDate: exp.startDate || null,
                    endDate: exp.endDate || null,
                    reason: exp.reason || null,
                    responsibilities: exp.responsibilities || null,
                })),
                compliance: {
                    aadhaarNumber: aadhaarNumber || null,
                    panNumber: panNumber || null,
                    bgvConsent: toggles.bgv,
                    criminalDisclosure: toggles.criminal,
                },
            });
            alert('Application submitted successfully.');
            onCancel();
        } catch (error) {
            console.error('Failed to submit application:', error);
            alert(error instanceof Error ? error.message : 'Failed to submit application');
        } finally {
            setIsSubmittingApplication(false);
        }
    };

    return (
        <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-start">
                <Button variant="secondary" onClick={onCancel}>
                    &larr; Back to Job Board
                </Button>
            </div>
            {/* Header */}
            <div className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Application for</p>
                <h2 className="text-3xl font-black text-slate-800 mt-1">{job.title}</h2>
                <p className="text-sm font-mono text-slate-400 mt-2">Requisition ID: {job.id}</p>
            </div>

            {/* Application Meta */}
            <Card title="Application Meta">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                    <Input label="Application Reference" value="" readOnly className="bg-slate-100" />
                    <Input label="Application Date" value={new Date().toLocaleDateString('en-CA')} readOnly className="bg-slate-100" />
                    <Select label="Application Source" options={['CARRER PAGE', 'EMPLOYEE REFERRAL', 'PLACEMENT CONSULTANT', 'JOBS PORTAL', 'CAMPUS', 'WALK-IN', 'JOB FAIR', 'VENDOR REFERRAL', 'CO WEBSITE', 'SOCIAL MEDIA', 'PRINT MEDIA']} />
                    <Select label="Candidate Type" options={['EXTERNAL', 'INTERNAL', 'ALUMNI', 'GIG', 'CONSULTANT']} />
                    <div className="lg:col-span-2">
                        <Toggle label="Consent to Process Application" checked={toggles.consent} onChange={() => handleToggle('consent')} helpText="I agree to the processing of my data for this role." />
                    </div>
                </div>
            </Card>

            {/* Module 1: Personal Identity DNA */}
            <Card title="Module 1: Personal Identity DNA">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label="First Name" placeholder="Your given name" value={applicationFields.firstName} onChange={(e) => handleFieldChange('firstName', e.target.value)} />
                    <Input label="Middle Name" placeholder="(Optional)" value={applicationFields.middleName} onChange={(e) => handleFieldChange('middleName', e.target.value)} />
                    <Input label="Last Name" placeholder="Your family name" value={applicationFields.lastName} onChange={(e) => handleFieldChange('lastName', e.target.value)} />
                    <Input label="Date of Birth" type="date" />
                    <Select label="Gender" options={['MALE', 'FEMALE', 'NON-BINARY', 'PREFER NOT TO SAY']} />
                    <Select label="Marital Status" options={['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']} />
                </div>
            </Card>

            {/* Module 2: Contact & Address Hub */}
            <Card title="Module 2: Contact & Address Hub">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Personal Email" type="email" placeholder="you@example.com" value={applicationFields.personalEmail} onChange={(e) => handleFieldChange('personalEmail', e.target.value)} />
                    <Input label="Primary Phone" type="tel" placeholder="+1 (555) 123-4567" value={applicationFields.primaryPhone} onChange={(e) => handleFieldChange('primaryPhone', e.target.value)} />
                    <Input label="Current Residential Address" placeholder="123 Main St, Apt 4B" className="md:col-span-2" value={applicationFields.currentAddress} onChange={(e) => handleFieldChange('currentAddress', e.target.value)} />
                    <Input label="City" placeholder="e.g. New York" value={applicationFields.city} onChange={(e) => handleFieldChange('city', e.target.value)} />
                    <Input label="State" placeholder="e.g. NY" value={applicationFields.state} onChange={(e) => handleFieldChange('state', e.target.value)} />
                    <Input label="Zip Code" placeholder="e.g. 10001" value={applicationFields.zipCode} onChange={(e) => handleFieldChange('zipCode', e.target.value)} />
                    <Input label="Native Place" placeholder="City, State" value={applicationFields.nativePlace} onChange={(e) => handleFieldChange('nativePlace', e.target.value)} />
                </div>
            </Card>
            
            {/* Module 3: Academic Repository */}
            <Card title="Module 3: Academic Repository" action={<Button variant="secondary" className="text-xs h-8" onClick={addEducation}><PlusCircle className="w-4 h-4 mr-2"/>ADD EDUCATION</Button>}>
                <div className="space-y-4">
                    {educations.map((edu, index) => (
                        <div key={edu.id} className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                            {educations.length > 1 && <button onClick={() => removeEducation(edu.id)} className="absolute top-2 right-2 p-1.5 text-rose-400 hover:bg-rose-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>}
                            <Select label={`Qualification ${index + 1}`} options={['', '10TH STD', '12TH STD/DIPLOMA', 'BACHELORS', 'MASTERS', 'PHD/DOCTORATE']} value={edu.qualification} onChange={(e) => handleEducationChange(edu.id, 'qualification', e.target.value)} />
                            <Input label="Degree / Course Name" placeholder="e.g. B.Tech in C.S." value={edu.degree} onChange={(e) => handleEducationChange(edu.id, 'degree', e.target.value)} />
                            <Input label="Institution Name" placeholder="e.g. State University" value={edu.institution} onChange={(e) => handleEducationChange(edu.id, 'institution', e.target.value)} />
                            <Input label="University / Board" placeholder="e.g. State Board" value={edu.board} onChange={(e) => handleEducationChange(edu.id, 'board', e.target.value)} />
                            <Input label="Year of Passing" type="number" placeholder="YYYY" value={edu.year} onChange={(e) => handleEducationChange(edu.id, 'year', e.target.value)} />
                            <Input label="Percentage / CGPA" placeholder="e.g. 85.5 or 8.5" value={edu.score} onChange={(e) => handleEducationChange(edu.id, 'score', e.target.value)} />
                        </div>
                    ))}
                </div>
            </Card>

            {/* Module 4: Professional Hub */}
            <Card title="Module 4: Professional Hub" action={<Button variant="secondary" className="text-xs h-8" onClick={addExperience}><PlusCircle className="w-4 h-4 mr-2"/>ADD EXPERIENCE</Button>}>
                 <div className="space-y-4">
                    {experiences.map((exp, index) => {
                        const { years, months } = calculateExperience(exp.startDate, exp.endDate);
                        return (
                            <div key={exp.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                                {experiences.length > 1 && <button onClick={() => removeExperience(exp.id)} className="absolute top-2 right-2 p-1.5 text-rose-400 hover:bg-rose-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {index === 0 ? (
                                        <Input
                                            label="Employer Name"
                                            placeholder="e.g., Acme Corp"
                                            className="md:col-span-2"
                                            value={exp.employer}
                                            onChange={(e) => {
                                                handleExperienceChange(exp.id, 'employer', e.target.value);
                                                if (index === 0) handleFieldChange('currentCompany', e.target.value);
                                            }}
                                        />
                                    ) : (
                                        <Input label="Employer Name" placeholder="e.g., Acme Corp" className="md:col-span-2" value={exp.employer} onChange={(e) => handleExperienceChange(exp.id, 'employer', e.target.value)} />
                                    )}
                                    {index === 0 ? (
                                        <Input
                                            label="Designation"
                                            placeholder="e.g., Software Engineer"
                                            value={exp.designation}
                                            onChange={(e) => {
                                                handleExperienceChange(exp.id, 'designation', e.target.value);
                                                if (index === 0) handleFieldChange('currentDesignation', e.target.value);
                                            }}
                                        />
                                    ) : (
                                        <Input label="Designation" placeholder="e.g., Software Engineer" value={exp.designation} onChange={(e) => handleExperienceChange(exp.id, 'designation', e.target.value)} />
                                    )}
                                    <Input label="Annual CTC (INR)" type="number" placeholder="e.g. 1200000" value={exp.annualCtc} onChange={(e) => handleExperienceChange(exp.id, 'annualCtc', e.target.value)} />
                                    <Input label="Start Date" type="date" value={exp.startDate} onChange={e => handleExperienceChange(exp.id, 'startDate', e.target.value)} />
                                    <Input label="End Date / Last Working Day" type="date" value={exp.endDate} onChange={e => handleExperienceChange(exp.id, 'endDate', e.target.value)} min={exp.startDate} />
                                    <Input label="Total Experience (Years)" value={years} readOnly className="bg-white text-indigo-800 font-bold border-slate-200" />
                                    <Input label="Total Experience (Months)" value={months} readOnly className="bg-white text-indigo-800 font-bold border-slate-200" />
                                    <textarea placeholder="Reason for Leaving" value={exp.reason} onChange={(e) => handleExperienceChange(exp.id, 'reason', e.target.value)} className="md:col-span-2 lg:col-span-4 bg-white border border-slate-200 text-slate-900 text-sm rounded-[2rem] focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4 placeholder-slate-400 transition-all h-24" />
                                    <textarea placeholder="Core Responsibilities" value={exp.responsibilities} onChange={(e) => handleExperienceChange(exp.id, 'responsibilities', e.target.value)} className="md:col-span-2 lg:col-span-4 bg-white border border-slate-200 text-slate-900 text-sm rounded-[2rem] focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4 placeholder-slate-400 transition-all h-24" />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>
            
            {/* Module 5: Skills & Competencies Hub */}
            <Card title="Module 5: Skills & Competencies Hub">
                <Input label="Primary Technical Skills (Comma Separated)" placeholder="e.g. React, Node.js, Python" className="mb-6" value={applicationFields.primarySkills} onChange={(e) => handleFieldChange('primarySkills', e.target.value)} />
                <div className="pt-6 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Language Proficiency</label>
                        <Button variant="secondary" className="text-xs h-8" onClick={addLanguage}><PlusCircle className="w-4 h-4 mr-2"/>ADD LANGUAGE</Button>
                    </div>
                    <div className="space-y-2">
                        {languages.map(lang => (
                             <div key={lang.id} className="flex items-center gap-4 p-2 bg-slate-50 rounded-xl border border-slate-200 group">
                                <Input label="" placeholder="Language" className="flex-1"/>
                                <div className="flex gap-4 px-4">
                                    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="w-4 h-4 accent-indigo-600 rounded"/> READ</label>
                                    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="w-4 h-4 accent-indigo-600 rounded"/> WRITE</label>
                                    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="w-4 h-4 accent-indigo-600 rounded"/> SPEAK</label>
                                </div>
                                {languages.length > 1 && <button onClick={() => removeLanguage(lang.id)} className="p-1.5 text-rose-400 hover:bg-rose-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Module 6: Mobility & Job Preferences */}
            <Card title="Module 6: Mobility & Job Preferences">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label="Preferred Work Location (1st Choice)" placeholder="City, Country" />
                    <Input label="Preferred Work Location (2nd Choice)" placeholder="City, Country" />
                    <Input label="Preferred Work Location (3rd Choice)" placeholder="City, Country" />
                    <Select 
                        label="Notice Period" 
                        options={['Immediate joinee', '< 15days', '30days', '2 months', '3months']} 
                    />
                    <Select label="Preferred Work Mode" options={['ONSITE', 'HYBRID', 'REMOTE']} />
                    <Select label="Shift Preference" options={['GENERAL', 'NIGHT', 'ROTATIONAL']} />
                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                        <Toggle label="Willing to relocate" checked={toggles.relocate} onChange={() => handleToggle('relocate')} />
                        <Toggle label="Notice buyout required" checked={toggles.buyout} onChange={() => handleToggle('buyout')} />
                    </div>
                </div>
            </Card>

            {/* Module 7: Compensation Expectations Hub */}
            <Card title="Module 7: Compensation Expectations Hub">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <Input label="Current Annual Fixed CTC (INR)" type="number" placeholder="e.g. 1200000" />
                    <Input label="Minimum Acceptable CTC (INR)" type="number" placeholder="e.g. 1500000" />
                    <Input label="Joining Bonus Expectation (If any)" type="number" placeholder="e.g. 100000" />
                    <div className="md:col-span-2 lg:col-span-3">
                        <Toggle label="Is CTC Negotiable?" checked={toggles.negotiable} onChange={() => handleToggle('negotiable')} />
                    </div>
                </div>
            </Card>

            {/* Module 8: Statutory Audit & Compliance DNA */}
            <Card title="Module 8: Statutory Audit & Compliance DNA">
                <div className="space-y-6">
                    <Toggle label="BGV Consent" helpText="I authorize background verification checks." checked={toggles.bgv} onChange={() => handleToggle('bgv')} />
                    <Toggle label="Criminal Record Disclosure" helpText="I have a past criminal record." checked={toggles.criminal} onChange={() => handleToggle('criminal')} />
                    
                    <div className="space-y-2">
                        <Toggle label="Relative in Organization" helpText="I have a relative currently working here." checked={toggles.relative} onChange={() => handleToggle('relative')} />
                        {toggles.relative && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-[fadeIn_0.3s_ease-out]">
                                <Input label="Relative's Employee Code" name="code" placeholder="e.g. 8821" value={relativeInfo.code} onChange={handleRelativeInfoChange} />
                                <Input label="Relative's Name" name="name" placeholder="e.g. John Doe" value={relativeInfo.name} onChange={handleRelativeInfoChange} />
                                <Input label="Relative's Contact Number" name="contact" placeholder="e.g. +1..." value={relativeInfo.contact} onChange={handleRelativeInfoChange} />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Toggle label="Friend in Organization" helpText="I have a friend currently working here." checked={toggles.friend} onChange={() => handleToggle('friend')} />
                         {toggles.friend && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-[fadeIn_0.3s_ease-out]">
                                <Input label="Friend's Employee Code" name="code" placeholder="e.g. 8822" value={friendInfo.code} onChange={handleFriendInfoChange} />
                                <Input label="Friend's Name" name="name" placeholder="e.g. Jane Smith" value={friendInfo.name} onChange={handleFriendInfoChange} />
                                <Input label="Friend's Contact Number" name="contact" placeholder="e.g. +1..." value={friendInfo.contact} onChange={handleFriendInfoChange} />
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-6 border-t border-slate-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-4">Social & Digital Identity</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <Input label="LinkedIn Profile URL" placeholder="https://linkedin.com/in/..." />
                            <Input label="X (Twitter) Handle" placeholder="@handle" />
                            <Input label="Instagram Profile URL" placeholder="https://instagram.com/..." />
                            <Input label="Github Profile URL" placeholder="https://github.com/..." />
                        </div>
                        <Toggle label="Social Media Consent" helpText="I consent to a background check on my social media profiles." checked={toggles.socialConsent} onChange={() => handleToggle('socialConsent')} />
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <Toggle label="DigiLocker Consent" helpText="I authorize HirePulse to access my documents via DigiLocker for faster verification." checked={toggles.digilockerConsent} onChange={() => handleToggle('digilockerConsent')} />
                    </div>

                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-[1.5rem] flex items-start gap-3 mt-4">
                        <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
                        <p className="text-xs font-bold text-rose-800 leading-relaxed">
                            <span className="uppercase tracking-wider block mb-1">WARNING</span>
                            Falsifying any statutory information will result in immediate disqualification and blacklisting.
                        </p>
                    </div>
                </div>
            </Card>
            
            {/* Module 9: Diversity, Equity & Inclusion (DEI) */}
            <Card title="Module 9: Diversity, Equity & Inclusion (DEI)">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Select label="Gender Identity" options={['MALE', 'FEMALE', 'TRANSGENDER', 'NON-BINARY', 'TWO-SPIRIT', 'PREFER NOT TO SAY']} />
                    <Select label="Reservation Category" options={['GENERAL/OPEN', 'SC', 'ST', 'OBC', 'EWS', 'PWD']} />
                    <Toggle label="Veteran Status" checked={toggles.veteran} onChange={() => handleToggle('veteran')} />
                    <Toggle label="Career Break Disclosure" checked={toggles.careerBreak} onChange={() => handleToggle('careerBreak')} />
                </div>
            </Card>

            {/* Module 10: Document Repository DNA */}
            <Card title="Module 10: Document Repository DNA">
                {isAutoFilling && (
                    <div className="mb-4 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                        Resume is being parsed and application details are being auto-filled.
                    </div>
                )}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <FileInput label="Curriculum Vitae (Resume)*" onFileSelect={handleResumeSelect} />
                         <FileInput label="Professional Headshot" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <Input
                            label="Aadhaar No"
                            placeholder="Enter 12-digit number"
                            type="text"
                            pattern="\d*"
                            maxLength={12}
                            value={aadhaarNumber}
                            onChange={(e) => setAadhaarNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        />
                        <FileInput label="Upload Aadhaar" onFileSelect={setAadhaarFile} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <Input
                            label="PAN No"
                            placeholder="Enter Alphanumeric PAN"
                            type="text"
                            maxLength={10}
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                        />
                        <FileInput label="Upload PAN Card*" onFileSelect={setPanFile} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <Input label="UAN No" placeholder="Enter 12-digit UAN" type="text" pattern="\d*" maxLength={12} onChange={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} />
                        <FileInput label="Upload UAN Document" />
                    </div>
                </div>
            </Card>
            
            {/* Action Buttons */}
            <div className="flex justify-end items-center gap-4 mt-12 pt-8 border-t border-slate-200">
                <Button variant="secondary" className="h-12 px-8" onClick={onCancel}>CANCEL AUDIT</Button>
                <Button className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30" onClick={handleSubmitApplication} isLoading={isSubmittingApplication}>
                    <CheckCircle className="w-4 h-4 mr-2" /> SUBMIT AUDIT
                </Button>
            </div>
        </div>
    );
};

const JobBoard: React.FC<{ onApply: (job: JobRequisition) => void }> = ({ onApply }) => {
  const [jobs, setJobs] = React.useState<JobRequisition[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');

    React.useEffect(() => {
    api.jobs.getAll().then(setJobs);
  }, []);

  const filteredJobs = jobs.filter(j => 
      j.status === 'OPEN' && (
        j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        j.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
        {/* Hero Search */}
        <div className="bg-indigo-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
            
            <div className="relative z-10 max-w-2xl">
                <h2 className="text-3xl font-black tracking-tight mb-4">FIND YOUR NEXT MISSION</h2>
                <p className="text-indigo-200 mb-8 font-medium">
                    Explore opportunities within the enterprise ecosystem. Filter by location, expertise, and urgency.
                </p>
                
                <div className="flex gap-4 p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                    <div className="flex-1 flex items-center px-4">
                        <Search className="w-5 h-5 text-indigo-300 mr-3" />
                        <input 
                            type="text" 
                            placeholder="Search roles (e.g. 'Product Designer')" 
                            className="bg-transparent border-none outline-none text-white placeholder-indigo-300 w-full font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button className="rounded-full px-8 bg-white text-indigo-900 hover:bg-indigo-50 border-none">Search</Button>
                </div>
            </div>
        </div>

        <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Open Positions ({filteredJobs.length})</h3>
            <div className="flex gap-2">
                <Badge color="slate">All Depts</Badge>
                <Badge color="slate">Remote Friendly</Badge>
                <Badge color="rose">Urgent Only</Badge>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.map(job => (
                <div key={job.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all group relative overflow-hidden">
                    <div className="mb-4">
                        <div className="flex gap-2 mb-3">
                            {job.priority === 'URGENT' && <span className="inline-flex items-center px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-md">Urgent Filling</span>}
                            <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-md">{job.id}</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 leading-tight group-hover:text-indigo-900 transition-colors">{job.title}</h3>
                        <p className="text-sm font-bold text-slate-500 mt-1">{job.department}</p>
                    </div>

                    <div className="flex items-center space-x-6 mb-8 pt-4 border-t border-slate-100">
                        <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wide">
                            <MapPin className="w-3 h-3 mr-1.5" /> 
                            <span>Not specified</span>
                        </div>
                        <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wide">
                            <Clock className="w-3 h-3 mr-1.5" /> 
                            <span>Not specified</span>
                        </div>
                    </div>

                    <Button 
                        variant="secondary" 
                        onClick={() => onApply(job)}
                        className="w-full group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 shadow-none group-hover:shadow-lg group-hover:shadow-indigo-500/30"
                    >
                        Apply for Position
                    </Button>
                </div>
            ))}
        </div>
    </div>
  );
};

const MyProfile: React.FC = () => {
    const [isEditing, setIsEditing] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isUploadingDocument, setIsUploadingDocument] = React.useState(false);
    const [deletingDocumentId, setDeletingDocumentId] = React.useState<string | null>(null);

    const [profileData, setProfileData] = React.useState({
        name: "",
        role: "",
        skills: [] as string[],
        documents: [] as any[]
    });
    const [initialProfileData, setInitialProfileData] = React.useState(profileData);

    React.useEffect(() => {
      api.candidate.getProfile().then((data) => {
        setProfileData(data);
        setInitialProfileData(data);
      }).catch((err) => console.error('Failed to load profile:', err));
    }, []);

    const handleEditToggle = async () => {
        if (isEditing) {
            try {
                const saved = await api.candidate.updateProfile({
                    name: profileData.name,
                    skills: profileData.skills,
                });
                setProfileData((prev) => ({ ...prev, ...saved }));
                setInitialProfileData((prev) => ({ ...prev, ...saved }));
            } catch (error) {
                console.error('Failed to save profile:', error);
            }
        }
        setIsEditing(!isEditing);
    };

    const handleCancelEdit = () => {
        setProfileData(initialProfileData);
        setIsEditing(false);
    };
    
    const handleProfileChange = (field: 'name', value: string) => {
        setProfileData(prev => ({...prev, [field]: value}));
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsUploadingDocument(true);
            api.candidate.uploadDocument(file, 'resume', true)
              .then(() => api.candidate.getProfile())
              .then((fresh) => {
                setProfileData(fresh);
                setInitialProfileData(fresh);
              })
              .catch((error) => {
                console.error('Upload failed:', error);
                alert(error instanceof Error ? error.message : 'Failed to upload document');
              })
              .finally(() => setIsUploadingDocument(false));
        }
        if(event.target) {
            event.target.value = ''; // Allow re-uploading the same file
        }
    };

    const handleDeleteDocument = async (documentId: string) => {
        if (!window.confirm('Delete this document? This action cannot be undone.')) return;
        setDeletingDocumentId(documentId);
        try {
            await api.candidate.deleteDocument(documentId);
            const fresh = await api.candidate.getProfile();
            setProfileData(fresh);
            setInitialProfileData(fresh);
        } catch (error) {
            console.error('Document delete failed:', error);
            alert(error instanceof Error ? error.message : 'Failed to delete document');
        } finally {
            setDeletingDocumentId(null);
        }
    };


    return (
        <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
            {/* Header Card */}
            <div className="bg-white rounded-[3rem] p-8 border border-slate-200 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
                 
                 <div className="w-32 h-32 rounded-full bg-indigo-50 border-4 border-white shadow-xl flex items-center justify-center text-3xl font-black text-indigo-300 relative">
                    {profileData.name ? profileData.name.charAt(0) : '?'}
                    <div className="absolute bottom-2 right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                 </div>

                 <div className="flex-1 text-center md:text-left space-y-2 w-full">
                    {isEditing ? (
                         <Input label="Full Name" value={profileData.name} onChange={e => handleProfileChange('name', e.target.value)} />
                    ) : (
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <h2 className="text-2xl font-black text-slate-800">{profileData.name || ''}</h2>
                            <Badge color="indigo">Verified Artifact</Badge>
                        </div>
                    )}
                    <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2">
                        <Briefcase className="w-4 h-4" /> {profileData.role || ''}
                    </p>
                 </div>

                 <div className="flex items-center gap-2">
                    {isEditing && (
                        <Button variant="secondary" onClick={handleCancelEdit}>Cancel</Button>
                    )}
                    <Button variant={isEditing ? 'primary' : 'secondary'} className="min-w-[140px]" onClick={handleEditToggle}>
                        {isEditing ? 'Save Changes' : 'Edit Profile'}
                    </Button>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Skill DNA */}
                <Card title="Skill DNA Matrix" className="lg:col-span-2">
                     {isEditing ? (
                        <div className="w-full">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-2 block">Skills (Comma Separated)</label>
                            <textarea
                                className="w-full h-24 bg-slate-50 border border-slate-200 rounded-[2rem] p-4 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                value={profileData.skills.join(', ')}
                                onChange={e => setProfileData(p => ({...p, skills: e.target.value.split(',').map(s => s.trim())}))}
                            />
                        </div>
                     ) : (
                        <div className="flex flex-wrap gap-3">
                            {profileData.skills.map(skill => (
                                <div key={skill} className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Hash className="w-3 h-3 text-indigo-400" />
                                    {skill}
                                </div>
                            ))}
                            <button className="px-4 py-2 border border-dashed border-slate-300 rounded-xl text-sm font-bold text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                                + Add Skill
                            </button>
                        </div>
                     )}
                     <div className="mt-8 p-4 bg-indigo-50 rounded-2xl flex items-start gap-3">
                        <Shield className="w-5 h-5 text-indigo-600 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-indigo-900">AI Vetting Analysis</h4>
                            <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                                Skill analysis is generated from your uploaded profile and applications.
                            </p>
                        </div>
                     </div>
                </Card>

                {/* Document Vault */}
                <Card title="Secure Document Vault">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <div className="space-y-4">
                        {profileData.documents.map((doc, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-white rounded-xl border border-slate-100 text-slate-400 flex-shrink-0">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="text-xs font-bold text-slate-800 truncate">{doc.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{doc.type}</div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    {doc.status === 'VERIFIED' ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <div title="Verification Pending" className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-amber-500 animate-spin"></div>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                                    onClick={() => handleDeleteDocument(String(doc.id))}
                                    isLoading={deletingDocumentId === String(doc.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        <Button 
                            variant="ghost" 
                            className="w-full border border-dashed border-slate-200 hover:border-indigo-300"
                            onClick={handleUploadClick}
                            isLoading={isUploadingDocument}
                        >
                            <Upload className="w-4 h-4 mr-2" /> Upload Document
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const ApplicationStatus: React.FC = () => {
    const [isJobDetailsModalOpen, setIsJobDetailsModalOpen] = React.useState(false);
    const [statusData, setStatusData] = React.useState<{ jobDetails: any, pipelineSteps: any[] } | null>(null);
    const [isSubmittingOfferDecision, setIsSubmittingOfferDecision] = React.useState(false);

    const loadApplicationStatus = React.useCallback(() => {
        api.candidate.getApplicationStatus()
          .then((data) => setStatusData(data))
          .catch((err) => console.error('Failed to load application status:', err));
    }, []);

    React.useEffect(() => {
        loadApplicationStatus();
    }, [loadApplicationStatus]);

    if (!statusData || !statusData.jobDetails) {
        return (
            <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
                 <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Application Status</h2>
                 <Card>
                    <div className="text-center py-20 text-slate-400">
                         <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-20" />
                         <p className="text-lg font-bold">No Active Application Found</p>
                         <p className="text-sm mt-2">Visit the Job Board to find your next opportunity.</p>
                    </div>
                 </Card>
            </div>
        );
    }

    const { jobDetails, pipelineSteps } = statusData;
    const offer = (statusData as any).offer;
    const currentStatusLabelMap: Record<string, string> = {
        applied: 'Application Submitted',
        screening: 'Resume Screening',
        shortlisted: 'Shortlisted',
        interview: 'Interview Stage',
        offered: 'Offer Stage',
        joined: 'Joined',
        rejected: 'Rejected',
    };
    const currentStatusKey = String((statusData as any).currentStatus || '').toLowerCase();
    const currentStatusLabel = currentStatusLabelMap[currentStatusKey] || 'In Progress';
    const offerStatus = String(offer?.status || '').toLowerCase();
    const joinRequest = offer?.joinRequest || null;
    const joinRequestStatus = String(joinRequest?.status || '').toLowerCase();

    const handleJoinRequest = async () => {
        if (!offer?.id) return;
        setIsSubmittingOfferDecision(true);
        try {
            await api.candidate.requestJoining(String(offer.id));
            await loadApplicationStatus();
        } catch (error) {
            console.error('Failed to request joining confirmation:', error);
            alert(error instanceof Error ? error.message : 'Failed to request joining confirmation');
        } finally {
            setIsSubmittingOfferDecision(false);
        }
    };

    const handleOfferDecision = async (decision: 'accepted' | 'declined') => {
        if (!offer?.id) return;
        setIsSubmittingOfferDecision(true);
        try {
            await api.candidate.decideOffer(String(offer.id), decision);
            await loadApplicationStatus();
        } catch (error) {
            console.error('Failed to submit offer decision:', error);
            alert(error instanceof Error ? error.message : 'Failed to submit offer decision');
        } finally {
            setIsSubmittingOfferDecision(false);
        }
    };

    return (
        <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Active Application Pipeline</h2>

            {/* Main Application Card */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                         <div className="flex gap-2 items-center mb-2">
                             <Badge color="indigo">Active</Badge>
                             <span className="text-xs font-mono text-slate-400 font-bold">{jobDetails.id}</span>
                         </div>
                         <h3 className="text-2xl font-black text-slate-800">{jobDetails.title}</h3>
                         <p className="text-slate-500 font-medium">{jobDetails.department}</p>
                    </div>
                    <Button onClick={() => setIsJobDetailsModalOpen(true)}>View Job Details</Button>
                </div>

                <div className="p-8 overflow-x-auto">
                    <div className="flex items-start min-w-[1200px] relative">
                         {/* Connecting Line */}
                         <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
                         
                         {pipelineSteps.map((step: any, i: number) => (
                            <div key={i} className="flex-1 flex flex-col items-center z-10">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                                    step.status === 'done' ? 'bg-indigo-600 border-indigo-600 text-white' : 
                                    step.status === 'active' ? 'bg-white border-indigo-600 text-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.2)]' : 
                                    'bg-slate-50 border-slate-200 text-slate-300'
                                }`}>
                                    {step.status === 'done' ? <CheckCircle className="w-5 h-5" /> : <span className="text-xs font-black">{i + 1}</span>}
                                </div>
                                <div className="mt-4 text-center space-y-1">
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${
                                        step.status === 'pending' ? 'text-slate-400' : 'text-slate-800'
                                    }`}>{step.label}</div>
                                    <div className="text-[10px] font-mono text-slate-400">{step.date}</div>
                                </div>
                            </div>
                         ))}
                    </div>
                </div>

                <div className="p-8 bg-indigo-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-full shadow-sm text-indigo-600 animate-pulse">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm font-black text-indigo-900 uppercase tracking-wide">Current Stage: {currentStatusLabel}</div>
                            <div className="text-xs text-indigo-700">Status is updated in real time by recruiter workflow.</div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {offer && (
                            <Badge color={offerStatus === 'accepted' ? 'emerald' : offerStatus === 'declined' ? 'rose' : 'amber'}>
                                Offer: {offerStatus.toUpperCase() || 'N/A'}
                            </Badge>
                        )}
                        {offer && joinRequestStatus === 'pending' && (
                            <Badge color="amber">Joining Request: PENDING</Badge>
                        )}
                        {offer && joinRequestStatus === 'approved' && (
                            <Badge color="emerald">Joining Request: APPROVED</Badge>
                        )}
                        {offer && offerStatus === 'offered' && (
                            <>
                                <Button
                                    variant="secondary"
                                    className="text-xs h-10"
                                    onClick={() => handleOfferDecision('declined')}
                                    disabled={isSubmittingOfferDecision}
                                >
                                    Decline Offer
                                </Button>
                                <Button
                                    className="text-xs h-10 bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => handleOfferDecision('accepted')}
                                    isLoading={isSubmittingOfferDecision}
                                >
                                    Accept Offer
                                </Button>
                            </>
                        )}
                        {offer && offerStatus === 'accepted' && joinRequestStatus !== 'pending' && joinRequestStatus !== 'approved' && (
                            <Button
                                className="text-xs h-10 bg-indigo-600 hover:bg-indigo-700"
                                onClick={handleJoinRequest}
                                isLoading={isSubmittingOfferDecision}
                            >
                                Request Joining Confirmation
                            </Button>
                        )}
                        {currentStatusKey === 'interview' && (
                            <Button className="text-xs h-10 bg-indigo-600 hover:bg-indigo-700">Join Meeting Room</Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Past Applications */}
            <Card title="Application History">
                 <div className="text-center py-12 text-slate-400">
                     <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
                     <p className="text-sm font-bold uppercase tracking-wide">No archived applications found</p>
                 </div>
            </Card>

            <Modal isOpen={isJobDetailsModalOpen} onClose={() => setIsJobDetailsModalOpen(false)} title="Job Requisition Details">
                <div className="space-y-6">
                    <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Requisition ID: {jobDetails.id}</div>
                        <h3 className="text-xl font-black text-indigo-900 mt-1">{jobDetails.title}</h3>
                        <p className="text-sm font-bold text-slate-500 mt-1">{jobDetails.department}</p>
                        <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wide mt-2">
                            <MapPin className="w-3 h-3 mr-1.5" />
                            <span>{jobDetails.location}</span>
                        </div>
                    </div>

                    <Card title="Job Summary">
                        <p className="text-sm text-slate-600 leading-relaxed">{jobDetails.summary}</p>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card title="Key Responsibilities">
                            <ul className="space-y-2 list-disc list-inside">
                                {jobDetails.responsibilities.map((item: string, index: number) => (
                                    <li key={index} className="text-sm text-slate-600">{item}</li>
                                ))}
                            </ul>
                        </Card>
                        <Card title="Required Skills">
                             <div className="flex flex-wrap gap-2">
                                {jobDetails.skills.map((skill: string) => (
                                    <Badge key={skill} color="slate">{skill}</Badge>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button variant="secondary" onClick={() => setIsJobDetailsModalOpen(false)}>Close</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// --- Main Container ---

export const CandidateDashboard: React.FC<{ currentPage: string }> = ({ currentPage }) => {
    const [applyingForJob, setApplyingForJob] = React.useState<JobRequisition | null>(null);

    const handleApply = (job: JobRequisition) => {
        setApplyingForJob(job);
    };

    const handleCancelApplication = () => {
        setApplyingForJob(null);
    };

    if (applyingForJob) {
        return <ApplicationForm job={applyingForJob} onCancel={handleCancelApplication} />;
    }

    switch(currentPage) {
        case 'cand-profile': return <MyProfile />;
        case 'cand-status': return <ApplicationStatus />;
        case 'cand-jobs': 
        default: return <JobBoard onApply={handleApply} />;
    }
};
