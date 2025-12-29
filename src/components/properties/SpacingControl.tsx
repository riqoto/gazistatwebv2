import { Box, Flex, Text, TextField, Grid } from '@radix-ui/themes';
import { ComponentStyles } from '@/types/schema';

interface SpacingControlProps {
    styles: ComponentStyles;
    onChange: (newStyles: ComponentStyles) => void;
}

export function SpacingControl({ styles, onChange }: SpacingControlProps) {
    const handleChange = (key: keyof ComponentStyles, value: any) => {
        onChange({ ...styles, [key]: value });
    };

    return (
        <Box>
            <Text size="1" weight="bold" mb="2" color="gray" className="uppercase">Spacing</Text>

            <Box mb="2">
                <Text size="1" mb="1" as="div">Padding</Text>
                <Grid columns="2" gap="2">
                    <TextField.Root size="1" placeholder="Top" type="number" value={styles.paddingTop || ''} onChange={(e) => handleChange('paddingTop', parseInt(e.target.value))} />
                    <TextField.Root size="1" placeholder="Right" type="number" value={styles.paddingRight || ''} onChange={(e) => handleChange('paddingRight', parseInt(e.target.value))} />
                    <TextField.Root size="1" placeholder="Bottom" type="number" value={styles.paddingBottom || ''} onChange={(e) => handleChange('paddingBottom', parseInt(e.target.value))} />
                    <TextField.Root size="1" placeholder="Left" type="number" value={styles.paddingLeft || ''} onChange={(e) => handleChange('paddingLeft', parseInt(e.target.value))} />
                </Grid>
            </Box>

            <Box>
                <Text size="1" mb="1" as="div">Margin</Text>
                <Grid columns="2" gap="2">
                    <TextField.Root size="1" placeholder="Top" type="number" value={styles.marginTop || ''} onChange={(e) => handleChange('marginTop', parseInt(e.target.value))} />
                    <TextField.Root size="1" placeholder="Bot" type="number" value={styles.marginBottom || ''} onChange={(e) => handleChange('marginBottom', parseInt(e.target.value))} />
                </Grid>
            </Box>
        </Box>
    );
}
