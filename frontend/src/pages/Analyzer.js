import React, { useState, useRef } from 'react';
import { analyzeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STRENGTH_COLORS = {
  Strong: '#00f5ff', Medium: '#ffb800', Weak: '#ff3c5a'
};

const CHECK_LABELS = {
  min_length:   '>= 8 characters',
  good_length:  '>= 12 characters',
  great_length: '>= 16 characters',
  has_upper:    'uppercase letters',
  has_lower:    'lowercase letters',
  has_digit:    'numbers (0–9)',
  has_symbol:   'special characters',
  no_repeat:    'no repeated chars',
  no_common:    'no common patterns',
};

export default function Analyzer() {
  const { user }  = useAuth();
  const [pw,      setPw]      = useState('');
  const [show,    setShow]    = useState(false);
  const [result,  setResult]  = useState(null);
  const [breach,  setBreach]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [bLoading,setBL]      = useState(false);
  const [error,   setError]   = useState('');
  const debounce = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setPw(val);
    setBreach(null);
    setError('');
    clearTimeout(debounce.current);
    if (!val) { setResult(null); return; }
    debounce.current = setTimeout(() => analyze(val), 400);
  };

  const analyze = async (password) => {
    setLoading(true);
    try {
      const res = await analyzeAPI.analyze(password);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const checkBreach = async () => {
    if (!pw) return;
    setBL(true); setBreach(null);
    try {
      const res = await analyzeAPI.breach(pw, result?.scan_id);
      setBreach(res.data);
    } catch (err) {
      setBreach({ error: err.response?.data?.error || 'Breach check failed' });
    } finally {
      setBL(false);
    }
  };

  const rule  = result?.rule_based;
  const ml    = result?.ml;
  const color = rule ? STRENGTH_COLORS[rule.label] || '#888' : '#888';

  return (
    <div className="page">
      <div className="panel">
        <div className="page-title">// PASSWORD ANALYZER</div>
        <div className="page-sub">
          {user ? `logged in as ${user.name} — scans are saved` : 'guest mode — scans not saved'}
        </div>


        {/* Input */}
        <div className="form-group">
          <label className="form-label">ENTER PASSWORD</label>
          <div className="input-wrap">
            <input
              className="form-input"
              type={show ? 'text' : 'password'}
              placeholder="[ type password to analyze... ]"
              value={pw}
              onChange={handleChange}
              autoComplete="off"
              spellCheck="false"
            />
            <button type="button" className="eye-btn" onClick={() => setShow(s => !s)}>
              {show ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {error   && <div className="alert alert-error">⚠ {error}</div>}
        {loading && <div className="loading-bar"><div className="loading-fill" /></div>}

        {rule && (
          <>
            {/* Strength meter */}
            <div className="meter-wrap">
              <div className="meter-bar-bg">
                <div className="meter-bar-fill"
                  style={{ width: `${rule.score}%`, background: color, color }} />
              </div>
              <div className="meter-meta">
                <span className="meter-label" style={{ color }}>{rule.label.toUpperCase()}</span>
                <span className="meter-entropy">{rule.entropy} bits · {rule.crack_time}</span>
              </div>
            </div>

            {/* ML badge */}
            {ml && (
              <div className={`ml-badge ${ml.label.toLowerCase()}`}>
                <span>🤖</span>
                <span>ML MODEL: <strong>{ml.label.toUpperCase()}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    &nbsp;// {ml.confidence_pct} confidence
                  </span>
                </span>
              </div>
            )}

            {/* Metric cards */}
            <div className="metrics-row">
              {[
                { icon: '📏', val: pw.length,       name: 'LENGTH'  },
                { icon: '🔢', val: `${rule.entropy}b`, name: 'ENTROPY' },
                { icon: '⏱',  val: rule.crack_time, name: 'CRACK'   },
                { icon: '💯', val: `${rule.score}`,  name: 'SCORE'  },
              ].map(m => (
                <div className="metric-card" key={m.name}>
                  <span className="metric-icon">{m.icon}</span>
                  <span className="metric-val">{m.val}</span>
                  <span className="metric-name">{m.name}</span>
                </div>
              ))}
            </div>

            {/* Checklist */}
            <div className="check-list">
              {Object.entries(CHECK_LABELS).map(([key, label]) => (
                <div key={key} className={`check-item ${rule.checks[key] ? 'ok' : ''}`}>
                  <span className="check-dot" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Feedback */}
            {rule.feedback?.length > 0 && (
              <div className="feedback-box">
                <div className="feedback-title">// SUGGESTIONS</div>
                {rule.feedback.map((f, i) => (
                  <div className="feedback-item" key={i}>→ {f}</div>
                ))}
              </div>
            )}

            {/* Breach section */}
            <div className="divider" />
            <button className="btn" onClick={checkBreach} disabled={bLoading}>
              {bLoading
                ? '[ SCANNING HIBP DATABASE... ]'
                : '[ CHECK IF THIS PASSWORD WAS BREACHED ]'}
            </button>

            {breach && !breach.error && (
              <div className={`breach-result ${breach.is_breached ? 'pwned' : 'safe'}`}>
                <span style={{ fontSize: 18 }}>{breach.is_breached ? '⚠️' : '✅'}</span>
                <span>{breach.message}</span>
              </div>
            )}
            {breach?.error && (
              <div className="breach-result error">⚡ {breach.error}</div>
            )}
          </>
        )}

        {!pw && (
          <div className="empty-state">
            <div className="empty-icon">🔐</div>
            <div className="empty-text">// awaiting input...</div>
          </div>
        )}
      </div>
    </div>
  );
}
