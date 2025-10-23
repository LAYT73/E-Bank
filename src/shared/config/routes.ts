export const APP_ROUTES = {
  home: '/',
  about: '/about',
  user: (id: string) => `/users/${id}`,
} as const;
