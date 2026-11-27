class MonacoEditorSettingsElement extends HTMLElement {
  static STORAGE_KEY = "codeEditorSettings";
  static THEME_KEY = "cyber-refactor-theme";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.settings = {
      fontSize: 14,
      fontFamily: '"JetBrains Mono", monospace',
      lineHeight: 0,
      wordWrap: "off",
      minimap: true,
      lineNumbers: "on",
      autoClosingBrackets: "always",
      autoClosingQuotes: "always",
      tabSize: 4,
      insertSpaces: true,
      renderWhitespace: "none",
      renderLineHighlight: "all",
      renderIndentGuides: true,
      cursorStyle: "line",
      cursorBlinking: "blink",
      scrollBeyondLastLine: true,
      smoothScrolling: false,
      mouseWheelZoom: false,
      roundedSelection: false,
      formatOnPaste: false,
      formatOnType: false,
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: "on",
      quickSuggestions: { other: true, comments: false, strings: true },
      quickSuggestionsDelay: 100,
      autoIndent: "full",
      bracketPairColorization: true,
      colorDecorators: true,
      folding: true,
      showFoldingControls: "mouseover",
      matchBrackets: "always",
      occurrencesHighlight: true,
      selectionHighlight: true,
      codeLens: false,
      links: true,
      multiCursorModifier: "alt",
      dragAndDrop: true,
      emptySelectionClipboard: true,
      copyWithSyntaxHighlighting: true,
      cursorSmoothCaretAnimation: false,
      cursorSurroundingLines: 0,
      cursorSurroundingLinesStyle: "default",
      stickyScroll: { enabled: false },
      guides: { bracketPairs: true }
    };

    this._editors = [];
    this.loadSettings();
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.bindDropdowns();
  }

  loadSettings() {
    const saved = localStorage.getItem(MonacoEditorSettingsElement.STORAGE_KEY);
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Błąd parsowania ustawień z LocalStorage:", e);
      }
    }
  }

  updateSetting(key, value) {
    this.settings[key] = value;
    localStorage.setItem(
      MonacoEditorSettingsElement.STORAGE_KEY,
      JSON.stringify(this.settings)
    );
    this.applyEditorOptions();

    this.dispatchEvent(new CustomEvent("settings-changed", {
      bubbles: true,
      composed: true,
      detail: { key, value, settings: { ...this.settings } }
    }));
  }

  open() {
    const overlay = this.shadowRoot.getElementById("settingsOverlay");
    const sidebar = this.shadowRoot.getElementById("settingsSidebar");
    if (overlay && sidebar) {
      overlay.classList.add("active");
      sidebar.classList.add("active");
    }
  }

  close() {
    const overlay = this.shadowRoot.getElementById("settingsOverlay");
    const sidebar = this.shadowRoot.getElementById("settingsSidebar");
    if (overlay && sidebar) {
      overlay.classList.remove("active");
      sidebar.classList.remove("active");
    }
  }

  switchTab(tabId) {
    const tabs = this.shadowRoot.querySelectorAll(".settings-tab");
    const contents = this.shadowRoot.querySelectorAll(".settings-tab-content");

    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabId);
    });

    contents.forEach((content) => {
      content.classList.toggle("active", content.id === `settings-${tabId}`);
    });
  }

  init(...editors) {
    this.loadSettings();
    this._editors = editors.filter(Boolean);
    this.applyEditorOptions();
  }

  setEditors(inputEditor, outputEditor) {
    this._editors = [inputEditor, outputEditor].filter(Boolean);
    this.applyEditorOptions();
  }

  getEditorOptions() {
    const currentTheme = localStorage.getItem(MonacoEditorSettingsElement.THEME_KEY) || "dark";
    const monacoTheme = currentTheme === "dark" ? "terminal-dark" : "terminal-light";

    return {
      fontSize: this.settings.fontSize,
      fontFamily: this.settings.fontFamily,
      lineHeight: this.settings.lineHeight || 0,
      automaticLayout: true,
      wordWrap: this.settings.wordWrap || "off",
      minimap: { enabled: this.settings.minimap },
      lineNumbersMinChars: 2,
      lineDecorationsWidth: 8,
      theme: monacoTheme,
      cursorBlinking: this.settings.cursorBlinking || "blink",
      cursorStyle: this.settings.cursorStyle || "line",
      cursorSmoothCaretAnimation: this.settings.cursorSmoothCaretAnimation || false,
      cursorSurroundingLines: this.settings.cursorSurroundingLines || 0,
      cursorSurroundingLinesStyle: this.settings.cursorSurroundingLinesStyle || "default",
      scrollBeyondLastLine: this.settings.scrollBeyondLastLine !== false,
      roundedSelection: this.settings.roundedSelection || false,
      renderLineHighlight: this.settings.renderLineHighlight || "all",
      renderIndentGuides: this.settings.renderIndentGuides !== false,
      tabSize: this.settings.tabSize || 4,
      insertSpaces: this.settings.insertSpaces !== false,
      renderWhitespace: this.settings.renderWhitespace || "none",
      formatOnPaste: this.settings.formatOnPaste || false,
      formatOnType: this.settings.formatOnType || false,
      autoIndent: this.settings.autoIndent || "full",
      bracketPairColorization: {
        enabled: this.settings.bracketPairColorization !== false
      },
      matchBrackets: this.settings.matchBrackets || "always",
      guides: this.settings.guides || { bracketPairs: true },
      autoClosingBrackets: this.settings.autoClosingBrackets || "always",
      autoClosingQuotes: this.settings.autoClosingQuotes || "always",
      suggestOnTriggerCharacters: this.settings.suggestOnTriggerCharacters !== false,
      acceptSuggestionOnEnter: this.settings.acceptSuggestionOnEnter || "on",
      acceptSuggestionOnCommitCharacter: true,
      quickSuggestions: this.settings.quickSuggestions || {
        other: true,
        comments: false,
        strings: true
      },
      quickSuggestionsDelay: this.settings.quickSuggestionsDelay || 100,
      snippetSuggestions: "top",
      wordBasedSuggestions: "matchingDocuments",
      suggestSelection: "first",
      tabCompletion: "on",
      suggestLocality: "recentFiles",
      parameterHints: { enabled: true, cycle: false },
      occurrencesHighlight: this.settings.occurrencesHighlight !== false,
      selectionHighlight: this.settings.selectionHighlight !== false,
      colorDecorators: this.settings.colorDecorators !== false,
      folding: this.settings.folding !== false,
      showFoldingControls: this.settings.showFoldingControls || "mouseover",
      codeLens: this.settings.codeLens || false,
      links: this.settings.links !== false,
      mouseWheelZoom: this.settings.mouseWheelZoom || false,
      multiCursorModifier: this.settings.multiCursorModifier || "alt",
      dragAndDrop: this.settings.dragAndDrop !== false,
      emptySelectionClipboard: this.settings.emptySelectionClipboard !== false,
      copyWithSyntaxHighlighting: this.settings.copyWithSyntaxHighlighting !== false,
      smoothScrolling: this.settings.smoothScrolling || false,
      stickyScroll: this.settings.stickyScroll || { enabled: false }
    };
  }

  applyEditorOptions() {
    const opts = this.getEditorOptions();
    this._editors.forEach((ed) => {
      if (ed && typeof ed.updateOptions === "function") {
        ed.updateOptions(opts);
      }
    });
  }

  buildSelect(settingKey, options, currentValue) {
    const esc = (v) =>
      String(v)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;");
    const currentOption = options.find((o) => String(o.value) === String(currentValue));
    const currentLabel = currentOption ? currentOption.label : options[0].label;
    const items = options
      .map(
        (o) =>
          `<div class="se-select-item ${String(o.value) === String(currentValue) ? "se-selected" : ""}" data-value="${esc(o.value)}"><span class="se-select-prefix">»</span>${esc(o.label)}</div>`
      )
      .join("");

    return `<div class="btn-bg btn-bg-full btn-bg-dropdown">
        <div class="se-select-wrap" data-setting="${esc(settingKey)}">
            <button type="button" class="se-select-btn">
                <span class="se-select-label">${esc(currentLabel)}</span>
                <span class="se-select-arrow">▼</span>
            </button>
            <div class="se-select-list">${items}</div>
        </div>
    </div>`;
  }

  bindDropdowns() {
    const shadow = this.shadowRoot;
    const closeAll = () => {
      shadow.querySelectorAll(".se-select-list.se-visible").forEach((list) => {
        list.classList.remove("se-visible");
      });
      shadow.querySelectorAll(".se-select-btn.se-open").forEach((btn) => {
        btn.classList.remove("se-open");
      });
      shadow.querySelectorAll(".se-select-wrap.se-select-open").forEach((wrap) => {
        wrap.classList.remove("se-select-open");
      });
    };

    shadow.querySelectorAll(".se-select-wrap").forEach((wrap) => {
      const btn = wrap.querySelector(".se-select-btn");
      const list = wrap.querySelector(".se-select-list");
      const labelEl = wrap.querySelector(".se-select-label");

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isAlreadyOpen = list.classList.contains("se-visible");
        closeAll();

        if (!isAlreadyOpen) {
          list.classList.add("se-visible");
          btn.classList.add("se-open");
          wrap.classList.add("se-select-open");
        }
      });

      wrap.querySelectorAll(".se-select-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          const key = wrap.dataset.setting;
          let v = item.getAttribute("data-value");
          if (v === "true") v = true;
          else if (v === "false") v = false;

          this.updateSetting(key, v);

          const prefix = item.querySelector(".se-select-prefix");
          labelEl.textContent = prefix
            ? item.textContent.replace(prefix.textContent, "").trim()
            : item.textContent.trim();

          wrap.querySelectorAll(".se-select-item").forEach((i) => i.classList.remove("se-selected"));
          item.classList.add("se-selected");
          closeAll();
        });
      });
    });

    shadow.addEventListener("click", (e) => {
      if (!e.composedPath().some((el) => el.classList && el.classList.contains("se-select-wrap"))) {
        closeAll();
      }
    });
  }

  bindEvents() {
    const shadow = this.shadowRoot;

    shadow.getElementById("settingsOverlay").addEventListener("click", () => this.close());
    shadow.getElementById("closeBtn").addEventListener("click", () => this.close());

    shadow.querySelectorAll(".settings-tab").forEach((tab) => {
      tab.addEventListener("click", () => this.switchTab(tab.dataset.tab));
    });

    shadow.querySelectorAll('input[type="checkbox"][data-setting]').forEach((cb) => {
      cb.addEventListener("change", (e) => {
        this.updateSetting(e.target.dataset.setting, e.target.checked);
      });
    });

    shadow.querySelectorAll('input[type="range"][data-setting]').forEach((slider) => {
      slider.addEventListener("input", (e) => {
        const displayUnit = e.target.dataset.unit || "";
        const valueSpan = e.target.closest(".setting-range").querySelector(".setting-value");
        if (valueSpan) {
          valueSpan.textContent = (e.target.dataset.auto && e.target.value === "0") ? "Auto" : e.target.value + displayUnit;
        }
      });

      slider.addEventListener("change", (e) => {
        this.updateSetting(e.target.dataset.setting, parseInt(e.target.value, 10));
      });
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
    <style>
      @import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css");

      :host {
        --shadow-drop: rgba(32, 32, 32, 0.4) 0px 0px 0px 2px, rgba(0, 0, 0, 0.65) 0px 4px 6px -1px, rgba(255, 255, 255, 0.08) 0px 1px 0px inset;
        --shadow-inset: inset 0px 0px 0px 2px rgba(32, 32, 32, 0.4), inset 0px 4px 6px -1px rgba(0, 0, 0, 0.65), inset 0px 1px 0px rgba(255, 255, 255, 0.08);
        --shadow-hover: rgba(32, 32, 32, 0.2) 0px 0px 0px 1px, rgba(0, 0, 0, 0.325) 0px 2px 3px -0.5px, rgba(255, 255, 255, 0.04) 0px 0.5px 0px inset;
        --padding: 0.125rem;
        --gap: 0.125rem;
        --bg-tertiary: #2e2e2e;
        --border-color: #2a2a2a;
        --panel-bg: #2a2a2a;
        --card-bg: #1e1e1e;
        --text-muted: #858585;
        --text-color: #e0e0e0;
        --highlight-color: #f36c00;
        --border-color-hover: #444444;
        --hover-bg: #3c3c3c;
        --bg-color: #121212;
        --bg-secondary: #252526;
        --danger-color: #dc3545;
        --font-family: "JetBrains Mono", monaco, courier, monospace;
        --font-main: var(--font-family);
        --transition-speed: 0.2s;
        --transition-ease: ease;
        --transition-ui: background-color var(--transition-speed) var(--transition-ease),
            color var(--transition-speed) var(--transition-ease),
            border-color var(--transition-speed) var(--transition-ease),
            box-shadow var(--transition-speed) var(--transition-ease);
        --bg-mode: repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255, 255, 255, 0.03) 10px, rgba(255, 255, 255, 0.03) 11px);
        
        display: contents;
      }

      /* Izolacja Zero-Radius w Shadow DOM */
      *, *::before, *::after {
        border-radius: 0 !important;
        box-sizing: border-box;
      }

      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: var(--bg-color); }
      ::-webkit-scrollbar-thumb { background: var(--border-color); border: 1px solid var(--bg-color); }
      ::-webkit-scrollbar-thumb:hover { background: var(--highlight-color); }

      .btn-bg {
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: var(--shadow-inset);
        padding: var(--padding);
        gap: var(--gap);
        position: relative;
        overflow: hidden;
        width: fit-content;
        border: 1px solid var(--border-color);
        margin: 0.125rem;
        background: var(--card-bg);
      }

      .btn-bg.btn-bg-full {
        width: 100%;
        margin: 0.125rem 0;
      }

      .btn-bg.btn-bg-tab {
        flex: 1;
        margin: 0;
        border: none;
        border-right: 1px solid var(--border-color);
      }
      .btn-bg.btn-bg-tab:last-child {
        border-right: none;
      }

      .btn-bg:has(.se-select-wrap),
      .btn-bg.btn-bg-dropdown {
        overflow: visible !important;
      }
      .btn-bg:has(.se-select-open) {
        z-index: 105;
      }

      .setting-label input[type="checkbox"] {
        width: 18px; height: 18px; min-width: 18px;
        cursor: pointer; accent-color: var(--highlight-color);
        border: 1px solid var(--border-color); background-color: var(--panel-bg);
        appearance: none; -webkit-appearance: none; position: relative;
        transition: var(--transition-ui);
        box-shadow: var(--shadow-inset);
        margin: 0;
      }
      .setting-label input[type="checkbox"]:checked {
        background-color: var(--highlight-color); outline-offset: -2px; outline: 1px solid var(--bg-color);
      }
      .setting-label input[type="checkbox"]:checked::after {
        content: "✓"; position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%); color: #000;
        font-size: 0.75rem; font-weight: 900; line-height: 1;
      }

      .setting-item.setting-range { display: flex; flex-direction: column; gap: 4px; }
      .setting-control { display: flex; align-items: center; gap: 10px; width: 100%; }
      .setting-control input[type="range"] {
        flex: 1; height: 12px; background: var(--bg-color); outline: none;
        border: 1px solid var(--border-color); cursor: pointer; -webkit-appearance: none !important;
        margin: 0;
      }
      .setting-control input[type="range"]::-webkit-slider-runnable-track {
        height: 10px; background: var(--border-color-hover); border: 1px solid var(--border-color);
      }
      .setting-control input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none !important; width: 14px; height: 14px;
        background: var(--highlight-color) !important; cursor: pointer;
        border: 2px solid #000 !important; margin-top: -3px;
      }
      .setting-value { color: var(--highlight-color); font-weight: bold; min-width: 50px; text-align: right; font-size: 0.75rem; font-family: var(--font-main); }

      .se-select-wrap { position: relative; width: 100%; z-index: 1; }
      .se-select-wrap.se-select-open { z-index: 110; }
      .se-select-btn {
        background-color: transparent; color: var(--text-color);
        border: 1px solid var(--border-color); padding: 0 0.8rem; cursor: pointer;
        font-size: 0.8rem; font-weight: 600; font-family: var(--font-main);
        text-transform: uppercase; display: flex; justify-content: space-between;
        align-items: center; transition: var(--transition-ui);
        height: 32px; width: 100%; position: relative;
      }
      .se-select-btn:hover { color: var(--highlight-color); background: var(--hover-bg); }
      .se-select-btn .se-select-arrow { font-size: 0.7rem; transition: transform var(--transition-speed); color: var(--text-muted); pointer-events: none; }
      .se-select-btn .se-select-label { pointer-events: none; }
      .se-select-btn.se-open { background: var(--bg-tertiary); }
      .se-select-btn.se-open .se-select-arrow { transform: rotate(180deg); color: var(--highlight-color); }
      
      .se-select-list {
        position: absolute; top: calc(100% + 1px); left: -1px; right: -1px;
        background-color: var(--panel-bg); border: 1px solid var(--border-color);
        z-index: 9999; display: none; box-shadow: var(--shadow-drop); max-height: 200px; overflow-y: auto;
      }
      .se-select-list.se-visible { display: block !important; }
      .se-select-item {
        padding: 0 0.5rem; cursor: pointer; font-size: 0.8rem; font-weight: 600;
        font-family: var(--font-main); color: var(--text-color); border-bottom: 1px solid var(--border-color);
        border-left: 3px solid transparent; display: flex; align-items: center;
        transition: var(--transition-ui); height: 30px; text-transform: uppercase;
      }
      .se-select-item:last-child { border-bottom: none; }
      .se-select-item .se-select-prefix { margin-right: 0.5rem; opacity: 0; color: var(--highlight-color); transition: opacity var(--transition-speed); font-weight: 700; }
      .se-select-item:hover, .se-select-item.se-selected { background-color: var(--hover-bg); color: var(--highlight-color); border-left: 3px solid var(--highlight-color); }
      .se-select-item:hover .se-select-prefix, .se-select-item.se-selected .se-select-prefix { opacity: 1; }

      .settings-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        z-index: 999; opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
        background: rgba(0, 0, 0, 0.6);
      }
      .settings-overlay.active { opacity: 1; pointer-events: auto; }
      .settings-sidebar {
        position: fixed; top: 0; right: 0; width: 620px; max-width: 90%; height: 100vh;
        background: var(--panel-bg); border-left: 2px solid var(--border-color);
        box-shadow: var(--shadow-drop); z-index: 1000; display: flex; flex-direction: column;
        transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.1, 0.9, 0.2, 1); overflow: hidden;
        font-family: var(--font-main); color: var(--text-color);
      }
      .settings-sidebar.active { transform: translateX(0); }
      .settings-sidebar-header {
        background-color: var(--card-bg); border-bottom: 1px solid var(--border-color);
        color: var(--highlight-color); display: flex; justify-content: space-between; align-items: center;
        flex-shrink: 0; padding: 0.4rem 0.8rem; box-shadow: var(--shadow-drop);
        background-image: var(--bg-mode); height: 45px;
      }
      .settings-sidebar-title { font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 0.85rem; }
      
      .settings-sidebar-header .close-settings {
        background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-muted);
        transition: var(--transition-ui); width: 26px; height: 26px;
        display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: var(--shadow-drop);
      }
      .settings-sidebar-header .close-settings:hover { color: var(--danger-color); }
      
      .settings-sidebar-body { 
        flex: 1; 
        overflow-y: auto; 
        overflow-x: hidden; 
        padding: 0; 
        position: relative; 
      }

      .settings-tabs {
        display: flex; flex-wrap: nowrap; gap: 0; position: sticky; top: 0; z-index: 20;
        background: var(--bg-tertiary); border-bottom: 1px solid var(--border-color); box-shadow: var(--shadow-drop);
      }
      .settings-tabs i {
        font-size: 0.9rem; margin-right: 0.3rem; color: var(--highlight-color);
        transition: color var(--transition-speed); vertical-align: middle;
      }
      .settings-tab {
        width: 100%; display: flex; align-items: center; justify-content: center;
        gap: 0.3rem; font-size: 0.65rem; padding: 8px 4px; background: var(--bg-tertiary);
        border: 1px solid var(--border-color); color: var(--text-muted); transition: var(--transition-ui); font-weight: 600;
        text-transform: uppercase; cursor: pointer; font-family: var(--font-main); box-shadow: var(--shadow-drop);
      }
      .settings-tab:hover { color: var(--text-color); background: var(--hover-bg); }
      .settings-tab.active { background: var(--card-bg); color: var(--highlight-color); }
      .settings-tab.active i { color: var(--highlight-color); }

      .settings-tabs-container {
        position: relative; width: 100%; overflow: visible !important;
        background: var(--bg-tertiary); min-height: calc(100% - 40px);
      }
      .settings-tab-content { 
        display: none; padding: 0.125rem; background: var(--bg-tertiary);
        position: relative; overflow: visible !important;
      }
      .settings-tab-content.active { display: block; }

      .setting-item {
        border-bottom: 1px solid var(--border-color); 
        background-color: var(--panel-bg);
        border-left: 1px solid var(--border-color); 
        box-shadow: var(--shadow-drop);
        margin-bottom: 0.125rem; 
        padding: 0.4rem 0.6rem;
        transition: var(--transition-ui);
        position: relative;
        z-index: 1;
      }
      .setting-item:last-child { margin-bottom: 0; }
      .setting-item:has(.se-select-open) { z-index: 1000 !important; }
      .setting-item:hover { border-left-color: var(--highlight-color); background: var(--hover-bg); }
      .setting-item:hover .setting-label { color: var(--highlight-color); }
      
      .setting-label { 
        display: flex; align-items: center; justify-content: space-between;
        cursor: pointer; color: var(--text-color); font-size: 0.75rem; 
        text-transform: uppercase; user-select: none; gap: 8px; width: 100%; 
        font-weight: 600; letter-spacing: 0.05em; transition: var(--transition-ui);
      }
      .setting-label-text { display: flex; align-items: center; gap: 8px; }
      .setting-label i { color: var(--text-muted); transition: color 0.2s ease; }
      .setting-item:hover .setting-label i { color: var(--highlight-color); }

      .settings-sidebar-footer {
        border-top: 1px solid var(--border-color); padding: 10px 15px; flex-shrink: 0;
        background-image: var(--bg-mode); background-color: var(--card-bg);
      }
      .settings-footer-info { display: flex; flex-direction: column; gap: 4px; }
      .settings-footer-item {
        display: flex; align-items: center; gap: 8px; font-size: 0.65rem;
        color: var(--text-muted); font-family: "Share Tech Mono", monospace;
        text-transform: uppercase; letter-spacing: 0.5px;
      }
      .settings-footer-item i { color: var(--highlight-color); font-size: 0.7rem; width: 16px; text-align: center; }
    </style>

    <div id="settingsOverlay" class="settings-overlay"></div>
    <aside id="settingsSidebar" class="settings-sidebar">
      <div class="settings-sidebar-header">
        <span class="settings-sidebar-title"><i class="fas fa-sliders-h"></i> Ustawienia Edytora</span>
        <div class="btn-bg">
            <button type="button" id="closeBtn" class="close-settings"><i class="fas fa-times"></i></button>
        </div>
      </div>
      
      <div class="settings-sidebar-body">
        <div class="settings-tabs">
          <div class="btn-bg btn-bg-tab">
            <button type="button" class="settings-tab active" data-tab="general"><i class="fas fa-cog"></i> GENERAL</button>
          </div>
          <div class="btn-bg btn-bg-tab">
            <button type="button" class="settings-tab" data-tab="cursor"><i class="fas fa-mouse-pointer"></i> CURSOR</button>
          </div>
          <div class="btn-bg btn-bg-tab">
            <button type="button" class="settings-tab" data-tab="formatting"><i class="fas fa-code"></i> FORMAT</button>
          </div>
          <div class="btn-bg btn-bg-tab">
            <button type="button" class="settings-tab" data-tab="display"><i class="fas fa-eye"></i> VIEW</button>
          </div>
          <div class="btn-bg btn-bg-tab">
            <button type="button" class="settings-tab" data-tab="advanced"><i class="fas fa-sliders-h"></i> ADV</button>
          </div>
        </div>

        <div class="settings-tabs-container">
          <!-- GENERAL -->
          <div id="settings-general" class="settings-tab-content active">
            <div class="setting-item setting-range">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-font"></i> Font Size</span><span class="setting-value">${this.settings.fontSize}px</span></label>
              <div class="btn-bg btn-bg-full">
                <div class="setting-control">
                  <input type="range" min="10" max="24" value="${this.settings.fontSize}" data-setting="fontSize" data-unit="px">
                </div>
              </div>
            </div>
            <div class="setting-item setting-range">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-text-height"></i> Line Height</span><span class="setting-value">${this.settings.lineHeight === 0 ? "Auto" : this.settings.lineHeight + "px"}</span></label>
              <div class="btn-bg btn-bg-full">
                <div class="setting-control">
                  <input type="range" min="0" max="50" value="${this.settings.lineHeight || 0}" data-setting="lineHeight" data-unit="px" data-auto="true">
                </div>
              </div>
            </div>
            <div class="setting-item setting-select">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-font"></i> Font Family</span></label>
              ${this.buildSelect(
                "fontFamily",
                [
                  { value: '"JetBrains Mono", monospace', label: "JetBrains Mono" },
                  { value: '"Share Tech Mono", monospace', label: "Share Tech Mono" },
                  { value: '"Courier New", monospace', label: "Courier New" },
                  { value: "monospace", label: "System Monospace" }
                ],
                this.settings.fontFamily
              )}
            </div>
            <div class="setting-item setting-range">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-indent"></i> Tab Size</span><span class="setting-value">${this.settings.tabSize}</span></label>
              <div class="btn-bg btn-bg-full">
                <div class="setting-control">
                  <input type="range" min="2" max="8" value="${this.settings.tabSize}" data-setting="tabSize">
                </div>
              </div>
            </div>
            <div class="setting-item setting-select">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-text-width"></i> Word Wrap</span></label>
              ${this.buildSelect(
                "wordWrap",
                [
                  { value: "on", label: "ON" },
                  { value: "off", label: "OFF" }
                ],
                this.settings.wordWrap
              )}
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-map"></i> Minimap</span>
                <div class="btn-bg"><input type="checkbox" data-setting="minimap" ${this.settings.minimap ? "checked" : ""}></div>
              </label>
            </div>
          </div>

          <!-- CURSOR -->
          <div id="settings-cursor" class="settings-tab-content">
            <div class="setting-item setting-select">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-mouse-pointer"></i> Cursor Style</span></label>
              ${this.buildSelect(
                "cursorStyle",
                [
                  { value: "line", label: "LINE" },
                  { value: "block", label: "BLOCK" },
                  { value: "underline", label: "UNDERLINE" },
                  { value: "line-thin", label: "LINE THIN" },
                  { value: "block-outline", label: "BLOCK OUTLINE" }
                ],
                this.settings.cursorStyle
              )}
            </div>
            <div class="setting-item setting-select">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-circle"></i> Cursor Blinking</span></label>
              ${this.buildSelect(
                "cursorBlinking",
                [
                  { value: "blink", label: "BLINK" },
                  { value: "smooth", label: "SMOOTH" },
                  { value: "phase", label: "PHASE" },
                  { value: "expand", label: "EXPAND" },
                  { value: "solid", label: "SOLID" }
                ],
                this.settings.cursorBlinking
              )}
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-magic"></i> Smooth Caret Animation</span>
                <div class="btn-bg"><input type="checkbox" data-setting="cursorSmoothCaretAnimation" ${this.settings.cursorSmoothCaretAnimation ? "checked" : ""}></div>
              </label>
            </div>
          </div>

          <!-- FORMATTING -->
          <div id="settings-formatting" class="settings-tab-content">
            <div class="setting-item setting-select">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-brackets-curly"></i> Auto Close Brackets</span></label>
              ${this.buildSelect(
                "autoClosingBrackets",
                [
                  { value: "always", label: "ALWAYS" },
                  { value: "languageDefined", label: "LANGUAGE DEFINED" },
                  { value: "beforeWhitespace", label: "BEFORE WHITESPACE" },
                  { value: "never", label: "NEVER" }
                ],
                this.settings.autoClosingBrackets
              )}
            </div>
            <div class="setting-item setting-select">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-quote-right"></i> Auto Close Quotes</span></label>
              ${this.buildSelect(
                "autoClosingQuotes",
                [
                  { value: "always", label: "ALWAYS" },
                  { value: "languageDefined", label: "LANGUAGE DEFINED" },
                  { value: "beforeWhitespace", label: "BEFORE WHITESPACE" },
                  { value: "never", label: "NEVER" }
                ],
                this.settings.autoClosingQuotes
              )}
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-palette"></i> Bracket Pair Colorization</span>
                <div class="btn-bg"><input type="checkbox" data-setting="bracketPairColorization" ${this.settings.bracketPairColorization ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-code-branch"></i> Folding</span>
                <div class="btn-bg"><input type="checkbox" data-setting="folding" ${this.settings.folding ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item setting-select">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-indent"></i> Insert Spaces</span></label>
              ${this.buildSelect(
                "insertSpaces",
                [
                  { value: true, label: "SPACES" },
                  { value: false, label: "TABS" }
                ],
                this.settings.insertSpaces
              )}
            </div>
            <div class="setting-item setting-select">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-align-left"></i> Auto Indent</span></label>
              ${this.buildSelect(
                "autoIndent",
                [
                  { value: "none", label: "NONE" },
                  { value: "keep", label: "KEEP" },
                  { value: "brackets", label: "BRACKETS" },
                  { value: "advanced", label: "ADVANCED" },
                  { value: "full", label: "FULL" }
                ],
                this.settings.autoIndent
              )}
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-paste"></i> Format on Paste</span>
                <div class="btn-bg"><input type="checkbox" data-setting="formatOnPaste" ${this.settings.formatOnPaste ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-keyboard"></i> Format on Type</span>
                <div class="btn-bg"><input type="checkbox" data-setting="formatOnType" ${this.settings.formatOnType ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item setting-select">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-brackets-curly"></i> Match Brackets</span></label>
              ${this.buildSelect(
                "matchBrackets",
                [
                  { value: "always", label: "ALWAYS" },
                  { value: "near", label: "NEAR" },
                  { value: "never", label: "NEVER" }
                ],
                this.settings.matchBrackets
              )}
            </div>
          </div>

          <!-- DISPLAY -->
          <div id="settings-display" class="settings-tab-content">
            <div class="setting-item setting-select">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-eye-slash"></i> Render Whitespace</span></label>
              ${this.buildSelect(
                "renderWhitespace",
                [
                  { value: "none", label: "NONE" },
                  { value: "boundary", label: "BOUNDARY" },
                  { value: "selection", label: "SELECTION" },
                  { value: "trailing", label: "TRAILING" },
                  { value: "all", label: "ALL" }
                ],
                this.settings.renderWhitespace
              )}
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-align-left"></i> Render Indent Guides</span>
                <div class="btn-bg"><input type="checkbox" data-setting="renderIndentGuides" ${this.settings.renderIndentGuides ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-arrows-alt-v"></i> Scroll Beyond Last Line</span>
                <div class="btn-bg"><input type="checkbox" data-setting="scrollBeyondLastLine" ${this.settings.scrollBeyondLastLine ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-search-plus"></i> Mouse Wheel Zoom</span>
                <div class="btn-bg"><input type="checkbox" data-setting="mouseWheelZoom" ${this.settings.mouseWheelZoom ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-highlighter"></i> Occurrences Highlight</span>
                <div class="btn-bg"><input type="checkbox" data-setting="occurrencesHighlight" ${this.settings.occurrencesHighlight ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-marker"></i> Selection Highlight</span>
                <div class="btn-bg"><input type="checkbox" data-setting="selectionHighlight" ${this.settings.selectionHighlight ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item setting-select">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-highlighter"></i> Render Line Highlight</span></label>
              ${this.buildSelect(
                "renderLineHighlight",
                [
                  { value: "none", label: "NONE" },
                  { value: "gutter", label: "GUTTER" },
                  { value: "line", label: "LINE" },
                  { value: "all", label: "ALL" }
                ],
                this.settings.renderLineHighlight
              )}
            </div>
          </div>

          <!-- ADVANCED -->
          <div id="settings-advanced" class="settings-tab-content">
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-palette"></i> Color Decorators</span>
                <div class="btn-bg"><input type="checkbox" data-setting="colorDecorators" ${this.settings.colorDecorators ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-link"></i> Links</span>
                <div class="btn-bg"><input type="checkbox" data-setting="links" ${this.settings.links !== false ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-code"></i> Code Lens</span>
                <div class="btn-bg"><input type="checkbox" data-setting="codeLens" ${this.settings.codeLens ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-mouse"></i> Drag and Drop</span>
                <div class="btn-bg"><input type="checkbox" data-setting="dragAndDrop" ${this.settings.dragAndDrop !== false ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-copy"></i> Empty Selection Clipboard</span>
                <div class="btn-bg"><input type="checkbox" data-setting="emptySelectionClipboard" ${this.settings.emptySelectionClipboard !== false ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-highlighter"></i> Copy with Syntax Highlighting</span>
                <div class="btn-bg"><input type="checkbox" data-setting="copyWithSyntaxHighlighting" ${this.settings.copyWithSyntaxHighlighting !== false ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-sliders-h"></i> Smooth Scrolling</span>
                <div class="btn-bg"><input type="checkbox" data-setting="smoothScrolling" ${this.settings.smoothScrolling ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-circle"></i> Rounded Selection</span>
                <div class="btn-bg"><input type="checkbox" data-setting="roundedSelection" ${this.settings.roundedSelection ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item setting-select">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-mouse-pointer"></i> Multi Cursor Modifier</span></label>
              ${this.buildSelect(
                "multiCursorModifier",
                [
                  { value: "ctrlCmd", label: "CTRL/CMD" },
                  { value: "alt", label: "ALT" }
                ],
                this.settings.multiCursorModifier
              )}
            </div>
            <div class="setting-item setting-select">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-code-branch"></i> Show Folding Controls</span></label>
              ${this.buildSelect(
                "showFoldingControls",
                [
                  { value: "always", label: "ALWAYS" },
                  { value: "mouseover", label: "MOUSEOVER" },
                  { value: "never", label: "NEVER" }
                ],
                this.settings.showFoldingControls
              )}
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-label-text"><i class="fas fa-lightbulb"></i> Suggest on Trigger Characters</span>
                <div class="btn-bg"><input type="checkbox" data-setting="suggestOnTriggerCharacters" ${this.settings.suggestOnTriggerCharacters !== false ? "checked" : ""}></div>
              </label>
            </div>
            <div class="setting-item setting-select">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-keyboard"></i> Accept Suggestion on Enter</span></label>
              ${this.buildSelect(
                "acceptSuggestionOnEnter",
                [
                  { value: "on", label: "ON" },
                  { value: "smart", label: "SMART" },
                  { value: "off", label: "OFF" }
                ],
                this.settings.acceptSuggestionOnEnter
              )}
            </div>
            <div class="setting-item setting-range">
              <label class="setting-label"><span class="setting-label-text"><i class="fas fa-clock"></i> Quick Suggestions Delay</span><span class="setting-value">${this.settings.quickSuggestionsDelay || 100}ms</span></label>
              <div class="btn-bg btn-bg-full">
                <div class="setting-control">
                  <input type="range" min="0" max="1000" step="50" value="${this.settings.quickSuggestionsDelay || 100}" data-setting="quickSuggestionsDelay" data-unit="ms">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-sidebar-footer">
        <div class="settings-footer-info">
          <div class="settings-footer-item">
            <i class="fas fa-code-branch"></i>
            <span>Monaco Engine: v0.52.0</span>
          </div>
          <div class="settings-footer-item">
            <i class="fas fa-save"></i>
            <span>Auto-Save: LocalStorage ON</span>
          </div>
        </div>
      </div>
    </aside>
    `;
  }
}

customElements.define("monaco-editor-settings", MonacoEditorSettingsElement);

// Opcjonalny bridge kompatybilności wstecznej z window.MonacoEditorSettings
window.MonacoEditorSettings = {
  get _el() {
    return document.querySelector("monaco-editor-settings");
  },
  init(...editors) {
    this._el?.init(...editors);
  },
  showSettings() {
    this._el?.open();
  },
  closeSettings() {
    this._el?.close();
  },
  updateSetting(k, v) {
    this._el?.updateSetting(k, v);
  },
  getEditorOptions() {
    return this._el?.getEditorOptions();
  }
};

