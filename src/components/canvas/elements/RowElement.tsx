import { Box, Flex, Text } from '@radix-ui/themes';
import { RowComponent } from '@/types/schema';
import { ComponentRenderer } from '../ComponentRenderer';
import { ElementRendererProps, getElementStyle } from './types';

export function RowElement({ component, styles, readOnly }: ElementRendererProps<RowComponent>) {
    return (
        <Flex
            direction="row"
            gap={`${component.gap ?? 0}px`}
            align={component.alignItems === 'flex-start' ? 'start' : component.alignItems === 'flex-end' ? 'end' : component.alignItems ?? 'center'}
            justify={component.justifyContent === 'center' ? 'center' : component.justifyContent === 'flex-end' ? 'end' : component.justifyContent === 'space-between' ? 'between' : 'start'}
            wrap="wrap"
            className={!readOnly ? 'min-h-[24px] border border-dashed border-gazi-navy-200' : undefined}
            style={{ ...getElementStyle(styles), justifyContent: component.justifyContent }}
        >
            {component.children.length === 0 ? (
                !readOnly && <Text size="1" className="p-2 text-gazi-navy-400">Boş Satır</Text>
            ) : component.children.map((child) => (
                <Box key={child.id} style={{ flex: '0 0 auto', width: 'fit-content', maxWidth: '100%' }}>
                    <ComponentRenderer component={child} readOnly={readOnly} />
                </Box>
            ))}
        </Flex>
    );
}