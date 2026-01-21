import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] animate-fade-in">
        <Card className="shadow-card max-w-2xl w-full">
          <CardContent className="pt-12 pb-12 px-6 sm:px-12">
            <div className="text-center space-y-6">
              {/* 404 Number */}
              <div className="relative">
                <h1 className="font-display text-8xl sm:text-9xl font-bold text-primary/20">
                  404
                </h1>
                <div className="absolute inset-0 flex items-center justify-center">
                  <AlertCircle className="h-16 w-16 sm:h-20 sm:w-20 text-primary" />
                </div>
              </div>

              {/* Title and Description */}
              <div className="space-y-3">
                <h2 className="font-display text-3xl sm:text-4xl font-bold">
                  Page Not Found
                </h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  The page you're looking for doesn't exist or has been moved.
                </p>
                {location.pathname && (
                  <p className="text-sm text-muted-foreground font-mono bg-muted/50 px-3 py-1.5 rounded-md inline-block">
                    {location.pathname}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <Button
                  onClick={() => navigate("/")}
                  className="w-full sm:w-auto gap-2"
                  size="lg"
                >
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => navigate(-1)}
                  variant="outline"
                  className="w-full sm:w-auto gap-2"
                  size="lg"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </Button>
              </div>

              {/* Quick Links */}
              <div className="pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground mb-4">
                  You might be looking for:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/leads")}
                    className="gap-2"
                  >
                    <Search className="h-4 w-4" />
                    All Leads
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/reports")}
                    className="gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Reports
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/upload")}
                    className="gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Bulk Upload
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default NotFound;
