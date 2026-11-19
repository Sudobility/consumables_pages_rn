/**
 * The coupon pages, held to @sudobility/consumables_pages' CreditCouponPages:
 * the same copy, the same client calls with the same arguments, and the rules
 * the web form leaves to the browser (`required`, `type`, `min`, `step`)
 * enforced before `createCreditCoupon` is ever reached.
 */
import { describe, it, expect, vi } from 'vitest';
import { __setWindowWidth } from 'react-native';
import type {
  ConsumablesApiClient,
  CreditCoupon,
} from '@sudobility/consumables_client';
import {
  ManageCreditCouponsPage,
  RedeemCreditCouponPage,
} from '../CreditCouponPages';
import { changeText, firePress, flushPromises, render } from './test-utils';

type MockClient = {
  redeemCreditCoupon: ReturnType<typeof vi.fn>;
  createCreditCoupon: ReturnType<typeof vi.fn>;
  listCreditCoupons: ReturnType<typeof vi.fn>;
};

function mockClient(overrides: Partial<MockClient> = {}): MockClient {
  return {
    redeemCreditCoupon: vi.fn().mockResolvedValue({ credits: 5, balance: 12 }),
    createCreditCoupon: vi.fn().mockResolvedValue({ code: 'NEWCODE1' }),
    listCreditCoupons: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

const asClient = (client: MockClient) =>
  client as unknown as ConsumablesApiClient;

/** The text of every `Text` on the page, in order. */
const texts = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-testid="Text"]')).map(
    node => node.textContent
  );

const field = (container: HTMLElement, label: string) =>
  container.querySelector(`input[aria-label="${label}"]`) as HTMLInputElement;

/** The pressable a label sits in. */
const button = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll('[role="button"]')).find(
    node => node.textContent === label
  ) as HTMLElement;

const isDisabled = (element: HTMLElement) =>
  element.getAttribute('aria-disabled') === 'true';

