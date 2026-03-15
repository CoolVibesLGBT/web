'use client'

import { Actions, ActionType } from "./actions";
import { callApi } from "./api.server";
import type { ApiRequestOptions } from "./api.types";
import { serviceURL } from "@/appSettings";

export class ApiService {


  async fetchMetadata(url: unknown) {
    return this.call(Actions.CMD_LINK_METADATA, {
      method: "POST",
      body: { url: url }
    });
  }

  async checkNewNotifications(limit: number = 1, cursor: unknown = null) {
    return this.call(Actions.CMD_USER_GET_NOTIFICATIONS, {
      method: "POST",
      body: { limit: limit, cursor: cursor }
    });
  }



  async handleGetVapidKey() {
    return this.call(Actions.CMD_GET_VAPID_PUBLIC_KEY, {
      method: "POST",
    });
  }

  async handleSetVapidSubscriptions(params: unknown) {
    return this.call(Actions.CMD_SET_VAPID_SUBSCRIBE, {
      method: "POST",
      body: params
    });
  }

  async handleRegister(user: Record<string, unknown>) {
    return this.call(Actions.AUTH_REGISTER, {
      method: "POST",
      body: user,
    });
  }

  async handleFetchPaymentMethods() {
    return this.call(Actions.CMD_PAYMENT_METHODS, {
      method: "POST",
    });
  }

  async handleCreatePost(data: Record<string, unknown>) {

    return this.call(Actions.POST_CREATE, {
      method: "POST",
      body: data,
    });
    console.log("handleCreatePost", data)
  }

  async handlePostDelete(postId: unknown) {
    return this.call(Actions.CMD_POST_DELETE, {
      method: "POST",
      body: { post_id: postId },
    });
  }

  async handlePostLike(postId: unknown) {
    return this.call(Actions.CMD_POST_LIKE, {
      method: "POST",
      body: { post_id: postId },
    });
  }

  async handlePostDislike(postId: unknown) {
    return this.call(Actions.CMD_POST_DISLIKE, {
      method: "POST",
      body: { post_id: postId },
    });
  }

  async handlePostBanana(postId: unknown) {
    return this.call(Actions.CMD_POST_BANANA, {
      method: "POST",
      body: { post_id: postId },
    });
  }

  async handlePostAddToBookmarks(postId: unknown) {
    return this.call(Actions.CMD_POST_BOOKMARK, {
      method: "POST",
      body: { post_id: postId },
    });
  }

  async handlePostReport(postId: unknown, reason: unknown, description: unknown) {
    return this.call(Actions.CMD_POST_REPORT, {
      method: "POST",
      body: { post_id: postId, reason: reason, description: description },
    });
  }

  async handleUserReport(userId: unknown, reason: unknown, description: unknown) {
    return this.call(Actions.CMD_USER_REPORT, {
      method: "POST",
      body: { userId: userId, reason: reason, description: description },
    });
  }

  async handlePostView(postId: unknown) {
    return this.call(Actions.CMD_POST_VIEW, {
      method: "POST",
      body: { post_id: postId },
    });
  }


  async handleSendTip(postId: unknown, amount: unknown) {
    return this.call(Actions.CMD_POST_TIP, {
      method: "POST",
      body: { post_id: postId, amount: amount },
    });
  }


  async handleLogin(credentials: { nickname: string; password: string; location?: unknown }) {
    return this.call(Actions.AUTH_LOGIN, {
      method: "POST",
      body: credentials,
    });
  }

  async handleVote(credentials: { choice_id: string; weight?: number; rank?: number }) {
    const body: Record<string, unknown> = {
      choice_id: credentials.choice_id,
    };

    if (credentials.weight !== undefined && credentials.weight !== null) {
      body.weight = credentials.weight;
    }

    if (credentials.rank !== undefined && credentials.rank !== null) {
      body.rank = credentials.rank;
    }

    return this.call(Actions.CMD_POST_VOTE, {
      method: "POST",
      body: body,
    });
  }


  async fetchTimeline({ limit = 10, cursor = "" }: { limit?: number; cursor?: string }) {
    return this.call(Actions.POST_TIMELINE, {
      method: "POST",
      body: { limit, cursor }, // doğru değişkenler gönderiliyor
    });
  }


  async fetchCheckIns({ limit = 10, cursor = "" }: { limit?: number; cursor?: string }) {
    return this.call(Actions.CMD_USER_CHECK_IN_FETCH, {
      method: "POST",
      body: { limit, cursor }, // doğru değişkenler gönderiliyor
    });
  }


