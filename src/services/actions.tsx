export const Actions = {
  // SYSTEM
  SYSTEM_INITIAL_SYNC: "system.initial_sync",

  // AUTH
  AUTH_LOGIN: "auth.login",
  AUTH_REGISTER: "auth.register",
  AUTH_LOGOUT: "auth.logout",
  CMD_AUTH_USER_INFO : "auth.user_info",


  // CHAT
  CHAT_SEND_TEXT: "chat.send_text",
  CHAT_SEND_GIF: "chat.send_gif",
  CHAT_SEND_CALL: "chat.send_call",
  CHAT_SEND_STICKER: "chat.send_sticker",

  // USER
  USER_UPDATE_PROFILE: "user.update_profile",
  CMD_USER_UPDATE_IDENTIFY : "user.update_identify",
  CMD_USER_UPDATE_ATTRIBUTE : "user.update_attribute",
	CMD_USER_UPDATE_INTEREST  : "user.update_interest",
	CMD_USER_UPDATE_FANTASY   : "user.update_fantasy",

  CMD_USER_FOLLOW        : "user.follow",
	CMD_USER_UNFOLLOW      : "user.unfollow",
	CMD_USER_TOGGLE_FOLLOW : "user.follow.toggle",


  CMD_USER_POSTS        : "user.fetch.posts",
	CMD_USER_POST_REPLIES : "user.fetch.posts.replies",
	CMD_USER_POST_MEDIA   : "user.fetch.posts.media",
	CMD_USER_POST_LIKES   : "user.fetch.posts.likes",

  USER_FETCH_PROFILE: "user.fetch_profile",

  POST_CREATE : "post.create",
  POST_FETCH : "post.fetch",
  POST_TIMELINE: "post.timeline",
  POST_VIBES: "post.vibes",

  CMD_USER_UPLOAD_AVATAR  : "user.upload_avatar",
	CMD_USER_UPLOAD_COVER   : "user.upload_cover",
	CMD_USER_UPLOAD_STORY   : "user.upload_story",


  CMD_USER_FETCH_STORIES : "user.fetch.stories",
	CMD_USER_FETCH_NEARBY_USERS : "user.fetch.nearby.users",


  CMD_MATCH_GET_UNSEEN : "match.fetch.unseen", // Görülmemiş eşleşmeler
	CMD_MATCH_CREATE : "match.create" ,// Yeni eşleşme oluşturma (örneğin karşılıklı like)
	CMD_MATCH_FETCH_MATCHED : "match.fetch.matched", // Karşılıklı eşleşmeleri getirme (gerçek matchler)
	CMD_MATCH_FETCH_LIKED   : "match.fetch.liked" ,  // Beğenilen kullanıcıları getirme
	CMD_MATCH_FETCH_PASSED  : "match.fetch.passed" , // Geçilen kullanıcıları getirme


  CMD_SEARCH_LOOKUP_USER : "search.user.lookup"


} as const;

export type ActionType = typeof Actions[keyof typeof Actions];