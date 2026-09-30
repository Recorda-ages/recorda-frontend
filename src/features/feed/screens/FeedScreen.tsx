import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewToken
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { Button, ErrorState, Loading } from "@/components/ui";
import { resolveApiAssetUrl } from "@/services/api";
import { useNotifications } from "@/features/notifications";
import { colors, spacing } from "@/theme";

import { BottomTabBar, type BottomTab } from "../components/BottomTabBar";
import { FeedEmptyState } from "../components/FeedEmptyState";
import { FeedGlow } from "../components/FeedGlow";
import { FeedHeader } from "../components/FeedHeader";
import { FEED_TABS, FeedTabs } from "../components/FeedTabs";
import { RecordaCard } from "../components/RecordaCard";
import { useFollowingFeed } from "../hooks/useFollowingFeed";
import { useGeneralFeed } from "../hooks/useGeneralFeed";
import { useRecordaLikeMutation } from "../hooks/useRecordaLikeMutation";
import { useFeedAudioActions } from "../state/FeedAudioContext";
import { useFeed } from "../state/FeedContext";
import type { FeedItem, FeedTab } from "../types";

// 70% visível é o limiar que evita trocar a música a cada pixel do scroll:
// um card só assume o áudio quando domina a tela de fato.
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 70 };

const PAGER_SETTLE_FALLBACK_MS = 450;
const LIST_IDLE_SETTLE_MS = 250;

// The same Recorda can be in both tabs; only the card in the active tab takes focus
// (plays its video), while the song, keyed by the Recorda, carries on across tabs.
function focusKeyFor(tab: FeedTab, item: FeedItem) {
  return `${tab}:${item.recorda_id}`;
}

function previewOptions(tab: FeedTab, item: FeedItem) {
  return { focusKey: focusKeyFor(tab, item), waitForMedia: item.media_type === "VIDEO" };
}

type FeedRowProps = Readonly<{
  item: FeedItem;
  onOpen: (item: FeedItem) => void;
  onShare: (item: FeedItem) => void;
  onToggleLike: (recordaId: string, liked: boolean) => Promise<void>;
  tab: FeedTab;
}>;

// Memoized with stable callbacks so a screen re-render (tab change, new notification,
// query update) doesn't re-render every visible card in both lists.
const FeedRow = memo(function FeedRow({ item, onOpen, onShare, onToggleLike, tab }: FeedRowProps) {
  return (
    <RecordaCard
      focusKey={focusKeyFor(tab, item)}
      item={item}
      onPress={() => onOpen(item)}
      onShare={() => onShare(item)}
      onToggleLike={(liked) => onToggleLike(item.recorda_id, liked)}
    />
  );
});

