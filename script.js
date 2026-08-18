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
