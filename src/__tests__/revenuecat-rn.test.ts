/**
 * The React Native RevenueCat adapter, held to the rules of the web adapter
 * (@sudobility/consumables_pages' revenuecat-web.ts): the catalog is readable
 * before anybody signs in, a purchase is not, and neither is attempted without
 * a key.
 *
 * `react-native-purchases` is an optional peer that this package does not
 * install, and the adapter loads it with a bare `require`. So the module
 * loader is intercepted here and answers with a stand-in shaped like the real
 * module: the SDK on `default`, enums beside it.
 */
import Module from 'node:module';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

type Sdk = ReturnType<typeof createSdk>;

const creditsOffering = {
  identifier: 'credits',
  metadata: { tier: 'standard' },
  availablePackages: [
    {
      identifier: 'pkg_5',
      product: {
        identifier: 'credits_5',
        title: '5 Credits',
        description: 'A handful',
        price: 4.99,
        priceString: '$4.99',
        currencyCode: 'USD',
        metadata: { credits: 5 },
      },
    },
  ],
};

const bonusOffering = {
  identifier: 'bonus',
  metadata: null,
  availablePackages: [
    {
      identifier: 'pkg_100',
      product: {
        identifier: 'credits_100',
        title: '100 Credits',
        description: '',
        price: 49,
        priceString: '€49.00',
        currencyCode: 'EUR',
      },
    },
  ],
};

function createSdk() {
  return {
    configure: vi.fn(),
    logIn: vi.fn().mockResolvedValue({}),
    logOut: vi.fn().mockResolvedValue({}),
    setAttributes: vi.fn().mockResolvedValue(undefined),
    getOfferings: vi.fn().mockResolvedValue({
      all: { credits: creditsOffering, bonus: bonusOffering },
    }),
    purchasePackage: vi.fn().mockResolvedValue({
      customerInfo: {
        nonSubscriptionTransactions: [
          { transactionIdentifier: 'txn_old' },
          { transactionIdentifier: 'txn_new' },
        ],
      },
    }),
  };
}

/** What `require('react-native-purchases')` answers; undefined = not installed. */
let installed: Record<string, unknown> | undefined;

/** The real module's shape: the SDK is the default export, never the namespace. */
function install(sdk: Sdk): Sdk {
  installed = { __esModule: true, default: sdk, LOG_LEVEL: { DEBUG: 'DEBUG' } };
  return sdk;
}

const loader = Module as unknown as {
  _load: (request: string, ...rest: unknown[]) => unknown;
};
const realLoad = loader._load;

beforeAll(() => {
  loader._load = function (this: unknown, request: string, ...rest: unknown[]) {
    if (request === 'react-native-purchases') {
      if (!installed) {
        throw new Error("Cannot find module 'react-native-purchases'");
      }
      return installed;
    }
    return realLoad.call(this, request, ...rest);
  };
});

afterAll(() => {
  loader._load = realLoad;
});

afterEach(() => {
  installed = undefined;
  vi.restoreAllMocks();
});

/** A fresh adapter module: its key, user and SDK state are module-level. */
async function loadAdapter(os = 'ios') {
  vi.resetModules();
  const { Platform } = await import('react-native');
  Platform.OS = os;
  return import('../adapters/revenuecat-rn');
}

describe('loading the SDK', () => {
  it('calls the SDK on the module’s default export', async () => {
    const sdk = install(createSdk());
    const rn = await loadAdapter();
    rn.configureConsumablesRNAdapter('rc_key');

    await rn.createConsumablesRNAdapter().getOfferings();

    expect(sdk.configure).toHaveBeenCalledTimes(1);
    expect(sdk.configure).toHaveBeenCalledWith({ apiKey: 'rc_key' });
    expect(sdk.getOfferings).toHaveBeenCalledTimes(1);
  });

  it('configures the SDK once, however often it is used', async () => {
    const sdk = install(createSdk());
    const rn = await loadAdapter();
    rn.configureConsumablesRNAdapter('rc_key');
    const adapter = rn.createConsumablesRNAdapter();

    await adapter.getOfferings();
    await adapter.setUserId?.('user_1');
    await adapter.getOfferings();

    expect(sdk.configure).toHaveBeenCalledTimes(1);
  });

  it('says so when react-native-purchases is not installed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const rn = await loadAdapter();
    rn.configureConsumablesRNAdapter('rc_key');

    await expect(
      rn.createConsumablesRNAdapter().getOfferings()
    ).rejects.toThrow('react-native-purchases is not installed');
  });
});

