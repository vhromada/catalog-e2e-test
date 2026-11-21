import { expect, type Locator, type Page } from '@playwright/test';

export class WalkthroughFormPage {

  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly content: Locator;
  readonly previewToggle: Locator;
  readonly preview: Locator;
  readonly bold: Locator;
  readonly italic: Locator;
  readonly underline: Locator;
  readonly heading: Locator;
  readonly subheading: Locator;
  readonly colorInput: Locator;
  readonly color: Locator;
  readonly backgroundInput: Locator;
  readonly background: Locator;
  readonly table: Locator;
  readonly tableHeader: Locator;
  readonly tableRow: Locator;
  readonly tableAddColumn: Locator;
  readonly tableRemoveRow: Locator;
  readonly tableRemoveColumn: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.addHeading = page.getByRole('heading', {name: 'Add walkthrough'});
    this.editHeading = page.getByRole('heading', {name: 'Edit walkthrough'});
    this.content = page.locator('#content');
    this.previewToggle = page.locator('#contentPreview');
    this.preview = page.locator('.rich-preview .rich-content');
    this.bold = page.locator('button[title="Bold"]');
    this.italic = page.locator('button[title="Italic"]');
    this.underline = page.locator('button[title="Underline"]');
    this.heading = page.locator('button[title="Heading"]');
    this.subheading = page.locator('button[title="Subheading"]');
    this.colorInput = page.locator('input[type="color"][title="Text color"]');
    this.color = page.locator('button[title="Text color"]');
    this.backgroundInput = page.locator('input[type="color"][title="Background color"]');
    this.background = page.locator('button[title="Background color"]');
    this.table = page.locator('button[title="Table"]');
    this.tableHeader = page.locator('button[title="Add header"]');
    this.tableRow = page.locator('button[title="Add row"]');
    this.tableAddColumn = page.locator('button[title="Add column"]');
    this.tableRemoveRow = page.locator('button[title="Remove row"]');
    this.tableRemoveColumn = page.locator('button[title="Remove column"]');
    this.createButton = page.locator('#create');
    this.updateButton = page.locator('#update');
    this.cancelButton = page.locator('#cancel');
  }

  async gotoAdd(gameUuid: string): Promise<void> {
    await this.page.goto(`/games/${gameUuid}/walkthroughs/add`);
  }

  async gotoEdit(gameUuid: string, uuid: string): Promise<void> {
    await this.page.goto(`/games/${gameUuid}/walkthroughs/${uuid}`);
  }

  async select(start: number, end = start): Promise<void> {
    await this.content.evaluate((element: HTMLTextAreaElement, range: number[]) => {
      element.focus();
      element.setSelectionRange(range[0], range[1]);
      element.dispatchEvent(new Event('select'));
    }, [start, end]);
  }

  async create(content: string): Promise<void> {
    await this.content.fill(content);
    await this.createButton.click();
  }

  async update(content: string): Promise<void> {
    await this.content.fill(content);
    await this.updateButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.page.getByText(message, {exact: true})).toBeVisible();
  }

  async expectNoError(message: string): Promise<void> {
    await expect(this.page.getByText(message, {exact: true})).toHaveCount(0);
  }

  async expectAddOpen(gameUuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/games/${gameUuid}/walkthroughs/add$`));
    await expect(this.addHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.updateButton).toHaveCount(0);
  }

  async expectEditOpen(gameUuid: string, uuid: string, content: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/games/${gameUuid}/walkthroughs/${uuid}$`));
    await expect(this.editHeading).toBeVisible();
    await expect(this.updateButton).toBeVisible();
    await expect(this.createButton).toHaveCount(0);
    await expect(this.content).toHaveValue(content);
  }

}
