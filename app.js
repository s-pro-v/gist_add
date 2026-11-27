(() => {
    const CONFIG = {
        owner: 's-pro-v',
        repo: 'json-lista',
        filePath: 'html.json',
        branch: 'main',
        storageTokenKey: 'oxy_gh_pat_token'
    };

    // WBUDOWANE SZABLONY GIST (FUI & BRUTALIST)
    const PRESETS = {
        html: {
            filename: 'strona.html',
            desc: 'Prosta strona demonstracyjna HTML & CSS',
            code: `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Mój Projekt Gist</title>
  <style>
    * { box-sizing: border-box; border-radius: 0 !important; }
    body {
      background: #121212;
      color: #e0e0e0;
      font-family: 'JetBrains Mono', monospace;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .box {
      background: #1e1e1e;
      border: 1px solid #f36c00;
      padding: 30px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 0 25px rgba(243, 108, 0, 0.1);
    }
    h1 { color: #f36c00; margin-top: 0; font-size: 1.4rem; letter-spacing: 0.05em; text-transform: uppercase; }
    p { color: #858585; font-size: 0.85rem; line-height: 1.5; }
    .btn-bg { display: inline-flex; padding: 2px; background: #000; border: 1px solid #2a2a2a; margin-top: 15px; }
    button {
      background: #f36c00;
      color: #000;
      border: 1px solid #f36c00;
      padding: 8px 18px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      text-transform: uppercase;
    }
    button:hover { background: #ff781a; box-shadow: 0 0 14px rgba(243, 108, 0, 0.3); }
  </style>
</head>
<body>
  <div class="box">
    <h1>System Gist Aktywny 🚀</h1>
    <p>Plik HTML renderowany bezpośrednio w piaskownicy iframe z zachowaniem rygoru geometrycznego FUI.</p>
    <div class="btn-bg">
      <button onclick="alert('Działa!')">Test Sygnału</button>
    </div>
  </div>
</body>
</html>`
        },
        json: {
            filename: 'dane.json',
            desc: 'Przykładowa konfiguracja i dane użytkownika',
            code: JSON.stringify({
                app: "GistManagerSharp",
                version: "2.0.0",
                style: {
                    borderRadius: 0,
                    theme: "brutalist-fui-signal-orange",
                    accentColor: "#f36c00"
                },
                features: [
                    "Bez Tailwind CSS (Pure CSS)",
                    "Border-radius: 0 !important",
                    "Dwuwarstwowa mechanika przycisków (.btn-bg > .btn)",
                    "Podgląd na żywo dla każdego elementu z listy",
                    "Pełna synchronizacja z html.json"
                ],
                timestamp: new Date().toISOString()
            }, null, 2)
        }
    };

    function getToken() {
        return (patInput ? patInput.value.trim() : '') || localStorage.getItem(CONFIG.storageTokenKey) || localStorage.getItem('gh_gist_token') || '';
    }

    function saveToken(val) {
        const clean = (val || '').trim();
        if (clean) {
            localStorage.setItem(CONFIG.storageTokenKey, clean);
            localStorage.setItem('gh_gist_token', clean);
        } else {
            localStorage.removeItem(CONFIG.storageTokenKey);
            localStorage.removeItem('gh_gist_token');
        }
    }

    function buildTargetGistRawUrl(gist, file) {
        const owner = (gist.owner && gist.owner.login) ? gist.owner.login : CONFIG.owner;
        const cleanFilename = encodeURIComponent((file && file.filename) ? file.filename : 'index.html');
        const timestamp = Date.now();
        return `https://gist.githubusercontent.com/${owner}/${gist.id}/raw/${cleanFilename}?t=${timestamp}`;
    }

    async function checkRepoPermissions() {
        const token = getToken();
        if (!token) return;
        try {
            const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}`;
            const res = await fetch(url, {
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'Authorization': `Bearer ${token}`,
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.permissions && (data.permissions.push || data.permissions.admin)) {
                    setStatus('ok', 'UPRAWNIENIA REPOZYTORIUM: ZAPIS (PUSH) OK.');
                } else {
                    setStatus('busy', 'UPRAWNIENIA REPOZYTORIUM: TYLKO ODCZYT.');
                }
            } else if (res.status === 404) {
                setStatus('err', 'BRAK UPRAWNIEŃ DO REPO (404 - WYMAGANY SCOPE "REPO").');
            }
        } catch (_) {}
    }

    // STATE
    let items = [];
    let currentFileSha = null;
    let activeIndex = -1;
    let editingState = null; // null = tryb tworzenia nowego Gista; obiekt = { index, gistId, originalFilename }
    let searchQuery = '';
    let monacoEditor = null;
    let pendingEditorCode = '';

    // DOM REFS
    const patInput = document.getElementById('patInput');
    const btnFetchSync = document.getElementById('btnFetchSync');
    const btnPushGithub = document.getElementById('btnPushGithub');
    const btnOpenCreator = document.getElementById('btnOpenCreator');
    const btnOpenSettings = document.getElementById('btnOpenSettings');
    const btnReindex = document.getElementById('btnReindex');
    const btnAddManual = document.getElementById('btnAddManual');
    const btnCopyJson = document.getElementById('btnCopyJson');
    const btnDownloadJson = document.getElementById('btnDownloadJson');
    const searchInput = document.getElementById('searchInput');
    const itemsList = document.getElementById('itemsList');
    const countBadge = document.getElementById('countBadge');
    const shaDisplay = document.getElementById('shaDisplay');
    const previewFrame = document.getElementById('previewFrame');
    const previewPlaceholder = document.getElementById('previewPlaceholder');
    const activePreviewName = document.getElementById('activePreviewName');
    const jsonOutput = document.getElementById('jsonOutput');
    const creatorPanel = document.getElementById('creatorPanel');
    const statusLed = document.getElementById('statusLed');
    const statusText = document.getElementById('statusText');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // EDITOR / CREATOR REFS
    const editorModeBanner = document.getElementById('editorModeBanner');
    const editorModeLabel = document.getElementById('editorModeLabel');
    const editorModeIcon = document.getElementById('editorModeIcon');
    const btnResetToNewMode = document.getElementById('btnResetToNewMode');
    const btnCancelEditTop = document.getElementById('btnCancelEditTop');
    const newGistTitle = document.getElementById('newGistTitle');
    const newGistFilename = document.getElementById('newGistFilename');
    const newGistVisibility = document.getElementById('newGistVisibility');
    const fileUploadInput = document.getElementById('fileUploadInput');
    const btnPresetHtml = document.getElementById('btnPresetHtml');
    const btnPresetJson = document.getElementById('btnPresetJson');
    const btnFormatCode = document.getElementById('btnFormatCode');
    const btnLoadLocalFile = document.getElementById('btnLoadLocalFile');
    const btnTestLocalPreview = document.getElementById('btnTestLocalPreview');
    const btnClearCreator = document.getElementById('btnClearCreator');
    const chkAutoPush = document.getElementById('chkAutoPush');
    const btnCancelEdit = document.getElementById('btnCancelEdit');
    const btnPublishGist = document.getElementById('btnPublishGist');

    // DELETE MODAL REFS
    const deleteModal = document.getElementById('deleteModal');
    const deleteModalTitle = document.getElementById('deleteModalTitle');
    const deleteModalFilenameText = document.getElementById('deleteModalFilenameText');
    const deleteModalGistIdVal = document.getElementById('deleteModalGistIdVal');
    const chkDeleteFromRepoJson = document.getElementById('chkDeleteFromRepoJson');
    const chkDeleteAlsoFromGist = document.getElementById('chkDeleteAlsoFromGist');
    const deleteAlsoWrap = document.getElementById('deleteAlsoWrap');
    const btnDeleteModalCancel = document.getElementById('btnDeleteModalCancel');
    const btnDeleteModalClose = document.getElementById('btnDeleteModalClose');
    const btnDeleteModalConfirm = document.getElementById('btnDeleteModalConfirm');
    const deleteConfirmIcon = document.getElementById('deleteConfirmIcon');
    const deleteConfirmText = document.getElementById('deleteConfirmText');
    let pendingDelete = null;

    // =========================================================
    // INITIALIZE MONACO EDITOR (SAFE ASYNC LOADER)
    // =========================================================
    let monacoInitAttempts = 0;
    function initMonacoEditor() {
        const req = window.require;
        if (typeof req !== 'function') {
            monacoInitAttempts++;
            if (monacoInitAttempts <= 30) {
                setTimeout(initMonacoEditor, 100);
            } else {
                console.warn('[Monaco] Nie znaleziono AMD loadera po 30 próbach.');
            }
            return;
        }

        req.config({
            paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs' }
        });

        req(['vs/editor/editor.main'], () => {
            if (typeof window.defineMonacoThemes === 'function') {
                window.defineMonacoThemes();
            }

            const monacoHost = document.getElementById('monacoHost');
            if (!monacoHost) return;

            monacoEditor = monaco.editor.create(monacoHost, {
                value: pendingEditorCode || '<!DOCTYPE html>\n<html lang="pl">\n<head>\n  <meta charset="UTF-8">\n  <title>OXY_OS Module</title>\n</head>\n<body>\n  \n</body>\n</html>',
                language: 'html',
                theme: 'terminal-dark',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                lineHeight: 19,
                automaticLayout: true,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                tabSize: 2,
                renderWhitespace: 'selection',
                cursorBlinking: 'solid'
            });

            // Inicjalizacja Monaco Settings Web Component
            if (window.MonacoEditorSettings) {
                window.MonacoEditorSettings.init(monacoEditor);
            }
        });
    }

    initMonacoEditor();

    function getEditorValue() {
        return monacoEditor ? monacoEditor.getValue() : pendingEditorCode;
    }

    function setEditorValue(code) {
        pendingEditorCode = code;
        if (monacoEditor) {
            monacoEditor.setValue(code);
        }
    }

    // INIT TOKEN FROM LOCALSTORAGE & LOAD REPO DATA
    const savedToken = getToken();
    if (savedToken) {
        patInput.value = savedToken;
    }
    loadInitialRepoJson();
    if (savedToken) {
        checkRepoPermissions();
    }

    patInput.addEventListener('change', () => {
        saveToken(patInput.value);
        checkRepoPermissions();
    });

    patInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveToken(patInput.value);
            loadInitialRepoJson();
            checkRepoPermissions();
        }
    });

    // UTF-8 SAFE BASE64 HELPERS
    function encodeUtf8ToBase64(str) {
        const bytes = new TextEncoder().encode(str);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function decodeBase64ToUtf8(base64) {
        const cleanBase64 = base64.replace(/\s/g, '');
        const binary = atob(cleanBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    }

    // TELEMETRY STATUS
    function setStatus(state, message) {
        if (statusLed) {
            statusLed.className = 'led ' + (state || '');
        }
        statusText.textContent = message;
        statusText.className = state === 'err' ? 'text-danger' : state === 'ok' ? 'text-success' : 'text-highlight';
    }

    // EXTRACT GIST ID FROM URL
    function extractGistId(url) {
        const match = url.match(/gist\.githubusercontent\.com\/[^/]+\/([a-f0-9]+)/i);
        return match ? match[1].toLowerCase() : null;
    }

    // BUILD CLEAN JSON ARRAY
    function getCleanExportArray() {
        return items.map(({ id, title, filename, url }) => ({
            id: Number(id),
            title: title.trim(),
            filename: filename.trim(),
            url: url.trim()
        }));
    }

    function updateJsonInspector() {
        jsonOutput.value = JSON.stringify(getCleanExportArray(), null, 2);
        countBadge.textContent = items.length;
    }

    // RENDER ITEMS LIST
    function renderList() {
        itemsList.innerHTML = '';
        const query = searchQuery.toLowerCase();

        items.forEach((item, index) => {
            if (
                query &&
                !item.title.toLowerCase().includes(query) &&
                !item.filename.toLowerCase().includes(query)
            ) {
                return;
            }

            const isBeingEdited = editingState && editingState.index === index;
            const isActive = index === activeIndex;

            const wrap = document.createElement('div');
            wrap.className = `btn-bg item-note-wrap ${isActive ? 'active' : ''}`;

            wrap.innerHTML = `
              <div class="note-item ${isBeingEdited ? 'is-editing' : ''}">
                <div class="note-item-header">
                  <span class="note-item-date">#${item.id}</span>
                  <input type="text" class="note-item-input item-title-input" value="${escapeHtml(item.title)}" data-idx="${index}" placeholder="Tytuł modułu...">
                  ${isBeingEdited ? '<span class="badge-pill edit"><i data-lucide="edit-3"></i> EDIT</span>' : ''}
                  ${item.isNew ? '<span class="badge-pill new"><i data-lucide="zap"></i> NEW</span>' : ''}
                </div>
                <div class="note-item-snippet">
                  <span title="${escapeHtml(item.filename)}">// ${escapeHtml(item.filename)}</span>
                </div>
                <div class="note-item-footer">
                  <span class="text-highlight" style="font-size:0.6rem;">GIST RAW</span>
                  <div class="mini-actions">
                    <button type="button" class="mini-btn btn-preview" data-idx="${index}" title="Podgląd w ramce IFRAME">
                      <i data-lucide="eye"></i> VIEW
                    </button>
                    <button type="button" class="mini-btn btn-edit" data-idx="${index}" title="Edytuj kod w Monaco">
                      <i data-lucide="code"></i> EDIT
                    </button>
                    <button type="button" class="mini-btn btn-up" data-idx="${index}" ${index === 0 ? 'disabled' : ''} title="Przesuń w górę">
                      <i data-lucide="chevron-up"></i>
                    </button>
                    <button type="button" class="mini-btn btn-down" data-idx="${index}" ${index === items.length - 1 ? 'disabled' : ''} title="Przesuń w dół">
                      <i data-lucide="chevron-down"></i>
                    </button>
                    <button type="button" class="mini-btn danger btn-del" data-idx="${index}" title="Usuń pozycję">
                      <i data-lucide="trash-2"></i>
                    </button>
                  </div>
                </div>
              </div>
            `;

            itemsList.appendChild(wrap);
        });

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }

        updateJsonInspector();
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // EVENT DELEGATION FOR LIST
    itemsList.addEventListener('input', (e) => {
        if (e.target.classList.contains('item-title-input')) {
            const idx = Number(e.target.dataset.idx);
            items[idx].title = e.target.value;
            if (editingState && editingState.index === idx) {
                newGistTitle.value = e.target.value;
            }
            updateJsonInspector();
        }
    });

    itemsList.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const idx = Number(btn.dataset.idx);

        if (btn.classList.contains('btn-preview')) {
            loadPreview(idx);
        } else if (btn.classList.contains('btn-edit')) {
            openExistingGistInMonaco(idx);
        } else if (btn.classList.contains('btn-up') && idx > 0) {
            [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
            if (activeIndex === idx) activeIndex = idx - 1;
            else if (activeIndex === idx - 1) activeIndex = idx;
            if (editingState) {
                if (editingState.index === idx) editingState.index = idx - 1;
                else if (editingState.index === idx - 1) editingState.index = idx;
            }
            renderList();
        } else if (btn.classList.contains('btn-down') && idx < items.length - 1) {
            [items[idx + 1], items[idx]] = [items[idx], items[idx + 1]];
            if (activeIndex === idx) activeIndex = idx + 1;
            else if (activeIndex === idx + 1) activeIndex = idx;
            if (editingState) {
                if (editingState.index === idx) editingState.index = idx + 1;
                else if (editingState.index === idx + 1) editingState.index = idx;
            }
            renderList();
        } else if (btn.classList.contains('btn-del')) {
            openDeleteModal(idx);
        }
    });

    // =========================================================
    // MODAL POTWIERDZENIA USUNIĘCIA (FUI HUD)
    // =========================================================
    function openDeleteModal(idx) {
        const item = items[idx];
        if (!item) return;

        const gistId = extractGistId(item.url);
        pendingDelete = { idx, item, gistId };

        if (deleteModalTitle) deleteModalTitle.textContent = `[#${item.id}] ${item.title}`;
        if (deleteModalFilenameText) deleteModalFilenameText.textContent = item.filename;

        if (chkDeleteFromRepoJson) {
            chkDeleteFromRepoJson.checked = true;
        }

        if (gistId) {
            if (deleteModalGistIdVal) deleteModalGistIdVal.textContent = gistId;
            if (chkDeleteAlsoFromGist) {
                chkDeleteAlsoFromGist.disabled = false;
                chkDeleteAlsoFromGist.checked = true;
            }
            if (deleteAlsoWrap) deleteAlsoWrap.classList.remove('hidden');
        } else {
            if (deleteModalGistIdVal) deleteModalGistIdVal.textContent = 'BRAK (LINK ZEWNĘTRZNY)';
            if (chkDeleteAlsoFromGist) {
                chkDeleteAlsoFromGist.checked = false;
                chkDeleteAlsoFromGist.disabled = true;
            }
            if (deleteAlsoWrap) deleteAlsoWrap.classList.add('hidden');
        }

        if (btnDeleteModalConfirm) {
            btnDeleteModalConfirm.disabled = false;
        }
        if (deleteConfirmText) deleteConfirmText.textContent = 'USUŃ POZYCJĘ';
        if (deleteModal) deleteModal.classList.remove('hidden');

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    let isDeletingGist = false;

    function closeDeleteModal(force = false) {
        if (!force && isDeletingGist) return;
        pendingDelete = null;
        isDeletingGist = false;
        if (btnDeleteModalConfirm) {
            btnDeleteModalConfirm.disabled = false;
        }
        if (deleteConfirmText) {
            deleteConfirmText.textContent = 'USUŃ POZYCJĘ';
        }
        if (deleteModal) {
            deleteModal.classList.add('hidden');
        }
    }

    if (btnDeleteModalCancel) btnDeleteModalCancel.addEventListener('click', () => closeDeleteModal(false));
    if (btnDeleteModalClose) btnDeleteModalClose.addEventListener('click', () => closeDeleteModal(false));

    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) closeDeleteModal(false);
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && deleteModal && !deleteModal.classList.contains('hidden')) {
            closeDeleteModal(false);
        }
    });

    if (btnDeleteModalConfirm) {
        btnDeleteModalConfirm.addEventListener('click', async () => {
            if (!pendingDelete || isDeletingGist) return;
            const { idx, item, gistId } = pendingDelete;
            const deleteFromGist = chkDeleteAlsoFromGist && chkDeleteAlsoFromGist.checked && gistId;
            const token = getToken();

            isDeletingGist = true;
            btnDeleteModalConfirm.disabled = true;
            if (deleteConfirmText) deleteConfirmText.textContent = 'USUWANIE...';

            try {
                if (deleteFromGist) {
                    if (!token) {
                        setStatus('err', 'BRAK TOKENU PAT — NIE MOŻNA USUNĄĆ GISTA Z SERWERA GITHUB.');
                    } else {
                        setStatus('busy', `USUWANIE GISTA [${gistId.slice(0, 7)}] Z SERWERA GITHUB...`);
                        try {
                            const delRes = await fetch(`https://api.github.com/gists/${gistId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Accept': 'application/vnd.github+json',
                                    'Authorization': `Bearer ${token}`,
                                    'X-GitHub-Api-Version': '2022-11-28'
                                }
                            });
                            if (delRes.status === 204 || delRes.ok) {
                                setStatus('ok', `GIST [${gistId.slice(0, 7)}] ZOSTAŁ USUNIĘTY Z SERWERA GITHUB.`);
                            } else {
                                const err = await delRes.json().catch(() => ({}));
                                console.warn('Błąd usuwania Gista z GitHub:', err);
                            }
                        } catch (delErr) {
                            console.warn('Błąd sieci podczas usuwania Gista:', delErr);
                        }
                    }
                }

                // Usuń z lokalnej tablicy
                items.splice(idx, 1);
                if (editingState && editingState.index === idx) {
                    setEditorModeNew();
                }
                if (activeIndex === idx) {
                    activeIndex = -1;
                    previewFrame.classList.add('hidden');
                    previewPlaceholder.classList.remove('hidden');
                    activePreviewName.textContent = 'BRAK AKTYWNEGO MODUŁU';
                } else if (activeIndex > idx) {
                    activeIndex--;
                }
                renderList();

                const deleteFromRepo = chkDeleteFromRepoJson ? chkDeleteFromRepoJson.checked : true;
                if (deleteFromRepo) {
                    if (token) {
                        try {
                            await pushJsonToGithub(`Remove module ${item.filename} from html.json [skip ci]`);
                            setStatus('ok', `USUNIĘTO MODUŁ [${item.id}] ${item.title} ORAZ ZAKTUALIZOWANO HTML.JSON NA GITHUB.`);
                        } catch (pushErr) {
                            setStatus('err', `USUNIĘTO LOKALNIE, LECZ BŁĄD ZAPISU DO REPO: ${pushErr.message}`);
                        }
                    } else {
                        setStatus('err', `USUNIĘTO LOKALNIE. ABY ZAPISAĆ ZMIANY W HTML.JSON NA GITHUBIE, WPROWADŹ TOKEN PAT I KLIKNIJ [2] PUSH.`);
                    }
                } else {
                    setStatus('ok', `USUNIĘTO WPIS [${item.id}] ${item.title} TYLKO Z LISTY ROBOCZEJ.`);
                }
            } finally {
                isDeletingGist = false;
                closeDeleteModal(true);
            }
        });
    }

    // =========================================================
    // LOAD EXISTING GIST INTO MONACO EDITOR FOR PATCHING
    // =========================================================
    async function openExistingGistInMonaco(idx) {
        const item = items[idx];
        if (!item) return;

        const gistId = extractGistId(item.url);
        if (!gistId) {
            setStatus('err', 'TEN WPIS NIE JEST STANDARDOWYM LINKIEM GIST — NIE MOŻNA EDYTOWAĆ PRZEZ GIST API.');
            return;
        }

        const token = patInput.value.trim();
        setStatus('busy', `POBIERANIE KODU GISTA [${gistId.slice(0, 7)}] DO MONACO EDITOR...`);

        try {
            let codeContent = '';
            let actualFilename = item.filename;
            let isPublic = false;

            if (token) {
                // Pobieramy przez API GitHuba (zawsze świeża wersja bez opóźnień CDN)
                const res = await fetch(`https://api.github.com/gists/${gistId}?t=${Date.now()}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github+json'
                    }
                });
                if (!res.ok) throw new Error(`Gist API HTTP ${res.status}`);
                const gistData = await res.json();
                isPublic = Boolean(gistData.public);

                const fileObj = gistData.files[item.filename] || Object.values(gistData.files)[0];
                if (!fileObj) throw new Error('Gist nie zawiera żadnych plików.');

                actualFilename = fileObj.filename;
                if (fileObj.truncated && fileObj.raw_url) {
                    const rawRes = await fetch(fileObj.raw_url);
                    codeContent = await rawRes.text();
                } else {
                    codeContent = fileObj.content || '';
                }
            } else {
                // Fallback przez RAW URL jeśli użytkownik nie wpisał jeszcze tokena
                const cleanUrl = item.url.split('?')[0];
                const rawRes = await fetch(`${cleanUrl}?t=${Date.now()}`);
                if (!rawRes.ok) throw new Error(`RAW HTTP ${rawRes.status}`);
                codeContent = await rawRes.text();
            }

            // Przełącz formularz w tryb EDYCJI (PATCH)
            editingState = {
                index: idx,
                gistId: gistId,
                originalFilename: actualFilename
            };

            newGistTitle.value = item.title;
            newGistFilename.value = actualFilename;
            newGistFilename.dataset.manual = '1';
            newGistVisibility.value = isPublic ? 'true' : 'false';
            newGistVisibility.disabled = true; // GitHub API zabrania zmiany public/secret po utworzeniu

            editorModeBanner.classList.add('is-edit');
            editorModeLabel.textContent = `TRYB EDYCJI ISTNIEJĄCEGO GISTA: [${item.id}] ${gistId.slice(0, 8)}...`;
            if (editorModeIcon) {
                editorModeIcon.setAttribute('data-lucide', 'edit-3');
            }
            btnPublishGist.textContent = '[PATCH] ZAPISZ ZMIANY W GIST';
            btnPublishGist.classList.remove('btn-accent');
            btnPublishGist.classList.add('btn-edit-mode');
            if (btnCancelEdit) btnCancelEdit.classList.remove('hidden');
            if (btnCancelEditTop) btnCancelEditTop.classList.remove('hidden');

            setEditorValue(codeContent);
            switchTab('editor');
            renderList();

            if (monacoEditor) {
                monacoEditor.layout();
                monacoEditor.focus();
            }

            setStatus('ok', `ZAŁADOWANO DO MONACO EDITOR: ${item.title} (${actualFilename})`);
        } catch (err) {
            setStatus('err', `BŁĄD POBIERANIA KODU DO EDYCJI: ${err.message}`);
        }
    }

    // RESET FORM TO NEW GIST CREATION MODE (POST)
    function setEditorModeNew() {
        editingState = null;
        newGistTitle.value = '';
        newGistFilename.value = PRESETS.html.filename;
        newGistFilename.dataset.manual = '';
        newGistVisibility.disabled = false;
        newGistVisibility.value = 'false';

        editorModeBanner.classList.remove('is-edit');
        editorModeLabel.textContent = 'TRYB: TWORZENIE NOWEGO GISTA (POST)';
        if (editorModeIcon) {
            editorModeIcon.setAttribute('data-lucide', 'file-plus');
        }
        btnPublishGist.textContent = '[PUBLISH] UTWÓRZ GIST I DODAJ DO REJESTRU';
        btnPublishGist.classList.remove('btn-edit-mode');
        btnPublishGist.classList.add('btn-accent');
        if (btnCancelEdit) btnCancelEdit.classList.add('hidden');
        if (btnCancelEditTop) btnCancelEditTop.classList.add('hidden');

        setEditorValue(PRESETS.html.code);
        renderList();
    }

    // ANULOWANIE EDYCJI I POWRÓT DO PODGLĄDU
    function cancelEditing() {
        if (!editingState) {
            setEditorModeNew();
            return;
        }
        const prevIndex = editingState.index;
        setEditorModeNew();
        if (prevIndex >= 0 && items[prevIndex]) {
            loadPreview(prevIndex);
            setStatus('ok', `ANULOWANO EDYCJĘ: ${items[prevIndex].title}. PRZYWRÓCONO PODGLĄD.`);
        } else {
            switchTab('preview');
            setStatus('ok', 'ANULOWANO EDYCJĘ. PRZEŁĄCZONO DO PODGLĄDU.');
        }
    }

    if (btnCancelEdit) btnCancelEdit.addEventListener('click', cancelEditing);
    if (btnCancelEditTop) btnCancelEditTop.addEventListener('click', cancelEditing);

    btnResetToNewMode.addEventListener('click', () => {
        setEditorModeNew();
        setStatus('ok', 'PRZEŁĄCZONO EDYTOR W TRYB TWORZENIA NOWEGO GISTA.');
    });

    if (btnPresetHtml) {
        btnPresetHtml.addEventListener('click', () => {
            newGistFilename.value = PRESETS.html.filename;
            newGistTitle.value = PRESETS.html.desc;
            setEditorValue(PRESETS.html.code);
            setStatus('ok', 'WCZYTANO SZABLON DEMONSTRACYJNY HTML FUI.');
        });
    }

    if (btnPresetJson) {
        btnPresetJson.addEventListener('click', () => {
            newGistFilename.value = PRESETS.json.filename;
            newGistTitle.value = PRESETS.json.desc;
            setEditorValue(PRESETS.json.code);
            setStatus('ok', 'WCZYTANO SZABLON KONFIGURACYJNY JSON.');
        });
    }

    // LIVE PREVIEW LOADER
    async function loadPreview(idx) {
        const item = items[idx];
        if (!item) return;

        activeIndex = idx;
        renderList();
        switchTab('preview');

        activePreviewName.textContent = `[${item.id}] ${item.title} (${item.filename})`;
        setStatus('busy', `POBIERANIE KODU ŻRÓDŁOWEGO: ${item.filename}...`);

        try {
            const cleanUrl = item.url.split('?')[0];
            const res = await fetch(`${cleanUrl}?t=${Date.now()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const htmlContent = await res.text();
            previewPlaceholder.classList.add('hidden');
            previewFrame.classList.remove('hidden');
            previewFrame.srcdoc = htmlContent;

            setStatus('ok', `ZAŁADOWANO PODGLĄD: ${item.title}`);
        } catch (err) {
            setStatus('err', `BŁĄD ŁADOWANIA PODGLĄDU (${item.filename}): ${err.message}`);
        }
    }

    // LOAD EXISTING REPO JSON ON START
    async function loadInitialRepoJson() {
        const token = patInput.value.trim();

        setStatus('busy', 'POBIERANIE AKTUALNEGO HTML.JSON Z REPOZYTORIUM...');
        try {
            const repoUrl = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.filePath}?ref=${CONFIG.branch}&t=${Date.now()}`;
            const headers = {
                'Accept': 'application/vnd.github+json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const res = await fetch(repoUrl, { headers });

            if (res.ok) {
                const data = await res.json();
                currentFileSha = data.sha;
                shaDisplay.textContent = `SHA: ${currentFileSha.slice(0, 7)}`;
                const decoded = decodeBase64ToUtf8(data.content);
                items = JSON.parse(decoded);
                renderList();
                setStatus('ok', `WCZYTANO ${items.length} ISTNIEJĄCYCH POZYCJI Z REPOZYTORIUM.`);
            } else if (res.status === 404) {
                shaDisplay.textContent = 'SHA: NOWY PLIK';
                setStatus('ok', 'PLIK HTML.JSON NIE ISTNIEJE — GOTOWY DO UTWORZENIA.');
            } else {
                throw new Error(`HTTP ${res.status}`);
            }
        } catch (err) {
            // Fallback na bezpośrednie pobranie surowego pliku (RAW)
            try {
                const rawUrl = `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}/${CONFIG.filePath}?t=${Date.now()}`;
                const rawRes = await fetch(rawUrl);
                if (rawRes.ok) {
                    items = await rawRes.json();
                    renderList();
                    shaDisplay.textContent = 'SHA: RAW';
                    setStatus('ok', `WCZYTANO ${items.length} POZYCJI Z RAW (TRYB ODCZYTU).`);
                    return;
                }
            } catch (_) {}
            setStatus('err', `BŁĄD POŁĄCZENIA Z REPOZYTORIUM: ${err.message}`);
        }
    }

    // [1] SYNC ALL GISTS
    btnFetchSync.addEventListener('click', async () => {
        const token = patInput.value.trim();
        if (!token) {
            setStatus('err', 'BRAK TOKENA PAT! WKLEJ TOKEN W GÓRNYM PANELU.');
            patInput.focus();
            return;
        }
        localStorage.setItem(CONFIG.storageTokenKey, token);

        btnFetchSync.disabled = true;
        setStatus('busy', 'SYNCHRONIZACJA: POBIERANIE REPOZYTORIUM ORAZ WSZYSTKICH GISTÓW...');

        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            };

            const existingMap = new Map();
            const repoUrl = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.filePath}?ref=${CONFIG.branch}&t=${Date.now()}`;
            const repoRes = await fetch(repoUrl, { headers });

            if (repoRes.ok) {
                const repoData = await repoRes.json();
                currentFileSha = repoData.sha;
                shaDisplay.textContent = `SHA: ${currentFileSha.slice(0, 7)}`;
                const parsedRepoItems = JSON.parse(decodeBase64ToUtf8(repoData.content));
                parsedRepoItems.forEach(entry => {
                    const gId = extractGistId(entry.url);
                    if (gId) existingMap.set(gId, entry);
                });
            } else if (repoRes.status === 404) {
                currentFileSha = null;
                shaDisplay.textContent = 'SHA: NOWY PLIK';
            } else {
                const err = await repoRes.json();
                throw new Error(`Repo API (${repoRes.status}): ${err.message}`);
            }

            let allGists = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const gistRes = await fetch(`https://api.github.com/gists?per_page=100&page=${page}&t=${Date.now()}`, { headers });
                if (!gistRes.ok) {
                    const err = await gistRes.json();
                    throw new Error(`Gists API (${gistRes.status}): ${err.message}`);
                }
                const pageData = await gistRes.json();
                allGists = allGists.concat(pageData);
                if (pageData.length < 100) hasMore = false;
                else page++;
            }

            const knownItems = [];
            const newItems = [];

            for (const gist of allGists) {
                const files = Object.values(gist.files || {});
                const htmlFile = files.find(f => f.filename.toLowerCase().endsWith('.html'));
                if (!htmlFile) continue;

                const gId = gist.id.toLowerCase();
                const cleanUrl = `https://gist.githubusercontent.com/${CONFIG.owner}/${gist.id}/raw/`;

                if (existingMap.has(gId)) {
                    const prev = existingMap.get(gId);
                    knownItems.push({
                        id: prev.id,
                        title: prev.title,
                        filename: htmlFile.filename,
                        url: cleanUrl,
                        isNew: false
                    });
                } else {
                    const autoTitle = (gist.description && gist.description.trim())
                        ? gist.description.trim()
                        : htmlFile.filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

                    newItems.push({
                        id: 0,
                        title: autoTitle,
                        filename: htmlFile.filename,
                        url: cleanUrl,
                        isNew: true
                    });
                }
            }

            knownItems.sort((a, b) => a.id - b.id);
            let maxId = knownItems.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
            newItems.forEach(item => {
                item.id = ++maxId;
            });

            items = [...knownItems, ...newItems];
            renderList();

            setStatus('ok', `ZSYNCHRONIZOWANO: ${items.length} MODUŁÓW (NOWYCH: ${newItems.length}).`);
        } catch (err) {
            setStatus('err', `BŁĄD SYNCHRONIZACJI: ${err.message}`);
        } finally {
            btnFetchSync.disabled = false;
        }
    });

    // REUSABLE PUSH FUNCTION WITH CONFLICT RETRY
    async function pushJsonToGithub(customCommitMessage, attempt = 1) {
        const token = getToken();
        if (!token) {
            setStatus('err', 'BRAK TOKENA PAT! WKLEJ TOKEN W GÓRNYM PANELU.');
            throw new Error('Brak tokena PAT');
        }
        if (items.length === 0) {
            setStatus('err', 'LISTA JEST PUSTA — ANULOWANO WYSYŁANIE.');
            throw new Error('Lista jest pusta');
        }

        btnPushGithub.disabled = true;
        setStatus('busy', 'WYSYŁANIE ZAKTUALIZOWANEGO HTML.JSON DO REPOZYTORIUM GITHUB...');

        try {
            const apiUrl = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.filePath}`;
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'Content-Type': 'application/json'
            };

            const shaRes = await fetch(`${apiUrl}?ref=${CONFIG.branch}&t=${Date.now()}`, { headers });
            if (shaRes.ok) {
                const meta = await shaRes.json();
                currentFileSha = meta.sha;
            } else if (shaRes.status === 404) {
                currentFileSha = null;
            }

            const exportJson = JSON.stringify(getCleanExportArray(), null, 2);
            const payload = {
                message: customCommitMessage || `Update html.json (${items.length} modules) via OXY_OS Terminal [skip ci]`,
                content: encodeUtf8ToBase64(exportJson),
                branch: CONFIG.branch
            };

            if (currentFileSha) {
                payload.sha = currentFileSha;
            }

            const putRes = await fetch(apiUrl, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload)
            });

            if (putRes.status === 409 && attempt < 2) {
                // Konflikt SHA (np. commit równoległy) - odczekaj, pobierz świeże SHA i powtórz
                await new Promise(r => setTimeout(r, 400));
                return await pushJsonToGithub(customCommitMessage, attempt + 1);
            }

            const result = await putRes.json();
            if (!putRes.ok) {
                throw new Error(`HTTP ${putRes.status}: ${result.message}`);
            }

            currentFileSha = result.content.sha;
            shaDisplay.textContent = `SHA: ${currentFileSha.slice(0, 7)}`;
            items.forEach(i => i.isNew = false);
            renderList();

            setStatus('ok', `ZAPISANO POMYŚLNIE NA GITHUB! NOWE SHA: ${currentFileSha.slice(0, 7)}`);
        } catch (err) {
            setStatus('err', `BŁĄD ZAPISU NA GITHUB: ${err.message}`);
            throw err;
        } finally {
            btnPushGithub.disabled = false;
        }
    }

    btnPushGithub.addEventListener('click', () => pushJsonToGithub());

    // =========================================================
    // MONACO EDITOR ACTIONS (CREATE NEW POST OR PATCH EXISTING)
    // =========================================================
    btnOpenCreator.addEventListener('click', () => {
        setEditorModeNew();
        setEditorValue('<!DOCTYPE html>\n<html lang="pl">\n<head>\n  <meta charset="UTF-8">\n  <title>Nowy Moduł</title>\n</head>\n<body>\n  \n</body>\n</html>');
        switchTab('editor');
        newGistTitle.focus();
    });

    newGistTitle.addEventListener('input', () => {
        if (!editingState && !newGistFilename.dataset.manual) {
            const slug = newGistTitle.value
                .trim()
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            newGistFilename.value = slug ? `${slug}.html` : '';
        }
    });

    newGistFilename.addEventListener('input', () => {
        newGistFilename.dataset.manual = newGistFilename.value.trim().length > 0 ? '1' : '';
    });

    if (btnOpenSettings) {
        btnOpenSettings.addEventListener('click', () => {
            const settingsEl = document.querySelector('monaco-editor-settings');
            if (settingsEl) {
                settingsEl.open();
            }
        });
    }

    btnFormatCode.addEventListener('click', () => {
        if (monacoEditor) {
            monacoEditor.getAction('editor.action.formatDocument').run();
            setStatus('ok', 'SFORMATOWANO KOD W MONACO EDITOR.');
        }
    });

    btnLoadLocalFile.addEventListener('click', () => fileUploadInput.click());

    fileUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            setEditorValue(ev.target.result);
            newGistFilename.value = file.name;
            newGistFilename.dataset.manual = '1';
            if (!newGistTitle.value.trim()) {
                newGistTitle.value = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            }
            setStatus('ok', `WCZYTANO LOKALNY PLIK DO MONACO: ${file.name} (${file.size} B)`);
        };
        reader.readAsText(file, 'UTF-8');
        fileUploadInput.value = '';
    });

    btnTestLocalPreview.addEventListener('click', () => {
        const code = getEditorValue();
        if (!code.trim()) {
            setStatus('err', 'EDYTOR JEST PUSTY — BRAK KODU DO PODGLĄDU.');
            return;
        }
        switchTab('preview');
        previewPlaceholder.classList.add('hidden');
        previewFrame.classList.remove('hidden');
        previewFrame.srcdoc = code;
        activePreviewName.textContent = `[TEST MONACO] ${newGistTitle.value.trim() || 'WERSJA ROBOCZA'}`;
        setStatus('ok', 'URUCHOMIONO LOKALNY PODGLĄD Z MONACO EDITOR.');
    });

    btnClearCreator.addEventListener('click', () => {
        setEditorValue('');
        setStatus('ok', 'WYCZYSZCZONO ZAWARTOŚĆ EDYTORA MONACO.');
    });

    // SAVE BUTTON: HANDLES BOTH PATCH (EXISTING GIST) AND POST (NEW GIST)
    btnPublishGist.addEventListener('click', async () => {
        const token = patInput.value.trim();
        if (!token) {
            setStatus('err', 'BRAK TOKENA PAT! WKLEJ TOKEN W GÓRNYM PANELU.');
            patInput.focus();
            return;
        }

        const title = newGistTitle.value.trim();
        let filename = newGistFilename.value.trim();
        const code = getEditorValue();
        const isPublic = newGistVisibility.value === 'true';

        if (!title) {
            setStatus('err', 'PODAJ TYTUŁ MODUŁU!');
            newGistTitle.focus();
            return;
        }
        if (!filename) {
            filename = 'index.html';
        } else if (!filename.toLowerCase().endsWith('.html')) {
            filename += '.html';
        }
        if (!code.trim()) {
            setStatus('err', 'KOD ŹRÓDŁOWY W MONACO EDITOR NIE MOŻE BYĆ PUSTY!');
            if (monacoEditor) monacoEditor.focus();
            return;
        }

        btnPublishGist.disabled = true;

        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'Content-Type': 'application/json'
            };

            if (editingState) {
                // === TRYB PATCH: AKTUALIZACJA ISTNIEJĄCEGO GISTA ===
                const { index, gistId, originalFilename } = editingState;
                setStatus('busy', `ZAPISYWANIE ZMIAN (PATCH) W GIST [${gistId.slice(0, 7)}]...`);

                const filesPayload = {};
                if (originalFilename && originalFilename !== filename) {
                    // Zmiana nazwy pliku w Gist wymaga ustawienia starego klucza na null
                    filesPayload[originalFilename] = null;
                }
                filesPayload[filename] = { content: code };

                const patchRes = await fetch(`https://api.github.com/gists/${gistId}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        description: title,
                        files: filesPayload
                    })
                });

                const updatedGist = await patchRes.json();
                if (!patchRes.ok) {
                    throw new Error(`PATCH Gist API (${patchRes.status}): ${updatedGist.message}`);
                }

                const primaryFile = (updatedGist.files && (updatedGist.files[filename] || Object.values(updatedGist.files)[0])) || { filename };
                const rawUrl = buildTargetGistRawUrl(updatedGist, primaryFile);

                // Aktualizuj wpis w lokalnej tablicy
                if (items[index]) {
                    items[index].title = title;
                    items[index].filename = filename;
                    items[index].url = rawUrl;
                }
                editingState.originalFilename = filename;
                renderList();

                if (chkAutoPush.checked) {
                    await pushJsonToGithub(`Update module: ${title} (${filename}) [skip ci]`);
                } else {
                    setStatus('ok', `ZAKTUALIZOWANO KOD GISTA [${gistId.slice(0, 7)}] POMYŚLNIE.`);
                }

                // Odśwież natychmiast podgląd bez czekania na cache CDN
                activeIndex = index;
                renderList();
                switchTab('preview');
                previewPlaceholder.classList.add('hidden');
                previewFrame.classList.remove('hidden');
                previewFrame.srcdoc = code;
                activePreviewName.textContent = `[${items[index].id}] ${title} (${filename}) [LIVE]`;

            } else {
                // === TRYB POST: TWORZENIE NOWEGO GISTA ===
                setStatus('busy', `TWORZENIE NOWEGO GISTA (${filename}) NA GITHUB...`);

                const gistRes = await fetch('https://api.github.com/gists', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        description: title,
                        public: isPublic,
                        files: {
                            [filename]: { content: code }
                        }
                    })
                });

                const createdGist = await gistRes.json();
                if (!gistRes.ok) {
                    throw new Error(`POST Gist API (${gistRes.status}): ${createdGist.message}`);
                }

                const primaryFile = (createdGist.files && (createdGist.files[filename] || Object.values(createdGist.files)[0])) || { filename };
                const rawUrl = buildTargetGistRawUrl(createdGist, primaryFile);
                const maxId = items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);

                items.push({
                    id: maxId + 1,
                    title: title,
                    filename: filename,
                    url: rawUrl,
                    isNew: true
                });

                const newItemIdx = items.length - 1;
                renderList();

                if (chkAutoPush.checked) {
                    await pushJsonToGithub(`Add module: ${title} (${filename}) [skip ci]`);
                } else {
                    setStatus('ok', `UTWORZONO GIST [${createdGist.id.slice(0, 7)}] I DODANO DO LISTY ROBOCZEJ.`);
                }

                // Przełącz nowo utworzony Gist w tryb edycji, aby można było go dalej rozwijać
                editingState = {
                    index: newItemIdx,
                    gistId: createdGist.id,
                    originalFilename: filename
                };
                newGistVisibility.disabled = true;
                editorModeBanner.classList.add('is-edit');
                editorModeLabel.textContent = `TRYB EDYCJI ISTNIEJĄCEGO GISTA: [${items[newItemIdx].id}] ${createdGist.id.slice(0, 8)}...`;
                if (editorModeIcon) {
                    editorModeIcon.setAttribute('data-lucide', 'edit-3');
                }
                btnPublishGist.textContent = '[PATCH] ZAPISZ ZMIANY W GIST';
                btnPublishGist.classList.remove('btn-accent');
                btnPublishGist.classList.add('btn-edit-mode');

                activeIndex = newItemIdx;
                renderList();
                switchTab('preview');
                previewPlaceholder.classList.add('hidden');
                previewFrame.classList.remove('hidden');
                previewFrame.srcdoc = code;
                activePreviewName.textContent = `[${items[newItemIdx].id}] ${title} (${filename})`;
            }

        } catch (err) {
            setStatus('err', `BŁĄD OPERACJI GIST: ${err.message}`);
        } finally {
            btnPublishGist.disabled = false;
        }
    });

    // TOOLBAR ACTIONS
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderList();
    });

    btnReindex.addEventListener('click', () => {
        items.forEach((item, index) => {
            item.id = index + 1;
        });
        renderList();
        setStatus('ok', 'PRZENUMEROWANO WSZYSTKIE ID SEKWENCYJNIE OD 1.');
    });

    btnAddManual.addEventListener('click', () => {
        const url = prompt('Podaj URL RAW do pliku HTML (np. https://gist.githubusercontent.com/s-pro-v/<ID>/raw/):');
        if (!url) return;
        const title = prompt('Podaj tytuł modułu:', 'Nowy Moduł') || 'Nowy Moduł';
        const filename = prompt('Podaj nazwę pliku (np. modul.html):', 'modul.html') || 'modul.html';
        const maxId = items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);

        items.push({
            id: maxId + 1,
            title: title.trim(),
            filename: filename.trim(),
            url: url.trim(),
            isNew: true
        });
        renderList();
        setStatus('ok', `DODANO RĘCZNIE MODUŁ: ${title}`);
    });

    btnCopyJson.addEventListener('click', async () => {
        await navigator.clipboard.writeText(jsonOutput.value);
        setStatus('ok', 'SKOPIOWANO SFORMATOWANY KOD HTML.JSON DO SCHOWKA.');
    });

    btnDownloadJson.addEventListener('click', () => {
        const blob = new Blob([jsonOutput.value], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'html.json';
        a.click();
        URL.revokeObjectURL(a.href);
        setStatus('ok', 'POBRANO PLIK HTML.JSON NA DYSK.');
    });

    // TABS SWITCHING
    function switchTab(target) {
        tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === target));

        previewFrame.classList.add('hidden');
        previewPlaceholder.classList.add('hidden');
        creatorPanel.classList.add('hidden');
        jsonOutput.classList.add('hidden');

        const previewMetaWrap = document.getElementById('previewMetaWrap');
        if (target === 'preview') {
            if (previewMetaWrap) previewMetaWrap.classList.remove('hidden');
            if (editorModeLabel) editorModeLabel.classList.add('hidden');
            if (editorModeIcon) editorModeIcon.setAttribute('data-lucide', 'eye');
            if (btnResetToNewMode) btnResetToNewMode.classList.add('hidden');
            if (btnCancelEditTop) btnCancelEditTop.classList.add('hidden');
            if (btnCancelEdit) btnCancelEdit.classList.add('hidden');

            if (activeIndex >= 0 || previewFrame.srcdoc) {
                previewFrame.classList.remove('hidden');
            } else {
                previewPlaceholder.classList.remove('hidden');
            }
        } else if (target === 'editor') {
            creatorPanel.classList.remove('hidden');
            if (previewMetaWrap) previewMetaWrap.classList.add('hidden');
            if (editorModeLabel) editorModeLabel.classList.remove('hidden');
            if (editorModeIcon) {
                editorModeIcon.setAttribute('data-lucide', editingState ? 'edit-3' : 'file-plus');
            }
            if (btnResetToNewMode) btnResetToNewMode.classList.remove('hidden');
            if (btnCancelEditTop) btnCancelEditTop.classList.toggle('hidden', !editingState);
            if (btnCancelEdit) btnCancelEdit.classList.toggle('hidden', !editingState);

            activePreviewName.textContent = editingState
                ? `EDYCJA: ${newGistTitle.value}`
                : 'EDYTOR MONACO // NOWY GIST';
            if (monacoEditor) {
                requestAnimationFrame(() => monacoEditor.layout());
            }
        } else if (target === 'json') {
            jsonOutput.classList.remove('hidden');
            if (previewMetaWrap) previewMetaWrap.classList.remove('hidden');
            if (editorModeLabel) editorModeLabel.classList.add('hidden');
            if (editorModeIcon) editorModeIcon.setAttribute('data-lucide', 'file-code');
            if (btnResetToNewMode) btnResetToNewMode.classList.add('hidden');
            if (btnCancelEditTop) btnCancelEditTop.classList.add('hidden');
            if (btnCancelEdit) btnCancelEdit.classList.add('hidden');

            activePreviewName.textContent = 'SUROWY KOD HTML.JSON';
            updateJsonInspector();
        }

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
})();