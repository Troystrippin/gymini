import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import { COLORS } from "../theme";
import { StatusBadge } from "./Exercises";
import useAdminPolling from "../hooks/useAdminPolling";

const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
  "Full Body",
  "Cardio",
  "Other",
];

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export default function ExerciseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editImage, setEditImage] = useState(null);

  const load = () => {
    return api
      .get(`/admin/exercises/${id}`)
      .then((res) => {
        setData(res.data);
        if (!showEdit) {
          setEditForm({
            name: res.data.exercise.name,
            muscleGroup: res.data.exercise.muscleGroup,
            equipment: res.data.exercise.equipment || "",
            difficulty: res.data.exercise.difficulty || "Beginner",
            description: res.data.exercise.description || "",
            mediaUrl: res.data.exercise.mediaUrl || "",
          });
          setEditImage(null);
        }
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useAdminPolling(load);

  const approve = async () => {
    setBusy(true);
    setActionError("");
    try {
      await api.patch(`/admin/exercises/${id}/approve`);
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitReject = async () => {
    setBusy(true);
    setActionError("");
    try {
      await api.patch(`/admin/exercises/${id}/reject`, {
        reason: rejectReason.trim(),
      });
      setShowReject(false);
      setRejectReason("");
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async () => {
    setBusy(true);
    setActionError("");
    try {
      let payload = editForm;
      let config;
      if (editImage) {
        payload = new FormData();
        Object.entries(editForm).forEach(([key, value]) =>
          payload.append(key, value ?? ""),
        );
        payload.append("image", editImage);
        config = { headers: { "Content-Type": "multipart/form-data" } };
      }
      await api.put(`/admin/exercises/${id}`, payload, config);
      setShowEdit(false);
      setEditImage(null);
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (
      !window.confirm(
        `Delete "${data.exercise.name}"? ${
          data.exercise.isCustom
            ? "This cannot be undone."
            : "This is a BUILT-IN exercise and cannot be undone."
        }`,
      )
    )
      return;

    setBusy(true);
    setActionError("");
    try {
      const url = data.exercise.isCustom
        ? `/admin/exercises/${id}`
        : `/admin/exercises/${id}?confirm=true`;
      await api.delete(url);
      navigate("/exercises");
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div style={{ color: COLORS.textSecondary }}>Loading exercise...</div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: "rgba(229, 57, 53, 0.15)",
          border: "1px solid rgba(229, 57, 53, 0.4)",
          color: COLORS.danger,
          padding: 20,
          borderRadius: 12,
        }}
      >
        {error}
      </div>
    );
  }

  const { exercise, stats } = data;

  return (
    <div>
      <Link
        to="/exercises"
        style={{
          color: COLORS.textSecondary,
          fontSize: 13,
          marginBottom: 16,
          display: "inline-block",
        }}
      >
        ← Back to exercises
      </Link>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>
            {exercise.name}
          </h1>
          <p style={{ color: COLORS.textSecondary, fontSize: 14 }}>
            {exercise.muscleGroup} · {exercise.equipment} ·{" "}
            {exercise.difficulty}
          </p>
          <div style={{ marginTop: 10 }}>
            <StatusBadge status={exercise.status} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {exercise.status !== "approved" && (
            <button onClick={approve} disabled={busy} style={btnPrimary}>
              ✓ Approve
            </button>
          )}
          {exercise.status !== "rejected" && (
            <button
              onClick={() => setShowReject(true)}
              disabled={busy}
              style={btnDanger}
            >
              ✕ Reject
            </button>
          )}
          <button
            onClick={() => setShowEdit((v) => !v)}
            disabled={busy}
            style={btnSecondary}
          >
            ✎ Edit
          </button>
          <button onClick={remove} disabled={busy} style={btnDanger}>
            🗑 Delete
          </button>
        </div>
      </div>

      {actionError && (
        <div
          style={{
            background: "rgba(229, 57, 53, 0.15)",
            border: "1px solid rgba(229, 57, 53, 0.4)",
            color: COLORS.danger,
            padding: 12,
            borderRadius: 10,
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          {actionError}
        </div>
      )}

      {showEdit && (
        <div
          style={{
            background: COLORS.cardBackground,
            borderRadius: 16,
            padding: 24,
            border: `1px solid ${COLORS.border}`,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
            Edit Exercise
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            <Field label="Name">
              <input
                value={editForm.name || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                style={inputStyle}
              />
            </Field>
            <Field label="Muscle Group">
              <select
                value={editForm.muscleGroup || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, muscleGroup: e.target.value })
                }
                style={inputStyle}
              >
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Equipment">
              <input
                value={editForm.equipment || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, equipment: e.target.value })
                }
                style={inputStyle}
              />
            </Field>
            <Field label="Difficulty">
              <select
                value={editForm.difficulty || "Beginner"}
                onChange={(e) =>
                  setEditForm({ ...editForm, difficulty: e.target.value })
                }
                style={inputStyle}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea
              value={editForm.description || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              rows={3}
              style={{ ...inputStyle, minHeight: 80 }}
            />
          </Field>
          <Field label="Exercise image">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(event) =>
                setEditImage(event.target.files?.[0] || null)
              }
            />
            {exercise.mediaUrl && (
              <div
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 12,
                  marginTop: 6,
                }}
              >
                Current image is set. Choosing a new file replaces it.
              </div>
            )}
          </Field>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={submitEdit} disabled={busy} style={btnPrimary}>
              Save Changes
            </button>
            <button
              onClick={() => setShowEdit(false)}
              disabled={busy}
              style={btnSecondary}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showReject && (
        <div
          style={{
            background: "rgba(229, 57, 53, 0.08)",
            border: "1px solid rgba(229, 57, 53, 0.3)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 800,
              marginBottom: 12,
              color: COLORS.danger,
            }}
          >
            Reject Exercise
          </h2>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason (optional, shown to the creator)"
            rows={3}
            style={{ ...inputStyle, minHeight: 80, marginBottom: 14 }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={submitReject} disabled={busy} style={btnDanger}>
              Confirm Reject
            </button>
            <button
              onClick={() => {
                setShowReject(false);
                setRejectReason("");
              }}
              disabled={busy}
              style={btnSecondary}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <InfoCard
          label="TYPE"
          value={exercise.isCustom ? "Custom" : "Built-in"}
        />
        <InfoCard label="CREATOR" value={exercise.createdBy?.fullName || "—"} />
        <InfoCard label="FAVORITED BY" value={stats.favoriteCount} />
        <InfoCard label="USED IN PLANS" value={stats.planUsageCount} />
      </div>

      {exercise.description && (
        <div
          style={{
            background: COLORS.cardBackground,
            borderRadius: 16,
            padding: 24,
            border: `1px solid ${COLORS.border}`,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
            Description
          </h2>
          <p style={{ color: COLORS.text, fontSize: 14, lineHeight: 1.6 }}>
            {exercise.description}
          </p>
        </div>
      )}

      {exercise.status === "rejected" && exercise.rejectionReason && (
        <div
          style={{
            background: "rgba(229, 57, 53, 0.08)",
            border: "1px solid rgba(229, 57, 53, 0.3)",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 800,
              marginBottom: 8,
              color: COLORS.danger,
            }}
          >
            Rejection Reason
          </h2>
          <p style={{ color: COLORS.text, fontSize: 14 }}>
            {exercise.rejectionReason}
          </p>
          {exercise.moderatedAt && (
            <p
              style={{
                color: COLORS.textSecondary,
                fontSize: 12,
                marginTop: 8,
              }}
            >
              Rejected on {new Date(exercise.moderatedAt).toLocaleString()}
              {exercise.moderatedBy?.fullName
                ? ` by ${exercise.moderatedBy.fullName}`
                : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1,
          color: COLORS.textSecondary,
          marginBottom: 6,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      {children}
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

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.background,
  color: COLORS.text,
  fontSize: 14,
};

const btnPrimary = {
  padding: "10px 18px",
  borderRadius: 10,
  background: COLORS.primary,
  color: COLORS.text,
  fontSize: 13,
  fontWeight: 700,
};

const btnSecondary = {
  padding: "10px 18px",
  borderRadius: 10,
  background: "transparent",
  border: `1px solid ${COLORS.border}`,
  color: COLORS.text,
  fontSize: 13,
  fontWeight: 700,
};

const btnDanger = {
  padding: "10px 18px",
  borderRadius: 10,
  background: "rgba(229, 57, 53, 0.15)",
  border: "1px solid rgba(229, 57, 53, 0.4)",
  color: COLORS.danger,
  fontSize: 13,
  fontWeight: 700,
};
