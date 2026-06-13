"use client";
import React from "react";
export function Dialog({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
export function DialogTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5 text-center sm:text-left">{children}</div>;
}
export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-lg font-semibold leading-none tracking-tight ${className || ""}`}>{children}</h2>;
}