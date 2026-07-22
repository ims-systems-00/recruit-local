'use client';

import React from 'react';
import {
  Editor,
  EditorState,
  convertFromRaw,
  RawDraftContentState,
} from 'draft-js';
import 'draft-js/dist/Draft.css';

type DraftViewerProps = {
  content: RawDraftContentState | string;
};

export default function DraftViewer({ content }: DraftViewerProps) {
  const editorState = React.useMemo(() => {
    try {
      const parsedContent =
        typeof content === 'string' ? JSON.parse(content) : content;

      return EditorState.createWithContent(convertFromRaw(parsedContent));
    } catch (error) {
      return EditorState.createEmpty();
    }
  }, [content]);

  return <Editor editorState={editorState} readOnly onChange={() => {}} />;
}
