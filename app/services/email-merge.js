/**
 * Fusion template ↔ ligne contact (colonnes importées) pour le moteur Blast.
 * Réutilise InvooEmailEditor.applyVars — même syntaxe {{variable}} qu’en éditeur.
 * Conseils anti-spam légers : lintOutgoingEmail (heuristiques, pas un score garanti).
 */
(function (global) {
  'use strict';

  /**
   * Normalise les clés de colonnes (Excel) : minuscules, espaces → underscores.
   * Ex. "Prénom" → prenom, "Poste visé" → poste_visé (accents retirés côté clé).
   * @param {Record<string, unknown>} row
   */
  function normalizeFieldMap(row) {
    const out = {};
    if (!row || typeof row !== 'object') return out;
    for (const [k, v] of Object.entries(row)) {
      const key = String(k)
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
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
<<<<<<< HEAD
    return sanitizeCvHtml(p.cvHtml == null ? '' : String(p.cvHtml));
=======
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
>>>>>>> 7f4f399 (ok)
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
    const data = aliasWhatsAppFields(normalizeFieldMap(fieldMap));
    const raw = rawFieldMap && typeof rawFieldMap === 'object' ? rawFieldMap : null;
    return {
      html: editor.applyVars(templateRow.html || '', data, raw),
      subject: editor.applyVars(templateRow.subject || '', data, null),
      replyTo: templateRow.replyTo ? editor.applyVars(String(templateRow.replyTo), data, null).trim() : ''
    };
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

    return {
      prenom,
      nom,
      nom_complet: [prenom, nom].filter(Boolean).join(' ').trim(),
      email: p.email == null ? '' : String(p.email),
      telephone: p.phone == null ? '' : String(p.phone),
      ville: p.city == null ? '' : String(p.city),
      fonction: p.jobTitle == null ? '' : String(p.jobTitle),
      societe: p.company == null ? '' : String(p.company),
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

  /**
   * Profil local puis surcharge par la ligne contact importée (si présente).
   * @param {object} templateRow
   * @param {object|null|undefined} contact
   */
  async function mergeWithProfileAndContact(templateRow, contact) {
    const db = global.InvooBlastDB;
    const prof = db ? await db.getMeta('user_profile') : null;
    const fromProfile = profileToTemplateFields(prof || {});
    const raw = contact && contact.fields && typeof contact.fields === 'object' ? contact.fields : contact;
    const fromContact = raw ? normalizeFieldMap(raw) : {};
    if (contact && contact.email) {
      fromContact.email = fromContact.email || String(contact.email);
    }
    const cvRaw = profileCvRawHtml(prof || {});
    return mergeTemplate(
      templateRow,
      { ...fromProfile, ...fromContact },
      { cv_html: cvRaw }
    );
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
    profileToTemplateFields,
    profileCvRawHtml,
    sanitizeCvHtml,
    mergeWithProfileAndContact,
    normalizeFieldMap,
    lintOutgoingEmail,
    recommendedHeadersHint
  };
})(typeof window !== 'undefined' ? window : self);
