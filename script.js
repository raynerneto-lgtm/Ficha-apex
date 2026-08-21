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

const STORAGE_KEY = "apex_fichas_v2";
const OLD_STORAGE_KEY = "apex_ficha_v1";
let sheets = {};
let currentSheetId = "ficha_1";

function makeSheetId(){
  return "ficha_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}
function getSheetName(id){ return sheets[id]?.name || "Ficha"; }
function saveSheets(){ localStorage.setItem(STORAGE_KEY, JSON.stringify({currentSheetId, sheets})); }
function saveCurrentSheet(){ sheets[currentSheetId] = {name:getSheetName(currentSheetId), data:collect()}; }

function renderSheetSelect(){
  const select=document.getElementById("sheetSelect");
  if(!select) return;
  select.innerHTML="";
  Object.entries(sheets).forEach(([id,sheet])=>{
    const option=document.createElement("option");
    option.value=id; option.textContent=sheet.name||"Ficha";
    select.appendChild(option);
  });
  select.value=currentSheetId;
}

function save(){
  saveCurrentSheet(); saveSheets();
  document.getElementById("saveState").textContent="ARQUIVO SALVO • "+new Date().toLocaleTimeString("pt-BR");
}

function loadSheet(id){
  if(!sheets[id]) return;
  currentSheetId=id;
  load(sheets[id].data||{});
  updateImmunity(); initResourceBars();
  try{ bonds=JSON.parse(document.getElementById("vinculosData").value||"[]")||[]; }catch(e){bonds=[];}
  renderBonds();
  try{ inventoryItems=JSON.parse(document.getElementById("inventarioData").value||"[]")||[]; }catch(e){inventoryItems=[];}
  renderInventory();
  renderSheetSelect();
  document.getElementById("saveState").textContent="FICHA CARREGADA • "+getSheetName(id);
}

function resetForNewSheet(){
  fields().forEach(el=>{
    const key=el.dataset.key;
    if(["nome","jogador","profissao","proposito","idade","saude","traumas","talentos","mutacoes","efeitos"].includes(key)) el.value="";
    else if(key==="hp") el.value="20";
    else if(key==="sanidade") el.value="12";
    else if(key==="folego") el.value="25";
    else if(key==="temperatura") el.value="36.5";
    else if(key==="hidratacao"||key==="nutricao") el.value="10";
    else if(["coragem","sorte","razao","desejo"].includes(key)) el.value="1";
    else if(key==="inventario_limite") el.value="10";
    else if(key==="imunidade"||key==="dna"||key==="eg"||key==="skill_geral"||key==="limite_corporal_turno") el.value="0";
    else if(el.type==="number") el.value="0";
    else el.value="";
  });
  bonds=[]; inventoryItems=[];
  document.getElementById("vinculosData").value="[]";
  document.getElementById("inventarioData").value="[]";
  renderBonds(); renderInventory(); updateImmunity(); initResourceBars();
}

function createSheet(){
  saveCurrentSheet();
  const proposed=prompt("Nome da nova ficha:","Ficha "+(Object.keys(sheets).length+1));
  if(proposed===null) return;
  const name=proposed.trim()||("Ficha "+(Object.keys(sheets).length+1));
  const id=makeSheetId();
  sheets[id]={name,data:{}};
  currentSheetId=id;
  resetForNewSheet();
  saveCurrentSheet(); saveSheets(); renderSheetSelect();
  document.getElementById("saveState").textContent="NOVA FICHA CRIADA";
}

function initSheets(){
  try{
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(parsed?.sheets && Object.keys(parsed.sheets).length){
      sheets=parsed.sheets; currentSheetId=parsed.currentSheetId||Object.keys(sheets)[0];
    }else throw new Error();
  }catch(e){
    let oldData={};
    try{ oldData=JSON.parse(localStorage.getItem(OLD_STORAGE_KEY)||"{}"); }catch(err){}
    sheets={"ficha_1":{name:"Ficha 1",data:oldData}};
    currentSheetId="ficha_1";
    saveSheets();
  }
  renderSheetSelect(); loadSheet(currentSheetId);
}

document.getElementById("saveBtn").addEventListener("click",save);
document.getElementById("sheetAddBtn")?.addEventListener("click",createSheet);
document.getElementById("sheetSelect")?.addEventListener("change",e=>{
  saveCurrentSheet(); saveSheets(); loadSheet(e.target.value);
});
document.getElementById("clearBtn").addEventListener("click",()=>{
  if(!confirm("Apagar todos os dados desta ficha?")) return;
  sheets[currentSheetId]={name:getSheetName(currentSheetId),data:{}};
  saveSheets(); location.reload();
});

updateImmunity(); initResourceBars(); initSheets();

// VÍNCULOS
const bondsList = document.getElementById("bondsList");
const addBondBtn = document.getElementById("addBondBtn");
const vinculosDataEl = document.getElementById("vinculosData");
const BOND_MAX = 10;
let bonds = [];

function syncBondsData(){
  vinculosDataEl.value = JSON.stringify(bonds);
  document.getElementById("saveState").textContent = "ALTERAÇÕES NÃO SALVAS";
}

function renderBonds(){
  bondsList.innerHTML = "";
  bonds.forEach((bond, index) => {
    const row = document.createElement("div");
    row.className = "bond-row";

    const nameInput = document.createElement("input");
    nameInput.className = "bond-name";
    nameInput.type = "text";
    nameInput.placeholder = "Nome do vínculo";
    nameInput.value = bond.name;
    nameInput.addEventListener("input", () => {
      bonds[index].name = nameInput.value;
      syncBondsData();
    });

    const dotsWrap = document.createElement("div");
    dotsWrap.className = "bond-dots";
    for (let i = 0; i < BOND_MAX; i++){
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "bond-dot" + (i < bond.value ? " filled" : "");
      dot.title = `Marcar até ${i + 1}`;
      dot.addEventListener("click", () => {
        const clicked = i + 1;
        bonds[index].value = (bond.value === clicked) ? clicked - 1 : clicked;
        syncBondsData();
        renderBonds();
      });
      dotsWrap.appendChild(dot);
    }

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-bond";
    removeBtn.title = "Remover vínculo";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      bonds.splice(index, 1);
      syncBondsData();
      renderBonds();
    });

    row.appendChild(nameInput);
    row.appendChild(dotsWrap);
    row.appendChild(removeBtn);
    bondsList.appendChild(row);
  });
}