  async fetchVibes({ limit = 10, cursor = "" }: { limit?: number; cursor?: string }) {
    return this.call(Actions.POST_VIBES, {
      method: "POST",
      body: { limit, cursor },
    });
  }

  async fetchPost(postId: string) {
    return this.call(Actions.POST_FETCH, {
      method: "POST",
      body: { post_id: postId },
    });
  }

  async fetchPlace(publicId: string) {
    return this.call(Actions.CMD_PLACE_FETCH, {
      method: 'POST',
      body: { public_id: publicId },
    });
  }

  async fetchNearbyPlaces(latitude: number | null, longitude: number | null, cursor: string | null = null, distance: string | null = null, limit: number | null = null) {
    return this.call(Actions.CMD_PLACE_FETCH, {
      method: 'POST',
      body: { latitude: latitude, longitude: longitude, cursor: cursor, distance: distance, limit: limit },
    });
  }

  async fetchPlacesCategories(cursor: string | null = null, limit: number | null = null) {
    return this.call(Actions.CMD_PLACE_CATEGORIES, {
      method: 'POST',
      body: { limit: limit, cursor: cursor },
    });
  }

  async toggleBlockUser(blocked_id: string) {
    await this.call(Actions.CMD_USER_TOGGLE_BLOCK, {
      method: 'POST',
      body: {
        blocked_id: blocked_id,
      },
    });
    window.dispatchEvent(new CustomEvent('userBlocked', { detail: { userId: blocked_id } }));
  }


  async updateProfile(userData: Record<string, unknown>) {
    return this.call(Actions.CMD_UPDATE_USER_PROFILE, {
      method: "POST",
      body: userData,
    });
  }

  async fetchProfile(username?: string) {
    return this.call(Actions.USER_FETCH_PROFILE, {
      method: "GET",
      params: username ? { username } : {},
    });
  }

  async fetchProfileByNickname(nickname: string) {
    return this.call(Actions.USER_FETCH_PROFILE, {
      method: "POST",
      body: { nickname },
    });
  }

  // Matches
  async fetchMatchUnseen(limit: number = 100) {
    return this.call(Actions.CMD_MATCH_GET_UNSEEN, {
      method: "POST",
      body: { limit },
    });
  }

  async createMatch(publicId: number, reaction: string) {
    return this.call(Actions.CMD_MATCH_CREATE, {
      method: "POST",
      body: { public_id: publicId, reaction },
    });
  }

  async fetchMatchedProfiles(limit: number = 20, cursor: string | null = null) {
    return this.call(Actions.CMD_MATCH_FETCH_MATCHED, {
      method: "POST",
      body: { limit, cursor },
    });
  }

  async fetchLikedProfiles(limit: number = 20, cursor: string | null = null) {
    return this.call(Actions.CMD_MATCH_FETCH_LIKED, {
      method: "POST",
      body: { limit, cursor },
    });
  }

  async fetchPassedProfiles(limit: number = 20, cursor: string | null = null) {
    return this.call(Actions.CMD_MATCH_FETCH_PASSED, {
      method: "POST",
      body: { limit, cursor },
    });
  }

  async createChat(participantIds: string[], type: string = "private") {
    return this.call(Actions.CMD_CHAT_CREATE, {
      method: "POST",
      body: { type, participant_ids: participantIds },
    });
  }

