interface PaginationInfoProps {
  startIndex: number;
  endIndex: number;
  totalItems: number;
  isLoading?: boolean;
}

export function PaginationInfo({ startIndex, endIndex, totalItems, isLoading }: PaginationInfoProps) {
  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="text-sm text-muted-foreground">
      Showing <span className="font-medium text-foreground">{startIndex}</span> to{" "}
      <span className="font-medium text-foreground">{endIndex}</span> of{" "}
      <span className="font-medium text-foreground">{totalItems}</span>{" "}
      {totalItems === 1 ? "result" : "results"}
    </div>
  );
}

