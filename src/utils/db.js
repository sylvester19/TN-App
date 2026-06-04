// Database wrapper using localStorage to simulate a database.
// Supports dual-mode: simulated local database and live Supabase queries.

const MOCK_DEPARTMENTS = [
  { id: 1, name: 'Municipal Corporation', icon: 'city', complaints: 245, officers: 28, resolveRate: 76 },
  { id: 2, name: 'TANGEDCO', icon: 'zap', complaints: 389, officers: 35, resolveRate: 73 },
  { id: 3, name: 'CMWSSB', icon: 'droplets', complaints: 178, officers: 12, resolveRate: 68 },
  { id: 4, name: 'Agriculture', icon: 'sprout', complaints: 134, officers: 19, resolveRate: 82 },
  { id: 5, name: 'Health', icon: 'heart-pulse', complaints: 198, officers: 31, resolveRate: 85 },
  { id: 6, name: 'Education', icon: 'graduation-cap', complaints: 156, officers: 42, resolveRate: 89 },
  { id: 7, name: 'Transport', icon: 'bus', complaints: 203, officers: 15, resolveRate: 74 },
  { id: 8, name: 'Police', icon: 'shield', complaints: 421, officers: 68, resolveRate: 91 },
  { id: 9, name: 'Housing', icon: 'home', complaints: 287, officers: 18, resolveRate: 78 },
  { id: 10, name: 'Environment', icon: 'leaf', complaints: 89, officers: 14, resolveRate: 88 },
  { id: 11, name: 'Labour', icon: 'hard-hat', complaints: 143, officers: 16, resolveRate: 83 },
  { id: 12, name: 'Industries', icon: 'factory', complaints: 112, officers: 11, resolveRate: 77 },
  { id: 13, name: 'Food & Civil Supplies', icon: 'package', complaints: 98, officers: 9, resolveRate: 79 },
  { id: 14, name: 'Revenue', icon: 'landmark', complaints: 312, officers: 24, resolveRate: 71 },
  { id: 15, name: 'Rural Development', icon: 'tree-pine', complaints: 159, officers: 21, resolveRate: 86 },
  { id: 16, name: 'Social Welfare', icon: 'users', complaints: 67, officers: 22, resolveRate: 95 },
  { id: 17, name: 'Registration', icon: 'file-check', complaints: 56, officers: 8, resolveRate: 80 }
];

const MOCK_COMPLAINTS = [
  { id: 'AI-TN-1001', title: 'Road damage on NH-44', dept: 'Municipal Corporation', status: 'In Progress', sev: 'High', date: '2026-06-03', desc: 'Large potholes causing accidents near Ambattur junction.', officer: 'Raj Kumar', ph: '9876543210', location: 'Ambattur, Chennai' },
  { id: 'AI-TN-1002', title: 'Water supply disruption', dept: 'CMWSSB', status: 'New', sev: 'Critical', date: '2026-06-04', desc: 'No water supply for 3 days in Thiruvallur block.', officer: 'Priya Sundaram', ph: '9876543211', location: 'Thiruvallur, Ward 4' },
  { id: 'AI-TN-1003', title: 'Power outage – 12hrs', dept: 'TANGEDCO', status: 'Resolved', sev: 'High', date: '2026-06-02', desc: 'Entire sector 7 without power. Repeated complaint.', officer: 'Murugan K.', ph: '9876543212', location: 'Velachery, Sector 7' },
  { id: 'AI-TN-1004', title: 'School building leak', dept: 'Education', status: 'Resolved', sev: 'Medium', date: '2026-06-01', desc: 'Roof leaking in Govt. Primary School, Kancheepuram.', officer: 'Lakshmi V.', ph: '9876543213', location: 'Kancheepuram, Street 2' },
  { id: 'AI-TN-1005', title: 'Hospital medicine shortage', dept: 'Health', status: 'Escalated', sev: 'Critical', date: '2026-06-04', desc: 'PHC Villupuram out of essential antibiotics.', officer: 'Dr. Senthil', ph: '9876543216', location: 'Villupuram PHC' }
];

