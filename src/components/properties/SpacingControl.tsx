import { Box, Flex, Text, TextField, Grid } from '@radix-ui/themes';
import { ComponentStyles } from '@/types/schema';
import { useCallback, useRef, useEffect } from 'react';

interface SpacingControlProps {
    styles: ComponentStyles;
    onChange: (newStyles: ComponentStyles) => void;
}

export function SpacingControl({ styles, onChange }: SpacingControlProps) {
    const stylesRef = useRef(styles);

    useEffect(() => {
        stylesRef.current = styles;
    }, [styles]);

    const handleChange = useCallback((key: keyof ComponentStyles, value: any) => {
        onChange({ ...stylesRef.current, [key]: value });
    }, [onChange]);

    return (
        <Box>
            <Text size="1" weight="bold" mb="2" color="gray" className="uppercase">Boşluk</Text>

            <Box mb="2">
                <Text size="1" mb="1" as="div">İç Boşluk</Text>
                <Grid columns="2" gap="2">
                    <TextField.Root size="1" placeholder="Üst" type="number" value={styles.paddingTop || ''} onChange={(e) => handleChange('paddingTop', parseInt(e.target.value))} />
                    <TextField.Root size="1" placeholder="Sağ" type="number" value={styles.paddingRight || ''} onChange={(e) => handleChange('paddingRight', parseInt(e.target.value))} />
                    <TextField.Root size="1" placeholder="Alt" type="number" value={styles.paddingBottom || ''} onChange={(e) => handleChange('paddingBottom', parseInt(e.target.value))} />
                    <TextField.Root size="1" placeholder="Sol" type="number" value={styles.paddingLeft || ''} onChange={(e) => handleChange('paddingLeft', parseInt(e.target.value))} />
                </Grid>
            </Box>

            <Box>
                <Text size="1" mb="1" as="div">Dış Boşluk</Text>
                <Grid columns="2" gap="2">
                    <TextField.Root size="1" placeholder="Üst" type="number" value={styles.marginTop || ''} onChange={(e) => handleChange('marginTop', parseInt(e.target.value))} />
                    <TextField.Root size="1" placeholder="Alt" type="number" value={styles.marginBottom || ''} onChange={(e) => handleChange('marginBottom', parseInt(e.target.value))} />
                </Grid>
            </Box>
        </Box>
    );
}
