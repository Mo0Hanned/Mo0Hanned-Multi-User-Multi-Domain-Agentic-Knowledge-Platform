import React, { useState } from 'react';
import Chat from './Chat';
import Ingest from './Ingest';
import Judge from './Judge';
import AdminPanel from './AdminPanel';
import { MessageSquare, Database, LogOut, LayoutDashboard, Check, Scale, Activity, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = ({ username, role, onLogout }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [metricsTab, setMetricsTab] = useState('judge'); // 'judge' or 'system'
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showWelcomeToast, setShowWelcomeToast] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeToast(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ padding: '24px' }}>
        <motion.div 
          initial={{ x: -260 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="glass-panel"
          style={{ width: '260px', height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', zIndex: 10, background: 'var(--bg-panel)' }}
        >
          <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--accent), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)' }}
            >
              <LayoutDashboard size={18} color="white" />
            </motion.div>
            <span style={{ fontWeight: '700', fontSize: '1.2rem', background: 'linear-gradient(135deg, #fff, var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.5px' }}>
            Agentic RAG
          </span>
        </div>

        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', paddingLeft: '12px' }}>
            Menu
          </div>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <motion.button
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('chat')}
              style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: 'none',
                background: 'transparent',
                color: activeTab === 'chat' ? 'var(--text-main)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'color 0.2s', textAlign: 'left', width: '100%', fontSize: '0.95rem', fontWeight: activeTab === 'chat' ? 600 : 400
              }}
            >
              {activeTab === 'chat' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  style={{ position: 'absolute', inset: 0, background: 'rgba(147, 51, 234, 0.15)', border: '1px solid rgba(147, 51, 234, 0.4)', borderRadius: '12px', boxShadow: '0 0 20px rgba(147, 51, 234, 0.2)', zIndex: 0 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MessageSquare size={18} color={activeTab === 'chat' ? 'var(--cyan)' : 'var(--text-muted)'} /> Smart Chat
              </span>
            </motion.button>
            
            {role === 'Admin' && (
              <>
              <motion.button
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('ingest')}
                style={{
                  position: 'relative', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: 'none',
                  background: 'transparent',
                  color: activeTab === 'ingest' ? 'var(--text-main)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'color 0.2s', textAlign: 'left', width: '100%', fontSize: '0.95rem', fontWeight: activeTab === 'ingest' ? 600 : 400
                }}
              >
                {activeTab === 'ingest' && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    style={{ position: 'absolute', inset: 0, background: 'rgba(147, 51, 234, 0.15)', border: '1px solid rgba(147, 51, 234, 0.4)', borderRadius: '12px', boxShadow: '0 0 20px rgba(147, 51, 234, 0.2)', zIndex: 0 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Database size={18} color={activeTab === 'ingest' ? 'var(--cyan)' : 'var(--text-muted)'} /> Data Ingestion
                </span>
              </motion.button>

              <motion.button
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('judge')}
                style={{
                  position: 'relative', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: 'none',
                  background: 'transparent',
                  color: activeTab === 'judge' ? 'var(--text-main)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'color 0.2s', textAlign: 'left', width: '100%', fontSize: '0.95rem', fontWeight: activeTab === 'judge' ? 600 : 400
                }}
              >
                {activeTab === 'judge' && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    style={{ position: 'absolute', inset: 0, background: 'rgba(147, 51, 234, 0.15)', border: '1px solid rgba(147, 51, 234, 0.4)', borderRadius: '12px', boxShadow: '0 0 20px rgba(147, 51, 234, 0.2)', zIndex: 0 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Scale size={18} color={activeTab === 'judge' ? 'var(--cyan)' : 'var(--text-muted)'} /> LLM Judge
                </span>
              </motion.button>

              <motion.button
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('metrics')}
                style={{
                  position: 'relative', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: 'none',
                  background: 'transparent',
                  color: activeTab === 'metrics' ? 'var(--text-main)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'color 0.2s', textAlign: 'left', width: '100%', fontSize: '0.95rem', fontWeight: activeTab === 'metrics' ? 600 : 400
                }}
              >
                {activeTab === 'metrics' && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    style={{ position: 'absolute', inset: 0, background: 'rgba(147, 51, 234, 0.15)', border: '1px solid rgba(147, 51, 234, 0.4)', borderRadius: '12px', boxShadow: '0 0 20px rgba(147, 51, 234, 0.2)', zIndex: 0 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Activity size={18} color={activeTab === 'metrics' ? 'var(--cyan)' : 'var(--text-muted)'} /> Live Metrics
                </span>
              </motion.button>

              <motion.button
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('admin_tools')}
                style={{
                  position: 'relative', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: 'none',
                  background: 'transparent',
                  color: activeTab === 'admin_tools' ? 'var(--text-main)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'color 0.2s', textAlign: 'left', width: '100%', fontSize: '0.95rem', fontWeight: activeTab === 'admin_tools' ? 600 : 400
                }}
              >
                {activeTab === 'admin_tools' && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    style={{ position: 'absolute', inset: 0, background: 'rgba(147, 51, 234, 0.15)', border: '1px solid rgba(147, 51, 234, 0.4)', borderRadius: '12px', boxShadow: '0 0 20px rgba(147, 51, 234, 0.2)', zIndex: 0 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Shield size={18} color={activeTab === 'admin_tools' ? 'var(--cyan)' : 'var(--text-muted)'} /> Admin Tools
                </span>
              </motion.button>
              </>
            )}
          </div>
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-panel-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{username?.charAt(0).toUpperCase()}</span>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '500', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{username}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Online</div>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'var(--danger)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowLogoutModal(true)} 
            className="btn btn-secondary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            <LogOut size={16} /> Logout
          </motion.button>
        </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '100%' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: activeTab === 'chat' ? 1 : 0, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              height: '100%',
              width: '100%',
              display: activeTab === 'chat' ? 'block' : 'none'
            }}
          >
            <Chat />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: activeTab === 'ingest' ? 1 : 0, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              height: '100%',
              width: '100%',
              display: activeTab === 'ingest' ? 'block' : 'none'
            }}
          >
            <Ingest />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: activeTab === 'judge' ? 1 : 0, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              height: '100%',
              width: '100%',
              display: activeTab === 'judge' ? 'block' : 'none'
            }}
          >
            <Judge />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: activeTab === 'metrics' ? 1 : 0, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              height: '100%',
              width: '100%',
              display: activeTab === 'metrics' ? 'block' : 'none'
            }}
          >
            <div style={{ height: '100%', padding: '30px', overflowY: 'auto' }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(6, 182, 212, 0.3)' }}>
                      <Activity size={24} color="white" />
                    </div>
                    <div>
                      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Live Metrics</h1>
                      <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Real-time Grafana dashboard of RAG evaluations and system usage</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', background: 'var(--bg-panel)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border)' }}>
                    <button
                      onClick={() => setMetricsTab('judge')}
                      style={{
                        padding: '8px 16px', borderRadius: '8px', border: 'none',
                        background: metricsTab === 'judge' ? 'var(--cyan)' : 'transparent',
                        color: metricsTab === 'judge' ? 'white' : 'var(--text-muted)',
                        fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      LLM Judge
                    </button>
                    <button
                      onClick={() => setMetricsTab('system')}
                      style={{
                        padding: '8px 16px', borderRadius: '8px', border: 'none',
                        background: metricsTab === 'system' ? 'var(--accent)' : 'transparent',
                        color: metricsTab === 'system' ? 'white' : 'var(--text-muted)',
                        fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      System & Chat
                    </button>
                  </div>
                </div>
                
                <div style={{ flex: 1, background: 'var(--bg-panel)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', minHeight: '600px' }}>
                  {metricsTab === 'judge' ? (
                    <iframe 
                      src="http://localhost:3005/d/llm_judge_01/llm-judge-evaluation-dashboard?orgId=1&kiosk" 
                      width="100%" 
                      height="100%" 
                      frameBorder="0"
                      title="Grafana LLM Judge Metrics"
                      style={{ display: 'block', minHeight: '600px' }}
                    ></iframe>
                  ) : (
                    <iframe 
                      src="http://localhost:3005/d/chat_system_metrics/system-chat-metrics?orgId=1&kiosk" 
                      width="100%" 
                      height="100%" 
                      frameBorder="0"
                      title="Grafana System Metrics"
                      style={{ display: 'block', minHeight: '600px' }}
                    ></iframe>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: activeTab === 'admin_tools' ? 1 : 0, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              height: '100%',
              width: '100%',
              display: activeTab === 'admin_tools' ? 'block' : 'none'
            }}
          >
            <AdminPanel />
          </motion.div>
        </div>
      </div>
      {/* Welcome Toast */}
      <AnimatePresence>
        {showWelcomeToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            style={{
              position: 'fixed', top: 0, left: '50%', zIndex: 100,
              background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', backdropFilter: 'blur(16px)',
              padding: '12px 24px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '10px',
              color: 'var(--success)', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)'
            }}
          >
            <Check size={18} />
            <span style={{ fontWeight: 600 }}>Welcome back, {username}!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-panel"
              style={{ padding: '30px', width: '100%', maxWidth: '400px', textAlign: 'center', background: 'var(--bg-dark)' }}
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <LogOut size={24} color="var(--danger)" />
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '10px' }}>Confirm Logout</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>
                Are you sure you want to log out of your session? You will need to sign in again to access the system.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLogoutModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onLogout}
                  className="btn"
                  style={{ flex: 1, background: 'var(--danger)', color: 'white' }}
                >
                  Yes, Log out
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
