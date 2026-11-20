import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import javascript from 'highlight.js/lib/languages/javascript';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';
import plaintext from 'highlight.js/lib/languages/plaintext';
import 'highlight.js/styles/atom-one-dark.css';

import { 
    FaFileDownload, FaBookOpen, FaPlus, 
    FaHashtag, FaChevronLeft, FaChevronRight, FaPaperclip, 
    FaTimes, FaPaperPlane, FaBook, FaFolderOpen,
    FaEdit, FaTrash, FaCog, FaSpinner, FaSearch, FaFont,
    FaAlignLeft, FaAlignRight, FaArrowDown, FaExpand, FaCompress
} from 'react-icons/fa';

import { 
    fetchNotebooks, fetchNoteEntries, createNoteEntry, createNotebook, 
    editNoteEntry, deleteNoteEntry, updateNotebook, deleteNotebook 
} from '../features/notebook/notebookSlice';
import VoiceInputButton from '../components/common/VoiceInputButton';

hljs.registerLanguage('python', python);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('json', json);
hljs.registerLanguage('plaintext', plaintext);
hljs.registerLanguage('plain', plaintext);

if (typeof window !== 'undefined' && !window.hljs) {
    window.hljs = hljs;
}

const SUPPORTED_CODE_LANGUAGES = ['python', 'javascript', 'bash', 'sql', 'json'];
const INDENT_SPACES = '    ';

const stopAllVoiceInputs = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('custom-voice-mic-start', { detail: '__stop_all_voice__' }));
    }
};

