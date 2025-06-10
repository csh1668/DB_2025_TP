import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import moment from 'moment-timezone'
// 한국어 로케일 설정
moment.locale('ko')

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 날짜를 한국 시간으로 포맷팅
export function formatDateKST(date: Date | string, formatString: string = 'YYYY-MM-DD'): string {
  return moment(date).tz('Asia/Seoul').format(formatString)
}

// 날짜 표시용 포맷팅 (2025년 6월 9일 (월))
export function formatDateDisplay(date: Date | string): string {
  return moment(date).tz('Asia/Seoul').format('YYYY년 M월 D일 (ddd)')
}

// 시간 표시용 포맷팅 (오후 3:30)
export function formatTimeDisplay(date: Date | string): string {
  return moment(date).tz('Asia/Seoul').format('A h:mm')
}

// ISO 문자열에서 날짜 파싱
export function parseISODate(dateString: string): Date {
  return moment(dateString).toDate()
}
