import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type {
  ConsumablesApiClient,
  CreditCoupon,
} from '@sudobility/consumables_client';
import { designTokens } from '@sudobility/design';

import { useBreakpoints } from './breakpoints';
import {
  DISABLED_CLASS,
  FIELD_HEIGHT_CLASS,
  cx,
  inputClass,
  primaryButtonClass,
  primaryButtonTextClass,
  quietButtonClass,
  quietButtonTextClass,
} from './controls';

const { size, weight } = designTokens.typography;

/*
 * The web form leaves its validation to the browser: `required`, `type`,
 * `min` and `step` on the inputs stop a submit before `createCreditCoupon` is
 * ever called. React Native has no such form, so the same three rules are
 * spelled out here and the button stays disabled until they hold.
 */

/** `<input type='number' min='1' step='1' required>`: a whole number, 1 or more. */
function parseCredits(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) && value >= 1 ? value : null;
}

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/;

/**
 * `<input type='datetime-local' required>`: a real calendar date and time,
 * read in the device's time zone as the browser reads its field.
 *
 * Parsed by hand rather than by `new Date(text)`: the typed form has a space
 * where ISO 8601 has a `T`, and what an engine makes of that is its own
 * business.
 */
function parseLocalDateTime(text: string): Date | null {
  const match = LOCAL_DATE_TIME.exec(text.trim());
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  if (hour > 23 || minute > 59) return null;
  const date = new Date(year, month - 1, day, hour, minute);
  // A day the month does not have rolls over into the next one.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return null;
  return date;
}

/** `<input type='email'>`: the pattern a browser holds an address to. */
const EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export interface RedeemCreditCouponPageProps {
  client: ConsumablesApiClient;
  entityId?: string;
  entityName: string;
  onRedeemed?: () => void | Promise<void>;
}

