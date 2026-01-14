import { create } from 'zustand';
import { LayoutJSON, ComponentSchema, Page } from '@/types/schema';
import { arrayMove } from '@dnd-kit/sortable';
import { persist, createJSONStorage } from 'zustand/middleware';

interface BuilderState {
    layout: LayoutJSON;
    activePageId: string;
    selectedComponentIds: string[];

    // Page Actions
    addPage: () => void;
    removePage: (id: string) => void;
    setActivePage: (id: string) => void;

    // Component Actions
    addComponent: (component: ComponentSchema) => void;
    insertComponentAt: (component: ComponentSchema, index?: number, pageId?: string) => void;
    removeComponent: (id: string) => void;
    updateComponent: (id: string, updates: Partial<ComponentSchema>) => void;
    selectComponent: (id: string | null) => void;
    selectComponents: (ids: string[]) => void;
    toggleSelection: (id: string) => void;
    reorderComponents: (activeId: string, overId: string) => void;
    updateReportTitle: (title: string) => void;
    replaceLayout: (layout: LayoutJSON) => void;
    addComponentToParent: (parentId: string, component: ComponentSchema) => void;
    removeComponents: (ids: string[]) => void;
    moveComponentToPage: (componentId: string, fromPageId: string, toPageId: string, newIndex: number) => void;
    resetLayout: () => void;
}

// Helpers
const generateId = () => Math.random().toString(36).substring(2, 9);

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

// Recursive helper to remove multiple components deeply
const removeComponentsRecursive = (components: ComponentSchema[], ids: string[]): ComponentSchema[] => {
    return components.filter(component => !ids.includes(component.id)).map(component => {
        if ('children' in component && Array.isArray(component.children)) {
            return {
                ...component,
                children: removeComponentsRecursive(component.children, ids)
            };
        }
        return component;
    }) as ComponentSchema[];
};

const INITIAL_PAGE_ID = 'sayfa-1';

