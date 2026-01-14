'use client';

import { Box, Flex, Text, Table, Button } from '@radix-ui/themes';
import { DataViewComponent } from '@/types/schema';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateStats } from '@/utils/data-processing';
import { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
    createColumnHelper,
    SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface DataViewRendererProps {
    component: DataViewComponent;
}

const COLORS = [
    '#1f3864', // Gazi Navy 800 (Primary)
    '#4ba7cc', // Gazi Sky 500 (Secondary)
    '#334e68', // Gazi Navy 700
    '#7dd3fc', // Gazi Sky 300
    '#627d98', // Gazi Navy 500
    '#38bdf8', // Gazi Sky 400
];

export function DataViewRenderer({ component }: DataViewRendererProps) {
    const { viewType, data, config, formulas } = component;

    // Table configuration
    const tableData = useMemo(() => data || [], [data]);
    const columnHelper = createColumnHelper<any>();
    const [sorting, setSorting] = useState<SortingState>([]);

    const tableColumns = useMemo(() => {
        if (!data || data.length === 0) return [];

        const cols = config.columns || Object.keys(data[0] || {}).map(k => ({ key: k, label: k }));

        return [
            ...cols.map(col =>
                columnHelper.accessor(col.key, {
                    header: col.label,
                    cell: info => info.getValue(),
                })
            )
        ];
    }, [data, config.columns]);

    const table = useReactTable({
        data: tableData,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    const renderFormulas = () => {
        if (!formulas || formulas.length === 0) return null;

        return (
            <Flex gap="4" mt="4" wrap="wrap" className="border-t border-gray-200 pt-2">
                {formulas.map((f, i) => (
                    <Box key={i} className="bg-gray-50 px-3 py-1 rounded border border-gray-200">
                        <Text size="1" weight="bold" className="uppercase text-gray-400">{f.label || f.type}</Text>
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
                                label={({ name, percent }: any) => `${name ?? ''} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey={yAxisKeys[0]!} // Assert known because of fallback
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
                return (
                    <Box className="flex flex-col h-full">
                        <Box className="overflow-auto flex-1">
                            <Table.Root variant="surface" className="w-full ">
                                <Table.Header className="bg-[#1f3864]">
                                    {table.getHeaderGroups().map(headerGroup => (
                                        <Table.Row key={headerGroup.id}>
                                            {headerGroup.headers.map(header => (
                                                <Table.ColumnHeaderCell
                                                    className='text-white cursor-pointer hover:bg-[#334e68] transition-colors select-none'
                                                    key={header.id}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    <Flex align="center" gap="2">
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                        {{
                                                            asc: <ArrowUp size={14} />,
                                                            desc: <ArrowDown size={14} />,
                                                        }[header.column.getIsSorted() as string] ?? <ArrowUpDown size={14} className="opacity-50" />}
                                                    </Flex>
                                                </Table.ColumnHeaderCell>
                                            ))}
                                        </Table.Row>
                                    ))}
                                </Table.Header>
                                <Table.Body>
                                    {table.getRowModel().rows.map(row => (
                                        <Table.Row key={row.id}>
                                            {row.getVisibleCells().map(cell => (
                                                <Table.Cell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </Table.Cell>
                                            ))}
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        </Box>

                        {table.getPageCount() > 1 && (
                            <Flex gap="3" align="center" justify="center" mt="4" className="py-2 border-t border-gazi-navy-100">
                                <Button
                                    size="1"
                                    variant="soft"
                                    disabled={!table.getCanPreviousPage()}
                                    onClick={() => table.previousPage()}
                                >
                                    Previous
                                </Button>
                                <Text size="1">
                                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ({data.length} items)
                                </Text>
                                <Button
                                    size="1"
                                    variant="soft"
                                    disabled={!table.getCanNextPage()}
                                    onClick={() => table.nextPage()}
                                >
                                    Next
                                </Button>
                            </Flex>
                        )}
                    </Box>
                );
        }
    }; return (
        <Box className="w-full h-full flex flex-col">
            <Box className="flex-1 min-h-[50px]">
                {renderChart()}
            </Box>
            {renderFormulas()}
        </Box>
    );
}

