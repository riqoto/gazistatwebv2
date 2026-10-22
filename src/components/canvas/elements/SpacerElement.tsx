import { Box, Flex, Text } from '@radix-ui/themes';
import { SpacerComponent } from '@/types/schema';
import { MoveVertical } from 'lucide-react';
import { ElementRendererProps, getElementStyle } from './types';

export function SpacerElement({ component, styles, readOnly, isSelected }: ElementRendererProps<SpacerComponent>) {
    const height = styles.height ?? component.height;

    return (
        <Box
            style={{
                ...getElementStyle(styles),
                width: styles.width ?? '100%',
                height,
                minHeight: readOnly ? undefined : 28,
                minWidth: readOnly ? undefined : 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: readOnly ? undefined : `1px dashed ${isSelected ? '#2563eb' : '#cbd5e1'}`,
                backgroundColor: readOnly ? 'transparent' : styles.backgroundColor ?? '#f8fafc',
                color: '#64748b',
            }}
        >
            {!readOnly && <Flex align="center" gap="1"><MoveVertical size={12} /><Text size="1">Boşluk · {height}px</Text></Flex>}
        </Box>
    );
}