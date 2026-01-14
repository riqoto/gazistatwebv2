import { Box, Flex, Text, TextField, Grid } from '@radix-ui/themes';
import { ComponentStyles } from '@/types/schema';
import { ColorInput } from '@/components/ui/ColorInput';
import { useCallback, useRef, useEffect } from 'react';

interface AppearanceControlProps {
    styles: ComponentStyles;
    onChange: (newStyles: ComponentStyles) => void;
}

export function AppearanceControl({ styles, onChange }: AppearanceControlProps) {
    const stylesRef = useRef(styles);

    useEffect(() => {
        stylesRef.current = styles;
    }, [styles]);

    const handleChange = useCallback((key: keyof ComponentStyles, value: any) => {
        onChange({ ...stylesRef.current, [key]: value });
    }, [onChange]);

    return (
        <Box>
            <Text size="1" weight="bold" mb="2" color="gray" className="uppercase">Görünüm</Text>

            <Flex direction="column" gap="2">
                <Box>
                    <Text size="1" mb="1" as="div">Arkaplan</Text>
                    <Flex gap="2">
                        <TextField.Root
                            size="1"
                            className="flex-grow"
                            value={styles.backgroundColor || ''}
                            placeholder="transparent"
                            onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        />
                        <ColorInput
                            value={styles.backgroundColor}
                            onChange={(val) => handleChange('backgroundColor', val)}
                        />
                    </Flex>
                </Box>

                <Grid columns="2" gap="2">
                    <Box>
                        <Text size="1" mb="1" as="div">Kenarlık Genişliği</Text>
                        <TextField.Root
                            size="1"
                            type="number"
                            value={styles.borderWidth || ''}
                            onChange={(e) => handleChange('borderWidth', parseInt(e.target.value))}
                        />
                    </Box>
                    <Box>
                        <Text size="1" mb="1" as="div">Kenar Yumuşaklığı</Text>
                        <TextField.Root
                            size="1"
                            type="number"
                            value={styles.borderRadius || ''}
                            onChange={(e) => handleChange('borderRadius', parseInt(e.target.value))}
                        />
                    </Box>
                </Grid>
                <Box>
                    <Text size="1" mb="1" as="div">Kenarlık Rengi</Text>
                    <Flex gap="2">
                        <TextField.Root
                            size="1"
                            className="flex-grow"
                            value={styles.borderColor || ''}
                            placeholder="#000000"
                            onChange={(e) => handleChange('borderColor', e.target.value)}
                        />
                        <ColorInput
                            value={styles.borderColor}
                            onChange={(val) => handleChange('borderColor', val)}
                        />
                    </Flex>
                </Box>
            </Flex>
        </Box>
    );
}
