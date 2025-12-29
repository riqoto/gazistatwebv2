import { create } from 'zustand';
import { LayoutJSON, ComponentSchema } from '@/types/schema';
import { arrayMove } from '@dnd-kit/sortable';
import { persist, createJSONStorage } from 'zustand/middleware';

interface BuilderState {
    layout: LayoutJSON;
    selectedComponentIds: string[];

    // Actions
    addComponent: (component: ComponentSchema) => void;
    insertComponentAt: (component: ComponentSchema, index?: number) => void;
    removeComponent: (id: string) => void;
    updateComponent: (id: string, updates: Partial<ComponentSchema>) => void;
    selectComponent: (id: string | null) => void; // Keeping for backward compat, wraps selectComponents
    selectComponents: (ids: string[]) => void;
    toggleSelection: (id: string) => void;
    reorderComponents: (activeId: string, overId: string) => void;
    updateReportTitle: (title: string) => void;
    replaceLayout: (layout: LayoutJSON) => void;
    addComponentToParent: (parentId: string, component: ComponentSchema) => void;
}

// Recursive helper to find parent and add child
const addComponentToParentRecursive = (components: ComponentSchema[], parentId: string, newComponent: ComponentSchema): ComponentSchema[] => {
    return components.map(component => {
        if (component.id === parentId) {
            if ('children' in component) {
                return {
                    ...component,
                    children: [...(component.children || []), newComponent]
                };
            }
            return component;
        }
        if ('children' in component && Array.isArray(component.children)) {
            return {
                ...component,
                children: addComponentToParentRecursive(component.children, parentId, newComponent)
            };
        }
        return component;
    }) as ComponentSchema[];
};

// Recursive helper to update a component deeply
const updateComponentRecursive = (components: ComponentSchema[], id: string, updates: Partial<ComponentSchema>): ComponentSchema[] => {
    return components.map(component => {
        if (component.id === id) {
            return { ...component, ...updates } as ComponentSchema;
        }
        if ('children' in component && Array.isArray(component.children)) {
            return {
                ...component,
                children: updateComponentRecursive(component.children, id, updates)
            };
        }
        return component;
    }) as ComponentSchema[];
};

// Recursive helper to remove a component deeply
const removeComponentRecursive = (components: ComponentSchema[], id: string): ComponentSchema[] => {
    return components.filter(component => component.id !== id).map(component => {
        if ('children' in component && Array.isArray(component.children)) {
            return {
                ...component,
                children: removeComponentRecursive(component.children, id)
            };
        }
        return component;
    }) as ComponentSchema[];
};

export const useBuilderStore = create<BuilderState>()(
    persist(
        (set) => ({
            layout: {
                title: 'Untitled Report',
                pageSettings: {
                    size: 'A4',
                    orientation: 'portrait',
                    margins: { top: 20, bottom: 20, left: 20, right: 20 },
                },
                components: [],
            },
            selectedComponentIds: [],

            replaceLayout: (layout) => set({ layout }),

            updateReportTitle: (title) =>
                set((state) => ({
                    layout: { ...state.layout, title },
                })),

            addComponent: (component) =>
                set((state) => ({
                    layout: {
                        ...state.layout,
                        components: [...state.layout.components, component],
                    },
                })),

            insertComponentAt: (component, index) =>
                set((state) => {
                    const newComponents = [...state.layout.components];

                    // If no index provided, append to end
                    if (index === undefined || index >= newComponents.length) {
                        newComponents.push(component);
                    } else {
                        // Insert at specific position
                        newComponents.splice(index, 0, component);
                    }

                    // Update order property for all components
                    const reorderedComponents = newComponents.map((c, idx) => ({
                        ...c,
                        order: idx,
                    }));

                    return {
                        layout: {
                            ...state.layout,
                            components: reorderedComponents,
                        },
                    };
                }),

            removeComponent: (id) =>
                set((state) => ({
                    layout: {
                        ...state.layout,
                        components: removeComponentRecursive(state.layout.components, id),
                    },
                    selectedComponentIds: state.selectedComponentIds.filter(sid => sid !== id),
                })),

            updateComponent: (id, updates) =>
                set((state) => ({
                    layout: {
                        ...state.layout,
                        components: updateComponentRecursive(state.layout.components, id, updates),
                    },
                })),

            selectComponent: (id) => set({ selectedComponentIds: id ? [id] : [] }),

            selectComponents: (ids) => set({ selectedComponentIds: ids }),

            toggleSelection: (id) => set((state) => {
                const isSelected = state.selectedComponentIds.includes(id);
                if (isSelected) {
                    return { selectedComponentIds: state.selectedComponentIds.filter(sid => sid !== id) };
                } else {
                    return { selectedComponentIds: [...state.selectedComponentIds, id] };
                }
            }),

            addComponentToParent: (parentId, component) =>
                set((state) => ({
                    layout: {
                        ...state.layout,
                        components: addComponentToParentRecursive(state.layout.components, parentId, component),
                    },
                })),

            reorderComponents: (activeId, overId) =>
                set((state) => {
                    const oldIndex = state.layout.components.findIndex((c) => c.id === activeId);
                    const newIndex = state.layout.components.findIndex((c) => c.id === overId);

                    if (oldIndex === -1 || newIndex === -1) return state;

                    const newComponents = arrayMove(state.layout.components, oldIndex, newIndex).map(
                        (c, index) => ({ ...c, order: index })
                    );

                    return {
                        layout: {
                            ...state.layout,
                            components: newComponents,
                        },
                    };
                }),
        }),
        {
            name: 'gazistat-builder-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ layout: state.layout }), // Only persist layout
        }
    )
);
