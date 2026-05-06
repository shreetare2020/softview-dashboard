import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";

export default function BankMaster() {
  const [banks, setBanks] = useState([]);
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");

  useEffect(() => {
    return onSnapshot(collection(db, "banks"), (snap) => {
      setBanks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const addBank = async () => {
    await addDoc(collection(db, "banks"), {
      name,
      firm,
      balance: 0
    });
  };

  return (
    <div>
      <h2>Bank Master</h2>

      <input placeholder="Bank Name" onChange={(e) => setName(e.target.value)} />
      <input placeholder="Firm Name" onChange={(e) => setFirm(e.target.value)} />

      <button onClick={addBank}>Add Bank</button>

      <h3>Total Banks: {banks.length}</h3>

      {banks.map((b) => (
        <div key={b.id}>
          {b.name} - {b.firm}
        </div>
      ))}
    </div>
  );
}