const MOCK_EMERGENCIES = [
  { id: 'EMG-001', title: 'Flash Flood – Cuddalore', loc: 'Cuddalore District', sev: 'Critical', status: 'Active', time: '2h ago', teams: 4, progress: 35, desc: 'Heavy rainfall causing flooding in low-lying areas. 3 villages evacuated.' },
  { id: 'EMG-002', title: 'Industrial Fire – Manali', loc: 'Manali, Chennai', sev: 'High', status: 'Contained', time: '5h ago', teams: 6, progress: 75, desc: 'Petrochemical plant fire. TNFIRE deployed. 2 injuries reported.' },
  { id: 'EMG-003', title: 'Bridge Collapse – Thanjavur', loc: 'Thanjavur-Trichy Road', sev: 'Critical', status: 'Active', time: '1h ago', teams: 3, progress: 20, desc: 'Minor bridge collapse. Road blocked. No casualties. PWD on site.' }
];

const MOCK_OFFICERS = [
  { name: 'Raj Kumar', id: 'TN-OFF-1042', dept: 'Municipal Corporation', cases: 23, status: 'Active', joined: '2021-04-12' },
  { name: 'Priya Sundaram', id: 'TN-OFF-0891', dept: 'CMWSSB', cases: 18, status: 'Active', joined: '2022-08-01' },
  { name: 'Murugan K.', id: 'TN-OFF-0654', dept: 'TANGEDCO', cases: 31, status: 'Active', joined: '2019-11-15' },
  { name: 'Lakshmi V.', id: 'TN-OFF-1123', dept: 'Education', cases: 14, status: 'Active', joined: '2023-02-28' },
  { name: 'Selvam A.', id: 'TN-OFF-0432', dept: 'Revenue', cases: 27, status: 'On Leave', joined: '2018-07-03' },
  { name: 'Kavitha R.', id: 'TN-OFF-0987', dept: 'Transport', cases: 19, status: 'Active', joined: '2022-01-10' },
  { name: 'Dr. Senthil', id: 'TN-OFF-0321', dept: 'Health', cases: 35, status: 'Active', joined: '2017-09-20' },
  { name: 'Arjun M.', id: 'TN-OFF-1201', dept: 'Agriculture', cases: 11, status: 'Inactive', joined: '2024-06-15' },
  { name: 'Ganesan P.', id: 'TN-OFF-0567', dept: 'Environment', cases: 22, status: 'Active', joined: '2020-03-07' },
  { name: 'Sundaram R.', id: 'TN-OFF-0789', dept: 'Labour', cases: 16, status: 'Active', joined: '2021-12-01' }
];

const MOCK_AILOGS = [
  { q: 'Summarize escalated complaints in Municipal Corporation last 30 days', model: 'Claude 3.5 Sonnet', time: '10:42 AM', tokens: 1240, user: 'admin' },
  { q: 'Generate monthly report for Health department', model: 'Claude 3 Opus', time: '09:15 AM', tokens: 3820, user: 'admin' },
  { q: 'Identify patterns in CMWSSB water supply complaints', model: 'Claude 3.5 Sonnet', time: '08:33 AM', tokens: 987, user: 'admin' }
];

const MOCK_NOTIFICATIONS = [
  { icon: 'siren', iconClass: 'red', title: 'New Emergency: Flash Flood – Cuddalore', body: 'Severity: Critical. 3 villages evacuated.', time: '2 min ago', unread: true },
  { icon: 'alert-triangle', iconClass: 'gold', title: 'Complaint Escalated: AI-TN-1005', body: 'Medicine shortage at PHC Villupuram escalated to Commissioner.', time: '18 min ago', unread: true },
  { icon: 'clipboard', iconClass: 'blue', title: 'New Complaint Registered', body: 'Complaint AI-TN-1002 (Water Board) logged.', time: '1 hr ago', unread: true }
];

// Helper to initialize local storage database with mock datasets
export function initDB() {
  if (!localStorage.getItem('tvk_initialized')) {
    localStorage.setItem('tvk_complaints', JSON.stringify(MOCK_COMPLAINTS));
    localStorage.setItem('tvk_departments', JSON.stringify(MOCK_DEPARTMENTS));
    localStorage.setItem('tvk_emergencies', JSON.stringify(MOCK_EMERGENCIES));
    localStorage.setItem('tvk_officers', JSON.stringify(MOCK_OFFICERS));
    localStorage.setItem('tvk_ailogs', JSON.stringify(MOCK_AILOGS));
    localStorage.setItem('tvk_notifications', JSON.stringify(MOCK_NOTIFICATIONS));
    localStorage.setItem('tvk_initialized', 'true');
  }
}

