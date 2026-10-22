import { Callout } from '@radix-ui/themes';
import { AlertComponent } from '@/types/schema';
import { AlertOctagon, CheckCircle, Info, TriangleAlert } from 'lucide-react';
import { ElementRendererProps, getElementStyle } from './types';

export function AlertElement({ component, styles }: ElementRendererProps<AlertComponent>) {
    const variant = component.variant || 'info';
    const variantPresentation = {
        info: { icon: <Info size={16} />, color: 'blue' as const },
        success: { icon: <CheckCircle size={16} />, color: 'green' as const },
        warning: { icon: <TriangleAlert size={16} />, color: 'amber' as const },
        error: { icon: <AlertOctagon size={16} />, color: 'red' as const },
    }[variant];

    return (
        <Callout.Root color={variantPresentation.color} style={getElementStyle(styles)}>
            <Callout.Icon>{variantPresentation.icon}</Callout.Icon>
            <Callout.Text>{component.content}</Callout.Text>
        </Callout.Root>
    );
}