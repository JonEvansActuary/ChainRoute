"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, FileImage } from "lucide-react";
import type { SupportItem } from "@/lib/chainroute/types";

export interface SupportWithFile extends SupportItem {
  file?: File;
  caption?: string;
  uploading?: boolean;
  error?: string;
}

interface SupportUploaderProps {
  genesisHash: string | null;
  supports: SupportWithFile[];
  onSupportsChange: (supports: SupportWithFile[]) => void;
  disabled?: boolean;
}

export function SupportUploader({
  genesisHash,
  supports,
  onSupportsChange,
  disabled,
}: SupportUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [labelInputs, setLabelInputs] = useState<Record<number, string>>({});

  const uploadFileAt = useCallback(
    async (list: SupportWithFile[], index: number) => {
      const entry = list[index];
      if (!entry?.file) return;
      const next = [...list];
      next[index] = { ...entry, uploading: true, error: undefined };
      onSupportsChange(next);
      try {
        const form = new FormData();
        form.set("file", entry.file);
        if (genesisHash) form.set("genesis", genesisHash);
        const res = await fetch("/api/arweave/post-support", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        const done = [...next];
        done[index] = {
          ...entry,
          id: data.arweaveId,
          label: entry.label || entry.file.name.replace(/\.[^.]+$/, ""),
          uploading: false,
          error: undefined,
        };
        onSupportsChange(done);
      } catch (e) {
        const err = [...next];
        err[index] = { ...entry, uploading: false, error: (e as Error).message };
        onSupportsChange(err);
      }
    },
    [genesisHash, onSupportsChange]
  );

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const newEntries: SupportWithFile[] = Array.from(files).map((file) => ({
        id: "",
        label: file.name.replace(/\.[^.]+$/, ""),
        file,
        uploading: false,
      }));
      const list = [...supports, ...newEntries];
      onSupportsChange(list);
      list.forEach((entry, i) => {
        if (entry.file && !entry.id && !entry.uploading) {
          uploadFileAt(list, i);
        }
      });
    },
    [supports, onSupportsChange, uploadFileAt]
  );

  const removeAt = (index: number) => {
    const list = supports.filter((_, i) => i !== index);
    onSupportsChange(list);
  };

  const requestCaption = useCallback(
    async (index: number) => {
      const entry = supports[index];
      if (!entry?.file || entry.uploading) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        try {
          const res = await fetch("/api/ai/caption", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageDataUrl: dataUrl }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          const list = [...supports];
          list[index] = {
            ...list[index],
            label: data.suggestedLabel || list[index].label,
            caption: data.caption,
          };
          onSupportsChange(list);
        } catch (_) {
          // ignore
        }
      };
      reader.readAsDataURL(entry.file);
    },
    [supports, onSupportsChange]
  );

  return (
    <Card className="border-chain-neon/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-chain-neon" />
          Support files
        </CardTitle>
        <CardDescription>
          Upload images or PDFs. Optionally get AI captions; files are posted to Arweave with ChainRoute-Genesis tag.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragOver ? "border-chain-neon/50 bg-chain-neon/5" : "border-muted-foreground/25"
          }`}
        >
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.json"
            className="hidden"
            id="support-upload"
            onChange={(e) => addFiles(e.target.files)}
            disabled={disabled}
          />
          <label htmlFor="support-upload" className="cursor-pointer">
            <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Drop files or click to upload
            </p>
          </label>
        </div>

        <ul className="space-y-2">
          {supports.map((s, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2"
            >
              <FileImage className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <Input
                  placeholder="Label"
                  value={labelInputs[i] ?? s.label ?? ""}
                  onChange={(e) => {
                    setLabelInputs((prev) => ({ ...prev, [i]: e.target.value }));
                    const list = [...supports];
                    list[i] = { ...list[i], label: e.target.value };
                    onSupportsChange(list);
                  }}
                  className="h-8"
                />
                {s.caption && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">{s.caption}</p>
                )}
                {s.id && (
                  <p className="truncate font-mono text-xs text-chain-neon">Arweave: {s.id.slice(0, 12)}…</p>
                )}
                {s.error && <p className="text-xs text-destructive">{s.error}</p>}
              </div>
              {s.file && !s.id && !s.uploading && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => uploadFileAt(supports, i)}
                >
                  Upload to Arweave
                </Button>
              )}
              {s.file && !s.uploading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => requestCaption(i)}
                >
                  AI label
                </Button>
              )}
              {s.uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => removeAt(i)}
              >
                ×
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
