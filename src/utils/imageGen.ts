// @ts-nocheck
// TODO: Review this file
// Utility to generate dynamic image URLs via Pollinations.ai
const BASE_URL = 'https://gen.pollinations.ai/image'
const MODEL = 'flux'
const KEY = 'pk_xDL8u2ty4Sxucaa3' // gitleaks:allow

/**
 * Generates a URL string for a procedurally generated image.
 * Use this for direct URL assignment (img src, CSS backgroundImage, PIXI loaders).
 * @param {string} description - The detailed prompt for the image.
 * @returns {string} The complete image URL.
 */
export const getGenImageUrl = description => {
  const encodedDesc = encodeURIComponent(description)
  return `${BASE_URL}/${encodedDesc}?model=${MODEL}&seed=666&key=${KEY}&=` // "&=" is required to ensure working image generation
}

/**
 * Fetches a generated image with explicit Accept headers.
 * @param {string} description - The detailed prompt for the image.
 * @returns {Promise<Response>} The fetch response.
 */
export const fetchGenImage = description => {
  const encodedDesc = encodeURIComponent(description)
  return fetch(
    `${BASE_URL}/${encodedDesc}?model=${MODEL}&seed=666&key=${KEY}&=`, // "&=" is required to ensure working image generation
    {
      headers: {
        Accept: 'image/jpeg, image/png, video/mp4'
      }
    }
  )
}

const objectUrlCache = new Map()

/**
 * Fetches a generated image and returns an object URL for use in CSS/styles.
 * Uses a memory cache to avoid redundant network requests and memory leaks.
 * Caches the Promise to prevent concurrent fetch races.
 *
 * @param {string} description - The detailed prompt for the image.
 * @returns {Promise<string>} A blob object URL.
 */
