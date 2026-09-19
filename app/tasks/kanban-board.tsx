"use client";

import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";

import { ReactNode, useState } from "react";

import { useRouter } from "next/navigation";

import { moveTaskStatus } from "./actions";

const validStatuses = ["todo", "in_progress", "review", "submitted"];

export function KanbanBoard({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);

  return (
    <DragDropProvider
      onDragEnd={async (event) => {
        if (event.canceled) {
          return;
        }

        const { source, target } = event.operation;

        if (!source || !target) {
          return;
        }

        const taskId = String(source.id);
        const newStatus = String(target.id);

        const oldStatus = String(source.data?.status ?? "");

        if (!validStatuses.includes(newStatus)) {
          return;
        }

        if (oldStatus === newStatus) {
          return;
        }

        try {
          setIsSaving(true);

          await moveTaskStatus(taskId, newStatus);

          router.refresh();
        } catch (error) {
          console.error(error);

          alert(
            error instanceof Error
              ? error.message
              : "Failed to update assignment status.",
          );
        } finally {
          setIsSaving(false);
        }
      }}
    >
      <div className="relative">
        {isSaving && (
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Updating assignment...
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-4">{children}</div>
      </div>
    </DragDropProvider>
  );
}

export function KanbanColumn({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count: number;
  children: ReactNode;
}) {
  const { ref, isDropTarget } = useDroppable({
    id,
    accept: "task",
  });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-950">{title}</h2>

        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
          {count}
        </span>
      </div>

      <div
        ref={ref}
        className={`min-h-[180px] space-y-4 rounded-2xl p-2 transition ${
          isDropTarget ? "bg-blue-50 ring-2 ring-blue-200" : "bg-transparent"
        }`}
      >
        {children}
      </div>
    </section>
  );
}

export function DraggableTask({
  id,
  status,
  children,
}: {
  id: string;
  status: string;
  children: ReactNode;
}) {
  const { ref, handleRef, isDragging } = useDraggable({
    id,
    type: "task",
    data: {
      status,
    },
  });

  return (
    <div
      ref={ref}
      className={`transition ${isDragging ? "opacity-40" : "opacity-100"}`}
    >
      <button
        ref={handleRef}
        type="button"
        title="Drag assignment"
        className="mb-2 flex w-full cursor-grab items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white py-1.5 text-xs font-medium text-slate-400 transition hover:border-slate-400 hover:text-slate-600 active:cursor-grabbing"
      >
        ⋮⋮ Drag
      </button>

      {children}
    </div>
  );
}
