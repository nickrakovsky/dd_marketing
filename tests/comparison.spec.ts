import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

async function openComparison(page: Page) {
  await page.goto('/comparison#comparison-table');
  const section = page.locator('#comparison-table');
  await section.scrollIntoViewIfNeeded();
  // This island hydrates on visibility; wait for its controls to be interactive.
  await expect(section.locator('astro-island[ssr]')).toHaveCount(0);
  await expect(section.getByRole('combobox', { name: 'First system', exact: true })).toBeVisible();
  return section;
}

function onboardingRow(section: Locator) {
  return section.getByRole('row').filter({
    has: section.page().getByRole('rowheader', { name: 'Carrier onboarding model', exact: true }),
  });
}

async function expectRowLayout(row: Locator, layout: 'stacked' | 'paired' | 'columns', visibleProductSlots: number) {
  await expect(row).toBeVisible();
  await expect(row.getByRole('cell')).toHaveCount(visibleProductSlots);
  const cells = row.locator('[role="rowheader"], [role="cell"]');
  await expect.poll(async () => cells.evaluateAll((elements) => {
    // Ignore any hidden cells while the viewport switches between layouts.
    const bounds = elements
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    return {
      visibleCellCount: bounds.length,
      stacked: bounds.every((rect, index) => index === 0 || (
        rect.top >= bounds[index - 1].bottom - 1
        && Math.abs(rect.left - bounds[0].left) < 1
      )),
      paired: bounds.length === 3
        && bounds[1].top >= bounds[0].bottom - 1
        && Math.abs(bounds[1].top - bounds[2].top) < 1
        && bounds[2].left >= bounds[1].right - 1
        && Math.abs(bounds[0].left - bounds[1].left) < 1
        && Math.abs(bounds[0].right - bounds[2].right) < 1,
      columns: bounds.every((rect, index) => index === 0 || (
        rect.left >= bounds[index - 1].right - 1
        && Math.abs(rect.top - bounds[0].top) < 1
      )),
    };
  })).toMatchObject({ visibleCellCount: visibleProductSlots + 1, [layout]: true });
}

async function expectFeatureFlow(rows: Locator, columns: 1 | 2) {
  await expect.poll(async () => rows.evaluateAll((elements, expectedColumns) => {
    const bounds = elements.map((element) => element.getBoundingClientRect());
    if (bounds.length < 3) return false;
    return bounds.every((rect, index) => {
      const column = index % expectedColumns;
      const previousRow = bounds.slice(Math.max(0, index - expectedColumns - column), index - column);
      return Math.abs(rect.left - bounds[column].left) < 1
        && (column === 0 || (
          rect.left >= bounds[index - 1].right - 1
          && Math.abs(rect.top - bounds[index - 1].top) < 1
        ))
        && (previousRow.length === 0 || rect.top >= Math.max(...previousRow.map((previous) => previous.bottom)) - 1);
    });
  }, columns)).toBe(true);
}

async function expectNoComparisonOverflow(section: Locator) {
  const overflow = await section.evaluate((element) => {
    const viewportWidth = document.documentElement.clientWidth;
    const visibleElements = [element, ...element.querySelectorAll('*')].filter((child) => {
      const bounds = child.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0;
    });
    return visibleElements
      .filter((child) => {
        const bounds = child.getBoundingClientRect();
        return bounds.left < -1 || bounds.right > viewportWidth + 1;
      })
      .map((child) => `${child.tagName}: ${child.textContent?.trim().slice(0, 80)}`);
  });
  expect(overflow, 'Comparison content must fit without being clipped at the viewport edge').toEqual([]);
}

