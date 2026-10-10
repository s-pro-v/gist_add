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

let gistsData = [];
let pendingDeleteId = null;
let pendingDeleteFilename = '';
let pendingDeleteTitle = '';
let activeModalContent = '';
let activeModalFilename = '';
let activeGistId = null;
let originalFilename = '';

const SYNC_REPO_CONFIG = {
    owner: 's-pro-v',
    repo: 'json-lista',
    path: 'html.json',
    branch: 'main'
};

const syncJsonToggle = document.getElementById('sync-json-toggle');
const urlModeSelect = document.getElementById('url-mode-select');
const copyCachebustUrlBtn = document.getElementById('copy-cachebust-url-btn');
const lastSyncStatus = document.getElementById('last-sync-status');
const repoAuthStatus = document.getElementById('repo-auth-status');
const inspectRepoJsonBtn = document.getElementById('inspect-repo-json-btn');
const forceResyncBtn = document.getElementById('force-resync-btn');

const repoInspectModal = document.getElementById('repo-inspect-modal');
const repoInspectContent = document.getElementById('repo-inspect-content');
const repoInspectCount = document.getElementById('repo-inspect-count');
const closeRepoInspectBtn = document.getElementById('close-repo-inspect-btn');
const refreshRepoInspectBtn = document.getElementById('refresh-repo-inspect-btn');

function buildTargetGistRawUrl(gist, file) {
    const mode = urlModeSelect ? urlModeSelect.value : 'timestamp';
    const owner = (gist.owner && gist.owner.login) ? gist.owner.login : 's-pro-v';
    const cleanFilename = encodeURIComponent(file.filename);
    const timestamp = Date.now();

    if (mode === 'timestamp') {
        return `https://gist.githubusercontent.com/${owner}/${gist.id}/raw/${cleanFilename}?t=${timestamp}`;
    } else if (mode === 'live') {
        return `https://gist.githubusercontent.com/${owner}/${gist.id}/raw/${cleanFilename}`;
    } else {
        return file.raw_url;
    }
}

function updateSyncStatusText(msg, isSuccess = true) {
    if (!lastSyncStatus) return;
    lastSyncStatus.textContent = `${new Date().toLocaleTimeString()} - ${msg}`;
    lastSyncStatus.style.color = isSuccess ? '#4ade80' : '#f87171';
}

async function checkRepoPermissions() {
    const token = getToken();
    if (!token) {
        repoAuthStatus.textContent = 'Brak tokenu';
        repoAuthStatus.style.color = '#f87171';
        return;
    }

    try {
        const url = `https://api.github.com/repos/${SYNC_REPO_CONFIG.owner}/${SYNC_REPO_CONFIG.repo}`;
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
                repoAuthStatus.textContent = 'Dostęp ZAPIS OK';
                repoAuthStatus.style.color = '#4ade80';
                repoAuthStatus.style.background = 'rgba(74, 222, 128, 0.1)';
            } else {
                repoAuthStatus.textContent = 'Tylko ODCZYT';
                repoAuthStatus.style.color = '#facc15';
            }
        } else if (res.status === 404) {
            repoAuthStatus.textContent = 'Brak uprawnień "repo" (404)';
            repoAuthStatus.style.color = '#f87171';
        } else {
            repoAuthStatus.textContent = `Błąd (${res.status})`;
            repoAuthStatus.style.color = '#f87171';
        }
    } catch (e) {
        repoAuthStatus.textContent = 'Błąd sieci';
    }
}

async function inspectRepoJson() {
    repoInspectModal.classList.remove('hidden');
    repoInspectContent.textContent = 'Pobieranie aktualnego pliku html.json z GitHuba...';
    const token = getToken();

    try {
        const getUrl = `https://api.github.com/repos/${SYNC_REPO_CONFIG.owner}/${SYNC_REPO_CONFIG.repo}/contents/${SYNC_REPO_CONFIG.path}?ref=${encodeURIComponent(SYNC_REPO_CONFIG.branch)}&_=${Date.now()}`;
        const headers = {
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(getUrl, { headers, cache: 'no-store' });
        if (!res.ok) throw new Error(`Status ${res.status}: ${res.statusText}`);

        const data = await res.json();
        const jsonText = base64ToUtf8(data.content);
        const parsed = JSON.parse(jsonText);
        repoInspectCount.textContent = `${Array.isArray(parsed) ? parsed.length : 0} wpisów`;
        repoInspectContent.textContent = JSON.stringify(parsed, null, 2);
    } catch (err) {
        repoInspectContent.textContent = `Błąd pobierania pliku: ${err.message}\nUpewnij się, że token posiada uprawnienie 'repo'.`;
    }
}

inspectRepoJsonBtn.addEventListener('click', inspectRepoJson);
refreshRepoInspectBtn.addEventListener('click', inspectRepoJson);
closeRepoInspectBtn.addEventListener('click', () => repoInspectModal.classList.add('hidden'));

const resyncModal = document.getElementById('resync-modal');
const resyncModalCancel = document.getElementById('resync-modal-cancel');
const resyncModalOk = document.getElementById('resync-modal-ok');
const resyncModalCloseX = document.getElementById('resync-modal-close-x');

function closeResyncModal() {
    resyncModal.classList.add('hidden');
}

forceResyncBtn.addEventListener('click', () => {
    const token = getToken();
    if (!token) {
        showToast('Zapisz najpierw token GitHub.', 'error');
        return;
    }
    if (!gistsData || gistsData.length === 0) {
        showToast('Lista Gistów jest pusta. Kliknij najpierw Odśwież.', 'info');
        return;
    }
    resyncModal.classList.remove('hidden');
});

resyncModalCancel.addEventListener('click', closeResyncModal);
resyncModalCloseX.addEventListener('click', closeResyncModal);

resyncModalOk.addEventListener('click', async () => {
    closeResyncModal();
    const token = getToken();
    if (!token) return;

    forceResyncBtn.disabled = true;
    forceResyncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sync...';

    try {
        const getUrl = `https://api.github.com/repos/${SYNC_REPO_CONFIG.owner}/${SYNC_REPO_CONFIG.repo}/contents/${SYNC_REPO_CONFIG.path}?ref=${encodeURIComponent(SYNC_REPO_CONFIG.branch)}&_=${Date.now()}`;
        const getRes = await fetch(getUrl, {
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${token}`,
                'X-GitHub-Api-Version': '2022-11-28'
            },
            cache: 'no-store'
        });

        let sha = null;
        if (getRes.ok) {
            const fileData = await getRes.json();
            sha = fileData.sha;
        }

        const newList = gistsData.map((gist, idx) => {
            const files = Object.values(gist.files);
            const f = files[0] || { filename: 'plik.html' };
            return {
                id: idx + 1,
                title: gist.description || f.filename.replace(/\.[^/.]+$/, ""),
                filename: f.filename,
                url: buildTargetGistRawUrl(gist, f)
            };
        });

        const putRes = await fetch(`https://api.github.com/repos/${SYNC_REPO_CONFIG.owner}/${SYNC_REPO_CONFIG.repo}/contents/${SYNC_REPO_CONFIG.path}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${token}`,
                'X-GitHub-Api-Version': '2022-11-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Full resync html.json (${newList.length} items) [skip ci]`,
                content: utf8ToBase64(JSON.stringify(newList, null, 4)),
                branch: SYNC_REPO_CONFIG.branch,
                ...(sha ? { sha } : {})
            })
        });

        if (putRes.ok) {
            showToast(`Pomyślnie zsynchronizowano ${newList.length} Gistów do html.json!`, 'success');
            updateSyncStatusText(`Zsynchronizowano pełną listę (${newList.length} pozycji)`);
        } else {
            const err = await putRes.json().catch(() => ({}));
            showToast(`Błąd zapisu (${putRes.status}): ${err.message || 'Brak uprawnień repo'}`, 'error');
            updateSyncStatusText(`Błąd zapisu (${putRes.status})`, false);
        }
    } catch (err) {
        showToast('Błąd sieci: ' + err.message, 'error');
        updateSyncStatusText('Błąd sieci', false);
    } finally {
        forceResyncBtn.disabled = false;
        forceResyncBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate" style="color: #4ade80;"></i> Pełny Re-Sync';
    }
});

