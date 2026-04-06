/**
 * Listes & import : modèle CSV (structure colonnes), import CSV / XLSX vers IndexedDB.
 */
(function (global) {
  'use strict';

  const db = global.InvooBlastDB;
  const merge = global.InvooEmailMerge;

  /**
   * Modèle pensé autour de : Organisation, Email, public, Ville, Pays, Domaine
   * (en-têtes exacts dans le CSV téléchargeable ; fusion → {{organisation}}, {{email}}, etc.)
   */
  const TEMPLATE_COLUMNS = [
    { key: 'organisation', label: 'Organisation', desc: 'Nom de l’organisation / structure' },
    { key: 'email', label: 'Email', desc: 'Obligatoire — adresse d’envoi (synonymes : E-mail, Courriel)' },
    {
      key: 'public',
      label: 'public',
      desc: 'Champ libre (ex. oui/non, visibilité, mention autorisée, statut RGPD court)'
    },
    { key: 'ville', label: 'Ville', desc: 'Ville' },
    { key: 'pays', label: 'Pays', desc: 'Pays' },
    { key: 'domaine', label: 'Domaine', desc: 'Domaines d’activité / compétences (texte libre)' },
    { key: 'prenom', label: 'Prénom', desc: 'Prénom (optionnel)' },
    { key: 'nom', label: 'Nom', desc: 'Nom (optionnel)' },
    { key: 'telephone', label: 'Téléphone', desc: 'Téléphone (optionnel)' },
    {
      key: 'societe',
      label: 'Société',
      desc: 'Répéter l’organisation si vos modèles utilisent {{societe}}'
    },
    { key: 'fonction', label: 'Fonction', desc: 'Fonction / titre (optionnel)' },
    { key: 'code_postal', label: 'Code postal', desc: 'Code postal (optionnel)' },
    { key: 'adresse_ligne', label: 'Adresse ligne', desc: 'Adresse (une ligne, optionnel)' }
  ];

  const EXAMPLE_ROW = {
    organisation: 'ONG Solidarité Plus',
    email: 'contact@exemple.org',
    public: 'oui',
    ville: 'Lyon',
    pays: 'France',
    domaine: 'humanitaire, éducation, santé publique',
    prenom: 'Marie',
    nom: 'Dupont',
    telephone: '+33 6 00 00 00 00',
    societe: 'ONG Solidarité Plus',
    fonction: 'Coordinatrice terrain',
    code_postal: '69001',
    adresse_ligne: '10 rue des Lilas'
  };

  let lastParsed = null;

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parseDelimitedLine(line, delimiter) {
    const out = [];
    let cur = '';
    let i = 0;
    let inQ = false;
    while (i < line.length) {
      const c = line[i];
      if (inQ) {
        if (c === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i += 2;
            continue;
          }
          inQ = false;
          i++;
          continue;
        }
        cur += c;
        i++;
      } else if (c === '"') {
        inQ = true;
        i++;
      } else if (c === delimiter) {
        out.push(cur.trim());
        cur = '';
        i++;
      } else {
        cur += c;
        i++;
      }
    }
    out.push(cur.trim());
    return out;
  }

  function detectDelimiter(firstLine) {
    const commas = (firstLine.match(/,/g) || []).length;
    const semis = (firstLine.match(/;/g) || []).length;
    return semis > commas ? ';' : ',';
  }

  function parseCsvText(text) {
    const t = String(text || '').replace(/^\uFEFF/, '');
    const rawLines = t.split(/\r?\n/);
    const lines = rawLines.filter((l) => String(l).trim().length > 0);
    if (!lines.length) return { headers: [], rows: [], delimiter: ',', source: 'csv' };
    const delimiter = detectDelimiter(lines[0]);
    const headers = parseDelimitedLine(lines[0], delimiter).map((h) =>
      String(h || '')
        .replace(/^"|"$/g, '')
        .trim()
    );
    const rows = [];
    for (let r = 1; r < lines.length; r++) {
      const cells = parseDelimitedLine(lines[r], delimiter);
      if (cells.every((c) => !String(c).trim())) continue;
      const row = {};
      headers.forEach((h, j) => {
        const v = cells[j] != null ? String(cells[j]).replace(/^"|"$/g, '').trim() : '';
        row[h] = v;
      });
      rows.push(row);
    }
    return { headers, rows, delimiter, source: 'csv' };
  }

  function getXLSX() {
    return global.XLSX;
  }

  function isSpreadsheetFileName(name) {
    const n = String(name || '').toLowerCase();
    return n.endsWith('.xlsx') || n.endsWith('.xls');
  }

  function isCsvFileName(name, mime) {
    const n = String(name || '').toLowerCase();
    return (
      n.endsWith('.csv') ||
      mime === 'text/csv' ||
      mime === 'text/plain' ||
      mime === 'application/csv'
    );
  }

  /**
   * Première feuille du classeur → même forme que parseCsvText (headers, rows d’objets).
   */
  function parseXlsxArrayBuffer(ab) {
    const XLSX = getXLSX();
    if (!XLSX || typeof XLSX.read !== 'function') {
      throw new Error('Lecteur Excel indisponible (rechargement de l’app nécessaire).');
    }
    const wb = XLSX.read(ab, { type: 'array' });
    if (!wb.SheetNames || !wb.SheetNames.length) {
      throw new Error('Classeur vide ou illisible.');
    }
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    if (!ws) throw new Error('Feuille introuvable.');
    const jsonRows = XLSX.utils.sheet_to_json(ws, {
      defval: '',
      raw: false,
      blankrows: false
    });
    if (!jsonRows.length) {
      return { headers: [], rows: [], delimiter: 'xlsx', source: 'xlsx', sheetName };
    }
    const headers = [];
    const seen = new Set();
    function collectKeys(row) {
      if (!row || typeof row !== 'object') return;
      Object.keys(row).forEach((k) => {
        if (/^__/.test(k)) return;
        if (!seen.has(k)) {
          seen.add(k);
          headers.push(k);
        }
      });
    }
    jsonRows.forEach(collectKeys);
    const rows = jsonRows.map((obj) => {
      const row = {};
      headers.forEach((h) => {
        const v = obj[h];
        row[h] = v != null && v !== '' ? String(v).trim() : '';
      });
      return row;
    });
    return { headers, rows, delimiter: 'xlsx', source: 'xlsx', sheetName };
  }

  function extractEmailFromRow(rawRow, normalizedFields) {
    let e = normalizedFields.email || '';
    if (e) return db.normalizeEmail(e);
    for (const [k, v] of Object.entries(rawRow)) {
      if (!v) continue;
      const kn = String(k)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      if (/email|courriel|^e-?mail|mail$/i.test(kn) || kn === 'mail') {
        return db.normalizeEmail(v);
      }
    }
    return db.normalizeEmail('');
  }

  /** Corps du fichier modèle (en-têtes + une ligne d’exemple, ordre TEMPLATE_COLUMNS). */
  function buildTemplateCsvBody() {
    const delim = ';';
    const header = TEMPLATE_COLUMNS.map((c) => c.label).join(delim);
    const cells = TEMPLATE_COLUMNS.map((c) => {
      const v = EXAMPLE_ROW[c.key] != null ? EXAMPLE_ROW[c.key] : '';
      const s = String(v);
      return s.includes(delim) || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    });
    return '\uFEFF' + header + '\n' + cells.join(delim) + '\n';
  }

  function downloadTemplateCsv() {
    const body = buildTemplateCsvBody();
    const blob = new Blob([body], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'invooblast-modele-liste.csv';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    if (global.InvooApp && global.InvooApp.showToast) {
      global.InvooApp.showToast(
        'Modèle CSV téléchargé : Organisation, Email, public, Ville, Pays, Domaine, puis colonnes optionnelles (UTF-8, séparateur ;).',
        false
      );
    }
  }

  function mount(root) {
    root.innerHTML = `
<div class="lists-import-page">
  <div class="panel">
    <div class="panel-h"><h2>Listes & import</h2></div>
    <div class="panel-b">
      <p style="margin:0;line-height:1.55;color:var(--text-secondary)">
        Le modèle repose sur les colonnes <strong>Organisation</strong>, <strong>Email</strong>, <strong>public</strong>, <strong>Ville</strong>, <strong>Pays</strong>, <strong>Domaine</strong>
        (variables fusion typiques <code>{{organisation}}</code>, <code>{{email}}</code>, <code>{{public}}</code>, <code>{{ville}}</code>, <code>{{pays}}</code>, <code>{{domaine}}</code>).
        Téléchargez le modèle CSV, complétez-le (ou utilisez directement un fichier Excel <strong>.xlsx</strong>), puis importez.
      </p>
    </div>
  </div>

  <div class="panel">
    <div class="panel-h"><h2>Structure des colonnes (modèle)</h2></div>
    <div class="panel-b">
      <div class="row-actions" style="flex-wrap:wrap;margin-bottom:0">
        <button type="button" class="btn primary" id="li-download-template">Télécharger le modèle CSV</button>
        <span class="editor-hint" style="margin:0;align-self:center">Fichier exemple avec une ligne ; séparateur <strong>;</strong> (souvent correct pour Excel FR).</span>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-h"><h2>Importer un fichier</h2></div>
    <div class="panel-b">
      <label class="editor-label" for="li-list-name">Nom de la liste</label>
      <input type="text" id="li-list-name" class="editor-input" placeholder="ex. Campagne printemps 2026" autocomplete="off"/>
      <label class="editor-label" for="li-file">Fichier</label>
      <input type="file" id="li-file" class="editor-input" accept=".csv,.xlsx,.xls,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" />
      <p class="editor-hint">Formats <strong>.csv</strong> (UTF-8 recommandé) ou Excel <strong>.xlsx</strong> / <strong>.xls</strong>. La <strong>première feuille</strong> est lue ; la première ligne sert d’en-têtes de colonnes.</p>
      <div id="li-parse-summary" class="li-parse-summary" hidden></div>
      <div class="table-wrap li-preview-wrap" id="li-preview-wrap" hidden>
        <table class="lists-preview-table" id="li-preview-table"><thead></thead><tbody></tbody></table>
      </div>
      <div class="row-actions" style="margin-top:0.85rem">
        <button type="button" class="btn primary" id="li-import-btn" disabled>Enregistrer la liste dans IndexedDB</button>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-h"><h2>Listes enregistrées</h2></div>
    <div class="panel-b" id="li-saved-wrap">
      <p class="editor-hint">Chargement…</p>
    </div>
  </div>
</div>`;
  }

  function renderPreview(parsed) {
    const wrap = document.getElementById('li-preview-wrap');
    const table = document.getElementById('li-preview-table');
    const sum = document.getElementById('li-parse-summary');
    if (!wrap || !table || !sum) return;
    if (!parsed || !parsed.headers.length) {
      wrap.hidden = true;
      sum.hidden = true;
      return;
    }
    sum.hidden = false;
    const kind = parsed.source === 'xlsx' ? 'XLSX' : 'CSV';
    const delimOrSheet =
      parsed.source === 'xlsx'
        ? `feuille « ${escHtml(parsed.sheetName || '')} »`
        : `séparateur « ${escHtml(parsed.delimiter)} »`;
    sum.innerHTML = `<strong>${parsed.rows.length}</strong> ligne(s) · <strong>${parsed.headers.length}</strong> colonne(s) · ${kind} · ${delimOrSheet}`;
    const previewRows = parsed.rows.slice(0, 12);
    const th = `<tr>${parsed.headers.map((h) => `<th>${escHtml(h)}</th>`).join('')}</tr>`;
    const tb = previewRows
      .map(
        (row) =>
          `<tr>${parsed.headers.map((h) => `<td>${escHtml(row[h] != null ? row[h] : '')}</td>`).join('')}</tr>`
      )
      .join('');
    table.querySelector('thead').innerHTML = th;
    table.querySelector('tbody').innerHTML = tb;
    wrap.hidden = false;
  }

  async function refreshSavedLists() {
    const wrap = document.getElementById('li-saved-wrap');
    if (!wrap) return;
    const [lists, contacts] = await Promise.all([
      db.getAll(db.STORES.LISTS),
      db.getAll(db.STORES.CONTACTS)
    ]);
    lists.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    if (!lists.length) {
      wrap.innerHTML = '<p class="editor-hint" style="margin:0">Aucune liste. Importez un CSV ou Excel ci-dessus.</p>';
      return;
    }
    wrap.innerHTML = `
<table class="settings-pool-table" role="grid">
  <thead><tr><th>Nom</th><th>Contacts</th><th>Mise à jour</th><th></th></tr></thead>
  <tbody>
    ${lists
      .map((L) => {
        const n = contacts.filter((c) => c.listId === L.id).length;
        const d = L.updatedAt ? new Date(L.updatedAt).toLocaleString('fr-FR') : '—';
        return `<tr>
      <td>${escHtml(L.name || 'Sans titre')}</td>
      <td>${n}</td>
      <td>${escHtml(d)}</td>
      <td><button type="button" class="btn btn-small" data-del-list="${escHtml(L.id)}">Supprimer</button></td>
    </tr>`;
      })
      .join('')}
  </tbody>
</table>`;
    wrap.querySelectorAll('[data-del-list]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-del-list');
        if (!id) return;
        const dlg = global.InvooConfirm;
        const ok = dlg
          ? await dlg.show({
              title: 'Supprimer la liste ?',
              message: 'Supprimer cette liste et tous ses contacts ?',
              confirmLabel: 'Supprimer',
              cancelLabel: 'Annuler',
              danger: true
            })
          : global.confirm('Supprimer cette liste et tous ses contacts ?');
        if (!ok) return;
        const allC = await db.getAll(db.STORES.CONTACTS);
        await Promise.all(allC.filter((c) => c.listId === id).map((c) => db.del(db.STORES.CONTACTS, c.id)));
        await db.del(db.STORES.LISTS, id);
        await db.appendLog('info', 'Liste supprimée.', { listId: id });
        if (global.InvooApp && global.InvooApp.showToast) global.InvooApp.showToast('Liste supprimée.', false);
        global.dispatchEvent(new CustomEvent('invooblast:lists-updated'));
        refreshSavedLists().catch(console.error);
        if (global.InvooDashboard && global.InvooDashboard.refreshDashboard) {
          global.InvooDashboard.refreshDashboard().catch(() => {});
        }
      });
    });
  }

  async function doImport(listName, parsed) {
    if (!merge || typeof merge.normalizeFieldMap !== 'function') {
      throw new Error('InvooEmailMerge indisponible.');
    }
    const listId = db.uuid();
    const now = Date.now();
    await db.put(db.STORES.LISTS, {
      id: listId,
      name: listName,
      createdAt: now,
      updatedAt: now,
      sourceRowCount: parsed.rows.length
    });
    let withEmail = 0;
    for (const raw of parsed.rows) {
      const fields = merge.normalizeFieldMap(raw);
      const email = extractEmailFromRow(raw, fields);
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (valid) withEmail++;
      await db.put(db.STORES.CONTACTS, {
        id: db.uuid(),
        listId,
        email: email || '',
        emailNorm: email,
        fields,
        rawFields: raw,
        valid,
        createdAt: now
      });
    }
    await db.appendLog('info', 'Liste importée depuis fichier.', {
      listId,
      name: listName,
      rows: parsed.rows.length,
      withEmail,
      source: parsed.source || 'csv'
    });
    if (global.InvooApp && global.InvooApp.showToast) {
      global.InvooApp.showToast(
        `Liste enregistrée : ${parsed.rows.length} ligne(s), ${withEmail} e-mail(s) valides.`,
        false
      );
    }
    global.dispatchEvent(new CustomEvent('invooblast:lists-updated'));
    if (global.InvooDashboard && global.InvooDashboard.refreshDashboard) {
      global.InvooDashboard.refreshDashboard().catch(() => {});
    }
    lastParsed = null;
    const btn = document.getElementById('li-import-btn');
    if (btn) btn.disabled = true;
    const file = document.getElementById('li-file');
    if (file) file.value = '';
    const prev = document.getElementById('li-preview-wrap');
    const sum = document.getElementById('li-parse-summary');
    if (prev) prev.hidden = true;
    if (sum) sum.hidden = true;
    await refreshSavedLists();
  }

  function wire(root) {
    root.querySelector('#li-download-template').addEventListener('click', downloadTemplateCsv);

    const fileInput = root.querySelector('#li-file');
    const importBtn = root.querySelector('#li-import-btn');

    fileInput.addEventListener('change', () => {
      lastParsed = null;
      if (importBtn) importBtn.disabled = true;
      const f = fileInput.files && fileInput.files[0];
      if (!f) {
        const prev = document.getElementById('li-preview-wrap');
        const sumEl = document.getElementById('li-parse-summary');
        if (prev) prev.hidden = true;
        if (sumEl) sumEl.hidden = true;
        return;
      }
      const fname = f.name || '';
      const useSheet = isSpreadsheetFileName(fname) || /spreadsheetml|ms-excel/i.test(f.type || '');
      const useCsv = isCsvFileName(fname, f.type || '');
      if (!useSheet && !useCsv) {
        if (global.InvooApp && global.InvooApp.showToast) {
          global.InvooApp.showToast(
            'Choisissez un fichier .csv, .xlsx ou .xls (mêmes colonnes que le modèle).',
            true
          );
        }
        fileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          if (useSheet) {
            lastParsed = parseXlsxArrayBuffer(reader.result);
          } else {
            lastParsed = parseCsvText(reader.result);
          }
          if (!lastParsed.headers.length) {
            throw new Error('Aucun en-tête détecté (première ligne vide ?).');
          }
          renderPreview(lastParsed);
          if (importBtn) importBtn.disabled = lastParsed.rows.length === 0;
        } catch (e) {
          lastParsed = null;
          if (importBtn) importBtn.disabled = true;
          if (global.InvooApp && global.InvooApp.showToast) {
            global.InvooApp.showToast(e.message || String(e), true);
          }
        }
      };
      reader.onerror = () => {
        if (global.InvooApp && global.InvooApp.showToast) {
          global.InvooApp.showToast('Lecture du fichier impossible.', true);
        }
      };
      if (useSheet) reader.readAsArrayBuffer(f);
      else reader.readAsText(f, 'UTF-8');
    });

    importBtn.addEventListener('click', async () => {
      const nameEl = document.getElementById('li-list-name');
      const listName = nameEl ? String(nameEl.value || '').trim() : '';
      if (!listName) {
        if (global.InvooApp && global.InvooApp.showToast) {
          global.InvooApp.showToast('Indiquez un nom de liste.', true);
        }
        return;
      }
      if (!lastParsed || !lastParsed.rows.length) {
        if (global.InvooApp && global.InvooApp.showToast) {
          global.InvooApp.showToast('Importez et analysez d’abord un fichier (CSV ou Excel).', true);
        }
        return;
      }
      try {
        await doImport(listName, lastParsed);
      } catch (e) {
        console.error(e);
        if (global.InvooApp && global.InvooApp.showToast) {
          global.InvooApp.showToast(e.message || String(e), true);
        }
      }
    });
  }

  function initListsImport() {
    const page = document.getElementById('page-contacts');
    if (!page) return;
    let root = page.querySelector('#lists-import-root');
    if (!root) {
      page.innerHTML = '<div id="lists-import-root"></div>';
      root = page.querySelector('#lists-import-root');
    }
    if (root.dataset.mounted !== '1') {
      mount(root);
      wire(root);
      root.dataset.mounted = '1';
    }
    refreshSavedLists().catch(console.error);
  }

  global.addEventListener('invooblast:page', (e) => {
    if (e.detail && e.detail.page === 'contacts') initListsImport();
  });

  global.addEventListener('invooblast:lists-updated', () => {
    const root = document.getElementById('lists-import-root');
    if (root && root.dataset.mounted === '1') refreshSavedLists().catch(console.error);
  });

  global.InvooListsImport = {
    init: initListsImport,
    parseCsvText,
    parseXlsxArrayBuffer,
    downloadTemplateCsv,
    buildTemplateCsvBody,
    TEMPLATE_COLUMNS,
    EXAMPLE_ROW
  };
})(window);
