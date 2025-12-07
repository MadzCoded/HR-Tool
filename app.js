// app.js

// --- DOM references ---
const sections = {
  horses: document.getElementById("page-horses"),
  breeding: document.getElementById("page-breeding"),
  finance: document.getElementById("page-finance"),
};

const navButtons = document.querySelectorAll(".nav-item");

// Horses
const horseForm = document.getElementById("horse-form");
const horseIdInput = document.getElementById("horse-id");
const horseNameInput = document.getElementById("horse-name");
const horseSexInput = document.getElementById("horse-sex");
const horseBreedInput = document.getElementById("horse-breed");
const horseLifeInput = document.getElementById("horse-life");
const horseGpInput = document.getElementById("horse-gp");
const horseRoleInput = document.getElementById("horse-role");
const horseImageInput = document.getElementById("horse-image");
const horseNotesInput = document.getElementById("horse-notes");
const horseListEl = document.getElementById("horse-list");
const horseCountEl = document.getElementById("horse-count");
const formTitleEl = document.getElementById("form-title");
const resetBtn = document.getElementById("reset-btn");
const searchInput = document.getElementById("search-input");

// Breeding placeholders
const breedingMareSelect = document.getElementById("breeding-mare");
const breedingStallionSelect = document.getElementById("breeding-stallion");

// Finance
const dpAmountInput = document.getElementById("dp-amount");
const hrcRateInput = document.getElementById("hrc-rate");
const financeResultEl = document.getElementById("finance-result");
const calcBtn = document.getElementById("calc-btn");

// --- STATE ---
const STORAGE_KEY = "hrtool_horses";
let horses = [];
let filteredHorses = [];

// --- NAVIGATION ---
function showPage(page) {
  Object.entries(sections).forEach(([key, el]) => {
    el.style.display = key === page ? "block" : "none";
  });

  navButtons.forEach((btn) => {
    const isActive = btn.getAttribute("data-page") === page;
    btn.classList.toggle("active", isActive);
  });
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const page = btn.getAttribute("data-page");
    showPage(page);
  });
});

// --- LOCAL STORAGE ---
function loadHorsesFromLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      horses = data;
    }
  } catch (e) {
    console.error("[HR Tool] Failed to parse horses from localStorage", e);
  }
}

function saveHorsesToLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(horses));
  } catch (e) {
    console.error("[HR Tool] Failed to save horses to localStorage", e);
  }
}

// --- UTIL ---
function createHorseFromForm() {
  return {
    id: horseIdInput.value || String(Date.now()),
    name: horseNameInput.value.trim(),
    sex: horseSexInput.value,
    breed: horseBreedInput.value.trim(),
    lifeNumber: horseLifeInput.value.trim(),
    gpOverall: horseGpInput.value ? Number(horseGpInput.value) : null,
    role: horseRoleInput.value,
    imageUrl: horseImageInput.value.trim(),
    notes: horseNotesInput.value.trim(),
    updatedAt: new Date().toISOString(),
  };
}

function resetForm() {
  horseIdInput.value = "";
  horseForm.reset();
  horseSexInput.value = "Mare";
  horseRoleInput.value = "";
  formTitleEl.textContent = "Add Horse";
}

