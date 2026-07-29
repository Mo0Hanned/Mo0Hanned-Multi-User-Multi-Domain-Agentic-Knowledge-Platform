import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, PlusCircle, CheckCircle, AlertCircle, Edit2 } from 'lucide-react';
import { 
  getUsers, 
  createItTicket, 
  createHrLeave,
  getUserItTickets,
  getUserHrLeaves,
  updateItTicket,
  updateHrLeave
} from '../api';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('it'); // 'it' or 'hr'
  const [activeMode, setActiveMode] = useState('create'); // 'create' or 'edit'
  
  // Create State
  const [itData, setItData] = useState({ user_id: '', title: '', description: '', priority: 'MEDIUM' });
  const [hrData, setHrData] = useState({ user_id: '', leave_type: 'ANNUAL', available_days: 21, used_days: 0 });
  
  // Edit State
  const [selectedUser, setSelectedUser] = useState('');
  const [userRecords, setUserRecords] = useState([]); // holds tickets or hr records based on activeTab
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [editItData, setEditItData] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'OPEN' });
  const [editHrData, setEditHrData] = useState({ leave_type: 'ANNUAL', available_days: 21, used_days: 0 });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  // Fetch user records when selected user or tab changes in edit mode
  useEffect(() => {
    if (activeMode === 'edit' && selectedUser) {
      fetchUserRecords(selectedUser, activeTab);
    }
  }, [selectedUser, activeTab, activeMode]);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const fetchUserRecords = async (userId, tab) => {
    setLoading(true);
    setUserRecords([]);
    setSelectedRecordId('');
    try {
      if (tab === 'it') {
        const records = await getUserItTickets(userId);
        setUserRecords(records);
      } else {
        const records = await getUserHrLeaves(userId);
        setUserRecords(records);
      }
    } catch (err) {
      showMessage("Failed to load user records", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSelect = (recordId) => {
    setSelectedRecordId(recordId);
    const record = userRecords.find(r => r.id === parseInt(recordId));
    if (record) {
      if (activeTab === 'it') {
        setEditItData({
          title: record.title,
          description: record.description || '',
          priority: record.priority,
          status: record.status
        });
      } else {
        setEditHrData({
          leave_type: record.leave_type,
          available_days: record.available_days,
          used_days: record.used_days
        });
      }
    }
  };

  const handleCreateItSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!itData.user_id) throw new Error("Please select a user");
      await createItTicket({ ...itData, user_id: parseInt(itData.user_id) });
      showMessage("IT Ticket created successfully!", "success");
      setItData({ user_id: '', title: '', description: '', priority: 'MEDIUM' });
    } catch (err) {
      showMessage(err.message || "Failed to create ticket", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHrSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!hrData.user_id) throw new Error("Please select a user");
      await createHrLeave({ ...hrData, user_id: parseInt(hrData.user_id), available_days: parseInt(hrData.available_days), used_days: parseInt(hrData.used_days) });
      showMessage("HR Leave Record created successfully!", "success");
      setHrData({ user_id: '', leave_type: 'ANNUAL', available_days: 21, used_days: 0 });
    } catch (err) {
      showMessage(err.message || "Failed to create HR record", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditItSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!selectedRecordId) throw new Error("Please select a ticket to edit");
      await updateItTicket(parseInt(selectedRecordId), editItData);
      showMessage("IT Ticket updated successfully!", "success");
      // refresh records
      fetchUserRecords(selectedUser, 'it');
    } catch (err) {
      showMessage(err.message || "Failed to update ticket", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditHrSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!selectedRecordId) throw new Error("Please select an HR record to edit");
      await updateHrLeave(parseInt(selectedRecordId), {
        ...editHrData,
        available_days: parseInt(editHrData.available_days),
        used_days: parseInt(editHrData.used_days)
      });
      showMessage("HR Leave Record updated successfully!", "success");
      // refresh records
      fetchUserRecords(selectedUser, 'hr');
    } catch (err) {
      showMessage(err.message || "Failed to update HR record", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '30px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(6, 182, 212, 0.3)' }}>
            <Shield size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Admin Tools</h1>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage IT tickets and HR records on behalf of users</p>
          </div>
        </div>

        {message.text && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px',
                     background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                     color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
                     border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}` }}
          >
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </motion.div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button className={`btn ${activeTab === 'it' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('it')} style={{ flex: 1 }}>
            IT Tickets
          </button>
          <button className={`btn ${activeTab === 'hr' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('hr')} style={{ flex: 1 }}>
            HR Records
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <button className={`btn ${activeMode === 'create' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveMode('create')} style={{ flex: 1, padding: '8px' }}>
            <PlusCircle size={16} style={{marginRight: '6px'}}/> Create New
          </button>
          <button className={`btn ${activeMode === 'edit' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveMode('edit')} style={{ flex: 1, padding: '8px' }}>
            <Edit2 size={16} style={{marginRight: '6px'}}/> Edit Existing
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '30px' }}>
          {/* CREATE MODE */}
          {activeMode === 'create' && activeTab === 'it' && (
            <form onSubmit={handleCreateItSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label>Select User</label>
                <select className="input-field" value={itData.user_id} onChange={(e) => setItData({...itData, user_id: e.target.value})} required>
                  <option value="">-- Choose User --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Ticket Title</label>
                <input type="text" className="input-field" placeholder="e.g. Cannot access VPN" value={itData.title} onChange={(e) => setItData({...itData, title: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Description (Optional)</label>
                <textarea className="input-field" rows="4" placeholder="Provide details..." value={itData.description} onChange={(e) => setItData({...itData, description: e.target.value})}></textarea>
              </div>
              <div className="input-group">
                <label>Priority</label>
                <select className="input-field" value={itData.priority} onChange={(e) => setItData({...itData, priority: e.target.value})}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '10px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <PlusCircle size={20} /> {loading ? 'Creating...' : 'Create Ticket'}
              </button>
            </form>
          )}

          {activeMode === 'create' && activeTab === 'hr' && (
            <form onSubmit={handleCreateHrSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label>Select User</label>
                <select className="input-field" value={hrData.user_id} onChange={(e) => setHrData({...hrData, user_id: e.target.value})} required>
                  <option value="">-- Choose User --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Leave Type</label>
                <select className="input-field" value={hrData.leave_type} onChange={(e) => setHrData({...hrData, leave_type: e.target.value})}>
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>
              <div className="input-group">
                <label>Available Days</label>
                <input type="number" className="input-field" min="0" value={hrData.available_days} onChange={(e) => setHrData({...hrData, available_days: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Used Days</label>
                <input type="number" className="input-field" min="0" value={hrData.used_days} onChange={(e) => setHrData({...hrData, used_days: e.target.value})} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '10px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <PlusCircle size={20} /> {loading ? 'Creating...' : 'Create HR Record'}
              </button>
            </form>
          )}

          {/* EDIT MODE */}
          {activeMode === 'edit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label>Select User to View Records</label>
                <select className="input-field" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                  <option value="">-- Choose User --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
                </select>
              </div>

              {selectedUser && (
                <div className="input-group">
                  <label>Select {activeTab === 'it' ? 'Ticket' : 'Record'} to Edit</label>
                  <select className="input-field" value={selectedRecordId} onChange={(e) => handleRecordSelect(e.target.value)}>
                    <option value="">-- Select {activeTab === 'it' ? 'Ticket' : 'Record'} --</option>
                    {userRecords.map(r => (
                      <option key={r.id} value={r.id}>
                        {activeTab === 'it' ? `#${r.id} - ${r.title} [${r.status}]` : `#${r.id} - ${r.leave_type} (${r.used_days}/${r.available_days} used)`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedRecordId && activeTab === 'it' && (
                <form onSubmit={handleEditItSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                  <div className="input-group">
                    <label>Ticket Title</label>
                    <input type="text" className="input-field" value={editItData.title} onChange={(e) => setEditItData({...editItData, title: e.target.value})} required />
                  </div>
                  <div className="input-group">
                    <label>Description</label>
                    <textarea className="input-field" rows="4" value={editItData.description} onChange={(e) => setEditItData({...editItData, description: e.target.value})}></textarea>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label>Priority</label>
                      <select className="input-field" value={editItData.priority} onChange={(e) => setEditItData({...editItData, priority: e.target.value})}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label>Status</label>
                      <select className="input-field" value={editItData.status} onChange={(e) => setEditItData({...editItData, status: e.target.value})}>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '10px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <Edit2 size={20} /> {loading ? 'Updating...' : 'Update Ticket'}
                  </button>
                </form>
              )}

              {selectedRecordId && activeTab === 'hr' && (
                <form onSubmit={handleEditHrSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                  <div className="input-group">
                    <label>Leave Type</label>
                    <select className="input-field" value={editHrData.leave_type} onChange={(e) => setEditHrData({...editHrData, leave_type: e.target.value})}>
                      <option value="ANNUAL">Annual Leave</option>
                      <option value="SICK">Sick Leave</option>
                      <option value="MATERNITY">Maternity Leave</option>
                      <option value="UNPAID">Unpaid Leave</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label>Available Days</label>
                      <input type="number" className="input-field" min="0" value={editHrData.available_days} onChange={(e) => setEditHrData({...editHrData, available_days: e.target.value})} required />
                    </div>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label>Used Days</label>
                      <input type="number" className="input-field" min="0" value={editHrData.used_days} onChange={(e) => setEditHrData({...editHrData, used_days: e.target.value})} required />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '10px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <Edit2 size={20} /> {loading ? 'Updating...' : 'Update HR Record'}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
