import { useEffect, useRef, useState } from "react";
import { _subscribeConfirm, _resolveConfirm } from "../utils/confirmDialog.js";

const toneStyles = {
  primary: { btn: "bg-blue-600 hover:bg-blue-700", ring: "ring-blue-100", icon: "text-blue-600 bg-blue-50" },
  danger: { btn: "bg-rose-600 hover:bg-rose-700", ring: "ring-rose-100", icon: "text-rose-600 bg-rose-50" },
  success: { btn: "bg-emerald-600 hover:bg-emerald-700", ring: "ring-emerald-100", icon: "text-emerald-600 bg-emerald-50" },
  warning: { btn: "bg-amber-600 hover:bg-amber-700", ring: "ring-amber-100", icon: "text-amber-600 bg-amber-50" },
};

export default function ConfirmHost() {
  const [state, setState] = useState({ open: false });
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    return _subscribeConfirm((next) => {
      setState((prev) => ({ ...prev, ...next }));
      if (next.open && next.input) {
        setText(next.input.defaultValue || "");
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    });
  }, []);

  if (!state.open) return null;

  const isPrompt = Boolean(state.input);
  const tone = toneStyles[state.variant] || toneStyles.primary;

  const cancel = () => _resolveConfirm(isPrompt ? null : false);
  const confirm = () => {
    if (isPrompt) {
      if (state.input.required && !text.trim()) return;
      _resolveConfirm(text.trim());
    } else {
      _resolveConfirm(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/55 p-4"
      onClick={cancel}
      onKeyDown={(e) => {
        if (e.key === "Escape") cancel();
        if (e.key === "Enter" && !isPrompt) confirm();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 pt-6">
          <h3 className="text-base font-bold text-slate-900">{state.title}</h3>
          {state.message && (
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{state.message}</p>
          )}
          {isPrompt && (
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={state.input.rows || 3}
              placeholder={state.input.placeholder || ""}
              className="mt-4 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          )}
        </div>
        <div className="flex justify-end gap-2.5 px-6 py-5">
          <button
            type="button"
            onClick={cancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {state.cancelText}
          </button>
          <button
            type="button"
            onClick={confirm}
            className={`rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-4 ${tone.btn} ${tone.ring}`}
          >
            {state.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
