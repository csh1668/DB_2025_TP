import * as moment from 'moment-timezone';

export class Utils {
    public static formatDateToKST(date: Date | string): Date {
        if (!date) return null;
        return moment(date).add(9, 'hours').toDate();
    }

    // 날짜를 DB에 저장하기 위한 형식으로 변환
    public static formatDateForDB(date: Date | string): string {
        if (!date) return null;
        return moment(date).format('YYYY-MM-DD HH:mm:ss');
    }

    public static isoToFormat(date: string): string {
        return date.replace('T', ' ').replace('Z', '').split('.')[0];
    }

    public static formatDate(date: Date | string): string {
        if (!date) return null;
        return moment(date).format('YYYY-MM-DD HH:mm:ss');
    }
}