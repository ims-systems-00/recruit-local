'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  CompositeDecorator,
  ContentBlock,
  ContentState,
  convertFromRaw,
  convertToRaw,
  DraftDecoratorComponentProps,
  Editor,
  EditorState,
  RawDraftContentState,
  RichUtils,
} from 'draft-js';

import 'draft-js/dist/Draft.css';

import {
  Bold,
  Code,
  Heading,
  Italic,
  Link2Off,
  LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Underline,
  Undo,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

// ============================================================
// TYPES
// ============================================================

export interface DraftEditorProps {
  value?: string | RawDraftContentState | null;

  onChange?: (
    raw: RawDraftContentState,
    json: string,
    editorState: EditorState,
  ) => void;

  placeholder?: string;

  readOnly?: boolean;

  minHeight?: number;

  maxHeight?: number;

  className?: string;

  editorClassName?: string;

  toolbarClassName?: string;

  showToolbar?: boolean;
}

// ============================================================
// CUSTOM INLINE STYLES
// ============================================================

const styleMap = {
  CODE: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 14,
    padding: '2px 4px',
    borderRadius: '4px',
  },
};

// ============================================================
// BLOCK STYLES
// ============================================================

function blockStyleFn(contentBlock: ContentBlock) {
  const type = contentBlock.getType();

  if (type === 'blockquote') {
    return 'border-l-4 border-border pl-4 italic my-2 text-muted-foreground';
  }

  return '';
}

// ============================================================
// LINK DECORATOR
// ============================================================

const findLinkEntities = (
  contentBlock: ContentBlock,
  callback: (start: number, end: number) => void,
  contentState: ContentState,
) => {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();

    return (
      entityKey !== null &&
      contentState.getEntity(entityKey).getType() === 'LINK'
    );
  }, callback);
};

const LinkComponent = (props: DraftDecoratorComponentProps) => {
  const { contentState, entityKey, children } = props;

  const { url } = contentState.getEntity(entityKey!).getData();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline hover:text-blue-800"
    >
      {children}
    </a>
  );
};

// ============================================================
// HELPERS
// ============================================================

