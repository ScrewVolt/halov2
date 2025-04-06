import { useEffect, useState } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { auth, db } from "../firebase"
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore"
import { signOut } from "firebase/auth"

export default function Layout() {
  const [patients, setPatients] = useState([])
  const [newPatient, setNewPatient] = useState("")
  const [selectedPatient, setSelectedPatient] = useState(null)

  const navigate = useNavigate()
  const user = auth.currentUser

  // 🔄 Fetch patients from Firestore
  useEffect(() => {
    if (!user) return

    const patientsRef = collection(db, "users", user.uid, "patients")
    const q = query(patientsRef, orderBy("createdAt", "asc"))

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setPatients(data)
    })

    return () => unsub()
  }, [user])

  // ✅ Automatically select the first patient when list changes
  useEffect(() => {
    if (!selectedPatient && patients.length > 0) {
      setSelectedPatient(patients[0])
    }
  }, [patients])

  const handleAddPatient = async () => {
    const name = newPatient.trim()
    if (!name || patients.find(p => p.name === name)) return

    const patientRef = collection(db, "users", user.uid, "patients")
    await addDoc(patientRef, {
      name,
      createdAt: new Date()
    })

    setNewPatient("")
  }

  const handleDeletePatient = async (id) => {
    await deleteDoc(doc(db, "users", user.uid, "patients", id))
    if (selectedPatient?.id === id) {
      setSelectedPatient(null)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate("/")
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-700 text-white p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-6">HALO</h1>

          <div className="mb-4">
            <input
              value={newPatient}
              onChange={(e) => setNewPatient(e.target.value)}
              placeholder="Add Patient"
              className="w-full p-2 rounded text-black"
            />
            <button
              onClick={handleAddPatient}
              className="mt-2 w-full bg-blue-500 hover:bg-blue-600 py-2 rounded"
            >
              Add
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[60vh]">
            {patients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className={`flex justify-between items-center px-3 py-2 rounded cursor-pointer ${
                  selectedPatient?.id === patient.id
                    ? "bg-blue-900"
                    : "hover:bg-blue-600"
                }`}
              >
                <span>{patient.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeletePatient(patient.id)
                  }}
                  className="bg-red-500 hover:bg-red-600 px-2 rounded"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white py-2 rounded"
        >
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet context={{ selectedPatient }} />
      </main>
    </div>
  )
}
