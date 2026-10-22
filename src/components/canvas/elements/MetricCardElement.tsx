import { Card, Flex, Heading, Text } from '@radix-ui/themes';
import { MetricCardComponent } from '@/types/schema';
import { ElementRendererProps, getElementStyle } from './types';

export function MetricCardElement({ component, styles }: ElementRendererProps<MetricCardComponent>) {
    return (
        <Card style={getElementStyle(styles)}>
            <Flex direction="column" gap="1">
                <Text size="2" color="gray">{component.label}</Text>
                <Heading size="6">{component.value}</Heading>
            </Flex>
        </Card>
    );
}