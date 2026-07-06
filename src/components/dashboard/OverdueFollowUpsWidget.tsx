import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOverdueFollowups, type OverdueFollowUp } from "@/hooks/useOverdueFollowups";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PhoneCall, ChevronRight, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";
import { cn } from "@/lib/utils";

interface OverdueFollowUpsWidgetProps {
  academicYear?: string;
  onViewLead?: (leadId: string) => void;
}

function overdueLeadHref(leadId: string) {
  return `/leads?lead=${leadId}&tab=followups`;
}

export function OverdueFollowUpsWidget({
  academicYear,
  onViewLead,
}: OverdueFollowUpsWidgetProps) {
  const navigate = useNavigate();
  const { data: overdueFollowups, isLoading } = useOverdueFollowups(academicYear);
  const { formatCurrency } = useSystemSettingsContext();

  const handleRowClick = (leadId: string) => {
    if (onViewLead) {
      onViewLead(leadId);
      return;
    }
    navigate(overdueLeadHref(leadId));
  };

  const rowClassName = (isUrgent: boolean) =>
    cn(
      "group flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
      "cursor-pointer hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      isUrgent
        ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
        : "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950",
    );

  const renderMobileRow = (item: OverdueFollowUp) => {
    const isUrgent = item.daysOverdue >= 3;
    const content = (
      <>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium truncate">{item.lead.full_name}</p>
            <Badge variant={isUrgent ? "destructive" : "secondary"} className="text-xs">
              {item.daysOverdue} {item.daysOverdue === 1 ? "day" : "days"} overdue
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <PhoneCall className="h-3 w-3" />
              {item.followUpCount}/3 follow-ups
            </span>
            {item.nextFollowUpDate && (
              <span>
                Due: {formatDistanceToNow(new Date(item.nextFollowUpDate), { addSuffix: true })}
              </span>
            )}
          </div>
          {item.lead.potential_revenue > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(item.lead.potential_revenue)} potential
            </p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </>
    );

    if (onViewLead) {
      return (
        <button
          key={item.lead.id}
          type="button"
          onClick={() => onViewLead(item.lead.id)}
          className={rowClassName(isUrgent)}
        >
          {content}
        </button>
      );
    }

    return (
      <Link key={item.lead.id} to={overdueLeadHref(item.lead.id)} className={rowClassName(isUrgent)}>
        {content}
      </Link>
    );
  };

  const renderDesktopRow = (item: OverdueFollowUp) => {
    const isUrgent = item.daysOverdue >= 3;

    return (
      <TableRow
        key={item.lead.id}
        className={cn(
          "cursor-pointer group",
          isUrgent ? "bg-destructive/5 hover:bg-destructive/10" : "bg-warning/5 hover:bg-warning/10",
        )}
        onClick={() => handleRowClick(item.lead.id)}
      >
        <TableCell className="py-3 pl-4 font-medium">
          <span className="group-hover:text-primary transition-colors">{item.lead.full_name}</span>
        </TableCell>
        <TableCell className="py-3">
          <Badge variant={isUrgent ? "destructive" : "secondary"} className="text-xs whitespace-nowrap">
            {item.daysOverdue} {item.daysOverdue === 1 ? "day" : "days"} overdue
          </Badge>
        </TableCell>
        <TableCell className="py-3 text-sm text-muted-foreground whitespace-nowrap">
          <span className="inline-flex items-center gap-1">
            <PhoneCall className="h-3.5 w-3.5 shrink-0" />
            {item.followUpCount}/3 follow-ups
          </span>
        </TableCell>
        <TableCell className="py-3 text-sm text-muted-foreground whitespace-nowrap">
          {item.nextFollowUpDate
            ? formatDistanceToNow(new Date(item.nextFollowUpDate), { addSuffix: true })
            : "—"}
        </TableCell>
        <TableCell className="py-3 text-sm text-muted-foreground whitespace-nowrap">
          {item.lead.potential_revenue > 0
            ? formatCurrency(item.lead.potential_revenue)
            : "—"}
        </TableCell>
        <TableCell className="py-3 pr-4 w-10">
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </TableCell>
      </TableRow>
    );
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const overdueCount = overdueFollowups?.length || 0;
  const urgentCount = overdueFollowups?.filter((item) => item.daysOverdue >= 3).length || 0;
  const displayedItems = overdueFollowups?.slice(0, 5) ?? [];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Overdue Follow-Ups</CardTitle>
          {overdueCount > 0 && (
            <Badge variant={urgentCount > 0 ? "destructive" : "secondary"}>
              {overdueCount} {overdueCount === 1 ? "lead" : "leads"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {overdueCount === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No overdue follow-ups at this time
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block -mx-1 overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/30">
                    <TableHead className="pl-4">Lead</TableHead>
                    <TableHead className="w-36">Status</TableHead>
                    <TableHead className="w-36">Follow-ups</TableHead>
                    <TableHead className="w-36">Due</TableHead>
                    <TableHead className="w-32">Potential</TableHead>
                    <TableHead className="w-10 pr-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedItems.map((item) => renderDesktopRow(item))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {displayedItems.map((item) => renderMobileRow(item))}
            </div>

            {overdueCount > 5 && (
              <div className="pt-4 mt-4 border-t">
                <Link to="/leads?filter=overdue">
                  <Button variant="outline" className="w-full" size="sm">
                    View all {overdueCount} overdue follow-ups
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
