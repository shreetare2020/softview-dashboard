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
  const [selectedFirm, setSelectedFirm] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard"); // Page tracking ke liye

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

  useEffect(() => {
    onSnapshot(collection(db, "firms"), (s) => setFirms(s.docs.map((d) => d.data())));
    onSnapshot(collection(db, "banks"), (s) => setBanks(s.docs.map((d) => d.data())));
    onSnapshot(collection(db, "transactions"), (s) => setTransactions(s.docs.map((d) => d.data())));
  }, []);

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
          <h2>Banking Dashboard</h2>
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
        <select onChange={(e) => setSelectedFirm(e.target.value)}>
          <option value="">Select Firm</option>
          {firms.map((f, i) => <option key={i} value={f.name}>{f.name}</option>)}
        </select>
        
        <div className="nav-links">
           <div className={activePage === "Dashboard" ? "active" : ""} onClick={() => setActivePage("Dashboard")}>📊 Dashboard</div>
           <div onClick={() => setActivePage("Firm Master")}>🏢 Firm Master</div>
           <div onClick={() => setActivePage("Bank Master")}>🏦 Bank Master</div>
           <div onClick={() => setActivePage("User Master")}>👥 User Master</div>
        </div>

        <button className="logout-btn" onClick={() => signOut(auth)}>Logout</button>
        <div className="clockBox">{time.toLocaleString()}</div>
      </div>

      <div className="main">
        <div className="header">
           <span className="dev-text">Developed by Softview Technologies</span>
           <b>{user.email}</b>
        </div>
        
        <div className="content">
          <div className="page-title">
            <h2>{activePage}</h2>
            <p>{selectedFirm || "Please select a firm from sidebar"}</p>
          </div>

          {/* DASHBOARD PAGE START */}
          {activePage === "Dashboard" && selectedFirm && 
            banks.filter((b) => String(b.firm).toLowerCase() === String(selectedFirm).toLowerCase())
            .map((b, i) => (
              <div key={i} className="card ledger-card">
                
                {/* BANK SUMMARY LINE (CLICK TO EXPAND) */}
                <div 
                  className="card-header dashboard-bank-row" 
                  onClick={() => setExpanded(expanded === b.account ? null : b.account)}
                  style={{cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'}}
                >
                  <div className="bank-info-main">
                    <span className="expand-icon">{expanded === b.account ? '▼' : '▶'}</span>
                    <span className="bank-label" style={{fontWeight: '600', marginLeft: '10px'}}>🏦 {b.name}</span>
                    <span className="acc-label" style={{color: '#777', fontSize: '13px', marginLeft: '10px'}}>({b.account})</span>
                  </div>
                  <div className="bank-balance-main">
                    <span style={{fontSize: '12px', color: '#666', marginRight: '5px'}}>BALANCE:</span>
                    <b style={{color: '#2a5298', fontSize: '17px'}}>₹{getBalance(b.account).toLocaleString('en-IN')}</b>
                  </div>
                </div>
                
                {/* EXPANDABLE LEDGER & EXPORT BUTTONS */}
                {expanded === b.account && (
                  <div className="ledger-container" style={{padding: '20px', background: '#fafbfc', borderTop: '1px solid #eee'}}>
                    
                    {/* EXCEL & PDF BUTTONS */}
                    <div className="export-bar" style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginBottom: '15px'}}>
                      <button className="btn-ex" onClick={() => exportExcel(b.account)} style={{background: '#27ae60', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer'}}>📥 Excel</button>
                      <button className="btn-pdf" onClick={() => exportPDF(b.account)} style={{background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer'}}>📄 PDF Report</button>
                    </div>

                    <table className="ledger-table" style={{width: '100%', borderCollapse: 'collapse', background: 'white'}}>
                      <thead>
                        <tr style={{background: '#f1f4f9'}}>
                          <th style={{padding: '12px', textAlign: 'left', fontSize: '13px'}}>Date</th>
                          <th style={{padding: '12px', textAlign: 'left', fontSize: '13px'}}>Particulars</th>
                          <th style={{padding: '12px', textAlign: 'left', fontSize: '13px'}}>Receipt (⬇)</th>
                          <th style={{padding: '12px', textAlign: 'left', fontSize: '13px'}}>Payment (⬆)</th>
                          <th style={{padding: '12px', textAlign: 'left', fontSize: '13px'}}>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getLedger(b.account).map((l, idx) => (
                          <tr key={idx} style={{borderBottom: '1px solid #f1f1f1'}}>
                            <td style={{padding: '12px'}}>{l.date}</td>
                            <td style={{padding: '12px'}}>{l.remark || "Bank Entry"}</td>
                            <td style={{padding: '12px', color: '#27ae60', fontWeight: 'bold'}}>{l.receipt > 0 ? `₹${l.receipt}` : "-"}</td>
                            <td style={{padding: '12px', color: '#e74c3c', fontWeight: 'bold'}}>{l.payment > 0 ? `₹${l.payment}` : "-"}</td>
                            <td style={{padding: '12px', fontWeight: 'bold'}}>₹{l.balance.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          }
          {/* DASHBOARD PAGE END */}