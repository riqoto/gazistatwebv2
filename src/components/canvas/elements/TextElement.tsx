'use client';

import { TextComponent } from '@/types/schema';
import { ElementRendererProps, getElementStyle } from './types';
import { InlineText } from './InlineText';

export function TextElement(props: ElementRendererProps<TextComponent>) {
    const { component, styles, readOnly, onUpdate, onSelect } = props;
    const style = { ...getElementStyle(styles), display: 'block', whiteSpace: 'pre-wrap', tabSize: 4 } as const;

    return (
        <InlineText
            value={component.content}
            style={style}
            readOnly={readOnly}
            onChange={(content) => onUpdate({ content })}
            onSelect={onSelect}
            render={(value, onClick, onPointerDown) => <div onPointerDown={onPointerDown} onClick={onClick} style={style}>{value || <br />}</div>}
        />
    );
}