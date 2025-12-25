"use client";

import { motion } from "framer-motion";
import { DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import React from "react";

/**
 * Props for the MorphDialogContent component.
 */
interface MorphDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogContent> {
    /**
     * Unique ID for the framer-motion layout transition.
     * Must match the layoutId of the trigger element.
     */
    layoutId: string;
    /**
     * The content to be rendered inside the morphing container.
     */
    children: React.ReactNode;
    /**
     * Class name for the outer DialogContent (positioning).
     */
    dialogOverlayClassName?: string;
    /**
     * Class name for the inner motion.div (visual style: background, border, shadow).
     */
    containerClassName?: string;
    /**
     * Optional style overrides for the inner container.
     */
    style?: React.CSSProperties;
}

/**
 * A wrapper around DialogContent that implements the morph animation pattern.
 * 
 * @remarks
 * This component standardizes the "morph" effect where a dialog expands from a trigger button.
 * It uses a transparent `DialogContent` to handle positioning and accessibility, while
 * a `motion.div` handles the visual transition (background, border, shadow).
 * 
 * Performance optimizations:
 * - Uses `will-change: transform` to hint the browser compositor.
 * - Uses a spring transition for snappy, responsive feel.
 */
export function MorphDialogContent({
    layoutId,
    children,
    className,
    containerClassName,
    style,
    ...props
}: MorphDialogContentProps) {
    return (
        <DialogContent
            className={cn(
                "bg-transparent border-none shadow-none p-0 overflow-hidden", // Override default styles
                className
            )}
            {...props}
        >
            <motion.div
                layoutId={layoutId}
                className={cn(
                    "bg-background border rounded-lg shadow-lg w-full h-full",
                    containerClassName
                )}
                style={{
                    willChange: "transform",
                    ...style
                }}
                transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30
                }}
            >
                {children}
            </motion.div>
        </DialogContent>
    );
}
