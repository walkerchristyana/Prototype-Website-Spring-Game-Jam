/*
  app.js
  ------
  Main JavaScript for the Immersion Model prototype.

  Notes for future editing:
  1. IMMERSION_DATA comes from data.js.
  2. The site uses localStorage instead of a server, so it can run by opening index.html.
  3. The exportExcelLikeFile() function creates an Excel-readable .xls file.
     It is not a modern XLSX package, but Excel and Google Sheets can open/import it.
  4. All imported responses from the workbook are included in IMMERSION_DATA.responses.
*/

// Metric abbreviations used across the workbook and score matrix.
const METRIC_LABELS = {
  ID: "Interaction Density",
  AG: "Player Agency",
  NI: "Narrative Integration",
  FL: "Flow & Continuity",
  EN: "Environmental Immersion",
  ME: "Mechanical Satisfaction",
  EM: "Emotional Engagement",
  FR: "Fatigue Resistance",
  RI: "Replay Intent"
};

// Local storage key for rows added through the website form.
const LOCAL_KEY = "immersion_local_responses_v1";

// Store a small app state so filters and user-added rows are easy to update.
const state = {
  addedResponses: loadLocalResponses(),
  filters: { game: "All", player: "All", group: "All" }
};

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  hydrateCounts();
  renderCharts();
  renderMatrixTable();
  setupFilters();
  renderResponses();
  renderQuizQuestions();
  setupResponseForm();
  setupExports();
});

/* ------------------------------
   Basic UI navigation
--------------------------------*/
function setupTabs() {
  document.querySelectorAll(".tabs button").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(button.dataset.tab).classList.add("active");
    });
  });
}

/* ------------------------------
   Dataset counts
--------------------------------*/
function hydrateCounts() {
  const meta = IMMERSION_DATA.metadata.counts;
  byId("responseCount").textContent = meta.timelineResponses.toLocaleString();
  byId("playerCount").textContent = meta.players;
  byId("gameCount").textContent = meta.games;
  byId("timelineCount").textContent = meta.timelineResponses.toLocaleString();
  byId("quizCount").textContent = meta.exitQuizResponses;
}

/* ------------------------------
   Canvas chart helpers
   These are intentionally simple so the prototype has no external dependency.
--------------------------------*/
function drawScatter(canvasId, rows, xKey, yKey, title) {
  const canvas = byId(canvasId);
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const pad = 55;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0b0d1d";
  ctx.fillRect(0, 0, w, h);

  const xs = rows.map(r => Number(r[xKey]));
  const ys = rows.map(r => Number(r[yKey]));
  const minX = Math.min(...xs) - 5, maxX = Math.max(...xs) + 5;
  const minY = Math.min(...ys) - 5, maxY = Math.max(...ys) + 5;

  // axes
  ctx.strokeStyle = "rgba(255,255,255,.35)";
  ctx.beginPath();
  ctx.moveTo(pad, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.moveTo(pad, h - pad);
  ctx.lineTo(pad, pad);
  ctx.stroke();

  ctx.fillStyle = "#f7f4ff";
  ctx.font = "14px sans-serif";
  ctx.fillText(title, pad, 28);
  ctx.fillText(xKey, w / 2 - 80, h - 15);
  ctx.save();
  ctx.translate(18, h / 2 + 70);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yKey, 0, 0);
  ctx.restore();

  rows.forEach(row => {
    const x = map(Number(row[xKey]), minX, maxX, pad, w - pad);
    const y = map(Number(row[yKey]), minY, maxY, h - pad, pad);
    ctx.fillStyle = "#55d6be";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#bdb7d9";
    ctx.font = "10px sans-serif";
    ctx.fillText(row.Game, x + 7, y - 7);
  });
}

