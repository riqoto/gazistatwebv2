import { ComponentSchema, ComponentStyles } from '@/types/schema';

export interface ElementRendererProps<T extends ComponentSchema = ComponentSchema> {
    component: T;
    styles: ComponentStyles;
    readOnly: boolean;
    isSelected: boolean;
    onUpdate: (updates: Partial<ComponentSchema>) => void;
    onSelect: () => void;
}

export function getElementStyle(styles: ComponentStyles): React.CSSProperties {
    return {
        boxSizing: 'border-box',
        width: styles.width ?? 'fit-content',
        height: styles.height,
        maxWidth: '100%',
        paddingTop: styles.paddingTop,
        paddingRight: styles.paddingRight,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        textAlign: styles.textAlign,
        color: styles.color,
        lineHeight: styles.lineHeight,
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        borderWidth: styles.borderWidth,
        borderStyle: styles.borderStyle ?? (styles.borderWidth || styles.borderColor ? 'solid' : undefined),
        borderRadius: styles.borderRadius,
    };
}