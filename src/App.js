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
  const [usersList, setUsersList] = useState([]);
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

  // Masters ka data fetch karne ka logic
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
           <span>Softview Technologies</span>
           <b>{user.email}</b>
        </div>
        
        <div className="content">
          <div className="page-title"><h2>{activePage}</h2></div>

          {/* User Master Content */}
          {activePage === "User Master" && (
            <div className="card">
              <h3>System Users</h3>
              <ul>{usersList.map((u, i) => <li key={i}>{u.name} ({u.role})</li>)}</ul>
            </div>
          )}

          {/* Firm Master Content */}
          {activePage === "Firm Master" && (
            <div className="card">
              <h3>Registered Firms</h3>
              <ul>{firms.map((f, i) => <li key={i}>{f.name}</li>)}</ul>
            </div>
          )}

          {/* Bank Master Content */}
          {activePage === "Bank Master" && (
            <div className="card">
              <h3>Bank Accounts</h3>
              <ul>{banks.map((b, i) => <li key={i}>{b.name} - {b.account} ({b.firm})</li>)}</ul>
            </div>
          )}

          {/* Dashboard Content */}
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
                      <thead><tr><th>Date</th><th>Particulars</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr></thead>
                      <tbody>
                        {getLedger(b.account).map((l, idx) => (
                          <tr key={idx}>
                            <td>{l.date}</td><td>{l.remark}</td>
                            <td style={{color:'green'}}>₹{l.receipt}</td>
                            <td style={{color:'red'}}>₹{l.payment}</td>
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