export const fetchGenImageAsObjectUrl = description => {
  if (objectUrlCache.has(description)) {
    return objectUrlCache.get(description)
  }

  const promise = (async () => {
    try {
      const res = await fetchGenImage(description)
      if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`)
      const blob = await res.blob()
      return URL.createObjectURL(blob)
    } catch (error) {
      objectUrlCache.delete(description)
      throw error
    }
  })()

  objectUrlCache.set(description, promise)
  return promise
}

/**
 * Clears the object URL cache and revokes all generated blob URLs to free up memory.
 * Primarily used for testing or when memory pressure is high.
 * Must be awaited to ensure all pending blob generation promises are handled.
 *
 * WARNING: Revoking these URLs will immediately break any active image elements
 * or CSS backgrounds that are still currently rendering them. Only call this when
 * you are certain the old images are no longer needed (e.g. between full game runs).
 *
 * @returns {Promise<void>} Resolves when all object URLs are cleared.
 */
export const clearImageCache = async () => {
  const urls = await Promise.allSettled(Array.from(objectUrlCache.values()))
  for (const result of urls) {
    if (
      result.status === 'fulfilled' &&
      typeof URL !== 'undefined' &&
      URL.revokeObjectURL
    ) {
      URL.revokeObjectURL(result.value)
    }
  }
  objectUrlCache.clear()
}

export const IMG_PROMPTS = {
  // Scenes & Backgrounds
  MAIN_MENU_BG:
    'dark void grimy texture with toxic green glitch accents abstract death metal aesthetic high contrast',
  OVERWORLD_MAP:
    'dark stylized map of germany glowing green nodes cyber grindcore aesthetic pixel art minimalist',
  POST_GIG_BG:
    'messy backstage room concert venue equipment trash bottles darkness green lighting pixel art',

  // Venue Backgrounds
  VENUE_KAMINSTUBE:
    'small cozy dark room fireplace heavy metal concert atmosphere pixel art',
  VENUE_DIVE_BAR:
    'grimy dive bar punk venue sticky floor dark graffiti pixel art',
  VENUE_CLUB:
    'underground music club stage lights smoke fog dark atmosphere pixel art',
  VENUE_FESTIVAL:
    'huge open air metal festival stage crowd banners day time pixel art',
  VENUE_GALACTIC:
    'concert stage floating in deep space cosmic nebula stars toxic green void pixel art',

  // Band Members (States)
  // Matze (Guitar)
  MATZE_IDLE:
    'pixel art metal guitarist standing idle holding flying v guitar dark moody',
  MATZE_PLAYING:
    'pixel art metal guitarist shredding solo fast fingers lightning effect',
  MATZE_ANGRY: 'pixel art metal guitarist angry shouting smashing guitar',

  // Marius (Drums)
  MARIUS_IDLE: 'pixel art metal drummer sitting behind kit waiting dark',
  MARIUS_PLAYING:
    'pixel art metal drummer blast beating fast blur sticks motion',
  MARIUS_DRINKING: 'pixel art metal drummer drinking beer cheers happy',

  // Lars (Bass)
  LARS_IDLE: 'pixel art bassist standing cool sunglasses dark clothes',
  LARS_PLAYING: 'pixel art bassist playing rhythm headbanging',
  LARS_SCREAMING:
    'pixel art bassist screaming into microphone aggressive growl',

  // Crowd
  CROWD_IDLE: 'pixel art metalhead crowd standing waiting dark silhouettes',
  CROWD_MOSH: 'pixel art mosh pit chaos fighting dancing dust',

  // UI Elements
  NOTE_SKULL: 'pixel art white skull icon transparent background',
  NOTE_LIGHTNING:
    'pixel art green lightning bolt icon simple transparent background',
  HIT_BLOOD:
    'pixel art red blood splatter explosion isolated on solid black background no shadow',
  HIT_TOXIC:
    'pixel art toxic green explosion cloud isolated on solid black background no shadow',

  // Map Icons
  ICON_VAN: 'pixel art black tour van side view small icon',
  ICON_PIN_CLUB: 'pixel art map pin skull shape green',
  ICON_PIN_FESTIVAL: 'pixel art map pin flame shape red',
  ICON_PIN_HOME: 'pixel art home icon rehearsal room garage door grunge style',
  ICON_PIN_REST: 'pixel art map pin campfire shape orange rest stop cozy icon',
  ICON_PIN_SPECIAL: 'pixel art map pin mystery portal purple swirl cosmic icon',
  ICON_PIN_FINALE: 'pixel art map pin golden trophy crown star icon',

  // HQ
  BAND_HQ_BG:
    'messy punk rehearsal room band posters beer crates amplifiers instruments pixel art cozy grunge',
  BLOOD_BANK_BG:
    'grimy underground clinic blood bags medical tubes dark scary hospital aesthetic brutalist horror',

  // Events
  EVENT_POLICE: 'german police car night flashing blue lights pixel art gritty',
  EVENT_VAN: 'broken down tour van smoke rising highway side night pixel art',
  EVENT_GIG: 'view from stage mosh pit chaos bright lights pixel art',
  EVENT_BAND: 'band members arguing backstage silhouettes angry pixel art',
  EVENT_MONEY: 'stack of euro bills dirty grunge texture pixel art',
  EVENT_SPECIAL:
    'cosmic horror void portal swirling purple and green eyes watching pixel art',

  // Items - Gear
  ITEM_STRINGS: 'pixel art guitar strings pack icon',
  ITEM_CABLES: 'pixel art coiled audio cable icon golden plug',
  ITEM_DRUM_PARTS: 'pixel art drum sticks and drum head icon',
  ITEM_MERCH_SHIRTS: 'pixel art box full of black band t-shirts icon',
  ITEM_MERCH_HOODIES: 'pixel art stack of black hoodies icon',
  ITEM_MERCH_PATCHES: 'pixel art pile of embroidered patches icon',
  ITEM_MERCH_VINYL: 'pixel art vinyl record stack icon',
  ITEM_MERCH_CDS: 'pixel art stack of cd cases icon',
  ITEM_BROKEN_PEDAL: 'pixel art broken guitar pedal with duct tape icon',
  ITEM_CHEAP_MICS: 'pixel art cheap plastic microphone icon',
  ITEM_DIY_PATCH_KIT: 'pixel art needle and thread sewing kit icon',
  ITEM_CANNED_FOOD: 'pixel art stack of tin cans food icon',
  ITEM_BEER_CRATE: 'pixel art crate of beer bottles icon',
  ITEM_RABBIT_FOOT: 'pixel art lucky rabbit foot keychain icon',
  ITEM_DUCT_TAPE: 'pixel art roll of silver duct tape icon',
  ITEM_INCENSE: 'pixel art burning incense sticks smoke icon',
  ITEM_VOODOO_DOLL: 'pixel art small voodoo doll with pins icon',

  // Items - Instruments
  ITEM_GUITAR_CUSTOM: 'pixel art 8 string electric guitar icon',
  ITEM_GUITAR_V: 'pixel art rusty flying v guitar icon',
  ITEM_BASS_PREAMP: 'pixel art bass preamp pedal icon',
  ITEM_DRUM_TRIGGER: 'pixel art drum trigger sensor icon',
  ITEM_COWBELL: 'pixel art cowbell instrument icon',
  ITEM_GUITAR_CHEAP: 'pixel art cheap beat up electric guitar icon',
  ITEM_DRUM_BROKEN: 'pixel art broken drum kit icon',
  ITEM_PEDAL_CHEAP: 'pixel art cheap plastic guitar pedal icon',
  ITEM_THEREMIN: 'pixel art theremin instrument icon',
  ITEM_DIDGERIDOO: 'pixel art didgeridoo instrument icon',

  // Items - Van
  ITEM_VAN_SUSPENSION: 'pixel art car suspension spring icon',
  ITEM_VAN_STUDIO: 'pixel art mobile recording studio equipment icon',
  ITEM_VAN_STORAGE: 'pixel art car roof box icon',
  ITEM_VAN_TUNING: 'pixel art car engine engine parts icon',
  ITEM_VAN_TIRE: 'pixel art worn out car tire icon',
  ITEM_VAN_PAINT: 'pixel art spray paint can grey icon',
  ITEM_SLEEPING_BAGS: 'pixel art rolled up sleeping bag icon',
  ITEM_GLUE_TAPE: 'pixel art super glue tube and tape icon',
  ITEM_MATTRESS: 'pixel art dirty old mattress icon',
  ITEM_SPOILER: 'pixel art car spoiler wing icon',
  ITEM_DISCO_BALL: 'pixel art disco ball icon',
  ITEM_FLAMETHROWER: 'pixel art flamethrower weapon icon',

  // Items - HQ
  ITEM_HQ_COFFEE: 'pixel art espresso machine icon',
  ITEM_HQ_SOFA: 'pixel art leather sofa icon',
  ITEM_HQ_BOTNET: 'pixel art computer server rack icon',
  ITEM_HQ_PR_CONTRACT:
    'pixel art formal pr contract document with pen and handshake icon',
  ITEM_HQ_LABEL: 'pixel art record contract document icon',
  ITEM_HQ_OLD_COUCH: 'pixel art old ripped couch icon',
  ITEM_HQ_POSTERS: 'pixel art wall with band posters icon',
  ITEM_HQ_FRIDGE: 'pixel art fridge full of beer icon',
  ITEM_HQ_EGGS: 'pixel art egg cartons on wall soundproofing icon',
  ITEM_HQ_CAT: 'pixel art black cat sitting icon',
  ITEM_HQ_PIPELINE: 'pixel art beer tap pipeline icon',
  ITEM_HQ_SHRINE: 'pixel art shrine with candles and whiskey bottle icon',
  ITEM_HQ_SKULL: 'pixel art animal skull decoration icon',

  // Minigame - Tourbus
  MINIGAME_ROAD:
    'top down view dark asphalt highway road texture pixel art seamless tileable',
  MINIGAME_OBSTACLE_ROCK:
    'pixel art large rock boulder obstacle isolated on solid black background no shadow flat icon top down view',
  MINIGAME_OBSTACLE_BARRIER:
    'pixel art orange traffic cone isolated on solid black background no shadow flat icon top down view',
  MINIGAME_FUEL:
    'pixel art red gas jerrycan isolated on solid black background no shadow flat icon top down view',

  // Minigame - Roadie
  MINIGAME_ROADIE_IDLE:
    'pixel art roadie character carrying heavy box isolated on solid black background no shadow top down view small sprite',
  MINIGAME_CAR_A:
    'pixel art red sedan car isolated on solid black background no shadow top down view small sprite',
  MINIGAME_CAR_B:
    'pixel art yellow sports car isolated on solid black background no shadow top down view small sprite',
  MINIGAME_CAR_C:
    'pixel art blue pickup truck isolated on solid black background no shadow top down view small sprite',
  MINIGAME_ITEM_AMP:
    'pixel art guitar amplifier isolated on solid black background no shadow flat icon small',
  MINIGAME_ITEM_DRUMS:
    'pixel art drum kit isolated on solid black background no shadow flat icon small',
  MINIGAME_ITEM_GUITAR:
    'pixel art guitar hard case isolated on solid black background no shadow flat icon small',
  MINIGAME_KABELSALAT_BG:
    'pixel art tangled audio cables on a stage floor, dark gritty aesthetic, moody lighting',

  // Items - Contraband
  ITEM_VOID_ENERGY:
    'pixel art black energy drink can glowing green liquid skull logo grunge icon',
  ITEM_RUSTY_STRINGS:
    'pixel art coiled rusty guitar strings with drops of blood grunge icon',
  ITEM_CURSED_PICK:
    'pixel art glowing purple guitar pick with a demonic face dark aura icon',
  ITEM_MYSTERY_PILLS:
    'pixel art dirty plastic pill bottle with glowing neon pills grunge icon',
  ITEM_BLOOD_PACT:
    'pixel art old parchment scroll contract signed in red blood dark ritual icon',
  ITEM_PHASE_METRONOME:
    'pixel art antique wooden metronome glowing with blue cosmic energy icon',
  ITEM_SHATTERED_EAR:
    'pixel art jagged crystal talisman shaped like a human ear dark magic icon',
  ITEM_AMPED_SYNTH:
    'pixel art cyberpunk synthesizer module glowing cables neon green icon',
  ITEM_GIG_PROGRAM:
    'pixel art crumpled tour schedule paper with coffee stains and pentagrams icon',
  ITEM_STICKY_PLECTRUM:
    'pixel art guitar pick covered in sticky green slime grunge icon',
  ITEM_NIGHT_VISION_GLASSES:
    'pixel art tactical night vision goggles glowing green lenses cyberpunk icon',
  ITEM_SONIC_RESONATOR:
    'pixel art ancient metallic tuning fork glowing with strange energy relic icon',
  ITEM_WEEKENDER_COFFEE:
    'pixel art dirty styrofoam coffee cup black sludge liquid grunge icon',
  ITEM_BLACKOUT_MASK:
    'pixel art black executioner hood mask blank eyes dark icon',
  ITEM_PHANTOM_STRINGS:
    'pixel art glowing ghostly blue guitar strings ethereal aura icon',
  ITEM_MERCH_MANIFEST:
    'pixel art clipboard with shady shipping manifest bloody fingerprint icon',
  ITEM_MOTIVATIONAL_GRAMOPHONE:
    'pixel art rusty antique gramophone emitting green ghost notes icon',
  ITEM_WARPED_TAPE:
    'pixel art melted twisted audio cassette tape dark magic icon',
  ITEM_GUTTER_AMULET:
    'pixel art dirty necklace made of bottle caps and rat bones grunge icon',
  ITEM_LUCKY_COIN:
    'pixel art tarnished silver coin with a skull engraved glowing edge icon',
  ITEM_RADIANT_PICK:
    'pixel art bright glowing golden guitar pick holy light icon',
  ITEM_FORGOTTEN_ROAD_MAP:
    'pixel art torn old road map with glowing red routes occult icon',
  ITEM_STICKY_LOGO_STICKER:
    'pixel art peeling band logo sticker toxic green grunge icon',
  ITEM_NEON_PATCH:
    'pixel art glowing neon punk jacket patch bright colors icon',
  ITEM_ABYSSAL_MICROPHONE:
    'pixel art vintage microphone made of black bone and glowing purple runes icon',
  ITEM_SILVER_TONGUE:
    'pixel art literal silver metallic tongue dripping black liquid dark icon',
  ITEM_BROKEN_COMPASS:
    'pixel art shattered compass with a wildly spinning needle glowing icon',

  // Social & Brand Deals
  SOCIAL_POST_VIRAL:
    'pixel art smartphone screen glowing toxic green fire trending viral icon',
  SOCIAL_POST_DRAMA:
    'pixel art cracked phone screen angry emoji notification drama icon',
  SOCIAL_POST_TECH:
    'pixel art cybernetic smartphone interface circuit board green glowing icon',
  SOCIAL_POST_MUSIC:
    'pixel art smartphone playing heavy metal music notes equalizer icon',
  SOCIAL_POST_WHOLESOME:
    'pixel art smartphone with heart icons peaceful green glow icon',
  SOCIAL_POST_COMMERCIAL:
    'pixel art smartphone screen displaying stack of euro bills money icon',
  SOCIAL_POST_LIFESTYLE:
    'pixel art polaroid photo of band on tour gritty lifestyle icon',
  BRAND_DEAL_EVIL:
    'pixel art glowing green toxic contract document dark corporate icon',
  BRAND_DEAL_CORPORATE:
    'pixel art sterile metallic briefcase full of money corporate deal icon',
  BRAND_DEAL_INDIE:
    'pixel art grunge cassette tape indie label contract document icon',
  BRAND_DEAL_SUSTAINABLE:
    'pixel art recycled paper contract with leaf stamp green icon',
  ZEALOTRY_CULT:
    'pixel art hooded cultist playing guitar toxic green fire dark ritual icon',
  GIG_SUCCESS:
    'pixel art roaring crowd heavy metal concert toxic green lights success',
  GIG_FAILURE:
    'pixel art empty stage broken instruments blood red lighting failure',

  // Merch Press Feature
  MERCH_PRESS_BG:
    'pixel art underground dark basement printing press toxic green paint grimy sweatshop aesthetic'
}
