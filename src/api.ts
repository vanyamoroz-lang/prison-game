export async function api(endpoint: string, options: RequestInit = {}) {
  // Заголовки собираем через Headers, чтобы не потерять Content-Type,
  // если в options передан собственный headers.
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const res = await fetch(endpoint, {
    credentials: 'include', // ВАЖНО для передачи куки
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Ошибка сервера');
  }
  return res.json();
}