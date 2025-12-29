'use client';

import { Box, Flex, Text, TextArea, Select, Button, TextField, Grid, Badge } from '@radix-ui/themes';
import { ComponentStyles, DataViewComponent } from '@/types/schema';
import { getKeysFromData } from '@/utils/data-processing';
import { Plus, Trash2, BarChart, Activity, PieChart, Table as TableIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DataViewControlProps {
    component: DataViewComponent;
    onUpdate: (updates: Partial<DataViewComponent>) => void;
}

export function DataViewControl({ component, onUpdate }: DataViewControlProps) {
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [localJson, setLocalJson] = useState(JSON.stringify(component.data, null, 2));

    const keys = getKeysFromData(component.data);

    // Sync local JSON when component.data changes externally (e.g. undo/redo)
    useEffect(() => {
        setLocalJson(JSON.stringify(component.data, null, 2));
    }, [component.data]);

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setLocalJson(val);
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
                onUpdate({ data: parsed });
                setJsonError(null);
            } else {
                setJsonError('Data must be an array of objects');
            }
        } catch (err) {
            setJsonError('Invalid JSON format');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;

            if (file.name.endsWith('.json')) {
                try {
                    const parsed = JSON.parse(content);
                    if (Array.isArray(parsed)) {
                        setLocalJson(JSON.stringify(parsed, null, 2));
                        onUpdate({ data: parsed });
                        setJsonError(null);
                    } else {
                        setJsonError('JSON must be an array of objects');
                    }
                } catch (err) {
                    setJsonError('Invalid JSON file');
                }
            } else if (file.name.endsWith('.csv')) {
                // Simple CSV parser for demo purposes
                const lines = content.split('\n');
                const headers = lines[0].split(',').map(h => h.trim());
                const data = lines.slice(1).filter(l => l.trim()).map(line => {
                    const values = line.split(',');
                    const obj: any = {};
                    headers.forEach((h, i) => {
                        const val = values[i]?.trim();
                        obj[h] = isNaN(Number(val)) ? val : Number(val);
                    });
                    return obj;
                });
                setLocalJson(JSON.stringify(data, null, 2));
                onUpdate({ data });
                setJsonError(null);
            }
        };
        reader.readAsText(file);
    };

    const handleAddFormula = () => {
        const newFormula = { type: 'average', key: keys[0] || '', label: 'Average' } as const;
        onUpdate({
            formulas: [...(component.formulas || []), newFormula]
        });
    };

    const removeFormula = (index: number) => {
        const newFormulas = [...(component.formulas || [])];
        newFormulas.splice(index, 1);
        onUpdate({ formulas: newFormulas });
    };

    const updateFormula = (index: number, field: string, value: string) => {
        const newFormulas = [...(component.formulas || [])];
        newFormulas[index] = { ...newFormulas[index], [field]: value };
        onUpdate({ formulas: newFormulas });
    };

    return (
        <Box>
            <Text size="2" weight="bold" mb="2">Data Source (JSON)</Text>
            <TextArea
                value={localJson}
                onChange={handleJsonChange}
                className="font-mono text-xs"
                rows={6}
                color={jsonError ? 'red' : undefined}
            />
            {jsonError && <Text size="1" color="red">{jsonError}</Text>}

            <Box mt="2">
                <Text size="1" weight="bold">Upload File (JSON/CSV)</Text>
                <input
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-gray-500
                        file:mr-2 file:py-1 file:px-2
                        file:rounded-full file:border-0
                        file:text-xs file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                />
            </Box>

            <Box mt="4">
                <Text size="2" weight="bold" mb="2">View Type</Text>
                <Grid columns="4" gap="2">
                    <Button variant={component.viewType === 'table' ? 'solid' : 'soft'} onClick={() => onUpdate({ viewType: 'table' })}>
                        <TableIcon size={16} />
                    </Button>
                    <Button variant={component.viewType === 'bar' ? 'solid' : 'soft'} onClick={() => onUpdate({ viewType: 'bar' })}>
                        <BarChart size={16} />
                    </Button>
                    <Button variant={component.viewType === 'line' ? 'solid' : 'soft'} onClick={() => onUpdate({ viewType: 'line' })}>
                        <Activity size={16} />
                    </Button>
                    <Button variant={component.viewType === 'pie' ? 'solid' : 'soft'} onClick={() => onUpdate({ viewType: 'pie' })}>
                        <PieChart size={16} />
                    </Button>
                </Grid>
            </Box>

            {component.viewType !== 'table' && (
                <Box mt="4">
                    <Text size="2" weight="bold" mb="2">Chart Configuration</Text>

                    <Box mb="2" className="flex gap-5 p-1 border border-gray-200 rounded bg-gray-50">
                        <Flex justify="between" align="center" >
                            <Text size="1" color="gray">X Axis (Category)</Text>
                            <Select.Root
                                value={component.config.xAxisKey || ''}
                                onValueChange={(val) => onUpdate({ config: { ...component.config, xAxisKey: val } })}
                            >
                                <Select.Trigger className="w-full" />
                                <Select.Content>
                                    {keys.map(k => <Select.Item key={k} value={k}>{k}</Select.Item>)}
                                </Select.Content>
                            </Select.Root>
                        </Flex>
                    </Box>

                    <Box mb="2" className="flex gap-5 p-1 border border-gray-200 rounded bg-gray-50">
                        <Flex justify="between" align="center" >

                            <Text size="1" color="gray">Y Axis (Value)</Text>
                            <Select.Root
                                value={component.config.yAxisKeys?.[0] || ''}
                                onValueChange={(val) => onUpdate({ config: { ...component.config, yAxisKeys: [val] } })}
                            >
                                <Select.Trigger className="w-full" />
                                <Select.Content>
                                    {keys.map(k => <Select.Item key={k} value={k}>{k}</Select.Item>)}
                                </Select.Content>
                            </Select.Root>
                        </Flex>

                    </Box>
                </Box>
            )}

            <Box mt="4">
                <Flex justify="between" align="center" mb="2">
                    <Text size="2" weight="bold">Formulas</Text>
                    <Button size="1" variant="ghost" onClick={handleAddFormula}>
                        <Plus size={14} /> Add
                    </Button>
                </Flex>

                <Flex direction="column" gap="2">
                    {component.formulas?.map((f, i) => (
                        <Box key={i} className="p-2 border border-gray-200 rounded bg-gray-50">
                            <Flex gap="2" mb="2">
                                <Select.Root value={f.type} onValueChange={(v) => updateFormula(i, 'type', v)}>
                                    <Select.Trigger style={{ flex: 1 }} />
                                    <Select.Content>
                                        <Select.Item value="sum">Sum</Select.Item>
                                        <Select.Item value="average">Avg</Select.Item>
                                        <Select.Item value="min">Min</Select.Item>
                                        <Select.Item value="max">Max</Select.Item>
                                        <Select.Item value="variance">Var</Select.Item>
                                    </Select.Content>
                                </Select.Root>
                                <Select.Root value={f.key} onValueChange={(v) => updateFormula(i, 'key', v)}>
                                    <Select.Trigger style={{ flex: 1 }} />
                                    <Select.Content>
                                        {keys.map(k => <Select.Item key={k} value={k}>{k}</Select.Item>)}
                                    </Select.Content>
                                </Select.Root>
                            </Flex>
                            <Flex justify="between" align="center">
                                <TextField.Root
                                    size="1"
                                    value={f.label}
                                    onChange={(e) => updateFormula(i, 'label', e.target.value)}
                                    placeholder="Label"
                                />
                                <Button color="red" variant="ghost" size="1" onClick={() => removeFormula(i)}>
                                    <Trash2 size={12} />
                                </Button>
                            </Flex>
                        </Box>
                    ))}
                </Flex>
            </Box>
        </Box>
    );
}
