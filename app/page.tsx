'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BadgeDollarSign, CircleUser, Headset, Shield, ShieldCheck, Star, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FilterMultiSelect } from '@/components/filter-multi-select';
import { LandingDealCard } from '@/components/landing-deal-card';
import { LocationMultiSelect } from '@/components/location-multi-select';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useViewProWidget } from '@/components/view-pro-widget-provider';
import { api } from '@/lib/api';
import { mapInventoryItem, type InventoryListResponse, type InventoryPagination } from '@/lib/inventory';
import { bodies, cn, inventoryTypes, makes, models } from '@/lib/utils';
import type { InventoryUnit } from '@/types';

const FEATURED_DEALS_COUNT = 10;

const CATEGORY_LINKS = [
  { label: 'Class A', href: '/inventory?body=class-a', image: '/images/rv/class-a.svg' },
  { label: 'Class B', href: '/inventory?body=class-b', image: '/images/rv/class-b.svg' },
  { label: 'Class C', href: '/inventory?body=class-c', image: '/images/rv/class-c.svg' },
  { label: 'Towable', href: '/inventory?body=5th-wheel,travel-trailer,toy-hauler', image: '/images/rv/towable.svg' },
  { label: 'Overlander', href: '/inventory?rvType=overlander', image: '/images/rv/overlander.svg' },
  { label: 'Super C', href: '/inventory?rvType=super-c', image: '/images/rv/super-c.svg' },
  { label: 'Adventure Van', href: '/inventory?rvType=adventure-van', image: '/images/rv/adventure-van.svg' },
] as const;

async function fetchFeaturedInventories(): Promise<{ inventories: InventoryUnit[]; pagination: InventoryPagination }> {
  const res = (await api.get('inventory', {
    params: {
      currentPage: 1,
      perPage: FEATURED_DEALS_COUNT,
    },
  })) as InventoryListResponse;

  const { inventories, pagination } = res.data;
  return {
    inventories: inventories.map(mapInventoryItem),
    pagination,
  };
}

