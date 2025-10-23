/** Сервис с url http методов */
export const API_ENDPOINTS = {
  todos: {
    list: () => '/todos' as const,
    byId: (id: number) => `/todos/${id}` as const,
  },
  users: {
    me: () => '/users/me' as const,
    list: (params?: { page: number }) => `/users${params ? `?page=${params.page}` : ''}` as const,
  },
} as const;
