/**
 * Translations
 * i18n support for Thai and English
 */

export type Language = 'th' | 'en';

export const translations = {
  th: {
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    filter: 'กรอง',
    loading: 'Loading...',
    saving: 'LoadingSave...',
    saved: 'Saveแล้ว!',
    error: 'เกิดข้อผิดพลาด',
    success: 'Success',
    confirm: 'Confirm',
    back: 'กลับ',
    next: 'ถัดไป',
    previous: 'ก่อนPage',
    close: 'Close',
    optional: 'ไม่บังคับ',
    required: 'จำเป็น',
    
    // Auth
    login: 'เข้าสู่System',
    logout: 'ออกfromSystem',
    register: 'ลงทะเบียน',
    email: 'อีเมล',
    password: 'Codeผ่าน',
    forgotPassword: 'ลืมCodeผ่าน?',
    rememberMe: 'จดจำฉัน',
    
    // Navigation
    dashboard: 'แดชบอร์ด',
    cases: 'Case',
    investigations: 'Investigation',
    reports: 'Report',
    settings: 'Settings',
    profile: 'โปรไฟล์',
    help: 'ช่วยเหลือ',
    guide: 'คู่มือการใช้งาน',
    
    // Settings Page
    settingsTitle: 'Settings',
    settingsSubtitle: 'จัดการบัญชีและการSettingsแอปพลิเคชัน',
    
    // Profile Settings
    profileSettings: 'Dataโปรไฟล์',
    firstName: 'Name',
    lastName: 'นามสกุล',
    phone: 'เบอร์โทรศัพท์',
    emailCannotChange: 'Cannotเปลี่ยนอีเมลได้',
    changeAvatar: 'เปลี่ยนรูปโปรไฟล์',
    avatarHint: 'JPG, PNG ไม่เกิน 2MB',
    removeAvatar: 'Deleteรูปโปรไฟล์',
    
    // Notification Settings
    notificationSettings: 'การแจ้งเตือน',
    emailNotifications: 'แจ้งเตือนทางอีเมล',
    emailNotificationsDesc: 'รับการแจ้งเตือนผ่านอีเมล',
    pushNotifications: 'การแจ้งเตือนแบบ Push',
    pushNotificationsDesc: 'รับการแจ้งเตือนผ่านเบราว์เซอร์',
    caseUpdates: 'อัพเดทCase',
    caseUpdatesDesc: 'แจ้งเตือนเมื่อCaseมีการอัพเดท',
    weeklyReport: 'Reportรายสัปดาห์',
    weeklyReportDesc: 'รับReportSummaryรายสัปดาห์',
    ticketUpdates: 'อัพเดท Ticket',
    ticketUpdatesDesc: 'แจ้งเตือนเมื่อ Ticket มีคำตอบใหม่',
    systemAnnouncements: 'ประกาศfromSystem',
    systemAnnouncementsDesc: 'รับประกาศและข่าวสารfromSystem',
    
    // Security Settings
    securitySettings: 'ความปลอดภัย',
    currentPassword: 'Codeผ่านปัจจุบัน',
    newPassword: 'Codeผ่านใหม่',
    confirmPassword: 'ConfirmCodeผ่านใหม่',
    changePassword: 'เปลี่ยนCodeผ่าน',
    passwordChanged: 'เปลี่ยนCodeผ่านSuccess',
    passwordMismatch: 'Codeผ่านไม่ตรงกัน',
    passwordTooShort: 'Codeผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
    currentPasswordWrong: 'Codeผ่านปัจจุบันไม่ถูกต้อง',
    twoFactorAuth: 'การConfirmตัวตนสองขั้นตอน',
    twoFactorAuthDesc: 'Addความปลอดภัยให้บัญชีด้วยการConfirmตัวตนสองขั้นตอน',
    enable2FA: 'เCloseใช้งาน 2FA',
    disable2FA: 'Closeใช้งาน 2FA',
    
    // Appearance Settings
    appearanceSettings: 'การแสดงผล',
    theme: 'ธีม',
    themeLight: 'สว่าง',
    themeDark: 'มืด',
    themeSystem: 'ตามSystem',
    
    // Language Settings
    languageSettings: 'ภาษาและภูมิภาค',
    language: 'ภาษา',
    languageThai: 'ไทย',
    languageEnglish: 'English',
    timezone: 'เขตTime',
    dateFormat: 'รูปแบบDate',
    
    // Admin
    adminPanel: 'แผงควบคุมผู้ViewแลSystem',
    users: 'User',
    organizations: 'หน่วยงาน',
    subscriptions: 'การสมัครสมาชิก',
    supportTickets: 'Ticket สนับสนุน',
    systemReports: 'ReportSystem',
    notifications: 'การแจ้งเตือน',
    deletedCases: 'Caseที่ถูกDelete',
    loginMap: 'แผนที่ Login',
    licenseKeys: 'Codeใบอนุญาต',
    registrations: 'การลงทะเบียน',
    
    // Cases
    newCase: 'CreateCaseใหม่',
    caseTitle: 'NameCase',
    caseDescription: 'รายละเอียด',
    caseStatus: 'Status',
    casePriority: 'ความสำคัญ',
    caseType: 'Type',
    assignedTo: 'มอบหมายให้',
    createdBy: 'Createโดย',
    
    // Status
    statusOpen: 'เClose',
    statusInProgress: 'Loadingดำเนินการ',
    statusResolved: 'Editแล้ว',
    statusClosed: 'Closeแล้ว',
    
    // Priority
    priorityLow: 'ต่ำ',
    priorityMedium: 'ปานกลาง',
    priorityHigh: 'สูง',
    priorityCritical: 'วิกฤต',
    
    // Support
    reportProblem: 'แจ้งปัญหา',
    myTickets: 'Ticket ofฉัน',
    newTicket: 'Create Ticket ใหม่',
    ticketSubject: 'หัวข้อ',
    ticketDescription: 'รายละเอียด',
    ticketCategory: 'Type',
    categoryBug: 'Bug / ข้อผิดพลาด',
    categoryFeature: 'ขอ Feature ใหม่',
    categoryQuestion: 'คำถาม',
    categoryOther: 'อื่นๆ',
    attachScreenshot: 'แนบภาพPageจอ',
    
    // Validation
    fieldRequired: 'PleaseกรอกData',
    invalidEmail: 'อีเมลไม่ถูกต้อง',
    invalidPhone: 'เบอร์โทรศัพท์ไม่ถูกต้อง',
    
    // Time
    today: 'วันนี้',
    yesterday: 'เมื่อวาน',
    daysAgo: 'Dateแล้ว',
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
