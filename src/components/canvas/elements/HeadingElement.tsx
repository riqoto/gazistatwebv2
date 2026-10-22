'use client';

import { Heading } from '@radix-ui/themes';
import { HeadingComponent } from '@/types/schema';
import { ElementRendererProps, getElementStyle } from './types';
import { InlineText } from './InlineText';

export function HeadingElement(props: ElementRendererProps<HeadingComponent>) {
    const { component, styles, readOnly, onUpdate, onSelect } = props;

    return (
        <InlineText
            value={component.content}
            style={{ ...getElementStyle(styles), color: styles.color ?? 'inherit', margin: 0, whiteSpace: 'pre-wrap', tabSize: 4 }}
            readOnly={readOnly}
            onChange={(content) => onUpdate({ content })}
            onSelect={onSelect}
            render={(value, onClick, onPointerDown) => <Heading onPointerDown={onPointerDown} onClick={onClick} style={{ ...getElementStyle(styles), color: styles.color ?? 'inherit', margin: 0, whiteSpace: 'pre-wrap', tabSize: 4 }}>{value || <br />}</Heading>}
        />
    );
}