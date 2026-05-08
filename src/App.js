import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { Trash2, FileSpreadsheet, FileText, Settings, LayoutDashboard, Building2, Landmark, Users, LogOut, ChevronDown, ShieldCheck, Edit3 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default function App() {
  const [user, setUser] = useState(null);
  const [dateTime, setDateTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [form, setForm] = useState({});
  const [expandedBank, setExpandedBank] = useState(null);
  const [firmFilter, setFirmFilter] = useState("All");

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
    return () => { clearInterval(timer); unsub(); };
  }, [user]);

  const handleSave = async (coll) => {
    try {
      await addDoc(collection(db, coll), { ...form, createdAt: new Date() });
      setForm({}); alert("Successfully Saved to Records");
    } catch (e) { alert("Error saving data"); }
  };

  const exportData = (b, type) => {
    const ledgerData = [
      { Date: '08/05/2026', Particulars: 'Opening Balance', Debit: '-', Credit: b.balance, Balance: b.balance + ' Cr.' },
      { Date: '08/05/2026', Particulars: 'Sample Transaction', Debit: '-', Credit: '5,000', Balance: (parseFloat(b.balance) + 5000) + ' Cr.' }
    ];
    if (type === 'excel') {
      const ws = XLSX.utils.json_to_sheet(ledgerData);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Ledger");
      XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
    } else {
      const doc = new jsPDF();
      doc.setFillColor(10, 14, 46); doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(212, 175, 55); doc.setFontSize(20); doc.text("BANK TRANSACTION LEDGER", 14, 22);
      doc.autoTable({
        startY: 45,
        head: [['Date', 'Particulars', 'Debit', 'Credit', 'Balance']],
        body: ledgerData.map(r => [r.Date, r.Particulars, r.Debit, r.Credit, r.Balance]),
        headStyles: { fillColor: [10, 14, 46], textColor: [212, 175, 55] }
      });
      doc.save(`${b.bankName}_Ledger.pdf`);
    }
  };

  const filteredBanks = firmFilter === "All" ? banks : banks.filter(b => b.firmLink === firmFilter);

  if (!user) return <LoginScreen />;

  return (
    <div className="main-wrapper">
      <aside className="sidebar-gold">
        <div className="sidebar-brand">
          <h2 className="gold-text">BANKING PRO</h2>
          <p className="version-text">EXECUTIVE VERSION 2.0</p>
        </div>
        <nav className="sidebar-menu">
          {["Dashboard", "Firm Master", "Bank Master", "User Master", "Settings"].map(tab => (
            <div key={tab} className={activeTab === tab ? "menu-item active" : "menu-item"} onClick={() => setActiveTab(tab)}>
              {tab === "Dashboard" && <LayoutDashboard size={18}/>}
              {tab === "Firm Master" && <Building2 size={18}/>}
              {tab === "Bank Master" && <Landmark size={18}/>}
              {tab === "User Master" && <Users size={18}/>}
              {tab === "Settings" && <Settings size={18}/>}
              {tab}
            </div>
          ))}
        </nav>
        <div className="branding-box">
          <div className="divider-line"></div>
          <p className="small-label">EXPERTLY CRAFTED BY</p>
          <h4 className="sv-title">SOFTVIEW TECHNOLOGIES</h4>
          <p className="sv-phone">+91 7972084304</p>
        </div>
      </aside>

      <main className="content-gold">
        <header className="main-header">
          <div><p className="portal-tag">System Portal</p><h2 className="tab-title">{activeTab}</h2></div>
          <div className="header-right">
            <div className="admin-status"><span className="status-name">ADMIN ACCESS</span><span className="status-time">{dateTime.toLocaleTimeString()}</span></div>
            <button className="btn-logout" onClick={() => signOut(auth)}><LogOut size={16}/> LOGOUT</button>
          </div>
        </header>

        <section className="scroll-content">
          {activeTab === "Dashboard" && (
            <div className="luxury-panel">
              <div className="filter-executive">
                <label>Select Firm Here:</label>
                <select className="gold-select" value={firmFilter} onChange={(e) => setFirmFilter(e.target.value)}>
                  <option value="All">--- ALL FIRMS SUMMARY ---</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              <table className="executive-table">
                <thead><tr><th>BANK</th><th>A/C NO</th><th>BALANCE</th><th>ACTION</th></tr></thead>
                <tbody>
                  {filteredBanks.map(b => (
                    <React.Fragment key={b.id}>
                      <tr className="row-main">
                        <td><strong>{b.bankName}</strong></td><td>{b.accNo}</td>
                        <td className="gold-amt">₹ {b.balance} Cr.</td>
                        <td><button className="btn-ledger" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>VIEW LEDGER <ChevronDown size={14}/></button></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr><td colSpan="4">
                          <div className="ledger-box">
                            <div className="ledger-top"><span>Ledger Summary View</span>
                              <div className="export-btns">
                                <button className="ex-excel" onClick={() => exportData(b, 'excel')}>EXCEL</button>
                                <button className="ex-pdf" onClick={() => exportData(b, 'pdf')}>PDF</button>
                              </div>
                            </div>
                            <table className="ledger-table">
                              <thead><tr><th>Date</th><th>Particulars</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
                              <tbody>
                                <tr className="open-row"><td>08/05/2026</td><td><strong>OPENING BALANCE</strong></td><td>-</td><td>₹ {b.balance}</td><td>₹ {b.balance} Cr.</td></tr>
                                <tr><td>08/05/2026</td><td>Sample Transaction</td><td>-</td><td>₹ 5,000</td><td>₹ {parseFloat(b.balance) + 5000} Cr.</td></tr>
                              </tbody>
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

          {activeTab === "Firm Master" && (
            <div className="luxury-panel">
              <div className="master-entry">
                <h3>Firm Registration</h3>
                <div className="form-grid-gold">
                  <input placeholder="Firm Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                  <input placeholder="GST Number" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                  <input placeholder="Office Address" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
                <button className="gold-action-btn" onClick={() => handleSave("firms")}>REGISTER FIRM</button>
              </div>
              <div className="history-gold">
                <h4>Registration History</h4>
                <table className="history-table">
                  <thead><tr><th>Firm Name</th><th>GST No</th><th>Address</th><th>Action</th></tr></thead>
                  <tbody>{firms.map(f => (<tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td><td><Edit3 size={16} className="edit-ic"/><Trash2 size={16} className="del-ic"/></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div className="luxury-panel">
              <div className="master-entry">
                <h3>Bank Account Setup</h3>
                <div className="form-grid-gold">
                  <input placeholder="Bank Name" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
                  <input placeholder="Branch" value={form.branch || ''} onChange={e => setForm({...form, branch: e.target.value})} />
                  <input placeholder="Account No" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
                  <input placeholder="Opening Balance" value={form.balance || ''} onChange={e => setForm({...form, balance: e.target.value})} />
                  <select value={form.firmLink || ''} onChange={e => setForm({...form, firmLink: e.target.value})}>
                    <option value="">Select Linked Firm</option>
                    {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
                <button className="gold-action-btn" onClick={() => handleSave("banks")}>LINK BANK ACCOUNT</button>
              </div>
              <div className="history-gold">
                <h4>Bank Accounts History</h4>
                <table className="history-table">
                  <thead><tr><th>Bank</th><th>Branch</th><th>A/c No</th><th>Linked Firm</th><th>Action</th></tr></thead>
                  <tbody>{banks.map(b => (<tr key={b.id}><td>{b.bankName}</td><td>{b.branch}</td><td>{b.accNo}</td><td>{b.firmLink}</td><td><Edit3 size={16} className="edit-ic"/><Trash2 size={16} className="del-ic"/></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "User Master" && (
            <div className="luxury-panel">
              <div className="master-entry">
                <h3>User Administration</h3>
                <div className="form-grid-gold">
                  <input placeholder="User Code" value={form.uCode || ''} onChange={e => setForm({...form, uCode: e.target.value})} />
                  <input placeholder="Full Name" value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
                  <input placeholder="Email Address" value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
                  <input placeholder="Mobile No" value={form.uMob || ''} onChange={e => setForm({...form, uMob: e.target.value})} />
                  <input type="password" placeholder="System Password" value={form.uPass || ''} onChange={e => setForm({...form, uPass: e.target.value})} />
                </div>
                <button className="gold-action-btn" onClick={() => handleSave("users")}>AUTHORIZE NEW USER</button>
              </div>
              <div className="history-gold">
                <h4>Authorized Users</h4>
                <table className="history-table">
                  <thead><tr><th>Code</th><th>Name</th><th>Email</th><th>Mobile</th><th>Action</th></tr></thead>
                  <tbody>{usersList.map(u => (<tr key={u.id}><td>{u.uCode}</td><td>{u.uName}</td><td>{u.uEmail}</td><td>{u.uMob}</td><td><Edit3 size={16} className="edit-ic"/><Trash2 size={16} className="del-ic"/></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Settings" && (
            <div className="luxury-panel">
              <h3 className="gold-border-title">Security Settings</h3>
              <div className="form-luxury-gold">
                <div className="set-row"><label>System Password</label><input type="password" placeholder="Update Access Key" /></div>
                <div className="set-row"><label>Confirm Password</label><input type="password" placeholder="Confirm Access Key" /></div>
              </div>
              <button className="gold-action-btn">LOCK & UPDATE SECURITY</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const handleLogin = (e) => { e.preventDefault(); signInWithEmailAndPassword(auth, email, pass).catch(() => alert("Access Denied")); };
  return (
    <div className="login-luxury-bg">
      <div className="login-card-gold">
        <ShieldCheck size={50} color="#d4af37"/>
        <h1 className="gold-title">BANKING PRO</h1>
        <p className="v-tag">EXECUTIVE VERSION 2.0</p>
        <form className="login-form-gold" onSubmit={handleLogin}>
          <input type="email" placeholder="ADMIN EMAIL" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="SECURE KEY" onChange={e => setPass(e.target.value)} required />
          <button type="submit" className="login-btn">AUTHORIZE SYSTEM</button>
        </form>
        <div className="login-foot">Developed by <strong>SOFTVIEW TECHNOLOGIES</strong></div>
      </div>
    </div>
  );
}