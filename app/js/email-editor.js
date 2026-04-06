/**
 * Éditeur e-mail : HTML + variables {{...}}, aperçu avec profil Paramètres, brouillon unique (meta).
 */
(function (global) {
  'use strict';

  const db = global.InvooBlastDB;
  const META_DRAFT = 'email_editor_draft';
  const META_PURGED = 'invooblast_templates_purged_v1';
  /** Langue des modèles de base uniquement : 'fr' | 'en' */
  const META_BASE_LANG = 'email_editor_base_lang';
  /** Modules personnalisés : [{ id, name, subject, replyTo, html, createdAt }] */
  const META_CUSTOM_MODULES = 'email_editor_custom_modules';
  const MAX_CUSTOM_MODULES = 40;

  /** Valeurs de démonstration uniquement pour des variables absentes du profil (aperçu). */
  const PREVIEW_FALLBACK = {
    organisation: 'Organisation (exemple)',
    signature: 'L’équipe',
    email_contact: 'contact@exemple.org',
    email_reply_to: 'reponses@exemple.org',
    lien_desinscription: 'https://exemple.org/desabonnement',
    nom_complet: 'Prénom Nom',
    lien_cv: 'https://exemple.org/cv.pdf',
    whatsapp_lien: 'https://wa.me/33600000000',
    whatsapp_link: 'https://wa.me/33600000000'
  };

  const DEFAULT_STAGE_SUBJECT = 'Demande de stage — {{prenom}} {{nom}} | Candidature spontanée';

  /** Modèle « demande de stage » — style administratif sobre (tables + styles inline, compatible Gmail). */
  const DEFAULT_STAGE_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Demande de stage</title>
</head>
<body style="margin:0;padding:0;background-color:#eceff4;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#eceff4;">
<tr>
<td align="center" style="padding:28px 14px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;border:1px solid #d1d5db;box-shadow:0 10px 40px rgba(15,23,42,0.07);">
<tr>
<td style="height:6px;line-height:6px;font-size:0;background:linear-gradient(90deg,#1e3a8a,#2563eb);">&nbsp;</td>
</tr>
<tr>
<td style="padding:26px 36px 22px;background-color:#fafbfc;border-bottom:1px solid #e5e7eb;">
<span style="display:inline-block;padding:5px 12px;border-radius:4px;border:1px solid #93c5fd;background-color:#eff6ff;color:#1d4ed8;font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Candidature · Stage</span>
<h1 style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:1.25;color:#111827;font-weight:700;letter-spacing:-0.02em;">{{prenom}} {{nom}}</h1>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;font-weight:600;">{{fonction}}</p>
<p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b7280;line-height:1.45;">Demande de stage · Candidature spontanée</p>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9ca3af;">{{societe}}</p>
</td>
</tr>
<tr>
<td style="padding:28px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#374151;">
Madame, Monsieur,<br><br>
Je vous contacte pour vous faire part de ma <strong>motivation</strong> à effectuer un <strong>stage</strong> au sein de votre organisation. Très intéressé par le domaine de <strong>{{domaine}}</strong>, je souhaite mettre mes acquis au service de vos équipes tout en développant mes compétences en contexte professionnel.<br><br>
Rigoureux, à l’écoute et habitué au travail collaboratif, je suis prêt à m’investir sur les missions qui me seront confiées.
</td>
</tr>
<tr>
<td style="padding:0 36px 24px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e5e7eb;border-left:4px solid #2563eb;background-color:#f9fafb;border-radius:0 10px 10px 0;">
<tr>
<td style="padding:20px 22px;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.08em;">Synthèse des atouts</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#4b5563;">Axes prioritaires : <strong style="color:#111827;">{{domaine}}</strong>.</p>
<table cellpadding="0" cellspacing="0" role="presentation" style="font-size:14px;line-height:1.55;color:#4b5563;">
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#2563eb;width:14px;">▸</td><td style="padding:4px 0;">Motivation et fiabilité</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#2563eb;">▸</td><td style="padding:4px 0;">Adaptation rapide aux outils et aux équipes</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#2563eb;">▸</td><td style="padding:4px 0;">Envie d’apprendre et de progresser</td></tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:0 36px 22px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e5e7eb;border-radius:8px;background-color:#ffffff;">
<tr>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;width:32%;vertical-align:top;">Mobilité</td>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">{{ville}}, {{pays}}</td>
</tr>
<tr>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;vertical-align:top;">Durée</td>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">Courte ou longue selon votre calendrier</td>
</tr>
<tr>
<td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;vertical-align:top;">Modalités</td>
<td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">Présentiel ou distanciel possible</td>
</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="padding:6px 36px 4px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td align="center" style="border-radius:8px;background:linear-gradient(180deg,#2563eb,#1d4ed8);box-shadow:0 2px 8px rgba(37,99,235,0.35);">
<a href="#invoo-cv" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">Consulter mon CV</a>
</td>
</tr>
</table>
<p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9ca3af;max-width:360px;margin-left:auto;margin-right:auto;line-height:1.45;">Le parcours détaillé figure <strong>dans ce même courriel</strong> (aucune pièce jointe externe requise).</p>
</td>
</tr>
<tr>
<td align="center" style="padding:10px 36px 26px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td style="border-radius:8px;border:1px solid #059669;background-color:#ffffff;">
<a href="{{whatsapp_lien}}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 26px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#047857;text-decoration:none;">Contacter par WhatsApp</a>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:22px 36px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.65;color:#6b7280;">
<strong style="color:#111827;font-size:13px;">{{nom_complet}}</strong><br>
<span style="color:#9ca3af;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email_reply_to}}" style="color:#1d4ed8;text-decoration:none;">{{email_reply_to}}</a><span style="color:#d1d5db;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:32px 36px 36px;background-color:#ffffff;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Annexe</p>
<p id="invoo-cv" style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.35;color:#111827;font-weight:700;">Curriculum vitæ</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#374151;">
{{@cv_html}}
</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

  const DEFAULT_JOB_SUBJECT =
    'Candidature spontanée — {{prenom}} {{nom}} | Poste CDI / CDD';

  /** Emploi CDI/CDD — même squelette, accent ardoise « corporate ». */
  const DEFAULT_JOB_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Candidature CDI / CDD</title>
</head>
<body style="margin:0;padding:0;background-color:#eceff4;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#eceff4;">
<tr>
<td align="center" style="padding:28px 14px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;border:1px solid #d1d5db;box-shadow:0 10px 40px rgba(15,23,42,0.07);">
<tr>
<td style="height:6px;line-height:6px;font-size:0;background:linear-gradient(90deg,#1e293b,#475569);">&nbsp;</td>
</tr>
<tr>
<td style="padding:26px 36px 22px;background-color:#fafbfc;border-bottom:1px solid #e5e7eb;">
<span style="display:inline-block;padding:5px 12px;border-radius:4px;border:1px solid #cbd5e1;background-color:#f3f4f6;color:#374151;font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Emploi · CDI / CDD</span>
<h1 style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:1.25;color:#111827;font-weight:700;letter-spacing:-0.02em;">{{prenom}} {{nom}}</h1>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;font-weight:600;">{{fonction}}</p>
<p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b7280;line-height:1.45;">Candidature spontanée · Emploi salarié</p>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9ca3af;">{{societe}}</p>
</td>
</tr>
<tr>
<td style="padding:28px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#374151;">
Madame, Monsieur,<br><br>
Par la présente, je vous adresse une <strong>candidature spontanée</strong> pour des postes en entreprise au sein de votre organisation, en <strong>CDI ou CDD</strong>. Fort d’un <strong>vif intérêt</strong> pour le domaine de <strong>{{domaine}}</strong>, je souhaite mettre mon expertise et mon engagement au service de vos objectifs, dans un cadre exigeant et collaboratif.<br><br>
Rigoureux, orienté résultats et à l’aise dans des environnements structurés, je suis disponible pour échanger sur vos besoins et la manière dont je peux contribuer à vos équipes.
</td>
</tr>
<tr>
<td style="padding:0 36px 24px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e5e7eb;border-left:4px solid #334155;background-color:#f9fafb;border-radius:0 10px 10px 0;">
<tr>
<td style="padding:20px 22px;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#1f2937;text-transform:uppercase;letter-spacing:0.08em;">Compétences &amp; atouts</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#4b5563;">Domaines privilégiés : <strong style="color:#111827;">{{domaine}}</strong>.</p>
<table cellpadding="0" cellspacing="0" role="presentation" style="font-size:14px;line-height:1.55;color:#4b5563;">
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#475569;width:14px;">▸</td><td style="padding:4px 0;">Fiabilité, organisation et sens du détail</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#475569;">▸</td><td style="padding:4px 0;">Adaptation aux outils, processus et équipes</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#475569;">▸</td><td style="padding:4px 0;">Esprit de synthèse et collaboration efficace</td></tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:0 36px 22px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e5e7eb;border-radius:8px;background-color:#ffffff;">
<tr>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;width:32%;vertical-align:top;">Mobilité</td>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">{{ville}}, {{pays}}</td>
</tr>
<tr>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;vertical-align:top;">Contrat</td>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">CDI ou CDD selon vos besoins</td>
</tr>
<tr>
<td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;vertical-align:top;">Organisation</td>
<td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">Présentiel, hybride ou télétravail selon votre politique</td>
</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="padding:6px 36px 4px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td align="center" style="border-radius:8px;background:linear-gradient(180deg,#374151,#1f2937);box-shadow:0 2px 8px rgba(31,41,55,0.3);">
<a href="#invoo-cv" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">Consulter mon CV</a>
</td>
</tr>
</table>
<p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9ca3af;max-width:360px;margin-left:auto;margin-right:auto;line-height:1.45;">Le parcours détaillé figure <strong>dans ce même courriel</strong> (aucune pièce jointe externe requise).</p>
</td>
</tr>
<tr>
<td align="center" style="padding:10px 36px 26px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td style="border-radius:8px;border:1px solid #059669;background-color:#ffffff;">
<a href="{{whatsapp_lien}}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 26px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#047857;text-decoration:none;">Contacter par WhatsApp</a>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:22px 36px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.65;color:#6b7280;">
<strong style="color:#111827;font-size:13px;">{{nom_complet}}</strong><br>
<span style="color:#9ca3af;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email_reply_to}}" style="color:#1d4ed8;text-decoration:none;">{{email_reply_to}}</a><span style="color:#d1d5db;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:32px 36px 36px;background-color:#ffffff;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Annexe</p>
<p id="invoo-cv" style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.35;color:#111827;font-weight:700;">Curriculum vitæ</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#374151;">
{{@cv_html}}
</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

  const DEFAULT_VOLUNTEER_SUBJECT =
    'Volontariat / mission — {{prenom}} {{nom}} | Candidature spontanée';

  /** Volontariat / ONG — accent vert sobre, mise en page alignée aux autres modèles. */
  const DEFAULT_VOLUNTEER_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Volontariat &amp; mission solidaire</title>
</head>
<body style="margin:0;padding:0;background-color:#eceff4;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#eceff4;">
<tr>
<td align="center" style="padding:28px 14px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;border:1px solid #d1d5db;box-shadow:0 10px 40px rgba(15,23,42,0.07);">
<tr>
<td style="height:6px;line-height:6px;font-size:0;background:linear-gradient(90deg,#047857,#059669);">&nbsp;</td>
</tr>
<tr>
<td style="padding:26px 36px 22px;background-color:#fafbfc;border-bottom:1px solid #e5e7eb;">
<span style="display:inline-block;padding:5px 12px;border-radius:4px;border:1px solid #6ee7b7;background-color:#ecfdf5;color:#047857;font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Engagement · Volontariat</span>
<h1 style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:1.25;color:#111827;font-weight:700;letter-spacing:-0.02em;">{{prenom}} {{nom}}</h1>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;font-weight:600;">{{fonction}}</p>
<p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b7280;line-height:1.45;">Missions humanitaires &amp; bénévolat</p>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9ca3af;">{{societe}}</p>
</td>
</tr>
<tr>
<td style="padding:28px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#374151;">
Madame, Monsieur,<br><br>
Je vous adresse une <strong>candidature spontanée</strong> pour rejoindre vos actions en tant que <strong>volontaire</strong> ou <strong>bénévole</strong>, en France ou à l’international. Sensible aux enjeux humanitaires et fortement motivé par le domaine de <strong>{{domaine}}</strong>, je souhaite contribuer concrètement à vos missions sur le terrain ou en appui.<br><br>
Ouvert d’esprit, à l’écoute et habitué à travailler en équipe dans des contextes variés, je m’engage avec sérieux, respect et disponibilité.
</td>
</tr>
<tr>
<td style="padding:0 36px 24px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #d1fae5;border-left:4px solid #059669;background-color:#f0fdf4;border-radius:0 10px 10px 0;">
<tr>
<td style="padding:20px 22px;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#047857;text-transform:uppercase;letter-spacing:0.08em;">Engagement &amp; savoir-faire</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#4b5563;">Centres d’intérêt : <strong style="color:#111827;">{{domaine}}</strong>.</p>
<table cellpadding="0" cellspacing="0" role="presentation" style="font-size:14px;line-height:1.55;color:#4b5563;">
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#059669;width:14px;">▸</td><td style="padding:4px 0;">Sens du service, empathie et respect des publics accompagnés</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#059669;">▸</td><td style="padding:4px 0;">Adaptabilité (contextes multiculturels, terrain, logistique)</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#059669;">▸</td><td style="padding:4px 0;">Fiabilité, coopération et attitude constructive</td></tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:0 36px 22px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e5e7eb;border-radius:8px;background-color:#ffffff;">
<tr>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;width:32%;vertical-align:top;">Mobilité</td>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">{{ville}}, {{pays}}</td>
</tr>
<tr>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;vertical-align:top;">Périmètre</td>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">France ou international selon vos programmes</td>
</tr>
<tr>
<td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;vertical-align:top;">Durée</td>
<td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">Moyen / long terme ou missions ponctuelles</td>
</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="padding:6px 36px 4px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td align="center" style="border-radius:8px;background:linear-gradient(180deg,#059669,#047857);box-shadow:0 2px 8px rgba(5,150,105,0.35);">
<a href="#invoo-cv" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">Consulter mon CV</a>
</td>
</tr>
</table>
<p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9ca3af;max-width:360px;margin-left:auto;margin-right:auto;line-height:1.45;">Le parcours détaillé figure <strong>dans ce même courriel</strong> (aucune pièce jointe externe requise).</p>
</td>
</tr>
<tr>
<td align="center" style="padding:10px 36px 26px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td style="border-radius:8px;border:1px solid #059669;background-color:#ffffff;">
<a href="{{whatsapp_lien}}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 26px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#047857;text-decoration:none;">Contacter par WhatsApp</a>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:22px 36px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.65;color:#6b7280;">
<strong style="color:#111827;font-size:13px;">{{nom_complet}}</strong><br>
<span style="color:#9ca3af;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email_reply_to}}" style="color:#1d4ed8;text-decoration:none;">{{email_reply_to}}</a><span style="color:#d1d5db;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:32px 36px 36px;background-color:#ffffff;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Annexe</p>
<p id="invoo-cv" style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.35;color:#111827;font-weight:700;">Curriculum vitæ</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#374151;">
{{@cv_html}}
</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

  const DEFAULT_STAGE_SUBJECT_EN =
    'Internship request — {{prenom}} {{nom}} | Unsolicited application';

  const DEFAULT_STAGE_HTML_EN = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Internship request</title>
</head>
<body style="margin:0;padding:0;background-color:#eceff4;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#eceff4;">
<tr>
<td align="center" style="padding:28px 14px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;border:1px solid #d1d5db;box-shadow:0 10px 40px rgba(15,23,42,0.07);">
<tr>
<td style="height:6px;line-height:6px;font-size:0;background:linear-gradient(90deg,#1e3a8a,#2563eb);">&nbsp;</td>
</tr>
<tr>
<td style="padding:26px 36px 22px;background-color:#fafbfc;border-bottom:1px solid #e5e7eb;">
<span style="display:inline-block;padding:5px 12px;border-radius:4px;border:1px solid #93c5fd;background-color:#eff6ff;color:#1d4ed8;font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Application · Internship</span>
<h1 style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:1.25;color:#111827;font-weight:700;letter-spacing:-0.02em;">{{prenom}} {{nom}}</h1>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;font-weight:600;">{{fonction}}</p>
<p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b7280;line-height:1.45;">Internship request · Unsolicited application</p>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9ca3af;">{{societe}}</p>
</td>
</tr>
<tr>
<td style="padding:28px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#374151;">
Dear Sir or Madam,<br><br>
I am writing to express my <strong>interest</strong> in completing an <strong>internship</strong> with your organisation. I am particularly drawn to <strong>{{domaine}}</strong> and would welcome the opportunity to contribute to your teams while building professional skills in a real workplace setting.<br><br>
I am diligent, collaborative, and comfortable adapting to new tools and teams.
</td>
</tr>
<tr>
<td style="padding:0 36px 24px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e5e7eb;border-left:4px solid #2563eb;background-color:#f9fafb;border-radius:0 10px 10px 0;">
<tr>
<td style="padding:20px 22px;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.08em;">Key strengths</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#4b5563;">Focus areas: <strong style="color:#111827;">{{domaine}}</strong>.</p>
<table cellpadding="0" cellspacing="0" role="presentation" style="font-size:14px;line-height:1.55;color:#4b5563;">
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#2563eb;width:14px;">▸</td><td style="padding:4px 0;">Motivation and reliability</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#2563eb;">▸</td><td style="padding:4px 0;">Quick learner with tools and teamwork</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#2563eb;">▸</td><td style="padding:4px 0;">Eager to learn and grow</td></tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:0 36px 22px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e5e7eb;border-radius:8px;background-color:#ffffff;">
<tr>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;width:32%;vertical-align:top;">Location</td>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">{{ville}}, {{pays}}</td>
</tr>
<tr>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;vertical-align:top;">Duration</td>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">Short or long placement, per your schedule</td>
</tr>
<tr>
<td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;vertical-align:top;">Format</td>
<td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">On-site or remote where appropriate</td>
</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="padding:6px 36px 4px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td align="center" style="border-radius:8px;background:linear-gradient(180deg,#2563eb,#1d4ed8);box-shadow:0 2px 8px rgba(37,99,235,0.35);">
<a href="#invoo-cv" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">View my CV</a>
</td>
</tr>
</table>
<p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9ca3af;max-width:360px;margin-left:auto;margin-right:auto;line-height:1.45;">Full details are provided <strong>in this same email</strong> (no external link required).</p>
</td>
</tr>
<tr>
<td align="center" style="padding:10px 36px 26px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td style="border-radius:8px;border:1px solid #059669;background-color:#ffffff;">
<a href="{{whatsapp_lien}}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 26px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#047857;text-decoration:none;">Contact via WhatsApp</a>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:22px 36px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.65;color:#6b7280;">
<strong style="color:#111827;font-size:13px;">{{nom_complet}}</strong><br>
<span style="color:#9ca3af;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email_reply_to}}" style="color:#1d4ed8;text-decoration:none;">{{email_reply_to}}</a><span style="color:#d1d5db;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:32px 36px 36px;background-color:#ffffff;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Appendix</p>
<p id="invoo-cv" style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.35;color:#111827;font-weight:700;">Curriculum vitae</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#374151;">
{{@cv_html}}
</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

  const DEFAULT_JOB_SUBJECT_EN =
    'Unsolicited application — {{prenom}} {{nom}} | Full-time / fixed-term role';

  const DEFAULT_JOB_HTML_EN = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Job application (permanent / fixed-term)</title>
</head>
<body style="margin:0;padding:0;background-color:#eceff4;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#eceff4;">
<tr>
<td align="center" style="padding:28px 14px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;border:1px solid #d1d5db;box-shadow:0 10px 40px rgba(15,23,42,0.07);">
<tr>
<td style="height:6px;line-height:6px;font-size:0;background:linear-gradient(90deg,#1e293b,#475569);">&nbsp;</td>
</tr>
<tr>
<td style="padding:26px 36px 22px;background-color:#fafbfc;border-bottom:1px solid #e5e7eb;">
<span style="display:inline-block;padding:5px 12px;border-radius:4px;border:1px solid #cbd5e1;background-color:#f3f4f6;color:#374151;font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Employment · Permanent / Fixed-term</span>
<h1 style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:1.25;color:#111827;font-weight:700;letter-spacing:-0.02em;">{{prenom}} {{nom}}</h1>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;font-weight:600;">{{fonction}}</p>
<p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b7280;line-height:1.45;">Unsolicited application · Salaried role</p>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9ca3af;">{{societe}}</p>
</td>
</tr>
<tr>
<td style="padding:28px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#374151;">
Dear Sir or Madam,<br><br>
Please consider this <strong>unsolicited application</strong> for salaried positions (<strong>permanent or fixed-term</strong>) within your organisation. I have a strong interest in <strong>{{domaine}}</strong> and would like to bring my skills and commitment to your objectives in a structured, collaborative environment.<br><br>
I am detail-oriented, results-minded, and comfortable in professional settings; I would welcome a conversation about your needs and how I can support your teams.
</td>
</tr>
<tr>
<td style="padding:0 36px 24px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e5e7eb;border-left:4px solid #334155;background-color:#f9fafb;border-radius:0 10px 10px 0;">
<tr>
<td style="padding:20px 22px;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#1f2937;text-transform:uppercase;letter-spacing:0.08em;">Skills &amp; strengths</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#4b5563;">Core areas: <strong style="color:#111827;">{{domaine}}</strong>.</p>
<table cellpadding="0" cellspacing="0" role="presentation" style="font-size:14px;line-height:1.55;color:#4b5563;">
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#475569;width:14px;">▸</td><td style="padding:4px 0;">Reliability, organisation, attention to detail</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#475569;">▸</td><td style="padding:4px 0;">Adaptation to tools, processes, and teams</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#475569;">▸</td><td style="padding:4px 0;">Clear communication and collaboration</td></tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:0 36px 22px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e5e7eb;border-radius:8px;background-color:#ffffff;">
<tr>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;width:32%;vertical-align:top;">Location</td>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">{{ville}}, {{pays}}</td>
</tr>
<tr>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;vertical-align:top;">Contract</td>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">Permanent or fixed-term, as required</td>
</tr>
<tr>
<td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;vertical-align:top;">Workplace</td>
<td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">On-site, hybrid, or remote per your policy</td>
</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="padding:6px 36px 4px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td align="center" style="border-radius:8px;background:linear-gradient(180deg,#374151,#1f2937);box-shadow:0 2px 8px rgba(31,41,55,0.3);">
<a href="#invoo-cv" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">View my CV</a>
</td>
</tr>
</table>
<p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9ca3af;max-width:360px;margin-left:auto;margin-right:auto;line-height:1.45;">Full details are provided <strong>in this same email</strong> (no external link required).</p>
</td>
</tr>
<tr>
<td align="center" style="padding:10px 36px 26px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td style="border-radius:8px;border:1px solid #059669;background-color:#ffffff;">
<a href="{{whatsapp_lien}}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 26px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#047857;text-decoration:none;">Contact via WhatsApp</a>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:22px 36px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.65;color:#6b7280;">
<strong style="color:#111827;font-size:13px;">{{nom_complet}}</strong><br>
<span style="color:#9ca3af;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email_reply_to}}" style="color:#1d4ed8;text-decoration:none;">{{email_reply_to}}</a><span style="color:#d1d5db;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:32px 36px 36px;background-color:#ffffff;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Appendix</p>
<p id="invoo-cv" style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.35;color:#111827;font-weight:700;">Curriculum vitae</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#374151;">
{{@cv_html}}
</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

  const DEFAULT_VOLUNTEER_SUBJECT_EN =
    'Volunteering / mission — {{prenom}} {{nom}} | Unsolicited application';

  const DEFAULT_VOLUNTEER_HTML_EN = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Volunteering &amp; solidarity mission</title>
</head>
<body style="margin:0;padding:0;background-color:#eceff4;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#eceff4;">
<tr>
<td align="center" style="padding:28px 14px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;border:1px solid #d1d5db;box-shadow:0 10px 40px rgba(15,23,42,0.07);">
<tr>
<td style="height:6px;line-height:6px;font-size:0;background:linear-gradient(90deg,#047857,#059669);">&nbsp;</td>
</tr>
<tr>
<td style="padding:26px 36px 22px;background-color:#fafbfc;border-bottom:1px solid #e5e7eb;">
<span style="display:inline-block;padding:5px 12px;border-radius:4px;border:1px solid #6ee7b7;background-color:#ecfdf5;color:#047857;font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Engagement · Volunteering</span>
<h1 style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:1.25;color:#111827;font-weight:700;letter-spacing:-0.02em;">{{prenom}} {{nom}}</h1>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;font-weight:600;">{{fonction}}</p>
<p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b7280;line-height:1.45;">Humanitarian &amp; international volunteering</p>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9ca3af;">{{societe}}</p>
</td>
</tr>
<tr>
<td style="padding:28px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#374151;">
Dear Sir or Madam,<br><br>
I am applying to support your work as a <strong>volunteer</strong>, in France or abroad. I care deeply about humanitarian issues and am especially motivated by <strong>{{domaine}}</strong>; I hope to contribute meaningfully to your programmes in the field or in support roles.<br><br>
I am open-minded, a good listener, and used to teamwork across diverse contexts; I engage with seriousness, respect, and availability.
</td>
</tr>
<tr>
<td style="padding:0 36px 24px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #d1fae5;border-left:4px solid #059669;background-color:#f0fdf4;border-radius:0 10px 10px 0;">
<tr>
<td style="padding:20px 22px;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#047857;text-transform:uppercase;letter-spacing:0.08em;">Engagement &amp; skills</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#4b5563;">What I bring: <strong style="color:#111827;">{{domaine}}</strong>.</p>
<table cellpadding="0" cellspacing="0" role="presentation" style="font-size:14px;line-height:1.55;color:#4b5563;">
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#059669;width:14px;">▸</td><td style="padding:4px 0;">Service mindset, empathy, respect for communities</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#059669;">▸</td><td style="padding:4px 0;">Adaptability (multicultural contexts, field work, logistics)</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#059669;">▸</td><td style="padding:4px 0;">Reliability, cooperation, constructive attitude</td></tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:0 36px 22px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e5e7eb;border-radius:8px;background-color:#ffffff;">
<tr>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;width:32%;vertical-align:top;">Location</td>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">{{ville}}, {{pays}}</td>
</tr>
<tr>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;vertical-align:top;">Scope</td>
<td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">France or international, per your programmes</td>
</tr>
<tr>
<td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;vertical-align:top;">Duration</td>
<td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">Medium/long-term or short missions</td>
</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="padding:6px 36px 4px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td align="center" style="border-radius:8px;background:linear-gradient(180deg,#059669,#047857);box-shadow:0 2px 8px rgba(5,150,105,0.35);">
<a href="#invoo-cv" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">View my CV</a>
</td>
</tr>
</table>
<p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9ca3af;max-width:360px;margin-left:auto;margin-right:auto;line-height:1.45;">Full details are provided <strong>in this same email</strong> (no external link required).</p>
</td>
</tr>
<tr>
<td align="center" style="padding:10px 36px 26px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td style="border-radius:8px;border:1px solid #059669;background-color:#ffffff;">
<a href="{{whatsapp_lien}}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 26px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#047857;text-decoration:none;">Contact via WhatsApp</a>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:22px 36px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.65;color:#6b7280;">
<strong style="color:#111827;font-size:13px;">{{nom_complet}}</strong><br>
<span style="color:#9ca3af;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email_reply_to}}" style="color:#1d4ed8;text-decoration:none;">{{email_reply_to}}</a><span style="color:#d1d5db;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:32px 36px 36px;background-color:#ffffff;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Appendix</p>
<p id="invoo-cv" style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.35;color:#111827;font-weight:700;">Curriculum vitae</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#374151;">
{{@cv_html}}
</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

  function normalizeBaseLang(v) {
    return v === 'en' ? 'en' : 'fr';
  }

  const DEFAULT_TEMPLATE_PAIRS = [
    {
      fr: { html: DEFAULT_STAGE_HTML, subject: DEFAULT_STAGE_SUBJECT },
      en: { html: DEFAULT_STAGE_HTML_EN, subject: DEFAULT_STAGE_SUBJECT_EN }
    },
    {
      fr: { html: DEFAULT_JOB_HTML, subject: DEFAULT_JOB_SUBJECT },
      en: { html: DEFAULT_JOB_HTML_EN, subject: DEFAULT_JOB_SUBJECT_EN }
    },
    {
      fr: { html: DEFAULT_VOLUNTEER_HTML, subject: DEFAULT_VOLUNTEER_SUBJECT },
      en: { html: DEFAULT_VOLUNTEER_HTML_EN, subject: DEFAULT_VOLUNTEER_SUBJECT_EN }
    }
  ];

  function normalizeTemplateText(s) {
    return String(s || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
  }

  /**
   * Si le brouillon correspond exactement à un modèle de base FR ou EN, bascule corps + objet vers l’autre langue.
   */
  function swapDraftToTemplateLanguage(lang, subjectEl, htmlEl) {
    const wantEn = normalizeBaseLang(lang) === 'en';
    const h = normalizeTemplateText(htmlEl.value);
    const sub = normalizeTemplateText(subjectEl.value);
    for (const pair of DEFAULT_TEMPLATE_PAIRS) {
      if (h === normalizeTemplateText(pair.fr.html) && sub === normalizeTemplateText(pair.fr.subject)) {
        if (wantEn) {
          htmlEl.value = pair.en.html;
          subjectEl.value = pair.en.subject;
        }
        return;
      }
      if (h === normalizeTemplateText(pair.en.html) && sub === normalizeTemplateText(pair.en.subject)) {
        if (!wantEn) {
          htmlEl.value = pair.fr.html;
          subjectEl.value = pair.fr.subject;
        }
        return;
      }
    }
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const RAW_EMPTY_HINT =
    '<div style="padding:18px;background:#fffbeb;border:1px dashed #f59e0b;border-radius:10px;color:#92400e;font-size:13px;line-height:1.5;font-family:Segoe UI,Roboto,Arial,sans-serif;">Ajoutez votre <strong>CV en HTML</strong> dans <strong>Paramètres → Profil</strong>. Il sera affiché ici, sans lien externe.</div>';

  const RAW_EMPTY_HINT_EN =
    '<div style="padding:18px;background:#fffbeb;border:1px dashed #f59e0b;border-radius:10px;color:#92400e;font-size:13px;line-height:1.5;font-family:Segoe UI,Roboto,Arial,sans-serif;">Add your <strong>CV as HTML</strong> under <strong>Settings → Profile</strong>. It will appear here, with no external link.</div>';

  /**
   * Fusion finale (envoi Blast, etc.) : variable absente ou vide → rien (pas de texte type [adresse_ligne]).
   * L’aperçu dans l’éditeur utilise {@link applyVarsPreview}, qui peut signaler les trous.
   * @param {Record<string, string>|null|undefined} raw — clés injectées sans échappement (ex. {{@cv_html}}), réservé au profil local assaini.
   */
  function applyVars(html, data, raw) {
    const rawMap = raw && typeof raw === 'object' ? raw : null;
    let out = String(html);
    out = out.replace(/\{\{\@\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      const v = rawMap && rawMap[key] != null ? rawMap[key] : '';
      if (v === '' || v === null) return '';
      return String(v);
    });
    let map = data || {};
    const waSend = map.whatsapp_lien || map.whatsapp_link;
    if (waSend) {
      const s = String(waSend);
      map = { ...map, whatsapp_lien: s, whatsapp_link: s };
    }
    out = out.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      const v = map[key];
      if (v == null) return '';
      const s = String(v);
      if (s.trim() === '') return '';
      return escHtml(s);
    });
    return out;
  }

  /**
   * Fusion pour objet et Reply-To : valeurs injectées sans échappement HTML.
   * Sinon & et guillemets (ex. "Nom" &lt;mail@x.com&gt;) corrompent les en-têtes SMTP.
   */
  function applyVarsHeaders(text, data, raw) {
    const rawMap = raw && typeof raw === 'object' ? raw : null;
    let out = String(text);
    out = out.replace(/\{\{\@\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      const v = rawMap && rawMap[key] != null ? rawMap[key] : '';
      if (v === '' || v === null) return '';
      return String(v);
    });
    let map = data || {};
    const waSend = map.whatsapp_lien || map.whatsapp_link;
    if (waSend) {
      const s = String(waSend);
      map = { ...map, whatsapp_lien: s, whatsapp_link: s };
    }
    out = out.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      const v = map[key];
      if (v == null) return '';
      const s = String(v);
      if (s.trim() === '') return '';
      return s;
    });
    return out;
  }

  function applyVarsPreview(html, data, raw, opts) {
    const previewLang = opts && opts.previewLang === 'en' ? 'en' : 'fr';
    const emptyCvBox = previewLang === 'en' ? RAW_EMPTY_HINT_EN : RAW_EMPTY_HINT;
    const rawMap = raw && typeof raw === 'object' ? raw : null;
    let map = data || {};
    const wa = map.whatsapp_lien || map.whatsapp_link;
    if (wa) {
      map = { ...map, whatsapp_lien: String(wa), whatsapp_link: String(wa) };
    }
    let out = String(html);
    for (let pass = 0; pass < 4; pass++) {
      let next = out.replace(/\{\{\@\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
        const v = rawMap && rawMap[key] != null ? String(rawMap[key]) : '';
        if (!v.trim()) return emptyCvBox;
        return v;
      });
      next = next.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
        const v = map[key];
        if (v == null || v === '') {
          return `<span style="background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:4px;font-size:12px;font-family:Segoe UI,Roboto,sans-serif;">[${escHtml(key)}]</span>`;
        }
        return escHtml(v);
      });
      if (next === out) break;
      out = next;
    }
    return out;
  }

  function extractVars(html) {
    const s = new Set();
    let m;
    const reRaw = /\{\{\@\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    while ((m = reRaw.exec(html))) s.add('@' + m[1]);
    const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    while ((m = re.exec(html))) s.add(m[1]);
    return [...s].sort((a, b) => String(a).localeCompare(String(b), 'fr'));
  }

  function renderVarChips(container, names) {
    if (!container) return;
    container.innerHTML = '';
    if (!names.length) {
      container.innerHTML = '<span class="editor-hint">Aucune variable détectée.</span>';
      return;
    }
    names.forEach((n) => {
      const sp = document.createElement('span');
      sp.className = 'var-chip';
      sp.textContent = n.charAt(0) === '@' ? '{{@' + n.slice(1) + '}}' : '{{' + n + '}}';
      container.appendChild(sp);
    });
  }

  async function ensureLegacyTemplatesCleared() {
    const done = await db.getMeta(META_PURGED);
    if (done) return;
    const all = await db.getAll(db.STORES.TEMPLATES);
    await Promise.all(all.map((t) => db.del(db.STORES.TEMPLATES, t.id)));
    await db.setMeta(META_PURGED, true);
  }

  async function loadDraft() {
    const d = await db.getMeta(META_DRAFT);
    if (!d || typeof d !== 'object') {
      return {
        subject: DEFAULT_STAGE_SUBJECT,
        replyTo: '',
        html: DEFAULT_STAGE_HTML,
        draftProfileId: undefined
      };
    }
    return {
      subject: d.subject == null ? '' : String(d.subject),
      replyTo: d.replyTo == null ? '' : String(d.replyTo),
      html: d.html == null ? '' : String(d.html),
      draftProfileId:
        d.draftProfileId != null && String(d.draftProfileId).trim()
          ? String(d.draftProfileId).trim()
          : undefined
    };
  }

  /**
   * Profil utilisé pour l’aperçu et le Blast : celui enregistré dans le brouillon, sinon le profil actif global (Paramètres).
   */
  async function getProfileForDraft() {
    const d = await loadDraft();
    const pid = d.draftProfileId != null ? String(d.draftProfileId).trim() : '';
    if (pid && global.InvooSettings && typeof global.InvooSettings.getProfileById === 'function') {
      const p = await global.InvooSettings.getProfileById(pid);
      if (p) return p;
    }
    if (global.InvooSettings && typeof global.InvooSettings.getProfile === 'function') {
      return global.InvooSettings.getProfile();
    }
    return (await db.getMeta('user_profile')) || {};
  }

  async function saveDraft(subject, replyTo, html, opts) {
    const prevRaw = await db.getMeta(META_DRAFT);
    const prev = prevRaw && typeof prevRaw === 'object' ? prevRaw : {};
    let draftProfileId = prev.draftProfileId;
    if (opts && Object.prototype.hasOwnProperty.call(opts, 'draftProfileId')) {
      const v = opts.draftProfileId;
      if (v == null || String(v).trim() === '') draftProfileId = undefined;
      else draftProfileId = String(v).trim();
    }
    const row = {
      subject,
      replyTo,
      html,
      updatedAt: Date.now()
    };
    if (draftProfileId) row.draftProfileId = draftProfileId;
    await db.setMeta(META_DRAFT, row);
    if (!opts || !opts.silent) {
      await db.appendLog('info', 'Brouillon e-mail enregistré.', {});
    }
    global.dispatchEvent(new CustomEvent('invooblast:draft-updated'));
  }

  /**
   * Enregistre en IndexedDB le contenu actuel des champs de l’éditeur (si celui-ci est monté).
   * Sans cet appel, un objet ou un corps modifiés à l’écran mais jamais cliqués sur « Enregistrer le brouillon »
   * ne seraient pas ceux utilisés par l’envoi Blast (qui lit le brouillon en base).
   */
  async function persistDraftFromEditorDom() {
    const root = document.getElementById('email-editor-root');
    if (!root || root.dataset.mounted !== '1') return;
    const subjectEl = root.querySelector('#ed-subject');
    const replyEl = root.querySelector('#ed-replyto');
    const ta = root.querySelector('#ed-html');
    if (!subjectEl || !ta) return;
    await saveDraft(subjectEl.value, replyEl ? replyEl.value : '', ta.value, { silent: true });
  }

  /** Même ordre que le moteur Blast (principaux puis secours). */
  function buildTestAccountPool(rows, cfg) {
    const active = rows.filter((a) => !a.disabled);
    const fb = active.filter((a) => a.isFallback);
    const main = active.filter((a) => !a.isFallback);
    const sortE = (a, b) => String(a.email).localeCompare(String(b.email), 'fr');
    let order = [...main.sort(sortE), ...fb.sort(sortE)];
    if (cfg && cfg.useFallbackRelay === false) {
      order = main.sort(sortE);
    }
    return order;
  }

  async function getCustomModules() {
    const raw = await db.getMeta(META_CUSTOM_MODULES);
    if (!Array.isArray(raw)) return [];
    return raw.filter((m) => m && typeof m === 'object' && m.id && m.html != null);
  }

  async function setCustomModules(list) {
    await db.setMeta(META_CUSTOM_MODULES, list);
  }

  function mountEditorHtml(root) {
    root.innerHTML = `
<div class="email-editor-layout">
  <div class="editor-column">
    <div class="panel editor-toolbar-panel">
      <div class="panel-h">
        <h2>Éditeur e-mail</h2>
        <div class="row-actions">
          <button type="button" class="btn primary" id="ed-save">Enregistrer le brouillon</button>
        </div>
      </div>
      <div class="panel-b editor-toolbar-body">
        <div class="editor-message-intro">
          <p class="editor-hint" style="margin:0"><strong>Profil lié au brouillon :</strong> le menu « profil » ci‑dessous choisit <strong>quel identité / CV</strong> servent à l’<strong>aperçu</strong> et à l’<strong>envoi Blast</strong> pour <em>ce message</em>. Cela <strong>ne change pas</strong> le profil affiché par défaut dans Paramètres ou le tableau de bord.</p>
          <ul class="editor-guide-list">
            <li><strong>Profil (brouillon)</strong> : enregistré dans le brouillon avec l’objet et le HTML — variables <code>{{prenom}}</code>, <code>{{domaine}}</code>, etc.</li>
            <li><strong>CV</strong> : variante <code>{{@cv_html}}</code> du <em>même</em> profil que le brouillon (modifiable ici ou dans Paramètres).</li>
            <li><strong>Listes</strong> : à l’envoi, chaque ligne de contact peut surcharger une variable si la colonne porte le même nom.</li>
          </ul>
        </div>

        <div class="editor-context-stack">
          <div class="editor-step-block" id="ed-step-profile">
            <div class="editor-step-head">
              <h3 class="editor-step-title"><span class="editor-step-num" aria-hidden="true">1</span>Quel profil pour ce message ?</h3>
            </div>
            <label class="editor-label" for="ed-profile-active">Profil pour ce brouillon (aperçu + Blast)</label>
            <select id="ed-profile-active" class="editor-input" style="max-width:min(100%,480px)" aria-describedby="ed-profile-hint"></select>
            <p id="ed-profile-hint" class="editor-hint" style="margin-top:8px">Le choix est <strong>enregistré dans le brouillon</strong> (avec la sauvegarde JSON). Tant que vous ne changez pas ce menu, Blast utilisera toujours ce profil pour fusionner ce message. Pour éditer les textes (identité, HTML des CV), ouvrez <strong>Paramètres</strong>.</p>
          </div>

          <div class="editor-step-block" id="ed-step-cv">
            <div class="editor-step-head">
              <h3 class="editor-step-title"><span class="editor-step-num" aria-hidden="true">2</span>Quel CV insérer dans l’e-mail ?</h3>
            </div>
            <label class="editor-label" for="ed-cv-active">Variante de CV pour <code>{{@cv_html}}</code></label>
            <select id="ed-cv-active" class="editor-input" style="max-width:min(100%,480px)" aria-describedby="ed-cv-hint"></select>
            <p id="ed-cv-hint" class="editor-hint" style="margin-top:8px">Variantes du <strong>profil du brouillon</strong> (étape 1). Le CV sélectionné est enregistré sur ce profil dans la base locale (identique à Paramètres pour ce profil).</p>
          </div>

          <div class="editor-step-block editor-step-context">
            <div class="editor-step-head">
              <h3 class="editor-step-title"><span class="editor-step-num" aria-hidden="true">3</span>Rappel — ce qui part en fusion</h3>
            </div>
            <p id="ed-context-summary" class="editor-context-summary" role="status" aria-live="polite">Chargement du contexte…</p>
            <div class="editor-settings-shortcut">
              <button type="button" class="btn" id="ed-open-settings-profile" title="Ouvre l’onglet Paramètres">Modifier les profils ou les CV dans Paramètres</button>
              <span class="editor-hint" style="margin:0">Ajouter un profil, éditer le HTML d’un CV, adresse…</span>
            </div>
          </div>
        </div>

        <div class="editor-templates-block">
          <label class="editor-label">Modèles de base (contenu du message)</label>
          <div class="editor-lang-row">
            <span class="editor-hint editor-lang-hint">Langue des modèles (Stage, Travail, Volontariat) — par défaut selon le <strong>profil du brouillon</strong> (réglable dans Paramètres) :</span>
            <select id="ed-tpl-lang" class="editor-input ed-tpl-lang-select" aria-label="Langue des modèles de base">
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
          <div class="editor-tpl-buttons">
            <button type="button" class="btn editor-tpl-btn" id="ed-tpl-stage" title="Insère le modèle demande de stage">Stage</button>
            <button type="button" class="btn editor-tpl-btn" id="ed-tpl-job" title="Insère le modèle CDI/CDD">Travail (CDI/CDD)</button>
            <button type="button" class="btn editor-tpl-btn" id="ed-tpl-volunteer" title="Insère le modèle volontariat / humanitaire">Volontariat</button>
          </div>
          <p class="editor-hint editor-templates-foot">Les boutons Stage / Travail / Volontariat insèrent la variante FR ou EN. Si le brouillon est encore un de ces modèles sans modification, changer la langue <strong>met à jour le HTML, l’objet et l’aperçu</strong>. Sinon, seul l’aperçu (ex. texte d’aide CV vide) suit la langue.</p>
        </div>
        <div class="editor-custom-modules-block">
          <label class="editor-label">Modules de base personnalisés</label>
          <p class="editor-hint editor-custom-modules-hint">Enregistrez l’<strong>objet</strong>, le <strong>Reply-To</strong> et le <strong>HTML</strong> actuels comme module réutilisable (stocké localement dans ce navigateur, exporté avec la sauvegarde JSON). <strong>Utiliser</strong> un module enregistre tout de suite le brouillon — c’est ce contenu qui part en <strong>Blast</strong> (pas seulement l’affichage à l’écran).</p>
          <div class="editor-custom-save-row">
            <input type="text" id="ed-custom-name" class="editor-input" maxlength="120" placeholder="Nom du module (ex. Relance bienvenue)" autocomplete="off"/>
            <button type="button" class="btn primary" id="ed-custom-save">Enregistrer comme module</button>
          </div>
          <div id="ed-custom-modules-list" class="editor-custom-modules-list" aria-live="polite"></div>
        </div>
        <div class="editor-compose-fields">
        <p class="editor-label" style="margin-top:0;font-weight:700;letter-spacing:0.02em">Rédaction du brouillon</p>
        <p class="editor-hint" style="margin:-0.35rem 0 0.75rem">C’est ce contenu qui est fusionné puis envoyé par Blast. Le bouton <strong>Enregistrer le brouillon</strong> le fixe dans IndexedDB ; si vous lancez l’envoi depuis <strong>Envoi (Blast)</strong>, l’app <strong>synchronise d’abord automatiquement</strong> les champs visibles ici (objet inclus), même sans avoir cliqué sur Enregistrer.</p>
        <label class="editor-label">Objet e-mail</label>
        <input type="text" id="ed-subject" class="editor-input" placeholder="Objet (variables {{...}} acceptées)" autocomplete="off"/>
        <label class="editor-label">Reply-To (optionnel)</label>
        <input type="email" id="ed-replyto" class="editor-input" placeholder="reponses@exemple.com" autocomplete="off"/>
        <label class="editor-label">Source HTML (compatible Gmail : tables, styles inline)</label>
        <textarea id="ed-html" class="editor-textarea" rows="16" spellcheck="false"></textarea>
        <p class="editor-label">Variables détectées</p>
        <div id="ed-var-chips" class="var-chips"></div>
        <div class="row-actions editor-compose-actions">
          <button type="button" class="btn" id="ed-preview-refresh">Actualiser l’aperçu</button>
          <button type="button" class="btn" id="ed-lint">Indicateur anti-spam</button>
        </div>
        <div id="ed-lint-out" class="ed-lint-out" hidden></div>
        <div class="editor-test-send-block">
          <p class="editor-label" style="margin-top:1.1rem">E-mail de test (rendu réel)</p>
          <p class="editor-hint" style="margin:-0.35rem 0 0.65rem">Envoie <strong>une fois</strong> le brouillon fusionné (profil du menu ci‑dessus + exemple de ligne « liste » : Marie Martin, Société Exemple) via votre <strong>relais</strong> et le <strong>premier compte actif</strong> du pool Gmail. L’objet est préfixé <code>[Test]</code> pour le repérer. Vérifiez le message sur <strong>webmail + mobile</strong> : le rendu peut différer de l’iframe d’aperçu.</p>
          <div class="editor-test-send-row">
            <input type="email" id="ed-test-to" class="editor-input" placeholder="Adresse qui recevra le test" autocomplete="email"/>
            <button type="button" class="btn primary" id="ed-test-send">Envoyer le test</button>
          </div>
          <p id="ed-test-status" class="editor-hint" style="margin-top:0.5rem" aria-live="polite"></p>
        </div>
        </div>
      </div>
    </div>
  </div>
  <div class="editor-column editor-preview-column">
    <div class="panel editor-preview-panel">
      <div class="panel-h">
        <h2>Aperçu</h2>
        <span class="editor-preview-tag" id="ed-preview-context-tag">—</span>
      </div>
      <div class="panel-b editor-preview-wrap">
        <div class="editor-preview-chrome" aria-hidden="true">
          <span class="editor-preview-chrome-dots"><span></span><span></span><span></span></span>
          <span class="editor-preview-chrome-label">Aperçu (comme dans le navigateur)</span>
        </div>
        <div class="editor-preview-viewport">
          <iframe id="ed-preview-frame" class="editor-preview-frame" title="Aperçu e-mail" sandbox="allow-same-origin"></iframe>
        </div>
      </div>
    </div>
  </div>
</div>`;
  }

  async function buildPreviewData() {
    let prof = await getProfileForDraft();
    if (!prof || typeof prof !== 'object') {
      prof = (await db.getMeta('user_profile')) || {};
    }
    let fromProfile = {};
    const merge = global.InvooEmailMerge;
    if (merge && typeof merge.profileToTemplateFields === 'function') {
      fromProfile = merge.profileToTemplateFields(prof);
    }
    const out = { ...PREVIEW_FALLBACK };
    for (const [k, v] of Object.entries(fromProfile)) {
      out[k] = v == null ? '' : String(v);
    }
    const wa = out.whatsapp_lien || out.whatsapp_link;
    if (wa) {
      const s = String(wa);
      out.whatsapp_lien = s;
      out.whatsapp_link = s;
    }
    return out;
  }

  async function buildPreviewRaw() {
    let prof = await getProfileForDraft();
    if (!prof || typeof prof !== 'object') {
      prof = (await db.getMeta('user_profile')) || {};
    }
    const merge = global.InvooEmailMerge;
    let cv = '';
    if (merge && typeof merge.profileCvRawHtml === 'function') {
      cv = merge.profileCvRawHtml(prof);
    }
    return { cv_html: cv };
  }

  function fitPreviewFrame(frame) {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      const bodyH = doc.body ? doc.body.scrollHeight : 0;
      const htmlH = doc.documentElement ? doc.documentElement.scrollHeight : 0;
      const h = Math.max(560, bodyH, htmlH);
      frame.style.height = Math.min(h + 8, 2200) + 'px';
    } catch (_) {
      // iframe timing/sandbox guard
    }
  }

  async function updatePreview(frame, html) {
    if (!frame) return;
    const data = await buildPreviewData();
    const raw = await buildPreviewRaw();
    const prof = await getProfileForDraft();
    const merge = global.InvooEmailMerge;
    let src = String(html || '');
    if (merge && typeof merge.stripCvButtonIfNoCvPortfolioUrl === 'function') {
      src = merge.stripCvButtonIfNoCvPortfolioUrl(src, prof);
    }
    const langSel = document.querySelector('#email-editor-root #ed-tpl-lang');
    const previewLang = langSel && langSel.value === 'en' ? 'en' : 'fr';
    frame.onload = () => fitPreviewFrame(frame);
    frame.srcdoc = applyVarsPreview(src, data, raw, { previewLang });
    setTimeout(() => fitPreviewFrame(frame), 120);
  }

  function wire(root) {
    const subject = root.querySelector('#ed-subject');
    const replyTo = root.querySelector('#ed-replyto');
    const ta = root.querySelector('#ed-html');
    const chips = root.querySelector('#ed-var-chips');
    const frame = root.querySelector('#ed-preview-frame');
    const btnSave = root.querySelector('#ed-save');
    const btnPrev = root.querySelector('#ed-preview-refresh');
    const btnLint = root.querySelector('#ed-lint');
    const lintOut = root.querySelector('#ed-lint-out');
    const btnTplStage = root.querySelector('#ed-tpl-stage');
    const btnTplJob = root.querySelector('#ed-tpl-job');
    const btnTplVolunteer = root.querySelector('#ed-tpl-volunteer');
    const selTplLang = root.querySelector('#ed-tpl-lang');
    const customName = root.querySelector('#ed-custom-name');
    const btnCustomSave = root.querySelector('#ed-custom-save');
    const customList = root.querySelector('#ed-custom-modules-list');
    const selProfile = root.querySelector('#ed-profile-active');
    const selCv = root.querySelector('#ed-cv-active');
    const previewTag = root.querySelector('#ed-preview-context-tag');
    const btnOpenSettingsProfile = root.querySelector('#ed-open-settings-profile');

    let lastGoodProfileId = '';
    let lastGoodCvId = '';

    function showEdToast(msg, isErr) {
      const app = global.InvooApp;
      if (app && app.showToast) app.showToast(msg, !!isErr);
      else if (isErr) console.error(msg);
      else console.info(msg);
    }

    async function updateEditorContextSummary() {
      const el = root.querySelector('#ed-context-summary');
      if (!el) return;
      if (!global.InvooSettings || typeof global.InvooSettings.getProfile !== 'function') {
        el.textContent =
          'Profil : indisponible (rechargez la page). Les variables du brouillon utiliseront le dernier profil connu ou les listes importées seules.';
        if (previewTag) previewTag.textContent = '—';
        return;
      }
      try {
        const p = await getProfileForDraft();
        const globalP = await global.InvooSettings.getProfile();
        const same =
          p &&
          globalP &&
          p.id != null &&
          globalP.id != null &&
          String(p.id) === String(globalP.id);
        const pLabel =
          p.profileLabel != null && String(p.profileLabel).trim()
            ? String(p.profileLabel).trim()
            : [p.firstName, p.lastName].filter(Boolean).join(' ').trim() || 'Profil';
        const variants = Array.isArray(p.cvHtmlVariants) ? p.cvHtmlVariants : [];
        const cvPick =
          variants.find((v) => v && String(v.id) === String(p.selectedCvHtmlId)) || variants[0];
        const cvLabel =
          cvPick && cvPick.label != null && String(cvPick.label).trim()
            ? String(cvPick.label).trim()
            : 'CV';
        const gLabel =
          globalP &&
          (globalP.profileLabel != null && String(globalP.profileLabel).trim()
            ? String(globalP.profileLabel).trim()
            : [globalP.firstName, globalP.lastName].filter(Boolean).join(' ').trim() || 'Profil');
        let html = `Ce brouillon fusionne avec le profil <strong>${escHtml(pLabel)}</strong> et le CV <strong>${escHtml(cvLabel)}</strong> (aperçu et Blast). Une colonne de liste <strong>non vide</strong> peut remplacer la même variable ; une cellule vide laisse la valeur du profil.`;
        if (!same && globalP) {
          html += ` <span style="opacity:0.88">Profil par défaut de l’app (Paramètres / tableau de bord) : <strong>${escHtml(gLabel)}</strong> — inchangé.</span>`;
        }
        el.innerHTML = html;
        if (previewTag) {
          const shortP = pLabel.length > 22 ? `${pLabel.slice(0, 20)}…` : pLabel;
          const shortC = cvLabel.length > 18 ? `${cvLabel.slice(0, 16)}…` : cvLabel;
          previewTag.textContent = `${shortP} · ${shortC}`;
        }
      } catch (e) {
        el.textContent = 'Impossible de lire le profil. Vérifiez Paramètres ou rechargez la page.';
        if (previewTag) previewTag.textContent = '—';
      }
    }

    async function refreshProfileSelect() {
      if (!selProfile || !global.InvooSettings || typeof global.InvooSettings.listProfiles !== 'function')
        return;
      const rows = await global.InvooSettings.listProfiles();
      const d = await loadDraft();
      const globalP = await global.InvooSettings.getProfile();
      const globalId = globalP && globalP.id != null ? String(globalP.id) : '';
      let want = d.draftProfileId != null ? String(d.draftProfileId).trim() : '';
      if (want && !rows.some((r) => String(r.id) === want)) {
        await saveDraft(d.subject, d.replyTo, d.html, { draftProfileId: null, silent: true });
        want = '';
      }
      if (!want) {
        want =
          globalId && rows.some((r) => String(r.id) === globalId)
            ? globalId
            : rows[0]?.id
              ? String(rows[0].id)
              : '';
      }
      const opts = rows
        .map((r) => {
          const val = String(r.id).replace(/"/g, '&quot;');
          return `<option value="${val}">${escHtml(r.label)}</option>`;
        })
        .join('');
      selProfile.innerHTML = opts || '<option value="">—</option>';
      if (want && rows.some((r) => String(r.id) === want)) {
        selProfile.value = want;
        lastGoodProfileId = want;
      } else if (rows.length && rows[0].id) {
        lastGoodProfileId = String(rows[0].id);
      }
    }

    async function refreshCvSelect() {
      if (!selCv || !global.InvooSettings) return;
      const p = await getProfileForDraft();
      const variants = Array.isArray(p.cvHtmlVariants) ? p.cvHtmlVariants : [];
      const opts = variants
        .map((v) => {
          const id = v.id != null ? String(v.id) : '';
          const val = id.replace(/"/g, '&quot;');
          return `<option value="${val}">${escHtml(v.label != null ? String(v.label) : '')}</option>`;
        })
        .join('');
      selCv.innerHTML = opts || '<option value="">—</option>';
      const want =
        p.selectedCvHtmlId && variants.some((x) => x.id === p.selectedCvHtmlId)
          ? p.selectedCvHtmlId
          : variants[0]?.id;
      if (want && variants.some((x) => x.id === want)) {
        selCv.value = want;
        lastGoodCvId = want;
      } else if (variants[0]?.id) {
        lastGoodCvId = variants[0].id;
      }
    }

    async function refreshCustomModulesList() {
      if (!customList) return;
      const modules = await getCustomModules();
      if (!modules.length) {
        customList.innerHTML =
          '<p class="editor-hint editor-custom-modules-empty">Aucun module personnalisé. Rédigez un message ci‑dessous, indiquez un nom puis cliquez sur « Enregistrer comme module ».</p>';
        return;
      }
      const rows = modules
        .slice()
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .map((m) => {
          const title = escHtml(m.name || 'Sans nom');
          const id = String(m.id).replace(/"/g, '');
          return `<div class="editor-custom-module-row">
  <span class="editor-custom-module-title">${title}</span>
  <span class="editor-custom-module-actions">
    <button type="button" class="btn editor-tpl-btn" data-ed-use="${id}">Utiliser</button>
    <button type="button" class="btn" data-ed-del="${id}">Supprimer</button>
  </span>
</div>`;
        })
        .join('');
      customList.innerHTML = rows;
    }

    if (btnOpenSettingsProfile) {
      btnOpenSettingsProfile.addEventListener('click', () => {
        const nav = global.InvooNavigation;
        if (nav && typeof nav.setActivePage === 'function') nav.setActivePage('settings');
        else showEdToast('Navigation indisponible.', true);
      });
    }

    if (selProfile) {
      selProfile.addEventListener('change', async () => {
        const desired = selProfile.value;
        try {
          await saveDraft(subject.value, replyTo.value, ta.value, {
            draftProfileId: desired,
            silent: true
          });
          let sub = subject.value;
          let rt = replyTo.value;
          if (global.InvooSettings && typeof global.InvooSettings.getProfileById === 'function') {
            const np = await global.InvooSettings.getProfileById(desired);
            if (np) {
              if (!String(sub || '').trim() && String(np.emailSubject || '').trim()) {
                sub = String(np.emailSubject);
              }
              if (!String(rt || '').trim() && String(np.emailReplyTo || '').trim()) {
                rt = String(np.emailReplyTo);
              }
            }
          }
          subject.value = sub;
          replyTo.value = rt;
          await saveDraft(sub, rt, ta.value, { draftProfileId: desired, silent: true });
          lastGoodProfileId = desired;
          await refreshCvSelect();
          await syncTemplateLangFromDraftProfile();
          await updateEditorContextSummary();
          await updatePreview(frame, ta.value);
        } catch (e) {
          if (lastGoodProfileId && [...selProfile.options].some((o) => o.value === lastGoodProfileId)) {
            selProfile.value = lastGoodProfileId;
          }
          showEdToast(e.message || String(e), true);
        }
      });
    }

    if (selCv) {
      selCv.addEventListener('change', async () => {
        const fn = global.InvooSettings && global.InvooSettings.setSelectedCvHtmlId;
        if (typeof fn !== 'function') return;
        const desired = selCv.value;
        const d = await loadDraft();
        const profileForCv =
          d.draftProfileId != null && String(d.draftProfileId).trim()
            ? String(d.draftProfileId).trim()
            : undefined;
        try {
          const ok = await fn(desired, profileForCv);
          if (!ok) {
            if (lastGoodCvId && [...selCv.options].some((o) => o.value === lastGoodCvId)) {
              selCv.value = lastGoodCvId;
            }
            showEdToast('Ce CV n’existe pas pour ce profil — choix réinitialisé.', true);
            return;
          }
          lastGoodCvId = desired;
          await updateEditorContextSummary();
          await updatePreview(frame, ta.value);
        } catch (e) {
          if (lastGoodCvId && [...selCv.options].some((o) => o.value === lastGoodCvId)) {
            selCv.value = lastGoodCvId;
          }
          showEdToast(e.message || String(e), true);
        }
      });
    }

    if (customList) {
      customList.addEventListener('click', async (ev) => {
        const btnUse = ev.target.closest('[data-ed-use]');
        const btnDel = ev.target.closest('[data-ed-del]');
        if (btnUse) {
          const id = btnUse.getAttribute('data-ed-use');
          const modules = await getCustomModules();
          const mod = modules.find((x) => String(x.id) === id);
          if (!mod) return;
          const hasContent = (ta.value || '').trim().length > 0 || (subject.value || '').trim().length > 0;
          if (hasContent) {
            const dlg = global.InvooConfirm;
            const ok = dlg
              ? await dlg.show({
                  title: 'Remplacer le brouillon ?',
                  message:
                    'Remplacer l’objet, le Reply-To et le corps HTML par ce module ? Le contenu actuel sera perdu si vous ne l’avez pas enregistré.',
                  confirmLabel: 'Remplacer',
                  cancelLabel: 'Annuler'
                })
              : global.confirm('Remplacer le brouillon par ce module ?');
            if (!ok) return;
          }
          subject.value = mod.subject == null ? '' : String(mod.subject);
          replyTo.value = mod.replyTo == null ? '' : String(mod.replyTo);
          ta.value = mod.html == null ? '' : String(mod.html);
          onTyping();
          try {
            await saveDraft(subject.value, replyTo.value, ta.value);
          } catch (e) {
            console.error(e);
          }
          updatePreview(frame, ta.value).catch(console.error);
          const app = global.InvooApp;
          if (app && app.showToast) {
            app.showToast('Module appliqué — brouillon enregistré (utilisé pour Blast).', false);
          }
          return;
        }
        if (btnDel) {
          const id = btnDel.getAttribute('data-ed-del');
          const dlg = global.InvooConfirm;
          const ok = dlg
            ? await dlg.show({
                title: 'Supprimer ce module ?',
                message: 'Ce module sera retiré de la liste (le brouillon actuel ne change pas).',
                confirmLabel: 'Supprimer',
                cancelLabel: 'Annuler',
                danger: true
              })
            : global.confirm('Supprimer ce module ?');
          if (!ok) return;
          const modules = await getCustomModules();
          await setCustomModules(modules.filter((x) => String(x.id) !== id));
          await db.appendLog('info', 'Module e-mail personnalisé supprimé.', { id });
          await refreshCustomModulesList();
          const app = global.InvooApp;
          if (app && app.showToast) app.showToast('Module supprimé.', false);
        }
      });
    }

    if (btnCustomSave && customName) {
      btnCustomSave.addEventListener('click', async () => {
        const name = String(customName.value || '').trim();
        if (!name) {
          const app = global.InvooApp;
          if (app && app.showToast) app.showToast('Indiquez un nom pour le module.', true);
          customName.focus();
          return;
        }
        const modules = await getCustomModules();
        if (modules.length >= MAX_CUSTOM_MODULES) {
          const app = global.InvooApp;
          if (app && app.showToast)
            app.showToast(`Limite de ${MAX_CUSTOM_MODULES} modules atteinte. Supprimez-en un avant d’en ajouter.`, true);
          return;
        }
        const id = db && typeof db.uuid === 'function' ? db.uuid() : `cm-${Date.now()}`;
        const next = modules.concat([
          {
            id,
            name: name.slice(0, 120),
            subject: subject.value,
            replyTo: replyTo.value,
            html: ta.value,
            createdAt: Date.now()
          }
        ]);
        await setCustomModules(next);
        customName.value = '';
        await db.appendLog('info', 'Module e-mail personnalisé enregistré.', { name: name.slice(0, 120) });
        await refreshCustomModulesList();
        const app = global.InvooApp;
        if (app && app.showToast) app.showToast('Module enregistré. Vous pouvez le réutiliser avec « Utiliser ».', false);
      });
    }

    function tplLang() {
      return normalizeBaseLang(selTplLang && selTplLang.value);
    }

    function onTyping() {
      renderVarChips(chips, extractVars(ta.value));
    }

    /** Aligne la langue des modèles sur le profil du brouillon (Paramètres → ce profil). */
    async function syncTemplateLangFromDraftProfile() {
      if (!selTplLang || !subject || !ta) return;
      const prof = await getProfileForDraft();
      const lang = prof && prof.preferredTemplateLang === 'en' ? 'en' : 'fr';
      if (selTplLang.value === lang) return;
      selTplLang.value = lang;
      await db.setMeta(META_BASE_LANG, lang);
      swapDraftToTemplateLanguage(lang, subject, ta);
      onTyping();
      await saveDraft(subject.value, replyTo.value, ta.value, { silent: true });
      await updatePreview(frame, ta.value);
    }

    if (selTplLang) {
      selTplLang.addEventListener('change', () => {
        const lang = tplLang();
        db.setMeta(META_BASE_LANG, lang).catch(console.error);
        swapDraftToTemplateLanguage(lang, subject, ta);
        onTyping();
        saveDraft(subject.value, replyTo.value, ta.value).catch(console.error);
        updatePreview(frame, ta.value).catch(console.error);
      });
    }

    ta.addEventListener('input', onTyping);

    async function applyBaseTemplate(subjectTpl, htmlTpl) {
      const hasContent =
        (ta.value || '').trim().length > 0 || (subject.value || '').trim().length > 0;
      if (hasContent) {
        const dlg = global.InvooConfirm;
        const ok = dlg
          ? await dlg.show({
              title: 'Remplacer le modèle ?',
              message:
                'Remplacer l’objet et le corps HTML par ce modèle ? Le contenu actuel sera perdu si vous n’avez pas enregistré.',
              confirmLabel: 'Remplacer',
              cancelLabel: 'Annuler'
            })
          : global.confirm(
              'Remplacer l’objet et le corps HTML par ce modèle ? Le contenu actuel sera perdu si vous n’avez pas enregistré.'
            );
        if (!ok) return;
      }
      subject.value = subjectTpl;
      ta.value = htmlTpl;
      onTyping();
      try {
        await saveDraft(subject.value, replyTo.value, ta.value);
      } catch (e) {
        console.error(e);
      }
      updatePreview(frame, ta.value).catch(console.error);
    }

    if (btnTplStage) {
      btnTplStage.addEventListener('click', () => {
        applyBaseTemplate(
          tplLang() === 'en' ? DEFAULT_STAGE_SUBJECT_EN : DEFAULT_STAGE_SUBJECT,
          tplLang() === 'en' ? DEFAULT_STAGE_HTML_EN : DEFAULT_STAGE_HTML
        ).catch(console.error);
      });
    }
    if (btnTplJob) {
      btnTplJob.addEventListener('click', () => {
        applyBaseTemplate(
          tplLang() === 'en' ? DEFAULT_JOB_SUBJECT_EN : DEFAULT_JOB_SUBJECT,
          tplLang() === 'en' ? DEFAULT_JOB_HTML_EN : DEFAULT_JOB_HTML
        ).catch(console.error);
      });
    }
    if (btnTplVolunteer) {
      btnTplVolunteer.addEventListener('click', () => {
        applyBaseTemplate(
          tplLang() === 'en' ? DEFAULT_VOLUNTEER_SUBJECT_EN : DEFAULT_VOLUNTEER_SUBJECT,
          tplLang() === 'en' ? DEFAULT_VOLUNTEER_HTML_EN : DEFAULT_VOLUNTEER_HTML
        ).catch(console.error);
      });
    }

    btnPrev.addEventListener('click', () => updatePreview(frame, ta.value).catch(console.error));

    if (btnLint && lintOut) {
      btnLint.addEventListener('click', () => {
        const merge = global.InvooEmailMerge;
        if (!merge || typeof merge.lintOutgoingEmail !== 'function') {
          lintOut.hidden = false;
          lintOut.className = 'ed-lint-out ed-lint-warn';
          lintOut.textContent = 'Module InvooEmailMerge indisponible (vérifiez le chargement de email-merge.js).';
          return;
        }
        const warnings = merge.lintOutgoingEmail({ subject: subject.value, html: ta.value });
        if (!warnings.length) {
          lintOut.hidden = false;
          lintOut.className = 'ed-lint-out ed-lint-ok';
          lintOut.textContent =
            'Aucun problème évident détecté (analyse simple). Utilisez « Envoyer le test » pour voir le rendu dans une vraie boîte (Gmail, etc.). Pensez au consentement des destinataires.';
          return;
        }
        lintOut.hidden = false;
        lintOut.className = 'ed-lint-out ed-lint-warn';
        lintOut.innerHTML = '<strong>Points à revoir :</strong><ul>' + warnings.map((w) => `<li>${escHtml(w)}</li>`).join('') + '</ul>';
      });
    }

    const btnTestSend = root.querySelector('#ed-test-send');
    const inputTestTo = root.querySelector('#ed-test-to');
    const testStatus = root.querySelector('#ed-test-status');

    async function sendTestEmail() {
      const netNow = global.InvooNetwork;
      const relayNow = global.InvooSmtpRelayClient;
      const settingsNow = global.InvooSettings;
      const gmailNow = global.InvooGmailAccountStore;

      const toAddr = inputTestTo ? String(inputTestTo.value || '').trim().toLowerCase() : '';
      if (testStatus) testStatus.textContent = '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toAddr)) {
        showEdToast('Indiquez une adresse e-mail de test valide.', true);
        if (inputTestTo) inputTestTo.focus();
        return;
      }
      if (!netNow || typeof netNow.requireOnline !== 'function') {
        showEdToast('Réseau indisponible (rechargez la page).', true);
        return;
      }
      if (!relayNow || typeof relayNow.relaySendMail !== 'function') {
        showEdToast('Client relais SMTP indisponible. Rechargez la page après mise à jour de l’app.', true);
        return;
      }
      if (!settingsNow || typeof settingsNow.getBlastConfig !== 'function') {
        showEdToast('Paramètres indisponibles.', true);
        return;
      }
      const merge = global.InvooEmailMerge;
      if (!merge || typeof merge.mergeWithProfileAndContact !== 'function') {
        showEdToast('Module de fusion e-mail indisponible.', true);
        return;
      }

      if (btnTestSend) btnTestSend.disabled = true;
      try {
        await netNow.requireOnline('Envoi du test : connexion Internet requise.');
        if (global.InvooCryptoVault && typeof global.InvooCryptoVault.ensureUnlockedForDevice === 'function') {
          await global.InvooCryptoVault.ensureUnlockedForDevice();
        }

        await persistDraftFromEditorDom();

        const draft = await loadDraft();
        let profileForSend = null;
        const dpid = draft.draftProfileId != null ? String(draft.draftProfileId).trim() : '';
        if (dpid && settingsNow && typeof settingsNow.getProfileById === 'function') {
          profileForSend = await settingsNow.getProfileById(dpid);
        }
        if (!profileForSend && settingsNow && typeof settingsNow.getProfile === 'function') {
          profileForSend = await settingsNow.getProfile();
        }

        const templateRow = await getDraftAsTemplateRow();
        if (!String(templateRow.subject || '').trim()) {
          showEdToast('Objet vide — renseignez l’objet ou le profil (Objet e-mail).', true);
          return;
        }
        if (!String(templateRow.html || '').trim()) {
          showEdToast('Corps du message vide.', true);
          return;
        }

        const testContact = {
          id: '__editor_test_row__',
          email: toAddr,
          fields: {
            prenom: 'Marie',
            nom: 'Martin',
            societe: 'Société Exemple SA',
            organisation: 'Organisation Exemple'
          }
        };
        const merged = await merge.mergeWithProfileAndContact(templateRow, testContact, profileForSend);
        const testSubject = `[Test] ${String(merged.subject || '').trim()}`;

        const cfg = await settingsNow.getBlastConfig();
        const isCloud = cfg.sendingMode === 'cloud';

        if (!isCloud && !gmailNow) {
          showEdToast('Pool Gmail indisponible.', true);
          return;
        }

        if (isCloud) {
          const cw = global.InvooCloudWorkerClient;
          if (!cw || typeof cw.sendViaWorker !== 'function') {
            showEdToast('Client Worker indisponible (rechargez la page).', true);
            return;
          }
          let wu = String(cfg.cloudWorkerUrl || '').trim();
          wu = cw.normalizeWorkerBaseUrl(wu);
          if (!wu) {
            showEdToast('URL du Worker Cloud non configurée (Paramètres).', true);
            return;
          }
          const wh = await cw.workerHealth(wu);
          if (!wh.ok) {
            showEdToast(wh.message || 'Relais injoignable', true);
            return;
          }
          const wBase = wh.resolvedBase || wu;
          const textExtra =
            cfg.plainTextAlternative && typeof cw.htmlToPlainApprox === 'function'
              ? cw.htmlToPlainApprox(merged.html)
              : null;
          if (testStatus) testStatus.textContent = 'Envoi via Worker Cloud…';
          await cw.sendViaWorker(wBase, {
            to: toAddr,
            subject: testSubject,
            html: merged.html,
            ...(textExtra ? { text: textExtra } : {})
          });
          await db.appendLog('info', 'E-mail de test envoyé depuis l’éditeur (Worker).', { to: toAddr });
          showEdToast(`Test envoyé vers ${toAddr} (Cloud Worker).`);
          if (testStatus) {
            testStatus.textContent = `Envoyé — vérifiez ${toAddr}. L’expéditeur est celui défini côté Worker (Resend).`;
          }
          global.dispatchEvent(new CustomEvent('invooblast:blast-settings-updated'));
          return;
        }

        const relayUrl = relayNow.normalizeBaseUrl(cfg.smtpRelayUrl);
        const apiKey = cfg.smtpRelayApiKey != null ? String(cfg.smtpRelayApiKey) : '';

        if (relayNow.mixedContentBlocksFetch && relayNow.mixedContentBlocksFetch(relayUrl)) {
          showEdToast(
            'HTTPS + relais en http:// : impossible depuis ce site. Utilisez localhost ou un relais HTTPS.',
            true
          );
          return;
        }

        const health = await relayNow.relayHealth(relayUrl, apiKey);
        if (!health.ok) {
          showEdToast(health.message || 'Relais injoignable. Lancez le serveur dans server/.', true);
          return;
        }
        const base = health.resolvedBase || relayUrl;

        const rows = await gmailNow.listAccounts();
        const pool = buildTestAccountPool(rows, cfg);
        if (!pool.length) {
          showEdToast('Aucun compte Gmail actif dans le pool (Paramètres).', true);
          return;
        }
        const account = pool[0];
        const auth = await gmailNow.getSmtpAuth(account.id);
        if (!auth) {
          showEdToast('Impossible de lire les identifiants du compte d’envoi (coffre ou compte désactivé).', true);
          return;
        }

        const payload = {
          auth,
          from: auth.user,
          to: toAddr,
          subject: testSubject,
          html: merged.html
        };
        if (merged.replyTo) payload.replyTo = merged.replyTo;
        if (cfg.listUnsubscribeHeader) payload.listUnsubscribeHeader = true;
        if (cfg.plainTextAlternative) payload.plainTextAlternative = true;

        if (testStatus) testStatus.textContent = `Envoi via ${auth.user}…`;
        await relayNow.relaySendMail(base, payload, apiKey);
        await gmailNow.recordSendOutcome(account.id, {
          ok: true,
          disableOnError: cfg.disableOnError !== false
        });
        await db.appendLog('info', 'E-mail de test envoyé depuis l’éditeur.', {
          to: toAddr,
          from: auth.user
        });
        showEdToast(`Test envoyé vers ${toAddr} (expéditeur : ${auth.user}).`);
        if (testStatus) testStatus.textContent = `Envoyé — vérifiez la boîte ${toAddr} (web + mobile). Expéditeur : ${auth.user}.`;
        global.dispatchEvent(new CustomEvent('invooblast:blast-settings-updated'));
      } catch (e) {
        const msg = e && e.message ? String(e.message) : String(e);
        showEdToast(msg, true);
        if (testStatus) testStatus.textContent = '';
        try {
          const cfg = await settingsNow.getBlastConfig();
          if (cfg.sendingMode === 'cloud') return;
          const rows = await gmailNow.listAccounts();
          const pool = buildTestAccountPool(rows, cfg);
          const account = pool[0];
          if (account && gmailNow.recordSendOutcome) {
            await gmailNow.recordSendOutcome(account.id, {
              ok: false,
              errorMessage: msg,
              disableOnError: false
            });
          }
        } catch (_) {}
      } finally {
        if (btnTestSend) btnTestSend.disabled = false;
      }
    }

    if (btnTestSend) {
      btnTestSend.addEventListener('click', () => sendTestEmail().catch((e) => showEdToast(e.message || String(e), true)));
    }

    btnSave.addEventListener('click', async () => {
      try {
        await saveDraft(subject.value, replyTo.value, ta.value);
        const app = global.InvooApp;
        if (app && app.showToast) app.showToast('Brouillon enregistré.', false);
        if (global.InvooDashboard && global.InvooDashboard.refreshDashboard) {
          global.InvooDashboard.refreshDashboard().catch(() => {});
        }
      } catch (e) {
        console.error(e);
        const app = global.InvooApp;
        if (app && app.showToast) app.showToast(e.message || String(e), true);
      }
    });

    ensureLegacyTemplatesCleared()
      .then(() => loadDraft())
      .then(async (d) => {
        let subj = d.subject;
        let rto = d.replyTo;
        const prof = await getProfileForDraft();
        if (!String(subj || '').trim() && prof && String(prof.emailSubject || '').trim()) {
          subj = String(prof.emailSubject);
        }
        if (!String(rto || '').trim() && prof && String(prof.emailReplyTo || '').trim()) {
          rto = String(prof.emailReplyTo);
        }
        subject.value = subj;
        replyTo.value = rto;
        ta.value = d.html;
        if (
          String(subj || '') !== String(d.subject || '') ||
          String(rto || '') !== String(d.replyTo || '')
        ) {
          await saveDraft(subj, rto, d.html, { silent: true });
        }
        const lang = prof && prof.preferredTemplateLang === 'en' ? 'en' : 'fr';
        if (selTplLang) selTplLang.value = lang;
        await db.setMeta(META_BASE_LANG, lang);
        swapDraftToTemplateLanguage(lang, subject, ta);
        onTyping();
        return updatePreview(frame, ta.value);
      })
      .then(() =>
        Promise.all([refreshCustomModulesList(), refreshProfileSelect(), refreshCvSelect()])
      )
      .then(() => updateEditorContextSummary())
      .catch(console.error);

    root.__invooRefreshCustomModules = refreshCustomModulesList;
    root.__invooRefreshProfileSelect = refreshProfileSelect;
    root.__invooRefreshCvSelect = refreshCvSelect;
    root.__invooUpdateContextSummary = updateEditorContextSummary;
    root.__invooSyncTemplateLangFromDraftProfile = syncTemplateLangFromDraftProfile;
  }

  /** Même forme qu’un ancien « modèle » pour mergeWithProfileAndContact. */
  async function getDraftAsTemplateRow() {
    const d = await loadDraft();
    let subj = d.subject;
    let rto = d.replyTo;
    const prof = await getProfileForDraft();
    if (!String(subj || '').trim() && prof && String(prof.emailSubject || '').trim()) {
      subj = String(prof.emailSubject);
    }
    if (!String(rto || '').trim() && prof && String(prof.emailReplyTo || '').trim()) {
      rto = String(prof.emailReplyTo);
    }
    return {
      id: 'draft',
      name: 'Brouillon',
      subject: subj,
      replyTo: rto,
      html: d.html
    };
  }

  function initEmailEditor() {
    const root = document.getElementById('email-editor-root');
    if (!root || root.dataset.mounted === '1') return;
    root.dataset.mounted = '1';
    mountEditorHtml(root);
    wire(root);
  }

  async function refreshEditorFromDraft(root) {
    const subjectEl = root.querySelector('#ed-subject');
    const replyEl = root.querySelector('#ed-replyto');
    const taEl = root.querySelector('#ed-html');
    const chipsEl = root.querySelector('#ed-var-chips');
    const frameEl = root.querySelector('#ed-preview-frame');
    if (!taEl || !frameEl) return;
    const d = await loadDraft();
    const prof = await getProfileForDraft();
    const lang = prof && prof.preferredTemplateLang === 'en' ? 'en' : 'fr';
    const langSel = root.querySelector('#ed-tpl-lang');
    if (langSel) langSel.value = lang;
    await db.setMeta(META_BASE_LANG, lang);
    let subj = d.subject;
    let rto = d.replyTo;
    if (!String(subj || '').trim() && prof && String(prof.emailSubject || '').trim()) {
      subj = String(prof.emailSubject);
    }
    if (!String(rto || '').trim() && prof && String(prof.emailReplyTo || '').trim()) {
      rto = String(prof.emailReplyTo);
    }
    if (subjectEl) subjectEl.value = subj;
    if (replyEl) replyEl.value = rto;
    taEl.value = d.html;
    if (
      String(subj || '') !== String(d.subject || '') ||
      String(rto || '') !== String(d.replyTo || '')
    ) {
      await saveDraft(subj, rto, d.html, { silent: true });
    }
    if (subjectEl && taEl) swapDraftToTemplateLanguage(lang, subjectEl, taEl);
    renderVarChips(chipsEl, extractVars(taEl.value));
    if (typeof root.__invooRefreshProfileSelect === 'function') await root.__invooRefreshProfileSelect();
    if (typeof root.__invooRefreshCvSelect === 'function') await root.__invooRefreshCvSelect();
    if (typeof root.__invooUpdateContextSummary === 'function') await root.__invooUpdateContextSummary();
    await updatePreview(frameEl, taEl.value);
    if (typeof root.__invooRefreshCustomModules === 'function') {
      await root.__invooRefreshCustomModules();
    }
  }

  global.addEventListener('invooblast:page', (e) => {
    if (!e.detail || e.detail.page !== 'editor') return;
    const root = document.getElementById('email-editor-root');
    const wasAlreadyMounted = root && root.dataset.mounted === '1';
    initEmailEditor();
    const r = document.getElementById('email-editor-root');
    if (!r || r.dataset.mounted !== '1') return;
    if (wasAlreadyMounted) refreshEditorFromDraft(r).catch(console.error);
  });

  global.addEventListener('invooblast:profile-updated', () => {
    const root = document.getElementById('email-editor-root');
    if (!root || root.dataset.mounted !== '1') return;
    const ta = root.querySelector('#ed-html');
    const frame = root.querySelector('#ed-preview-frame');
    const sync = async () => {
      if (typeof root.__invooRefreshProfileSelect === 'function') {
        await root.__invooRefreshProfileSelect().catch(() => {});
      }
      if (typeof root.__invooRefreshCvSelect === 'function') {
        await root.__invooRefreshCvSelect().catch(() => {});
      }
      if (typeof root.__invooSyncTemplateLangFromDraftProfile === 'function') {
        await root.__invooSyncTemplateLangFromDraftProfile().catch(() => {});
      }
      if (typeof root.__invooUpdateContextSummary === 'function') {
        await root.__invooUpdateContextSummary().catch(() => {});
      }
      if (ta && frame) await updatePreview(frame, ta.value).catch(console.error);
    };
    sync();
  });

  global.addEventListener('invooblast:draft-updated', () => {
    const root = document.getElementById('email-editor-root');
    if (!root || root.dataset.mounted !== '1') return;
    const ta = root.querySelector('#ed-html');
    const frame = root.querySelector('#ed-preview-frame');
    const sync = async () => {
      if (typeof root.__invooRefreshProfileSelect === 'function') {
        await root.__invooRefreshProfileSelect().catch(() => {});
      }
      if (typeof root.__invooRefreshCvSelect === 'function') {
        await root.__invooRefreshCvSelect().catch(() => {});
      }
      if (typeof root.__invooUpdateContextSummary === 'function') {
        await root.__invooUpdateContextSummary().catch(() => {});
      }
      if (ta && frame) await updatePreview(frame, ta.value).catch(console.error);
    };
    sync();
  });

  global.InvooEmailEditor = {
    init: initEmailEditor,
    applyVars,
    applyVarsHeaders,
    applyVarsPreview,
    extractVars,
    buildPreviewData,
    buildPreviewRaw,
    loadDraft,
    persistDraftFromEditorDom,
    getProfileForDraft,
    getDraftAsTemplateRow,
    getCustomModules,
    META_CUSTOM_MODULES,
    META_BASE_LANG,
    normalizeBaseLang,
    DEFAULT_STAGE_SUBJECT,
    DEFAULT_STAGE_HTML,
    DEFAULT_STAGE_SUBJECT_EN,
    DEFAULT_STAGE_HTML_EN,
    DEFAULT_JOB_SUBJECT,
    DEFAULT_JOB_HTML,
    DEFAULT_JOB_SUBJECT_EN,
    DEFAULT_JOB_HTML_EN,
    DEFAULT_VOLUNTEER_SUBJECT,
    DEFAULT_VOLUNTEER_HTML,
    DEFAULT_VOLUNTEER_SUBJECT_EN,
    DEFAULT_VOLUNTEER_HTML_EN,
    PREVIEW_FALLBACK
  };
})(window);
