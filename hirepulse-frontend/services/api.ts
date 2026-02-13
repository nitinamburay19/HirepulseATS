import apiClient from './apiClient';
import { CandidateArtifact, JobRequisition, UserRole, User } from '../types';

const FRONTEND_TO_BACKEND_ROLE: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'admin',
  [UserRole.RECRUITER]: 'recruiter',
  [UserRole.MANAGER]: 'manager',
  [UserRole.CANDIDATE]: 'candidate',
  [UserRole.GUEST]: 'candidate',
};

const BACKEND_TO_FRONTEND_ROLE: Record<string, UserRole> = {
  admin: UserRole.ADMIN,
  recruiter: UserRole.RECRUITER,
  manager: UserRole.MANAGER,
  hod: UserRole.MANAGER,
  candidate: UserRole.CANDIDATE,
};

const toFrontendRole = (role: string | undefined): UserRole => {
  if (!role) {
    return UserRole.CANDIDATE;
  }
  return BACKEND_TO_FRONTEND_ROLE[role.toLowerCase()] || UserRole.CANDIDATE;
};

const toFrontendUser = (user: any): User => {
  const role = toFrontendRole(user?.role);
  const normalized = {
    id: String(user?.id ?? ''),
    name: String(user?.name ?? ''),
    role,
    avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(String(user?.id ?? user?.email ?? user?.name ?? 'user'))}`,
    status: String(user?.status || 'ACTIVE').toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    email: String(user?.email ?? ''),
    lastLogin: String(user?.lastLogin ?? ''),
    department: String(user?.department ?? ''),
    employeeCode: String(user?.employeeCode ?? user?.employee_code ?? ''),
  };
  return normalized as User;
};

const toFrontendCandidate = (candidate: any): CandidateArtifact => ({
  id: String(candidate?.id ?? ''),
  name: String(candidate?.name ?? ''),
  email: String(candidate?.email ?? ''),
  roleApplied: String(candidate?.currentRole ?? candidate?.roleApplied ?? ''),
  status: (() => {
    const raw = String(candidate?.status ?? 'applied').toUpperCase();
    const mapped: Record<string, CandidateArtifact['status']> = {
      APPLIED: 'APPLIED',
      SCREENING: 'VETTING',
      SHORTLISTED: 'SHORTLISTED',
      VETTING: 'VETTING',
      INTERVIEW: 'INTERVIEW',
      INTERVIEWING: 'INTERVIEW',
      OFFERED: 'OFFER',
      OFFER: 'OFFER',
      JOINED: 'JOINED',
      REJECTED: 'REJECTED',
    };
    return mapped[raw] || 'APPLIED';
  })(),
  matchScore: Number(candidate?.matchScore ?? 0),
  appliedDate: String(candidate?.appliedDate ?? ''),
  skillDna: Array.isArray(candidate?.skills) ? candidate.skills : [],
  currentCtc: Number(candidate?.currentCtc ?? 0),
  expectedCtc: Number(candidate?.expectedCtc ?? 0),
  noticePeriod: Number(candidate?.noticePeriod ?? 0),
  totalExp: Number(candidate?.experience ?? 0),
  aadhaarStatus: (() => {
    const raw = String(candidate?.aadhaarStatus ?? '').toUpperCase();
    if (raw === 'VERIFIED' || raw === 'MISSING' || raw === 'PENDING') return raw;
    return 'PENDING';
  })() as CandidateArtifact['aadhaarStatus'],
  panStatus: (() => {
    const raw = String(candidate?.panStatus ?? '').toUpperCase();
    if (raw === 'VERIFIED' || raw === 'MISSING' || raw === 'PENDING') return raw;
    return 'PENDING';
  })() as CandidateArtifact['panStatus'],
  resumeContent: String(candidate?.resumeUrl ?? ''),
});

const toFrontendJob = (job: any): JobRequisition => ({
  id: String(job?.id ?? ''),
  title: String(job?.title ?? ''),
  department: String(job?.department ?? ''),
  hiringManager: String(job?.hiringManager ?? ''),
  status: String(job?.status || 'OPEN').toUpperCase() === 'CLOSED' ? 'CLOSED' : 'OPEN',
  applicants: Number(job?.applicants ?? 0),
  priority: 'NORMAL',
  postedDate: String(job?.postedAt ?? job?.posted ?? ''),
});

const buildGeneratedJobContent = (rawTitle: string): { summary: string; description: string } => {
  const title = rawTitle.trim();
  const lowerTitle = title.toLowerCase();

  const seniority = lowerTitle.includes('intern')
    ? 'entry'
    : /(junior|associate)/.test(lowerTitle)
    ? 'junior'
    : /(senior|lead|staff|principal|architect|manager|head|director|vp)/.test(lowerTitle)
    ? 'senior'
    : 'mid';

  const domainTemplates: Array<{
    keywords: string[];
    mission: string;
    responsibilities: string[];
    skills: string[];
  }> = [
    {
      keywords: ['frontend', 'react', 'ui', 'web'],
      mission: 'build high-quality user-facing experiences and scalable frontend architecture',
      responsibilities: [
        'Own feature development from requirement analysis to production deployment.',
        'Build reusable UI components and improve design system consistency.',
        'Partner with product and backend teams to deliver performant user journeys.',
        'Improve application quality with testing, monitoring, and code reviews.',
      ],
      skills: ['React', 'TypeScript', 'State management', 'REST APIs', 'Testing'],
    },
    {
      keywords: ['backend', 'api', 'server', 'python', 'node', 'java', 'golang'],
      mission: 'design reliable backend services and resilient APIs for business-critical workflows',
      responsibilities: [
        'Design and implement secure APIs and service integrations.',
        'Optimize database queries and overall service performance.',
        'Implement observability, error handling, and operational safeguards.',
        'Collaborate with frontend and platform teams on end-to-end delivery.',
      ],
      skills: ['API design', 'SQL/NoSQL', 'Authentication', 'Caching', 'Cloud deployment'],
    },
    {
      keywords: ['data', 'analyst', 'scientist', 'ml', 'ai'],
      mission: 'deliver decision-ready insights and predictive models for product and business teams',
      responsibilities: [
        'Transform raw data into reliable analytical datasets.',
        'Build dashboards, reports, and data-driven recommendations.',
        'Develop and evaluate machine learning models where applicable.',
        'Partner with stakeholders to define KPIs and success metrics.',
      ],
      skills: ['SQL', 'Python', 'Data modeling', 'Visualization', 'Statistics/ML'],
    },
    {
      keywords: ['devops', 'sre', 'platform', 'cloud', 'infrastructure'],
      mission: 'improve platform reliability, deployment velocity, and infrastructure scalability',
      responsibilities: [
        'Automate CI/CD workflows and environment provisioning.',
        'Improve system availability, incident response, and recovery.',
        'Establish infrastructure standards for security and cost efficiency.',
        'Enable developer productivity through tooling and documentation.',
      ],
      skills: ['Cloud', 'CI/CD', 'IaC', 'Monitoring', 'Security best practices'],
    },
    {
      keywords: ['product', 'manager', 'program'],
      mission: 'drive product execution by aligning business goals, user needs, and engineering delivery',
      responsibilities: [
        'Define roadmap priorities and measurable product outcomes.',
        'Write clear requirements and align cross-functional teams.',
        'Monitor releases and iterate based on user feedback and data.',
        'Coordinate stakeholders and manage delivery risks proactively.',
      ],
      skills: ['Roadmapping', 'Stakeholder management', 'Analytics', 'Execution', 'Communication'],
    },
    {
      keywords: ['hr', 'talent', 'recruiter', 'hiring'],
      mission: 'build high-performing teams through efficient, data-driven hiring operations',
      responsibilities: [
        'Manage full-cycle hiring from sourcing to offer closure.',
        'Improve pipeline quality and reduce time-to-hire.',
        'Partner with hiring managers on role calibration and feedback loops.',
        'Ensure hiring process compliance and candidate experience standards.',
      ],
      skills: ['Sourcing', 'Interview coordination', 'Stakeholder management', 'ATS workflows', 'Negotiation'],
    },
  ];

  const matchedDomain =
    domainTemplates.find((template) => template.keywords.some((keyword) => lowerTitle.includes(keyword))) ||
    {
      mission: 'deliver measurable outcomes through cross-functional execution and continuous improvement',
      responsibilities: [
        'Own critical deliverables and drive them to completion with quality.',
        'Collaborate across teams to remove blockers and improve workflows.',
        'Track performance metrics and continuously optimize execution.',
        'Document key decisions, processes, and best practices.',
      ],
      skills: ['Problem solving', 'Communication', 'Planning', 'Execution', 'Collaboration'],
    };

  const seniorityLine =
    seniority === 'entry'
      ? 'This role is ideal for early-career professionals who are ready to learn fast and contribute with strong execution.'
      : seniority === 'junior'
      ? 'This role requires a strong foundation, attention to detail, and the ability to deliver with guidance.'
      : seniority === 'senior'
      ? 'This role requires ownership, technical or functional depth, and the ability to mentor and influence outcomes.'
      : 'This role requires independent execution, strong collaboration, and consistent delivery against defined goals.';

  const summary = `${title} is responsible for helping the team ${matchedDomain.mission}. ${seniorityLine}`;
  const description = [
    `Role: ${title}`,
    '',
    'Key Responsibilities:',
    ...matchedDomain.responsibilities.map((item, idx) => `${idx + 1}. ${item}`),
    '',
    'Preferred Skills:',
    ...matchedDomain.skills.map((skill) => `- ${skill}`),
  ].join('\n');

  return { summary, description };
};

export const api = {
  auth: {
    login: async (
      email: string,
      password: string,
      role: UserRole
    ): Promise<{ user: User; token: string }> => {
      const response = await apiClient<any>('/auth/login', 'POST', {
        email,
        password,
      });

      return {
        user: toFrontendUser(response?.user),
        token: response?.access_token,
      };
    },

    getProfile: async (): Promise<User> => {
      const profile = await apiClient<any>('/auth/me');
      return toFrontendUser(profile?.user || profile);
    },

    register: async (name: string, email: string, password: string, role: UserRole): Promise<any> =>
      apiClient('/auth/register', 'POST', { name, email, password, role: FRONTEND_TO_BACKEND_ROLE[role] }),

    forgotPassword: async (email: string): Promise<any> =>
      apiClient('/auth/forgot-password', 'POST', { email }),
  },

  candidates: {
    getAll: async (): Promise<CandidateArtifact[]> => {
      const candidates = await apiClient<any[]>('/api/candidates');
      return candidates.map(toFrontendCandidate);
    },

    screen: async (id: string): Promise<{ score: number; summary: string }> =>
      apiClient(`/api/candidates/${id}/screen`, 'POST'),
    updateStatus: async (id: string, status: string, notes?: string): Promise<any> =>
      apiClient(`/api/candidates/${id}/status`, 'PUT', { status, notes }),
    delete: async (id: string): Promise<any> =>
      apiClient(`/api/candidates/${id}`, 'DELETE'),
  },

  jobs: {
    getAll: async (): Promise<JobRequisition[]> => {
      const jobs = await apiClient<any[]>('/api/jobs/public');
      return jobs.map(toFrontendJob);
    },

    create: async (jobData: any): Promise<JobRequisition> => {
      const created = await apiClient<any>('/api/jobs', 'POST', jobData);
      return toFrontendJob(created);
    },

    generateDescription: async (title: string): Promise<{ summary: string; description: string }> => {
      try {
        return await apiClient<{ summary: string; description: string }>('/api/jobs/generate-description', 'POST', { title });
      } catch {
        // Fallback keeps UX available if generation API is temporarily unavailable.
        return buildGeneratedJobContent(title);
      }
    },
  },

  admin: {
    getDashboardData: async (): Promise<any> => {
      const data = await apiClient<any>('/api/stats/admin-dashboard');
      return {
        kpis: {
          requisitions: { value: String(data?.kpis?.[1]?.value ?? 0), trend: data?.kpis?.[1]?.change ?? '+0%' },
          securityFlags: { value: String(data?.kpis?.[2]?.value ?? 0), trend: data?.kpis?.[2]?.change ?? '+0%' },
          budget: { value: `${data?.kpis?.[3]?.value ?? 0}%`, trend: data?.kpis?.[3]?.change ?? '+0%' },
          users: { value: String(data?.kpis?.[0]?.value ?? 0), trend: data?.kpis?.[0]?.change ?? '+0' },
        },
        chart: (data?.velocityData || []).map((x: any) => ({ name: x.date, hires: x.hires })),
        logs: (data?.userDistribution || []).map((x: any) => ({ userId: x.role, role: 'distribution', status: x.count })),
      };
    },
    getUsers: async (): Promise<User[]> => {
      const users = await apiClient<any[]>('/api/users');
      return users.map(toFrontendUser);
    },
    createUser: async (userData: any): Promise<User> => {
      const user = await apiClient<any>('/api/users', 'POST', userData);
      return toFrontendUser(user);
    },
    deleteUser: async (id: string): Promise<any> => apiClient(`/api/users/${id}`, 'DELETE'),
    updateUserStatus: async (id: string, status: string): Promise<User> => {
      const user = await apiClient<any>(`/api/users/${id}`, 'PUT', { status: status.toLowerCase() });
      return toFrontendUser(user);
    },
    getMprConfig: async (): Promise<any> => apiClient('/api/config/mpr'),
    updateMprConfig: async (config: any): Promise<any> => apiClient('/api/config/mpr', 'PUT', config),
    getBlacklist: async (): Promise<any[]> => apiClient('/api/blacklist'),
    addToBlacklist: async (entry: any): Promise<any> =>
      apiClient('/api/blacklist', 'POST', {
        ...entry,
        risk: typeof entry?.risk === 'string' ? entry.risk.toLowerCase() : entry?.risk,
      }),
    whitelistUser: async (id: string): Promise<any> => apiClient(`/api/blacklist/${id}`, 'DELETE'),
    getOffersAnalytics: async (): Promise<any> => {
      const analytics = await apiClient<any>('/api/admin/offers/analytics');
      const normalizedQueue = (analytics?.queue || []).map((q: any) => ({
        id: String(q.id),
        candidate: String(q.candidate || ''),
        role: String(q.role || ''),
        offer: `$${Number(q.offer || 0).toLocaleString()}`,
        variance: `${Number(q.variance || 0) >= 0 ? '+' : ''}${Number(q.variance || 0)}%`,
        status: String(q.auditStatus || q.status || '').toUpperCase(),
        requiresApproval: Boolean(q.requiresApproval),
      }));

      const normalizedBudget = (analytics?.budget || []).map((b: any) => ({
        dept: String(b.dept || 'Unassigned'),
        used: Number(b.used || 0),
        total: `$${Number(b.total || 0).toLocaleString()}`,
      }));

      return {
        queue: normalizedQueue,
        budget: normalizedBudget,
        velocity: {
          released: Number(analytics?.velocity?.released || 0),
          joined: Number(analytics?.velocity?.joined || 0),
          declined: Number(analytics?.velocity?.declined || 0),
        },
      };
    },
    authorizeOffer: async (offerId: string): Promise<any> => apiClient(`/api/admin/offers/${offerId}/approve`, 'POST'),
  },

  recruiter: {
    getCandidates: async (): Promise<CandidateArtifact[]> => {
      const candidates = await apiClient<any[]>('/api/candidates');
      return candidates.map(toFrontendCandidate);
    },
    screenCandidate: async (id: string): Promise<{ score: number; summary: string }> =>
      apiClient(`/api/candidates/${id}/screen`, 'POST'),
    updateCandidateStatus: async (id: string, status: string, notes?: string): Promise<any> =>
      apiClient(`/api/candidates/${id}/status`, 'PUT', { status, notes }),
    deleteCandidate: async (id: string): Promise<any> =>
      apiClient(`/api/candidates/${id}`, 'DELETE'),
    getDashboardOverview: async (): Promise<any> => {
      const data = await apiClient<any>('/api/stats/recruiter-dashboard');
      const matrixData = data?.matrixData || {};
      const matrix = (data?.matrix || data?.matrixData)
        ? [{
            role: 'Pipeline',
            id: '',
            respondents: matrixData?.sourced ?? 0,
            shortlist: matrixData?.screened ?? 0,
            selection: matrixData?.interviewed ?? 0,
            offer: matrixData?.offered ?? 0,
            joined: matrixData?.hired ?? 0,
            dnj: matrixData?.dnj ?? 0,
            agency: 0,
            direct: 0,
            budget: 0,
          }]
        : [];
      return {
        matrix,
        kpis: {
          poolStrength: Number(matrixData?.sourced ?? data?.kpis?.[1]?.value ?? 0),
          joinedEfficiency: Number(matrixData?.hired ?? 0),
          rejectionPool: Number(matrixData?.dnj ?? 0),
          cycleHealth: `${data?.performanceMetrics?.offerAcceptanceRate ?? 0}%`,
        },
      };
    },
    getAgencies: async (): Promise<any[]> => {
      const agencies = await apiClient<any[]>('/api/agencies');
      return (agencies || []).map((a) => ({
        id: String(a.id),
        name: a.name,
        tier: String(a.tier || '').toUpperCase(),
        sla: Number(a.sla || 0),
        status: String(a.status || '').toUpperCase(),
        location: a.location,
        spocName: a.spocName,
        spocEmail: a.spocEmail,
      }));
    },
    submitAgencyCandidate: async (payload: any): Promise<any> =>
      apiClient('/api/agencies/submit-candidate', 'POST', payload),
    empanelAgency: async (agencyData: any): Promise<any> => apiClient('/api/agencies', 'POST', agencyData),
    updateAgencyStatus: async (id: string, status: string): Promise<any> =>
      apiClient(`/api/agencies/${id}/status`, 'PUT', { status }),
    deleteAgency: async (id: string): Promise<any> => apiClient(`/api/agencies/${id}`, 'DELETE'),
    getJobPostings: async (): Promise<any[]> => {
      const jobs = await apiClient<any[]>('/api/jobs');
      return (jobs || []).map((j) => ({
        id: String(j.id),
        title: j.title,
        summary: j.description || '',
        dept: j.dept || j.department,
        posted: j.posted ? new Date(j.posted).toLocaleDateString() : '',
        status: String(j.status || '').toUpperCase() === 'OPEN' ? 'LIVE' : String(j.status || '').toUpperCase(),
      }));
    },
    deleteJobPosting: async (id: string): Promise<any> => apiClient(`/api/jobs/${id}`, 'DELETE'),
    updateJobPosting: async (id: string, jobData: any): Promise<any> => apiClient(`/api/jobs/${id}`, 'PUT', jobData),
    publishDraftJobs: async (): Promise<{ updated: number; message: string }> =>
      apiClient('/api/jobs/publish-drafts', 'POST'),
    getMprs: async (): Promise<any[]> => {
      const mprs = await apiClient<any[]>('/api/mpr');
      return (mprs || []).map((m) => ({
        id: String(m.id),
        jobRole: m.jobRole,
        manager: m.manager,
        mprDate: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '',
        targetDate: m.targetDate ? new Date(m.targetDate).toLocaleDateString() : '',
        daysLeft: Number(m.daysLeft ?? 0),
        freezeProtocol: String(m.status || '').toUpperCase() === 'FROZEN' ? 'FROZEN' : 'ACTIVE',
        profilesInHand: m.pipelineStats?.profilesReceived ?? 0,
        interviewsScheduled: m.pipelineStats?.interviewed ?? 0,
        toBeScheduled: 0,
        selection: m.pipelineStats?.selected ?? 0,
        rejected: m.pipelineStats?.rejected ?? 0,
        onHold: m.pipelineStats?.onHold ?? 0,
      }));
    },
    updateMprStatus: async (id: string, status: 'ACTIVE' | 'FROZEN'): Promise<any> =>
      apiClient(`/api/mpr/${id}/status`, 'PUT', { status }),
    getInterviews: async (): Promise<any[]> => {
      const interviews = await apiClient<any[]>('/api/interviews');
      return (interviews || []).map((i) => ({
        ...i,
        candidateId: Number(i.candidateId ?? i.candidate_id ?? 0),
        panel: Array.isArray(i.panel) ? i.panel.join(', ') : String(i.panel || ''),
        mode: String(i.mode || '').toLowerCase().includes('video') ? 'Virtual' : 'In-Person',
      }));
    },
    deleteInterview: async (id: string): Promise<any> => apiClient(`/api/interviews/${id}`, 'DELETE'),
    submitInterviewEvaluation: async (evaluationData: any): Promise<any> =>
      apiClient('/api/interviews/evaluation', 'POST', evaluationData),
    getOffers: async (): Promise<any[]> => {
      const offers = await apiClient<any[]>('/api/offers');
      return (offers || []).map((o) => ({
        status: (() => {
          const raw = String(o.status || '').toUpperCase();
          if (raw === 'DECLINED' || raw === 'WITHDRAWN' || raw === 'EXPIRED' || raw === 'RENEG') return 'DNJ';
          if (raw === 'JOINED') return 'JOINED';
          if (raw === 'ACCEPTED') return 'ACCEPTED';
          return 'OFFERED';
        })(),
        id: String(o.id),
        candidate: o.candidate,
        role: o.role,
        ctc: String(o.ctc ?? 0),
        joining: o.joining ? new Date(o.joining).toLocaleDateString() : '',
        joinRequestPending: Boolean(o.joinRequestPending),
      }));
    },
    releaseOffer: async (offerData: any): Promise<any> => apiClient('/api/offers', 'POST', offerData),
    updateOffer: async (id: string, offerData: any): Promise<any> => apiClient(`/api/offers/${id}`, 'PUT', offerData),
  },

  manager: {
    getHubData: async (): Promise<any> => {
      const [stats, requisitions] = await Promise.all([
        apiClient<any>('/api/stats/manager-dashboard'),
        apiClient<any[]>('/api/manager/pipeline'),
      ]);
      return { stats, requisitions };
    },
    getMyRequests: async (): Promise<any[]> => apiClient<any[]>('/api/mpr/my-requests'),
    getInterviews: async (): Promise<any[]> => {
      const data = await apiClient<any[]>('/api/manager/interviews');
      return (data || []).map((i) => ({
        ...i,
        status: String(i.status || '').toUpperCase(),
      }));
    },
    getPipelineCandidates: async (jobTitle: string, stage: string): Promise<any[]> =>
      apiClient<any[]>(`/api/manager/pipeline-candidates?job_title=${encodeURIComponent(jobTitle)}&stage=${encodeURIComponent(stage)}`),
    createMpr: async (payload: any): Promise<any> => apiClient('/api/mpr', 'POST', payload),
    submitFeedback: async (id: string, feedback: any): Promise<any> =>
      apiClient('/api/manager/interviews/feedback', 'POST', { interviewId: id, ...feedback }),
  },

  candidate: {
    getProfile: async (): Promise<any> => {
      const data = await apiClient<any>('/api/candidate/profile');
      return {
        name: data?.name || '',
        role: data?.role || '',
        skills: data?.skills || [],
        documents: (data?.documents || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          status: d.verified || d.parsed ? 'VERIFIED' : 'PENDING',
          date: d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString() : '',
        })),
      };
    },
    updateProfile: async (payload: any): Promise<any> => apiClient('/api/candidate/profile', 'PUT', payload),
    uploadDocument: async (file: File, documentType = 'resume', parseResume = true): Promise<any> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      formData.append('parse_resume', String(parseResume));
      return apiClient('/api/candidate/documents/upload', 'POST', formData);
    },
    deleteDocument: async (documentId: string): Promise<any> =>
      apiClient(`/api/candidate/documents/${documentId}`, 'DELETE'),
    autoFillForJob: async (jobId: string): Promise<any> =>
      apiClient(`/api/jobs/${jobId}/auto-fill`),
    applyForJob: async (jobId: string, applicationData?: any): Promise<any> =>
      apiClient(`/api/jobs/${jobId}/apply`, 'POST', applicationData),
    getApplicationStatus: async (): Promise<any> => {
      const data = await apiClient<any>('/api/candidate/application-status');
      if (!data?.jobDetails) {
        return data;
      }

      const pipelineSteps = (data.pipelineSteps || []).map((step: any) => {
        const rawStatus = String(step?.status || '').toLowerCase();
        const mappedStatus =
          rawStatus === 'completed' || rawStatus === 'done'
            ? 'done'
            : rawStatus === 'in_progress' || rawStatus === 'active'
            ? 'active'
            : 'pending';
        return {
          label: step?.label || step?.name || 'Step',
          date: step?.date || '',
          status: mappedStatus,
        };
      });

      return {
        ...data,
        jobDetails: {
          id: String(data.jobDetails?.id ?? ''),
          title: String(data.jobDetails?.title ?? ''),
          department: String(data.jobDetails?.department ?? ''),
          location: String(data.jobDetails?.location ?? ''),
          summary: String(data.jobDetails?.summary ?? ''),
          responsibilities: Array.isArray(data.jobDetails?.responsibilities) ? data.jobDetails.responsibilities : [],
          skills: Array.isArray(data.jobDetails?.skills) ? data.jobDetails.skills : [],
        },
        pipelineSteps,
        offer: data?.offer
          ? {
              id: String(data.offer.id ?? ''),
              offerCode: String(data.offer.offerCode ?? ''),
              status: String(data.offer.status ?? '').toLowerCase(),
              ctcTotal: Number(data.offer.ctcTotal ?? 0),
              dateOfJoining: String(data.offer.dateOfJoining ?? ''),
              validityDays: Number(data.offer.validityDays ?? 0),
              offeredAt: String(data.offer.offeredAt ?? ''),
              joinRequest: data.offer.joinRequest || null,
            }
          : null,
      };
    },
    decideOffer: async (offerId: string, decision: 'accepted' | 'declined'): Promise<any> =>
      apiClient(`/api/candidate/offers/${offerId}/decision`, 'PUT', { decision }),
    requestJoining: async (offerId: string): Promise<any> =>
      apiClient(`/api/candidate/offers/${offerId}/join-request`, 'POST'),
  },
};
