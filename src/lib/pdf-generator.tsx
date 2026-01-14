'use client';

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { LayoutJSON, ComponentSchema, HeadingComponent, TextComponent, MetricCardComponent, DataViewComponent } from '@/types/schema';

// Define PDF styles
// Font.register({
//     family: 'Inter',
//     fonts: [
//         { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.ttf' },
//         { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.ttf', fontWeight: 'bold' }
//     ]
// });

// Helper function to sanitize dimension values for PDF renderer
// The yoga layout engine only accepts numbers (pixels), not strings like "100%" or "auto"
const sanitizeDimension = (value: any): number | undefined => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        // Try to parse string numbers
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && isFinite(parsed)) return parsed;
    }
    // Return undefined for invalid values (strings like "100%", "auto", etc.)
    return undefined;
};

const styles = StyleSheet.create({
    page: {
        backgroundColor: '#FFFFFF',
        padding: 30, // Default padding, overrides from schema later
    },
    heading: {
        fontSize: 24,
        marginBottom: 10,
        color: '#1a365c',
    },
    text: {
        fontSize: 12,
        marginBottom: 10,
        color: '#171717',
    },
    metricCard: {
        padding: 10,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#e5e7eb',
        borderRadius: 4,
        marginBottom: 10,
        backgroundColor: '#ffffff',
    },
    metricLabel: {
        fontSize: 10,
        color: '#6b7280',
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    containerFlex: {
        flexDirection: 'column',
        padding: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#e5e7eb',
        marginBottom: 10,
    },
});

const ComponentRendererPDF = ({ component }: { component: ComponentSchema }) => {
    const stylesKey = component.styles || {};
    const commonStyles: any = {
        // Spacing
        paddingTop: stylesKey.paddingTop,
        paddingRight: stylesKey.paddingRight,
        paddingBottom: stylesKey.paddingBottom,
        paddingLeft: stylesKey.paddingLeft,
        marginTop: stylesKey.marginTop,
        marginBottom: stylesKey.marginBottom,

        // Typography
        fontSize: stylesKey.fontSize,
        fontWeight: stylesKey.fontWeight,
        textAlign: stylesKey.textAlign,
        color: stylesKey.color,

        // Appearance
        backgroundColor: stylesKey.backgroundColor,
        borderColor: stylesKey.borderColor,
        borderWidth: stylesKey.borderWidth,
        borderStyle: stylesKey.borderStyle,
        borderRadius: stylesKey.borderRadius,

        // Layout - sanitize dimensions to prevent yoga layout errors
        width: sanitizeDimension(stylesKey.width),
        height: sanitizeDimension(stylesKey.height),
    };

    // Filter out undefined values to prevent PDF renderer errors
    const sanitizedStyles = Object.fromEntries(
        Object.entries(commonStyles).filter(([_, value]) => value !== undefined)
    );



    switch (component.type) {
        case 'heading':
            return <Text style={{ ...styles.heading, ...sanitizedStyles }}>{(component as HeadingComponent).content}</Text>;
        case 'text':
            return <Text style={{ ...styles.text, ...sanitizedStyles }}>{(component as TextComponent).content}</Text>;
        case 'metric-card':
            const card = component as MetricCardComponent;
            return (
                <View style={{ ...styles.metricCard, ...sanitizedStyles }}>
                    <Text style={styles.metricLabel}>{card.label}</Text>
                    <Text style={styles.metricValue}>{card.value}</Text>
                    {card.trend && <Text>{card.trend.value}</Text>}
                </View>
            );
        case 'container-flex':
            const flexChildren = (component as any).children || [];
            return (
                <View style={{
                    ...styles.containerFlex,
                    ...sanitizedStyles,
                    flexDirection: (component as any).direction || 'column',
                    gap: (component as any).gap || 0,
                    alignItems: (component as any).alignItems || 'stretch',
                    justifyContent: (component as any).justifyContent || 'flex-start'
                }}>
                    {flexChildren.map((child: ComponentSchema) => (
                        <ComponentRendererPDF key={child.id} component={child} />
                    ))}
                </View>
            );
        case 'row':
            const rowChildren = (component as any).children || [];
            return (
                <View style={{
                    flexDirection: 'row',
                    gap: (component as any).gap || 0,
                    alignItems: (component as any).alignItems || 'center',
                    justifyContent: (component as any).justifyContent || 'flex-start',
                    ...sanitizedStyles
                }}>
                    {rowChildren.map((child: ComponentSchema) => (
                        <ComponentRendererPDF key={child.id} component={child} />
                    ))}
                </View>
            );
        case 'column':
            const colChildren = (component as any).children || [];
            return (
                <View style={{
                    flexDirection: 'column',
                    gap: (component as any).gap || 0,
                    alignItems: (component as any).alignItems || 'stretch',
                    ...sanitizedStyles
                }}>
                    {colChildren.map((child: ComponentSchema) => (
                        <ComponentRendererPDF key={child.id} component={child} />
                    ))}
                </View>
            );
        case 'alert':
            const variant = (component as any).variant || 'info';
            let bg = '#eff6ff'; // blue-50
            let border = '#bfdbfe'; // blue-200
            let text = '#1e3a8a'; // blue-900

            if (variant === 'success') {
                bg = '#f0fdf4'; // green-50
                border = '#bbf7d0'; // green-200
                text = '#14532d'; // green-900
            } else if (variant === 'warning') {
                bg = '#fffbeb'; // amber-50
                border = '#fde68a'; // amber-200
                text = '#78350f'; // amber-900
            } else if (variant === 'error') {
                bg = '#fef2f2'; // red-50
                border = '#fecaca'; // red-200
                text = '#7f1d1d'; // red-900
            }

            return (
                <View style={{
                    padding: 10,
                    backgroundColor: bg,
                    borderWidth: 1,
                    borderColor: border,
                    borderRadius: 4,
                    marginBottom: 10,
                    ...sanitizedStyles
                }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: text, marginBottom: 4 }}>
                        {(component as any).title || variant.toUpperCase()}
                    </Text>
                    <Text style={{ fontSize: 10, color: text }}>
                        {(component as any).content}
                    </Text>
                </View>
            );
        case 'image':
            const imgSrc = (component as any).src;

            // Validate image source - @react-pdf/renderer only supports HTTP(S) URLs and data URIs
            // It does NOT support blob URLs
            const isValidImageSrc = imgSrc && (
                imgSrc.startsWith('http://') ||
                imgSrc.startsWith('https://') ||
                imgSrc.startsWith('data:')
            );

            if (!isValidImageSrc) {
                // Skip rendering invalid image sources (e.g., blob URLs)
                return (
                    <View style={{
                        padding: 10,
                        backgroundColor: '#fef2f2',
                        borderWidth: 1,
                        borderColor: '#fecaca',
                        borderRadius: 4,
                        marginTop: 10,
                        marginBottom: 10,
                        ...sanitizedStyles
                    }}>
                        <Text style={{ fontSize: 10, color: '#991b1b' }}>
                            Image not available in PDF. Use HTTP(S) URLs or data URIs (base64).
                        </Text>
                    </View>
                );
            }

            return (
                /* @ts-ignore */
                <Image
                    src={imgSrc}
                    style={{
                        marginTop: 10,
                        marginBottom: 10,
                        ...sanitizedStyles,
                        // Explicitly override width/height if set in sanitizedStyles to ensure it takes precedence or fallback to specific props
                        width: (sanitizedStyles.width as number | undefined) || sanitizeDimension((component as any).width),
                        height: (sanitizedStyles.height as number | undefined) || sanitizeDimension((component as any).height),
                    }}
                />
            );
        case 'divider':
            return (
                <View
                    style={{
                        borderBottomWidth: sanitizeDimension((component as any).thickness) || 1,
                        borderBottomColor: (sanitizedStyles.borderColor as string) || '#e5e7eb',
                        borderBottomStyle: (sanitizedStyles.borderStyle as any) || 'solid',
                        marginBottom: (sanitizedStyles.marginBottom as number) ?? 10,
                        marginTop: (sanitizedStyles.marginTop as number) ?? 10,
                    }}
                />
            );
        case 'spacer':
            return <View style={{ height: sanitizeDimension((component as any).height), ...sanitizedStyles }} />;
        case 'data-view':
            const dataV = component as DataViewComponent;
            const viewType = dataV.viewType || 'table';

            if (viewType === 'table') {
                const columns = dataV.config.columns || Object.keys(dataV.data[0] || {}).map(k => ({ key: k, label: k }));
                return (
                    <View style={{ ...sanitizedStyles, marginBottom: 10, borderStyle: 'solid', borderWidth: 1, borderColor: '#e5e7eb' }}>
                        {/* Header */}
                        <View style={{ flexDirection: 'row', backgroundColor: '#f9fafb', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                            {columns.map((col: any, i: number) => (
                                <View key={i} style={{ flex: 1, padding: 5, borderRightWidth: i === columns.length - 1 ? 0 : 1, borderRightColor: '#e5e7eb' }}>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#374151' }}>{col.label}</Text>
                                </View>
                            ))}
                        </View>
                        {/* Rows */}
                        {dataV.data.map((row: any, i: number) => (
                            <View key={i} style={{ flexDirection: 'row', borderBottomWidth: i === dataV.data.length - 1 ? 0 : 1, borderBottomColor: '#e5e7eb' }}>
                                {columns.map((col: any, j: number) => (
                                    <View key={j} style={{ flex: 1, padding: 5, borderRightWidth: j === columns.length - 1 ? 0 : 1, borderRightColor: '#e5e7eb' }}>
                                        <Text style={{ fontSize: 10, color: '#4b5563' }}>{String(row[col.key] || '')}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                );
            } else if (viewType === 'bar') {
                // Simple Bar Chart Implementation
                if (!dataV.data || dataV.data.length === 0) return null;

                const xAxisKey = dataV.config.xAxisKey || Object.keys(dataV.data[0])[0];
                const yAxisKey = dataV.config.yAxisKeys?.[0] || Object.keys(dataV.data[0])[1];
                const maxValue = Math.max(...dataV.data.map((d: any) => Number(d[yAxisKey]) || 0));

                // Prevent division by zero if maxValue is 0
                const safeMax = maxValue > 0 ? maxValue : 1;

                const barWidth = 30;
                const chartHeight = 150;

                return (
                    <View style={{ ...sanitizedStyles, marginBottom: 10, padding: 10, borderWidth: 1, borderStyle: 'solid', borderColor: '#e5e7eb' }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>{dataV.title || 'Bar Chart'}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: chartHeight, gap: 10 }}>
                            {dataV.data.map((d: any, i: number) => {
                                const val = Number(d[yAxisKey]) || 0;
                                const height = (val / safeMax) * (chartHeight - 20); // Leave room for labels
                                return (
                                    <View key={i} style={{ alignItems: 'center', width: barWidth }}>
                                        <View style={{ width: '100%', height, backgroundColor: '#3b82f6' }} />
                                        <Text style={{ fontSize: 8, marginTop: 4, textAlign: 'center' }}>{String(d[xAxisKey]).substring(0, 5)}</Text>
                                    </View>
                                )
                            })}
                        </View>
                    </View>
                );
            } else {
                return (
                    <View style={{ ...sanitizedStyles, marginBottom: 10, padding: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: '#e5e7eb' }}>
                        <Text>Chart type {viewType} not fully implemented in PDF.</Text>
                    </View>
                );
            }
        default:
            return null;
    }
};

export const PDFDocument = ({ layout }: { layout: LayoutJSON }) => {
    return (
        <Document>
            {layout.pages?.map((page, index) => (
                <Page
                    key={page.id || index}
                    size="A4"
                    style={{
                        ...styles.page,
                        paddingTop: layout.pageSettings.margins.top,
                        paddingBottom: layout.pageSettings.margins.bottom,
                        paddingLeft: layout.pageSettings.margins.left,
                        paddingRight: layout.pageSettings.margins.right,
                        flexDirection: 'column',
                    }}
                >
                    {page.components.map((component) => (
                        <ComponentRendererPDF key={component.id} component={component} />
                    ))}
                    {page.components.length === 0 && (
                        <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 200 }}>
                            {page.name || `Page ${index + 1}`} (Boş)
                        </Text>
                    )}
                </Page>
            ))}
        </Document>
    );
};
