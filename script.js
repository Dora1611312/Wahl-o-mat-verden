let data = null;
let currentQuestion = 0;
let answers = [];

const start = document.getElementById("start");
const quiz = document.getElementById("quiz");
const result = document.getElementById("result");

const startButton = document.getElementById("startButton");
const nextButton = document.getElementById("nextButton");
const restartButton = document.getElementById("restartButton");

const thesis = document.getElementById("thesis");
const themaLabel = document.getElementById("themaLabel");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const answerButtons = document.querySelectorAll("#answers button");
const resultsContainer = document.getElementById("results");

// ========================================
// JSON laden
// ========================================

fetch("./data/Wahlomat.json")
    .then(response => {
        if (!response.ok) {
            throw new Error("Wahlomat.json konnte nicht geladen werden.");
        }
        return response.json();
    })
    .then(json => {
        data = json;
        console.log("✅ Wahl-O-Mat Daten geladen:", data);
        console.log(`📋 ${data.thesen.length} Thesen geladen.`);
    })
    .catch(error => {
        console.error("❌ Fehler:", error);
        alert("Die Wahldaten konnten nicht geladen werden. Bitte prüfe die Datei 'data/Wahlomat.json'.");
    });

// ========================================
// Wahl-O-Mat starten
// ========================================

startButton.addEventListener("click", () => {
    if (!data) {
        alert("Die Wahldaten werden noch geladen. Bitte warte einen Moment.");
        return;
    }

    if (data.thesen.length === 0) {
        alert("Es sind noch keine Thesen vorhanden.");
        return;
    }

    currentQuestion = 0;
    answers = [];

    start.hidden = true;
    quiz.hidden = false;
    result.hidden = true;

    showQuestion();
});

// ========================================
// These anzeigen
// ========================================

function showQuestion() {
    const question = data.thesen[currentQuestion];
    const total = data.thesen.length;

    thesis.textContent = question.these;

    // Thema anzeigen
    const thema = data.themen.find(t => t.id === question.thema);
    themaLabel.textContent = thema ? `📌 ${thema.name}` : "";

    // Fortschritt
    const progress = ((currentQuestion) / total) * 100;
    progressFill.style.width = progress + "%";
    progressText.textContent = `Frage ${currentQuestion + 1} von ${total}`;

    // Auswahl zurücksetzen
    answerButtons.forEach(btn => {
        btn.classList.remove("selected");
    });

    // Wenn schon beantwortet, vorauswählen
    if (answers[currentQuestion] !== undefined) {
        answerButtons.forEach(btn => {
            if (Number(btn.dataset.answer) === answers[currentQuestion]) {
                btn.classList.add("selected");
            }
        });
    }

    // Letzte Frage → Button-Text ändern
    if (currentQuestion === total - 1) {
        nextButton.textContent = "🏁 Ergebnis anzeigen";
    } else {
        nextButton.textContent = "Weiter →";
    }
}

// ========================================
// Antwort auswählen
// ========================================

answerButtons.forEach(button => {
    button.addEventListener("click", () => {
        const value = Number(button.dataset.answer);
        answers[currentQuestion] = value;

        answerButtons.forEach(btn => btn.classList.remove("selected"));
        button.classList.add("selected");
    });
});

// ========================================
// Weiter / Ergebnis
// ========================================

nextButton.addEventListener("click", () => {
    if (answers[currentQuestion] === undefined) {
        alert("Bitte wähle zuerst eine Antwort.");
        return;
    }

    currentQuestion++;

    if (currentQuestion >= data.thesen.length) {
        showResults();
    } else {
        showQuestion();
    }
});

// ========================================
// Ergebnisse berechnen & anzeigen
// ========================================

function showResults() {
    quiz.hidden = true;
    result.hidden = false;

    const parties = data.stadtratswahl.parteien;
    const theses = data.thesen;

    // Für jede Partei die Übereinstimmung berechnen
    const results = parties.map(party => {
        let matches = 0;
        let total = 0;

        theses.forEach((thesis, index) => {
            const userAnswer = answers[index];
            if (userAnswer === undefined) return;

            const partyPosition = thesis.positionen[party.id];
            if (partyPosition === null || partyPosition === undefined) return;

            total++;
            // Je näher die Antwort an der Parteiposition, desto höher die Übereinstimmung
            // 1-5 Skala: 5 = stimme zu, 1 = stimme nicht zu
            const diff = Math.abs(userAnswer - partyPosition);
            // 0 = perfekt, 4 = maximaler Unterschied
            const match = 1 - (diff / 4);
            matches += match;
        });

        const percent = total > 0 ? Math.round((matches / total) * 100) : 0;
        return { ...party, percent, matches, total };
    });

    // Sortieren (absteigend)
    results.sort((a, b) => b.percent - a.percent);

    // Anzeigen
    resultsContainer.innerHTML = "";

    results.forEach((party, index) => {
        const card = document.createElement("div");
        card.className = "result-card";
        if (index === 0 && party.percent > 0) {
            card.classList.add("top");
        }

        // Farbe aus der JSON (falls vorhanden) oder Standard
        const color = party.farbe || "#1a5c8a";

        const percentClass = party.percent >= 70 ? "result-percent high" : "result-percent";

        card.innerHTML = `
            <span class="result-party">${party.kurzname || party.name}</span>
            <span class="${percentClass}">${party.percent} %</span>
        `;

        card.style.borderLeftColor = color;
        resultsContainer.appendChild(card);
    });

    // Debug: In Konsole ausgeben
    console.log("📊 Wahlergebnis:", results);
}

// ========================================
// Neustart
// ========================================

restartButton.addEventListener("click", () => {
    currentQuestion = 0;
    answers = [];

    result.hidden = true;
    quiz.hidden = true;
    start.hidden = false;

    progressFill.style.width = "0%";
});

// ========================================
// Tastatur-Support
// ========================================

document.addEventListener("keydown", (e) => {
    if (e.key >= "1" && e.key <= "5") {
        const index = parseInt(e.key) - 1;
        if (answerButtons[index]) {
            answerButtons[index].click();
        }
    } else if (e.key === "Enter" && !quiz.hidden) {
        e.preventDefault();
        nextButton.click();
    }
});

console.log("🗳️ Verden Wahl-O-Mat 2026 geladen.");