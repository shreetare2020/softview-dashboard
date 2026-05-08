import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, Settings, LogOut, FileSpreadsheet, FileText } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [dateTime, setDateTime] = useState(new Date());
  const [banks, setBanks] = useState([]);
  const [expandedBank, setExpandedBank] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
    return () => { clearInterval(timer); unsub(); };
  }, [user]);

  if (!user) return <LoginScreen />;

  return (
    <div className="main-layout">
      {/* SIDEBAR FIXED */}
      <aside className="sidebar-container">
        <div className="sidebar-header">
          <h2 className="gold-txt">BANKING PRO</h2>
          <span className="premium-tag">EXECUTIVE EDITION</span>
        </div>
        
        <nav className="sidebar-nav">
          <div className={activeTab === "Dashboard" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("Dashboard")}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={activeTab === "Firm Master" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("Firm Master")}><Building2 size={18}/> Firm Master</div>
          <div className={activeTab === "Bank Master" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("Bank Master")}><Landmark size={18}/> Bank Master</div>
          <div className={activeTab === "User Master" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("User Master")}><Users size={18}/> User Master</div>
          <div className={activeTab === "Settings" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("Settings")}><Settings size={18}/> Settings</div>
        </nav>

        <div className="sidebar-branding-bottom">
          <p className="sv-dev">EXPERTLY CRAFTED BY</p>
          <p className="sv-name">SOFTVIEW TECHNOLOGIES</p>
          <p className="sv-num">Support: +91 7972084304</p>
        </div>
      </aside>

      {/* MAIN VIEW AREA */}
      <main className="view-stage">
        <header className="executive-header">
          <div className="tab-name">{activeTab}</div>
          <div className="header-meta">
            <div className="user-info-box">
              <span className="u-name">ADMIN</span>
              <span className="u-clock">{dateTime.toLocaleString()}</span>
            </div>
            <button className="logout-premium-btn" onClick={() => signOut(auth)}>
              <LogOut size={16}/> Logout
            </button>
          </div>
        </header>

        <section className="content-scroll">
          {activeTab === "Dashboard" && (
            <div className="gold-card">
              <table className="bank-table">
                <thead>
                  <tr><th>Bank Name</th><th>Account Number</th><th>Closing Balance</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {banks.map(b => (
                    <React.Fragment key={b.id}>
                      <tr>
                        <td>{b.bankName}</td><td>{b.accNo}</td>
                        <td className="gold-amount">₹ {b.balance} Cr.</td>
                        <td><button className="v-btn" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>View Ledger</button></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr className="ledger-row"><td colSpan="4">
                          <div className="ledger-pane">
                            <div className="pane-tools">
                                <button className="tool-btn exl"><FileSpreadsheet size={14}/> Excel</button>
                                <button className="tool-btn pdf"><FileText size={14}/> PDF</button>
                            </div>
                            <table className="inner-ledger">
                              <thead><tr><th>Date</th><th>Particulars</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr></thead>
                              <tbody><tr><td>08/05/2026</td><td>Opening Balance</td><td className="txt-g">₹ {b.balance}</td><td className="txt-r">₹ 0</td><td>₹ {b.balance}</td></tr></tbody>
                            </table>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function LoginScreen() { return <div className="login-stage">...</div>; }