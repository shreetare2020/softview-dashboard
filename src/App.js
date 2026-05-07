import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("Dashboard");
  const [dateTime, setDateTime] = useState(new Date());
  
  // Data States
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => { unsub(); clearInterval(timer); };
  }, []);

  // Real-time Data Sync
  useEffect(() => {
    if (!user) return;
    onSnapshot(collection(db, "firms"), (s) => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, "banks"), (s) => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, "users"), (s) => setUsers(s.docs.map(d => ({id: d.id, ...d.data()}))));
  }, [user]);

  const exportToExcel = (data, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  if (loading) return <div className="loader">Securing Session...</div>;

  if (!user) {
    return (
      <div className="login-container">
        <form className="login-card" onSubmit={(e) => {
          e.preventDefault();
          signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
        }}>
          <h2>Banking Portal Login</h2>
          <input name="email" type="email" placeholder="Email" required />
          <input name="pass" type="password" placeholder="Password" required />
          <button type="submit">LOGIN</button>
          <p style={{fontSize:'11px', marginTop:'20px'}}>Softview Technologies | 7972084304</p>
        </form>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h2>BANKING SYSTEM</h2>
        <div className={`nav-item ${activePage === "Dashboard" ? "active" : ""}`} onClick={() => setActivePage("Dashboard")}>📊 Dashboard</div>
        <div className={`nav-item ${activePage === "Firm Master" ? "active" : ""}`} onClick={() => setActivePage("Firm Master")}>🏢 Firm Master</div>
        <div className={`nav-item ${activePage === "Bank Master" ? "active" : ""}`} onClick={() => setActivePage("Bank Master")}>🏦 Bank Master</div>
        <div className={`nav-item ${activePage === "User Master" ? "active" : ""}`} onClick={() => setActivePage("User Master")}>👤 User Master</div>
        <button onClick={() => signOut(auth)} style={{marginTop:'50px', background:'red', color:'white', border:'none', padding:'10px', width:'100%', borderRadius:'8px'}}>LOGOUT</button>
      </div>

      <div className="main-stage">
        <div className="top-header">
          <div className="user-info-box">
            <div className="user-name">{user.email.split('@')[0]}</div>
            <div className="date-time">{dateTime.toLocaleDateString()} || {dateTime.toLocaleTimeString()}</div>
          </div>
        </div>

        {activePage === "Firm Master" && (
          <div className="card">
            <h3>🏢 Firm Master</h3>
            <div className="form-grid">
              <input id="fName" placeholder="Firm Name" />
              <button onClick={() => addDoc(collection(db,"firms"), {name: document.getElementById('fName').value})}>Add Firm</button>
            </div>
            <table className="pro-table">
              <thead><tr><th>Sr.</th><th>Firm Name</th><th>Action</th></tr></thead>
              <tbody>{firms.map((f, i) => <tr key={f.id}><td>{i+1}</td><td>{f.name}</td><td>Delete</td></tr>)}</tbody>
            </table>
          </div>
        )}

        {/* Bank Master, User Master and Dashboard UI logic similarly goes here */}
        
        <div className="footer-bottom-left">
          Developed by <strong>Softview Technologies</strong> | 7972084304
        </div>
      </div>
    </div>
  );
}