import { Box, Flex, Text, TextField, Grid, Select } from '@radix-ui/themes';
import { ComponentStyles } from '@/types/schema';
import { useCallback, useRef, useEffect } from 'react';

interface LayoutControlProps {
    styles: ComponentStyles;
    onChange: (newStyles: ComponentStyles) => void;
}

export function LayoutControl({ styles, onChange }: LayoutControlProps) {
    const stylesRef = useRef(styles);

    useEffect(() => {
        stylesRef.current = styles;
    }, [styles]);

    const handleChange = useCallback((key: keyof ComponentStyles, value: any) => {
        onChange({ ...stylesRef.current, [key]: value });
    }, [onChange]);

    return (
        <Box>
            <Text size="1" weight="bold" mb="2" color="gray" className="uppercase">Düzen</Text>

            <Grid columns="2" gap="2">
                <Box>
                    <Text size="1" mb="1" as="div">Genişlik</Text>
                    <TextField.Root
                        size="1"
                        value={styles.width || ''}
                        onChange={(e) => handleChange('width', e.target.value)}
                        placeholder="auto"
                    />
                </Box>
                <Box>
                    <Text size="1" mb="1" as="div">Yükseklik</Text>
                    <TextField.Root
                        size="1"
                        value={styles.height || ''}
                        onChange={(e) => handleChange('height', e.target.value)}
                        placeholder="auto"
                    />
                </Box>
            </Grid>

            <Box mt="2">
                <Text size="1" mb="1" as="div">Hizalama</Text>
                <Select.Root
                    value={styles.textAlign || 'left'}
                    onValueChange={(value) => handleChange('textAlign', value)}
                >
                    <Select.Trigger className="w-full" />
                    <Select.Content>
                        <Select.Item value="left">Sol</Select.Item>
                        <Select.Item value="center">Merkez</Select.Item>
                        <Select.Item value="right">Sağ</Select.Item>
                    </Select.Content>
                </Select.Root>
            </Box>
        </Box>
    );
}
