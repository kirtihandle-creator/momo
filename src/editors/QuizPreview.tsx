import { useCallback, useEffect, useMemo, useState } from "react";

export interface QuizValues {
  name: string;
  email: string;
  enabled: boolean;
  region: string;
}

export type QuizErrors = Partial<Record<keyof QuizValues, string>>;

export interface QuizPreviewProps {
  title?: string;
  initialValues?: Partial<QuizValues>;
  onSubmit?: (values: QuizValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: QuizValues = {
  name: "",
  email: "",
  enabled: true,
  region: "",
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateQuiz(values: QuizValues): QuizErrors {
  const errors: QuizErrors = {};
  if (values.name.trim().length < 4) errors.name = "name must be at least 4 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.region.length > 44) errors.region = "region must be at most 44 characters";
  return errors;
}

export function QuizPreview({ title = "Quiz Preview", initialValues, onSubmit, onCancel }: QuizPreviewProps) {
  const [values, setValues] = useState<QuizValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof QuizValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateQuiz(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof QuizValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 2500);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof QuizValues>(key: K, value: QuizValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof QuizValues) => (submitted || touched[key]) && errors[key];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) return;
    onSubmit?.(values);
    setSavedAt(new Date().toLocaleTimeString());
  };

  const handleReset = () => {
    setValues({ ...DEFAULTS, ...initialValues });
    setTouched({});
    setSubmitted(false);
    onCancel?.();
  };

  return (
    <form className="quiz-preview" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="quiz-name">Name</label>
      <input id="quiz-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="quiz-email">Email</label>
      <input id="quiz-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="quiz-region">Region</label>
        <input id="quiz-region" value={values.region} onChange={(e) => update("region", e.target.value)} />
      {showError("region") && <small role="alert">{errors.region}</small>}
      <label>
        <input type="checkbox" checked={values.enabled} onChange={(e) => update("enabled", e.target.checked)} /> Enabled
      </label>
      <footer>
        <button type="submit" disabled={submitted && !isValid}>Save</button>
        <button type="button" onClick={handleReset} disabled={!isDirty}>Reset</button>
        {savedAt && <span>Saved at {savedAt}</span>}
      </footer>
    </form>
  );
}

export default QuizPreview;
