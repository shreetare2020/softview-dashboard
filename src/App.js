import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- Login Component ---
function LoginScreen() {
  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
  };
  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>BANKING PRO</h1>
        <form onSubmit={handleLogin} className="login-form">
          <input name="email" type="email" placeholder="Email" required />
          <input name="pass" type="password" placeholder="Password" required />
          <button type="submit" className="login-submit">LOGIN</button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("");
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  const confirmDelete = async (col, id) => {
    if (window.confirm("Delete record?")) await deleteDoc(doc(db, col, id));
  };

  const exportPDF = (b) => {
    const docObj = new jsPDF();
    docObj.text(`Bank Report: ${b.bankName}`, 14, 20);
    docObj.autoTable({ startY: 30, head: [['Field', 'Value']], body: [['Bank', b.bankName], ['Branch', b.branch], ['A/c', b.accNo], ['Balance', b.balance]] });
    docObj.save("Report.pdf");
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(t => (
          <div key={t} className={`nav-item ${activeTab === t ? 'active' : ''}`} onClick={() => {setActiveTab(t); setEditId(null);}}>{t}</div>
        ))}
        <button onClick={() => signOut(auth)} style={{marginTop:'auto', cursor:'pointer'}}>Logout</button>
      </div>

      <div className="main-stage">
        {activeTab === "Dashboard" && (
          <div className="card-premium">
            <select className="pro-select-premium" value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
              <option value="">-- Select Firm --</option>
              {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
            </select>
            <table className="pro-table">
              <thead><tr><th>Bank</th><th>Branch</th><th>Bal</th><th>Action</th></tr></thead>
              <tbody>
                {banks.filter(b => b.firmName === selectedFirm).map(b => (
                  <tr key={b.id}>
                    <td>{b.bankName}</td><td>{b.branch}</td><td>₹{b.balance}</td>
                    <td><button className="btn-gold-sm" onClick={() => exportPDF(b)}>PDF</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "Bank Master" && (
          <div className="card-premium">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const d = { firmName: e.target.f.value, bankName: e.target.bn.value, branch: e.target.br.value, accNo: e.target.ac.value, balance: e.target.ba.value };
              editId ? await updateDoc(doc(db, "banks", editId), d) : await addDoc(collection(db, "banks"), d);
              setEditId(null); e.target.reset();
            }}>
              <select name="f" required><option value="">Select Firm</option>{firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}</select>
              <input name="bn" placeholder="Bank" required />
              <input name="br" placeholder="Branch" required />
              <input name="ac" placeholder="A/c No" required />
              <input name="ba" placeholder="Balance" required />
              <button type="submit" className="btn-gold-sm">{editId ? "Update" : "Save"}</button>
            </form>
            <table className="pro-table">
              <tbody>{banks.map(b => <tr key={b.id}><td>{b.bankName} ({b.branch})</td><td><button onClick={() => confirmDelete("banks", b.id)}>Del</button></td></tr>)}</tbody>
            </table>
          </div>
        )}

        {/* Similar logic for Firm and User Masters can be added here */}
      </div>
    </div>
  );
}