import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const [form,    setForm]    = useState({ name: '', password: '' });
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.password) return setError('Full name and password are required');
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.token, res.data.user);
      navigate('/analyzer');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card panel">
        <div className="auth-title">LOGIN</div>
        <div className="auth-sub">// access your SecurePass account</div>

        {error   && <div className="alert alert-error">{error}</div>}
        {loading && <div className="loading-bar"><div className="loading-fill" /></div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">FULL NAME</label>
            <input
              className="form-input"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label className="form-label">PASSWORD</label>
            <div className="input-wrap">
              <input
                className="form-input"
                name="password"
                type={show ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
              />
              <button type="button" className="eye-btn" onClick={() => setShow(s => !s)}>
                {show ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? '[ AUTHENTICATING... ]' : '[ LOGIN ]'}
          </button>
        </form>

        <div className="auth-footer">
          No account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
}
