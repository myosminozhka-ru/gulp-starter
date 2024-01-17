# Папка для иконок подающих в стак или спрайт

1. Все названия написаны латиницей с маленькой буквы, отделены тире. 
2. Из названия должно быть понятно что изображено на картинке

### Неправильно
```shell
└── source/
    └── icons/
        ├── advantages-1.svg
        ├── close button.svg
        ├── groupIcons.svg
        ├── lg-x-t.svg
        └── Иконка.svg
```
### Правильно
```shell
└── source/
    └── icons/
        ├── menu.svg
        ├── close.svg
        ├── user.svg
        └── credit-card.svg
```

## Подключение иконки с помощью тега `svg`
```html
<svg width="18" height="12">
  <use href="../images/stack.svg#clock"></use>
</svg>
```

## Подключение иконки в стилях
```css
.icon::before{
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 32px;
  height: 32px;
  mask-image: url("../images/stack.svg#close");
  mask-size: contain;
  mask-position: -8px;
  mask-repeat: no-repeat;
  background-color: red;
}
```
