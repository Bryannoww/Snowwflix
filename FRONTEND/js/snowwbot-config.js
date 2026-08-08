/**
 * Snowwbot AI config
 * 1. Go to https://aistudio.google.com/apikey
 * 2. Create an API key (free Google AI Studio account)
 * 3. Paste it below between the quotes
 *
 * Never share this key publicly on a public GitHub repo.
 * For production, move the key to a backend/Cloud Function.
 */
window.SNOWWBOT_CONFIG = {
  // PASTE YOUR GEMINI API KEY HERE:
  geminiApiKey: "",

  // Model with strong quality + Google Search grounding support
  model: "gemini-2.0-flash",

  // Use Google Search so answers can reflect the live web
  useGoogleSearch: true
};
