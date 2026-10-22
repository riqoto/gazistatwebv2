'use client';

import { CSSProperties, KeyboardEvent, useLayoutEffect, useRef, useState } from 'react';

interface InlineTextProps {
    value: string;
    style: CSSProperties;
    readOnly: boolean;
    onChange: (value: string) => void;
    onSelect: () => void;
    render: (value: string, onClick: (event: React.MouseEvent<HTMLElement>) => void, onPointerDown: (event: React.PointerEvent<HTMLElement>) => void) => React.ReactNode;
}

export function InlineText({ value, style, readOnly, onChange, onSelect, render }: InlineTextProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editorWidth, setEditorWidth] = useState<number>();
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        if (!isEditing || !inputRef.current) return;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }, [isEditing]);

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            setIsEditing(false);
            return;
        }

        if (event.key === 'Tab') {
            event.preventDefault();
            const input = event.currentTarget;
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const nextValue = `${value.slice(0, start)}\t${value.slice(end)}`;
            onChange(nextValue);
            requestAnimationFrame(() => input.setSelectionRange(start + 1, start + 1));
        }
    };

    if (!isEditing || readOnly) {
        return <>{render(value, (event) => {
            if (readOnly) return;
            const { width } = event.currentTarget.getBoundingClientRect();
            setEditorWidth(width);
            onSelect();
            setIsEditing(true);
        }, (event) => event.stopPropagation())}</>;
    }

    return (
        <textarea
            ref={inputRef}
            aria-label="Edit text"
            value={value}
            rows={1}
            onFocus={onSelect}
            onChange={(event) => {
                onChange(event.target.value);
                event.currentTarget.style.height = 'auto';
                event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => setIsEditing(false)}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            style={{
                ...style,
                display: 'block',
                width: editorWidth ?? style.width,
                minWidth: editorWidth ?? '1em',
                minHeight: '1.2em',
                overflow: 'hidden',
                resize: 'none',
                whiteSpace: 'pre-wrap',
                tabSize: 4,
                fontFamily: 'inherit',
                border: '1px dashed #627d98',
                outline: 'none',
            }}
        />
    );
}