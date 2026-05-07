import React, { useEffect, useState } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");
  const [time, setTime] = useState(new Date());

  // Login & Form States
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [newFirm, setNewFirm] = useState("");
  const [newBank, setNewBank] = useState({ name: "", account: "", firm: "" });

  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => { clearInterval(i); unsub(); };
  }, []);

  useEffect(() => {
    if (!user) return;
    onSnapshot(collection(db, "firms"), (s) => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, "banks"), (s) => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, "transactions"), (s) => setTransactions(s.docs.map(d => d.data())));
    onSnapshot(collection(db, "users"), (s) => setUsersList(s.docs.map(d => d.data())));
  }, [user]);

  const handleAddFirm = async () => {
    if(!newFirm) return alert("Enter Firm Name");
    await addDoc(collection(db, "firms"), { name: newFirm, createdAt: serverTimestamp() });
    setNewFirm("");
  };

  const getBalance = (acc) => {
    const list = transactions.filter(t => String(t.account || t.Account).trim() === String(acc).trim());
    return list.reduce((total, t) => {
      const amt = Number(t.amount || t.Amount || 0);
      return (t.type?.toLowerCase() === "receipt" || t.type?.toLowerCase() === "cr") ? total + amt : total - amt;
    }, 0);
  };

  if (!user) {
    return (
      <div className="loginPage">
        <div className="loginCard">
          <h2 style={{color: '#1a2a44'}}>🏦 Softview Banking</h2>
          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPass(e.target.value)} />
          <button onClick={() => signInWithEmailAndPassword(auth, email, pass)}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="sidebar">
        <h2 style={{borderBottom: '1px solid #34495e', paddingBottom: '10px'}}>BANKING SYSTEM</h2>
        <select value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
          <option value="">Select Firm</option>
          {firms.map((f, i) => <option key={i} value={f.name}>{f.name}</option>)}
        </select>
        <div className="nav-links">
           <div className={activePage === "Dashboard" ? "active" : ""} onClick={() => setActivePage("Dashboard")}>📊 Dashboard</div>
           <div className={activePage === "Firm Master" ? "active" : ""} onClick={() => setActivePage("Firm Master")}>🏢 Firm Master</div>
           <div className={activePage === "Bank Master" ? "active" : ""} onClick={() => setActivePage("Bank Master")}>🏦 Bank Master</div>
           <div className={activePage === "User Master" ? "active" : ""} onClick={() => setActivePage("User Master")}>👥 User Master</div>
        </div>
        <button className="logout-btn" onClick={() => signOut(auth)}>Logout</button>
      </div>

      <div className="main">
        <div className="header">
           <span style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{activePage}</span>
           <span>{user.email}</span>
        </div>

        <div className="content">
          {activePage === "Firm Master" && (
            <div className="card">
              <h3>Add New Firm</h3>
              <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
                <input style={{flex: 1, padding: '10px'}} value={newFirm} placeholder="Enter Firm Name" onChange={(e)=>setNewFirm(e.target.value)} />
                <button style={{background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px'}} onClick={handleAddFirm}>Add Firm</button>
              </div>
              <table className="ledger-table">
                <thead><tr><th>SR NO.</th><th>FIRM NAME</th></tr></thead>
                <tbody>{firms.map((f, i) => <tr key={i}><td>{i+1}</td><td>{f.name}</td></tr>)}</tbody>
              </table>
            </div>
          )}

          {activePage === "Dashboard" && selectedFirm && (
            <div className="dashboard-grid">
              {banks.filter(b => b.firm === selectedFirm).map((b, i) => (
                <div key={i} className="card bank-summary-card">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <h4 style={{margin: 0}}>🏦 {b.name}</h4>
                      <small style={{color: '#666'}}>{b.account}</small>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <div style={{fontSize: '12px', color: '#888'}}>Available Balance</div>
                      <b style={{fontSize: '20px', color: '#1a2a44'}}>₹{getBalance(b.account).toLocaleString('en-IN')}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Professional Footer */}
        <div className="footer-right">
          <div className="clock-style">{time.toLocaleDateString()} | {time.toLocaleTimeString()}</div>
          <div className="dev-text">Developed by Softview Technologies | 7972084304</div>
        </div>
      </div>
    </div>
  );
}