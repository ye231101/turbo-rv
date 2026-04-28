'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Loader2, Lock, Mail, MessageSquare, Phone, Shield, Tag, User, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { InventoryUnit } from '@/lib/types';

const PHONE_DISPLAY = '(786) 570-8584';
const PHONE_TEL = 'tel:1-786-570-8584';
const MESSAGE_MAX = 300;

const inquirySchema = z.object({
  name: z.string().min(1, 'Enter your name').max(120),
  email: z.string().email('Enter a valid email').max(254),
  phone: z.string().max(40).optional(),
  message: z.string().min(1, 'Enter a message').max(MESSAGE_MAX, `Max ${MESSAGE_MAX} characters`),
});

type InquiryForm = z.infer<typeof inquirySchema>;

type InventoryContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: Pick<InventoryUnit, 'title' | 'stockNumber' | 'location' | 'images' | 'thumbnails' | 'defaultImageUrl'>;
};

function unitThumbnailSrc(unit: Pick<InventoryUnit, 'images' | 'thumbnails' | 'defaultImageUrl'>): string {
  if (unit.thumbnails?.length) return unit.thumbnails[0]!;
  if (unit.images?.length) return unit.images[0]!;
  if (unit.defaultImageUrl) return unit.defaultImageUrl;
  return '/images/photos_coming_soon.jpg';
}

