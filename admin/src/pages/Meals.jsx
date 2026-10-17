import React, { useEffect, useState } from "react";
import api from "../api";
import { COLORS } from "../theme";
import useAdminPolling from "../hooks/useAdminPolling";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];
const MEAL_GOALS = ["Balanced", "High Protein", "Weight Loss"];

export default function Meals() {
  const [meals, setMeals] = useState([]);
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  // Create Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    type: "Breakfast",
    goal: "Balanced",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    tags: "",
    description: "",
  });
  const [createImage, setCreateImage] = useState(null);

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

  const openCreate = () => {
    setCreateForm({
      name: "",
      type: "Breakfast",
      goal: "Balanced",
      calories: "",
      protein: "",
      carbs: "",
      fats: "",
      tags: "",
      description: "",
    });
    setCreateImage(null);
    setCreateError("");
    setShowCreate(true);
  };

  const submitCreate = async () => {
    // Validation: Name must contain only letters, spaces, and basic punctuation
    const nameRegex = /^[a-zA-Z\s\-',.()]+$/;
    if (!nameRegex.test(createForm.name)) {
      setCreateError("Meal name can only contain letters, spaces, and basic punctuation.");
      return;
    }

    if (!createForm.name || !createForm.calories || !createForm.protein) {
      setCreateError("Name, Calories, and Protein are required.");
      return;
    }
    
    setCreating(true);
    setCreateError("");
    try {
      let payload;
      let config;
      
      if (createImage) {
        payload = new FormData();
        Object.entries(createForm).forEach(([k, v]) => payload.append(k, v));
        payload.append("image", createImage);
        config = { headers: { "Content-Type": "multipart/form-data" } };
      } else {
        payload = createForm;
      }

      await api.post("/admin/meals", payload, config);
      setShowCreate(false);
      setCreateImage(null);
      load();
    } catch (err) {
      setCreateError(err.response?.data?.message || err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>Meals</h1>
        <button
          onClick={openCreate}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            background: COLORS.primary,
            color: COLORS.text,
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            border: "none",
          }}
        >
          + Add Built-in Meal
        </button>
      </div>

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
                  style={{
                    ...buttonStyle,
                    color: COLORS.buttonText,
                    background: COLORS.success,
                  }}
                >
                  {busyId === meal.id ? "Saving..." : "Save photo"}
                </button>
                <button
                  onClick={() => removeMeal(meal)}
                  disabled={busyId === meal.id}
                  style={{
                    ...buttonStyle,
                    color: COLORS.buttonText,
                    background: COLORS.danger,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Meal Modal */}
      {showCreate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: COLORS.cardBackground,
              padding: 28,
              borderRadius: 16,
              width: "100%",
              maxWidth: 540,
              maxHeight: "90vh",
              overflowY: "auto",
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>
              Add Built-in Meal
            </h2>
            <p style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 20 }}>
              This meal will be available to all users in the shared catalog.
            </p>

            {createError && (
              <div
                style={{
                  background: "rgba(229, 57, 53, 0.15)",
                  color: COLORS.danger,
                  padding: 12,
                  borderRadius: 10,
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                {createError}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Chicken Salad"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                  style={inputStyle}
                >
                  {MEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Goal</label>
                <select
                  value={createForm.goal}
                  onChange={(e) => setCreateForm({ ...createForm, goal: e.target.value })}
                  style={inputStyle}
                >
                  {MEAL_GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tags (comma separated)</label>
                <input
                  value={createForm.tags}
                  onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                  placeholder="e.g. Low Carb, Quick"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginTop: 14 }}>
              <div>
                <label style={labelStyle}>Calories</label>
                <input
                  type="number"
                  value={createForm.calories}
                  onChange={(e) => setCreateForm({ ...createForm, calories: e.target.value })}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Protein (g)</label>
                <input
                  type="number"
                  value={createForm.protein}
                  onChange={(e) => setCreateForm({ ...createForm, protein: e.target.value })}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Carbs (g)</label>
                <input
                  type="number"
                  value={createForm.carbs}
                  onChange={(e) => setCreateForm({ ...createForm, carbs: e.target.value })}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Fats (g)</label>
                <input
                  type="number"
                  value={createForm.fats}
                  onChange={(e) => setCreateForm({ ...createForm, fats: e.target.value })}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Description (Optional)</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Short description..."
                rows={4}
                style={{ 
                  ...inputStyle, 
                  height: 100, 
                  resize: "none", 
                  overflowY: "auto" 
                }}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Meal Image (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCreateImage(e.target.files?.[0] || null)}
                style={{ fontSize: 13, color: COLORS.text }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <button
                onClick={() => setShowCreate(false)}
                disabled={creating}
                style={{ ...buttonStyle, padding: "10px 18px" }}
              >
                Cancel
              </button>
              <button
                onClick={submitCreate}
                disabled={creating}
                style={{
                  ...buttonStyle,
                  padding: "10px 18px",
                  background: COLORS.primary,
                  color: COLORS.text,
                  opacity: creating ? 0.6 : 1,
                }}
              >
                {creating ? "Creating..." : "Create Meal"}
              </button>
            </div>
          </div>
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

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.background,
  color: COLORS.text,
  fontSize: 14,
  marginTop: 6,
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1,
  color: COLORS.textSecondary,
  textTransform: "uppercase",
};