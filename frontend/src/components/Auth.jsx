import React, { useState } from 'react';
import { login, register } from '../api';
import { KeyRound, User, Shield, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dropdown = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="input-field"
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          paddingLeft: '40px',
          userSelect: 'none'
        }}
      >
        <Shield size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
        <span style={{ color: selectedOption ? 'var(--text-main)' : 'var(--text-muted)' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronDown size={18} color="var(--text-muted)" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              background: 'var(--bg-panel)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              overflow: 'hidden',
              zIndex: 50,
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }}
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-panel-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontWeight: 500 }}>{opt.label}</span>
                {value === opt.value && <Check size={16} color="var(--accent-light)" />}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', system_role: 'IT', job_role: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const systemRoleOptions = [
    { value: 'Admin', label: 'Administrator (All Access)' },
    { value: 'IT', label: 'IT Access' },
    { value: 'HR', label: 'HR Access' }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const data = await login(formData.username, formData.password);
        localStorage.setItem('access_token', data.access_token);
        onLogin(formData.username);
      } else {
        const domain = formData.system_role === 'Admin' ? 'HR,IT' : formData.system_role;
        await register(formData.username, formData.password, formData.username, formData.system_role, formData.job_role, domain);
        const data = await login(formData.username, formData.password);
        localStorage.setItem('access_token', data.access_token);
        onLogin(formData.username);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', overflow: 'hidden' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-panel" 
        style={{ padding: '40px', width: '100%', maxWidth: '400px', position: 'relative', zIndex: 10 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            style={{ 
              width: '70px', height: '70px', borderRadius: '20px', 
              background: 'linear-gradient(135deg, var(--accent), var(--cyan))', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', boxShadow: '0 10px 30px rgba(147, 51, 234, 0.5)'
            }}
          >
            <Shield size={32} color="white" />
          </motion.div>
          <h2 style={{ fontSize: '2rem', marginBottom: '10px', background: 'linear-gradient(135deg, #f8fafc, var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isLogin ? 'Sign in to access your workspaces' : 'Sign up to explore the agentic RAG'}
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.9rem', overflow: 'hidden' }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="input-group"
          >
            <label>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                className="input-field"
                style={{ paddingLeft: '40px' }}
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="input-group"
          >
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                className="input-field"
                style={{ paddingLeft: '40px' }}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>
          </motion.div>

          <AnimatePresence>
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'visible' }}
              >
                <div className="input-group" style={{ paddingTop: '4px' }}>
                  <label>Role</label>
                  <div style={{ position: 'relative' }}>
                    <Shield size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                    <input
                      className="input-field"
                      style={{ paddingLeft: '40px' }}
                      type="text"
                      name="job_role"
                      value={formData.job_role}
                      onChange={handleChange}
                      placeholder="e.g. Backend Developer"
                      required={!isLogin}
                    />
                  </div>
                </div>

                <div className="input-group" style={{ paddingTop: '16px' }}>
                  <label>System Role</label>
                  <Dropdown 
                    options={systemRoleOptions} 
                    value={formData.system_role} 
                    onChange={(val) => setFormData({ ...formData, system_role: val })} 
                    placeholder="Select a system role"
                  />
                </div>

                <div className="input-group" style={{ paddingTop: '16px' }}>
                  <label>Email</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                    <input
                      className="input-field"
                      style={{ paddingLeft: '40px', backgroundColor: 'var(--bg-panel-hover)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                      type="text"
                      value={formData.username ? `${formData.username.toLowerCase().replace(/\s+/g, '.')}@company.com` : ''}
                      readOnly
                      placeholder="Generated from username"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)' }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '24px', padding: '14px', fontSize: '1rem' }} 
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </motion.button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span
              style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: '500', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--accent-light)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--accent)'}
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
            >
              {isLogin ? 'Sign up here' : 'Sign in here'}
            </span>
          </p>
        </div>
      </motion.div>

      {/* Decorative blurred background circles */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute', top: '5%', left: '10%', width: '400px', height: '400px', 
          background: 'var(--accent)', borderRadius: '50%', filter: 'blur(120px)', zIndex: 1, pointerEvents: 'none'
        }} 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.1, 0.25, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{
          position: 'absolute', bottom: '5%', right: '10%', width: '500px', height: '500px', 
          background: 'var(--cyan)', borderRadius: '50%', filter: 'blur(150px)', zIndex: 1, pointerEvents: 'none'
        }} 
      />
    </div>
  );
};

export default Auth;
