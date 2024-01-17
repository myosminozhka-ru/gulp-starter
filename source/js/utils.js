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
