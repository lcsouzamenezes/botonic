import BotonicLogo from './assets/botonic_react_logo100x100.png'

export const COLORS = {
  // http://chir.ag/projects/name-that-color
  TRANSPARENT: 'rgba(0, 0, 0, 0)',
  BOTONIC_BLUE: 'rgba(0, 153, 255, 1)',
  SOLID_BLACK: 'rgba(0, 0, 0, 1)',
  SOLID_BLACK_ALPHA_0_5: 'rgba(0, 0, 0, 0.5)',
  SOLID_BLACK_ALPHA_0_2: 'rgba(0, 0, 0, 0.2)',
  SOLID_WHITE: 'rgba(255, 255, 255, 1)',
  SOLID_WHITE_ALPHA_0_8: 'rgba(255, 255, 255, 0.8)',
  SOLID_WHITE_ALPHA_0_2: 'rgba(255, 255, 255, 0.2)',
  CONCRETE_WHITE: 'rgba(243, 243, 243, 1)',
  MID_GRAY: 'rgba(105, 105, 115, 1)',
  FRINGY_FLOWER_GREEN: 'rgba(198, 231, 192, 1)',
  TASMAN_GRAY: 'rgba(209, 216, 207, 1)',
  APPLE_GREEN: 'rgba(58, 156, 53, 1)',
  CACTUS_GREEN: 'rgba(96, 115, 94, 1)',
  DAINTREE_BLUE: 'rgba(0, 43, 53, 1)',
  PIGEON_POST_BLUE_ALPHA_0_5: 'rgba(176, 196, 222, 0.5)',
  SEASHELL_WHITE: 'rgba(241, 240, 240, 1)',
  GRAY: 'rgba(129, 129, 129, 1)',
  SCORPION_GRAY: 'rgba(87, 87, 87, 1)',
  BLEACHED_CEDAR_PURPLE: 'rgba(46, 32, 59, 1)',
  WILD_SAND_WHITE: 'rgba(244, 244, 244, 1)',
  CURIOUS_BLUE: 'rgba(38, 139, 210, 1)',
}

export const WEBCHAT = {
  DEFAULTS: {
    WIDTH: 300,
    HEIGHT: 450,
    TITLE: 'Botonic',
    LOGO: BotonicLogo,
    PLACEHOLDER: 'Ask me something...',
    FONT_FAMILY: "'Noto Sans JP', sans-serif",
  },
  CUSTOM_PROPERTIES: {
    webviewStyle: 'webview.style',
    enableAnimations: 'animations.enable',
    webviewHeaderStyle: 'webview.header.style',
    brandColor: 'brand.color',
    brandImage: 'brand.image',
    headerStyle: 'header.style',
    headerTitle: 'header.title',
    headerSubtitle: 'header.subtitle',
    headerImage: 'header.image',
    customHeader: 'header.custom',
    botMessageImage: 'message.bot.image',
    botMessageImageStyle: 'message.bot.imageStyle',
    botMessageBlobTick: 'message.bot.blobTick',
    botMessageStyle: 'message.bot.style',
    botMessageBackground: 'message.bot.style.background',
    botMessageBlobWidth: 'message.bot.blobWidth',
    userMessageStyle: 'message.user.style',
    userMessageBlobTick: 'message.user.blobTick',
    userMessageBackground: 'message.user.style.background',
    customMessageTypes: 'message.customTypes',
    messageStyle: 'message.style',
    messageTimestampsLocale: 'message.timestamps.locale',
    messageTimestampsFormat: 'message.timestamps.format',
    messageTimestampsStyle: 'message.timestamps.style',
    introImage: 'intro.image',
    introStyle: 'intro.style',
    customIntro: 'intro.custom',
    buttonStyle: 'button.style',
    buttonStyleBackground: 'button.style.background',
    buttonHoverBackground: 'button.hoverBackground',
    buttonStyleColor: 'button.style.color',
    buttonHoverTextColor: 'button.hoverTextColor',
    buttonMessageType: 'button.messageType',
    customButton: 'button.custom',
    alignReplies: 'replies.align',
    wrapReplies: 'replies.wrap',
    replyStyle: 'reply.style',
    customReply: 'reply.custom',
    triggerButtonImage: 'triggerButton.image',
    triggerButtonStyle: 'triggerButton.style',
    customTrigger: 'triggerButton.custom',
    enableUserInput: 'userInput.enable',
    userInputStyle: 'userInput.style',
    userInputBoxStyle: 'userInput.box.style',
    textPlaceholder: 'userInput.box.placeholder',
    enableEmojiPicker: 'userInput.emojiPicker.enable',
    enableAttachments: 'userInput.attachments.enable',
    enableSendButton: 'userInput.sendButton.enable',
    customSendButton: 'userInput.sendButton.custom',
    persistentMenu: 'userInput.persistentMenu',
    darkBackgroundMenu: 'userInput.menu.darkBackground',
    customPersistentMenu: 'userInput.menu.custom',
    customMenuButton: 'userInput.menuButton.custom',
    blockInputs: 'userInput.blockInputs',
    scrollbar: 'scrollbar',
  },
}

export const MIME_WHITELIST = {
  document: ['application/pdf'],
  image: ['image/jpeg', 'image/png'],
  video: ['video/mp4'],
  audio: ['audio/mpeg', 'audio/mp3'],
}
