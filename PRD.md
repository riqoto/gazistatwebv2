Here is the Product Requirements Document (PRD) in **Markdown (.md)** format. This version explicitly structures the project around a **JSON-driven architecture** to satisfy the requirement that the final website layout must be translatable into a high-fidelity PDF.

---

```markdown
# Product Requirements Document: Gazistat Report Builder

| Metadata | Details |
| :--- | :--- |
| **Project Name** | Gazistat Report Builder |
| **Version** | 1.0.0 |
| **Status** | Draft |
| **Tech Stack** | React, Radix UI (Primitives + Themes), Tailwind CSS |

---

## 1. Executive Summary
**WebBuilder Studio** is a low-code dashboard builder that functions as an IDE for data presentation. It allows users to drag-and-drop components (charts, headers, metrics) onto a canvas, configure their styles, and publish a responsive website.

### **Critical Architecture Requirement: JSON Serialization for PDF**
**Context:** Users must be able to download a PDF version of the website they build.
**Constraint:** To ensure the PDF looks exactly like the web view, the application **must** use a "Schema-First" approach. The canvas state must be stored as a structured JSON object, not just raw HTML. This JSON will serve as the single source of truth for:
1.  Rendering the live React components in the DOM.
2.  Rendering the PDF document (via a parser that maps JSON nodes to PDF primitives).

---

## 2. Technical Stack & Constraints

### **Core Frameworks**
* **Framework:** Next.js / React
* **Styling:** Tailwind CSS (Custom Config)
* **UI Library (Strict):** **Radix UI Primitives** & **Radix Themes**.
    * *Constraint:* Do not build custom layout elements (e.g., `<div>`). You must use Radix `<Flex>`, `<Grid>`, `<Box>`, and `<Container>` for all structural layouts.
* **State Management:** Global store (Zustand or Redux) to manage the `LayoutJSON` object.

---

## 3. Data Schema (The "PDF-Ready" Structure)
The application must generate a JSON file similar to the structure below. This structure is required to map DOM elements to PDF generation engines.

```json
// Example Layout State
{
  "pageSettings": {
    "size": "A4",
    "orientation": "portrait",
    "margins": { "top": 20, "bottom": 20 }
  },
  "components": [
    {
      "id": "header-001",
      "type": "heading",
      "order": 0,
      "content": "Q3 Performance Overview",
      "styles": {
        "color": "#1a365c", // primary-900
        "fontSize": "32px",
        "fontFamily": "Inter"
      }
    },
    {
      "id": "chart-row-001",
      "type": "container-flex",
      "order": 1,
      "children": [
         { "type": "metric-card", "value": "$1,240,500", "label": "Total Revenue" },
         { "type": "metric-card", "value": "45,200", "label": "Active Users" }
      ]
    }
  ]
}

```

---

## 4. UI/UX Specifications

### **4.1. Global App Layout**

The app follows a standard "IDE" layout pattern:

* **Top Bar:** Navigation & Actions.
* **Left Sidebar:** Component Toolbox.
* **Center:** Interactive Canvas.
* **Right Sidebar:** Properties Panel.

### **4.2. Zone 1: Left Sidebar (Toolbox)**

* **Component:** `Radix ScrollArea` wrapped in `Radix Box`.
* **Functionality:**
* Lists available drag-and-drop elements.
* Categories: *Layout*, *Typography*, *Data Visualization*.


* **Interactions:**
* User drags an item -> App generates a "Ghost" preview -> User drops on Canvas.



### **4.3. Zone 2: Main Canvas (The Builder)**

* **Component:** `Radix Flex` (Center aligned) containing a `Radix Container` (The "Page").
* **Visuals:**
* Background: `secondary-50` (Light Gray).
* The "Page": White background, shadow, representing the A4/Web dimensions.


* **Interactions:**
* **Sortable List:** Elements can be dragged up/down to reorder (updates `order` index in JSON).
* **Selection:** Clicking an element highlights it with a blue border (`primary-500`) and opens the Right Sidebar.
* **Empty State:** If `components.length === 0`, show a dashed area: "Drag component here".



### **4.4. Zone 3: Right Sidebar (Properties)**

* **Component:** `Radix Tabs` (Tabs: Style, Data, Interactions).
* **Context Aware:** Content changes based on the currently selected element in the Canvas.
* **Controls:**
* **Style Tab:** Width, Height, Colors (Background/Text), Padding/Margin.
* **Data Tab:** Input fields for Text content, Chart data binding.



---

## 5. Design System & Theme Configuration

All styling must adhere to the following Tailwind configuration. This maps directly to Radix UI's theming capabilities.

```javascript
// tailwind.config.js extension
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a365c',
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#1a365c',
          950: '#102a43',
        },
        secondary: {
          DEFAULT: '#badde6',
          50: '#f5fbfc',
          100: '#e8f5f8',
          200: '#d6ecf2',
          300: '#badde6',
          400: '#9dccd9',
          500: '#7fb8c9',
          600: '#5f9db3',
          700: '#4a8199',
          800: '#3d6a7d',
          900: '#345868',
        },
        danger: {
          DEFAULT: '#DC2626',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        success: {
          DEFAULT: '#059669',
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#059669',
          600: '#047857',
          700: '#065F46',
        },
        warning: {
          DEFAULT: '#D97706',
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
        }
      }
    }
  }
}

```

---

## 6. Implementation Checklist

1. [ ] **Setup Radix Themes:** Wrap the application root in `<Theme>` utilizing the primary color palette.
2. [ ] **State Engine:** Create the `useBuilderStore` hook to handle the Layout JSON.
3. [ ] **Drag & Drop:** Implement a library (e.g., `dnd-kit`) to handle the sorting of blocks within the Layout JSON.
4. [ ] **PDF Mapper:** Create a utility function `generatePDF(layoutJSON)` that reads the state and produces a PDF file.

```

### Next Steps

Would you like me to define the **TypeScript Interface** for the `LayoutJSON` object so your developers know exactly how to structure the data for the PDF generator?

```