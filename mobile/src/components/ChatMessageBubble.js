import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/theme";
import { COLORS } from "../theme/colors";

export default function ChatMessageBubble({ text, isSender }) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.row, isSender ? styles.senderRow : styles.receiverRow]}
    >
      <View
        style={[
          styles.bubble,
          isSender ? styles.senderBubble : styles.receiverBubble,
          { backgroundColor: isSender ? colors.primary : colors.card },
        ]}
      >
        <Text style={{ color: isSender ? "#FFFFFF" : colors.text }}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    marginBottom: 10,
  },
  senderRow: {
    alignItems: "flex-end",
  },
  receiverRow: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  senderBubble: {
    borderBottomRightRadius: 0,
  },
  receiverBubble: {
    borderBottomLeftRadius: 0,
    borderWidth: 1,
    borderStyle: "dotted",
    borderColor: COLORS.border,
  },
});