function drawBar(canvasId, rows, labelKey, valueKey, title, yLabel) {
  const canvas = byId(canvasId);
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const pad = 55;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0b0d1d";
  ctx.fillRect(0, 0, w, h);

  const values = rows.map(r => Number(r[valueKey]));
  const maxV = Math.max(...values) + 0.5;
  const barW = (w - pad * 2) / rows.length - 8;

  ctx.strokeStyle = "rgba(255,255,255,.35)";
  ctx.beginPath();
  ctx.moveTo(pad, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.moveTo(pad, h - pad);
  ctx.lineTo(pad, pad);
  ctx.stroke();

  ctx.fillStyle = "#f7f4ff";
  ctx.font = "14px sans-serif";
  ctx.fillText(title, pad, 28);
  ctx.save();
  ctx.translate(18, h / 2 + 50);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  rows.forEach((row, i) => {
    const x = pad + i * (barW + 8) + 5;
    const y = map(Number(row[valueKey]), 0, maxV, h - pad, pad);
    ctx.fillStyle = "#9b6dff";
    ctx.fillRect(x, y, barW, h - pad - y);
    ctx.fillStyle = "#bdb7d9";
    ctx.font = "9px sans-serif";
    ctx.save();
    ctx.translate(x + 4, h - 38);
    ctx.rotate(-Math.PI / 5);
    ctx.fillText(row[labelKey], 0, 0);
    ctx.restore();
  });
}

function renderCharts() {
  drawScatter(
    "replayChart",
    IMMERSION_DATA.gameSummaries,
    "Official Deck Score",
    "Replay Intent Index",
    "Higher immersion compared with return-to-play interest"
  );

  drawBar(
    "pulseChart",
    IMMERSION_DATA.responseStats,
    "Game",
    "Avg Pulse",
    "Average 5-minute immersion pulse by game",
    "Avg Pulse (1-5)"
  );
}

/* ------------------------------
   Matrix and response tables
--------------------------------*/
function renderMatrixTable() {
  const metrics = ["ID", "AG", "NI", "FL", "EN", "ME", "EM", "FR", "RI"];
  const rows = IMMERSION_DATA.games.map(game => {
    const row = { Game: game.Game };
    metrics.forEach(m => row[`${m} (${METRIC_LABELS[m]})`] = game[m]);
    row["Total Points"] = game["Total Points"];
    row["Calculated Immersion %"] = game["Calculated Immersion %"];
    row["Official Deck Score"] = game["Official Deck Score"];
    return row;
  });
  byId("matrixTable").innerHTML = makeTable(rows);
}

function setupFilters() {
  fillSelect(byId("gameFilter"), ["All", ...unique(IMMERSION_DATA.responses.map(r => r.Game))]);
  fillSelect(byId("playerFilter"), ["All", ...unique(IMMERSION_DATA.responses.map(r => r["Player Name"]))]);
  fillSelect(byId("groupFilter"), ["All", ...unique(IMMERSION_DATA.responses.map(r => r["Player Group"]))]);

  ["gameFilter", "playerFilter", "groupFilter"].forEach(id => {
    byId(id).addEventListener("change", e => {
      const key = id.replace("Filter", "");
      state.filters[key] = e.target.value;
      renderResponses();
    });
  });

  byId("clearFilters").addEventListener("click", () => {
    state.filters = { game: "All", player: "All", group: "All" };
    byId("gameFilter").value = "All";
    byId("playerFilter").value = "All";
    byId("groupFilter").value = "All";
    renderResponses();
  });
}

function getAllResponses() {
  return [...IMMERSION_DATA.responses, ...state.addedResponses];
}

function getFilteredResponses() {
  return getAllResponses().filter(row => {
    return (state.filters.game === "All" || row.Game === state.filters.game)
      && (state.filters.player === "All" || row["Player Name"] === state.filters.player)
      && (state.filters.group === "All" || row["Player Group"] === state.filters.group);
  });
}

function renderResponses() {
  const rows = getFilteredResponses();
  byId("responseSummary").textContent = `${rows.length.toLocaleString()} response rows shown.`;
  byId("responsesTable").innerHTML = makeTable(rows.slice(0, 250));
  if (rows.length > 250) {
    byId("responsesTable").innerHTML += `<p class="helper">Showing first 250 rows for speed. Export includes all filtered/unfiltered rows.</p>`;
  }
}

/* ------------------------------
   Exit quiz questions
--------------------------------*/
function renderQuizQuestions() {
  const container = byId("quizQuestions");
  container.innerHTML = IMMERSION_DATA.quizQuestions.map(q => {
    const choices = ["Choice A", "Choice B", "Choice C", "Choice D", "Choice E"]
      .map(key => `<li>${escapeHtml(q[key] ?? "")}</li>`).join("");
    return `
      <article class="question-card">
        <h3>${q["Question #"]}. ${escapeHtml(q.Question)}</h3>
        <p><strong>Category:</strong> ${escapeHtml(q.Category)} • <strong>Metric:</strong> ${escapeHtml(q["Metric Connection"])}</p>
        <ol>${choices}</ol>
      </article>
    `;
  }).join("");
}

/* ------------------------------
   Response form
--------------------------------*/
function setupResponseForm() {
  const form = byId("responseForm");
  fillSelect(form.elements.game, unique(IMMERSION_DATA.games.map(g => g.Game)));
  fillSelect(form.elements.primaryMetric, Object.keys(METRIC_LABELS));
  fillSelect(form.elements.secondaryMetric, Object.keys(METRIC_LABELS));

  form.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(form);
    const row = {
      "Response ID": `LOCAL-${Date.now()}`,
      "Player ID": "LOCAL",
      "Player Name": data.get("playerName"),
      "Player Group": data.get("playerGroup"),
      "Game": data.get("game"),
      "Minute Checkpoint": Number(data.get("minute")),
      "Immersion Pulse (1-5)": Number(data.get("pulse")),
      "Primary Metric": data.get("primaryMetric"),
      "Secondary Metric": data.get("secondaryMetric"),
      "Fatigue Flag": data.get("fatigue"),
      "Player Note": data.get("note"),
      "Response Status": "Local"
    };
    state.addedResponses.push(row);
    saveLocalResponses();
    form.reset();
    renderResponses();
    alert("Response saved locally. Use Export to download it.");
  });
}

