import React from 'react';

interface ColorInputProps {
    value?: string;
    onChange: (value: string) => void;
}

export function ColorInput({ value, onChange }: ColorInputProps) {
    return (
        <div style={{ position: 'relative', width: 24, height: 24, flexShrink: 0 }}>
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: value || 'transparent',
                    borderRadius: 4,
                    border: '1px solid #ddd',
                    backgroundImage: !value || value === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                    backgroundSize: '10px 10px',
                    backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
                }}
            />
            <input
                type="color"
                value={value && value.startsWith('#') ? value : '#ffffff'}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    padding: 0,
                    margin: 0,
                    border: 'none',
                    appearance: 'none'
                }}
            />
        </div>
    );
}
