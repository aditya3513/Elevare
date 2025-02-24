import { useEffect } from 'react';
import { Tldraw, useEditor, createShapeId, TLShape, Editor } from 'tldraw';

interface WhiteboardItem {
  type: string;
  title?: string;
  text?: string;
  contents?: Array<{ type: string; text: string }>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

// Example mapping function that converts an item to a shape config for tldraw.
function createShapeConfig(item: WhiteboardItem): Partial<TLShape> {
  const baseConfig = {
    id: createShapeId(),
    x: item.position.x,
    y: item.position.y,
  };

  switch (item.type) {
    case 'header': {
      return {
        ...baseConfig,
        type: 'text',
        props: {
          text: item.text || '',
          fontSize: 32,
          fontWeight: 'bold',
        },
      };
    }
    case 'textbox': {
      return {
        ...baseConfig,
        type: 'text',
        props: {
          text: item.text || '',
          fontSize: 16,
        },
      };
    }
    case 'box': {
      const boxContents = [
        item.title || '',
        ...(item.contents?.map(content => content.text) || [])
      ].filter(Boolean).join('\n\n');

      return {
        ...baseConfig,
        type: 'rectangle',
        props: {
          text: boxContents,
          width: item.size.width,
          height: item.size.height,
          color: 'blue',
          fill: 'none',
        },
      };
    }
    case 'sticky': {
      return {
        ...baseConfig,
        type: 'sticky',
        props: {
          text: item.text || '',
          fontSize: 14,
          color: 'yellow',
        },
      };
    }
    default: {
      console.warn('Unknown item type', item.type);
      return null;
    }
  }
}

interface WhiteboardEditorProps {
  items: WhiteboardItem[] | null;
  isReadOnly?: boolean;
}

export function WhiteboardEditor({ items, isReadOnly = true }: WhiteboardEditorProps) {
  const editor = useEditor();

  useEffect(() => {
    if (!editor || !items) return;

    // Optional: clear all existing shapes before adding new ones.
    const existingShapeIds = Array.from(editor.getCurrentPageShapeIds());
    if (existingShapeIds.length > 0) {
      editor.deleteShapes(existingShapeIds);
    }

    // Process each item and create shapes.
    items.forEach((item) => {
      const shapeConfig = createShapeConfig(item);
      if (shapeConfig) {
        editor.createShapes([shapeConfig]);
      }

      // For box items with nested content (sticky notes inside a box)
      if (item.type === 'box' && Array.isArray(item.contents)) {
        item.contents.forEach((content, idx) => {
          if (content.type === 'sticky') {
            // Position sticky notes relative to the box.
            editor.createShapes([{
              id: createShapeId(),
              type: 'sticky',
              x: item.position.x + 10,
              y: item.position.y + 30 + idx * 20,
              props: {
                text: content.text,
                fontSize: 14,
                color: 'yellow',
              },
            }]);
          }
        });
      }
    });
  }, [editor, items]);

  return (
    <div className="w-full h-full">
      <Tldraw
        inferDarkMode
        hideUi={isReadOnly}
        onMount={(editor: Editor) => {
          editor.updateInstanceState({ 
            isReadonly: isReadOnly,
            isGridMode: true,
          });
        }}
      />
    </div>
  );
} 