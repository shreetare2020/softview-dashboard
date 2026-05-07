import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Data States for Masters
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    onAuthStateChanged(auth, (u) => setUser(u));
    return () => clearInterval(timer);
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
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
            <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</div>
          ))}
        </div>
        <div className="sidebar-footer">
          <span className="softview-logo">SOFTVIEW TECHNOLOGIES</span>
          <div style={{color:'#64748b'}}>Industrial Automation & Software</div>
          <div className="contact-pill">📞 +91 7972084304</div>
        </div>
      </div>

      <div className="main-stage">
        <div className="top-right-header">
          <div className="live-clock-box">
            <span style={{color:'#64748b', fontSize:'12px'}}>SERVER TIME</span>
            <span>{currentTime.toLocaleDateString('en-GB')}</span>
            <span style={{color: '#b58921'}}>|</span>
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
          <button className="btn-logout" onClick={() => signOut(auth)}>Logout</button>
        </div>

        <div className="content-area fade-in">
          
          {/* USER MASTER - Full Form with Fields */}
          {activeTab === "User Master" && (
            <div>
              <div className="master-card">
                <h3 style={{marginTop:0, color:'#0f172a'}}>👥 User Access Control</h3>
                <form className="form-grid" onSubmit={async (e) => {
                  e.preventDefault();
                  await addDoc(collection(db, "users"), {
                    uName: e.target.uName.value,
                    uEmail: e.target.uEmail.value,
                    uRole: e.target.uRole.value,
                    uPhone: e.target.uPhone.value
                  });
                  e.target.reset();
                }}>
                  <input name="uName" className="pro-input" placeholder="User Full Name" required />
                  <input name="uEmail" className="pro-input" type="email" placeholder="Email Address" required />
                  <input name="uPhone" className="pro-input" placeholder="Mobile Number" />
                  <select name="uRole" className="pro-input">
                    <option value="Operator">Operator</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <button type="submit" className="btn-gold" style={{height:'45px'}}>Create User</button>
                </form>
              </div>

              <div className="master-card">
                <h4>System Users History ({usersList.length})</h4>
                <table className="pro-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Contact</th></tr></thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id}><td><strong>{u.uName}</strong></td><td>{u.uEmail}</td><td>{u.uRole}</td><td>{u.uPhone}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Similar logic for Firm and Bank Master... */}
        </div>
      </div>
    </div>
  );
}

// ... LoginScreen function remains same as previous premium version