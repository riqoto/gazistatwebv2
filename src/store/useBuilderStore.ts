import { create } from 'zustand';
import { LayoutJSON, ComponentSchema, Page } from '@/types/schema';
import { persist, createJSONStorage } from 'zustand/middleware';

interface BuilderState {
    layout: LayoutJSON;
    reportId: string;
    reportOwnerId: string | null;
    activePageId: string;
    selectedComponentIds: string[];

    // Page Actions
    addPage: () => void;
    appendPages: (pages: Array<Omit<Page, 'id'>>) => void;
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
    reorderComponents: (activeId: string, overId: string, position?: 'before' | 'after') => void;
    moveComponent: (id: string, direction: -1 | 1) => void;
    updateReportTitle: (title: string) => void;
    replaceLayout: (layout: LayoutJSON) => void;
    setReportId: (id: string) => void;
    setReportOwnerId: (id: string | null) => void;
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

const moveComponentRecursive = (
    components: ComponentSchema[],
    id: string,
    direction: -1 | 1
): { components: ComponentSchema[]; moved: boolean } => {
    const index = components.findIndex(component => component.id === id);
    if (index !== -1) {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= components.length) return { components, moved: false };

        const reordered = [...components];
        [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
        return {
            components: reordered.map((component, order) => ({ ...component, order })),
            moved: true,
        };
    }

    for (let parentIndex = 0; parentIndex < components.length; parentIndex += 1) {
        const component = components[parentIndex];
        if (!('children' in component) || !Array.isArray(component.children)) continue;

        const result = moveComponentRecursive(component.children, id, direction);
        if (result.moved) {
            const updated = [...components];
            updated[parentIndex] = { ...component, children: result.components };
            return { components: updated, moved: true };
        }
    }

    return { components, moved: false };
};

const INITIAL_PAGE_ID = 'sayfa-1';

export const useBuilderStore = create<BuilderState>()(
    persist(
        (set, get) => ({
            reportId: generateId(),
            reportOwnerId: null,
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

            appendPages: (importedPages) => set((state) => {
                if (importedPages.length === 0) return state;
                const pages = importedPages.map((page, index) => ({
                    ...page,
                    id: generateId(),
                    name: page.name || `Imported page ${index + 1}`,
                }));
                return {
                    layout: { ...state.layout, pages: [...state.layout.pages, ...pages] },
                    activePageId: pages[0].id,
                    selectedComponentIds: [],
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

            setReportId: (reportId) => set({ reportId }),

            setReportOwnerId: (reportOwnerId) => set({ reportOwnerId }),

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

            reorderComponents: (activeId, overId, position = 'before') =>
                set((state) => {
                    const reorderRecursive = (components: ComponentSchema[]): { components: ComponentSchema[]; moved: boolean } => {
                        const activeIndex = components.findIndex((component) => component.id === activeId);
                        const overIndex = components.findIndex((component) => component.id === overId);

                        if (activeIndex !== -1 && overIndex !== -1) {
                            const reordered = [...components];
                            const [movedComponent] = reordered.splice(activeIndex, 1);
                            const adjustedOverIndex = overIndex - (activeIndex < overIndex ? 1 : 0);
                            const insertionIndex = adjustedOverIndex + (position === 'after' ? 1 : 0);
                            reordered.splice(insertionIndex, 0, movedComponent);
                            return {
                                components: reordered.map((component, index) => ({ ...component, order: index })),
                                moved: true,
                            };
                        }

                        for (let index = 0; index < components.length; index += 1) {
                            const component = components[index];
                            if (!('children' in component) || !Array.isArray(component.children)) continue;
                            const result = reorderRecursive(component.children);
                            if (result.moved) {
                                const updated = [...components];
                                updated[index] = { ...component, children: result.components };
                                return { components: updated, moved: true };
                            }
                        }

                        return { components, moved: false };
                    };

                    const pages = state.layout.pages.map(page => {
                        const result = reorderRecursive(page.components);
                        return result.moved ? { ...page, components: result.components } : page;
                    });

                    return { layout: { ...state.layout, pages } };
                }),

            moveComponent: (id, direction) =>
                set((state) => {
                    const pages = state.layout.pages.map(page => {
                        const result = moveComponentRecursive(page.components, id, direction);
                        return result.moved ? { ...page, components: result.components } : page;
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
                reportId: generateId(),
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
            partialize: (state) => ({ layout: state.layout, reportId: state.reportId, reportOwnerId: state.reportOwnerId }),
            version: 2,
            migrate: (persistedState: unknown, version) => {
                const state = typeof persistedState === 'object' && persistedState !== null
                    ? persistedState as Record<string, unknown>
                    : {};
                let migratedState = state;
                if (version === 0) {
                    const storedLayout = state.layout;
                    const oldLayout = typeof storedLayout === 'object' && storedLayout !== null
                        ? storedLayout as Record<string, unknown>
                        : state;
                    if (Array.isArray(oldLayout.components) && !Array.isArray(oldLayout.pages)) {
                        migratedState = {
                            ...state,
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
                return {
                    ...migratedState,
                    reportId: typeof migratedState.reportId === 'string' ? migratedState.reportId : generateId(),
                    reportOwnerId: typeof migratedState.reportOwnerId === 'string' ? migratedState.reportOwnerId : null,
                } as BuilderState;
            },
        }
    )
);
