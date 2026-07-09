import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [opacity]);

  const animatedStyle: ViewStyle = {
    borderRadius,
    opacity,
  };
  if (width !== undefined) animatedStyle.width = width as ViewStyle["width"];
  if (height !== undefined) animatedStyle.height = height as ViewStyle["height"];

  return (
    <Animated.View
      style={[styles.skeleton, animatedStyle, style]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#E5E7EB",
  },
});
