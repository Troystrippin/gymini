import React, { useEffect, useState } from "react";
import { TouchableOpacity, Text } from "react-native";
import { exercisesApi } from "../api/exercises";

export default function FavoriteButton({
  exerciseId,
  size = 24,
  color = "#f5a623",
}) {
  const [favorited, setFavorited] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!exerciseId) return;
    let cancelled = false;
    exercisesApi
      .favoriteStatus(exerciseId)
      .then((data) => {
        if (!cancelled) setFavorited(Boolean(data.favorited));
      })
      .catch((err) => {
        console.warn(
          "[favorite] status failed",
          err?.response?.status,
          err?.response?.data || err?.message,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  const toggle = async () => {
    if (busy || !exerciseId) return;
    const next = !favorited;
    setFavorited(next);
    setBusy(true);
    try {
      if (next) {
        await exercisesApi.favorite(exerciseId);
      } else {
        await exercisesApi.unfavorite(exerciseId);
      }
    } catch (err) {
      console.warn(
        "[favorite] toggle failed",
        err?.response?.status,
        err?.response?.data || err?.message,
      );
      setFavorited(!next);
    } finally {
      setBusy(false);
    }
  };

  const glyph = favorited ? "\u2605" : "\u2606";
  const starColor = favorited ? color : "#bbb";

  return (
    <TouchableOpacity
      onPress={toggle}
      hitSlop={10}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={favorited ? "Unfavorite exercise" : "Favorite exercise"}
    >
      <Text
        style={{
          fontSize: size,
          color: starColor,
          paddingHorizontal: 6,
        }}
      >
        {glyph}
      </Text>
    </TouchableOpacity>
  );
}