describe('without a key', () => {
  it('refuses to read the catalog or to purchase, and never touches the SDK', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const sdk = install(createSdk());
    const rn = await loadAdapter();
    const adapter = rn.createConsumablesRNAdapter();

    await expect(adapter.getOfferings()).rejects.toThrow(
      'RevenueCat not configured'
    );
    await expect(
      adapter.purchase({ packageId: 'pkg_5', offeringId: 'credits' })
    ).rejects.toThrow('RevenueCat not configured');
    expect(sdk.configure).not.toHaveBeenCalled();
    expect(sdk.getOfferings).not.toHaveBeenCalled();
  });

  it('ignores a user, as the web adapter does', async () => {
    const sdk = install(createSdk());
    const rn = await loadAdapter();

    await rn.setConsumablesRNUser('user_1', 'ada@example.com');

    expect(sdk.configure).not.toHaveBeenCalled();
    expect(sdk.logIn).not.toHaveBeenCalled();
    expect(rn.hasConsumablesRNUser()).toBe(false);
  });
});

describe('getOfferings', () => {
  it('reads the catalog before anybody has signed in', async () => {
    const sdk = install(createSdk());
    const rn = await loadAdapter();
    rn.configureConsumablesRNAdapter('rc_key');

    const { all } = await rn.createConsumablesRNAdapter().getOfferings();

    expect(sdk.logIn).not.toHaveBeenCalled();
    expect(all).toEqual({
      credits: {
        identifier: 'credits',
        metadata: { tier: 'standard' },
        packages: [
          {
            packageId: 'pkg_5',
            productId: 'credits_5',
            title: '5 Credits',
            description: 'A handful',
            credits: 5,
            price: 4.99,
            priceString: '$4.99',
            currencyCode: 'USD',
          },
        ],
      },
      bonus: {
        identifier: 'bonus',
        metadata: null,
        packages: [
          {
            packageId: 'pkg_100',
            productId: 'credits_100',
            title: '100 Credits',
            description: null,
            credits: 0,
            price: 49,
            priceString: '€49.00',
            currencyCode: 'EUR',
          },
        ],
      },
    });
  });

  it('rethrows what the SDK threw, and names a failure that is not an Error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const sdk = install(createSdk());
    const rn = await loadAdapter();
    rn.configureConsumablesRNAdapter('rc_key');
    const adapter = rn.createConsumablesRNAdapter();

    sdk.getOfferings.mockRejectedValueOnce(new Error('Network down'));
    await expect(adapter.getOfferings()).rejects.toThrow('Network down');

    sdk.getOfferings.mockRejectedValueOnce('nope');
    await expect(adapter.getOfferings()).rejects.toThrow(
      'Unable to load RevenueCat offerings'
    );
  });
});

