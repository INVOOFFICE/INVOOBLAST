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
<<<<<<< HEAD
=======
  /** Modules personnalisés : [{ id, name, subject, replyTo, html, createdAt }] */
  const META_CUSTOM_MODULES = 'email_editor_custom_modules';
  const MAX_CUSTOM_MODULES = 40;
>>>>>>> 7f4f399 (ok)

  /** Valeurs de démonstration uniquement pour des variables absentes du profil (aperçu). */
  const PREVIEW_FALLBACK = {
    organisation: 'Organisation (exemple)',
    signature: 'L’équipe',
    email_contact: 'contact@exemple.org',
    lien_desinscription: 'https://exemple.org/desabonnement',
    nom_complet: 'Prénom Nom',
    lien_cv: 'https://exemple.org/cv.pdf',
    whatsapp_lien: 'https://wa.me/33600000000',
    whatsapp_link: 'https://wa.me/33600000000'
  };

  const DEFAULT_STAGE_SUBJECT = 'Demande de stage — {{prenom}} {{nom}} | Candidature spontanée';

<<<<<<< HEAD
  /** Modèle « demande de stage » — Gmail-friendly (tables + styles inline). CV : {{@cv_html}} depuis Paramètres. */
=======
  /** Modèle « demande de stage » — style administratif sobre (tables + styles inline, compatible Gmail). */
>>>>>>> 7f4f399 (ok)
  const DEFAULT_STAGE_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Demande de stage</title>
</head>
<<<<<<< HEAD
<body style="margin:0;padding:0;background-color:#e8edf5;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#e8edf5;">
<tr>
<td align="center" style="padding:24px 12px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #c7d2fe;">
<tr>
<td style="height:5px;line-height:5px;font-size:0;background-color:#2563eb;">&nbsp;</td>
</tr>
<tr>
<td style="padding:32px 40px 28px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;">
<span style="display:inline-block;padding:5px 14px;border-radius:999px;background-color:#dbeafe;color:#1e40af;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Candidature</span>
<h1 style="margin:16px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#0f172a;font-weight:700;">{{prenom}} {{nom}}</h1>
<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#1e293b;font-weight:600;">{{fonction}}</p>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;">Demande de stage · Candidature spontanée</p>
<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;">{{societe}}</p>
</td>
</tr>
<tr>
<td style="padding:32px 40px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.75;color:#334155;">
=======
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
>>>>>>> 7f4f399 (ok)
Madame, Monsieur,<br><br>
Je vous contacte pour vous faire part de ma <strong>motivation</strong> à effectuer un <strong>stage</strong> au sein de votre organisation. Très intéressé par le domaine de <strong>{{domaine}}</strong>, je souhaite mettre mes acquis au service de vos équipes tout en développant mes compétences en contexte professionnel.<br><br>
Rigoureux, à l’écoute et habitué au travail collaboratif, je suis prêt à m’investir sur les missions qui me seront confiées.
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:0 40px 28px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-left:4px solid #2563eb;background-color:#f1f5f9;border-radius:0 10px 10px 0;">
<tr>
<td style="padding:22px 24px;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.06em;">Atouts</p>
<p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:#475569;">Axes prioritaires : <strong style="color:#0f172a;">{{domaine}}</strong>.</p>
<table cellpadding="0" cellspacing="0" role="presentation" style="font-size:14px;line-height:1.6;color:#475569;">
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#2563eb;font-weight:bold;">•</td><td style="padding:3px 0;">Motivation et fiabilité</td></tr>
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#2563eb;font-weight:bold;">•</td><td style="padding:3px 0;">Adaptation rapide aux outils et aux équipes</td></tr>
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#2563eb;font-weight:bold;">•</td><td style="padding:3px 0;">Envie d’apprendre et de progresser</td></tr>
=======
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
>>>>>>> 7f4f399 (ok)
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:0 40px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#475569;">
<table cellpadding="0" cellspacing="0" role="presentation">
<tr><td style="padding:0 12px 10px 0;vertical-align:top;width:22px;">📍</td><td style="padding:0 0 10px 0;"><strong style="color:#334155;">Mobilité</strong> · {{ville}}, {{pays}}</td></tr>
<tr><td style="padding:0 12px 10px 0;vertical-align:top;">📚</td><td style="padding:0 0 10px 0;">Durée courte ou longue selon votre calendrier</td></tr>
<tr><td style="padding:0 12px 0 0;vertical-align:top;">🌍</td><td style="padding:0;">Présentiel ou distanciel possible</td></tr>
=======
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
>>>>>>> 7f4f399 (ok)
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td align="center" style="padding:8px 40px 6px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td align="center" style="border-radius:10px;background-color:#2563eb;">
<a href="#invoo-cv" style="display:inline-block;padding:15px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">Voir mon CV</a>
</td>
</tr>
</table>
<p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;max-width:340px;margin-left:auto;margin-right:auto;">Le détail de mon parcours est inclus <strong>dans ce même e-mail</strong> (aucun site externe requis).</p>
</td>
</tr>
<tr>
<td align="center" style="padding:12px 40px 28px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td style="border-radius:10px;border:2px solid #22c55e;background-color:#ffffff;">
<a href="{{whatsapp_lien}}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#16a34a;text-decoration:none;">Message WhatsApp</a>
=======
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
>>>>>>> 7f4f399 (ok)
</td>
</tr>
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.65;color:#64748b;">
<strong style="color:#0f172a;font-size:14px;">{{nom_complet}}</strong><br>
<span style="color:#94a3b8;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email}}" style="color:#2563eb;text-decoration:none;">{{email}}</a><span style="color:#cbd5e1;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:36px 40px 40px;background-color:#ffffff;border-top:4px solid #e2e8f0;">
<p id="invoo-cv" style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.3;color:#0f172a;font-weight:700;">Curriculum vitæ</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#334155;">
=======
<td style="padding:22px 36px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.65;color:#6b7280;">
<strong style="color:#111827;font-size:13px;">{{nom_complet}}</strong><br>
<span style="color:#9ca3af;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email}}" style="color:#1d4ed8;text-decoration:none;">{{email}}</a><span style="color:#d1d5db;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:32px 36px 36px;background-color:#ffffff;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Annexe</p>
<p id="invoo-cv" style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.35;color:#111827;font-weight:700;">Curriculum vitæ</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#374151;">
>>>>>>> 7f4f399 (ok)
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

