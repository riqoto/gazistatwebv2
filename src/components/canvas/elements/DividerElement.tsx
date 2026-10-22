import { Box, Flex, Text } from '@radix-ui/themes';
import { DividerComponent } from '@/types/schema';
import { Minus } from 'lucide-react';
import { ElementRendererProps, getElementStyle } from './types';

export function DividerElement({ component, styles, readOnly, isSelected }: ElementRendererProps<DividerComponent>) {
    const thickness = Math.max(1, Number(component.thickness) || 1);

    return (
        <Box style={{ ...getElementStyle(styles), width: styles.width ?? '100%', minWidth: readOnly ? undefined : 120 }}>
            {!readOnly && (
                <Flex align="center" gap="2" className={`mb-1 ${isSelected ? 'text-blue-700' : 'text-gray-400'}`}>
                    <Minus size={12} />
                    <Text size="1">Ayırıcı</Text>
                </Flex>
            )}
            <hr
                aria-label={readOnly ? undefined : 'Ayırıcı'}
                style={{
                    display: 'block',
                    width: '100%',
                    height: 0,
                    margin: 0,
                    border: 0,
                    borderTop: `${thickness}px solid ${styles.color || '#9ca3af'}`,
                }}
            />
        </Box>
    );
}