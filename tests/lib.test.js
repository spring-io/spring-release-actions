import { getWeekOfMonthAndDayOfWeek, getReleaseDate, mod } from '../src/lib.js';

describe('getWeekOfMonthAndDayOfWeek', () => {
    it('should return the correct week of month and day of week', () => {
        // November 24, 2025 is a Monday
        const date = new Date(2025, 10, 24);
        const { dayOfWeek, weekOfMonth } = getWeekOfMonthAndDayOfWeek(date);
        expect(dayOfWeek).toBe(1);
        expect(weekOfMonth).toBe(3);
    });

    it('should handle the first week of the month', () => {
        // November 3, 2025 is a Monday
        const date = new Date(2025, 10, 3);
        const { dayOfWeek, weekOfMonth } = getWeekOfMonthAndDayOfWeek(date);
        expect(dayOfWeek).toBe(1);
        expect(weekOfMonth).toBe(0);
    });

    it('should handle a day later in the week', () => {
        // December 9, 2025 is a Tuesday
        const date = new Date(2025, 11, 9);
        const { dayOfWeek, weekOfMonth } = getWeekOfMonthAndDayOfWeek(date);
        expect(dayOfWeek).toBe(2);
        expect(weekOfMonth).toBe(1);
    });
});

describe('getReleaseDate', () => {
    it('fourth Monday of November 2025 is 24 November', () => {
        const date = getReleaseDate(10, 2025, 1, 3);
        expect(date.getFullYear()).toBe(2025);
        expect(date.getMonth()).toBe(10);
        expect(date.getDate()).toBe(24);
    });

    it('first Wednesday of November 2025 is 5 November', () => {
        const date = getReleaseDate(10, 2025, 3, 0);
        expect(date.getFullYear()).toBe(2025);
        expect(date.getMonth()).toBe(10);
        expect(date.getDate()).toBe(5);
    });

    it('second Thursday of November 2025 is 13 November', () => {
        // fourth Monday in November 2025
        const date = getReleaseDate(10, 2025, 4, 1);
        expect(date.getFullYear()).toBe(2025);
        expect(date.getMonth()).toBe(10);
        expect(date.getDate()).toBe(13);
    });
});

describe('mod', () => {
    it('should return the correct modulus', () => {
        expect(mod(10, 5)).toBe(0);
        expect(mod(10, 3)).toBe(1);
        expect(mod(-1, 3)).toBe(2);
    });
});
