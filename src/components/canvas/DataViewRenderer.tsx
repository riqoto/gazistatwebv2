'use client';

import { Box, Flex, Text, Table } from '@radix-ui/themes';
import { DataViewComponent } from '@/types/schema';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateStats } from '@/utils/data-processing';

interface DataViewRendererProps {
    component: DataViewComponent;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function DataViewRenderer({ component }: DataViewRendererProps) {
    const { viewType, data, config, formulas } = component;

    const renderFormulas = () => {
        if (!formulas || formulas.length === 0) return null;

        return (
            <Flex gap="4" mt="4" wrap="wrap" className="border-t border-gray-100 pt-2">
                {formulas.map((f, i) => (
                    <Box key={i} className="bg-gray-50 px-3 py-1 rounded border border-gray-200">
                        <Text size="1" color="gray" weight="bold" className="uppercase">{f.label || f.type}</Text>
                        <Text size="3" weight="bold" className="block">
                            {calculateStats(data, f.key, f.type).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </Text>
                    </Box>
                ))}
            </Flex>
        );
    };

    const renderChart = () => {
        if (!data || data.length === 0) return <Text color="gray">No data available</Text>;

        const xAxisKey = config.xAxisKey || Object.keys(data[0])[0];
        const yAxisKeys = config.yAxisKeys?.length ? config.yAxisKeys : [Object.keys(data[0])[1]];

        switch (viewType) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={xAxisKey} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {yAxisKeys.map((key, index) => (
                                <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={xAxisKey} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {yAxisKeys.map((key, index) => (
                                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }: { name: string, percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey={yAxisKeys[0]} // Pie only supports one value series usually
                                nameKey={xAxisKey}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case 'table':
            default:
                const columns = config.columns || Object.keys(data[0] || {}).map(k => ({ key: k, label: k }));
                return (
                    <Box className="overflow-x-auto">
                        <Table.Root variant="surface">
                            <Table.Header>
                                <Table.Row>
                                    {columns.map(col => (
                                        <Table.ColumnHeaderCell key={col.key}>{col.label}</Table.ColumnHeaderCell>
                                    ))}
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {data.map((row, i) => (
                                    <Table.Row key={i}>
                                        {columns.map(col => (
                                            <Table.Cell key={col.key}>{row[col.key]}</Table.Cell>
                                        ))}
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                );
        }
    };

    return (
        <Box className="w-full h-full flex flex-col">
            <Box className="flex-1 min-h-[50px]">
                {renderChart()}
            </Box>
            {renderFormulas()}
        </Box>
    );
}
