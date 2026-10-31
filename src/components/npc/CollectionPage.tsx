import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../../api';
import { usePlayer } from '../../store/playerStore';
import '../../styles/collection.css';

type Rarity = 'white' | 'blue' | 'green' | 'purple' | 'legendary';

interface DropSource {
  bossId?: number;
  bossName?: string;
  chance?: number;
}

interface CollectionItem {
  itemId: string;
  name: string;
  icon: string;
  statType: string;
  purchasable?: boolean;
  price?: number | null;
  rarity: Rarity | null;
  rarityName: string | null;
  pendingRarity: Rarity | null;
  pendingRarityName: string | null;
  currentStat: number | null;
  pendingStat: number | null;
  baseStat?: number;
  maxStat?: number;
  owned?: boolean;
  dropSources?: DropSource[];
}

interface CollectionResponse {
  items: CollectionItem[];
  catalog: CollectionItem[];
  bonus: Record<string, number>;
}

const FILTERS = [
  { id: 'mine', title: 'Мои' },
  { id: 'all', title: 'Все' },
  { id: 'upgrades', title: 'Апгрейды' },
  { id: 'shop', title: 'Магазин' },
] as const;

type Filter = (typeof FILTERS)[number]['id'];
type ActionKind = 'reroll' | 'upgrade' | 'buy';
type Notice = { type: 'success' | 'error'; text: string };

/** Цвета обводки карточек — строго из ТЗ. */
const RARITY_COLOR: Record<Rarity, string> = {
  white: '#cccccc',
  blue: '#4a90d9',
  green: '#4caf50',
  purple: '#9c27b0',
  legendary: '#ff9800',
};

const RARITY_NAME: Record<Rarity, string> = {
  white: 'Белая',
  blue: 'Синяя',
  green: 'Зелёная',
  purple: 'Фиолетовая',
  legendary: 'Легендарная',
};

/** Для невыпавших предметов — серая рамка. */
const LOCKED_COLOR = '#444444';

/** Покупные предметы выделяем золотой рамкой. */
const SHOP_COLOR = '#e0a020';

/** dmg_knife — финка, dmg_pistol — самопал, dmg_poison — яд. */
const STAT_LABEL: Record<string, string> = {
  dmg_knife: 'к урону финкой',
  dmg_pistol: 'к урону из самопала',
  dmg_poison: 'к урону ядом',
};

const BONUS_LABEL: Record<string, string> = {
  dmg_knife: 'финка',
  dmg_pistol: 'самопал',
  dmg_poison: 'яд',
};

const STAT_EMOJI: Record<string, string> = {
  dmg_knife: '🔪',
  dmg_pistol: '🔫',
  dmg_poison: '🧪',
};

/** Переролл всегда стоит один молоток. */
const REROLL_PRICE = 1;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;

const formatNumber = (value: number) => value.toLocaleString('ru-RU');

const describeError = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
};

const isUnauthorized = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 401;

const isOwned = (item: CollectionItem): boolean => item.owned !== false;

const rarityNameOf = (item: CollectionItem): string | null => {
  if (item.rarityName) return item.rarityName;
  if (!item.rarity) return null;
  return RARITY_NAME[item.rarity] ?? item.rarity;
};

const rarityNameByKey = (rarity: string | null): string | null => {
  if (!rarity) return null;
  return RARITY_NAME[rarity as Rarity] ?? rarity;
};

const rarityColorOf = (item: CollectionItem): string => {
  if (!isOwned(item) || !item.rarity) return LOCKED_COLOR;
  return RARITY_COLOR[item.rarity] ?? LOCKED_COLOR;
};

const statLabelOf = (statType: string) => STAT_LABEL[statType] ?? `к ${statType}`;

const bonusLabelOf = (statType: string) => BONUS_LABEL[statType] ?? statType;

const statEmojiOf = (statType: string) => STAT_EMOJI[statType] ?? '📦';

const statTextOf = (item: CollectionItem): string => {
  const stat = item.currentStat ?? 0;
  return `+${stat} ${statLabelOf(item.statType)}`;
};

const buyPriceOf = (item: CollectionItem): number | null =>
  typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : null;

