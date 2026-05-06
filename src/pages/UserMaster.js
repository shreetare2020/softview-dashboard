import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";

export default function UserMaster() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer");

  const [users, setUsers] = useState([]);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });
    return () => unsub();
  }, []);

  const saveUser = async () => {
    if (!name || !email) {
      alert("Name & Email required");
      return;
    }

    try {
      if (editId) {
        // 🔄 UPDATE USER (Firestore)
        await updateDoc(doc(db, "users", editId), {
          name,
          email,
          role,
        });

        // 🔐 PASSWORD UPDATE (only if entered)
        if (password) {
          try {
            await updatePassword(auth.currentUser, password);
          } catch (err) {
            alert("Password update failed (login again required)");
          }
        }

        setEditId(null);
      } else {
        if (!password) {
          alert("Password required");
          return;
        }

        // 🔐 CREATE USER
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await addDoc(collection(db, "users"), {
          name,
          email,
          role,
          uid: userCred.user.uid,
          createdAt: new Date(),
        });
      }

      setName("");
      setEmail("");
      setPassword("");
      setRole("viewer");

    } catch (e) {
      alert(e.message);
    }
  };

  const editUser = (u) => {
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setPassword(""); // blank password for edit
    setEditId(u.id);
  };

  const deleteUser = async (id) => {
    if (window.confirm("Delete user?")) {
      await deleteDoc(doc(db, "users", id));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>👤 User Master</h2>

      <div style={{ marginBottom: 20 }}>

        <input
          placeholder="Name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        {/* ✅ PASSWORD FIELD ALWAYS */}
        <input
          type="password"
          placeholder="Enter Password (for new or change)"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <select value={role} onChange={(e)=>setRole(e.target.value)}>
          <option value="admin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>

        <button onClick={saveUser}>
          {editId ? "Update User" : "Add User"}
        </button>
      </div>

      <h3>Total Users: {users.length}</h3>

      {users.map((u) => (
        <div key={u.id} style={{ padding: 10, margin: 5, background: "#eee" }}>
          {u.name} | {u.email} ({u.role})

          <button onClick={() => editUser(u)}>Edit</button>
          <button onClick={() => deleteUser(u.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}