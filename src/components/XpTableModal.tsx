import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { xpTable } from "@/data/xpTable";

interface XpTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function XpTableModal({ isOpen, onClose }: XpTableModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1c25] border-[#2a2d3a] text-gray-200 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Profession XP Table</DialogTitle>
          <DialogDescription>
            This table shows the total XP required to complete each level.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow className="border-b-[#2a2d3a]">
                <TableHead className="w-[100px] text-white">Level</TableHead>
                <TableHead className="text-right text-white">XP to Next Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {xpTable.map((row) => (
                <TableRow key={row.level} className="border-b-[#2a2d3a]">
                  <TableCell className="font-medium">{row.level}</TableCell>
                  <TableCell className="text-right font-mono">{row.xp.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
