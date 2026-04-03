"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PREDEFINED_TAGS } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// Use z.number() (not z.coerce.number()) to avoid Zod v4's `unknown` input type
// breaking react-hook-form's TypeScript generics.
// The `valueAsNumber: true` on <input> handles string→number coercion instead.
const tradeFormSchema = z.object({
  ticker: z.string().min(1, "Ticker is required").max(10),
  type: z.enum(["BUY", "SELL"]),
  price: z.number().positive("Price must be positive"),
  quantity: z.number().positive("Quantity must be positive"),
  notes: z.string().max(500).optional(),
});

type TradeFormValues = z.infer<typeof tradeFormSchema>;

interface TradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialTicker?: string;
  initialPrice?: number;
  initialType?: "BUY" | "SELL";
}

export default function TradeModal({
  open,
  onOpenChange,
  onSuccess,
  initialTicker,
  initialPrice,
  initialType,
}: TradeModalProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      ticker: initialTicker ?? "",
      type: initialType ?? "BUY",
      price: initialPrice ?? undefined,
      quantity: undefined,
      notes: "",
    },
  });

  // Reset form with latest initial values every time the modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        ticker: initialTicker ?? "",
        type: initialType ?? "BUY",
        price: initialPrice ?? undefined,
        quantity: undefined,
        notes: "",
      });
      setSelectedTags([]);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const tradeType = form.watch("type");

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (values: TradeFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          ticker: values.ticker.toUpperCase(),
          tags: selectedTags,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to log trade");
      }

      form.reset();
      setSelectedTags([]);
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log a Trade</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4 mt-2"
        >
          {/* Ticker */}
          <div className="space-y-1.5">
            <Label htmlFor="ticker">Ticker Symbol</Label>
            <Input
              id="ticker"
              placeholder="e.g. NVDA, TSLA, TEVA"
              className="uppercase"
              {...form.register("ticker")}
            />
            {form.formState.errors.ticker && (
              <p className="text-xs text-destructive">
                {form.formState.errors.ticker.message}
              </p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Trade Type</Label>
            <Select
              value={tradeType}
              onValueChange={(val) =>
                form.setValue("type", val as "BUY" | "SELL")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY">BUY</SelectItem>
                <SelectItem value="SELL">SELL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price per Share</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("price", { valueAsNumber: true })}
              />
              {form.formState.errors.price && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.price.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="1"
                min="0"
                placeholder="0"
                {...form.register("quantity", { valueAsNumber: true })}
              />
              {form.formState.errors.quantity && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.quantity.message}
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer select-none transition-colors"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Why are you making this trade?"
              rows={2}
              {...form.register("notes")}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                tradeType === "BUY"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              )}
            >
              {isSubmitting ? "Logging..." : `Log ${tradeType}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
