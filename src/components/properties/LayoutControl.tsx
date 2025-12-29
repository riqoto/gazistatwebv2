import { Box, Flex, Text, TextField, Grid } from '@radix-ui/themes';
import { ComponentStyles } from '@/types/schema';

interface LayoutControlProps {
    styles: ComponentStyles;
    onChange: (newStyles: ComponentStyles) => void;
}

export function LayoutControl({ styles, onChange }: LayoutControlProps) {
    const handleChange = (key: keyof ComponentStyles, value: any) => {
        onChange({ ...styles, [key]: value });
    };

    return (
        <Box>
            <Text size="1" weight="bold" mb="2" color="gray" className="uppercase">Layout</Text>

            <Grid columns="2" gap="2">
                <Box>
                    <Text size="1" mb="1" as="div">Width</Text>
                    <TextField.Root
                        size="1"
                        value={styles.width || ''}
                        onChange={(e) => handleChange('width', e.target.value)}
                        placeholder="auto"
                    />
                </Box>
                <Box>
                    <Text size="1" mb="1" as="div">Height</Text>
                    <TextField.Root
                        size="1"
                        value={styles.height || ''}
                        onChange={(e) => handleChange('height', e.target.value)}
                        placeholder="auto"
                    />
                </Box>
            </Grid>
        </Box>
    );
}
