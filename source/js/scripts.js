window.addEventListener('DOMContentLoaded', () => {
  // Инициализация всей слайдеров на странице по дата атрибуту
  const sliderSectionElems = document.querySelectorAll('[data-slider]');
  if (sliderSectionElems.length > 0) {
    sliderSectionElems.forEach(sliderSectionEl => {
      const swiperWrapper = sliderSectionEl.closest('[data-slider-section]');
      const swiperArrows = swiperWrapper.querySelector('[data-slider-arrows]');
      const swiperCounter = swiperWrapper.querySelector('[data-slider-counter]') || null;
      sliderInit(sliderSectionEl, swiperArrows, swiperCounter);
    });
  }
})
