// AI & Simulation layer: checks keys and provides mock behaviors when absent
document.addEventListener('DOMContentLoaded', async ()=>{
  const indicator = document.getElementById('api-indicator');
  let keys = {GEMINI_API_KEY:false,GROQ_API_KEY:false,SUPABASE_KEY:false};
  let fetchFailed = false;
  try{
    const r = await fetch('/api/check_keys.php');
    if(!r.ok) throw new Error('check_keys http ' + r.status);
    const j = await r.json();
    if(j.ok) keys = j.keys;
  }catch(e){ console.warn('check_keys failed', e); fetchFailed = true; }
  const any = Object.values(keys).some(v=>v===true);
  if(fetchFailed){ indicator.textContent = 'Erreur réseau — vérifiez le serveur'; indicator.style.background='var(--error)'; indicator.style.color='white'; }
  else if(!any){ indicator.textContent = 'Mode Simulation (En attente de clé API)'; indicator.style.background='var(--accent)'; indicator.style.color='white'; }
  else { indicator.textContent = 'API configurées'; indicator.style.background='var(--primary)'; indicator.style.color='white'; }

  // Guide analyze: simulate if no key
  const analyzeBtn = document.getElementById('analyze-btn');
  if(analyzeBtn){
    analyzeBtn.addEventListener('click', async ()=>{
      const status = document.getElementById('analyze-status');
      const result = document.getElementById('analyze-result');
      if(status) status.textContent = 'Analyse en cours...'; if(result) result.textContent='';
      if(keys.GEMINI_API_KEY){
        // integration placeholder
        setTimeout(()=>{ if(status) status.textContent=''; if(result) result.textContent='(API) Déchet organique - Compostable à 97%'; },1500);
      } else {
        // simulate
        setTimeout(()=>{ if(status) status.textContent=''; if(result) result.textContent='(Simulation) Déchet organique - Compostable à 95% — Conseils : Coupez en petits morceaux.'; },1500);
      }
    });
  }

  // Chatbot simulate
  const openChat = document.getElementById('open-chat');
  const chat = document.getElementById('chat');
  const chatSend = document.getElementById('chat-send');
  const chatInput = document.getElementById('chat-input');
  const chatWindow = document.getElementById('chat-window');
  if(openChat && chat){
    openChat.addEventListener('click', ()=>{ chat.setAttribute('aria-hidden','false'); });
    const closeChat = document.querySelector('.close-chat'); if(closeChat) closeChat.addEventListener('click', ()=>{ chat.setAttribute('aria-hidden','true'); });
  }
  if(chatSend && chatInput && chatWindow){
    chatSend.addEventListener('click', async ()=>{
      const q = chatInput.value.trim(); if(!q) return;
      chatWindow.innerHTML += `<div style="margin-bottom:8px"><strong>Vous:</strong> ${q}</div>`;
      chatInput.value='';
    if(keys.GROQ_API_KEY){
      // placeholder for LLM call
      setTimeout(()=>{ chatWindow.innerHTML += `<div style="margin-bottom:8px"><strong>Maître Composteur:</strong> (API) Excellente question — ...</div>`; chatWindow.scrollTop = chatWindow.scrollHeight; },800);
    } else {
      setTimeout(()=>{ chatWindow.innerHTML += `<div style="margin-bottom:8px"><strong>Maître Composteur:</strong> Excellente question ! En attendant la configuration complète de l'IA, pensez à équilibrer le carbone et l'azote (feuilles sèches / épluchures).</div>`; chatWindow.scrollTop = chatWindow.scrollHeight; },700);
    }
  });

  // Library submission fallback to localStorage if no supabase
  const addResBtn = document.getElementById('add-resource');
  if(addResBtn){
    addResBtn.addEventListener('click', ()=>{
      const title = prompt('Titre de la ressource :'); if(!title) return;
      const item = {title, status: keys.SUPABASE_KEY? 'pending_remote' : 'en_attente_local', created: Date.now()};
      let arr = JSON.parse(localStorage.getItem('local_resources')||'[]'); arr.push(item); localStorage.setItem('local_resources', JSON.stringify(arr));
      alert('Ressource enregistrée en local et en attente de modération.');
      // refresh resources list
      const resources = document.getElementById('resources'); resources.innerHTML = ''; arr.forEach(r=>{ const d=document.createElement('div'); d.textContent = r.title + ' — ' + r.status; resources.appendChild(d); });
    });
  }

  // Load any local resources into list
  const arr = JSON.parse(localStorage.getItem('local_resources')||'[]'); const resources = document.getElementById('resources'); resources.innerHTML=''; arr.forEach(r=>{ const d=document.createElement('div'); d.textContent = r.title + ' — ' + r.status; resources.appendChild(d); });

  // Signalement simulation: increment counter locally and hide marker when >=3
  const reportBtn = document.getElementById('report-btn');
  if(reportBtn){
    reportBtn.addEventListener('click', ()=>{
    const id = prompt('ID du bac à signaler (ex: 1) :'); if(!id) return;
    const key = `reports_host_${id}`;
    let c = parseInt(localStorage.getItem(key) || '0'); c++; localStorage.setItem(key, c);
    alert('Signalement enregistré. Total: ' + c);
    if(c>=3){
      // remove marker from map vis (simple approach: reload hosts which may filter)
      alert('Le bac est suspendu (simulation) et sera masqué de la carte publique.');
      // store suspended flag
      localStorage.setItem(`suspended_host_${id}`, '1');
      // reload hosts to pick this up
      if(typeof loadHosts === 'function') loadHosts();
    });
  }
});
