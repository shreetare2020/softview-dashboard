import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { Trash2, FileSpreadsheet, FileText, Settings, LayoutDashboard, Building2, Landmark, Users, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';
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
      setForm({}); alert("Record Saved");
    } catch (e) { alert("Error"); }
  };

  const exportData = (b, type) => {
    const data = [
      { date: '08/05/2026', desc: 'Opening Balance', dr: '-', cr: b.balance, bal: b.balance + ' Cr.' },
      { date: '08/05/2026', desc: 'Sample Transaction', dr: '-', cr: '5,000', bal: (parseFloat(b.balance) + 5000) + ' Cr.' }
    ];
    if (type === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Ledger");
      XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
    } else {
      const doc = new jsPDF();
      doc.autoTable({
        head: [['Date', 'Particulars', 'Debit', 'Credit', 'Balance']],
        body: data.map(r => [r.date, r.desc, r.dr, r.cr, r.bal]),
      });
      doc.save(`${b.bankName}_Ledger.pdf`);
    }
  };

  const filteredBanks = firmFilter === "All" ? banks : banks.filter(b => b.firmLink === firmFilter);

  if (!user) return <LoginScreen />;

  return (
    <div className="layout-container">
      <aside className="side-bar">
        <div className="side-logo"><h2>BANKING PRO</h2></div>
        <nav className="nav-list">
          <div className={activeTab === "Dashboard" ? "nav-link active" : "nav-link"} onClick={() => setActiveTab("Dashboard")}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={activeTab === "Firm Master" ? "nav-link active" : "nav-link"} onClick={() => setActiveTab("Firm Master")}><Building2 size={18}/> Firm Master</div>
          <div className={activeTab === "Bank Master" ? "nav-link active" : "nav-link"} onClick={() => setActiveTab("Bank Master")}><Landmark size={18}/> Bank Master</div>
          <div className={activeTab === "User Master" ? "nav-link active" : "nav-link"} onClick={() => setActiveTab("User Master")}><Users size={18}/> User Master</div>
          <div className={activeTab === "Settings" ? "nav-link active" : "nav-link"} onClick={() => setActiveTab("Settings")}><Settings size={18}/> Settings</div>
        </nav>
        <div className="side-brand">
          <p>CRAFTED BY</p>
          <h4>SOFTVIEW TECHNOLOGIES</h4>
        </div>
      </aside>

      <main className="main-view">
        <header className="view-header">
          <h2>{activeTab}</h2>
          <button className="btn-logout" onClick={() => signOut(auth)}>LOGOUT</button>
        </header>

        <div className="view-body">
          {activeTab === "Dashboard" && (
            <div className="data-card">
              <div className="filter-box">
                <select value={firmFilter} onChange={(e) => setFirmFilter(e.target.value)}>
                  <option value="All">--- ALL FIRMS ---</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              <table className="data-table">
                <thead><tr><th>BANK</th><th>A/C NO</th><th>BALANCE</th><th>ACTION</th></tr></thead>
                <tbody>
                  {filteredBanks.map(b => (
                    <React.Fragment key={b.id}>
                      <tr className="main-tr">
                        <td>{b.bankName}</td><td>{b.accNo}</td><td>₹ {b.balance} Cr.</td>
                        <td><button className="btn-ledger" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>LEDGER <ChevronDown size={14}/></button></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr><td colSpan="4">
                          <div className="ledger-box">
                            <div className="ledger-header"><span>Ledger View</span>
                              <div className="btns">
                                <button onClick={() => exportData(b, 'excel')}>EXCEL</button>
                                <button onClick={() => exportData(b, 'pdf')}>PDF</button>
                              </div>
                            </div>
                            <table className="ledger-table">
                              <thead><tr><th>Date</th><th>Particulars</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
                              <tbody>
                                <tr><td>08/05/2026</td><td>Opening Balance</td><td>-</td><td>₹ {b.balance}</td><td>₹ {b.balance} Cr.</td></tr>
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
            <div className="data-card">
              <div className="form-grid">
                <input placeholder="Firm Name" onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST No" onChange={e => setForm({...form, gst: e.target.value})} />
                <button className="btn-save" onClick={() => handleSave("firms")}>SAVE</button>
              </div>
              <table className="data-table">
                <thead><tr><th>Firm Name</th><th>GST</th></tr></thead>
                <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td></tr>)}</tbody>
              </table>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div className="data-card">
              <div className="form-grid">
                <input placeholder="Bank Name" onChange={e => setForm({...form, bankName: e.target.value})} />
                <input placeholder="Bank Branch" onChange={e => setForm({...form, branch: e.target.value})} />
                <input placeholder="A/c No" onChange={e => setForm({...form, accNo: e.target.value})} />
                <input placeholder="Opening Balance" onChange={e => setForm({...form, balance: e.target.value})} />
                <button className="btn-save" onClick={() => handleSave("banks")}>SAVE</button>
              </div>
              <table className="data-table">
                <thead><tr><th>Bank</th><th>Branch</th><th>A/c No</th></tr></thead>
                <tbody>{banks.map(b => <tr key={b.id}><td>{b.bankName}</td><td>{b.branch}</td><td>{b.accNo}</td></tr>)}</tbody>
              </table>
            </div>
          )}

          {activeTab === "User Master" && (
            <div className="data-card">
              <div className="form-grid">
                <input placeholder="User Name" onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="Email" onChange={e => setForm({...form, uEmail: e.target.value})} />
                <input placeholder="Role" onChange={e => setForm({...form, role: e.target.value})} />
                <button className="btn-save" onClick={() => handleSave("users")}>SAVE</button>
              </div>
              <table className="data-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
                <tbody>{usersList.map(u => <tr key={u.id}><td>{u.uName}</td><td>{u.uEmail}</td><td>{u.role}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LoginScreen() { return <div className="login-bg"><h1>LOGIN</h1></div>; }