/* Questionnaires d'acquisition Momentum (Ressource et Claude).
   Inclusion : <script src="questionnaire.js" data-questionnaire="ressource" data-contenu=".wrap" defer></script>
   - data-questionnaire : "ressource" (en haut d'une page ressource) ou "claude" (page dédiée).
   - data-contenu (ressource seulement) : le bloc qui contient la ressource ; il est masqué pendant les questions, puis affiché.
   Paramètres du lien : ?src=instagram|tiktok&mot=prompt&v=<id vidéo>&c=<id opaque du commentateur>&var=A|B&test=1
   Chaque étape part dans la table hub_questionnaire_evenements (ajout seul). Si l'envoi échoue, la page continue normalement. */
(function () {
  'use strict';

  // ---- Réglages à vérifier avant la mise en ligne ----
  const CONFIG = {
    SUPABASE_URL: 'https://wpyiyqgfdjsrkyljtgmr.supabase.co',
    CLE_PUBLIQUE: 'sb_publishable_s-blQHu77BdzcqYbu2agww_4l8Wsbwy', // clé publique : ne permet que d'ajouter des lignes dans la table des questionnaires
    WHATSAPP: '33769312080',                                       // numéro WhatsApp de Pablo, format international sans +
    CALENDLY: 'https://calendly.com/pablo-romero-floxatek/30min',  // Calendly de Pablo : « Découverte de ton business et conseils perso », lun-sam 9h-19h heure de Paris
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
    mot_cle: propre(qs.get('mot') || (TYPE === 'claude' ? 'claude' : ''), 40).toLowerCase() || null,
    video_id: propre(qs.get('v'), 64) || null,
    commentateur: propre(qs.get('c'), 64) || null,
    variante: /^[A-Z0-9_-]{1,12}$/.test((qs.get('var') || '').toUpperCase()) ? qs.get('var').toUpperCase() : 'A',
    est_test: qs.get('test') === '1',
  };
  const session = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16));

  // ---- Envoi d'un événement (jamais bloquant) ----
  function envoyer(type, etape, valeur) {
    const ligne = { session_id: session, questionnaire: TYPE, variante: ctx.variante, source: ctx.source, mot_cle: ctx.mot_cle,
      video_id: ctx.video_id, commentateur: ctx.commentateur, type, etape, valeur: valeur || null, est_test: ctx.est_test };
    try {
      fetch(CONFIG.SUPABASE_URL + '/rest/v1/hub_questionnaire_evenements', {
        method: 'POST', keepalive: true,
        headers: { apikey: CONFIG.CLE_PUBLIQUE, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(ligne),
      }).catch(() => {});
    } catch (e) { /* on ne bloque jamais la personne */ }
  }

  // ---- Contenus ----
  const NIVEAU = { titre: 'Ton niveau avec <span>Claude</span> ?', sous: 'Pas de mauvaise réponse.', choix: [
    ['jamais', '👶', 'Jamais utilisé'], ['chat', '💭', 'Le chat de temps en temps'], ['quotidien', '⚡', 'Tous les jours'], ['claude_code', '🧑‍💻', 'J\'utilise déjà Claude Code']] };
  const OBJECTIF_LANCE = { titre: 'Ton <span>objectif</span> avec Claude ?', sous: 'Celui qui compte le plus pour toi.', choix: [
    ['lancer_business', '🚀', 'Lancer mon business avec l\'IA'], ['premiers_clients', '🔎', 'Trouver mes premiers clients'],
    ['contenu_ia', '🎬', 'Créer du contenu avec l\'IA'], ['apprendre', '📚', 'Apprendre Claude de zéro'], ['autre', '✨', 'Autre']] };
  const ASSISTANTS = {
    lance: [['veille_script', 'Trouver les vidéos qui cartonnent dans ma niche et en faire mes scripts'], ['montage', 'Monter mes vidéos automatiquement'],
      ['ecriture', 'Écrire mes posts et mes messages avec ma voix, sans que ça sonne IA'], ['prospection', 'Trouver mes premiers clients et préparer mes messages de prospection'],
      ['offre', 'Construire mon offre et ma page de vente'], ['autre', 'Autre']],
    salarie: [['mails', 'Trier et répondre à mes mails'], ['reunions', 'Préparer mes réunions et mes comptes rendus'], ['documents', 'Faire mes présentations et mes documents'],
      ['tableaux', 'Analyser mes fichiers et mes tableaux'], ['actu', 'Suivre l\'actu de mon secteur sans y passer des heures'], ['autre', 'Autre']],
    perso: [['apprendre', 'Apprendre Claude de zéro, pas à pas'], ['contenu', 'Créer du contenu avec l\'IA'], ['organisation', 'M\'organiser au quotidien'],
      ['projet', 'Lancer un projet perso ou un business (IA ou autre)'], ['autre', 'Autre']],
  };

  const DEF = {
    ressource: {
      pill: () => 'Tu as commenté ' + (ctx.mot_cle || 'la vidéo').toUpperCase(),
      Q: {
        pourquoi: { titre: 'Tu veux la ressource pour <span>quoi</span> ?', sous: 'Réponds à ces quelques questions et ta ressource s\'affiche directement.', choix: [
          ['business_coach', '🎯', 'Mon business de coach, formateur ou créateur'], ['business_autre', '💼', 'Mon business (autre activité)'],
          ['lance', '🚀', 'Je lance mon business'], ['salarie', '🏢', 'Mon travail (salarié)'], ['perso', '🙂', 'Par curiosité, pour du perso']] },
        douleur: { titre: 'Qu\'est-ce qui te prend le plus de <span>temps</span> ?', sous: 'Aujourd\'hui, dans ta semaine.', choix: [
          ['messages_relances', '💬', 'Répondre aux messages et relancer'], ['contenu', '🎬', 'Créer du contenu'], ['admin', '🧾', 'Devis, factures, mails'],
          ['suivi_clients', '🤝', 'Suivre mes clients'], ['trouver_clients', '🔎', 'Trouver des clients'], ['autre', '✨', 'Autre']] },
        douleur_salarie: { titre: 'Qu\'est-ce qui te prend le plus de <span>temps</span> ?', sous: 'Au travail, dans ta semaine.', choix: [
          ['mails', '📨', 'Mes mails'], ['reunions', '🗓️', 'Les réunions et les comptes rendus'], ['documents', '📄', 'Les présentations et les documents'],
          ['tableaux', '📊', 'Les fichiers et les tableaux'], ['autre', '✨', 'Autre']] },
        objectif: OBJECTIF_LANCE,
        niveau: NIVEAU,
      },
      chemin(r) {
        if (!r.pourquoi) return ['pourquoi'];
        if (r.pourquoi === 'business_coach' || r.pourquoi === 'business_autre') return ['pourquoi', 'douleur', 'niveau'];
        if (r.pourquoi === 'lance') return ['pourquoi', 'objectif', 'niveau'];
        if (r.pourquoi === 'salarie') return ['pourquoi', 'douleur_salarie', 'niveau'];
        return ['pourquoi', 'niveau'];
      },
      branche: r => (r.pourquoi === 'business_coach' || r.pourquoi === 'business_autre') ? 'A' : 'B',
      liste: r => r.pourquoi === 'lance' ? 'lance' : r.pourquoi === 'salarie' ? 'salarie' : 'perso',
    },
    claude: {
      pill: () => 'Tu as écrit CLAUDE',
      Q: {
        situation: { titre: 'Où en est ton <span>business</span> ?', sous: 'Une minute, que des cases à cocher.', choix: [
          ['business_coach', '🎯', 'J\'ai un business de coach, formateur ou créateur'], ['business_autre', '💼', 'J\'ai un business (autre activité)'],
          ['lance', '🚀', 'Je lance mon business'], ['sans_business', '🙂', 'Je n\'ai pas de business']] },
        activite: { titre: 'Tu fais <span>quoi</span> ?', sous: 'Pour te parler de ton métier, pas d\'un autre.', choix: [
          ['freelance', '💻', 'Freelance ou consultant'], ['local', '🏪', 'Commerce ou service local'], ['agence', '🏢', 'Agence ou prestataire pour entreprises'], ['autre', '✨', 'Autre']] },
        taches: { multi: true, titre: 'Tu voudrais que Claude fasse <span>quoi</span> à ta place ?', sous: 'Coche tout ce qui compte pour toi.', choix: r => TACHES[familleTaches(r)] },
        objectif: { titre: 'Ton <span>objectif</span> dans 3 mois ?', sous: 'Celui qui compte le plus.', choix: [
          ['chiffre', '💰', 'Faire plus de chiffre sans travailler plus'], ['clients_perdus', '🙌', 'Ne plus perdre de clients faute de temps'],
          ['temps', '⏱️', 'Récupérer du temps pour moi'], ['cap', '🚀', 'Passer un cap pour faire grandir mon business']] },
        ia: { titre: 'Où tu en es avec l\'<span>IA</span> ?', sous: 'Pas de mauvaise réponse.', choix: [
          ['rien', '👶', 'Je n\'ai encore rien essayé'], ['chat', '💭', 'J\'utilise ChatGPT ou Claude en chat'],
          ['automatisations', '🔗', 'J\'ai déjà automatisé des choses (Zapier, Make…)'], ['claude_code', '🧑‍💻', 'J\'utilise déjà Claude Code']] },
        urgence: { titre: 'Tu voudrais que ce soit en place <span>quand</span> ?', sous: 'Pour savoir comment on s\'organise.', choix: [
          ['vite', '⚡', 'Le plus vite possible'], ['mois', '📅', 'Dans le mois'], ['trimestre', '🗓️', 'Dans les 3 mois'], ['renseigne', '👀', 'Je me renseigne']] },
        decision: { titre: 'Tu prends cette <span>décision</span> seul ?', sous: 'Comme ça, on invite les bonnes personnes.', choix: [
          ['seul', '✅', 'Oui, seul'], ['associe', '🤝', 'Avec un associé'], ['en_parler', '💬', 'Je dois en parler à quelqu\'un']] },
        objectif_lance: OBJECTIF_LANCE,
        pour_quoi: { titre: 'Tu voudrais Claude pour <span>quoi</span> ?', sous: 'Ce qui te parle le plus.', choix: [
          ['salarie', '🏢', 'Mon travail (salarié)'], ['apprendre', '📚', 'Apprendre à m\'en servir'], ['perso', '🧩', 'Un projet perso']] },
        niveau: NIVEAU,
      },
      chemin(r) {
        if (!r.situation) return ['situation'];
        if (r.situation === 'business_coach') return ['situation', 'taches', 'objectif', 'ia', 'urgence', 'decision'];
        if (r.situation === 'business_autre') return ['situation', 'activite', 'taches', 'objectif', 'ia', 'urgence', 'decision'];
        if (r.situation === 'lance') return ['situation', 'objectif_lance', 'niveau'];
        return ['situation', 'pour_quoi', 'niveau'];
      },
      branche: r => (r.situation === 'business_coach' || r.situation === 'business_autre') ? 'A' : 'B',
      liste: r => r.situation === 'lance' ? 'lance' : r.pour_quoi === 'salarie' ? 'salarie' : 'perso',
    },
  };
  const TACHES = {
    coach: [['messages_relances', '💬', 'Répondre aux messages et relancer'], ['contenu', '🎬', 'Créer mon contenu'],
      ['suivi_clients', '🤝', 'Suivre mes clients (accueil, rappels, bilans)'], ['preparer_seances', '🗒️', 'Préparer mes appels et mes séances'],
      ['admin', '🧾', 'Devis, factures, mails'], ['autre', '✨', 'Autre']],
    b2b: [['prospection', '🔎', 'Trouver des clients et prospecter'], ['propositions', '📑', 'Faire mes propositions et mes devis'],
      ['reporting', '📊', 'Faire mes comptes rendus et mon reporting'], ['mails', '📨', 'Répondre à mes mails'], ['contenu', '🎬', 'Créer mon contenu'], ['autre', '✨', 'Autre']],
    local: [['rdv', '📅', 'Gérer les rendez-vous et les réservations'], ['messages_avis', '💬', 'Répondre aux messages et aux avis'],
      ['admin', '🧾', 'Faire mes devis et mes factures'], ['reseaux', '📱', 'Poster sur les réseaux'], ['autre', '✨', 'Autre']],
    autre: [['messages_relances', '💬', 'Répondre aux messages et relancer'], ['contenu', '🎬', 'Créer mon contenu'],
      ['admin', '🧾', 'Devis, factures, mails'], ['suivi_clients', '🤝', 'Suivre mes clients'], ['trouver_clients', '🔎', 'Trouver des clients'], ['autre', '✨', 'Autre']],
  };
  function familleTaches(r) {
    if (r.situation === 'business_coach') return 'coach';
    if (r.activite === 'freelance' || r.activite === 'agence') return 'b2b';
    return r.activite === 'local' ? 'local' : 'autre';
  }

  // ---- Mise en place ----
  const D = DEF[TYPE];
  const rep = { taches: [] };
  const pile = [];
  const cleMemoire = 'qx_' + TYPE + '_' + (ctx.mot_cle || 'x');
  const lire = () => { try { return JSON.parse(localStorage.getItem(cleMemoire) || 'null'); } catch (e) { return null; } };
  const ecrire = v => { try { localStorage.setItem(cleMemoire, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } };

  const racine = document.createElement('section');
  racine.id = 'qx';
  racine.innerHTML = `<span class="qx-pill"></span><div class="qx-barre"><i></i></div><div class="qx-etape"></div><div class="qx-ecran"></div>`;
  const zone = racine.querySelector('.qx-ecran');
  racine.querySelector('.qx-pill').textContent = D.pill();

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
    if (deja && deja.rep) { Object.assign(rep, deja.rep); fin(false); } else afficher(D.chemin(rep)[0]);
  }

  function progression(id) {
    const c = D.chemin(rep), n = c.length, i = id === 'fin' ? n : c.indexOf(id);
    racine.querySelector('.qx-barre i').style.width = Math.round(100 * i / n) + '%';
    racine.querySelector('.qx-etape').textContent = id === 'fin' ? 'Terminé' : n === 1 ? 'Question 1' : `Question ${i + 1} sur ${n}`;
  }
  function remonter() { const y = racine.getBoundingClientRect().top + window.scrollY - 16; if (window.scrollY > y) window.scrollTo(0, Math.max(0, y)); }
  function relancerAnimation() { zone.classList.remove('qx-ecran'); void zone.offsetWidth; zone.classList.add('qx-ecran'); }
  function suivant(id) { const c = D.chemin(rep), i = c.indexOf(id); return i + 1 < c.length ? c[i + 1] : 'fin'; }
  // Le @ Instagram, seulement quand le lien ne dit pas qui c'est (envoi à la main).
  // Quand l'outil d'envoi met ?c= dans le lien, cet écran n'apparaît plus.
  let pseudoDemande = false;
  function demanderPseudo() {
    pseudoDemande = true;
    racine.querySelector('.qx-barre i').style.width = '96%';
    racine.querySelector('.qx-etape').textContent = 'Dernière étape';
    relancerAnimation(); remonter();
    zone.innerHTML = `<h1 class="qx-h1">Dernière chose : ton <span>@ Instagram</span> ?</h1>
      <p class="qx-sous">Comme ça, on sait que c'est toi quand on te répond.</p>
      <label class="qx-champ"><span>@</span><input type="text" id="qx-pseudo" inputmode="text" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="31" placeholder="ton_pseudo"></label>
      <p class="qx-erreur" id="qx-erreur" role="alert"></p>
      <button type="button" class="qx-go" id="qx-valider">${TYPE === 'ressource' ? 'Voir ma ressource' : 'Voir la suite'}</button>
      <div class="qx-ligne"><button type="button" class="qx-retour">‹ Retour</button><button type="button" class="qx-retour" id="qx-passer">Passer</button></div>`;
    const champ = zone.querySelector('#qx-pseudo'), erreur = zone.querySelector('#qx-erreur');
    const valider = () => {
      const p = champ.value.trim().replace(/^@+/, '').toLowerCase();
      if (!p) { erreur.textContent = 'Écris ton @, ou touche « Passer ».'; return; }
      if (!/^[a-z0-9._]{1,30}$/.test(p)) { erreur.textContent = 'Un @ Instagram : lettres, chiffres, points et tirets bas.'; return; }
      ctx.commentateur = p;
      envoyer('reponse', 'pseudo', { v: p });
      fin(true);
    };
    champ.oninput = () => { erreur.textContent = ''; };
    champ.onkeydown = e => { if (e.key === 'Enter') valider(); };
    zone.querySelector('#qx-valider').onclick = valider;
    zone.querySelector('#qx-passer').onclick = () => { envoyer('clic', 'pseudo_passe', null); fin(true); };
    zone.querySelector('.qx-retour').onclick = () => { pseudoDemande = false; afficher(pile.pop()); };
  }

  function afficher(id) {
    if (id === 'fin') return (!ctx.commentateur && !pseudoDemande) ? demanderPseudo() : fin(true);
    progression(id); relancerAnimation();
    remonter();
    const q = D.Q[id];
    const choix = typeof q.choix === 'function' ? q.choix(rep) : q.choix;
    const actif = v => q.multi ? rep[id].includes(v) : rep[id] === v;
    zone.innerHTML = `<h1 class="qx-h1">${q.titre}</h1><p class="qx-sous">${q.sous}</p><div class="qx-choix">${choix.map(([v, e, t]) =>
      `<button type="button" data-v="${v}" class="${actif(v) ? 'qx-on' : ''}"><span class="qx-em">${e}</span>${t}</button>`).join('')}</div>` +
      (q.multi ? `<button type="button" class="qx-go" ${rep[id].length ? '' : 'disabled'}>Continuer</button>` : '') +
      (pile.length ? `<button type="button" class="qx-retour">‹ Retour</button>` : '');
    zone.querySelectorAll('.qx-choix button').forEach(b => b.onclick = () => {
      const v = b.dataset.v;
      if (q.multi) {
        rep[id] = rep[id].includes(v) ? rep[id].filter(x => x !== v) : [...rep[id], v];
        b.classList.toggle('qx-on'); zone.querySelector('.qx-go').disabled = !rep[id].length;
        return;
      }
      rep[id] = v; b.classList.add('qx-on');
      envoyer('reponse', id, { v });
      setTimeout(() => { pile.push(id); afficher(suivant(id)); }, 160);
    });
    if (q.multi) zone.querySelector('.qx-go').onclick = () => { envoyer('reponse', id, { v: rep[id] }); pile.push(id); afficher(suivant(id)); };
    const r = zone.querySelector('.qx-retour');
    if (r) r.onclick = () => afficher(pile.pop());
  }

  const libelle = (liste, v) => { const c = liste.find(x => x[0] === v); return c ? c[2].toLowerCase() : ''; };

  function fin(nouveau) {
    const b = D.branche(rep);
    if (nouveau) { envoyer('fin', 'fin', { branche: b }); ecrire({ rep, branche: b }); }
    racine.querySelector('.qx-barre').classList.add('qx-cache');
    racine.querySelector('.qx-etape').classList.add('qx-cache');
    if (TYPE === 'ressource') racine.querySelector('.qx-pill').classList.add('qx-cache');
    relancerAnimation();
    let html = `<div class="qx-ok">${TYPE === 'ressource' ? 'C\'est bon, ta ressource est juste en dessous' : 'C\'est noté, merci pour tes réponses'}</div>`;
    if (b === 'A' && TYPE === 'ressource') {
      const d = rep.douleur && rep.douleur !== 'autre' ? ` Ce qui me prend le plus de temps : ${libelle(D.Q.douleur.choix, rep.douleur)}.` : '';
      const msg = `Salut ! Je viens de la vidéo « ${(ctx.mot_cle || '').toUpperCase()} ». Je veux mon plan d'automatisation perso.${d}`;
      html += `<div class="qx-cta"><span class="qx-pill">Offert</span><h2 class="qx-h2">Ton plan d'automatisation, <span>fait pour ton business</span></h2>
        <p>Écris-nous sur WhatsApp. On te pose 3 questions sur ton activité, puis on t'envoie ton plan perso : les tâches que Claude peut faire à ta place, dans quel ordre, et comment les mettre en place.</p>
        <a class="qx-wa" data-clic="whatsapp" href="https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">💬 Je veux mon plan sur WhatsApp</a></div>`;
    } else if (b === 'A') {
      const lib = rep.taches.filter(t => t !== 'autre').map(t => libelle(TACHES[familleTaches(rep)], t));
      const phrase = lib.length ? ` J'aimerais que Claude m'aide à : ${lib.join(', ')}.` : '';
      const msg = `Salut ! J'ai répondu au questionnaire CLAUDE. J'aimerais qu'on regarde ensemble ce que Claude peut faire à ma place.${phrase}`;
      const appel = CONFIG.CALENDLY + (CONFIG.CALENDLY.includes('?') ? '&' : '?') + new URLSearchParams({
        utm_source: 'questionnaire', utm_medium: ctx.source, utm_campaign: ctx.mot_cle || 'claude', utm_content: session }).toString();
      html += `<div class="qx-cta"><span class="qx-pill">Ton appel</span><h2 class="qx-h2">On regarde <span>ton business</span> ensemble</h2>
        <p>On regarde ce que Claude peut faire à ta place dans ton business, et si on est les bons pour t'aider.</p>
        <a class="qx-wa qx-appel" data-clic="appel" href="${appel}" target="_blank" rel="noopener">📅 Je réserve mon appel</a>
        <a class="qx-wa2" data-clic="whatsapp" href="https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">💬 Je préfère écrire sur WhatsApp</a></div>`;
    } else {
      html += `<div class="qx-cta"><span class="qx-pill">Avant-première</span><h2 class="qx-h2">Ton Claude, <span>prêt à bosser pour toi</span></h2>
        <p>Des assistants qui s'installent tout seuls sur ton Claude. On choisit en ce moment lesquels sortir en premier : coche ceux qui te feraient vraiment gagner du temps, les plus demandés passent devant.</p>
        <div class="qx-zone"></div></div>`;
      if (TYPE === 'claude') html += `<div class="qx-guide"><p><b>Installe Claude et commence aujourd'hui.</b> Notre guide gratuit : l'installation, le prompt qui fait tout à ta place et les pièges à éviter.</p>
        <a data-clic="guide" href="${CONFIG.GUIDE}" target="_blank" rel="noopener">Ouvrir le guide</a></div>`;
    }
    if (TYPE === 'ressource') html += `<a class="qx-vers" href="#qx-ressource">Ta ressource ↓</a>`;
    html += `<p class="qx-rgpd">Tes réponses servent seulement à t'envoyer ce qui te correspond. Tu peux demander à les voir ou à les effacer à tout moment en nous écrivant.</p>`;
    zone.innerHTML = html;
    zone.querySelectorAll('[data-clic]').forEach(a => a.addEventListener('click', () => envoyer('clic', a.dataset.clic, null)));
    if (b === 'B') encadre(zone.querySelector('.qx-zone'));
    if (TYPE === 'ressource') reveler(b);
    remonter();
  }

  function encadre(z) {
    const liste = ASSISTANTS[D.liste(rep)];
    const precoche = rep.douleur_salarie && rep.douleur_salarie !== 'autre' && liste.some(c => c[0] === rep.douleur_salarie) ? [rep.douleur_salarie] : [];
    let interets = precoche.slice();
    const fait = () => { z.innerHTML = `<button type="button" class="qx-prev qx-fait" disabled>✓ C'est noté, on te prévient dès qu'ils sortent</button>`; };
    const deja = lire();
    if (deja && deja.avant_premiere) return fait();
    z.innerHTML = `<button type="button" class="qx-prev">Ça m'intéresse</button>`;
    z.querySelector('.qx-prev').onclick = () => {
      envoyer('clic', 'ouvrir_interets', null);
      z.innerHTML = `<div class="qx-cases">${liste.map(([v, t]) =>
        `<label><input type="checkbox" value="${v}" ${interets.includes(v) ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div>
        <button type="button" class="qx-prev" ${interets.length ? '' : 'disabled'}>Je veux l'avant-première</button>
        <p class="qx-note">On te prévient sur Instagram dès qu'ils sortent. Tu peux nous dire stop à tout moment.</p>`;
      const valider = z.querySelector('.qx-prev');
      z.querySelectorAll('input').forEach(i => i.onchange = () => {
        interets = [...z.querySelectorAll('input:checked')].map(x => x.value);
        valider.disabled = !interets.length;
      });
      valider.onclick = () => {
        envoyer('clic', 'avant_premiere', { interets });
        const m = lire() || {}; m.avant_premiere = true; ecrire(m);
        fait();
      };
    };
  }

  let revele = false;
  function reveler(b) {
    if (revele) return; revele = true;
    caches.forEach(el => el.classList.remove('qx-cache'));
    if (caches[0]) caches[0].id = caches[0].id || 'qx-ressource';
    const ancre = racine.querySelector('.qx-vers');
    if (ancre && caches[0]) ancre.setAttribute('href', '#' + caches[0].id);
    if (b === 'B' && caches.length) {
      const rappel = document.createElement('p');
      rappel.className = 'qx-rappel';
      rappel.innerHTML = 'Envie que Claude bosse pour toi ? <a href="#qx">Coche ce qui t\'intéresse ↑</a>';
      racine.parentNode.appendChild(rappel);
    }
    // « ressource » = la personne a fait défiler jusqu'au contenu (le haut du premier bloc passe au-dessus du milieu de l'écran)
    const repere = caches[caches.length > 1 ? 1 : 0];
    if (repere) {
      const verifier = () => {
        if (repere.getBoundingClientRect().top < window.innerHeight * 0.5) { envoyer('clic', 'ressource', null); window.removeEventListener('scroll', verifier); }
      };
      window.addEventListener('scroll', verifier, { passive: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monter); else monter();
})();
