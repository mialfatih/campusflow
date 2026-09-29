"use client";

import { useActionState, useEffect, useRef } from "react";

import { SubmitButton } from "@/components/submit-button";

import { updateProfile, type ProfileActionState } from "./actions";

type ProfileFormProps = {
  username: string;
  fullName: string;
  university: string;
  major: string;
  bio: string;
};

const initialState: ProfileActionState = {
  status: "idle",
  message: "",
};

export function ProfileForm({
  username,
  fullName,
  university,
  major,
  bio,
}: ProfileFormProps) {
  const [state, formAction] = useActionState(updateProfile, initialState);

  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "idle" && messageRef.current) {
      messageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className="mt-8 space-y-5 rounded-2xl border bg-white p-6 sm:p-7"
    >
      {/* RESULT MESSAGE */}

      {state.status !== "idle" && (
        <div
          ref={messageRef}
          role={state.status === "error" ? "alert" : "status"}
          className={`rounded-xl border p-4 ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                state.status === "success"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {state.status === "success" ? "✓" : "!"}
            </div>

            <div>
              <p
                className={`text-sm font-semibold ${
                  state.status === "success"
                    ? "text-emerald-950"
                    : "text-red-950"
                }`}
              >
                {state.status === "success"
                  ? "Profile updated"
                  : "Could not save profile"}
              </p>

              <p
                className={`mt-1 text-sm leading-6 ${
                  state.status === "success"
                    ? "text-emerald-800"
                    : "text-red-700"
                }`}
              >
                {state.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* USERNAME */}

      <div>
        <label
          htmlFor="username"
          className="text-sm font-medium text-slate-700"
        >
          Username
        </label>

        <input
          id="username"
          name="username"
          defaultValue={username}
          required
          minLength={3}
          maxLength={30}
          autoComplete="username"
          spellCheck={false}
          pattern="[a-z0-9._-]{3,30}"
          title="3–30 lowercase letters, numbers, dots, underscores, or hyphens."
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500"
        />

        <p className="mt-2 text-xs leading-5 text-slate-400">
          3–30 characters. Use lowercase letters, numbers, dots, underscores, or
          hyphens.
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          Your username is unique and is used in your CampusFlow profile URL.
        </p>
      </div>

      {/* FULL NAME */}

      <Field
        label="Full name"
        name="full_name"
        defaultValue={fullName}
        required
        autoComplete="name"
      />

      {/* UNIVERSITY */}

      <Field
        label="University"
        name="university"
        defaultValue={university}
        placeholder="Universitas Pendidikan Indonesia"
      />

      {/* MAJOR */}

      <Field
        label="Major"
        name="major"
        defaultValue={major}
        placeholder="Computer Science Education"
      />

      {/* BIO */}

      <div>
        <label htmlFor="bio" className="text-sm font-medium text-slate-700">
          Bio
        </label>

        <textarea
          id="bio"
          name="bio"
          defaultValue={bio}
          rows={4}
          maxLength={500}
          placeholder="A short introduction..."
          className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500"
        />

        <p className="mt-2 text-xs text-slate-400">
          Optional · Maximum 500 characters.
        </p>
      </div>

      {/* SUBMIT */}

      <SubmitButton
        pendingText="Saving..."
        className="w-full rounded-lg bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Save profile
      </SubmitButton>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required = false,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500"
      />
    </div>
  );
}
