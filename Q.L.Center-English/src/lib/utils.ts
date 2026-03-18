import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('vi-VN');
}

export function formatDateTime(date: string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('vi-VN');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export function getDayName(day: number): string {
  return DAY_NAMES[day] || '';
}