export default function HomePage() {
  const router = useRouter();
  const [units, setUnits] = useState<InventoryUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBodies, setFilterBodies] = useState<string[]>([]);
  const [filterMakes, setFilterMakes] = useState<string[]>([]);
  const [filterModels, setFilterModels] = useState<string[]>([]);
  const [filterInventoryTypes, setFilterInventoryTypes] = useState<string[]>([]);
  const [filterLocations, setFilterLocations] = useState<string[]>([]);
  const { isAvailable, open } = useViewProWidget();

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    fetchFeaturedInventories()
      .then((res) => {
        if (ignore) return;
        setUnits(res.inventories);
      })
      .catch((err: Error) => {
        if (ignore) return;
        setError(err.message || 'Failed to load inventory');
        setUnits([]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const runInventorySearch = () => {
    const params = new URLSearchParams();
    if (filterBodies.length > 0) params.set('body', filterBodies.join(','));
    if (filterMakes.length > 0) params.set('make', filterMakes.join(','));
    if (filterModels.length > 0) params.set('model', filterModels.join(','));
    if (filterInventoryTypes.length > 0) params.set('inventoryType', filterInventoryTypes.join(','));
    if (filterLocations.length > 0) params.set('location', filterLocations.join(','));
    const qs = params.toString();
    router.push(qs ? `/inventory?${qs}` : '/inventory');
  };

  return (
    <div className="bg-neutral-950 pb-10 md:pb-16">
      <section className="relative flex min-h-[calc(100vh-116px)] w-full flex-col overflow-hidden md:min-h-[calc(100vh-80px)]">
        <div className="absolute inset-0">
          <Image
            src="/images/landing_hero.png"
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/90 via-black/55 to-black/25"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/35"
            aria-hidden
          />
        </div>

        <div className="relative z-10 mx-auto flex w-full flex-1 flex-col justify-center px-4 py-16 md:px-6 md:py-20 lg:px-10">
          <div className="flex flex-1 flex-col justify-center">
            <h1 className="text-4xl font-black tracking-tight text-white uppercase drop-shadow-md sm:text-5xl md:text-6xl">
              <span className="block">Real deals.</span>
              <span className="block">Real answers.</span>
              <span className="text-primary block">Right now.</span>
            </h1>
            <p className="mt-5 max-w-md text-base font-medium text-white/90 md:text-lg md:leading-relaxed">
              <span className="block">See any RV live. Get real answers.</span>
              <span className="block">Buy with confidence.</span>
            </p>
            <div className="mt-8 flex flex-row flex-wrap items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
              <Button
                type="button"
                size="lg"
                variant="ghost"
                className="bg-primary text-primary-foreground hover:bg-primary/80 h-12 w-full rounded-md px-3 text-sm font-bold uppercase shadow-none sm:w-fit sm:px-10 md:px-16"
                asChild
              >
                <Link href="/inventory">View all deals</Link>
              </Button>
              {isAvailable && (
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="inline-flex h-12 w-full cursor-pointer items-center gap-2 rounded-md border border-white bg-transparent px-3 text-sm font-bold text-white uppercase shadow-none hover:bg-white/10 hover:text-white sm:w-fit sm:gap-2.5 sm:px-10 md:px-16 dark:border-white dark:bg-transparent dark:hover:bg-white/10"
                  onClick={open}
                >
                  <span
                    className="animate-live-dot-blink size-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)] motion-reduce:animate-none"
                    aria-hidden
                  />
                  Connect live
                </Button>
              )}
            </div>
          </div>

          <div className="mt-10 w-full lg:w-fit">
            <div className="grid grid-cols-1 justify-start sm:grid-cols-[repeat(2,max-content)] lg:grid-cols-[repeat(4,max-content)] lg:justify-center">
              {[
                {
                  key: 'stock',
                  renderIcon: () => (
                    <CircleUser className="text-primary size-9 shrink-0 sm:size-10" strokeWidth={1.5} aria-hidden />
                  ),
                  title: '1,000+ RVs',
                  subtitle: 'In Stock Now',
                },
                {
                  key: 'support',
                  renderIcon: () => (
                    <Headset className="text-primary size-9 shrink-0 sm:size-10" strokeWidth={1.5} aria-hidden />
                  ),
                  title: 'Live Support',
                  subtitle: '7 Days a Week',
                },
                {
                  key: 'price',
                  renderIcon: () => (
                    <Shield className="text-primary size-9 shrink-0 sm:size-10" strokeWidth={1.5} aria-hidden />
                  ),
                  title: 'Best Price Guarantee',
                  subtitle: 'Every Day',
                },
              ].map(({ key, renderIcon, title, subtitle }, i) => (
                <div
                  key={key}
                  className={cn(
                    'lg:py-5',
                    i > 0 && 'border-t border-white/15',
                    i === 1 && 'sm:border-t-0',
                    i === 2 && 'sm:border-t lg:border-t-0',
                    i === 3 && 'sm:border-t lg:border-t-0',
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-4 md:px-5 lg:py-0',
                      i > 0 && 'border-white/15 sm:border-l',
                      i === 1 && 'sm:border-l',
                      i === 2 && 'sm:border-l-0 lg:border-l',
                      i === 3 && 'sm:border-l',
                    )}
                  >
                    {renderIcon()}
                    <div className="min-w-0">
                      <p className="text-xs leading-tight font-bold text-nowrap text-white sm:text-sm md:text-base">
                        {title}
                      </p>
                      <p className="mt-0.5 text-xs font-normal text-white/90 sm:text-xs md:text-sm">{subtitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 mx-auto -mt-12 max-w-7xl px-4 md:-mt-16 md:px-6 lg:px-10">
        <div className="mx-auto rounded-xl border border-neutral-300 bg-white p-3 shadow-sm md:p-4">
          <p className="mb-3 text-lg font-extrabold tracking-wide text-neutral-900 uppercase md:mb-4 md:text-xl">
            Find your perfect RV
          </p>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div className="space-y-1">
                <span className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Type</span>
                <FilterMultiSelect
                  options={bodies}
                  selected={filterBodies}
                  onChange={setFilterBodies}
                  allLabel="All types"
                  countNoun="types"
                  triggerClassName="min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-900 shadow-none hover:bg-white focus-visible:ring-0 focus-visible:ring-offset-0 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-neutral-500"
                  contentClassName="min-w-[240px]"
                />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Make</span>
                <FilterMultiSelect
                  options={makes}
                  selected={filterMakes}
                  onChange={setFilterMakes}
                  allLabel="All makes"
                  countNoun="makes"
                  triggerClassName="min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-900 shadow-none hover:bg-white focus-visible:ring-0 focus-visible:ring-offset-0 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-neutral-500"
                  contentClassName="min-w-[240px]"
                />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Model</span>
                <FilterMultiSelect
                  options={models}
                  selected={filterModels}
                  onChange={setFilterModels}
                  allLabel="All models"
                  countNoun="models"
                  triggerClassName="min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-900 shadow-none hover:bg-white focus-visible:ring-0 focus-visible:ring-offset-0 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-neutral-500"
                  contentClassName="min-w-[240px]"
                />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">New/Used</span>
                <FilterMultiSelect
                  options={inventoryTypes}
                  selected={filterInventoryTypes}
                  onChange={setFilterInventoryTypes}
                  allLabel="All RVs"
                  countNoun="conditions"
                  triggerClassName="min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-900 shadow-none hover:bg-white focus-visible:ring-0 focus-visible:ring-offset-0 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-neutral-500"
                  contentClassName="min-w-[240px]"
                />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Location</span>
                <LocationMultiSelect
                  selected={filterLocations}
                  onChange={setFilterLocations}
                  triggerClassName="min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-900 shadow-none hover:bg-white focus-visible:ring-0 focus-visible:ring-offset-0 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-neutral-500"
                  contentClassName="min-w-[240px]"
                />
              </div>
            </div>
            <Button
              type="button"
              size="lg"
              className="h-12 w-full shrink-0 cursor-pointer rounded-md border-0 bg-black px-8 text-sm font-extrabold tracking-wide text-white uppercase hover:bg-black/85 xl:w-auto"
              onClick={runInventorySearch}
            >
              Search
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="border-b border-neutral-100/10 md:py-6 lg:py-10">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 lg:gap-6">
            {CATEGORY_LINKS.map((cat) => (
              <Link key={cat.label} href={cat.href} className="group flex flex-col items-center text-center">
                <div className="border-primary/40 group-hover:border-primary flex h-20 w-full max-w-[120px] items-center justify-center rounded-2xl border bg-neutral-900/40 p-4 transition group-hover:bg-neutral-900/70">
                  <Image
                    src={cat.image}
                    alt=""
                    width={80}
                    height={64}
                    className="h-14 w-auto object-contain opacity-90"
                  />
                </div>
                <p className="mt-3 text-xs font-bold tracking-wide text-white uppercase">{cat.label}</p>
                <span className="text-primary mt-2 inline-flex items-center gap-1 text-xs font-bold">
                  Shop now <ArrowRight className="size-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="deals" className="mx-auto max-w-7xl px-4 pt-4 md:px-6 md:pt-6 lg:px-10">
        {error ? <p className="text-destructive mb-6 text-center text-sm">{error}</p> : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-muted-foreground size-8" />
          </div>
        ) : (
          <Carousel
            opts={{
              align: 'start',
              dragFree: false,
              watchDrag: (_api, evt) => {
                const raw = evt.target;
                if (!(raw instanceof Element)) return true;
                return !raw.closest('[data-nested-embla-viewport]');
              },
            }}
            className="w-full"
            key={units.map((u) => u.id).join('|')}
          >
            <div className="mb-6 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <h2 className="text-2xl font-black tracking-wide text-white uppercase md:text-3xl">
                Top deals of the week
              </h2>
              <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                <Link
                  href="/inventory"
                  className="hover:text-primary flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-bold tracking-wide text-white uppercase transition"
                >
                  View all inventory
                  <ArrowRight className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
                </Link>
                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  <CarouselPrevious
                    variant="outline"
                    className="static top-auto right-auto bottom-auto left-auto size-10 min-h-10 min-w-10 shrink-0 translate-x-0 translate-y-0 cursor-pointer rounded-full border-white/25 bg-neutral-900 text-white shadow-none hover:bg-neutral-800! hover:text-white! disabled:border-white/15 disabled:bg-neutral-900/60 disabled:text-white/35 [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-white!"
                  />
                  <CarouselNext
                    variant="outline"
                    className="static top-auto right-auto bottom-auto left-auto size-10 min-h-10 min-w-10 shrink-0 translate-x-0 translate-y-0 cursor-pointer rounded-full border-white/25 bg-neutral-900 text-white shadow-none hover:bg-neutral-800! hover:text-white! disabled:border-white/15 disabled:bg-neutral-900/60 disabled:text-white/35 [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-white!"
                  />
                </div>
              </div>
            </div>
            <CarouselContent className="-ml-3 md:-ml-4">
              {units.map((unit) => (
                <CarouselItem
                  key={unit.id}
                  className="flex basis-[88%] pl-3 sm:basis-[48%] sm:pl-4 md:basis-[38%] lg:basis-[30%] xl:basis-1/3 2xl:basis-1/4 2xl:pl-4"
                >
                  <LandingDealCard unit={unit} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}

        {!loading && !error && units.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">No units available right now.</p>
        ) : null}
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4 md:px-6 lg:px-10">
        <div className="rounded-xl border border-neutral-700 bg-neutral-950 px-5 py-6 md:px-8 md:py-8">
          <h2 className="text-lg font-extrabold tracking-wide uppercase md:text-xl">
            <span className="text-white">Why buy from </span>
            <span className="text-primary">Turbo?</span>
          </h2>
          <div className="mt-8 flex flex-col divide-y divide-neutral-700 md:mt-10 md:flex-row md:divide-x md:divide-y-0">
            {[
              {
                key: 'real',
                Icon: Headset,
                title: (
                  <>
                    <span className="text-primary">Real</span>
                    <span> people. Real answers.</span>
                  </>
                ),
                description: 'Talk to me directly. No bots. Ever.',
              },
              {
                key: 'price',
                Icon: BadgeDollarSign,
                title: (
                  <>
                    <span className="text-primary">Best</span>
                    <span> price guarantee</span>
                  </>
                ),
                description: 'We beat or match any price.',
              },
              {
                key: 'secure',
                Icon: ShieldCheck,
                title: (
                  <>
                    <span className="text-primary">Secure</span>
                    <span> & simple</span>
                  </>
                ),
                description: 'Safe, easy financing with fast approvals.',
              },
            ].map(({ key, Icon, title, description }) => (
              <div
                key={key}
                className="flex gap-4 py-7 first:pt-0 last:pb-0 md:flex-1 md:items-start md:gap-4 md:py-0 md:pr-4 md:pl-4 first:md:pl-0 last:md:pr-0"
              >
                <Icon className="text-primary size-10 shrink-0 md:size-11" strokeWidth={1.5} aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-bold tracking-wide text-white uppercase md:text-[0.8125rem]">{title}</p>
                  <p className="mt-1 text-sm font-normal text-neutral-300">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 md:mt-10 md:px-6 lg:px-10" aria-label="Reviews and partners">
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="grid divide-y divide-neutral-200 md:grid-cols-5 md:divide-x md:divide-y-0">
            <div className="flex flex-col items-center justify-center gap-2 bg-neutral-200 px-5 py-8 text-center md:py-10">
              <span className="text-3xl leading-none font-medium select-none" aria-label="Google">
                <span className="text-[#4285F4]">G</span>
                <span className="text-[#EA4335]">o</span>
                <span className="text-[#FBBC05]">o</span>
                <span className="text-[#4285F4]">g</span>
                <span className="text-[#34A853]">l</span>
                <span className="text-[#EA4335]">e</span>
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-5 shrink-0 fill-amber-400 text-amber-400" strokeWidth={0} aria-hidden />
                ))}
                <span className="ml-0.5 text-lg font-bold text-neutral-900 tabular-nums">4.9</span>
              </div>
              <p className="text-base font-bold text-black">1,200+ Reviews</p>
            </div>

            <div className="flex flex-col px-5 py-8 md:py-10">
              <p className="font-serif text-[0.95rem] leading-snug text-neutral-900 md:text-base">
                "Turbo made buying our dream RV so easy."
              </p>
              <p className="mt-3 text-sm font-bold text-black">— Sarah M.</p>
            </div>

            <div className="flex flex-col px-5 py-8 md:py-10">
              <p className="font-serif text-[0.95rem] leading-snug text-neutral-900 md:text-base">
                "He answered every question live and got us exactly what we needed."
              </p>
              <p className="mt-3 text-sm font-bold text-black">— James T.</p>
            </div>

            <div className="flex flex-col px-5 py-8 md:py-10">
              <p className="font-serif text-[0.95rem] leading-snug text-neutral-900 md:text-base">
                "Best prices, best service, highly recommend!"
              </p>
              <p className="mt-3 text-sm font-bold text-black">— Michael R.</p>
            </div>

            <div className="flex flex-col items-center justify-center gap-1.5 px-5 py-8 text-center md:py-10">
              <p className="text-[10px] font-semibold tracking-[0.22em] text-neutral-500 uppercase">
                In partnership with
              </p>
              <p className="text-2xl leading-tight font-extrabold tracking-tight text-neutral-900">
                LA MESA <span className="text-[#C41230]">RV</span>
              </p>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-neutral-800 uppercase">Experience life</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4 pb-8 md:px-6 lg:px-10">
        <div className="flex flex-col gap-8 rounded-xl bg-black px-6 py-8 md:flex-row md:items-center md:justify-between md:gap-10 md:px-10 md:py-10">
          <div className="min-w-0 text-left">
            <h2 className="text-xl font-extrabold tracking-tight text-white uppercase sm:text-2xl md:text-3xl md:leading-tight">
              Your next adventure is closer than you think.
            </h2>
            <p className="text-primary mt-2 text-xl font-extrabold tracking-tight uppercase sm:text-2xl md:text-3xl md:leading-tight">
              Let&apos;s make it happen.
            </p>
          </div>
          {isAvailable && (
            <div className="flex shrink-0 flex-col items-center gap-3 self-center md:self-auto">
              <Button
                type="button"
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-14 cursor-pointer items-center gap-2.5 rounded-lg px-8 text-base font-bold uppercase shadow-none md:px-10"
                onClick={open}
              >
                Connect live now
                <span
                  className="animate-live-dot-blink size-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)] motion-reduce:animate-none"
                  aria-hidden
                />
              </Button>
              <p className="max-w-[16rem] text-center text-sm font-normal text-white">
                No bots. No pressure. Just real help.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
