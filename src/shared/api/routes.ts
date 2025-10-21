/** Сервис с доступными для навигации маршрутами */
export interface IRoute {
  (): string;
}

export type RoutesEnum = 'main';

export const routes: { [key in RoutesEnum]: IRoute } = {
  main: () => '/',
};
