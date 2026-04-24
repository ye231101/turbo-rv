'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { InventoryUnit } from '@/types';

const PHONE_DISPLAY = '(786) 570-8584';
const PHONE_TEL = 'tel:1-786-570-8584';

const inquirySchema = z.object({
  name: z.string().min(1, 'Enter your name').max(120),
  email: z.string().email('Enter a valid email').max(254),
  phone: z.string().max(40).optional(),
  message: z.string().min(1, 'Enter a message').max(5000),
});

type InquiryForm = z.infer<typeof inquirySchema>;

type InventoryContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: Pick<InventoryUnit, 'id' | 'title' | 'stockNumber' | 'location'>;
};

export function InventoryContactDialog({ open, onOpenChange, unit }: InventoryContactDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryForm>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { name: '', email: '', phone: '', message: '' },
  });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChangeInternal}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {succeeded ? (
          <div className="space-y-3 pt-1">
            <DialogHeader>
              <DialogTitle>Message sent</DialogTitle>
              <DialogDescription>
                Thanks for reaching out. A specialist will get back to you about this unit.
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Leave a message</DialogTitle>
              <DialogDescription>
                Specialists are not available right now. Tell us how to reach you and we will follow up about this unit.
              </DialogDescription>
            </DialogHeader>

            <p className="text-muted-foreground rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs leading-relaxed">
              <span className="font-medium text-neutral-900">{unit.title}</span>
              <br />
              Stock# {unit.stockNumber} · {unit.location}
            </p>

            <div className="space-y-2">
              <Label htmlFor="inquiry-name">Name</Label>
              <Input
                id="inquiry-name"
                autoComplete="name"
                aria-invalid={!!errors.name}
                className={cn(errors.name && 'border-destructive')}
                {...register('name')}
              />
              {errors.name ? <p className="text-destructive text-sm">{errors.name.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquiry-email">Email</Label>
              <Input
                id="inquiry-email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                className={cn(errors.email && 'border-destructive')}
                {...register('email')}
              />
              {errors.email ? <p className="text-destructive text-sm">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquiry-phone">Phone (optional)</Label>
              <Input
                id="inquiry-phone"
                type="tel"
                autoComplete="tel"
                aria-invalid={!!errors.phone}
                className={cn(errors.phone && 'border-destructive')}
                {...register('phone')}
              />
              {errors.phone ? <p className="text-destructive text-sm">{errors.phone.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquiry-message">Message</Label>
              <Textarea
                id="inquiry-message"
                rows={4}
                placeholder="What would you like to know? Preferred contact time?"
                aria-invalid={!!errors.message}
                className={cn(
                  'max-h-[8lh] min-h-[4lh] resize-y overflow-y-auto',
                  errors.message && 'border-destructive',
                )}
                {...register('message')}
              />
              {errors.message ? <p className="text-destructive text-sm">{errors.message.message}</p> : null}
            </div>

            {submitError ? <p className="text-destructive text-sm">{submitError}</p> : null}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChangeInternal(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send message'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