const detectCodeLanguage = (code) => {
    if (!code || !code.trim()) return 'plain';
    const trimmed = code.trim();

    if (
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
        try {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed === 'object' && parsed !== null) {
                return 'json';
            }
        } catch (_) {}
    }

    const sqlScore =
        (/\bSELECT\b[\s\S]*?\bFROM\b/i.test(trimmed) ? 5 : 0) +
        (/\b(?:INSERT\s+INTO|UPDATE\s+[\w."`]+\s+SET|DELETE\s+FROM|CREATE\s+(?:TABLE|INDEX|VIEW|DATABASE|OR\s+REPLACE)|ALTER\s+TABLE|DROP\s+(?:TABLE|INDEX|DATABASE))\b/i.test(trimmed) ? 5 : 0) +
        (/\b(?:INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|FULL\s+JOIN|GROUP\s+BY|ORDER\s+BY|PRIMARY\s+KEY|FOREIGN\s+KEY|VALUES\s*\()\b/i.test(trimmed) ? 3 : 0) +
        (/\b(?:WHERE|HAVING|LIMIT|OFFSET|DISTINCT|UNION\s+ALL)\b/i.test(trimmed) ? 1 : 0);

    const bashScore =
        (/^#!\/(?:usr\/bin\/env\s+)?(?:ba|z|da)?sh\b/m.test(trimmed) ? 6 : 0) +
        (/(?:^|\n)\s*(?:sudo|apt|apt-get|systemctl|journalctl|docker|docker-compose|nginx|certbot|chmod|chown|mkdir|rm\s+-|cp\s+|mv\s+|ls\s|cd\s+|grep\s|awk\s|sed\s|curl\s|wget\s|ssh\s|scp\s|ufw\s|npm\s|npx\s|yarn\s|pip3?\s|python3?\s|git\s|export\s+\w+=|echo\s+|cat\s+|tail\s+|psql\s|gunicorn\s|daphne\s)\b/m.test(trimmed) ? 4 : 0) +
        (/(?:\$\{\w+\}|\$\(\s*\w+|&&|\|\s*(?:grep|awk|sed|xargs|head|tail|wc|sort|jq)\b|(?:^|\n)\s*(?:fi|done|esac)\s*$)/m.test(trimmed) ? 3 : 0);

    const pyScore =
        (/(?:^|\n)\s*(?:def|class)\s+\w+.*:\s*(?:#.*)?$/m.test(trimmed) ? 4 : 0) +
        (/(?:^|\n)\s*from\s+[\w.]+\s+import\s+/m.test(trimmed) ? 4 : 0) +
        (/(?:^|\n)\s*import\s+[\w.]+(?:\s+as\s+\w+)?\s*$/m.test(trimmed) ? 3 : 0) +
        (/(?:^|\n)\s*(?:elif|except|finally)\b.*:/m.test(trimmed) ? 3 : 0) +
        (/\b(?:None|True|False|self|__init__|__name__)\b/.test(trimmed) ? 2 : 0) +
        (/(?:^|\n)\s*@\w+/.test(trimmed) ? 2 : 0) +
        (/\bprint\s*\(/.test(trimmed) ? 1 : 0);

    const jsScore =
        (/\b(?:const|let|var)\s+[\w{[\s,]+\s*=/.test(trimmed) ? 3 : 0) +
        (/=>\s*[{(]/.test(trimmed) ? 3 : 0) +
        (/\b(?:function\s+\w*\s*\(|export\s+(?:default\s+)?|import\s+.*\s+from\s+['"])/.test(trimmed) ? 4 : 0) +
        (/\b(?:console\.log|document\.|window\.|useState|useEffect|async\s+function|Promise|JSON\.|===|!==)\b/.test(trimmed) ? 3 : 0) +
        (/;\s*$/m.test(trimmed) ? 1 : 0) +
        (/{\s*$/m.test(trimmed) && /^\s*}/m.test(trimmed) ? 2 : 0);

    const scores = [
        { lang: 'sql', score: sqlScore },
        { lang: 'bash', score: bashScore },
        { lang: 'python', score: pyScore },
        { lang: 'javascript', score: jsScore }
    ].sort((a, b) => b.score - a.score);

    if (scores[0].score >= 2 && scores[0].score > scores[1].score) {
        return scores[0].lang;
    }

    try {
        const auto = hljs.highlightAuto(trimmed, SUPPORTED_CODE_LANGUAGES);
        if (auto.language && auto.relevance >= 4) {
            return auto.language;
        }
    } catch {
        return 'plain';
    }
    return 'plain';
};

const getCustomScrollbarStyle = (isDark) => `
  .notebook-scrollbar::-webkit-scrollbar {
      width: 4px;
      height: 4px;
  }
  .notebook-scrollbar::-webkit-scrollbar-track {
      background-color: transparent;
  }
  .notebook-scrollbar::-webkit-scrollbar-thumb {
      background-color: ${isDark ? '#374151' : '#D1D5DB'};
      border-radius: 10px;
  }
  .notebook-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: ${isDark ? '#4B5563' : '#9CA3AF'};
  }
  
  .quill-dark .ql-toolbar {
      background-color: #1F2937;
      border-color: #374151;
  }
  .quill-dark .ql-toolbar .ql-stroke { stroke: #9CA3AF; }
  .quill-dark .ql-toolbar .ql-fill { fill: #9CA3AF; }
  .quill-dark .ql-toolbar .ql-picker { color: #D1D5DB; }
  .quill-dark .ql-picker-options { 
      background-color: #111827 !important; 
      border-color: #374151 !important; 
      z-index: 50 !important;
  }
  .quill-dark .ql-picker-item { color: #E5E7EB !important; }
  .quill-dark .ql-container {
      border-color: #374151;
      color: #F3F4F6;
  }
  .quill-dark .ql-editor.ql-blank::before { color: #6B7280; }

  .custom-quill-container {
      display: flex;
      flex-direction: column;
      min-height: 0;
      position: relative;
  }
  .custom-quill-container.is-fixed-height {
      height: 100%;
  }
  .custom-quill-container .ql-container {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
      border: none !important;
      position: relative;
      overflow: hidden !important;
  }
  .custom-quill-container .ql-editor {
      flex: 1 1 auto;
      overflow-y: auto;
      overscroll-behavior-y: contain;
      font-size: 0.84rem;
      line-height: 1.55;
      padding: 6px 10px;
      -webkit-overflow-scrolling: touch;
      word-break: normal !important;
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
      hyphens: none !important;
      tab-size: 4 !important;
      -moz-tab-size: 4 !important;
  }
  .custom-quill-container:not(.is-fixed-height) .ql-editor {
      min-height: 34px;
      max-height: 20dvh;
  }
  @media (min-width: 768px) {
      .custom-quill-container .ql-editor {
          font-size: 0.95rem;
          line-height: 1.8;
          padding: 12px 16px;
      }
      .custom-quill-container:not(.is-fixed-height) .ql-editor {
          min-height: 54px;
          max-height: 38dvh;
      }
  }
  
  .custom-quill-container .ql-editor.ql-blank::before {
      max-height: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      pointer-events: none;
      right: 10px;
      left: 10px;
      font-style: normal;
      font-size: 0.76rem;
  }
  @media (min-width: 768px) {
      .custom-quill-container .ql-editor.ql-blank::before {
          right: 16px;
          left: 16px;
          font-size: 0.82rem;
      }
  }

  .custom-quill-container .ql-toolbar {
      border-top: none !important;
      border-left: none !important;
      border-right: none !important;
      border-bottom: 1px solid ${isDark ? '#374151' : '#E5E7EB'} !important;
      flex-shrink: 0;
      z-index: 30;
  }

  .note-rendered-content.ql-editor {
      word-break: normal !important;
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
      hyphens: none !important;
      -webkit-hyphens: none !important;
      white-space: pre-wrap !important;
      line-height: 1.8 !important;
      font-size: 0.83rem !important;
      letter-spacing: 0 !important;
      tab-size: 4 !important;
      -moz-tab-size: 4 !important;
  }
  @media (min-width: 640px) {
      .note-rendered-content.ql-editor {
          font-size: 0.92rem !important;
          line-height: 1.9 !important;
      }
  }
  .note-rendered-content.ql-editor p,
  .note-rendered-content.ql-editor li,
  .note-rendered-content.ql-editor blockquote,
  .note-rendered-content.ql-editor h1,
  .note-rendered-content.ql-editor h2,
  .note-rendered-content.ql-editor h3 {
      margin-bottom: 0.4rem;
      word-break: normal !important;
      overflow-wrap: break-word !important;
  }
  .note-rendered-content.ql-editor p:last-child,
  .note-rendered-content.ql-editor li:last-child,
  .note-rendered-content.ql-editor blockquote:last-child {
      margin-bottom: 0;
  }
  .note-rendered-content.ql-editor a {
      word-break: break-all !important;
      overflow-wrap: anywhere !important;
      color: #3B82F6;
      text-decoration: underline;
  }

  .ql-editor p,
  .ql-editor h1,
  .ql-editor h2,
  .ql-editor h3,
  .ql-editor li,
  .ql-editor blockquote {
      unicode-bidi: plaintext !important;
      text-align: start !important;
  }

  .ql-editor .ql-align-left,
  .force-ltr .ql-editor,
  .force-ltr .ql-editor p,
  .force-ltr .ql-editor h1,
  .force-ltr .ql-editor h2,
  .force-ltr .ql-editor h3,
  .force-ltr .ql-editor li,
  .force-ltr .ql-editor blockquote {
      direction: ltr !important;
      text-align: left !important;
  }
  .ql-editor .ql-align-right,
  .force-rtl .ql-editor p,
  .force-rtl .ql-editor h1,
  .force-rtl .ql-editor h2,
  .force-rtl .ql-editor h3,
  .force-rtl .ql-editor li,
  .force-rtl .ql-editor blockquote {
      direction: rtl !important;
      text-align: right !important;
  }
  .ql-editor .ql-align-center {
      text-align: center !important;
  }
  .ql-editor .ql-align-justify {
      text-align: justify !important;
  }

  .ql-code-block-container,
  .ql-editor .ql-code-block-container {
      position: relative !important;
      direction: ltr !important;
      text-align: left !important;
      unicode-bidi: isolate !important;
      background-color: ${isDark ? '#0F172A' : '#1E293B'} !important;
      color: #E2E8F0 !important;
      border: 1px solid #334155 !important;
      border-radius: 10px !important;
      padding: 32px 10px 8px 10px !important;
      margin: 5px 0 !important;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
      font-size: 0.74rem !important;
      line-height: 1.55 !important;
      overflow-x: auto !important;
      max-width: 100% !important;
      white-space: pre !important;
      word-break: normal !important;
      overflow-wrap: normal !important;
      tab-size: 4 !important;
      -moz-tab-size: 4 !important;
  }
  @media (min-width: 768px) {
      .ql-code-block-container,
      .ql-editor .ql-code-block-container {
          padding: 34px 12px 10px 12px !important;
          margin: 6px 0 !important;
          font-size: 0.8rem !important;
          line-height: 1.6 !important;
      }
  }

  .ql-editor .ql-code-block-container .ql-ui {
      position: absolute !important;
      top: 5px !important;
      right: 8px !important;
      left: auto !important;
      background-color: #1E293B !important;
      color: #E2E8F0 !important;
      border: 1px solid #475569 !important;
      border-radius: 6px !important;
      font-size: 11px !important;
      font-family: ui-sans-serif, system-ui, sans-serif !important;
      padding: 2px 6px !important;
      cursor: pointer !important;
      outline: none !important;
      z-index: 5 !important;
      direction: ltr !important;
  }

  .note-rendered-content.ql-editor .ql-code-block-container {
      position: relative !important;
      padding: 10px 11px !important;
      overflow: hidden !important;
  }
  @media (min-width: 768px) {
      .note-rendered-content.ql-editor .ql-code-block-container {
          padding: 12px 14px !important;
      }
  }

  .note-rendered-content.ql-editor .ql-code-block-container[data-language]:not([data-language=""]):not([data-language="plain"]) {
      padding-top: 28px !important;
  }
  @media (min-width: 768px) {
      .note-rendered-content.ql-editor .ql-code-block-container[data-language]:not([data-language=""]):not([data-language="plain"]) {
          padding-top: 32px !important;
      }
  }

  .note-rendered-content.ql-editor .ql-code-block-container[data-language]:not([data-language=""]):not([data-language="plain"])::before {
      content: attr(data-language);
      position: absolute;
      top: 6px;
      right: 8px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94A3B8;
      background-color: rgba(148, 163, 184, 0.12);
      border: 1px solid rgba(148, 163, 184, 0.22);
      padding: 1px 6px;
      border-radius: 5px;
      pointer-events: none;
      user-select: none;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  .note-rendered-content.ql-editor .ql-ui {
      display: none !important;
  }

  .ql-code-block,
  .ql-editor .ql-code-block,
  .ql-editor .ql-code-block.ql-direction-rtl,
  .ql-editor .ql-code-block.ql-align-right,
  .ql-editor .ql-code-block.ql-align-center,
  .ql-editor .ql-code-block.ql-align-justify {
      direction: ltr !important;
      text-align: left !important;
      unicode-bidi: isolate !important;
      white-space: pre !important;
      word-break: normal !important;
      overflow-wrap: normal !important;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
      color: #E2E8F0 !important;
      tab-size: 4 !important;
      -moz-tab-size: 4 !important;
      min-height: 1.35em;
  }

  .note-rendered-content.ql-editor .hljs-code-display {
      display: block !important;
      background: transparent !important;
      padding: 0 !important;
      margin: 0 !important;
      color: #E2E8F0 !important;
      direction: ltr !important;
      text-align: left !important;
      unicode-bidi: isolate !important;
      white-space: pre !important;
      overflow-x: auto !important;
      word-break: normal !important;
      overflow-wrap: normal !important;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
      font-size: inherit !important;
      line-height: inherit !important;
      tab-size: 4 !important;
      -moz-tab-size: 4 !important;
  }

  .ql-editor pre.ql-syntax,
  .ql-editor pre,
  .note-rendered-content.ql-editor pre.ql-syntax,
  .note-rendered-content.ql-editor pre,
  .ql-editor pre.ql-direction-rtl,
  .ql-editor pre.ql-align-right,
  .note-rendered-content.ql-editor pre.ql-direction-rtl,
  .note-rendered-content.ql-editor pre.ql-align-right {
      position: relative !important;
      direction: ltr !important;
      text-align: left !important;
      unicode-bidi: isolate !important;
      background-color: ${isDark ? '#0F172A' : '#1E293B'} !important;
      color: #E2E8F0 !important;
      border: 1px solid #334155 !important;
      border-radius: 10px !important;
      padding: 10px 11px !important;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
      font-size: 0.74rem !important;
      line-height: 1.55 !important;
      overflow-x: auto !important;
      max-width: 100% !important;
      white-space: pre !important;
      word-break: normal !important;
      overflow-wrap: normal !important;
      tab-size: 4 !important;
      -moz-tab-size: 4 !important;
  }
  @media (min-width: 768px) {
      .ql-editor pre.ql-syntax,
      .ql-editor pre,
      .note-rendered-content.ql-editor pre.ql-syntax,
      .note-rendered-content.ql-editor pre {
          padding: 12px 14px !important;
          font-size: 0.8rem !important;
          line-height: 1.6 !important;
      }
  }

  .ql-editor code:not(.hljs-code-display),
  .note-rendered-content.ql-editor code:not(.hljs-code-display) {
      direction: ltr !important;
      unicode-bidi: isolate !important;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
      white-space: pre-wrap !important;
  }

  @media (max-width: 768px) {
      .custom-quill-container .ql-toolbar,
      .bubble-quill-editor .ql-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          padding: 3px 5px !important;
          gap: 1px;
      }
      .custom-quill-container .ql-toolbar .ql-formats,
      .bubble-quill-editor .ql-toolbar .ql-formats {
          margin-right: 2px !important;
          margin-bottom: 1px !important;
          display: inline-flex !important;
          align-items: center;
      }
      .custom-quill-container .ql-toolbar button,
      .bubble-quill-editor .ql-toolbar button {
          width: 24px !important;
          height: 24px !important;
          padding: 2px !important;
      }
      .custom-quill-container .ql-toolbar .ql-picker-label {
          padding-left: 3px !important;
          padding-right: 2px !important;
          font-size: 10px !important;
      }
  }

  .hide-quill-toolbar .ql-toolbar {
      display: none !important;
  }
`;

const quillModules = {
    syntax: {
        hljs,
        languages: [
            { key: 'plain', label: 'Plain' },
            { key: 'python', label: 'Python' },
            { key: 'javascript', label: 'JavaScript' },
            { key: 'bash', label: 'Bash' },
            { key: 'sql', label: 'SQL' },
            { key: 'json', label: 'JSON' }
        ]
    },
    toolbar: {
        container: [
            [{ 'header': [1, 2, 3, false] }],
            [{ 'size': ['small', false, 'large'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': ['', 'center', 'right', 'justify'] }],
            [{ 'direction': 'rtl' }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'blockquote', 'code-block'],
            ['clean']
        ],
        handlers: {
            'code-block': function (value) {
                const range = this.quill.getSelection(true);
                if (!range) return;
                if (value) {
                    this.quill.formatLine(range.index, range.length, 'direction', false, 'user');
                    this.quill.formatLine(range.index, range.length, 'align', false, 'user');
                    const selectedText = range.length > 0 ? this.quill.getText(range.index, range.length) : '';
                    const lang = selectedText.trim() ? detectCodeLanguage(selectedText) : 'plain';
                    this.quill.formatLine(range.index, range.length, 'code-block', lang, 'user');
                } else {
                    this.quill.formatLine(range.index, range.length, 'code-block', false, 'user');
                }
            }
        }
    },
    clipboard: {
        matchers: [
            ['.ql-ui', (node, delta) => {
                const Delta = delta.constructor;
                return new Delta();
            }],
            ['.ql-code-block', (node, delta) => {
                const Delta = delta.constructor;
                const text = (node.textContent || '').replace(/\u00A0/g, ' ');
                const lang = node.getAttribute('data-language') || 'plain';
                return new Delta().insert(text).insert('\n', { 'code-block': lang });
            }],
            ['PRE', (node, delta) => {
                const Delta = delta.constructor;
                const raw = (node.textContent || '').replace(/\r\n?/g, '\n').replace(/\u00A0/g, ' ');
                const lines = raw.split('\n');
                if (lines.length > 1 && lines[lines.length - 1] === '') {
                    lines.pop();
                }
                const lang = detectCodeLanguage(raw);
                const result = new Delta();
                lines.forEach((line) => {
                    result.insert(line).insert('\n', { 'code-block': lang });
                });
                return result;
            }]
        ]
    }
};

const isBlockCodeHtml = (html) => {
    if (!html || typeof DOMParser === 'undefined') return false;
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const getMeaningfulNodes = (parent) =>
            Array.from(parent.childNodes).filter(
                (n) => !(n.nodeType === Node.TEXT_NODE && !n.textContent.trim())
            );

        let nodes = getMeaningfulNodes(doc.body);
        while (
            nodes.length === 1 &&
            nodes[0].nodeType === Node.ELEMENT_NODE &&
            nodes[0].tagName.toUpperCase() === 'DIV' &&
            !nodes[0].classList.contains('ql-code-block-container') &&
            !nodes[0].classList.contains('ql-code-block')
        ) {
            const inner = getMeaningfulNodes(nodes[0]);
            if (inner.length === 0) break;
            nodes = inner;
        }

        if (nodes.length === 0) return false;
        return nodes.every((n) => {
            if (n.nodeType !== Node.ELEMENT_NODE) return false;
            const tag = n.tagName.toUpperCase();
            return (
                tag === 'PRE' ||
                n.classList.contains('ql-code-block-container') ||
                n.classList.contains('ql-code-block')
            );
        });
    } catch {
        return false;
    }
};

const attachQuillCodeHandlers = (quill) => {
    if (!quill || !quill.root) return () => {};

    const handlePaste = (e) => {
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return;

        const plainText = clipboardData.getData('text/plain');
        if (!plainText) return;

        const htmlText = clipboardData.getData('text/html');
        const types = Array.from(clipboardData.types || []);
        const isFromVSCode = types.includes('vscode-editor-data');

        const range = quill.getSelection(true);
        const currentFormat = range ? quill.getFormat(range.index, range.length) : {};
        const inCodeBlock = Boolean(currentFormat['code-block']);

        const normalized = plainText.replace(/\r\n?/g, '\n').replace(/\u00A0/g, ' ');
        const isMultiLineOrIndented = normalized.includes('\n') || /^[ \t]{2,}/m.test(normalized);

        const shouldInsertAsCodeBlock =
            inCodeBlock ||
            (isFromVSCode && isMultiLineOrIndented) ||
            isBlockCodeHtml(htmlText);

        const shouldInsertAsPlainPreservingSpaces =
            !shouldInsertAsCodeBlock &&
            ((!htmlText && isMultiLineOrIndented) || (isFromVSCode && !isMultiLineOrIndented));

        if (!shouldInsertAsCodeBlock && !shouldInsertAsPlainPreservingSpaces) {
            return;
        }

        e.preventDefault();
        e.stopImmediatePropagation();

        const insertIndex = range ? range.index : Math.max(0, quill.getLength() - 1);
        if (range && range.length > 0) {
            quill.deleteText(insertIndex, range.length, 'user');
        }

        if (shouldInsertAsCodeBlock) {
            const existingLang =
                typeof currentFormat['code-block'] === 'string'
                    ? currentFormat['code-block']
                    : null;
            const codeBlockValue =
                existingLang && SUPPORTED_CODE_LANGUAGES.includes(existingLang)
                    ? existingLang
                    : detectCodeLanguage(normalized);

            let prefixNewline = false;
            if (!inCodeBlock && insertIndex > 0) {
                const prevChar = quill.getText(insertIndex - 1, 1);
                if (prevChar && prevChar !== '\n') {
                    prefixNewline = true;
                }
            }

            const textToInsert = prefixNewline ? `\n${normalized}` : normalized;
            quill.insertText(insertIndex, textToInsert, 'user');

            const codeStart = prefixNewline ? insertIndex + 1 : insertIndex;
            const codeLen = normalized.endsWith('\n')
                ? Math.max(0, normalized.length - 1)
                : normalized.length;

            quill.formatLine(codeStart, codeLen, 'direction', false, 'user');
            quill.formatLine(codeStart, codeLen, 'align', false, 'user');
            quill.formatLine(codeStart, codeLen, 'code-block', codeBlockValue, 'user');
            quill.setSelection(insertIndex + textToInsert.length, 0, 'silent');
        } else {
            quill.insertText(insertIndex, normalized, 'user');
            quill.setSelection(insertIndex + normalized.length, 0, 'silent');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key !== 'Tab' || e.ctrlKey || e.metaKey || e.altKey) return;

        const range = quill.getSelection();
        if (!range) return;

        const effectiveLength =
            range.length > 0 && quill.getText(range.index + range.length - 1, 1) === '\n'
                ? range.length - 1
                : range.length;

        const lines = quill.getLines(range.index, effectiveLength);
        if (!lines || lines.length === 0) return;

        const hasCodeBlock = lines.some((line) => {
            const lineIdx = quill.getIndex(line);
            const fmt = quill.getFormat(lineIdx, 0);
            return Boolean(fmt['code-block']);
        });

        if (!hasCodeBlock) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        const firstLineStart = quill.getIndex(lines[0]);

        if (!e.shiftKey) {
            if (range.length === 0) {
                quill.insertText(range.index, INDENT_SPACES, 'user');
                quill.setSelection(range.index + INDENT_SPACES.length, 0, 'silent');
                return;
            }

            if (lines.length === 1) {
                const lineContentLen = Math.max(0, lines[0].length() - 1);
                if (range.index > firstLineStart || range.length < lineContentLen) {
                    quill.deleteText(range.index, range.length, 'user');
                    quill.insertText(range.index, INDENT_SPACES, 'user');
                    quill.setSelection(range.index + INDENT_SPACES.length, 0, 'silent');
                    return;
                }
            }

            for (let i = lines.length - 1; i >= 0; i -= 1) {
                const lineStart = quill.getIndex(lines[i]);
                quill.insertText(lineStart, INDENT_SPACES, 'user');
            }

            if (range.index === firstLineStart) {
                quill.setSelection(
                    firstLineStart,
                    range.length + INDENT_SPACES.length * lines.length,
                    'silent'
                );
            } else {
                quill.setSelection(
                    range.index + INDENT_SPACES.length,
                    range.length + INDENT_SPACES.length * (lines.length - 1),
                    'silent'
                );
            }
            return;
        }

        let firstRemoved = 0;
        let totalRemoved = 0;

        for (let i = lines.length - 1; i >= 0; i -= 1) {
            const lineStart = quill.getIndex(lines[i]);
            const lineContentLen = Math.max(0, lines[i].length() - 1);
            const prefix = quill.getText(lineStart, Math.min(4, lineContentLen));

            let removeCount = 0;
            if (prefix.startsWith('\t')) {
                removeCount = 1;
            } else {
                const spaceMatch = prefix.match(/^ {1,4}/);
                if (spaceMatch) {
                    removeCount = spaceMatch[0].length;
                }
            }

            if (removeCount > 0) {
                quill.deleteText(lineStart, removeCount, 'user');
                totalRemoved += removeCount;
                if (i === 0) {
                    firstRemoved = removeCount;
                }
            }
        }

        if (range.length === 0) {
            const newIndex = Math.max(firstLineStart, range.index - firstRemoved);
            quill.setSelection(newIndex, 0, 'silent');
        } else {
            const startOffset = range.index - firstLineStart;
            const removedBeforeStart = Math.min(firstRemoved, startOffset);
            const newStart = range.index - removedBeforeStart;
            const removedInside = totalRemoved - removedBeforeStart;
            const newLength = Math.max(0, range.length - removedInside);
            quill.setSelection(newStart, newLength, 'silent');
        }
    };

    quill.root.addEventListener('paste', handlePaste, true);
    quill.root.addEventListener('keydown', handleKeyDown, true);
    return () => {
        quill.root.removeEventListener('paste', handlePaste, true);
        quill.root.removeEventListener('keydown', handleKeyDown, true);
    };
};

const highlightCodeToElement = (doc, rawCode, lang) => {
    const codeEl = doc.createElement('code');
    codeEl.setAttribute('dir', 'ltr');

    if (SUPPORTED_CODE_LANGUAGES.includes(lang)) {
        codeEl.className = `hljs hljs-code-display language-${lang}`;
        try {
            const highlighted = hljs.highlight(rawCode, { language: lang, ignoreIllegals: true }).value;
            codeEl.innerHTML = highlighted;
        } catch {
            codeEl.textContent = rawCode;
        }
    } else {
        codeEl.className = 'hljs hljs-code-display';
        codeEl.textContent = rawCode;
    }

    return codeEl;
};

const sanitizeAndNormalizeHtml = (html, { forDisplay = false } = {}) => {
    if (!html) return '';
    const cleaned = forDisplay
        ? DOMPurify.sanitize(html, { ADD_ATTR: ['data-language', 'dir'] })
        : html;

    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
        return cleaned;
    }

    const doc = new DOMParser().parseFromString(cleaned, 'text/html');

    doc.body.querySelectorAll('.ql-ui').forEach((el) => el.remove());

    const codeSelectors = '.ql-code-block-container, .ql-code-block, pre, pre.ql-syntax';
    doc.body.querySelectorAll(codeSelectors).forEach((el) => {
        el.setAttribute('dir', 'ltr');
        el.classList.remove('ql-direction-rtl', 'ql-align-right', 'ql-align-center', 'ql-align-justify');
        if (el.style) {
            el.style.removeProperty('direction');
            el.style.removeProperty('text-align');
        }
    });

    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
        if (node.nodeValue && node.nodeValue.includes('\u00A0')) {
            node.nodeValue = node.nodeValue.replace(/\u00A0/g, ' ');
        }
    }

    if (forDisplay) {
        doc.body.querySelectorAll('.ql-code-block-container').forEach((container) => {
            const blocks = Array.from(container.querySelectorAll('.ql-code-block'));
            if (blocks.length === 0) return;

            const rawLines = blocks.map((b) => (b.textContent || '').replace(/\u00A0/g, ' '));
            const fullCode = rawLines.join('\n');
            const declaredLang = blocks[0].getAttribute('data-language') || '';
            const lang = SUPPORTED_CODE_LANGUAGES.includes(declaredLang)
                ? declaredLang
                : declaredLang === 'plain'
                    ? 'plain'
                    : detectCodeLanguage(fullCode);

            if (SUPPORTED_CODE_LANGUAGES.includes(lang)) {
                container.setAttribute('data-language', lang);
            } else {
                container.removeAttribute('data-language');
            }

            container.innerHTML = '';
            container.appendChild(highlightCodeToElement(doc, fullCode, lang));
        });

        doc.body.querySelectorAll('pre').forEach((preEl) => {
            if (preEl.closest('.ql-code-block-container')) return;
            const fullCode = (preEl.textContent || '').replace(/\u00A0/g, ' ');
            const lang = detectCodeLanguage(fullCode);
            preEl.innerHTML = '';
            preEl.appendChild(highlightCodeToElement(doc, fullCode, lang));
        });
    }

    return doc.body.innerHTML;
};

const QuillVoiceButton = ({ quillRef, size = 'sm', className = '' }) => {
    const isPendingStartRef = useRef(false);
    const sessionRef = useRef(null);

    useEffect(() => {
        const handleMicStart = () => {
            if (!isPendingStartRef.current) {
                sessionRef.current = null;
                return;
            }
            isPendingStartRef.current = false;

            const editor = quillRef.current?.getEditor();
            if (!editor) {
                sessionRef.current = null;
                return;
            }

            const sel = editor.getSelection();
            const maxIdx = Math.max(0, editor.getLength() - 1);
            const startIndex = sel ? Math.min(sel.index, maxIdx) : maxIdx;
            const replaceLength = sel ? Math.min(sel.length, maxIdx - startIndex) : 0;

            let needsSpace = false;
            if (startIndex > 0) {
                const prevChar = editor.getText(startIndex - 1, 1);
                needsSpace = Boolean(prevChar && !/[\s\n]/.test(prevChar));
            }

            sessionRef.current = {
                startIndex,
                replaceLength,
                insertedLength: 0,
                needsSpace
            };
        };

        window.addEventListener('custom-voice-mic-start', handleMicStart);
        return () => {
            window.removeEventListener('custom-voice-mic-start', handleMicStart);
        };
    }, [quillRef]);

    const handleVoiceChange = (spokenText) => {
        const editor = quillRef.current?.getEditor();
        if (!editor) return;

        const cleanText = spokenText || '';
        const maxIdx = Math.max(0, editor.getLength() - 1);

        if (!sessionRef.current) {
            const sel = editor.getSelection();
            const startIndex = sel ? Math.min(sel.index, maxIdx) : maxIdx;
            let needsSpace = false;
            if (startIndex > 0) {
                const prevChar = editor.getText(startIndex - 1, 1);
                needsSpace = Boolean(prevChar && !/[\s\n]/.test(prevChar));
            }
            sessionRef.current = {
                startIndex,
                replaceLength: 0,
                insertedLength: 0,
                needsSpace
            };
        }

        const session = sessionRef.current;
        const safeStart = Math.min(session.startIndex, maxIdx);

        if (session.replaceLength > 0) {
            const safeReplace = Math.min(session.replaceLength, Math.max(0, editor.getLength() - 1 - safeStart));
            if (safeReplace > 0) {
                editor.deleteText(safeStart, safeReplace, 'user');
            }
            session.replaceLength = 0;
        }

        if (session.insertedLength > 0) {
            const safeDelete = Math.min(session.insertedLength, Math.max(0, editor.getLength() - 1 - safeStart));
            if (safeDelete > 0) {
                editor.deleteText(safeStart, safeDelete, 'user');
            }
        }

        const textToInsert = cleanText ? `${session.needsSpace ? ' ' : ''}${cleanText}` : '';
        if (textToInsert.length > 0) {
            editor.insertText(safeStart, textToInsert, 'user');
        }

        session.startIndex = safeStart;
        session.insertedLength = textToInsert.length;
        editor.setSelection(safeStart + textToInsert.length, 0, 'silent');
    };

    return (
        <div
            onMouseDown={(e) => e.preventDefault()}
            onClickCapture={() => {
                isPendingStartRef.current = true;
                setTimeout(() => {
                    isPendingStartRef.current = false;
                }, 0);
            }}
            className="inline-flex items-center scale-[0.88] md:scale-100 origin-center"
        >
            <VoiceInputButton
                value=""
                onChange={handleVoiceChange}
                size={size}
                className={className}
            />
        </div>
    );
};

const NoteBubble = memo(({ entry, isDark, userInfo, isAdmin, isReadingMode, onEdit, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(entry.content || '');
    const [isSaving, setIsSaving] = useState(false);
    const editQuillRef = useRef(null);

    const isAuthor = userInfo?.id === entry.user;
    const canEditOrDelete = isAuthor || isAdmin;

    const renderedHtml = useMemo(
        () => sanitizeAndNormalizeHtml(entry.content, { forDisplay: true }),
        [entry.content]
    );

    useEffect(() => {
        if (isReadingMode && isEditing) {
            stopAllVoiceInputs();
            setIsEditing(false);
        }
    }, [isReadingMode, isEditing]);

    useEffect(() => {
        if (!isEditing) return;
        const editor = editQuillRef.current?.getEditor();
        if (!editor) return;
        return attachQuillCodeHandlers(editor);
    }, [isEditing]);

    const handleCancelEdit = () => {
        stopAllVoiceInputs();
        setIsEditing(false);
    };

    const handleSaveEdit = () => {
        stopAllVoiceInputs();
        const cleanedContent = sanitizeAndNormalizeHtml(editContent);
        if (cleanedContent !== entry.content) {
            setIsSaving(true);
            onEdit(entry.id, cleanedContent, () => {
                setIsSaving(false);
                setIsEditing(false);
            }).catch(() => setIsSaving(false));
        } else {
            setIsEditing(false);
        }
    };

    return (
        <div className={`w-full flex justify-center group ${
            isReadingMode
                ? 'py-1 px-1 sm:px-3 md:px-6'
                : 'py-1 sm:py-2 px-2 sm:px-4 md:px-8'
        }`}>
            <div className={`w-full shadow-sm border transition-colors overflow-hidden ${
                isReadingMode
                    ? 'max-w-6xl p-2.5 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl'
                    : 'max-w-5xl p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl'
            } ${
                isDark ? 'bg-gray-800/90 border-gray-700/80 shadow-black/20' : 'bg-white border-gray-200/90 shadow-gray-200/50'
            }`}>
                {isEditing ? (
                    <div className="relative z-20 bubble-quill-editor">
                        <div className={`mb-2 rounded-xl overflow-hidden border ${isDark ? 'quill-dark border-gray-600' : 'bg-white border-gray-300'}`}>
                            <ReactQuill 
                                ref={editQuillRef}
                                theme="snow"
                                value={editContent}
                                onChange={setEditContent}
                                modules={quillModules}
                                className="w-full [&_.ql-editor]:min-h-[100px] md:[&_.ql-editor]:min-h-[120px] [&_.ql-editor]:max-h-[45dvh]" 
                            />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <QuillVoiceButton quillRef={editQuillRef} size="sm" />
                            <div className="flex gap-1.5 sm:gap-2 justify-end">
                                <button 
                                    onClick={handleCancelEdit} 
                                    disabled={isSaving} 
                                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                                >
                                    انصراف
                                </button>
                                <button 
                                    onClick={handleSaveEdit} 
                                    disabled={isSaving} 
                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors shadow-sm min-w-[85px] flex items-center justify-center"
                                >
                                    {isSaving ? <FaSpinner className="animate-spin text-sm" /> : 'ذخیره تغییرات'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col w-full min-w-0">
                        {canEditOrDelete && !isReadingMode && (
                            <div className="flex items-center justify-end gap-0.5 sm:gap-1 -mt-1 -ml-1 mb-1 opacity-80 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setEditContent(entry.content || '');
                                        setIsEditing(true);
                                    }} 
                                    className={`p-1 sm:p-1.5 rounded-lg transition-colors active:scale-95 ${
                                        isDark ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700/70' : 'text-gray-400 hover:text-blue-600 hover:bg-gray-100'
                                    }`} 
                                    title="ویرایش یادداشت"
                                >
                                    <FaEdit className="text-[11px] sm:text-[13px]" />
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => onDelete(entry.id)} 
                                    className={`p-1 sm:p-1.5 rounded-lg transition-colors active:scale-95 ${
                                        isDark ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700/70' : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'
                                    }`} 
                                    title="حذف یادداشت"
                                >
                                    <FaTrash className="text-[11px] sm:text-[13px]" />
                                </button>
                            </div>
                        )}

                        <div className="w-full min-w-0">
                            {entry.media && entry.media.length > 0 && (
                                <div className={`${entry.content ? 'mb-2.5 sm:mb-4' : ''} flex flex-wrap gap-2 sm:gap-3`}>
                                    {entry.media.map((file, idx) => (
                                        file.file_type === 'IMAGE' ? (
                                            <img 
                                                key={idx} 
                                                src={file.file} 
                                                alt="media" 
                                                loading="lazy"
                                                className={`rounded-xl max-w-full max-h-60 sm:max-h-80 object-cover border shadow-sm ${isDark ? 'border-gray-700' : 'border-gray-200'}`} 
                                            />
                                        ) : file.file_type === 'VIDEO' ? (
                                            <video 
                                                key={idx} 
                                                controls 
                                                playsInline
                                                className={`rounded-xl max-w-full max-h-60 sm:max-h-80 border shadow-sm ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                                            >
                                                <source src={file.file} type="video/mp4" />
                                            </video>
                                        ) : (
                                            <a 
                                                key={idx} 
                                                href={file.file} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className={`inline-flex items-center gap-2 border px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-colors shadow-sm max-w-full truncate ${
                                                    isDark ? 'bg-gray-700/50 border-gray-600 text-blue-400 hover:bg-gray-700' : 'bg-gray-50 border-gray-300 text-blue-600 hover:bg-gray-100'
                                                }`}
                                            >
                                                <FaFileDownload className="shrink-0" />
                                                <span className="truncate">دانلود فایل ضمیمه</span>
                                            </a>
                                        )
                                    ))}
                                </div>
                            )}

                            {entry.content && (
                                <div className={`ql-snow w-full overflow-x-hidden ${isDark ? 'quill-dark' : ''}`}>
                                    <div 
                                        className={`ql-editor note-rendered-content !p-0 max-w-none [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl ${
                                            isDark ? 'text-gray-200' : 'text-gray-800'
                                        }`} 
                                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

const NotebookScreen = () => {
    const dispatch = useDispatch();
    const { notebooks, currentEntries, loading } = useSelector((state) => state.notebook);
    const mode = useSelector((state) => state.theme?.mode || 'dark');
    
    const { userInfo } = useSelector((state) => state.userLogin);
    const isAdmin = userInfo?.is_admin; 
    
    const isDark = mode === 'dark';

    const [activeNotebook, setActiveNotebook] = useState(null);
    const [inputText, setInputText] = useState('');
    
    const [newNotebookTitle, setNewNotebookTitle] = useState('');
    const [newNotebookType, setNewNotebookType] = useState('PERSONAL');

    const [isEditingNotebook, setIsEditingNotebook] = useState(false);
    const [editNbTitle, setEditNbTitle] = useState('');
    const [editNbType, setEditNbType] = useState('PERSONAL');

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isReadingMode, setIsReadingMode] = useState(false);

    const [isSending, setIsSending] = useState(false);
    const [isCreatingNb, setIsCreatingNb] = useState(false);
    const [isUpdatingNb, setIsUpdatingNb] = useState(false);

    const [selectedFile, setSelectedFile] = useState(null);
    const [showScrollBottom, setShowScrollBottom] = useState(false);

    const fileInputRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const composerContainerRef = useRef(null);
    const quillRef = useRef(null);
    
    const prevEntriesLengthRef = useRef(0);
    const currentNotebookIdRef = useRef(null);

    const [showFormatting, setShowFormatting] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 768;
        }
        return true;
    });
    const [editorDirection, setEditorDirection] = useState('auto');

    const [customInputHeight, setCustomInputHeight] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('notebook_input_height_v3');
            if (saved) {
                const parsed = parseInt(saved, 10);
                if (!isNaN(parsed) && parsed >= 88 && parsed <= 600) {
                    return window.innerWidth < 768 ? Math.min(parsed, 220) : parsed;
                }
            }
        }
        return null;
    });

    const isDraggingRef = useRef(false);
    const startYRef = useRef(0);
    const startHeightRef = useRef(180);

    const scrollToBottom = (behavior = 'smooth') => {
        const el = messagesContainerRef.current;
        if (el) {
            el.scrollTo({ top: el.scrollHeight, behavior });
        }
    };

    const handleMessagesScroll = () => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        setShowScrollBottom(distanceFromBottom > 140);
    };

    useEffect(() => { dispatch(fetchNotebooks()); }, [dispatch]);

    useEffect(() => {
        if (!activeNotebook || isReadingMode) return;
        const editor = quillRef.current?.getEditor();
        if (!editor) return;
        return attachQuillCodeHandlers(editor);
    }, [activeNotebook, isReadingMode]);

    useEffect(() => {
        if (!isReadingMode) return;
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setIsReadingMode(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isReadingMode]);

    useEffect(() => {
        if (notebooks.length > 0) {
            const savedNotebookId = localStorage.getItem('activeNotebookId');
            if (savedNotebookId) {
                const foundNotebook = notebooks.find(nb => String(nb.id) === savedNotebookId);
                if (foundNotebook) {
                    setActiveNotebook(foundNotebook);
                } else {
                    setActiveNotebook(null);
                    localStorage.removeItem('activeNotebookId');
                }
            }
        } else if (!loading && notebooks.length === 0) {
            setActiveNotebook(null);
            localStorage.removeItem('activeNotebookId');
        }
    }, [notebooks, loading]);

    useEffect(() => {
        if (activeNotebook) {
            stopAllVoiceInputs();
            dispatch(fetchNoteEntries(activeNotebook.id));
            setIsEditingNotebook(false);
            setSearchQuery('');
            setIsSearchOpen(false);
            setShowScrollBottom(false);
        }
    }, [activeNotebook, dispatch]);

    useEffect(() => {
        const isNewNotebook = activeNotebook?.id !== currentNotebookIdRef.current;
        const isNewMessageAdded = currentEntries.length > prevEntriesLengthRef.current;

        if ((isNewNotebook || isNewMessageAdded) && !searchQuery) {
            const timer = setTimeout(() => {
                scrollToBottom(isNewNotebook ? 'auto' : 'smooth');
            }, 80);
            prevEntriesLengthRef.current = currentEntries.length;
            currentNotebookIdRef.current = activeNotebook?.id;
            return () => clearTimeout(timer);
        }

        prevEntriesLengthRef.current = currentEntries.length;
        currentNotebookIdRef.current = activeNotebook?.id;
    }, [currentEntries, activeNotebook, searchQuery]);

    const handleToggleReadingMode = () => {
        setIsReadingMode((prev) => {
            const next = !prev;
            if (next) {
                stopAllVoiceInputs();
                setIsEditingNotebook(false);
                setIsSearchOpen(false);
            }
            return next;
        });
    };

    const handleToggleFormatting = () => {
        setShowFormatting((prev) => {
            const nextState = !prev;
            if (customInputHeight !== null && typeof window !== 'undefined' && window.innerWidth < 768) {
                if (nextState && customInputHeight < 170) {
                    setCustomInputHeight(180);
                } else if (!nextState && customInputHeight > 140) {
                    setCustomInputHeight(110);
                }
            }
            return nextState;
        });
    };

    const handleDividerMouseDown = (e) => {
        e.preventDefault();
        isDraggingRef.current = true;
        startYRef.current = e.clientY;
        const currentBoxHeight = composerContainerRef.current?.offsetHeight || customInputHeight || 160;
        startHeightRef.current = currentBoxHeight;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'row-resize';

        const handleMouseMove = (moveEvent) => {
            if (!isDraggingRef.current) return;
            const delta = startYRef.current - moveEvent.clientY;
            const minH = showFormatting ? 150 : 100;
            const maxHeight = Math.min(window.innerHeight * 0.65, 580);
            const newHeight = Math.max(minH, Math.min(startHeightRef.current + delta, maxHeight));
            setCustomInputHeight(newHeight);
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            setCustomInputHeight((curr) => {
                if (curr !== null) {
                    localStorage.setItem('notebook_input_height_v3', String(curr));
                }
                return curr;
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleDividerTouchStart = (e) => {
        if (!e.touches?.[0]) return;
        isDraggingRef.current = true;
        startYRef.current = e.touches[0].clientY;
        const currentBoxHeight = composerContainerRef.current?.offsetHeight || customInputHeight || 110;
        startHeightRef.current = currentBoxHeight;

        const handleTouchMove = (moveEvent) => {
            if (!isDraggingRef.current || !moveEvent.touches?.[0]) return;
            if (moveEvent.cancelable) moveEvent.preventDefault();
            const delta = startYRef.current - moveEvent.touches[0].clientY;
            const minH = showFormatting ? 140 : 88;
            const maxHeight = Math.min(window.innerHeight * 0.48, 360);
            const newHeight = Math.max(minH, Math.min(startHeightRef.current + delta, maxHeight));
            setCustomInputHeight(newHeight);
        };

        const handleTouchEnd = () => {
            isDraggingRef.current = false;
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            setCustomInputHeight((curr) => {
                if (curr !== null) {
                    localStorage.setItem('notebook_input_height_v3', String(curr));
                }
                return curr;
            });
        };

        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
    };

    const handleResetDividerHeight = () => {
        setCustomInputHeight(null);
        localStorage.removeItem('notebook_input_height_v3');
    };

    const toggleDirectionMode = () => {
        const nextMode = editorDirection === 'ltr' ? 'rtl' : 'ltr';
        setEditorDirection(nextMode);
        const editor = quillRef.current?.getEditor();
        if (editor) {
            const range = editor.getSelection();
            const currentFmt = range ? editor.getFormat(range.index, range.length) : {};
            if (!currentFmt['code-block']) {
                editor.format('direction', nextMode === 'rtl' ? 'rtl' : false);
                editor.format('align', nextMode === 'rtl' ? 'right' : 'left');
            }
        }
    };

    const handleSelectNotebook = (nb) => {
        setActiveNotebook(nb);
        localStorage.setItem('activeNotebookId', nb.id);
    };

    const handleBackToList = () => {
        stopAllVoiceInputs();
        setIsReadingMode(false);
        setActiveNotebook(null);
        localStorage.removeItem('activeNotebookId');
    };

    const isInputEmpty = !inputText.replace(/<[^>]*>/g, '').trim() && !selectedFile;

    const submitNote = () => {
        if (isInputEmpty || isSending || !activeNotebook) return;

        stopAllVoiceInputs();
        setIsSending(true);
        const formData = new FormData();
        formData.append('content', sanitizeAndNormalizeHtml(inputText));
        if (selectedFile) formData.append('file', selectedFile);

        dispatch(createNoteEntry({ notebookId: activeNotebook.id, formData })).then((action) => {
            setIsSending(false);
            if (action.meta.requestStatus !== 'fulfilled') {
                alert('خطا در ارسال پیام: ' + (action.payload || 'مسیر یافت نشد.'));
            } else {
                setInputText('');
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setSearchQuery('');
                setIsSearchOpen(false);
            }
        });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        submitNote();
    };

    const handleEditorKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            submitNote();
        }
    };

    const handleCreateNotebook = (e) => {
        e.preventDefault();
        if (!newNotebookTitle.trim()) return;
        
        setIsCreatingNb(true);
        dispatch(createNotebook({ title: newNotebookTitle, notebook_type: newNotebookType })).then((action) => {
            setIsCreatingNb(false);
            if (action.meta.requestStatus !== 'fulfilled') {
                alert('خطا در ساخت دفترچه: ' + (action.payload || 'مسیر یافت نشد.'));
            } else {
                setNewNotebookTitle('');
                setNewNotebookType('PERSONAL'); 
            }
        });
    };

    const handleStartEditNotebook = () => {
        setEditNbTitle(activeNotebook.title);
        setEditNbType(activeNotebook.notebook_type);
        setIsEditingNotebook(true);
        setIsSearchOpen(false);
    };

    const handleSaveNotebookUpdate = () => {
        if (!editNbTitle.trim()) return;
        
        setIsUpdatingNb(true);
        dispatch(updateNotebook({
            notebookId: activeNotebook.id,
            data: { title: editNbTitle, notebook_type: editNbType }
        })).then((action) => {
            setIsUpdatingNb(false);
            if(action.meta.requestStatus === 'fulfilled') {
                setActiveNotebook(action.payload);
                setIsEditingNotebook(false);
            } else {
                alert('خطا در ویرایش دفترچه: مسیر یافت نشد یا دسترسی ندارید.');
            }
        });
    };

    const handleDeleteNotebook = () => {
        if (window.confirm('آیا از حذف این دفترچه و تمام محتویات آن اطمینان دارید؟ این عمل غیرقابل بازگشت است.')) {
            dispatch(deleteNotebook(activeNotebook.id)).then((action) => {
                if (action.meta.requestStatus === 'fulfilled') {
                    handleBackToList();
                } else {
                    alert('خطا در حذف دفترچه: مسیر یافت نشد.');
                }
            });
        }
    };

    const handleEditNote = (entryId, newContent, onSuccess) => {
        return dispatch(editNoteEntry({ entryId, content: newContent })).then((action) => {
            if (action.meta.requestStatus === 'fulfilled') {
                if(onSuccess) onSuccess();
            } else {
                alert('خطا در ویرایش پیام.');
                throw new Error('Edit failed');
            }
        });
    };

    const handleDeleteNote = (entryId) => {
        if (window.confirm('آیا از حذف این یادداشت/بایگانی مطمئن هستید؟')) {
            dispatch(deleteNoteEntry(entryId)).then((action) => {
                if (action.meta.requestStatus !== 'fulfilled') {
                    alert('خطا در حذف پیام: مسیر یافت نشد یا دسترسی ندارید.');
                }
            });
        }
    };

    const stripHTML = (html) => (html || '').replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/gi, ' ');

    const filteredEntries = currentEntries.filter(entry => 
        stripHTML(entry.content).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const canManageNotebook = activeNotebook && (isAdmin || activeNotebook.user === userInfo?.id);

    return (
        <div 
            dir="rtl"
            className={`h-full flex-1 min-h-0 w-full flex flex-col overflow-hidden transition-colors duration-200 ${
                isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'
            }`}
        >
            <style>{getCustomScrollbarStyle(isDark)}</style>
            
            <div className="flex flex-1 min-h-0 w-full overflow-hidden">
                <div className={`${isReadingMode ? 'hidden' : activeNotebook ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col shrink-0 min-h-0 transition-colors duration-200 border-l ${
                    isDark ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                    <div className={`px-3.5 py-2.5 md:p-5 font-black text-sm md:text-lg border-b flex items-center justify-between shrink-0 ${
                        isDark ? 'border-gray-800 text-white' : 'border-gray-100 text-gray-800'
                    }`}>
                        <div className="flex items-center gap-2">
                            <FaBookOpen className="text-blue-500 text-base md:text-xl" />
                            <span>مدیریت دفترچه‌ها</span>
                        </div>
                        <span className={`text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                            {notebooks.length} مورد
                        </span>
                    </div>

                    <form onSubmit={handleCreateNotebook} className={`p-2.5 md:p-3.5 border-b flex flex-col gap-2 shrink-0 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                        {isAdmin && (
                            <div className="flex items-center gap-4 px-1">
                                <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none">
                                    <input type="radio" value="PERSONAL" checked={newNotebookType === 'PERSONAL'} onChange={(e) => setNewNotebookType(e.target.value)} className="accent-blue-500" />
                                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>دفترچه شخصی</span>
                                </label>
                                <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none">
                                    <input type="radio" value="COMPANY" checked={newNotebookType === 'COMPANY'} onChange={(e) => setNewNotebookType(e.target.value)} className="accent-yellow-500" />
                                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>بایگانی شرکتی</span>
                                </label>
                            </div>
                        )}
                        <div className="relative">
                            <input 
                                type="text" 
                                value={newNotebookTitle} 
                                onChange={(e) => setNewNotebookTitle(e.target.value)} 
                                placeholder="نام دفترچه جدید..." 
                                className={`w-full py-2 md:py-2.5 pl-10 pr-3 rounded-xl text-xs font-bold border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                                    isDark ? 'bg-gray-800/80 text-white border-gray-700 placeholder-gray-500' : 'bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400'
                                }`} 
                            />
                            <button 
                                type="submit" 
                                disabled={isCreatingNb} 
                                className={`absolute left-1.5 top-1/2 transform -translate-y-1/2 p-1.5 md:p-2 rounded-lg transition-colors ${
                                    isDark ? 'text-blue-400 hover:text-white hover:bg-blue-600' : 'text-blue-600 hover:text-white hover:bg-blue-500'
                                } ${isCreatingNb ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isCreatingNb ? <FaSpinner className="animate-spin text-xs" /> : <FaPlus className="text-xs" />}
                            </button>
                        </div>
                    </form>

                    <div className="overflow-y-auto overscroll-y-contain touch-pan-y flex-1 min-h-0 p-2 md:p-2.5 space-y-1.5 notebook-scrollbar">
                        {loading && notebooks.length === 0 ? (
                            <p className={`text-center mt-6 font-bold text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>در حال بارگذاری...</p>
                        ) : notebooks.length === 0 ? (
                            <div className={`text-center mt-12 font-bold flex flex-col items-center gap-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                <FaFolderOpen className="text-3xl opacity-40" />
                                <p className="text-xs">دفترچه‌ای وجود ندارد.</p>
                            </div>
                        ) : (
                            notebooks.map(nb => (
                                <button
                                    key={nb.id}
                                    onClick={() => handleSelectNotebook(nb)}
                                    className={`w-full text-right px-3 py-2.5 md:px-3.5 md:py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-between group border relative overflow-hidden active:scale-[0.99] ${
                                        activeNotebook?.id === nb.id
                                            ? isDark 
                                                ? 'bg-blue-900/30 text-blue-400 border-blue-500/40' 
                                                : 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                                            : isDark
                                                ? 'bg-gray-800/40 hover:bg-gray-800 text-gray-300 border-transparent hover:border-gray-700'
                                                : 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent'
                                    }`}
                                >
                                    {nb.notebook_type === 'COMPANY' && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-r-lg"></div>
                                    )}
                                    <div className="flex items-center gap-2 truncate min-w-0 flex-1 ml-2">
                                        <FaHashtag className={`shrink-0 ${activeNotebook?.id === nb.id ? 'text-blue-500' : isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                                        <span className="truncate">{nb.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {nb.notebook_type === 'COMPANY' ? (
                                            <span className="text-[9px] bg-yellow-500/15 text-yellow-600 px-1.5 py-0.5 rounded-md">شرکتی</span>
                                        ) : (
                                            <span className="text-[9px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-md">شخصی</span>
                                        )}
                                        <FaChevronLeft className={`text-[10px] md:hidden ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className={`${!activeNotebook ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative min-w-0 min-h-0 h-full overflow-hidden ${
                    isDark ? 'bg-gray-950' : 'bg-gray-100/50'
                }`}>
                    {activeNotebook ? (
                        <>
                            {!isReadingMode && (
                                <div className={`px-2 py-1 md:px-6 md:py-2.5 border-b flex flex-wrap items-center justify-between gap-1.5 md:gap-2 z-10 shrink-0 min-h-[40px] md:min-h-[54px] transition-colors ${
                                    isDark ? 'bg-gray-900/95 backdrop-blur border-gray-800' : 'bg-white/95 backdrop-blur border-gray-200'
                                }`}>
                                    {isEditingNotebook ? (
                                        <div className="flex flex-wrap items-center justify-between gap-1.5 w-full">
                                            <div className="flex items-center gap-1.5 flex-1 min-w-[160px]">
                                                <input 
                                                    type="text" 
                                                    value={editNbTitle} 
                                                    onChange={e => setEditNbTitle(e.target.value)} 
                                                    placeholder="نام دفترچه..."
                                                    className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-0 ${
                                                        isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                                                    }`} 
                                                />
                                                {isAdmin && (
                                                    <div className={`flex items-center gap-2 px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg md:rounded-xl border shrink-0 ${
                                                        isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-100 border-gray-200'
                                                    }`}>
                                                        <label className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold cursor-pointer">
                                                            <input type="radio" value="PERSONAL" checked={editNbType === 'PERSONAL'} onChange={(e) => setEditNbType(e.target.value)} className="accent-blue-500" />
                                                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>شخصی</span>
                                                        </label>
                                                        <label className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold cursor-pointer">
                                                            <input type="radio" value="COMPANY" checked={editNbType === 'COMPANY'} onChange={(e) => setEditNbType(e.target.value)} className="accent-yellow-500" />
                                                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>شرکتی</span>
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button 
                                                    onClick={handleSaveNotebookUpdate} 
                                                    disabled={isUpdatingNb} 
                                                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 md:px-3.5 md:py-1.5 rounded-lg md:rounded-xl text-[11px] md:text-xs font-bold shadow-sm transition-colors flex items-center justify-center min-w-[54px]"
                                                >
                                                    {isUpdatingNb ? <FaSpinner className="animate-spin" /> : 'ذخیره'}
                                                </button>
                                                <button 
                                                    onClick={() => setIsEditingNotebook(false)} 
                                                    className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[11px] md:text-xs font-bold border transition-colors ${
                                                        isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200'
                                                    }`}
                                                >
                                                    لغو
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`flex items-center gap-1.5 md:gap-2.5 min-w-0 flex-1 ${isSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
                                                <button
                                                    onClick={handleBackToList}
                                                    className={`md:hidden flex items-center justify-center p-1.5 rounded-lg border shrink-0 active:scale-95 transition-transform ${
                                                        isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-800 border-gray-200'
                                                    }`}
                                                    title="بازگشت به لیست دفترچه‌ها"
                                                >
                                                    <FaChevronRight className="text-[11px]" />
                                                </button>

                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <h2 className={`font-black text-xs sm:text-base md:text-xl truncate flex items-center gap-1 ${isDark ? 'text-white' : 'text-gray-800'}`} title={activeNotebook.title}>
                                                        <FaHashtag className="text-blue-500 opacity-80 shrink-0 text-[10px] sm:text-sm md:text-base" />
                                                        <span className="truncate">{activeNotebook.title}</span>
                                                    </h2>
                                                    {activeNotebook.notebook_type === 'COMPANY' ? (
                                                        <span className="bg-yellow-500/15 text-yellow-600 border border-yellow-500/30 text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0">
                                                            شرکتی
                                                        </span>
                                                    ) : (
                                                        <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0">
                                                            شخصی
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={`flex items-center gap-0.5 sm:gap-1.5 ${isSearchOpen ? 'w-full sm:w-auto' : 'shrink-0'}`}>
                                                {isSearchOpen ? (
                                                    <div className={`flex items-center px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border transition-all w-full sm:w-auto ${
                                                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'
                                                    }`}>
                                                        <FaSearch className="text-gray-400 text-[11px] ml-1.5 shrink-0" />
                                                        <input 
                                                            type="text" 
                                                            placeholder="جستجو در یادداشت‌ها..."
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            autoFocus
                                                            className={`bg-transparent border-none focus:outline-none text-xs flex-1 sm:w-44 min-w-0 ${
                                                                isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                                                            }`}
                                                        />
                                                        <button 
                                                            onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} 
                                                            className="text-gray-400 hover:text-red-500 mr-1 p-0.5 shrink-0"
                                                        >
                                                            <FaTimes className="text-[11px]" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={handleToggleReadingMode} 
                                                            className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors ${
                                                                isDark ? 'text-gray-400 hover:text-emerald-400 hover:bg-gray-800' : 'text-gray-500 hover:text-emerald-600 hover:bg-gray-100'
                                                            }`} 
                                                            title="حالت مطالعه تمام‌صفحه"
                                                        >
                                                            <FaExpand className="text-xs md:text-sm" />
                                                        </button>
                                                        <button 
                                                            onClick={() => setIsSearchOpen(true)} 
                                                            className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors ${
                                                                isDark ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-800' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'
                                                            }`} 
                                                            title="جستجو"
                                                        >
                                                            <FaSearch className="text-xs md:text-sm" />
                                                        </button>
                                                    </>
                                                )}

                                                {canManageNotebook && !isSearchOpen && (
                                                    <>
                                                        <button 
                                                            onClick={handleStartEditNotebook} 
                                                            className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors ${
                                                                isDark ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-800' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'
                                                            }`} 
                                                            title="ویرایش نام دفترچه"
                                                        >
                                                            <FaCog className="text-xs md:text-sm" />
                                                        </button>
                                                        <button 
                                                            onClick={handleDeleteNotebook} 
                                                            className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors ${
                                                                isDark ? 'text-gray-400 hover:text-red-400 hover:bg-gray-800' : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
                                                            }`} 
                                                            title="حذف دفترچه"
                                                        >
                                                            <FaTrash className="text-xs md:text-sm" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
                                <div 
                                    ref={messagesContainerRef}
                                    onScroll={handleMessagesScroll}
                                    className={`flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y flex flex-col notebook-scrollbar ${
                                        isReadingMode ? 'py-1 pb-12' : 'py-1'
                                    }`}
                                >
                                    {filteredEntries.length > 0 ? (
                                        filteredEntries.map((entry) => (
                                            <NoteBubble 
                                                key={entry.id} 
                                                entry={entry} 
                                                isDark={isDark} 
                                                userInfo={userInfo}
                                                isAdmin={isAdmin}
                                                isReadingMode={isReadingMode}
                                                onEdit={handleEditNote}
                                                onDelete={handleDeleteNote}
                                            />
                                        ))
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-gray-400 text-xs px-4 text-center">
                                            یادداشتی وجود ندارد یا نتیجه‌ای یافت نشد.
                                        </div>
                                    )}
                                    <div className="h-2 shrink-0" />
                                </div>

                                {isReadingMode && (
                                    <button
                                        type="button"
                                        onClick={handleToggleReadingMode}
                                        className={`absolute bottom-2.5 left-2.5 z-30 px-2.5 py-1.5 rounded-full shadow-lg border backdrop-blur-md flex items-center gap-1.5 text-[11px] font-bold transition-all active:scale-95 ${
                                            isDark
                                                ? 'bg-gray-900/85 border-gray-700 text-gray-200 hover:bg-gray-800'
                                                : 'bg-white/90 border-gray-300 text-gray-800 hover:bg-gray-50'
                                        }`}
                                        title="خروج از حالت مطالعه (Esc)"
                                    >
                                        <FaCompress className="text-[10px]" />
                                        <span>خروج</span>
                                    </button>
                                )}

                                {showScrollBottom && (
                                    <button
                                        type="button"
                                        onClick={() => scrollToBottom('smooth')}
                                        className={`absolute bottom-2 md:bottom-3 left-1/2 -translate-x-1/2 z-20 p-1.5 md:p-2 rounded-full shadow-md border backdrop-blur-md transition-all active:scale-95 ${
                                            isDark
                                                ? 'bg-gray-800/85 border-gray-700 text-gray-200 hover:bg-gray-700'
                                                : 'bg-white/90 border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                        title="رفتن به آخرین یادداشت"
                                    >
                                        <FaArrowDown className="text-[10px] md:text-xs" />
                                    </button>
                                )}
                            </div>

                            {!isReadingMode && (
                                <>
                                    <div
                                        onMouseDown={handleDividerMouseDown}
                                        onTouchStart={handleDividerTouchStart}
                                        onDoubleClick={handleResetDividerHeight}
                                        className={`w-full h-2.5 md:h-3.5 cursor-row-resize touch-none flex items-center justify-center select-none transition-colors border-t border-b shrink-0 z-10 ${
                                            isDark 
                                                ? 'bg-gray-900 hover:bg-blue-900/30 border-gray-800 hover:border-blue-500/40' 
                                                : 'bg-gray-200/70 hover:bg-blue-100 border-gray-300 hover:border-blue-300'
                                        }`}
                                        title="برای تغییر ارتفاع بکشید (دابل‌کلیک برای بازگشت به حالت خودکار)"
                                    >
                                        <div className={`w-8 sm:w-12 h-0.5 md:h-1 rounded-full transition-colors ${
                                            isDark ? 'bg-gray-700' : 'bg-gray-400'
                                        }`} />
                                    </div>

                                    <div 
                                        ref={composerContainerRef}
                                        style={customInputHeight !== null ? { height: `${customInputHeight}px` } : undefined} 
                                        className={`max-h-[38dvh] md:max-h-[60dvh] p-1 sm:p-2 md:p-3.5 shrink-0 transition-colors flex flex-col ${
                                            isDark ? 'bg-gray-950' : 'bg-white'
                                        }`}
                                    >
                                        <div className="max-w-5xl w-full mx-auto flex flex-col flex-1 min-h-0 relative">
                                            {selectedFile && (
                                                <div className={`mb-1 shrink-0 flex items-center gap-1.5 border max-w-full w-max px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold shadow-sm ${
                                                    isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'
                                                }`}>
                                                    <FaPaperclip className="text-blue-500 shrink-0 text-[10px]" />
                                                    <span className="truncate max-w-[160px] sm:max-w-[260px]">{selectedFile.name}</span>
                                                    <button type="button" onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-500 mr-1 shrink-0">
                                                        <FaTimes className="text-[10px]" />
                                                    </button>
                                                </div>
                                            )}

                                            <form 
                                                onSubmit={handleSendMessage} 
                                                className={`flex-1 min-h-0 flex flex-col border rounded-xl md:rounded-2xl shadow-sm overflow-hidden transition-colors ${
                                                    isDark ? 'bg-gray-900 border-gray-800 focus-within:border-blue-500/60' : 'bg-white border-gray-300 focus-within:border-blue-500'
                                                }`}
                                            >
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} 
                                                    className="hidden" 
                                                />

                                                <div 
                                                    onKeyDown={handleEditorKeyDown}
                                                    className={`flex-1 min-h-0 flex flex-col overflow-hidden ${isDark ? 'quill-dark' : ''} ${!showFormatting ? 'hide-quill-toolbar' : ''}`}
                                                >
                                                    <ReactQuill 
                                                        ref={quillRef}
                                                        theme="snow"
                                                        value={inputText}
                                                        onChange={setInputText}
                                                        modules={quillModules}
                                                        placeholder="یادداشت خود را بنویسید..."
                                                        className={`custom-quill-container ${customInputHeight !== null ? 'is-fixed-height' : ''} ${editorDirection === 'ltr' ? 'force-ltr' : editorDirection === 'rtl' ? 'force-rtl' : ''}`}
                                                    />
                                                </div>

                                                <div className={`py-1 px-1.5 sm:p-2 sm:px-3 flex items-center justify-between border-t shrink-0 relative z-20 ${
                                                    isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'
                                                }`}>
                                                    <div className="flex items-center gap-1 sm:gap-2">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => fileInputRef.current.click()} 
                                                            className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors active:scale-95 ${
                                                                isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                                            }`}
                                                            title="پیوست فایل"
                                                        >
                                                            <FaPaperclip className="text-[11px] sm:text-sm" />
                                                        </button>
                                                        
                                                        <button 
                                                            type="button" 
                                                            onClick={handleToggleFormatting} 
                                                            className={`p-1.5 px-2 md:p-2 md:px-2.5 rounded-lg md:rounded-xl transition-colors flex items-center gap-1 text-[10px] sm:text-xs font-bold active:scale-95 ${
                                                                showFormatting 
                                                                    ? 'bg-blue-600/15 text-blue-500 border border-blue-500/30' 
                                                                    : isDark 
                                                                        ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                                                                        : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                                                            }`}
                                                            title={showFormatting ? "پنهان‌سازی نوار ابزار" : "نمایش ابزارهای نگارش"}
                                                        >
                                                            <FaFont className="text-[11px] sm:text-xs" />
                                                            <span className="hidden sm:inline">ابزارها</span>
                                                        </button>

                                                        <button 
                                                            type="button" 
                                                            onClick={toggleDirectionMode} 
                                                            className={`p-1.5 px-2 md:p-2 md:px-2.5 rounded-lg md:rounded-xl transition-colors flex items-center gap-1 text-[10px] sm:text-xs font-bold active:scale-95 ${
                                                                editorDirection === 'ltr' 
                                                                    ? 'bg-emerald-600/15 text-emerald-500 border border-emerald-500/30' 
                                                                    : isDark 
                                                                        ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                                                                        : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                                                            }`}
                                                            title="تغییر جهت چپ‌چین (انگلیسی) / راست‌چین (فارسی)"
                                                        >
                                                            {editorDirection === 'ltr' ? <FaAlignLeft className="text-[10px] sm:text-xs" /> : <FaAlignRight className="text-[10px] sm:text-xs" />}
                                                            <span className="text-[9px] sm:text-xs">{editorDirection === 'ltr' ? 'LTR' : 'RTL'}</span>
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-1 sm:gap-2">
                                                        <QuillVoiceButton quillRef={quillRef} size="sm" />
                                                        <button 
                                                            type="submit" 
                                                            disabled={isInputEmpty || isSending} 
                                                            className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg md:rounded-xl transition-all font-bold text-[11px] sm:text-xs flex items-center gap-1.5 ${
                                                                isInputEmpty || isSending 
                                                                    ? (isDark ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed') 
                                                                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md active:scale-95'
                                                            }`}
                                                        >
                                                            <span>ارسال</span>
                                                            {isSending ? <FaSpinner className="text-[11px] sm:text-xs animate-spin" /> : <FaPaperPlane className="text-[10px] sm:text-xs" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className={`hidden md:flex flex-1 items-center justify-center flex-col gap-4 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
                            <div className={`p-8 rounded-full border-2 border-dashed ${isDark ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-white'}`}>
                                <FaBook className={`text-6xl ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                            </div>
                            <p className={`text-sm font-bold ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>برای شروع، یک دفترچه را از منوی کناری انتخاب کنید</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotebookScreen;