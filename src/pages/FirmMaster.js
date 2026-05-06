import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot
} from "firebase/firestore";

export default function FirmMaster() {
  const [name, setName] = useState("");
  const [firms, setFirms] = useState([]);

  useEffect(() => {
    return onSnapshot(collection(db, "firms"), (snap) => {
      setFirms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const addFirm = async () => {
    if (!name) return;
    await addDoc(collection(db, "firms"), {
      name,
      createdAt: new Date()
    });
    setName("");
  };

  return (
    <div>
      <h2>Firm Master</h2>

      <input
        placeholder="Firm Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={addFirm}>Add Firm</button>

      <h3>Total Firms: {firms.length}</h3>

      {firms.map((f) => (
        <div key={f.id} className="item">
          {f.name}
        </div>
      ))}
    </div>
  );
}