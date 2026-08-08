/**
 * Snowwbot – real AI movie assistant (Gemini + optional Google Search)
 */
(function () {
  const panel = document.getElementById("snowwbot-panel");
  const messages = document.getElementById("snowwbot-messages");
  const form = document.getElementById("snowwbot-form");
  const input = document.getElementById("snowwbot-input");
  const openBtn = document.getElementById("snowwbot-open");
  const closeBtn = document.getElementById("snowwbot-close");
  const suggestions = document.getElementById("snowwbot-suggestions");

  if (!panel || !messages || !form) return;

  const history = []; // { role: 'user'|'model', text: string }
  let greeted = false;

  function cfg() {
    return window.SNOWWBOT_CONFIG || {};
  }

  function hasKey() {
    return !!(cfg().geminiApiKey && cfg().geminiApiKey.trim());
  }

  function openBot() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    document.getElementById("side-menu")?.classList.remove("active");
    if (!greeted) {
      if (hasKey()) {
        addBot(
          "Hi! I'm **Snowwbot** ❄️ — your movie AI. Ask me **anything** about films, trailers, cast, plot, reviews, release dates, or what to watch. I can research across the web for you."
        );
      } else {
        addBot(
          "Hi! I'm **Snowwbot**. To unlock full AI answers (like ChatGPT for movies), add a free **Gemini API key** in `js/snowwbot-config.js`.\n\n1. Open [Google AI Studio](https://aistudio.google.com/apikey)\n2. Create an API key\n3. Paste it into `geminiApiKey`\n4. Refresh this page\n\nUntil then I can still help with Snowwflix navigation and trailer search."
        );
      }
      greeted = true;
    }
    setTimeout(() => input?.focus(), 200);
  }

  function closeBot() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  openBtn?.addEventListener("click", openBot);
  closeBtn?.addEventListener("click", closeBot);

  function addMsg(text, who) {
    const div = document.createElement("div");
    div.className = "snowwbot-msg " + who;
    const safe = String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    div.innerHTML = safe
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, "<br>");
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }
  function addBot(t) { addMsg(t, "bot"); }
  function addUser(t) { addMsg(t, "user"); }

  function typing(on) {
    document.getElementById("snowwbot-typing")?.remove();
    if (!on) return;
    const div = document.createElement("div");
    div.className = "snowwbot-msg bot typing";
    div.id = "snowwbot-typing";
    div.textContent = "Snowwbot is researching…";
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function triggerSearch(query) {
    const top = document.getElementById("top-search");
    if (top) top.value = query;
    if (typeof runTopSearch === "function") {
      runTopSearch();
      return true;
    }
    return false;
  }

  const SYSTEM = `You are Snowwbot, the AI assistant inside the Snowwflix movie trailer app.
You specialize in movies, TV, trailers, actors, directors, genres, reviews, box office, release dates, streaming availability, and recommendations.
Answer ANY movie or entertainment question thoroughly and helpfully, like a knowledgeable film expert and research assistant.
When useful, include year, director, main cast, short spoiler-free plot, and similar titles.
If the user wants to watch a trailer on Snowwflix, suggest they use the in-app search or say you can search the title for them.
Be concise but informative. Use markdown **bold** for titles. Do not claim you host full pirated films.
Snowwflix is a trailer discovery app founded by Brian Nyangate in Nairobi, Kenya.
If asked about non-movie topics, still answer helpfully but gently steer back to film when natural.`;

  async function askGemini(userText) {
    const key = cfg().geminiApiKey.trim();
    const model = cfg().model || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

    const contents = [];
    // include short history for multi-turn chat
    history.slice(-10).forEach((h) => {
      contents.push({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      });
    });
    contents.push({ role: "user", parts: [{ text: userText }] });

    const body = {
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.95
      }
    };

    // Google Search grounding (live web research) when enabled
    if (cfg().useGoogleSearch !== false) {
      body.tools = [{ google_search: {} }];
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message || res.statusText || "API error";
      // Retry without google_search if tool not supported
      if (/tool|google_search|invalid/i.test(msg) && body.tools) {
        delete body.tools;
        const res2 = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const data2 = await res2.json();
        if (!res2.ok) throw new Error(data2?.error?.message || "API error");
        return extractText(data2);
      }
      throw new Error(msg);
    }
    return extractText(data);
  }

  function extractText(data) {
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || "").join("").trim();
    if (!text) throw new Error("Empty response from the model. Try again.");
    // grounding metadata optional footnote
    const queries = data?.candidates?.[0]?.groundingMetadata?.webSearchQueries;
    if (queries && queries.length) {
      return text + "\n\n_Sources searched: " + queries.slice(0, 3).join(", ") + "_";
    }
    return text;
  }

  /** Local fallback if no API key */
  function localReply(userText) {
    const q = userText.toLowerCase();
    const searchMatch = q.match(/(?:search|find|trailer\s*(?:for)?|play)\s+(.+)/i);
    if (searchMatch) {
      const term = searchMatch[1].replace(/^(for|me|the|a)\s+/i, "").trim();
      triggerSearch(term);
      return `Searching Snowwflix for **${term}**. Add a Gemini API key in \`js/snowwbot-config.js\` for full AI research answers.`;
    }
    if (/thriller|horror|romance|drama|animation|trend/.test(q)) {
      const map = { thriller: "thriller", horror: "horror", romance: "romance", drama: "drama", animation: "animation", trend: "trending" };
      for (const k of Object.keys(map)) {
        if (q.includes(k)) {
          document.querySelector(`.cat-chip[data-cat="${map[k]}"]`)?.click();
          return `Opened **${map[k]}** on Snowwflix. For deep movie research (plot, cast, reviews), add your free Gemini API key.`;
        }
      }
    }
    return "Full AI mode needs a free **Gemini API key** in `js/snowwbot-config.js` (get one at https://aistudio.google.com/apikey). After that, ask me anything about any movie and I'll research it.";
  }

  async function handleUser(text) {
    addUser(text);
    typing(true);
    try {
      let answer;
      if (hasKey()) {
        answer = await askGemini(text);
        history.push({ role: "user", text });
        history.push({ role: "model", text: answer });
        // If user asked to search/play trailer, also trigger in-app search
        if (/\b(trailer|search|watch|play|find)\b/i.test(text)) {
          const titleGuess = text.replace(/^(search|find|play|watch|show|trailer for|trailer)\s+/i, "").trim();
          if (titleGuess.length > 1 && titleGuess.length < 80) triggerSearch(titleGuess);
        }
      } else {
        await new Promise((r) => setTimeout(r, 400));
        answer = localReply(text);
      }
      typing(false);
      addBot(answer);
    } catch (err) {
      typing(false);
      console.error(err);
      let msg = err.message || "Something went wrong.";
      if (/API_KEY|api key|403|401/i.test(msg)) {
        msg = "API key invalid or missing. Check `js/snowwbot-config.js` and create a key at https://aistudio.google.com/apikey";
      }
      if (/quota|429/i.test(msg)) {
        msg = "Rate limit hit. Wait a minute and try again (free Gemini tier has limits).";
      }
      addBot("⚠️ " + msg);
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = (input.value || "").trim();
    if (!text) return;
    input.value = "";
    handleUser(text);
  });

  suggestions?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-q]");
    if (!btn) return;
    handleUser(btn.getAttribute("data-q"));
  });
})();
