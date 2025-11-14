interface DraftJSBlock {
  text: string;
  [key: string]: unknown;
}

interface DraftJSContent {
  blocks: DraftJSBlock[];
  [key: string]: unknown;
}

export function draftJSToText(draftJSContent: string | DraftJSContent): string {
  try {
    // If the content is already an object, use it directly
    // Otherwise, try to parse it as JSON
    const content =
      typeof draftJSContent === "string" ? (JSON.parse(draftJSContent) as DraftJSContent) : draftJSContent;

    // Extract text from each block and join with newlines
    return content.blocks.map((block) => block.text).join("\n");
  } catch (error) {
    // If parsing fails, return the original content as is
    return typeof draftJSContent === "string" ? draftJSContent : JSON.stringify(draftJSContent);
  }
}
