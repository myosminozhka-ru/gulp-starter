/**
 * @event pluralFormat
 * @param num {number}
 * @param one {string}
 * @param two {string}
 * @param many {string}
 * @description Функция добавления верных окончаний для числительных
 */
export function pluralFormat(num, one, two, many) {
  var endOnOne = num % 10 === 1 && num % 100 !== 11;
  var endOnTwo = num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20);
  var notOne = endOnTwo ? two : many;
  return endOnOne ? one : notOne;
}

/**
 * @event toggleClassHandler
 * @param element {HTMLElement}
 * @param otherElems {HTMLAllCollection}
 * @param className {string}
 * @description Добавление - удаление класса. Если есть сородичи, удалить сначала класс у них.
 */
export function toggleClassHandler(element, otherElems, className = 'active') {
  if (element.classList.contains(className)) {
    element.classList.remove(className);
  } else {
    if (otherElems) {
      otherElems.forEach(otherEl => removeClass(otherEl));
    }
    element.classList.add(className);
  }
}
/**
 * @event formatMoney
 * @param sliderEl {HTMLElement}
 * @param swiperArrows {HTMLElement}
 * @param swiperCounter {HTMLElement}
 * @description Слайдер универсальный.
 * Пример добавления разных размеров data-slide-count='{"default":1.3, "sm":2.2, "md":2.5, "lg":3.2, "xl":4}' и отступов data-between='{"default":16, "lg":20}'
 */
window.sliderInit = function(sliderEl, swiperArrows, swiperCounter){
  const swiperPrev = swiperArrows ? swiperArrows.querySelector('[data-slider-prev]') : null;
  const swiperNext = swiperArrows ? swiperArrows.querySelector('[data-slider-next]') : null;
  const swiperCountSlide = sliderEl.dataset.slideCount;
  const swiperBetweenSlide = sliderEl.dataset.between;
  //Точки пагинации или счетчик слайдов
  let pagination = {
    el: null,
  };
  if(swiperCounter) {
    pagination = {
      el: swiperCounter,
      type: 'custom',
      renderCustom: function (swiper, current, total) {
        const position = 100 - (current / total * 100);
        const progressBarHtml = `<div class="swiper-progressbar"><div class="swiper-progressbar__fill" style="transform: translateX(-${position}%)"></div></div>`;
        const counterHtml = `<div class="swiper-counter">${current}/${total}</div>`

        return progressBarHtml + counterHtml;
      }
    }
  }

  // Сбор количества слайдов и отступов для брейкпоинтов
  let slidesPerView = 1;
  let swiperBreakpoints = {};
  let spaceBetween = 20;
  const breakpointConfig = {
    360: 'xs',
    576: 'sm',
    767: 'md',
    992: 'lg',
    1200: 'xl',
    1443: 'xxl'
  };
  if (swiperCountSlide) {
    try {
      const breakpoints = JSON.parse(swiperCountSlide);
      slidesPerView = breakpoints.default || 1; // Гарантируем slidesPerView имеет значение по умолчанию

      for (const width in breakpointConfig) {
        if (breakpointConfig.hasOwnProperty(width)) {
          const breakpointKey = breakpointConfig[width];
          let slidesPerViewValue = breakpoints[breakpointKey];

          if (width === '360') {
            slidesPerViewValue = breakpoints.xs || breakpoints.default;
          }  else if (width === '1443') {
            slidesPerViewValue = breakpoints.xxl || breakpoints.xl;
          }


          if (typeof slidesPerViewValue === 'number') {
            swiperBreakpoints[width] = {
              slidesPerView: slidesPerViewValue
            };
          }
        }
      }
    } catch (error) {
      console.error("Ошибка при разборе swiperCountSlide:", error);
    }
  }
  if (swiperBetweenSlide) {
    try {
      const between = JSON.parse(swiperBetweenSlide);
      spaceBetween = between.default || 20; // Гарантируем spaceBetween имеет значение по умолчанию

      // Проходим по существующим точкам останова в swiperBreakpoints и добавляем spaceBetween
      for (const width in swiperBreakpoints) {
        if (swiperBreakpoints.hasOwnProperty(width)) {
          let spaceBetweenValue;
          if (width === '360') {
            spaceBetweenValue = between.xs || between.default;
          } else if (width === '1443'){
            spaceBetweenValue = between.xxl || between.xl || between.default;
          } else {
            // Используем breakpointConfig для определения ключа
            const breakpointKey = breakpointConfig[width];
            spaceBetweenValue = between[breakpointKey] || between.default;


          }


          if (typeof spaceBetweenValue === 'number') {
            swiperBreakpoints[width].spaceBetween = spaceBetweenValue;
          }
        }
      }
    } catch (error) {
      console.error("Ошибка при разборе swiperBetweenSlide:", error);
      // Здесь можно предусмотреть обработку ошибки, например, показать сообщение пользователю
    }
  }

  // Инициализация слайдера
  return new Swiper(sliderEl, {
    slidesPerView,
    spaceBetween,
    watchSlidesProgress: true,
    autoHeight: sliderEl.dataset.slider === 'auto-height' || false,
    effect: sliderEl.dataset.slider === 'fade' ? "fade" : false,
    lazy: {
      enabled: true,
      loadOnTransitionStart: true
    },
    pagination,
    navigation: {
      nextEl: swiperNext,
      prevEl: swiperPrev
    },
    breakpoints: swiperBreakpoints,
    on: {
      lock: function () {
        if(swiperArrows) swiperArrows.classList.add('hidden');
      },
      unlock: function(){
        if(swiperArrows) swiperArrows.classList.remove('hidden')
      }
    },
  });
}
