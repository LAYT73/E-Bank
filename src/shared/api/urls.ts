/** Сервис с url http методов */
type IUrl = () => string;

export type Urls = {
  getMain: IUrl;
};

export const urls: Urls = {
  getMain: () => '/',
};
