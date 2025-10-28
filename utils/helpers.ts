export const getProperty = (obj: any, keyName: string): any => {
  if (!obj || typeof obj !== 'object' || !keyName) return undefined;
  const keyToFind = keyName.toLowerCase();
  const foundKey = Object.keys(obj).find(k => k.trim().toLowerCase() === keyToFind);
  return foundKey ? obj[foundKey] : undefined;
};

export const getFlexibleProperty = (obj: any, keys: string[]): any => {
  if (!obj || typeof obj !== 'object' || !Array.isArray(keys)) return undefined;
  for (const key of keys) {
    const value = getProperty(obj, key);
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
};

export const formatDate = (dateValue: any): string => {
    if (dateValue === undefined || dateValue === null) return 'N/A';
    if (typeof dateValue === 'string') {
         if (!isNaN(dateValue as any) && !isNaN(parseFloat(dateValue))) {
             let date = new Date((parseFloat(dateValue) - 25569) * 86400 * 1000);
             date = new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
             if (isNaN(date.getTime())) return String(dateValue);
             return date.toLocaleDateString('es-ES',{ day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
         }
         return dateValue.toUpperCase();
    }
    let date;
    if (typeof dateValue === 'number') {
        date = new Date((dateValue - 25569) * 86400 * 1000);
        date = new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
    } else {
        date = new Date(dateValue);
    }
    if (!date || isNaN(date.getTime())) return String(dateValue).toUpperCase();
    return date.toLocaleDateString('es-ES',{ day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
};

// Store audio objects in a cache to avoid re-creating them.
const audioCache: { [key: string]: HTMLAudioElement } = {};

// URLs for the sounds, mapped by the ID we use to call them.
const SOUND_URLS = {
  'beep-success': 'https://github.com/google-gemini/cookbook/raw/main/examples/web/data/success.mp3',
  'beep-fail': 'https://github.com/google-gemini/cookbook/raw/main/examples/web/data/error.mp3',
};

/**
 * Plays a sound by creating (and caching) an Audio object programmatically.
 * This is more reliable than relying on <audio> tags in the HTML.
 * @param id The ID of the sound to play ('beep-success' or 'beep-fail').
 */
export const playSound = (id: 'beep-success' | 'beep-fail') => {
    let sound = audioCache[id];
    if (!sound) {
        const url = SOUND_URLS[id];
        if (!url) {
            console.error(`Sound URL not found for id: ${id}`);
            return;
        }
        sound = new Audio(url);
        audioCache[id] = sound;
    }

    sound.currentTime = 0;
    sound.play().catch(error => {
        // Log the error but don't crash the app. The sound is non-critical.
        console.error(`Error playing sound: ${id}`, error);
    });
};
