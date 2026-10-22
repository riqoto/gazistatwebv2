import { Box } from '@radix-ui/themes';
import { DataViewComponent } from '@/types/schema';
import { DataViewRenderer } from '../DataViewRenderer';
import { ElementRendererProps, getElementStyle } from './types';

export function DataViewElement({ component, styles }: ElementRendererProps<DataViewComponent>) {
    return (
        <Box className="overflow-hidden rounded bg-white" style={getElementStyle(styles)}>
            <DataViewRenderer component={component} />
        </Box>
    );
}