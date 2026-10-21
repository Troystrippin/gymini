import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../theme/theme";
import { COLORS } from "../theme/colors";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";

function ChatMessageBubble({ text, isSender }) {
  const { colors } = useTheme();
  const textColor = isSender ? "#FFFFFF" : colors.text;
  const textStyle = { color: textColor };
  const codeBackground = isSender ? "rgba(0, 0, 0, 0.2)" : colors.surface;

  const markdownStyle = {
    paragraph: textStyle,
    h1: textStyle,
    h2: textStyle,
    h3: textStyle,
    h4: textStyle,
    h5: textStyle,
    h6: textStyle,
    blockquote: textStyle,
    list: {
      color: textColor,
      bulletColor: textColor,
      markerColor: textColor,
    },
    strong: textStyle,
    em: textStyle,
    link: textStyle,
    code: { ...textStyle, backgroundColor: codeBackground },
    codeBlock: {
      ...textStyle,
      backgroundColor: codeBackground,
      syntaxColors: {
        keyword: textColor,
        operator: textColor,
        punctuation: textColor,
        string: textColor,
        number: textColor,
        constant: textColor,
        comment: textColor,
        function: textColor,
        type: textColor,
        variable: textColor,
        property: textColor,
        tag: textColor,
        attribute: textColor,
        embedded: textColor,
      },
    },
    math: textStyle,
    inlineMath: textStyle,
    table: {
      color: textColor,
      headerBackgroundColor: codeBackground,
      rowEvenBackgroundColor: isSender ? "rgba(0, 0, 0, 0.12)" : colors.card,
      rowOddBackgroundColor: codeBackground,
      borderColor: colors.border,
    },
  };

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
        <EnrichedMarkdownText markdownStyle={markdownStyle} markdown={text} />
      </View>
    </View>
  );
}

export default React.memo(ChatMessageBubble);

const styles = StyleSheet.create({
  row: {
    width: "100%",
    marginBottom: 15,
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
