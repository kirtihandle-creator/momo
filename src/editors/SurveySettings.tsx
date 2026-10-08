import { useCallback, useEffect, useMemo, useState } from "react";

export interface SurveyValues {
  name: string;
  email: string;
  enabled: boolean;
  owner: string;
}

export type SurveyErrors = Partial<Record<keyof SurveyValues, string>>;

export interface SurveySettingsProps {
  title?: string;
  initialValues?: Partial<SurveyValues>;
  onSubmit?: (values: SurveyValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: SurveyValues = {
  name: "",
  email: "",
  enabled: false,
  owner: "",
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateSurvey(values: SurveyValues): SurveyErrors {
  const errors: SurveyErrors = {};
  if (values.name.trim().length < 5) errors.name = "name must be at least 5 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.owner.length > 41) errors.owner = "owner must be at most 41 characters";
  return errors;
}

export function SurveySettings({ title = "Survey Settings", initialValues, onSubmit, onCancel }: SurveySettingsProps) {
  const [values, setValues] = useState<SurveyValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof SurveyValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateSurvey(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof SurveyValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 1750);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof SurveyValues>(key: K, value: SurveyValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof SurveyValues) => (submitted || touched[key]) && errors[key];

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
    <form className="survey-settings" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="survey-name">Name</label>
      <input id="survey-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="survey-email">Email</label>
      <input id="survey-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="survey-owner">Owner</label>
        <input id="survey-owner" value={values.owner} onChange={(e) => update("owner", e.target.value)} />
      {showError("owner") && <small role="alert">{errors.owner}</small>}
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

export default SurveySettings;