describe('the current user', () => {
  it('logs the user in and records their email', async () => {
    const sdk = install(createSdk());
    const rn = await loadAdapter();
    rn.configureConsumablesRNAdapter('rc_key');

    await rn
      .createConsumablesRNAdapter()
      .setUserId?.('user_1', 'ada@example.com');

    expect(sdk.logIn).toHaveBeenCalledTimes(1);
    expect(sdk.logIn).toHaveBeenCalledWith('user_1');
    expect(sdk.setAttributes).toHaveBeenCalledWith({
      email: 'ada@example.com',
    });
    expect(sdk.logOut).not.toHaveBeenCalled();
    expect(rn.hasConsumablesRNUser()).toBe(true);
  });

  it('keeps the user when the email cannot be recorded', async () => {
    const sdk = install(createSdk());
    sdk.setAttributes.mockRejectedValue(new Error('attributes unavailable'));
    const rn = await loadAdapter();
    rn.configureConsumablesRNAdapter('rc_key');

    await rn.setConsumablesRNUser('user_1', 'ada@example.com');

    expect(rn.hasConsumablesRNUser()).toBe(true);
  });

  it('does not log the same user in twice', async () => {
    const sdk = install(createSdk());
    const rn = await loadAdapter();
    rn.configureConsumablesRNAdapter('rc_key');

    await rn.setConsumablesRNUser('user_1');
    await rn.setConsumablesRNUser('user_1');

    expect(sdk.logIn).toHaveBeenCalledTimes(1);
  });

  it('does not start a second login for a user whose login is under way', async () => {
    const sdk = install(createSdk());
    const rn = await loadAdapter();
    rn.configureConsumablesRNAdapter('rc_key');

    await Promise.all([
      rn.setConsumablesRNUser('user_1'),
      rn.setConsumablesRNUser('user_1'),
    ]);

    expect(sdk.logIn).toHaveBeenCalledTimes(1);
  });

  it('logs the previous user out before the next one in', async () => {
    const sdk = install(createSdk());
    const rn = await loadAdapter();
    rn.configureConsumablesRNAdapter('rc_key');

    await rn.setConsumablesRNUser('user_1');
    await rn.setConsumablesRNUser('user_2');

    expect(sdk.logOut).toHaveBeenCalledTimes(1);
    expect(sdk.logIn.mock.calls).toEqual([['user_1'], ['user_2']]);
    expect(sdk.logOut.mock.invocationCallOrder[0]).toBeLessThan(
      sdk.logIn.mock.invocationCallOrder[1]
    );
  });

  it('logs out on sign-out, and only a user it logged in', async () => {
    const sdk = install(createSdk());
    const rn = await loadAdapter();
    rn.configureConsumablesRNAdapter('rc_key');
    const adapter = rn.createConsumablesRNAdapter();

    // Nobody was logged in: the SDK would refuse, so it is not asked.
    await adapter.setUserId?.(undefined);
    expect(sdk.logOut).not.toHaveBeenCalled();

    await adapter.setUserId?.('user_1');
    await adapter.setUserId?.(undefined);
    expect(sdk.logOut).toHaveBeenCalledTimes(1);
    expect(rn.hasConsumablesRNUser()).toBe(false);
  });

  it('forgets the user even when the SDK fails to log out', async () => {
    const sdk = install(createSdk());
    sdk.logOut.mockRejectedValue(new Error('already anonymous'));
    const rn = await loadAdapter();
    rn.configureConsumablesRNAdapter('rc_key');

    await rn.setConsumablesRNUser('user_1');
    await rn.clearConsumablesRNUser();

    expect(rn.hasConsumablesRNUser()).toBe(false);
  });
});