// --- RENDERING ---
function renderHorses(list = horses) {
  horseListEl.innerHTML = "";

  if (!list.length) {
    const p = document.createElement("p");
    p.className = "empty-note";
    p.textContent = "No horses yet. Add some on the left.";
    horseListEl.appendChild(p);
    horseCountEl.textContent = "0 horses";
    updateBreedingDropdowns();
    return;
  }

  list.forEach((horse) => {
    const row = document.createElement("div");
    row.className = "horse-row";

    const img = document.createElement("img");
    img.className = "horse-avatar";
    img.src =
      horse.imageUrl ||
      "https://via.placeholder.com/80x80.png?text=HR"; // simple fallback
    img.alt = horse.name || "Horse";

    const main = document.createElement("div");
    main.className = "horse-main";

    const nameEl = document.createElement("div");
    nameEl.className = "horse-name";
    nameEl.textContent = horse.name || "Unnamed horse";

    const metaEl = document.createElement("div");
    metaEl.className = "horse-meta";

    const bits = [];
    if (horse.sex) bits.push(horse.sex);
    if (horse.breed) bits.push(horse.breed);
    if (horse.lifeNumber) bits.push(`#${horse.lifeNumber}`);
    if (horse.gpOverall != null && horse.gpOverall !== "") {
      bits.push(`GP ${horse.gpOverall}`);
    }

    metaEl.textContent = bits.join(" · ");

    const tagsEl = document.createElement("div");
    tagsEl.className = "horse-tags";

    if (horse.role) {
      const tag = document.createElement("span");
      tag.className = "tag-pill";
      if (horse.role === "Broodmare") tag.classList.add("role-broodmare");
      if (horse.role === "Stud") tag.classList.add("role-stud");
      if (horse.role === "Sales") tag.classList.add("role-sales");
      tag.textContent = horse.role;
      tagsEl.appendChild(tag);
    }

    if (horse.notes) {
      const tag = document.createElement("span");
      tag.className = "tag-pill";
      tag.textContent = "Notes";
      tagsEl.appendChild(tag);
    }

    main.appendChild(nameEl);
    main.appendChild(metaEl);
    if (tagsEl.children.length) {
      main.appendChild(tagsEl);
    }

    const actions = document.createElement("div");
    actions.className = "horse-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn subtle";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => loadHorseIntoForm(horse.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn subtle";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteHorse(horse.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    row.appendChild(img);
    row.appendChild(main);
    row.appendChild(actions);

    horseListEl.appendChild(row);
  });

  horseCountEl.textContent =
    list.length === 1 ? "1 horse" : `${list.length} horses`;

  updateBreedingDropdowns();
}

// --- FORM HANDLERS ---
function loadHorseIntoForm(id) {
  const horse = horses.find((h) => h.id === id);
  if (!horse) return;

  horseIdInput.value = horse.id;
  horseNameInput.value = horse.name || "";
  horseSexInput.value = horse.sex || "Mare";
  horseBreedInput.value = horse.breed || "";
  horseLifeInput.value = horse.lifeNumber || "";
  horseGpInput.value =
    horse.gpOverall != null && horse.gpOverall !== "" ? horse.gpOverall : "";
  horseRoleInput.value = horse.role || "";
  horseImageInput.value = horse.imageUrl || "";
  horseNotesInput.value = horse.notes || "";
  formTitleEl.textContent = "Edit Horse";
}

function deleteHorse(id) {
  if (!confirm("Delete this horse? This cannot be undone (in this browser).")) {
    return;
  }
  horses = horses.filter((h) => h.id !== id);
  saveHorsesToLocal();
  applySearchFilter();
}

// Handle add/update
horseForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const horse = createHorseFromForm();
  if (!horse.name) {
    alert("Name is required.");
    return;
  }

  const existingIndex = horses.findIndex((h) => h.id === horse.id);
  if (existingIndex !== -1) {
    horses[existingIndex] = horse;
  } else {
    horses.push(horse);
  }

  saveHorsesToLocal();
  resetForm();
  applySearchFilter();
});

resetBtn.addEventListener("click", (e) => {
  e.preventDefault();
  resetForm();
});

// --- SEARCH ---
function applySearchFilter() {
  const query = (searchInput.value || "").toLowerCase().trim();
  if (!query) {
    filteredHorses = horses;
  } else {
    filteredHorses = horses.filter((h) => {
      const haystack = [
        h.name,
        h.sex,
        h.breed,
        h.lifeNumber,
        h.role,
        String(h.gpOverall ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }
  renderHorses(filteredHorses);
}

searchInput.addEventListener("input", applySearchFilter);

// --- BREEDING DROPDOWNS ---
function updateBreedingDropdowns() {
  if (!breedingMareSelect || !breedingStallionSelect) return;

  breedingMareSelect.innerHTML = "";
  breedingStallionSelect.innerHTML = "";

  const marePlaceholder = document.createElement("option");
  marePlaceholder.value = "";
  marePlaceholder.textContent = "Select mare...";
  breedingMareSelect.appendChild(marePlaceholder);

  const stallionPlaceholder = document.createElement("option");
  stallionPlaceholder.value = "";
  stallionPlaceholder.textContent = "Select stallion...";
  breedingStallionSelect.appendChild(stallionPlaceholder);

  horses.forEach((horse) => {
    if (horse.sex === "Mare" || horse.sex === "Foal") {
      const opt = document.createElement("option");
      opt.value = horse.id;
      opt.textContent = horse.name || "Unnamed mare";
      breedingMareSelect.appendChild(opt);
    }
    if (horse.sex === "Stallion") {
      const opt = document.createElement("option");
      opt.value = horse.id;
      opt.textContent = horse.name || "Unnamed stallion";
      breedingStallionSelect.appendChild(opt);
    }
  });
}

// --- FINANCE ---
if (calcBtn) {
  calcBtn.addEventListener("click", () => {
    const dp = Number(dpAmountInput.value || "0");
    const rate = Number(hrcRateInput.value || "0");

    if (!dp || !rate) {
      financeResultEl.textContent =
        "Please enter both DP amount and HRC per DP.";
      return;
    }

    const totalHrc = dp * rate;
    financeResultEl.textContent = `${dp} DP × ${rate} HRC = ${totalHrc} HRC total.`;
  });
}

// --- INIT ---
loadHorsesFromLocal();
filteredHorses = horses;
showPage("horses");
renderHorses(filteredHorses);
resetForm();