export function InventoryContactDialog({ open, onOpenChange, unit }: InventoryContactDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InquiryForm>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { name: '', email: '', phone: '', message: '' },
  });

  const messageValue = watch('message') ?? '';
  const messageLen = messageValue.length;

  const onOpenChangeInternal = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setTimeout(() => {
        setSucceeded(false);
        setSubmitError(null);
        reset();
      }, 0);
    }
  };

  const onSubmit = async (data: InquiryForm) => {
    setSubmitError(null);
    try {
      const payload: { name: string; email: string; phone?: string; message: string } = {
        name: data.name.trim(),
        email: data.email.trim(),
        message: data.message.trim(),
      };
      const phone = data.phone?.trim();
      if (phone) {
        payload.phone = phone;
      }
      await api.post('contact', payload);
      setSucceeded(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
  };

  const thumbSrc = unitThumbnailSrc(unit);

  return (
    <Dialog open={open} onOpenChange={onOpenChangeInternal}>
      <DialogContent
        showCloseButton
        className="max-h-[90vh] gap-0 overflow-y-auto rounded-xl border-neutral-200 p-0 shadow-xl sm:max-w-xl"
      >
        {succeeded ? (
          <div className="space-y-4 p-6 pt-8">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-foreground text-xl font-bold tracking-tight">Message sent</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                Thanks for reaching out. We&apos;ll email you our best available price and details for this unit.
              </DialogDescription>
            </DialogHeader>
            <p className="text-muted-foreground text-sm">
              Need help sooner? Call us at{' '}
              <a href={PHONE_TEL} className="text-primary font-semibold underline-offset-2 hover:underline">
                {PHONE_DISPLAY}
              </a>
              .
            </p>
            <Button type="button" onClick={() => onOpenChangeInternal(false)} className="w-full cursor-pointer">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            <div className="space-y-5 p-6 pb-4">
              <DialogHeader className="space-y-1 pr-8 text-left md:space-y-2">
                <DialogTitle className="text-foreground text-xl leading-tight font-bold tracking-tight md:text-2xl">
                  Get Your Best Price
                </DialogTitle>
                <p className="text-primary text-sm font-medium">It's fast, easy & no obligation.</p>
                <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                  Tell us a little about yourself and we'll send you{' '}
                  <span className="text-foreground font-semibold">our best available price and availability.</span>
                </DialogDescription>
              </DialogHeader>

              <div className="flex gap-3 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3">
                <div className="bg-muted relative h-[72px] w-[96px] shrink-0 overflow-hidden rounded-md border border-neutral-200">
                  <Image src={thumbSrc} alt={unit.title} fill className="object-cover" sizes="96px" unoptimized />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-foreground text-sm leading-snug font-semibold">{unit.title}</p>
                  <p className="text-muted-foreground text-xs">
                    Stock# {unit.stockNumber}
                    <br />
                    {unit.location}
                  </p>
                </div>
              </div>

              <div className="divide-border grid grid-cols-1 divide-y rounded-lg border border-neutral-200 bg-neutral-50/80 md:grid-cols-3 md:divide-x md:divide-y-0">
                <div className="flex items-center gap-1 p-2">
                  <Tag className="text-primary size-5 shrink-0" strokeWidth={1.75} aria-hidden />
                  <div className="min-w-0 text-left">
                    <p className="text-foreground text-[11px] leading-tight font-bold sm:text-xs">Best Prices</p>
                    <p className="text-muted-foreground mt-0.5 text-[10px] leading-snug sm:text-[11px]">Every Day</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 p-2">
                  <Zap className="text-primary size-5 shrink-0" strokeWidth={1.75} aria-hidden />
                  <div className="min-w-0 text-left">
                    <p className="text-foreground text-[11px] leading-tight font-bold sm:text-xs">Fast Response</p>
                    <p className="text-muted-foreground mt-0.5 text-[10px] leading-snug sm:text-[11px]">
                      Typically within minutes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 p-2">
                  <Shield className="text-primary size-5 shrink-0" strokeWidth={1.75} aria-hidden />
                  <div className="min-w-0 text-left">
                    <p className="text-foreground text-[11px] leading-tight font-bold sm:text-xs">No Obligation</p>
                    <p className="text-muted-foreground mt-0.5 text-[10px] leading-snug sm:text-[11px]">
                      You&apos;re in control
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="inquiry-name" className="text-foreground flex items-center gap-2 text-sm font-medium">
                    <User className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    Full Name
                  </Label>
                  <Input
                    id="inquiry-name"
                    autoComplete="name"
                    placeholder="e.g. John Smith"
                    aria-invalid={!!errors.name}
                    className={cn('border-neutral-200 bg-white', errors.name && 'border-destructive')}
                    {...register('name')}
                  />
                  {errors.name ? <p className="text-destructive text-sm">{errors.name.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="inquiry-email"
                    className="text-foreground flex items-center gap-2 text-sm font-medium"
                  >
                    <Mail className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    Email
                  </Label>
                  <Input
                    id="inquiry-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                    aria-invalid={!!errors.email}
                    className={cn('border-neutral-200 bg-white', errors.email && 'border-destructive')}
                    {...register('email')}
                  />
                  <p className="text-muted-foreground text-xs">We&apos;ll email you our best price and details.</p>
                  {errors.email ? <p className="text-destructive text-sm">{errors.email.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="inquiry-phone"
                    className="text-foreground flex items-center gap-2 text-sm font-medium"
                  >
                    <Phone className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    Phone (optional)
                  </Label>
                  <Input
                    id="inquiry-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="(555) 123-4567"
                    aria-invalid={!!errors.phone}
                    className={cn('border-neutral-200 bg-white', errors.phone && 'border-destructive')}
                    {...register('phone')}
                  />
                  <p className="text-muted-foreground text-xs">Optional, but helps us respond faster.</p>
                  {errors.phone ? <p className="text-destructive text-sm">{errors.phone.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="inquiry-message"
                    className="text-foreground flex items-center gap-2 text-sm font-medium"
                  >
                    <MessageSquare className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    What can we help you with?
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="inquiry-message"
                      rows={4}
                      maxLength={MESSAGE_MAX}
                      placeholder="Trade-in, financing, questions, preferred contact time, etc."
                      aria-invalid={!!errors.message}
                      className={cn(
                        'max-h-[10lh] min-h-[4.5lh] resize-y overflow-y-auto border-neutral-200 bg-white pb-7',
                        errors.message && 'border-destructive',
                      )}
                      {...register('message')}
                    />
                    <span className="text-muted-foreground pointer-events-none absolute right-3 bottom-2 text-xs tabular-nums">
                      {messageLen}/{MESSAGE_MAX}
                    </span>
                  </div>
                  {errors.message ? <p className="text-destructive text-sm">{errors.message.message}</p> : null}
                </div>
              </div>
            </div>

            <div className="border-border bg-muted/30 space-y-4 border-t px-6 py-5">
              {submitError ? <p className="text-destructive text-center text-sm">{submitError}</p> : null}
              <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
                <Lock className="size-3.5 shrink-0" aria-hidden />
                Your information is safe and secure.
              </p>
              <div className="flex flex-col gap-2.5">
                <Button type="submit" disabled={isSubmitting} size="lg" className="w-full cursor-pointer font-semibold">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    'Get My Best Price'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => onOpenChangeInternal(false)}
                  className="text-foreground w-full cursor-pointer border-neutral-300 bg-white font-medium shadow-none"
                >
                  No thanks, I&apos;ll pass
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
