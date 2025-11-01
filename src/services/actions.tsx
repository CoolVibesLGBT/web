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


  CMD_USER_POSTS        : "user.fetch.posts",
	CMD_USER_POST_REPLIES : "user.fetch.posts.replies",
	CMD_USER_POST_MEDIA   : "user.fetch.posts.media",
	CMD_USER_POST_LIKES   : "user.fetch.posts.likes",

  USER_FETCH_PROFILE: "user.fetch_profile",

  POST_CREATE : "post.create",
  POST_FETCH : "post.fetch",
  POST_TIMELINE: "post.timeline",

  CMD_USER_UPLOAD_AVATAR  : "user.upload_avatar",
	CMD_USER_UPLOAD_COVER   : "user.upload_cover",
	CMD_USER_UPLOAD_STORY   : "user.upload_story",


  CMD_USER_FETCH_STORIES : "user.fetch.stories",
	CMD_USER_FETCH_NEARBY_USERS : "user.fetch.nearby.users",



} as const;

export type ActionType = typeof Actions[keyof typeof Actions];