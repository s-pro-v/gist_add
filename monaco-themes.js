/**
 * Monaco Editor Themes Definitions (terminal-dark & terminal-light)
 * Część monaco-kit — nie ładuj osobno, użyj monaco-kit.js
 */

(function () {
    function defineMonacoThemes() {
        if (typeof monaco === "undefined" || !monaco.editor) {
            return false;
        }

        try {
            // -------------------------------------------------------------------------
            // 1. MOTYW CIEMNY (terminal-dark)
            // -------------------------------------------------------------------------
            monaco.editor.defineTheme("terminal-dark", {
                base: "vs-dark",
                inherit: true,
                rules: [
                    // Ogólne
                    { token: "comment", foreground: "4d595f", fontStyle: "bold" },
                    { token: "keyword", foreground: "b267e6", fontStyle: "bold" },
                    { token: "string", foreground: "21fd6b" },
                    { token: "number", foreground: "F39C12" },
                    { token: "identifier", foreground: "00ffd9", fontStyle: "bold" },
                    { token: "type", foreground: "f859b1" },
                    { token: "delimiter", foreground: "aaa8a8ec" },
                    { token: "operator", foreground: "2493fa" },
                    { token: "regexp", foreground: "21fd6b" },

                    // HTML / XML
                    { token: "tag", foreground: "00B2FF", fontStyle: "bold" },
                    { token: "tag.html", foreground: "00B2FF", fontStyle: "bold" },
                    { token: "attribute.name", foreground: "fed404", fontStyle: "bold" },
                    {
                        token: "attribute.name.html",
                        foreground: "fed404",
                        fontStyle: "bold",
                    },
                    { token: "attribute.value", foreground: "37E7AC" },
                    { token: "attribute.value.html", foreground: "37E7AC" },
                    { token: "metatag", foreground: "1ab2f8" },
                    { token: "metatag.content.html", foreground: "c5c5c5" },
                    {
                        token: "entity.other.attribute-name.id.html",
                        foreground: "f64ab4",
                    },
                    { token: "punctuation.definition.tag.html", foreground: "0587c4" },

                    // CSS
                    { token: "tag.css", foreground: "00B2FF", fontStyle: "bold" },
                    { token: "attribute.name.css", foreground: "37E7AC" },
                    { token: "attribute.value.css", foreground: "FED604" },
                    { token: "string.css", foreground: "FED604" },
                    { token: "number.css", foreground: "FED604" },
                    { token: "keyword.css", foreground: "ab54fd", fontStyle: "bold" },
                    { token: "type.css", foreground: "37E7AC" },
                    { token: "comment.css", foreground: "4d595f", fontStyle: "bold" },
                    { token: "variable.css", foreground: "f15a4c" },
                    { token: "variable.predefined.css", foreground: "f15a4c" },
                    {
                        token: "entity.other.attribute-name.class.css",
                        foreground: "c34ef1",
                        fontStyle: "bold",
                    },
                    {
                        token: "entity.other.attribute-name.id.css",
                        foreground: "CC6699",
                        fontStyle: "bold",
                    },
                    { token: "support.type.property-name.css", foreground: "37E7AC" },
                    {
                        token: "constant.other.color.rgb-value.hex.css",
                        foreground: "FED604",
                    },
                    { token: "constant.numeric.css", foreground: "FED604" },
                    { token: "keyword.control.at-rule.media.css", foreground: "ab54fd" },
                    { token: "support.function.misc.css", foreground: "F39C12" },
                    { token: "support.function.calc.css", foreground: "F39C12" },
                    { token: "support.function.gradient.css", foreground: "F39C12" },
                    {
                        token: "entity.other.attribute-name.pseudo-class.css",
                        foreground: "d63384",
                    },

                    // JavaScript / TypeScript
                    { token: "keyword.js", foreground: "b267e6", fontStyle: "bold" },
                    { token: "string.js", foreground: "21fd6b" },
                    { token: "number.js", foreground: "F39C12" },
                    { token: "identifier.js", foreground: "00ffd9", fontStyle: "bold" },
                    { token: "type.js", foreground: "f859b1" },
                    { token: "comment.js", foreground: "4D595F", fontStyle: "bold" },
                    {
                        token: "comment.block.js",
                        foreground: "4D595F",
                        fontStyle: "bold",
                    },
                    { token: "comment.line.js", foreground: "4D595F", fontStyle: "bold" },
                    { token: "variable.js", foreground: "00ffd9", fontStyle: "bold" },
                    {
                        token: "variable.predefined.js",
                        foreground: "00ffd9",
                        fontStyle: "bold",
                    },
                    { token: "variable.parameter.js", foreground: "00ffd9" },
                    { token: "function.js", foreground: "FED604", fontStyle: "bold" },
                    {
                        token: "function.call.js",
                        foreground: "FED604",
                        fontStyle: "bold",
                    },
                    {
                        token: "entity.name.function.js",
                        foreground: "FED604",
                        fontStyle: "bold",
                    },
                    { token: "property.js", foreground: "FED604", fontStyle: "bold" },
                    {
                        token: "variable.other.property.js",
                        foreground: "FED604",
                        fontStyle: "bold",
                    },
                    { token: "operator.js", foreground: "E2E2E2EC" },
                    { token: "regexp.js", foreground: "21fd6b" },
                    { token: "constant.js", foreground: "2493fa", fontStyle: "bold" },
                    { token: "constant.numeric.js", foreground: "F39C12" },
                    {
                        token: "constant.language.js",
                        foreground: "2493fa",
                        fontStyle: "bold",
                    },
                    { token: "constant.language.boolean.true.js", foreground: "46fc55" },
                    { token: "constant.language.boolean.false.js", foreground: "ee1f18" },
                    {
                        token: "constant.language.null.js",
                        foreground: "2493fa",
                        fontStyle: "bold",
                    },
                    {
                        token: "constant.language.undefined.js",
                        foreground: "2493fa",
                        fontStyle: "bold",
                    },
                    {
                        token: "support.function.js",
                        foreground: "FED604",
                        fontStyle: "bold",
                    },
                    {
                        token: "support.class.js",
                        foreground: "f859b1",
                        fontStyle: "bold",
                    },
                    { token: "support.type.js", foreground: "f859b1" },
                    {
                        token: "support.variable.js",
                        foreground: "00ffd9",
                        fontStyle: "bold",
                    },
                    { token: "entity.name.class.js", foreground: "f859b1" },
                    { token: "entity.name.type.js", foreground: "f859b1" },
                    { token: "storage.type.js", foreground: "b267e6", fontStyle: "bold" },
                    {
                        token: "storage.modifier.js",
                        foreground: "b267e6",
                        fontStyle: "bold",
                    },
                    {
                        token: "storage.modifier.async.js",
                        foreground: "2493fa",
                        fontStyle: "bold",
                    },
                    {
                        token: "variable.language.this.js",
                        foreground: "f859b1",
                        fontStyle: "bold",
                    },
                    {
                        token: "meta.function-call.js",
                        foreground: "F39C12",
                        fontStyle: "bold",
                    },
                    {
                        token: "variable.other.object.js",
                        foreground: "F39C12",
                        fontStyle: "bold",
                    },
                    {
                        token: "string.template.js",
                        foreground: "21fd6b",
                        fontStyle: "bold",
                    },
                    { token: "punctuation.definition.string.js", foreground: "21fd6b" },
                    { token: "punctuation.definition.comment.js", foreground: "4D595F" },
                    { token: "meta.object-literal.key.js", foreground: "f15a4c" },
                    {
                        token: "variable.other.readwrite.alias.js",
                        foreground: "FED604",
                        fontStyle: "bold",
                    },
                    { token: "support.type.object.module.js", foreground: "F39C12" },
                ],
                colors: {
                    "editor.background": "#1e1e1e",
                    "editor.foreground": "#e0e0e0",
                    "editorCursor.foreground": "#f36c00",
                    "editor.lineHighlightBackground": "#2e2e2e52",
                    "editorLineNumber.foreground": "#85858560",
                    "editorLineNumber.activeForeground": "#fffffff8",
                    "editor.selectionBackground": "#a0a0a033",
                    "editor.selectionHighlightBackground": "#47474754",
                    "editor.wordHighlightBackground": "#535353",
                    "editor.foldBackground": "#252526",
                    "editorWhitespace.foreground": "#3b3a32",
                    "editorIndentGuide.background": "#97a7c826",
                    "scrollbarSlider.background": "#252526",
                    "scrollbarSlider.hoverBackground": "#2b2b2b",
                    "scrollbarSlider.activeBackground": "#ffffff50",
                    "editorWidget.background": "#252526",
                    "editorWidget.border": "#2a2a2a",
                    "editorSuggestWidget.background": "#252526",
                    "editorSuggestWidget.foreground": "#e0e0e0",
                    "editorSuggestWidget.highlightForeground": "#f36c00",
                    "editorSuggestWidget.selectedBackground": "#2e2e2e",
                    "editorSuggestWidget.border": "#2a2a2a",
                    "editorHoverWidget.background": "#252526",
                    "editorHoverWidget.foreground": "#e0e0e0",
                    "list.activeSelectionBackground": "#2e2e2e",
                    "list.activeSelectionForeground": "#ffffff",
                    "list.focusBackground": "#252526",
                    "list.focusForeground": "#ffffff",
                    "list.hoverBackground": "#2e2e2e",
                    "list.highlightForeground": "#f36c00",
                    "input.background": "#252526",
                    "input.foreground": "#e0e0e0",
                    "input.border": "#2a2a2a",
                    "input.placeholderForeground": "#858585",
                    "dropdown.background": "#252526",
                    "dropdown.foreground": "#e0e0e0",
                    "dropdown.border": "#f36c00",
                    "peekView.border": "#f36c00",
                    "peekViewEditor.background": "#252526",
                    "peekViewResult.background": "#252526",
                    "peekViewTitle.background": "#1e1e1e",
                    "peekViewTitleLabel.foreground": "#f36c00",
                    "button.background": "#f36c00",
                    "button.foreground": "#ffffff",
                    "button.hoverBackground": "#ff8533",
                    "button.border": "#f36c00",
                    "editor.findMatchBorder": "#f36c00",
                    "editorGroupHeader.tabsBackground": "#1e1e1e",
                    "editorGroupHeader.tabsBorder": "#2a2a2a",
                    "tab.activeBackground": "#2e2e2e",
                    "tab.hoverBackground": "#2e2e2e",
                    "tab.inactiveBackground": "#252526",
                    "tab.inactiveForeground": "#e0e0e0",
                    "tab.unfocusedInactiveForeground": "#f36c00",
                    "editorGutter.addedBackground": "#f36c00",
                    "editorGutter.modifiedBackground": "#938464",
                },
            });

            // -------------------------------------------------------------------------
            // 2. MOTYW JASNY (terminal-light)
            // -------------------------------------------------------------------------
            monaco.editor.defineTheme("terminal-light", {
                base: "vs",
                inherit: true,
                rules: [
                    { token: "", foreground: "212529", background: "ffffff" },
                    { token: "comment", foreground: "6c757d", fontStyle: "italic" },
                    { token: "comment.line", foreground: "6c757d", fontStyle: "italic" },
                    { token: "comment.block", foreground: "6c757d", fontStyle: "italic" },
                    { token: "comment.doc", foreground: "6c757d", fontStyle: "italic" },
                    { token: "keyword", foreground: "f36c00", fontStyle: "bold" },
                    { token: "keyword.control", foreground: "f36c00", fontStyle: "bold" },
                    { token: "keyword.operator", foreground: "f36c00" },
                    { token: "keyword.other", foreground: "f36c00", fontStyle: "bold" },
                    { token: "string", foreground: "28a745" },
                    { token: "string.quoted", foreground: "28a745" },
                    { token: "string.template", foreground: "28a745" },
                    { token: "string.regexp", foreground: "28a745" },
                    { token: "number", foreground: "f36c00" },
                    { token: "number.hex", foreground: "f36c00" },
                    { token: "number.binary", foreground: "f36c00" },
                    { token: "number.octal", foreground: "f36c00" },
                    { token: "number.float", foreground: "f36c00" },
                    { token: "type", foreground: "212529" },
                    { token: "type.identifier", foreground: "212529" },
                    { token: "class", foreground: "212529", fontStyle: "bold" },
                    { token: "class.name", foreground: "212529", fontStyle: "bold" },
                    { token: "identifier", foreground: "212529" },
                    { token: "identifier.function", foreground: "212529" },
                    { token: "identifier.variable", foreground: "212529" },
                    { token: "identifier.constant", foreground: "f36c00" },
                    { token: "function", foreground: "212529" },
                    { token: "function.name", foreground: "212529" },
                    { token: "delimiter", foreground: "212529" },
                    { token: "delimiter.bracket", foreground: "212529" },
                    { token: "delimiter.parenthesis", foreground: "212529" },
                    { token: "delimiter.square", foreground: "212529" },
                    { token: "operator", foreground: "f36c00" },
                    { token: "tag", foreground: "f36c00" },
                    { token: "tag.name", foreground: "f36c00" },
                    { token: "tag.attribute", foreground: "212529" },
                    { token: "tag.delimiter", foreground: "212529" },
                    { token: "attribute.name", foreground: "212529" },
                    { token: "attribute.value", foreground: "28a745" },
                    { token: "property", foreground: "212529" },
                    { token: "property.name", foreground: "212529" },
                    { token: "property.value", foreground: "28a745" },
                    { token: "selector", foreground: "f36c00" },
                    { token: "unit", foreground: "f36c00" },
                    { token: "key", foreground: "212529" },
                    { token: "value", foreground: "28a745" },
                    { token: "variable", foreground: "212529" },
                    { token: "variable.predefined", foreground: "f36c00" },
                    { token: "variable.parameter", foreground: "212529" },
                    { token: "constant", foreground: "f36c00" },
                    {
                        token: "constant.language",
                        foreground: "f36c00",
                        fontStyle: "bold",
                    },
                    { token: "constant.numeric", foreground: "f36c00" },
                    { token: "entity.name", foreground: "212529" },
                    { token: "support", foreground: "212529" },
                    { token: "support.function", foreground: "212529" },
                    { token: "support.class", foreground: "212529" },
                    { token: "meta", foreground: "212529" },
                    { token: "invalid", foreground: "ff0000", fontStyle: "bold" },
                    {
                        token: "invalid.deprecated",
                        foreground: "ff0000",
                        fontStyle: "italic",
                    },
                ],
                colors: {
                    "editor.background": "#ffffff",
                    "editor.foreground": "#212529",
                    "editorCursor.foreground": "#f36c00",
                    "editor.lineHighlightBackground": "#f8f9fa",
                    "editorLineNumber.foreground": "#6c757d61",
                    "editorLineNumber.activeForeground": "#6c757d",
                    "editor.selectionBackground": "#c5c5c544",
                    "editor.inactiveSelectionBackground": "#e9ecef",
                    "editor.selectionHighlightBackground": "#f36c0022",
                    "editor.wordHighlightBackground": "#00000000",
                    "editor.findMatchBackground": "#f36c0022",
                    "editorWidget.background": "#f8f9fa",
                    "editorWidget.border": "#dee2e6",
                    "editorSuggestWidget.background": "#f8f9fa",
                    "editorSuggestWidget.border": "#dee2e6",
                    "editorSuggestWidget.selectedBackground": "#eeeeee",
                    "editorSuggestWidget.foreground": "#212529",
                    "editorSuggestWidget.highlightForeground": "#f36c00",
                    "editorHoverWidget.background": "#f8f9fa",
                    "editorHoverWidget.border": "#dee2e6",
                    "editorHoverWidget.foreground": "#212529",
                    "menu.background": "#f8f9fa",
                    "menu.foreground": "#212529",
                    "menu.selectionBackground": "#eeeeee",
                    "menu.selectionForeground": "#f36c00",
                    "menu.separatorBackground": "#dee2e6",
                    "menu.border": "#dee2e6",
                    "input.background": "#ffffff",
                    "input.border": "#dee2e6",
                    "input.foreground": "#212529",
                    "inputOption.activeForeground": "#f36c00",
                    "list.activeSelectionBackground": "#eeeeee",
                    "list.activeSelectionForeground": "#f36c00",
                    "list.dropBackground": "#eeeeee",
                    "list.hoverBackground": "#eeeeee",
                    "list.hoverForeground": "#f36c00",
                    "list.focusBackground": "#eeeeee",
                    "list.focusForeground": "#f36c00",
                    "list.inactiveSelectionBackground": "#eeeeee",
                    "list.inactiveSelectionForeground": "#212529",
                    "quickInputList.focusBackground": "#eeeeee",
                    "quickInputList.focusForeground": "#f36c00",
                    "editorBracketMatch.background": "#f36c0044",
                    "editorBracketMatch.border": "#f36c00",
                    "button.background": "#eeeeee",
                    "button.foreground": "#212529",
                    "button.hoverBackground": "#f36c00",
                    "badge.background": "#eeeeee",
                    "badge.foreground": "#212529",
                    focusBorder: "#f36c00",
                    "editorGutter.background": "#ffffff",
                    "editorGutter.foldingControlForeground": "#6c757d",
                    "scrollbar.shadow": "#00000011",
                    "scrollbarSlider.background": "#dee2e6",
                    "scrollbarSlider.hoverBackground": "#f36c00",
                    "scrollbarSlider.activeBackground": "#f36c00",
                },
            });

            return true;
        } catch (e) {
            console.error("Error defining Monaco themes:", e);
            return false;
        }
    }

    window.defineMonacoThemes = defineMonacoThemes;

    function bootThemes() {
        const deadline = Date.now() + 30000;

        function tick() {
            if (defineMonacoThemes()) return;
            if (Date.now() >= deadline) return;
            setTimeout(tick, 50);
        }

        tick();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootThemes);
    } else {
        bootThemes();
    }
})();

