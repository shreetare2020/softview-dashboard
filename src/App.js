import React, { useEffect, useState } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function App() {
  const [user, setUser] = useState(null);
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [usersList, setUsersList] = useState([]); // User Master ke liye
  const [selectedFirm, setSelectedFirm] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // Sabhi Masters ka data fetch karna
  useEffect(() => {
    if (!user) return;
    const unsubFirms = onSnapshot(collection(db, "firms"), (s) => setFirms(s.docs.map(d => d.data())));
    const unsubBanks = onSnapshot(collection(db, "banks"), (s) => setBanks(s.docs.map(d => d.data())));
    const unsubTrans = onSnapshot(collection(db, "transactions"), (s) => setTransactions(s.docs.map(d => d.data())));
    const unsubUsers = onSnapshot(collection(db, "users"), (s) => setUsersList(s.docs.map(d => d.data())));
    
    return () => { unsubFirms(); unsubBanks(); unsubTrans(); unsubUsers(); };
  }, [user]);

  const login = async () => {
    try { await signInWithEmailAndPassword(auth, email, pass); } 
    catch { alert("Login Failed"); }
  };

  const getLedger = (account) => {
    let balance = 0;
    const acc = String(account || "").trim();
    const list = transactions
      .filter((t) => String(t.account || t.Account || "").trim() === acc)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return list.map((t) => {
      const amt = Number(t.amount || t.Amount || 0);
      const type = String(t.type || t.Type || "").toLowerCase();
      let receipt = 0, payment = 0;
      if (type === "receipt" || type === "cr" || type === "in") { receipt = amt; balance += amt; } 
      else { payment = amt; balance -= amt; }
      return { ...t, receipt, payment, balance };
    });
  };

  const getBalance = (account) => {
    const l = getLedger(account);
    return l.length ? l[l.length - 1].balance : 0;
  };

  if (!user) {
    return (
      <div className="loginPage">
        <div className="loginCard">
          <h2>🏦 Banking Dashboard</h2>
          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPass(e.target.value)} />
          <button onClick={login}>Login</button>
          <p className="dev-tag">Developed by Softview Technologies</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="sidebar">
        <h2>🏦 Banking System</h2>
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
        <div className="clockBox">{time.toLocaleString()}</div>
      </div>

      <div className="main">
        <div className="header">
           <span className="dev-text">Softview Technologies</span>
           <b>{user.email}</b>
        </div>
        
        <div className="content">
          <div className="page-title">
            <h2>{activePage}</h2>
          </div>

          {/* User Master Page */}
          {activePage === "User Master" && (
            <div className="card">
              <h3>System Users</h3>
              <table className="ledger-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
                <tbody>
                  {usersList.map((u, i) => (
                    <tr key={i}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Firm Master Page */}
          {activePage === "Firm Master" && (
            <div className="card">
              <h3>Registered Firms</h3>
              <ul>{firms.map((f, i) => <li key={i}>{f.name} - {f.address || 'No Address'}</li>)}</ul>
            </div>
          )}

          {/* Dashboard Logic */}
          {activePage === "Dashboard" && selectedFirm && 
            banks.filter(b => String(b.firm || b.Firm || "").toLowerCase() === selectedFirm.toLowerCase()).map((b, i) => (
              <div key={i} className="card ledger-card">
                <div className="dashboard-bank-row" onClick={() => setExpanded(expanded === b.account ? null : b.account)}>
                   <span>{expanded === b.account ? '▼' : '▶'} 🏦 {b.name} ({b.account})</span>
                   <b>₹{getBalance(b.account).toLocaleString('en-IN')}</b>
                </div>
                {expanded === b.account && (
                  <div className="ledger-container">
                    <table className="ledger-table">
                      <thead><tr><th>Date</th><th>Remark</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr></thead>
                      <tbody>
                        {getLedger(b.account).map((l, idx) => (
                          <tr key={idx}>
                            <td>{l.date}</td><td>{l.remark}</td>
                            <td className="txt-green">₹{l.receipt}</td>
                            <td className="txt-red">₹{l.payment}</td>
                            <td>₹{l.balance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}