<<<<<<< HEAD
  /** Même structure que le modèle stage, orienté emploi salarié (CDI/CDD). */
=======
  /** Emploi CDI/CDD — même squelette, accent ardoise « corporate ». */
>>>>>>> 7f4f399 (ok)
  const DEFAULT_JOB_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Candidature CDI / CDD</title>
</head>
<<<<<<< HEAD
<body style="margin:0;padding:0;background-color:#e8edf5;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#e8edf5;">
<tr>
<td align="center" style="padding:24px 12px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #c7d2fe;">
<tr>
<td style="height:5px;line-height:5px;font-size:0;background-color:#2563eb;">&nbsp;</td>
</tr>
<tr>
<td style="padding:32px 40px 28px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;">
<span style="display:inline-block;padding:5px 14px;border-radius:999px;background-color:#dbeafe;color:#1e40af;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">CDI · CDD</span>
<h1 style="margin:16px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#0f172a;font-weight:700;">{{prenom}} {{nom}}</h1>
<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#1e293b;font-weight:600;">{{fonction}}</p>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;">Modèle Travail (CDI/CDD) · Candidature spontanée professionnelle</p>
<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;">{{societe}}</p>
</td>
</tr>
<tr>
<td style="padding:32px 40px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.75;color:#334155;">
=======
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
>>>>>>> 7f4f399 (ok)
Madame, Monsieur,<br><br>
Par la présente, je vous adresse une <strong>candidature spontanée</strong> pour des postes en entreprise au sein de votre organisation, en <strong>CDI ou CDD</strong>. Fort d’un <strong>vif intérêt</strong> pour le domaine de <strong>{{domaine}}</strong>, je souhaite mettre mon expertise et mon engagement au service de vos objectifs, dans un cadre exigeant et collaboratif.<br><br>
Rigoureux, orienté résultats et à l’aise dans des environnements structurés, je suis disponible pour échanger sur vos besoins et la manière dont je peux contribuer à vos équipes.
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:0 40px 28px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-left:4px solid #2563eb;background-color:#f1f5f9;border-radius:0 10px 10px 0;">
<tr>
<td style="padding:22px 24px;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.06em;">Atouts professionnels</p>
<p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:#475569;">Compétences et savoir-faire privilégiés : <strong style="color:#0f172a;">{{domaine}}</strong>.</p>
<table cellpadding="0" cellspacing="0" role="presentation" style="font-size:14px;line-height:1.6;color:#475569;">
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#2563eb;font-weight:bold;">•</td><td style="padding:3px 0;">Fiabilité, organisation et sens du détail</td></tr>
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#2563eb;font-weight:bold;">•</td><td style="padding:3px 0;">Capacité d’adaptation aux outils, processus et équipes</td></tr>
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#2563eb;font-weight:bold;">•</td><td style="padding:3px 0;">Esprit de synthèse et collaboration efficace</td></tr>
=======
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
>>>>>>> 7f4f399 (ok)
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:0 40px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#475569;">
<table cellpadding="0" cellspacing="0" role="presentation">
<tr><td style="padding:0 12px 10px 0;vertical-align:top;width:22px;">📍</td><td style="padding:0 0 10px 0;"><strong style="color:#334155;">Mobilité</strong> · {{ville}}, {{pays}}</td></tr>
<tr><td style="padding:0 12px 10px 0;vertical-align:top;">💼</td><td style="padding:0 0 10px 0;">Recherche d’emploi salarié : CDI ou CDD selon vos besoins</td></tr>
<tr><td style="padding:0 12px 0 0;vertical-align:top;">🏢</td><td style="padding:0;">Présentiel, hybride ou télétravail selon votre politique</td></tr>
=======
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
>>>>>>> 7f4f399 (ok)
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td align="center" style="padding:8px 40px 6px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td align="center" style="border-radius:10px;background-color:#2563eb;">
<a href="#invoo-cv" style="display:inline-block;padding:15px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">Voir mon CV</a>
</td>
</tr>
</table>
<p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;max-width:340px;margin-left:auto;margin-right:auto;">Le détail de mon parcours est inclus <strong>dans ce même e-mail</strong> (aucun site externe requis).</p>
</td>
</tr>
<tr>
<td align="center" style="padding:12px 40px 28px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td style="border-radius:10px;border:2px solid #22c55e;background-color:#ffffff;">
<a href="{{whatsapp_lien}}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#16a34a;text-decoration:none;">Message WhatsApp</a>
=======
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
>>>>>>> 7f4f399 (ok)
</td>
</tr>
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.65;color:#64748b;">
<strong style="color:#0f172a;font-size:14px;">{{nom_complet}}</strong><br>
<span style="color:#94a3b8;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email}}" style="color:#2563eb;text-decoration:none;">{{email}}</a><span style="color:#cbd5e1;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:36px 40px 40px;background-color:#ffffff;border-top:4px solid #e2e8f0;">
<p id="invoo-cv" style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.3;color:#0f172a;font-weight:700;">Curriculum vitæ</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#334155;">
=======
<td style="padding:22px 36px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.65;color:#6b7280;">
<strong style="color:#111827;font-size:13px;">{{nom_complet}}</strong><br>
<span style="color:#9ca3af;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email}}" style="color:#1d4ed8;text-decoration:none;">{{email}}</a><span style="color:#d1d5db;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:32px 36px 36px;background-color:#ffffff;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Annexe</p>
<p id="invoo-cv" style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.35;color:#111827;font-weight:700;">Curriculum vitæ</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#374151;">
>>>>>>> 7f4f399 (ok)
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

