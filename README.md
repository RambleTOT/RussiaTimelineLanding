# Россия 1991–2022: линия времени

Интерактивный **цифровой исторический атлас** — вертикальная линия времени ключевых
событий современной России. Светлый редакционный «бумажный» лендинг (шрифт **Onest**):
плавный скролл, заполняющаяся линия времени, карточки с реальными изображениями событий
и цветовыми акцентами категорий, центрированное модальное окно по «Подробнее» и
возможность задать вопрос ИИ по каждому событию.

> Источник данных — `История_России_1991-2022_события.xlsx` (лист «Все события» —
> 90 событий, лист «Главная хронология» — 27 вех).

---

## 🚀 Быстрый старт

```bash
# 1. Установить зависимости
npm install

# 2. (один раз) сгенерировать src/data/events.json из Excel
npm run import:xlsx

# 3. (необязательно) подтянуть изображения событий из Wikipedia
npm run fetch:images

# 4. Запустить дев-сервер (фронтенд + /api/ask-event в одном процессе)
npm run dev          # http://localhost:5173

# 4. Прод-сборка и предпросмотр
npm run build
npm run preview
```

Приложение работает **без всяких ключей** — AI-эндпоинт отвечает в безопасном
демонстрационном режиме, пока не задан `OPENAI_API_KEY`.

---

## 🔑 Настройка `.env`

```bash
cp .env.example .env
```

| Переменная        | Назначение                                                       |
| ----------------- | --------------------------------------------------------------- |
| `OPENAI_API_KEY`  | Ключ OpenAI. **Только на сервере**, в браузер не попадает.       |
| `OPENAI_MODEL`    | Модель (по умолчанию `gpt-4.1-mini`).                           |
| `VITE_APP_TITLE`  | Заголовок вкладки (единственная переменная, видимая фронтенду).  |
| `SEARCH_PROVIDER` | `mock` (по умолчанию) или `tavily` — для обогащения источниками. |
| `TAVILY_API_KEY`  | Ключ Tavily, если включён реальный веб-поиск.                    |

`.env` **не коммитится** (см. `.gitignore`). Ключ читается только серверной частью
(Vite middleware в dev / Express в проде) — прямых запросов к OpenAI из браузера нет.

---

## 🧩 Архитектура

```
src/
  app/            App.tsx · providers.tsx  (React Query + Tooltip + MotionConfig)
  components/
    hero/         Hero — заголовок, счётчики, абстрактная линия времени
    intro/        IntroSection — блок «как читать атлас»
    filters/      TimelineFilters — sticky-панель (режим, поиск, категории, Кратко/Подробно)
    timeline/     Timeline · TimelineEventCard · TimelineProgressLine · StickyYearMarker
                  TimelineMinimap · EventDetailDrawer · TimelineSection
    ai/           AskAIModal · SuggestedQuestions · AIAnswer
    shared/       CategoryBadge · SourceList · EmptyState · ScrollToTopButton
    layout/       Container · Section · Footer · ReadingProgress
    ui/           shadcn-стиль примитивы (button, dialog, sheet, input, …)
  data/           events.json · main-events.json · events.enriched.json (генерируются)
  hooks/          use-smooth-scroll · use-deep-link · use-debounced-value · use-ask-event · …
  lib/            validators(zod) · categories · timeline · format · api · events-data · gsap
  server/         openai.ts · routes/askEvent.ts · vitePlugin.ts · index.ts
  scripts/        import-xlsx.ts · enrich-events.ts
  store/          ui-store.ts (zustand + persist в localStorage)
```

**Поток данных:** XLSX → `import:xlsx` → `events.json` (валидируется zod) → загружается и
мемоизируется в `events-data.ts` → фильтруется (`filterEvents`, debounce поиска) →
рендерится в `Timeline`.

**Безопасность AI:** фронтенд шлёт `POST /api/ask-event` (zod-валидация payload) →
сервер строит системный промпт и стримит ответ из OpenAI обратно по чанкам. Ключ
никогда не покидает сервер. Один и тот же обработчик подключён к Vite-серверу (dev +
preview) и к Express (`npm run server`).

**Анимации:** Lenis (плавный скролл) ⇄ GSAP ScrollTrigger (заполнение линии) +
Framer Motion (появление карточек, модалки, hero). Всё уважает `prefers-reduced-motion`.

---

