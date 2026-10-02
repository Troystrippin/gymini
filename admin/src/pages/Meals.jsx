import React, { useEffect, useState } from "react";
import api from "../api";
import { COLORS } from "../theme";
import useAdminPolling from "../hooks/useAdminPolling";

export default function Meals() {
  const [meals, setMeals] = useState([]);
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const response = await api.get("/admin/meals");
      setMeals(response.data.meals || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);
  useAdminPolling(load);

  const uploadImage = async (meal) => {
    const file = files[meal.id];
    if (!file) return;
    setBusyId(meal.id);
    setError("");
    try {
      const form = new FormData();
      form.append("image", file);
      const response = await api.put(
        `/admin/meals/${encodeURIComponent(meal.id)}/image`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setMeals((current) =>
        current.map((item) =>
          item.id === meal.id ? response.data.meal : item,
        ),
      );
      setFiles((current) => ({ ...current, [meal.id]: null }));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setBusyId(null);
    }
  };

  const removeMeal = async (meal) => {
    if (!window.confirm(`Delete "${meal.name}" from the shared catalog?`))
      return;
    setBusyId(meal.id);
    setError("");
    try {
      await api.delete(`/admin/meals/${encodeURIComponent(meal.id)}`);
      setMeals((current) => current.filter((item) => item.id !== meal.id));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 20 }}>Meals</h1>
      {error && (
        <div style={{ color: COLORS.danger, marginBottom: 16 }}>{error}</div>
      )}
      {loading ? (
        <div style={{ color: COLORS.textSecondary }}>Loading meals...</div>
      ) : (
        <div style={{ borderTop: `1px solid ${COLORS.border}` }}>
          {meals.map((meal) => (
            <div
              key={meal.id}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "72px minmax(150px, 1fr) minmax(240px, auto) auto",
                alignItems: "center",
                gap: 16,
                padding: "14px 0",
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              {meal.image ? (
                <img
                  src={meal.image}
                  alt={meal.name}
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: "cover",
                    borderRadius: 6,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    display: "grid",
                    placeItems: "center",
                    background: COLORS.cardBackground,
                    color: COLORS.textSecondary,
                    fontSize: 12,
                  }}
                >
                  No photo
                </div>
              )}
              <div>
                <div style={{ fontWeight: 800, color: COLORS.text }}>
                  {meal.name}
                </div>
                <div
                  style={{
                    color: COLORS.textSecondary,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {meal.type} · {meal.goal} · {meal.calories} kcal
                </div>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(event) =>
                  setFiles((current) => ({
                    ...current,
                    [meal.id]: event.target.files?.[0] || null,
                  }))
                }
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => uploadImage(meal)}
                  disabled={busyId === meal.id || !files[meal.id]}
                  style={buttonStyle}
                >
                  {busyId === meal.id ? "Saving..." : "Save photo"}
                </button>
                <button
                  onClick={() => removeMeal(meal)}
                  disabled={busyId === meal.id}
                  style={{ ...buttonStyle, color: COLORS.danger }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const buttonStyle = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 6,
  padding: "8px 10px",
  background: "transparent",
  color: COLORS.text,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
