const skillGroups = {
  "Força": ["Atletismo","Corpo a Corpo","Vandalismo"],
  "Destreza": ["Furtividade","Acrobacia","Reflexos","Pilotagem","Roubo","Iniciativa","Manha"],
  "Influência": ["Persuasão","Intimidação","Negociação","Enganação","Diplomacia","Religião","Liderança"],
  "Percepção": ["Observação","Orientação","Intuição","Precisão","Busca"],
  "Sabedoria": ["Acadêmico","Medicina","Ciências","Engenharia","Tecnologia","Investigação"],
  "Metabolismo": ["Resistencia","Sobrevivência","Primeiros Socorros","Tolerância","Recuperação","Constituição"]
};

const skillsEl = document.getElementById("skills");

Object.entries(skillGroups).forEach(([group, skills]) => {
  const box = document.createElement("div");
  box.className = "skill-group";
  box.innerHTML = `<div class="skill-head">${group}</div>`;
  skills.forEach(skill => {
    const key = "skill_" + normalize(skill);
    const row = document.createElement("label");
    row.className = "skill";
    row.innerHTML = `<span>${skill}</span><input data-key="${key}" type="number" value="0">`;
    box.appendChild(row);
  });
  skillsEl.appendChild(box);
});

function normalize(text){
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g,"_");
}

const fields = () => [...document.querySelectorAll("[data-key]")];

function updateImmunity(){
  const genoma = Number(document.querySelector('[data-key="genoma"]')?.value) || 0;
  const metabolismo = Number(document.querySelector('[data-key="metabolismo"]')?.value) || 0;
  const immunity = document.querySelector('[data-key="imunidade"]');
  if (immunity) immunity.value = genoma + metabolismo;
}




function updateResourceDisplay(id, outputId){
  const input = document.getElementById(id);
  const output = document.getElementById(outputId);
  if (input && output) output.value = input.value;
}

function initResourceBars(){
  updateResourceDisplay("hidratacao", "hidratacaoValue");
  updateResourceDisplay("nutricao", "nutricaoValue");
  ["hidratacao","nutricao"].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.addEventListener("input", () => {
      updateResourceDisplay(id, id + "Value");
      document.getElementById("saveState").textContent = "ALTERAÇÕES NÃO SALVAS";
    });
  });
}

function collect(){
  updateImmunity();
  const data = {};
  fields().forEach(el => data[el.dataset.key] = el.value);
  return data;
}

function load(data){
  fields().forEach(el => {
    if (data[el.dataset.key] !== undefined) el.value = data[el.dataset.key];
  });
}

const STORAGE_KEY = "apex_ficha_v1";

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collect()));
  document.getElementById("saveState").textContent = "ARQUIVO SALVO • " + new Date().toLocaleTimeString("pt-BR");
}

document.getElementById("saveBtn").addEventListener("click", save);

