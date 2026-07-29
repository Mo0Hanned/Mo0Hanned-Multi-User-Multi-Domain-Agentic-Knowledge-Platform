import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Loader2, AlertCircle, CheckCircle2, FileText, HelpCircle, MessageSquare } from 'lucide-react';

const MetricCircle = ({ value, label, color }) => {
  const percentage = Math.round(value * 100);
  const strokeDashoffset = 126 - (126 * percentage) / 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: '60px', height: '60px' }}>
        <svg width="60" height="60" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="22" cy="22" r="20" fill="none" stroke="var(--bg-panel-hover)" strokeWidth="4" />
          <motion.circle
            initial={{ strokeDashoffset: 126 }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            cx="22" cy="22" r="20" fill="none" stroke={color} strokeWidth="4"
            strokeDasharray="126" strokeLinecap="round"
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {percentage}%
        </div>
      </div>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    </div>
  );
};

const Judge = () => {
  const [formData, setFormData] = useState({
    question: '',
    golden_answer: ''
  });
  const [loading, setLoading] = useState(false);
  const [evaluationStatus, setEvaluationStatus] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [generatedAnswer, setGeneratedAnswer] = useState(null);

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!formData.question || !formData.golden_answer) {
      setError("Question and Golden Answer are required.");
      return;
    }

    setLoading(true);
    setEvaluationStatus('Querying Agents...');
    setError(null);
    setResult(null);
    setGeneratedAnswer(null);

    try {
      const token = localStorage.getItem('access_token');
      
      // Step 1: Query the agents to get the generated answer
      const queryRes = await fetch('http://localhost:8000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: formData.question
        })
      });

      if (!queryRes.ok) {
        const data = await queryRes.json();
        throw new Error(data.detail || "Querying agents failed");
      }

      const queryData = await queryRes.json();
      const aiAnswer = queryData.answer;
      setGeneratedAnswer(aiAnswer);

      // Step 2: Evaluate the generated answer against the golden answer
      setEvaluationStatus('Evaluating Answer...');
      const evalRes = await fetch('http://localhost:8000/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: formData.question,
          answer: aiAnswer,
          golden_answer: formData.golden_answer
        })
      });

      if (!evalRes.ok) {
        const data = await evalRes.json();
        throw new Error(data.detail || "Evaluation failed");
      }

      const evalData = await evalRes.json();
      setResult(evalData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setEvaluationStatus('');
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-dark)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: 'var(--text-main)',
    fontSize: '0.95rem',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s',
    minHeight: '100px'
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '30px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '900px', width: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(6, 182, 212, 0.3)' }}>
            <Scale size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>LLM Judge Evaluator</h1>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Evaluate the quality of your RAG generated answers</p>
          </div>
        </div>

        {/* Input Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel" 
          style={{ padding: '24px', background: 'var(--bg-panel)', border: '1px solid var(--border)' }}
        >
          <form onSubmit={handleEvaluate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 600, marginBottom: '8px' }}>
                <HelpCircle size={16} color="var(--cyan)" /> Question <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea 
                value={formData.question}
                onChange={e => setFormData({...formData, question: e.target.value})}
                placeholder="What is the question being asked?"
                style={{ ...inputStyle, minHeight: '60px' }}
              />
            </div>
            


            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 600, marginBottom: '8px' }}>
                <CheckCircle2 size={16} color="var(--success)" /> Golden Answer (Human Reference) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea 
                value={formData.golden_answer}
                onChange={e => setFormData({...formData, golden_answer: e.target.value})}
                placeholder="The ideal or correct answer for comparison..."
                style={inputStyle}
              />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}

            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              className="btn"
              style={{ padding: '14px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px' }}
            >
              {loading ? <><Loader2 size={18} className="spin" /> {evaluationStatus}</> : <><Scale size={18} /> Run Full Evaluation</>}
            </motion.button>
          </form>
        </motion.div>

        {/* Generated Answer Display */}
        {generatedAnswer && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel" 
            style={{ padding: '24px', background: 'var(--bg-panel)', border: '1px solid var(--cyan)' }}
          >
            <h3 style={{ fontSize: '1rem', margin: '0 0 16px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} color="var(--cyan)" /> AI Generated Answer
            </h3>
            <div style={{ background: 'var(--bg-dark)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {generatedAnswer}
            </div>
          </motion.div>
        )}

        {/* Results Panel */}
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel" 
            style={{ padding: '30px', background: 'var(--bg-panel)', border: '1px solid var(--success)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  Evaluation Results
                </h2>
                <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Detailed breakdown of RAG response quality</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)', lineHeight: 1 }}>
                  {Math.round(result.overall_score * 100)}<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/100</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Overall Score</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
              <MetricCircle value={result.faithfulness} label="Faithfulness" color="#10b981" />
              <MetricCircle value={result.relevance} label="Relevance" color="#3b82f6" />
              <MetricCircle value={result.completeness} label="Completeness" color="#8b5cf6" />
              <MetricCircle value={result.citation_accuracy} label="Citation Acc." color="#f59e0b" />
              <MetricCircle value={1 - result.hallucination_risk} label="Factuality" color={result.hallucination_risk > 0.5 ? "#ef4444" : "#10b981"} />
            </div>

            <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1rem', margin: '0 0 10px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="var(--accent)" /> Judge Reasoning
              </h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>
                {result.reasoning}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Judge;
