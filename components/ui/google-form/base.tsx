"use client";

import { cn } from "@/lib/utils";
import React, { InputHTMLAttributes, forwardRef } from "react";

/**
 * Reusable Google Form-style Input
 * Features a minimalist border-bottom with an animated focus underline.
 */
export const GoogleFormInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className="relative w-full group">
        <input
          type={type}
          className={cn(
            "peer w-full bg-transparent border-b border-muted-foreground/20 py-2 outline-none transition-all duration-300",
            "text-sm placeholder:text-muted-foreground/40",
            "focus:border-primary",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary transition-all duration-500 peer-focus:w-full" />
      </div>
    );
  }
);

GoogleFormInput.displayName = "GoogleFormInput";

/**
 * Reusable Google Form-style TextArea
 */
export const GoogleFormTextArea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => {
      return (
        <div className="relative w-full group ">
          <textarea
            className={cn(
              "peer w-full bg-transparent border-b border-muted-foreground/20 py-2  outline-none transition-all duration-300 min-h-[100px] resize-none",
              "text-sm placeholder:text-muted-foreground/40",
              "focus:border-primary",
              className
            )}
            ref={ref}
            {...props}
          />
          <div className="absolute bottom-1.5 left-0 w-0 h-[1px] bg-primary transition-all duration-500 peer-focus:w-full" />
        </div>
      );
    }
  );
  
  GoogleFormTextArea.displayName = "GoogleFormTextArea";

/**
 * Reusable Google Form-style Select
 */
export const GoogleFormSelect = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full group py-2">
        <select
          className={cn(
            "peer w-full bg-transparent border-b border-muted-foreground/20 py-2 pt-4 outline-none transition-all duration-300 appearance-none",
            "text-lg font-medium text-foreground",
            "focus:border-primary",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="absolute bottom-2 left-0 w-0 h-[2px] bg-primary transition-all duration-500 peer-focus:w-full" />
        <div className="absolute right-0 bottom-4 pointer-events-none opacity-40">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
      </div>
    );
  }
);

GoogleFormSelect.displayName = "GoogleFormSelect";

/**
 * Container Card for Form Sections
 */
export const GoogleFormCard = ({ children, className, title, description, required }: { 
    children: React.ReactNode; 
    className?: string;
    title?: string;
    description?: string;
    required?: boolean;
}) => {
  return (
    <div className={cn(
        "border border-[#dadce0]  bg-white/85 hover:border-primary-100 p-4 md:p-4 transition-all font-poppins",
        className
    )}>
        {(title || description) && (
            <div className="mb-2">
                {title && (
                    <h3 className="font-medium">
                        {title}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                )}
                {description && <p className="text-xs text-muted-foreground/70">{description}</p>}
            </div>
        )}
        {children}
    </div>
  );
};
