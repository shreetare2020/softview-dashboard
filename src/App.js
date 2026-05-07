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

  // --- DATA FETCHING WITH LOGS ---
  useEffect(() => {
    // Firms fetch logic
    onSnapshot(collection(db, "firms"), (s) => {
      console.log("Firms found:", s.docs.length); 
      setFirms(s.docs.map((d) => d.data()));
    });

    // Banks fetch logic
    onSnapshot(collection(db, "banks"), (s) => {
      console.log("Banks found in DB:", s.docs.length); 
      setBanks(s.docs.map((d) => d.data()));
    });

    // Transactions fetch logic
    onSnapshot(collection(db, "transactions"), (s) => {
      console.log("Transactions found:", s.docs.length);
      setTransactions(s.docs.map((d) => d.data()));
    });
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

  const exportExcel = (account) => {
    const data = getLedger(account);
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Date,Particulars,Receipt,Payment,Balance", 
         ...data.map(d => `${d.date},${d.remark || 'Entry'},${d.receipt},${d.payment},${d.balance}`)]
         .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ledger_${account}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const exportPDF = (account) => {
    const doc = new jsPDF();
    const data = getLedger(account);
    doc.text(`Bank Ledger: ${account}`, 14, 15);
    doc.autoTable({
      startY: 22,
      head: [["Date", "Particulars", "Receipt", "Payment", "Balance"]],
      body: data.map(d => [d.date, d.remark || "Entry", d.receipt, d.payment, d.balance]),
    });
    doc.save(`Ledger_${account}.pdf`);
  };

  if (!user) {
    return (
      <div className="loginPage">
        <div className="loginCard">
          <h2>Banking Dashboard</h2>
          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPass(e.target.value)} />
          <button onClick={login}>Login</button>
          <p style={{marginTop:'20px', fontSize:'10px', color:'#888'}}>SOFTVIEW TECHNOLOGIES</p>
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
           <div className={activePage === "Firm Master" ? "active" : ""} onClick={() => setActivePage("Firm Master")}>🏢 Firm Master</div>
           <div className={activePage === "Bank Master" ? "active" : ""} onClick={() => setActivePage("Bank Master")}>🏦 Bank Master</div>
           <div className={activePage === "User Master" ? "active" : ""} onClick={() => setActivePage("User Master")}>👥 User Master</div>
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

          {/* DASHBOARD SECTION */}
          {activePage === "Dashboard" && selectedFirm && 
            banks.filter(b => (b.firm || b.Firm || "").toLowerCase() === selectedFirm.toLowerCase()).map((b, i) => (
              <div key={i} className="card ledger-card" style={{marginBottom:'10px', border:'1px solid #eee'}}>
                <div className="dashboard-bank-row" onClick={() => setExpanded(expanded === b.account ? null : b.account)} style={{cursor:'pointer', padding:'15px', display:'flex', justifyContent:'space-between'}}>
                  <div className="bank-info-main">
                    <span className="expand-icon">{expanded === b.account ? '▼' : '▶'}</span>
                    <span className="bank-label" style={{fontWeight:'bold', marginLeft:'10px'}}>🏦 {b.name}</span>
                    <span className="acc-label" style={{color:'#666', fontSize:'12px', marginLeft:'10px'}}>({b.account})</span>
                  </div>
                  <div className="bank-balance-main">
                    <b className="bal-amt" style={{color:'#2a5298', fontSize:'16px'}}>₹{getBalance(b.account).toLocaleString('en-IN')}</b>
                  </div>
                </div>

                {expanded === b.account && (
                  <div className="ledger-container" style={{padding:'15px', background:'#f9f9f9', borderTop:'1px solid #eee'}}>
                    <div className="export-bar" style={{textAlign:'right', marginBottom:'10px'}}>
                      <button className="btn-ex" onClick={() => exportExcel(b.account)} style={{background:'#27ae60', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px', cursor:'pointer'}}>📥 Excel</button>
                      <button className="btn-pdf" onClick={() => exportPDF(b.account)} style={{background:'#e74c3c', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px', cursor:'pointer', marginLeft:'5px'}}>📄 PDF</button>
                    </div>
                    <table className="ledger-table" style={{width:'100%', borderCollapse:'collapse'}}>
                      <thead>
                        <tr style={{background:'#eee'}}>
                          <th style={{padding:'8px', textAlign:'left'}}>Date</th>
                          <th style={{padding:'8px', textAlign:'left'}}>Particulars</th>
                          <th style={{padding:'8px', textAlign:'left'}}>Receipt</th>
                          <th style={{padding:'8px', textAlign:'left'}}>Payment</th>
                          <th style={{padding:'8px', textAlign:'left'}}>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getLedger(b.account).map((l, idx) => (
                          <tr key={idx} style={{borderBottom:'1px solid #eee'}}>
                            <td style={{padding:'8px'}}>{l.date}</td>
                            <td style={{padding:'8px'}}>{l.remark || "-"}</td>
                            <td style={{padding:'8px', color:'green'}}>{l.receipt > 0 ? `₹${l.receipt}` : "-"}</td>
                            <td style={{padding:'8px', color:'red'}}>{l.payment > 0 ? `₹${l.payment}` : "-"}</td>
                            <td style={{padding:'8px'}}><b>₹{l.balance}</b></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          }

          {/* Fallback agar koi bank na mile */}
          {activePage === "Dashboard" && selectedFirm && banks.filter(b => (b.firm || b.Firm || "").toLowerCase() === selectedFirm.toLowerCase()).length === 0 && (
            <div className="card" style={{padding:'20px', textAlign:'center', color:'#888'}}>
              No banks found for this firm. Please check Bank Master.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}