document.addEventListener('DOMContentLoaded',()=>{
  const msg = document.getElementById('auth-msg');
  document.getElementById('btn-register').addEventListener('click', async ()=>{
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value;
    msg.textContent = '';
    try{
      const res = await fetch('/api/register.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email, password:pass})});
      const j = await res.json();
      if(j.ok){ msg.style.color='green'; msg.textContent='Compte créé. Vous pouvez vous connecter.'; }
      else { msg.style.color='#d32f2f'; msg.textContent = j.error || 'Erreur'; }
    }catch(e){ console.error('register error', e); msg.style.color='#d32f2f'; msg.textContent='Erreur réseau — vérifiez que le serveur est démarré'; }
  });

  document.getElementById('btn-login').addEventListener('click', async ()=>{
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    msg.textContent = '';
    try{
      const res = await fetch('/api/login.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pass})});
      const j = await res.json();
      if(j.ok){ msg.style.color='green'; msg.textContent='Connecté en tant que '+j.role+' — redirection...';
        setTimeout(()=>{ window.location = '/'; },800);
      } else { msg.style.color='#d32f2f'; msg.textContent = j.error || 'Identifiants invalides'; }
    }catch(e){ console.error('login error', e); msg.style.color='#d32f2f'; msg.textContent='Erreur réseau — vérifiez que le serveur est démarré'; }
  });
});
