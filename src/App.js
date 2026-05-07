import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("");
  const [expandedBankId, setExpandedBankId] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);

  // Form States
  const [formData, setFormData] = useState({});
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  useEffect(() => {
    if (expandedBankId) {
      const q = query(collection(db, "transactions"), where("bankId", "==", expandedBankId));
      onSnapshot(q, (s) => setLedgerData(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [expandedBankId]);

  // --- CRUD ACTIONS ---
  const handleSave = async (e) => {
    e.preventDefault();
    const collectionName = activeTab === "Firm Master" ? "firms" : activeTab === "Bank Master" ? "banks" : "users";
    if (editId) {
      await updateDoc(doc(db, collectionName, editId), formData);
      setEditId(null);
    } else {
      await addDoc(collection(db, collectionName), formData);
    }
    setFormData({});
  };

  const handleDelete = async (id, coll) => {
    if(window.confirm("Delete this entry?")) await deleteDoc(doc(db, coll, id));
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
          <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => {setActiveTab(tab); setEditId(null); setFormData({});}}>
            {tab}
          </div>
        ))}
        <div className="sidebar-footer">Developed by: <br/><span className="softview-name">SOFTVIEW TECHNOLOGIES</span></div>
      </div>

      <div className="main-stage">
        <div className="top-nav">
          <div>Welcome, <strong>{user.email}</strong></div>
          <button className="btn-action btn-pdf" onClick={() => signOut(auth)}>LOGOUT</button>
        </div>

        <div className="content-area">
          {activeTab === "Dashboard" ? (
            <div className="fade-in">
              <div className="card-premium dark-box">
                <label>SELECT FIRM:</label>
                <select className="pro-select" value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="">-- Choose Firm --</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>

              {selectedFirm && (
                <div className="card-premium">
                  <table className="pro-table">
                    <thead><tr><th>Bank Name</th><th>Account No</th><th>Balance</th><th>Action</th></tr></thead>
                    <tbody>
                      {banks.filter(b => b.firmName === selectedFirm).map(b => (
                        <React.Fragment key={b.id}>
                          <tr>
                            <td>{b.bankName} ({b.branch})</td>
                            <td style={{fontWeight:'bold', color:'#555'}}>{b.accNo}</td>
                            <td className="bal-text">₹ {b.balance}</td>
                            <td>
                              <button className="btn-action btn-ledger" onClick={() => setExpandedBankId(expandedBankId === b.id ? null : b.id)}>
                                {expandedBankId === b.id ? 'Close' : 'Ledger'}
                              </button>
                            </td>
                          </tr>
                          {expandedBankId === b.id && (
                            <tr className="ledger-row">
                              <td colSpan="4">
                                <div className="ledger-container">
                                  <div className="ledger-header">
                                    <span><strong>IFSC:</strong> {b.ifsc}</span>
                                    <button className="btn-action btn-excel">+ Add Entry</button>
                                  </div>
                                  <table className="inner-table">
                                    <thead><tr><th>Date</th><th>Particulars</th><th>Dr</th><th>Cr</th></tr></thead>
                                    <tbody>
                                      {ledgerData.map(t => <tr key={t.id}><td>{t.date}</td><td>{t.desc}</td><td>{t.dr}</td><td>{t.cr}</td></tr>)}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="fade-in">
              <div className="card-premium">
                <h3>{editId ? 'Edit' : 'Add New'} {activeTab}</h3>
                <form onSubmit={handleSave} className="master-form">
                  {activeTab === "Firm Master" && (
                    <>
                      <input placeholder="Firm Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
                      <input placeholder="GST No" value={formData.gst || ''} onChange={e => setFormData({...formData, gst: e.target.value})} />
                      <input placeholder="Address" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </>
                  )}
                  {activeTab === "Bank Master" && (
                    <>
                      <select value={formData.firmName || ''} onChange={e => setFormData({...formData, firmName: e.target.value})} required>
                        <option value="">Select Firm</option>
                        {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                      </select>
                      <input placeholder="Bank Name" value={formData.bankName || ''} onChange={e => setFormData({...formData, bankName: e.target.value})} required />
                      <input placeholder="Account No" value={formData.accNo || ''} onChange={e => setFormData({...formData, accNo: e.target.value})} required />
                      <input placeholder="IFSC" value={formData.ifsc || ''} onChange={e => setFormData({...formData, ifsc: e.target.value})} />
                      <input placeholder="Opening Balance" type="number" value={formData.balance || ''} onChange={e => setFormData({...formData, balance: e.target.value})} />
                    </>
                  )}
                  <button type="submit" className="login-submit" style={{width:'200px'}}>{editId ? 'Update' : 'Save'}</button>
                  {editId && <button onClick={() => {setEditId(null); setFormData({});}} className="btn-action">Cancel</button>}
                </form>
              </div>

              <div className="card-premium">
                <table className="pro-table">
                  <thead>
                    {activeTab === "Firm Master" ? <tr><th>Firm</th><th>GST</th><th>Action</th></tr> : <tr><th>Bank</th><th>Acc No</th><th>Firm</th><th>Action</th></tr>}
                  </thead>
                  <tbody>
                    {(activeTab === "Firm Master" ? firms : banks).map(item => (
                      <tr key={item.id}>
                        <td>{item.name || item.bankName}</td>
                        <td>{item.gst || item.accNo}</td>
                        {activeTab === "Bank Master" && <td>{item.firmName}</td>}
                        <td>
                          <button className="btn-action btn-ledger" onClick={() => {setEditId(item.id); setFormData(item);}}>Edit</button>
                          <button className="btn-action btn-pdf" onClick={() => handleDelete(item.id, activeTab === "Firm Master" ? "firms" : "banks")}>Del</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value).catch(() => alert("Error"));
  };
  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>BANKING PRO</h1>
        <form className="login-form" onSubmit={handleLogin}>
          <input name="email" type="email" placeholder="Email" required />
          <input name="pass" type="password" placeholder="Password" required />
          <button type="submit" className="login-submit">LOGIN</button>
        </form>
      </div>
    </div>
  );
}