// Event dispatcher to notify other components/tabs of database changes
function notifyDBChange() {
  window.dispatchEvent(new CustomEvent('tvk_db_update'));
  // Trigger storage event so other tabs sync too
  localStorage.setItem('tvk_last_sync_time', Date.now().toString());
}

export const db = {
  getComplaints() {
    initDB();
    return JSON.parse(localStorage.getItem('tvk_complaints') || '[]');
  },
  
  saveComplaint(complaint) {
    const complaints = this.getComplaints();
    const newId = `AI-TN-${1000 + complaints.length + 1}`;
    const newComplaint = {
      id: newId,
      date: new Date().toISOString().split('T')[0],
      status: 'New',
      ...complaint
    };
    
    complaints.unshift(newComplaint);
    localStorage.setItem('tvk_complaints', JSON.stringify(complaints));
    
    // Add default notification
    this.addNotification({
      icon: 'clipboard',
      iconClass: 'blue',
      title: `New Complaint Registered: ${newId}`,
      body: `Routed to ${complaint.dept} with priority: ${complaint.sev || 'Medium'}`,
      time: 'Just now',
      unread: true
    });
    
    notifyDBChange();
    return newComplaint;
  },

  updateComplaint(id, updates) {
    const complaints = this.getComplaints();
    const index = complaints.findIndex(c => c.id === id);
    if (index !== -1) {
      const oldStatus = complaints[index].status;
      complaints[index] = { ...complaints[index], ...updates };
      const newStatus = complaints[index].status;
      localStorage.setItem('tvk_complaints', JSON.stringify(complaints));

      // Admin notification
      this.addNotification({
        icon: 'check-circle',
        iconClass: 'green',
        title: `Complaint ${id} Updated`,
        body: `Status changed from ${oldStatus} to ${newStatus}`,
        time: 'Just now',
        unread: true
      });

      // User-facing notification about their complaint status change
      const statusMessages = {
        'New': 'Your complaint has been received and is under review.',
        'In Progress': 'Field officer has been assigned. Work is now in progress.',
        'Escalated': 'Your complaint has been escalated to senior authorities for faster resolution.',
        'Resolved': 'Your complaint has been resolved successfully!'
      };
      this.addNotification({
        icon: newStatus === 'Resolved' ? 'check-circle' : newStatus === 'Escalated' ? 'alert-triangle' : 'siren',
        iconClass: newStatus === 'Resolved' ? 'green' : 'gold',
        title: `Complaint ${id}: ${newStatus}`,
        body: statusMessages[newStatus] || `Status updated to ${newStatus}`,
        time: 'Just now',
        unread: true
      });

      notifyDBChange();
      return complaints[index];
    }
    return null;
  },

  getDepartments() {
    initDB();
    return JSON.parse(localStorage.getItem('tvk_departments') || '[]');
  },

  getEmergencies() {
    initDB();
    return JSON.parse(localStorage.getItem('tvk_emergencies') || '[]');
  },

  getOfficers() {
    initDB();
    return JSON.parse(localStorage.getItem('tvk_officers') || '[]');
  },

  getAILogs() {
    initDB();
    return JSON.parse(localStorage.getItem('tvk_ailogs') || '[]');
  },

  saveAILog(queryText, model = 'Claude 3.5 Sonnet') {
    const logs = this.getAILogs();
    const newLog = {
      q: queryText,
      model: model,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tokens: Math.floor(Math.random() * 2000) + 500,
      user: 'citizen'
    };
    logs.unshift(newLog);
    localStorage.setItem('tvk_ailogs', JSON.stringify(logs));
    notifyDBChange();
  },

  getNotifications() {
    initDB();
    return JSON.parse(localStorage.getItem('tvk_notifications') || '[]');
  },

  addNotification(notif) {
    const notifications = this.getNotifications();
    notifications.unshift(notif);
    localStorage.setItem('tvk_notifications', JSON.stringify(notifications));
    notifyDBChange();
  },

  markAllNotificationsRead() {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => ({ ...n, unread: false }));
    localStorage.setItem('tvk_notifications', JSON.stringify(updated));
    notifyDBChange();
  }
};
