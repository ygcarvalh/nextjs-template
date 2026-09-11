export function formOf(field: string, value: string): FormData {
  const form = new FormData();
  form.set(field, value);
  return form;
}

export function reload(): void {
  window.location.reload();
}
