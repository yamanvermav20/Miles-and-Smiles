import { useState, useEffect } from "react";
import Toast from "./Toast";

export default function EditableField({ label, value, onSave, type = "text" }) {
  // --- STATES ---
  const [editing, setEditing] = useState(false);

  // Always initialize as a controlled string
  const [input, setInput] = useState(value ?? "");

  // Sync whenever parent changes the value
  useEffect(() => {
    setInput(value ?? "");
  }, [value]);

  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2000);
  };

  // --- SAVE ---
  const save = async () => {
    try {
      await onSave(input);

      setEditing(false);
      showToast("success", "Saved!");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update";
      showToast("error", msg);
    }
  };

  return (
    <div className="mb-6 relative">
      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} />}

      <p className="text-gray-400 text-sm">{label}</p>

      {/* --- VIEW MODE --- */}
      {!editing ? (
        <div className="flex items-center justify-between mt-1">
          <p className="text-lg">{input}</p>

          <button
            onClick={() => setEditing(true)}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Edit
          </button>
        </div>
      ) : (
        /* --- EDIT MODE --- */
        <div className="flex items-center gap-2 mt-2">
          <input
            type={type}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="bg-gray-900 border border-gray-700 px-3 py-1 rounded-md"
          />

          <button
            onClick={save}
            className="bg-green-600 px-3 py-1 rounded-md hover:bg-green-700"
          >
            Save
          </button>

          <button
            onClick={() => setEditing(false)}
            className="bg-gray-700 px-3 py-1 rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
