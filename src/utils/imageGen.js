// Utility to generate dynamic image URLs via Pollinations.ai
const BASE_URL = "https://gen.pollinations.ai/image";
const MODEL = "turbo";
const KEY = "pk_YyZbHBhyI8Elhxl0";

/**
 * Generates a URL for a procedurally generated image.
 * @param {string} description - The detailed prompt for the image.
 * @returns {string} The complete image URL.
 */
export const getGenImageUrl = (description) => {
    // URL Encode the description
    const encodedDesc = encodeURIComponent(description);
    return `${BASE_URL}/${encodedDesc}?model=${MODEL}&key=${KEY}`;
};

export const IMG_PROMPTS = {
    // Scenes & Backgrounds
    MAIN_MENU_BG: "dark void grimy texture with toxic green glitch accents abstract death metal aesthetic high contrast",
    OVERWORLD_MAP: "dark stylized map of germany glowing green nodes cyber grindcore aesthetic pixel art minimalist",
    POST_GIG_BG: "messy backstage room concert venue equipment trash bottles darkness green lighting pixel art",
    
    // Venue Backgrounds
    VENUE_KAMINSTUBE: "small cozy dark room fireplace heavy metal concert atmosphere pixel art",
    VENUE_DIVE_BAR: "grimy dive bar punk venue sticky floor dark graffiti pixel art",
    VENUE_CLUB: "underground music club stage lights smoke fog dark atmosphere pixel art",
    VENUE_FESTIVAL: "huge open air metal festival stage crowd banners day time pixel art",
    VENUE_GALACTIC: "concert stage floating in deep space cosmic nebula stars toxic green void pixel art",

    // Band Members (States)
    // Matze (Guitar)
    MATZE_IDLE: "pixel art metal guitarist standing idle holding flying v guitar dark moody",
    MATZE_PLAYING: "pixel art metal guitarist shredding solo fast fingers lightning effect",
    MATZE_ANGRY: "pixel art metal guitarist angry shouting smashing guitar",
    
    // Lars (Drums)
    LARS_IDLE: "pixel art metal drummer sitting behind kit waiting dark",
    LARS_PLAYING: "pixel art metal drummer blast beating fast blur sticks motion",
    LARS_DRINKING: "pixel art metal drummer drinking beer cheers happy",

    // Marius (Bass)
    MARIUS_IDLE: "pixel art bassist standing cool sunglasses dark clothes",
    MARIUS_PLAYING: "pixel art bassist playing rhythm headbanging",
    MARIUS_SCREAMING: "pixel art bassist screaming into microphone aggressive growl",

    // Crowd
    CROWD_IDLE: "pixel art metalhead crowd standing waiting dark silhouettes",
    CROWD_MOSH: "pixel art mosh pit chaos fighting dancing dust",
    
    // UI Elements
    NOTE_SKULL: "pixel art white skull icon simple transparent background",
    NOTE_LIGHTNING: "pixel art green lightning bolt icon simple transparent background",
    HIT_BLOOD: "pixel art red blood splatter explosion transparent background",
    HIT_TOXIC: "pixel art toxic green explosion cloud transparent background",
    
    // Map Icons
    ICON_VAN: "pixel art black tour van side view small icon",
    ICON_PIN_CLUB: "pixel art map pin skull shape green",
    ICON_PIN_FESTIVAL: "pixel art map pin flame shape red",
    
    // Events
    EVENT_POLICE: "german police car night flashing blue lights pixel art gritty",
    EVENT_VAN: "broken down tour van smoke rising highway side night pixel art",
    EVENT_GIG: "view from stage mosh pit chaos bright lights pixel art",
    EVENT_BAND: "band members arguing backstage silhouettes angry pixel art",
    EVENT_MONEY: "stack of euro bills dirty grunge texture pixel art",
    EVENT_SPECIAL: "cosmic horror void portal swirling purple and green eyes watching pixel art"
};
