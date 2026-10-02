import { z } from "zod";

const namePattern = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;
const addressPattern = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .,'#/-]*$/u;
const postalPattern = /^[\p{L}\p{N}][\p{L}\p{N} -]*$/u;

export const shippingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(80, "Name must be 80 characters or fewer.")
    .regex(namePattern, "Enter a valid name."),
  address: z
    .string()
    .trim()
    .min(5, "Enter a complete street address.")
    .max(120, "Address must be 120 characters or fewer.")
    .regex(addressPattern, "Enter a valid street address."),
  city: z
    .string()
    .trim()
    .min(2, "Enter a city.")
    .max(80, "City must be 80 characters or fewer.")
    .regex(namePattern, "Enter a valid city."),
  postalCode: z
    .string()
    .trim()
    .min(2, "Enter a postal code.")
    .max(12, "Postal code must be 12 characters or fewer.")
    .regex(postalPattern, "Enter a valid postal code."),
  country: z
    .string()
    .trim()
    .min(2, "Select a country.")
    .max(56, "Country must be 56 characters or fewer."),
});

export const paymentSchema = z.object({
  cardholderName: z
    .string()
    .trim()
    .min(2, "Enter the name on the card.")
    .max(80, "Name must be 80 characters or fewer.")
    .regex(namePattern, "Enter a valid cardholder name."),
  cardNumber: z
    .string()
    .regex(/^\d{13,19}$/, "Enter a valid card number.")
    .refine((value) => passesLuhn(value), "Enter a valid card number."),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY format.")
    .refine(isFutureExpiry, "Card must not be expired."),
  cvv: z.string().regex(/^\d{3,4}$/, "Enter a 3 or 4 digit security code."),
});

export type ShippingFields = z.input<typeof shippingSchema>;
export type ShippingInfo = z.output<typeof shippingSchema>;
export type PaymentFields = z.input<typeof paymentSchema>;
export type SafePaymentInfo = {
  cardholderName: string;
  lastFour: string;
};

export function passesLuhn(value: string) {
  let sum = 0;
  let doubleDigit = false;
  for (let index = value.length - 1; index >= 0; index -= 1) {
    let digit = Number(value[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

function isFutureExpiry(value: string) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const now = new Date();
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}
