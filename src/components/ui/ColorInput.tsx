import React, { useMemo } from 'react';
import { Popover } from '@radix-ui/themes';
import { SketchPicker, ColorResult } from 'react-color';

interface ColorInputProps {
    value?: string;
    onChange: (value: string) => void;
}

const GAZI_COLORS = [
    '#1f3864', // Gazi Navy 800 (Primary)
    '#4ba7cc', // Gazi Sky 500 (Secondary)
    '#334e68', // Gazi Navy 700
    '#7dd3fc', // Gazi Sky 300
    '#627d98', // Gazi Navy 500
    '#38bdf8', // Gazi Sky 400
];

const GENERIC_COLORS = [
    '#000000', '#ffffff', '#e5e7eb', '#9ca3af', '#4b5563', // Grayscale
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', // Warm/Nature
    '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', // Cool
    '#d946ef', '#ec4899', '#f43f5e' // Pink/Red
];

export function ColorInput({ value, onChange }: ColorInputProps) {
    // ... existing hook ...
    const normalizedValue = useMemo(() => {
        if (!value || value === '') {
            return '#ffffff';
        }
        return value;
    }, [value]);

    const handleChange = (color: ColorResult) => {
        // ... existing handler ...
        if (color.rgb.a && color.rgb.a < 1) {
            onChange(`rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`);
        } else {
            onChange(color.hex);
        }
    };
    // ... existing display vars ...
    const displayBgColor = value || 'transparent';
    const showPattern = !value || value === 'transparent' || value === '';

    return (
        <Popover.Root>
            <Popover.Trigger>
                {/* ... existing trigger ... */}
                <div
                    style={{
                        position: 'relative',
                        width: 24,
                        height: 24,
                        flexShrink: 0,
                        cursor: 'pointer'
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: displayBgColor,
                            borderRadius: 4,
                            border: '1px solid #ddd',
                            backgroundImage: showPattern
                                ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                                : 'none',
                            backgroundSize: '10px 10px',
                            backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
                        }}
                    />
                </div>
            </Popover.Trigger>
            <Popover.Content style={{ padding: 0, width: 'auto', border: 'none' }}>
                <SketchPicker
                    color={normalizedValue}
                    onChange={handleChange}
                    disableAlpha={false}
                    presetColors={[...GAZI_COLORS, ...GENERIC_COLORS]}
                />
            </Popover.Content>
        </Popover.Root>
    );
}
