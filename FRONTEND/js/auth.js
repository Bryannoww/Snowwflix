/**
 * Snowwflix – Real Firebase Authentication
 * Requires: firebase-app, firebase-auth, firebase-firestore already loaded
 * and window.auth / window.db from index.html init
 */

(function () {
  "use strict";

  // Wait until Firebase is ready
  function whenReady(cb) {
    if (window.firebase && window.auth) {
      cb();
    } else {
      setTimeout(() => whenReady(cb), 50);
    }
  }

  whenReady(initAuth);

  function initAuth() {
    const auth = window.auth;
    const db = window.db;

    // ---- DOM ----
    const modal = document.getElementById("account-modal");
    const authMsg = document.getElementById("auth-msg");
    const authHeading = document.getElementById("auth-heading");

    const step1 = document.getElementById("signup-step1");
    const step2 = document.getElementById("signup-step2");
    const loginForm = document.getElementById("login-form");

    const signinOpen = document.getElementById("signin-open");
    const signoutBtn = document.getElementById("signout-btn");
    const accountClose = document.getElementById("account-close");

    const menuAvatar = document.getElementById("menu-avatar");
    const menuName = document.getElementById("menu-display-name");
    const menuEmail = document.getElementById("menu-user-email");

    function setMsg(text, isError) {
      if (!authMsg) return;
      authMsg.textContent = text || "";
      authMsg.style.color = isError ? "#f85149" : "#3fb950";
    }

    function showStep(el) {
      [step1, step2, loginForm].forEach((f) => f && f.classList.add("hidden"));
      if (el) el.classList.remove("hidden");
    }

    function openModal() {
      if (modal) modal.classList.remove("hidden");
      setMsg("");
      showStep(loginForm);
      if (authHeading) authHeading.textContent = "Sign In";
    }

    function closeModal() {
      if (modal) modal.classList.add("hidden");
      setMsg("");
    }

    // ---- UI: logged in / out ----
    function setAvatars(url, letter) {
      const fallback = "https://placehold.co/60x60/1f6feb/ffffff?text=" + (letter || "G");
      const src = url || fallback;
      if (menuAvatar) menuAvatar.src = src;
      const navAv = document.getElementById("nav-avatar");
      if (navAv) navAv.src = src;
    }

    function setDisplayName(name) {
      if (menuName) menuName.textContent = name;
      const navUser = document.getElementById("nav-username");
      if (navUser) navUser.textContent = name;
    }

    function updateUI(user) {
      const uploadWrap = document.getElementById("avatar-upload-wrap");
      const navAuthLinks = document.getElementById("nav-auth-links");
      if (user) {
        if (signinOpen) signinOpen.classList.add("hidden");
        if (signoutBtn) signoutBtn.classList.remove("hidden");
        if (uploadWrap) uploadWrap.classList.remove("hidden");
        if (navAuthLinks) navAuthLinks.classList.add("hidden");
        const name = user.displayName || user.email?.split("@")[0] || "User";
        setDisplayName(name);
        if (menuEmail) menuEmail.textContent = user.email || "";
        const letter = name.charAt(0).toUpperCase();
        // Only user-uploaded photo (Account menu). Never auto-use Google/web photo.
        const localPic = localStorage.getItem("snowwflix_avatar_" + user.uid);
        setAvatars(localPic || null, letter);
        if (db) {
          db.collection("users").doc(user.uid).get().then((doc) => {
            if (doc.exists) {
              const d = doc.data();
              const n = d.username || [d.firstName, d.lastName].filter(Boolean).join(" ") || name;
              setDisplayName(n);
              // Only show stored photo if user uploaded one (saved as local or firestore after upload)
              const uploaded = localStorage.getItem("snowwflix_avatar_" + user.uid);
              if (uploaded) setAvatars(uploaded, n.charAt(0).toUpperCase());
              else setAvatars(null, n.charAt(0).toUpperCase());
            }
          }).catch(() => {});
        }
      } else {
        if (signinOpen) signinOpen.classList.remove("hidden");
        if (signoutBtn) signoutBtn.classList.add("hidden");
        if (uploadWrap) uploadWrap.classList.add("hidden");
        if (navAuthLinks) navAuthLinks.classList.remove("hidden");
        setDisplayName("Login");
        if (menuEmail) menuEmail.textContent = "";
        setAvatars(null, "L");
      }
    }

    // Profile picture upload (local + optional Firestore URL later)
    document.getElementById("avatar-upload")?.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      const user = auth.currentUser;
      if (!file || !user) return;
      if (file.size > 2 * 1024 * 1024) {
        alert("Please choose an image under 2 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        localStorage.setItem("snowwflix_avatar_" + user.uid, dataUrl);
        setAvatars(dataUrl, (user.displayName || "U").charAt(0));
        if (db) {
          db.collection("users").doc(user.uid).set({ photoURL: dataUrl }, { merge: true }).catch(() => {});
        }
      };
      reader.readAsDataURL(file);
    });

    // Auth state listener
    auth.onAuthStateChanged((user) => {
      window.currentUser = user || null;
      updateUI(user);
    });

    // ---- Modal open/close ----
    signinOpen?.addEventListener("click", openModal);
    accountClose?.addEventListener("click", closeModal);
    modal?.querySelector(".modal-backdrop")?.addEventListener("click", closeModal);

    // Top-left Login / Sign Up buttons (responsive to auth state)
    document.getElementById("nav-login-btn")?.addEventListener("click", () => {
      openModal();
      showStep(loginForm);
      if (authHeading) authHeading.textContent = "Sign In";
      setMsg("");
    });
    document.getElementById("nav-signup-btn")?.addEventListener("click", () => {
      openModal();
      showStep(step1);
      if (authHeading) authHeading.textContent = "Sign Up";
      setMsg("");
    });
    // Profile chip when logged out also opens login
    document.getElementById("profile-chip")?.addEventListener("click", () => {
      if (!window.currentUser) {
        openModal();
        showStep(loginForm);
        if (authHeading) authHeading.textContent = "Sign In";
      }
    });

    // ---- Step navigation ----
    document.getElementById("to-step2")?.addEventListener("click", () => {
      const email = document.getElementById("su-email")?.value?.trim();
      const first = document.getElementById("su-first")?.value?.trim();
      if (!first || !email) {
        setMsg("Please enter first name and email.", true);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setMsg("Please enter a valid email.", true);
        return;
      }
      setMsg("");
      showStep(step2);
      if (authHeading) authHeading.textContent = "Create account";
    });

    document.getElementById("back-to-step1")?.addEventListener("click", () => {
      showStep(step1);
      if (authHeading) authHeading.textContent = "Sign Up";
      setMsg("");
    });

    document.getElementById("switch-to-login")?.addEventListener("click", () => {
      showStep(loginForm);
      if (authHeading) authHeading.textContent = "Sign In";
      setMsg("");
    });

    document.getElementById("to-signup")?.addEventListener("click", () => {
      showStep(step1);
      if (authHeading) authHeading.textContent = "Sign Up";
      setMsg("");
    });

    // ---- Sign up (email/password) ----
    document.getElementById("signup-final")?.addEventListener("click", async () => {
      const firstName = document.getElementById("su-first")?.value?.trim() || "";
      const lastName = document.getElementById("su-last")?.value?.trim() || "";
      const email = document.getElementById("su-email")?.value?.trim() || "";
      const phone = document.getElementById("su-phone")?.value?.trim() || "";
      const username = document.getElementById("su-username")?.value?.trim() || "";
      const password = document.getElementById("su-password")?.value || "";

      if (!username || password.length < 8) {
        setMsg("Username required. Password must be at least 8 characters.", true);
        return;
      }
      if (!/[0-9]/.test(password) || !/[A-Za-z]/.test(password)) {
        setMsg("Password should include letters and numbers.", true);
        return;
      }

      setMsg("Creating account…");
      try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        const user = cred.user;
        const displayName = username || [firstName, lastName].filter(Boolean).join(" ") || email.split("@")[0];

        await user.updateProfile({ displayName });

        if (db) {
          await db.collection("users").doc(user.uid).set({
            uid: user.uid,
            email,
            firstName,
            lastName,
            username,
            phone,
            displayName,
            emailVerified: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            provider: "password"
          }, { merge: true });
        }

        // Email verification link (Firebase sends the code/link)
        try {
          await user.sendEmailVerification();
          setMsg("Account created! Check your email for a verification link.");
        } catch (verErr) {
          console.warn("Verification email failed:", verErr);
          setMsg("Account created! Welcome to Snowwflix.");
        }
        setTimeout(closeModal, 1400);
      } catch (err) {
        console.error(err);
        setMsg(friendlyError(err), true);
      }
    });

    // ---- Login ----
    document.getElementById("login-final")?.addEventListener("click", async () => {
      const email = document.getElementById("li-email")?.value?.trim() || "";
      const password = document.getElementById("li-password")?.value || "";

      if (!email || !password) {
        setMsg("Enter email and password.", true);
        return;
      }

      setMsg("Signing in…");
      try {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        const user = cred.user;
        if (db && user) {
          await db.collection("users").doc(user.uid).set({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            emailVerified: !!user.emailVerified
          }, { merge: true });
        }
        if (user && !user.emailVerified) {
          setMsg("Signed in. Please verify your email — we can resend the link.");
          try { await user.sendEmailVerification(); } catch (_) {}
        } else {
          setMsg("Signed in successfully.");
        }
        setTimeout(closeModal, 900);
      } catch (err) {
        console.error(err);
        setMsg(friendlyError(err), true);
      }
    });

    // ---- Google sign-in ----
    document.getElementById("google-signin")?.addEventListener("click", async () => {
      setMsg("Opening Google…");
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        if (db && user) {
          await db.collection("users").doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            provider: "google",
            emailVerified: !!user.emailVerified,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }

        setMsg("Signed in with Google.");
        setTimeout(closeModal, 700);
      } catch (err) {
        console.error(err);
        if (err.code === "auth/popup-closed-by-user") {
          setMsg("Google sign-in cancelled.", true);
        } else {
          setMsg(friendlyError(err), true);
        }
      }
    });

    // ---- Forgot password ----
    document.getElementById("forgot-password")?.addEventListener("click", async () => {
      const email = document.getElementById("li-email")?.value?.trim();
      if (!email) {
        setMsg("Enter your email above, then click Forgot password.", true);
        return;
      }
      try {
        await auth.sendPasswordResetEmail(email);
        setMsg("Password reset email sent. Check your inbox.");
      } catch (err) {
        setMsg(friendlyError(err), true);
      }
    });

    // ---- Sign out ----
    async function doSignOut() {
      try {
        await auth.signOut();
        setMsg("");
        closeModal();
      } catch (err) {
        console.error(err);
        alert("Could not sign out. Try again.");
      }
    }

    signoutBtn?.addEventListener("click", doSignOut);

    // Expose for Settings → Log Out
    window.snowwflixSignOut = doSignOut;

    // ---- Guest login nudge after ~1 minute ----
    const NUDGE_KEY = "snowwflix_nudge_dismissed";
    const nudgeEl = document.getElementById("login-nudge");
    let nudgeTimer = null;

    function hideNudge() {
      nudgeEl?.classList.add("hidden");
    }
    function showNudge() {
      if (!nudgeEl || window.currentUser) return;
      if (sessionStorage.getItem(NUDGE_KEY) === "1") return;
      nudgeEl.classList.remove("hidden");
    }
    function scheduleNudge() {
      clearTimeout(nudgeTimer);
      if (window.currentUser) {
        hideNudge();
        return;
      }
      nudgeTimer = setTimeout(showNudge, 60 * 1000);
    }
    scheduleNudge();
    auth.onAuthStateChanged((user) => {
      if (user) {
        hideNudge();
        clearTimeout(nudgeTimer);
        // Track presence
        if (db) {
          db.collection("users").doc(user.uid).set({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            email: user.email || null,
            displayName: user.displayName || null,
            emailVerified: !!user.emailVerified
          }, { merge: true }).catch(() => {});
        }
      } else {
        scheduleNudge();
      }
    });
    document.getElementById("login-nudge-close")?.addEventListener("click", () => {
      sessionStorage.setItem(NUDGE_KEY, "1");
      hideNudge();
    });
    document.getElementById("login-nudge-signup")?.addEventListener("click", () => {
      hideNudge();
      openModal();
      showStep(step1);
      if (authHeading) authHeading.textContent = "Sign Up";
    });
    document.getElementById("login-nudge-login")?.addEventListener("click", () => {
      hideNudge();
      openModal();
      showStep(loginForm);
      if (authHeading) authHeading.textContent = "Sign In";
    });

    function friendlyError(err) {
      const code = err?.code || "";
      const map = {
        "auth/email-already-in-use": "That email is already registered. Try logging in.",
        "auth/invalid-email": "Invalid email address.",
        "auth/weak-password": "Password is too weak. Use 8+ characters.",
        "auth/user-not-found": "No account found with that email.",
        "auth/wrong-password": "Wrong password. Try again or reset it.",
        "auth/invalid-credential": "Invalid email or password.",
        "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
        "auth/network-request-failed": "Network error. Check your connection.",
        "auth/operation-not-allowed": "This sign-in method is not enabled in Firebase Console.",
        "auth/popup-blocked": "Popup was blocked. Allow popups for this site.",
        "auth/unauthorized-domain": "This domain is not authorized in Firebase Console → Authentication → Settings."
      };
      return map[code] || err.message || "Something went wrong. Try again.";
    }
  }
})();