test('comparison adapts two- and three-system layouts across phone, tablet, and desktop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const section = await openComparison(page);
  const firstSystem = section.getByRole('combobox', { name: 'First system', exact: true });
  const secondSystem = section.getByRole('combobox', { name: 'Second system', exact: true });
  const carrierGroup = section.getByRole('button', { name: 'Carrier Self-Booking Portal', exact: true });
  const scheduleGroup = section.getByRole('button', { name: 'Schedule Management & Automations', exact: true });
  const expandAll = section.getByRole('button', { name: 'Expand all', exact: true });
  const collapseAll = section.getByRole('button', { name: 'Collapse all', exact: true });
  const addSystem = section.getByRole('button', { name: 'Add another system', exact: true });
  const removeSystem = section.getByRole('button', { name: 'Remove additional system', exact: true });
  const row = onboardingRow(section);

  await expect(firstSystem).toHaveValue('c3-solutions');
  await expect(secondSystem).toBeVisible();
  await expect(secondSystem).toHaveValue('');
  await expect(expandAll).toBeHidden();
  await expect(collapseAll).toBeHidden();
  await expect(addSystem).toBeHidden();
  await expect(removeSystem).toBeHidden();
  await expect(section.locator('button[aria-expanded="true"]')).toHaveCount(0);
  await expect(carrierGroup).toHaveAttribute('aria-expanded', 'false');

  // Accordion navigation works with the keyboard as well as touch.
  await carrierGroup.focus();
  await carrierGroup.press('Enter');
  await expect(carrierGroup).toHaveAttribute('aria-expanded', 'true');
  await expectRowLayout(row, 'stacked', 2);

  // Mobile keeps one category open so changing categories does not build a long page.
  await scheduleGroup.click();
  await expect(scheduleGroup).toHaveAttribute('aria-expanded', 'true');
  await expect(carrierGroup).toHaveAttribute('aria-expanded', 'false');
  await expect(row).toBeHidden();
  await carrierGroup.click();
  await expect(scheduleGroup).toHaveAttribute('aria-expanded', 'false');
  await expect(carrierGroup).toHaveAttribute('aria-expanded', 'true');

  await secondSystem.selectOption('opendock');
  const visibleFeatureRows = section.getByRole('row').filter({ has: page.getByRole('rowheader') });
  await expect(visibleFeatureRows).toHaveCount(6);
  for (const featureRow of await visibleFeatureRows.all()) {
    await expect(featureRow.getByRole('cell')).toHaveCount(3);
    await expect(featureRow.getByRole('cell').nth(0)).toContainText('DataDocks');
    await expect(featureRow.getByRole('cell').nth(1)).toContainText('C3 Solutions');
    await expect(featureRow.getByRole('cell').nth(2)).toContainText('Opendock');
  }
  await expectRowLayout(row, 'stacked', 3);
  await expectNoComparisonOverflow(section);

  // Three systems stack within each feature; tablets show two feature cards across.
  for (const width of [320, 767, 768, 820, 899]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(expandAll).toBeHidden();
    await expect(collapseAll).toBeHidden();
    await expectRowLayout(row, 'stacked', 3);
    await expectFeatureFlow(visibleFeatureRows, width >= 768 ? 2 : 1);
    await expectNoComparisonOverflow(section);
  }

  // The matrix begins at 900px and also fits the previous tablet and desktop widths.
  for (const width of [900, 946, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await expectRowLayout(row, 'columns', 3);
    await expect(firstSystem).toHaveValue('c3-solutions');
    await expect(secondSystem).toHaveValue('opendock');
    await expect(carrierGroup).toHaveAttribute('aria-expanded', 'true');
    await expect(expandAll).toBeVisible();
    await expect(collapseAll).toBeVisible();
    await expectNoComparisonOverflow(section);
  }

  // Desktop can keep multiple categories expanded independently.
  await scheduleGroup.click();
  await expect(scheduleGroup).toHaveAttribute('aria-expanded', 'true');
  await expect(carrierGroup).toHaveAttribute('aria-expanded', 'true');

  // Returning to mobile normalizes multiple open categories without changing selections.
  await page.setViewportSize({ width: 899, height: 844 });
  await expect(section.locator('button[aria-expanded="true"]')).toHaveCount(1);
  await expect(scheduleGroup).toHaveAttribute('aria-expanded', 'false');
  await expect(carrierGroup).toHaveAttribute('aria-expanded', 'true');
  await expect(firstSystem).toHaveValue('c3-solutions');
  await expect(secondSystem).toHaveValue('opendock');
  await expectRowLayout(row, 'stacked', 3);
  await expectFeatureFlow(visibleFeatureRows, 2);
  await expect(expandAll).toBeHidden();
  await expect(collapseAll).toBeHidden();

  await page.setViewportSize({ width: 900, height: 900 });
  await expectRowLayout(row, 'columns', 3);

  // Desktop retains its compact add/remove controls with keyboard focus restoration.
  await removeSystem.focus();
  await removeSystem.press('Enter');
  await expect(secondSystem).toBeHidden();
  await expect(addSystem).toBeFocused();
  await expectRowLayout(row, 'columns', 2);
  await expectNoComparisonOverflow(section);

  await addSystem.click();
  await expect(secondSystem).toBeFocused();
  await expect(secondSystem).not.toHaveValue('');
  await expect(secondSystem).not.toHaveValue('c3-solutions');
  await expectRowLayout(row, 'columns', 3);
  await secondSystem.selectOption('opendock');

  await page.setViewportSize({ width: 390, height: 844 });
  await expectRowLayout(row, 'stacked', 3);
  await expect(addSystem).toBeHidden();
  await expect(removeSystem).toBeHidden();

  // On mobile, clearing the optional system keeps its selector available and focused.
  await secondSystem.focus();
  await secondSystem.selectOption('');
  await expect(secondSystem).toHaveValue('');
  await expect(secondSystem).toBeFocused();
  await expectRowLayout(row, 'stacked', 2);
  await expect(carrierGroup).toHaveAttribute('aria-expanded', 'true');
  await expectNoComparisonOverflow(section);

  // With two systems, tablets put both answers beside each other under a full-width title.
  for (const width of [767, 768, 820, 899]) {
    await page.setViewportSize({ width, height: 844 });
    await expectRowLayout(row, width >= 768 ? 'paired' : 'stacked', 2);
    await expectFeatureFlow(visibleFeatureRows, 1);
    await expectNoComparisonOverflow(section);

    if (width === 820) {
      // Changing selection rearranges the same feature content without requiring a resize.
      await secondSystem.selectOption('opendock');
      await expectRowLayout(row, 'stacked', 3);
      await expectFeatureFlow(visibleFeatureRows, 2);
      await secondSystem.selectOption('');
      await expectRowLayout(row, 'paired', 2);
      await expectFeatureFlow(visibleFeatureRows, 1);
      await expect(carrierGroup).toHaveAttribute('aria-expanded', 'true');
    }
  }

  for (const width of [900, 946, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(secondSystem).toBeHidden();
    await expect(addSystem).toBeVisible();
    await expectRowLayout(row, 'columns', 2);
    await expectNoComparisonOverflow(section);
  }
});

test('mobile comparison exposes support levels and passes scoped accessibility checks including contrast', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const section = await openComparison(page);
  await section.getByRole('combobox', { name: 'Second system', exact: true }).selectOption('opendock');
  await section.getByRole('button', { name: 'Carrier Self-Booking Portal', exact: true }).click();

  // Status remains available to screen readers independently of icon or colour.
  const row = onboardingRow(section);
  await expect(row.getByRole('cell').nth(0)).toHaveAccessibleName(/Full support/);
  await expect(row.getByRole('cell').nth(1)).toHaveAccessibleName(/Partial support/);
  const visibilityRow = section.getByRole('row').filter({
    has: page.getByRole('rowheader', { name: 'Portal visibility & access control', exact: true }),
  });
  await expect(visibilityRow.getByRole('cell').nth(0)).toHaveAccessibleName(/Standout/);
  await expect(visibilityRow.getByRole('cell').nth(2)).toHaveAccessibleName(/Not available/);

  const results = await new AxeBuilder({ page })
    .include('#comparison-table')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations,
    `Mobile comparison accessibility failures:\n${results.violations.map((violation) => (
      `[${violation.id}] ${violation.help}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`
    )).join('\n')}`,
  ).toHaveLength(0);
});

test('desktop comparison passes scoped accessibility checks except its preserved legacy color contrast', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 900, height: 900 });
  const section = await openComparison(page);
  await section.getByRole('button', { name: 'Add another system', exact: true }).click();
  await section.getByRole('combobox', { name: 'Second system', exact: true }).selectOption('opendock');
  await section.getByRole('button', { name: 'Expand all', exact: true }).click();

  // The user explicitly requested the original desktop status colors and controls.
  // Their small colored text has known contrast failures; this is not an AA claim.
  // The separate mobile check above retains color-contrast with no exception.
  testInfo.annotations.push({
    type: 'known accessibility limitation',
    description: 'Desktop retains the original low-contrast palette by request; color-contrast is excluded only from this desktop scan.',
  });
  const results = await new AxeBuilder({ page })
    .include('#comparison-table')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .disableRules(['color-contrast'])
    .analyze();
  expect(
    results.violations,
    `Desktop comparison accessibility failures (legacy color contrast excluded):\n${results.violations.map((violation) => (
      `[${violation.id}] ${violation.help}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`
    )).join('\n')}`,
  ).toHaveLength(0);
});
