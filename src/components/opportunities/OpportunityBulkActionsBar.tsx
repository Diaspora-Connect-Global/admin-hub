import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X, ToggleRight, XCircle, Archive, Download, ChevronDown } from "lucide-react";

interface OpportunityBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkPublish: () => void;
  onBulkClose: () => void;
  onBulkArchive: () => void;
  onBulkExport: () => void;
}

export function OpportunityBulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkPublish,
  onBulkClose,
  onBulkArchive,
  onBulkExport,
}: OpportunityBulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
        <span className="text-sm font-medium">
          {selectedCount} opportunit{selectedCount > 1 ? "ies" : "y"} selected
        </span>

        <div className="h-4 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              Bulk Actions
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem onClick={onBulkPublish}>
              <ToggleRight className="mr-2 h-4 w-4" />
              Publish Selected
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBulkClose}>
              <XCircle className="mr-2 h-4 w-4" />
              Close Selected
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBulkArchive}>
              <Archive className="mr-2 h-4 w-4" />
              Archive Selected
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBulkExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
