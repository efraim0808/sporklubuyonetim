import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';

const packageOptions = [1, 3, 6, 12];

const initialUsers = [];

const initialClubs = [];

const LOCKED_SUPER_ADMIN_EMAIL = 'sagliksk@gmail.com';
const LOCKED_SUPER_ADMIN_PASSWORD = 'Efraim+08';

const lockedSuperAdminUser = {
  id: 'locked-super-admin',
  name: 'Süper Admin',
  email: LOCKED_SUPER_ADMIN_EMAIL,
  username: LOCKED_SUPER_ADMIN_EMAIL,
  password: LOCKED_SUPER_ADMIN_PASSWORD,
  role: 'super-admin',
  clubId: null,
  isActive: true,
};

function isLockedSuperAdminIdentity(inputEmail, inputPassword) {
  const emailValue = String(inputEmail ?? '').trim().toLowerCase();
  const passwordValue = String(inputPassword ?? '').trim();

  return emailValue === LOCKED_SUPER_ADMIN_EMAIL.toLowerCase() && passwordValue === LOCKED_SUPER_ADMIN_PASSWORD;
}

function isLockedSuperAdminUser(user) {
  if (!user || typeof user !== 'object') return false;
  const emailValue = String(user.email ?? user.username ?? '').trim().toLowerCase();
  const passwordValue = String(user.password ?? '').trim();

  return emailValue === LOCKED_SUPER_ADMIN_EMAIL.toLowerCase() && passwordValue === LOCKED_SUPER_ADMIN_PASSWORD;
}

const defaultForm = {
  studentName: '',
  birthDate: '',
  branchId: '',
  parentName: '',
  parentPhone: '',
  parentPassword: '',
  notes: '',
  acceptKvkk: false,
  acceptPolicy: false,
};

function toTurkishUpper(value) {
  return String(value ?? '').toLocaleUpperCase('tr-TR');
}

function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function generateUsername(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

function normalizeLoginUsername(value) {
  return generateUsername(value);
}

function isValidUuid(value) {
  return typeof value === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value.trim());
}

function toDatabaseUuidOrNull(value) {
  const candidate = String(value ?? '').trim();
  return isValidUuid(candidate) ? candidate : null;
}

async function insertIntoSupabase(table, rows, options = {}) {
  if (!table || !Array.isArray(rows) || !rows.length) return { ok: true, inserted: 0, data: [] };
  if (!supabase || !supabase.from) {
    console.warn(`Supabase insert skipped for ${table}: client unavailable.`);
    return { ok: false, error: new Error('Supabase client unavailable') };
  }

  const sanitizedRows = rows.map((row) => {
    const cleanRow = Object.fromEntries(
      Object.entries(row).filter(([, value]) => value !== undefined)
    );

    if (cleanRow.id && !isValidUuid(String(cleanRow.id))) {
      delete cleanRow.id;
    }

    return cleanRow;
  });

  const query = supabase.from(table);
  const dbAction = options.upsert
    ? query.upsert(sanitizedRows, { onConflict: 'id', ignoreDuplicates: false })
    : query.insert(sanitizedRows);

  const { data, error } = await dbAction.select();
  if (error) {
    console.error(`Supabase insert failed for ${table}:`, error);
    return { ok: false, error };
  }

  return { ok: true, inserted: sanitizedRows.length, data: data ?? [] };
}

async function deleteFromSupabase(table, column, value) {
  if (!table || !column || value === undefined || value === null || value === '') {
    return { ok: false, error: new Error('Silme için gerekli filtre eksik.') };
  }

  if (!supabase || !supabase.from) {
    console.warn(`Supabase delete skipped for ${table}: client unavailable.`);
    return { ok: false, error: new Error('Supabase client unavailable') };
  }

  if (table === 'profiles') {
    const deleteTarget = String(value ?? '').trim();
    const protectedValues = [
      LOCKED_SUPER_ADMIN_EMAIL,
      lockedSuperAdminUser.username,
      lockedSuperAdminUser.email,
    ];

    if (
      (column === 'email' && protectedValues.includes(deleteTarget.toLowerCase())) ||
      (column === 'username' && protectedValues.includes(deleteTarget.toLowerCase())) ||
      (column === 'id' && deleteTarget === lockedSuperAdminUser.id)
    ) {
      return { ok: false, error: new Error('Kilitli süper admin hesabı silinemez.') };
    }
  }

  const { data, error } = await supabase.from(table).delete().eq(column, value).select();
  if (error) {
    console.error(`Supabase delete failed for ${table}:`, error);
    return { ok: false, error };
  }

  return { ok: true, deleted: Array.isArray(data) ? data.length : 0, data: data ?? [] };
}

function normalizeClubRecord(club) {
  if (!club || typeof club !== 'object') return null;

  const safeSubscription = club.subscription && typeof club.subscription === 'object' ? club.subscription : {};

  return {
    ...club,
    id: club.id,
    name: club.name ?? club.clubName ?? 'Kulüp',
    managerName: club.manager_name ?? club.managerName ?? '',
    phone: club.phone ?? '',
    whatsappNumber: club.whatsapp_number ?? club.whatsappNumber ?? '',
    address: club.address ?? '',
    username: club.username ?? '',
    password: club.password ?? '',
    suspended: Boolean(club.suspended),
    subscription: {
      startDate: safeSubscription.startDate ?? safeSubscription.startedAt ?? '',
      endDate: safeSubscription.endDate ?? '',
      packageMonths: Number(safeSubscription.packageMonths ?? safeSubscription.months ?? 0),
      lastPaymentDate: safeSubscription.lastPaymentDate ?? '',
      ...safeSubscription,
    },
    students: Array.isArray(club.students) ? club.students : [],
    branches: Array.isArray(club.branches) ? club.branches : [],
    payments: Array.isArray(club.payments) ? club.payments : [],
    pendingApplications: Array.isArray(club.pendingApplications) ? club.pendingApplications : [],
    announcements: Array.isArray(club.announcements) ? club.announcements : [],
    incomingMessages: Array.isArray(club.incomingMessages) ? club.incomingMessages : [],
    subscriptionHistory: Array.isArray(club.subscriptionHistory) ? club.subscriptionHistory : [],
    paymentSchedule: Array.isArray(club.paymentSchedule) ? club.paymentSchedule : [],
  };
}

function normalizeApplicationRecord(application) {
  if (!application || typeof application !== 'object') return null;

  return {
    ...application,
    id: application.id,
    studentName: application.student_name ?? application.studentName ?? '',
    studentSurname: application.student_surname ?? application.studentSurname ?? '',
    parentName: application.parent_name ?? application.parentName ?? '',
    parentPhone: application.parent_phone ?? application.parentPhone ?? '',
    branchId: application.branch_id ?? application.branchId ?? '',
    status: application.status ?? 'pending',
    notes: application.notes ?? '',
    files: Array.isArray(application.files) ? application.files : [],
    createdAt: application.created_at ?? application.createdAt ?? new Date().toISOString(),
  };
}

function normalizeMessageRecord(message) {
  if (!message || typeof message !== 'object') return null;

  return {
    ...message,
    id: message.id,
    clubId: message.club_id ?? message.clubId ?? '',
    senderName: message.sender_name ?? message.senderName ?? 'Kullanıcı',
    senderRole: message.sender_role ?? message.senderRole ?? 'Veli',
    studentId: message.student_id ?? message.studentId ?? null,
    studentName: message.student_name ?? message.studentName ?? '',
    message: message.message ?? '',
    read: Boolean(message.read ?? false),
    sentAt: message.created_at ?? message.sentAt ?? new Date().toISOString(),
  };
}

