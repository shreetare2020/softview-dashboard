import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";

export default function UserMaster() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");

  useEffect(() => {
    return onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => d.data()));
    });
  }, []);

  const addUser = async () => {
    await addDoc(collection(db, "users"), {
      name,
      role: "viewer"
    });
  };

  return (
    <div>
      <h2>User Master</h2>

      <input onChange={(e) => setName(e.target.value)} />
      <button onClick={addUser}>Add User</button>

      <h3>Total Users: {users.length}</h3>

      {users.map((u, i) => (
        <div key={i}>{u.name}</div>
      ))}
    </div>
  );
}