const dropSourcesText = (item: CollectionItem): string | null => {
  if (!item.dropSources?.length) return null;
  const parts = item.dropSources
    .filter((source) => source.bossName)
    .map((source) => {
      const chance = source.chance != null ? ` ${source.chance}%` : '';
      return `${source.bossName}${chance}`;
    });
  return parts.length > 0 ? `Падает: ${parts.join(', ')}` : null;
};

const describeReroll = (payload: Record<string, unknown>): string => {
  const rolled = typeof payload.rolled === 'string' ? payload.rolled : null;
  const rarity = typeof payload.rarity === 'string' ? payload.rarity : null;
  const upgraded = payload.upgraded === true;

  const rolledName = rarityNameByKey(rolled) ?? '—';
  const resultName = rarityNameByKey(rarity) ?? '—';

  if (rolled && rarity && rolled === rarity) {
    return `Выпало: ${rolledName} — редкость не изменилась`;
  }
  if (upgraded) {
    return `Выпало: ${rolledName} → теперь ${resultName}`;
  }
  return `Выпало: ${rolledName} — хуже, оставили ${resultName}`;
};

const fetchCollection = async (): Promise<CollectionResponse> => {
  const raw: unknown = await api('/api/npc/collection');
  const data = asRecord(raw) ?? {};
  const bonus = asRecord(data.bonus);

  const bonusValues: Record<string, number> = {};
  for (const [key, value] of Object.entries(bonus ?? {})) {
    const num = Number(value);
    if (Number.isFinite(num)) bonusValues[key] = num;
  }

  return {
    items: Array.isArray(data.items) ? (data.items as CollectionItem[]) : [],
    catalog: Array.isArray(data.catalog) ? (data.catalog as CollectionItem[]) : [],
    bonus: bonusValues,
  };
};

/** Цены апгрейдов лежат только в /upgrades — собираем карту itemId → price. */
const fetchUpgradePrices = async (): Promise<Record<string, number>> => {
  const raw: unknown = await api('/api/npc/collection/upgrades');
  if (!Array.isArray(raw)) return {};

  const prices: Record<string, number> = {};
  for (const entry of raw) {
    const record = asRecord(entry);
    if (!record) continue;
    const itemId = typeof record.itemId === 'string' ? record.itemId : null;
    const price = Number(record.price);
    if (itemId && Number.isFinite(price)) prices[itemId] = price;
  }
  return prices;
};

/** Иконка предмета с эмодзи-фолбэком, если картинка с сервера не загрузилась. */
function ItemIcon({ item }: { item: CollectionItem }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="collection-card-icon">
      {item.icon && !failed ? (
        <img src={item.icon} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span className="collection-card-emoji" aria-hidden="true">
          {statEmojiOf(item.statType)}
        </span>
      )}
    </span>
  );
}

