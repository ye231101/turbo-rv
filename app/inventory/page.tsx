'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { LiveChatTab } from '@/components/live-chat-tab';
import { InventoryCard } from '@/components/inventory-card';
import { FilterMultiSelect } from '@/components/filter-multi-select';
import { LocationMultiSelect } from '@/components/location-multi-select';
import { TradePromoCard } from '@/components/trade-promo-card';
import { api } from '@/lib/api';
import { mapInventoryItem, type InventoryListResponse, type InventoryPagination } from '@/lib/inventory';
import { makes, models, inventoryTypes, locations, bodies } from '@/lib/utils';
import type { InventoryUnit } from '@/types';

const BODY_VALUES = new Set(bodies.map((b) => b.value));
const MAKE_VALUES = new Set(makes.map((m) => m.value));
const MODEL_VALUES = new Set(models.map((m) => m.value));
const INVENTORY_TYPE_VALUES = new Set(inventoryTypes.map((i) => i.value));
const LOCATION_VALUES = new Set(locations.map((l) => l.value));

function parseCsvParams(searchParams: URLSearchParams, key: string, allowed: Set<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of searchParams.getAll(key)) {
    for (const part of raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)) {
      if (allowed.has(part) && !seen.has(part)) {
        seen.add(part);
        out.push(part);
      }
    }
  }
  out.sort();
  return out;
}

function sameSortedSelection(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

function visiblePageItems(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items: (number | 'ellipsis')[] = [];
  const push = (v: number | 'ellipsis') => {
    if (items[items.length - 1] === v) return;
    items.push(v);
  };
  push(1);
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) push('ellipsis');
  for (let p = start; p <= end; p++) push(p);
  if (end < total - 1) push('ellipsis');
  if (total > 1) push(total);
  return items;
}

function pageGridItems(units: InventoryUnit[], page: number): ReactNode[] {
  if (units.length === 0) return [];
  if (units.length < 4) {
    return units.map((unit) => <InventoryCard key={unit.id} unit={unit} />);
  }
  const promo = <TradePromoCard key={`trade-promo-${page}`} />;
  if (units.length === 4) {
    return [...units.map((unit) => <InventoryCard key={unit.id} unit={unit} />), promo];
  }
  return [
    ...units.slice(0, 4).map((unit) => <InventoryCard key={unit.id} unit={unit} />),
    promo,
    ...units.slice(4).map((unit) => <InventoryCard key={unit.id} unit={unit} />),
  ];
}

function parsePageParam(value: string | null): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed < 1) return 1;
  return parsed;
}

function parseSizeParam(value: string | null): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed < 1 || parsed > 100) return 20;
  return parsed;
}

async function fetchInventories(params: {
  currentPage: number;
  perPage: number;
  q: string | null;
  rvType: string | null;
  filterBodies: string[];
  filterMakes: string[];
  filterModels: string[];
  filterInventoryTypes: string[];
  filterLocations: string[];
}): Promise<{ inventories: InventoryUnit[]; pagination: InventoryPagination }> {
  const query: Record<string, string | number> = {
    currentPage: params.currentPage,
    perPage: params.perPage,
  };
  if (params.q != null && params.q !== '') {
    query.q = params.q;
  }
  if (params.rvType != null && params.rvType !== '') {
    query.rvType = params.rvType;
  }
  if (params.filterBodies.length > 0) {
    query.body = params.filterBodies.join(',');
  }
  if (params.filterMakes.length > 0) {
    query.make = params.filterMakes.join(',');
  }
  if (params.filterModels.length > 0) {
    query.model = params.filterModels.join(',');
  }
  if (params.filterInventoryTypes.length > 0) {
    query.inventoryType = params.filterInventoryTypes.join(',');
  }
  if (params.filterLocations.length > 0) {
    query.location = params.filterLocations.join(',');
  }

  const res = (await api.get('inventory', {
    params: query,
  })) as InventoryListResponse;

  const { inventories, pagination } = res.data;
  return {
    inventories: inventories.map(mapInventoryItem),
    pagination,
  };
}

