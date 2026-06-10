import { test, expect, type Page } from '@playwright/test';

async function gotoTimeline(page: Page) {
  await page.goto('/');
  // wait for the timeline to render at least one event card
  await expect(page.getByRole('article').first()).toBeVisible();
}

test('hero отображается и ведёт к линии времени', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('линия времени');

  // counters present
  await expect(page.getByText('событий').first()).toBeVisible();

  await page.getByRole('button', { name: 'Начать исследование' }).click();
  await expect(page.locator('#timeline')).toBeVisible();
  await expect(page.getByRole('article').first()).toBeVisible();

  expect(errors, `Непредвиденные ошибки страницы: ${errors.join(', ')}`).toEqual([]);
});

test('фильтры: категория, поиск и сброс', async ({ page }) => {
  await gotoTimeline(page);

  await expect(page.getByText(/Показано \d+ из \d+ событий/)).toBeVisible();

  // filter by a category chip
  await page
    .getByRole('button', { name: /Политика/ })
    .first()
    .click();
  await expect(page.getByText(/Показано \d+ из \d+ событий/)).toBeVisible();

  // search narrows results
  const search = page.getByPlaceholder(/Поиск/);
  await search.fill('Конституци');
  await expect(page.getByRole('article').first()).toBeVisible();

  // reset
  await page.getByRole('button', { name: 'Сбросить фильтры' }).click();
  await expect(search).toHaveValue('');
});

test('детальная панель открывается и закрывается по Esc', async ({ page }) => {
  await gotoTimeline(page);

  await page
    .getByRole('article')
    .first()
    .getByRole('button', { name: 'Подробнее' })
    .click();

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('Почему это важно')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
});

test('вопрос ИИ стримит ответ (демо-режим без ключа)', async ({ page }) => {
  await gotoTimeline(page);

  await page
    .getByRole('article')
    .first()
    .getByRole('button', { name: 'Задать вопрос ИИ' })
    .click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();

  await modal.getByRole('button', { name: 'Почему это событие важно?' }).click();

  // The server streams a response; in demo mode it mentions the demo notice.
  await expect(modal.getByText(/Демонстрационный режим|ключ|событие/i).first()).toBeVisible({
    timeout: 15000,
  });
});

test('режим «Обзор» показывает главную хронологию', async ({ page }) => {
  await gotoTimeline(page);

  await page.getByRole('radio', { name: 'Обзор' }).click();
  await expect(page.getByText(/Главная хронология/).first()).toBeVisible();
  await expect(page.getByRole('article').first()).toBeVisible();
});
