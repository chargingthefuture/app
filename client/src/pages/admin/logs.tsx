import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Download, Search, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface LogFile {
  name: string;
  size: number;
  sizeMB: string;
  modified: string;
  level: 'log' | 'error' | 'warn' | 'info';
}

interface LogEntry {
  timestamp?: string;
  level?: string;
  message?: string;
  data?: any;
  raw?: string;
}

export default function AdminLogs() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [viewLimit, setViewLimit] = useState(100);

  const { data: filesData, isLoading: filesLoading, refetch: refetchFiles } = useQuery<{
    enabled: boolean;
    logDir: string;
    files: LogFile[];
  }>({
    queryKey: ["/api/admin/logs/files"],
  });

  const { data: logData, isLoading: logLoading, refetch: refetchLog } = useQuery<{
    filename: string;
    totalLines: number;
    filteredLines: number;
    returnedLines: number;
    entries: LogEntry[];
  }>({
    queryKey: ["/api/admin/logs/view", selectedFile, searchQuery, levelFilter, viewLimit],
    enabled: !!selectedFile,
  });

  const handleDownload = async (filename: string) => {
    try {
      const res = await apiRequest("GET", `/api/admin/logs/download?filename=${encodeURIComponent(filename)}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast({ title: "Download started", description: `Downloading ${filename}` });
      } else {
        throw new Error("Download failed");
      }
    } catch (error: any) {
      toast({ 
        title: "Download failed", 
        description: error.message || "Failed to download log file",
        variant: "destructive"
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({ title: "Search query required", variant: "destructive" });
      return;
    }

    try {
      const res = await apiRequest("GET", `/api/admin/logs/search?q=${encodeURIComponent(searchQuery)}&level=${levelFilter !== "all" ? levelFilter : ""}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        toast({ 
          title: "Search complete", 
          description: `Found ${data.totalResults} results` 
        });
        // You could display search results in a modal or separate section
      }
    } catch (error: any) {
      toast({ 
        title: "Search failed", 
        description: error.message || "Failed to search logs",
        variant: "destructive"
      });
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'default';
      case 'info': return 'secondary';
      default: return 'outline';
    }
  };

  if (!filesData?.enabled) {
    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Server Logs</h1>
          <p className="text-muted-foreground">
            View and download server log files
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <AlertCircle className="w-5 h-5" />
              <p>File logging is not enabled. Set <code className="bg-muted px-1 rounded">ENABLE_FILE_LOGGING=true</code> in your environment variables.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Server Logs</h1>
          <p className="text-muted-foreground">
            View and download server log files from {filesData.logDir}
          </p>
        </div>
        <Button 
          onClick={() => refetchFiles()} 
          variant="outline" 
          size="sm"
          data-testid="button-refresh-logs"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Logs</CardTitle>
          <CardDescription>Search across all log files for specific content (e.g., sync IDs)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for sync ID, error message, etc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              data-testid="input-search-logs"
            />
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="log">Log</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} data-testid="button-search">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Log Files</CardTitle>
          <CardDescription>
            {filesLoading ? "Loading..." : `${filesData.files.length} log files available`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filesLoading ? (
            <p className="text-muted-foreground">Loading log files...</p>
          ) : filesData.files.length === 0 ? (
            <p className="text-muted-foreground">No log files found</p>
          ) : (
            <div className="space-y-2">
              {filesData.files.map((file) => (
                <div
                  key={file.name}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                    selectedFile === file.name ? 'bg-muted border-primary' : ''
                  }`}
                  onClick={() => setSelectedFile(file.name)}
                  data-testid={`log-file-${file.name}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{file.name}</p>
                        <Badge variant={getLevelColor(file.level)}>{file.level}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {file.sizeMB} MB • {format(new Date(file.modified), "MMM d, yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file.name);
                    }}
                    data-testid={`button-download-${file.name}`}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Viewer */}
      {selectedFile && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Viewing: {selectedFile}</CardTitle>
                <CardDescription>
                  {logData ? (
                    <>
                      Showing {logData.returnedLines} of {logData.filteredLines} filtered lines 
                      (out of {logData.totalLines} total)
                    </>
                  ) : (
                    "Loading log entries..."
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={viewLimit.toString()} onValueChange={(v) => setViewLimit(parseInt(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">Last 100</SelectItem>
                    <SelectItem value="500">Last 500</SelectItem>
                    <SelectItem value="1000">Last 1000</SelectItem>
                    <SelectItem value="5000">Last 5000</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchLog()}
                  data-testid="button-refresh-view"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {logLoading ? (
              <p className="text-muted-foreground">Loading log entries...</p>
            ) : logData && logData.entries.length === 0 ? (
              <p className="text-muted-foreground">No log entries found</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto font-mono text-sm">
                {logData?.entries.map((entry, index) => (
                  <div
                    key={index}
                    className="p-2 border rounded bg-muted/50 hover:bg-muted transition-colors"
                  >
                    {entry.raw ? (
                      <pre className="whitespace-pre-wrap break-words">{entry.raw}</pre>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {entry.timestamp && (
                            <span className="text-muted-foreground">
                              {format(new Date(entry.timestamp), "yyyy-MM-dd HH:mm:ss")}
                            </span>
                          )}
                          {entry.level && (
                            <Badge variant={getLevelColor(entry.level)}>{entry.level}</Badge>
                          )}
                        </div>
                        {entry.message && (
                          <p className="font-medium">{entry.message}</p>
                        )}
                        {entry.data && (
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                            {JSON.stringify(entry.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

