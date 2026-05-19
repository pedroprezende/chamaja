import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

interface LeaveReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  professionalName: string;
  isLoading?: boolean;
}

export function LeaveReviewModal({
  visible,
  onClose,
  onSubmit,
  professionalName,
  isLoading = false,
}: LeaveReviewModalProps) {
  const colors = useColors();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleRating = (stars: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRating(stars);
  };

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert("Atenção", "Por favor, selecione uma avaliação com estrelas.");
      return;
    }
    const trimmedComment = comment.trim();
    
    Keyboard.dismiss();
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onSubmit(rating, trimmedComment);
    setRating(0);
    setComment("");
  };

  const handleClose = () => {
    if (!isLoading) {
      setRating(0);
      setComment("");
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
          <View style={styles.overlay}>
            <Pressable 
              style={StyleSheet.absoluteFill} 
              onPress={Keyboard.dismiss} 
            />
            <View style={[styles.container, { backgroundColor: colors.surface }]}>
              {/* Drag Handle for visual cue */}
              <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  Avaliar {professionalName}
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.closeBtn, 
                    { backgroundColor: colors.background }, 
                    pressed && { opacity: 0.6, transform: [{ scale: 0.9 }] }
                  ]}
                  onPress={handleClose}
                  disabled={isLoading}
                >
                  <MaterialIcons name="close" size={24} color={colors.foreground} />
                </Pressable>
              </View>

              {/* Star Rating */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.foreground }]}>Sua nota para o serviço</Text>
                <View style={styles.starsSelector}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => handleRating(star)}
                      disabled={isLoading}
                      style={({ pressed }) => [
                        styles.starBtn,
                        pressed && { transform: [{ scale: 1.2 }] }
                      ]}
                    >
                      <MaterialIcons
                        name={star <= rating ? "star" : "star-outline"}
                        size={48}
                        color={star <= rating ? "#FFB800" : colors.muted + "30"}
                      />
                    </Pressable>
                  ))}
                </View>
                {rating > 0 && (
                  <Text style={[styles.ratingText, { color: colors.primary }]}>
                    {rating === 1 && "Muito ruim"}
                    {rating === 2 && "Ruim"}
                    {rating === 3 && "Bom"}
                    {rating === 4 && "Muito bom"}
                    {rating === 5 && "Excelente!"}
                  </Text>
                )}
              </View>

              {/* Comment */}
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.foreground, marginBottom: 0 }]}>
                    Conte-nos mais
                  </Text>
                  <Text style={[styles.charCount, { color: comment.length >= 500 ? colors.error : colors.muted }]}>
                    {comment.length}/500
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: colors.background, 
                      color: colors.foreground, 
                      borderColor: colors.border 
                    }
                  ]}
                  placeholder="Como foi o atendimento, a pontualidade e o resultado do serviço?"
                  placeholderTextColor={colors.muted + "80"}
                  multiline
                  numberOfLines={4}
                  value={comment}
                  onChangeText={setComment}
                  editable={!isLoading}
                  maxLength={500}
                  blurOnSubmit={false}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.submitBtn,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                    isLoading && { opacity: 0.5 },
                  ]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitText}>Enviar Avaliação</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
    opacity: 0.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    flex: 1,
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },
  starsSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  starBtn: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 8,
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    textAlignVertical: "top",
    borderWidth: 1.5,
    minHeight: 120,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    fontWeight: "700",
  },
  buttonContainer: {
    marginTop: 8,
  },
  submitBtn: {
    width: "100%",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
