'use client';

import React, { useRef, useState } from 'react';
import {
  Editor,
  EditorState,
  RichUtils,
  Modifier,
  CompositeDecorator,
  AtomicBlockUtils,
  ContentBlock,
  ContentState,
  DraftDecoratorComponentProps,
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
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

type Align = 'left' | 'center' | 'right';

const styleMap = {
  CODE: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2,
  },
};

function blockStyleFn(contentBlock: ContentBlock) {
  const type = contentBlock.getType();
  if (type === 'blockquote') {
    return ' border-l-[5px] border-border py-1.5 px-3 my-2 italic ';
  }
  return '';
}

// ---------------------------------------------
// LINK DECORATOR
// ---------------------------------------------
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

const Link = (props: DraftDecoratorComponentProps) => {
  const { contentState, entityKey, children } = props;
  const { url } = contentState.getEntity(entityKey || '').getData();

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

// ---------------------------------------------
// MAIN EDITOR
// ---------------------------------------------
export default function DraftEditor() {
  const decorator = new CompositeDecorator([
    { strategy: findLinkEntities, component: Link },
  ]);

  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty(decorator),
  );
  const editorRef = useRef<Editor>(null);

  const focusEditor = () => editorRef.current?.focus();

  const handleKeyCommand = (cmd: string) => {
    const newState = RichUtils.handleKeyCommand(editorState, cmd);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  // INLINE STYLE
  const toggleInline = (style: string) =>
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));

  // BLOCK STYLE
  const toggleBlock = (blockType: string) =>
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));

  // ADD LINK
  const addLink = () => {
    const url = prompt('Enter URL:');
    if (!url) return;

    const content = editorState.getCurrentContent();
    const contentWithEntity = content.createEntity('LINK', 'MUTABLE', { url });
    const entityKey = contentWithEntity.getLastCreatedEntityKey();

    const newState = RichUtils.toggleLink(
      editorState,
      editorState.getSelection(),
      entityKey,
    );

    setEditorState(newState);
  };

  // REMOVE LINK
  const removeLink = () => {
    setEditorState(
      RichUtils.toggleLink(editorState, editorState.getSelection(), null),
    );
  };

  return (
    <div className="space-y-3 w-full border rounded-lg p-3 bg-white">
      {/* EDITOR */}
      <div
        onClick={focusEditor}
        className="cursor-text min-h-40 max-h-[172px] overflow-y-auto"
      >
        <Editor
          ref={editorRef}
          editorState={editorState}
          onChange={setEditorState}
          handleKeyCommand={handleKeyCommand}
          customStyleMap={styleMap}
          placeholder="Write your content here..."
          blockStyleFn={blockStyleFn}
        />
      </div>
      {/* Toolbar */}

      <div className="bg-card flex gap-3 items-center p-1.5 rounded min-h-8 flex-wrap">
        <span onClick={() => toggleInline('BOLD')} className="cursor-pointer">
          <Bold className="w-4 h-4 text-title" />
        </span>
        <span onClick={() => toggleInline('ITALIC')} className="cursor-pointer">
          <Italic className="w-4 h-4 text-title" />
        </span>
        <span
          onClick={() => toggleInline('UNDERLINE')}
          className="cursor-pointer"
        >
          <Underline className="w-[18px] h-[18px] text-title" />
        </span>

        <span className=" w-[0.8px] inline-block h-4 bg-border"></span>

        <span onClick={addLink} className="cursor-pointer">
          <LinkIcon className="w-4 h-4 text-title" />
        </span>

        <span onClick={removeLink} className="cursor-pointer">
          <Link2Off className="w-4 h-4 text-title" />
        </span>

        <span className=" w-[0.8px] inline-block h-4 bg-border"></span>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Heading className="w-4 h-4 text-title" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-0">
            {[
              'header-one',
              'header-two',
              'header-three',
              'header-four',
              'header-five',
              'header-six',
            ].map((h, i) => (
              <DropdownMenuItem
                key={h}
                onClick={() => toggleBlock(h)}
                className=" cursor-pointer text-sm "
              >
                H{i + 1}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <span
          onClick={() => toggleBlock('unordered-list-item')}
          className="cursor-pointer"
        >
          <List className="w-[18px] h-[18px] text-title" />
        </span>

        <span
          onClick={() => toggleBlock('ordered-list-item')}
          className="cursor-pointer"
        >
          <ListOrdered className="w-[18px] h-[18px] text-title" />
        </span>
        <span className=" w-[0.8px] inline-block h-4 bg-border"></span>

        <span
          onClick={() => toggleBlock('blockquote')}
          className="cursor-pointer"
        >
          <Quote className="w-4 h-4 text-title" />
        </span>
        <span onClick={() => toggleInline('CODE')} className="cursor-pointer">
          <Code className="w-[18px] h-[18px] text-title" />
        </span>

        <span className=" w-[0.8px] inline-block h-4 bg-border"></span>

        <span
          onClick={() => setEditorState(EditorState.undo(editorState))}
          className="cursor-pointer text-sm"
        >
          <Undo className="w-4 h-4 text-title" />
        </span>
        <span
          onClick={() => setEditorState(EditorState.redo(editorState))}
          className="cursor-pointer"
        >
          <Redo className="w-4 h-4 text-title" />
        </span>
      </div>
    </div>
  );
}
