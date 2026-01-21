import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOverdueFollowups } from "@/hooks/useOverdueFollowups";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, PhoneCall, ChevronRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";

interface OverdueFollowUpsWidgetProps {
  academicYear?: string;
  onViewLead?: (leadId: string) => void;
}

export function OverdueFollowUpsWidget({ 
  academicYear,
  onViewLead 
}: OverdueFollowUpsWidgetProps) {
  const { data: overdueFollowups, isLoading } = useOverdueFollowups(academicYear);
  const { formatCurrency } = useSystemSettingsContext();

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

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className={`h-5 w-5 ${overdueCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
            Overdue Follow-Ups
          </CardTitle>
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
          <div className="space-y-3">
            {overdueFollowups?.slice(0, 5).map((item) => {
              const isUrgent = item.daysOverdue >= 3;
              return (
                <div
                  key={item.lead.id}
                  className={`p-3 rounded-lg border ${
                    isUrgent
                      ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                      : "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{item.lead.full_name}</p>
                        <Badge
                          variant={isUrgent ? "destructive" : "secondary"}
                          className="text-xs"
                        >
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
                    {onViewLead ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewLead(item.lead.id)}
                        className="shrink-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Link to={`/leads?lead=${item.lead.id}`}>
                        <Button variant="ghost" size="sm" className="shrink-0">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
            {overdueCount > 5 && (
              <div className="pt-2 border-t">
                <Link to="/leads?filter=overdue">
                  <Button variant="outline" className="w-full" size="sm">
                    View all {overdueCount} overdue follow-ups
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

