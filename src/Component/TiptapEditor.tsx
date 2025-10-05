import React, { type RefObject, type KeyboardEvent } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface TiptapToolbarProps {
    editor: Editor | null;
}

const TiptapToolbar: React.FC<TiptapToolbarProps> = ({ editor }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="tiptap-toolbar">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'is-active' : ''}
                type="button"
            >
                <b>Bold</b>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'is-active' : ''}
                type="button"
            >
                <i>Italic</i>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive('strike') ? 'is-active' : ''}
                type="button"
            >
                <s>Strike</s>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                type="button"
            >
                H1
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                type="button"
            >
                H2
            </button>
        </div>
    );
};

interface TiptapEditorProps {
    content: string;
    onContentChange: (htmlContent: string) => void;
    nextElementRef: RefObject<HTMLElement> | null; 
}

export default function TiptapEditor({ content, onContentChange, nextElementRef }: TiptapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
    
            }),
            Placeholder.configure({
                placeholder: '',
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onContentChange(html);
        },
    }, []);

    const handleFocus = () => {
        if (editor) {
            editor.commands.focus();
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Tab' && !event.shiftKey) {
            event.preventDefault();
            
            if (nextElementRef?.current) {
                nextElementRef.current.focus();
            }
        }
    };

    return (
        <div className="tiptap-container">
            <TiptapToolbar editor={editor} />
            <EditorContent 
                editor={editor} 
                onFocus={handleFocus}
                onKeyDown={handleKeyDown} 
                style={{height: "20rem"}}
                role="textbox"
                tabIndex={2}
            />
        </div>
    );
}