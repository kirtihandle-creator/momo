import { Button } from "./Button";

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div><p role="alert">{message}</p>{onRetry && <Button onClick={onRetry}>Try again</Button>}</div>;
}
