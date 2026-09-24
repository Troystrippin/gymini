import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useTheme } from "../theme/theme";
import EyeIcon from "../icons/eye-svgrepo-com";
import EyeOffIcon from "../icons/eye-slash-svgrepo-com";

export default function InputField({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  secureTextEntry,
  keyboardType,
  maxLength,
  textAlign,
  autoCapitalize,
  autoCorrect,
  error,
  touched,
  ...rest
}) {
  const { colors } = useTheme();
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [focused, setFocused] = useState(false);

  const showError = Boolean(error) && (touched !== false);
  const borderColor = showError
    ? "#E53935"
    : focused
      ? colors.primary
      : colors.border;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.cardBackground,
            borderColor,
            borderWidth: showError || focused ? 1.5 : 1,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.text, textAlign }]}
          value={value}
          onChangeText={onChangeText}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={isSecure}
          keyboardType={keyboardType || "default"}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize || "none"}
          autoCorrect={autoCorrect}
          {...rest}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isSecure ? (
              <EyeOffIcon color={colors.textSecondary} width={18} height={18} />
            ) : (
              <EyeIcon color={colors.textSecondary} width={18} height={18} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {showError ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 16 },
  errorText: {
    color: "#E53935",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 2,
    fontWeight: "600",
  },
});