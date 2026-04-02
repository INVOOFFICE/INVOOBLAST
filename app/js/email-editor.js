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

  /** Modèle « demande de stage » — Gmail-friendly (tables + styles inline). CV : {{@cv_html}} depuis Paramètres. */
  const DEFAULT_STAGE_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Demande de stage</title>
</head>
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
Madame, Monsieur,<br><br>
Je vous contacte pour vous faire part de ma <strong>motivation</strong> à effectuer un <strong>stage</strong> au sein de votre organisation. Très intéressé par le domaine de <strong>{{domaine}}</strong>, je souhaite mettre mes acquis au service de vos équipes tout en développant mes compétences en contexte professionnel.<br><br>
Rigoureux, à l’écoute et habitué au travail collaboratif, je suis prêt à m’investir sur les missions qui me seront confiées.
</td>
</tr>
<tr>
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
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:0 40px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#475569;">
<table cellpadding="0" cellspacing="0" role="presentation">
<tr><td style="padding:0 12px 10px 0;vertical-align:top;width:22px;">📍</td><td style="padding:0 0 10px 0;"><strong style="color:#334155;">Mobilité</strong> · {{ville}}, {{pays}}</td></tr>
<tr><td style="padding:0 12px 10px 0;vertical-align:top;">📚</td><td style="padding:0 0 10px 0;">Durée courte ou longue selon votre calendrier</td></tr>
<tr><td style="padding:0 12px 0 0;vertical-align:top;">🌍</td><td style="padding:0;">Présentiel ou distanciel possible</td></tr>
</table>
</td>
</tr>
<tr>
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
</td>
</tr>
</table>
</td>
</tr>
<tr>
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

  /** Même structure que le modèle stage, orienté emploi salarié (CDI/CDD). */
  const DEFAULT_JOB_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Candidature CDI / CDD</title>
</head>
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
Madame, Monsieur,<br><br>
Par la présente, je vous adresse une <strong>candidature spontanée</strong> pour des postes en entreprise au sein de votre organisation, en <strong>CDI ou CDD</strong>. Fort d’un <strong>vif intérêt</strong> pour le domaine de <strong>{{domaine}}</strong>, je souhaite mettre mon expertise et mon engagement au service de vos objectifs, dans un cadre exigeant et collaboratif.<br><br>
Rigoureux, orienté résultats et à l’aise dans des environnements structurés, je suis disponible pour échanger sur vos besoins et la manière dont je peux contribuer à vos équipes.
</td>
</tr>
<tr>
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
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:0 40px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#475569;">
<table cellpadding="0" cellspacing="0" role="presentation">
<tr><td style="padding:0 12px 10px 0;vertical-align:top;width:22px;">📍</td><td style="padding:0 0 10px 0;"><strong style="color:#334155;">Mobilité</strong> · {{ville}}, {{pays}}</td></tr>
<tr><td style="padding:0 12px 10px 0;vertical-align:top;">💼</td><td style="padding:0 0 10px 0;">Recherche d’emploi salarié : CDI ou CDD selon vos besoins</td></tr>
<tr><td style="padding:0 12px 0 0;vertical-align:top;">🏢</td><td style="padding:0;">Présentiel, hybride ou télétravail selon votre politique</td></tr>
</table>
</td>
</tr>
<tr>
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
</td>
</tr>
</table>
</td>
</tr>
<tr>
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

  /** Même structure : missions humanitaires, bénévolat international, ONG, etc. */
  const DEFAULT_VOLUNTEER_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Volontariat &amp; mission solidaire</title>
