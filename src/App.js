import React, { useEffect, useState } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
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

  // CLOCK
  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  // AUTH FIX (NO AUTO LOGIN ISSUE)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return () => unsub();
  }, []);

  // FIREBASE DATA
  useEffect(() => {
    onSnapshot(collection(db, "firms"), (s) =>
      setFirms(s.docs.map((d) => d.data()))
    );

    onSnapshot(collection(db, "banks"), (s) =>
      setBanks(s.docs.map((d) => d.data()))
    );

    onSnapshot(collection(db, "transactions"), (s) =>
      setTransactions(s.docs.map((d) => d.data()))
    );
  }, []);

  // LOGIN
  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch {
      alert("Login Failed");
    }
  };

  const logout = () => signOut(auth);

  // 🔥 LEDGER ENGINE (FINAL FIXED)
  const getLedger = (account) => {
    let balance = 0;

    const acc = String(account || "").trim();

    const list = transactions
      .filter((t) => String(t.account || t.Account || "").trim() === acc)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return list.map((t) => {
      const amt = Number(t.amount || t.Amount || 0);
      const type = String(t.type || t.Type || "").toLowerCase();

      if (type === "receipt") balance += amt;
      if (type === "payment") balance -= amt;

      return { ...t, amount: amt, balance };
    });
  };

  const getBalance = (account) => {
    const l = getLedger(account);
    return l.length ? l[l.length - 1].balance : 0;
  };

  // EXCEL EXPORT
  const exportExcel = (account) => {
    const data = getLedger(account);

    const csv = [
      ["Date", "Type", "Amount", "Balance"],
      ...data.map((d) => [d.date, d.type, d.amount, d.balance]),
    ]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "ledger.csv";
    a.click();
  };

  // PDF EXPORT
  const exportPDF = (account) => {
    const doc = new jsPDF();
    const data = getLedger(account);

    doc.text("Bank Ledger Report", 10, 10);

    doc.autoTable({
      head: [["Date", "Type", "Amount", "Balance"]],
      body: data.map((d) => [
        d.date,
        d.type,
        d.amount,
        d.balance,
      ]),
    });

    doc.save("ledger.pdf");
  };

  // ================= LOGIN =================
  if (!user) {
    return (
      <div className="loginPage">
        <div className="loginCard">
          <h2>Banking Dashboard</h2>

          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPass(e.target.value)} />

          <button onClick={login}>Login</button>

          <p>Softview Technologies | 7972084304</p>
        </div>
      </div>
    );
  }

  // ================= DASHBOARD =================
  return (
    <div className="app">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>🏦 Banking System</h2>

        <select onChange={(e) => setSelectedFirm(e.target.value)}>
          <option value="">Select Firm</option>
          {firms.map((f, i) => (
            <option key={i}>{f.name}</option>
          ))}
        </select>

        <button onClick={logout}>Logout</button>

        <div className="clockBox">
          {time.toLocaleDateString()} | {time.toLocaleTimeString()}
        </div>
      </div>

      {/* MAIN */}
      <div className="main">

        <div className="header">
          <b>{user.email}</b>
        </div>

        <div className="content">

          <h2>Dashboard</h2>

          {!selectedFirm && <p>Select firm to view data</p>}

          {selectedFirm &&
            banks
              .filter((b) => b.firm === selectedFirm)
              .map((b, i) => (
                <div key={i} className="card">

                  {/* BANK ROW */}
                  <div
                    onClick={() =>
                      setExpanded(expanded === b.account ? null : b.account)
                    }
                    style={{ cursor: "pointer", fontWeight: "bold" }}
                  >
                    🏦 {b.name} | {b.account} | ₹{getBalance(b.account)}
                  </div>

                  {/* LEDGER */}
                  {expanded === b.account && (
                    <div style={{ marginTop: 10 }}>
                      {getLedger(b.account).map((l, idx) => (
                        <div key={idx}>
                          {l.date} | {l.type} | ₹{l.amount} | Balance ₹{l.balance}
                        </div>
                      ))}

                      <div style={{ marginTop: 10 }}>
                        <button onClick={() => exportExcel(b.account)}>Excel</button>
                        <button onClick={() => exportPDF(b.account)}>PDF</button>
                      </div>
                    </div>
                  )}

                </div>
              ))}
        </div>

        <div className="footerRight">
          Developed by Softview Technologies | 7972084304
        </div>

      </div>
    </div>
  );
}