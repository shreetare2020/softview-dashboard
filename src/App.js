import React, { useEffect, useState } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    onSnapshot(collection(db, "firms"), (s) => setFirms(s.docs.map(d => d.data())));
    onSnapshot(collection(db, "banks"), (s) => setBanks(s.docs.map(d => d.data())));
    onSnapshot(collection(db, "transactions"), (s) => setTransactions(s.docs.map(d => d.data())));
    onSnapshot(collection(db, "users"), (s) => setUsersList(s.docs.map(d => d.data())));
  }, [user]);

  const getLedger = (account) => {
    let balance = 0;
    return transactions
      .filter((t) => String(t.account || t.Account || "").trim() === String(account).trim())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((t) => {
        const amt = Number(t.amount || t.Amount || 0);
        const type = String(t.type || t.Type || "").toLowerCase();
        let receipt = (type === "receipt" || type === "cr") ? amt : 0;
        let payment = (type === "payment" || type === "dr") ? amt : 0;
        balance += (receipt - payment);
        return { ...t, receipt, payment, balance };
      });
  };

  if (!user) {
    return (
      <div className="loginPage">
        <div className="loginCard">
          <h2>🏦 SOFTVIEW BANKING</h2>
          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPass(e.target.value)} />
          <button onClick={() => signInWithEmailAndPassword(auth, email, pass)}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app" style={{display:'flex'}}>
      <div className="sidebar" style={{width:'250px'}}>
        <h2>MANAGEMENT</h2>
        <select value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)} style={{width:'100%', padding:'10px', marginBottom:'20px'}}>
          <option value="">Select Firm</option>
          {firms.map((f, i) => <option key={i} value={f.name}>{f.name}</option>)}
        </select>
        <div className="nav-links">
           <div className={activePage === "Dashboard" ? "active" : ""} onClick={() => setActivePage("Dashboard")}>📊 Dashboard</div>
           <div className={activePage === "Firm Master" ? "active" : ""} onClick={() => setActivePage("Firm Master")}>🏢 Firm Master</div>
           <div className={activePage === "Bank Master" ? "active" : ""} onClick={() => setActivePage("Bank Master")}>🏦 Bank Master</div>
           <div className={activePage === "User Master" ? "active" : ""} onClick={() => setActivePage("User Master")}>👥 User Master</div>
        </div>
        <button onClick={() => signOut(auth)} className="logout-btn" style={{marginTop:'30px'}}>Sign Out</button>
      </div>

      <div className="main">
        <div className="header">
           <span>Developed by Softview Technologies</span>
           <span>{user.email}</span>
        </div>

        <div className="content">
          <h2 style={{color:'#1a2a44', marginBottom:'20px'}}>{activePage}</h2>

          {activePage === "Firm Master" && (
            <div className="card">
              <h3>Firm Directory</h3>
              <table>
                <thead><tr><th>Firm Name</th><th>Address</th><th>GSTIN</th></tr></thead>
                <tbody>{firms.map((f, i) => <tr key={i}><td>{f.name}</td><td>{f.address || '-'}</td><td>{f.gst || '-'}</td></tr>)}</tbody>
              </table>
            </div>
          )}

          {activePage === "Bank Master" && (
            <div className="card">
              <h3>Bank Accounts</h3>
              <table>
                <thead><tr><th>Bank Name</th><th>Account No</th><th>Firm Associated</th></tr></thead>
                <tbody>{banks.map((b, i) => <tr key={i}><td>{b.name}</td><td>{b.account}</td><td>{b.firm}</td></tr>)}</tbody>
              </table>
            </div>
          )}

          {activePage === "User Master" && (
            <div className="card">
              <h3>System Access</h3>
              <table>
                <thead><tr><th>User Name</th><th>Email</th><th>Role</th></tr></thead>
                <tbody>{usersList.map((u, i) => <tr key={i}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>)}</tbody>
              </table>
            </div>
          )}

          {activePage === "Dashboard" && selectedFirm && 
            banks.filter(b => String(b.firm || "").toLowerCase() === selectedFirm.toLowerCase()).map((b, i) => (
              <div key={i} className="card">
                <div style={{display:'flex', justifyContent:'space-between', cursor:'pointer'}} onClick={() => setExpanded(expanded === b.account ? null : b.account)}>
                  <b>🏦 {b.name} ({b.account})</b>
                  <b className="bal-amt">₹{getLedger(b.account).pop()?.balance.toLocaleString('en-IN') || 0}</b>
                </div>
                {expanded === b.account && (
                  <table>
                    <thead><tr><th>Date</th><th>Particulars</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr></thead>
                    <tbody>
                      {getLedger(b.account).map((l, idx) => (
                        <tr key={idx}>
                          <td>{l.date}</td><td>{l.remark}</td>
                          <td className="txt-green">{l.receipt > 0 ? `₹${l.receipt}` : '-'}</td>
                          <td className="txt-red">{l.payment > 0 ? `₹${l.payment}` : '-'}</td>
                          <td><b>₹{l.balance}</b></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}