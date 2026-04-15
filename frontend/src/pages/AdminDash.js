import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS = {
  superadmin: '#ff3c5a',
  admin:      '#ffb800',
  user:       '#00f5ff',
};

export default function AdminDash() {
  const { user: me }      = useAuth();
  const isSuperAdmin      = me?.role === 'superadmin';
  const [tab, setTab]     = useState('overview');
  const [stats,    setStats]    = useState(null);
  const [users,    setUsers]    = useState([]);
  const [search,   setSearch]   = useState('');
  const [security, setSecurity] = useState(null);
  const [scans,    setScans]    = useState(null);
  const [alerts,   setAlerts]   = useState(null);
  const [selUser,  setSelUser]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState({ text: '', type: '' });
  const [addForm,  setAddForm]  = useState({ name:'', email:'', password:'', role:'user' });

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const loadStats    = useCallback(async () => {
    try { const r = await adminAPI.getStats();        setStats(r.data);       } catch(e) { showMsg(e.response?.data?.detail || 'Failed', 'error'); }
  }, []);
  const loadUsers    = useCallback(async (q='') => {
    setLoading(true);
    try { const r = await adminAPI.getUsers(q);       setUsers(r.data.users); } catch(e) { showMsg(e.response?.data?.detail || 'Failed', 'error'); }
    finally { setLoading(false); }
  }, []);
  const loadSecurity = useCallback(async () => {
    try { const r = await adminAPI.getSecurity();     setSecurity(r.data);    } catch(e) { showMsg(e.response?.data?.detail || 'Failed', 'error'); }
  }, []);
  const loadAlerts   = useCallback(async () => {
    try { const r = await adminAPI.getBreachAlerts(); setAlerts(r.data);      }
    catch(e) { showMsg(e.response?.data?.detail || 'Access denied', 'error'); }
  }, []);

  useEffect(() => {
    if (tab === 'overview')      loadStats();
    if (tab === 'users')         loadUsers(search);
    if (tab === 'security')      loadSecurity();
    if (tab === 'breach_alerts') loadAlerts();
  }, [tab, loadStats, loadUsers, loadSecurity, loadAlerts, search]);

  const viewScans = async (u) => {
    setSelUser(u);
    try { const r = await adminAPI.getUserScans(u.id); setScans(r.data); setTab('reports'); }
    catch(e) { showMsg('Failed to load scans', 'error'); }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete "${u.name}"? Cannot be undone!`)) return;
    try { await adminAPI.deleteUser(u.id); showMsg(`${u.name} deleted`); loadUsers(search); }
    catch(e) { showMsg(e.response?.data?.detail || 'Failed', 'error'); }
  };

  const toggleBan = async (u) => {
    try { const r = await adminAPI.banUser(u.id); showMsg(r.data.message); loadUsers(search); }
    catch(e) { showMsg(e.response?.data?.detail || 'Failed', 'error'); }
  };

  const changeRole = async (u, role) => {
    try { const r = await adminAPI.changeRole(u.id, role); showMsg(r.data.message); loadUsers(search); }
    catch(e) { showMsg(e.response?.data?.detail || 'Failed', 'error'); }
  };

  const addUser = async (e) => {
    e.preventDefault();
    try { const r = await adminAPI.addUser(addForm); showMsg(r.data.message); setAddForm({ name:'', email:'', password:'', role:'user' }); loadUsers(''); }
    catch(e) { showMsg(e.response?.data?.detail || 'Failed', 'error'); }
  };

  // ── Breach Alert Delete ──────────────────────────────────────────────────
  const deleteAlert = async (id, name) => {
    if (!window.confirm(`Delete breach alert for "${name}"?`)) return;
    try {
      await adminAPI.deleteBreachAlert(id);
      showMsg(`Alert for ${name} deleted`);
      loadAlerts();
    } catch(e) { showMsg(e.response?.data?.detail || 'Failed', 'error'); }
  };

  const deleteAllAlerts = async () => {
    if (!window.confirm('Delete ALL breach alerts? This cannot be undone!')) return;
    try {
      const r = await adminAPI.deleteAllAlerts();
      showMsg(r.data.message);
      loadAlerts();
    } catch(e) { showMsg(e.response?.data?.detail || 'Failed', 'error'); }
  };

  const getBadge = (label) => `badge badge-${label?.toLowerCase()}`;

  const TABS = [
    { id:'overview',       label:'📊 OVERVIEW' },
    { id:'users',          label:'👥 USERS' },
    { id:'reports',        label:'📜 SCAN REPORTS' },
    { id:'security',       label:'🚨 SECURITY' },
    { id:'adduser',        label:'➕ ADD USER' },
    ...(isSuperAdmin ? [{ id:'breach_alerts', label:'🔴 BREACH ALERTS' }] : []),
  ];


//Delete 
const deleteLog = async (id) => {
  try {
    await api.delete(`/api/admin/security/${id}`);
    loadSecurity(); // reload data
  } catch (err) {
    console.error(err);
    alert("Failed to delete log");
  }
};




  return (
    <div className="page-wide">
      <div className="page-title">// ADMIN PANEL</div>
      <div className="page-sub">logged in as {me?.name} [{me?.role}]</div>

      {msg.text && (
        <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:'1.5rem', flexWrap:'wrap' }}>
        {TABS.map(t => (
          <button key={t.id}
            className={`btn btn-sm ${tab === t.id ? (t.id === 'breach_alerts' ? 'btn-danger' : 'btn-violet') : ''}`}
            style={{ width:'auto' }}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && stats && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,minmax(0,1fr))' }}>
            {[
              { icon:'👥', val:stats.total_users,    name:'TOTAL USERS'  },
              { icon:'🔍', val:stats.total_scans,    name:'TOTAL SCANS'  },
              { icon:'⚠️', val:stats.total_breached, name:'BREACHED'     },
              { icon:'🚫', val:stats.total_banned,   name:'BANNED USERS' },
            ].map(s => (
              <div className="stat-card" key={s.name}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-val">{s.val}</div>
                <div className="stat-name">{s.name}</div>
              </div>
            ))}
          </div>
          {stats.distribution && Object.keys(stats.distribution).length > 0 && (
            <div className="panel" style={{ marginTop:'1.5rem' }}>
              <div className="page-title" style={{ fontSize:12, marginBottom:'1rem' }}>// STRENGTH DISTRIBUTION</div>
              {Object.entries(stats.distribution).map(([label, count]) => {
                const colors = { Strong:'#00f5ff', Medium:'#ffb800', Weak:'#ff3c5a' };
                const pct = Math.round((count / (stats.total_scans || 1)) * 100);
                return (
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:10, width:70, color:colors[label] }}>{label.toUpperCase()}</span>
                    <div style={{ flex:1, height:6, background:'var(--bg-deep)', borderRadius:3, overflow:'hidden', border:'1px solid var(--border)' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:colors[label], borderRadius:3 }} />
                    </div>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-secondary)', width:70, textAlign:'right' }}>{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── USERS ── */}
      {tab === 'users' && (
        <>
          <div className="form-group">
            <input className="form-input" placeholder="[ search by name or email... ]"
              value={search} onChange={e => { setSearch(e.target.value); loadUsers(e.target.value); }} />
          </div>
          {loading && <div className="loading-bar"><div className="loading-fill" /></div>}
          <div style={{ marginBottom:8, fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-secondary)' }}>{users.length} users found</div>
          {users.map(u => (
            <div className="history-card" key={u.id}>
              <div className="hc-row">
                <span style={{ fontFamily:'var(--font-mono)', fontSize:14, color:ROLE_COLORS[u.role]||'#888', fontWeight:700 }}>{u.name}</span>
                <span className="badge" style={{ background:'transparent', border:`1px solid ${ROLE_COLORS[u.role]}`, color:ROLE_COLORS[u.role] }}>{u.role.toUpperCase()}</span>
                {!u.is_active && <span className="badge badge-weak">BANNED</span>}
                <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', marginLeft:'auto' }}>{u.scan_count} scans</span>
              </div>
              <div className="hc-meta" style={{ marginBottom:10 }}>
                <span>📧 {u.email}</span>
                <span>🕐 {u.created_at}</span>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <button className="btn btn-sm" onClick={() => viewScans(u)}>📜 Scans</button>
                {/* <button className={`btn btn-sm ${u.is_active ? 'btn-danger':''}`} onClick={() => toggleBan(u)} disabled={u.id===me?.id}>
                  {u.is_active ? '🚫 Ban':'✅ Unban'}
                </button>
                <select style={{ background:'var(--bg-deep)', border:'1px solid var(--border)', color:'var(--text-primary)', borderRadius:'var(--radius)', padding:'6px 10px', fontFamily:'var(--font-display)', fontSize:9, cursor:'pointer' }}
                  value={u.role} onChange={e => changeRole(u, e.target.value)} disabled={u.id===me?.id}>
                  <option value="user">USER</option>
                  <option value="admin">ADMIN</option>
                  <option value="superadmin">SUPERADMIN</option>
                </select>
                <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u)} disabled={u.id===me?.id}>🗑️ Delete</button> */}
                
                  {u.role === 'user' && (
                  <>
                  <button 
                    className={`btn btn-sm ${u.is_active ? 'btn-danger':''}`} 
                    onClick={() => toggleBan(u)} 
                    disabled={u.id===me?.id}
                  >
                    {u.is_active ? '🚫 Ban':'✅ Unban'}
                  </button>

                    {/* <select 
                      style={{ 
                        background:'var(--bg-deep)', 
                        border:'1px solid var(--border)', 
                        color:'var(--text-primary)', 
                        borderRadius:'var(--radius)', 
                        padding:'6px 10px', 
                        fontFamily:'var(--font-display)', 
                        fontSize:9, 
                        cursor:'pointer' 
                      }}
                      value={u.role} 
                      onChange={e => changeRole(u, e.target.value)} 
                      disabled={u.id===me?.id}
                    >
                      <option value="user">USER</option>
                      <option value="admin">ADMIN</option>
                      <option value="superadmin">SUPERADMIN</option>
                    </select> */}

                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => deleteUser(u)} 
                      disabled={u.id===me?.id}
                    >
                      🗑️ Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {users.length === 0 && !loading && <div className="empty-state"><div className="empty-icon">👥</div><div className="empty-text">// no users found</div></div>}
        </>
      )}

      {/* ── SCAN REPORTS ── */}
      {tab === 'reports' && (
        <>
          {selUser ? (
            <>
              <div style={{ marginBottom:'1rem', fontFamily:'var(--font-mono)', fontSize:13 }}>
                Scans for: <span style={{ color:'var(--cyan)' }}>{selUser.name}</span>
                <button className="btn btn-sm" style={{ marginLeft:12 }} onClick={() => { setSelUser(null); setScans(null); }}>← Back</button>
              </div>
              {scans?.items?.length === 0 && <div className="empty-state"><div className="empty-text">// no scans found</div></div>}
              {scans?.items?.map(r => (
                <div className="history-card" key={r.id}>
                  <div className="hc-row">
                    <span className="hc-score">{r.rule_score}/100</span>
                    <span className={getBadge(r.rule_label)}>{r.rule_label}</span>
                    <span className={getBadge(r.ml_label)}>ML: {r.ml_label}</span>
                    {r.is_breached === true  && <span className="badge badge-weak">BREACHED</span>}
                    {r.is_breached === false && <span className="badge badge-strong">CLEAN</span>}
                  </div>
                  <div className="hc-meta">
                    <span>entropy: {r.entropy}b</span>
                    <span>confidence: {r.ml_confidence}%</span>
                    {r.breach_count != null && <span>breach: {r.breach_count?.toLocaleString()}x</span>}
                    <span className="hc-time">{r.scanned_at}</span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="empty-state"><div className="empty-icon">📜</div><div className="empty-text">// go to USERS tab → click "Scans" on any user</div></div>
          )}
        </>
      )}

      {/* ── SECURITY ──
      {tab === 'security' && security && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:'1.5rem' }}>
            <div className="stat-card"><div className="stat-icon">🚨</div><div className="stat-val" style={{ color:'var(--red)' }}>{security.flagged_count}</div><div className="stat-name">FLAGGED</div></div>
            <div className="stat-card"><div className="stat-icon">❌</div><div className="stat-val" style={{ color:'var(--amber)' }}>{security.failed_logs?.length}</div><div className="stat-name">FAILED LOGINS</div></div>
          </div>
          {security.flagged_logs?.length > 0 && (
            <div className="panel" style={{ marginBottom:'1.5rem' }}>
              <div className="page-title" style={{ fontSize:12, marginBottom:'1rem', color:'var(--red)' }}>🚨 FLAGGED ACTIVITY</div>
              {security.flagged_logs.map(log => (
                <div className="history-card" key={log.id}>
                  <div className="hc-row">
                    <span className="badge badge-weak">FLAGGED</span>
                    <span className={`badge ${log.status==='success'?'badge-strong':'badge-weak'}`}>{log.status?.toUpperCase()}</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--cyan)' }}>{log.ip_address}</span>
                  </div>
                  <div className="hc-meta"><span>{log.user_agent?.slice(0,60)}...</span><span className="hc-time">{log.attempt_at}</span></div>
                </div>
              ))}
            </div>
          )}
          <div className="panel">
            <div className="page-title" style={{ fontSize:12, marginBottom:'1rem', color:'var(--amber)' }}>❌ RECENT FAILED LOGINS</div>
            {security.failed_logs?.map(log => (
              <div className="history-card" key={log.id}>
                <div className="hc-row">
                  <span className="badge badge-weak">FAILED</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--cyan)' }}>{log.ip_address}</span>
                </div>
                <div className="hc-meta"><span>{log.user_agent?.slice(0,60)}...</span><span className="hc-time">{log.attempt_at}</span></div>
              </div>
            ))}
          </div>
        </>
      )} */}

     ── SECURITY ──
{tab === 'security' && security && (
  <>
    {/* STATS */}
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:'1.5rem' }}>
      <div className="stat-card">
        <div className="stat-icon">🚨</div>
        <div className="stat-val" style={{ color:'var(--red)' }}>
          {security.flagged_count}
        </div>
        <div className="stat-name">FLAGGED</div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">❌</div>
        <div className="stat-val" style={{ color:'var(--amber)' }}>
          {security.failed_logs?.length}
        </div>
        <div className="stat-name">FAILED LOGINS</div>
      </div>
    </div>

    {/* FLAGGED LOGS */}
    {security.flagged_logs?.length > 0 && (
      <div className="panel" style={{ marginBottom:'1.5rem' }}>
        <div className="page-title" style={{ fontSize:12, marginBottom:'1rem', color:'var(--red)' }}>
          🚨 FLAGGED ACTIVITY
        </div>

        {security.flagged_logs.map(log => (
          <div className="history-card" key={log.id}>
            
            <div className="hc-row">
              <span className="badge badge-weak">FLAGGED</span>

              <span className={`badge ${log.status==='success' ? 'badge-strong':'badge-weak'}`}>
                {log.status?.toUpperCase()}
              </span>

              <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--cyan)' }}>
                {log.ip_address}
              </span>

              {/* DELETE BUTTON */}
              <button 
                className="btn btn-danger btn-sm"
                style={{ marginLeft:'auto' }}
                onClick={() => deleteLog(log.id)}
              >
                🗑️
              </button>
            </div>

            <div className="hc-meta">
              <span>{log.user_agent?.slice(0,60)}...</span>
              <span className="hc-time">{log.attempt_at}</span>
            </div>

          </div>
        ))}
      </div>
    )}

    {/* FAILED LOGS */}
    <div className="panel">
      <div className="page-title" style={{ fontSize:12, marginBottom:'1rem', color:'var(--amber)' }}>
        ❌ RECENT FAILED LOGINS
      </div>

      {security.failed_logs?.map(log => (
        <div className="history-card" key={log.id}>
          
          <div className="hc-row">
            <span className="badge badge-weak">FAILED</span>

            <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--cyan)' }}>
              {log.ip_address}
            </span>

            {/* DELETE BUTTON */}
            <button 
              className="btn btn-danger btn-sm"
              style={{ marginLeft:'auto' }}
              onClick={() => deleteLog(log.id)}
            >
              🗑️
            </button>
          </div>

          <div className="hc-meta">
            <span>{log.user_agent?.slice(0,60)}...</span>
            <span className="hc-time">{log.attempt_at}</span>
          </div>

        </div>
      ))}

      {security.failed_logs?.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-text">// no failed logins</div>
        </div>
      )}
    </div>
  </>
)}

      {/* ── ADD USER ── */}
      {tab === 'adduser' && (
        <div className="panel" style={{ maxWidth:480 }}>
          <div className="page-title" style={{ fontSize:13, marginBottom:'1.5rem' }}>➕ ADD NEW USER</div>
          <form onSubmit={addUser}>
            <div className="form-group"><label className="form-label">FULL NAME</label>
              <input className="form-input" placeholder="Enter full name" value={addForm.name} onChange={e => setAddForm({...addForm, name:e.target.value})} /></div>
            <div className="form-group"><label className="form-label">EMAIL</label>
              <input className="form-input" type="email" placeholder="Enter email" value={addForm.email} onChange={e => setAddForm({...addForm, email:e.target.value})} /></div>
            <div className="form-group"><label className="form-label">PASSWORD</label>
              <input className="form-input" type="password" placeholder="Min 8 characters" value={addForm.password} onChange={e => setAddForm({...addForm, password:e.target.value})} /></div>
            <div className="form-group"><label className="form-label">ROLE</label>
              <select className="form-input" value={addForm.role} onChange={e => setAddForm({...addForm, role:e.target.value})}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                {/* <option value="superadmin">Super Admin</option> */}
              </select></div>
            <button className="btn" type="submit">[ CREATE USER ]</button>
          </form>
        </div>
      )}

      {/* ── BREACH ALERTS — SUPER ADMIN ONLY ── */}
      {tab === 'breach_alerts' && isSuperAdmin && (
        <>
          {/* Header */}
          <div className="panel" style={{ marginBottom:'1.5rem', border:'1px solid rgba(255,60,90,0.4)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <span style={{ fontSize:20 }}>🔴</span>
                  <div className="page-title" style={{ color:'var(--red)', fontSize:13, marginBottom:0 }}>
                    BREACH IP TRACKING — SUPER ADMIN ONLY
                  </div>
                </div>
                <div className="page-sub" style={{ marginBottom:0 }}>
                  Users whose passwords were found in known data breaches.
                </div>
              </div>
              {/* Delete All Button */}
              {alerts?.total > 0 && (
                <button className="btn btn-danger btn-sm" onClick={deleteAllAlerts}>
                  🗑️ DELETE ALL
                </button>
              )}
            </div>
          </div>

          {alerts === null && <div className="loading-bar"><div className="loading-fill" /></div>}

          {alerts?.total === 0 && (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <div className="empty-text">// no breach alerts yet — all users are safe</div>
            </div>
          )}

          {alerts && alerts.total > 0 && (
            <>
              <div style={{ marginBottom:'1rem', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--red)' }}>
                ⚠ {alerts.total} breach alert{alerts.total > 1 ? 's' : ''} detected
              </div>

              {alerts.alerts.map(a => (
                <div key={a.id} className="history-card" style={{ borderColor:'rgba(255,60,90,0.3)' }}>
                  <div className="hc-row">
                    <span style={{ fontSize:16 }}>⚠️</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:14, color:'var(--red)', fontWeight:700 }}>
                      {a.user_name}
                    </span>
                    <span className="badge badge-weak">BREACHED</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-secondary)' }}>
                      found {a.breach_count?.toLocaleString()}x in leaks
                    </span>
                    {/* Delete Single Button */}
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ marginLeft:'auto' }}
                      onClick={() => deleteAlert(a.id, a.user_name)}
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="hc-meta">
                    <span>🌐 IP: <span style={{ color:'var(--cyan)', fontWeight:700 }}>{a.ip_address}</span></span>
                    <span>🔑 Hint: <span style={{ color:'var(--amber)' }}>{a.password_hint}</span></span>
                    <span className="hc-time">🕐 {a.detected_at}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
