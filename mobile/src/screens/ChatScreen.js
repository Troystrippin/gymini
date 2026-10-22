import {
  View,
  Text,
  Alert,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  FlatList,
  Modal,
} from "react-native";
import React, { useState, useRef, useCallback } from "react";
import { COLORS } from "../theme/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme/theme";
import ChatMessageBubble from "../components/ChatMessageBubble";
import CheckConvo from "../icons/CheckConvo";
import ArchiveIcon from "../icons/ArchiveIcon";
import api from "../api/api";

export default function ChatScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const listRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      text: "Hi! I'm here to provide exercise and meal recommendations. What are you looking for?",
      sender: "AI-Coach",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [historyVisible, setHistoryVisible] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedHistory, setSelectedHistory] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadConversation = async () => {
        try {
          const { data } = await api.get("/chat/current");

          if (active && data.messages.length > 0) {
            setMessages(data.messages);
          }
        } catch (err) {
          if (active) {
            setError(
              err.response?.data?.message ||
                "Could not load your previous conversation.",
            );
          }
        }
      };

      loadConversation();

      return () => {
        active = false;
      };
    }, []),
  );

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    setDraft("");
    setError("");
    setMessages((current) => [
      ...current,
      { id: Date.now().toString(), text, sender: "user" },
    ]);
    setSending(true);

    try {
      const { data } = await api.post("/chat", {
        message: text,
      });

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          text: data.reply,
          sender: "AI-Coach",
        },
      ]);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not reach the AI. Try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const renderMessage = useCallback(
    ({ item }) => (
      <ChatMessageBubble text={item.text} isSender={item.sender === "user"} />
    ),
    [],
  );

  const archiveConversation = () => {
    if (sending) return;

    Alert.alert(
      "Archive conversation?",
      "This will move the chat out of your current conversation.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          onPress: async () => {
            try {
              await api.post("/chat/current/archive");

              setMessages([
                {
                  id: "welcome",
                  text: "Hi! I'm here to provide exercise and meal recommendations. What are you looking for?",
                  sender: "AI-Coach",
                },
              ]);
              setError("");
            } catch (err) {
              Alert.alert(
                "Could not archive conversation",
                err.response?.data?.message || "Please try again",
              );
            }
          },
        },
      ],
    );
  };

  const openHistory = async () => {
    setHistoryVisible(true);
    setSelectedHistory(null);
    setHistoryError("");
    setHistoryLoading(true);

    try {
      const { data } = await api.get("/chat/history");
      setHistory(data);
    } catch (err) {
      setHistoryError(
        err.response?.data?.message || "Could not load chat history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const openArchivedConversation = async (conversation) => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const { data } = await api.get(`/chat/history/${conversation.id}`);
      setSelectedHistory({
        ...conversation,
        messages: data.messages,
      });
    } catch (err) {
      setHistoryError(
        err.response?.data?.message || "Could not load that conversation.",
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel="Return to previous screen"
            >
              <Text style={[styles.returnText, { color: colors.buttonText }]}>
                Return
              </Text>
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: colors.text }]}>
              AI Coach
            </Text>

            <View
              style={{
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
                justifyContent: "right",
              }}
            >
              <TouchableOpacity
                onPress={archiveConversation}
                disabled={sending}
                style={styles.headerButton}
                accessibilityRole="button"
                accessibilityLabel="Archive conversation"
              >
                <ArchiveIcon width={20} height={20} fill={colors.buttonText} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={openHistory}
                style={styles.headerButton}
                accessibilityRole="button"
                accessibilityLabel="View archived conversations"
              >
                <CheckConvo width={20} height={20} fill={colors.buttonText} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.headerSide} />
        </View>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ListFooterComponent={
            sending ? (
              <ChatMessageBubble text="Thinking..." isSender={false} />
            ) : null
          }
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
              Start a conversation with the AI Coach.
            </Text>
          }
        />

        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask your AI Coach"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.card },
            ]}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={historyVisible}
        animationType="slide"
        onRequestClose={() => setHistoryVisible(false)}
      >
        <SafeAreaView
          style={[styles.flex, { backgroundColor: colors.background }]}
        >
          <View style={styles.historyHeader}>
            {selectedHistory ? (
              <TouchableOpacity onPress={() => setSelectedHistory(null)}>
                <Text style={{ color: colors.primary }}>Back</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {selectedHistory ? "Archived chat" : "Chat history"}
            </Text>

            <TouchableOpacity onPress={() => setHistoryVisible(false)}>
              <Text style={{ color: colors.primary }}>Close</Text>
            </TouchableOpacity>
          </View>

          {historyLoading ? (
            <Text
              style={[styles.historyStatus, { color: colors.textSecondary }]}
            >
              Loading…
            </Text>
          ) : historyError ? (
            <Text style={[styles.historyStatus, { color: colors.text }]}>
              {historyError}
            </Text>
          ) : selectedHistory ? (
            <FlatList
              data={selectedHistory.messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ChatMessageBubble
                  text={item.text}
                  isSender={item.sender === "user"}
                />
              )}
              contentContainerStyle={styles.messageList}
            />
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              ListEmptyComponent={
                <Text
                  style={{ color: colors.textSecondary, textAlign: "center" }}
                >
                  No archived conversations yet.
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.historyItem, { backgroundColor: colors.card }]}
                  onPress={() => openArchivedConversation(item)}
                >
                  <Text style={{ color: colors.text }} numberOfLines={2}>
                    {item.preview}
                  </Text>
                  <Text style={{ color: colors.textSecondary, marginTop: 6 }}>
                    {item.archivedAt
                      ? new Date(item.archivedAt).toLocaleDateString()
                      : ""}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  messageList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  headerSide: {
    width: 84,
  },
  returnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "900",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
  },
  sendButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  historyHeader: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyStatus: {
    padding: 16,
    textAlign: "center",
  },
  historyItem: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
});