function addBond(){
  bonds.push({name: "", value: 0});
  syncBondsData();
  renderBonds();
}

function initBonds(){
  try { bonds = JSON.parse(vinculosDataEl.value) || []; } catch(e) { bonds = []; }
  renderBonds();
}

addBondBtn?.addEventListener("click", addBond);
initBonds();

// INVENTÁRIO
const inventoryList = document.getElementById("inventoryList");
const addItemBtn = document.getElementById("addItemBtn");
const inventarioDataEl = document.getElementById("inventarioData");
const inventarioLimit = document.querySelector('[data-key="inventario_limite"]');
const inventoryCountEl = document.getElementById("inventoryCount");
let inventoryItems = [];

function syncInventoryData(){
  inventarioDataEl.value = JSON.stringify(inventoryItems);
  document.getElementById("saveState").textContent = "ALTERAÇÕES NÃO SALVAS";
  updateInventoryCount();
}

function updateInventoryCount(){
  if (!inventoryCountEl) return;
  const limit = Number(inventarioLimit?.value) || 0;
  const usedSpace = inventoryItems.reduce((sum, item) => sum + (Number(item.space) || 0), 0);
  const usedLabel = Number.isInteger(usedSpace) ? usedSpace : usedSpace.toFixed(1);
  inventoryCountEl.textContent = `${inventoryItems.length} ITENS • ${usedLabel} / ${limit} ESPAÇO`;
  inventoryCountEl.classList.toggle("over", limit > 0 && usedSpace > limit);
}

function renderInventory(){
  inventoryList.innerHTML = "";
  inventoryItems.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "inventory-row";

    const nameInput = document.createElement("input");
    nameInput.className = "inventory-name";
    nameInput.type = "text";
    nameInput.placeholder = "Nome do item";
    nameInput.value = item.name;
    nameInput.addEventListener("input", () => {
      inventoryItems[index].name = nameInput.value;
      syncInventoryData();
    });

    const spaceInput = document.createElement("input");
    spaceInput.className = "inventory-space";
    spaceInput.type = "number";
    spaceInput.min = "0";
    spaceInput.step = "0.5";
    spaceInput.title = "Espaço ocupado por este item";
    spaceInput.value = item.space;
    spaceInput.addEventListener("input", () => {
      inventoryItems[index].space = Number(spaceInput.value) || 0;
      syncInventoryData();
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-bond";
    removeBtn.title = "Remover item";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      inventoryItems.splice(index, 1);
      syncInventoryData();
      renderInventory();
    });

    row.appendChild(nameInput);
    row.appendChild(spaceInput);
    row.appendChild(removeBtn);
    inventoryList.appendChild(row);
  });
  updateInventoryCount();
}

