import React, { useEffect, useMemo, useState } from 'react';

const packageOptions = [1, 3, 6, 12];

const initialUsers = [
  {
    id: 'super-admin',
    role: 'super-admin',
    name: 'Süper Admin',
    email: 'sagliksk@gmail.com',
    password: 'Efraim+08',
    clubId: 'platform',
    isActive: true,
  },
  {
    id: 'club-owner-1',
    role: 'club-manager',
    name: 'Murat Yıldız',
    username: 'MURATYILDIZ',
    password: 'club123',
    clubId: 'club-1',
    isActive: true,
  },
  {
    id: 'club-owner-2',
    role: 'club-manager',
    name: 'Elif Demir',
    username: 'ELIFDEMIR',
    password: 'club456',
    clubId: 'club-2',
    isActive: true,
  },
  {
    id: 'coach-1',
    role: 'coach',
    name: 'Emre Korkmaz',
    username: 'EMREKORKMAZ',
    password: 'coach123',
    clubId: 'club-1',
    branchId: 'branch-futbol',
    isActive: true,
  },
  {
    id: 'coach-2',
    role: 'coach',
    name: 'Baran Şahin',
    username: 'BARANSAHIN',
    password: 'coach456',
    clubId: 'club-2',
    branchId: 'branch-voleybol',
    isActive: true,
  },
  {
    id: 'parent-1',
    role: 'parent',
    name: 'Ahmet Yılmaz',
    username: 'AHMETYILMAZ',
    password: 'veli123',
    clubId: 'club-1',
    childStudentId: 'student-1',
    isActive: true,
  },
  {
    id: 'parent-2',
    role: 'parent',
    name: 'Mehmet Kara',
    username: 'MEHMETKARA',
    password: 'veli456',
    clubId: 'club-2',
    childStudentId: 'student-3',
    isActive: true,
  },
];

