export const Actions = {
  // SYSTEM
  SYSTEM_INITIAL_SYNC: "system.initial_sync",

  // AUTH
  AUTH_LOGIN: "auth.login",
  AUTH_REGISTER: "auth.register",
  AUTH_LOGOUT: "auth.logout",
  CMD_AUTH_USER_INFO: "auth.user_info",


  // CHAT
  CMD_CHAT_CREATE: "chat.create",
  CMD_TYPING: "chat.typing",
  CMD_SEND_MESSAGE: "chat.send_message",   // Mesaj gönder
  CMD_DELETE_CHAT: "chat.delete_chat",    // Sohbeti sil
  CMD_FETCH_CHATS: "chat.fetch_chats",    // Sohbetleri getir
  CMD_DELETE_MESSAGE: "chat.delete_message", // Mesajı sil
  CMD_FETCH_MESSAGES: "chat.fetch_messages", // Mesajları getir


  // USER
  CMD_UPDATE_USER_PROFILE: "user.update_profile",
  CMD_USER_UPDATE_IDENTIFY: "user.update_identify",
  CMD_USER_UPDATE_ATTRIBUTE: "user.update_attribute",
  CMD_USER_UPDATE_INTEREST: "user.update_interest",
  CMD_USER_UPDATE_FANTASY: "user.update_fantasy",
  CMD_USER_UPDATE_PASSWORD: "user.update_password",

  CMD_USER_FOLLOW: "user.follow",
  CMD_USER_UNFOLLOW: "user.unfollow",
  CMD_USER_TOGGLE_FOLLOW: "user.follow.toggle",


  CMD_USER_POSTS: "user.fetch.posts",
  CMD_USER_POST_REPLIES: "user.fetch.posts.replies",
  CMD_USER_POST_MEDIA: "user.fetch.posts.media",
  CMD_USER_POST_LIKES: "user.fetch.posts.likes",

  USER_FETCH_PROFILE: "user.fetch_profile",

  POST_CREATE: "post.create",
  POST_FETCH: "post.fetch",
  POST_TIMELINE: "post.timeline",
  POST_VIBES: "post.vibes",

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
  
  CMD_USER_TOGGLE_BLOCK: "user.block.toggle",



} as const;

export type ActionType = typeof Actions[keyof typeof Actions];