async function commitJsonToRepo(commitMessage, updatedList, attempt = 1) {
    const token = getToken();
    if (!token) return false;

    try {
        const getUrl = `https://api.github.com/repos/${SYNC_REPO_CONFIG.owner}/${SYNC_REPO_CONFIG.repo}/contents/${SYNC_REPO_CONFIG.path}?ref=${encodeURIComponent(SYNC_REPO_CONFIG.branch)}&_=${Date.now()}`;
        const getRes = await fetch(getUrl, {
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${token}`,
                'X-GitHub-Api-Version': '2022-11-28'
            },
            cache: 'no-store'
        });

        let sha = null;
        if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha;
        }

        const putRes = await fetch(`https://api.github.com/repos/${SYNC_REPO_CONFIG.owner}/${SYNC_REPO_CONFIG.repo}/contents/${SYNC_REPO_CONFIG.path}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${token}`,
                'X-GitHub-Api-Version': '2022-11-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: commitMessage,
                content: utf8ToBase64(JSON.stringify(updatedList, null, 4)),
                branch: SYNC_REPO_CONFIG.branch,
                ...(sha ? { sha } : {})
            })
        });

        if (putRes.ok) return true;

        if (putRes.status === 409 && attempt < 2) {
            return await commitJsonToRepo(commitMessage, updatedList, attempt + 1);
        }

        const errData = await putRes.json().catch(() => ({}));
        showToast(`Błąd zapisu html.json (${putRes.status}): ${errData.message || 'Brak uprawnień'}`, 'error');
        updateSyncStatusText(`Błąd zapisu (${putRes.status})`, false);
        return false;
    } catch (err) {
        showToast(`Błąd połączenia z repozytorium: ${err.message}`, 'error');
        updateSyncStatusText('Błąd połączenia', false);
        return false;
    }
}