const initialClubs = [
  {
    id: 'club-1',
    name: 'Şehir Spor Kulübü',
    managerName: 'Murat Yıldız',
    phone: '05012060541',
    whatsappNumber: '905012060541',
    address: 'Merkez Mah. Spor Cad. No:12',
    username: 'SEHIRSPOR',
    password: 'club123',
    suspended: false,
    subscription: {
      packageMonths: 12,
      startDate: '2026-08-01',
      endDate: '2027-08-01',
      lastPaymentDate: '2026-08-01',
      status: 'active',
    },
    subscriptionHistory: [{ id: 'ext-1', months: 12, amount: 18500, paidAt: '2026-08-01', note: 'Yıllık abonelik' }],
    branches: [
      { id: 'branch-futbol', name: 'Futbol', fee: 1200, monthlyFee: 1200, coachIds: ['coach-1'] },
      { id: 'branch-basketbol', name: 'Basketbol', fee: 1100, monthlyFee: 1100, coachIds: [] },
    ],
    students: [
      {
        id: 'student-1',
        name: 'Ali Yılmaz',
        gender: 'Erkek',
        age: 12,
        parentName: 'Ahmet Yılmaz',
        parentPhone: '905551234567',
        branchId: 'branch-futbol',
        status: 'active',
        attendance: [
          { date: '2026-08-18', status: 'present' },
          { date: '2026-08-19', status: 'absent' },
          { date: '2026-08-20', status: 'excused' },
        ],
      },
      {
        id: 'student-2',
        name: 'Ece Demir',
        gender: 'Kız',
        age: 11,
        parentName: 'Selin Demir',
        parentPhone: '905552345678',
        branchId: 'branch-basketbol',
        status: 'active',
        attendance: [
          { date: '2026-08-18', status: 'present' },
          { date: '2026-08-19', status: 'present' },
          { date: '2026-08-20', status: 'present' },
        ],
      },
    ],
    announcements: [{ id: 'ann-1', title: 'Antrenman İptali', message: 'Pazartesi günü antrenman iptal edilmiştir.', target: 'Tüm Okula', type: 'notice' }],
    payments: [
      { id: 'pay-1', studentId: 'student-1', month: 'Ağustos', amount: 1200, status: 'Ödendi', branchId: 'branch-futbol' },
      { id: 'pay-2', studentId: 'student-1', month: 'Eylül', amount: 1200, status: 'Gecikti', branchId: 'branch-futbol' },
      { id: 'pay-3', studentId: 'student-2', month: 'Ağustos', amount: 1100, status: 'Ödendi', branchId: 'branch-basketbol' },
    ],
    pendingApplications: [{ id: 'app-1', studentName: 'Deniz Arslan', branchId: 'branch-futbol', parentName: 'Aysun Arslan', parentPhone: '05001234567', parentPassword: 'veli456', username: 'DENIZARSLAN', files: ['sağlık_raporu.pdf'], status: 'pending' }],
    paymentSchedule: [{ month: 'Ağustos', due: '2026-08-05', status: 'Ödendi' }, { month: 'Eylül', due: '2026-09-05', status: 'Ödenmedi' }],
    notifications: [{ id: 'n1', text: 'Antrenman iptali duyurusu', createdAt: '2026-08-21' }],
    incomingMessages: [
      {
        id: 'msg-1',
        senderName: 'Ahmet Yılmaz',
        senderRole: 'Veli',
        message: 'Öğrencinin devamsızlık durumu ile ilgili bilgi rica ediyorum.',
        sentAt: '2026-08-22T09:30:00.000Z',
      },
    ],
  },
  {
    id: 'club-2',
    name: 'Akyurt Voleybol Akademisi',
    managerName: 'Elif Demir',
    phone: '05551234567',
    whatsappNumber: '905551234567',
    address: 'Akyurt Mah. Spor Sok. No:9',
    username: 'AKYURTVOLEYBOL',
    password: 'club456',
    suspended: false,
    subscription: {
      packageMonths: 6,
      startDate: '2026-08-15',
      endDate: '2027-02-15',
      lastPaymentDate: '2026-08-15',
      status: 'active',
    },
    subscriptionHistory: [{ id: 'ext-2', months: 6, amount: 12000, paidAt: '2026-08-15', note: 'Altı aylık abonelik' }],
    branches: [
      { id: 'branch-voleybol', name: 'Voleybol', fee: 1300, monthlyFee: 1300, coachIds: ['coach-2'] },
      { id: 'branch-tenis', name: 'Tenis', fee: 1500, monthlyFee: 1500, coachIds: [] },
    ],
    students: [
      {
        id: 'student-3',
        name: 'İrem Kara',
        gender: 'Kız',
        age: 13,
        parentName: 'Mehmet Kara',
        parentPhone: '905553456789',
        branchId: 'branch-voleybol',
        status: 'active',
        attendance: [{ date: '2026-08-18', status: 'present' }],
      },
    ],
    announcements: [{ id: 'ann-2', title: 'Turnuva Duyurusu', message: 'Hafta sonu turnuva için kayıtlar açılmıştır.', target: 'Tüm Okula', type: 'notice' }],
    payments: [{ id: 'pay-4', studentId: 'student-3', month: 'Ağustos', amount: 1300, status: 'Ödendi', branchId: 'branch-voleybol' }],
    pendingApplications: [{ id: 'app-2', studentName: 'Eren Uçar', branchId: 'branch-voleybol', parentName: 'Seda Uçar', parentPhone: '05001122334', parentPassword: 'veli789', username: 'ERENUCAR', files: ['sağlık_raporu.pdf'], status: 'pending' }],
    paymentSchedule: [{ month: 'Ağustos', due: '2026-08-05', status: 'Ödendi' }, { month: 'Eylül', due: '2026-09-05', status: 'Ödenmedi' }],
    notifications: [{ id: 'n2', text: 'Voleybol turnuvası duyurusu', createdAt: '2026-08-20' }],
    incomingMessages: [],
  },
];

const defaultForm = {
  studentName: '',
  studentSurname: '',
  birthDate: '',
  branchId: 'branch-futbol',
  parentName: '',
  parentPhone: '',
  parentPassword: '',
  notes: '',
  acceptKvkk: false,
  acceptPolicy: false,
};

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
    .toUpperCase();
}

