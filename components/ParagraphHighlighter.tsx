"use client";

import { useEffect, useRef } from "react";

export function useParagraphHighlighter() {
  const highlightedIdsRef = useRef<Set<string>>(new Set());

  const highlightParagraphs = (ids: string[]) => {
    console.log("highlightParagraphs вызван с ids:", ids);
    
    // Снимаем предыдущую подсветку
    highlightedIdsRef.current.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.remove("bg-yellow-200", "ring-2", "ring-yellow-400");
      }
    });

    highlightedIdsRef.current.clear();

    // Добавляем новую подсветку
    let foundCount = 0;
    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.add("bg-yellow-200", "ring-2", "ring-yellow-400");
        highlightedIdsRef.current.add(id);
        foundCount++;
        console.log(`Подсвечен параграф с id: ${id}`);
      } else {
        console.warn(`Параграф с id "${id}" не найден в DOM`);
      }
    });
    
    console.log(`Найдено и подсвечено ${foundCount} из ${ids.length} параграфов`);
  };

  const clearHighlight = () => {
    highlightedIdsRef.current.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.remove("bg-yellow-200", "ring-2", "ring-yellow-400");
      }
    });
    highlightedIdsRef.current.clear();
  };

  const scrollToParagraph = (id: string) => {
    console.log("scrollToParagraph вызван с id:", id);
    const element = document.getElementById(id);
    if (element) {
      // Ищем контейнер с прокруткой (левая панель с договором)
      // ContractViewer находится в div с классом overflow-y-auto
      let scrollContainer: HTMLElement | null = null;
      let current: HTMLElement | null = element.parentElement;
      
      while (current) {
        if (current.classList.contains('overflow-y-auto')) {
          scrollContainer = current;
          break;
        }
        current = current.parentElement;
      }
      
      if (scrollContainer) {
        // Получаем позиции элементов относительно viewport
        const elementRect = element.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        
        // Вычисляем позицию элемента относительно контейнера
        const elementTopRelativeToContainer = elementRect.top - containerRect.top + scrollContainer.scrollTop;
        
        // Вычисляем позицию для центрирования элемента в контейнере
        // Добавляем небольшой отступ сверху для лучшей видимости
        const containerHeight = containerRect.height;
        const elementHeight = elementRect.height;
        const offset = 40; // Отступ сверху в пикселях
        const targetScrollTop = elementTopRelativeToContainer - offset - (containerHeight / 2) + (elementHeight / 2);
        
        scrollContainer.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: "smooth"
        });
        console.log(`Прокрутка к параграфу ${id} выполнена в контейнере, scrollTop: ${targetScrollTop}`);
      } else {
        // Fallback на стандартный scrollIntoView с правильными опциями
        element.scrollIntoView({ 
          behavior: "smooth", 
          block: "center",
          inline: "nearest"
        });
        console.log(`Прокрутка к параграфу ${id} выполнена через scrollIntoView`);
      }
    } else {
      console.warn(`Элемент с id "${id}" не найден для прокрутки`);
      // Попробуем найти все элементы с похожими ID для отладки
      const allParagraphs = document.querySelectorAll('[id^="p"]');
      console.log(`Найдено ${allParagraphs.length} элементов с ID, начинающихся с "p"`);
    }
  };

  return {
    highlightParagraphs,
    clearHighlight,
    scrollToParagraph,
  };
}

