"use client";

import * as React from "react";
import { Header } from "@/components/layout/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Upload,
  Eye,
  Target,
  MoreVertical,
  Trash2,
  Archive,
  FileText,
  Globe,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WatchList {
  id: string;
  name: string;
  description: string | null;
  type: "watch" | "hunt";
  accountCount: number;
  createdAt: string;
  lastScoredAt?: string;
}

export default function ListsPage() {
  const [lists, setLists] = React.useState<WatchList[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showCreateSheet, setShowCreateSheet] = React.useState(false);
  const [showImportSheet, setShowImportSheet] = React.useState(false);
  const [selectedList, setSelectedList] = React.useState<WatchList | null>(
    null
  );
  const [importText, setImportText] = React.useState("");
  const [importResult, setImportResult] = React.useState<{
    imported: number;
    skipped: number;
    invalidDomains: string[];
  } | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);

  React.useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const response = await fetch("/api/watch");
      const data = await response.json();
      setLists(data.lists || []);
    } catch (error) {
      console.error("Failed to fetch lists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async (name: string, description: string) => {
    try {
      const response = await fetch("/api/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      const data = await response.json();
      if (data.list) {
        setLists((prev) => [{ ...data.list, accountCount: 0 }, ...prev]);
        setShowCreateSheet(false);
      }
    } catch (error) {
      console.error("Failed to create list:", error);
    }
  };

  const handleImport = async () => {
    if (!selectedList || !importText.trim()) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const domains = importText
        .split(/[\n,]/)
        .map((d) => d.trim())
        .filter(Boolean);

      const response = await fetch("/api/watch/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: selectedList.id, domains }),
      });

      const data = await response.json();
      setImportResult(data);

      // Update list count
      if (data.imported > 0) {
        setLists((prev) =>
          prev.map((l) =>
            l.id === selectedList.id
              ? { ...l, accountCount: l.accountCount + data.imported }
              : l
          )
        );
      }
    } catch (error) {
      console.error("Failed to import domains:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const totalAccounts = lists.reduce((sum, l) => sum + l.accountCount, 0);

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Lists & Watch Manager"
        subtitle={`${lists.length} lists • ${totalAccounts} accounts monitored`}
        showSearch={false}
        actions={
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowCreateSheet(true)}
          >
            <Plus className="h-4 w-4" />
            New List
          </Button>
        }
      />

      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 w-32 bg-[--background-tertiary] rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 w-24 bg-[--background-tertiary] rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : lists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-[--background-tertiary] p-4">
                <Eye className="h-8 w-8 text-[--foreground-subtle]" />
              </div>
              <h3 className="text-lg font-semibold">No watch lists yet</h3>
              <p className="mt-2 max-w-sm text-sm text-[--foreground-muted]">
                Create a watch list to monitor specific accounts for new signals
                daily.
              </p>
              <Button
                variant="default"
                className="mt-4"
                onClick={() => setShowCreateSheet(true)}
              >
                <Plus className="h-4 w-4" />
                Create Your First List
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lists.map((list) => (
                <Card
                  key={list.id}
                  className="group relative hover:border-[--accent]/50 transition-colors"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {list.type === "watch" ? (
                          <Eye className="h-4 w-4 text-[--accent]" />
                        ) : (
                          <Target className="h-4 w-4 text-[--score-excellent]" />
                        )}
                        <CardTitle className="text-base">{list.name}</CardTitle>
                      </div>
                      <Badge variant="secondary">
                        {list.type === "watch" ? "Watch" : "Hunt"}
                      </Badge>
                    </div>
                    {list.description && (
                      <p className="text-sm text-[--foreground-muted] mt-1">
                        {list.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="font-semibold">
                            {list.accountCount}
                          </span>
                          <span className="text-[--foreground-muted]">
                            {" "}
                            accounts
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedList(list);
                            setShowImportSheet(true);
                            setImportText("");
                            setImportResult(null);
                          }}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {list.lastScoredAt && (
                      <p className="mt-2 text-xs text-[--foreground-subtle]">
                        Last scored:{" "}
                        {new Date(list.lastScoredAt).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create List Sheet */}
      <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Create New List</SheetTitle>
            <SheetDescription>
              Create a watch list to monitor accounts for signals
            </SheetDescription>
          </SheetHeader>
          <CreateListForm
            onSubmit={handleCreateList}
            onCancel={() => setShowCreateSheet(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Import Sheet */}
      <Sheet open={showImportSheet} onOpenChange={setShowImportSheet}>
        <SheetContent side="right" className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Import Domains</SheetTitle>
            <SheetDescription>
              Add domains to "{selectedList?.name}"
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div>
              <Label htmlFor="domains">Domains</Label>
              <Textarea
                id="domains"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Enter domains, one per line or comma-separated:&#10;&#10;acme.com&#10;example.io&#10;company.co"
                className="mt-1 font-mono text-sm"
                rows={10}
              />
              <p className="mt-1 text-xs text-[--foreground-subtle]">
                Paste domains from a CSV or enter manually
              </p>
            </div>

            {importResult && (
              <div className="rounded-lg border border-[--border] bg-[--background-tertiary] p-4">
                <div className="flex items-center gap-2 mb-3">
                  {importResult.imported > 0 ? (
                    <CheckCircle className="h-5 w-5 text-[--score-excellent]" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-[--priority-medium]" />
                  )}
                  <span className="font-medium">Import Complete</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-[--score-excellent]">
                      {importResult.imported}
                    </span>{" "}
                    domains imported
                  </p>
                  {importResult.skipped > 0 && (
                    <p>
                      <span className="text-[--priority-medium]">
                        {importResult.skipped}
                      </span>{" "}
                      invalid/skipped
                    </p>
                  )}
                  {importResult.invalidDomains.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[--foreground-subtle]">
                        Show invalid domains
                      </summary>
                      <div className="mt-1 font-mono text-xs text-[--foreground-subtle]">
                        {importResult.invalidDomains.join(", ")}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleImport}
                disabled={!importText.trim() || isImporting}
                className="flex-1"
              >
                {isImporting ? (
                  <>
                    <span className="animate-spin mr-2">...</span>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import Domains
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowImportSheet(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CreateListForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (name: string, description: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  return (
    <div className="mt-6 space-y-6">
      <div>
        <Label htmlFor="name">List Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Enterprise Accounts"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What accounts are in this list?"
          className="mt-1"
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => onSubmit(name, description)}
          disabled={!name.trim()}
          className="flex-1"
        >
          Create List
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
