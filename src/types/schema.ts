
export type ComponentType =
    | 'heading'
    | 'text'
    | 'metric-card'
    | 'container-flex'
    | 'row'
    | 'column'
    | 'image'
    | 'divider'
    | 'spacer'
    | 'alert'
    | 'data-view';

export interface ComponentStyles {
    // Typography
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '500' | '600' | '700';
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    color?: string;
    backgroundColor?: string;

    // Spacing
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    marginTop?: number;
    marginBottom?: number;

    // Appearance
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: 'solid' | 'dashed' | 'dotted';
    borderRadius?: number;

    // Layout
    width?: number | string;
    height?: number | string;

    // Helpers
    [key: string]: any;
}

export interface BaseComponent {
    id: string;
    type: ComponentType;
    order: number;
    styles?: ComponentStyles;
}

export interface HeadingComponent extends BaseComponent {
    type: 'heading';
    content: string;
}

export interface TextComponent extends BaseComponent {
    type: 'text';
    content: string;
}

export interface MetricCardComponent extends BaseComponent {
    type: 'metric-card';
    label: string;
    value: string;
    trend?: {
        value: string;
        direction: 'up' | 'down' | 'neutral';
    };
}

export interface ContainerFlexComponent extends BaseComponent {
    type: 'container-flex';
    children: ComponentSchema[];
    direction?: 'row' | 'column';
    alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
    justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
    gap?: number;
}

export interface ImageComponent extends BaseComponent {
    type: 'image';
    src: string;
    alt?: string;
    width?: number;
    height?: number;
}

export interface DividerComponent extends BaseComponent {
    type: 'divider';
    thickness: number;
}

export interface SpacerComponent extends BaseComponent {
    type: 'spacer';
    height: number;
}

export interface DataViewComponent extends BaseComponent {
    type: 'data-view';
    viewType: 'table' | 'bar' | 'line' | 'pie';
    title?: string;
    data: any[]; // Array of objects
    config: {
        xAxisKey?: string;
        yAxisKeys?: string[];
        seriesColors?: string[];
        columns?: { key: string; label: string }[];
    };
    formulas?: Array<{
        type: 'average' | 'sum' | 'variance' | 'min' | 'max';
        key: string;
        label?: string;
    }>;
}

export interface RowComponent extends BaseComponent {
    type: 'row';
    children: ComponentSchema[];
    gap?: number;
    alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
    justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
}

export interface ColumnComponent extends BaseComponent {
    type: 'column';
    children: ComponentSchema[];
    gap?: number;
    alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
}

export interface AlertComponent extends BaseComponent {
    type: 'alert';
    variant: 'info' | 'success' | 'warning' | 'error';
    title?: string;
    content: string;
}

export type ComponentSchema =
    | HeadingComponent
    | TextComponent
    | MetricCardComponent
    | ContainerFlexComponent
    | RowComponent
    | ColumnComponent
    | ImageComponent
    | DividerComponent
    | SpacerComponent
    | AlertComponent
    | DataViewComponent;

export interface PageSettings {
    size: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; bottom: number; left: number; right: number };
}

export interface PageStyles {
    backgroundColor?: string;
    backgroundImage?: string;
    padding?: number;
}

export interface Page {
    id: string;
    name: string;
    styles?: PageStyles;
    components: ComponentSchema[];
}

export interface LayoutJSON {
    title: string;
    pageSettings: PageSettings;
    pages: Page[];
}