function addInventoryItem(){
  inventoryItems.push({name: "", space: 1});
  syncInventoryData();
  renderInventory();
}

function initInventory(){
  try { inventoryItems = JSON.parse(inventarioDataEl.value) || []; } catch(e) { inventoryItems = []; }
  renderInventory();
}

addItemBtn?.addEventListener("click", addInventoryItem);
inventarioLimit?.addEventListener("input", updateInventoryCount);
initInventory();

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

function parseFormula(formula){
  const parts = formula.toLowerCase().replace(/\s+/g, "").split("+");
  const groups = parts.map(part => {
    const match = part.match(/^(\d*)d(4|8|10|12|20)$/);
    if (!match) return null;
    return {quantity: Math.max(1, Math.min(99, Number(match[1] || 1))), sides: Number(match[2])};
  });
  if (!parts.length || groups.some(g => !g)) return null;
  return groups;
}

function loadFormula(formula){
  const groups = parseFormula(formula);
  if (!groups) return;
  diceGroups.innerHTML = "";
  groups.forEach(g => addDiceGroup(g.quantity, g.sides));
  rollCustom();
}

// ATALHOS DE ROLAGEM (padrão + personalizados)
const quickRollsEl = document.getElementById("quickRolls");
const shortcutNameInput = document.getElementById("shortcutName");
const shortcutFormulaInput = document.getElementById("shortcutFormula");
const addShortcutBtn = document.getElementById("addShortcutBtn");
const SHORTCUTS_KEY = "apex_dice_shortcuts_v1";
const DEFAULT_SHORTCUTS = [
  {label:"2D10", formula:"2d10"},
  {label:"2D20", formula:"2d20"},
  {label:"2D10 + 1D10", formula:"2d10+1d10"}
];

function loadCustomShortcuts(){
  try { return JSON.parse(localStorage.getItem(SHORTCUTS_KEY)) || []; }
  catch(e){ return []; }
}
function saveCustomShortcuts(list){
  localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(list));
}

function renderShortcuts(){
  quickRollsEl.querySelectorAll(".quick-roll").forEach(el => el.remove());
  const custom = loadCustomShortcuts();

  DEFAULT_SHORTCUTS.forEach(s => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quick-roll";
    btn.dataset.formula = s.formula;
    btn.textContent = s.label;
    btn.addEventListener("click", () => loadFormula(s.formula));
    quickRollsEl.appendChild(btn);
  });

  custom.forEach((s, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quick-roll custom";
    btn.dataset.formula = s.formula;
    btn.innerHTML = `<span>${s.label}</span>`;
    btn.addEventListener("click", (e) => { if (e.target.closest(".remove-shortcut")) return; loadFormula(s.formula); });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-shortcut";
    removeBtn.title = "Remover atalho";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const updated = loadCustomShortcuts();
      updated.splice(index, 1);
      saveCustomShortcuts(updated);
      renderShortcuts();
    });
    btn.appendChild(removeBtn);
    quickRollsEl.appendChild(btn);
  });
}

addShortcutBtn?.addEventListener("click", () => {
  const formulaRaw = shortcutFormulaInput.value.trim();
  if (!formulaRaw) { shortcutFormulaInput.focus(); return; }
  const groups = parseFormula(formulaRaw);
  if (!groups) {
    alert("Fórmula inválida. Use o formato como 2d10, 1d20 ou 2d10+1d6.");
    return;
  }
  const normalizedFormula = groups.map(g => `${g.quantity}d${g.sides}`).join("+");
  const custom = loadCustomShortcuts();
  if (custom.some(s => s.formula === normalizedFormula)) {
    alert("Esse atalho já existe.");
    return;
  }
  const label = shortcutNameInput.value.trim().toUpperCase() ||
    groups.map(g => `${g.quantity}D${g.sides}`).join(" + ");
  custom.push({label, formula: normalizedFormula});
  saveCustomShortcuts(custom);
  shortcutNameInput.value = "";
  shortcutFormulaInput.value = "";
  renderShortcuts();
});

renderShortcuts();

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

addDiceGroup(1, 10);


// GERADOR DE BARALHO
const deckTabBtn = document.getElementById("deckTabBtn");
const deckPanel = document.getElementById("deckPanel");
const closeDeckBtn = document.getElementById("closeDeckBtn");
const drawCardBtn = document.getElementById("drawCardBtn");
const shuffleDeckBtn = document.getElementById("shuffleDeckBtn");
const clearDeckBtn = document.getElementById("clearDeckBtn");
const clearCardHistoryBtn = document.getElementById("clearCardHistoryBtn");
const deckCount = document.getElementById("deckCount");
const playingCard = document.getElementById("playingCard");
const cardName = document.getElementById("cardName");
const cardHistory = document.getElementById("cardHistory");

