"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { deleteTask } from "./actions";

type DeleteTaskFormProps = {
  taskId: string;
  taskTitle: string;
};

export function DeleteTaskForm({ taskId, taskTitle }: DeleteTaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* OPEN MODAL */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-sm font-medium text-red-600 transition hover:text-red-800"
      >
        Delete assignment
      </button>

      {/* MODAL */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-task-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            {/* HEADER */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-red-500">
                  Delete assignment
                </p>

                <h2
                  id="delete-task-title"
                  className="mt-2 text-xl font-semibold tracking-tight text-slate-950"
                >
                  Delete this assignment?
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {/* CONTENT */}
            <div className="mt-5">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Assignment
                </p>

                <p className="mt-1 font-medium text-slate-950">{taskTitle}</p>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                This assignment will be permanently deleted, including its
                related checklist data. This action cannot be undone.
              </p>
            </div>

            {/* ACTIONS */}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <form action={deleteTask}>
                <input type="hidden" name="task_id" value={taskId} />

                <DeleteButton />
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Deleting..." : "Delete assignment"}
    </button>
  );
}
