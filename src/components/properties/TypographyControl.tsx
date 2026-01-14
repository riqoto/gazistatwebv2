import { Box, Flex, Text, TextField, Grid, Select } from '@radix-ui/themes';
import { ComponentStyles } from '@/types/schema';
import { ColorInput } from '@/components/ui/ColorInput';
import { useCallback, useRef, useEffect } from 'react';

interface TypographyControlProps {
    styles: ComponentStyles;
    onChange: (newStyles: ComponentStyles) => void;
}

export function TypographyControl({ styles, onChange }: TypographyControlProps) {
    const stylesRef = useRef(styles);

    useEffect(() => {
        stylesRef.current = styles;
    }, [styles]);

    const handleChange = useCallback((key: keyof ComponentStyles, value: any) => {
        onChange({ ...stylesRef.current, [key]: value });
    }, [onChange]);

    return (
        <Box>
            <Text size="1" weight="bold" mb="2" color="gray" className="uppercase">Tipografi</Text>

            <Flex direction="column" gap="2">
                <Grid columns="2" gap="2">
                    <Box>
                        <Text size="1" mb="1" as="div">Yazı Boyutu</Text>
                        <TextField.Root
                            size="1"
                            type="number"
                            value={styles.fontSize || ''}
                            onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                        />
                    </Box>
                    <Box>
                        <Text size="1" mb="1" as="div">Ağırlık</Text>
                        <Select.Root
                            value={styles.fontWeight || 'normal'}
                            onValueChange={(val) => handleChange('fontWeight', val)}
                        >
                            <Select.Trigger className="h-[20px]" />
                            <Select.Content>
                                <Select.Item value="normal">Normal</Select.Item>
                                <Select.Item value="500">Orta</Select.Item>
                                <Select.Item value="600">Yarı Kalın</Select.Item>
                                <Select.Item value="700">Kalın</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </Box>
                </Grid>

                <Box>
                    <Text size="1" mb="1" as="div">Hizalama</Text>
                    <Select.Root
                        value={styles.textAlign || 'left'}
                        onValueChange={(val) => handleChange('textAlign', val)}
                    >
                        <Select.Trigger className="w-full" />

                        <Select.Content>
                            <Select.Item value="left">Sol</Select.Item>
                            <Select.Item value="center">Merkez</Select.Item>
                            <Select.Item value="right">Sağ</Select.Item>
                            <Select.Item value="justify">İki Yana</Select.Item>
                        </Select.Content>
                    </Select.Root>
                </Box>

                <Box>
                    <Text size="1" mb="1" as="div">Renk</Text>
                    <Flex gap="2">
                        <TextField.Root
                            size="1"
                            className="flex-grow"
                            value={styles.color || ''}
                            placeholder="inherit"
                            onChange={(e) => handleChange('color', e.target.value)}
                        />
                        <ColorInput
                            value={styles.color}
                            onChange={(val) => handleChange('color', val)}
                        />
                    </Flex>
                </Box>
            </Flex>
        </Box>
    );
}
