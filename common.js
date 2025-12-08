// common.js

// 1. Supabase Initialisering
const SUPABASE_URL = "https://mqkoeaswvafrhyyotpqh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xa29lYXN3dmFmcmh5eW90cHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODMzMDAsImV4cCI6MjA4MDE1OTMwMH0.wQAcQFlUp77_46ycqfB--ywEN7uL5hRK0TdAy2PWkQs";

let supa = null;
if (window.supabase) {
    const { createClient } = supabase;
    supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error("Supabase-biblioteket ble ikke lastet.");
}

// STANDARD PRISER
const PRICE_ADULT = 200.00;
const PRICE_JUNIOR = 100.00;

/**
 * 2. Beregner medlemsdetaljer basert på fødselsdato og sesong.
 * Sesongen regnes fra 1. november (år Y-1) til 31. mars (år Y).
 * Hvis brukeren fyller 18 år i løpet av denne perioden, beholdes barnepris.
 * @param {string} birthdate - Fødselsdato i formatet 'YYYY-MM-DD'.
 * @param {Date} currentDate - Dagens dato.
 * @returns {{price: number, isJunior: boolean, age: number, ageInfo: string}}
 */
function calculateMembershipDetails(birthdate, currentDate = new Date()) {
    if (!birthdate) {
        return { price: PRICE_ADULT, isJunior: false, age: null, ageInfo: "Ukjent alder. Ordinær pris." };
    }

    const birth = new Date(birthdate);
    const currentYear = currentDate.getFullYear();
    
    const yearTurning18 = birth.getFullYear() + 18;
    
    // Beregn faktisk alder NÅ
    let age = currentYear - birth.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11
    
    // Juster alder hvis bursdagen ikke har vært ennå i år
    if (currentMonth < birth.getMonth() || (currentMonth === birth.getMonth() && currentDate.getDate() < birth.getDate())) {
        age--;
    }
    
    let isJunior = false;
    let ageInfo = "";

    // Hvis personen er 17 år NÅ (eller yngre), skal de ha Juniorpris
    if (age < 18) {
        isJunior = true;
        ageInfo = `Juniorpris (${PRICE_JUNIOR} kr). Du er ${age} år.`;
    } 
    // SPESIALREGEL: Fyller 18 i det aktuelle kalenderåret.
    else if (age === 18 && yearTurning18 === currentYear) {
        // Definisjon: Barnepris gjelder til OG MED den sesongen personen fyller 18.
        isJunior = true;
        ageInfo = `Juniorpris (${PRICE_JUNIOR} kr). Du fyller 18 år i ${currentYear}.`;

    } else { 
        // age > 18 eller age=18 men fylte 18 i et tidligere år (eller tidligere i år, men har fylt 18)
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


// 3. Logg ut funksjon
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
 * Kalles på alle sider som har passordfelt.
 */
function initPasswordToggles() {
    document.querySelectorAll(".password-toggle").forEach((btn) => {
        const targetId = btn.getAttribute("data-target");
        const input = document.getElementById(targetId);
        
        // Sjekk om input-feltet finnes før vi legger til event lytter
        if (!input) return;

        const img = btn.querySelector("img");

        // Fjerner eventuelt eksisterende lyttere for å unngå duplikater
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener("click", () => {
            const isCurrentlyPassword = input.type === "password";
            input.type = isCurrentlyPassword ? "text" : "password";
            
            if (img) {
                img.src = isCurrentlyPassword ? "images/eye-close.png" : "images/eye-open.png";
                img.alt = isCurrentlyPassword ? "Skjul passord" : "Vis passord";
            }
        });
        
        // Initial tilstand
        const isPassword = input.type === "password";
        if (img) {
            img.src = isPassword ? "images/eye-open.png" : "images/eye-close.png";
            img.alt = isPassword ? "Vis passord" : "Skjul passord";
        }
    });
}


// 5. Dropdown funksjonalitet
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
        if (dropdown && !dropdown.contains(e.target) && !toggle?.contains(e.target)) {
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

// 6. Oppdater navigasjon basert på innloggingsstatus
async function updateNavigation() {
    const authLinks = document.querySelectorAll(".auth-link");
    const profileLinks = document.querySelectorAll(".profile-link");
    
    if (!supa) {
        authLinks.forEach(link => link.style.display = 'block');
        profileLinks.forEach(link => link.style.display = 'none');
        initDropdown();
        return;
    }

    const { data: { session } } = await supa.auth.getSession();

    if (session) {
        authLinks.forEach(link => link.style.display = 'none');
        profileLinks.forEach(link => link.style.display = 'block');
    } else {
        authLinks.forEach(link => link.style.display = 'block');
        profileLinks.forEach(link => link.style.display = 'none');
    }

    initDropdown();
    // initPasswordToggles kalles nå direkte i DOMContentLoaded
}

// Start logikken ved lasting
document.addEventListener('DOMContentLoaded', () => {
    // VIKTIG FIKS: Kjør initPasswordToggles tidlig, uavhengig av Supabase-tilstand
    initPasswordToggles(); 
    
    updateNavigation();
    if (supa) {
        supa.auth.onAuthStateChange(() => {
            updateNavigation();
        });
    }
}); 