/** Shared coupon redemption UI. The API operation is owned by consumables_client. */
export function RedeemCreditCouponPage({
  client,
  entityId,
  entityName,
  onRedeemed,
}: RedeemCreditCouponPageProps) {
  const { sm } = useBreakpoints();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const disabled = busy || code.length !== 8;

  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await client.redeemCreditCoupon(code, entityId);
      setCode('');
      await onRedeemed?.();
      setMessage(
        `Added ${result.credits} credits to ${entityName}. New balance: ${result.balance}.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Coupon redemption failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className='w-full max-w-4xl gap-6 self-center'>
      <View>
        <Text
          className={cx(size['2xl'], weight.semibold, 'text-foreground')}
          accessibilityRole='header'
        >
          Redeem a credit coupon
        </Text>
        <Text className={cx(size.base, 'mt-1 text-muted-foreground')}>
          Credits are added to {entityName}.
        </Text>
      </View>
      {/* The web's `flex-col sm:flex-row`: field over button, or beside it. */}
      <View
        className={cx(
          'gap-3 rounded-lg border border-border p-5',
          sm && 'flex-row'
        )}
      >
        <TextInput
          className={cx(
            inputClass(),
            FIELD_HEIGHT_CLASS,
            sm && 'flex-1',
            'font-mono uppercase'
          )}
          value={code}
          onChangeText={value =>
            setCode(
              value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .slice(0, 8)
            )
          }
          placeholder='8-character code'
          accessibilityLabel='8-character code'
          autoCapitalize='characters'
          autoCorrect={false}
          maxLength={8}
        />
        <TouchableOpacity
          accessibilityRole='button'
          accessibilityState={{ disabled, busy }}
          className={cx(
            primaryButtonClass(),
            FIELD_HEIGHT_CLASS,
            disabled && DISABLED_CLASS
          )}
          disabled={disabled}
          onPress={() => void submit()}
        >
          <Text className={primaryButtonTextClass()}>
            {busy ? 'Redeeming…' : 'Redeem'}
          </Text>
        </TouchableOpacity>
      </View>
      {message && (
        <Text
          className={cx(size.base, 'text-foreground')}
          accessibilityLiveRegion='polite'
        >
          {message}
        </Text>
      )}
    </View>
  );
}

export interface ManageCreditCouponsPageProps {
  client: ConsumablesApiClient;
  isAdmin: boolean;
  /**
   * Style for the scroll content, e.g. the host's safe-area scroll insets.
   * React Native only: the web page scrolls with its document.
   */
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/** Shared site-admin coupon creation, listing, detail, and redemption history. */
export function ManageCreditCouponsPage({
  client,
  isAdmin,
  contentContainerStyle,
}: ManageCreditCouponsPageProps) {
  const { sm } = useBreakpoints();
  const [coupons, setCoupons] = useState<CreditCoupon[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [credits, setCredits] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const amount = parseCredits(credits);
  const expiry = parseLocalDateTime(expiresAt);
  const targetEmail = email.trim();
  const emailValid = targetEmail === '' || EMAIL.test(targetEmail);
  const createDisabled =
    busy || amount === null || expiry === null || !emailValid;

  async function reload() {
    setCoupons(await client.listCreditCoupons());
  }
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    void client
      .listCreditCoupons()
      .then(items => {
        if (active) setCoupons(items);
      })
      .catch(cause => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : 'Could not load coupons.'
          );
      });
    return () => {
      active = false;
    };
  }, [isAdmin, client]);

  async function create() {
    // An invalid form does not submit, on the web or here.
    if (amount === null || expiry === null || !emailValid) return;
    setBusy(true);
    setError(null);
    try {
      const coupon = await client.createCreditCoupon({
        credits: amount,
        expires_at: expiry.toISOString(),
        email: targetEmail || null,
      });
      setSelectedCode(coupon.code);
      setCredits('');
      setExpiresAt('');
      setEmail('');
      await reload();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Coupon creation failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin) return null;
  const selected = coupons.find(coupon => coupon.code === selectedCode);
  return (
    <ScrollView
      className='w-full max-w-4xl self-center'
      contentContainerClassName='gap-6 pb-6'
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps='handled'
    >
      <View>
        <Text
          className={cx(size['2xl'], weight.semibold, 'text-foreground')}
          accessibilityRole='header'
        >
          Manage Coupons
        </Text>
        <Text className={cx(size.base, 'mt-1 text-muted-foreground')}>
          Create credit coupons and review redemption history.
        </Text>
      </View>
      {error && (
        <Text
          accessibilityRole='alert'
          className={cx(size.sm, 'text-destructive')}
        >
          {error}
        </Text>
      )}
      <View className='rounded-lg border border-border p-5'>
        <Text
          className={cx(size.lg, weight.semibold, 'text-foreground')}
          accessibilityRole='header'
        >
          Create a coupon
        </Text>
        <View className='mt-3 gap-3'>
          {/* The web's `sm:grid-cols-2`: the first two fields share a row. */}
          <View className={cx('gap-3', sm && 'flex-row')}>
            <View className={cx(sm && 'flex-1')}>
              <Text className={cx(size.sm, 'text-foreground')}>Credits</Text>
              <TextInput
                className={cx(inputClass(), FIELD_HEIGHT_CLASS, 'mt-1')}
                accessibilityLabel='Credits'
                keyboardType='number-pad'
                value={credits}
                onChangeText={setCredits}
              />
            </View>
            <View className={cx(sm && 'flex-1')}>
              <Text className={cx(size.sm, 'text-foreground')}>Expires at</Text>
              <TextInput
                className={cx(inputClass(), FIELD_HEIGHT_CLASS, 'mt-1')}
                accessibilityLabel='Expires at'
                placeholder='YYYY-MM-DD HH:MM'
                autoCapitalize='none'
                autoCorrect={false}
                value={expiresAt}
                onChangeText={setExpiresAt}
              />
            </View>
          </View>
          <View>
            <Text className={cx(size.sm, 'text-foreground')}>
              Restrict to user email (optional)
            </Text>
            <TextInput
              className={cx(inputClass(), FIELD_HEIGHT_CLASS, 'mt-1')}
              accessibilityLabel='Restrict to user email (optional)'
              keyboardType='email-address'
              autoCapitalize='none'
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityState={{ disabled: createDisabled, busy }}
            className={cx(
              primaryButtonClass(),
              FIELD_HEIGHT_CLASS,
              'self-start',
              createDisabled && DISABLED_CLASS
            )}
            disabled={createDisabled}
            onPress={() => void create()}
          >
            <Text className={primaryButtonTextClass()}>
              {busy ? 'Creating…' : 'Create 8-character coupon'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className='rounded-lg border border-border p-5'>
        <Text
          className={cx(size.lg, weight.semibold, 'text-foreground')}
          accessibilityRole='header'
        >
          Coupons
        </Text>
        {coupons.length ? (
          <View className='mt-3'>
            {coupons.map((coupon, index) => (
              <TouchableOpacity
                key={coupon.code}
                accessibilityRole='button'
                className={cx(
                  'flex-row items-center justify-between gap-3 py-3',
                  index > 0 && 'border-t border-border'
                )}
                onPress={() => setSelectedCode(coupon.code)}
              >
                <Text
                  className={cx(
                    size.base,
                    weight.medium,
                    'font-mono text-foreground'
                  )}
                >
                  {coupon.code}
                </Text>
                <Text className={cx(size.sm, 'text-muted-foreground')}>
                  {coupon.credits} credits ·{' '}
                  {new Date(coupon.createdAt).toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text className={cx(size.sm, 'mt-3 text-muted-foreground')}>
            No coupons created yet.
          </Text>
        )}
      </View>
      {selected && (
        <View className='rounded-lg border border-border p-5'>
          <View className='flex-row items-start justify-between gap-3'>
            <View className='flex-1'>
              <Text
                className={cx(
                  size.xl,
                  weight.semibold,
                  'font-mono text-foreground'
                )}
                accessibilityRole='header'
              >
                {selected.code}
              </Text>
              <Text className={cx(size.sm, 'text-muted-foreground')}>
                Coupon details
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole='button'
              className={quietButtonClass()}
              onPress={() => setSelectedCode(null)}
            >
              <Text className={quietButtonTextClass()}>Back to coupons</Text>
            </TouchableOpacity>
          </View>
          {/* The web's `grid gap-3 sm:grid-cols-2`. */}
          <View className={cx('mt-4 gap-3', sm && 'flex-row flex-wrap')}>
            <Detail
              wide={sm}
              label='Credits'
              value={String(selected.credits)}
            />
            <Detail
              wide={sm}
              label='Created'
              value={new Date(selected.createdAt).toLocaleString()}
            />
            <Detail
              wide={sm}
              label='Expires'
              value={new Date(selected.expiresAt).toLocaleString()}
            />
            <Detail
              wide={sm}
              label='Target email'
              value={selected.email || 'Any user'}
            />
          </View>
          <Text
            className={cx(size.lg, weight.semibold, 'mt-6 text-foreground')}
            accessibilityRole='header'
          >
            Redemption history
          </Text>
          {selected.history.length ? (
            <View className='mt-2'>
              {selected.history.map((item, index) => (
                <View
                  key={`${item.entityId ?? 'scope'}-${item.redeemedAt}-${index}`}
                  className={cx(
                    'flex-row flex-wrap justify-between gap-2 py-2',
                    index > 0 && 'border-t border-border'
                  )}
                >
                  <Text className={cx(size.sm, 'text-foreground')}>
                    {item.entityId ? `Workspace ${item.entityId}` : ''}
                    {item.userId ? ` · ${item.userId}` : ''} · {item.credits}{' '}
                    credits
                  </Text>
                  <Text className={cx(size.sm, 'text-foreground')}>
                    {new Date(item.redeemedAt).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className={cx(size.sm, 'mt-2 text-muted-foreground')}>
              No redemptions yet.
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function Detail({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  /** Two to a row, as the web's grid lays them from `sm` up. */
  wide: boolean;
}) {
  return (
    <View className={cx(wide && 'w-[48%]')}>
      <Text className={cx(size.sm, 'text-muted-foreground')}>{label}</Text>
      <Text className={cx(size.base, 'text-foreground')}>{value}</Text>
    </View>
  );
}