const SUITS = [
  {symbol:"♥", name:"Copas", color:"red"},
  {symbol:"♦", name:"Ouros", color:"red"},
  {symbol:"♣", name:"Paus", color:"black"},
  {symbol:"♠", name:"Espadas", color:"black"}
];
const RANKS = [
  ["A","Ás"],["2","Dois"],["3","Três"],["4","Quatro"],["5","Cinco"],
  ["6","Seis"],["7","Sete"],["8","Oito"],["9","Nove"],["10","Dez"],
  ["J","Valete"],["Q","Dama"],["K","Rei"]
];
let deck = [];
function createDeck(){
  deck = [];
  SUITS.forEach(s => RANKS.forEach(r => deck.push({rank:r[0], rankName:r[1], suit:s.name, symbol:s.symbol, color:s.color})));
  updateDeckCount();
}
function shuffleDeck(){
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  updateDeckCount();
}
function updateDeckCount(){if(deckCount) deckCount.textContent=deck.length;}
function openDeck(){deckPanel.classList.add("open");deckPanel.setAttribute("aria-hidden","false");}
function closeDeck(){deckPanel.classList.remove("open");deckPanel.setAttribute("aria-hidden","true");}
function drawCard(){
  if(!deck.length){cardName.textContent="BARALHO ESGOTADO";return;}
  const c=deck.pop();
  playingCard.className=`playing-card ${c.color}`;
  playingCard.innerHTML=`<span>${c.rank}<br>${c.symbol}</span>`;
  cardName.textContent=`${c.rankName} de ${c.suit}`;
  const item=document.createElement("span");
  item.className=c.color;
  item.textContent=`${c.rank}${c.symbol}`;
  cardHistory.prepend(item);
  while(cardHistory.children.length>30) cardHistory.lastElementChild.remove();
  updateDeckCount();
}
function resetDeck(){
  createDeck(); shuffleDeck();
  playingCard.className="playing-card empty-card"; playingCard.textContent="?";
  cardName.textContent="Puxe uma carta"; cardHistory.innerHTML="";
}
deckTabBtn?.addEventListener("click",openDeck);
closeDeckBtn?.addEventListener("click",closeDeck);
deckPanel?.addEventListener("click",e=>{if(e.target===deckPanel)closeDeck()});
drawCardBtn?.addEventListener("click",drawCard);
shuffleDeckBtn?.addEventListener("click",()=>{shuffleDeck();cardName.textContent="Baralho embaralhado";});
clearDeckBtn?.addEventListener("click",resetDeck);
clearCardHistoryBtn?.addEventListener("click",()=>cardHistory.innerHTML="");
createDeck(); shuffleDeck();

// PERSONALIZAÇÃO DE COR
const themeTabBtn=document.getElementById("themeTabBtn");
const themePanel=document.getElementById("themePanel");
const closeThemeBtn=document.getElementById("closeThemeBtn");
const themeColor=document.getElementById("themeColor");
const resetThemeBtn=document.getElementById("resetThemeBtn");
function hexToRgbString(hex){
  const h = hex.replace("#","");
  const full = h.length === 3 ? h.split("").map(c => c+c).join("") : h;
  const r = parseInt(full.slice(0,2),16);
  const g = parseInt(full.slice(2,4),16);
  const b = parseInt(full.slice(4,6),16);
  return `${r},${g},${b}`;
}
function setTheme(color){
  document.documentElement.style.setProperty("--accent",color);
  document.documentElement.style.setProperty("--accent-rgb",hexToRgbString(color));
  themeColor.value=color;
  localStorage.setItem("apex_theme_color",color);
}
function openTheme(){themePanel.classList.add("open");themePanel.setAttribute("aria-hidden","false")}
function closeTheme(){themePanel.classList.remove("open");themePanel.setAttribute("aria-hidden","true")}
themeTabBtn?.addEventListener("click",openTheme);
closeThemeBtn?.addEventListener("click",closeTheme);
themePanel?.addEventListener("click",e=>{if(e.target===themePanel)closeTheme()});
themeColor?.addEventListener("input",e=>setTheme(e.target.value));
document.querySelectorAll(".theme-preset").forEach(b=>b.addEventListener("click",()=>setTheme(b.dataset.color)));
resetThemeBtn?.addEventListener("click",()=>setTheme("#9d1024"));
const savedTheme=localStorage.getItem("apex_theme_color");
if(savedTheme) setTheme(savedTheme);
