import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";

export default function BankMaster() {
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [firm, setFirm] = useState("");

  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "firms"), (snap) => {
      setFirms(snap.docs.map(doc => doc.data()));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "banks"), (snap) => {
      setBanks(snap.docs.map(doc => doc.data()));
    });
    return () => unsub();
  }, []);

  const addBank = async () => {
    if (!name || !account || !balance || !firm)
      return alert("Fill all fields");

    await addDoc(collection(db, "banks"), {
      name,
      account,
      balance: Number(balance),
      firm,
      createdAt: new Date()
    });

    setName("");
    setAccount("");
    setBalance("");
    setFirm("");
  };

  return (
    <div>
      <h2>🏦 Bank Master</h2>

      <input placeholder="Bank Name" value={name} onChange={(e)=>setName(e.target.value)} />
      <input placeholder="Account No" value={account} onChange={(e)=>setAccount(e.target.value)} />
      <input placeholder="Balance" value={balance} onChange={(e)=>setBalance(e.target.value)} />

      <select value={firm} onChange={(e)=>setFirm(e.target.value)}>
        <option value="">Select Firm</option>
        {firms.map((f,i)=>(
          <option key={i}>{f.name}</option>
        ))}
      </select>

      <button onClick={addBank}>Add Bank</button>

      <h3>Total Banks: {banks.length}</h3>

      {banks.map((b,i)=>(
        <div key={i}>
          {b.name} | {b.account} | ₹{b.balance} ({b.firm})
        </div>
      ))}
    </div>
  );
}