document.getElementById("clearBtn").addEventListener("click", () => {
  if (!confirm("Apagar todos os dados desta ficha?")) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

const stored = localStorage.getItem(STORAGE_KEY);
if (stored) {
  try { load(JSON.parse(stored)); } catch(e) {}
}
updateImmunity();
initResourceBars();

fields().forEach(el => {
  el.addEventListener("input", () => {
    updateImmunity();
    document.getElementById("saveState").textContent = "ALTERAÇÕES NÃO SALVAS";
  });
});

window.addEventListener("beforeunload", () => {
  // Não salva automaticamente para que o botão SALVAR seja a ação explícita.
});


// ROLADOR DE DADOS A.P.E.X.
const diceTabBtn = document.getElementById("diceTabBtn");
const dicePanel = document.getElementById("dicePanel");
const closeDiceBtn = document.getElementById("closeDiceBtn");
const diceNumber = document.getElementById("diceNumber");
const diceLabel = document.getElementById("diceLabel");
const diceHistory = document.getElementById("diceHistory");
const diceGroups = document.getElementById("diceGroups");
const diceBreakdown = document.getElementById("diceBreakdown");
const addDiceGroupBtn = document.getElementById("addDiceGroup");
const rollCustomBtn = document.getElementById("rollCustomBtn");
const clearDiceBtn = document.getElementById("clearDiceBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const DICE_OPTIONS = [4, 8, 10, 12, 20];

function openDice(){
  dicePanel.classList.add("open");
  dicePanel.setAttribute("aria-hidden", "false");
}
function closeDice(){
  dicePanel.classList.remove("open");
  dicePanel.setAttribute("aria-hidden", "true");
}

diceTabBtn?.addEventListener("click", openDice);
closeDiceBtn?.addEventListener("click", closeDice);
dicePanel?.addEventListener("click", e => { if (e.target === dicePanel) closeDice(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeDice(); });

function rollDie(sides){
  return Math.floor(Math.random() * sides) + 1;
}

function addDiceGroup(quantity = 1, sides = 10){
  const row = document.createElement("div");
  row.className = "dice-group";
  row.innerHTML = `
    <input class="quantity" type="number" min="1" max="99" value="${quantity}" aria-label="Quantidade de dados">
    <select class="sides" aria-label="Tipo de dado">
      ${DICE_OPTIONS.map(n => `<option value="${n}" ${n === sides ? "selected" : ""}>D${n}</option>`).join("")}
    </select>
    <button class="remove-dice" type="button" title="Remover este dado">×</button>
  `;
  row.querySelector(".remove-dice").addEventListener("click", () => {
    row.remove();
    if (!diceGroups.children.length) addDiceGroup(1, 10);
  });
  diceGroups.appendChild(row);
  return row;
}

function clearCustomDice(){
  diceGroups.innerHTML = "";
  addDiceGroup(1, 10);
  diceNumber.textContent = "—";
  diceLabel.textContent = "Monte sua rolagem e clique em GIRAR TUDO.";
  diceBreakdown.innerHTML = "";
}

function getCustomGroups(){
  return [...diceGroups.querySelectorAll(".dice-group")].map(row => ({
    quantity: Math.max(1, Math.min(99, Number(row.querySelector(".quantity").value) || 1)),
    sides: Number(row.querySelector(".sides").value)
  }));
}

function rollGroups(groups){
  const allResults = [];
  let total = 0;
  groups.forEach(group => {
    const results = [];
    for(let i = 0; i < group.quantity; i++){
      const value = rollDie(group.sides);
      results.push(value);
      allResults.push({sides: group.sides, value});
      total += value;
    }
    group.results = results;
  });
  return {total, allResults};
}

function formulaFromGroups(groups){
  return groups.map(g => `${g.quantity}d${g.sides}`).join(" + ");
}

function showRoll(total, formula, allResults){
  diceNumber.textContent = total;
  diceLabel.textContent = `${formula} • ${allResults.length} dado(s) rolado(s)`;
  diceBreakdown.innerHTML = allResults.map((r, i) => `<span>D${r.sides} #${i + 1}: ${r.value}</span>`).join("");
  const item = document.createElement("span");
  item.textContent = `${formula} = ${total}`;
  diceHistory.prepend(item);
  while (diceHistory.children.length > 12) diceHistory.lastElementChild.remove();
}

function rollCustom(){
  const groups = getCustomGroups();
  const rolled = rollGroups(groups);
  showRoll(rolled.total, formulaFromGroups(groups), rolled.allResults);
  rollCustomBtn.classList.remove("rolling");
  void rollCustomBtn.offsetWidth;
  rollCustomBtn.classList.add("rolling");
}

function loadFormula(formula){
  const groups = formula.toLowerCase().replace(/\s+/g, "").split("+").map(part => {
    const match = part.match(/^(\d*)d(4|8|10|12|20)$/);
    if (!match) return null;
    return {quantity: Math.max(1, Number(match[1] || 1)), sides: Number(match[2])};
  }).filter(Boolean);
  if (!groups.length) return;
  diceGroups.innerHTML = "";
  groups.forEach(g => addDiceGroup(g.quantity, g.sides));
  rollCustom();
}

// Rolagens rápidas: D4, D8, D10, D12 e D20 continuam disponíveis.
document.querySelectorAll(".die-card").forEach(button => {
  button.addEventListener("click", () => {
    const sides = Number(button.dataset.sides);
    const result = rollDie(sides);
    diceNumber.textContent = result;
    diceLabel.textContent = `1D${sides} • resultado da rolagem`;
    diceBreakdown.innerHTML = `<span>D${sides}: ${result}</span>`;
    button.classList.remove("rolling");
    void button.offsetWidth;
    button.classList.add("rolling");

    const item = document.createElement("span");
    item.textContent = `1D${sides} = ${result}`;
    diceHistory.prepend(item);
    while (diceHistory.children.length > 12) diceHistory.lastElementChild.remove();
  });
});

addDiceGroupBtn?.addEventListener("click", () => addDiceGroup(1, 10));
rollCustomBtn?.addEventListener("click", rollCustom);
clearDiceBtn?.addEventListener("click", clearCustomDice);
clearHistoryBtn?.addEventListener("click", () => { diceHistory.innerHTML = ""; });
document.querySelectorAll(".quick-roll").forEach(button => {
  button.addEventListener("click", () => loadFormula(button.dataset.formula));
});

addDiceGroup(1, 10);
