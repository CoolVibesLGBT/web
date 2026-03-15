export const Actions = {
  // SYSTEM

  SYSTEM_INITIAL_SYNC: "system.initial_sync",
  CMD_PAYMENT_METHODS: "system.payment_methods",
  CMD_GET_VAPID_PUBLIC_KEY: "system_vapid_get_key",
  CMD_SET_VAPID_SUBSCRIBE: "system_vapid_subscribe",
  CMD_GET_NOTIFICATIONS: "system_notifications",
	CMD_LINK_METADATA   : "system.link_metadata",

  // AUTH
  AUTH_LOGIN: "auth.login",
  AUTH_REGISTER: "auth.register",
  AUTH_LOGOUT: "auth.logout",
  CMD_AUTH_USER_INFO: "auth.user_info",


  // CHAT
  CMD_CHAT_CREATE: "chat.create", // Chat olustur
  CMD_TYPING: "chat.typing",
  CMD_SEND_MESSAGE: "chat.send_message", // Mesaj gönder
  CMD_DELETE_CHAT: "chat.delete_chat",
  CMD_FETCH_CHATS: "chat.fetch_chats",   // Sohbetleri getir
  CMD_DELETE_MESSAGE: "chat.delete_message",// Mesajı sil
  CMD_FETCH_MESSAGES: "chat.fetch_messages", // Mesajları getir
  CMD_DELETE_MESSAGE_FOR_USER: "chat.delete_message_for_user",
  CMD_DELETE_CHAT_FOR_USER: "chat.delete_chat_for_user",
  CMD_DELETE_CHAT_FOR_ALL: "chat.delete_chat_for_all",
  CMD_DELETE_MESSAGE_FOR_ALL: "chat.delete_message_for_all",
  CMD_PIN_MESSAGE: "chat.pin_message",
  CMD_UNPIN_MESSAGE: "chat.unpin_message",
	CMD_CLEAR_CHAT_HISTORY_FOR_USER : "chat.clear_chat_history_for_user",
	CMD_CLEAR_CHAT_HISTORY_FOR_ALL  : "chat.clear_chat_history_for_all",


  // USER
  CMD_USER_GET_NOTIFICATIONS: "user.fetch.notifications",
  CMD_USER_MARK_NOTIFICATIONS_SEEN: "user.notifications.mark.seen",

  CMD_UPDATE_USER_PROFILE: "user.update_profile",
  CMD_USER_UPDATE_IDENTIFY: "user.update_identify",
  CMD_USER_UPDATE_ATTRIBUTE: "user.update_attribute",
  CMD_USER_UPDATE_INTEREST: "user.update_interest",
  CMD_USER_UPDATE_FANTASY: "user.update_fantasy",
  CMD_USER_UPDATE_PASSWORD: "user.update_password",

  CMD_USER_FOLLOW: "user.follow",
  CMD_USER_UNFOLLOW: "user.unfollow",
  CMD_USER_TOGGLE_FOLLOW: "user.follow.toggle",

  CMD_USER_BLOCK: "user.block",
  CMD_USER_UNBLOCK: "user.unblock",
  CMD_USER_TOGGLE_BLOCK: "user.block.toggle",

  CMD_USER_POSTS: "user.fetch.posts",
  CMD_USER_POST_REPLIES: "user.fetch.posts.replies",
  CMD_USER_POST_MEDIA: "user.fetch.posts.media",
  CMD_USER_POST_LIKES: "user.fetch.posts.likes",

  USER_FETCH_PROFILE: "user.fetch_profile",

  POST_CREATE: "post.create",
  CMD_POST_VOTE: "post.vote",
  POST_FETCH: "post.fetch",
  POST_TIMELINE: "post.timeline",
  POST_VIBES: "post.vibes",

  CMD_POST_LIKE: "post.like",
  CMD_POST_DISLIKE: "post.dislike",
  CMD_POST_BANANA: "post.banana",
  CMD_POST_BOOKMARK: "post.bookmark",
  CMD_POST_REPORT: "post.report",
  CMD_POST_VIEW: "post.view",
  CMD_POST_DELETE: "post.delete",
  CMD_POST_TIP: "post.tip",

  CMD_USER_REPORT: "user.report",

  CMD_USER_UPLOAD_AVATAR: "user.upload_avatar",
  CMD_USER_UPLOAD_COVER: "user.upload_cover",
  CMD_USER_UPLOAD_STORY: "user.upload_story",


  CMD_USER_FETCH_STORIES: "user.fetch.stories",
  CMD_USER_FETCH_NEARBY_USERS: "user.fetch.nearby.users",


  CMD_MATCH_GET_UNSEEN: "match.fetch.unseen", // Görülmemiş eşleşmeler
  CMD_MATCH_CREATE: "match.create",// Yeni eşleşme oluşturma (örneğin karşılıklı like)
  CMD_MATCH_FETCH_MATCHED: "match.fetch.matched", // Karşılıklı eşleşmeleri getirme (gerçek matchler)
  CMD_MATCH_FETCH_LIKED: "match.fetch.liked",  // Beğenilen kullanıcıları getirme
  CMD_MATCH_FETCH_PASSED: "match.fetch.passed", // Geçilen kullanıcıları getirme


  CMD_SEARCH_LOOKUP_USER: "search.user.lookup",

  CMD_USER_FETCH_ENGAGEMENTS: "user.fetch_engagements",
  CMD_SEARCH_TRENDS: "search.trends",

  CMD_USER_LIKE: "user.like",
  CMD_USER_DISLIKE: "user.dislike",
  CMD_USER_TOGGLE_LIKE: "user.like.toggle",
  CMD_USER_TOGGLE_DISLIKE: "user.dislike.toggle",


  CMD_PLACE_FETCH: "place.fetch",
  CMD_PLACE_CATEGORIES: "place.categories",



  CMD_USER_UPDATE_PREFERENCES: "user.update_preferences",

  CMD_USER_CHECK_IN: "user.check_in",
  CMD_USER_CHECK_IN_FETCH: "user.check_in_fetch",
  CMD_USER_DELETE_PROFILE: "user.delete_profile",

} as const;

export type ActionType = typeof Actions[keyof typeof Actions];