async function fetchAllClubsFromSupabase() {
  if (!supabase || !supabase.from) {
    console.warn('Supabase fetch skipped for clubs: client unavailable.');
    return [];
  }

  const { data: clubsData, error: clubsError } = await supabase
    .from('clubs')
    .select('*')
    .order('created_at', { ascending: true });

  if (clubsError) {
    console.error('Supabase clubs fetch failed:', clubsError);
    return [];
  }

  const clubIds = (clubsData ?? []).map((club) => club.id).filter(Boolean);

  const [{ data: branchRows, error: branchError }, { data: applicationRows, error: applicationError }, { data: messageRows, error: messageError }] = await Promise.all([
    clubIds.length
      ? supabase.from('club_branches').select('*').in('club_id', clubIds)
      : Promise.resolve({ data: [], error: null }),
    clubIds.length
      ? supabase.from('club_applications').select('*').in('club_id', clubIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    clubIds.length
      ? supabase.from('club_messages').select('*').in('club_id', clubIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (branchError) {
    console.error('Supabase club_branches fetch failed:', branchError);
  }

  if (applicationError) {
    console.error('Supabase club_applications fetch failed:', applicationError);
  }

  if (messageError) {
    console.error('Supabase club_messages fetch failed:', messageError);
  }

  const branchesByClubId = {};
  (branchRows ?? []).forEach((branch) => {
    if (!branch?.club_id) return;
    const nextList = branchesByClubId[branch.club_id] ?? [];
    nextList.push({
      id: branch.id,
      name: branch.name,
      fee: Number(branch.monthly_fee ?? 0),
      monthlyFee: Number(branch.monthly_fee ?? 0),
      coachIds: Array.isArray(branch.coach_ids) ? branch.coach_ids : [],
      clubId: branch.club_id,
      ...branch,
    });
    branchesByClubId[branch.club_id] = nextList;
  });

  const applicationsByClubId = {};
  (applicationRows ?? []).forEach((application) => {
    if (!application?.club_id) return;
    const normalized = normalizeApplicationRecord(application);
    if (!normalized) return;
    if (String(normalized.status || '').toLowerCase() !== 'pending') return;
    const nextList = applicationsByClubId[application.club_id] ?? [];
    nextList.push(normalized);
    applicationsByClubId[application.club_id] = nextList;
  });

  const messagesByClubId = {};
  (messageRows ?? []).forEach((message) => {
    if (!message?.club_id) return;
    const normalized = normalizeMessageRecord(message);
    if (!normalized) return;
    const nextList = messagesByClubId[message.club_id] ?? [];
    nextList.push(normalized);
    messagesByClubId[message.club_id] = nextList;
  });

  return (clubsData ?? [])
    .map((club) => {
      const normalized = normalizeClubRecord(club);
      if (!normalized) return null;
      return {
        ...normalized,
        branches: (branchesByClubId[club.id] ?? []).map((branch) => ({
          ...branch,
          fee: Number(branch.fee ?? branch.monthly_fee ?? 0),
          monthlyFee: Number(branch.monthlyFee ?? branch.monthly_fee ?? branch.fee ?? 0),
          coachIds: Array.isArray(branch.coachIds) ? branch.coachIds : [],
        })),
        pendingApplications: applicationsByClubId[club.id] ?? [],
        incomingMessages: messagesByClubId[club.id] ?? [],
      };
    })
    .filter(Boolean);
}

function normalizeDbBranchId(branchId) {
  return toDatabaseUuidOrNull(branchId);
}

function normalizeDbClubId(clubId) {
  return toDatabaseUuidOrNull(clubId);
}

function normalizeDbStudentId(studentId) {
  return toDatabaseUuidOrNull(studentId);
}

function normalizeDbParentEmail(parentName, clubId) {
  const base = String(parentName || 'veli').trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'veli';
  const clubSuffix = toDatabaseUuidOrNull(clubId)?.slice(0, 8) || 'club';
  return `${base}.${clubSuffix}@local.invalid`;
}

function normalizeDbRecordId(value) {
  return toDatabaseUuidOrNull(value);
}

function normalizeWhatsappNumber(value) {
  const sanitized = String(value ?? '')
    .replace(/\s+/g, '')
    .replace(/[+()\-]/g, '')
    .trim();

  const digits = sanitized.replace(/\D/g, '');
  if (!digits) return '';

  const withoutLeadingZero = digits.startsWith('0') ? digits.slice(1) : digits;
  const withTurkeyCode = withoutLeadingZero.startsWith('90') ? withoutLeadingZero : `90${withoutLeadingZero}`;

  return withTurkeyCode.replace(/^90\+/, '90').replace(/^\+/, '');
}

function normalizeDuplicateText(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, '');
}

async function checkDuplicateRegistrationInSupabase({ clubId, studentName, parentName, parentPhone, username }) {
  const safeClubId = normalizeDbClubId(clubId);
  if (!safeClubId) {
    return { ok: true };
  }

  if (!supabase || !supabase.from) {
    return { ok: true };
  }

  const normalizedStudentName = String(studentName ?? '').trim();
  const normalizedParentName = String(parentName ?? '').trim();
  const normalizedParentPhone = normalizeWhatsappNumber(parentPhone);
  const normalizedUsername = String(username ?? '').trim();

  if (!normalizedStudentName && !normalizedParentName && !normalizedParentPhone && !normalizedUsername) {
    return { ok: true };
  }

  const [studentResult, profileResult] = await Promise.all([
    supabase
      .from('club_students')
      .select('id, club_id, full_name, parent_name, parent_phone')
      .eq('club_id', safeClubId),
    supabase
      .from('profiles')
      .select('id, club_id, full_name, username, phone, role')
      .eq('club_id', safeClubId),
  ]);

  if (studentResult.error) {
    console.error('Supabase duplicate student check failed:', studentResult.error);
  }

  if (profileResult.error) {
    console.error('Supabase duplicate profile check failed:', profileResult.error);
  }

  const isDuplicateRecord = (record) => {
    if (!record || typeof record !== 'object') return false;

    const studentMatch = normalizedStudentName && normalizeDuplicateText(record.full_name ?? record.student_name ?? '') === normalizeDuplicateText(normalizedStudentName);
    const parentNameMatch = normalizedParentName && normalizeDuplicateText(record.parent_name ?? record.full_name ?? '') === normalizeDuplicateText(normalizedParentName);
    const parentPhoneMatch = normalizedParentPhone && normalizeDuplicateText(normalizeWhatsappNumber(record.parent_phone ?? record.phone ?? '')) === normalizeDuplicateText(normalizedParentPhone);
    const usernameMatch = normalizedUsername && normalizeDuplicateText(record.username ?? '') === normalizeDuplicateText(normalizedUsername);

    return Boolean(studentMatch || parentNameMatch || parentPhoneMatch || usernameMatch);
  };

  const duplicateStudent = (studentResult.data ?? []).find(isDuplicateRecord);
  if (duplicateStudent) {
    return {
      ok: false,
      duplicate: true,
      error: new Error('Bu öğrenci veya veli bu kulüpte zaten kayıtlı!'),
    };
  }

  const duplicateProfile = (profileResult.data ?? []).find(isDuplicateRecord);
  if (duplicateProfile) {
    return {
      ok: false,
      duplicate: true,
      error: new Error('Bu öğrenci veya veli bu kulüpte zaten kayıtlı!'),
    };
  }

  return { ok: true };
}

function formatWhatsappDisplay(value) {
  const sanitized = normalizeWhatsappNumber(value);
  if (!sanitized) return '';
  return `+${sanitized}`;
}

function buildWhatsAppLink(number, text) {
  const sanitized = normalizeWhatsappNumber(number);
  const encodedText = encodeURIComponent(text || '');
  if (!sanitized) return `https://wa.me/?text=${encodedText}`;
  return `https://wa.me/${sanitized}?text=${encodedText}`;
}

function getPublicBaseUrl() {
  return 'https://sporkulubutys.vercel.app';
}

function buildPublicClubLink(clubId) {
  if (!clubId) return 'https://sporkulubutys.vercel.app/?club=';
  const publicBaseUrl = getPublicBaseUrl();
  return `${publicBaseUrl}/?club=${encodeURIComponent(clubId)}`;
}

function getStudentBranchIds(student) {
  if (Array.isArray(student?.branchIds) && student.branchIds.length) return student.branchIds.filter(Boolean);
  if (student?.branchId) return [student.branchId];
  return [];
}

function getStudentBranchStatus(student, branchId) {
  if (student?.branchStatus && branchId && Object.prototype.hasOwnProperty.call(student.branchStatus, branchId)) {
    return student.branchStatus[branchId];
  }
  return student?.status ?? 'active';
}

function getSubscriptionWarning(club) {
  if (!club?.subscription?.endDate) return { label: 'Aktif', tone: 'green' };
  const diffMs = new Date(club.subscription.endDate).getTime() - Date.now();
  const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (remainingDays <= 15) return { label: 'Kritik', tone: 'red' };
  if (remainingDays <= 45) return { label: 'Uyarı', tone: 'yellow' };
  return { label: 'Aktif', tone: 'green' };
}

function formatShortDate(dateString) {
  if (!dateString) return '—';
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return parsed.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function buildPaymentReminderWhatsAppMessage(studentName, amount, clubName) {
  return `Merhaba, ${clubName} kulübü olarak ${studentName} öğrencisinin ödemesi için hatırlatma yapıyoruz. Gecikmiş tutar: ${Number(amount || 0).toLocaleString('tr-TR')} ₺. Lütfen ödeme işlemini tamamlayalım.`;
}

function buildPaymentReminderNotificationText(studentName, amount, branchName, clubName) {
  return `${clubName} kulübü: ${studentName} öğrencisinin ${branchName} branşı aidat ödemesi gecikti. Gecikmiş tutar: ${Number(amount || 0).toLocaleString('tr-TR')} ₺. Lütfen ödeme işlemini tamamlayınız.`;
}

function getStudentPaymentRows(club, student) {
  if (!club || !student) return [];

  const branchIds = getStudentBranchIds(student);
  if (!branchIds.length) return [];

  return branchIds.map((branchId) => {
    const branch = club.branches?.find((item) => item.id === branchId);
    const existingPayment = (club.payments || []).find(
      (payment) => payment.studentId === student.id && payment.branchId === branchId
    );

    const amount = Number(existingPayment?.amount ?? branch?.monthlyFee ?? branch?.fee ?? 0);
    const dueDate = existingPayment?.dueDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).toISOString().slice(0, 10);
    const status = existingPayment?.status || 'Ödenmedi';

    return {
      studentId: student.id,
      branchId,
      branchName: branch?.name || 'Branş',
      paymentId: existingPayment?.id || null,
      amount,
      dueDate,
      status,
    };
  });
}

function buildAttendanceWarningWhatsAppMessage(studentName, branchName, clubName) {
  return `Merhaba, ${clubName} kulübünde ${studentName} öğrencisinin ${branchName} branşı için devamsızlık uyarısı bulunmaktadır. Lütfen antrenman takvimi ve yoklama durumu ile ilgili bilgi alalım.`;
}

function getCalendarMonthCells(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingEmptyDays = (firstDay.getDay() + 6) % 7;
  const cells = [];

  for (let i = 0; i < leadingEmptyDays; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month - 1, day));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function AppClean({ initialPublicClubId = null } = {}) {
  const urlSearchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const forcedPublicClubId = urlSearchParams.get('club') || initialPublicClubId || null;

  const SESSION_STORAGE_KEY = 'sporthub_session_v1';

  const [currentUser, setCurrentUser] = useState(null);
  const [clubs, setClubs] = useState(initialClubs);
  const [users, setUsers] = useState(initialUsers);
  const [activeRole, setActiveRole] = useState('super-admin');
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const [superAdminTab, setSuperAdminTab] = useState('statistics');
  const [managerTab, setManagerTab] = useState('info');
  const [selectedClubId, setSelectedClubId] = useState('');
  const [newClub, setNewClub] = useState({
    clubName: '',
    managerName: '',
    contact: '',
    whatsappNumber: '',
    address: '',
    username: '',
    password: '',
    packageMonths: 12,
    subscriptionFee: '',
  });
  const [branchForm, setBranchForm] = useState({ name: '', fee: '' });
  const [branchEditValues, setBranchEditValues] = useState({});
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [expandedPaymentStudentId, setExpandedPaymentStudentId] = useState(null);
  const [managerSelectedBranchId, setManagerSelectedBranchId] = useState('');
  const [managerSelectedStudentId, setManagerSelectedStudentId] = useState('');
  const [studentBranchAddValue, setStudentBranchAddValue] = useState('');
  const [clubListSearch, setClubListSearch] = useState('');
  const [expandedClubId, setExpandedClubId] = useState(null);
  const [superAdminDetailClubId, setSuperAdminDetailClubId] = useState(null);
  const [coachForm, setCoachForm] = useState({ name: '', phone: '', branchId: 'branch-futbol', username: '', password: '' });
  const [announcementForm, setAnnouncementForm] = useState({ target: 'Tüm Okula', title: 'Antrenman İptali', message: '' });
  const [applicationForm, setApplicationForm] = useState(defaultForm);
  const [showKvkkModal, setShowKvkkModal] = useState(false);
  const [profilePassword, setProfilePassword] = useState({ newPassword: '', confirmPassword: '' });
  const [showCoachPassword, setShowCoachPassword] = useState(false);
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [subscriptionExtensionValues, setSubscriptionExtensionValues] = useState({});
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
  const [showStudentDetailModal, setShowStudentDetailModal] = useState(false);
  const [studentDetailForm, setStudentDetailForm] = useState({
    studentId: '',
    name: '',
    parentName: '',
    parentPhone: '',
    startedAt: '',
  });
  const [attendanceCalendar, setAttendanceCalendar] = useState({ studentId: null, month: new Date().toISOString().slice(0, 7) });
  const [showAttendanceSummaryModal, setShowAttendanceSummaryModal] = useState(false);
  const [parentTab, setParentTab] = useState('attendance');
  const [coachTab, setCoachTab] = useState('attendance');
  const [coachViewClubId, setCoachViewClubId] = useState('');
  const [coachViewCoachId, setCoachViewCoachId] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [parentMessageText, setParentMessageText] = useState('');
  const [coachMessageText, setCoachMessageText] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [managerPasswordReset, setManagerPasswordReset] = useState({ open: false, clubId: '', newPassword: '' });
  const [publicFormClubId, setPublicFormClubId] = useState(() => {
    if (initialPublicClubId) return initialPublicClubId;
    if (typeof window === 'undefined') return null;
    return urlSearchParams.get('club');
  });
  const [publicClubDetails, setPublicClubDetails] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setSessionHydrated(true);
      return;
    }

    try {
      const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (!rawSession) {
        setSessionHydrated(true);
        return;
      }

      const savedSession = JSON.parse(rawSession);
      if (savedSession?.currentUser) {
        setCurrentUser(savedSession.currentUser);
        setActiveRole(savedSession.activeRole || savedSession.currentUser.role || 'super-admin');
        if (savedSession.selectedClubId) {
          setSelectedClubId(savedSession.selectedClubId);
        }
      }
    } catch (error) {
      console.warn('Session restore failed:', error);
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      setSessionHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!sessionHydrated || typeof window === 'undefined') return;

    if (!currentUser) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        currentUser,
        activeRole,
        selectedClubId,
      })
    );
  }, [sessionHydrated, currentUser, activeRole, selectedClubId]);

  const getClubById = (clubId) => clubs.find((club) => club.id === clubId) ?? null;

  const loadClubs = async () => {
    const nextClubs = await fetchAllClubsFromSupabase();
    setClubs(nextClubs);

    const explicitClubId = publicFormClubId || initialPublicClubId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('club') : null);

    if (explicitClubId) {
      setSelectedClubId(explicitClubId);
      return;
    }

    if (nextClubs.length) {
      const firstClubId = nextClubs[0]?.id ?? '';
      const shouldSelectCurrent = selectedClubId && nextClubs.some((club) => club.id === selectedClubId);
      setSelectedClubId(shouldSelectCurrent ? selectedClubId : firstClubId);
    } else {
      setSelectedClubId('');
    }
  };

  useEffect(() => {
    if (!supabase || !supabase.channel) return undefined;

    const subscribedTables = ['clubs', 'club_branches', 'club_students', 'club_coaches', 'club_applications', 'club_announcements', 'club_messages', 'club_notifications', 'profiles'];
    const realtimeChannel = supabase.channel('sporthub-club-realtime', {
      config: {
        broadcast: { self: false },
        presence: { key: 'club-panel' },
      },
    });

    subscribedTables.forEach((tableName) => {
      realtimeChannel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        async () => {
          try {
            await loadClubs();
          } catch (error) {
            console.error(`Realtime refresh failed for ${tableName}:`, error);
          }
        }
      );
    });

    const subscription = realtimeChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.info('Supabase Realtime subscribed for club management tables.');
      }
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe().catch((error) => {
          console.warn('Realtime unsubscribe failed:', error);
        });
      }
      if (realtimeChannel && typeof realtimeChannel.unsubscribe === 'function') {
        realtimeChannel.unsubscribe().catch((error) => {
          console.warn('Realtime channel unsubscribe failed:', error);
        });
      }
    };
  }, [publicFormClubId, initialPublicClubId, selectedClubId]);

  useEffect(() => {
    let isMounted = true;

    const runLoadClubs = async () => {
      const nextClubs = await fetchAllClubsFromSupabase();
      if (!isMounted) return;

      setClubs(nextClubs);

      const explicitClubId = publicFormClubId || initialPublicClubId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('club') : null);

      if (explicitClubId) {
        setSelectedClubId(explicitClubId);
        return;
      }

      if (nextClubs.length) {
        const firstClubId = nextClubs[0]?.id ?? '';
        const shouldSelectCurrent = selectedClubId && nextClubs.some((club) => club.id === selectedClubId);
        setSelectedClubId(shouldSelectCurrent ? selectedClubId : firstClubId);
      } else {
        setSelectedClubId('');
      }
    };

    runLoadClubs();
    return () => {
      isMounted = false;
    };
  }, [publicFormClubId, initialPublicClubId]);

  useEffect(() => {
    const syncClubFromUrl = () => {
      if (typeof window === 'undefined') return;
      const urlClubId = new URLSearchParams(window.location.search).get('club');
      const safeClubId = urlClubId || null;

      setPublicFormClubId(safeClubId);
      if (safeClubId) {
        setSelectedClubId(safeClubId);
        return;
      }

      if (currentUser && !isSuperAdminRole(currentUser.role) && currentUser.clubId) {
        setSelectedClubId(currentUser.clubId);
        return;
      }

      if (!currentUser && !selectedClubId && clubs[0]) {
        setSelectedClubId(clubs[0].id);
      }
    };

    syncClubFromUrl();
    window.addEventListener('popstate', syncClubFromUrl);
    return () => window.removeEventListener('popstate', syncClubFromUrl);
  }, [clubs, currentUser, selectedClubId]);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timer = setTimeout(() => setToastMessage(''), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!clubs.length) return;

    const initialClubId = currentUser?.clubId || selectedClubId || clubs[0]?.id || '';
    if (!coachViewClubId && initialClubId) {
      setCoachViewClubId(initialClubId);
    }
  }, [clubs, currentUser, selectedClubId, coachViewClubId]);

  useEffect(() => {
    if (!coachViewClubId) {
      setCoachViewCoachId('');
      setSelectedCoachId('');
      return;
    }

    const eligibleCoaches = users.filter((user) => user.role === 'coach' && user.clubId === coachViewClubId);
    if (!eligibleCoaches.length) {
      setCoachViewCoachId('');
      setSelectedCoachId('');
      return;
    }

    if (!selectedCoachId || !eligibleCoaches.some((user) => user.id === selectedCoachId)) {
      const preferredCoachId = currentUser?.role === 'coach' && currentUser.clubId === coachViewClubId ? currentUser.id : '';
      const nextCoachId = preferredCoachId && eligibleCoaches.some((user) => user.id === preferredCoachId)
        ? preferredCoachId
        : '';

      if (nextCoachId !== selectedCoachId) {
        setSelectedCoachId(nextCoachId);
      }
    }

    if (selectedCoachId && selectedCoachId !== coachViewCoachId) {
      setCoachViewCoachId(selectedCoachId);
    }
  }, [coachViewClubId, selectedCoachId, users, currentUser]);

  useEffect(() => {
    if (!supabase || !supabase.from) return undefined;

    let isCancelled = false;

    const loadCoachProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['coach', 'ANTRENÖR', 'trainer']);

      if (error) {
        console.warn('Coach profile refresh failed:', error);
        return;
      }

      const normalizedCoaches = (data ?? [])
        .filter((row) => {
          const roleValue = String(row.role ?? '').trim().toLowerCase();
          return roleValue === 'coach' || roleValue === 'antrenör' || roleValue === 'trainer';
        })
        .map((row) => {
          const clubId = row.club_id || selectedClubId || currentUser?.clubId || '';
          const clubBranches = clubs.find((club) => club.id === clubId)?.branches ?? [];
          const directBranchName = String(row.branch_name || '').trim();
          const branchId = row.branch_id || row.branchId || null;
          const matchedBranchById = clubBranches.find((branch) => branch.id === branchId) ?? null;
          const matchedBranchByName = directBranchName
            ? clubBranches.find((branch) => String(branch.name ?? '').trim().toLowerCase() === directBranchName.toLowerCase()) ?? null
            : null;
          const resolvedBranch = matchedBranchById ?? matchedBranchByName ?? clubBranches[0] ?? null;
          const finalBranchId = branchId || resolvedBranch?.id || null;
          const finalBranchName = directBranchName || resolvedBranch?.name || (clubBranches.length ? clubBranches[0].name : 'Belirtilmemiş');

          return {
            id: row.id,
            role: 'coach',
            name: row.full_name || row.name || row.username || 'Antrenör',
            username: row.username || '',
            password: row.password || '',
            clubId,
            branchId: finalBranchId,
            branchName: finalBranchName,
            phone: row.phone || '',
            email: row.email || '',
            isActive: row.is_active !== false,
          };
        });

      if (isCancelled || !normalizedCoaches.length) return;

      setUsers((prev) => {
        const merged = [...prev];

        normalizedCoaches.forEach((coach) => {
          const index = merged.findIndex((user) => user.id === coach.id || (user.username && coach.username && user.username === coach.username && user.clubId === coach.clubId));
          if (index >= 0) {
            merged[index] = { ...merged[index], ...coach };
          } else {
            merged.push(coach);
          }
        });

        return merged;
      });
    };

    loadCoachProfiles();
    return () => {
      isCancelled = true;
    };
  }, [clubs, selectedClubId, currentUser]);

  const resolveClubId = (preferredClubId) => {
    const explicitClubId = publicFormClubId || initialPublicClubId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('club') : null);
    if (explicitClubId) {
      return explicitClubId;
    }

    const candidateList = [preferredClubId, selectedClubId, currentUser?.clubId, clubs[0]?.id];
    const validId = candidateList.find((candidate) => candidate && getClubById(candidate));
    return validId ?? clubs[0]?.id ?? null;
  };

  useEffect(() => {
    let isCancelled = false;

    const loadPublicClub = async () => {
      const rawClubId = publicFormClubId || initialPublicClubId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('club') : null);
      if (!rawClubId || !supabase || !supabase.from) {
        setPublicClubDetails(null);
        return;
      }

      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', rawClubId)
        .maybeSingle();

      if (clubError || !clubData) {
        if (!isCancelled) setPublicClubDetails(null);
        return;
      }

      const { data: branchData, error: branchError } = await supabase
        .from('club_branches')
        .select('*')
        .eq('club_id', rawClubId)
        .order('created_at', { ascending: true });

      if (!isCancelled) {
        const normalizedClub = normalizeClubRecord(clubData);
        setPublicClubDetails({
          ...(normalizedClub ?? { id: rawClubId, name: 'Kulüp', branches: [] }),
          branches: (branchData ?? []).map((branch) => ({
            id: branch.id,
            name: branch.name,
            fee: Number(branch.monthly_fee ?? 0),
            monthlyFee: Number(branch.monthly_fee ?? 0),
            ...branch,
          })),
        });
      }

      if (branchError) {
        console.warn('club_branches fetch failed during public route init:', branchError);
      }
    };

    loadPublicClub();
    return () => {
      isCancelled = true;
    };
  }, [publicFormClubId, initialPublicClubId]);

  function isSuperAdminRole(role) {
    if (typeof role === 'string') {
      const normalizedRole = role.trim().toLowerCase();
      if (normalizedRole === 'super-admin' || normalizedRole === 'super_admin') return true;
      if (normalizedRole === LOCKED_SUPER_ADMIN_EMAIL.toLowerCase()) return true;
      return false;
    }

    if (role && typeof role === 'object') {
      return isSuperAdminRole(role.role) || String(role.email ?? role.username ?? '').trim().toLowerCase() === LOCKED_SUPER_ADMIN_EMAIL.toLowerCase();
    }

    return false;
  }

  const isManagerRole = currentUser?.role === 'club-manager';
  const isCoachRole = currentUser?.role === 'coach';
  const isParentRole = currentUser?.role === 'parent';
  const clubScopeUserId = currentUser && !isSuperAdminRole(currentUser.role) ? currentUser.clubId : null;

  const currentClub = useMemo(
    () => getClubById(resolveClubId(selectedClubId)) ?? clubs[0] ?? null,
    [clubs, selectedClubId, currentUser, publicFormClubId]
  );

  const requestedPublicClubId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('club') : null;
  const rawPublicRouteClubId = publicFormClubId || requestedPublicClubId || initialPublicClubId || null;
  const validPublicFormClubId = rawPublicRouteClubId && String(rawPublicRouteClubId).trim() ? String(rawPublicRouteClubId).trim() : null;
  const isPublicRegistrationRoute = Boolean(validPublicFormClubId);
  const shouldShowPublicForm = isPublicRegistrationRoute && !currentUser;
  const formClub = useMemo(() => {
    if (validPublicFormClubId) {
      return publicClubDetails || getClubById(validPublicFormClubId) || { id: validPublicFormClubId, name: 'Kulüp', branches: [] };
    }
    return publicClubDetails || getClubById(selectedClubId) || currentClub || clubs[0] || null;
  }, [validPublicFormClubId, publicClubDetails, selectedClubId, currentClub, clubs]);

  useEffect(() => {
    const genericTitle = 'Spor Kulüpleri ve Okulları Yönetim Sistemi';

    if (isPublicRegistrationRoute) {
      const clubName = getClubById(validPublicFormClubId)?.name || publicClubDetails?.name || 'Kulüp';
      document.title = `${clubName} | Online Kayıt Formu`;
      return;
    }

    if (!currentUser) {
      document.title = genericTitle;
      return;
    }

    const userRole = currentUser?.role;
    const clubScopedRole = !isSuperAdminRole(userRole) && currentUser?.clubId;
    const superAdminClubScopedView = isSuperAdminRole(userRole) && activeRole !== 'super-admin' && selectedClubId;

    if (clubScopedRole || superAdminClubScopedView) {
      const clubId = clubScopedRole ? currentUser.clubId : selectedClubId;
      const clubName = getClubById(clubId)?.name || 'Kulüp';
      document.title = `${clubName} | Spor Kulübü Yönetim`;
      return;
    }

    document.title = genericTitle;
  }, [currentUser, validPublicFormClubId, selectedClubId, clubs, publicClubDetails, isPublicRegistrationRoute, activeRole]);

  const announcementTargets = useMemo(
    () => [
      { value: 'Tüm Okula', label: 'Tüm Okula' },
      ...((currentClub?.branches ?? []).map((branch) => ({ value: branch.name, label: branch.name }))),
    ],
    [currentClub?.branches]
  );

  useEffect(() => {
    if (!clubs.length) return;
    const nextClubId = resolveClubId(selectedClubId);
    if (nextClubId && selectedClubId !== nextClubId) {
      setSelectedClubId(nextClubId);
    }
  }, [clubs, selectedClubId, currentUser, publicFormClubId]);

  const bekleyenler = currentClub?.pendingApplications ?? [];
  const ogrenciler = currentClub?.students ?? [];
  const filteredClubs = useMemo(() => {
    const searchTerm = clubListSearch.trim().toLowerCase();
    if (!searchTerm) return clubs;

    return clubs.filter((club) => {
      const searchableText = [club.name, club.managerName, club.username, club.phone].filter(Boolean).join(' ').toLowerCase();
      return searchableText.includes(searchTerm);
    });
  }, [clubs, clubListSearch]);

  const switchRoleView = (nextRole) => {
    setActiveRole(nextRole);
    if (!clubs.length) return;

    if (nextRole === 'super-admin') {
      setSelectedClubId(clubs[0]?.id ?? '');
      return;
    }

    if (nextRole === 'club-manager') {
      if (currentUser?.clubId) {
        setSelectedClubId(currentUser.clubId);
        return;
      }
      const nextClubId = clubs[0]?.id ?? '';
      if (nextClubId) setSelectedClubId(nextClubId);
      return;
    }

    const nextClubId = currentUser?.clubId ? getClubById(currentUser.clubId)?.id : clubs[0]?.id;
    if (nextClubId) setSelectedClubId(nextClubId);
  };

  const activeDisplayUser = useMemo(() => {
    if (!currentUser) return null;
    if (!isSuperAdminRole(currentUser.role)) return currentUser;

    if (activeRole === 'club-manager') {
      return users.find((user) => user.role === 'club-manager' && user.clubId === selectedClubId) ?? currentUser;
    }
    if (activeRole === 'coach') {
      return users.find((user) => user.role === 'coach' && user.clubId === selectedClubId) ?? currentUser;
    }
    if (activeRole === 'parent') {
      return users.find((user) => user.role === 'parent' && user.clubId === selectedClubId) ?? currentUser;
    }
    return currentUser;
  }, [activeRole, currentUser, selectedClubId, users]);

  const normalizeAuthText = (value) => String(value ?? '').trim().toUpperCase();

  const findMatchingUser = (username, password, role = null) => {
    const cleanedUsername = String(username ?? '').trim();
    const enteredPassword = String(password ?? '').trim();
    const normalizedInput = normalizeWhatsappNumber(cleanedUsername);
    const canonicalInputUsername = normalizeLoginUsername(cleanedUsername);
    const normalizedInputText = normalizeAuthText(cleanedUsername);

    if (isLockedSuperAdminIdentity(cleanedUsername, enteredPassword)) {
      return { ...lockedSuperAdminUser, role: 'super-admin', isActive: true };
    }

    const directSupabaseMatch = users.find((user) => {
      const userRole = user.role;
      const isSuperAdminAccount = isSuperAdminRole(userRole) || isSuperAdminRole(role);
      const userKey = user.username ?? user.email ?? user.name ?? '';
      const canonicalUserKey = normalizeLoginUsername(userKey);
      const userPhone = normalizeWhatsappNumber(user.phone ?? '');
      const storedPassword = String(user.password ?? '').trim();
      const normalizedDbUserKey = normalizeAuthText(userKey);
      const matchesRole = role ? userRole === role : true;
      const matchesUsername = canonicalUserKey === canonicalInputUsername || normalizedDbUserKey === normalizedInputText;
      const matchesPhone = userPhone && normalizedInput && userPhone === normalizedInput;
      const matchesParentCandidate = userRole === 'parent' && (matchesUsername || matchesPhone || normalizeLoginUsername(user.username || '') === canonicalInputUsername);
      const credentialsMatch = (matchesUsername || matchesPhone || matchesParentCandidate) && enteredPassword === storedPassword;

      const girilenKadi = cleanedUsername;
      const veritabanindakiKadi = userKey;
      console.log('Giriş denemesi:', girilenKadi, veritabanindakiKadi);

      if (isSuperAdminAccount && credentialsMatch) return true;
      return matchesRole && credentialsMatch;
    });

    if (directSupabaseMatch) return directSupabaseMatch;

    if (cleanedUsername.toLowerCase() === LOCKED_SUPER_ADMIN_EMAIL.toLowerCase() && enteredPassword === LOCKED_SUPER_ADMIN_PASSWORD) {
      return { ...lockedSuperAdminUser, role: 'super-admin', isActive: true };
    }

    return undefined;
  };

  const login = (role, username, password) => {
    const match = findMatchingUser(username, password, role);

    if (!match) {
      alert('Giriş bilgileri hatalı.');
      return;
    }

    const isSuperAdminLogin = isSuperAdminRole(match.role) || isSuperAdminRole(role);
    if (isSuperAdminLogin) {
      setCurrentUser(match);
      setActiveRole(match.role || 'super-admin');
      setSelectedClubId(clubs[0]?.id ?? '');
      return;
    }

    setCurrentUser(match);
    setActiveRole(match.role);
    const nextClubId = match.clubId || clubs[0]?.id;
    if (nextClubId) setSelectedClubId(nextClubId);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveRole('super-admin');
    setSelectedClubId('');
    setPublicFormClubId(null);
    setPublicClubDetails(null);
    document.title = 'Spor Kulüpleri ve Okulları Yönetim Sistemi';

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete('club');
      window.history.replaceState({}, '', nextUrl);
    }
  };

  const handleToggleClubStatus = (clubId) => {
    setClubs((prev) => prev.map((club) => (club.id === clubId ? { ...club, suspended: !club.suspended } : club)));
  };

  const handleDeleteClub = async (clubId) => {
    if (!clubId) return;
    const clubToDelete = getClubById(clubId);
    const confirmed = window.confirm(`${clubToDelete?.name || 'Bu kulüp'} silinecek. Tüm kulüp verileri, şubeler, öğrenciler, veliler, duyurular ve kayıtlar da silinecektir. Devam etmek istiyor musunuz?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('clubs').delete().eq('id', clubId);
      if (error) {
        console.error('Supabase club delete failed:', error);
        alert('Kulüp silinemedi. Veritabanı kısıtları veya ilişkiler kontrol edilmelidir.');
        return;
      }

      setClubs((prev) => prev.filter((club) => club.id !== clubId));
      setExpandedClubId((prev) => (prev === clubId ? null : prev));
      setSuperAdminDetailClubId((prev) => (prev === clubId ? null : prev));

      if (publicFormClubId === clubId) {
        setPublicFormClubId(null);
      }

      if (selectedClubId === clubId) {
        const nextClubId = clubs.find((club) => club.id !== clubId)?.id ?? '';
        setSelectedClubId(nextClubId);
      }

      setToastMessage('Kulüp ve tüm ilişkili veriler silindi.');
    } catch (error) {
      console.error('Unexpected delete club error:', error);
      alert('Kulüp silinirken beklenmeyen bir hata oluştu.');
    }
  };

  const handleExtendSubscription = (clubId, months, amount) => {
    setClubs((prev) =>
      prev.map((club) => {
        if (club.id !== clubId) return club;
        const nextEnd = new Date(club.subscription.endDate);
        nextEnd.setMonth(nextEnd.getMonth() + Number(months || 0));
        return {
          ...club,
          subscription: {
            ...club.subscription,
            packageMonths: Number(club.subscription.packageMonths || 0) + Number(months || 0),
            endDate: nextEnd.toISOString().slice(0, 10),
            lastPaymentDate: new Date().toISOString().slice(0, 10),
          },
          subscriptionHistory: [
            ...(club.subscriptionHistory ?? []),
            {
              id: `ext-${Date.now()}`,
              months: Number(months || 0),
              amount: Number(amount || 0),
              paidAt: new Date().toISOString().slice(0, 10),
              note: 'Abonelik uzatıldı',
            },
          ],
        };
      })
    );
  };

  const handleSuperAdminCreateClub = async () => {
    if (!newClub.clubName || !newClub.managerName || !newClub.username || !newClub.password) {
      alert('Kulüp adı, yönetici, kullanıcı adı ve şifre zorunludur.');
      return;
    }

    const clubId = `club-${Date.now()}`;
    const clubObj = {
      id: clubId,
      name: newClub.clubName,
      managerName: newClub.managerName,
      phone: newClub.contact,
      whatsappNumber: normalizeWhatsappNumber(newClub.whatsappNumber),
      address: newClub.address,
      username: newClub.username,
      password: newClub.password,
      suspended: false,
      subscription: {
        packageMonths: Number(newClub.packageMonths || 12),
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + Number(newClub.packageMonths || 12) * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        lastPaymentDate: new Date().toISOString().slice(0, 10),
        status: 'active',
      },
      subscriptionHistory: [],
      branches: [],
      students: [],
      announcements: [],
      payments: [],
      pendingApplications: [],
      paymentSchedule: [],
      notifications: [],
    };

    const clubInsertResult = await persistClubToSupabase(clubObj);
    if (!clubInsertResult.ok) {
      console.error('Supabase club insert failed.', clubInsertResult.error);
      alert('Kulüp veritabanına kaydedilemedi.');
      return;
    }

    const insertedClub = (clubInsertResult.data && clubInsertResult.data[0]) || clubObj;
    const savedClubId = normalizeDbClubId(insertedClub?.id) || normalizeDbClubId(clubObj.id) || clubId;
    const finalClubObj = { ...clubObj, id: savedClubId };

    setClubs((prev) => [finalClubObj, ...prev]);
    setUsers((prev) => [
      ...prev,
      {
        id: `manager-${Date.now()}`,
        role: 'club-manager',
        name: newClub.managerName,
        username: newClub.username,
        password: newClub.password,
        clubId: savedClubId,
        isActive: true,
      },
    ]);

    await persistProfileToSupabase({
      id: `manager-${Date.now()}`,
      clubId: savedClubId,
      role: 'club-manager',
      fullName: newClub.managerName,
      username: newClub.username,
      password: newClub.password,
      phone: newClub.contact,
      isActive: true,
    });
    setNewClub({
      clubName: '',
      managerName: '',
      contact: '',
      whatsappNumber: '',
      address: '',
      username: '',
      password: '',
      packageMonths: 12,
      subscriptionFee: '',
    });
    setSuperAdminTab('clubs');
    alert('Kulüp başarıyla oluşturuldu.');
  };

  const handleAddBranch = async () => {
    if (!branchForm.name.trim()) return;
    const newBranch = {
      name: branchForm.name.trim(),
      fee: Number(branchForm.fee || 0),
      monthlyFee: Number(branchForm.fee || 0),
      coachIds: [],
      clubId: selectedClubId,
    };

    const branchInsertResult = await persistBranchToSupabase(newBranch);
    if (!branchInsertResult.ok) {
      console.error('Supabase branch insert failed.', branchInsertResult.error);
      alert('Branş veritabanına kaydedilemedi.');
      return;
    }

    const insertedBranch = (branchInsertResult.data && branchInsertResult.data[0]) || {
      ...newBranch,
      id: `branch-${Date.now()}`,
      fee: Number(newBranch.fee || 0),
      monthlyFee: Number(newBranch.monthlyFee || 0),
      coachIds: [],
      clubId: selectedClubId,
    };

    setClubs((prev) => prev.map((club) => (club.id === selectedClubId ? { ...club, branches: [...(club.branches ?? []), { ...insertedBranch, fee: Number(insertedBranch.fee ?? insertedBranch.monthly_fee ?? 0), monthlyFee: Number(insertedBranch.monthlyFee ?? insertedBranch.monthly_fee ?? insertedBranch.fee ?? 0) }] } : club)));
    setBranchForm({ name: '', fee: '' });
    setToastMessage('Branş başarıyla eklendi.');
  };

  const handleDeleteBranch = async (branchId) => {
    if (!branchId) return;
    const confirmed = window.confirm('Bu branşı silmek istediğinize emin misiniz?');
    if (!confirmed) return;

    const deleteResult = await deleteFromSupabase('club_branches', 'id', branchId);
    if (!deleteResult.ok) {
      console.error('Supabase branch delete failed.', deleteResult.error);
      alert('Branş veritabanından silinemedi.');
      return;
    }

    setClubs((prev) => prev.map((club) => (
      club.id === selectedClubId ? { ...club, branches: (club.branches ?? []).filter((branch) => branch.id !== branchId) } : club
    )));
    setToastMessage('Branş silindi.');
  };

  const handleUpdateBranchFee = (branchId, value) => {
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) return;

    setClubs((prev) =>
      prev.map((club) => ({
        ...club,
        branches: club.branches.map((branch) =>
          branch.id === branchId ? { ...branch, fee: parsedValue, monthlyFee: parsedValue } : branch
        ),
      }))
    );
  };

  const setBranchFeeValue = (branchId, rawValue) => {
    const nextValue = rawValue === '' ? '' : String(rawValue).trim();
    setBranchEditValues((prev) => ({
      ...prev,
      [branchId]: nextValue,
    }));
  };

  const saveBranchFee = (branchId) => {
    const rawValue = branchEditValues[branchId];
    if (rawValue === undefined || rawValue === null || rawValue === '') return;

    const cleanedValue = String(rawValue).replace(/,/g, '').trim();
    if (cleanedValue === '') return;

    const numericValue = Number(cleanedValue);
    if (!Number.isFinite(numericValue)) return;

    handleUpdateBranchFee(branchId, numericValue);
  };

  const handleAddCoach = async () => {
    if (!coachForm.name.trim() || !coachForm.password.trim()) {
      alert('Antrenör adı ve şifre zorunludur.');
      return;
    }

    const username = coachForm.username || generateUsername(coachForm.name);
    const id = `coach-${Date.now()}`;
    const branchName = currentClub?.branches?.find((branch) => branch.id === coachForm.branchId)?.name || 'Belirtilmemiş';
    const coachUser = {
      id,
      role: 'coach',
      name: coachForm.name,
      username,
      password: coachForm.password,
      clubId: selectedClubId,
      branchId: coachForm.branchId,
      branchName,
      isActive: true,
    };

    const coachInsertResult = await persistCoachToSupabase({
      id,
      clubId: selectedClubId,
      name: coachForm.name,
      username,
      password: coachForm.password,
      phone: coachForm.phone,
      branchId: coachForm.branchId,
    });
    if (!coachInsertResult.ok) {
      console.error('Supabase coach insert failed.', coachInsertResult.error);
      alert('Antrenör veritabanına kaydedilemedi.');
      return;
    }

    await persistProfileToSupabase({
      id,
      clubId: selectedClubId,
      role: 'coach',
      fullName: coachForm.name,
      username,
      password: coachForm.password,
      phone: coachForm.phone,
      branchId: coachForm.branchId,
      branchName,
      isActive: true,
    });

    setUsers((prev) => [...prev, coachUser]);
    setClubs((prev) =>
      prev.map((club) =>
        club.id === selectedClubId
          ? {
              ...club,
              branches: club.branches.map((branch) =>
                branch.id === coachForm.branchId ? { ...branch, coachIds: [...branch.coachIds, id] } : branch
              ),
            }
          : club
      )
    );

    setCoachForm({ name: '', phone: '', branchId: 'branch-futbol', username: '', password: '' });
    alert('Antrenör kaydedildi.');
  };

  const handleApproveApplication = async (application) => {
    if (!application) {
      console.log('handleApproveApplication: application boş geldi.');
      return;
    }

    const resolvedClubId = getClubById(publicFormClubId || selectedClubId)?.id || getClubById(currentUser?.clubId)?.id || currentClub?.id || clubs[0]?.id;
    if (!resolvedClubId) {
      console.log('handleApproveApplication: uygun kulüp bulunamadı.', { selectedClubId, currentClubId: currentClub?.id, clubsCount: clubs.length, publicFormClubId });
      return;
    }

    const appId = String(application.id ?? '');
    const parentUsername = generateUsername(application.parentName || application.username || '') || String(application.username || '').trim() || normalizeWhatsappNumber(application.parentPhone) || `VELI-${Date.now()}`;
    const parentPassword = String(application.parentPassword ?? '').trim();
    const normalizedPhone = normalizeWhatsappNumber(application.parentPhone);

    if (!parentPassword) {
      console.error('handleApproveApplication: parent password missing.', application);
      alert('Veli şifresi eksik. Kayıt formunda girilen şifre kullanılmalıdır.');
      return;
    }

    const insertStudentResult = await persistStudentToSupabase({
      clubId: resolvedClubId,
      name: application.studentName,
      parentName: application.parentName,
      parentPhone: application.parentPhone,
      branchId: application.branchId,
      birthDate: application.birthDate || '',
      startedAt: new Date().toISOString().slice(0, 10),
      status: 'active',
    });

    if (!insertStudentResult.ok) {
      console.error('Supabase student insert failed.', insertStudentResult.error);
      if (insertStudentResult.duplicate) {
        const duplicateMessage = 'Bu öğrenci veya veli bu kulüpte zaten kayıtlı!';
        setToastMessage(duplicateMessage);
        alert(duplicateMessage);
        return;
      }
      alert('Öğrenci kaydı veritabanına gönderilemedi.');
      return;
    }

    const insertParentResult = await persistParentToSupabase({
      clubId: resolvedClubId,
      name: application.parentName,
      phone: application.parentPhone,
      username: parentUsername,
      password: parentPassword,
    });

    if (!insertParentResult.ok) {
      console.warn('Parent profile insert failed; continuing locally.', insertParentResult.error);
    }

    const approveResult = await updateApplicationStatusInSupabase({
      id: appId,
      clubId: resolvedClubId,
      studentName: application.studentName,
      parentName: application.parentName,
      parentPhone: application.parentPhone,
      status: 'approved',
    });
    if (!approveResult.ok) {
      console.error('Supabase application approval failed.', approveResult.error);
      alert('Başvurunun onay durumu veritabanında kaydedilemedi.');
      return;
    }

    await loadClubs();
    setSelectedClubId(resolvedClubId);

    const club = clubs.find((item) => item.id === resolvedClubId);
    if (!club) {
      console.log('handleApproveApplication: resolvedClubId için kulüp bulunamadı.', resolvedClubId);
      return;
    }

    const generatedStudentId = `student-${Date.now()}`;
    const selectedBranch = club.branches.find((branch) => branch.id === application.branchId);
    const branchFee = Number(selectedBranch?.monthlyFee ?? selectedBranch?.fee ?? 0);
    const monthLabel = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }).replace(/^./, (char) => char.toUpperCase());
    const dueDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5);

    const newStudent = {
      id: generatedStudentId,
      name: application.studentName,
      parentName: application.parentName,
      parentPhone: application.parentPhone,
      branchId: application.branchId,
      branchIds: [application.branchId],
      status: 'active',
      branchStatus: { [application.branchId]: 'active' },
      attendance: [],
    };

    setClubs((prev) =>
      prev.map((item) => {
        if (item.id !== resolvedClubId) return item;

        const nextPendingApplications = (item.pendingApplications ?? []).filter((app) => String(app.id) !== appId);
        const nextStudents = [...(item.students ?? []), newStudent];

        return {
          ...item,
          students: nextStudents,
          pendingApplications: nextPendingApplications,
          payments: [
            ...(item.payments ?? []),
            {
              id: `pay-${Date.now()}`,
              studentId: generatedStudentId,
              month: monthLabel,
              amount: branchFee,
              status: 'Ödenmedi',
              branchId: application.branchId,
              dueDate: dueDate.toISOString().slice(0, 10),
            },
          ],
          approvedApplications: [
            ...(item.approvedApplications ?? []),
            {
              ...application,
              status: 'approved',
              approvedAt: new Date().toISOString(),
              branchId: application.branchId,
            },
          ],
        };
      })
    );

    setManagerSelectedBranchId(application.branchId);
    setManagerSelectedStudentId(generatedStudentId);

    setUsers((prev) => {
      const existingParent = prev.find((user) => {
        const sameClub = user.clubId === resolvedClubId;
        const sameName = user.name?.toLowerCase() === String(application.parentName || '').toLowerCase();
        const samePhone = user.phone && normalizedPhone && normalizeWhatsappNumber(user.phone) === normalizedPhone;
        return sameClub && (sameName || samePhone || user.username === parentUsername);
      });

      if (existingParent) {
        return prev.map((user) =>
          user.id === existingParent.id
            ? {
                ...user,
                username: parentUsername,
                password: parentPassword,
                phone: normalizedPhone || user.phone,
                childStudentId: generatedStudentId,
                isActive: true,
              }
            : user
        );
      }

      return [
        ...prev,
        {
          id: `parent-${Date.now()}`,
          role: 'parent',
          name: application.parentName,
          username: parentUsername,
          password: parentPassword,
          phone: normalizedPhone,
          clubId: resolvedClubId,
          childStudentId: generatedStudentId,
          isActive: true,
        },
      ];
    });

    setToastMessage('Kayıt başarıyla alındı!');
  };

  const handleAssignStudentToBranch = (studentId, branchId) => {
    if (!studentId || !branchId) return;

    setClubs((prev) =>
      prev.map((club) => ({
        ...club,
        students: club.students.map((student) => {
          if (student.id !== studentId) return student;

          const existingBranchIds = Array.isArray(student.branchIds) && student.branchIds.length
            ? student.branchIds.filter(Boolean)
            : student.branchId
              ? [student.branchId]
              : [];

          if (existingBranchIds.includes(branchId)) {
            return student;
          }

          const nextBranchIds = [...existingBranchIds, branchId];
          const nextBranchStatus = {
            ...(student.branchStatus || {}),
            [branchId]: student.branchStatus?.[branchId] ?? 'active',
          };

          return {
            ...student,
            branchId: student.branchId || branchId,
            branchIds: nextBranchIds,
            branchStatus: nextBranchStatus,
            status: student.status === 'passive' ? 'passive' : 'active',
          };
        }),
      }))
    );

    setStudentBranchAddValue('');
    setToastMessage('Branş öğrencinin listesine eklendi.');
  };

  const handleStudentStatusToggle = (studentId, branchId, nextStatus) => {
    setClubs((prev) =>
      prev.map((club) => ({
        ...club,
        students: club.students.map((student) =>
          student.id === studentId
            ? {
                ...student,
                status: nextStatus,
                branchStatus: {
                  ...(student.branchStatus || {}),
                  [branchId]: nextStatus,
                },
              }
            : student
        ),
      }))
    );
  };

  const handleAttendanceUpdate = (studentId, status) => {
    const today = new Date().toISOString().slice(0, 10);
    setClubs((prev) =>
      prev.map((club) => ({
        ...club,
        students: club.students.map((student) => {
          if (student.id !== studentId) return student;
          const nextAttendance = [...(student.attendance || [])];
          const existingIndex = nextAttendance.findIndex((entry) => entry.date === today);
          if (existingIndex >= 0) {
            nextAttendance[existingIndex] = { ...nextAttendance[existingIndex], status };
          } else {
            nextAttendance.push({ date: today, status });
          }
          return { ...student, attendance: nextAttendance };
        }),
      }))
    );
  };

  const handlePasswordUpdate = () => {
    if (!profilePassword.newPassword || profilePassword.newPassword !== profilePassword.confirmPassword) {
      alert('Şifre alanları eşleşmeli ve boş bırakılamaz.');
      return;
    }

    setUsers((prev) =>
      prev.map((user) =>
        user.id === currentUser.id ? { ...user, password: profilePassword.newPassword } : user
      )
    );
    setCurrentUser((prev) => (prev ? { ...prev, password: profilePassword.newPassword } : prev));
    setProfilePassword({ newPassword: '', confirmPassword: '' });
    alert('Şifre güncellendi.');
  };

  const handleResetClubManagerPassword = async (clubId, nextPassword) => {
    const safePassword = String(nextPassword ?? '').trim();
    if (!clubId || !safePassword) {
      setToastMessage('Şifre boş olamaz.');
      return;
    }

    const club = clubs.find((item) => item.id === clubId);
    if (!club) {
      setToastMessage('Kulüp bulunamadı.');
      return;
    }

    const managerUser = users.find((user) => user.role === 'club-manager' && user.clubId === clubId) ?? null;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ password: safePassword })
        .eq('club_id', clubId)
        .eq('role', 'club-manager');

      if (error) {
        console.error('Supabase club-manager password reset failed:', error);
        setToastMessage('Şifre güncellenemedi.');
        return;
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.role === 'club-manager' && user.clubId === clubId ? { ...user, password: safePassword } : user
        )
      );

      setClubs((prev) =>
        prev.map((item) =>
          item.id === clubId ? { ...item, password: safePassword, managerPassword: safePassword } : item
        )
      );

      if (managerUser && currentUser && managerUser.id === currentUser.id) {
        setCurrentUser((prev) => (prev ? { ...prev, password: safePassword } : prev));
      }

      setManagerPasswordReset({ open: false, clubId: '', newPassword: '' });
      setToastMessage(`${club.name} kulübü yöneticisi şifresi güncellendi.`);
    } catch (error) {
      console.error('Club manager password reset crashed:', error);
      setToastMessage('Şifre güncellemesi sırasında hata oluştu.');
    }
  };

  const handlePaymentStatusChange = (studentId, branchId, nextStatus) => {
    setClubs((prev) =>
      prev.map((club) => {
        if (club.id !== selectedClubId) return club;

        const existingPayment = (club.payments || []).find(
          (payment) => payment.studentId === studentId && payment.branchId === branchId
        );

        if (existingPayment) {
          return {
            ...club,
            payments: (club.payments || []).map((payment) =>
              payment.id === existingPayment.id ? { ...payment, status: nextStatus } : payment
            ),
          };
        }

        const branch = club.branches?.find((item) => item.id === branchId);
        const monthLabel = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }).replace(/^./, (char) => char.toUpperCase());
        const dueDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).toISOString().slice(0, 10);

        return {
          ...club,
          payments: [
            ...(club.payments || []),
            {
              id: `pay-${Date.now()}`,
              studentId,
              branchId,
              month: monthLabel,
              amount: Number(branch?.monthlyFee ?? branch?.fee ?? 0),
              status: nextStatus,
              dueDate,
            },
          ],
        };
      })
    );

    setToastMessage(nextStatus === 'Ödendi' ? 'Ödeme durumu ödendi olarak güncellendi.' : 'Ödeme durumu güncellendi.');
  };

  const handleSendAnnouncement = async () => {
    const cleanTitle = String(announcementForm.title || '').trim();
    const cleanMessage = String(announcementForm.message || '').trim();

    if (!cleanTitle || !cleanMessage) {
      alert('Duyuru başlığı ve mesajı zorunludur.');
      return;
    }

    const clubId = normalizeDbClubId(selectedClubId || currentClub?.id || currentUser?.clubId || '');
    if (!clubId) {
      alert('Kulüp kimliği bulunamadı. Duyuru kaydedilemedi.');
      return;
    }

    const notificationText = `${cleanTitle}: ${cleanMessage}`;
    const localNotification = {
      id: `notif-${Date.now()}`,
      type: 'system-announcement',
      studentId: null,
      parentPhone: '',
      text: notificationText,
      createdAt: new Date().toISOString(),
      read: false,
      target: announcementForm.target,
    };

    const payload = {
      club_id: clubId,
      user_id: null,
      text: notificationText,
      created_at: new Date().toISOString(),
    };

    const { error } = await insertIntoSupabase('club_notifications', [payload]);
    if (error) {
      console.error('Supabase club_notifications insert failed:', error);
      alert('Duyuru uygulama içi bildirim olarak kaydedilemedi.');
      return;
    }

    setClubs((prev) => prev.map((club) =>
      club.id === (selectedClubId || currentClub?.id)
        ? {
            ...club,
            announcements: [{
              id: `ann-${Date.now()}`,
              title: cleanTitle,
              message: cleanMessage,
              target: announcementForm.target,
              type: 'notice',
              createdAt: new Date().toISOString(),
            }, ...(club.announcements || [])],
            notifications: [localNotification, ...(club.notifications || [])],
          }
        : club
    ));

    setToastMessage('Duyuru uygulama içi bildirim olarak kaydedildi.');
  };

  const sendPaymentReminderNotification = (student, amount, branchName) => {
    if (!student || !student.id) return;

    const clubName = currentClub?.name || 'Kulübümüz';
    const text = buildPaymentReminderNotificationText(student.name, amount, branchName, clubName);

    setClubs((prev) =>
      prev.map((club) =>
        club.id === selectedClubId
          ? {
              ...club,
              notifications: [
                {
                  id: `notif-${Date.now()}`,
                  type: 'payment-reminder',
                  studentId: student.id,
                  studentName: student.name,
                  parentPhone: student.parentPhone || '',
                  text,
                  createdAt: new Date().toISOString(),
                  read: false,
                },
                ...(club.notifications || []),
              ],
            }
          : club
      )
    );

    setToastMessage('Veliye uygulama içi ödeme hatırlatması gönderildi.');
  };

  const sendManagerMessage = async (senderName, senderRole, content, studentContext = {}) => {
    const cleanText = String(content || '').trim();
    if (!cleanText) {
      alert('Mesaj içeriği boş olamaz.');
      return;
    }

    const safeClubId = normalizeDbClubId(selectedClubId) || normalizeDbClubId(currentClub?.id) || normalizeDbClubId(currentUser?.clubId);
    if (!safeClubId) {
      alert('Kulüp kimliği bulunamadı. Mesaj kaydedilemedi.');
      return;
    }

    const basePayload = {
      club_id: safeClubId,
      sender_name: String(senderName || 'Kullanıcı').trim() || 'Kullanıcı',
      sender_role: String(senderRole || 'Veli').trim() || 'Veli',
      message: cleanText,
      read: false,
    };

    const studentId = normalizeDbStudentId(studentContext.studentId);
    const studentName = String(studentContext.studentName || '').trim();

    const payload = {
      ...basePayload,
      ...(studentId ? { student_id: studentId } : {}),
      ...(studentName ? { student_name: studentName } : {}),
    };

    const payloadWithoutOptionalFields = {
      club_id: basePayload.club_id,
      sender_name: basePayload.sender_name,
      sender_role: basePayload.sender_role,
      message: basePayload.message,
      read: false,
    };

    const attemptInsert = async (record) => {
      const cleanedRecord = Object.fromEntries(
        Object.entries(record).filter(([, value]) => value !== undefined && value !== null && value !== '')
      );
      return insertIntoSupabase('club_messages', [cleanedRecord]);
    };

    let result = await attemptInsert(payload);
    if (!result.ok || result.error) {
      const fallbackMessage = 'Mesaj veritabanına kaydedilemedi.';
      console.warn('Primary club_messages insert failed, retrying with minimal payload:', result.error || 'Unknown error');
      result = await attemptInsert(payloadWithoutOptionalFields);
      if (!result.ok || result.error) {
        console.error('Supabase club_messages insert failed:', result.error || 'Unknown error');
        alert(fallbackMessage);
        return;
      }
    }

    const insertedRecord = (result.data ?? [])[0] ?? { ...basePayload, ...(studentId ? { student_id: studentId } : {}), ...(studentName ? { student_name: studentName } : {}), created_at: new Date().toISOString() };
    const normalizedMessage = normalizeMessageRecord(insertedRecord);

    setClubs((prev) =>
      prev.map((club) =>
        club.id === selectedClubId || club.id === currentClub?.id || club.id === currentUser?.clubId
          ? {
              ...club,
              incomingMessages: [normalizedMessage ?? {
                id: `msg-${Date.now()}`,
                senderName: basePayload.sender_name,
                senderRole: basePayload.sender_role,
                studentName: studentName || '',
                studentId: studentId || null,
                message: cleanText,
                read: false,
                sentAt: new Date().toISOString(),
              }, ...(club.incomingMessages || [])],
            }
          : club
      )
    );

    setToastMessage('Mesajınız başarıyla gönderildi');
    await loadClubs();
  };

  const markMessageAsRead = async (messageId) => {
    if (!messageId) return;

    const { data, error } = await supabase
      .from('club_messages')
      .update({ read: true })
      .eq('id', messageId)
      .select();

    if (error) {
      console.error('Supabase message read status update failed:', error);
      alert('Mesaj okundu olarak işaretlenemedi.');
      return;
    }

    setClubs((prev) =>
      prev.map((club) => ({
        ...club,
        incomingMessages: (club.incomingMessages || []).map((message) =>
          message.id === messageId ? { ...message, read: true } : message
        ),
      }))
    );

    setToastMessage('Mesaj okundu olarak işaretlendi.');
  };

  const deleteMessage = async (messageId) => {
    if (!messageId) return;

    const { error } = await supabase.from('club_messages').delete().eq('id', messageId);
    if (error) {
      console.error('Supabase message delete failed:', error);
      alert('Mesaj silinemedi.');
      return;
    }

    setClubs((prev) =>
      prev.map((club) => ({
        ...club,
        incomingMessages: (club.incomingMessages || []).filter((message) => message.id !== messageId),
      }))
    );

    setToastMessage('Mesaj silindi.');
  };

  const renderSuperAdminPanel = () => (
    <div className="space-y-6">
      <div className="card-surface rounded-3xl p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Süper Admin Paneli</h2>
          <span className="status-pill bg-violet-500/15 text-violet-300">Platform Sahibi</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['statistics', 'clubs', 'newClub'].map((tab) => (
            <button
              key={tab}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${superAdminTab === tab ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-300'}`}
              onClick={() => setSuperAdminTab(tab)}
            >
              {tab === 'statistics' ? 'İstatistikler' : tab === 'clubs' ? 'Kulüp Listesi' : 'Yeni Kulüp Kaydet'}
            </button>
          ))}
        </div>
      </div>

      {superAdminTab === 'statistics' && (
        <div className="card-surface rounded-3xl p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['Kulüp Sayısı', clubs.length],
              ['Toplam Öğrenci', clubs.reduce((total, club) => total + club.students.length, 0)],
              ['Toplam Branş', clubs.reduce((total, club) => total + club.branches.length, 0)],
              ['Bekleyen Başvuru', clubs.reduce((total, club) => total + club.pendingApplications.length, 0)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                <div className="text-sm text-slate-400">{label}</div>
                <div className="mt-2 text-2xl font-bold text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {superAdminTab === 'clubs' && (
        <>
          <div className="card-surface rounded-3xl p-6">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h3 className="text-xl font-semibold text-white">Tüm Kulüpler ve Veliler / Öğrenciler</h3>
              <div className="max-w-md flex-1">
                <input
                  className="input-shell w-full"
                  placeholder="Kulüp ara..."
                  value={clubListSearch}
                  onChange={(e) => setClubListSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1">Toplam kulüp: {clubs.length}</span>
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1">Toplam öğrenci: {clubs.reduce((total, club) => total + (club.students ?? []).length, 0)}</span>
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1">Toplam veli: {clubs.reduce((total, club) => total + new Set((club.students ?? []).map((student) => `${student.parentName || ''}|${normalizeWhatsappNumber(student.parentPhone || '')}`).filter(Boolean)).size, 0)}</span>
            </div>

            <div className="space-y-3">
              {filteredClubs.length ? (
                filteredClubs.map((club) => {
                  const isExpanded = expandedClubId === club.id;
                  const warning = getSubscriptionWarning(club);
                  const remainingDays = Number.isFinite(new Date(club.subscription.endDate).getTime())
                    ? Math.ceil((new Date(club.subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : 0;
                  const uniqueParents = Array.from(
                    new Map(
                      ((club.students ?? [])
                        .filter((student) => student.parentName || student.parentPhone)
                        .map((student) => {
                          const parentKey = `${String(student.parentName || '').trim()}|${normalizeWhatsappNumber(student.parentPhone || '')}`;
                          return [parentKey, {
                            name: student.parentName || 'Veli',
                            phone: student.parentPhone || '',
                            students: [student],
                          }];
                        }))
                    ).values()
                  );

                  return (
                    <div key={club.id} className="rounded-2xl border border-slate-700 bg-slate-900/80">
                      <button
                        type="button"
                        className="flex w-full flex-col gap-2 px-4 py-3 text-left md:flex-row md:items-center md:justify-between"
                        onClick={() => setExpandedClubId(isExpanded ? null : club.id)}
                      >
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-white">{club.name}</div>
                          <div className="text-xs text-slate-400">{club.managerName || 'Yönetici bilgisi yok'} • {club.students?.length ?? 0} öğrenci</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`status-pill ${club.suspended ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                            {club.suspended ? 'Askıda' : 'Aktif'}
                          </span>
                          <span className="rounded-full border border-slate-700 bg-slate-950/80 px-2 py-1 text-[11px] text-slate-300">{club.subscription.packageMonths || 0} ay</span>
                          <span className="text-sm text-violet-300">{isExpanded ? 'Kapat' : 'Ayrıntılar'}</span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-slate-700 bg-slate-950/60 p-4">
                          <div className="grid gap-4 lg:grid-cols-[1.2fr_1.5fr]">
                            <div className="space-y-2 text-sm text-slate-300">
                              <div className="flex items-center justify-between gap-2"><span>Yönetici</span><strong className="text-white">{club.managerName || '—'}</strong></div>
                              <div className="flex items-center justify-between gap-2"><span>İletişim</span><strong className="text-white">{club.phone || '—'}</strong></div>
                              <div className="flex items-center justify-between gap-2"><span>WhatsApp</span><strong className="text-white">{club.whatsappNumber ? formatWhatsappDisplay(club.whatsappNumber) : '—'}</strong></div>
                              <div className="flex items-center justify-between gap-2"><span>Abonelik</span><strong className="text-white">{club.subscription.packageMonths || 0} ay</strong></div>
                              <div className="flex items-center justify-between gap-2"><span>Bitiş</span><strong className="text-white">{formatShortDate(club.subscription.endDate)}</strong></div>
                            </div>

                            <div className="space-y-3">
                              <div className={`rounded-xl border px-3 py-2 text-xs font-medium ${warning.tone === 'red' ? 'border-red-500/40 bg-red-500/10 text-red-200' : warning.tone === 'yellow' ? 'border-amber-500/40 bg-amber-500/10 text-amber-200' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'}`}>
                                Abonelik Durumu: {warning.label} • {remainingDays > 0 ? `${remainingDays} gün kaldı` : 'Süre doldu'}
                              </div>

                              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                <select
                                  className="input-shell"
                                  value={subscriptionExtensionValues[club.id]?.months ?? club.subscription?.packageMonths ?? 12}
                                  onChange={(e) =>
                                    setSubscriptionExtensionValues((prev) => ({
                                      ...prev,
                                      [club.id]: { ...(prev[club.id] ?? {}), months: Number(e.target.value) },
                                    }))
                                  }
                                >
                                  {packageOptions.map((option) => (
                                    <option key={option} value={option}>{option} Ay</option>
                                  ))}
                                </select>
                                <input
                                  className="input-shell w-32"
                                  type="number"
                                  min="0"
                                  placeholder="Ücret"
                                  value={subscriptionExtensionValues[club.id]?.amount ?? 0}
                                  onChange={(e) =>
                                    setSubscriptionExtensionValues((prev) => ({
                                      ...prev,
                                      [club.id]: { ...(prev[club.id] ?? {}), amount: Number(e.target.value) },
                                    }))
                                  }
                                />
                                <button
                                  className="primary-btn"
                                  onClick={() => handleExtendSubscription(club.id, subscriptionExtensionValues[club.id]?.months ?? club.subscription?.packageMonths ?? 12, subscriptionExtensionValues[club.id]?.amount ?? 0)}
                                >
                                  Aboneliği Uzat
                                </button>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button className="primary-btn" onClick={() => handleToggleClubStatus(club.id)}>
                                  {club.suspended ? 'Hesabı Aktive Et' : 'Hesabı Askıya Al'}
                                </button>
                                <button
                                  className="secondary-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSuperAdminDetailClubId(club.id);
                                  }}
                                >
                                  Veliler / Öğrenciler
                                </button>
                                <button
                                  className="secondary-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setManagerPasswordReset({ open: true, clubId: club.id, newPassword: '' });
                                  }}
                                >
                                  Şifre Yenile
                                </button>
                                <button
                                  className="bg-red-600/20 border border-red-500/40 text-red-200 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-red-600/30"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClub(club.id);
                                  }}
                                >
                                  Kulübü Sil
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">Arama kriterlerine uygun kulüp bulunamadı.</div>
              )}
            </div>
          </div>

          {superAdminDetailClubId && (() => {
            const detailClub = clubs.find((club) => club.id === superAdminDetailClubId) ?? null;
            if (!detailClub) return null;

            const parentEntries = Array.from(
              new Map(
                ((detailClub.students ?? [])
                  .filter((student) => student.parentName || student.parentPhone)
                  .map((student) => {
                    const parentKey = `${String(student.parentName || '').trim()}|${normalizeWhatsappNumber(student.parentPhone || '')}`;
                    return [parentKey, {
                      name: student.parentName || 'Veli',
                      phone: student.parentPhone || '',
                      students: [student],
                    }];
                  }))
              ).values()
            );

            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
                <div className="card-surface max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-700">
                  <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Kulüp detayları</p>
                      <h3 className="text-2xl font-bold text-white">{detailClub.name}</h3>
                    </div>
                    <button className="text-2xl text-slate-300 hover:text-white" onClick={() => setSuperAdminDetailClubId(null)}>×</button>
                  </div>

                  <div className="max-h-[70vh] overflow-y-auto p-5">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-lg font-semibold text-white">Veliler</h4>
                          <span className="rounded-full border border-slate-700 bg-slate-950/80 px-2 py-1 text-xs text-slate-300">{parentEntries.length}</span>
                        </div>
                        <div className="space-y-3">
                          {parentEntries.length ? (
                            parentEntries.map((parent, index) => (
                              <div key={`${parent.name}-${index}`} className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                                <div className="font-medium text-white">{parent.name}</div>
                                <div className="mt-1 text-xs text-slate-400">{parent.phone ? formatWhatsappDisplay(parent.phone) : 'Telefon yok'}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {(detailClub.students ?? [])
                                    .filter((student) => (student.parentName || '').trim().toLowerCase() === parent.name.trim().toLowerCase() || normalizeWhatsappNumber(student.parentPhone || '') === normalizeWhatsappNumber(parent.phone || ''))
                                    .map((student, studentIndex) => (
                                      <span key={`${student.id || student.name}-${studentIndex}`} className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-200">
                                        {student.name || student.full_name || student.studentName || 'Öğrenci'}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">Bu kulübe ait veli kaydı yok.</div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-lg font-semibold text-white">Öğrenciler</h4>
                          <span className="rounded-full border border-slate-700 bg-slate-950/80 px-2 py-1 text-xs text-slate-300">{detailClub.students?.length ?? 0}</span>
                        </div>
                        <div className="space-y-3">
                          {(detailClub.students ?? []).length ? (
                            (detailClub.students ?? []).map((student) => (
                              <div key={student.id || `${student.name}-${student.parentPhone}`} className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="font-medium text-white">{student.name || student.full_name || student.studentName || 'Öğrenci'}</div>
                                    <div className="text-xs text-slate-400">Veli: {student.parentName || 'Belirtilmemiş'}</div>
                                  </div>
                                  <span className={`status-pill ${student.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-300'}`}>
                                    {student.status || 'active'}
                                  </span>
                                </div>
                                <div className="mt-2 text-xs text-slate-400">{student.parentPhone ? formatWhatsappDisplay(student.parentPhone) : 'Telefon yok'}</div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">Bu kulübe ait öğrenci kaydı yok.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {superAdminTab === 'newClub' && (
        <div className="card-surface rounded-3xl p-6">
          <h3 className="mb-4 text-xl font-semibold text-white">Yeni Kulüp Kaydet</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <input className="input-shell" placeholder="Kulüp Adı" value={newClub.clubName} onChange={(e) => setNewClub({ ...newClub, clubName: e.target.value })} />
            <input className="input-shell" placeholder="Yönetici Adı Soyadı" value={newClub.managerName} onChange={(e) => setNewClub({ ...newClub, managerName: e.target.value, username: generateUsername(e.target.value) })} />
            <input className="input-shell" placeholder="İletişim Bilgileri" value={newClub.contact} onChange={(e) => setNewClub({ ...newClub, contact: e.target.value })} />
            <input className="input-shell" placeholder="Kulüp WhatsApp Numarası" value={newClub.whatsappNumber ? formatWhatsappDisplay(newClub.whatsappNumber) : ''} onChange={(e) => setNewClub({ ...newClub, whatsappNumber: normalizeWhatsappNumber(e.target.value) })} />
            <input className="input-shell" placeholder="Sistem Giriş Kullanıcı Adı" value={newClub.username} onChange={(e) => setNewClub({ ...newClub, username: generateUsername(e.target.value) })} />
            <input className="input-shell" type="password" placeholder="Şifre" value={newClub.password} onChange={(e) => setNewClub({ ...newClub, password: e.target.value })} />
            <input className="input-shell md:col-span-2" placeholder="Adres" value={newClub.address} onChange={(e) => setNewClub({ ...newClub, address: e.target.value })} />
            <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
              <select className="input-shell" value={newClub.packageMonths} onChange={(e) => setNewClub({ ...newClub, packageMonths: Number(e.target.value) })}>
                {packageOptions.map((option) => (
                  <option key={option} value={option}>{option} Aylık</option>
                ))}
              </select>
              <input className="input-shell" type="number" min="0" placeholder="Abonelik Ücreti (TL)" value={newClub.subscriptionFee} onChange={(e) => setNewClub({ ...newClub, subscriptionFee: e.target.value })} />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button className="primary-btn" onClick={handleSuperAdminCreateClub}>Kulüp Oluştur</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderClubManagerPanel = () => {
    const managerStudents = ogrenciler.length ? ogrenciler : (currentClub?.students ?? []);
    const availableManagerBranches = currentClub?.branches ?? [];
    const branchStudents = managerSelectedBranchId ? managerStudents.filter((student) => getStudentBranchIds(student).includes(managerSelectedBranchId)) : [];
    const selectedManagerStudent = branchStudents.find((student) => student.id === managerSelectedStudentId) ?? branchStudents[0] ?? null;
    const managerCoaches = users.filter((user) => {
      const roleValue = String(user?.role ?? '').trim().toLowerCase();
      return user.clubId === currentClub?.id && (roleValue === 'coach' || roleValue === 'antrenör' || roleValue === 'trainer');
    });
    const getCoachBranchName = (coach) => {
      if (!coach) return 'Belirtilmemiş';
      const branchId = coach?.branchId ?? coach?.branch_id ?? null;
      const directBranchName = String(coach?.branchName || coach?.branch_name || '').trim();
      const clubBranches = currentClub?.branches ?? [];
      const resolvedBranch = clubBranches.find((branch) => branch.id === branchId) ?? null;
      const matchedByName = directBranchName
        ? clubBranches.find((branch) => String(branch.name ?? '').trim().toLowerCase() === directBranchName.toLowerCase()) ?? null
        : null;
      const fallbackBranch = resolvedBranch ?? matchedByName ?? clubBranches[0] ?? null;
      return directBranchName || fallbackBranch?.name || (clubBranches.length ? clubBranches[0].name : 'Belirtilmemiş');
    };

    return (
      <div className="space-y-6">
        <div className="card-surface rounded-3xl p-3 sm:p-4">
          <div className="flex flex-wrap gap-2">
            {['info', 'branches', 'coaches', 'pending', 'students', 'payments', 'messages', 'announcements'].map((tab) => (
              <button
                key={tab}
                className={`rounded-xl px-3 py-2 text-xs font-semibold sm:text-sm ${managerTab === tab ? 'bg-gradient-to-r from-violet-600 to-orange-500 text-white' : 'bg-slate-950/80 text-slate-300'}`}
                onClick={() => setManagerTab(tab)}
              >
                {tab === 'info' ? 'Kulüp Bilgileri' : tab === 'branches' ? 'Branşlar' : tab === 'coaches' ? 'Antrenörler' : tab === 'pending' ? 'Bekleyenler' : tab === 'students' ? 'Öğrenciler' : tab === 'payments' ? 'Ödemeler' : tab === 'messages' ? 'Gelen Mesajlar' : 'Duyurular'}
              </button>
            ))}
          </div>
        </div>

        {managerTab === 'info' && (
          <div className="space-y-6">
            <div className="card-surface rounded-3xl p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-400">Kulüp</p>
                  <h2 className="text-2xl font-bold text-white">{currentClub?.name}</h2>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                  <div className="text-sm text-slate-400">Online Kayıt Linki</div>
                  <div className="mt-2 break-all text-sm text-violet-300">
                    {buildPublicClubLink(currentClub?.id)}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                  <div className="text-sm text-slate-400">Kulüp İletişim</div>
                  <div className="mt-2 text-sm text-white">{currentClub?.phone} • {currentClub?.address}</div>
                  <div className="mt-2 text-sm text-emerald-300">WhatsApp: {currentClub?.whatsappNumber ? formatWhatsappDisplay(currentClub.whatsappNumber) : 'Henüz tanımlanmadı'}</div>
                </div>
              </div>
            </div>

            <div className="card-surface rounded-3xl p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-white">Online Kayıt Formu</h3>
                <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200">Önizleme</span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="input-shell"
                  placeholder="Öğrenci Adı Soyadı"
                  value={applicationForm.studentName}
                  onChange={(e) => setApplicationForm({ ...applicationForm, studentName: toTurkishUpper(e.target.value) })}
                />
                <input className="input-shell" type="date" value={applicationForm.birthDate} onChange={(e) => setApplicationForm({ ...applicationForm, birthDate: e.target.value })} />
                <select
                  className="input-shell"
                  value={applicationForm.branchId || ''}
                  onChange={(e) => setApplicationForm({ ...applicationForm, branchId: e.target.value })}
                  style={{ color: applicationForm.branchId ? '#f8fafc' : '#94a3b8' }}
                >
                  <option value="" disabled>Branş Seçiniz</option>
                  {(currentClub?.branches ?? []).map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
                <input
                  className="input-shell"
                  placeholder="Veli Adı Soyadı"
                  value={applicationForm.parentName}
                  onChange={(e) => setApplicationForm({ ...applicationForm, parentName: toTurkishUpper(e.target.value) })}
                />
                <input className="input-shell" placeholder="Veli Telefon" value={applicationForm.parentPhone} onChange={(e) => setApplicationForm({ ...applicationForm, parentPhone: e.target.value })} />
                <div className="input-shell flex items-center text-slate-300 md:col-span-2">
                  {generateUsername(applicationForm.parentName || '') || 'VELİ KULLANICI ADI OTOMATİK OLUŞACAK'}
                </div>
                <div className="relative md:col-span-2">
                  <input className="input-shell w-full pr-12" type={showParentPassword ? 'text' : 'password'} placeholder="Veli Şifresi" value={applicationForm.parentPassword} onChange={(e) => setApplicationForm({ ...applicationForm, parentPassword: e.target.value })} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-300" onClick={() => setShowParentPassword((prev) => !prev)}>
                    {showParentPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
                  <input type="checkbox" checked={applicationForm.acceptKvkk} onChange={(e) => setApplicationForm({ ...applicationForm, acceptKvkk: e.target.checked })} />
                  <button type="button" className="text-left text-violet-300 underline decoration-violet-500/60 underline-offset-2" onClick={() => setShowKvkkModal(true)}>KVKK Aydınlatma Metni</button>
                  <span>ve veri kullanımını okudum ve onaylıyorum.</span>
                </label>
                <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm text-slate-300">
                  <input type="checkbox" checked={applicationForm.acceptPolicy} onChange={(e) => setApplicationForm({ ...applicationForm, acceptPolicy: e.target.checked })} />
                  Sağlık raporu / muvafakatname dosyası yüklemeyi kabul ediyorum.
                </label>
              </div>

              <textarea
            className="input-shell mt-5 min-h-28"
            placeholder="Not ekleyebilirsiniz"
            value={applicationForm.notes}
            onChange={(e) => setApplicationForm({ ...applicationForm, notes: toTurkishUpper(e.target.value) })}
          />

              <div className="mt-5 flex justify-end">
                <button
                  className="primary-btn"
                  onClick={async () => {
                    if (!applicationForm.acceptKvkk || !applicationForm.acceptPolicy) {
                      alert('KVKK ve muvafakat onayı gereklidir.');
                      return;
                    }

                    if (!applicationForm.branchId) {
                      alert('Lütfen bir branş seçiniz.');
                      return;
                    }

                    const generatedUsername = generateUsername(applicationForm.parentName || '');
                    const parentPassword = (applicationForm.parentPassword || '').trim();
                    if (!parentPassword) {
                      alert('Veli şifresi mutlaka girilmelidir.');
                      return;
                    }

                    const finalUsername = generatedUsername || normalizeWhatsappNumber(applicationForm.parentPhone) || `VELI-${Date.now()}`;
                    const payload = {
                      studentName: applicationForm.studentName.trim(),
                      studentSurname: '',
                      branchId: applicationForm.branchId,
                      parentName: applicationForm.parentName,
                      parentPhone: applicationForm.parentPhone,
                      parentPassword,
                      username: finalUsername,
                      files: ['sağlık_raporu.pdf'],
                      status: 'pending',
                    };

                    const dbResult = await persistApplicationToSupabase({
                      ...payload,
                      clubId: currentClub?.id,
                    });

                    if (!dbResult.ok) {
                      console.error('Supabase manager application insert failed.', dbResult.error);
                      if (dbResult.duplicate) {
                        const duplicateMessage = 'Bu öğrenci veya veli bu kulüpte zaten kayıtlı!';
                        setToastMessage(duplicateMessage);
                        alert(duplicateMessage);
                        return;
                      }
                      alert('Online kayıt veritabanına gönderilemedi.');
                      return;
                    }

                    const insertedApplication = (dbResult.data && dbResult.data[0]) || {
                      id: `app-${Date.now()}`,
                      ...payload,
                      clubId: currentClub?.id,
                      status: 'pending',
                      createdAt: new Date().toISOString(),
                    };

                    setClubs((prev) =>
                      prev.map((club) =>
                        club.id === currentClub?.id
                          ? {
                              ...club,
                              pendingApplications: [insertedApplication, ...(club.pendingApplications ?? [])],
                            }
                          : club
                      )
                    );

                    await loadClubs();
                    setApplicationForm(defaultForm);
                    setToastMessage('Kayıt başarıyla alındı!');
                  }}
                >
                  Başvuruyu Gönder
                </button>
              </div>
            </div>
          </div>
        )}

        {managerTab === 'branches' && (
          <div className="card-surface rounded-3xl p-4 sm:p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">Branş ve Antrenör Yönetimi</h3>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-[1.3fr_0.8fr_auto]">
                <input className="input-shell" placeholder="Yeni branş adı" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} />
                <input className="input-shell" type="number" min="0" placeholder="Aylık ücret" value={branchForm.fee} onChange={(e) => setBranchForm({ ...branchForm, fee: e.target.value })} />
                <button className="primary-btn w-full sm:w-auto" onClick={handleAddBranch}>Ekle</button>
              </div>

              <div className="space-y-3">
                {currentClub?.branches.map((branch) => (
                  <div key={branch.id} className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-white">{branch.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{branch.coachIds?.length ?? 0} antrenör</span>
                        <button
                          type="button"
                          className="rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-200 transition hover:bg-red-500/20"
                          onClick={() => handleDeleteBranch(branch.id)}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        className="input-shell flex-1"
                        type="number"
                        min="0"
                        value={branchEditValues[branch.id] ?? String(branch.fee ?? '')}
                        onChange={(e) => setBranchFeeValue(branch.id, e.target.value)}
                      />
                      <button className="secondary-btn w-full sm:w-auto" onClick={() => saveBranchFee(branch.id)}>
                        Kaydet
                      </button>
                    </div>
                    <div className="mt-2 text-sm text-slate-200">
                      Aylık ücret: <span className="font-semibold text-orange-300">{Number(branch.fee || 0).toLocaleString('tr-TR')} ₺</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <h4 className="text-base font-semibold text-white">Antrenör Tanımla</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <input className="input-shell" placeholder="Ad Soyad" value={coachForm.name} onChange={(e) => setCoachForm({ ...coachForm, name: e.target.value, username: generateUsername(e.target.value) })} />
                <input className="input-shell" placeholder="İletişim" value={coachForm.phone} onChange={(e) => setCoachForm({ ...coachForm, phone: e.target.value })} />
                <select className="input-shell" value={coachForm.branchId} onChange={(e) => setCoachForm({ ...coachForm, branchId: e.target.value })}>
                  {currentClub?.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
                <div className="input-shell flex items-center text-slate-300">{coachForm.username || 'KULLANICI ADI OTOMATİK OLUŞACAK'}</div>
                <div className="relative md:col-span-2">
                  <input className="input-shell w-full pr-12" type={showCoachPassword ? 'text' : 'password'} placeholder="Şifre" value={coachForm.password} onChange={(e) => setCoachForm({ ...coachForm, password: e.target.value })} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-300" onClick={() => setShowCoachPassword((prev) => !prev)}>
                    {showCoachPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button className="primary-btn w-full sm:w-auto" onClick={handleAddCoach}>Antrenör Kaydet</button>
            </div>
          </div>
        )}

        {managerTab === 'coaches' && (
          <div className="card-surface rounded-3xl p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-white">Antrenörler</h3>
              <span className="rounded-full border border-slate-700 bg-slate-950/80 px-2 py-1 text-xs text-slate-300">{managerCoaches.length} kayıt</span>
            </div>

            {managerCoaches.length ? (
              <div className="grid gap-3">
                {managerCoaches.map((coach) => {
                  const coachBranch = currentClub?.branches?.find((branch) => branch.id === (coach.branchId ?? coach.branch_id ?? null));
                  const coachBranchName = getCoachBranchName(coach) || coachBranch?.name || 'Belirtilmemiş';
                  const isCoachActive = coach.isActive !== false;

                  return (
                    <div key={coach.id} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-lg font-semibold text-white">{coach.name}</div>
                          <div className="text-xs text-slate-400">{coach.username || 'kullaniciadi'}</div>
                        </div>
                        <span className={`status-pill ${isCoachActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-300'}`}>
                          {isCoachActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>

                      <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-200">
                        Branş: <span className="font-semibold text-violet-300">{coachBranchName}</span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={isCoachActive ? 'secondary-btn' : 'primary-btn'}
                          onClick={async () => {
                            const nextStatus = !isCoachActive;
                            setUsers((prev) => prev.map((user) => user.id === coach.id ? { ...user, isActive: nextStatus } : user));

                            try {
                              const { error } = await supabase
                                .from('club_coaches')
                                .update({ is_active: nextStatus })
                                .eq('club_id', currentClub?.id)
                                .eq('username', coach.username || coach.name);

                              if (error) throw error;

                              await supabase
                                .from('profiles')
                                .update({ is_active: nextStatus })
                                .eq('club_id', currentClub?.id)
                                .eq('role', 'coach')
                                .eq('username', coach.username || coach.name);

                              setToastMessage(`Antrenör durumu ${nextStatus ? 'aktif' : 'pasif'} olarak güncellendi.`);
                            } catch (error) {
                              console.error('Coach status update failed:', error);
                              alert('Antrenör durumu güncellenemedi.');
                            }
                          }}
                        >
                          {isCoachActive ? 'Pasifleştir' : 'Aktifleştir'}
                        </button>

                        <button
                          type="button"
                          className="bg-red-600/20 border border-red-500/40 text-red-200 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-red-600/30"
                          onClick={async () => {
                            const confirmed = window.confirm(`${coach.name} antrenörünü silmek istediğinize emin misiniz?`);
                            if (!confirmed) return;

                            try {
                              const { error: coachDeleteError } = await supabase
                                .from('club_coaches')
                                .delete()
                                .eq('club_id', currentClub?.id)
                                .eq('username', coach.username || coach.name);

                              if (coachDeleteError) throw coachDeleteError;

                              const { error: profileDeleteError } = await supabase
                                .from('profiles')
                                .delete()
                                .eq('club_id', currentClub?.id)
                                .eq('role', 'coach')
                                .eq('username', coach.username || coach.name);

                              if (profileDeleteError) throw profileDeleteError;

                              setUsers((prev) => prev.filter((user) => user.id !== coach.id));
                              setClubs((prev) => prev.map((club) => (
                                club.id === currentClub?.id
                                  ? {
                                      ...club,
                                      branches: (club.branches ?? []).map((branch) =>
                                        branch.id === coach.branchId
                                          ? { ...branch, coachIds: (branch.coachIds ?? []).filter((item) => item !== coach.id) }
                                          : branch
                                      ),
                                    }
                                  : club
                              )));
                              setToastMessage('Antrenör silindi.');
                            } catch (error) {
                              console.error('Coach delete failed:', error);
                              alert('Antrenör silinemedi.');
                            }
                          }}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                Bu kulüpte kayıtlı antrenör bulunmuyor.
              </div>
            )}
          </div>
        )}

        {managerTab === 'pending' && (
          <div className="card-surface rounded-3xl p-4 sm:p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">Bekleyen Başvurular</h3>
            <div className="space-y-3">
              {bekleyenler.length ? (
                bekleyenler.map((application) => (
                  <div key={String(application.id)} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="font-semibold text-white">{application.studentName}</h4>
                        <p className="text-xs text-slate-400">{application.parentName} • {application.parentPhone}</p>
                      </div>
                      <span className="status-pill bg-amber-500/15 text-amber-300">Bekliyor</span>
                    </div>
                    <div className="mt-3 text-sm text-slate-300">Branş: {currentClub.branches.find((b) => b.id === application.branchId)?.name}</div>
                    <button className="primary-btn mt-4 w-full sm:w-auto" onClick={() => {
                      console.log('Onay butonuna tıklandı:', application.id);
                      handleApproveApplication(application);
                    }}>Onayla</button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">Bekleyen başvuru bulunmuyor.</div>
              )}
            </div>
          </div>
        )}

        {managerTab === 'students' && (
          <div className="card-surface rounded-3xl p-4 sm:p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">Öğrenci Takibi</h3>
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Branş</label>
                <select className="input-shell w-full" value={managerSelectedBranchId} onChange={(e) => { setManagerSelectedBranchId(e.target.value); setManagerSelectedStudentId(''); }}>
                  <option value="">Branş seçin</option>
                  {availableManagerBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Öğrenci</label>
                <select className="input-shell w-full" value={managerSelectedStudentId} onChange={(e) => setManagerSelectedStudentId(e.target.value)} disabled={!managerSelectedBranchId}>
                  <option value="">Öğrenci seçin</option>
                  {branchStudents.map((student) => (
                    <option key={student.id} value={student.id}>{student.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {!managerSelectedBranchId || !selectedManagerStudent ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">Önce bir branş seçin, ardından öğrenciyi seçin.</div>
            ) : (
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold text-white">{selectedManagerStudent.name}</div>
                    <div className="text-xs text-slate-400">{selectedManagerStudent.parentName}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button className="secondary-btn" onClick={() => { setSelectedStudentDetail(selectedManagerStudent); setShowStudentDetailModal(true); }}>Detay</button>
                    <div className="flex flex-wrap items-center gap-2">
                      <select className="input-shell min-w-[140px]" value={studentBranchAddValue} onChange={(e) => setStudentBranchAddValue(e.target.value)}>
                        <option value="">Branş ekle</option>
                        {availableManagerBranches.filter((branch) => !getStudentBranchIds(selectedManagerStudent).includes(branch.id)).map((branch) => (
                          <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                      </select>
                      <button
                        className="secondary-btn"
                        onClick={() => {
                          if (!studentBranchAddValue) return;
                          handleAssignStudentToBranch(selectedManagerStudent.id, studentBranchAddValue);
                        }}
                        disabled={!studentBranchAddValue}
                      >
                        Onayla / Ekle
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  <div className="flex justify-end">
                    <button
                      className="secondary-btn"
                      onClick={() => {
                        setAttendanceCalendar({ studentId: selectedManagerStudent.id, month: new Date().toISOString().slice(0, 7) });
                        setShowAttendanceSummaryModal(true);
                      }}
                    >
                      📅 Aylık Özet
                    </button>
                  </div>

                  {getStudentBranchIds(selectedManagerStudent).map((branchId) => {
                    const branch = currentClub?.branches.find((item) => item.id === branchId);
                    const branchStatus = getStudentBranchStatus(selectedManagerStudent, branchId);
                    const attendance = selectedManagerStudent.attendance ?? [];
                    const recentAttendances = attendance.slice(-5).reverse();
                    const presentCount = attendance.filter((item) => item.status === 'present').length;
                    const absentCount = attendance.filter((item) => item.status === 'absent').length;

                    return (
                      <div key={`${selectedManagerStudent.id}-${branchId}`} className="rounded-xl border border-slate-700 bg-slate-950/80 p-3">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-white">{branch?.name ?? 'Branş'}</span>
                          <span className={`status-pill ${branchStatus === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
                            {branchStatus === 'active' ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>

                        <div className="mb-3 grid gap-2 sm:grid-cols-2">
                          <select className="input-shell" value={branchStatus === 'active' ? 'active' : 'passive'} onChange={(e) => handleStudentStatusToggle(selectedManagerStudent.id, branchId, e.target.value === 'active' ? 'active' : 'passive')}>
                            <option value="active">Aktif</option>
                            <option value="passive">Pasif</option>
                          </select>
                          <button type="button" className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-left text-xs text-slate-300" onClick={() => setAttendanceCalendar({ studentId: selectedManagerStudent.id, month: attendanceCalendar.month })}>
                            Katılım: <span className="text-white">{presentCount}</span> / Devamsızlık: <span className="text-red-300">{absentCount}</span>
                          </button>
                        </div>

                        <div className="mb-3 flex justify-end">
                          <button className="secondary-btn" onClick={() => openWhatsAppWithMessage(selectedManagerStudent.parentPhone || '', buildAttendanceWarningWhatsAppMessage(selectedManagerStudent.name, branch?.name ?? 'Branş', currentClub?.name || 'Kulübümüz'))}>WhatsApp ile Gönder</button>
                        </div>

                        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-2">
                          <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">Son 5 antrenman</div>
                          <div className="flex flex-wrap gap-2">
                            {recentAttendances.length ? (
                              recentAttendances.map((item, index) => (
                                <span key={`${selectedManagerStudent.id}-${branchId}-${index}`} className={`rounded-full px-2 py-1 text-[10px] ${item.status === 'present' ? 'bg-emerald-500/15 text-emerald-300' : item.status === 'absent' ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'}`}>
                                  {item.date ? new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) : 'Tarih'} • {item.status === 'present' ? 'Katıldı' : item.status === 'absent' ? 'Devamsız' : 'Mazeret'}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">Henüz antrenman kaydı yok.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {managerTab === 'payments' && (
          <div className="card-surface rounded-3xl p-4 sm:p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">Aidat ve Ödeme Takibi</h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-700">
              <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-slate-300">
                  <tr>
                    <th className="px-3 py-3 font-medium">Öğrenci</th>
                    <th className="px-3 py-3 font-medium">Branş</th>
                    <th className="px-3 py-3 font-medium">Durum</th>
                    <th className="px-3 py-3 font-medium">Tutar</th>
                    <th className="px-3 py-3 font-medium">Vade Tarihi</th>
                    <th className="px-3 py-3 font-medium">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                  {(currentClub?.students || []).flatMap((student) => {
                    const studentRows = getStudentPaymentRows(currentClub, student);
                    if (!studentRows.length) return [];

                    return studentRows.map((paymentRow) => {
                      const isPaid = paymentRow.status === 'Ödendi';
                      const statusText = isPaid ? 'Ödendi' : 'Gecikti / Ödenmedi';

                      return (
                        <tr key={`${student.id}-${paymentRow.branchId}`}>
                          <td className="px-3 py-3 text-white">{student.name}</td>
                          <td className="px-3 py-3">{paymentRow.branchName}</td>
                          <td className="px-3 py-3">
                            <select
                              className="input-shell min-w-[150px]"
                              value={paymentRow.status}
                              onChange={(e) => handlePaymentStatusChange(student.id, paymentRow.branchId, e.target.value)}
                            >
                              <option value="Ödendi">Ödendi</option>
                              <option value="Ödenmedi">Gecikti / Ödenmedi</option>
                            </select>
                          </td>
                          <td className="px-3 py-3 text-white">{Number(paymentRow.amount || 0).toLocaleString('tr-TR')} ₺</td>
                          <td className="px-3 py-3">{formatShortDate(paymentRow.dueDate)}</td>
                          <td className="px-3 py-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <span className={`status-pill ${isPaid ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
                                {statusText}
                              </span>
                              {!isPaid && (
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <button
                                    className="secondary-btn"
                                    onClick={() =>
                                      openWhatsAppWithMessage(
                                        student.parentPhone || currentClub?.whatsappNumber || '',
                                        buildPaymentReminderWhatsAppMessage(student.name, paymentRow.amount, currentClub?.name || 'Kulübümüz')
                                      )
                                    }
                                  >
                                    WhatsApp Hatırlat
                                  </button>
                                  <button
                                    className="secondary-btn"
                                    onClick={() => sendPaymentReminderNotification(student, paymentRow.amount, paymentRow.branchName)}
                                  >
                                    Uygulama İçi Bildir
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {managerTab === 'messages' && (
          <div className="card-surface rounded-3xl p-4 sm:p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">Gelen Mesajlar</h3>
            <div className="space-y-3">
              {(currentClub?.incomingMessages || []).length ? (
                currentClub.incomingMessages.map((message) => (
                  <div key={message.id} className={`rounded-2xl border p-4 ${message.read ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-700 bg-slate-900/80'}`}>
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold text-white">{message.senderName}</div>
                        <div className="text-xs text-violet-300">{message.senderRole}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{new Date(message.sentAt).toLocaleString('tr-TR')}</span>
                        {message.read && <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-300">Okundu</span>}
                      </div>
                    </div>
                    {(message.studentName || message.studentId) && (
                      <div className="mb-2 text-xs text-slate-300">
                        Öğrenci: <span className="font-medium text-white">{message.studentName || 'Belirtilmemiş'}</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{message.message}</div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        className={`rounded-xl px-3 py-2 text-sm font-medium ${message.read ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'bg-violet-600 text-white hover:bg-violet-500'}`}
                        onClick={() => markMessageAsRead(message.id)}
                      >
                        Okundu Olarak İşaretle
                      </button>
                      <button
                        className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200 hover:bg-red-500/20"
                        onClick={() => deleteMessage(message.id)}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                  Henüz yöneticiye gönderilen mesaj bulunmuyor.
                </div>
              )}
            </div>
          </div>
        )}

        {managerTab === 'announcements' && (
          <div className="card-surface rounded-3xl p-4 sm:p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">Toplu Duyuru / Bildirim</h3>
            <div className="space-y-3">
              <select className="input-shell" value={announcementForm.target} onChange={(e) => setAnnouncementForm({ ...announcementForm, target: e.target.value })}>
                {announcementTargets.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <input className="input-shell" placeholder="Bildirim türü" value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
              <textarea className="input-shell min-h-28" placeholder="Mesaj içeriği" value={announcementForm.message} onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })} />
              <div className="flex flex-col gap-3 sm:flex-row">
                <button className="primary-btn w-full sm:w-auto" onClick={handleSendAnnouncement}>Bildirimi Gönder</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  function CoachPanel({
    currentUser,
    users,
    clubs,
    currentClub,
    activeDisplayUser,
    selectedClubId,
    profilePassword,
    setProfilePassword,
    handlePasswordUpdate,
    handleAttendanceUpdate,
    sendManagerMessage,
    coachTab,
    setCoachTab,
    coachViewClubId,
    setCoachViewCoachId,
    coachMessageText,
    setCoachMessageText,
    getClubById,
    getStudentBranchIds,
  }) {
    const coachAuthorizedClubIds = useMemo(() => {
      if (!currentUser || currentUser.role !== 'coach') return [];

      const seedIds = [currentUser.clubId, ...users
        .filter((user) => user.role === 'coach')
        .filter((user) => {
          const sameId = user.id === currentUser.id;
          const sameUsername = !!currentUser.username && !!user.username && String(user.username).trim().toUpperCase() === String(currentUser.username).trim().toUpperCase();
          const sameName = !!currentUser.name && !!user.name && String(user.name).trim().toUpperCase() === String(currentUser.name).trim().toUpperCase();
          const sameEmail = !!currentUser.email && !!user.email && String(user.email).trim().toUpperCase() === String(currentUser.email).trim().toUpperCase();
          return sameId || sameUsername || sameName || sameEmail;
        })
        .map((user) => user.clubId)
        .filter(Boolean)]
        .filter(Boolean);

      return [...new Set(seedIds)];
    }, [currentUser, users]);

    const coachClubOptions = useMemo(() => {
      if (!coachAuthorizedClubIds.length) return clubs;
      return clubs.filter((club) => coachAuthorizedClubIds.includes(club.id));
    }, [clubs, coachAuthorizedClubIds]);

    const effectiveCoachClubId = coachViewClubId && coachClubOptions.some((club) => club.id === coachViewClubId)
      ? coachViewClubId
      : (coachClubOptions[0]?.id ?? currentUser?.clubId ?? selectedClubId ?? clubs[0]?.id ?? '');

    const coachClub = coachClubOptions.find((club) => club.id === effectiveCoachClubId)
      ?? clubs.find((club) => club.id === currentUser?.clubId)
      ?? currentClub
      ?? clubs[0]
      ?? null;

    const coachListForClub = users.filter((user) => user.role === 'coach' && user.clubId === coachClub?.id);
    const selectedCoach = coachListForClub.find((user) => user.id === selectedCoachId)
      ?? coachListForClub.find((user) => user.id === currentUser?.id)
      ?? null;

    const validBranchIds = new Set((coachClub?.branches ?? []).map((branch) => branch.id));
    const selectedCoachBranchId = (selectedCoach?.branchId && validBranchIds.has(selectedCoach.branchId))
      ? selectedCoach.branchId
      : (selectedCoach?.branch_id && validBranchIds.has(selectedCoach.branch_id))
        ? selectedCoach.branch_id
        : (selectedCoach?.branchName && coachClub?.branches?.find((branch) => String(branch.name).trim().toLowerCase() === String(selectedCoach.branchName).trim().toLowerCase())?.id)
          ? coachClub.branches.find((branch) => String(branch.name).trim().toLowerCase() === String(selectedCoach.branchName).trim().toLowerCase())?.id
          : '';
    const selectedCoachBranch = coachClub?.branches?.find((branch) => branch.id === selectedCoachBranchId) ?? null;
    const coachStudents = coachClub?.students.filter((student) => getStudentBranchIds(student).includes(selectedCoachBranchId)) ?? [];
    const clubNameForCoach = coachClub?.name || getClubById(currentUser?.clubId)?.name || 'Kulüp';
    const branchName = String(selectedCoach?.branchName || selectedCoach?.branch_name || selectedCoachBranch?.name || 'Branş').trim() || 'Branş';
    const coachDisplayName = `${selectedCoach?.name || activeDisplayUser?.name || currentUser?.name || 'Antrenör'} - ${clubNameForCoach} (${branchName})`;
    const todayIso = new Date().toISOString().slice(0, 10);
    const presentCount = coachStudents.filter((student) => (student.attendance ?? []).some((entry) => entry.date === todayIso && entry.status === 'present')).length;
    const pendingCount = coachStudents.length - presentCount;
    const coachTabs = [
      { key: 'attendance', label: 'Yoklama' },
      { key: 'messages', label: 'Mesaj' },
      { key: 'profile', label: 'Profil' },
    ];

    return (
      <div className="space-y-6">
        <div className="card-surface rounded-3xl p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-400">Antrenör</p>
              <h2 className="text-2xl font-bold text-white">{coachDisplayName}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-xl border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-sm text-violet-200">{branchName}</div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200">{coachStudents.length} öğrenci</div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Kulüp Seç</span>
              <select
                className="input-shell"
                value={effectiveCoachClubId}
                onChange={(event) => {
                  const nextClubId = event.target.value;
                  setCoachViewClubId(nextClubId);
                  setSelectedCoachId('');
                  setCoachViewCoachId('');
                }}
              >
                <option value="">Kulüp Seç</option>
                {coachClubOptions.map((club) => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Antrenör Seç</span>
              <select
                className="input-shell"
                value={selectedCoachId || ''}
                onChange={(event) => {
                  const nextCoachId = event.target.value;
                  setSelectedCoachId(nextCoachId);
                  setCoachViewCoachId(nextCoachId);
                }}
                disabled={!effectiveCoachClubId || coachListForClub.length === 0}
              >
                <option value="">Antrenör Seç</option>
                {coachListForClub.map((coachUser) => (
                  <option key={coachUser.id} value={coachUser.id}>{coachUser.name}</option>
                ))}
              </select>
            </label>
          </div>

          {!effectiveCoachClubId && (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-400">Kulüp seçimi yaparak ilgili antrenör ve öğrenci verilerini görüntüleyebilirsiniz.</div>
          )}

          {effectiveCoachClubId && !coachListForClub.length && (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-4 text-sm text-amber-300">Seçilen kulüpte kayıtlı antrenör bulunmuyor.</div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Bugün</div>
              <div className="mt-2 text-2xl font-bold text-white">{presentCount}</div>
              <div className="text-sm text-emerald-300">Katıldı</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Bekleyen</div>
              <div className="mt-2 text-2xl font-bold text-white">{pendingCount}</div>
              <div className="text-sm text-amber-300">İşaretlenmedi</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 sm:col-span-2 xl:col-span-1">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Durum</div>
              <div className="mt-2 text-lg font-semibold text-white">Branş Takibi</div>
              <div className="text-sm text-violet-300">{branchName} aktif</div>
            </div>
          </div>
        </div>

        <div className="card-surface rounded-3xl p-3">
          <div className="flex flex-wrap gap-2">
            {coachTabs.map((tab) => (
              <button
                key={tab.key}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${coachTab === tab.key ? 'bg-gradient-to-r from-violet-600 to-orange-500 text-white' : 'bg-slate-950/80 text-slate-300'}`}
                onClick={() => setCoachTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {coachTab === 'attendance' && (
          <div className="card-surface rounded-3xl p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-white">Yoklama Listesi</h3>
              <button className="secondary-btn" onClick={() => coachStudents.forEach((student) => handleAttendanceUpdate(student.id, 'present'))}>Tümünü Katıldı</button>
            </div>

            {coachStudents.length === 0 ? (
              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-sm text-slate-400">Bu branş için atanmış öğrenci bulunmuyor.</div>
            ) : (
              <div className="space-y-3">
                {coachStudents.map((student) => {
                  const todayStatus = (student.attendance ?? []).find((entry) => entry.date === todayIso)?.status ?? 'pending';
                  const todayLabel = todayStatus === 'present' ? 'Katıldı' : todayStatus === 'absent' ? 'Katılmadı' : todayStatus === 'excused' ? 'İzinli' : 'Henüz işaretlenmedi';

                  return (
                    <div key={student.id} className="flex flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="font-semibold text-white">{student.name}</div>
                        <div className="text-xs text-slate-400">{student.parentName}</div>
                        <div className="mt-1 text-[11px] text-violet-200">Bugün: {todayLabel}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded-xl bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-300" onClick={() => handleAttendanceUpdate(student.id, 'present')}>Katıldı</button>
                        <button className="rounded-xl bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-300" onClick={() => handleAttendanceUpdate(student.id, 'absent')}>Katılmadı</button>
                        <button className="rounded-xl bg-amber-500/15 px-3 py-2 text-sm font-semibold text-amber-300" onClick={() => handleAttendanceUpdate(student.id, 'excused')}>İzinli</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {coachTab === 'messages' && (
          <div className="card-surface rounded-3xl p-5">
            <h3 className="mb-4 text-xl font-semibold text-white">Yöneticiye Mesaj Gönder</h3>
            <textarea
              className="input-shell min-h-36"
              placeholder="Mesajınızı yazın..."
              value={coachMessageText}
              onChange={(e) => setCoachMessageText(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <button
                className="primary-btn w-full sm:w-auto"
                onClick={() => {
                  const content = coachMessageText.trim();
                  if (!content) {
                    alert('Mesaj içeriği boş olamaz.');
                    return;
                  }
                  sendManagerMessage(currentUser?.name || 'Antrenör', 'Antrenör', content);
                  setCoachMessageText('');
                }}
              >
                Mesaj Gönder
              </button>
            </div>
          </div>
        )}

        {coachTab === 'profile' && (
          <div className="card-surface rounded-3xl p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">Profil / Şifre Ayarları</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input-shell" type="password" placeholder="Yeni Şifre" value={profilePassword.newPassword} onChange={(e) => setProfilePassword({ ...profilePassword, newPassword: e.target.value })} />
              <input className="input-shell" type="password" placeholder="Şifre Onayı" value={profilePassword.confirmPassword} onChange={(e) => setProfilePassword({ ...profilePassword, confirmPassword: e.target.value })} />
            </div>
            <div className="mt-4 flex justify-end">
              <button className="primary-btn" onClick={handlePasswordUpdate}>Şifreyi Güncelle</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const renderAttendanceSummaryModal = () => {
    const summaryStudent = currentClub?.students.find((student) => student.id === attendanceCalendar.studentId) ?? currentClub?.students[0] ?? null;
    const monthKey = attendanceCalendar.month || new Date().toISOString().slice(0, 7);
    const monthCells = getCalendarMonthCells(monthKey);
    const monthDate = new Date(`${monthKey}-01T00:00:00`);
    const monthLabel = monthDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    const attendanceByDate = {};

    (summaryStudent?.attendance || []).forEach((entry) => {
      if (!entry?.date) return;
      attendanceByDate[entry.date] = entry.status;
    });

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
        <div className="card-surface w-full max-w-3xl overflow-hidden rounded-[28px] border border-slate-700">
          <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
            <div>
              <h3 className="text-xl font-bold text-white">Aylık Katılım Özeti</h3>
              <p className="text-sm text-slate-400">{summaryStudent?.name || 'Öğrenci seçilmedi'} • {monthLabel}</p>
            </div>
            <button type="button" className="text-xl text-slate-300 hover:text-white" onClick={() => setShowAttendanceSummaryModal(false)}>×</button>
          </div>

          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <select
                className="input-shell"
                value={monthKey}
                onChange={(e) => setAttendanceCalendar((prev) => ({ ...prev, month: e.target.value }))}
              >
                {Array.from({ length: 12 }, (_, index) => {
                  const date = new Date(new Date().getFullYear(), index, 1);
                  const value = date.toISOString().slice(0, 7);
                  return (
                    <option key={value} value={value}>{date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</option>
                  );
                })}
              </select>
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-200">
                <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-emerald-300">Katıldı</span>
                <span className="rounded-full bg-red-500/15 px-2 py-1 text-red-300">Katılmadı</span>
                <span className="rounded-full bg-amber-500/15 px-2 py-1 text-amber-300">İzinli</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-[11px] text-slate-400">
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
                <div key={day} className="py-2">{day}</div>
              ))}

              {monthCells.map((cell, index) => {
                if (!cell) {
                  return <div key={`empty-${index}`} className="h-12 rounded-xl border border-slate-800 bg-slate-900/30" />;
                }

                const dateKey = cell.toISOString().slice(0, 10);
                const status = attendanceByDate[dateKey];
                const statusClasses = {
                  present: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
                  absent: 'bg-red-500/20 text-red-200 border-red-500/40',
                  excused: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
                };

                return (
                  <div key={dateKey} className={`flex h-12 items-center justify-center rounded-xl border border-slate-700 text-xs ${status ? statusClasses[status] || 'bg-slate-900/80 text-slate-300' : 'bg-slate-900/80 text-slate-400'}`}>
                    {cell.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderParentPanel = () => {
    const childStudent = currentClub?.students.find((student) => student.id === currentUser?.childStudentId) ?? currentClub?.students[0];
    const parentNotifications = (currentClub?.notifications || []).filter((notification) => {
      const studentMatches = !notification.studentId || notification.studentId === childStudent?.id;
      const phoneMatches = !notification.parentPhone || !childStudent?.parentPhone || normalizeWhatsappNumber(notification.parentPhone) === normalizeWhatsappNumber(childStudent.parentPhone);
      return studentMatches && phoneMatches;
    });

    const tabs = [
      { key: 'attendance', label: 'Devamsızlık Geçmişi' },
      { key: 'payments', label: 'Ödeme / Taksit Durumu' },
      { key: 'communication', label: 'İletişim / Duyurular' },
    ];

    return (
      <div className="space-y-6">
        <div className="card-surface rounded-3xl p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-400">Veli / Üye</p>
              <h2 className="text-2xl font-bold text-white">{activeDisplayUser?.name || childStudent?.parentName || 'Veli'}</h2>
            </div>
            <div className="rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-200">Kullanıcı: {activeDisplayUser?.username || currentUser?.username || 'veli'}</div>
          </div>
        </div>

        <div className="card-surface rounded-3xl p-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${parentTab === tab.key ? 'bg-gradient-to-r from-violet-600 to-orange-500 text-white' : 'bg-slate-950/80 text-slate-300'}`}
                onClick={() => setParentTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {parentTab === 'attendance' && (
          <div className="card-surface rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-white">Devamsızlık Geçmişi</h3>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  const nextStudentId = childStudent?.id ?? null;
                  setAttendanceCalendar({ studentId: nextStudentId, month: new Date().toISOString().slice(0, 7) });
                  setShowAttendanceSummaryModal(true);
                }}
              >
                📅
              </button>
            </div>
            <div className="space-y-3">
              {childStudent?.attendance?.length ? (
                childStudent.attendance.map((item, idx) => (
                  <div key={`${item.date}-${idx}`} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/80 p-3">
                    <span className="text-white">{item.date}</span>
                    <span className={`status-pill ${item.status === 'present' ? 'bg-emerald-500/15 text-emerald-300' : item.status === 'absent' ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'}`}>
                      {item.status === 'present' ? 'Katıldı' : item.status === 'absent' ? 'Yok' : 'İzinli'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-slate-400">Devamsızlık kaydı yok.</div>
              )}
            </div>
          </div>
        )}

        {parentTab === 'payments' && (
          <div className="card-surface rounded-3xl p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">Ödeme / Taksit Durumu</h3>
            <div className="space-y-3">
              {currentClub?.payments.filter((pay) => pay.studentId === childStudent?.id).map((pay) => {
                const scheduleItem = currentClub?.paymentSchedule?.find((item) => item.month === pay.month);
                const dueDateText = scheduleItem?.due ? `Son Ödeme: ${formatShortDate(scheduleItem.due)}` : `Dönem: ${pay.month}`;

                return (
                  <div key={pay.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900/80 p-3">
                    <div className="min-w-0">
                      <div className="font-medium text-white">{pay.month}</div>
                      <div className="mt-1 text-xs text-slate-400">{dueDateText}</div>
                      <div className="mt-1 text-xs text-slate-400">{Number(pay.amount || 0).toLocaleString('tr-TR')} ₺</div>
                    </div>
                    <span className={`status-pill ${pay.status === 'Ödendi' ? 'bg-emerald-500/15 text-emerald-300' : pay.status === 'Gecikti' ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'}`}>
                      {pay.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {parentTab === 'communication' && (
          <div className="space-y-6">
            <div className="card-surface rounded-3xl p-6">
              <h3 className="mb-4 text-xl font-semibold text-white">Bildirim Merkezi</h3>
              <div className="space-y-3">
                {parentNotifications.length ? (
                  parentNotifications.map((notification) => (
                    <div key={notification.id} className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="text-xs uppercase tracking-[0.2em] text-amber-200">Ödeme Hatırlatması</span>
                        <span className="text-[11px] text-slate-300">{new Date(notification.createdAt).toLocaleString('tr-TR')}</span>
                      </div>
                      <div className="text-sm leading-6 text-slate-100">{notification.text}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                    Görüntülenecek bildirim yok.
                  </div>
                )}
              </div>
            </div>

            <div className="card-surface rounded-3xl p-6">
              <h3 className="mb-4 text-xl font-semibold text-white">Yöneticiye Mesaj Gönder</h3>
              <textarea
                className="input-shell min-h-28"
                placeholder="Mesajınızı yazın..."
                value={parentMessageText}
                onChange={(e) => setParentMessageText(e.target.value)}
              />
              <div className="mt-4 flex justify-end">
                <button
                  className="primary-btn"
                  onClick={() => {
                    const content = parentMessageText.trim();
                    if (!content) {
                      alert('Mesaj içeriği boş olamaz.');
                      return;
                    }
                    sendManagerMessage(currentUser?.name || 'Veli', 'Veli', content, {
                      studentId: childStudent?.id,
                      studentName: childStudent?.name || childStudent?.full_name || 'Öğrenci',
                    });
                    setParentMessageText('');
                  }}
                >
                  Mesaj Gönder
                </button>
              </div>
            </div>

            <div className="card-surface rounded-3xl p-6">
              <h3 className="mb-4 text-xl font-semibold text-white">Duyurular</h3>
              <div className="space-y-3">
                {(currentClub?.announcements || []).length ? (
                  currentClub.announcements.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-white">{item.title}</div>
                          <div className="text-xs text-slate-400">{item.target}</div>
                        </div>
                        <span className="status-pill bg-violet-500/15 text-violet-300">Duyuru</span>
                      </div>
                      <div className="text-sm leading-6 text-slate-200">{item.message}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400">Görüntülenecek duyuru yok.</div>
                )}
              </div>
            </div>

            <div className="card-surface rounded-3xl p-6">
              <h3 className="mb-4 text-xl font-semibold text-white">Profil / Şifre Ayarları</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input className="input-shell" type="password" placeholder="Yeni Şifre" value={profilePassword.newPassword} onChange={(e) => setProfilePassword({ ...profilePassword, newPassword: e.target.value })} />
                <input className="input-shell" type="password" placeholder="Şifre Onayı" value={profilePassword.confirmPassword} onChange={(e) => setProfilePassword({ ...profilePassword, confirmPassword: e.target.value })} />
              </div>
              <div className="mt-4 flex justify-end">
                <button className="primary-btn" onClick={handlePasswordUpdate}>Şifreyi Güncelle</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBlockedAccessScreen = () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-xl rounded-[28px] border border-red-500/30 bg-slate-900/80 p-8 text-center shadow-glow">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-3xl">⚠️</div>
        <h2 className="text-2xl font-bold text-white">Abonelik süreniz dolmuştur / Hesabınız askıya alınmıştır</h2>
        <p className="mt-3 text-slate-300">Sistem yöneticisi tarafından kulüp hesabınız pasifleştirildi. Lütfen iletişime geçin veya yeni abonelik başlatın.</p>
        <button className="primary-btn mt-6" onClick={handleLogout}>Çıkış Yap</button>
      </div>
    </div>
  );

  const openWhatsAppWithMessage = (number, text) => {
    const sanitized = normalizeWhatsappNumber(number);
    if (!sanitized) {
      alert('Velinin WhatsApp numarası tanımlı değil.');
      return;
    }
    window.open(buildWhatsAppLink(sanitized, text), '_blank', 'noopener,noreferrer');
  };

  const handleLogin = async () => {
    const username = document.getElementById('login-input')?.value ?? '';
    const password = document.getElementById('password-input')?.value ?? '';
    const cleanedUsername = String(username ?? '').trim();
    const enteredPassword = String(password ?? '').trim();

    const matchesLoginIdentity = (row, usernameValue) => {
      const candidateUsername = String(row?.username ?? '').trim();
      const candidateEmail = String(row?.email ?? '').trim();
      const candidateName = String(row?.manager_name ?? row?.full_name ?? row?.name ?? '').trim();

      return (
        normalizeAuthText(candidateUsername) === normalizeAuthText(usernameValue) ||
        normalizeAuthText(candidateEmail) === normalizeAuthText(usernameValue) ||
        normalizeAuthText(candidateName) === normalizeAuthText(usernameValue) ||
        candidateUsername.toUpperCase() === usernameValue.toUpperCase() ||
        candidateEmail.toUpperCase() === usernameValue.toUpperCase() ||
        candidateName.toUpperCase() === usernameValue.toUpperCase()
      );
    };

    const applyAuthenticatedUser = (userRecord, fallbackRole = 'parent') => {
      const mappedUser = {
        id: userRecord.id,
        name: userRecord.manager_name || userRecord.full_name || userRecord.name || cleanedUsername,
        username: userRecord.username || cleanedUsername,
        password: userRecord.password || enteredPassword,
        role: userRecord.role || fallbackRole,
        clubId: userRecord.club_id || userRecord.id || null,
        phone: userRecord.phone || '',
        email: userRecord.email || '',
        isActive: userRecord.is_active !== false,
      };

      setCurrentUser(mappedUser);
      setActiveRole(mappedUser.role);
      const nextClubId = mappedUser.clubId || clubs[0]?.id;
      if (nextClubId) setSelectedClubId(nextClubId);
      return mappedUser;
    };

    if (supabase && supabase.from) {
      const { data: clubData, error: clubError } = await supabase.from('clubs').select('*');
      console.log('1. Clubs tablosu arama sonucu:', clubData, clubError);

      if (!clubError && Array.isArray(clubData) && clubData.length > 0) {
        const clubMatch = clubData.find((row) => {
          const storedPassword = String(row.password ?? '').trim();
          const matchesIdentity = matchesLoginIdentity(row, cleanedUsername);
          return storedPassword === enteredPassword && matchesIdentity;
        });

        console.log('Clubs tablosunda eşleşen kullanıcı:', clubMatch);

        if (clubMatch) {
          const mappedUser = applyAuthenticatedUser({
            ...clubMatch,
            role: clubMatch.role || 'club-manager',
            club_id: clubMatch.id,
          }, 'club-manager');
          console.log('Clubs tablosu eşleşmesi ile giriş yapıldı:', mappedUser);
          return;
        }
      }

      const { data: profileData, error: profileError } = await supabase.from('profiles').select('*');
      console.log('2. Profiles tablosu arama sonucu:', profileData, profileError);

      if (!profileError && Array.isArray(profileData) && profileData.length > 0) {
        const profileMatch = profileData.find((row) => {
          const storedPassword = String(row.password ?? '').trim();
          const matchesIdentity = matchesLoginIdentity(row, cleanedUsername);
          return storedPassword === enteredPassword && matchesIdentity;
        });

        console.log('Profiles tablosunda eşleşen kullanıcı:', profileMatch);

        if (profileMatch) {
          const mappedUser = applyAuthenticatedUser({
            ...profileMatch,
            role: profileMatch.role || 'parent',
            club_id: profileMatch.club_id || null,
          }, profileMatch.role || 'parent');
          console.log('Profiles tablosu eşleşmesi ile giriş yapıldı:', mappedUser);
          return;
        }
      }
    }

    const localMatchingUser = findMatchingUser(cleanedUsername, enteredPassword);
    if (localMatchingUser) {
      console.log('Yerel eşleşme bulundu:', localMatchingUser);
      setCurrentUser(localMatchingUser);
      setActiveRole(localMatchingUser.role);
      const nextClubId = localMatchingUser.clubId || clubs[0]?.id;
      if (nextClubId) setSelectedClubId(nextClubId);
      return;
    }

    console.log('Giriş başarısız. Aranan kullanıcı:', cleanedUsername);
    alert('Giriş bilgileri hatalı. Kullanıcı adı ve şifreyi kontrol edin.');
  };

  const renderLoginScreen = () => (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900/80 shadow-glow lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-8 md:p-12">
            <div className="inline-flex items-center rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">SportHub</div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-5xl">Spor Kulüpleri ve Okulları Yönetim Sistemi</h1>
            <p className="mt-4 max-w-xl text-base text-slate-300">Kulüp yönetimi, antrenör yoklaması, veli takibi, ödeme planlaması ve güvenli kayıt akışı tek ekranda.</p>
          </div>

          <div className="border-t border-slate-800 bg-slate-950/80 p-6 md:p-8 lg:border-l lg:border-t-0">
            <div className="mb-6">
              <p className="text-sm text-slate-400">Giriş paneli</p>
              <h2 className="text-3xl font-bold text-white">Merhaba</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <input
                  className="input-shell"
                  placeholder="Kullanıcı adı / e-posta"
                  defaultValue=""
                  id="login-input"
                />
                <input
                  className="input-shell"
                  type="password"
                  placeholder="Şifre"
                  defaultValue=""
                  id="password-input"
                />
                <button
                  className="primary-btn w-full"
                  onClick={handleLogin}
                >
                  Giriş Yap
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (!showStudentDetailModal || !selectedStudentDetail) return;

    setStudentDetailForm({
      studentId: selectedStudentDetail.id ?? '',
      name: selectedStudentDetail.name ?? '',
      parentName: selectedStudentDetail.parentName ?? '',
      parentPhone: selectedStudentDetail.parentPhone ?? '',
      startedAt: selectedStudentDetail.startedAt ?? selectedStudentDetail.enrollmentDate ?? '',
    });
  }, [showStudentDetailModal, selectedStudentDetail]);

  const handleSaveStudentDetail = () => {
    const nextName = studentDetailForm.name.trim();
    const nextParentName = studentDetailForm.parentName.trim();
    const nextParentPhone = normalizeWhatsappNumber(studentDetailForm.parentPhone);
    const nextStartedAt = studentDetailForm.startedAt || '';

    setClubs((prev) =>
      prev.map((club) => {
        if (club.id !== selectedClubId) return club;

        return {
          ...club,
          students: club.students.map((student) =>
            student.id === studentDetailForm.studentId
              ? {
                  ...student,
                  name: nextName || student.name,
                  parentName: nextParentName || student.parentName,
                  parentPhone: nextParentPhone || student.parentPhone,
                  startedAt: nextStartedAt || student.startedAt || '',
                }
              : student
          ),
        };
      })
    );

    setUsers((prev) =>
      prev.map((user) => {
        if (user.clubId !== selectedClubId) return user;
        const matchesStudent = user.childStudentId === studentDetailForm.studentId;
        if (!matchesStudent) return user;

        return {
          ...user,
          name: nextParentName || user.name,
          phone: nextParentPhone || user.phone,
        };
      })
    );

    setSelectedStudentDetail((prev) =>
      prev && prev.id === studentDetailForm.studentId
        ? {
            ...prev,
            name: nextName || prev.name,
            parentName: nextParentName || prev.parentName,
            parentPhone: nextParentPhone || prev.parentPhone,
            startedAt: nextStartedAt || prev.startedAt || '',
          }
        : prev
    );

    setShowStudentDetailModal(false);
    setToastMessage('Öğrenci detay bilgileri kaydedildi.');
  };

  const renderStudentDetailModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="card-surface w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <h3 className="text-xl font-bold text-white">Öğrenci Detay Bilgileri</h3>
          <button className="text-xl text-slate-300 hover:text-white" onClick={() => setShowStudentDetailModal(false)}>×</button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span>Öğrenci Adı Soyadı</span>
              <input
                className="input-shell"
                value={studentDetailForm.name}
                onChange={(e) => setStudentDetailForm({ ...studentDetailForm, name: e.target.value })}
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span>Kursa Başlama Tarihi</span>
              <input
                type="date"
                className="input-shell"
                value={studentDetailForm.startedAt}
                onChange={(e) => setStudentDetailForm({ ...studentDetailForm, startedAt: e.target.value })}
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
              <span>Veli Adı Soyadı</span>
              <input
                className="input-shell"
                value={studentDetailForm.parentName}
                onChange={(e) => setStudentDetailForm({ ...studentDetailForm, parentName: e.target.value })}
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
              <span>Veli İletişim / Telefon Numarası</span>
              <input
                className="input-shell"
                value={studentDetailForm.parentPhone}
                onChange={(e) => setStudentDetailForm({ ...studentDetailForm, parentPhone: e.target.value })}
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button className="secondary-btn" onClick={() => setShowStudentDetailModal(false)}>İptal</button>
            <button className="primary-btn" onClick={handleSaveStudentDetail}>Kaydet</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderKvkkModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="card-surface w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <h3 className="text-xl font-bold text-white">KVKK Aydınlatma Metni ve Gizlilik Politikası</h3>
          <button className="text-xl text-slate-300 hover:text-white" onClick={() => setShowKvkkModal(false)}>×</button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5 text-sm leading-7 text-slate-300">
          <p className="mb-3"><strong className="text-white">Veri Sorumlusu:</strong> Spor Kulübü Yönetim Sistemi ve ilgili kulüp yöneticileri, kişisel verilerin işlenmesinden sorumludur.</p>
          <p className="mb-3"><strong className="text-white">İşlenen Kişisel Veriler:</strong> Öğrenci adı-soyadı, doğum tarihi, veli bilgileri, iletişim numarası, branş bilgisi, sağlık raporu / muvafakatname dosyası, ödeme bilgileri ve kullanım kayıtları.</p>
          <p className="mb-3"><strong className="text-white">Amaç:</strong> Kayıt, öğrenci takibi, devamsızlık/öğrenim takibi, iletişim, ödeme yönetimi, güvenlik ve mevzuat uyumluluğu için kişisel veriler işlenir.</p>
          <p className="mb-3"><strong className="text-white">Aktarım:</strong> Veriler yalnızca kulüp yönetimi, antrenörler ve gerekli operasyon ekipleri ile sınırlı şekilde paylaşılır; üçüncü taraflarla ticari amaçlı paylaşılmaz.</p>
          <p className="mb-3"><strong className="text-white">Saklama:</strong> Kişisel veriler, yasal süreç ve sistem gereklilikleri doğrultusunda güvenli şekilde saklanır ve gerektiğinde silme/geri çekme hakları korunur.</p>
          <p className="mb-3"><strong className="text-white">Haklar:</strong> Kişisel verilerinizin işlenmesine ilişkin bilgilendirme, erişim, düzeltme, silme, işleme itiraz, aktarım ve otomatik karar sistemlerine itiraz haklarınız vardır.</p>
          <p>Bu metni okudum, anladım ve bilgilerin bu amaçlarla işlenmesini onaylıyorum.</p>

          <div className="mt-6 flex justify-end">
            <button className="primary-btn" onClick={() => setShowKvkkModal(false)}>Okudum, Anladım</button>
          </div>
        </div>
      </div>
    </div>
  );

  const persistClubToSupabase = async (club) => {
    const record = {
      name: String(club?.name || '').trim(),
      manager_name: String(club?.managerName || '').trim(),
      phone: String(club?.phone || '').trim() || null,
      whatsapp_number: String(club?.whatsappNumber || '').trim() || null,
      address: String(club?.address || '').trim() || null,
      username: String(club?.username || '').trim() || null,
      password: String(club?.password || '').trim() || null,
      suspended: Boolean(club?.suspended),
      subscription: club?.subscription ?? null,
      created_at: new Date().toISOString(),
    };

    if (!record.name) {
      return { ok: false, error: new Error('Kulüp adı boş olamaz.') };
    }

    return insertIntoSupabase('clubs', [record]);
  };

  const persistProfileToSupabase = async ({ clubId, role, fullName, username, password, phone, isActive = true, branchId = null, branchName = '' }) => {
    const safeBranchId = normalizeDbBranchId(branchId);
    const safeBranchName = String(branchName || '').trim();
    const record = {
      club_id: normalizeDbClubId(clubId),
      role: String(role || 'parent').trim(),
      full_name: String(fullName || '').trim(),
      username: String(username || '').trim() || null,
      password: String(password || '').trim() || null,
      email: `${String(username || fullName || 'user').trim().toLowerCase().replace(/\s+/g, '.')}@local.invalid`,
      phone: String(phone || '').trim() || null,
      is_active: Boolean(isActive),
      ...(safeBranchId ? { branch_id: safeBranchId } : {}),
      ...(safeBranchName ? { branch_name: safeBranchName } : {}),
      created_at: new Date().toISOString(),
    };

    if (!record.full_name || !record.club_id) {
      return { ok: false, error: new Error('Profil kaydı için gerekli alanlar eksik.') };
    }

    return insertIntoSupabase('profiles', [record]);
  };

  const persistBranchToSupabase = async (branch) => {
    const candidateClubId = branch?.clubId || selectedClubId || currentUser?.clubId || clubs[0]?.id;
    const matchingClub = (clubs ?? []).find((club) => club.id === candidateClubId) ?? null;
    const resolvedClubId = normalizeDbClubId(candidateClubId) || normalizeDbClubId(matchingClub?.id);

    const record = {
      club_id: resolvedClubId,
      name: String(branch?.name || '').trim(),
      monthly_fee: Number(branch?.monthlyFee ?? branch?.fee ?? 0),
      created_at: new Date().toISOString(),
    };

    console.group('Supabase branch insert debug');
    console.log('branch input payload:', branch);
    console.log('candidateClubId:', candidateClubId);
    console.log('matchingClub:', matchingClub);
    console.log('resolvedClubId:', resolvedClubId);
    console.log('branch record payload:', record);
    console.groupEnd();

    if (!record.club_id || !record.name) {
      const details = {
        candidateClubId,
        selectedClubId,
        currentUserClubId: currentUser?.clubId,
        clubs: clubs.map((club) => ({ id: club.id, name: club.name, dbIdValid: Boolean(normalizeDbClubId(club.id)) })),
        record,
      };
      console.error('Invalid branch insert payload:', details);
      return { ok: false, error: new Error('Branş için geçerli bir kulüp ID si ve isim gerekli.') };
    }

    return insertIntoSupabase('club_branches', [record]);
  };

  const persistCoachToSupabase = async ({ clubId, name, username, password, phone, branchId }) => {
    const record = {
      club_id: normalizeDbClubId(clubId || selectedClubId),
      name: String(name || '').trim(),
      username: String(username || '').trim(),
      password: String(password || '').trim(),
      phone: String(phone || '').trim() || null,
      branch_id: normalizeDbBranchId(branchId),
      is_active: true,
      created_at: new Date().toISOString(),
    };

    if (!record.club_id || !record.name || !record.username) {
      return { ok: false, error: new Error('Antrenör için gerekli alanlar eksik.') };
    }

    return insertIntoSupabase('club_coaches', [record]);
  };

  const persistApplicationToSupabase = async (payload) => {
    const clubId = normalizeDbClubId(payload.clubId || validPublicFormClubId || publicFormClubId || initialPublicClubId || selectedClubId || currentUser?.clubId || '');
    const record = {
      club_id: clubId,
      student_name: String(payload.studentName || '').trim(),
      student_surname: String(payload.studentSurname || '').trim(),
      parent_name: String(payload.parentName || '').trim(),
      parent_phone: String(payload.parentPhone || '').trim(),
      branch_id: normalizeDbBranchId(payload.branchId),
      status: 'pending',
      notes: String(payload.notes || '').trim() || null,
      files: Array.isArray(payload.files) ? payload.files : ['sağlık_raporu.pdf'],
      created_at: new Date().toISOString(),
    };

    if (!record.club_id || !record.student_name || !record.parent_name || !record.parent_phone) {
      return { ok: false, error: new Error('Eksik kayıt alanları.') };
    }

    const duplicateCheck = await checkDuplicateRegistrationInSupabase({
      clubId: record.club_id,
      studentName: record.student_name,
      parentName: record.parent_name,
      parentPhone: record.parent_phone,
      username: String(payload.username || '').trim(),
    });

    if (!duplicateCheck.ok) {
      return {
        ok: false,
        duplicate: true,
        error: duplicateCheck.error || new Error('Bu öğrenci veya veli bu kulüpte zaten kayıtlı!'),
      };
    }

    return insertIntoSupabase('club_applications', [record]);
  };

  const persistStudentToSupabase = async ({ clubId, name, parentName, parentPhone, branchId, birthDate, startedAt, status = 'active' }) => {
    const record = {
      club_id: normalizeDbClubId(clubId),
      branch_id: normalizeDbBranchId(branchId),
      full_name: String(name || '').trim(),
      birth_date: birthDate || null,
      parent_name: String(parentName || '').trim(),
      parent_phone: String(parentPhone || '').trim(),
      started_at: startedAt || new Date().toISOString().slice(0, 10),
      status,
      branch_ids: Array.isArray(branchId) ? branchId : [branchId].filter(Boolean),
      branch_status: branchId ? { [branchId]: status } : {},
      attendance: [],
      created_at: new Date().toISOString(),
    };

    if (!record.full_name || !record.club_id) {
      return { ok: false, error: new Error('Öğrenci kaydı için gerekli alanlar eksik.') };
    }

    const duplicateCheck = await checkDuplicateRegistrationInSupabase({
      clubId: record.club_id,
      studentName: record.full_name,
      parentName: record.parent_name,
      parentPhone: record.parent_phone,
    });

    if (!duplicateCheck.ok) {
      return {
        ok: false,
        duplicate: true,
        error: duplicateCheck.error || new Error('Bu öğrenci veya veli bu kulüpte zaten kayıtlı!'),
      };
    }

    return insertIntoSupabase('club_students', [record]);
  };

  const persistParentToSupabase = async ({ clubId, name, phone, username, password }) => {
    const enteredPassword = String(password ?? '').trim();
    const generatedUsername = generateUsername(name || username || '') || String(username || '').trim() || `VELI-${Date.now()}`;
    const record = {
      club_id: normalizeDbClubId(clubId),
      role: 'parent',
      full_name: String(name || '').trim(),
      username: String(generatedUsername || '').trim() || null,
      password: enteredPassword || null,
      email: normalizeDbParentEmail(name, clubId),
      phone: String(phone || '').trim() || null,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    if (!record.club_id || !record.full_name) {
      return { ok: false, error: new Error('Veli kaydı için kulüp ve ad gerekli.') };
    }

    if (!record.password) {
      return { ok: false, error: new Error('Veli şifresi boş olamaz; formdaki girilen değer kullanılmalıdır.') };
    }

    return insertIntoSupabase('profiles', [record]);
  };

  const updateApplicationStatusInSupabase = async (applicationRef, status = 'approved') => {
    const resolvedStatus = status || 'approved';
    const applicationId = typeof applicationRef === 'string' ? applicationRef : applicationRef?.id;

    if (!applicationId && (!applicationRef || !applicationRef.clubId)) {
      return { ok: false, error: new Error('Onaylanacak başvurunun kimliği eksik.') };
    }

    if (!supabase || !supabase.from) {
      return { ok: false, error: new Error('Supabase client unavailable') };
    }

    const normalizedAppId = typeof applicationId === 'string' ? applicationId.trim() : '';
    let currentQuery = supabase.from('club_applications').update({ status: resolvedStatus });

    if (isValidUuid(normalizedAppId)) {
      currentQuery = currentQuery.eq('id', normalizedAppId);
    } else if (applicationRef && typeof applicationRef === 'object') {
      const clubId = normalizeDbClubId(applicationRef.clubId);
      const studentName = String(applicationRef.studentName || '').trim();
      const parentName = String(applicationRef.parentName || '').trim();
      const parentPhone = String(applicationRef.parentPhone || '').trim();

      currentQuery = currentQuery
        .eq('club_id', clubId)
        .eq('student_name', studentName)
        .eq('parent_name', parentName)
        .eq('parent_phone', parentPhone)
    } else {
      return { ok: false, error: new Error('Onaylanacak başvuru için güvenli eşleşme bulunamadı.') };
    }

    const { data, error } = await currentQuery.select();

    if (error) {
      console.error('Supabase application status update failed:', error);
      return { ok: false, error };
    }

    if (!data?.length) {
      const fallbackQuery = supabase
        .from('club_applications')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      if (fallbackError) {
        console.error('Supabase application status fallback read failed:', fallbackError);
        return { ok: false, error: fallbackError };
      }

      return { ok: false, error: new Error('Onaylanacak başvuru veritabanında eşleşmedi.') };
    }

    return { ok: true, data: data ?? [] };
  };

  const renderApplicationForm = () => (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="card-surface rounded-[32px] p-6 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Online Kayıt Formu</p>
            <h2 className="text-3xl font-bold text-white">{formClub?.name}</h2>
          </div>
          <div className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">KVKK Onayı Zorunlu</div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <input className="input-shell" placeholder="Kulüp" value={formClub?.name} disabled />
          <input
            className="input-shell"
            placeholder="Öğrenci Adı Soyadı"
            value={applicationForm.studentName}
            onChange={(e) => setApplicationForm({ ...applicationForm, studentName: toTurkishUpper(e.target.value) })}
          />
          <input className="input-shell" type="date" value={applicationForm.birthDate} onChange={(e) => setApplicationForm({ ...applicationForm, birthDate: e.target.value })} />
          <select
            className="input-shell"
            value={applicationForm.branchId || ''}
            onChange={(e) => setApplicationForm({ ...applicationForm, branchId: e.target.value })}
            style={{ color: applicationForm.branchId ? '#f8fafc' : '#94a3b8' }}
          >
            <option value="" disabled>Branş Seçiniz</option>
            {formClub?.branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
          <input
            className="input-shell"
            placeholder="Veli Adı Soyadı"
            value={applicationForm.parentName}
            onChange={(e) => setApplicationForm({ ...applicationForm, parentName: toTurkishUpper(e.target.value) })}
          />
          <div className="input-shell flex items-center text-slate-300">{generateUsername(applicationForm.parentName || '') || 'VELİ KULLANICI ADI OTOMATİK OLUŞACAK'}</div>
          <input className="input-shell" placeholder="Veli Telefon" value={applicationForm.parentPhone} onChange={(e) => setApplicationForm({ ...applicationForm, parentPhone: e.target.value })} />
          <div className="relative">
            <input className="input-shell w-full pr-12" type={showParentPassword ? 'text' : 'password'} placeholder="Veli Şifresi" value={applicationForm.parentPassword} onChange={(e) => setApplicationForm({ ...applicationForm, parentPassword: e.target.value })} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-300" onClick={() => setShowParentPassword((prev) => !prev)}>{showParentPassword ? '🙈' : '👁️'}</button>
          </div>
        </div>

        <div className="mt-5">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
            <input type="checkbox" checked={applicationForm.acceptKvkk} onChange={(e) => setApplicationForm({ ...applicationForm, acceptKvkk: e.target.checked })} />
            <button type="button" className="text-left text-violet-300 underline decoration-violet-500/60 underline-offset-2" onClick={() => setShowKvkkModal(true)}>KVKK Aydınlatma Metni</button>
            <span>ve veri kullanımını okudum ve onaylıyorum.</span>
          </label>
          <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm text-slate-300">
            <input type="checkbox" checked={applicationForm.acceptPolicy} onChange={(e) => setApplicationForm({ ...applicationForm, acceptPolicy: e.target.checked })} />
            Sağlık raporu / muvafakatname dosyası yüklemeyi kabul ediyorum.
          </label>
        </div>

        <textarea className="input-shell mt-5 min-h-28" placeholder="Not ekleyebilirsiniz" value={applicationForm.notes} onChange={(e) => setApplicationForm({ ...applicationForm, notes: e.target.value })} />

        <button
          className="primary-btn mt-6 w-full"
          onClick={async () => {
            if (!applicationForm.acceptKvkk || !applicationForm.acceptPolicy) {
              alert('KVKK ve muvafakat onayı gereklidir.');
              return;
            }

            const generatedUsername = generateUsername(applicationForm.parentName || '');
            const targetClubId = validPublicFormClubId || publicFormClubId || initialPublicClubId || getClubById(selectedClubId)?.id || null;
            const parentPassword = (applicationForm.parentPassword || '').trim();

            if (!targetClubId) {
              alert('Kulüp bilgisi bulunamadı. Lütfen URL üzerinden doğru kayıt formunu açın.');
              return;
            }

            if (!parentPassword) {
              alert('Veli şifresi mutlaka girilmelidir.');
              return;
            }

            if (!applicationForm.branchId) {
              alert('Lütfen bir branş seçiniz.');
              return;
            }

            const finalUsername = generatedUsername || normalizeWhatsappNumber(applicationForm.parentPhone) || `VELI-${Date.now()}`;
            const payload = {
              studentName: applicationForm.studentName.trim(),
              studentSurname: '',
              branchId: applicationForm.branchId,
              parentName: applicationForm.parentName,
              parentPhone: applicationForm.parentPhone,
              parentPassword,
              username: finalUsername,
              files: ['sağlık_raporu.pdf'],
              status: 'pending',
            };

            const dbResult = await persistApplicationToSupabase({
              ...payload,
              clubId: targetClubId,
            });

            if (!dbResult.ok) {
              console.error('Supabase application insert failed.', dbResult.error);
              if (dbResult.duplicate) {
                const duplicateMessage = 'Bu öğrenci veya veli bu kulüpte zaten kayıtlı!';
                setToastMessage(duplicateMessage);
                alert(duplicateMessage);
                return;
              }
              alert('Başvuru kaydı veritabanına aktarılırken hata oluştu. Lütfen tekrar deneyiniz.');
              return;
            }

            await loadClubs();

            const normalizedParentPhone = normalizeWhatsappNumber(applicationForm.parentPhone);
            const parentLoginUsername = generatedUsername || normalizedParentPhone || `VELI-${Date.now()}`;

            setUsers((prev) => {
              const existingParent = prev.find((user) => {
                const sameClub = user.clubId === targetClubId;
                const samePhone = user.phone && normalizedParentPhone && normalizeWhatsappNumber(user.phone) === normalizedParentPhone;
                const sameUsername = user.username?.toUpperCase() === parentLoginUsername.toUpperCase();
                return sameClub && (samePhone || sameUsername || user.name?.toLowerCase() === String(applicationForm.parentName || '').toLowerCase());
              });

              if (existingParent) {
                return prev.map((user) =>
                  user.id === existingParent.id
                    ? {
                        ...user,
                        username: parentLoginUsername,
                        password: parentPassword,
                        phone: normalizedParentPhone || user.phone,
                        isActive: false,
                      }
                    : user
                );
              }

              return [
                ...prev,
                {
                  id: `parent-pending-${Date.now()}`,
                  role: 'parent',
                  name: applicationForm.parentName,
                  username: parentLoginUsername,
                  password: parentPassword,
                  phone: normalizedParentPhone,
                  clubId: targetClubId,
                  isActive: false,
                },
              ];
            });

            setApplicationForm(defaultForm);
            setPublicFormClubId(validPublicFormClubId || targetClubId || null);
            setSelectedClubId(targetClubId);
            setToastMessage('Kayıt başarıyla alındı!');
            alert('Kayıt başarıyla alındı!');
          }}
        >
          Başvuruyu Tamamla
        </button>
      </div>
    </div>
  );

  if (!currentUser) {
    if (forcedPublicClubId || isPublicRegistrationRoute || shouldShowPublicForm) {
      return renderApplicationForm();
    }
    return renderLoginScreen();
  }

  if (forcedPublicClubId) {
    return renderApplicationForm();
  }

  if (isPublicRegistrationRoute) {
    return renderApplicationForm();
  }

  if (shouldShowPublicForm) {
    return renderApplicationForm();
  }

  if (currentUser.role !== 'super-admin' && currentUser.clubId) {
    const targetClub = clubs.find((club) => club.id === currentUser.clubId);
    if (targetClub?.suspended) {
      return renderBlockedAccessScreen();
    }
  }

  const panelRole = isSuperAdminRole(currentUser?.role) ? activeRole : (currentUser?.role ?? activeRole);
  const roleLabelMap = {
    'super-admin': 'Süper Admin',
    'super_admin': 'Süper Admin',
    'club-manager': 'Kulüp Yöneticisi',
    coach: 'Antrenör',
    parent: 'Veli',
  };
  const panelMap = {
    'super-admin': renderSuperAdminPanel(),
    'super_admin': renderSuperAdminPanel(),
    'club-manager': renderClubManagerPanel(),
    coach: (
      <CoachPanel
        currentUser={currentUser}
        users={users}
        clubs={clubs}
        currentClub={currentClub}
        activeDisplayUser={activeDisplayUser}
        selectedClubId={selectedClubId}
        profilePassword={profilePassword}
        setProfilePassword={setProfilePassword}
        handlePasswordUpdate={handlePasswordUpdate}
        handleAttendanceUpdate={handleAttendanceUpdate}
        sendManagerMessage={sendManagerMessage}
        coachTab={coachTab}
        setCoachTab={setCoachTab}
        coachViewClubId={coachViewClubId}
        setCoachViewCoachId={setCoachViewCoachId}
        coachMessageText={coachMessageText}
        setCoachMessageText={setCoachMessageText}
        getClubById={getClubById}
        getStudentBranchIds={getStudentBranchIds}
      />
    ),
    parent: renderParentPanel(),
  };

  return (
    <>
      {showAttendanceSummaryModal && renderAttendanceSummaryModal()}
      {showStudentDetailModal && renderStudentDetailModal()}
      {showKvkkModal && renderKvkkModal()}
      {toastMessage && (
        <div className="fixed right-5 top-5 z-[60] rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-200 shadow-lg shadow-emerald-500/20">
          {toastMessage}
        </div>
      )}
      {managerPasswordReset.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-violet-950/30">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Şifre yenile</p>
                <h3 className="mt-2 text-xl font-bold text-white">
                  {clubs.find((club) => club.id === managerPasswordReset.clubId)?.name || 'Kulüp'}
                </h3>
              </div>
              <button
                type="button"
                className="text-2xl text-slate-300 hover:text-white"
                onClick={() => setManagerPasswordReset({ open: false, clubId: '', newPassword: '' })}
              >
                ×
              </button>
            </div>

            <label className="mb-2 block text-sm text-slate-300">Yeni kulüp yöneticisi şifresi</label>
            <input
              type="password"
              className="input-shell w-full"
              placeholder="Yeni şifre"
              value={managerPasswordReset.newPassword}
              onChange={(e) => setManagerPasswordReset((prev) => ({ ...prev, newPassword: e.target.value }))}
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setManagerPasswordReset({ open: false, clubId: '', newPassword: '' })}
              >
                İptal
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => handleResetClubManagerPassword(managerPasswordReset.clubId, managerPasswordReset.newPassword)}
              >
                Şifreyi Güncelle
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-slate-950 px-4 py-6 text-white">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-violet-300">SPORTHUB</div>
              <h1 className="text-2xl font-bold text-white">{panelRole === 'super-admin' || panelRole === 'super_admin' ? 'Süper Admin' : activeDisplayUser?.name || currentUser?.name}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isSuperAdminRole(currentUser?.role) ? (
                <>
                  {activeRole === 'club-manager' && clubs.length > 0 && (
                    <label className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2">
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Kulüp</span>
                      <select
                        className="input-shell min-w-[220px] border-0 bg-transparent px-0 py-0 text-sm text-white"
                        value={selectedClubId || ''}
                        onChange={(e) => setSelectedClubId(e.target.value)}
                      >
                        {clubs.map((club) => (
                          <option key={club.id} value={club.id}>{club.name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-1">
                    {['super-admin', 'club-manager', 'coach', 'parent'].map((role) => (
                      <button
                        key={role}
                        className={`rounded-xl px-3 py-2 text-sm font-semibold ${activeRole === role ? 'bg-gradient-to-r from-violet-600 to-orange-500 text-white' : 'bg-slate-950/80 text-slate-300'}`}
                        onClick={() => switchRoleView(role)}
                      >
                        {roleLabelMap[role]}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <label className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Kulüp</span>
                  <select
                    className="input-shell min-w-[220px] border-0 bg-transparent px-0 py-0 text-sm text-white opacity-100"
                    value={selectedClubId || currentUser?.clubId || ''}
                    onChange={() => {}}
                    disabled
                  >
                    {clubs
                      .filter((club) => club.id === (currentUser?.clubId || selectedClubId))
                      .map((club) => (
                        <option key={club.id} value={club.id}>{club.name}</option>
                      ))}
                  </select>
                </label>
              )}
              <button className="secondary-btn" onClick={handleLogout}>Çıkış</button>
            </div>
          </header>

          <div className="mt-6">{panelMap[panelRole] ?? panelMap['super-admin']}</div>
        </div>
      </div>
    </>
  );
}

export default AppClean;
