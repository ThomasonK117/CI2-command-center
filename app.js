const STORAGE_KEY="ci2-state";
const blankWorkspace=()=>({drafts:{},observations:[],actions:[]});
const defaultState={schemaVersion:3,projects:[],selectedProjectId:null};
let state=loadState();

function loadState(){
  let raw;
  try{raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null")}catch{raw=null}
  if(!raw)return structuredClone(defaultState);
  if(raw.schemaVersion===3){
    raw.projects=(raw.projects||[]).map(p=>({...p,workspace:{...blankWorkspace(),...(p.workspace||{})}}));
    return {...defaultState,...raw};
  }
  const projects=raw.projects||[];
  const legacy={observations:raw.observations||[],actions:raw.actions||[],drafts:raw.drafts||{}};
  projects.forEach(p=>p.workspace=blankWorkspace());
  if(projects.length){
    const target=projects[projects.length-1];
    target.workspace={drafts:{...legacy.drafts},observations:[...legacy.observations],actions:[...legacy.actions]};
  }
  const migrated={schemaVersion:3,projects,selectedProjectId:null,legacyV02Backup:legacy};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));
  return migrated;
}
const save=()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
const qs=s=>document.querySelector(s),qsa=s=>[...document.querySelectorAll(s)];
const currentProject=()=>state.projects.find(p=>String(p.id)===String(state.selectedProjectId))||null;
const workspace=()=>currentProject()?.workspace||blankWorkspace();
const workspaceViews=new Set(["details","a3","data","analysis","actions","results"]);