export default function InventoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [currentPage, setCurrentPage] = useState(() => parsePageParam(searchParams.get('page')));
  const [perPage, setPerPage] = useState(() => parseSizeParam(searchParams.get('size')));
  const [pageUnits, setPageUnits] = useState<InventoryUnit[]>([]);
  const [pagination, setPagination] = useState<InventoryPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState(() => searchParams.get('q'));
  const [rvType, setRvType] = useState(() => searchParams.get('rvType'));
  const [filterBodies, setFilterBodies] = useState(() => parseCsvParams(searchParams, 'body', BODY_VALUES));
  const [filterMakes, setFilterMakes] = useState(() => parseCsvParams(searchParams, 'make', MAKE_VALUES));
  const [filterModels, setFilterModels] = useState(() => parseCsvParams(searchParams, 'model', MODEL_VALUES));
  const [filterInventoryTypes, setFilterInventoryTypes] = useState(() =>
    parseCsvParams(searchParams, 'inventoryType', INVENTORY_TYPE_VALUES),
  );
  const [filterLocations, setFilterLocations] = useState(() =>
    parseCsvParams(searchParams, 'location', LOCATION_VALUES),
  );
  const skipScrollRef = useRef(true);

  const totalPages = Math.max(1, pagination?.totalPages ?? 1);

  useEffect(() => {
    const pageParam = parsePageParam(searchParams.get('page'));
    const sizeParam = parseSizeParam(searchParams.get('size'));
    const qParam = searchParams.get('q');
    const rvTypeParam = searchParams.get('rvType');
    const bodiesNext = parseCsvParams(searchParams, 'body', BODY_VALUES);
    const makesNext = parseCsvParams(searchParams, 'make', MAKE_VALUES);
    const modelsNext = parseCsvParams(searchParams, 'model', MODEL_VALUES);
    const inventoryTypesNext = parseCsvParams(searchParams, 'inventoryType', INVENTORY_TYPE_VALUES);
    const locationNext = parseCsvParams(searchParams, 'location', LOCATION_VALUES);

    setCurrentPage((prev) => (prev === pageParam ? prev : pageParam));
    setPerPage((prev) => (prev === sizeParam ? prev : sizeParam));
    setQ((prev) => (prev === qParam ? prev : qParam));
    setRvType((prev) => (prev === rvTypeParam ? prev : rvTypeParam));
    setFilterBodies((prev) => (sameSortedSelection(prev, bodiesNext) ? prev : bodiesNext));
    setFilterMakes((prev) => (sameSortedSelection(prev, makesNext) ? prev : makesNext));
    setFilterModels((prev) => (sameSortedSelection(prev, modelsNext) ? prev : modelsNext));
    setFilterInventoryTypes((prev) => (sameSortedSelection(prev, inventoryTypesNext) ? prev : inventoryTypesNext));
    setFilterLocations((prev) => (sameSortedSelection(prev, locationNext) ? prev : locationNext));
  }, [searchParams]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    fetchInventories({
      currentPage,
      perPage,
      q,
      rvType,
      filterBodies,
      filterMakes,
      filterModels,
      filterInventoryTypes,
      filterLocations,
    })
      .then((res) => {
        if (ignore) return;
        setPageUnits(res.inventories);
        setPagination(res.pagination);
      })
      .catch((err: Error) => {
        if (ignore) return;
        setError(err.message || 'Failed to load inventories');
        setPageUnits([]);
        setPagination(null);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [currentPage, perPage, q, rvType, filterBodies, filterMakes, filterModels, filterInventoryTypes, filterLocations]);

  useEffect(() => {
    if (!pagination) return;
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, pagination]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentPage != null && currentPage !== 1) params.set('page', String(currentPage));
    else params.delete('page');
    if (perPage != null && perPage !== 20) params.set('size', String(perPage));
    else params.delete('size');
    if (q != null && q !== '') params.set('q', q);
    else params.delete('q');
    if (rvType != null && rvType !== '') params.set('rvType', rvType);
    else params.delete('rvType');
    if (filterBodies.length > 0) params.set('body', filterBodies.join(','));
    else params.delete('body');
    if (filterMakes.length > 0) params.set('make', filterMakes.join(','));
    else params.delete('make');
    if (filterModels.length > 0) params.set('model', filterModels.join(','));
    else params.delete('model');
    if (filterInventoryTypes.length > 0) params.set('inventoryType', filterInventoryTypes.join(','));
    else params.delete('inventoryType');
    if (filterLocations.length > 0) params.set('location', filterLocations.join(','));
    else params.delete('location');

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentQuery = searchParams.toString();
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;
    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [
    currentPage,
    perPage,
    q,
    rvType,
    filterBodies,
    filterMakes,
    filterModels,
    filterInventoryTypes,
    filterLocations,
    pathname,
    router,
    searchParams,
  ]);

  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    document.getElementById('inventory')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [currentPage]);

  const gridItems = useMemo(() => pageGridItems(pageUnits, currentPage), [pageUnits, currentPage]);

  const pageItems = useMemo(() => visiblePageItems(currentPage, totalPages), [currentPage, totalPages]);

  const go = (p: number) => {
    setCurrentPage(Math.min(Math.max(1, p), totalPages));
  };

  const clearFilters = () => {
    setQ(null);
    setRvType(null);
    setFilterBodies([]);
    setFilterMakes([]);
    setFilterModels([]);
    setFilterInventoryTypes([]);
    setFilterLocations([]);
    setCurrentPage(1);
  };

  return (
    <section id="inventory" className="py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="border-border bg-card mb-8 rounded-lg border p-4 md:p-6">
          <div className="flex flex-col items-start justify-start gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Inventory</p>
              <h2 className="text-foreground mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">
                Find Your RV and See It Live
              </h2>
            </div>
          </div>

          <div className="border-border bg-background mt-6 flex flex-col overflow-hidden rounded-lg border md:mt-8 md:flex-row md:items-stretch">
            <div className="border-border flex min-w-0 flex-1 flex-col border-b px-4 py-3 md:border-r md:border-b-0">
              <span className="text-muted-foreground text-xs font-medium">RV Type</span>
              <FilterMultiSelect
                options={bodies}
                selected={filterBodies}
                onChange={(next) => {
                  setFilterBodies(next);
                  setCurrentPage(1);
                }}
                allLabel="All types"
                countNoun="types"
                triggerClassName="w-full justify-between rounded-none border-0 px-0 py-1.5 shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                contentClassName="min-w-[240px]"
              />
            </div>
            <div className="border-border flex min-w-0 flex-1 flex-col border-b px-4 py-3 md:border-r md:border-b-0">
              <span className="text-muted-foreground text-xs font-medium">Make</span>
              <FilterMultiSelect
                options={makes}
                selected={filterMakes}
                onChange={(next) => {
                  setFilterMakes(next);
                  setCurrentPage(1);
                }}
                allLabel="All makes"
                countNoun="makes"
                triggerClassName="w-full justify-between rounded-none border-0 px-0 py-1.5 shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                contentClassName="min-w-[240px]"
              />
            </div>
            <div className="border-border flex min-w-0 flex-1 flex-col border-b px-4 py-3 md:border-r md:border-b-0">
              <span className="text-muted-foreground text-xs font-medium">Model</span>
              <FilterMultiSelect
                options={models}
                selected={filterModels}
                onChange={(next) => {
                  setFilterModels(next);
                  setCurrentPage(1);
                }}
                allLabel="All models"
                countNoun="models"
                triggerClassName="w-full justify-between rounded-none border-0 px-0 py-1.5 shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                contentClassName="min-w-[240px]"
              />
            </div>
            <div className="border-border flex min-w-0 flex-1 flex-col border-b px-4 py-3 md:border-r md:border-b-0">
              <span className="text-muted-foreground text-xs font-medium">New/Used</span>
              <FilterMultiSelect
                options={inventoryTypes}
                selected={filterInventoryTypes}
                onChange={(next) => {
                  setFilterInventoryTypes(next);
                  setCurrentPage(1);
                }}
                allLabel="All RVs"
                countNoun="conditions"
                triggerClassName="w-full justify-between rounded-none border-0 px-0 py-1.5 shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                contentClassName="min-w-[240px]"
              />
            </div>
            <div className="border-border flex min-w-0 flex-1 flex-col border-b px-4 py-3 md:border-r md:border-b-0">
              <span className="text-muted-foreground text-xs font-medium">Location</span>
              <LocationMultiSelect
                selected={filterLocations}
                onChange={(next) => {
                  setFilterLocations(next);
                  setCurrentPage(1);
                }}
                triggerClassName="w-full justify-between rounded-none border-0 px-0 py-1.5 shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                contentClassName="min-w-[240px]"
              />
            </div>
            <div className="flex shrink-0 items-stretch p-3 md:min-w-[200px]">
              <Button
                type="reset"
                size="lg"
                className="h-auto min-h-11 w-full rounded-md px-6 text-base font-bold"
                onClick={clearFilters}
              >
                <span className="hidden lg:block">Clear Filters</span>
                <span className="block lg:hidden">Clear</span>
              </Button>
            </div>
          </div>
        </div>

        {error ? <p className="text-destructive text-center text-sm">{error}</p> : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-muted-foreground size-8" />
          </div>
        ) : (
          <div id="inventory-results" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gridItems}
          </div>
        )}

        {!loading && !error && pageUnits.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">No units match this page.</p>
        ) : null}

        {!loading && totalPages > 1 ? (
          <Pagination className="mt-10">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    go(currentPage - 1);
                  }}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-40' : undefined}
                  aria-disabled={currentPage <= 1}
                />
              </PaginationItem>
              {pageItems.map((item, i) =>
                item === 'ellipsis' ? (
                  <PaginationItem key={`e-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      size="icon"
                      isActive={item === currentPage}
                      onClick={(e) => {
                        e.preventDefault();
                        go(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    go(currentPage + 1);
                  }}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-40' : undefined}
                  aria-disabled={currentPage >= totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </div>

      <LiveChatTab />
    </section>
  );
}
