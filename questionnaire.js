/* QCM d'acquisition Momentum (v2, 04/11/2026) : « On automatise ta création de contenu pour être visible sur les réseaux ».
   Un seul arbre de questions, deux usages :
   - data-questionnaire="claude" : page dédiée (lien en bio, page creation/). Fin = appel Calendly ou mot CRÉATION en DM.
   - data-questionnaire="ressource" + data-contenu=".wrap" : en haut d'une page ressource. La ressource est masquée pendant
     les questions ; à la fin on propose l'appel, avec un bouton « accéder directement à ma ressource ».
   data-mot : le mot-clé de la page (creation, prompt, connecteur…), sinon ?mot= dans le lien.
   Paramètres du lien : ?src=instagram|tiktok&mot=prompt&v=<id vidéo>&c=<pseudo du commentateur>&var=A|B&test=1
   Chaque étape part dans la table hub_questionnaire_evenements (ajout seul). Si l'envoi échoue, la page continue normalement.
   En local (localhost, réseau de la maison, fichier), rien n'est envoyé : les événements s'affichent dans la console. */
(function () {
  'use strict';

  // ---- Réglages ----
  const CONFIG = {
    SUPABASE_URL: 'https://wpyiyqgfdjsrkyljtgmr.supabase.co',
    CLE_PUBLIQUE: 'sb_publishable_s-blQHu77BdzcqYbu2agww_4l8Wsbwy', // clé publique : ne permet que d'ajouter des lignes dans la table des questionnaires
    CALENDLY: 'https://calendly.com/pablo-romero-floxatek/30min',  // Calendly de Pablo, lun-sam 9h-19h heure de Paris
    INSTAGRAM: 'pabloetlucas',
    TIKTOK: 'pabloetlucas',
    GUIDE: 'https://romero-pablo-dev.github.io/claude-code-gratuit/',
  };

  const script = document.currentScript;
  const TYPE = script && script.dataset.questionnaire === 'claude' ? 'claude' : 'ressource';
  const CONTENU = script && script.dataset.contenu;
  const qs = new URLSearchParams(location.search);
  const propre = (v, max) => (v || '').toString().slice(0, max);
  const SOURCES = ['instagram', 'tiktok'];
  const ctx = {
    source: SOURCES.includes(qs.get('src')) ? qs.get('src') : (qs.get('src') ? 'autre' : 'instagram'),
    mot_cle: propre(qs.get('mot') || (script && script.dataset.mot) || (TYPE === 'claude' ? 'claude' : ''), 40).toLowerCase() || null,
    video_id: propre(qs.get('v'), 64) || null,
    commentateur: propre(qs.get('c'), 64) || null,
    variante: /^[A-Z0-9_-]{1,12}$/.test((qs.get('var') || '').toUpperCase()) ? qs.get('var').toUpperCase() : 'A',
    est_test: qs.get('test') === '1',
  };
  const LOCAL = location.protocol === 'file:' || /^(localhost|127\.|10\.|192\.168\.|\[::1\])/.test(location.hostname);
  const session = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16));

  // ---- Envoi d'un événement (jamais bloquant) ----
  function envoyer(type, etape, valeur) {
    const ligne = { session_id: session, questionnaire: TYPE, variante: ctx.variante, source: ctx.source, mot_cle: ctx.mot_cle,
      video_id: ctx.video_id, commentateur: ctx.commentateur, type, etape, valeur: valeur || null, est_test: ctx.est_test };
    if (LOCAL) { console.info('[qx] (local, rien n\'est envoyé)', type, etape, JSON.stringify(valeur || '')); return; }
    try {
      fetch(CONFIG.SUPABASE_URL + '/rest/v1/hub_questionnaire_evenements', {
        method: 'POST', keepalive: true,
        headers: { apikey: CONFIG.CLE_PUBLIQUE, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(ligne),
      }).catch(() => {});
    } catch (e) { /* on ne bloque jamais la personne */ }
  }

  // ---- Les questions ----
  // choix : [valeur, emoji, texte, réaction affichée en haut de l'écran suivant]
  const Q = {
    priorite: { style: 'monte', titre: 'Qu\'est-ce qui est le plus important <span>pour toi</span> ?', sous: 'Ça prend même pas une minute.', choix: [
      ['contenu', '🎬', 'Automatiser ma création de contenu <small>(idées, scripts, montage)</small>', 'Bon choix : c\'est exactement ce qu\'on automatise.'],
      ['business', '⚙️', 'Automatiser autre chose dans mon business', 'Ok, on regarde ça avec toi.'],
      ['lancement', '🚀', 'M\'aider à lancer mon business avec Claude', 'Se lancer avec Claude, c\'est le bon moment.'],
      ['apprendre', '📚', 'Rien de précis, je veux apprendre Claude', 'Ça marche, plus qu\'une question.']] },
    activite: { style: 'tuiles', titre: 'Où t\'en es avec ton <span>activité</span> ?', sous: '', choix: [
      ['vend', '💼', 'Je vends déjà', 'Parfait, on part de ce qui marche déjà.'],
      ['sans_clients', '🌱', 'Je suis lancé, mais pas encore de clients', 'Ça tombe bien, on est là pour ça.']] },
    projet: { style: 'marches', titre: 'Où t\'en es dans ton <span>projet</span> ?', sous: 'Pas de mauvaise réponse.', choix: [
      ['offre_prete', '✅', 'Mon offre est prête, il me manque juste les clients', 'Top, il ne manque plus que la visibilité.'],
      ['idee', '💡', 'J\'ai une idée, mais pas encore d\'offre', 'Bonne base, on peut partir de là.'],
      ['aucune_idee', '🌀', 'Pas encore d\'idée, mais je veux me lancer avec Claude', 'Ok, plus qu\'une question pour toi.']] },
    reseaux: { style: 'niveaux', niveaux: { souvent: 3, parfois: 2, pas_encore: 1 }, titre: 'Et sur les <span>réseaux</span>, aujourd\'hui ?', sous: 'Instagram, TikTok, YouTube…', choix: [
      ['souvent', '🔥', 'Je poste plusieurs fois par semaine', 'Belle régularité, on va te faire gagner des heures.'],
      ['parfois', '🐢', 'Je poste quand j\'ai le temps', 'Le rythme, c\'est justement ce qu\'on automatise.'],
      ['pas_encore', '🤔', 'J\'aimerais, mais je ne sais pas comment faire', 'Normal, presque tout le monde commence là.']] },
    freins: { style: 'pop', multi: true, titre: 'Qu\'est-ce qui te <span>bloque</span> le plus ?', sous: 'Coche tout ce qui te parle.',
      reaction: 'Noté : c\'est exactement ce qu\'on règle ensemble.', choix: [ // 4e élément : ce qu'affiche le récap de fin
      ['vues', '📉', 'Mes vidéos ne font pas de vues', 'faire décoller tes vues'], ['idees', '💡', 'Avoir des idées de vidéos', 'trouver tes idées de vidéos'],
      ['montage', '✂️', 'Le montage', 'ton montage'], ['scripts', '✍️', 'Écrire mes scripts', 'l\'écriture de tes scripts'],
      ['camera', '🎥', 'Me montrer face caméra', 'être à l\'aise face caméra'], ['rythme', '⏱️', 'Tenir le rythme', 'tenir le rythme'],
      ['autre', '✨', 'Autre chose']] },
    besoins: { style: 'pop', multi: true, titre: 'Tu voudrais automatiser <span>quoi</span> ?', sous: 'Coche tout ce qui compte pour toi.',
      reaction: 'Noté, on regarde ce qui s\'automatise chez toi.', choix: [
      ['messages', '💬', 'Répondre aux messages et relancer'], ['clients', '🤝', 'Suivre mes clients'], ['prospection', '🔎', 'Trouver des clients'],
      ['admin', '🧾', 'Devis, factures, mails'], ['autre', '✨', 'Autre chose']] },
    claude: { style: 'niveaux', titre: 'Et <span>Claude</span>, t\'en es où ?', sous: 'Pas de mauvaise réponse.', choix: [
      ['payant', '💳', 'J\'ai un abonnement payant', 'Parfait, tu as déjà tout ce qu\'il faut.'],
      ['gratuit', '💭', 'J\'utilise la version gratuite', 'Ok, l\'abonnement sera la seule chose à prévoir.'],
      ['autre_ia', '🤖', 'J\'utilise une autre IA (ChatGPT…)', 'Ok, on te montrera ce que Claude change.'],
      ['peu', '👶', 'J\'utilise très peu l\'IA', 'Aucun souci, on part de là où tu en es.']] },
    school: { style: 'monte', titre: 'Apprendre Claude de <span>A à Z</span>, ça te dirait ?',
      sous: 'On prépare une plateforme : des vidéos pas à pas, les skills à mettre sur ton Claude, et un Claude qui s\'installe tout seul selon tes réponses, pour ta vie de tous les jours, tes projets ou ton business.', choix: [
      ['oui', '🔥', 'Oui, carrément', 'Top, on te garde une place.'],
      ['peut_etre', '🤔', 'Peut-être, dis-m\'en plus', 'Ok, on t\'en dit plus bientôt.'],
      ['non', '🙅', 'Non merci', 'Ok, merci pour ta franchise.']] },
  };
  const MULTI = Object.keys(Q).filter(id => Q[id].multi);

  // Le parcours selon les réponses. Tant qu'une réponse manque, on suppose le chemin le plus long (barre d'avancement stable).
  function chemin(r) {
    if (r.priorite === 'apprendre') return ['priorite', 'school'];
    if (r.priorite === 'lancement') return r.projet === 'aucune_idee' ? ['priorite', 'projet', 'school'] : ['priorite', 'projet', 'reseaux', 'freins', 'claude'];
    return ['priorite', 'activite', 'reseaux', r.priorite === 'business' ? 'besoins' : 'freins', 'claude'];
  }
  // contenu et lancement = l'offre (appel) ; surmesure = autre automatisation (consulting) ; school = pas pour nous aujourd'hui
  function profil(r) {
    if (r.priorite === 'apprendre' || (r.priorite === 'lancement' && r.projet === 'aucune_idee')) return 'school';
    if (r.priorite === 'business') return 'surmesure';
    return r.priorite === 'lancement' ? 'lancement' : 'contenu';
  }
  const garder = r => chemin(r).reduce((o, id) => { if (r[id] !== undefined) o[id] = r[id]; return o; }, {});

  // ---- Mise en place ----
  const rep = {}; MULTI.forEach(id => { rep[id] = []; });
  const pile = [];
  let reaction = '';
  const CLE = 'qx_profil'; // partagé par toutes les pages du site : qui a déjà répondu n'a pas à répondre de nouveau
  const lire = () => { try { return JSON.parse(localStorage.getItem(CLE) || 'null'); } catch (e) { return null; } };
  const ecrire = v => { try { localStorage.setItem(CLE, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } };
  const oublier = () => { try { localStorage.removeItem(CLE); } catch (e) { /* rien */ } };

  const racine = document.createElement('section');
  racine.id = 'qx';
  // En-tête façon profil Instagram : la vraie photo du compte, pour que ça sente des humains et pas une page générée.
  const PHOTO = new URL('pabloetlucas.jpg', (script && script.src) || location.href).href;
  racine.innerHTML = `<div class="qx-profil"><img src="${PHOTO}" alt="" width="40" height="40"><span><b>pabloetlucas</b><small></small></span></div>` +
    `<div class="qx-barre"><i></i></div><div class="qx-etape"></div><div class="qx-ecran"></div>`;
  const zone = racine.querySelector('.qx-ecran');

  // ---- Effets : chaque écran entre à sa façon, chaque clic répond ----
  const CALME = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COULEURS = ['#C64902', '#F07A3A', '#F7B48C', '#E8BEAA'];
  // Gerbe de particules qui part du point touché
  function gerbe(x, y, nb) {
    if (CALME) return;
    const box = racine.getBoundingClientRect();
    const g = document.createElement('span'); g.className = 'qx-gerbe'; g.setAttribute('aria-hidden', 'true');
    g.style.left = (x - box.left) + 'px'; g.style.top = (y - box.top) + 'px';
    for (let k = 0; k < nb; k++) {
      const p = document.createElement('i');
      p.style.setProperty('--a', (360 * k / nb + Math.random() * 25) + 'deg');
      p.style.setProperty('--d', (34 + Math.random() * 36) + 'px');
      p.style.background = COULEURS[k % COULEURS.length];
      g.appendChild(p);
    }
    racine.appendChild(g); setTimeout(() => g.remove(), 750);
  }
  // Confettis quand le résultat s'affiche
  function confettis() {
    if (CALME) return;
    const c = document.createElement('div'); c.className = 'qx-confettis'; c.setAttribute('aria-hidden', 'true');
    for (let k = 0; k < 36; k++) {
      const p = document.createElement('i');
      p.style.left = (Math.random() * 100) + '%';
      p.style.background = COULEURS[k % COULEURS.length];
      p.style.setProperty('--r', Math.round(Math.random() * 360) + 'deg');
      p.style.animationDelay = (Math.random() * 0.5) + 's';
      p.style.animationDuration = (2.2 + Math.random() * 1.4) + 's';
      c.appendChild(p);
    }
    document.body.appendChild(c); setTimeout(() => c.remove(), 4300);
  }
  const centre = (e, el) => { const r = el.getBoundingClientRect(); return e && e.clientX ? [e.clientX, e.clientY] : [r.left + r.width / 2, r.top + r.height / 2]; };
  racine.querySelector('.qx-profil small').textContent = TYPE === 'ressource'
    ? 'Tu as commenté ' + (ctx.mot_cle || 'la vidéo').toUpperCase()
    : 'Pablo et Lucas';

  let caches = [];
  function monter() {
    const conteneur = CONTENU ? document.querySelector(CONTENU) : null;
    if (TYPE === 'ressource' && conteneur) {
      caches = [...conteneur.children];
      conteneur.insertBefore(racine, conteneur.firstChild);
      caches.forEach(el => el.classList.add('qx-cache'));
    } else {
      (document.querySelector('[data-qx]') || document.body).appendChild(racine);
    }
    const deja = lire();
    envoyer('ouverture', 'ouverture', { retour: !!deja });
    if (deja && deja.rep) {
      Object.assign(rep, deja.rep);
      if (!ctx.commentateur && deja.pseudo) ctx.commentateur = deja.pseudo;
      fin(false);
    } else afficher('priorite');
  }

  function entete(largeur, texte) {
    racine.querySelector('.qx-barre').classList.remove('qx-cache');
    racine.querySelector('.qx-etape').classList.remove('qx-cache');
    racine.querySelector('.qx-barre i').style.width = largeur + '%';
    racine.querySelector('.qx-etape').textContent = texte;
  }
  function remonter() { const y = racine.getBoundingClientRect().top + window.scrollY - 16; if (window.scrollY > y) window.scrollTo(0, Math.max(0, y)); }
  // L'écran suivant arrive par la droite ; avec « Retour », il revient par la gauche.
  let sens = 1;
  function relancerAnimation() {
    zone.classList.remove('qx-ecran', 'qx-sort', 'qx-recule'); delete zone.dataset.style;
    void zone.offsetWidth; zone.classList.add('qx-ecran'); if (sens < 0) zone.classList.add('qx-recule'); sens = 1;
  }
  function partir(suite) { if (CALME) return suite(); zone.classList.add('qx-sort'); setTimeout(suite, 170); }
  function reculer(suite) { sens = -1; suite(); }
  function suivant(id) { const c = chemin(rep), i = c.indexOf(id); return i + 1 < c.length ? c[i + 1] : 'fin'; }
  // La réaction à la réponse précédente s'affiche comme un message reçu de notre part
  function bulle() { const t = reaction; reaction = ''; return t ? `<div class="qx-react"><img src="${PHOTO}" alt="" width="26" height="26"><p>${t}</p></div>` : ''; }

  function afficher(id) {
    if (id === 'fin') return ctx.commentateur ? analyser() : demanderPseudo();
    const c = chemin(rep), i = c.indexOf(id);
    entete(Math.round(100 * i / (c.length + 1)), `Question ${i + 1} sur ${c.length}`);
    relancerAnimation(); remonter();
    const q = Q[id];
    zone.dataset.style = q.style || 'monte'; // monte | tuiles | marches | niveaux | pop : chaque question a son entrée
    const actif = v => q.multi ? rep[id].includes(v) : rep[id] === v;
    const go = () => rep[id].length ? `Continuer (${rep[id].length})` : 'Continuer';
    const niveau = v => q.niveaux ? `<span class="qx-niveau" aria-hidden="true">${[1, 2, 3].map(k => `<i class="${k <= q.niveaux[v] ? 'qx-plein' : ''}"></i>`).join('')}</span>` : '';
    zone.innerHTML = bulle() + `<h1 class="qx-h1">${q.titre}</h1>${q.sous ? `<p class="qx-sous">${q.sous}</p>` : ''}<div class="qx-choix${q.multi ? ' qx-multi' : ''}">${q.choix.map(([v, e, t], n) =>
      `<button type="button" data-v="${v}" style="--i:${n}" class="${actif(v) ? 'qx-on' : ''}" ${q.multi ? `role="checkbox" aria-checked="${actif(v)}"` : ''}><span class="qx-em">${e}</span><span class="qx-txt">${t}</span>${niveau(v)}${q.multi ? '<span class="qx-coche" aria-hidden="true"></span>' : ''}</button>`).join('')}</div>` +
      (q.multi ? `<button type="button" class="qx-go" ${rep[id].length ? '' : 'disabled'}>${go()}</button>` : '') +
      (pile.length ? `<button type="button" class="qx-retour">‹ Retour</button>` : '');
    let parti = false;
    zone.querySelectorAll('.qx-choix button').forEach(b => b.onclick = e => {
      const v = b.dataset.v;
      if (q.multi) {
        rep[id] = rep[id].includes(v) ? rep[id].filter(x => x !== v) : [...rep[id], v];
        const on = b.classList.toggle('qx-on'); b.setAttribute('aria-checked', on);
        if (on) { const [x, y] = centre(null, b.querySelector('.qx-coche')); gerbe(x, y, 8); }
        const bouton = zone.querySelector('.qx-go'); bouton.disabled = !rep[id].length; bouton.textContent = go();
        return;
      }
      if (parti) return; parti = true;
      rep[id] = v; b.classList.add('qx-on');
      zone.querySelectorAll('.qx-choix button').forEach(o => { if (o !== b) o.classList.add('qx-eteint'); });
      const [x, y] = centre(e, b); gerbe(x, y, 12);
      reaction = (q.choix.find(c => c[0] === v) || [])[3] || '';
      envoyer('reponse', id, { v });
      setTimeout(() => partir(() => { pile.push(id); afficher(suivant(id)); }), CALME ? 120 : 280);
    });
    if (q.multi) zone.querySelector('.qx-go').onclick = () => {
      if (parti) return; parti = true;
      reaction = q.reaction || '';
      envoyer('reponse', id, { v: rep[id] }); partir(() => { pile.push(id); afficher(suivant(id)); });
    };
    const r = zone.querySelector('.qx-retour');
    if (r) r.onclick = () => { reaction = ''; reculer(() => afficher(pile.pop())); };
  }

  // ---- Le @ (obligatoire, sauf quand le lien dit déjà qui répond : ?c=) ----
  function demanderPseudo() {
    entete(92, 'Dernière étape');
    relancerAnimation(); remonter();
    const tiktok = ctx.source === 'tiktok';
    zone.innerHTML = bulle() + `<h1 class="qx-h1">Donne-nous ton <span>${tiktok ? '@' : 'Instagram'}</span></h1>
      <p class="qx-sous">${tiktok ? 'Instagram ou TikTok, pour' : 'Pour'} qu'on puisse se souvenir de toi quand on te répond.</p>
      <label class="qx-champ"><span>@</span><input type="text" id="qx-pseudo" inputmode="text" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="31" placeholder="ton_pseudo"></label>
      <p class="qx-erreur" id="qx-erreur" role="alert"></p>
      <button type="button" class="qx-go" id="qx-valider">Voir mon résultat</button>
      <button type="button" class="qx-retour">‹ Retour</button>`;
    const champ = zone.querySelector('#qx-pseudo'), erreur = zone.querySelector('#qx-erreur');
    const valider = () => {
      if (zone.classList.contains('qx-sort')) return; // déjà validé
      const p = champ.value.trim().replace(/^@+/, '').toLowerCase();
      if (!p) { erreur.textContent = 'Écris ton @ pour voir ton résultat.'; champ.focus(); return; }
      if (!/^[a-z0-9._]{1,30}$/.test(p)) { erreur.textContent = 'Juste ton @ : lettres, chiffres, points et tirets bas.'; return; }
      ctx.commentateur = p;
      envoyer('reponse', 'pseudo', { v: p });
      partir(analyser);
    };
    champ.oninput = () => { erreur.textContent = ''; };
    champ.onkeydown = e => { if (e.key === 'Enter') valider(); };
    zone.querySelector('#qx-valider').onclick = valider;
    zone.querySelector('.qx-retour').onclick = () => reculer(() => afficher(pile.pop()));
  }

  // ---- « On analyse tes réponses » : chaque ligne reprend une vraie réponse, pour que le plan sente le sur-mesure ----
  const SITUATION = { vend: 'tu vends déjà', sans_clients: 'lancé, pas encore de clients', offre_prete: 'offre prête, il manque les clients',
    idee: 'une idée, pas encore d\'offre', aucune_idee: 'tout est à lancer' };
  const RYTHME = { souvent: 'plusieurs fois par semaine', parfois: 'quand tu as le temps', pas_encore: 'pas encore lancé' };
  const IA = { payant: 'abonnement payant ✓', gratuit: 'version gratuite', autre_ia: 'une autre IA pour l\'instant', peu: 'presque pas d\'IA' };
  const liste = (id, k) => { const t = (rep[id] || []).map(v => (Q[id].choix.find(c => c[0] === v) || [])[k]).filter(Boolean);
    return t.length ? t.slice(0, 2).join(', ') + (t.length > 2 ? '…' : '') : 'autre chose'; };
  function analyser() {
    const p = profil(rep);
    const lignes = p === 'school'
      ? [['Ce que tu cherches', rep.priorite === 'apprendre' ? 'apprendre Claude' : 'te lancer avec Claude'], ['Ton projet', SITUATION[rep.projet] || 'en réflexion'], ['La suite pour toi', 'prête']]
      : [['Ta situation', SITUATION[rep.activite || rep.projet] || 'notée'],
         ['Ton rythme sur les réseaux', RYTHME[rep.reseaux] || 'noté'],
         p === 'surmesure' ? ['Ce que tu veux automatiser', liste('besoins', 2).toLowerCase()] : ['Ce qui te bloque', liste('freins', 3)],
         ['Ton Claude', IA[rep.claude] || 'noté'],
         [p === 'surmesure' ? 'La bonne porte pour toi' : 'Ton plan de création', 'prêt']];
    entete(100, 'Analyse');
    relancerAnimation(); remonter();
    zone.innerHTML = `<h1 class="qx-h1">On analyse tes <span>réponses</span>…</h1>
      <div class="qx-jauge"><i></i><b>0 %</b></div>
      <ul class="qx-analyse">${lignes.map(([l, r]) => `<li><span>${l}</span><em>${r}</em></li>`).join('')}</ul>`;
    const pas = CALME ? 150 : 780, total = pas * (lignes.length + 1) + 350;
    // une ligne à la fois : elle pulse pendant qu'on « l'analyse », puis se coche et affiche ce qu'on a retenu
    zone.querySelectorAll('.qx-analyse li').forEach((li, i) => {
      setTimeout(() => li.classList.add('qx-actif'), pas * i + 200);
      setTimeout(() => { li.classList.remove('qx-actif'); li.classList.add('qx-fait'); }, pas * (i + 1) + 200);
    });
    // la jauge monte avec les lignes, le chiffre suit
    const jauge = zone.querySelector('.qx-jauge i'), chiffre = zone.querySelector('.qx-jauge b'), t0 = performance.now(), duree = total - 300;
    const tic = () => {
      const k = Math.min(1, (performance.now() - t0) / duree), v = Math.round(100 * (1 - Math.pow(1 - k, 1.6)));
      jauge.style.width = v + '%'; chiffre.textContent = v + ' %';
      if (k < 1 && zone.contains(jauge)) setTimeout(tic, 40);
    };
    tic();
    setTimeout(() => fin(true), total);
  }

  const reseau = ctx.source === 'tiktok' ? 'TikTok' : 'Instagram';
  const lienDm = () => ctx.source === 'tiktok' ? `https://www.tiktok.com/@${CONFIG.TIKTOK}` : `https://ig.me/m/${CONFIG.INSTAGRAM}`;
  const boutonDm = (mot, etape, principal) =>
    `<a class="${principal ? 'qx-wa qx-dm-plein' : 'qx-dm'}" data-clic="${etape}" data-copie="${mot}" href="${lienDm()}" target="_blank" rel="noopener">💬 Écrire ${mot} sur ${reseau}</a>`;

  function fin(nouveau) {
    const p = profil(rep);
    if (nouveau) {
      envoyer('fin', 'fin', { branche: p, reponses: garder(rep) });
      ecrire({ rep: garder(rep), profil: p, pseudo: ctx.commentateur || null });
    }
    racine.querySelector('.qx-barre').classList.add('qx-cache');
    racine.querySelector('.qx-etape').classList.add('qx-cache');
    relancerAnimation();
    // Fin en mode nuit : toute la page sur la page bio, la carte seule sur une page ressource (la ressource reste claire)
    racine.classList.add('qx-nuit');
    if (TYPE === 'claude') nuit(true);
    const offre = p === 'contenu' || p === 'lancement';
    // Un profil nommé d'après le rythme sur les réseaux : la personne se reconnaît avant de lire l'offre
    const PROFILS = {
      souvent: ['Créateur régulier', 'Tu postes déjà souvent : on te rend les heures que ça te prend.'],
      parfois: ['Créateur pressé', 'Tu as des choses à dire, pas le temps de tout faire : c\'est exactement ce qu\'on automatise.'],
      pas_encore: ['Créateur en devenir', 'Tout est à lancer : on monte ta création de contenu avec toi.'],
    };
    const [nom, phrase] = PROFILS[rep.reseaux] || PROFILS.parfois;
    let html = offre ? `<div class="qx-badge"><span>Ton profil</span><b>${nom}</b></div>`
      : `<div class="qx-ok">C'est noté, merci pour tes réponses</div>`;

    if (offre) {
      const appel = CONFIG.CALENDLY + (CONFIG.CALENDLY.includes('?') ? '&' : '?') + new URLSearchParams({
        utm_source: 'questionnaire', utm_medium: ctx.source, utm_campaign: ctx.mot_cle || TYPE, utm_term: p, utm_content: session }).toString();
      // Le plan se colle aux freins cochés : l'étape qui règle un blocage le dit
      const freins = rep.freins || [];
      const vise = cles => cles.some(c => freins.includes(c));
      const etapes = [
        ['1', 'Les idées', 'Les sujets qui marchent déjà dans ta niche, trouvés pour toi.', vise(['idees', 'vues'])],
        ['2', 'Les scripts', 'Écrits pour toi, avec ta façon de parler, prêts à tourner.', vise(['scripts', 'camera'])],
        ['3', 'Le montage', 'Tes vidéos montées, prêtes à poster.', vise(['montage', 'rythme'])],
      ];
      html += `<div class="qx-cta">
        <h2 class="qx-h2">On automatise <span>ta création de contenu</span></h2>
        <p class="qx-objectif"><i>🎯</i><span>Objectif : <b>être visible sur les réseaux</b></span></p>
        <p class="qx-phrase">${phrase}</p>
        <ol class="qx-plan">${etapes.map(([n, t, d, cible], k) => `<li style="--i:${k}" class="${cible ? 'qx-cible' : ''}"><i>${n}</i><span><b>${t}${cible ? '<small>ton blocage</small>' : ''}</b>${d}</span></li>`).join('')}</ol>
        <ul class="qx-plus">
          <li><i>+</i><span><b>Et bien d'autres</b> (carrousels, stories, posts automatiques…) selon ce dont tu as besoin</span></li>
          <li><i>✓</i><span><b>On t'accompagne</b> jusqu'à ce que tu sois visible avec ton activité et à l'aise avec ces automatisations</span></li>
        </ul>
        <p class="qx-methode">Tout tourne sur <b>ton</b> Claude, avec la méthode qu'on utilise pour nos propres vidéos.</p>
        <div class="qx-humain"><img src="${PHOTO}" alt="" width="34" height="34"><p>En appel, on regarde <em>ta situation</em> et si on est les bons pour t'aider. Tu parles directement à l'un de nous deux.</p></div>
        <a class="qx-wa qx-appel" data-clic="appel" href="${appel}" target="_blank" rel="noopener"><span>Réserver mon appel</span><i aria-hidden="true">→</i></a>
        <p class="qx-sous-cta">30 min en visio · sans engagement</p>
        <div class="qx-timide"><p>Pas envie d'un appel ? Une question ? Écris-nous <b>CRÉATION</b> en DM, on te répond directement.</p>
        ${boutonDm('CRÉATION', 'dm_creation', false)}</div></div>`;
    } else if (p === 'surmesure') {
      html += `<div class="qx-cta"><h2 class="qx-h2">Ça, c'est du <span>sur-mesure</span></h2>
        <p>Automatiser autre chose que ta création de contenu dans ton business, on le fait au cas par cas. Écris-nous <b>SUR-MESURE</b> en DM et on regarde si on peut t'aider.</p>
        ${boutonDm('SUR-MESURE', 'dm_surmesure', true)}</div>`;
    } else {
      const interesse = rep.school === 'oui' || rep.school === 'peut_etre';
      const prevenu = interesse ? 'Dès que la plateforme ouvre, on te prévient sur ' + reseau + '. ' : '';
      const suite = TYPE === 'ressource'
        ? (interesse ? 'En attendant, ta ressource est juste en dessous.' : 'Ta ressource est juste en dessous.')
        : (interesse ? 'En attendant, n' : 'N') + 'otre guide pour installer Claude et bien démarrer : l\'installation, le prompt qui fait tout à ta place et les pièges à éviter.';
      html += `<div class="qx-cta">
        <h2 class="qx-h2">${interesse ? 'On te prévient <span>en premier</span>' : 'Commence <span>dès aujourd\'hui</span>'}</h2>
        <p>${prevenu}${suite}</p>
        ${TYPE === 'claude' ? `<a class="qx-wa" data-clic="guide" href="${CONFIG.GUIDE}" target="_blank" rel="noopener">Ouvrir le guide</a>` : ''}</div>`;
    }
    if (TYPE === 'ressource') html += `<button type="button" class="qx-res${offre ? '' : ' qx-res-plein'}">${offre ? 'Non merci, accéder directement à ma ressource' : '📄 Voir ma ressource'}</button>`;
    html += `<p class="qx-rgpd">Tes réponses servent seulement à te proposer ce qui te correspond. Tu peux demander à les voir ou à les effacer à tout moment en nous écrivant.</p>`;
    if (!nouveau) html += `<button type="button" class="qx-retour qx-refaire">Refaire le questionnaire</button>`;
    zone.innerHTML = html;
    zone.dataset.style = 'fin';
    if (nouveau && offre) setTimeout(confettis, 250);

    zone.querySelectorAll('[data-clic]').forEach(a => a.addEventListener('click', () => {
      envoyer('clic', a.dataset.clic, null);
      if (a.dataset.copie && navigator.clipboard) navigator.clipboard.writeText(a.dataset.copie).catch(() => {});
    }));
    const res = zone.querySelector('.qx-res');
    if (res) res.onclick = () => { envoyer('clic', 'ressource', { branche: p }); reveler(); };
    const refaire = zone.querySelector('.qx-refaire');
    if (refaire) refaire.onclick = () => {
      oublier(); Object.keys(rep).forEach(k => delete rep[k]); MULTI.forEach(id => { rep[id] = []; });
      pile.length = 0; reaction = '';
      racine.classList.remove('qx-nuit'); nuit(false);
      if (!qs.get('c')) ctx.commentateur = null;
      caches.forEach(el => el.classList.add('qx-cache'));
      afficher('priorite');
    };
    remonter();
  }

  // Fond noir avec une lueur orange, posé sous la page (la grille claire reste dessous, invisible)
  let fondNuit = null;
  const couleurTheme = document.querySelector('meta[name="theme-color"]'), themeJour = couleurTheme && couleurTheme.content;
  function nuit(on) {
    if (on && !fondNuit) {
      fondNuit = document.createElement('div'); fondNuit.className = 'qx-nuit-fond'; fondNuit.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(fondNuit, document.body.firstChild);
    }
    document.documentElement.classList.toggle('qx-nuit-page', on);
    if (couleurTheme) couleurTheme.content = on ? '#0d0907' : themeJour;
  }

  function reveler() {
    caches.forEach(el => el.classList.remove('qx-cache'));
    const cible = caches[0];
    if (cible) setTimeout(() => cible.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    const res = zone.querySelector('.qx-res');
    if (res) res.remove();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monter); else monter();
})();
