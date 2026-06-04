import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutGrid, Building2, ClipboardList, AlertOctagon, Users, BarChart3, 
  FileSpreadsheet, Terminal, Bell, Settings, Search, RefreshCw, X, Check,
  ArrowRight, Moon, Sun, Play, Download
} from 'lucide-react';

export default function AdminApp() {
  const {
    complaints,
    departments,
    officers,
    emergencies,
    aiLogs,
    notifications,
    settings,
    supabaseConnected,
    supConnectionLog,
    updateComplaint,
    markAllRead,
    updateSettings,
    testSupabaseConnection
  } = useApp();

  const [activeTab, setActiveTab] = useState('dashboard');

  // Live Toast Notifications
  const [toasts, setToasts] = useState([]);
  const [prevComplaintIds, setPrevComplaintIds] = useState(new Set(complaints.map(c => c.id)));

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const currentIds = new Set(complaints.map(c => c.id));
    const newComplaints = complaints.filter(c => !prevComplaintIds.has(c.id));

    if (newComplaints.length > 0 && prevComplaintIds.size > 0) {
      newComplaints.forEach(c => {
        const toast = {
          id: `toast-${c.id}-${Date.now()}`,
          title: `New Grievance Routed`,
          body: `${c.id} → ${c.dept} (${c.sev})`,
          dept: c.dept,
          complaintId: c.id,
        };
        setToasts(prev => [...prev, toast]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, 5000);
      });
    }

    setPrevComplaintIds(currentIds);
  }, [complaints]);

  // Modals & Panels State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);

  // Filters State
  const [compSearch, setCompSearch] = useState('');
  const [compStatus, setCompStatus] = useState('');
  const [compDept, setCompDept] = useState('');
  const [compSev, setCompSev] = useState('');

  const [offSearch, setOffSearch] = useState('');
  const [offDept, setOffDept] = useState('');

  // ----------------------------------------------------
  // REAL-TIME SYNC LOGIC
  // ----------------------------------------------------
  const handleStatusChange = (id, newStatus) => {
    updateComplaint(id, { status: newStatus });
    if (selectedComplaint && selectedComplaint.id === id) {
      setSelectedComplaint(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleOfficerAssign = (id, officerName) => {
    const matchedOfficer = officers.find(o => o.name === officerName);
    updateComplaint(id, { 
      officer: officerName, 
      ph: matchedOfficer ? matchedOfficer.ph || '9876543210' : '9876543210'
    });
    if (selectedComplaint && selectedComplaint.id === id) {
      setSelectedComplaint(prev => ({ 
        ...prev, 
        officer: officerName,
        ph: matchedOfficer ? matchedOfficer.ph || '9876543210' : '9876543210'
      }));
    }
  };

  // ----------------------------------------------------
  // CHART BUILDERS (PURE CSS BARS)
  // ----------------------------------------------------
  const renderDepartmentLoadChart = () => {
    // Group complaints by department
    const counts = {};
    departments.forEach(d => {
      counts[d.name] = complaints.filter(c => c.dept === d.name).length;
    });

    const maxCount = Math.max(...Object.values(counts), 1);

    return (
      <div className="admin-chart-box">
        {departments.slice(0, 7).map(d => {
          const count = counts[d.name] || 0;
          const percentage = Math.round((count / maxCount) * 80) + 10; // offset for styling
          return (
            <div key={d.id} className="admin-bar-wrap">
              <span className="admin-bar-val">{count}</span>
              <div 
                className="admin-bar" 
                style={{ height: `${percentage}%` }}
              />
              <span className="admin-bar-lbl">{d.name.split(' ')[0]}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // ----------------------------------------------------
  // NAVIGATION ROUTING
  // ----------------------------------------------------
  const handleNav = (tab) => {
    setActiveTab(tab);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="page-fade-enter-active">
            <div className="admin-stats-row">
              <div className="admin-stat-card-desktop red">
                <div className="admin-stat-label-desktop">Total Grievances</div>
                <div className="admin-stat-val-desktop" style={{ color: 'var(--red)' }}>{complaints.length}</div>
                <div className="admin-stat-sub-desktop">↑ 12% vs last month</div>
              </div>
              <div className="admin-stat-card-desktop blue">
                <div className="admin-stat-label-desktop">New Cases</div>
                <div className="admin-stat-val-desktop" style={{ color: 'var(--info)' }}>{complaints.filter(c => c.status === 'New').length}</div>
                <div className="admin-stat-sub-desktop">Pending routing/review</div>
              </div>
              <div className="admin-stat-card-desktop orange">
                <div className="admin-stat-label-desktop">In Progress</div>
                <div className="admin-stat-val-desktop" style={{ color: 'var(--warning)' }}>{complaints.filter(c => c.status === 'In Progress').length}</div>
                <div className="admin-stat-sub-desktop">Assigned to field staff</div>
              </div>
              <div className="admin-stat-card-desktop green">
                <div className="admin-stat-label-desktop">Resolved</div>
                <div className="admin-stat-val-desktop" style={{ color: 'var(--success)' }}>{complaints.filter(c => c.status === 'Resolved').length}</div>
                <div className="admin-stat-sub-desktop">SLA criteria satisfied</div>
              </div>
            </div>

            <div className="admin-grid-2">
              <div className="admin-card">
                <div className="admin-card-header">
                  <div className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger-dark)' }}>
                    <AlertOctagon size={18} /> Active Emergency Scenarios
                  </div>
                </div>
                <div>
                  {emergencies.slice(0, 2).map(e => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--g200)' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700 }}>🚨 {e.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--g400)', marginTop: '3px' }}>{e.loc} · Deployed: {e.teams} teams</div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--danger-dark)' }}>{e.progress}% Contained</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <div className="admin-card-title">Grievance Distribution by Department</div>
                </div>
                <div>
                  {renderDepartmentLoadChart()}
                </div>
              </div>
            </div>
          </div>
        );

      case 'departments':
        return (
          <div className="page-fade-enter-active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Rajdhani', fontSize: '20px', fontWeight: 700 }}>Department Directory</h2>
              <span style={{ fontSize: '13px', color: 'var(--g400)' }}>{departments.length} Operational</span>
            </div>

            <div className="admin-dept-grid">
              {departments.map(d => {
                const count = complaints.filter(c => c.dept === d.name).length;
                return (
                  <div key={d.id} className="admin-dept-card" onClick={() => setSelectedDept(d)}>
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>🏢</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', fontFamily: 'Rajdhani, sans-serif' }}>{d.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--g400)' }}>
                      📝 {count} cases&nbsp;&nbsp;·&nbsp;&nbsp;👨‍💼 {d.officers} officers
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'complaints':
        const filteredComplaints = complaints.filter(c => {
          const matchesSearch = c.title.toLowerCase().includes(compSearch.toLowerCase()) || c.id.toLowerCase().includes(compSearch.toLowerCase());
          const matchesStatus = compStatus === '' || c.status === compStatus;
          const matchesDept = compDept === '' || c.dept === compDept;
          const matchesSev = compSev === '' || c.sev === compSev;
          return matchesSearch && matchesStatus && matchesDept && matchesSev;
        });

        return (
          <div className="page-fade-enter-active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Rajdhani', fontSize: '20px', fontWeight: 700 }}>Grievance Board</h2>
              <span style={{ fontSize: '13px', color: 'var(--g400)' }}>{filteredComplaints.length} matched</span>
            </div>

            <div className="admin-filter-row">
              <input 
                type="text" 
                value={compSearch} 
                onChange={(e) => setCompSearch(e.target.value)}
                placeholder="Search ID / Keyword..." 
              />
              <select value={compStatus} onChange={(e) => setCompStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Escalated">Escalated</option>
                <option value="Resolved">Resolved</option>
              </select>
              <select value={compDept} onChange={(e) => setCompDept(e.target.value)}>
                <option value="">All Depts</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name.split(' ')[0]}</option>)}
              </select>
              <select value={compSev} onChange={(e) => setCompSev(e.target.value)}>
                <option value="">All Severity</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
                <option value="SOS">SOS</option>
              </select>
            </div>

            {filteredComplaints.length > 0 ? (
              <div className="admin-data-table-wrap">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Department</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map(c => (
                      <tr key={c.id} onClick={() => setSelectedComplaint(c)} style={{ cursor: 'pointer' }}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--gold-dark)' }}>{c.id}</span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{c.title}</td>
                        <td>{c.dept}</td>
                        <td>
                          <span className={`badge badge-${c.sev === 'Low' ? 'resolved' : c.sev === 'Medium' ? 'progress' : c.sev === 'High' ? 'escalated' : 'critical'}`}>{c.sev}</span>
                        </td>
                        <td>
                          <span className={`badge badge-${c.status.toLowerCase().replace(/ /g, '-')}`}>{c.status}</span>
                        </td>
                        <td style={{ color: 'var(--g600)' }}>{c.location || 'Chennai Area'}</td>
                        <td style={{ color: 'var(--g400)', fontSize: '12px' }}>{c.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-no-results">No grievances matched.</div>
            )}
          </div>
        );

      case 'emergency':
        return (
          <div className="page-fade-enter-active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Rajdhani', fontSize: '20px', fontWeight: 700 }}>Emergency Control Center</h2>
              <span style={{ fontSize: '13px', color: 'var(--danger-dark)', fontWeight: 800 }}>{emergencies.filter(e => e.status === 'Active').length} Active</span>
            </div>

            <div className="admin-emergency-grid">
              {emergencies.map(e => (
                <div key={e.id} className="admin-card" style={{ borderLeft: '4px solid var(--danger)', marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>🚨 {e.title}</div>
                    <span className="badge badge-critical">{e.status}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--g400)', marginBottom: '10px' }}>Location: {e.loc} · Time logged: {e.time}</div>
                  <div style={{ fontSize: '13px', color: 'var(--g600)', lineHeight: 1.5, marginBottom: '14px' }}>{e.desc}</div>
                  
                  <div style={{ background: 'var(--g100)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--g400)', marginBottom: '6px' }}>
                      <span>Rescue Containment</span>
                      <span style={{ fontWeight: 800 }}>{e.progress}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--g200)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--red) 0%, var(--gold) 100%)', width: `${e.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'officers':
        const filteredOfficers = officers.filter(o => {
          const matchesSearch = o.name.toLowerCase().includes(offSearch.toLowerCase());
          const matchesDept = offDept === '' || o.dept === offDept;
          return matchesSearch && matchesDept;
        });

        return (
          <div className="page-fade-enter-active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Rajdhani', fontSize: '20px', fontWeight: 700 }}>Officers Roster</h2>
              <span style={{ fontSize: '13px', color: 'var(--g400)' }}>{filteredOfficers.length} active staff</span>
            </div>

            <div className="admin-filter-row">
              <input 
                type="text" 
                value={offSearch} 
                onChange={(e) => setOffSearch(e.target.value)}
                placeholder="Search officer name..." 
              />
              <select value={offDept} onChange={(e) => setOffDept(e.target.value)}>
                <option value="">All Depts</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name.split(' ')[0]}</option>)}
              </select>
            </div>

            <div className="admin-officer-grid">
              {filteredOfficers.map(o => (
                <div key={o.id} className="admin-card" style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: 0 }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--red-dark), var(--red))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '18px', flexShrink: 0 }}>
                    {o.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{o.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--gold-dark)', fontWeight: 600 }}>{o.id}</div>
                    <div style={{ fontSize: '12px', color: 'var(--g400)', marginTop: '3px' }}>Dept: {o.dept}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '20px', fontWeight: 800 }}>{o.cases}</div>
                    <div style={{ fontSize: '10px', color: 'var(--g400)', textTransform: 'uppercase' }}>Active Cases</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="page-fade-enter-active">
            <div className="admin-grid-3" style={{ marginBottom: '24px', textAlign: 'center' }}>
              <div className="admin-card" style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--red)' }}>94%</div>
                <div style={{ fontSize: '12px', color: 'var(--g400)', marginTop: '6px' }}>Resolve Rate</div>
              </div>
              <div className="admin-card" style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--warning)' }}>3.2d</div>
                <div style={{ fontSize: '12px', color: 'var(--g400)', marginTop: '6px' }}>Avg. SLA Duration</div>
              </div>
              <div className="admin-card" style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success)' }}>↑12%</div>
                <div style={{ fontSize: '12px', color: 'var(--g400)', marginTop: '6px' }}>Vs Last Month</div>
              </div>
            </div>

            <div className="admin-data-table-wrap">
              <div className="admin-card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--g200)' }}>
                <div className="admin-card-title">Top Performing Officers</div>
              </div>
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Officer</th>
                    <th>Resolved</th>
                    <th>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Dr. Senthil', dept: 'Health', count: 35 },
                    { name: 'Murugan K.', dept: 'TANGEDCO', count: 31 },
                    { name: 'Selvam A.', dept: 'Revenue', count: 27 },
                    { name: 'Raj Kumar', dept: 'Municipal', count: 23 }
                  ].map((o, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{o.name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--g400)' }}>{o.dept}</div>
                      </td>
                      <td>{o.count} cases</td>
                      <td><span className="badge badge-resolved"># {idx+1}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="page-fade-enter-active">
            <h2 style={{ fontFamily: 'Rajdhani', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Download Data Reports</h2>
            
            <div className="admin-report-list">
              {[
                { title: 'Monthly Complaint Report', desc: 'Breakdown of all registered grievances, SLA durations, and closures.', tag: 'June 2026' },
                { title: 'Department KPI Matrix', desc: 'Resolution speeds, backlog quotients, and rating reports.', tag: 'Q2 2026' },
                { title: 'AI Routing Logs Export', desc: 'Audit log of automated department routing accuracy and keywords.', tag: 'System Audits' }
              ].map((r, idx) => (
                <div key={idx} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 800 }}>{r.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--g400)', marginTop: '4px', lineHeight: 1.5 }}>{r.desc}</div>
                    <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'var(--g100)', marginTop: '8px', color: 'var(--g600)' }}>{r.tag}</span>
                  </div>
                  <button className="btn-secondary" onClick={() => alert(`Downloading ${r.title} CSV...`)} style={{ width: 'auto', padding: '12px', marginLeft: '16px' }}><Download size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'ailogs':
        return (
          <div className="page-fade-enter-active">
            <h2 style={{ fontFamily: 'Rajdhani', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>AI Query Logs</h2>
            <div className="admin-data-table-wrap">
              <div className="admin-card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--g200)' }}>
                <div className="admin-card-title">Classifier Activity History</div>
              </div>
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Query</th>
                    <th>Model</th>
                    <th>Time</th>
                    <th>Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {aiLogs.map((log, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>“{log.q}”</td>
                      <td style={{ color: 'var(--g600)' }}>{log.model}</td>
                      <td style={{ color: 'var(--g400)', fontSize: '12px' }}>{log.time}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{log.tokens}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="page-fade-enter-active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Rajdhani', fontSize: '20px', fontWeight: 700 }}>Admin Notifications</h2>
              <button className="btn btn-outline btn-sm" onClick={markAllRead} style={{ fontSize: '12px', border: '1px solid var(--g200)', padding: '6px 12px', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>Mark all read</button>
            </div>

            <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
              {notifications.map((n, idx) => (
                <div key={idx} style={{ padding: '14px 20px', borderBottom: '1px solid var(--g200)', display: 'flex', gap: '12px', background: n.unread ? 'rgba(200, 16, 46, 0.03)' : 'transparent' }}>
                  <div style={{ fontSize: '20px' }}>{n.icon === 'siren' ? '🚨' : n.icon === 'alert-triangle' ? '⚠️' : n.icon === 'check-circle' ? '✅' : '📋'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{n.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--g600)', marginTop: '3px', lineHeight: 1.5 }}>{n.body}</div>
                    <div style={{ fontSize: '11px', color: 'var(--g400)', marginTop: '5px' }}>{n.time}</div>
                  </div>
                  {n.unread && <div style={{ width: '8px', height: '8px', background: 'var(--red)', borderRadius: '50%', marginTop: '4px', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="page-fade-enter-active">
            <h2 style={{ fontFamily: 'Rajdhani', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>System Configuration</h2>
            
            <div className="admin-card" style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--g200)', paddingBottom: '10px', marginBottom: '12px' }}>Preference</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>Console Theme</div>
                  <div style={{ fontSize: '12px', color: 'var(--g400)' }}>Toggle dark/light background</div>
                </div>
                <div 
                  className={`toggle ${settings.darkMode ? 'on' : ''}`} 
                  onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                  style={{ background: settings.darkMode ? 'var(--red)' : 'var(--g300)' }}
                >
                  <div style={{ transform: settings.darkMode ? 'translateX(20px)' : 'none' }} />
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--g200)', paddingBottom: '10px', marginBottom: '12px' }}>Supabase Live Sync</div>
              <div style={{ background: 'var(--g100)', border: '1px solid var(--g200)', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <Terminal size={22} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>Supabase Database</div>
                  <div style={{ fontSize: '11px', color: 'var(--g400)' }}>{supabaseConnected ? 'Live Connection active' : 'Offline demo mode'}</div>
                </div>
                <span className={`badge badge-${supabaseConnected ? 'resolved' : 'escalated'}`} style={{ fontSize: '10px' }}>
                  {supabaseConnected ? 'Connected' : 'Offline'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                <input 
                  type="text" 
                  className="admin-filter-row"
                  style={{ width: '100%', margin: 0, padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--g200)', fontSize: '13px', outline: 'none' }}
                  value={settings.supabaseUrl}
                  onChange={(e) => updateSettings({ supabaseUrl: e.target.value })}
                  placeholder="Supabase Project API URL" 
                />
                <input 
                  type="password" 
                  className="admin-filter-row"
                  style={{ width: '100%', margin: 0, padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--g200)', fontSize: '13px', outline: 'none' }}
                  value={settings.supabaseKey}
                  onChange={(e) => updateSettings({ supabaseKey: e.target.value })}
                  placeholder="Supabase Anon Key" 
                />
              </div>

              {supConnectionLog.length > 0 && (
                <div className="admin-sync-log" style={{ marginBottom: '14px' }}>
                  {supConnectionLog.map((log, idx) => (
                    <div key={idx}>{log}</div>
                  ))}
                </div>
              )}

              <button className="btn-secondary" style={{ width: 'auto', padding: '12px 20px' }} onClick={testSupabaseConnection}>⚡ Test Connection</button>
            </div>

            {/* LLM Routing Configuration */}
            <div className="admin-card" style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--g200)', paddingBottom: '10px', marginBottom: '12px' }}>AI Grievance Routing (LLM)</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--g200)' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>Enable LLM Routing</div>
                  <div style={{ fontSize: '12px', color: 'var(--g400)' }}>Use AI model when keyword confidence is low</div>
                </div>
                <div
                  className={`toggle ${settings.llmEnabled ? 'on' : ''}`}
                  onClick={() => updateSettings({ llmEnabled: !settings.llmEnabled })}
                  style={{ background: settings.llmEnabled ? 'var(--red)' : 'var(--g300)' }}
                >
                  <div style={{ transform: settings.llmEnabled ? 'translateX(20px)' : 'none' }} />
                </div>
              </div>

              <div style={{ padding: '14px 0', borderBottom: '1px solid var(--g200)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Keyword Confidence Threshold</div>
                <div style={{ fontSize: '12px', color: 'var(--g400)', marginBottom: '10px' }}>Trigger LLM fallback when keyword confidence is below {settings.llmThreshold}%</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={settings.llmThreshold}
                    onChange={(e) => updateSettings({ llmThreshold: parseInt(e.target.value, 10) })}
                    style={{ flex: 1, accentColor: 'var(--red)' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '36px', textAlign: 'right' }}>{settings.llmThreshold}%</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                <input
                  type="text"
                  style={{ width: '100%', margin: 0, padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--g200)', fontSize: '13px', outline: 'none' }}
                  value={settings.llmBaseUrl}
                  onChange={(e) => updateSettings({ llmBaseUrl: e.target.value })}
                  placeholder="API Base URL (e.g. https://api.openai.com/v1)"
                />
                <input
                  type="text"
                  style={{ width: '100%', margin: 0, padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--g200)', fontSize: '13px', outline: 'none' }}
                  value={settings.llmModel}
                  onChange={(e) => updateSettings({ llmModel: e.target.value })}
                  placeholder="Model name (e.g. gpt-4o-mini, llama-3.1-8b)"
                />
                <input
                  type="password"
                  style={{ width: '100%', margin: 0, padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--g200)', fontSize: '13px', outline: 'none' }}
                  value={settings.llmApiKey}
                  onChange={(e) => updateSettings({ llmApiKey: e.target.value })}
                  placeholder="API Key"
                />
              </div>

              <div style={{ marginTop: '14px', padding: '12px', background: 'var(--g100)', borderRadius: '10px', fontSize: '12px', color: 'var(--g600)', lineHeight: 1.6 }}>
                <strong>Supported Providers:</strong> OpenAI, Groq, Fireworks, Any OpenAI-compatible endpoint. Uses keyword matching for common issues (&lt;10ms) and falls back to LLM for ambiguous or complex descriptions.
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { key: 'departments', label: 'Departments', icon: Building2 },
    { key: 'complaints', label: 'Grievances', icon: ClipboardList, badge: complaints.filter(c => c.status === 'New').length },
    { key: 'emergency', label: 'Emergency', icon: AlertOctagon },
    { key: 'officers', label: 'Officers', icon: Users },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { key: 'ailogs', label: 'AI Logs', icon: Terminal },
    { key: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.filter(n => n.unread).length },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  const tabTitles = {
    dashboard: 'Admin Console',
    departments: 'Department Directory',
    complaints: 'Grievance Board',
    emergency: 'Emergency Control Center',
    officers: 'Officers Roster',
    analytics: 'KPIs & Leaderboards',
    reports: 'Download Data Reports',
    ailogs: 'AI Query Logs',
    notifications: 'Admin Notifications',
    settings: 'System Configuration',
  };

  return (
    <div className="admin-desktop-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-brand-icon">TN</div>
          <div>
            <div className="admin-sidebar-brand-text">TN GOV COMMAND</div>
            <div className="admin-sidebar-brand-sub">Administrative Panel</div>
          </div>
        </div>

        <div className="admin-sidebar-section">Main Menu</div>
        <div className="admin-sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <div
                key={item.key}
                className={`admin-sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNav(item.key)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge > 0 && <div className="admin-sidebar-badge">{item.badge}</div>}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-topbar-title">{tabTitles[activeTab] || 'Dashboard'}</div>
          <div className="admin-topbar-right">
            <div className="admin-topbar-search">
              <Search size={16} style={{ color: 'var(--g400)', flexShrink: 0 }} />
              <input type="text" placeholder="Search across grievances..." readOnly />
            </div>
            <div className="admin-topbar-icon" onClick={() => handleNav('notifications')}>
              <Bell size={18} />
              {notifications.filter(n => n.unread).length > 0 && (
                <div className="admin-topbar-icon-badge">{notifications.filter(n => n.unread).length}</div>
              )}
            </div>
            <div className="admin-topbar-icon">
              <Settings size={18} />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="admin-content">
          {renderActiveTab()}
        </main>
      </div>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="admin-modal-overlay-desktop" onClick={() => setSelectedComplaint(null)}>
          <div className="admin-modal-desktop" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-hdr-desktop">
              <h3 className="admin-modal-title-desktop">Grievance Board: {selectedComplaint.id}</h3>
              <div className="admin-modal-close-desktop" onClick={() => setSelectedComplaint(null)}><X size={16} /></div>
            </div>
            
            <div className="admin-modal-body-desktop">
              <div style={{ background: 'var(--g100)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red)', fontFamily: 'monospace', background: 'var(--red-light)', padding: '3px 10px', borderRadius: '6px' }}>{selectedComplaint.id}</span>
                  <span className={`badge badge-${selectedComplaint.status.toLowerCase().replace(/ /g, '-')}`}>{selectedComplaint.status}</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800 }}>{selectedComplaint.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--g600)', marginTop: '3px' }}>Area: {selectedComplaint.location} · Filed: {selectedComplaint.date}</div>
                <div style={{ fontSize: '13px', color: 'var(--g800)', marginTop: '12px', borderTop: '1px solid var(--g200)', paddingTop: '12px', lineHeight: 1.6 }}>
                  <strong>Description:</strong><br />{selectedComplaint.desc}
                </div>
              </div>

              <div className="frow">
                <label className="flabel">Assign Field Officer</label>
                <select 
                  className="fsel"
                  value={selectedComplaint.officer || ''}
                  onChange={(e) => handleOfficerAssign(selectedComplaint.id, e.target.value)}
                >
                  <option value="">-- Unassigned --</option>
                  {officers.filter(o => o.dept === selectedComplaint.dept).map(o => (
                    <option key={o.id} value={o.name}>{o.name} ({o.status})</option>
                  ))}
                </select>
              </div>

              <div className="frow">
                <label className="flabel">Set Status</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['New', 'In Progress', 'Escalated', 'Resolved'].map(st => (
                    <button 
                      key={st}
                      className="btn-secondary" 
                      onClick={() => handleStatusChange(selectedComplaint.id, st)}
                      style={{ 
                        flex: '1 0 auto', 
                        minWidth: '120px',
                        fontSize: '12px', 
                        padding: '10px', 
                        background: selectedComplaint.status === st ? 'var(--red)' : 'var(--g100)',
                        color: selectedComplaint.status === st ? 'white' : 'var(--g600)',
                        borderColor: selectedComplaint.status === st ? 'var(--red)' : 'var(--g200)'
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Detail Modal */}
      {selectedDept && (
        <div className="admin-modal-overlay-desktop" onClick={() => setSelectedDept(null)}>
          <div className="admin-modal-desktop" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-hdr-desktop">
              <h3 className="admin-modal-title-desktop">Department Insight</h3>
              <div className="admin-modal-close-desktop" onClick={() => setSelectedDept(null)}><X size={16} /></div>
            </div>

            <div className="admin-modal-body-desktop">
              <div style={{ background: 'linear-gradient(135deg, var(--red-dark) 0%, var(--red-deep) 100%)', color: 'white', padding: '24px', textAlign: 'center', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏢</div>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>{selectedDept.name}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px' }}>Tamil Nadu Secretariat</div>
              </div>

              <div className="admin-grid-3" style={{ marginBottom: '20px' }}>
                <div className="admin-card" style={{ textAlign: 'center', padding: '16px', marginBottom: 0 }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--red)' }}>{complaints.filter(c => c.dept === selectedDept.name).length}</div>
                  <div style={{ fontSize: '11px', color: 'var(--g400)', marginTop: '4px' }}>Active Grievances</div>
                </div>
                <div className="admin-card" style={{ textAlign: 'center', padding: '16px', marginBottom: 0 }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gold-dark)' }}>{officers.filter(o => o.dept === selectedDept.name).length}</div>
                  <div style={{ fontSize: '11px', color: 'var(--g400)', marginTop: '4px' }}>Officers Enlisted</div>
                </div>
                <div className="admin-card" style={{ textAlign: 'center', padding: '16px', marginBottom: 0 }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success)' }}>{selectedDept.resolveRate}%</div>
                  <div style={{ fontSize: '11px', color: 'var(--g400)', marginTop: '4px' }}>Close SLA Rate</div>
                </div>
              </div>

              <div className="sec-label" style={{ margin: '0 0 10px' }}>Staff Roster</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {officers.filter(o => o.dept === selectedDept.name).map(o => (
                  <div key={o.id} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', marginBottom: 0 }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{o.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--g400)' }}>Cases: {o.cases} cases</div>
                    </div>
                    <span className="badge badge-resolved">{o.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Toast Notifications */}
      <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div 
            key={t.id}
            className="admin-toast"
            style={{ 
              pointerEvents: 'auto',
              animation: 'toastSlideIn 0.35s ease forwards',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--red-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)', fontSize: '16px', flexShrink: 0 }}>
                🔔
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--g800)', marginBottom: '2px' }}>{t.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--g600)' }}>{t.body}</div>
              </div>
              <div 
                onClick={() => removeToast(t.id)}
                style={{ cursor: 'pointer', color: 'var(--g400)', fontSize: '16px', lineHeight: 1, padding: '2px' }}
              >
                <X size={16} />
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'var(--red)', borderRadius: '0 0 12px 12px', animation: 'toastProgress 5s linear forwards' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
