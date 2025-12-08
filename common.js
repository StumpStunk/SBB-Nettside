// common.js (Siste Fiks for Toggle og standard funksjoner)

// 1. Supabase Initialisering
const SUPABASE_URL = "https://mqkoeaswvafrhyyotpqh.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xa29lYXN3dmFmcmh5eW90cHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODMzMDAsImV4cCI6MjA4MDE1OTMwMH0.wQAcQFlUp77_46ycqfB--ywEN7uL5hRK0TdAy2PWkQs";

let supa = null;
if (window.supabase) {
  const { createClient } = supabase;
  supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.error("Supabase-biblioteket ble ikke lastet.");
}

// STANDARD PRISER
const PRICE_ADULT = 200.0;
const PRICE_JUNIOR = 100.0;

function calculateMembershipDetails(birthdate, currentDate = new Date()) {
  if (!birthdate) {
    return {
      price: PRICE_ADULT,
      isJunior: false,
      age: null,
      ageInfo: "Ukjent alder. Ordinær pris.",
    };
  }

  const birth = new Date(birthdate);
  const currentYear = currentDate.getFullYear();
  const yearTurning18 = birth.getFullYear() + 18;

  let age = currentYear - birth.getFullYear();
  const currentMonth = currentDate.getMonth();

  if (
    currentMonth < birth.getMonth() ||
    (currentMonth === birth.getMonth() &&
      currentDate.getDate() < birth.getDate())
  ) {
    age--;
  }

  let isJunior = false;
  let ageInfo = "";

  if (age < 18) {
    isJunior = true;
    ageInfo = `Juniorpris (${PRICE_JUNIOR} kr). Du er ${age} år.`;
  } else if (age === 18 && yearTurning18 === currentYear) {
    isJunior = true;
    ageInfo = `Juniorpris (${PRICE_JUNIOR} kr). Du fyller 18 år i ${currentYear}.`;
  } else {
    isJunior = false;
    ageInfo = `Voksenpris (${PRICE_ADULT} kr). Du er ${age} år.`;
  }

  return {
    price: isJunior ? PRICE_JUNIOR : PRICE_ADULT,
    isJunior,
    age,
    ageInfo: ageInfo,
  };
}

async function logoutUser() {
  if (!supa) {
    window.location.href = "index.html";
    return;
  }
  const { error } = await supa.auth.signOut();
  if (!error) {
    window.location.href = "index.html";
  } else {
    console.error("Feil ved utlogging:", error.message);
  }
}

/**
 * 4. Viser/skjuler passordfelt og oppdaterer øyeikonet.
 * Denne versjonen sikrer at lytteren er unik.
 */
function initPasswordToggles() {
  document.querySelectorAll(".password-toggle").forEach((btn) => {
    const targetId = btn.getAttribute("data-target");
    const input = document.getElementById(targetId);

    if (!input) return;

    const img = btn.querySelector("img");
    if (!img) return;

    // Fjerner eventuelle gamle lyttere for å unngå duplikat-kall
    const oldToggleHandler = btn.getAttribute("data-toggle-handler");
    if (oldToggleHandler) {
      btn.removeEventListener("click", window[oldToggleHandler]);
    }

    // Definer funksjonen som bytter tilstand
    const toggleHandler = (e) => {
      e.preventDefault(); // Forhindrer at knappen sender skjemaet hvis den er inne i et form
      const isCurrentlyPassword = input.type === "password";

      // Bytt input-type
      input.type = isCurrentlyPassword ? "text" : "password";

      // Bytt bildekilde og alt-tekst
      if (isCurrentlyPassword) {
        // Viser passord -> vis lukket øye-ikon
        img.src = "images/eye-close.png";
        img.alt = "Skjul passord";
      } else {
        // Skjuler passord -> vis åpent øye-ikon
        img.src = "images/eye-open.png";
        img.alt = "Vis passord";
      }
    };

    // Legger til lytteren
    btn.addEventListener("click", toggleHandler);

    // Setter initial tilstand for ikonet
    const isPassword = input.type === "password";
    if (isPassword) {
      img.src = "images/eye-open.png";
      img.alt = "Vis passord";
    } else {
      img.src = "images/eye-close.png";
      img.alt = "Skjul passord";
    }
  });
}

function initDropdown() {
  const dropdown = document.getElementById("settings-dropdown");
  const toggle = document.getElementById("settings-toggle");
  const logoutLink = document.getElementById("logout-link");

  if (toggle) {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      dropdown?.classList.toggle("active");
    });
  }

  document.addEventListener("click", (e) => {
    if (
      dropdown &&
      !dropdown.contains(e.target) &&
      !toggle?.contains(e.target)
    ) {
      dropdown.classList.remove("active");
    }
  });

  if (logoutLink) {
    logoutLink.addEventListener("click", async (e) => {
      e.preventDefault();
      await logoutUser();
    });
  }
}

async function updateNavigation() {
  const authLinks = document.querySelectorAll(".auth-link");
  const profileLinks = document.querySelectorAll(".profile-link");

  if (!supa) {
    authLinks.forEach((link) => (link.style.display = "block"));
    profileLinks.forEach((link) => (link.style.display = "none"));
    initDropdown();
    return;
  }

  const {
    data: { session },
  } = await supa.auth.getSession();

  if (session) {
    authLinks.forEach((link) => (link.style.display = "none"));
    profileLinks.forEach((link) => (link.style.display = "block"));
  } else {
    authLinks.forEach((link) => (link.style.display = "block"));
    profileLinks.forEach((link) => (link.style.display = "none"));
  }

  initDropdown();
}

document.addEventListener("DOMContentLoaded", () => {
  initPasswordToggles();

  updateNavigation();
  if (supa) {
    supa.auth.onAuthStateChange(() => {
      updateNavigation();
    });
  }
});
