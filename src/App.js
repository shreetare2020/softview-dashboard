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

  const logout = () => signOut(auth);

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
      if (type === "receipt" || type === "cr") { receipt = amt; balance += amt; } 
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
          <p>Softview Technologies</p>
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
           <div className="active">📊 Dashboard</div>
        </div>
        <button className="logout-btn" onClick={logout} style={{marginTop: '20px'}}>Logout</button>
        <div className="clockBox">{time.toLocaleString()}</div>
      </div>

      <div className="main">
        <div className="header"><b>{user.email}</b></div>
        <div className="content">
          <div className="page-title">
            <h2>Financial Overview</h2>
            <p>{selectedFirm || "Please select a firm"}</p>
          </div>

          {selectedFirm && banks.filter((b) => b.firm === selectedFirm).map((b, i) => (
            <div key={i} className="card ledger-card">
              <div className="card-header" onClick={() => setExpanded(expanded === b.account ? null : b.account)} style={{cursor:'pointer'}}>
                <b>🏦 {b.name} | {b.account} | ₹{getBalance(b.account)}</b>
              </div>
              {expanded === b.account && (
                <div className="ledger-container">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Particulars</th>
                        <th>Receipt (⬇)</th>
                        <th>Payment (⬆)</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getLedger(b.account).map((l, idx) => (
                        <tr key={idx}>
                          <td>{l.date}</td>
                          <td>{l.remark || "Transaction"}</td>
                          <td style={{color: 'green'}}>{l.receipt > 0 ? `₹${l.receipt}` : "-"}</td>
                          <td style={{color: 'red'}}>{l.payment > 0 ? `₹${l.payment}` : "-"}</td>
                          <td style={{fontWeight: 'bold'}}>₹{l.balance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="footerRight">Developed by Softview Technologies</div>
      </div>
    </div>
  );
}