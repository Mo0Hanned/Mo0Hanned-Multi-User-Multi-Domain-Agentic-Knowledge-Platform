import React, { useState, useRef, useEffect } from 'react';
import { runQuery } from '../api';
import { Send, Bot, User as UserIcon, Loader, ShieldAlert, ListTodo, Database, ShieldCheck, Globe, BookOpen, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const DebugRow = ({ Icon, iconColor, title, value, valueColor }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-dark)', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Icon size={16} color={iconColor || 'var(--text-muted)'} />
      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{title}</span>
    </div>
    <div style={{ color: valueColor || 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{value}</div>
  </div>
);

const DebugConsole = ({ debugInfo, domain, steps }) => {
  if (!debugInfo) return null;
  return (
    <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 4px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '1px' }}>DEBUG CONSOLE</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {domain && <span style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--cyan)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '600' }}>{domain}</span>}
          <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> {debugInfo.timing}s</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <DebugRow Icon={ListTodo} iconColor="var(--text-muted)" title="Planning" value={`${debugInfo.tasks_count} task${debugInfo.tasks_count !== 1 ? 's' : ''}`} />
        <DebugRow Icon={Database} iconColor="var(--cyan)" title="Retrieval" value={`${debugInfo.retrieved_chunks} chunks`} valueColor="var(--cyan)" />
        <DebugRow Icon={ShieldCheck} iconColor="var(--success)" title="Verification" value={debugInfo.verification_status} valueColor={debugInfo.verification_status === 'PASS' ? 'var(--success)' : debugInfo.verification_status === 'PARTIAL' ? '#fbbf24' : 'var(--danger)'} />
        <DebugRow Icon={Globe} iconColor="#f97316" title="Web Search" value={debugInfo.web_search_status} valueColor={debugInfo.web_search_status === 'Executed' ? '#f97316' : 'var(--danger)'} />
        <DebugRow Icon={BookOpen} iconColor="var(--text-muted)" title="Sources" value={debugInfo.sources_count} />
        <DebugRow Icon={Clock} iconColor="var(--text-muted)" title="Timing" value={`${debugInfo.timing}s`} />
      </div>
    </div>
  );
};

const Chat = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI agent. Ask me anything related to your accessible domains.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const data = await runQuery(userMessage);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        meta: { domain: data.target_domain, steps: data.step_count, debugInfo: data.debug_info }
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err.response?.data?.detail || 'Sorry, an error occurred while processing your request.',
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%'
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(147, 51, 234, 0.3)' }}>
                  <Bot size={22} color="white" />
                </div>
              )}
              
              <div style={{
                background: msg.role === 'user' ? 'linear-gradient(135deg, var(--accent), var(--cyan))' : 'var(--bg-panel)',
                padding: '16px 20px',
                borderRadius: '20px',
                borderTopRightRadius: msg.role === 'user' ? '4px' : '20px',
                borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '20px',
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                color: 'white',
                boxShadow: msg.role === 'user' ? '0 4px 20px rgba(6, 182, 212, 0.2)' : '0 8px 32px rgba(0, 0, 0, 0.2)',
                backdropFilter: msg.role === 'assistant' ? 'blur(16px)' : 'none',
              }}>
                {msg.isError && <ShieldAlert size={18} color="var(--danger)" style={{ marginBottom: '8px' }} />}
                <div style={{ lineHeight: '1.6', fontSize: '0.95rem' }} className="markdown-content">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                
                {msg.meta && !msg.meta.debugInfo && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}
                  >
                    {msg.meta.domain && (
                      <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                        Domain: {msg.meta.domain}
                      </span>
                    )}
                    {msg.meta.steps > 0 && (
                      <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                        Steps: {msg.meta.steps}
                      </span>
                    )}
                  </motion.div>
                )}
                {msg.meta && msg.meta.debugInfo && (
                  <DebugConsole debugInfo={msg.meta.debugInfo} domain={msg.meta.domain} steps={msg.meta.steps} />
                )}
              </div>

              {msg.role === 'user' && (
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-panel-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                  <UserIcon size={22} color="var(--text-main)" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(147, 51, 234, 0.3)' }}>
              <Bot size={22} color="white" />
            </div>
            <div style={{ background: 'var(--bg-panel)', padding: '16px 24px', borderRadius: '20px', borderTopLeftRadius: '4px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', background: 'var(--cyan)', borderRadius: '50%', animation: 'typingDots 1.4s infinite ease-in-out' }}></div>
                <div style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%', animation: 'typingDots 1.4s infinite ease-in-out 0.2s' }}></div>
                <div style={{ width: '8px', height: '8px', background: 'var(--cyan)', borderRadius: '50%', animation: 'typingDots 1.4s infinite ease-in-out 0.4s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'var(--bg-dark)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
          <input
            type="text"
            className="input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your query here..."
            style={{ paddingRight: '50px', background: 'var(--bg-panel)', backdropFilter: 'blur(16px)', borderRadius: '12px' }}
            disabled={loading}
          />
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit" 
            className="btn btn-primary" 
            style={{ position: 'absolute', right: '6px', top: '6px', padding: '6px 12px', height: 'auto' }}
            disabled={loading || !input.trim()}
          >
            <Send size={18} />
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
