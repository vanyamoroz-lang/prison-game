export async function api(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(endpoint, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include', // ВАЖНО для передачи куки
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Ошибка сервера');
  }
  return res.json();
}