function createEditorState(
  value: DraftEditorProps['value'],
  decorator: CompositeDecorator,
) {
  if (!value) {
    return EditorState.createEmpty(decorator);
  }

  try {
    // STRINGIFIED JSON
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);

      return EditorState.createWithContent(convertFromRaw(parsed), decorator);
    }

    // RAW OBJECT
    return EditorState.createWithContent(convertFromRaw(value), decorator);
  } catch {
    return EditorState.createEmpty(decorator);
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function DraftEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  readOnly = false,
  minHeight = 180,
  maxHeight = 300,
  className = '',
  editorClassName = '',
  toolbarClassName = '',
  showToolbar = true,
}: DraftEditorProps) {
  const editorRef = useRef<Editor>(null);

  // ==========================================================
  // DECORATOR
  // ==========================================================

  const decorator = useMemo(
    () =>
      new CompositeDecorator([
        {
          strategy: findLinkEntities,
          component: LinkComponent,
        },
      ]),
    [],
  );

  // ==========================================================
  // STATE
  // ==========================================================

  const [editorState, setEditorState] = useState(() =>
    createEditorState(value, decorator),
  );

  // ==========================================================
  // EXTERNAL VALUE SYNC
  // ==========================================================

  useEffect(() => {
    if (!value) return;

    setEditorState(createEditorState(value, decorator));
  }, [value, decorator]);

  // ==========================================================
  // CHANGE HANDLER
  // ==========================================================

  const handleChange = useCallback(
    (state: EditorState) => {
      setEditorState(state);

      const raw = convertToRaw(state.getCurrentContent());

      const json = JSON.stringify(raw);

      onChange?.(raw, json, state);
    },
    [onChange],
  );

  // ==========================================================
  // COMMANDS
  // ==========================================================

  const handleKeyCommand = useCallback(
    (command: string) => {
      const newState = RichUtils.handleKeyCommand(editorState, command);

      if (newState) {
        handleChange(newState);

        return 'handled';
      }

      return 'not-handled';
    },
    [editorState, handleChange],
  );

  // ==========================================================
  // HELPERS
  // ==========================================================

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const toggleInline = (style: string) => {
    handleChange(RichUtils.toggleInlineStyle(editorState, style));
  };

  const toggleBlock = (block: string) => {
    handleChange(RichUtils.toggleBlockType(editorState, block));
  };

  // ==========================================================
  // LINKS
  // ==========================================================

  const addLink = () => {
    const selection = editorState.getSelection();

    if (selection.isCollapsed()) {
      alert('Please select text first');

      return;
    }

    const url = window.prompt('Enter URL');

    if (!url) return;

    const contentState = editorState.getCurrentContent();

    const contentStateWithEntity = contentState.createEntity(
      'LINK',
      'MUTABLE',
      { url },
    );

    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    const newEditorState = EditorState.set(editorState, {
      currentContent: contentStateWithEntity,
    });

    const linkedState = RichUtils.toggleLink(
      newEditorState,
      newEditorState.getSelection(),
      entityKey,
    );

    handleChange(linkedState);
  };

  const removeLink = () => {
    const selection = editorState.getSelection();

    if (selection.isCollapsed()) return;

    handleChange(RichUtils.toggleLink(editorState, selection, null));
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className={`space-y-4 rounded-lg border bg-white p-4 ${className}`}>
      {/* =================================================== */}
      {/* EDITOR */}
      {/* =================================================== */}

      <div
        onClick={focusEditor}
        className={`cursor-text overflow-y-auto rounded-md border p-4 ${editorClassName}`}
        style={{
          minHeight,
          maxHeight,
        }}
      >
        <Editor
          ref={editorRef}
          editorState={editorState}
          onChange={handleChange}
          handleKeyCommand={handleKeyCommand}
          customStyleMap={styleMap}
          blockStyleFn={blockStyleFn}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      </div>

      {/* =================================================== */}
      {/* TOOLBAR */}
      {/* =================================================== */}

      {showToolbar && !readOnly && (
        <div
          className={`flex flex-wrap items-center gap-3 rounded-md border p-2 ${toolbarClassName}`}
        >
          {/* BOLD */}
          <button type="button" onClick={() => toggleInline('BOLD')}>
            <Bold className="h-4 w-4" />
          </button>

          {/* ITALIC */}
          <button type="button" onClick={() => toggleInline('ITALIC')}>
            <Italic className="h-4 w-4" />
          </button>

          {/* UNDERLINE */}
          <button type="button" onClick={() => toggleInline('UNDERLINE')}>
            <Underline className="h-4 w-4" />
          </button>

          {/* CODE */}
          <button type="button" onClick={() => toggleInline('CODE')}>
            <Code className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-border" />

          {/* ADD LINK */}
          <button type="button" onClick={addLink}>
            <LinkIcon className="h-4 w-4" />
          </button>

          {/* REMOVE LINK */}
          <button type="button" onClick={removeLink}>
            <Link2Off className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-border" />

          {/* HEADINGS */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button">
                <Heading className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              {[
                'header-one',
                'header-two',
                'header-three',
                'header-four',
                'header-five',
                'header-six',
              ].map((item, index) => (
                <DropdownMenuItem key={item} onClick={() => toggleBlock(item)}>
                  H{index + 1}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* UL */}
          <button
            type="button"
            onClick={() => toggleBlock('unordered-list-item')}
          >
            <List className="h-4 w-4" />
          </button>

          {/* OL */}
          <button
            type="button"
            onClick={() => toggleBlock('ordered-list-item')}
          >
            <ListOrdered className="h-4 w-4" />
          </button>

          {/* BLOCKQUOTE */}
          <button type="button" onClick={() => toggleBlock('blockquote')}>
            <Quote className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-border" />

          {/* UNDO */}
          <button
            type="button"
            onClick={() => handleChange(EditorState.undo(editorState))}
          >
            <Undo className="h-4 w-4" />
          </button>

          {/* REDO */}
          <button
            type="button"
            onClick={() => handleChange(EditorState.redo(editorState))}
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
