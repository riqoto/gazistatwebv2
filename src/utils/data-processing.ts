
export function calculateStats(data: any[], key: string, type: 'sum' | 'average' | 'variance' | 'min' | 'max'): number {
    if (!data || data.length === 0) return 0;

    let count = 0;
    let sum = 0;
    let mean = 0;
    let squaredDifferenceSum = 0;
    let min = Infinity;
    let max = -Infinity;

    for (const item of data) {
        const value = Number(item[key]);
        if (!Number.isFinite(value)) continue;
        count++;
        sum += value;
        min = Math.min(min, value);
        max = Math.max(max, value);
        const delta = value - mean;
        mean += delta / count;
        squaredDifferenceSum += delta * (value - mean);
    }

    if (count === 0) return 0;
    if (type === 'sum') return sum;
    if (type === 'average') return mean;
    if (type === 'min') return min;
    if (type === 'max') return max;
    return squaredDifferenceSum / count;
}

export function getKeysFromData(data: any[]): string[] {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
}