<<<<<<< HEAD
  /** Même structure : missions humanitaires, bénévolat international, ONG, etc. */
=======
  /** Volontariat / ONG — accent vert sobre, mise en page alignée aux autres modèles. */
>>>>>>> 7f4f399 (ok)
  const DEFAULT_VOLUNTEER_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Volontariat &amp; mission solidaire</title>
</head>
<<<<<<< HEAD
<body style="margin:0;padding:0;background-color:#e8edf5;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#e8edf5;">
<tr>
<td align="center" style="padding:24px 12px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #c7d2fe;">
<tr>
<td style="height:5px;line-height:5px;font-size:0;background-color:#2563eb;">&nbsp;</td>
</tr>
<tr>
<td style="padding:32px 40px 28px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;">
<span style="display:inline-block;padding:5px 14px;border-radius:999px;background-color:#d1fae7;color:#047857;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Volontariat</span>
<h1 style="margin:16px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#0f172a;font-weight:700;">{{prenom}} {{nom}}</h1>
<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#1e293b;font-weight:600;">{{fonction}}</p>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;">Modèle Volontariat · Missions humanitaires &amp; bénévolat international</p>
<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;">{{societe}}</p>
</td>
</tr>
<tr>
<td style="padding:32px 40px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.75;color:#334155;">
=======
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
>>>>>>> 7f4f399 (ok)
Madame, Monsieur,<br><br>
Je vous adresse une <strong>candidature spontanée</strong> pour rejoindre vos actions en tant que <strong>volontaire</strong> ou <strong>bénévole</strong>, en France ou à l’international. Sensible aux enjeux humanitaires et fortement motivé par le domaine de <strong>{{domaine}}</strong>, je souhaite contribuer concrètement à vos missions sur le terrain ou en appui.<br><br>
Ouvert d’esprit, à l’écoute et habitué à travailler en équipe dans des contextes variés, je m’engage avec sérieux, respect et disponibilité.
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:0 40px 28px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-left:4px solid #059669;background-color:#ecfdf5;border-radius:0 10px 10px 0;">
<tr>
<td style="padding:22px 24px;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#047857;text-transform:uppercase;letter-spacing:0.06em;">Engagement &amp; savoir-faire</p>
<p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:#475569;">Apports et centres d’intérêt : <strong style="color:#0f172a;">{{domaine}}</strong>.</p>
<table cellpadding="0" cellspacing="0" role="presentation" style="font-size:14px;line-height:1.6;color:#475569;">
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#059669;font-weight:bold;">•</td><td style="padding:3px 0;">Sens du service, empathie et respect des populations accompagnées</td></tr>
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#059669;font-weight:bold;">•</td><td style="padding:3px 0;">Adaptabilité (multiculturel, conditions de terrain, contraintes logistiques)</td></tr>
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#059669;font-weight:bold;">•</td><td style="padding:3px 0;">Fiabilité, esprit de coopération et attitude constructive</td></tr>
=======
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
>>>>>>> 7f4f399 (ok)
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:0 40px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#475569;">
<table cellpadding="0" cellspacing="0" role="presentation">
<tr><td style="padding:0 12px 10px 0;vertical-align:top;width:22px;">📍</td><td style="padding:0 0 10px 0;"><strong style="color:#334155;">Mobilité</strong> · {{ville}}, {{pays}}</td></tr>
<tr><td style="padding:0 12px 10px 0;vertical-align:top;">🌐</td><td style="padding:0 0 10px 0;">Disponible pour des missions en France ou à l’international selon vos programmes</td></tr>
<tr><td style="padding:0 12px 0 0;vertical-align:top;">🤝</td><td style="padding:0;">Bénévolat de moyen / long terme ou missions ponctuelles, selon le besoin</td></tr>
=======
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
>>>>>>> 7f4f399 (ok)
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td align="center" style="padding:8px 40px 6px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td align="center" style="border-radius:10px;background-color:#2563eb;">
<a href="#invoo-cv" style="display:inline-block;padding:15px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">Voir mon CV</a>
</td>
</tr>
</table>
<p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;max-width:340px;margin-left:auto;margin-right:auto;">Le détail de mon parcours est inclus <strong>dans ce même e-mail</strong> (aucun site externe requis).</p>
</td>
</tr>
<tr>
<td align="center" style="padding:12px 40px 28px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td style="border-radius:10px;border:2px solid #22c55e;background-color:#ffffff;">
<a href="{{whatsapp_lien}}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#16a34a;text-decoration:none;">Message WhatsApp</a>
=======
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
>>>>>>> 7f4f399 (ok)
</td>
</tr>
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.65;color:#64748b;">
<strong style="color:#0f172a;font-size:14px;">{{nom_complet}}</strong><br>
<span style="color:#94a3b8;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email}}" style="color:#2563eb;text-decoration:none;">{{email}}</a><span style="color:#cbd5e1;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:36px 40px 40px;background-color:#ffffff;border-top:4px solid #e2e8f0;">
<p id="invoo-cv" style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.3;color:#0f172a;font-weight:700;">Curriculum vitæ</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#334155;">
=======
<td style="padding:22px 36px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.65;color:#6b7280;">
<strong style="color:#111827;font-size:13px;">{{nom_complet}}</strong><br>
<span style="color:#9ca3af;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email}}" style="color:#1d4ed8;text-decoration:none;">{{email}}</a><span style="color:#d1d5db;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:32px 36px 36px;background-color:#ffffff;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Annexe</p>
<p id="invoo-cv" style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.35;color:#111827;font-weight:700;">Curriculum vitæ</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#374151;">
>>>>>>> 7f4f399 (ok)
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
<<<<<<< HEAD
<body style="margin:0;padding:0;background-color:#e8edf5;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#e8edf5;">
<tr>
<td align="center" style="padding:24px 12px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #c7d2fe;">
<tr>
<td style="height:5px;line-height:5px;font-size:0;background-color:#2563eb;">&nbsp;</td>
</tr>
<tr>
<td style="padding:32px 40px 28px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;">
<span style="display:inline-block;padding:5px 14px;border-radius:999px;background-color:#dbeafe;color:#1e40af;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Application</span>
<h1 style="margin:16px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#0f172a;font-weight:700;">{{prenom}} {{nom}}</h1>
<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#1e293b;font-weight:600;">{{fonction}}</p>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;">Internship request · Unsolicited application</p>
<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;">{{societe}}</p>
</td>
</tr>
<tr>
<td style="padding:32px 40px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.75;color:#334155;">
=======
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
>>>>>>> 7f4f399 (ok)
Dear Sir or Madam,<br><br>
I am writing to express my <strong>interest</strong> in completing an <strong>internship</strong> with your organisation. I am particularly drawn to <strong>{{domaine}}</strong> and would welcome the opportunity to contribute to your teams while building professional skills in a real workplace setting.<br><br>
I am diligent, collaborative, and comfortable adapting to new tools and teams.
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:0 40px 28px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-left:4px solid #2563eb;background-color:#f1f5f9;border-radius:0 10px 10px 0;">
<tr>
<td style="padding:22px 24px;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.06em;">Strengths</p>
<p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:#475569;">Key focus areas: <strong style="color:#0f172a;">{{domaine}}</strong>.</p>
<table cellpadding="0" cellspacing="0" role="presentation" style="font-size:14px;line-height:1.6;color:#475569;">
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#2563eb;font-weight:bold;">•</td><td style="padding:3px 0;">Motivation and reliability</td></tr>
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#2563eb;font-weight:bold;">•</td><td style="padding:3px 0;">Quick learner with tools and teamwork</td></tr>
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#2563eb;font-weight:bold;">•</td><td style="padding:3px 0;">Eager to learn and grow</td></tr>
=======
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
>>>>>>> 7f4f399 (ok)
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:0 40px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#475569;">
<table cellpadding="0" cellspacing="0" role="presentation">
<tr><td style="padding:0 12px 10px 0;vertical-align:top;width:22px;">📍</td><td style="padding:0 0 10px 0;"><strong style="color:#334155;">Location</strong> · {{ville}}, {{pays}}</td></tr>
<tr><td style="padding:0 12px 10px 0;vertical-align:top;">📚</td><td style="padding:0 0 10px 0;">Short or long placement, depending on your schedule</td></tr>
<tr><td style="padding:0 12px 0 0;vertical-align:top;">🌍</td><td style="padding:0;">On-site or remote possible</td></tr>
=======
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
>>>>>>> 7f4f399 (ok)
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td align="center" style="padding:8px 40px 6px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td align="center" style="border-radius:10px;background-color:#2563eb;">
<a href="#invoo-cv" style="display:inline-block;padding:15px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">View my CV</a>
</td>
</tr>
</table>
<p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;max-width:340px;margin-left:auto;margin-right:auto;">My background is included <strong>in this same email</strong> (no external website required).</p>
</td>
</tr>
<tr>
<td align="center" style="padding:12px 40px 28px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td style="border-radius:10px;border:2px solid #22c55e;background-color:#ffffff;">
<a href="{{whatsapp_lien}}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#16a34a;text-decoration:none;">WhatsApp message</a>
=======
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
>>>>>>> 7f4f399 (ok)
</td>
</tr>
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.65;color:#64748b;">
<strong style="color:#0f172a;font-size:14px;">{{nom_complet}}</strong><br>
<span style="color:#94a3b8;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email}}" style="color:#2563eb;text-decoration:none;">{{email}}</a><span style="color:#cbd5e1;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:36px 40px 40px;background-color:#ffffff;border-top:4px solid #e2e8f0;">
<p id="invoo-cv" style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.3;color:#0f172a;font-weight:700;">Curriculum vitae</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#334155;">
=======
<td style="padding:22px 36px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.65;color:#6b7280;">
<strong style="color:#111827;font-size:13px;">{{nom_complet}}</strong><br>
<span style="color:#9ca3af;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email}}" style="color:#1d4ed8;text-decoration:none;">{{email}}</a><span style="color:#d1d5db;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:32px 36px 36px;background-color:#ffffff;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Appendix</p>
<p id="invoo-cv" style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.35;color:#111827;font-weight:700;">Curriculum vitae</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#374151;">
>>>>>>> 7f4f399 (ok)
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
<<<<<<< HEAD
<body style="margin:0;padding:0;background-color:#e8edf5;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#e8edf5;">
<tr>
<td align="center" style="padding:24px 12px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #c7d2fe;">
<tr>
<td style="height:5px;line-height:5px;font-size:0;background-color:#2563eb;">&nbsp;</td>
</tr>
<tr>
<td style="padding:32px 40px 28px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;">
<span style="display:inline-block;padding:5px 14px;border-radius:999px;background-color:#dbeafe;color:#1e40af;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Permanent · Fixed-term</span>
<h1 style="margin:16px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#0f172a;font-weight:700;">{{prenom}} {{nom}}</h1>
<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#1e293b;font-weight:600;">{{fonction}}</p>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;">Work template (permanent / fixed-term) · Professional unsolicited application</p>
<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;">{{societe}}</p>
</td>
</tr>
<tr>
<td style="padding:32px 40px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.75;color:#334155;">
=======
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
>>>>>>> 7f4f399 (ok)
Dear Sir or Madam,<br><br>
Please consider this <strong>unsolicited application</strong> for salaried positions (<strong>permanent or fixed-term</strong>) within your organisation. I have a strong interest in <strong>{{domaine}}</strong> and would like to bring my skills and commitment to your objectives in a structured, collaborative environment.<br><br>
I am detail-oriented, results-minded, and comfortable in professional settings; I would welcome a conversation about your needs and how I can support your teams.
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:0 40px 28px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-left:4px solid #2563eb;background-color:#f1f5f9;border-radius:0 10px 10px 0;">
<tr>
<td style="padding:22px 24px;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.06em;">Professional strengths</p>
<p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:#475569;">Skills and expertise: <strong style="color:#0f172a;">{{domaine}}</strong>.</p>
<table cellpadding="0" cellspacing="0" role="presentation" style="font-size:14px;line-height:1.6;color:#475569;">
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#2563eb;font-weight:bold;">•</td><td style="padding:3px 0;">Reliability, organisation, and attention to detail</td></tr>
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#2563eb;font-weight:bold;">•</td><td style="padding:3px 0;">Adapting to tools, processes, and teams</td></tr>
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#2563eb;font-weight:bold;">•</td><td style="padding:3px 0;">Clear communication and effective collaboration</td></tr>
=======
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
>>>>>>> 7f4f399 (ok)
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:0 40px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#475569;">
<table cellpadding="0" cellspacing="0" role="presentation">
<tr><td style="padding:0 12px 10px 0;vertical-align:top;width:22px;">📍</td><td style="padding:0 0 10px 0;"><strong style="color:#334155;">Location</strong> · {{ville}}, {{pays}}</td></tr>
<tr><td style="padding:0 12px 10px 0;vertical-align:top;">💼</td><td style="padding:0 0 10px 0;">Seeking employment: permanent or fixed-term, as required</td></tr>
<tr><td style="padding:0 12px 0 0;vertical-align:top;">🏢</td><td style="padding:0;">On-site, hybrid, or remote depending on your policy</td></tr>
=======
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
>>>>>>> 7f4f399 (ok)
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td align="center" style="padding:8px 40px 6px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td align="center" style="border-radius:10px;background-color:#2563eb;">
<a href="#invoo-cv" style="display:inline-block;padding:15px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">View my CV</a>
</td>
</tr>
</table>
<p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;max-width:340px;margin-left:auto;margin-right:auto;">My background is included <strong>in this same email</strong> (no external website required).</p>
</td>
</tr>
<tr>
<td align="center" style="padding:12px 40px 28px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td style="border-radius:10px;border:2px solid #22c55e;background-color:#ffffff;">
<a href="{{whatsapp_lien}}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#16a34a;text-decoration:none;">WhatsApp message</a>
=======
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
>>>>>>> 7f4f399 (ok)
</td>
</tr>
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.65;color:#64748b;">
<strong style="color:#0f172a;font-size:14px;">{{nom_complet}}</strong><br>
<span style="color:#94a3b8;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email}}" style="color:#2563eb;text-decoration:none;">{{email}}</a><span style="color:#cbd5e1;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:36px 40px 40px;background-color:#ffffff;border-top:4px solid #e2e8f0;">
<p id="invoo-cv" style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.3;color:#0f172a;font-weight:700;">Curriculum vitae</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#334155;">
=======
<td style="padding:22px 36px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.65;color:#6b7280;">
<strong style="color:#111827;font-size:13px;">{{nom_complet}}</strong><br>
<span style="color:#9ca3af;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email}}" style="color:#1d4ed8;text-decoration:none;">{{email}}</a><span style="color:#d1d5db;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:32px 36px 36px;background-color:#ffffff;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Appendix</p>
<p id="invoo-cv" style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.35;color:#111827;font-weight:700;">Curriculum vitae</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#374151;">
>>>>>>> 7f4f399 (ok)
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
<<<<<<< HEAD
<body style="margin:0;padding:0;background-color:#e8edf5;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#e8edf5;">
<tr>
<td align="center" style="padding:24px 12px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #c7d2fe;">
<tr>
<td style="height:5px;line-height:5px;font-size:0;background-color:#2563eb;">&nbsp;</td>
</tr>
<tr>
<td style="padding:32px 40px 28px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;">
<span style="display:inline-block;padding:5px 14px;border-radius:999px;background-color:#d1fae7;color:#047857;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Volunteering</span>
<h1 style="margin:16px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#0f172a;font-weight:700;">{{prenom}} {{nom}}</h1>
<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#1e293b;font-weight:600;">{{fonction}}</p>
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;">Volunteering template · Humanitarian &amp; international volunteering</p>
<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;">{{societe}}</p>
</td>
</tr>
<tr>
<td style="padding:32px 40px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.75;color:#334155;">
=======
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
>>>>>>> 7f4f399 (ok)
Dear Sir or Madam,<br><br>
I am applying to support your work as a <strong>volunteer</strong>, in France or abroad. I care deeply about humanitarian issues and am especially motivated by <strong>{{domaine}}</strong>; I hope to contribute meaningfully to your programmes in the field or in support roles.<br><br>
I am open-minded, a good listener, and used to teamwork across diverse contexts; I engage with seriousness, respect, and availability.
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:0 40px 28px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-left:4px solid #059669;background-color:#ecfdf5;border-radius:0 10px 10px 0;">
<tr>
<td style="padding:22px 24px;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#047857;text-transform:uppercase;letter-spacing:0.06em;">Engagement &amp; skills</p>
<p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:#475569;">What I bring and care about: <strong style="color:#0f172a;">{{domaine}}</strong>.</p>
<table cellpadding="0" cellspacing="0" role="presentation" style="font-size:14px;line-height:1.6;color:#475569;">
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#059669;font-weight:bold;">•</td><td style="padding:3px 0;">Service mindset, empathy, respect for the people you serve</td></tr>
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#059669;font-weight:bold;">•</td><td style="padding:3px 0;">Adaptability (multicultural settings, field conditions, logistics)</td></tr>
<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:#059669;font-weight:bold;">•</td><td style="padding:3px 0;">Reliability, cooperation, and a constructive attitude</td></tr>
=======
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
>>>>>>> 7f4f399 (ok)
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:0 40px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#475569;">
<table cellpadding="0" cellspacing="0" role="presentation">
<tr><td style="padding:0 12px 10px 0;vertical-align:top;width:22px;">📍</td><td style="padding:0 0 10px 0;"><strong style="color:#334155;">Location</strong> · {{ville}}, {{pays}}</td></tr>
<tr><td style="padding:0 12px 10px 0;vertical-align:top;">🌐</td><td style="padding:0 0 10px 0;">Available for assignments in France or internationally, per your programmes</td></tr>
<tr><td style="padding:0 12px 0 0;vertical-align:top;">🤝</td><td style="padding:0;">Medium/long-term volunteering or short missions, as needed</td></tr>
=======
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
>>>>>>> 7f4f399 (ok)
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td align="center" style="padding:8px 40px 6px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td align="center" style="border-radius:10px;background-color:#2563eb;">
<a href="#invoo-cv" style="display:inline-block;padding:15px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">View my CV</a>
</td>
</tr>
</table>
<p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;max-width:340px;margin-left:auto;margin-right:auto;">My background is included <strong>in this same email</strong> (no external website required).</p>
</td>
</tr>
<tr>
<td align="center" style="padding:12px 40px 28px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
<tr>
<td style="border-radius:10px;border:2px solid #22c55e;background-color:#ffffff;">
<a href="{{whatsapp_lien}}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#16a34a;text-decoration:none;">WhatsApp message</a>
=======
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
>>>>>>> 7f4f399 (ok)
</td>
</tr>
</table>
</td>
</tr>
<tr>
<<<<<<< HEAD
<td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.65;color:#64748b;">
<strong style="color:#0f172a;font-size:14px;">{{nom_complet}}</strong><br>
<span style="color:#94a3b8;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email}}" style="color:#2563eb;text-decoration:none;">{{email}}</a><span style="color:#cbd5e1;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:36px 40px 40px;background-color:#ffffff;border-top:4px solid #e2e8f0;">
<p id="invoo-cv" style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.3;color:#0f172a;font-weight:700;">Curriculum vitae</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#334155;">
=======
<td style="padding:22px 36px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.65;color:#6b7280;">
<strong style="color:#111827;font-size:13px;">{{nom_complet}}</strong><br>
<span style="color:#9ca3af;">{{adresse_ligne}}</span><br>
{{code_postal}} {{ville}} — {{pays}}<br>
<a href="mailto:{{email}}" style="color:#1d4ed8;text-decoration:none;">{{email}}</a><span style="color:#d1d5db;"> · </span>{{telephone}}
</td>
</tr>
<tr>
<td style="padding:32px 36px 36px;background-color:#ffffff;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Appendix</p>
<p id="invoo-cv" style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.35;color:#111827;font-weight:700;">Curriculum vitae</p>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#374151;">
>>>>>>> 7f4f399 (ok)
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
      if (v == null || v === '') return `[${key}]`;
      return escHtml(v);
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
      return { subject: DEFAULT_STAGE_SUBJECT, replyTo: '', html: DEFAULT_STAGE_HTML };
    }
    return {
      subject: d.subject == null ? '' : String(d.subject),
      replyTo: d.replyTo == null ? '' : String(d.replyTo),
      html: d.html == null ? '' : String(d.html)
    };
  }

  async function saveDraft(subject, replyTo, html) {
    await db.setMeta(META_DRAFT, {
      subject,
      replyTo,
      html,
      updatedAt: Date.now()
    });
    await db.appendLog('info', 'Brouillon e-mail enregistré.', {});
    global.dispatchEvent(new CustomEvent('invooblast:draft-updated'));
  }