async function syncAddGistToJsonRepo(newGist) {
    if (!syncJsonToggle.checked) return;
    const token = getToken();
    if (!token) return;

    const files = Object.values(newGist.files);
    const primaryFile = files[0];
    if (!primaryFile) return;

    try {
        const getUrl = `https://api.github.com/repos/${SYNC_REPO_CONFIG.owner}/${SYNC_REPO_CONFIG.repo}/contents/${SYNC_REPO_CONFIG.path}?ref=${encodeURIComponent(SYNC_REPO_CONFIG.branch)}&_=${Date.now()}`;
        const getRes = await fetch(getUrl, {
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${token}`,
                'X-GitHub-Api-Version': '2022-11-28'
            },
            cache: 'no-store'
        });

        let currentList = [];
        if (getRes.ok) {
            const data = await getRes.json();
            try {
                currentList = JSON.parse(base64ToUtf8(data.content));
                if (!Array.isArray(currentList)) currentList = [];
            } catch {
                currentList = [];
            }
        }

        const nextId = currentList.length > 0
            ? Math.max(...currentList.map(item => Number(item.id) || 0)) + 1
            : 1;

        const targetUrl = buildTargetGistRawUrl(newGist, primaryFile);
        const newItem = {
            id: nextId,
            title: newGist.description || primaryFile.filename.replace(/\.[^/.]+$/, ""),
            filename: primaryFile.filename,
            url: targetUrl
        };

        currentList.push(newItem);

        const ok = await commitJsonToRepo(`Add ${primaryFile.filename} to html.json [skip ci]`, currentList);
        if (ok) {
            showToast(`Zaktualizowano natychmiast plik html.json (Nowy ID: ${nextId})!`, 'success');
            updateSyncStatusText(`Dodano wpis ID: ${nextId}`);
        }
    } catch (err) {
        showToast(`Błąd synchronizacji: ${err.message}`, 'error');
        updateSyncStatusText('Błąd połączenia', false);
    }
}

async function syncUpdateGistInJsonRepo(updatedGist, oldFilename, newFilename, newTitle) {
    if (!syncJsonToggle.checked) return;
    const token = getToken();
    if (!token) return;

    const files = Object.values(updatedGist.files);
    const primaryFile = files.find(f => f.filename === newFilename) || files[0];
    if (!primaryFile) return;

    try {
        const getUrl = `https://api.github.com/repos/${SYNC_REPO_CONFIG.owner}/${SYNC_REPO_CONFIG.repo}/contents/${SYNC_REPO_CONFIG.path}?ref=${encodeURIComponent(SYNC_REPO_CONFIG.branch)}&_=${Date.now()}`;
        const getRes = await fetch(getUrl, {
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${token}`,
                'X-GitHub-Api-Version': '2022-11-28'
            },
            cache: 'no-store'
        });

        if (!getRes.ok) {
            const errData = await getRes.json().catch(() => ({}));
            showToast(`Nie można odczytać html.json (${getRes.status}): ${errData.message || 'Brak uprawnień repo'}`, 'error');
            updateSyncStatusText(`Błąd odczytu repo (${getRes.status})`, false);
            return;
        }

        const data = await getRes.json();
        let currentList = JSON.parse(base64ToUtf8(data.content));
        if (!Array.isArray(currentList)) return;

        let targetIndex = currentList.findIndex(item => item.url && item.url.toLowerCase().includes(updatedGist.id.toLowerCase()));
        if (targetIndex === -1 && oldFilename) {
            targetIndex = currentList.findIndex(item => item.filename === oldFilename);
        }
        if (targetIndex === -1 && newFilename) {
            targetIndex = currentList.findIndex(item => item.filename === newFilename);
        }

        const newTargetUrl = buildTargetGistRawUrl(updatedGist, primaryFile);
        const resolvedTitle = newTitle || updatedGist.description || primaryFile.filename.replace(/\.[^/.]+$/, "");

        if (targetIndex !== -1) {
            currentList[targetIndex].title = resolvedTitle;
            currentList[targetIndex].filename = primaryFile.filename;
            currentList[targetIndex].url = newTargetUrl;
        } else {
            const nextId = currentList.length > 0
                ? Math.max(...currentList.map(item => Number(item.id) || 0)) + 1
                : 1;
            currentList.push({
                id: nextId,
                title: resolvedTitle,
                filename: primaryFile.filename,
                url: newTargetUrl
            });
        }

        const ok = await commitJsonToRepo(`Update ${primaryFile.filename} in html.json [skip ci]`, currentList);
        if (ok) {
            showToast(`Zaktualizowano wpis w html.json w czasie rzeczywistym!`, 'success');
            updateSyncStatusText(`Zaktualizowano plik ${primaryFile.filename}`);
        }
    } catch (err) {
        showToast(`Błąd aktualizacji html.json: ${err.message}`, 'error');
        updateSyncStatusText('Błąd połączenia', false);
    }
}

async function syncDeleteGistFromJsonRepo(gistId, filename) {
    if (!syncJsonToggle.checked) return;
    const token = getToken();
    if (!token) return;

    try {
        const getUrl = `https://api.github.com/repos/${SYNC_REPO_CONFIG.owner}/${SYNC_REPO_CONFIG.repo}/contents/${SYNC_REPO_CONFIG.path}?ref=${encodeURIComponent(SYNC_REPO_CONFIG.branch)}&_=${Date.now()}`;
        const getRes = await fetch(getUrl, {
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${token}`,
                'X-GitHub-Api-Version': '2022-11-28'
            },
            cache: 'no-store'
        });

        if (!getRes.ok) return;

        const data = await getRes.json();
        let currentList = JSON.parse(base64ToUtf8(data.content));
        if (!Array.isArray(currentList)) return;

        const prevLength = currentList.length;
        currentList = currentList.filter(item => {
            const urlMatches = item.url && item.url.toLowerCase().includes(gistId.toLowerCase());
            return !urlMatches;
        });

        if (currentList.length === prevLength && filename) {
            currentList = currentList.filter(item => item.filename !== filename);
        }

        if (currentList.length === prevLength) return;

        const ok = await commitJsonToRepo(`Remove Gist ${gistId} (${filename}) from html.json [skip ci]`, currentList);
        if (ok) {
            showToast(`Usunięto wpis z html.json w repozytorium!`, 'success');
            updateSyncStatusText(`Usunięto ${filename} z html.json`);
        }
    } catch (err) {
        showToast(`Błąd usuwania wpisu z html.json: ${err.message}`, 'error');
        updateSyncStatusText('Błąd usuwania z repo', false);
    }
}

function getToken() {
    return localStorage.getItem('gh_gist_token') || '';
}

function checkTokenStatus() {
    const token = getToken();
    if (token) {
        tokenMissingBanner.classList.add('hidden');
        tokenInput.value = token;
        checkRepoPermissions();
    } else {
        tokenMissingBanner.classList.remove('hidden');
        repoAuthStatus.textContent = 'Brak tokenu';
    }
}

const tokenInput = document.getElementById('gh-token-input');
const saveTokenBtn = document.getElementById('save-token-btn');
const toggleTokenVis = document.getElementById('toggle-token-vis');
const tokenMissingBanner = document.getElementById('token-missing-banner');

const gistForm = document.getElementById('gist-form');
const gistFilename = document.getElementById('gist-filename');
const gistDesc = document.getElementById('gist-desc');
const gistContent = document.getElementById('gist-content');
const gistPublic = document.getElementById('gist-public');
const submitBtn = document.getElementById('submit-gist-btn');
const fileExtBadge = document.getElementById('file-ext-badge');
const charCounter = document.getElementById('char-counter');
const formatJsonBtn = document.getElementById('format-json-btn');
const formatJsonWrap = document.getElementById('format-json-wrap');

const previewPanel = document.getElementById('preview-panel');
const livePreviewBtn = document.getElementById('live-preview-btn');
const closePreviewBtn = document.getElementById('close-preview-btn');
const previewFrame = document.getElementById('preview-frame');
const openFormPreviewExt = document.getElementById('open-form-preview-ext');

const gistsList = document.getElementById('gists-list');
const refreshBtn = document.getElementById('refresh-gists-btn');
const refreshIcon = document.getElementById('refresh-icon');
const gistsCountBadge = document.getElementById('gists-count-badge');
const searchGists = document.getElementById('search-gists');

const confirmModal = document.getElementById('confirm-modal');
const confirmCancel = document.getElementById('confirm-modal-cancel');
const confirmOk = document.getElementById('confirm-modal-ok');
const confirmModalCloseX = document.getElementById('confirm-modal-close-x');
const confirmDelIcon = document.getElementById('confirm-del-icon');
const confirmDelText = document.getElementById('confirm-del-text');
const confirmModalMeta = document.getElementById('confirm-modal-meta');

const viewModal = document.getElementById('view-modal');
const viewModalFilename = document.getElementById('view-modal-filename');
const viewModalBadge = document.getElementById('view-modal-badge');
const viewModalCode = document.getElementById('view-modal-code');
const viewGithubLink = document.getElementById('view-github-link');
const closeViewBtn = document.getElementById('close-view-btn');
const copyViewBtn = document.getElementById('copy-view-btn');
const modalDeleteBtn = document.getElementById('modal-delete-btn');

const tabPreviewBtn = document.getElementById('tab-preview-btn');
const tabCodeBtn = document.getElementById('tab-code-btn');
const modalPreviewWrapper = document.getElementById('modal-preview-wrapper');
const modalCodeWrapper = document.getElementById('modal-code-wrapper');
const modalPreviewFrame = document.getElementById('modal-preview-frame');
const frameCenteringBox = document.getElementById('frame-centering-box');

const vpFullBtn = document.getElementById('vp-full-btn');
const vpTabletBtn = document.getElementById('vp-tablet-btn');
const vpMobileBtn = document.getElementById('vp-mobile-btn');
const reloadPreviewBtn = document.getElementById('reload-preview-btn');
const openNewTabPreview = document.getElementById('open-new-tab-preview');

const tabEditBtn = document.getElementById('tab-edit-btn');
const modalEditWrapper = document.getElementById('modal-edit-wrapper');
const editGistFilename = document.getElementById('edit-gist-filename');
const editGistDesc = document.getElementById('edit-gist-desc');
const editGistContent = document.getElementById('edit-gist-content');
const editCharCounter = document.getElementById('edit-char-counter');
const editFormatJsonBtn = document.getElementById('edit-format-json-btn');
const editFormatJsonWrap = document.getElementById('edit-format-json-wrap');
const saveGistEditBtn = document.getElementById('save-gist-edit-btn');
const editCancelBtn = document.getElementById('edit-cancel-btn');
const editPreviewNowBtn = document.getElementById('edit-preview-now-btn');

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = type === 'success' ? 'fa-circle-check' :
        type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info';

    toast.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <i class="fa-solid ${icon}"></i>
          <span>${message}</span>
        </div>
        <button style="background:transparent; border:none; color:inherit; cursor:pointer;" onclick="this.parentElement.remove()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;

    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 4500);
}

function copyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showToast('Skopiowano treść do schowka!', 'success');
    } catch (err) {
        showToast('Nie udało się skopiować.', 'error');
    }
    document.body.removeChild(textArea);
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function utf8ToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(str) {
    return decodeURIComponent(escape(atob(str.replace(/\s/g, ''))));
}

saveTokenBtn.addEventListener('click', () => {
    const val = tokenInput.value.trim();
    if (!val) {
        localStorage.removeItem('gh_gist_token');
        showToast('Token został usunięty.', 'info');
    } else {
        localStorage.setItem('gh_gist_token', val);
        showToast('Token został zapisany pomyślnie.', 'success');
    }
    checkTokenStatus();
    if (val) fetchGists();
});

toggleTokenVis.addEventListener('click', () => {
    const isPass = tokenInput.type === 'password';
    tokenInput.type = isPass ? 'text' : 'password';
    toggleTokenVis.innerHTML = isPass ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
});

function updateFileMeta() {
    const name = gistFilename.value.trim().toLowerCase();
    let ext = 'TXT';
    if (name.endsWith('.html') || name.endsWith('.htm')) {
        ext = 'HTML';
        fileExtBadge.className = 'badge-lang badge-html';
        formatJsonWrap.classList.add('hidden');
    } else if (name.endsWith('.json')) {
        ext = 'JSON';
        fileExtBadge.className = 'badge-lang badge-json';
        formatJsonWrap.classList.remove('hidden');
    } else {
        const parts = name.split('.');
        ext = parts.length > 1 ? parts.pop().toUpperCase() : 'TXT';
        fileExtBadge.className = 'badge-lang';
        formatJsonWrap.classList.add('hidden');
    }
    fileExtBadge.textContent = ext;
}

gistFilename.addEventListener('input', updateFileMeta);

gistContent.addEventListener('input', () => {
    charCounter.textContent = `${gistContent.value.length} znaków`;
});

formatJsonBtn.addEventListener('click', () => {
    try {
        const parsed = JSON.parse(gistContent.value);
        gistContent.value = JSON.stringify(parsed, null, 2);
        showToast('JSON został sformatowany.', 'success');
    } catch (e) {
        showToast('Błąd składni JSON: ' + e.message, 'error');
    }
});

document.getElementById('preset-html-btn').addEventListener('click', () => {
    gistFilename.value = PRESETS.html.filename;
    gistDesc.value = PRESETS.html.desc;
    gistContent.value = PRESETS.html.code;
    updateFileMeta();
    charCounter.textContent = `${gistContent.value.length} znaków`;
    showToast('Wczytano szablon HTML.', 'info');
});

document.getElementById('preset-json-btn').addEventListener('click', () => {
    gistFilename.value = PRESETS.json.filename;
    gistDesc.value = PRESETS.json.desc;
    gistContent.value = PRESETS.json.code;
    updateFileMeta();
    charCounter.textContent = `${gistContent.value.length} znaków`;
    showToast('Wczytano szablon JSON.', 'info');
});

document.getElementById('preset-clear-btn').addEventListener('click', () => {
    gistFilename.value = 'plik.txt';
    gistDesc.value = '';
    gistContent.value = '';
    updateFileMeta();
    charCounter.textContent = '0 znaków';
});

livePreviewBtn.addEventListener('click', () => {
    const code = gistContent.value;
    if (!code.trim()) {
        showToast('Formularz jest pusty. Wpisz najpierw kod.', 'info');
        return;
    }
    previewPanel.classList.remove('hidden');
    const isHtml = gistFilename.value.toLowerCase().endsWith('.html') || gistFilename.value.toLowerCase().endsWith('.htm');
    const content = isHtml ? code : `<!DOCTYPE html><html><body style="font-family:monospace; background:#000; color:#f36c00; padding:16px; white-space:pre-wrap;">${escapeHtml(code)}</body></html>`;
    previewFrame.srcdoc = content;
    previewPanel.scrollIntoView({ behavior: 'smooth' });
});

closePreviewBtn.addEventListener('click', () => {
    previewPanel.classList.add('hidden');
    previewFrame.srcdoc = '';
});

openFormPreviewExt.addEventListener('click', () => {
    const code = gistContent.value;
    if (!code.trim()) return;
    const isHtml = gistFilename.value.toLowerCase().endsWith('.html') || gistFilename.value.toLowerCase().endsWith('.htm');
    const content = isHtml ? code : `<!DOCTYPE html><html><body style="font-family:monospace; background:#000; color:#f36c00; padding:16px; white-space:pre-wrap;">${escapeHtml(code)}</body></html>`;
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
});

gistForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = getToken();

    if (!token) {
        showToast('Zapisz najpierw swój GitHub Personal Access Token.', 'error');
        tokenInput.focus();
        return;
    }

    const filename = gistFilename.value.trim();
    const content = gistContent.value;
    const description = gistDesc.value.trim();
    const isPublic = gistPublic.value === 'true';

    if (!filename || !content) {
        showToast('Nazwa pliku oraz jego treść są wymagane.', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Wysyłanie...';

    const payload = {
        description: description,
        public: isPublic,
        files: {
            [filename]: { content: content }
        }
    };

    try {
        const response = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${token}`,
                'X-GitHub-Api-Version': '2022-11-28'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (response.ok) {
            showToast('Gist utworzony pomyślnie!', 'success');
            fetchGists();
            syncAddGistToJsonRepo(data);
        } else {
            showToast(`Błąd (${response.status}): ${data.message || 'Nieznany błąd'}`, 'error');
        }
    } catch (err) {
        showToast('Błąd połączenia z GitHub: ' + err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i><span>Opublikuj na GitHubie</span>';
    }
});

async function fetchGists() {
    const token = getToken();
    if (!token) {
        renderGistsList([]);
        return;
    }

    refreshIcon.classList.add('fa-spin');
    try {
        const response = await fetch('https://api.github.com/gists?per_page=100', {
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${token}`,
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (response.status === 401) {
            showToast('Nieprawidłowy token lub brak uprawnień "gist"', 'error');
            renderGistsList([]);
            return;
        }

        const data = await response.json();
        if (response.ok) {
            gistsData = data;
            renderGistsList(gistsData);
            showToast(`Pobrano ${data.length} Gistów.`, 'success');
        } else {
            showToast(`Błąd pobierania: ${data.message}`, 'error');
        }
    } catch (err) {
        showToast('Błąd sieci: ' + err.message, 'error');
    } finally {
        refreshIcon.classList.remove('fa-spin');
    }
}

refreshBtn.addEventListener('click', fetchGists);

function renderGistsList(gists) {
    gistsCountBadge.textContent = gists.length;

    if (!gists || gists.length === 0) {
        gistsList.innerHTML = `
          <div style="text-align: center; padding: 40px 10px; color: var(--text-muted); font-size: 0.8rem;">
            <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.4;"></i>
            Brak Gistów do wyświetlenia.
          </div>
        `;
        return;
    }

    gistsList.innerHTML = '';

    gists.forEach(gist => {
        const files = Object.values(gist.files);
        const primaryFile = files[0] || { filename: 'unnamed', language: 'Text' };
        const isSecret = !gist.public;
        const dateStr = new Date(gist.created_at).toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        const isHtml = primaryFile.filename.toLowerCase().endsWith('.html') || primaryFile.filename.toLowerCase().endsWith('.htm');
        const isJson = primaryFile.filename.toLowerCase().endsWith('.json');

        let badgeClass = 'badge-lang';
        if (isHtml) badgeClass += ' badge-html';
        if (isJson) badgeClass += ' badge-json';

        const visBadge = isSecret
            ? `<span class="badge-vis"><i class="fa-solid fa-lock" style="margin-right:4px;"></i>Secret</span>`
            : `<span class="badge-vis public"><i class="fa-solid fa-earth-americas" style="margin-right:4px;"></i>Public</span>`;

        const item = document.createElement('div');
        item.className = 'gist-item';

        item.innerHTML = `
          <div class="gist-item-header">
            <div class="gist-filename">
              <i class="fa-regular fa-file" style="color: var(--highlight-color);"></i>
              <span>${escapeHtml(primaryFile.filename)}</span>
              <span class="${badgeClass}">${primaryFile.language || 'KOD'}</span>
            </div>
            ${visBadge}
          </div>

          <div class="gist-desc">
            ${gist.description ? escapeHtml(gist.description) : '<span style="color:#666; font-style:italic;">Brak opisu</span>'}
          </div>

          <div class="gist-footer">
            <span><i class="fa-regular fa-clock" style="margin-right:4px;"></i>${dateStr}</span>
            
            <div class="gist-actions">
              <div class="btn-bg">
                <button 
                  class="btn btn-accent preview-gist-btn" 
                  data-id="${gist.id}" 
                  data-mode="preview"
                  style="padding: 4px 8px; font-size: 0.72rem;"
                  title="Otwórz podgląd na żywo (Renderowany HTML)"
                >
                  <i class="fa-solid fa-desktop"></i> Podgląd
                </button>
              </div>

              <div class="btn-bg">
                <button 
                  class="btn btn-dark view-gist-btn" 
                  data-id="${gist.id}" 
                  data-mode="code"
                  style="padding: 4px 8px; font-size: 0.72rem;"
                  title="Pokaż kod źródłowy"
                >
                  <i class="fa-solid fa-code"></i> Kod
                </button>
              </div>

              <div class="btn-bg">
                <button 
                  class="btn btn-dark edit-gist-btn" 
                  data-id="${gist.id}" 
                  data-mode="edit"
                  style="padding: 4px 8px; font-size: 0.72rem;"
                  title="Edytuj treść i nazwę tego Gista"
                >
                  <i class="fa-solid fa-pen-to-square" style="color: var(--highlight-color);"></i> Edytuj
                </button>
              </div>

              <div class="btn-bg">
                <a 
                  href="${gist.html_url}" 
                  target="_blank" 
                  class="btn btn-dark" 
                  style="padding: 4px 8px; font-size: 0.72rem;"
                  title="Otwórz na gist.github.com"
                >
                  <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
              </div>

              <div class="btn-bg">
                <button 
                  class="btn btn-danger delete-gist-btn" 
                  data-id="${gist.id}" 
                  data-title="${escapeHtml(primaryFile.filename)}"
                  data-desc="${escapeHtml(gist.description || '')}"
                  style="padding: 4px 8px; font-size: 0.72rem;"
                  title="Usuń ten Gist"
                >
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        `;

        gistsList.appendChild(item);
    });

    document.querySelectorAll('.preview-gist-btn').forEach(btn => {
        btn.addEventListener('click', () => openDualViewModal(btn.dataset.id, 'preview'));
    });

    document.querySelectorAll('.view-gist-btn').forEach(btn => {
        btn.addEventListener('click', () => openDualViewModal(btn.dataset.id, 'code'));
    });

    document.querySelectorAll('.edit-gist-btn').forEach(btn => {
        btn.addEventListener('click', () => openDualViewModal(btn.dataset.id, 'edit'));
    });

    document.querySelectorAll('.delete-gist-btn').forEach(btn => {
        btn.addEventListener('click', () => promptDeleteModal(btn.dataset.id, btn.dataset.title, btn.dataset.desc));
    });
}

searchGists.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = gistsData.filter(g => {
        const descMatch = (g.description || '').toLowerCase().includes(term);
        const fileMatch = Object.keys(g.files).some(name => name.toLowerCase().includes(term));
        return descMatch || fileMatch;
    });
    renderGistsList(filtered);
});

function renderContentIntoFrame(filename, content) {
    const lower = (filename || '').toLowerCase();
    const isHtml = lower.endsWith('.html') || lower.endsWith('.htm');
    const isJson = lower.endsWith('.json');

    if (isHtml) {
        modalPreviewFrame.srcdoc = content;
    } else if (isJson) {
        let formatted = content;
        try {
            formatted = JSON.stringify(JSON.parse(content), null, 2);
        } catch (_) { }
        modalPreviewFrame.srcdoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; background: #000; color: #f59e0b; font-family: 'JetBrains Mono', monospace; padding: 18px; line-height: 1.5; }
    pre { white-space: pre-wrap; word-break: break-all; margin: 0; }
  </style>
</head>
<body>
  <pre>${escapeHtml(formatted)}</pre>
</body>
</html>`;
    } else {
        modalPreviewFrame.srcdoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; background: #000; color: #e0e0e0; font-family: 'JetBrains Mono', monospace; padding: 18px; line-height: 1.5; }
    pre { white-space: pre-wrap; word-break: break-all; margin: 0; }
  </style>
</head>
<body>
  <pre>${escapeHtml(content)}</pre>
</body>
</html>`;
    }
}

async function openDualViewModal(gistId, initialTab = 'preview') {
    const gistSummary = gistsData.find(g => g.id === gistId);
    if (!gistSummary) return;

    activeGistId = gistId;
    const initialFile = Object.values(gistSummary.files)[0] || { filename: 'plik.txt' };
    activeModalFilename = initialFile.filename;
    originalFilename = initialFile.filename;
    viewModalFilename.textContent = initialFile.filename;
    viewModalBadge.textContent = initialFile.language || 'PLIK';
    viewGithubLink.href = gistSummary.html_url;

    editGistFilename.value = initialFile.filename;
    editGistDesc.value = gistSummary.description || '';

    viewModalCode.textContent = 'Pobieranie pełnej zawartości z API GitHuba...';
    modalPreviewFrame.srcdoc = `<!DOCTYPE html><html><body style="font-family:'JetBrains Mono',monospace; background:#181818; color:#858585; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;"><div style="text-align:center;"><p>Ładowanie podglądu...</p></div></body></html>`;
    viewModal.classList.remove('hidden');

    setModalTab(initialTab);

    try {
        const token = getToken();
        const headers = {
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
        if (!res.ok) throw new Error(`Nie udało się pobrać Gista (Status ${res.status})`);

        const fullGist = await res.json();
        const fullFile = Object.values(fullGist.files)[0] || initialFile;

        activeModalFilename = fullFile.filename;
        originalFilename = fullFile.filename;
        viewModalFilename.textContent = fullFile.filename;
        viewModalBadge.textContent = fullFile.language || 'PLIK';
        editGistFilename.value = fullFile.filename;
        editGistDesc.value = fullGist.description || '';

        let content = fullFile.content;
        if (!content && fullFile.raw_url) {
            const rawRes = await fetch(fullFile.raw_url, { headers });
            content = await rawRes.text();
        }

        activeModalContent = content || '';
        viewModalCode.textContent = activeModalContent;
        editGistContent.value = activeModalContent;
        editCharCounter.textContent = `${activeModalContent.length} znaków`;

        if (activeModalFilename.toLowerCase().endsWith('.json')) {
            editFormatJsonWrap.classList.remove('hidden');
        } else {
            editFormatJsonWrap.classList.add('hidden');
        }

        renderContentIntoFrame(activeModalFilename, activeModalContent);

    } catch (err) {
        viewModalCode.textContent = 'Błąd podczas wczytywania zawartości: ' + err.message;
        modalPreviewFrame.srcdoc = `<!DOCTYPE html><html><body style="font-family:sans-serif; background:#1e1e1e; color:#ff7b72; padding:24px;"><h3>Błąd ładowania podglądu</h3><p>${escapeHtml(err.message)}</p></body></html>`;
    }
}

function setViewportMode(mode) {
    vpFullBtn.classList.remove('active');
    vpTabletBtn.classList.remove('active');
    vpMobileBtn.classList.remove('active');
    frameCenteringBox.classList.remove('viewport-mobile', 'viewport-tablet');

    if (mode === 'mobile') {
        vpMobileBtn.classList.add('active');
        frameCenteringBox.classList.add('viewport-mobile');
    } else if (mode === 'tablet') {
        vpTabletBtn.classList.add('active');
        frameCenteringBox.classList.add('viewport-tablet');
    } else {
        vpFullBtn.classList.add('active');
    }
}

vpFullBtn.addEventListener('click', () => setViewportMode('full'));
vpTabletBtn.addEventListener('click', () => setViewportMode('tablet'));
vpMobileBtn.addEventListener('click', () => setViewportMode('mobile'));

reloadPreviewBtn.addEventListener('click', () => {
    renderContentIntoFrame(activeModalFilename, activeModalContent);
    showToast('Odświeżono widok ramki', 'info');
});

openNewTabPreview.addEventListener('click', () => {
    if (!activeModalContent) {
        showToast('Brak zawartości do wyświetlenia', 'info');
        return;
    }
    const isHtml = activeModalFilename.toLowerCase().endsWith('.html') || activeModalFilename.toLowerCase().endsWith('.htm');
    const content = isHtml ? activeModalContent : `<!DOCTYPE html><html><body style="font-family:monospace; background:#000; color:#f36c00; padding:16px; white-space:pre-wrap;">${escapeHtml(activeModalContent)}</body></html>`;
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
});

editPreviewNowBtn.addEventListener('click', () => {
    activeModalContent = editGistContent.value;
    activeModalFilename = editGistFilename.value.trim() || activeModalFilename;
    renderContentIntoFrame(activeModalFilename, activeModalContent);
    setModalTab('preview');
    showToast('Wczytano roboczy podgląd edytowanego kodu', 'info');
});

modalDeleteBtn.addEventListener('click', () => {
    if (!activeGistId) return;
    promptDeleteModal(activeGistId, activeModalFilename, editGistDesc.value);
});

function setModalTab(tab) {
    tabPreviewBtn.classList.remove('active');
    tabCodeBtn.classList.remove('active');
    tabEditBtn.classList.remove('active');
    modalPreviewWrapper.classList.add('hidden');
    modalCodeWrapper.classList.add('hidden');
    modalEditWrapper.classList.add('hidden');

    if (tab === 'preview') {
        tabPreviewBtn.classList.add('active');
        modalPreviewWrapper.classList.remove('hidden');
    } else if (tab === 'code') {
        tabCodeBtn.classList.add('active');
        modalCodeWrapper.classList.remove('hidden');
    } else if (tab === 'edit') {
        tabEditBtn.classList.add('active');
        modalEditWrapper.classList.remove('hidden');
        editGistContent.focus();
    }
}

tabPreviewBtn.addEventListener('click', () => setModalTab('preview'));
tabCodeBtn.addEventListener('click', () => setModalTab('code'));
tabEditBtn.addEventListener('click', () => setModalTab('edit'));

editGistContent.addEventListener('input', () => {
    editCharCounter.textContent = `${editGistContent.value.length} znaków`;
});

editFormatJsonBtn.addEventListener('click', () => {
    try {
        const parsed = JSON.parse(editGistContent.value);
        editGistContent.value = JSON.stringify(parsed, null, 2);
        editCharCounter.textContent = `${editGistContent.value.length} znaków`;
        showToast('JSON został sformatowany.', 'success');
    } catch (e) {
        showToast('Błąd składni JSON: ' + e.message, 'error');
    }
});

editCancelBtn.addEventListener('click', () => {
    setModalTab('preview');
});

async function saveGistEdits() {
    const token = getToken();
    if (!token) {
        showToast('Brak zapisanego tokenu GitHub.', 'error');
        return;
    }

    if (!activeGistId) return;

    const newFilename = editGistFilename.value.trim();
    const newContent = editGistContent.value;
    const newDesc = editGistDesc.value.trim();

    if (!newFilename || !newContent) {
        showToast('Nazwa pliku oraz treść nie mogą być puste.', 'error');
        return;
    }

    saveGistEditBtn.disabled = true;
    saveGistEditBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Zapisywanie...';

    const filePayload = {};
    if (newFilename === originalFilename) {
        filePayload[originalFilename] = { content: newContent };
    } else {
        filePayload[originalFilename] = {
            filename: newFilename,
            content: newContent
        };
    }

    const payload = {
        description: newDesc,
        files: filePayload
    };

    try {
        const response = await fetch(`https://api.github.com/gists/${activeGistId}`, {
            method: 'PATCH',
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${token}`,
                'X-GitHub-Api-Version': '2022-11-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Zmiany zostały pomyślnie zapisane na GitHubie!', 'success');

            activeModalContent = newContent;
            activeModalFilename = newFilename;
            const previousName = originalFilename;
            originalFilename = newFilename;
            viewModalFilename.textContent = newFilename;
            viewModalCode.textContent = newContent;

            renderContentIntoFrame(newFilename, newContent);
            setModalTab('preview');

            await syncUpdateGistInJsonRepo(data, previousName, newFilename, newDesc);
            fetchGists();
        } else {
            showToast(`Błąd zapisu (${response.status}): ${data.message || 'Nieznany błąd'}`, 'error');
        }
    } catch (err) {
        showToast('Błąd połączenia podczas zapisywania: ' + err.message, 'error');
    } finally {
        saveGistEditBtn.disabled = false;
        saveGistEditBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i><span>Zapisz zmiany</span>';
    }
}

saveGistEditBtn.addEventListener('click', saveGistEdits);

closeViewBtn.addEventListener('click', () => {
    viewModal.classList.add('hidden');
    modalPreviewFrame.srcdoc = '';
});

copyViewBtn.addEventListener('click', () => {
    if (activeModalContent) copyToClipboard(activeModalContent);
});

function promptDeleteModal(gistId, filename, desc) {
    pendingDeleteId = gistId;
    pendingDeleteFilename = filename || '';
    pendingDeleteTitle = desc || filename || '';

    document.getElementById('confirm-modal-desc').innerHTML =
        `Czy na pewno chcesz bezpowrotnie usunąć ten Gist?`;

    confirmModalMeta.innerHTML = `
        <div style="color:#fff; font-weight:600; margin-bottom:4px;">
          <i class="fa-regular fa-file" style="color:var(--highlight-color);"></i> ${escapeHtml(filename || 'bez nazwy')}
        </div>
        <div style="color:var(--text-muted); font-size:0.72rem; word-break:break-all;">ID: ${escapeHtml(gistId)}</div>
        <div style="color:var(--highlight-color); font-size:0.72rem; margin-top:4px;">
          <i class="fa-solid fa-arrows-rotate"></i> Wpis zostanie również usunięty z pliku html.json w repozytorium.
        </div>
      `;

    confirmDelIcon.className = 'fa-solid fa-trash-can';
    confirmDelText.textContent = 'Usuń bezpowrotnie';
    confirmOk.disabled = false;
    confirmCancel.disabled = false;

    confirmModal.classList.remove('hidden');
}

function closeDeleteModal() {
    if (confirmOk.disabled) return;
    pendingDeleteId = null;
    pendingDeleteFilename = '';
    pendingDeleteTitle = '';
    confirmModal.classList.add('hidden');
}

confirmCancel.addEventListener('click', closeDeleteModal);
confirmModalCloseX.addEventListener('click', closeDeleteModal);

confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) closeDeleteModal();
});

viewModal.addEventListener('click', (e) => {
    if (e.target === viewModal) {
        viewModal.classList.add('hidden');
        modalPreviewFrame.srcdoc = '';
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!confirmModal.classList.contains('hidden')) {
            closeDeleteModal();
        } else if (!viewModal.classList.contains('hidden')) {
            viewModal.classList.add('hidden');
            modalPreviewFrame.srcdoc = '';
        }
    }
});

confirmOk.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    const filename = pendingDeleteFilename;
    const token = getToken();

    if (!token) {
        showToast('Brak zapisanego tokenu GitHub.', 'error');
        closeDeleteModal();
        return;
    }

    confirmOk.disabled = true;
    confirmCancel.disabled = true;
    confirmDelIcon.className = 'fa-solid fa-spinner fa-spin';
    confirmDelText.textContent = 'Usuwanie z GitHuba...';

    try {
        const response = await fetch(`https://api.github.com/gists/${id}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${token}`,
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (response.status === 204) {
            showToast('Gist został pomyślnie usunięty z GitHuba!', 'success');
            gistsData = gistsData.filter(g => g.id !== id);
            renderGistsList(gistsData);

            if (activeGistId === id) {
                viewModal.classList.add('hidden');
                modalPreviewFrame.srcdoc = '';
            }

            syncDeleteGistFromJsonRepo(id, filename);
            confirmModal.classList.add('hidden');
        } else {
            const errData = await response.json().catch(() => ({}));
            showToast(`Błąd usuwania (${response.status}): ${errData.message || 'Brak uprawnień'}`, 'error');
            confirmOk.disabled = false;
            confirmCancel.disabled = false;
            confirmDelIcon.className = 'fa-solid fa-trash-can';
            confirmDelText.textContent = 'Spróbuj ponownie';
        }
    } catch (err) {
        showToast('Błąd sieci podczas usuwania: ' + err.message, 'error');
        confirmOk.disabled = false;
        confirmCancel.disabled = false;
        confirmDelIcon.className = 'fa-solid fa-trash-can';
        confirmDelText.textContent = 'Spróbuj ponownie';
    } finally {
        pendingDeleteId = null;
        pendingDeleteFilename = '';
        pendingDeleteTitle = '';
    }
});

window.addEventListener('DOMContentLoaded', () => {
    gistFilename.value = PRESETS.html.filename;
    gistDesc.value = PRESETS.html.desc;
    gistContent.value = PRESETS.html.code;
    charCounter.textContent = `${gistContent.value.length} znaków`;
    updateFileMeta();

    checkTokenStatus();
    if (getToken()) fetchGists();
});