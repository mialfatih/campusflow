"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return {
    supabase,
    user,
  };
}

function revalidateAcademicPages() {
  revalidatePath("/courses");
  revalidatePath("/course-spaces");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

/* =========================================================
   SEMESTERS
========================================================= */

export async function createSemester(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();

  const name = String(formData.get("name") ?? "").trim();

  const startDate = String(formData.get("start_date") ?? "").trim() || null;

  const endDate = String(formData.get("end_date") ?? "").trim() || null;

  if (!name) {
    throw new Error("Semester name is required.");
  }

  // Deactivate the current active semester first.
  const { error: deactivateError } = await supabase
    .from("semesters")
    .update({
      is_active: false,
    })
    .eq("user_id", user.id);

  if (deactivateError) {
    throw new Error(deactivateError.message);
  }

  const { error } = await supabase.from("semesters").insert({
    user_id: user.id,
    name,
    start_date: startDate,
    end_date: endDate,
    is_active: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateAcademicPages();
}

export async function setActiveSemester(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();

  const semesterId = String(formData.get("semester_id") ?? "");

  if (!semesterId) {
    throw new Error("Semester ID is required.");
  }

  const { data: semester, error: semesterError } = await supabase
    .from("semesters")
    .select("id")
    .eq("id", semesterId)
    .eq("user_id", user.id)
    .single();

  if (semesterError || !semester) {
    throw new Error("Semester not found.");
  }

  const { error: deactivateError } = await supabase
    .from("semesters")
    .update({
      is_active: false,
    })
    .eq("user_id", user.id);

  if (deactivateError) {
    throw new Error(deactivateError.message);
  }

  const { error } = await supabase
    .from("semesters")
    .update({
      is_active: true,
    })
    .eq("id", semesterId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAcademicPages();
}

/* =========================================================
   COURSES
========================================================= */

export async function createCourse(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();

  const semesterId = String(formData.get("semester_id") ?? "");

  const name = String(formData.get("name") ?? "").trim();

  /*
   * Course code is part of the course identity.
   * We normalize it when the course is created.
   *
   * Example:
   * ml401 -> ML401
   */
  const rawCode = String(formData.get("code") ?? "").trim();

  const code = rawCode ? rawCode.toUpperCase() : null;

  if (!semesterId || !name) {
    throw new Error("Semester and course name are required.");
  }

  // Make sure the semester belongs to this user.
  const { data: semester, error: semesterError } = await supabase
    .from("semesters")
    .select("id")
    .eq("id", semesterId)
    .eq("user_id", user.id)
    .single();

  if (semesterError || !semester) {
    throw new Error("Semester not found.");
  }

  const { error } = await supabase.from("courses").insert({
    user_id: user.id,
    semester_id: semesterId,
    name,
    code,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateAcademicPages();
}

/* =========================================================
   UPDATE COURSE

   Course name:
   ✓ editable

   Course code:
   ✗ immutable after creation
========================================================= */

export async function updateCourse(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();

  const courseId = String(formData.get("course_id") ?? "");

  const name = String(formData.get("name") ?? "").trim();

  if (!courseId) {
    throw new Error("Course ID is required.");
  }

  if (!name) {
    throw new Error("Course name is required.");
  }

  // IMPORTANT:
  // Do not update "code" here.
  // Course codes cannot change after creation.
  const { error } = await supabase
    .from("courses")
    .update({
      name,
    })
    .eq("id", courseId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAcademicPages();
}

/* =========================================================
   DELETE COURSE

   An unlinked personal course:
   ✓ can be deleted

   A course connected to a Course Space:
   ✗ cannot be deleted directly

   Member:
   Leave the Course Space first.

   Owner:
   Delete/dissolve the Course Space first.
========================================================= */

export async function deleteCourse(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();

  const courseId = String(formData.get("course_id") ?? "");

  if (!courseId) {
    throw new Error("Course ID is required.");
  }

  // Check ownership and Course Space relationship first.
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select(
      `
      id,
      course_space_id
    `,
    )
    .eq("id", courseId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (courseError) {
    throw new Error(courseError.message);
  }

  if (!course) {
    throw new Error("Course not found.");
  }

  /*
   * Defensive backend check.
   *
   * Normally the UI should hide the Delete Course
   * button while a course is connected to a space.
   */
  if (course.course_space_id) {
    throw new Error(
      "This course is connected to a Course Space. Leave or delete the Course Space before deleting this course.",
    );
  }

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAcademicPages();
}
