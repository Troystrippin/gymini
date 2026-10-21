import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { COLORS } from "../theme";

export default function MealsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [meal, setMeal] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMeal = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          `/admin/meals/${encodeURIComponent(id)}`,
        );
        setMeal(response.data.meal);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMeal();
  }, [id]);

  const saveImage = async () => {
    if (!image) return;

    setBusy(true);
    setError("");

    try {
      const form = new FormData();
      form.append("image", image);

      const response = await api.put(
        `/admin/meals/${encodeURIComponent(id)}/image`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      setMeal(response.data.meal);
      setImage(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteMeal = async () => {
    if (!window.confirm(`Delete "${meal.name}`)) return;

    setBusy(true);
    setError("");
    try {
      await api.delete(`/admin/meals/${encodeURIComponent(id)}`);
      navigate("/meals");
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div style={{ color: COLORS.textSecondary }}>Loading meal...</div>;
  }

  if (error && !meal) {
    return <div style={{ color: COLORS.danger }}>{error}</div>;
  }
  if (!meal) {
    return <div style={{ color: COLORS.textSecondary }}>Meal not found</div>;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          to="/meals"
          style={{
            color: COLORS.textSecondary,
            display: "inline-block",
          }}
        >
          ← Back to Meals
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={saveImage} disabled={busy || !image} style={btnSave}>
            {busy ? "Saving..." : "Save photo"}
          </button>
          <button onClick={deleteMeal} disabled={busy} style={btnDanger}>
            Delete meal
          </button>
        </div>
        {error && (
          <div style={{ color: COLORS.danger, width: "100%" }}>{error}</div>
        )}
      </div>

      <h1 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16 }}>
        {meal.name}
      </h1>

      {meal.image && (
        <img
          src={meal.image}
          alt={meal.name}
          style={{
            maxWidth: 240,
            height: 180,
            objectFit: "cover",
            borderRadius: 8,
            marginBottom: 20,
          }}
        />
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <InfoCard label="TYPE" value={meal.type} />
        <InfoCard label="GOAL" value={meal.goal} />
        <InfoCard label="CALORIES" value={`${meal.calories} kcal`} />
        <InfoCard label="PROTEIN" value={`${meal.protein} g`} />
        <InfoCard label="CARBS" value={`${meal.carbs} g`} />
        <InfoCard label="FATS" value={`${meal.fats} g`} />
        <InfoCard label="TAGS" value={meal.tags?.join(", ") || "None"} />
      </div>

      <div
        style={{
          background: COLORS.cardBackground,
          borderRadius: 16,
          padding: 24,
          border: `1px solid ${COLORS.border}`,
          marginBottom: 24,
          boxShadow: `
                      inset 1px 1px 2px rgba(255, 255, 255, 0.9),
                      inset -1px -1px 2px rgba(0, 0, 0, 0.12),
                      -3px -3px 6px rgba(255, 255, 255, 0.9),   
                      1px 1px 3px rgba(0, 0, 0, 0.12),          
                      3px 3px 6px rgba(0, 0, 0, 0.14),          
                      6px 6px 12px rgba(0, 0, 0, 0.16)          
                    `,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
          Description
        </h2>
        <p style={{ color: COLORS.text, fontSize: 14, lineHeight: 1.6 }}>
          {meal.description || "No description"}
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(event) => setImage(event.target.files?.[0] || null)}
        />
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div
      style={{
        background: COLORS.cardBackground,
        borderRadius: 14,
        padding: 18,
        border: `1px solid ${COLORS.border}`,
        boxShadow: `
                      inset 1px 1px 2px rgba(255, 255, 255, 0.9),
                      inset -1px -1px 2px rgba(0, 0, 0, 0.12),
                      -3px -3px 6px rgba(255, 255, 255, 0.9),   
                      1px 1px 3px rgba(0, 0, 0, 0.12),          
                      3px 3px 6px rgba(0, 0, 0, 0.14),          
                      6px 6px 12px rgba(0, 0, 0, 0.16)          
                    `,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1,
          color: COLORS.textSecondary,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

const btnDanger = {
  padding: "10px 18px",
  borderRadius: 10,
  background: "rgba(229, 57, 53, 0.15)",
  border: "1px solid rgba(229, 57, 53, 0.4)",
  color: COLORS.danger,
  fontSize: 13,
  fontWeight: 700,
};
const btnSave = {
  padding: "10px 18px",
  borderRadius: 10,
  background: "rgba(46, 204, 113, 0.15)",
  border: "1px solid rgba(46, 204, 113, 0.4)",
  color: COLORS.success,
  fontSize: 13,
  fontWeight: 700,
};
