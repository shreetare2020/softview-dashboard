import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";
import { ArrowUp, ArrowDown, X, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function App() {
  const [banks, setBanks] = useState([]);
  const [viewLedger, setViewLedger] = useState(null); // Full Screen State
  const [transactions, setTransactions] = useState([]); // Real Data
  const [filter, setFilter] = useState("Daily");

  // Load Banks
  useEffect(() => {
    onSnapshot(collection(db, "Bank Master"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
  }, []);

  // Professional PDF Export Logic
  const exportPDF = (bank) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Header
    doc.setFillColor(2, 6, 23);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(212, 175, 55);
    doc.setFontSize(22);
    doc.text("ACCOUNT LEDGER STATEMENT", 105, 20, { align: 'center' });
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`Bank: ${bank.bankName} | A/c: ${bank.accNo}`, 105, 30, { align: 'center' });

    // Table Data
    const tableData = transactions.map(t => [
      t.date, t.opening, t.particular, t.receipt, t.payment, t.closing
    ]);

    doc.autoTable({
      startY: 45,
      head: [['Date', 'Op. Bal', 'Particulars', 'Receipt', 'Payment', 'Cl. Bal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] },
      styles: { fontSize: 9 },
      columnStyles: {
        3: { textColor: [16, 185, 129] }, // Receipt Green
        4: { textColor: [239, 68, 68] }   // Payment Red
      }
    });

    doc.save(`${bank.bankName}_Ledger.pdf`);
  };

  return (
    <div className="app-container">
      {/* Dashboard Table */}
      <div className="premium-card">
        <table className="royal-table">
          <thead><tr><th>BANK IDENTITY</th><th>A/C NO</th><th>BALANCE</th><th>ACTION</th></tr></thead>
          <tbody>
            {banks.map(b => (
              <tr key={b.id}>
                <td>{b.bankName}</td>
                <td>{b.accNo}</td>
                <td style={{ color: '#10b981' }}>₹ {b.balance}</td>
                <td>
                  <button className="btn-royal" onClick={() => { setViewLedger(b); setTransactions(sampleTransactions); }}>
                    VIEW LEDGER
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FULL SCREEN LEDGER OVERLAY */}
      {viewLedger && (
        <div className="ledger-overlay">
          <div className="ledger-header">
            <div>
              <h1 style={{color: '#d4af37', margin: 0}}>{viewLedger.bankName.toUpperCase()}</h1>
              <p style={{color: '#64748b'}}>A/C NO: {viewLedger.accNo} | IFSC: {viewLedger.ifsc}</p>
            </div>
            <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
              <button className="btn-royal" onClick={() => exportPDF(viewLedger)}><FileText size={18}/> PDF</button>
              <button className="btn-royal" style={{background: '#fff', color:'#000'}}><Download size={18}/> EXCEL</button>
              <button className="back-btn" onClick={() => setViewLedger(null)}><X/></button>
            </div>
          </div>

          {/* Period Filters */}
          <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
             {['Daily', 'Monthly', 'Period'].map(m => (
               <button key={m} onClick={() => setFilter(m)} className={filter === m ? 'btn-royal' : 'back-btn'}>{m}</button>
             ))}
          </div>

          <table className="pro-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Opening Balance</th>
                <th>Particulars</th>
                <th>Receipt (Cr)</th>
                <th>Payment (Dr)</th>
                <th>Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, index) => (
                <tr key={index}>
                  <td>{t.date}</td>
                  <td>{t.opening}</td>
                  <td style={{textAlign: 'left'}}>{t.particular}</td>
                  <td className="receipt-cell">
                    {t.receipt > 0 && <><ArrowDown size={14}/> {t.receipt}</>}
                  </td>
                  <td className="payment-cell">
                    {t.payment > 0 && <><ArrowUp size={14}/> {t.payment}</>}
                  </td>
                  <td style={{fontWeight: 'bold'}}>₹ {t.closing}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Branding Footer inside Ledger */}
          <div style={{marginTop: '40px', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '20px'}}>
             <p style={{color: '#d4af37', fontSize: '12px'}}>Generated by SOFTVIEW TECHNOLOGIES Ledger Pro System</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Sample Logic for Ledger Data
const sampleTransactions = [
  { date: '01/05/2026', opening: '1,00,000', particular: 'Opening Balance', receipt: 0, payment: 0, closing: '1,00,000' },
  { date: '05/05/2026', opening: '1,00,000', particular: 'Service Charges Paid', receipt: 0, payment: 500, closing: '99,500' },
  { date: '09/05/2026', opening: '99,500', particular: 'Cash Deposit', receipt: 50000, payment: 0, closing: '1,49,500' },
];