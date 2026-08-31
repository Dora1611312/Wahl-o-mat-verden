// ========================================
// Daten aus externer JSON laden
// ========================================

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
// JSON laden – PFAD: data/landrat.json
// ========================================

fetch("./data/landrat.json")
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP-Fehler: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    })
    .then(json => {
        data = json;
        console.log("✅ Landrat-Wahl-O-Mat Daten geladen:", data);
        console.log(`📋 ${data.thesen.length} Thesen geladen.`);
    })
    .catch(error => {
        console.error("❌ Fehler beim Laden der JSON:", error);
        alert("Die Wahldaten konnten nicht geladen werden.\nBitte prüfe, ob die Datei 'data/landrat.json' existiert und gültig ist.");
    });

// ========================================
// Wahl-O-Mat starten
// ========================================

startButton.addEventListener("click", () => {
    if (!data) {
        alert("Die Wahldaten wurden noch nicht geladen. Bitte warte einen Moment und versuche es erneut.");
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

    const thema = data.themen.find(t => t.id === question.thema);
    themaLabel.textContent = thema ? `📌 ${thema.name}` : "";

    const progress = ((currentQuestion) / total) * 100;
    progressFill.style.width = progress + "%";
    progressText.textContent = `Frage ${currentQuestion + 1} von ${total}`;

    answerButtons.forEach(btn => btn.classList.remove("selected"));

    if (answers[currentQuestion] !== undefined) {
        answerButtons.forEach(btn => {
            if (Number(btn.dataset.answer) === answers[currentQuestion]) {
                btn.classList.add("selected");
            }
        });
    }

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

    const kandidaten = data.kandidaten;
    const thesen = data.thesen;

    const results = kandidaten.map(kandidat => {
        let matches = 0;
        let total = 0;

        thesen.forEach((thesis, index) => {
            const userAnswer = answers[index];
            if (userAnswer === undefined) return;

            const kandidatPos = thesis.positionen[kandidat.id];
            if (kandidatPos === null || kandidatPos === undefined) return;

            total++;
            const diff = Math.abs(userAnswer - kandidatPos);
            const match = 1 - (diff / 4);
            matches += match;
        });

        const percent = total > 0 ? Math.round((matches / total) * 100) : 0;
        return { ...kandidat, percent, matches, total };
    });

    results.sort((a, b) => b.percent - a.percent);

    resultsContainer.innerHTML = "";

    results.forEach((kandidat, index) => {
        const card = document.createElement("div");
        card.className = "result-card";
        if (index === 0 && kandidat.percent > 0) {
            card.classList.add("top");
        }

        const color = kandidat.farbe || "#1a5c8a";
        const percentClass = kandidat.percent >= 70 ? "result-percent high" : "result-percent";

        card.innerHTML = `
            <span class="result-party">
                ${kandidat.name}
                <span class="party-support">(${kandidat.unterstuetzt_von})</span>
            </span>
            <span class="${percentClass}">${kandidat.percent} %</span>
        `;

        card.style.borderLeftColor = color;
        resultsContainer.appendChild(card);
    });

    console.log("📊 Wahlergebnis (Landrat):", results);
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
// Tastatur-Support (1-5, Enter)
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

console.log("🗳️ Landrat-Wahl-O-Mat Verden 2026 geladen.");
