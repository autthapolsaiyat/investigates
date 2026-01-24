/**
 * Translations
 * i18n support for Thai and English
 */

export type Language = 'th' | 'en';

export const translations = {
  th: {
    // Common
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    edit: 'แก้ไข',
    create: 'สร้าง',
    search: 'ค้นหา',
    filter: 'กรอง',
    loading: 'กำลังโหลด...',
    saving: 'กำลังบันทึก...',
    saved: 'บันทึกแล้ว!',
    error: 'เกิดข้อผิดพลาด',
    success: 'สำเร็จ',
    confirm: 'ยืนยัน',
    back: 'กลับ',
    next: 'ถัดไป',
    previous: 'ก่อนหน้า',
    close: 'ปิด',
    optional: 'ไม่บังคับ',
    required: 'จำเป็น',
    
    // Auth
    login: 'เข้าสู่ระบบ',
    logout: 'ออกจากระบบ',
    register: 'ลงทะเบียน',
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    forgotPassword: 'ลืมรหัสผ่าน?',
    rememberMe: 'จดจำฉัน',
    
    // Navigation
    dashboard: 'แดชบอร์ด',
    cases: 'คดี',
    investigations: 'การสืบสวน',
    reports: 'รายงาน',
    settings: 'ตั้งค่า',
    profile: 'โปรไฟล์',
    help: 'ช่วยเหลือ',
    guide: 'คู่มือการใช้งาน',
    
    // Settings Page
    settingsTitle: 'ตั้งค่า',
    settingsSubtitle: 'จัดการบัญชีและการตั้งค่าแอปพลิเคชัน',
    
    // Profile Settings
    profileSettings: 'ข้อมูลโปรไฟล์',
    firstName: 'ชื่อ',
    lastName: 'นามสกุล',
    phone: 'เบอร์โทรศัพท์',
    emailCannotChange: 'ไม่สามารถเปลี่ยนอีเมลได้',
    changeAvatar: 'เปลี่ยนรูปโปรไฟล์',
    avatarHint: 'JPG, PNG ไม่เกิน 2MB',
    removeAvatar: 'ลบรูปโปรไฟล์',
    
    // Notification Settings
    notificationSettings: 'การแจ้งเตือน',
    emailNotifications: 'แจ้งเตือนทางอีเมล',
    emailNotificationsDesc: 'รับการแจ้งเตือนผ่านอีเมล',
    pushNotifications: 'การแจ้งเตือนแบบ Push',
    pushNotificationsDesc: 'รับการแจ้งเตือนผ่านเบราว์เซอร์',
    caseUpdates: 'อัพเดทคดี',
    caseUpdatesDesc: 'แจ้งเตือนเมื่อคดีมีการอัพเดท',
    weeklyReport: 'รายงานรายสัปดาห์',
    weeklyReportDesc: 'รับรายงานสรุปรายสัปดาห์',
    ticketUpdates: 'อัพเดท Ticket',
    ticketUpdatesDesc: 'แจ้งเตือนเมื่อ Ticket มีคำตอบใหม่',
    systemAnnouncements: 'ประกาศจากระบบ',
    systemAnnouncementsDesc: 'รับประกาศและข่าวสารจากระบบ',
    
    // Security Settings
    securitySettings: 'ความปลอดภัย',
    currentPassword: 'รหัสผ่านปัจจุบัน',
    newPassword: 'รหัสผ่านใหม่',
    confirmPassword: 'ยืนยันรหัสผ่านใหม่',
    changePassword: 'เปลี่ยนรหัสผ่าน',
    passwordChanged: 'เปลี่ยนรหัสผ่านสำเร็จ',
    passwordMismatch: 'รหัสผ่านไม่ตรงกัน',
    passwordTooShort: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
    currentPasswordWrong: 'รหัสผ่านปัจจุบันไม่ถูกต้อง',
    twoFactorAuth: 'การยืนยันตัวตนสองขั้นตอน',
    twoFactorAuthDesc: 'เพิ่มความปลอดภัยให้บัญชีด้วยการยืนยันตัวตนสองขั้นตอน',
    enable2FA: 'เปิดใช้งาน 2FA',
    disable2FA: 'ปิดใช้งาน 2FA',
    
    // Appearance Settings
    appearanceSettings: 'การแสดงผล',
    theme: 'ธีม',
    themeLight: 'สว่าง',
    themeDark: 'มืด',
    themeSystem: 'ตามระบบ',
    
    // Language Settings
    languageSettings: 'ภาษาและภูมิภาค',
    language: 'ภาษา',
    languageThai: 'ไทย',
    languageEnglish: 'English',
    timezone: 'เขตเวลา',
    dateFormat: 'รูปแบบวันที่',
    
    // Admin
    adminPanel: 'แผงควบคุมผู้ดูแลระบบ',
    users: 'ผู้ใช้',
    organizations: 'หน่วยงาน',
    subscriptions: 'การสมัครสมาชิก',
    supportTickets: 'Ticket สนับสนุน',
    systemReports: 'รายงานระบบ',
    notifications: 'การแจ้งเตือน',
    deletedCases: 'คดีที่ถูกลบ',
    loginMap: 'แผนที่ Login',
    licenseKeys: 'รหัสใบอนุญาต',
    registrations: 'การลงทะเบียน',
    
    // Cases
    newCase: 'สร้างคดีใหม่',
    caseTitle: 'ชื่อคดี',
    caseDescription: 'รายละเอียด',
    caseStatus: 'สถานะ',
    casePriority: 'ความสำคัญ',
    caseType: 'ประเภท',
    assignedTo: 'มอบหมายให้',
    createdBy: 'สร้างโดย',
    
    // Status
    statusOpen: 'เปิด',
    statusInProgress: 'กำลังดำเนินการ',
    statusResolved: 'แก้ไขแล้ว',
    statusClosed: 'ปิดแล้ว',
    
    // Priority
    priorityLow: 'ต่ำ',
    priorityMedium: 'ปานกลาง',
    priorityHigh: 'สูง',
    priorityCritical: 'วิกฤต',
    
    // Support
    reportProblem: 'แจ้งปัญหา',
    myTickets: 'Ticket ของฉัน',
    newTicket: 'สร้าง Ticket ใหม่',
    ticketSubject: 'หัวข้อ',
    ticketDescription: 'รายละเอียด',
    ticketCategory: 'ประเภท',
    categoryBug: 'Bug / ข้อผิดพลาด',
    categoryFeature: 'ขอ Feature ใหม่',
    categoryQuestion: 'คำถาม',
    categoryOther: 'อื่นๆ',
    attachScreenshot: 'แนบภาพหน้าจอ',
    
    // Validation
    fieldRequired: 'กรุณากรอกข้อมูล',
    invalidEmail: 'อีเมลไม่ถูกต้อง',
    invalidPhone: 'เบอร์โทรศัพท์ไม่ถูกต้อง',
    
    // Time
    today: 'วันนี้',
    yesterday: 'เมื่อวาน',
    daysAgo: 'วันที่แล้ว',
    hoursAgo: 'ชั่วโมงที่แล้ว',
    minutesAgo: 'นาทีที่แล้ว',
    justNow: 'เมื่อสักครู่',
  },
  
  en: {
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    filter: 'Filter',
    loading: 'Loading...',
    saving: 'Saving...',
    saved: 'Saved!',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    optional: 'Optional',
    required: 'Required',
    
    // Auth
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    rememberMe: 'Remember me',
    
    // Navigation
    dashboard: 'Dashboard',
    cases: 'Cases',
    investigations: 'Investigations',
    reports: 'Reports',
    settings: 'Settings',
    profile: 'Profile',
    help: 'Help',
    guide: 'User Guide',
    
    // Settings Page
    settingsTitle: 'Settings',
    settingsSubtitle: 'Manage your account and application preferences',
    
    // Profile Settings
    profileSettings: 'Profile Information',
    firstName: 'First Name',
    lastName: 'Last Name',
    phone: 'Phone',
    emailCannotChange: 'Email cannot be changed',
    changeAvatar: 'Change Avatar',
    avatarHint: 'JPG, PNG up to 2MB',
    removeAvatar: 'Remove Avatar',
    
    // Notification Settings
    notificationSettings: 'Notification Preferences',
    emailNotifications: 'Email Notifications',
    emailNotificationsDesc: 'Receive notifications via email',
    pushNotifications: 'Push Notifications',
    pushNotificationsDesc: 'Receive browser push notifications',
    caseUpdates: 'Case Updates',
    caseUpdatesDesc: 'Get notified when cases are updated',
    weeklyReport: 'Weekly Report',
    weeklyReportDesc: 'Receive weekly summary report',
    ticketUpdates: 'Ticket Updates',
    ticketUpdatesDesc: 'Get notified when tickets have new responses',
    systemAnnouncements: 'System Announcements',
    systemAnnouncementsDesc: 'Receive system announcements and news',
    
    // Security Settings
    securitySettings: 'Security Settings',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    changePassword: 'Change Password',
    passwordChanged: 'Password changed successfully',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 8 characters',
    currentPasswordWrong: 'Current password is incorrect',
    twoFactorAuth: 'Two-Factor Authentication',
    twoFactorAuthDesc: 'Add an extra layer of security to your account by enabling two-factor authentication.',
    enable2FA: 'Enable 2FA',
    disable2FA: 'Disable 2FA',
    
    // Appearance Settings
    appearanceSettings: 'Appearance',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    
    // Language Settings
    languageSettings: 'Language & Region',
    language: 'Language',
    languageThai: 'ไทย (Thai)',
    languageEnglish: 'English',
    timezone: 'Timezone',
    dateFormat: 'Date Format',
    
    // Admin
    adminPanel: 'Admin Panel',
    users: 'Users',
    organizations: 'Organizations',
    subscriptions: 'Subscriptions',
    supportTickets: 'Support Tickets',
    systemReports: 'System Reports',
    notifications: 'Notifications',
    deletedCases: 'Deleted Cases',
    loginMap: 'Login Map',
    licenseKeys: 'License Keys',
    registrations: 'Registrations',
    
    // Cases
    newCase: 'New Case',
    caseTitle: 'Case Title',
    caseDescription: 'Description',
    caseStatus: 'Status',
    casePriority: 'Priority',
    caseType: 'Type',
    assignedTo: 'Assigned To',
    createdBy: 'Created By',
    
    // Status
    statusOpen: 'Open',
    statusInProgress: 'In Progress',
    statusResolved: 'Resolved',
    statusClosed: 'Closed',
    
    // Priority
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityCritical: 'Critical',
    
    // Support
    reportProblem: 'Report Problem',
    myTickets: 'My Tickets',
    newTicket: 'New Ticket',
    ticketSubject: 'Subject',
    ticketDescription: 'Description',
    ticketCategory: 'Category',
    categoryBug: 'Bug / Error',
    categoryFeature: 'Feature Request',
    categoryQuestion: 'Question',
    categoryOther: 'Other',
    attachScreenshot: 'Attach Screenshot',
    
    // Validation
    fieldRequired: 'This field is required',
    invalidEmail: 'Invalid email address',
    invalidPhone: 'Invalid phone number',
    
    // Time
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: 'days ago',
    hoursAgo: 'hours ago',
    minutesAgo: 'minutes ago',
    justNow: 'Just now',
  },
} as const;

export type TranslationKey = keyof typeof translations.th;

/**
 * Get translation for a key
 */
export function t(key: TranslationKey, lang: Language = 'th'): string {
  return translations[lang][key] || key;
}

/**
 * Hook-like function to get translator
 */
export function useTranslation(lang: Language) {
  return {
    t: (key: TranslationKey) => t(key, lang),
    lang,
  };
}

export default translations;