## ✨ Реализованные возможности

- **Hero** с крупной типографикой, счётчиками (count-up) и абстрактной линией времени.
- **Вертикальная timeline**: заполняющаяся линия, точки-категории, sticky-маркер года,
  группировка по годам, появление карточек (fade + slide). У каждой карточки —
  **реальное изображение события** (Wikipedia) с аккуратным запасным «обложечным»
  вариантом по категории, если фото не найдено.
- **Светлая редакционная тема**: тёплая «бумага», единый шрифт **Onest**, без капса,
  без тяжёлых градиентов/«стекла» — спокойный музейно-архивный тон.
- **Sticky-фильтры**: режим *Обзор / Все события*, поиск (debounce), 7 категорий с
  цветовыми акцентами, переключатель *Кратко / Подробно*, сброс фильтров.
- **Мини-карта** годов справа с подсветкой текущей позиции (desktop).
- **Центрированное модальное окно** по «Подробнее»: обложка-изображение, год, период,
  категория, «почему важно», источники, блок «Спросить ИИ».
- **Ask AI modal**: быстрые вопросы, недавние вопросы (sessionStorage), **стриминг**
  ответа, loading-state, обработка ошибок, предупреждение о возможных ошибках ИИ.
- **Deep links / share**: `#event-<id>` — копирование ссылки и автоскролл к событию.
- **Сохранение состояния** (режим, категории, плотность) в `localStorage`.
- **Reading progress**, **scroll-to-top**, **empty state**, полная адаптивность
  (desktop → tablet → одноколоночный mobile).
- **A11y**: фокус-кольца, навигация с клавиатуры, закрытие модалок по `Esc`,
  `aria-label`, поддержка reduced-motion.

---

## 🛠 Команды

| Команда                          | Действие                                              |
| -------------------------------- | ----------------------------------------------------- |
| `npm run dev`                    | Дев-сервер (Vite + API).                              |
| `npm run build`                  | Проверка типов + прод-сборка.                         |
| `npm run preview`                | Предпросмотр сборки (с API).                          |
| `npm run server`                 | Express-сервер для прода (`dist/` + API).             |
| `npm run import:xlsx`            | Excel → `src/data/*.json`.                            |
| `npm run enrich:events`          | Источники из сети (`-- --limit=10` — первые N).       |
| `npm run fetch:images`           | Изображения событий из Wikipedia (`-- --limit=10`).   |
| `npm run lint` / `npm run format`| ESLint / Prettier.                                    |
| `npm run test:e2e`               | Playwright (desktop + mobile).                        |

---

## 🌐 Обогащение источниками

`npm run enrich:events` ищет 1–3 надёжных источника на событие и пишет их в
`src/data/events.enriched.json` (мёржится в карточки по `id`).

Архитектура построена на адаптере `SearchProvider`:

- **`MockSearchProvider`** (по умолчанию) — ничего не возвращает, **источники не
  выдумываются**, проект работает без ключей.
- **`TavilySearchProvider`** — реальный поиск (`SEARCH_PROVIDER=tavily` + `TAVILY_API_KEY`),
  результаты фильтруются по allow-list доверенных доменов (Britannica, BBC, Reuters,
  Kremlin.ru, энциклопедии и т.д.), с rate-limit между запросами.

## 🖼 Изображения событий

`npm run fetch:images` подбирает по каждому событию **реальное** ведущее изображение
лучшей по релевантности статьи русской Википедии (медиа Wikimedia, с указанием источника),
пропуская флаги/гербы/карты-схемы. Результат пишется в `events.enriched.json` (`image`) и
мёржится в карточки по `id`. Скрипт работает инкрементально (повторный запуск добирает
только недостающие), уважает rate-limit и `--limit=N`. Ссылки на изображения не
выдумываются: если статья/фото не найдены, поле остаётся пустым, а в UI показывается
обложка по категории.

---

## 📈 Что можно улучшить дальше

- Рендер Markdown в ответах ИИ + подсветка цитат.
- Полнотекстовый поиск с подсветкой совпадений и фильтром по диапазону лет.
- Кэш ответов ИИ и серверный rate-limit per-IP.
- Реальное обогащение источниками для всех 90 событий и ручная вычитка.
- Виртуализация списка для очень больших датасетов.
- Тёмная/светлая темы и экспорт события в изображение для шеринга.
```
# RussiaTimelineLanding
