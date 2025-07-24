# Common Components

This folder contains all reusable UI components and shared functionality.

## Structure

- `ui/` - Shadcn UI components
- Shared components used across multiple modules

## Components

### Reusable Components
- `BulkActionsBar.tsx` - Bulk action toolbar
- `ColumnCustomizer.tsx` - Column visibility and ordering
- `ImportExportBar.tsx` - Import/export functionality
- `InlineEditCell.tsx` - Editable table cells

### UI Components
All Shadcn UI components are in the `ui/` folder.

## Usage

```typescript
import { Button } from '@/components/common/ui/button';
import { BulkActionsBar } from '@/components/common/BulkActionsBar';
```