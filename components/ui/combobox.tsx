"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function Combobox({
    options,
    value,
    onChange,
    placeholder = "Select...",
    disabled = false,
    className = "",
}: Readonly<ComboboxProps>) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    const filtered =
        search.trim() === ""
            ? options
            : options.filter((opt) =>
                opt.label.toLowerCase().includes(search.toLowerCase())
            );

    const selected = options.find((opt) => opt.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger render={
                <button
                    type="button"
                    className={cn(
                        "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                    disabled={disabled}
                >
                    <span className={cn(!selected && "text-muted-foreground")}>{selected ? selected.label : placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
            } />
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 overflow-hidden" align="start">
                <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mb-1 border-none focus-visible:ring-0 rounded-none h-10 px-4"
                    autoFocus
                />
                <div className="max-h-64 overflow-y-auto p-1 border-t">
                    {filtered.length === 0 ? (
                        <div className="px-3 py-2 text-muted-foreground text-sm">No options</div>
                    ) : (
                        filtered.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                className={cn(
                                    "flex w-full items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-muted focus:bg-muted focus:outline-none transition-colors",
                                    value === opt.value && "bg-primary/5 text-primary font-semibold"
                                )}
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                    setSearch("");
                                }}
                            >
                                {value === opt.value ? (
                                    <Check className="h-4 w-4 text-primary shrink-0" />
                                ) : (
                                    <div className="h-4 w-4 shrink-0" />
                                )}
                                <span className="truncate">{opt.label}</span>
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