function showView(id){
  if(workspaceViews.has(id)&&!currentProject()){id="projects"}
  qsa(".view").forEach(v=>v.classList.toggle("active",v.id===id));
  qsa(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
  const label=qs(`[data-view="${id}"] span`)?.textContent||"CI²";
  qs("#pageTitle").textContent=currentProject()&&workspaceViews.has(id)?`${currentProject().name} · ${label}`:label;
  qs(".sidebar").classList.remove("open");
  renderProjectContext();
}
qsa(".nav-item").forEach(b=>b.onclick=()=>showView(b.dataset.view));
qs("#menuBtn").onclick=()=>qs(".sidebar").classList.toggle("open");

const modal=qs("#projectModal");
qsa("[data-open-modal],#newProjectBtn").forEach(b=>b.onclick=()=>modal.showModal());
qs("#saveProject").onclick=e=>{
  e.preventDefault();const name=qs("#projectName").value.trim();if(!name)return;
  const p={id:Date.now(),name,area:qs("#projectArea").value.trim(),problem:qs("#projectProblem").value.trim(),status:"Active",created:new Date().toLocaleDateString(),workspace:blankWorkspace()};
  state.projects.unshift(p);state.selectedProjectId=p.id;save();render();modal.close();qs("#projectForm").reset();openProject(p.id);
};

function openProject(id){
  const p=state.projects.find(x=>String(x.id)===String(id));if(!p)return;
  state.selectedProjectId=p.id;save();render();loadWorkspaceFields();showView("details");
}
window.openProject=openProject;
window.returnToPortfolio=()=>{state.selectedProjectId=null;save();render();showView("projects")};

function renderProjectContext(){
  const bar=qs("#projectContext"),p=currentProject();
  if(!p){bar.hidden=true;return}
  bar.hidden=false;
  qs("#contextName").textContent=p.name;
  qs("#contextMeta").textContent=`${p.area||"Unassigned area"} · ${p.status}`;
}

function renderProjects(){
  const empty=`<div class="card"><span class="tag">READY</span><h3>No projects yet</h3><p>Create the first improvement project and the workspace will begin tracking it here.</p></div>`;
  qs("#projectCards").innerHTML=state.projects.length?state.projects.slice(0,6).map(p=>`<article class="card project-card" role="button" tabindex="0" onclick="openProject('${p.id}')" onkeydown="if(event.key==='Enter'||event.key===' ')openProject('${p.id}')"><span class="tag">${esc(p.status.toUpperCase())}</span><h3>${esc(p.name)}</h3><p>${esc(p.problem||p.area||"Project shell created.")}</p><small>${esc(p.area||"Unassigned area")} · ${esc(p.created)}</small><div class="open-cue">Open workspace →</div></article>`).join(""):empty;
  qs("#projectTable").innerHTML=state.projects.length?`<table><thead><tr><th>Project</th><th>Area</th><th>Status</th><th>Created</th></tr></thead><tbody>${state.projects.map(p=>`<tr class="project-row" tabindex="0" onclick="openProject('${p.id}')" onkeydown="if(event.key==='Enter'||event.key===' ')openProject('${p.id}')"><td><strong>${esc(p.name)}</strong><br><span class="muted">${esc(p.problem||"")}</span></td><td>${esc(p.area||"—")}</td><td>${esc(p.status)}</td><td>${esc(p.created)}</td></tr>`).join("")}</tbody></table>`:"No projects yet.";
}

function renderDetails(){
  const p=currentProject();if(!p)return;
  qs("#detailName").value=p.name||"";qs("#detailArea").value=p.area||"";qs("#detailProblem").value=p.problem||"";qs("#detailStatus").value=p.status||"Active";
}
qs("#saveDetails").onclick=()=>{const p=currentProject();if(!p)return;p.name=qs("#detailName").value.trim()||p.name;p.area=qs("#detailArea").value.trim();p.problem=qs("#detailProblem").value.trim();p.status=qs("#detailStatus").value;save();render();showView("details")};

function renderObs(){
  const obs=workspace().observations;
  qs("#obsRows").innerHTML=obs.length?obs.map(o=>`<tr><td>${esc(o.date)}</td><td>${esc(o.category)}</td><td>${esc(o.duration)} min</td><td>${esc(o.notes)}</td></tr>`).join(""):`<tr><td colspan="4" class="muted">No observations yet for this project.</td></tr>`;
  const counts={};obs.forEach(o=>counts[o.category]=(counts[o.category]||0)+1);const max=Math.max(1,...Object.values(counts));
  qs("#pareto").innerHTML=Object.keys(counts).length?Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="bar-row"><span>${esc(k)}</span><div class="bar-track"><div class="bar-fill" style="width:${v/max*100}%"></div></div><strong>${v}</strong></div>`).join(""):`<p class="muted">Add observations to this project to generate its Pareto.</p>`;
}
qs("#addObservation").onclick=()=>{const p=currentProject();if(!p)return showView("projects");const category=prompt("Observation category:");if(!category)return;const duration=prompt("Duration in minutes:","0")||"0";const notes=prompt("Short notes:","")||"";p.workspace.observations.unshift({id:Date.now(),date:new Date().toLocaleDateString(),category,duration,notes});save();render()};

qs("#addAction").onclick=()=>{const p=currentProject();if(!p)return showView("projects");const title=prompt("Action / countermeasure:");if(!title)return;const owner=prompt("Owner:","")||"Unassigned";p.workspace.actions.unshift({id:Date.now(),title,owner,done:false});save();render()};
function renderActions(){const actions=workspace().actions;qs("#actionList").innerHTML=actions.length?actions.map(a=>`<article class="card"><span class="tag">${a.done?"COMPLETE":"OPEN"}</span><h3>${esc(a.title)}</h3><p>Owner: ${esc(a.owner)}</p><button class="secondary" onclick="toggleAction('${a.id}')">${a.done?"Reopen":"Mark complete"}</button></article>`).join(""):`<article class="card"><h3>No actions yet</h3><p>Countermeasures for this project will appear here.</p></article>`}
window.toggleAction=id=>{const a=workspace().actions.find(x=>String(x.id)===String(id));if(!a)return;a.done=!a.done;save();render()};

function loadWorkspaceFields(){const drafts=workspace().drafts;qsa("[data-save]").forEach(el=>el.value=drafts[el.dataset.save]||"")}
qsa("[data-save]").forEach(el=>el.addEventListener("input",()=>{const p=currentProject();if(!p)return;p.workspace.drafts[el.dataset.save]=el.value;save()}));

function render(){
  renderProjects();renderDetails();renderObs();renderActions();renderProjectContext();
  const allObs=state.projects.reduce((n,p)=>n+(p.workspace?.observations?.length||0),0);
  const allActions=state.projects.flatMap(p=>p.workspace?.actions||[]);
  qs("#activeCount").textContent=state.projects.filter(p=>p.status==="Active").length;
  qs("#observationCount").textContent=allObs;qs("#actionCount").textContent=allActions.filter(a=>!a.done).length;qs("#completedCount").textContent=allActions.filter(a=>a.done).length;
}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

render();loadWorkspaceFields();
if(currentProject())showView("details");
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(err=>console.warn("Service worker registration failed:",err)));