<<<<<<< HEAD
=======
  async function getCustomModules() {
    const raw = await db.getMeta(META_CUSTOM_MODULES);
    if (!Array.isArray(raw)) return [];
    return raw.filter((m) => m && typeof m === 'object' && m.id && m.html != null);
  }

  async function setCustomModules(list) {
    await db.setMeta(META_CUSTOM_MODULES, list);
  }

>>>>>>> 7f4f399 (ok)
  function mountEditorHtml(root) {
    root.innerHTML = `
<div class="email-editor-layout">
  <div class="editor-column">
    <div class="panel editor-toolbar-panel">
      <div class="panel-h">
        <h2>Message</h2>
        <div class="row-actions">
          <button type="button" class="btn primary" id="ed-save">Enregistrer le brouillon</button>
        </div>
      </div>
      <div class="panel-b editor-toolbar-body">
<<<<<<< HEAD
        <p class="editor-hint">Variables classiques : <code>{{prenom}}</code>, <code>{{nom}}</code>, <code>{{nom_complet}}</code>, <code>{{domaine}}</code>, etc. (voir Profil). <strong>CV intégré :</strong> <code>{{@cv_html}}</code> — HTML collé dans Paramètres (ancre <code>#invoo-cv</code>). WhatsApp : <code>{{whatsapp_lien}}</code> ou <code>{{whatsapp_link}}</code> (même valeur, téléphone du profil).</p>
        <label class="editor-label">Modèles de base</label>
        <div class="row-actions" style="flex-wrap:wrap;align-items:center;gap:0.65rem;margin:4px 0 8px">
          <span class="editor-hint" style="margin:0">Langue des modèles (Stage, Travail, Volontariat) :</span>
          <select id="ed-tpl-lang" class="editor-input ed-tpl-lang-select" aria-label="Langue des modèles de base">
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
        <div class="row-actions" style="flex-wrap:wrap;gap:0.5rem;margin-top:4px">
          <button type="button" class="btn" id="ed-tpl-stage" title="Insère le modèle demande de stage">Stage</button>
          <button type="button" class="btn" id="ed-tpl-job" title="Insère le modèle CDI/CDD">Travail (CDI/CDD)</button>
          <button type="button" class="btn" id="ed-tpl-volunteer" title="Insère le modèle volontariat / humanitaire">Volontariat</button>
        </div>
        <p class="editor-hint">Les boutons Stage / Travail / Volontariat insèrent la variante FR ou EN. Si le brouillon est encore un de ces modèles sans modification, changer la langue <strong>met à jour le HTML, l’objet et l’aperçu</strong>. Sinon, seul l’aperçu (ex. texte d’aide CV vide) suit la langue.</p>
=======
        <div class="editor-message-intro">
          <p class="editor-hint">Variables classiques : <code>{{prenom}}</code>, <code>{{nom}}</code>, <code>{{nom_complet}}</code>, <code>{{domaine}}</code>, etc. (voir Profil). <strong>CV intégré :</strong> <code>{{@cv_html}}</code> — HTML défini dans Paramètres (ancre <code>#invoo-cv</code>) ; vous pouvez aussi <strong>choisir quel CV</strong> utiliser ci‑dessous. WhatsApp : <code>{{whatsapp_lien}}</code> ou <code>{{whatsapp_link}}</code> (même valeur, téléphone du profil).</p>
        </div>
        <div class="editor-cv-block">
          <label class="editor-label" for="ed-cv-active">CV pour {{@cv_html}} (aperçu et envoi Blast)</label>
          <select id="ed-cv-active" class="editor-input" style="max-width:min(100%,480px)" aria-describedby="ed-cv-hint"></select>
          <p id="ed-cv-hint" class="editor-hint" style="margin-top:6px">Même liste que dans Paramètres. Chaque changement est enregistré tout de suite.</p>
        </div>
        <div class="editor-templates-block">
          <label class="editor-label">Modèles de base</label>
          <div class="editor-lang-row">
            <span class="editor-hint editor-lang-hint">Langue des modèles (Stage, Travail, Volontariat) :</span>
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
>>>>>>> 7f4f399 (ok)
        <label class="editor-label">Objet e-mail</label>
        <input type="text" id="ed-subject" class="editor-input" placeholder="Objet (variables {{...}} acceptées)" autocomplete="off"/>
        <label class="editor-label">Reply-To (optionnel)</label>
        <input type="email" id="ed-replyto" class="editor-input" placeholder="reponses@exemple.com" autocomplete="off"/>
        <label class="editor-label">Source HTML (compatible Gmail : tables, styles inline)</label>
        <textarea id="ed-html" class="editor-textarea" rows="16" spellcheck="false"></textarea>
        <p class="editor-label">Variables détectées</p>
        <div id="ed-var-chips" class="var-chips"></div>
<<<<<<< HEAD
        <div class="row-actions" style="margin-top:10px">
=======
        <div class="row-actions editor-compose-actions">
>>>>>>> 7f4f399 (ok)
          <button type="button" class="btn" id="ed-preview-refresh">Actualiser l’aperçu</button>
          <button type="button" class="btn" id="ed-lint">Indicateur anti-spam</button>
        </div>
        <div id="ed-lint-out" class="ed-lint-out" hidden></div>
<<<<<<< HEAD
=======
        </div>
>>>>>>> 7f4f399 (ok)
      </div>
    </div>
  </div>
  <div class="editor-column editor-preview-column">
<<<<<<< HEAD
    <div class="panel">
      <div class="panel-h">
        <h2>Aperçu (profil + CV intégré)</h2>
        <span class="editor-hint" style="margin:0">Rendu e-mail Gmail-friendly</span>
=======
    <div class="panel editor-preview-panel">
      <div class="panel-h">
        <h2>Aperçu</h2>
        <span class="editor-preview-tag">Profil + CV</span>
>>>>>>> 7f4f399 (ok)
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
    const prof = (await db.getMeta('user_profile')) || {};
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
    const prof = (await db.getMeta('user_profile')) || {};
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
    const langSel = document.querySelector('#email-editor-root #ed-tpl-lang');
    const previewLang = langSel && langSel.value === 'en' ? 'en' : 'fr';
    frame.onload = () => fitPreviewFrame(frame);
    frame.srcdoc = applyVarsPreview(html, data, raw, { previewLang });
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
<<<<<<< HEAD
=======
    const customName = root.querySelector('#ed-custom-name');
    const btnCustomSave = root.querySelector('#ed-custom-save');
    const customList = root.querySelector('#ed-custom-modules-list');
    const selCv = root.querySelector('#ed-cv-active');

    async function refreshCvSelect() {
      if (!selCv || !global.InvooSettings || typeof global.InvooSettings.getProfile !== 'function') return;
      const p = await global.InvooSettings.getProfile();
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
      if (want && variants.some((x) => x.id === want)) selCv.value = want;
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

    if (selCv) {
      selCv.addEventListener('change', () => {
        const fn = global.InvooSettings && global.InvooSettings.setSelectedCvHtmlId;
        if (typeof fn !== 'function') return;
        fn(selCv.value).catch(console.error);
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
>>>>>>> 7f4f399 (ok)

    function tplLang() {
      return normalizeBaseLang(selTplLang && selTplLang.value);
    }

    function onTyping() {
      renderVarChips(chips, extractVars(ta.value));
    }

    if (selTplLang) {
      selTplLang.addEventListener('change', () => {
        const lang = tplLang();
        db.setMeta(META_BASE_LANG, lang).catch(console.error);
        swapDraftToTemplateLanguage(lang, subject, ta);
        onTyping();
<<<<<<< HEAD
=======
        saveDraft(subject.value, replyTo.value, ta.value).catch(console.error);
>>>>>>> 7f4f399 (ok)
        updatePreview(frame, ta.value).catch(console.error);
      });
    }

    ta.addEventListener('input', onTyping);

<<<<<<< HEAD
    function applyBaseTemplate(subjectTpl, htmlTpl) {
      const hasContent =
        (ta.value || '').trim().length > 0 || (subject.value || '').trim().length > 0;
      if (hasContent) {
        const ok = global.confirm(
          'Remplacer l’objet et le corps HTML par ce modèle ? Le contenu actuel sera perdu si vous n’avez pas enregistré.'
        );
=======
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
>>>>>>> 7f4f399 (ok)
        if (!ok) return;
      }
      subject.value = subjectTpl;
      ta.value = htmlTpl;
      onTyping();
<<<<<<< HEAD
=======
      try {
        await saveDraft(subject.value, replyTo.value, ta.value);
      } catch (e) {
        console.error(e);
      }
>>>>>>> 7f4f399 (ok)
      updatePreview(frame, ta.value).catch(console.error);
    }

    if (btnTplStage) {
<<<<<<< HEAD
      btnTplStage.addEventListener('click', () =>
        applyBaseTemplate(
          tplLang() === 'en' ? DEFAULT_STAGE_SUBJECT_EN : DEFAULT_STAGE_SUBJECT,
          tplLang() === 'en' ? DEFAULT_STAGE_HTML_EN : DEFAULT_STAGE_HTML
        )
      );
    }
    if (btnTplJob) {
      btnTplJob.addEventListener('click', () =>
        applyBaseTemplate(
          tplLang() === 'en' ? DEFAULT_JOB_SUBJECT_EN : DEFAULT_JOB_SUBJECT,
          tplLang() === 'en' ? DEFAULT_JOB_HTML_EN : DEFAULT_JOB_HTML
        )
      );
    }
    if (btnTplVolunteer) {
      btnTplVolunteer.addEventListener('click', () =>
        applyBaseTemplate(
          tplLang() === 'en' ? DEFAULT_VOLUNTEER_SUBJECT_EN : DEFAULT_VOLUNTEER_SUBJECT,
          tplLang() === 'en' ? DEFAULT_VOLUNTEER_HTML_EN : DEFAULT_VOLUNTEER_HTML
        )
      );
=======
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
>>>>>>> 7f4f399 (ok)
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
            'Aucun problème évident détecté (analyse simple). Pensez à l’en-tête List-Unsubscribe côté envoi et au consentement des destinataires.';
          return;
        }
        lintOut.hidden = false;
        lintOut.className = 'ed-lint-out ed-lint-warn';
        lintOut.innerHTML = '<strong>Points à revoir :</strong><ul>' + warnings.map((w) => `<li>${escHtml(w)}</li>`).join('') + '</ul>';
      });
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
      .then(() => Promise.all([loadDraft(), db.getMeta(META_BASE_LANG)]))
      .then(([d, savedLang]) => {
        if (selTplLang) selTplLang.value = normalizeBaseLang(savedLang) === 'en' ? 'en' : 'fr';
        subject.value = d.subject;
        replyTo.value = d.replyTo;
        ta.value = d.html;
        swapDraftToTemplateLanguage(selTplLang ? selTplLang.value : 'fr', subject, ta);
        onTyping();
        return updatePreview(frame, ta.value);
      })
<<<<<<< HEAD
      .catch(console.error);
=======
      .then(() => Promise.all([refreshCustomModulesList(), refreshCvSelect()]))
      .catch(console.error);

    root.__invooRefreshCustomModules = refreshCustomModulesList;
    root.__invooRefreshCvSelect = refreshCvSelect;
>>>>>>> 7f4f399 (ok)
  }

  /** Même forme qu’un ancien « modèle » pour mergeWithProfileAndContact. */
  async function getDraftAsTemplateRow() {
    const d = await loadDraft();
    return {
      id: 'draft',
      name: 'Brouillon',
      subject: d.subject,
      replyTo: d.replyTo,
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
    const [d, savedLang] = await Promise.all([loadDraft(), db.getMeta(META_BASE_LANG)]);
    const langSel = root.querySelector('#ed-tpl-lang');
    if (langSel) langSel.value = normalizeBaseLang(savedLang) === 'en' ? 'en' : 'fr';
    if (subjectEl) subjectEl.value = d.subject;
    if (replyEl) replyEl.value = d.replyTo;
    taEl.value = d.html;
    if (subjectEl && taEl) swapDraftToTemplateLanguage(langSel ? langSel.value : 'fr', subjectEl, taEl);
    renderVarChips(chipsEl, extractVars(taEl.value));
<<<<<<< HEAD
    await updatePreview(frameEl, taEl.value);
=======
    if (typeof root.__invooRefreshCvSelect === 'function') await root.__invooRefreshCvSelect();
    await updatePreview(frameEl, taEl.value);
    if (typeof root.__invooRefreshCustomModules === 'function') {
      await root.__invooRefreshCustomModules();
    }
>>>>>>> 7f4f399 (ok)
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
<<<<<<< HEAD
    if (ta && frame) updatePreview(frame, ta.value).catch(console.error);
=======
    const sync = async () => {
      if (typeof root.__invooRefreshCvSelect === 'function') {
        await root.__invooRefreshCvSelect().catch(() => {});
      }
      if (ta && frame) await updatePreview(frame, ta.value).catch(console.error);
    };
    sync();
>>>>>>> 7f4f399 (ok)
  });

  global.InvooEmailEditor = {
    init: initEmailEditor,
    applyVars,
    applyVarsPreview,
    extractVars,
    buildPreviewData,
    buildPreviewRaw,
    loadDraft,
    getDraftAsTemplateRow,
<<<<<<< HEAD
=======
    getCustomModules,
    META_CUSTOM_MODULES,
>>>>>>> 7f4f399 (ok)
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