</head>
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
Madame, Monsieur,<br><br>
Je vous adresse une <strong>candidature spontanée</strong> pour rejoindre vos actions en tant que <strong>volontaire</strong> ou <strong>bénévole</strong>, en France ou à l’international. Sensible aux enjeux humanitaires et fortement motivé par le domaine de <strong>{{domaine}}</strong>, je souhaite contribuer concrètement à vos missions sur le terrain ou en appui.<br><br>
Ouvert d’esprit, à l’écoute et habitué à travailler en équipe dans des contextes variés, je m’engage avec sérieux, respect et disponibilité.
</td>
</tr>
<tr>
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
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:0 40px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#475569;">
<table cellpadding="0" cellspacing="0" role="presentation">
<tr><td style="padding:0 12px 10px 0;vertical-align:top;width:22px;">📍</td><td style="padding:0 0 10px 0;"><strong style="color:#334155;">Mobilité</strong> · {{ville}}, {{pays}}</td></tr>
<tr><td style="padding:0 12px 10px 0;vertical-align:top;">🌐</td><td style="padding:0 0 10px 0;">Disponible pour des missions en France ou à l’international selon vos programmes</td></tr>
<tr><td style="padding:0 12px 0 0;vertical-align:top;">🤝</td><td style="padding:0;">Bénévolat de moyen / long terme ou missions ponctuelles, selon le besoin</td></tr>
</table>
</td>
</tr>
<tr>
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
</td>
</tr>
</table>
</td>
</tr>
<tr>
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
Dear Sir or Madam,<br><br>
I am writing to express my <strong>interest</strong> in completing an <strong>internship</strong> with your organisation. I am particularly drawn to <strong>{{domaine}}</strong> and would welcome the opportunity to contribute to your teams while building professional skills in a real workplace setting.<br><br>
I am diligent, collaborative, and comfortable adapting to new tools and teams.
</td>
</tr>
<tr>
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
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:0 40px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#475569;">
<table cellpadding="0" cellspacing="0" role="presentation">
<tr><td style="padding:0 12px 10px 0;vertical-align:top;width:22px;">📍</td><td style="padding:0 0 10px 0;"><strong style="color:#334155;">Location</strong> · {{ville}}, {{pays}}</td></tr>
<tr><td style="padding:0 12px 10px 0;vertical-align:top;">📚</td><td style="padding:0 0 10px 0;">Short or long placement, depending on your schedule</td></tr>
<tr><td style="padding:0 12px 0 0;vertical-align:top;">🌍</td><td style="padding:0;">On-site or remote possible</td></tr>
</table>
</td>
</tr>
<tr>
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
</td>
</tr>
</table>
</td>
</tr>
<tr>
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
Dear Sir or Madam,<br><br>
Please consider this <strong>unsolicited application</strong> for salaried positions (<strong>permanent or fixed-term</strong>) within your organisation. I have a strong interest in <strong>{{domaine}}</strong> and would like to bring my skills and commitment to your objectives in a structured, collaborative environment.<br><br>
I am detail-oriented, results-minded, and comfortable in professional settings; I would welcome a conversation about your needs and how I can support your teams.
</td>
</tr>
<tr>
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
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:0 40px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#475569;">
<table cellpadding="0" cellspacing="0" role="presentation">
<tr><td style="padding:0 12px 10px 0;vertical-align:top;width:22px;">📍</td><td style="padding:0 0 10px 0;"><strong style="color:#334155;">Location</strong> · {{ville}}, {{pays}}</td></tr>
<tr><td style="padding:0 12px 10px 0;vertical-align:top;">💼</td><td style="padding:0 0 10px 0;">Seeking employment: permanent or fixed-term, as required</td></tr>
<tr><td style="padding:0 12px 0 0;vertical-align:top;">🏢</td><td style="padding:0;">On-site, hybrid, or remote depending on your policy</td></tr>
</table>
</td>
</tr>
<tr>
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
</td>
</tr>
</table>
</td>
</tr>
<tr>
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
Dear Sir or Madam,<br><br>
I am applying to support your work as a <strong>volunteer</strong>, in France or abroad. I care deeply about humanitarian issues and am especially motivated by <strong>{{domaine}}</strong>; I hope to contribute meaningfully to your programmes in the field or in support roles.<br><br>
I am open-minded, a good listener, and used to teamwork across diverse contexts; I engage with seriousness, respect, and availability.
</td>
</tr>
<tr>
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
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:0 40px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#475569;">
<table cellpadding="0" cellspacing="0" role="presentation">
<tr><td style="padding:0 12px 10px 0;vertical-align:top;width:22px;">📍</td><td style="padding:0 0 10px 0;"><strong style="color:#334155;">Location</strong> · {{ville}}, {{pays}}</td></tr>
<tr><td style="padding:0 12px 10px 0;vertical-align:top;">🌐</td><td style="padding:0 0 10px 0;">Available for assignments in France or internationally, per your programmes</td></tr>
<tr><td style="padding:0 12px 0 0;vertical-align:top;">🤝</td><td style="padding:0;">Medium/long-term volunteering or short missions, as needed</td></tr>
</table>
</td>
</tr>
<tr>
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
</td>
</tr>
</table>
</td>
</tr>
<tr>
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
        <label class="editor-label">Objet e-mail</label>
        <input type="text" id="ed-subject" class="editor-input" placeholder="Objet (variables {{...}} acceptées)" autocomplete="off"/>
        <label class="editor-label">Reply-To (optionnel)</label>
        <input type="email" id="ed-replyto" class="editor-input" placeholder="reponses@exemple.com" autocomplete="off"/>
        <label class="editor-label">Source HTML (compatible Gmail : tables, styles inline)</label>
        <textarea id="ed-html" class="editor-textarea" rows="16" spellcheck="false"></textarea>
        <p class="editor-label">Variables détectées</p>
        <div id="ed-var-chips" class="var-chips"></div>
        <div class="row-actions" style="margin-top:10px">
          <button type="button" class="btn" id="ed-preview-refresh">Actualiser l’aperçu</button>
          <button type="button" class="btn" id="ed-lint">Indicateur anti-spam</button>
        </div>
        <div id="ed-lint-out" class="ed-lint-out" hidden></div>
      </div>
    </div>
  </div>
  <div class="editor-column editor-preview-column">
    <div class="panel">
      <div class="panel-h">
        <h2>Aperçu (profil + CV intégré)</h2>
        <span class="editor-hint" style="margin:0">Rendu e-mail Gmail-friendly</span>
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
        updatePreview(frame, ta.value).catch(console.error);
      });
    }

    ta.addEventListener('input', onTyping);

    function applyBaseTemplate(subjectTpl, htmlTpl) {
      const hasContent =
        (ta.value || '').trim().length > 0 || (subject.value || '').trim().length > 0;
      if (hasContent) {
        const ok = global.confirm(
          'Remplacer l’objet et le corps HTML par ce modèle ? Le contenu actuel sera perdu si vous n’avez pas enregistré.'
        );
        if (!ok) return;
      }
      subject.value = subjectTpl;
      ta.value = htmlTpl;
      onTyping();
      updatePreview(frame, ta.value).catch(console.error);
    }

    if (btnTplStage) {
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
      .catch(console.error);
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
    await updatePreview(frameEl, taEl.value);
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
    if (ta && frame) updatePreview(frame, ta.value).catch(console.error);
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
