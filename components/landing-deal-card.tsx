'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useEmblaCarousel from 'embla-carousel-react';
import { Camera, LayoutTemplate, Ruler, Users, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useViewProWidget } from '@/components/view-pro-widget-provider';
import { formatPrice, labelFromCustomTags } from '@/lib/utils';
import type { InventoryUnit } from '@/types';

export function LandingDealCard({ unit }: { unit: InventoryUnit }) {
  const router = useRouter();

  const { open } = useViewProWidget();

  const [slideIndex, setSlideIndex] = useState(0);

  const slides = useMemo(() => {
    const base =
      unit.images && unit.images.length > 0
        ? unit.images
        : unit.defaultImageUrl
          ? [unit.defaultImageUrl]
          : ['/images/photos_coming_soon.jpg'];
    return base;
  }, [unit.images, unit.defaultImageUrl]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSlideIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const msrp = unit.wI_ListPrice;
  const salePrice = unit.websitePrice ?? 0;
  const hasWebsitePrice = salePrice > 0;
  const savings = Math.max(0, msrp - salePrice);
  const hasRebateBreakdown = Boolean(unit.rebate?.amount && unit.rebate.amount > 0) && !unit.isTooLowToShow;
  const netAfterRebate = hasRebateBreakdown ? Math.max(0, salePrice - (unit.rebate?.amount ?? 0)) : salePrice;

  const sleepsRaw = unit.customTags
    .find((t) => /^sleeps?:/i.test(t))
    ?.split(':')[1]
    ?.trim();
  const sleepsLabel = sleepsRaw ? `Sleeps ${sleepsRaw}` : null;
  const rvType = labelFromCustomTags(unit.customTags, 'rvType');
  const categoryLine = [unit.wI_Body, rvType].filter(Boolean).join(' · ');

  let primaryBadge: { key: string; label: string; amount?: string; className: string } | null = null;
  if (savings >= 1000 && hasWebsitePrice && !unit.isTooLowToShow) {
    primaryBadge = {
      key: 'save',
      label: 'off',
      amount: formatPrice(savings),
      className: 'bg-neutral-950/95 text-primary',
    };
  } else if (unit.inFlashSale) {
    primaryBadge = {
      key: 'hot',
      label: 'Hot deal',
      className: 'bg-neutral-950/95 text-primary',
    };
  } else if (unit.isSpecialOffer) {
    primaryBadge = {
      key: 'low',
      label: 'Lowest price',
      className: 'bg-neutral-950/95 text-primary',
    };
  } else if (hasWebsitePrice && savings > 0 && !unit.isTooLowToShow) {
    primaryBadge = {
      key: 'deal',
      label: 'Deal',
      className: 'bg-neutral-950/95 text-primary',
    };
  }

  return (
    <article
      onClick={() => router.push(`/inventory/${unit.id}`)}
      className="flex flex-1 cursor-pointer flex-col overflow-hidden rounded-lg border border-neutral-200/90 bg-white shadow-sm select-none"
      aria-label={`View details: ${unit.title}`}
    >
      <div className="relative aspect-4/3 overflow-hidden rounded-t-lg">
        <div className="h-full overflow-hidden" ref={emblaRef} data-nested-embla-viewport="">
          <div className="flex h-full touch-pan-y">
            {slides.map((src: string, i: number) => (
              <div key={`${unit.id}-landing-${i}`} className="relative min-w-0 shrink-0 grow-0 basis-full">
                <img src={src} alt="" className="h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-black/10" />

        {primaryBadge ? (
          <div className="absolute top-3 left-3 z-10 max-w-[calc(100%-1.5rem)]">
            <span
              className={`inline-block rounded-sm px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase shadow-[0_1px_0_rgba(0,0,0,0.3)] ${primaryBadge.className}`}
            >
              {primaryBadge.amount ? (
                <>
                  <span className="text-white">{primaryBadge.amount}</span> {primaryBadge.label}
                </>
              ) : (
                primaryBadge.label
              )}
            </span>
          </div>
        ) : null}

        {slides.length > 1 && (
          <div className="absolute right-3 bottom-3 z-10 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white tabular-nums backdrop-blur-[2px]">
            <Camera className="size-3.5 shrink-0 opacity-95" strokeWidth={2} aria-hidden />
            <span>
              {slideIndex + 1} / {slides.length}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base leading-snug font-extrabold tracking-tight text-neutral-900 uppercase md:text-lg">
            {unit.title}
          </h3>
          {categoryLine ? (
            <p className="mt-1 text-xs font-medium tracking-wide text-neutral-600 capitalize">{categoryLine}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-medium text-neutral-500">
            {sleepsLabel ? (
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                {sleepsLabel}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <LayoutTemplate className="size-3.5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
              {unit.slideOutsCount} {unit.slideOutsCount === 1 ? 'Slide' : 'Slides'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Ruler className="size-3.5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
              {unit.wI_Length} ft
            </span>
          </div>
        </div>

        <div className="flex-1"></div>

        {unit.isTooLowToShow ? (
          hasWebsitePrice || msrp > 0 ? (
            <div className="space-y-1">
              {hasWebsitePrice ? (
                <p className="text-2xl font-black tracking-tight text-neutral-900 tabular-nums line-through decoration-neutral-400">
                  {formatPrice(salePrice)}
                </p>
              ) : null}
              {msrp > 0 ? <p className="text-sm text-neutral-500 line-through">{formatPrice(msrp)}</p> : null}
            </div>
          ) : (
            <p className="text-sm font-semibold text-neutral-600">Call for price</p>
          )
        ) : !hasWebsitePrice ? (
          <p className="text-sm font-semibold text-neutral-600">Call for price</p>
        ) : hasRebateBreakdown ? (
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tight text-neutral-900 tabular-nums">
              {formatPrice(netAfterRebate)}
            </p>
            {msrp > netAfterRebate ? (
              <p className="text-sm text-neutral-500 line-through">{formatPrice(msrp)}</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tight text-neutral-900 tabular-nums">{formatPrice(salePrice)}</p>
            {msrp > salePrice + 0.5 ? (
              <p className="text-sm text-neutral-500 line-through">{formatPrice(msrp)}</p>
            ) : null}
          </div>
        )}

        <div className="mt-auto pt-1">
          <Button
            type="button"
            size="lg"
            className="text-primary-foreground bg-primary hover:bg-primary/80 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border-0 px-4 py-3 text-sm font-bold uppercase shadow-none"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
          >
            <Video className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            See live
          </Button>
        </div>
      </div>
    </article>
  );
}