  // Nearby
  async fetchNearbyUsers(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_FETCH_NEARBY_USERS, {
      method: "POST",
      body: payload,
    });
  }

  // Messages
  async fetchChats() {
    return this.call(Actions.CMD_FETCH_CHATS, {
      method: "POST",
      body: {},
    });
  }

  async fetchMessages(chatId: string) {
    return this.call(Actions.CMD_FETCH_MESSAGES, {
      method: "POST",
      body: { chat_id: chatId },
    });
  }

  async sendMessage(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_SEND_MESSAGE, {
      method: "POST",
      body: payload,
    });
  }

  async sendTyping(chatId: string) {
    return this.call(Actions.CMD_TYPING, {
      method: "POST",
      body: { chat_id: chatId },
    });
  }

  // Profile updates & uploads
  async updatePassword(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_UPDATE_PASSWORD, {
      method: "POST",
      body: payload,
    });
  }

  async updateIdentify(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_UPDATE_IDENTIFY, {
      method: "POST",
      body: payload,
    });
  }

  async updateAttribute(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_UPDATE_ATTRIBUTE, {
      method: "POST",
      body: payload,
    });
  }

  async updateInterest(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_UPDATE_INTEREST, {
      method: "POST",
      body: payload,
    });
  }

  async updateFantasy(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_UPDATE_FANTASY, {
      method: "POST",
      body: payload,
    });
  }

  async uploadAvatar(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_UPLOAD_AVATAR, {
      method: "POST",
      body: payload,
    });
  }

  async uploadCover(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_UPLOAD_COVER, {
      method: "POST",
      body: payload,
    });
  }

  async fetchUserPosts(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_POSTS, {
      method: "POST",
      body: payload,
    });
  }

  async fetchUserPostReplies(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_POST_REPLIES, {
      method: "POST",
      body: payload,
    });
  }

  async fetchUserPostLikes(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_POST_LIKES, {
      method: "POST",
      body: payload,
    });
  }

  async fetchUserPostMedia(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_POST_MEDIA, {
      method: "POST",
      body: payload,
    });
  }

  async toggleFollow(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_TOGGLE_FOLLOW, {
      method: "POST",
      body: payload,
    });
  }

  async fetchEngagements(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_FETCH_ENGAGEMENTS, {
      method: "POST",
      body: payload,
    });
  }

  // System
  async fetchInitialSync() {
    return this.call(Actions.SYSTEM_INITIAL_SYNC, {
      method: "POST",
      body: {},
    });
  }

  // Discovery
  async fetchTrends(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_SEARCH_TRENDS, {
      method: "POST",
      body: payload,
    });
  }

  // Stories
  async fetchStories(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_FETCH_STORIES, {
      method: "POST",
      body: payload,
    });
  }

  async uploadStory(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_UPLOAD_STORY, {
      method: "POST",
      body: payload,
    });
  }

  // User interactions
  async toggleUserLike(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_TOGGLE_LIKE, {
      method: "POST",
      body: payload,
    });
  }

  async toggleUserDislike(payload: Record<string, unknown>) {
    return this.call(Actions.CMD_USER_TOGGLE_DISLIKE, {
      method: "POST",
      body: payload,
    });
  }

  async getUserInfo() {
    return this.call(Actions.CMD_AUTH_USER_INFO, {
      method: "POST",
      body: {},
    });
  }


  async deleteChatForMe(chatId: string) {
    return this.call(Actions.CMD_DELETE_CHAT_FOR_USER, {
      method: "POST",
      body: { chat_id: chatId },
    });
  }

  async deleteChatForAll(chatId: string) {
    return this.call(Actions.CMD_DELETE_CHAT_FOR_ALL, {
      method: "POST",
      body: { chat_id: chatId },
    });
  }

  async deleteMessageForMe(chatId: string, messageId: string) {
    return this.call(Actions.CMD_DELETE_MESSAGE_FOR_USER, {
      method: "POST",
      body: { chat_id: chatId, message_id: messageId },
    });
  }

  async deleteMessageForAll(chatId: string, messageId: string) {
    return this.call(Actions.CMD_DELETE_MESSAGE_FOR_ALL, {
      method: "POST",
      body: { chat_id: chatId, message_id: messageId },
    });
  }


  async clearChatHistoryForMe(chatId: string) {
    return this.call(Actions.CMD_CLEAR_CHAT_HISTORY_FOR_USER, {
      method: "POST",
      body: { chat_id: chatId },
    });
  }

  async clearChatHistoryForAll(chatId: string) {
    return this.call(Actions.CMD_CLEAR_CHAT_HISTORY_FOR_ALL, {
      method: "POST",
      body: { chat_id: chatId },
    });
  }



  async updatePreferences(id: string, bit_index: number, enabled: boolean) {
    return this.call(Actions.CMD_USER_UPDATE_PREFERENCES, {
      method: "POST",
      body: {
        id: id,
        bit_index: bit_index,
        enabled: enabled,
      },
    });
  }

  async handleDeleteProfile() {
    return this.call(Actions.CMD_USER_DELETE_PROFILE, {
      method: "POST",
      body: {},
    });
  }

  async searchUserLookup(query: string) {
    return this.call<{
      users: Array<{
        id: string;
        username: string;
        displayname: string;
        avatar?: {
          file?: {
            url?: string;
          };
        };
      }>
    } | Array<{
      id: string;
      username: string;
      displayname: string;
      avatar?: {
        file?: {
          url?: string;
        };
      };
    }>>(Actions.CMD_SEARCH_LOOKUP_USER, {
      method: "POST",
      body: { query },
    });
  }



  async call<T = unknown>(
    action: ActionType,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const method = options.method ?? "GET";

    console.log("GIDEN DATA", options)

    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    const baseURL = serviceURL[0];

    return callApi<T>(action, options, {
      baseURL,
      authToken: token,
    });
  }
}

export const api = new ApiService();
