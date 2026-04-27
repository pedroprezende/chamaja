import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  ViewToken,
} from "react-native";
import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import type { Ad } from "@/lib/ads-database";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;
const AUTOPLAY_INTERVAL = 4000;

type AdsCarouselProps = {
  ads: Ad[];
};

export function AdsCarousel({ ads }: AdsCarouselProps) {
  const router = useRouter();
  const flatListRef = useRef<FlatList<Ad>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (ads.length <= 1) return;
    autoplayRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % ads.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTOPLAY_INTERVAL);
  }, [ads.length, stopAutoplay]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 });

  if (ads.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={ads}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        onScrollBeginDrag={stopAutoplay}
        onMomentumScrollEnd={startAutoplay}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH + 12,
          offset: (CARD_WIDTH + 12) * index,
          index,
        })}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
            onPress={() => router.push(`/professional/${item.providerId}` as any)}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
            {/* Gradient overlay */}
            <View style={styles.overlay} />

            {/* Badge patrocinado */}
            <View style={styles.sponsoredBadge}>
              <Text style={styles.sponsoredText}>Patrocinado</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              {item.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <View style={styles.ctaRow}>
                <Text style={styles.ctaText}>Ver perfil →</Text>
              </View>
            </View>
          </Pressable>
        )}
      />

      {/* Dot indicators */}
      {ads.length > 1 && (
        <View style={styles.dots}>
          {ads.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 8,
    paddingHorizontal: CARD_MARGIN,
  },
  listContent: {
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: 210,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1F2937",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CARD_WIDTH,
    height: 210,
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "65%",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sponsoredBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  sponsoredText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    gap: 4,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  description: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    lineHeight: 17,
  },
  ctaRow: {
    marginTop: 6,
  },
  ctaText: {
    color: "#4ADE80",
    fontSize: 13,
    fontWeight: "700",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
  },
  dotActive: {
    width: 18,
    backgroundColor: "#25D366",
    borderRadius: 3,
  },
});
