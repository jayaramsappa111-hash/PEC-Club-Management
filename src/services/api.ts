import {
  AuthenticatedUser,
  Club,
  ClubTeam,
  Membership,
  Event,
  EventRegistration,
  Certificate,
  Project,
  Resource,
  Roadmap,
  ToolItem,
  Announcement,
  NotificationItem,
  AuditLogItem,
  PlatformMetrics
} from '../types';

const getApiBaseUrl = (): string => {
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl && typeof envApiUrl === 'string' && envApiUrl.trim().length > 0) {
    const cleanUrl = envApiUrl.trim().replace(/\/+$/, '');
    return cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;
  }
  return '/api/v1';
};

const BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const AUTH_TOKEN_KEY = 'tc_auth_token';
type UnauthorizedHandler = () => void;
const unauthorizedListeners: Set<UnauthorizedHandler> = new Set();

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (err) {
    console.error('Failed to store auth token', err);
  }
}

export function removeAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (err) {
    console.error('Failed to remove auth token', err);
  }
}

export function onUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedListeners.add(handler);
  return () => {
    unauthorizedListeners.delete(handler);
  };
}

function notifyUnauthorized(): void {
  unauthorizedListeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error in unauthorized listener', e);
    }
  });
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    notifyUnauthorized();
  }

  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`;
    let data;
    try {
      data = await res.json();
      errorMsg = data.error || data.message || errorMsg;
    } catch {
      // non-json response
    }
    throw new ApiError(errorMsg, res.status, data);
  }

  return res.json();
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ token: string; user: AuthenticatedUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (data: { email: string; password: string; name: string; student_id?: string; department_id?: string; course?: string; phone?: string }) =>
      request<{ message: string; token: string; user: AuthenticatedUser }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMe: () => request<{ user: AuthenticatedUser }>('/auth/me'),
    firebaseSync: (data: { email: string; name?: string; uid?: string; photoURL?: string }) =>
      request<{ token: string; user: AuthenticatedUser }>('/auth/firebase-sync', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateProfile: (data: { name?: string; phone?: string; bio?: string; skills?: string; course?: string; photograph?: string }) =>
      request<{ message: string }>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // Users & Depts
  users: {
    getProfile: () => request<{ user: any }>('/auth/me'),
    list: (params?: { role?: string; department_id?: string; search?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ users: any[] }>(`/users${q ? `?${q}` : ''}`);
    },
    updateRole: (userId: string, roleName: string) =>
      request<{ message: string }>(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ roleName }),
      }),
    getDepartments: () => request<{ departments: any[] }>('/departments'),
    getAcademicYears: () => request<{ academicYears: any[] }>('/academic-years'),
  },

  // Clubs
  clubs: {
    list: (params?: { department_id?: string; department?: string; category?: string; search?: string; status?: string }) => {
      const q = new URLSearchParams(
        Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== '') as [string, string][]
      ).toString();
      return request<{ clubs: Club[] }>(`/clubs${q ? `?${q}` : ''}`);
    },
    get: (idOrSlug: string) =>
      request<{
        club: Club;
        teams: ClubTeam[];
        coordinators: any[];
        events: Event[];
        announcements: Announcement[];
        projects?: any[];
        resources?: any[];
        members?: any[];
        userMembership?: Membership;
      }>(`/clubs/${idOrSlug}`),
    create: (data: Partial<Club>) =>
      request<{ message: string; clubId: string }>('/clubs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string) =>
      request<{ message: string }>(`/clubs/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    createTeam: (clubId: string, data: { name: string; academic_year_id: string; members: any[] }) =>
      request<{ message: string; teamId: string }>(`/clubs/${clubId}/teams`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    approveTeam: (clubId: string, teamId: string) =>
      request<{ message: string }>(`/clubs/${clubId}/teams/${teamId}/approve`, {
        method: 'PATCH',
      }),
  },

  // Memberships
  memberships: {
    my: () => request<{ memberships: Membership[] }>('/memberships/my'),
    getMyCards: () =>
      request<{ memberships: Membership[] }>('/memberships/my').then((r) => ({
        cards: r.memberships || [],
      })),
    listByClub: (clubId: string, status?: string) => {
      const q = status ? `?status=${status}` : '';
      return request<{ members: any[] }>(`/memberships/club/${clubId}${q}`);
    },
    apply: (club_id: string) =>
      request<{ message: string; membershipId: string; membershipCode: string }>('/memberships/apply', {
        method: 'POST',
        body: JSON.stringify({ club_id }),
      }),
    updateStatus: (id: string, status: string) =>
      request<{ message: string }>(`/memberships/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    getCard: (id: string) => request<{ card: Membership & { qrDataUrl: string; verificationUrl: string } }>(`/memberships/${id}/card`),
    getCardPdfUrl: (id: string) => `${BASE_URL}/memberships/${id}/card/pdf`,
  },

  // Events
  events: {
    list: (params?: { club_id?: string; status?: string; event_type?: string; search?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ events: Event[] }>(`/events${q ? `?${q}` : ''}`);
    },
    getMyRegistrations: () =>
      request<{ registrations: EventRegistration[] }>('/events/registrations/my'),
    get: (idOrSlug: string) =>
      request<{
        event: Event;
        userRegistration?: EventRegistration;
        userAttendance?: any;
        userFeedback?: any;
      }>(`/events/${idOrSlug}`),
    create: (data: Partial<Event>) =>
      request<{ message: string; eventId: string; slug: string }>('/events', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string) =>
      request<{ message: string }>(`/events/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    register: (id: string) =>
      request<{ message: string; registrationId: string; status: string; qrToken: string }>(`/events/${id}/register`, {
        method: 'POST',
      }),
    getRegistrations: (id: string) =>
      request<{ registrations: any[] }>(`/events/${id}/registrations`),
    checkInAttendance: (eventId: string, body: { qrToken?: string; registrationId?: string }) =>
      request<{ message: string; student: any; checkInTime: string }>(`/events/${eventId}/attendance/check-in`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    selfCheckInAttendance: (eventId: string, code: string) =>
      request<{ message: string; checkInTime: string }>(`/events/${eventId}/attendance/self-check-in`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
    submitFeedback: (eventId: string, data: { rating: number; comments?: string; suggestions?: string }) =>
      request<{ message: string }>(`/events/${eventId}/feedback`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getFeedback: (eventId: string) =>
      request<{ feedbacks: any[] }>(`/events/${eventId}/feedback`),
    claimAttendance: (eventId: string) =>
      request<{ message: string; status: string }>(`/events/${eventId}/claim-attendance`, {
        method: 'POST',
      }),
    getClaims: (eventId: string) =>
      request<{ claims: any[] }>(`/events/${eventId}/claims`),
    approveClaim: (eventId: string, body: { registration_id: string; action: 'APPROVE' | 'REJECT'; certificate_type?: string }) =>
      request<{ message: string; status: string; certificateCode?: string }>(`/events/${eventId}/approve-claim`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  // Certificates
  certificates: {
    list: () => request<{ certificates: Certificate[] }>('/certificates'),
    my: () => request<{ certificates: Certificate[] }>('/certificates/my'),
    get: (id: string) =>
      request<{ certificate: Certificate & { qrDataUrl: string; verificationUrl: string } }>(`/certificates/${id}`),
    issue: (data: any) =>
      request<{ message: string; issued: any[]; certificate: any }>('/certificates/issue', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getPdfUrl: (id: string) => `${BASE_URL}/certificates/${id}/pdf`,
  },

  // Projects
  projects: {
    list: (params?: { domain?: string; department_id?: string; status?: string; is_featured?: number | string; search?: string; my?: boolean }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ projects: Project[] }>(`/projects${q ? `?${q}` : ''}`);
    },
    get: (id: string) =>
      request<{ project: Project; members: any[]; reviews: any[] }>(`/projects/${id}`),
    submit: (data: any) =>
      request<{ message: string; projectId: string }>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    review: (id: string, data: { rating: number; remarks: string; decision: string }) =>
      request<{ message: string; newStatus: string }>(`/projects/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    toggleFeatured: (id: string, is_featured: boolean) =>
      request<{ message: string }>(`/projects/${id}/featured`, {
        method: 'PATCH',
        body: JSON.stringify({ is_featured }),
      }),
  },

  // Resources
  resources: {
    list: (params?: { type?: string; difficulty?: string; domain?: string; club_id?: string; search?: string; bookmarked?: boolean; completed?: boolean }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ resources: Resource[] }>(`/resources${q ? `?${q}` : ''}`);
    },
    create: (data: Partial<Resource>) =>
      request<{ message: string; resourceId: string }>('/resources', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    toggleBookmark: (id: string) =>
      request<{ message: string; isBookmarked: boolean }>(`/resources/${id}/bookmark`, {
        method: 'POST',
      }),
    toggleProgress: (id: string) =>
      request<{ message: string; isCompleted: boolean }>(`/resources/${id}/progress`, {
        method: 'POST',
      }),
  },

  // Roadmaps
  roadmaps: {
    list: () => request<{ roadmaps: Roadmap[]; badges: any[] }>('/roadmaps'),
    get: (idOrSlug: string) => request<{ roadmap: Roadmap }>(`/roadmaps/${idOrSlug}`),
    toggleModuleComplete: (roadmapId: string, moduleId: string) =>
      request<{ message: string; isCompleted: boolean; badgeAwarded: boolean }>(`/roadmaps/${roadmapId}/modules/${moduleId}/complete`, {
        method: 'POST',
      }),
  },

  // Tools
  tools: {
    list: (params?: { category?: string; search?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ tools: ToolItem[] }>(`/tools${q ? `?${q}` : ''}`);
    },
    create: (data: Partial<ToolItem>) =>
      request<{ message: string; toolId: string }>('/tools', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Announcements
  announcements: {
    list: (params?: { club_id?: string; department_id?: string; category?: string; important_only?: boolean }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ announcements: Announcement[] }>(`/announcements${q ? `?${q}` : ''}`);
    },
    create: (data: Partial<Announcement>) =>
      request<{ message: string; announcementId: string }>('/announcements', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Notifications
  notifications: {
    list: () => request<{ notifications: NotificationItem[] }>('/notifications'),
    unreadCount: () => request<{ count: number }>('/notifications/unread-count'),
    markRead: (id: string) =>
      request<{ message: string }>(`/notifications/${id}/read`, {
        method: 'PATCH',
      }),
    readAll: () =>
      request<{ message: string }>('/notifications/read-all', {
        method: 'POST',
      }),
  },

  // Analytics
  analytics: {
    getPlatform: () =>
      request<{ metrics: PlatformMetrics; departmentBreakdown: any[]; clubRankings: any[] }>('/analytics/platform'),
    getOverview: () =>
      request<{ metrics: PlatformMetrics; departmentBreakdown: any[]; clubRankings: any[] }>('/analytics/platform').then((r) => ({
        metrics: r.metrics,
        clubs: r.clubRankings,
        departmentDistribution: r.departmentBreakdown,
      })),
    getClub: (id: string) =>
      request<{ club: any; metrics: any }>(`/analytics/club/${id}`),
  },

  // Reports
  reports: {
    getData: (params?: { type?: string; club_id?: string; department_id?: string; event_id?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ reportType: string; data: any[] }>(`/reports/data${q ? `?${q}` : ''}`);
    },
    getExcelUrl: (params?: { type?: string; club_id?: string; event_id?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return `${BASE_URL}/reports/export/excel${q ? `?${q}` : ''}`;
    },
    getPdfUrl: (params?: { type?: string; club_id?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return `${BASE_URL}/reports/export/pdf${q ? `?${q}` : ''}`;
    },
    exportCsv: async (type: string = 'general'): Promise<Blob> => {
      const token = getAuthToken();
      const res = await fetch(`${BASE_URL}/reports/export/excel?type=${type}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) {
        notifyUnauthorized();
      }
      return res.blob();
    },
    generatePdf: async (type: string = 'summary'): Promise<Blob> => {
      const token = getAuthToken();
      const res = await fetch(`${BASE_URL}/reports/export/pdf?type=${type}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) {
        notifyUnauthorized();
      }
      return res.blob();
    },
  },

  // Search
  search: {
    query: (q: string) => request<{ query: string; results: any }>(`/search?q=${encodeURIComponent(q)}`),
  },

  // Public Verifications
  verify: Object.assign(
    (code: string) =>
      request<{ valid: boolean; type?: string; message?: string; certificate?: any; membership?: any }>(
        `/verify/${encodeURIComponent(code)}`
      ),
    {
      membership: (id: string) =>
        request<{ valid: boolean; message?: string; membership?: any }>(`/verify/membership/${id}`),
      certificate: (id: string) =>
        request<{ valid: boolean; message?: string; certificate?: any; status?: string }>(`/verify/certificate/${id}`),
    }
  ),

  // Audit Logs
  audit: {
    list: (params?: { action?: string; entity_type?: string; limit?: number }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ logs: AuditLogItem[] }>(`/audit-logs${q ? `?${q}` : ''}`);
    },
  },

  // Gallery
  gallery: {
    list: (params?: { club_id?: string; event_id?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ gallery: any[] }>(`/gallery${q ? `?${q}` : ''}`).then((r) => ({
        items: r.gallery || [],
        gallery: r.gallery || [],
      }));
    },
    upload: (data: any) =>
      request<{ message: string; mediaId: string }>('/gallery', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
