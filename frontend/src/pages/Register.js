import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ name: '', email: '', password: '' });
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.name || !form.email || !form.password) {
      return setError('All fields are required');
    }
    setLoading(true);
    try {
      await authAPI.register(form);
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card panel">
        <div className="auth-title">CREATE ACCOUNT</div>
        <div className="auth-sub">// join SecurePass — your password guardian</div>

        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        {loading && <div className="loading-bar"><div className="loading-fill" /></div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">FULL NAME</label>
            <input className="form-input" name="name" placeholder="Enter your name"
              value={form.name} onChange={handleChange} autoComplete="off" />
          </div>
          <div className="form-group">
            <label className="form-label">EMAIL</label>
            <input className="form-input" name="email" type="email" placeholder="Enter your email"
              value={form.email} onChange={handleChange} autoComplete="off" />
          </div>
          <div className="form-group">
            <label className="form-label">PASSWORD</label>
            <div className="input-wrap">
              <input className="form-input" name="password" type={show ? 'text' : 'password'}
                placeholder="Min 8 characters" value={form.password} onChange={handleChange} />
              <button type="button" className="eye-btn" onClick={() => setShow(s => !s)}>
                {show ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? '[ CREATING ACCOUNT... ]' : '[ CREATE ACCOUNT ]'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
}
