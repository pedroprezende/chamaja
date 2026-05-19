import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  Platform,
} from "react-native";
import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import type { Ad } from "@/hooks/use-ads";
import { useWindowDimensions } from "react-native";

const AUTOPLAY_INTERVAL = 4000;

type AdsCarouselProps = {
  ads: Ad[];
};

export function AdsCarousel({ ads }: AdsCarouselProps) {
  const { width: WINDOW_WIDTH } = useWindowDimensions();
  const SCREEN_WIDTH = Platform.OS === "web" ? Math.min(WINDOW_WIDTH, 500) : WINDOW_WIDTH;
  const CARD_WIDTH = SCREEN_WIDTH - 32; 
  const CARD_HEIGHT = 180;
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserScrolling = useRef(false);

  const scrollToIndex = useCallback(
    (index: number) => {
      scrollRef.current?.scrollTo({ x: index * CARD_WIDTH, animated: true });
      setActiveIndex(index);
    },
    []
  );

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
      if (!isUserScrolling.current) {
        setActiveIndex((prev) => {
          const next = (prev + 1) % ads.length;
          scrollRef.current?.scrollTo({ x: next * CARD_WIDTH, animated: true });
          return next;
        });
      }
    }, AUTOPLAY_INTERVAL);
  }, [ads.length, stopAutoplay]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  if (ads.length === 0) return null;

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          isUserScrolling.current = true;
          stopAutoplay();
        }}
        onMomentumScrollEnd={(e) => {
          isUserScrolling.current = false;
          const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
          setActiveIndex(index);
          startAutoplay();
        }}
        style={{ width: CARD_WIDTH }}
        contentContainerStyle={{ flexDirection: "row" }}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
      >
        {ads.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }, pressed && { opacity: 0.92 }]}
            onPress={() => {
              if (item.providerId) {
                router.push(`/professional/${item.providerId}` as any);
              } else {
                // Fallback para categoria se não houver prestador vinculado
                router.push(`/professionals/${item.title.split(" ")[0].toLowerCase()}` as any);
              }
            }}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={[styles.image, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
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
              <Text style={styles.adCategoryText}>{item.title}</Text>
              <Text style={styles.title} numberOfLines={1}>
                {item.providerName || "Profissional"}
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
        ))}
      </ScrollView>

      {/* Dot indicators */}
      {ads.length > 1 && (
        <View style={styles.dots}>
          {ads.map((_, i) => (
            <Pressable key={i} onPress={() => scrollToIndex(i)}>
              <View style={[styles.dot, i === activeIndex && styles.dotActive]} />
            </Pressable>
          ))}
        </View>
      )}

      {/* Navigation Arrows */}
      {ads.length > 1 && (
        <>
          <Pressable 
            style={[styles.arrowBtn, styles.arrowLeft]}
            onPress={() => {
              stopAutoplay();
              const next = (activeIndex - 1 + ads.length) % ads.length;
              scrollToIndex(next);
              startAutoplay();
            }}
          >
            <MaterialIcons name="chevron-left" size={24} color="#374151" />
          </Pressable>

          <Pressable 
            style={[styles.arrowBtn, styles.arrowRight]}
            onPress={() => {
              stopAutoplay();
              const next = (activeIndex + 1) % ads.length;
              scrollToIndex(next);
              startAutoplay();
            }}
          >
            <MaterialIcons name="chevron-right" size={24} color="#374151" />
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1F2937",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
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
  adCategoryText: {
    color: "#4ADE80",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: -2,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
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
  arrowBtn: {
    position: "absolute",
    top: 180 / 2 - 20, // CARD_HEIGHT / 2 - 20
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  arrowLeft: {
    left: 8,
  },
  arrowRight: {
    right: 8,
  },
});
