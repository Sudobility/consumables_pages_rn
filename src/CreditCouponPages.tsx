import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import type {
  ConsumablesApiClient,
  CreditCoupon,
} from '@sudobility/consumables_client';
import { designTokens } from '@sudobility/design';

import {
  FIELD_HEIGHT_CLASS,
  inputClass,
  primaryButtonClass,
  primaryButtonTextClass,
  quietButtonClass,
  quietButtonTextClass,
} from './controls';

const { size, weight } = designTokens.typography;

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
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
          className={[size['2xl'], weight.semibold, 'text-foreground'].join(
            ' '
          )}
        >
          Redeem a credit coupon
        </Text>
        <Text className={['mt-1 text-muted-foreground', size.base].join(' ')}>
          Credits are added to {entityName}.
        </Text>
      </View>
      <View className='gap-3 rounded-lg border border-border p-5'>
        <TextInput
          className={[
            inputClass(),
            FIELD_HEIGHT_CLASS,
            'flex-1 font-mono uppercase',
          ].join(' ')}
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
          autoCapitalize='characters'
          maxLength={8}
        />
        <TouchableOpacity
          accessibilityRole='button'
          className={[
            primaryButtonClass(),
            FIELD_HEIGHT_CLASS,
            busy || code.length !== 8 ? 'opacity-50' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={busy || code.length !== 8}
          onPress={() => void submit()}
        >
          <Text className={primaryButtonTextClass()}>
            {busy ? 'Redeeming…' : 'Redeem'}
          </Text>
        </TouchableOpacity>
      </View>
      {message && (
        <Text className='text-foreground' accessibilityRole='text'>
          {message}
        </Text>
      )}
    </View>
  );
}

export interface ManageCreditCouponsPageProps {
  client: ConsumablesApiClient;
  isAdmin: boolean;
}

/** Shared site-admin coupon creation, listing, detail, and redemption history. */
export function ManageCreditCouponsPage({
  client,
  isAdmin,
}: ManageCreditCouponsPageProps) {
  const [coupons, setCoupons] = useState<CreditCoupon[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [credits, setCredits] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
    setError(null);
    try {
      const coupon = await client.createCreditCoupon({
        credits: Number(credits),
        expires_at: new Date(expiresAt).toISOString(),
        email: email.trim() || null,
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
    >
      <View>
        <Text
          className={[size['2xl'], weight.semibold, 'text-foreground'].join(
            ' '
          )}
        >
          Manage Coupons
        </Text>
        <Text className={['mt-1 text-muted-foreground', size.base].join(' ')}>
          Create credit coupons and review redemption history.
        </Text>
      </View>
      {error && (
        <Text
          accessibilityRole='alert'
          className={[size.sm, 'text-destructive'].join(' ')}
        >
          {error}
        </Text>
      )}
      <View className='rounded-lg border border-border p-5'>
        <Text
          className={[size.lg, weight.semibold, 'text-foreground'].join(' ')}
        >
          Create a coupon
        </Text>
        <View className='mt-3 gap-3'>
          <View>
            <Text className={[size.sm, 'text-foreground'].join(' ')}>
              Credits
            </Text>
            <TextInput
              className={[inputClass(), FIELD_HEIGHT_CLASS, 'mt-1'].join(' ')}
              keyboardType='numeric'
              value={credits}
              onChangeText={setCredits}
            />
          </View>
          <View>
            <Text className={[size.sm, 'text-foreground'].join(' ')}>
              Expires at
            </Text>
            <TextInput
              className={[inputClass(), FIELD_HEIGHT_CLASS, 'mt-1'].join(' ')}
              placeholder='YYYY-MM-DD HH:MM'
              value={expiresAt}
              onChangeText={setExpiresAt}
            />
          </View>
          <View>
            <Text className={[size.sm, 'text-foreground'].join(' ')}>
              Restrict to user email (optional)
            </Text>
            <TextInput
              className={[inputClass(), FIELD_HEIGHT_CLASS, 'mt-1'].join(' ')}
              keyboardType='email-address'
              autoCapitalize='none'
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <TouchableOpacity
            accessibilityRole='button'
            className={[
              primaryButtonClass(),
              FIELD_HEIGHT_CLASS,
              'self-start',
              busy ? 'opacity-50' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            disabled={busy}
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
          className={[size.lg, weight.semibold, 'text-foreground'].join(' ')}
        >
          Coupons
        </Text>
        {coupons.length ? (
          <View className='mt-3'>
            {coupons.map(coupon => (
              <TouchableOpacity
                key={coupon.code}
                accessibilityRole='button'
                className='flex-row items-center justify-between gap-3 border-b border-border py-3'
                onPress={() => setSelectedCode(coupon.code)}
              >
                <Text
                  className={['font-mono text-foreground', weight.medium].join(
                    ' '
                  )}
                >
                  {coupon.code}
                </Text>
                <Text className={[size.sm, 'text-muted-foreground'].join(' ')}>
                  {coupon.credits} credits ·{' '}
                  {new Date(coupon.createdAt).toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text className={[size.sm, 'mt-3 text-muted-foreground'].join(' ')}>
            No coupons created yet.
          </Text>
        )}
      </View>
      {selected && (
        <View className='rounded-lg border border-border p-5'>
          <View className='flex-row items-start justify-between gap-3'>
            <View>
              <Text
                className={[
                  size.xl,
                  weight.semibold,
                  'font-mono text-foreground',
                ].join(' ')}
              >
                {selected.code}
              </Text>
              <Text className={[size.sm, 'text-muted-foreground'].join(' ')}>
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
          <View className='mt-4 gap-3'>
            <Detail label='Credits' value={String(selected.credits)} />
            <Detail
              label='Created'
              value={new Date(selected.createdAt).toLocaleString()}
            />
            <Detail
              label='Expires'
              value={new Date(selected.expiresAt).toLocaleString()}
            />
            <Detail label='Target email' value={selected.email || 'Any user'} />
          </View>
          <Text
            className={[size.lg, weight.semibold, 'mt-6 text-foreground'].join(
              ' '
            )}
          >
            Redemption history
          </Text>
          {selected.history.length ? (
            <View className='mt-2'>
              {selected.history.map((item, index) => (
                <View
                  key={`${item.entityId ?? 'scope'}-${item.redeemedAt}-${index}`}
                  className='flex-row flex-wrap justify-between gap-2 border-b border-border py-2'
                >
                  <Text className={[size.sm, 'text-foreground'].join(' ')}>
                    {item.entityId ? `Workspace ${item.entityId}` : ''}
                    {item.userId ? ` · ${item.userId}` : ''} · {item.credits}{' '}
                    credits
                  </Text>
                  <Text
                    className={[size.sm, 'text-muted-foreground'].join(' ')}
                  >
                    {new Date(item.redeemedAt).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className={[size.sm, 'mt-2 text-muted-foreground'].join(' ')}>
              No redemptions yet.
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className={[size.sm, 'text-muted-foreground'].join(' ')}>
        {label}
      </Text>
      <Text className='text-foreground'>{value}</Text>
    </View>
  );
}