export const useBuilderStore = create<BuilderState>()(
    persist(
        (set, get) => ({
            layout: {
                title: 'Untitled Report',
                pageSettings: {
                    size: 'A4',
                    orientation: 'portrait',
                    margins: { top: 20, bottom: 20, left: 20, right: 20 },
                },
                pages: [
                    {
                        id: INITIAL_PAGE_ID,
                        name: 'Sayfa 1',
                        components: [],
                    }
                ]
            },
            activePageId: INITIAL_PAGE_ID,
            selectedComponentIds: [],

            // Page Actions
            addPage: () => set((state) => {
                const newPageId = generateId();
                const newPage: Page = {
                    id: newPageId,
                    name: `Sayfa ${state.layout.pages.length + 1}`,
                    components: []
                };
                return {
                    layout: {
                        ...state.layout,
                        pages: [...state.layout.pages, newPage]
                    },
                    activePageId: newPageId
                };
            }),

            removePage: (id) => set((state) => {
                if (state.layout.pages.length <= 1) return state; // Don't delete last page
                const newPages = state.layout.pages.filter(p => p.id !== id);
                return {
                    layout: { ...state.layout, pages: newPages },
                    activePageId: state.activePageId === id ? newPages[0].id : state.activePageId
                };
            }),

            setActivePage: (id) => set({ activePageId: id }),

            // Component Actions
            replaceLayout: (layout) => {
                // Determine active page
                const firstPageId = layout.pages?.[0]?.id || INITIAL_PAGE_ID;
                set({ layout, activePageId: firstPageId });
            },

            updateReportTitle: (title) =>
                set((state) => ({
                    layout: { ...state.layout, title },
                })),

            addComponent: (component) =>
                set((state) => {
                    const pages = state.layout.pages.map(page => {
                        if (page.id === state.activePageId) {
                            return {
                                ...page,
                                components: [...page.components, component]
                            };
                        }
                        return page;
                    });
                    return { layout: { ...state.layout, pages } };
                }),

            insertComponentAt: (component, index, pageId) =>
                set((state) => {
                    const targetPageId = pageId || state.activePageId;
                    const pages = state.layout.pages.map(page => {
                        if (page.id === targetPageId) {
                            const newComponents = [...page.components];
                            if (index === undefined || index >= newComponents.length) {
                                newComponents.push(component);
                            } else {
                                newComponents.splice(index, 0, component);
                            }
                            // Update order
                            const reordered = newComponents.map((c, idx) => ({ ...c, order: idx }));
                            return { ...page, components: reordered };
                        }
                        return page;
                    });
                    return { layout: { ...state.layout, pages } };
                }),

            removeComponent: (id) =>
                set((state) => {
                    const pages = state.layout.pages.map(page => ({
                        ...page,
                        components: removeComponentRecursive(page.components, id)
                    }));
                    return {
                        layout: { ...state.layout, pages },
                        selectedComponentIds: state.selectedComponentIds.filter(sid => sid !== id),
                    };
                }),

            removeComponents: (ids) =>
                set((state) => {
                    const pages = state.layout.pages.map(page => ({
                        ...page,
                        components: removeComponentsRecursive(page.components, ids)
                    }));
                    return {
                        layout: { ...state.layout, pages },
                        selectedComponentIds: state.selectedComponentIds.filter(sid => !ids.includes(sid)),
                    };
                }),

            updateComponent: (id, updates) =>
                set((state) => {
                    const pages = state.layout.pages.map(page => ({
                        ...page,
                        components: updateComponentRecursive(page.components, id, updates)
                    }));
                    return { layout: { ...state.layout, pages } };
                }),

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
                set((state) => {
                    const pages = state.layout.pages.map(page => ({
                        ...page,
                        components: addComponentToParentRecursive(page.components, parentId, component)
                    }));
                    return { layout: { ...state.layout, pages } };
                }),

            reorderComponents: (activeId, overId) =>
                set((state) => {
                    const pages = state.layout.pages.map(page => {
                        const oldIndex = page.components.findIndex((c) => c.id === activeId);
                        const newIndex = page.components.findIndex((c) => c.id === overId);

                        if (oldIndex !== -1 && newIndex !== -1) {
                            const newComponents = arrayMove(page.components, oldIndex, newIndex).map(
                                (c, index) => ({ ...c, order: index })
                            );
                            return { ...page, components: newComponents };
                        }
                        return page;
                    });

                    return { layout: { ...state.layout, pages } };
                }),

            moveComponentToPage: (componentId, fromPageId, toPageId, newIndex) => set((state) => {
                const sourcePage = state.layout.pages.find(p => p.id === fromPageId);
                const targetPage = state.layout.pages.find(p => p.id === toPageId);

                if (!sourcePage || !targetPage) return state;

                const component = sourcePage.components.find(c => c.id === componentId);
                if (!component) return state;

                const newSourceComponents = sourcePage.components.filter(c => c.id !== componentId);

                const newTargetComponents = [...targetPage.components];
                newTargetComponents.splice(newIndex, 0, component);

                const pages = state.layout.pages.map(p => {
                    if (p.id === fromPageId) return { ...p, components: newSourceComponents };
                    if (p.id === toPageId) return { ...p, components: newTargetComponents };
                    return p;
                });

                return { layout: { ...state.layout, pages } };
            }),

            resetLayout: () => set({
                layout: {
                    title: 'Untitled Report',
                    pageSettings: {
                        size: 'A4',
                        orientation: 'portrait',
                        margins: { top: 20, bottom: 20, left: 20, right: 20 },
                    },
                    pages: [
                        {
                            id: INITIAL_PAGE_ID,
                            name: 'Sayfa 1',
                            components: [],
                        }
                    ]
                },
                activePageId: INITIAL_PAGE_ID,
                selectedComponentIds: []
            }),
        }),
        {
            name: 'gazistat-builder-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ layout: state.layout }),
            version: 1,
            migrate: (persistedState: any, version) => {
                if (version === 0) {
                    const oldLayout = persistedState.layout || persistedState;
                    if (oldLayout && oldLayout.components && !oldLayout.pages) {
                        return {
                            ...persistedState,
                            layout: {
                                ...oldLayout,
                                pages: [
                                    {
                                        id: 'sayfa-1',
                                        name: 'Sayfa 1',
                                        components: oldLayout.components
                                    }
                                ],
                                components: undefined
                            }
                        };
                    }
                }
                return persistedState as BuilderState;
            },
        }
    )
);