/* ------------------------------
   Exports
--------------------------------*/
function setupExports() {
  byId("downloadXls").addEventListener("click", () => exportExcelLikeFile(getAllResponses(), "immersion_responses_export.xls"));
  byId("downloadCsv").addEventListener("click", () => downloadText(toCsv(getAllResponses()), "immersion_responses_export.csv", "text/csv"));
  byId("downloadJson").addEventListener("click", () => downloadText(JSON.stringify(getAllResponses(), null, 2), "immersion_responses_export.json", "application/json"));
  byId("clearLocal").addEventListener("click", () => {
    localStorage.removeItem(LOCAL_KEY);
    state.addedResponses = [];
    renderResponses();
    byId("exportStatus").textContent = "Local responses cleared. Imported workbook responses remain in the prototype.";
  });
}

function exportExcelLikeFile(rows, filename) {
  // Excel can open HTML tables saved with an .xls extension.
  // This is a simple export approach that works without external libraries.
  const tableHtml = makeTable(rows, true);
  const workbookHtml = `
    <html>
      <head><meta charset="UTF-8"></head>
      <body>
        <h1>Immersion Responses Export</h1>
        ${tableHtml}
      </body>
    </html>`;
  downloadText(workbookHtml, filename, "application/vnd.ms-excel");
  byId("exportStatus").textContent = `Downloaded ${rows.length.toLocaleString()} rows as ${filename}.`;
}

/* ------------------------------
   Utilities
--------------------------------*/
function makeTable(rows, plain = false) {
  if (!rows.length) return "<p>No rows found.</p>";
  const headers = Object.keys(rows[0]);
  const head = headers.map(h => `<th>${escapeHtml(h)}</th>`).join("");
  const body = rows.map(row => `<tr>${headers.map(h => `<td>${escapeHtml(row[h] ?? "")}</td>`).join("")}</tr>`).join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  rows.forEach(row => {
    lines.push(headers.map(h => csvEscape(row[h] ?? "")).join(","));
  });
  return lines.join("\n");
}

function csvEscape(value) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadText(text, filename, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function loadLocalResponses() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalResponses() {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state.addedResponses));
}

function fillSelect(select, values) {
  select.innerHTML = values.map(v => `<option>${escapeHtml(v)}</option>`).join("");
}

function unique(values) {
  return [...new Set(values)].filter(Boolean);
}

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function map(value, inMin, inMax, outMin, outMax) {
  return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
}
