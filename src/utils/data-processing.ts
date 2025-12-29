
export function calculateStats(data: any[], key: string, type: 'sum' | 'average' | 'variance' | 'min' | 'max'): number {
    if (!data || data.length === 0) return 0;

    const values = data.map(item => Number(item[key])).filter(val => !isNaN(val));
    if (values.length === 0) return 0;

    const sum = values.reduce((a, b) => a + b, 0);

    switch (type) {
        case 'sum':
            return sum;
        case 'average':
            return sum / values.length;
        case 'min':
            return Math.min(...values);
        case 'max':
            return Math.max(...values);
        case 'variance':
            const mean = sum / values.length;
            const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
            const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
            return variance;
        default:
            return 0;
    }
}

export function getKeysFromData(data: any[]): string[] {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
}