describe('RedeemCreditCouponPage', () => {
  it('says what it is and where the credits go', async () => {
    const { container } = await render(
      <RedeemCreditCouponPage
        client={asClient(mockClient())}
        entityName='Acme'
      />
    );
    expect(texts(container)).toEqual([
      'Redeem a credit coupon',
      'Credits are added to Acme.',
      'Redeem',
    ]);
    expect(container.querySelector('[role="heading"]')?.textContent).toBe(
      'Redeem a credit coupon'
    );
    expect(field(container, '8-character code').placeholder).toBe(
      '8-character code'
    );
  });

  it('keeps the code to eight upper-case letters and digits', async () => {
    const { container } = await render(
      <RedeemCreditCouponPage
        client={asClient(mockClient())}
        entityName='Acme'
      />
    );
    const input = field(container, '8-character code');
    changeText(input, 'ab-12 cd!34xyz');
    expect(input.value).toBe('AB12CD34');
    expect(input.maxLength).toBe(8);
  });

  it('cannot be submitted until the code has eight characters', async () => {
    const client = mockClient();
    const { container } = await render(
      <RedeemCreditCouponPage client={asClient(client)} entityName='Acme' />
    );
    expect(isDisabled(button(container, 'Redeem'))).toBe(true);

    changeText(field(container, '8-character code'), 'ABCD123');
    expect(isDisabled(button(container, 'Redeem'))).toBe(true);
    firePress(button(container, 'Redeem'));
    expect(client.redeemCreditCoupon).not.toHaveBeenCalled();

    changeText(field(container, '8-character code'), 'ABCD1234');
    expect(isDisabled(button(container, 'Redeem'))).toBe(false);
  });

  it('redeems the code for the entity, then reports the new balance', async () => {
    const client = mockClient();
    const onRedeemed = vi.fn().mockResolvedValue(undefined);
    const { container } = await render(
      <RedeemCreditCouponPage
        client={asClient(client)}
        entityId='ent_1'
        entityName='Acme'
        onRedeemed={onRedeemed}
      />
    );
    changeText(field(container, '8-character code'), 'abcd1234');
    firePress(button(container, 'Redeem'));
    await flushPromises();

    expect(client.redeemCreditCoupon).toHaveBeenCalledTimes(1);
    expect(client.redeemCreditCoupon).toHaveBeenCalledWith('ABCD1234', 'ent_1');
    expect(onRedeemed).toHaveBeenCalledTimes(1);
    expect(field(container, '8-character code').value).toBe('');
    expect(texts(container).at(-1)).toBe(
      'Added 5 credits to Acme. New balance: 12.'
    );
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe(
      'Added 5 credits to Acme. New balance: 12.'
    );
  });

  it('leaves the entity to the server when none is given', async () => {
    const client = mockClient();
    const { container } = await render(
      <RedeemCreditCouponPage client={asClient(client)} entityName='Acme' />
    );
    changeText(field(container, '8-character code'), 'ABCD1234');
    firePress(button(container, 'Redeem'));
    await flushPromises();
    expect(client.redeemCreditCoupon).toHaveBeenCalledWith(
      'ABCD1234',
      undefined
    );
  });

  it('says it is redeeming, and cannot be pressed twice', async () => {
    let finish: (value: {
      credits: number;
      balance: number;
    }) => void = () => {};
    const client = mockClient({
      redeemCreditCoupon: vi.fn(
        () => new Promise(resolve => (finish = resolve))
      ),
    });
    const { container } = await render(
      <RedeemCreditCouponPage client={asClient(client)} entityName='Acme' />
    );
    changeText(field(container, '8-character code'), 'ABCD1234');
    firePress(button(container, 'Redeem'));

    const busy = button(container, 'Redeeming…');
    expect(isDisabled(busy)).toBe(true);
    firePress(busy);
    expect(client.redeemCreditCoupon).toHaveBeenCalledTimes(1);

    finish({ credits: 5, balance: 12 });
    await flushPromises();
    expect(button(container, 'Redeem')).toBeDefined();
  });

  it('shows why a redemption failed, and keeps the code', async () => {
    const client = mockClient({
      redeemCreditCoupon: vi
        .fn()
        .mockRejectedValue(new Error('Coupon expired')),
    });
    const onRedeemed = vi.fn();
    const { container } = await render(
      <RedeemCreditCouponPage
        client={asClient(client)}
        entityName='Acme'
        onRedeemed={onRedeemed}
      />
    );
    changeText(field(container, '8-character code'), 'ABCD1234');
    firePress(button(container, 'Redeem'));
    await flushPromises();

    expect(texts(container).at(-1)).toBe('Coupon expired');
    expect(field(container, '8-character code').value).toBe('ABCD1234');
    expect(onRedeemed).not.toHaveBeenCalled();
  });

  it('falls back to a plain message for a failure that is not an Error', async () => {
    const client = mockClient({
      redeemCreditCoupon: vi.fn().mockRejectedValue('nope'),
    });
    const { container } = await render(
      <RedeemCreditCouponPage client={asClient(client)} entityName='Acme' />
    );
    changeText(field(container, '8-character code'), 'ABCD1234');
    firePress(button(container, 'Redeem'));
    await flushPromises();
    expect(texts(container).at(-1)).toBe('Coupon redemption failed.');
  });

  it('puts the field beside the button from the sm breakpoint', async () => {
    const narrow = await render(
      <RedeemCreditCouponPage
        client={asClient(mockClient())}
        entityName='Acme'
      />
    );
    const narrowInput = field(narrow.container, '8-character code');
    expect(narrowInput.parentElement?.className).not.toContain('flex-row');
    narrow.unmount();

    __setWindowWidth(640);
    const wide = await render(
      <RedeemCreditCouponPage
        client={asClient(mockClient())}
        entityName='Acme'
      />
    );
    const wideInput = field(wide.container, '8-character code');
    expect(wideInput.parentElement?.className).toContain('flex-row');
    expect(wideInput.className).toContain('flex-1');
  });
});

const coupons: CreditCoupon[] = [
  {
    code: 'AAAA1111',
    credits: 10,
    expiresAt: '2027-01-31T09:30:00.000Z',
    email: null,
    createdAt: '2026-11-01T08:00:00.000Z',
    history: [],
  },
  {
    code: 'BBBB2222',
    credits: 50,
    expiresAt: '2027-06-30T12:00:00.000Z',
    email: 'ada@example.com',
    createdAt: '2026-11-02T08:00:00.000Z',
    history: [
      {
        entityId: 'ent_1',
        userId: 'user_1',
        credits: 50,
        redeemedAt: '2026-11-03T10:00:00.000Z',
      },
      {
        entityId: null,
        userId: null,
        credits: 50,
        redeemedAt: '2026-11-04T10:00:00.000Z',
      },
    ],
  },
];

const local = (iso: string) => new Date(iso).toLocaleString();

async function renderManage(client: MockClient, isAdmin = true) {
  const result = await render(
    <ManageCreditCouponsPage client={asClient(client)} isAdmin={isAdmin} />
  );
  await flushPromises();
  return result;
}

function fillForm(
  container: HTMLElement,
  values: { credits?: string; expiresAt?: string; email?: string }
) {
  if (values.credits !== undefined)
    changeText(field(container, 'Credits'), values.credits);
  if (values.expiresAt !== undefined)
    changeText(field(container, 'Expires at'), values.expiresAt);
  if (values.email !== undefined)
    changeText(
      field(container, 'Restrict to user email (optional)'),
      values.email
    );
}

