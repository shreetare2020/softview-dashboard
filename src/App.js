import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";

function LoginScreen() {
  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo" style={{fontSize: '50px'}}>🏢</div>
        <h1 style={{color: '#1a237e', marginBottom: '30px'}}>BANKING PRO</h1>
        <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          <input name="email" type="email" placeholder="Email" style={{padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}} required />
          <input name="pass" type="password" placeholder="Password" style={{padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}} required />
          <button type="submit" style={{padding: '12px', background: '#1a237e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold'}}>LOGIN</button>
        </form>
        <div className="login-footer" style={{marginTop: '30px', fontSize: '12px', color: '#666'}}>
          Developed by: <strong style={{color: '#1a237e'}}>SOFTVIEW TECHNOLOGIES</strong>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("");

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

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
          <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </div>
        ))}
        <div className="sidebar-footer">
          <span className="softview-name">SOFTVIEW TECHNOLOGIES</span><br/>
          📞 +91 7972084304
        </div>
      </div>

      <div className="main-stage">
        <div className="top-nav">
          <div>Welcome, <strong>{user.email}</strong></div>
          <button className="btn-logout" onClick={() => signOut(auth)}>Logout</button>
        </div>

        <div className="content-area">
          {activeTab === "Dashboard" ? (
            <div>
              <div className="filter-card">
                <label>SELECT FIRM:</label>
                <select className="pro-select" value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="">-- Choose --</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              {selectedFirm && (
                <div className="card-premium">
                  <table className="pro-table">
                    <thead><tr><th>Bank</th><th>Branch</th><th>Balance</th><th>Action</th></tr></thead>
                    <tbody>
                      {banks.filter(b => b.firmName === selectedFirm).map(b => (
                        <tr key={b.id}>
                          <td>{b.bankName}</td><td>{b.branch}</td><td style={{color: 'green', fontWeight: 'bold'}}>₹ {b.balance}</td>
                          <td><button className="btn-ledger">Ledger</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="card-premium" style={{padding: '20px'}}>
              <h2>{activeTab}</h2>
              <p>Data loading from Firebase...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}