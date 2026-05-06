import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

export default function FirmMaster() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [gst, setGst] = useState("");

  const [firms, setFirms] = useState([]);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "firms"), (snap) => {
      setFirms(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });
    return () => unsub();
  }, []);

  const saveFirm = async () => {
    if (!name) return alert("Enter firm name");

    if (editId) {
      await updateDoc(doc(db, "firms", editId), {
        name,
        address,
        gst,
      });
      setEditId(null);
    } else {
      await addDoc(collection(db, "firms"), {
        name,
        address,
        gst,
        createdAt: new Date(),
      });
    }

    setName("");
    setAddress("");
    setGst("");
  };

  const editFirm = (f) => {
    setName(f.name);
    setAddress(f.address || "");
    setGst(f.gst || "");
    setEditId(f.id);
  };

  const deleteFirm = async (id) => {
    if (window.confirm("Delete firm?")) {
      await deleteDoc(doc(db, "firms", id));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🏢 Firm Master</h2>

      <input placeholder="Firm Name" value={name} onChange={(e)=>setName(e.target.value)} />
      <input placeholder="Address" value={address} onChange={(e)=>setAddress(e.target.value)} />
      <input placeholder="GST No" value={gst} onChange={(e)=>setGst(e.target.value)} />

      <button onClick={saveFirm}>
        {editId ? "Update Firm" : "Add Firm"}
      </button>

      <h3>Total Firms: {firms.length}</h3>

      {firms.map((f) => (
        <div key={f.id} style={{ margin: 5, padding: 10, background: "#eee" }}>
          <b>{f.name}</b> | {f.address} | {f.gst}

          <button onClick={() => editFirm(f)}>Edit</button>
          <button onClick={() => deleteFirm(f.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}