import React, { useState, useEffect, useCallback } from 'react';
import { historyAPI } from '../services/api';

const COLORS = { Strong: '#00f5ff', Medium: '#ffb800', Weak: '#ff3c5a' };

export default function History() {
  const [data,    setData]    = useState(null);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await historyAPI.getHistory(p);
      setData(res.data); setPage(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const handleDelete = async (id) => {
    await historyAPI.deleteScan(id);
    load(page);
  };

  const getBadgeClass = (label) => `badge badge-${label?.toLowerCase()}`;

  return (
    <div className="page">
      <div className="page-title">// SCAN HISTORY</div>
      <div className="page-sub">your past password checks</div>

      {loading && <div className="loading-bar"><div className="loading-fill" /></div>}

      {data?.items?.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <div className="empty-text">// no records yet. analyze a password first.</div>
        </div>
      )}

      {data?.items?.map(r => (
        <div className="history-card" key={r.id}>
          <div className="hc-row">
            <span className="hc-score">{r.rule_score}/100</span>
            <span className={getBadgeClass(r.rule_label)}>{r.rule_label}</span>
            <span className={getBadgeClass(r.ml_label)}>ML: {r.ml_label}</span>
            {r.is_breached === true  && <span className="badge badge-weak">BREACHED</span>}
            {r.is_breached === false && <span className="badge badge-strong">CLEAN</span>}
            <button
              className="btn btn-danger btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => handleDelete(r.id)}
            >✕</button>
          </div>
          <div className="hc-meta">
            <span>entropy: {r.entropy}b</span>
            <span>ml conf: {r.ml_confidence}%</span>
            {r.breach_count != null && <span>breach count: {r.breach_count?.toLocaleString()}</span>}
            <span className="hc-time">{r.scanned_at}</span>
          </div>
        </div>
      ))}

      {data?.pages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => load(page - 1)}>← PREV</button>
          <span>{page} / {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => load(page + 1)}>NEXT →</button>
        </div>
      )}
    </div>
  );
}
