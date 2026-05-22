import { useState } from "react";
import axiosClient from "../axiosClient";
import { useAuth } from "../context/AuthContext";

export default function ProfilePictureEditor() {
  const { user, updateUser } = useAuth();

  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return alert("Select a file first");

    const formData = new FormData();
    formData.append("image", file);

    try {
      setLoading(true);

      const res = await axiosClient.post(
        "/api/user/profile-picture",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const newUrl = res.data.pfp_url;
      updateUser({ pfp_url: newUrl });
      setPreview(null);
      setFile(null);
    } catch (err) {
      console.log(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src={preview || user?.pfp_url}
        className="w-28 h-28 rounded-xl object-cover border border-gray-800 shadow"
      />

      <label
        htmlFor="pfpInput"
        className="cursor-pointer text-sm bg-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-700"
      >
        Change
      </label>

      <input
        id="pfpInput"
        name="profilePicture"
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFile}
      />

      {file && (
        <button
          disabled={loading}
          onClick={handleUpload}
          className={`bg-blue-600 px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 ${
            loading && "opacity-50 cursor-not-allowed"
          }`}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      )}
    </div>
  );
}
