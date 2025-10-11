import React, { type KeyboardEvent, useState, useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit'; 
import IconPicker from './IconPicker'; 

// --- (TiptapToolbar Component är oförändrad och korrekt) ---
interface TiptapToolbarProps {
    editor: Editor | null;
    toggleIconPicker: () => void;
}

const TiptapToolbar: React.FC<TiptapToolbarProps> = ({ editor, toggleIconPicker }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="tiptap-toolbar">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'is-active' : ''}
                type="button"
                aria-label="Bold"
                title="Bold (Ctrl+B / Cmd+B)"
            >
                <b>B</b>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'is-active' : ''}
                type="button"
                aria-label="Italic"
                title="Italic (Ctrl+I / Cmd+I)"
            >
                <i>I</i>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive('strike') ? 'is-active' : ''}
                type="button"
                aria-label="Strike"
                title="Strikethrough (Ctrl+Shift+X / Cmd+Shift+X)"
            >
                <s>S</s>
            </button>

            <button
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={editor.isActive('paragraph') ? 'is-active' : ''}
                type="button"
                aria-label="Paragraph"
                title="Paragraph (P)"
            >
                P
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                type="button"
                aria-label="Heading 1"
                title="Heading 1 (H1)"
            >
                H1
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                type="button"
                aria-label="Heading 2"
                title="Heading 2 (H2)"
            >
                H2
            </button>

            <button
                onClick={toggleIconPicker}
                type="button"
                aria-label="Infoga ikon"
                className="toolbar-icon-button"
                title="Insert Icon"
            >
                Ikoner
            </button>
        </div>
    );
};

interface TiptapEditorProps {
    content: string;
    onContentChange: (htmlContent: string) => void;
    nextElementRef?: React.RefObject<HTMLElement | null>;
}

export default function TiptapEditor({ content, onContentChange, nextElementRef }: TiptapEditorProps) {
    const [showIconPicker, setShowIconPicker] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                orderedList: false,
                bulletList: false,
                listItem: false,
                blockquote: false,
                // Ingen specifik konfiguration för Paragraph här.
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onContentChange(html);
        },
    }, []);

    const handleIconSelect = useCallback((icon: string) => {
        if (editor) {
            editor.chain().focus().insertContent(icon).run();
        }
        setShowIconPicker(false);
    }, [editor]);

    const handleFocus = () => {
        if (editor && !editor.isFocused) {
            editor.commands.focus();
        }
    };

    const handleToggleIconPicker = useCallback(() => {
        setShowIconPicker(prev => !prev);
    }, []);

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Tab' && !event.shiftKey) {
            event.preventDefault();

            if (nextElementRef?.current) {
                nextElementRef.current.focus();
            }
        }
    };

    return (
        <div className="tiptap-container" onFocus={handleFocus} tabIndex={-1}>
            <TiptapToolbar
                editor={editor}
                toggleIconPicker={handleToggleIconPicker}
            />

            {showIconPicker && (
                <IconPicker
                    onSelect={handleIconSelect}
                    onClose={() => setShowIconPicker(false)}
                />
            )}

            <EditorContent
                editor={editor}
                onKeyDown={handleKeyDown}
                style={{ height: "20rem" }}
                role="textbox"
                tabIndex={2}
            />
        </div>
    );
}