export function FeedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const { width: pageWidth } = useWindowDimensions();
  const { deletedIds, openFeedItem } = useFeed();
  const { setActivePreview } = useFeedAudioActions();
  const [activeTab, setActiveTab] = useState<FeedTab>("geral");
  // Only the active tab's feed is fetched, except mid-swipe: then the incoming page is
  // enabled too so it isn't blank while dragged in (and stays cached afterwards).
  const [isSwiping, setIsSwiping] = useState(false);
  const [pullRefreshingTab, setPullRefreshingTab] = useState<FeedTab | null>(null);
  const generalFeedQuery = useGeneralFeed(activeTab === "geral" || isSwiping);
  const followingFeedQuery = useFollowingFeed(activeTab === "following" || isSwiping);
  const { mutateAsync: toggleRecordaLike } = useRecordaLikeMutation();
  const unreadCount = useNotifications().data?.pages[0]?.unread_count ?? 0;

  const pagerRef = useRef<ScrollView>(null);
  // Horizontal offset of the pager, read by the tab indicator on the native thread.
  const [scrollX] = useState(() => new Animated.Value(0));
  // Memoized: a new node every render would make the tab indicators re-attach their animation.
  const pagerPosition = useMemo(
    () => (pageWidth > 0 ? Animated.divide(scrollX, pageWidth) : scrollX),
    [pageWidth, scrollX]
  );

  const handleTabBarPress = (tab: BottomTab) => {
    if (tab === "camera") {
      navigation.navigate("Camera");
    }

    if (tab === "profile") {
      navigation.navigate("Profile");
    }
  };

  const handleCardShare = useCallback(
    (item: FeedItem) => {
      navigation.navigate("ShareCard", {
        artistName: item.song_artist_name,
        coverUrl: item.song_cover_url || null,
        mediaUri: resolveApiAssetUrl(item.media_url),
        mediaType: item.media_type === "VIDEO" ? "video" : "photo",
        songTitle: item.song_title
      });
    },
    [navigation]
  );

  // As duas listas ficam montadas, então ambas disparam viewability. Cada handler
  // armazena a Recorda em foco da sua aba e só entrega o áudio se for a ativa. Ao
  // trocar de aba, o áudio passa para a aba que veio para a frente assim que a
  // página termina de rolar.
  const activeTabRef = useRef(activeTab);
  const focusedCardByTab = useRef<Record<FeedTab, FeedItem | null>>({
    geral: null,
    following: null
  });

  const handleCardPress = useCallback(
    (item: FeedItem) => {
      openFeedItem(item);
      // Cards can only be pressed on the page in front.
      setActivePreview(
        item.recorda_id,
        item.song_preview_url,
        previewOptions(activeTabRef.current, item)
      );
      navigation.navigate("PublishedRecorda", { postId: item.recorda_id });
    },
    [navigation, openFeedItem, setActivePreview]
  );

  const handleToggleLike = useCallback(
    async (recordaId: string, liked: boolean) => {
      await toggleRecordaLike({ isLiked: liked, recordaId });
    },
    [toggleRecordaLike]
  );

  const renderItemByTab = useMemo(() => {
    const renderFor = (tab: FeedTab) =>
      function renderItem({ item }: { item: FeedItem }) {
        return (
          <FeedRow
            item={item}
            onOpen={handleCardPress}
            onShare={handleCardShare}
            onToggleLike={handleToggleLike}
            tab={tab}
          />
        );
      };
    return { following: renderFor("following"), geral: renderFor("geral") };
  }, [handleCardPress, handleCardShare, handleToggleLike]);

  const applyFocus = useCallback(
    (focused: FeedItem | null) => {
      if (focused) {
        setActivePreview(
          focused.recorda_id,
          focused.song_preview_url,
          previewOptions(activeTabRef.current, focused)
        );
      } else {
        setActivePreview("", null);
      }
    },
    [setActivePreview]
  );

  // Switching audio and video mid-scroll puts native work on the frames of the
  // scroll itself, which is what stutters. While a list is moving the new focus
  // is only recorded, and it's applied once the scroll settles.
  const isListScrolling = useRef(false);
  const hasMomentum = useRef(false);
  const dragSettleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleSettleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);
  // A tapped tab scrolls the pager programmatically. Handing audio/video over at the
  // same time (a video tab mounts a native player) blocks the main thread through the
  // scroll animation, and iOS then just jumps to the end. So, like a swipe, the
  // handover waits for the pager to settle.
  const isPagerAnimating = useRef(false);

  const takeFocus = useCallback(
    (tab: FeedTab, viewableItems: ViewToken[]) => {
      const focused = (viewableItems[0]?.item as FeedItem | undefined) ?? null;
      focusedCardByTab.current[tab] = focused;

      if (activeTabRef.current !== tab || isListScrolling.current || isPagerAnimating.current) {
        return;
      }

      applyFocus(focused);
    },
    [applyFocus]
  );

  const settleListScroll = useCallback(() => {
    if (idleSettleTimer.current) clearTimeout(idleSettleTimer.current);
    idleSettleTimer.current = null;
    isListScrolling.current = false;
    hasMomentum.current = false;
    applyFocus(focusedCardByTab.current[activeTabRef.current]);
  }, [applyFocus]);

  const listScrollHandlers = useMemo(
    () => ({
      onMomentumScrollBegin: () => {
        hasMomentum.current = true;
      },
      onMomentumScrollEnd: settleListScroll,
      // iOS sends no end event when a fling is stopped by a tap, which left the list
      // "scrolling" and the card it stopped on silent. A pause in scroll events settles it.
      onScroll: () => {
        if (!isListScrolling.current) return;
        if (idleSettleTimer.current) clearTimeout(idleSettleTimer.current);
        idleSettleTimer.current = setTimeout(() => {
          idleSettleTimer.current = null;
          // A finger resting mid-drag isn't a settled list.
          if (isListScrolling.current && !isDragging.current) settleListScroll();
        }, LIST_IDLE_SETTLE_MS);
      },
      onScrollBeginDrag: () => {
        isListScrolling.current = true;
        isDragging.current = true;
        hasMomentum.current = false;
      },
      onScrollEndDrag: () => {
        isDragging.current = false;
        // A release without a fling never fires momentum events; wait a beat to see
        // whether momentum starts before treating the scroll as settled.
        if (dragSettleTimer.current) clearTimeout(dragSettleTimer.current);
        dragSettleTimer.current = setTimeout(() => {
          dragSettleTimer.current = null;
          if (!hasMomentum.current && isListScrolling.current) settleListScroll();
        }, 60);
      }
    }),
    [settleListScroll]
  );

  const pagerSettleFallback = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pagerTargetTab = useRef<FeedTab | null>(null);

  const finishPagerAnimation = useCallback(
    (settledTab?: FeedTab) => {
      if (pagerSettleFallback.current) clearTimeout(pagerSettleFallback.current);
      pagerSettleFallback.current = null;
      const tab = settledTab ?? pagerTargetTab.current;
      pagerTargetTab.current = null;
      if (tab) {
        activeTabRef.current = tab;
        setActiveTab(tab);
      }
      if (!isPagerAnimating.current) return;
      isPagerAnimating.current = false;
      applyFocus(focusedCardByTab.current[activeTabRef.current]);
    },
    [applyFocus]
  );

  useEffect(
    () => () => {
      if (pagerSettleFallback.current) clearTimeout(pagerSettleFallback.current);
      if (dragSettleTimer.current) clearTimeout(dragSettleTimer.current);
      if (idleSettleTimer.current) clearTimeout(idleSettleTimer.current);
    },
    []
  );

  // A tap only starts the native scroll. Changing the active tab re-renders this whole
  // screen, and doing that at the same time blocked the main thread through iOS's
  // time-based scroll animation: it stalled, then jumped to the end. Like a swipe, the
  // tab (queries, audio, video) switches once the pager has settled.
  const selectTab = (tab: FeedTab) => {
    if (tab === (pagerTargetTab.current ?? activeTab)) return;
    isPagerAnimating.current = true;
    pagerTargetTab.current = tab;
    pagerRef.current?.scrollTo({ animated: true, x: FEED_TABS.indexOf(tab) * pageWidth });
    // The settle event is the normal path; this covers a scroll that never reports one.
    if (pagerSettleFallback.current) clearTimeout(pagerSettleFallback.current);
    pagerSettleFallback.current = setTimeout(
      () => finishPagerAnimation(),
      PAGER_SETTLE_FALLBACK_MS
    );
  };

  const handlePagerSettled = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIsSwiping(false);
    let settledTab: FeedTab | undefined;
    if (pageWidth > 0) {
      const page = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
      settledTab = FEED_TABS[Math.min(Math.max(page, 0), FEED_TABS.length - 1)];
    }
    finishPagerAnimation(settledTab);
  };

  useEffect(() => {
    activeTabRef.current = activeTab;
    if (isPagerAnimating.current) return;
    applyFocus(focusedCardByTab.current[activeTab]);
  }, [activeTab, applyFocus]);

  const handleGeralViewable = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => takeFocus("geral", viewableItems),
    [takeFocus]
  );

  const handleFollowingViewable = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => takeFocus("following", viewableItems),
    [takeFocus]
  );

  const renderFeed = (tab: FeedTab, query: typeof generalFeedQuery) => {
    const isActive = activeTab === tab;
    const variant = tab === "geral" ? "general" : "following";
    const items =
      query.data?.pages
        .flatMap((page) => page.items)
        .filter((item) => !deletedIds.includes(item.recorda_id)) ?? [];

    const footer = query.isFetchingNextPage ? (
      <Loading label={t("feed.loadingMore")} />
    ) : query.isFetchNextPageError ? (
      <View style={styles.paginationError}>
        <ErrorState message={t("feed.loadMoreError")} />
        <Button
          label={t("feed.retry")}
          onPress={() => void query.fetchNextPage()}
          variant="secondary"
        />
      </View>
    ) : null;

    return (
      <View
        accessibilityElementsHidden={!isActive}
        importantForAccessibility={isActive ? "auto" : "no-hide-descendants"}
        key={tab}
        style={[styles.panel, { width: pageWidth }]}
        testID={`${variant}-feed-panel`}
      >
        {query.isPending ? <Loading label={t("feed.loading")} /> : null}
        {query.isError && !query.isFetchNextPageError ? (
          <View style={styles.feedback}>
            <ErrorState message={t("feed.loadError")} />
            <Button
              label={t("feed.retry")}
              onPress={() => void query.refetch()}
              variant="secondary"
            />
          </View>
        ) : null}
        {query.isSuccess || items.length > 0 ? (
          <FlatList
            contentContainerStyle={styles.list}
            data={items}
            keyExtractor={(item) => item.recorda_id}
            ListEmptyComponent={<FeedEmptyState variant={variant} />}
            ListFooterComponent={footer}
            onEndReached={() => {
              if (
                isActive &&
                query.hasNextPage &&
                !query.isFetching &&
                !query.isFetchNextPageError
              ) {
                void query.fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.4}
            {...listScrollHandlers}
            onRefresh={() => {
              setPullRefreshingTab(tab);
              void Promise.resolve(query.refetch()).finally(() =>
                setPullRefreshingTab((current) => (current === tab ? null : current))
              );
            }}
            // Only a pull shows the spinner. Background refetches (a stale tab re-enabled
            // on switch) used to pop it in and shove the list down mid-transition.
            refreshing={pullRefreshingTab === tab}
            renderItem={renderItemByTab[tab]}
            onViewableItemsChanged={tab === "geral" ? handleGeralViewable : handleFollowingViewable}
            showsVerticalScrollIndicator={false}
            testID={`${variant}-feed-list`}
            viewabilityConfig={VIEWABILITY_CONFIG}
            windowSize={5}
          />
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.screen} testID="feed-screen">
      <StatusBar style="light" />
      <FeedGlow />
      <SafeAreaView edges={["top"]} style={styles.content}>
        <FeedHeader
          onNotificationsPress={() => navigation.navigate("Notifications")}
          unreadCount={unreadCount}
        />
        <FeedTabs activeTab={activeTab} onChange={selectTab} position={pagerPosition} />
        <Animated.ScrollView
          bounces={false}
          decelerationRate="fast"
          directionalLockEnabled
          horizontal
          onMomentumScrollEnd={handlePagerSettled}
          onScrollBeginDrag={() => setIsSwiping(true)}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: true
          })}
          pagingEnabled
          ref={pagerRef}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          style={styles.pager}
          testID="feed-pager"
        >
          {renderFeed("geral", generalFeedQuery)}
          {renderFeed("following", followingFeedQuery)}
        </Animated.ScrollView>
      </SafeAreaView>
      <BottomTabBar activeTab="feed" onPress={handleTabBarPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1
  },
  feedback: {
    gap: spacing[3],
    padding: spacing[4]
  },
  list: {
    flexGrow: 1,
    gap: spacing[4],
    paddingBottom: spacing[4],
    paddingTop: spacing[2]
  },
  pager: {
    flex: 1
  },
  paginationError: {
    gap: spacing[3],
    paddingHorizontal: spacing[4]
  },
  panel: {
    flex: 1
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    flex: 1,
    overflow: "hidden"
  }
});
