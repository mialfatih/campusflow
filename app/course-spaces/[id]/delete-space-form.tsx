"use client";

import { deleteCourseSpace } from "../actions";

type DeleteCourseSpaceFormProps = {
  spaceId: string;
  spaceName: string;
};

export function DeleteCourseSpaceForm({
  spaceId,
  spaceName,
}: DeleteCourseSpaceFormProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const confirmed = window.confirm(
      `Delete "${spaceName}"?\n\nAll members will be disconnected from this Course Space. Personal courses, assignments, and progress will not be deleted.`,
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <form action={deleteCourseSpace} onSubmit={handleSubmit}>
      <input type="hidden" name="space_id" value={spaceId} />

      <button
        type="submit"
        className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        Delete Course Space
      </button>
    </form>
  );
}
