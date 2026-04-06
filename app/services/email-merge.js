/**
 * Fusion template ↔ ligne contact (colonnes importées) pour le moteur Blast.
 * Réutilise InvooEmailEditor.applyVars — même syntaxe {{variable}} qu’en éditeur.
 * Conseils anti-spam légers : lintOutgoingEmail (heuristiques, pas un score garanti).
 */
(function (global) {
  'use strict';

  /** Même règle que l’en-tête de colonne importée : « Société » / « Prénom » → societe, prenom. */
  function headerLabelToMergeKey(label) {
    return String(label || '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  /** Libellés [Société] / colonnes CSV reconnus comme champs de fusion (liste blanche). */
  const MERGE_KNOWN_KEYS = new Set([
    'prenom',
    'nom',
    'nom_complet',
    'email',
    'email_reply_to',
    'telephone',
    'ville',
    'fonction',
    'societe',
    'organisation',
    'domaine',
    'adresse_ligne',
    'code_postal',
    'pays',
    'site_web',
    'lien_cv',
    'whatsapp_lien',
    'whatsapp_link',
    'signature',
    'email_contact',
    'lien_desinscription',
    'poste_vise',
    'public',
    'cv_html'
  ]);

  /**
   * Normalise les clés de colonnes (Excel) : minuscules, espaces → underscores.
   * Ex. "Prénom" → prenom, "Poste visé" → poste_vise (accents retirés côté clé).
   * @param {Record<string, unknown>} row
   */
  function normalizeFieldMap(row) {
    const out = {};
    if (!row || typeof row !== 'object') return out;
    for (const [k, v] of Object.entries(row)) {
      const key = headerLabelToMergeKey(k);
      if (!key) continue;
      out[key] = v == null ? '' : String(v);
    }
    return out;
  }

  /**
   * Nettoie le HTML du CV (profil local) : garde un fragment sûr pour l’aperçu/l’envoi.
   * @param {string} html
   */
  function sanitizeCvHtml(html) {
    let s = String(html || '');
    const bodyMatch = s.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) s = bodyMatch[1];
    s = s.replace(/<!doctype[^>]*>/gi, '');
    s = s.replace(/<\/?html[^>]*>/gi, '');
    s = s.replace(/<\/?head[^>]*>/gi, '');
    s = s.replace(/<\/?body[^>]*>/gi, '');
    s = s.replace(/<meta\b[^>]*>/gi, '');
    s = s.replace(/<title\b[^<]*(?:(?!<\/title>)<[^<]*)*<\/title>/gi, '');
    s = s.replace(/<link\b[^>]*>/gi, '');
    s = s.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    s = s.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    s = s.replace(/javascript:/gi, '');
    return s.trim();
  }

  function profileCvRawHtml(profile) {
    const p = profile && typeof profile === 'object' ? profile : {};
    const variants = Array.isArray(p.cvHtmlVariants) ? p.cvHtmlVariants : [];
    const selId = p.selectedCvHtmlId != null ? String(p.selectedCvHtmlId).trim() : '';
    let raw = '';
    if (variants.length) {
      const found = variants.find((v) => v && String(v.id) === selId);
      if (found && found.html != null) raw = String(found.html);
      else if (variants[0] && variants[0].html != null) raw = String(variants[0].html);
    }
    if (!raw && p.cvHtml != null) raw = String(p.cvHtml);
    return sanitizeCvHtml(raw);
  }

  /** {{whatsapp_link}} et {{whatsapp_lien}} pointent vers le même lien (aperçu / listes). */
  function aliasWhatsAppFields(data) {
    const d = data && typeof data === 'object' ? { ...data } : {};
    const wa = d.whatsapp_lien || d.whatsapp_link;
    if (wa) {
      const s = String(wa);
      d.whatsapp_lien = s;
      d.whatsapp_link = s;
    }
    return d;
  }

  /** Saisie brute type [societe] ou {{societe}} dans une cellule importée : traitée comme vide. */
  function looksLikeLiteralPlaceholder(s) {
    const t = String(s || '').trim();
    if (!t) return false;
    if (/^\{\{\s*[a-zA-Z][a-zA-Z0-9_]*\s*\}\}$/.test(t)) return true;
    if (/^\[\s*[a-zA-Z][a-zA-Z0-9_]*\s*\]$/.test(t)) return true;
    return false;
  }

  function sanitizeMergeValue(v) {
    if (v == null) return '';
    const t = String(v).trim();
    if (looksLikeLiteralPlaceholder(t)) return '';
    return String(v);
  }

  function sanitizedMergeValues(map) {
    const out = {};
    if (!map || typeof map !== 'object') return out;
    for (const [k, v] of Object.entries(map)) {
      out[k] = sanitizeMergeValue(v);
    }
    return out;
  }

  /** Après fusion : enlève tout {{variable}} / {{@raw}} restant et [Libellé] reconnu comme champ fusion. */
  function stripResidualPlaceholders(text) {
    let s = String(text || '');
    for (let pass = 0; pass < 6; pass++) {
      let next = s.replace(/\{\{\@\s*([a-zA-Z0-9_]+)\s*\}\}/g, '');
      next = next.replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g, '');
      if (next === s) break;
      s = next;
    }
    s = s.replace(/\[\s*([^\]]+)\s*\]/g, (full, inner) => {
      const k = headerLabelToMergeKey(inner);
      return k && MERGE_KNOWN_KEYS.has(k) ? '' : full;
    });
    return s;
  }

  /**
   * @param {{ html?: string, subject?: string, replyTo?: string }} templateRow
   * @param {Record<string, unknown>} fieldMap — champs fusionnés (profil + contact)
   * @param {Record<string, string>|null} rawFieldMap — ex. { cv_html } inséré sans échappement (assaini avant)
   */
  function mergeTemplate(templateRow, fieldMap, rawFieldMap) {
    const editor = global.InvooEmailEditor;
    if (!editor || typeof editor.applyVars !== 'function') {
      throw new Error('InvooEmailEditor.applyVars indisponible.');
    }
    const applyHdr =
      typeof editor.applyVarsHeaders === 'function' ? editor.applyVarsHeaders : editor.applyVars;
    const data = aliasWhatsAppFields(sanitizedMergeValues(normalizeFieldMap(fieldMap)));
    const raw = rawFieldMap && typeof rawFieldMap === 'object' ? rawFieldMap : null;
    let html = editor.applyVars(templateRow.html || '', data, raw);
    let subject = applyHdr(templateRow.subject || '', data, null);
    let replyTo = templateRow.replyTo ? applyHdr(String(templateRow.replyTo), data, null).trim() : '';
    html = stripResidualPlaceholders(html);
    subject = stripResidualPlaceholders(subject).replace(/\s+/g, ' ').trim();
    replyTo = stripResidualPlaceholders(replyTo).trim();
    return { html, subject, replyTo };
  }

  /**
   * Profil puis contact : une valeur contact vide (ou seulement des espaces) ne remplace pas le profil.
   * Sinon une colonne CSV « Prénom » vide écrase {{prenom}} / {{nom}} du profil et l’objet part en [prenom] [nom].
   */
  function mergeProfileAndContactFields(fromProfile, fromContact) {
    const out = { ...(fromProfile && typeof fromProfile === 'object' ? fromProfile : {}) };
    if (!fromContact || typeof fromContact !== 'object') return out;
    for (const [k, v] of Object.entries(fromContact)) {
      let s = v == null ? '' : String(v).trim();
      if (looksLikeLiteralPlaceholder(s)) s = '';
      if (s !== '') out[k] = s;
    }
    return out;
  }

  /** Variante si le contact est stocké { email, fields: { … } }. */
  function mergeForContact(templateRow, contact) {
    const raw = contact && contact.fields && typeof contact.fields === 'object' ? contact.fields : contact;
    const data = { ...normalizeFieldMap(raw) };
    if (contact && contact.email) {
      data.email = data.email || String(contact.email);
    }
    return mergeTemplate(templateRow, data);
  }

  /**
   * Profil Paramètres → variables {{prenom}}, {{domaine}}, {{fonction}}, etc.
   * @param {Record<string, unknown>} profile
   */
  function normalizeHttpUrl(raw) {
    let s = String(raw || '').trim();
    if (!s) return '';
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
    return s;
  }

  /** Chiffres uniquement, pour wa.me/… */
  function phoneDigitsForWhatsApp(phone) {
    let d = String(phone || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.startsWith('00')) d = d.slice(2);
    return d;
  }

  function profileToTemplateFields(profile) {
    const p = profile && typeof profile === 'object' ? profile : {};
    const prenom = p.firstName == null ? '' : String(p.firstName);
    const nom = p.lastName == null ? '' : String(p.lastName);
    const site = normalizeHttpUrl(p.website);
    let lienCv = normalizeHttpUrl(p.cvUrl);
    if (!lienCv) lienCv = site;
    const waDigits = phoneDigitsForWhatsApp(p.phone);
    const whatsappLien = waDigits ? 'https://wa.me/' + waDigits : '';
    const identEmail = p.email == null ? '' : String(p.email).trim();
    const replyToProf = p.emailReplyTo == null ? '' : String(p.emailReplyTo).trim();
    /** Pied de page : préfère Reply-To (profil) ; sinon e-mail du profil. Jamais l’e-mail destinataire (colonne {{email}} en Blast). */
    const email_reply_to = replyToProf || identEmail;

    return {
      prenom,
      nom,
      nom_complet: [prenom, nom].filter(Boolean).join(' ').trim(),
      email: identEmail,
      email_reply_to,
      telephone: p.phone == null ? '' : String(p.phone),
      ville: p.city == null ? '' : String(p.city),
      fonction: p.jobTitle == null ? '' : String(p.jobTitle),
      societe: '',
      organisation: '',
      domaine: p.expertiseDomains == null ? '' : String(p.expertiseDomains),
      adresse_ligne: p.addressLine == null ? '' : String(p.addressLine),
      code_postal: p.postalCode == null ? '' : String(p.postalCode),
      pays: p.country == null ? '' : String(p.country),
      site_web: site,
      lien_cv: lienCv,
      whatsapp_lien: whatsappLien,
      whatsapp_link: whatsappLien
    };
  }

  /** Champ « Lien CV ou portfolio » (cvUrl) renseigné dans le profil Paramètres. */
  function hasCvPortfolioUrl(profile) {
    const p = profile && typeof profile === 'object' ? profile : {};
    return String(p.cvUrl || '').trim() !== '';
  }

  /**
   * Retire la ligne du bouton « Consulter mon CV » (#invoo-cv) des modèles de base INVOOBLAST.
   */
  function stripDefaultTemplateCvButtonRow(html) {
    let s = String(html || '');
    const marker = '<td align="center" style="padding:6px 36px 4px;">';
    const mi = s.indexOf(marker);
    if (mi === -1) return s;
    if (!/href="#invoo-cv"/.test(s.slice(mi, mi + 4000))) return s;
    const trStart = s.lastIndexOf('<tr>', mi);
    if (trStart === -1) return s;
    let i = trStart + 4;
    let depth = 1;
    const low = (j, tag) => s.slice(j, j + tag.length).toLowerCase() === tag;
    while (i < s.length && depth > 0) {
      if (low(i, '<tr>')) {
        depth++;
        i += 4;
      } else if (low(i, '</tr>')) {
        depth--;
        if (depth === 0) {
          const trEnd = i + 5;
          return s.slice(0, trStart) + s.slice(trEnd);
        }
        i += 5;
      } else {
        i++;
      }
    }
    return s;
  }

  /** Sans lien CV / portfolio (Paramètres) : masque le bouton ancre « Consulter mon CV » ; WhatsApp reste. */
  function stripCvButtonIfNoCvPortfolioUrl(html, profile) {
    if (hasCvPortfolioUrl(profile)) return String(html || '');
    return stripDefaultTemplateCvButtonRow(html);
  }

  /**
   * Profil local puis surcharge par la ligne contact importée (si présente).
   * @param {object} templateRow
   * @param {object|null|undefined} contact
   * @param {object|null|undefined} profileOverride — si défini (objet profil complet), utilisé à la place du profil actif Paramètres
   */
  async function mergeWithProfileAndContact(templateRow, contact, profileOverride) {
    const db = global.InvooBlastDB;
    let prof =
      profileOverride && typeof profileOverride === 'object' ? profileOverride : null;
    if (!prof) {
      if (global.InvooSettings && typeof global.InvooSettings.getProfile === 'function') {
        prof = await global.InvooSettings.getProfile();
      } else if (db) {
        prof = await db.getMeta('user_profile');
      }
    }
    const fromProfile = profileToTemplateFields(prof || {});
    const raw = contact && contact.fields && typeof contact.fields === 'object' ? contact.fields : contact;
    const fromContact = raw ? normalizeFieldMap(raw) : {};
    if (contact && contact.email) {
      fromContact.email = fromContact.email || String(contact.email);
    }
    const mergedFields = mergeProfileAndContactFields(fromProfile, fromContact);
    if (contact && contact.email) {
      mergedFields.email = String(contact.email).trim();
    }
    const cvRaw = profileCvRawHtml(prof || {});
    const merged = mergeTemplate(templateRow, mergedFields, { cv_html: cvRaw });
    if (!hasCvPortfolioUrl(prof || {})) {
      return { ...merged, html: stripDefaultTemplateCvButtonRow(merged.html) };
    }
    return merged;
  }

  /**
   * Alertes textuelles (filtres type Gmail, SpamAssassin, etc. — pas de garantie).
   * @param {{ subject?: string, html?: string }} partial
   * @returns {string[]}
   */
  function lintOutgoingEmail(partial) {
    const warnings = [];
    const sub = String(partial.subject || '');
    const h = String(partial.html || '');
    const blob = `${sub}\n${h}`;

    if (sub.length > 78) {
      warnings.push('Objet assez long : viser moins de 78 caractères si possible (affichage mobile).');
    }
    if (/[!?]{2,}/.test(sub)) {
      warnings.push('Objet : éviter les répétitions de « ! » ou « ? » (style « marketing agressif »).');
    }
    if (sub === sub.toUpperCase() && sub.length > 12) {
      warnings.push('Objet entièrement en majuscules : à éviter (déclencheur fréquent de filtres).');
    }

    const spammy = [
      /\bgratuit\b/i,
      /\bgagnez\b/i,
      /\burgent\b/i,
      /\bderni(è|e)re chance\b/i,
      /\b100\s*%\s*offert\b/i,
      /\bcliquez vite\b/i,
      /\bviagra\b/i,
      /\bcasino\b/i,
      /\bremboursé\b/i
    ];
    for (const re of spammy) {
      if (re.test(blob)) {
        warnings.push('Formulation détectée comme typiquement « spam » : adoucir ou reformuler (gratuit, urgent, clic, etc.).');
        break;
      }
    }

    const linkCount = (h.match(/href\s*=\s*["']/gi) || []).length;
    if (linkCount > 8) {
      warnings.push('Nombre élevé de liens : les filtres préfèrent peu de liens clairs et utiles.');
    }
    if (linkCount === 0 && h.length > 400) {
      warnings.push('Long message sans lien : acceptable ; vérifier qu’un bouton ou lien de contact existe si besoin.');
    }

    const imgCount = (h.match(/<img[\s>]/gi) || []).length;
    if (imgCount > 3) {
      warnings.push('Plusieurs images : privilégier du texte lisible (ratio texte/image favorable à la délivrabilité).');
    }

    return [...new Set(warnings)];
  }

  /**
   * En-têtes recommandés pour la délivrabilité (à appliquer côté Blast / SMTP).
   * List-Unsubscribe améliore la réputation si l’URL ou mailto est valide.
   */
  function recommendedHeadersHint() {
    return {
      listUnsubscribe: '<https://exemple.com/desabonnement> ou mailto:liste@exemple.com',
      precedence: 'Les messages transactionnels peuvent utiliser Precedence: bulk avec précaution ; préférer contenu clair et consentement.',
      replyTo: 'Aligner Reply-To sur une boîte surveillée réduit les plaintes utilisateurs.'
    };
  }

   
  global.InvooEmailMerge = {
    mergeTemplate,
    mergeForContact,
    mergeProfileAndContactFields,
    profileToTemplateFields,
    profileCvRawHtml,
    sanitizeCvHtml,
    mergeWithProfileAndContact,
    normalizeFieldMap,
    hasCvPortfolioUrl,
    stripDefaultTemplateCvButtonRow,
    stripCvButtonIfNoCvPortfolioUrl,
    lintOutgoingEmail,
    recommendedHeadersHint
  };
})(typeof window !== 'undefined' ? window : self);