describe('purchase', () => {
  async function signedIn(os = 'ios') {
    const sdk = install(createSdk());
    const rn = await loadAdapter(os);
    rn.configureConsumablesRNAdapter('rc_key');
    const adapter = rn.createConsumablesRNAdapter();
    await adapter.setUserId?.('user_1');
    return { sdk, adapter };
  }

  it('is refused until a user is set, as on the web', async () => {
    // An anonymous purchase is one the server cannot find under the buyer's
    // own id: paid for, and never credited.
    const sdk = install(createSdk());
    const rn = await loadAdapter();
    rn.configureConsumablesRNAdapter('rc_key');

    await expect(
      rn
        .createConsumablesRNAdapter()
        .purchase({ packageId: 'pkg_5', offeringId: 'credits' })
    ).rejects.toThrow('RevenueCat user not set');
    expect(sdk.purchasePackage).not.toHaveBeenCalled();
  });

  it('is refused again once the user has signed out', async () => {
    const { sdk, adapter } = await signedIn();
    await adapter.setUserId?.(undefined);

    await expect(
      adapter.purchase({ packageId: 'pkg_5', offeringId: 'credits' })
    ).rejects.toThrow('RevenueCat user not set');
    expect(sdk.purchasePackage).not.toHaveBeenCalled();
    expect(sdk.logIn).toHaveBeenCalledTimes(1);
  });

  describe('after a login that failed', () => {
    // On the web a user is set by configuring the SDK, which cannot fail. Here
    // it is a network call: offline at sign-in must not mean no purchases
    // until the app restarts, and must never mean an anonymous one.
    async function offlineAtSignIn() {
      const sdk = install(createSdk());
      sdk.logIn.mockRejectedValueOnce(new Error('offline'));
      const rn = await loadAdapter();
      rn.configureConsumablesRNAdapter('rc_key');
      const adapter = rn.createConsumablesRNAdapter();
      await expect(
        adapter.setUserId?.('user_1', 'ada@example.com')
      ).rejects.toThrow('offline');
      expect(rn.hasConsumablesRNUser()).toBe(false);
      return { sdk, adapter };
    }

    it('logs the user in again, then buys as them', async () => {
      const { sdk, adapter } = await offlineAtSignIn();

      const result = await adapter.purchase({
        packageId: 'pkg_5',
        offeringId: 'credits',
      });

      expect(sdk.logIn.mock.calls).toEqual([['user_1'], ['user_1']]);
      expect(sdk.setAttributes).toHaveBeenCalledWith({
        email: 'ada@example.com',
      });
      expect(sdk.logIn.mock.invocationCallOrder[1]).toBeLessThan(
        sdk.purchasePackage.mock.invocationCallOrder[0]
      );
      expect(result.transactionId).toBe('txn_new');
    });

    it('does not buy when the login fails again', async () => {
      const { sdk, adapter } = await offlineAtSignIn();
      sdk.logIn.mockRejectedValueOnce(new Error('still offline'));

      await expect(
        adapter.purchase({ packageId: 'pkg_5', offeringId: 'credits' })
      ).rejects.toThrow('still offline');
      expect(sdk.purchasePackage).not.toHaveBeenCalled();
    });

    it('does not buy as the previous user when the next one could not log in', async () => {
      const { sdk, adapter } = await signedIn();
      sdk.logIn.mockRejectedValue(new Error('offline'));
      await expect(adapter.setUserId?.('user_2')).rejects.toThrow('offline');

      await expect(
        adapter.purchase({ packageId: 'pkg_5', offeringId: 'credits' })
      ).rejects.toThrow('offline');
      expect(sdk.purchasePackage).not.toHaveBeenCalled();
      // user_1 was logged out; only user_2 was tried again.
      expect(sdk.logIn.mock.calls).toEqual([
        ['user_1'],
        ['user_2'],
        ['user_2'],
      ]);
    });
  });

  it('buys the package from the offering named, and reports the transaction', async () => {
    const { sdk, adapter } = await signedIn();

    const result = await adapter.purchase({
      packageId: 'pkg_5',
      offeringId: 'credits',
    });

    expect(sdk.purchasePackage).toHaveBeenCalledTimes(1);
    expect(sdk.purchasePackage).toHaveBeenCalledWith(
      creditsOffering.availablePackages[0]
    );
    expect(result).toEqual({
      transactionId: 'txn_new',
      productId: 'credits_5',
      credits: 5,
      priceCents: 499,
      currency: 'USD',
      source: 'apple',
    });
  });

  it('looks through every offering when the one named is unknown', async () => {
    const { sdk, adapter } = await signedIn();

    const result = await adapter.purchase({
      packageId: 'pkg_100',
      offeringId: 'gone',
    });

    expect(sdk.purchasePackage).toHaveBeenCalledWith(
      bonusOffering.availablePackages[0]
    );
    expect(result.productId).toBe('credits_100');
    expect(result.priceCents).toBe(4900);
    expect(result.currency).toBe('EUR');
  });

  it('does not look past the offering named', async () => {
    const { sdk, adapter } = await signedIn();

    await expect(
      adapter.purchase({ packageId: 'pkg_100', offeringId: 'credits' })
    ).rejects.toThrow('Package not found: pkg_100');
    expect(sdk.purchasePackage).not.toHaveBeenCalled();
  });

  it.each([
    ['ios', 'apple'],
    ['macos', 'apple'],
    ['android', 'google'],
  ])('reports a purchase on %s as bought from %s', async (os, source) => {
    const { adapter } = await signedIn(os);
    const result = await adapter.purchase({
      packageId: 'pkg_5',
      offeringId: 'credits',
    });
    expect(result.source).toBe(source);
  });
});