export default function CollectionPage({ onExit }: { onExit: () => void }) {
  const navigate = useNavigate();
  const cigarettes = usePlayer((s) => s.cigarettes);
  const hammers = usePlayer((s) => s.hammers);
  const applyPlayerData = usePlayer((s) => s.applyPlayerData);
  const fetchPlayerData = usePlayer((s) => s.fetchPlayerData);

  const [data, setData] = useState<CollectionResponse | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<Filter>('mine');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<{ itemId: string; kind: ActionKind } | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  // Жёсткий лок от двойного клика: disabled на кнопке срабатывает после ре-рендера.
  const actionLock = useRef(false);

  const reload = useCallback(async () => {
    const [collection, upgradePrices] = await Promise.all([
      fetchCollection(),
      fetchUpgradePrices(),
    ]);
    setData(collection);
    setPrices(upgradePrices);
  }, []);

  const handleLoadError = useCallback((error: unknown) => {
    if (isUnauthorized(error)) {
      setUnauthorized(true);
      setLoadError('Войдите заново');
      return;
    }
    setLoadError(describeError(error, 'Не удалось загрузить коллекцию'));
  }, []);

  // Первичная загрузка коллекции + свежие балансы из /api/me.
  useEffect(() => {
    let active = true;

    // Данные приходят асинхронно, setData вызывается уже после ответа сервера.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload()
      .then(() => {
        if (!active) return;
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        handleLoadError(error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    void fetchPlayerData();

    return () => {
      active = false;
    };
  }, [reload, fetchPlayerData, handleLoadError]);

  // Протухла сессия — показываем сообщение и уводим на логин.
  useEffect(() => {
    if (!unauthorized) return;
    const timer = window.setTimeout(() => navigate('/login', { replace: true }), 1500);
    return () => window.clearTimeout(timer);
  }, [unauthorized, navigate]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (selectedId) setSelectedId(null);
      else onExit();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, onExit]);

  const retry = () => {
    setLoading(true);
    setLoadError(null);
    reload()
      .catch(handleLoadError)
      .finally(() => setLoading(false));
  };

  const visibleItems = useMemo<CollectionItem[]>(() => {
    if (!data) return [];
    if (filter === 'mine') return data.items;
    if (filter === 'upgrades') {
      return data.catalog.filter((item) => item.pendingRarity != null);
    }
    if (filter === 'shop') {
      return data.catalog.filter((item) => item.purchasable === true && !isOwned(item));
    }
    return data.catalog;
  }, [data, filter]);

  const selectedItem = useMemo<CollectionItem | null>(() => {
    if (!data || !selectedId) return null;
    return (
      data.catalog.find((item) => item.itemId === selectedId) ??
      data.items.find((item) => item.itemId === selectedId) ??
      null
    );
  }, [data, selectedId]);

  const bonusEntries = useMemo<[string, number][]>(() => {
    if (!data) return [];
    return Object.entries(data.bonus);
  }, [data]);

  const runAction = async (item: CollectionItem, kind: ActionKind) => {
    // Оптимистичный лок: пока летит запрос, все кнопки действий заблокированы.
    if (actionLock.current) return;
    if (kind === 'buy') {
      if (item.purchasable !== true || isOwned(item)) return;
    } else if (!isOwned(item)) {
      return;
    }

    actionLock.current = true;
    setBusy({ itemId: item.itemId, kind });
    setNotice(null);

    const endpoint =
      kind === 'buy'
        ? '/api/npc/shop/buy'
        : kind === 'reroll'
          ? '/api/npc/collection/reroll'
          : '/api/npc/collection/upgrade';

    try {
      const response: unknown = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify({ itemId: item.itemId }),
      });
      const payload = asRecord(response) ?? {};

      // Сервер вернул новые балансы — применяем их и добираем свежие данные.
      applyPlayerData(response);

      if (kind === 'reroll') {
        setNotice({ type: 'success', text: describeReroll(payload) });
      } else if (kind === 'buy') {
        const bought = asRecord(payload.item);
        const boughtName = typeof bought?.name === 'string' ? bought.name : item.name;
        const boughtRarity = typeof bought?.rarityName === 'string' ? bought.rarityName : null;
        const price = buyPriceOf(item);
        const pricePart = price !== null ? ` за ${formatNumber(price)} сигарет` : '';
        setNotice({
          type: 'success',
          text: `Куплено: ${boughtName}${pricePart}${boughtRarity ? ` — ${boughtRarity}` : ''}`,
        });
      } else {
        const upgraded = asRecord(payload.item);
        const newRarity =
          typeof upgraded?.rarityName === 'string' ? upgraded.rarityName : 'новая редкость';
        const newStat = Number(upgraded?.currentStat);
        const statPart = Number.isFinite(newStat) ? ` (${statTextOf({ ...item, currentStat: newStat })})` : '';
        setNotice({
          type: 'success',
          text: `Улучшено: ${item.name} → ${newRarity}${statPart}`,
        });
      }

      try {
        await reload();
      } catch (reloadError) {
        console.error('Не удалось обновить коллекцию:', reloadError);
      }
      void fetchPlayerData();
    } catch (error) {
      if (isUnauthorized(error)) {
        setUnauthorized(true);
        setNotice({ type: 'error', text: 'Войдите заново' });
      } else {
        setNotice({
          type: 'error',
          text: describeError(error, 'Не удалось выполнить действие'),
        });
      }
    } finally {
      actionLock.current = false;
      setBusy(null);
    }
  };

  const isBusyItem = (itemId: string, kind: ActionKind) =>
    busy?.itemId === itemId && busy.kind === kind;

  const emptyText =
    filter === 'mine'
      ? 'У тебя пока нет предметов. Выбей их с боссов'
      : filter === 'upgrades'
        ? 'Нет доступных улучшений. Выбей предмет лучшей редкости'
        : filter === 'shop'
          ? 'Покупать пока нечего — всё уже в коллекции'
          : 'Каталог пуст';

  const canReroll = hammers >= REROLL_PRICE;
  const upgradePrice = selectedItem ? prices[selectedItem.itemId] : undefined;
  const canAffordUpgrade = upgradePrice === undefined || cigarettes >= upgradePrice;
  const selectedBuyPrice = selectedItem ? buyPriceOf(selectedItem) : null;
  const canAffordBuy = selectedBuyPrice === null || cigarettes >= selectedBuyPrice;
  const bonusText =
    bonusEntries.length > 0
      ? bonusEntries
          .map(([key, value]) => `${bonusLabelOf(key)} +${formatNumber(value)}`)
          .join(' · ')
      : '—';

  return (
    <div className="collection-page">
      <header className="collection-top">
        <button type="button" className="collection-back" onClick={onExit}>
          ← Во двор
        </button>
        <h3 className="collection-title">Коллекция</h3>
        <span className="collection-badge" title="Молотки">
          🔨 {formatNumber(hammers)}
        </span>
      </header>

      <div className="collection-bonus">Урон: {bonusText}</div>

      <div className="collection-tabs" role="tablist">
        {FILTERS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={filter === tab.id}
            className={`collection-tab ${filter === tab.id ? 'active' : ''}`}
            onClick={() => setFilter(tab.id)}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {notice && <div className={`collection-notice ${notice.type}`}>{notice.text}</div>}

      <div className="collection-content">
        <div className="collection-body">
          {loading ? (
            <div className="collection-status">Загружаем коллекцию...</div>
          ) : loadError ? (
            <div className="collection-status">
              <div>{loadError}</div>
              <button type="button" className="collection-retry" onClick={retry}>
                Повторить
              </button>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="collection-status">{emptyText}</div>
          ) : (
            <div className="collection-grid">
              {visibleItems.map((item) => {
                const owned = isOwned(item);
                const drop = dropSourcesText(item);
                const price = buyPriceOf(item);
                const canBuy = !owned && item.purchasable === true;
                const color = canBuy ? SHOP_COLOR : rarityColorOf(item);

                return (
                  <button
                    key={item.itemId}
                    type="button"
                    className={[
                      'collection-card',
                      owned ? '' : 'collection-card--locked',
                      canBuy ? 'collection-card--shop' : '',
                      selectedId === item.itemId ? 'is-active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ borderColor: color, boxShadow: `0 0 9px ${color}55` }}
                    onClick={() => setSelectedId(item.itemId)}
                    title={item.name}
                  >
                    {owned && item.pendingRarity != null && (
                      <span className="collection-card-pending" title="Доступно улучшение">
                        ↑
                      </span>
                    )}
                    <ItemIcon item={item} />
                    <span className="collection-card-name">{item.name}</span>
                    {owned ? (
                      <>
                        <span className="collection-card-stat">{statTextOf(item)}</span>
                        {rarityNameOf(item) && (
                          <span className="collection-card-rarity" style={{ color }}>
                            {rarityNameOf(item)}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="collection-card-stat">?</span>
                        {canBuy && price !== null && (
                          <span className="collection-card-price">
                            🚬 {formatNumber(price)}
                          </span>
                        )}
                        {drop && <span className="collection-card-drop">{drop}</span>}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside
          className={`collection-details ${
            selectedItem ? '' : 'collection-details--empty'
          }`}
        >
          {selectedItem ? (
            <>
              <button
                type="button"
                className="collection-details-close"
                onClick={() => setSelectedId(null)}
                aria-label="Закрыть"
              >
                ✕
              </button>

              <div className="collection-details-head">
                <ItemIcon item={selectedItem} />
                <div>
                  <h4 className="collection-details-title">{selectedItem.name}</h4>
                  <span
                    className="collection-details-rarity"
                    style={{ color: rarityColorOf(selectedItem) }}
                  >
                    {rarityNameOf(selectedItem) ??
                      (!isOwned(selectedItem) && selectedItem.purchasable === true
                        ? 'Можно купить'
                        : 'Нет в коллекции')}
                  </span>
                </div>
              </div>

              <div className="collection-details-stat">
                {isOwned(selectedItem) ? statTextOf(selectedItem) : 'Предмет ещё не выпал'}
              </div>

              {selectedItem.baseStat != null && selectedItem.maxStat != null && (
                <div className="collection-details-range">
                  Диапазон: {selectedItem.baseStat}–{selectedItem.maxStat}
                </div>
              )}

              {dropSourcesText(selectedItem) && (
                <div className="collection-details-drop">{dropSourcesText(selectedItem)}</div>
              )}

              {isOwned(selectedItem) && selectedItem.pendingRarity != null && (
                <div className="collection-details-pending">
                  <div className="collection-details-pending-text">
                    Доступно улучшение: {rarityNameOf(selectedItem) ?? '—'} →{' '}
                    {selectedItem.pendingRarityName ??
                      rarityNameByKey(selectedItem.pendingRarity) ??
                      selectedItem.pendingRarity}{' '}
                    ({selectedItem.currentStat ?? '—'} → {selectedItem.pendingStat ?? '—'})
                  </div>
                  <button
                    type="button"
                    className="collection-action collection-action--upgrade"
                    onClick={() => runAction(selectedItem, 'upgrade')}
                    disabled={busy !== null || !canAffordUpgrade}
                    title={canAffordUpgrade ? 'Улучшить редкость' : 'Не хватает сигарет'}
                  >
                    {isBusyItem(selectedItem.itemId, 'upgrade')
                      ? 'Улучшаем...'
                      : upgradePrice !== undefined
                        ? `Улучшить за ${formatNumber(upgradePrice)} сигарет`
                        : 'Улучшить за сигареты'}
                  </button>
                  {!canAffordUpgrade && (
                    <div className="collection-action-hint">Не хватает сигарет</div>
                  )}
                </div>
              )}

              {!isOwned(selectedItem) && selectedItem.purchasable === true && (
                <div className="collection-shop-block">
                  <div className="collection-shop-price">
                    Цена:{' '}
                    {selectedBuyPrice !== null
                      ? `${formatNumber(selectedBuyPrice)} 🚬`
                      : 'уточняется'}
                  </div>
                  <button
                    type="button"
                    className="collection-action collection-action--buy"
                    onClick={() => runAction(selectedItem, 'buy')}
                    disabled={busy !== null || !canAffordBuy}
                    title={canAffordBuy ? 'Купить предмет' : 'Не хватает сигарет'}
                  >
                    {isBusyItem(selectedItem.itemId, 'buy')
                      ? 'Покупаем...'
                      : selectedBuyPrice !== null
                        ? `Купить за ${formatNumber(selectedBuyPrice)} сигарет`
                        : 'Купить'}
                  </button>
                  {!canAffordBuy && (
                    <div className="collection-action-hint">Не хватает сигарет</div>
                  )}
                </div>
              )}

              {isOwned(selectedItem) ? (
                <div className="collection-details-actions">
                  <button
                    type="button"
                    className="collection-action collection-action--reroll"
                    onClick={() => runAction(selectedItem, 'reroll')}
                    disabled={busy !== null || !canReroll}
                    title={canReroll ? 'Перероллить редкость' : 'Нужен молоток'}
                  >
                    {isBusyItem(selectedItem.itemId, 'reroll')
                      ? 'Крутим...'
                      : `Перероллить за ${REROLL_PRICE} молоток`}
                  </button>
                  {!canReroll && <div className="collection-action-hint">Нужен молоток</div>}
                  <button
                    type="button"
                    className="collection-details-btn"
                    onClick={() => setSelectedId(null)}
                  >
                    Закрыть
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="collection-details-btn"
                  onClick={() => setSelectedId(null)}
                >
                  Закрыть
                </button>
              )}
            </>
          ) : (
            <div className="collection-details-hint">
              Выбери предмет, чтобы увидеть детали
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
