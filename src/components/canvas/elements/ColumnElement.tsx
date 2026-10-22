import { Box, Flex, Text } from '@radix-ui/themes';
import { ColumnComponent } from '@/types/schema';
import { ComponentRenderer } from '../ComponentRenderer';
import { ElementRendererProps, getElementStyle } from './types';

export function ColumnElement({ component, styles, readOnly }: ElementRendererProps<ColumnComponent>) {
    return (
        <Flex
            direction="column"
            gap={`${component.gap ?? 0}px`}
            align={component.alignItems === 'flex-start' ? 'start' : component.alignItems === 'flex-end' ? 'end' : component.alignItems ?? 'stretch'}
            className={!readOnly ? 'min-h-[24px] border border-dashed border-gazi-navy-200' : undefined}
            style={getElementStyle(styles)}
        >
            {component.children.length === 0 ? (
                !readOnly && <Text size="1" className="p-2 text-gazi-navy-400">Boş Sütun</Text>
            ) : component.children.map((child) => (
                <Box key={child.id} style={{ width: 'fit-content', maxWidth: '100%' }}>
                    <ComponentRenderer component={child} readOnly={readOnly} />
                </Box>
            ))}
        </Flex>
    );
}