const createButton = (container: HTMLElement) =>
  button(container, 'Create 8-character coupon');

describe('ManageCreditCouponsPage', () => {
  it('renders nothing, and asks for nothing, for someone who is not an admin', async () => {
    const client = mockClient();
    const { container } = await renderManage(client, false);
    expect(container.innerHTML).toBe('');
    expect(client.listCreditCoupons).not.toHaveBeenCalled();
  });

  it('prints the web page’s sections and copy, in order', async () => {
    const { container } = await renderManage(mockClient());
    expect(texts(container)).toEqual([
      'Manage Coupons',
      'Create credit coupons and review redemption history.',
      'Create a coupon',
      'Credits',
      'Expires at',
      'Restrict to user email (optional)',
      'Create 8-character coupon',
      'Coupons',
      'No coupons created yet.',
    ]);
    expect(
      Array.from(container.querySelectorAll('[role="heading"]')).map(
        node => node.textContent
      )
    ).toEqual(['Manage Coupons', 'Create a coupon', 'Coupons']);
  });

  it('lists the coupons the client returns', async () => {
    const client = mockClient({
      listCreditCoupons: vi.fn().mockResolvedValue(coupons),
    });
    const { container } = await renderManage(client);
    expect(client.listCreditCoupons).toHaveBeenCalledTimes(1);
    expect(texts(container).slice(-4)).toEqual([
      'AAAA1111',
      `10 credits · ${local(coupons[0].createdAt)}`,
      'BBBB2222',
      `50 credits · ${local(coupons[1].createdAt)}`,
    ]);
  });

  it('shows why the list failed to load', async () => {
    const failing = await renderManage(
      mockClient({
        listCreditCoupons: vi.fn().mockRejectedValue(new Error('Forbidden')),
      })
    );
    expect(failing.container.querySelector('[role="alert"]')?.textContent).toBe(
      'Forbidden'
    );
    failing.unmount();

    const opaque = await renderManage(
      mockClient({ listCreditCoupons: vi.fn().mockRejectedValue('nope') })
    );
    expect(opaque.container.querySelector('[role="alert"]')?.textContent).toBe(
      'Could not load coupons.'
    );
  });

  it('creates a coupon with the web form’s arguments, then shows it', async () => {
    const created: CreditCoupon = {
      code: 'NEWCODE1',
      credits: 25,
      expiresAt: new Date(2027, 0, 31, 9, 30).toISOString(),
      email: null,
      createdAt: '2026-11-18T08:00:00.000Z',
      history: [],
    };
    const client = mockClient({
      listCreditCoupons: vi
        .fn()
        .mockResolvedValueOnce(coupons)
        .mockResolvedValueOnce([...coupons, created]),
    });
    const { container } = await renderManage(client);

    fillForm(container, { credits: '25', expiresAt: '2027-01-31 09:30' });
    firePress(createButton(container));
    await flushPromises();

    expect(client.createCreditCoupon).toHaveBeenCalledTimes(1);
    expect(client.createCreditCoupon).toHaveBeenCalledWith({
      credits: 25,
      // Local time, as the web's datetime-local field is read.
      expires_at: new Date(2027, 0, 31, 9, 30).toISOString(),
      email: null,
    });
    // The form is cleared, the list reloaded, the new coupon selected.
    expect(field(container, 'Credits').value).toBe('');
    expect(field(container, 'Expires at').value).toBe('');
    expect(client.listCreditCoupons).toHaveBeenCalledTimes(2);
    expect(texts(container)).toContain('Coupon details');
    expect(
      Array.from(container.querySelectorAll('[role="heading"]')).map(
        node => node.textContent
      )
    ).toEqual([
      'Manage Coupons',
      'Create a coupon',
      'Coupons',
      'NEWCODE1',
      'Redemption history',
    ]);
  });

  it('sends the trimmed email a coupon is restricted to', async () => {
    const client = mockClient();
    const { container } = await renderManage(client);
    fillForm(container, {
      credits: '5',
      expiresAt: '2027-01-31T09:30',
      email: '  ada@example.com ',
    });
    firePress(createButton(container));
    await flushPromises();
    expect(client.createCreditCoupon).toHaveBeenCalledWith({
      credits: 5,
      expires_at: new Date(2027, 0, 31, 9, 30).toISOString(),
      email: 'ada@example.com',
    });
  });

  describe('holds the form to the rules the browser enforces on the web', () => {
    const valid = { credits: '25', expiresAt: '2027-01-31 09:30' };

    it.each([
      ['no credits', { ...valid, credits: '' }],
      ['zero credits', { ...valid, credits: '0' }],
      ['a fraction of a credit', { ...valid, credits: '2.5' }],
      ['negative credits', { ...valid, credits: '-5' }],
      ['credits that are not a number', { ...valid, credits: 'ten' }],
      ['no expiry', { ...valid, expiresAt: '' }],
      ['an expiry without a time', { ...valid, expiresAt: '2027-01-31' }],
      [
        'a day the month does not have',
        { ...valid, expiresAt: '2027-02-30 09:30' },
      ],
      [
        'a month the year does not have',
        { ...valid, expiresAt: '2027-13-01 09:30' },
      ],
      [
        'an hour the day does not have',
        { ...valid, expiresAt: '2027-01-31 24:00' },
      ],
      ['an expiry that is not a date', { ...valid, expiresAt: 'next week' }],
      ['an email that is not one', { ...valid, email: 'ada@' }],
    ])('does not submit with %s', async (_name, values) => {
      const client = mockClient();
      const { container } = await renderManage(client);
      fillForm(container, values);
      expect(isDisabled(createButton(container))).toBe(true);
      firePress(createButton(container));
      await flushPromises();
      expect(client.createCreditCoupon).not.toHaveBeenCalled();
    });

    it('submits once every field is valid', async () => {
      const { container } = await renderManage(mockClient());
      expect(isDisabled(createButton(container))).toBe(true);
      fillForm(container, valid);
      expect(isDisabled(createButton(container))).toBe(false);
    });
  });

  it('says it is creating, and cannot be pressed twice', async () => {
    let finish: (value: { code: string }) => void = () => {};
    const client = mockClient({
      createCreditCoupon: vi.fn(
        () => new Promise(resolve => (finish = resolve))
      ),
    });
    const { container } = await renderManage(client);
    fillForm(container, { credits: '25', expiresAt: '2027-01-31 09:30' });
    firePress(createButton(container));

    const busy = button(container, 'Creating…');
    expect(isDisabled(busy)).toBe(true);
    firePress(busy);
    expect(client.createCreditCoupon).toHaveBeenCalledTimes(1);

    finish({ code: 'NEWCODE1' });
    await flushPromises();
    expect(createButton(container)).toBeDefined();
  });

  it('shows why a coupon was not created, and keeps the form', async () => {
    const client = mockClient({
      createCreditCoupon: vi.fn().mockRejectedValue(new Error('Not allowed')),
    });
    const { container } = await renderManage(client);
    fillForm(container, { credits: '25', expiresAt: '2027-01-31 09:30' });
    firePress(createButton(container));
    await flushPromises();

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      'Not allowed'
    );
    expect(field(container, 'Credits').value).toBe('25');
    expect(client.listCreditCoupons).toHaveBeenCalledTimes(1);
  });

  it('falls back to a plain message for a failure that is not an Error', async () => {
    const client = mockClient({
      createCreditCoupon: vi.fn().mockRejectedValue('nope'),
    });
    const { container } = await renderManage(client);
    fillForm(container, { credits: '25', expiresAt: '2027-01-31 09:30' });
    firePress(createButton(container));
    await flushPromises();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      'Coupon creation failed.'
    );
  });

  it('opens a coupon’s details and redemption history, and closes them', async () => {
    const client = mockClient({
      listCreditCoupons: vi.fn().mockResolvedValue(coupons),
    });
    const { container, getByText } = await renderManage(client);

    firePress(getByText('BBBB2222'));
    const all = texts(container);
    expect(all.slice(all.indexOf('Coupon details') - 1)).toEqual([
      'BBBB2222',
      'Coupon details',
      'Back to coupons',
      'Credits',
      '50',
      'Created',
      local(coupons[1].createdAt),
      'Expires',
      local(coupons[1].expiresAt),
      'Target email',
      'ada@example.com',
      'Redemption history',
      'Workspace ent_1 · user_1 · 50 credits',
      local(coupons[1].history[0].redeemedAt),
      ' · 50 credits',
      local(coupons[1].history[1].redeemedAt),
    ]);

    firePress(button(container, 'Back to coupons'));
    expect(texts(container)).not.toContain('Coupon details');
  });

  it('says so when a coupon is open to anyone and has not been redeemed', async () => {
    const client = mockClient({
      listCreditCoupons: vi.fn().mockResolvedValue(coupons),
    });
    const { container, getByText } = await renderManage(client);
    firePress(getByText('AAAA1111'));
    const all = texts(container);
    expect(all).toContain('Any user');
    expect(all.at(-1)).toBe('No redemptions yet.');
  });
});
