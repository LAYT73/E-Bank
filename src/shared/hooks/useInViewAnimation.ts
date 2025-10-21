import { useEffect } from 'react';

/**
 * Хук, активирующий CSS-анимации при попадании элементов в область видимости (viewport).
 *
 * Добавляет класс `in-view` к каждому элементу с указанным селектором, когда он появляется в зоне видимости.
 * Полезен для триггера анимаций, таких как `fade-in-up`, `fade-in-left` и т.д.
 *
 * @param selector CSS-селектор элементов, за которыми нужно следить. По умолчанию включает все основные анимируемые классы.
 * @param [threshold=0.2] процент от 0 до 1, который включает анимацию по достижению контейнера нужного процентного попадания в область видимости. По умолчанию 0.2 (20%).
 */
export function useInViewAnimation(
  selector: string = '.fade-in-up, .fade-in-down, .fade-in-left, .fade-in-scale',
  threshold: number = 0.2,
): void {
  useEffect(() => {
    const elements: NodeListOf<HTMLElement> = document.querySelectorAll(selector);

    const observer: IntersectionObserver = new IntersectionObserver(
      (entries: IntersectionObserverEntry[], obs: IntersectionObserver): void => {
        entries.forEach((entry: IntersectionObserverEntry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.classList.add('in-view');
            obs.unobserve(target); // Отключаем, чтобы анимация сработала только один раз
          }
        });
      },
      {
        threshold,
      },
    );

    elements.forEach((el: HTMLElement) => observer.observe(el));

    return () => {
      observer.disconnect(); // Очистка обзервера при размонтировании
    };
  }, [selector, threshold]);
}
