"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";
import type { SupportItem } from "@/lib/chainroute/types";

export interface EventForm {
  eventType: string;
  summary: Record<string, unknown>;
  narrative?: string;
}

interface EventBuilderProps {
  supportLabels: string[];
  onEventChange: (event: EventForm) => void;
  initialEvent?: EventForm | null;
  disabled?: boolean;
}

export function EventBuilder({
  supportLabels,
  onEventChange,
  initialEvent,
  disabled,
}: EventBuilderProps) {
  const [eventType, setEventType] = useState(initialEvent?.eventType ?? "creation");
  const [summaryText, setSummaryText] = useState(
    initialEvent?.summary
      ? JSON.stringify(initialEvent.summary, null, 2)
      : '{\n  "description": ""\n}'
  );
  const [narrative, setNarrative] = useState(initialEvent?.narrative ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emit = () => {
    try {
      const summary = JSON.parse(summaryText) as Record<string, unknown>;
      onEventChange({ eventType, summary, narrative: narrative || undefined });
      setError(null);
    } catch {
      setError("Invalid JSON in summary");
    }
  };

  useEffect(() => {
    try {
      const summary = JSON.parse(summaryText) as Record<string, unknown>;
      onEventChange({ eventType, summary, narrative: narrative || undefined });
    } catch {
      // ignore initial invalid
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial sync only
  }, []);

  const suggestWithAI = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/suggest-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supportLabels,
          userDescription: summaryText.slice(0, 200) || narrative,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEventType(data.eventType ?? eventType);
      if (data.summary && typeof data.summary === "object") {
        setSummaryText(JSON.stringify(data.summary, null, 2));
      }
      if (data.narrative) setNarrative(data.narrative);
      emit();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-chain-neon/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-chain-neon" />
          Event
        </CardTitle>
        <CardDescription>
          Define the provenance event. AI can suggest eventType and summary from your supports.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Event type</label>
          <Input
            value={eventType}
            onChange={(e) => {
              setEventType(e.target.value);
              emit();
            }}
            placeholder="e.g. creation, transfer, certification"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Summary (JSON)</label>
          <textarea
            className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm min-h-[120px]"
            value={summaryText}
            onChange={(e) => {
              setSummaryText(e.target.value);
              setError(null);
            }}
            onBlur={emit}
            placeholder='{ "description": "..." }'
            disabled={disabled}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Narrative (optional)</label>
          <Input
            value={narrative}
            onChange={(e) => {
              setNarrative(e.target.value);
              emit();
            }}
            placeholder="Short story for this event"
            disabled={disabled}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="button"
          variant="chain"
          onClick={suggestWithAI}
          disabled={disabled || loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Suggest with AI
        </Button>
      </CardContent>
    </Card>
  );
}
