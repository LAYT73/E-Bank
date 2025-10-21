beforeAll(() => {
  console.info = jest.fn(); // отключаем INFO
  console.warn = jest.fn(); // отключаем WARN
  console.error = jest.fn(); // отключаем ERROR
});
