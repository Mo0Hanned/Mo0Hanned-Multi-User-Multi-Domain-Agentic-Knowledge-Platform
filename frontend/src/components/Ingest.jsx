import React, { useState } from 'react';
import { ingestData } from '../api';
import { UploadCloud, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Ingest = () => {
  
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', msg: '' }
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      if (!file) {
        setStatus({ type: 'error', msg: 'Please select a file to upload.' });
        setLoading(false);
        return;
      }
      const data = await ingestData(file);
      setStatus({ type: 'success', msg: data.message });
      
      setFile(null);
      // Reset the file input element if needed
      document.getElementById('file-upload').value = '';
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.detail || 'Ingestion failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h2 style={{ marginBottom: '20px', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)' }}>
            <Database size={20} color="white" />
          </div>
          <span style={{ background: 'linear-gradient(135deg, #f8fafc, var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Ingest Knowledge
          </span>
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
          Upload documents (.txt, .pdf, .docx) into specific namespaces. Access control applies based on your roles.
        </p>
      </motion.div>

      <AnimatePresence>
        {status && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            style={{
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${status.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
              color: status.type === 'success' ? 'var(--success)' : 'var(--danger)'
            }}
          >
            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {status.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        onSubmit={handleSubmit} 
        className="glass-panel" 
        style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}
      >

        <div style={{
          position: 'relative',
          border: `2px dashed ${file ? 'var(--cyan)' : 'var(--border)'}`,
          borderRadius: '16px',
          padding: '40px 20px',
          textAlign: 'center',
          transition: 'all 0.3s ease',
          background: file ? 'rgba(6, 182, 212, 0.05)' : 'rgba(9, 9, 11, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <input
            id="file-upload"
            type="file"
            accept=".txt,.pdf,.docx"
            onChange={(e) => setFile(e.target.files[0])}
            required
            style={{
              opacity: 0,
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              cursor: 'pointer'
            }}
          />
          
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(6, 182, 212, 0.2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(6, 182, 212, 0.2)'
            }}
          >
            <UploadCloud size={32} color="var(--cyan)" />
          </motion.div>

          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-main)' }}>
              {file ? 'File Selected' : 'Drag & Drop or Click to Upload'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Supported formats: .txt, .pdf, .docx
            </p>
          </div>

          {file && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '16px', padding: '12px 20px', borderRadius: '8px',
                background: 'rgba(9, 9, 11, 0.8)', border: '1px solid var(--cyan)',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                color: 'var(--cyan)', fontWeight: 500, fontSize: '0.95rem'
              }}
            >
              <CheckCircle size={16} />
              {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </motion.div>
          )}
        </div>

        <motion.button 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)' }}
          whileTap={{ scale: 0.98 }}
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '12px' }} 
          disabled={loading || !file}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <UploadCloud size={20} />
              </motion.div>
              Processing Document...
            </div>
          ) : (
            <><UploadCloud size={20} /> Start Ingestion</>
          )}
        </motion.button>
      </motion.form>
    </div>
  );
};

export default Ingest;