function normalizeWhatsappNumber(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('90')) return digits;
  if (digits.startsWith('0')) return `9${digits.slice(1)}`;
  return digits;
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
  if (typeof window === 'undefined') return '';

  const runtimeConfiguredBaseUrl =
    window.__APP_PUBLIC_BASE_URL__ ||
    (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_PUBLIC_BASE_URL : '') ||
    window.location.origin;

  return String(runtimeConfiguredBaseUrl || window.location.origin).replace(/\/+$/, '');
}

function buildPublicClubLink(clubId) {
  if (!clubId) return '?club=';
  const publicBaseUrl = getPublicBaseUrl();
  if (!publicBaseUrl) return `?club=${encodeURIComponent(clubId)}`;
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

function buildAnnouncementWhatsAppMessage(clubName, title, message) {
  const cleanTitle = title?.trim() || 'Duyuru';
  const cleanMessage = message?.trim() || 'Kısa bir duyuru bulunmaktadır.';
  return `Merhaba, ${clubName} kulübünden duyuru: ${cleanTitle}. ${cleanMessage}`;
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

function AppClean() {
  const [currentUser, setCurrentUser] = useState(null);
  const [clubs, setClubs] = useState(initialClubs);
  const [users, setUsers] = useState(initialUsers);
  const [activeRole, setActiveRole] = useState('super-admin');
  const [superAdminTab, setSuperAdminTab] = useState('statistics');
  const [managerTab, setManagerTab] = useState('info');
  const [selectedClubId, setSelectedClubId] = useState('club-1');
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
  const [parentMessageText, setParentMessageText] = useState('');
  const [coachMessageText, setCoachMessageText] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [publicFormClubId, setPublicFormClubId] = useState(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('club');
  });

  const getClubById = (clubId) => clubs.find((club) => club.id === clubId) ?? null;

  useEffect(() => {
    const syncClubFromUrl = () => {
      if (typeof window === 'undefined') return;
      const urlClubId = new URLSearchParams(window.location.search).get('club');
      const safeClubId = urlClubId && getClubById(urlClubId) ? urlClubId : null;

      setPublicFormClubId(safeClubId);
      if (safeClubId) {
        setSelectedClubId(safeClubId);
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

  const resolveClubId = (preferredClubId) => {
    const candidateList = [preferredClubId, publicFormClubId, selectedClubId, currentUser?.clubId, clubs[0]?.id];
    const validId = candidateList.find((candidate) => candidate && getClubById(candidate));
    return validId ?? clubs[0]?.id ?? null;
  };

  const currentClub = useMemo(
    () => getClubById(resolveClubId(selectedClubId)) ?? clubs[0] ?? null,
    [clubs, selectedClubId, currentUser, publicFormClubId]
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

  const switchRoleView = (nextRole) => {
    setActiveRole(nextRole);
    if (!clubs.length) return;

    if (nextRole === 'super-admin') {
      setSelectedClubId(clubs[0]?.id ?? '');
      return;
    }

    const nextClubId = currentUser?.clubId ? getClubById(currentUser.clubId)?.id : clubs[0]?.id;
    if (nextClubId) setSelectedClubId(nextClubId);
  };

  const validPublicFormClubId = publicFormClubId && getClubById(publicFormClubId) ? publicFormClubId : null;
  const formClub = getClubById(validPublicFormClubId || selectedClubId) ?? currentClub ?? clubs[0] ?? null;

  const isSuperAdminRole = (role) => role === 'super-admin' || role === 'super_admin';

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

  const findMatchingUser = (username, password, role = null) => {
    const cleanedUsername = String(username ?? '').trim();
    const normalizedInput = normalizeWhatsappNumber(cleanedUsername);

    return users.find((user) => {
      if (user.isActive === false) return false;
      const userKey = user.username ?? user.email ?? user.name ?? '';
      const userPhone = normalizeWhatsappNumber(user.phone ?? '');
      const matchesRole = role ? user.role === role : true;
      const matchesUsername = userKey.toUpperCase() === cleanedUsername.toUpperCase();
      const matchesPhone = userPhone && normalizedInput && userPhone === normalizedInput;
      const matchesParentCandidate = user.role === 'parent' && (matchesUsername || matchesPhone || normalizeWhatsappNumber(user.username || '') === normalizedInput);
      return matchesRole && (matchesUsername || matchesPhone || matchesParentCandidate) && String(user.password) === String(password);
    });
  };

  const login = (role, username, password) => {
    const match = findMatchingUser(username, password, role);

    if (!match) {
      alert('Giriş bilgileri hatalı.');
      return;
    }

    setCurrentUser(match);
    setActiveRole(match.role);
    const nextClubId = match.clubId || clubs[0]?.id;
    if (nextClubId) setSelectedClubId(nextClubId);
  };

  const handleToggleClubStatus = (clubId) => {
    setClubs((prev) => prev.map((club) => (club.id === clubId ? { ...club, suspended: !club.suspended } : club)));
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

  const handleSuperAdminCreateClub = () => {
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

    setClubs((prev) => [clubObj, ...prev]);
    setUsers((prev) => [
      ...prev,
      {
        id: `manager-${Date.now()}`,
        role: 'club-manager',
        name: newClub.managerName,
        username: newClub.username,
        password: newClub.password,
        clubId,
        isActive: true,
      },
    ]);
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

  const handleAddBranch = () => {
    if (!branchForm.name.trim()) return;
    const newBranch = {
      id: `branch-${Date.now()}`,
      name: branchForm.name.trim(),
      fee: Number(branchForm.fee || 0),
      monthlyFee: Number(branchForm.fee || 0),
      coachIds: [],
    };

    setClubs((prev) => prev.map((club) => (club.id === selectedClubId ? { ...club, branches: [...club.branches, newBranch] } : club)));
    setBranchForm({ name: '', fee: '' });
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

  const handleAddCoach = () => {
    if (!coachForm.name.trim() || !coachForm.password.trim()) {
      alert('Antrenör adı ve şifre zorunludur.');
      return;
    }

    const username = coachForm.username || generateUsername(coachForm.name);
    const id = `coach-${Date.now()}`;
    const coachUser = {
      id,
      role: 'coach',
      name: coachForm.name,
      username,
      password: coachForm.password,
      clubId: selectedClubId,
      branchId: coachForm.branchId,
      isActive: true,
    };

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

  const handleApproveApplication = (application) => {
    if (!application) {
      console.log('handleApproveApplication: application boş geldi.');
      return;
    }

    const resolvedClubId = getClubById(publicFormClubId || selectedClubId)?.id || getClubById(currentUser?.clubId)?.id || currentClub?.id || clubs[0]?.id;
    if (!resolvedClubId) {
      console.log('handleApproveApplication: uygun kulüp bulunamadı.', { selectedClubId, currentClubId: currentClub?.id, clubsCount: clubs.length, publicFormClubId });
      return;
    }

    setSelectedClubId(resolvedClubId);

    const appId = String(application.id ?? '');
    console.log('Onay butonuna tıklandı:', application.id, 'resolvedClubId:', resolvedClubId);

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
    const parentUsername = application.username || generateUsername(application.parentName) || normalizeWhatsappNumber(application.parentPhone) || `VELI-${Date.now()}`;
    const parentPassword = application.parentPassword || 'veli123';
    const normalizedPhone = normalizeWhatsappNumber(application.parentPhone);

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

    console.log('handleApproveApplication start', {
      appId,
      resolvedClubId,
      pendingBefore: (club.pendingApplications ?? []).map((item) => String(item.id)),
      studentsBefore: (club.students ?? []).map((item) => String(item.id)),
    });

    setClubs((prev) =>
      prev.map((item) => {
        if (item.id !== selectedClubId) return item;

        const nextPendingApplications = (item.pendingApplications ?? []).filter((app) => String(app.id) !== appId);
        const nextStudents = [...(item.students ?? []), newStudent];

        console.log('clubs set state:', {
          clubId: resolvedClubId,
          remainingPendingIds: nextPendingApplications.map((app) => String(app.id)),
          nextStudentIds: nextStudents.map((student) => String(student.id)),
        });

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

    setToastMessage('Başvuru onaylandı ve öğrenci aktif hale getirildi.');
    console.log('handleApproveApplication complete', { appId, generatedStudentId });
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

  const handleSendAnnouncement = () => {
    const payload = {
      id: `ann-${Date.now()}`,
      title: announcementForm.title,
      message: announcementForm.message,
      target: announcementForm.target,
      type: 'notice',
    };
    setClubs((prev) => prev.map((club) => (club.id === selectedClubId ? { ...club, announcements: [payload, ...(club.announcements || [])] } : club)));
    alert('Duyuru kaydedildi.');
  };

  const handleWhatsAppAnnouncementSend = () => {
    const clubName = currentClub?.name || 'Kulübümüz';
    const message = buildAnnouncementWhatsAppMessage(clubName, announcementForm.title, announcementForm.message);
    const targetPhone = currentClub?.whatsappNumber || '';
    if (!targetPhone) {
      alert('Kulüp WhatsApp numarası tanımlı değil.');
      return;
    }
    window.open(buildWhatsAppLink(targetPhone, message), '_blank', 'noopener,noreferrer');
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

  const sendManagerMessage = (senderName, senderRole, content) => {
    const cleanText = String(content || '').trim();
    if (!cleanText) {
      alert('Mesaj içeriği boş olamaz.');
      return;
    }

    const messagePayload = {
      id: `msg-${Date.now()}`,
      senderName,
      senderRole,
      message: cleanText,
      sentAt: new Date().toISOString(),
    };

    setClubs((prev) =>
      prev.map((club) =>
        club.id === selectedClubId
          ? {
              ...club,
              incomingMessages: [messagePayload, ...(club.incomingMessages || [])],
            }
          : club
      )
    );

    setToastMessage('Mesajınız başarıyla gönderildi');
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
        <div className="card-surface rounded-3xl p-6">
          <h3 className="mb-4 text-xl font-semibold text-white">Kulüp Listesi ve Abonelik Takip</h3>
          <div className="grid gap-4 xl:grid-cols-2">
            {clubs.map((club) => (
              <div key={club.id} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{club.name}</h4>
                    <p className="text-xs text-slate-400">{club.managerName}</p>
                  </div>
                  <span className={`status-pill ${club.suspended ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                    {club.suspended ? 'Askıda' : 'Aktif'}
                  </span>
                </div>

                <div className="grid gap-2 text-sm text-slate-300">
                  <div className="flex justify-between gap-2"><span>Program Başlangıcı</span><strong>{formatShortDate(club.subscription.startDate)}</strong></div>
                  <div className="flex justify-between gap-2"><span>Son Ödeme</span><strong>{formatShortDate(club.subscription.lastPaymentDate)}</strong></div>
                  <div className="flex justify-between gap-2"><span>Abonelik Paketi</span><strong>{club.subscription.packageMonths} Aylık</strong></div>
                  <div className="flex justify-between gap-2"><span>Abonelik Ücreti</span><strong>{Number(club.subscription.packageMonths || 0).toLocaleString('tr-TR')} ₺</strong></div>
                  <div className="flex justify-between gap-2"><span>Bitiş Tarihi</span><strong>{formatShortDate(club.subscription.endDate)}</strong></div>
                </div>

                {(() => {
                  const warning = getSubscriptionWarning(club);
                  const remainingDays = Math.ceil((new Date(club.subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const toneClass =
                    warning.tone === 'red'
                      ? 'border-red-500/40 bg-red-500/10 text-red-200'
                      : warning.tone === 'yellow'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';

                  return (
                    <div className={`mt-3 rounded-xl border px-3 py-2 text-xs font-medium ${toneClass}`}>
                      Abonelik Durumu: {warning.label} • {remainingDays > 0 ? `${remainingDays} gün kaldı` : 'Süre doldu'}
                    </div>
                  );
                })()}

                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
                      onClick={() =>
                        handleExtendSubscription(
                          club.id,
                          subscriptionExtensionValues[club.id]?.months ?? club.subscription?.packageMonths ?? 12,
                          subscriptionExtensionValues[club.id]?.amount ?? 0
                        )
                      }
                    >
                      Aboneliği Uzat
                    </button>
                  </div>

                  <button className="primary-btn" onClick={() => handleToggleClubStatus(club.id)}>
                    {club.suspended ? 'Hesabı Aktive Et' : 'Hesabı Askıya Al'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {superAdminTab === 'newClub' && (
        <div className="card-surface rounded-3xl p-6">
          <h3 className="mb-4 text-xl font-semibold text-white">Yeni Kulüp Kaydet</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <input className="input-shell" placeholder="Kulüp Adı" value={newClub.clubName} onChange={(e) => setNewClub({ ...newClub, clubName: e.target.value })} />
            <input className="input-shell" placeholder="Yönetici Adı Soyadı" value={newClub.managerName} onChange={(e) => setNewClub({ ...newClub, managerName: e.target.value })} />
            <input className="input-shell" placeholder="İletişim Bilgileri" value={newClub.contact} onChange={(e) => setNewClub({ ...newClub, contact: e.target.value })} />
            <input className="input-shell" placeholder="Kulüp WhatsApp Numarası" value={newClub.whatsappNumber ? formatWhatsappDisplay(newClub.whatsappNumber) : ''} onChange={(e) => setNewClub({ ...newClub, whatsappNumber: normalizeWhatsappNumber(e.target.value) })} />
            <input className="input-shell" placeholder="Sistem Giriş Kullanıcı Adı" value={newClub.username} onChange={(e) => setNewClub({ ...newClub, username: e.target.value })} />
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

    return (
      <div className="space-y-6">
        <div className="card-surface rounded-3xl p-3 sm:p-4">
          <div className="flex flex-wrap gap-2">
            {['info', 'branches', 'pending', 'students', 'payments', 'announcements'].map((tab) => (
              <button
                key={tab}
                className={`rounded-xl px-3 py-2 text-xs font-semibold sm:text-sm ${managerTab === tab ? 'bg-gradient-to-r from-violet-600 to-orange-500 text-white' : 'bg-slate-950/80 text-slate-300'}`}
                onClick={() => setManagerTab(tab)}
              >
                {tab === 'info' ? 'Kulüp Bilgileri' : tab === 'branches' ? 'Branşlar' : tab === 'pending' ? 'Bekleyenler' : tab === 'students' ? 'Öğrenciler' : tab === 'payments' ? 'Ödemeler' : 'Duyurular'}
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
                <input className="input-shell" placeholder="Öğrenci Adı" value={applicationForm.studentName} onChange={(e) => setApplicationForm({ ...applicationForm, studentName: e.target.value })} />
                <input className="input-shell" placeholder="Öğrenci Soyadı" value={applicationForm.studentSurname} onChange={(e) => setApplicationForm({ ...applicationForm, studentSurname: e.target.value })} />
                <input className="input-shell" type="date" value={applicationForm.birthDate} onChange={(e) => setApplicationForm({ ...applicationForm, birthDate: e.target.value })} />
                <select className="input-shell" value={applicationForm.branchId} onChange={(e) => setApplicationForm({ ...applicationForm, branchId: e.target.value })}>
                  {(currentClub?.branches ?? []).map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
                <input className="input-shell" placeholder="Veli Adı Soyadı" value={applicationForm.parentName} onChange={(e) => setApplicationForm({ ...applicationForm, parentName: e.target.value })} />
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

              <textarea className="input-shell mt-5 min-h-28" placeholder="Not ekleyebilirsiniz" value={applicationForm.notes} onChange={(e) => setApplicationForm({ ...applicationForm, notes: e.target.value })} />

              <div className="mt-5 flex justify-end">
                <button
                  className="primary-btn"
                  onClick={() => {
                    if (!applicationForm.acceptKvkk || !applicationForm.acceptPolicy) {
                      alert('KVKK ve muvafakat onayı gereklidir.');
                      return;
                    }

                    const generatedUsername = generateUsername(applicationForm.parentName || '');
                    const parentPassword = (applicationForm.parentPassword || '').trim();
                    if (!parentPassword) {
                      alert('Veli şifresi mutlaka girilmelidir.');
                      return;
                    }

                    const payload = {
                      id: `app-${Date.now()}`,
                      studentName: `${applicationForm.studentName} ${applicationForm.studentSurname}`.trim(),
                      branchId: applicationForm.branchId,
                      parentName: applicationForm.parentName,
                      parentPhone: applicationForm.parentPhone,
                      parentPassword,
                      username: generatedUsername,
                      files: ['sağlık_raporu.pdf'],
                      status: 'pending',
                    };

                    console.log('ADD_PENDING_APPLICATION', payload);
                    setBekleyenler((prev) => [{ ...payload }, ...prev]);
                    setClubs((prev) => prev.map((club) => (club.id === currentClub?.id ? { ...club, pendingApplications: [payload, ...(club.pendingApplications ?? [])] } : club)));
                    setApplicationForm(defaultForm);
                    setToastMessage('Online kayıt formu başarıyla gönderildi.');
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
                      <span className="text-xs text-slate-400">{branch.coachIds.length} antrenör</span>
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
            <h3 className="mb-4 text-xl font-semibold text-white">Gelen Mesajlar / İletişim</h3>
            <div className="space-y-3">
              {(currentClub?.incomingMessages || []).length ? (
                currentClub.incomingMessages.map((message) => (
                  <div key={message.id} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold text-white">{message.senderName}</div>
                        <div className="text-xs text-violet-300">{message.senderRole}</div>
                      </div>
                      <div className="text-xs text-slate-400">{new Date(message.sentAt).toLocaleString('tr-TR')}</div>
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{message.message}</div>
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
                <option>Tüm Okula</option>
                <option>Futbol</option>
                <option>Basketbol</option>
              </select>
              <input className="input-shell" placeholder="Bildirim türü" value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
              <textarea className="input-shell min-h-28" placeholder="Mesaj içeriği" value={announcementForm.message} onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })} />
              <div className="flex flex-col gap-3 sm:flex-row">
                <button className="primary-btn w-full sm:w-auto" onClick={handleSendAnnouncement}>Bildirimi Gönder</button>
                <button className="secondary-btn w-full sm:w-auto" onClick={handleWhatsAppAnnouncementSend}>WhatsApp ile Gönder</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCoachPanel = () => {
    const branchName = currentClub?.branches.find((branch) => branch.id === currentUser?.branchId)?.name ?? 'Branş';
    const coachStudents = currentClub?.students.filter((student) => getStudentBranchIds(student).includes(currentUser?.branchId)) ?? [];
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
              <h2 className="text-2xl font-bold text-white">{activeDisplayUser?.name || currentUser?.name || 'Antrenör'}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-xl border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-sm text-violet-200">{branchName}</div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200">{coachStudents.length} öğrenci</div>
            </div>
          </div>

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
  };

  const renderAttendanceSummaryModal = () => {
    const summaryStudent = currentClub?.students.find((student) => student.id === attendanceCalendar.studentId) ?? null;
    if (!summaryStudent) return null;

    const monthKey = attendanceCalendar.month || new Date().toISOString().slice(0, 7);
    const monthCells = getCalendarMonthCells(monthKey);
    const monthDate = new Date(`${monthKey}-01T00:00:00`);
    const monthLabel = monthDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    const attendanceByDate = {};

    (summaryStudent.attendance || []).forEach((entry) => {
      if (!entry?.date) return;
      attendanceByDate[entry.date] = entry.status;
    });

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
        <div className="card-surface w-full max-w-3xl overflow-hidden rounded-[28px] border border-slate-700">
          <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
            <div>
              <h3 className="text-xl font-bold text-white">Aylık Katılım Özeti</h3>
              <p className="text-sm text-slate-400">{summaryStudent.name} • {monthLabel}</p>
            </div>
            <button className="text-xl text-slate-300 hover:text-white" onClick={() => setShowAttendanceSummaryModal(false)}>×</button>
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
                className="secondary-btn"
                onClick={() => {
                  setAttendanceCalendar({ studentId: childStudent?.id ?? null, month: new Date().toISOString().slice(0, 7) });
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
                    sendManagerMessage(currentUser?.name || 'Veli', 'Veli', content);
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
        <button className="primary-btn mt-6" onClick={() => setCurrentUser(null)}>Çıkış Yap</button>
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
                  defaultValue="sagliksk@gmail.com"
                  id="login-input"
                />
                <input
                  className="input-shell"
                  type="password"
                  placeholder="Şifre"
                  defaultValue="Efraim+08"
                  id="password-input"
                />
                <button
                  className="primary-btn w-full"
                  onClick={() => {
                    const username = document.getElementById('login-input').value;
                    const password = document.getElementById('password-input').value;

                    const matchingUser = findMatchingUser(username, password);

                    if (!matchingUser) {
                      alert('Giriş bilgileri hatalı veya onay bekleyen kullanıcı giriş yapamaz.');
                      return;
                    }

                    setCurrentUser(matchingUser);
                    setActiveRole(matchingUser.role);
                    const nextClubId = matchingUser.clubId || clubs[0]?.id;
                    if (nextClubId) setSelectedClubId(nextClubId);
                  }}
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
          <input className="input-shell" placeholder="Öğrenci Adı" value={applicationForm.studentName} onChange={(e) => setApplicationForm({ ...applicationForm, studentName: e.target.value })} />
          <input className="input-shell" placeholder="Öğrenci Soyadı" value={applicationForm.studentSurname} onChange={(e) => setApplicationForm({ ...applicationForm, studentSurname: e.target.value })} />
          <input className="input-shell" type="date" value={applicationForm.birthDate} onChange={(e) => setApplicationForm({ ...applicationForm, birthDate: e.target.value })} />
          <select className="input-shell" value={applicationForm.branchId} onChange={(e) => setApplicationForm({ ...applicationForm, branchId: e.target.value })}>
            {formClub?.branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
          <input className="input-shell" placeholder="Veli Adı Soyadı" value={applicationForm.parentName} onChange={(e) => setApplicationForm({ ...applicationForm, parentName: e.target.value })} />
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
          onClick={() => {
            if (!applicationForm.acceptKvkk || !applicationForm.acceptPolicy) {
              alert('KVKK ve muvafakat onayı gereklidir.');
              return;
            }

            const generatedUsername = generateUsername(applicationForm.parentName || '');
            const targetClubId = validPublicFormClubId || getClubById(selectedClubId)?.id || publicFormClubId || clubs[0]?.id;
            const parentPassword = (applicationForm.parentPassword || '').trim();

            if (!parentPassword) {
              alert('Veli şifresi mutlaka girilmelidir.');
              return;
            }

            const payload = {
              id: `app-${Date.now()}`,
              studentName: `${applicationForm.studentName} ${applicationForm.studentSurname}`,
              branchId: applicationForm.branchId,
              parentName: applicationForm.parentName,
              parentPhone: applicationForm.parentPhone,
              parentPassword,
              username: generatedUsername,
              files: ['sağlık_raporu.pdf'],
              status: 'pending',
            };

            setClubs((prev) => prev.map((club) => (club.id === targetClubId ? { ...club, pendingApplications: [payload, ...club.pendingApplications] } : club)));

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
            alert('Başvurunuz başarıyla alındı ve yönetici onayına gönderildi.');
          }}
        >
          Başvuruyu Tamamla
        </button>
      </div>
    </div>
  );

  if (!currentUser && !validPublicFormClubId) {
    return renderLoginScreen();
  }

  if (!currentUser && validPublicFormClubId) {
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
    coach: renderCoachPanel(),
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
      <div className="min-h-screen bg-slate-950 px-4 py-6 text-white">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-violet-300">SPORTHUB</div>
              <h1 className="text-2xl font-bold text-white">{panelRole === 'super-admin' || panelRole === 'super_admin' ? 'Süper Admin' : activeDisplayUser?.name || currentUser?.name}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isSuperAdminRole(currentUser?.role) && (
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
              )}
              <button className="secondary-btn" onClick={() => setCurrentUser(null)}>Çıkış</button>
            </div>
          </header>

          <div className="mt-6">{panelMap[panelRole] ?? panelMap['super-admin']}</div>
        </div>
      </div>
    </>
  );
}

export default AppClean;
