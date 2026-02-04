import { Version } from '../src/versions.js';

const generation = {
    dayOfWeek: 1,
    weekOfMonth: 3,
    oss: {
        frequency: 1,
        offset: 0,
        end: {
            year: 2026,
            month: 11
        }
    },
    enterprise: {
        frequency: 3,
        offset: 1,
        end: {
            year: 2027,
            month: 2
        }
    }
};

describe('version', () => {
    it('should parse a GA version', () => {
        const v = new Version('1.2.3');
        expect(v.major).toBe(1);
        expect(v.minor).toBe(2);
        expect(v.patch).toBe(3);
        expect(v.classifier).toBe('');
        expect(v.ga).toBe(true);
        expect(v.prerelease).toBe(false);
        expect(v.snapshot).toBe(false);
    });

    it('should parse a milestone version', () => {
        const v = new Version('1.2.3-M1');
        expect(v.major).toBe(1);
        expect(v.minor).toBe(2);
        expect(v.patch).toBe(3);
        expect(v.classifier).toBe('M1');
        expect(v.ga).toBe(false);
        expect(v.prerelease).toBe(true);
        expect(v.snapshot).toBe(false);
    });

    it('should parse a snapshot version', () => {
        const v = new Version('1.2.3-SNAPSHOT');
        expect(v.major).toBe(1);
        expect(v.minor).toBe(2);
        expect(v.patch).toBe(3);
        expect(v.classifier).toBe('SNAPSHOT');
        expect(v.ga).toBe(false);
        expect(v.prerelease).toBe(false);
        expect(v.snapshot).toBe(true);
    });

    it('should parse a .x version', () => {
        const v = new Version('1.2.x');
        expect(v.major).toBe(1);
        expect(v.minor).toBe(2);
        expect(v.patch).toBe(NaN);
        expect(v.classifier).toBe('');
        expect(v.ga).toBe(false);
        expect(v.prerelease).toBe(false);
        expect(v.snapshot).toBe(true);
    });

    it('should calculate the next GA release', () => {
        let v = new Version('1.2.3', new Date(2025, 10, 24));
        let next = v.nextMilestone(generation);
        expect(next.version).toBe('1.2.4');
        expect(next.type).toBe('oss');
        expect(next.dueDate.getFullYear()).toBe(2025);
        expect(next.dueDate.getMonth()).toBe(11);
        expect(next.dueDate.getDate()).toBe(22);
        next = next.nextMilestone(generation);
        expect(next.version).toBe('1.2.5');
        expect(next.type).toBe('oss');
        expect(next.dueDate.getFullYear()).toBe(2026);
        expect(next.dueDate.getMonth()).toBe(0);
        expect(next.dueDate.getDate()).toBe(26);
        next = next.nextMilestone(generation);
        expect(next.version).toBe('1.2.6');
        expect(next.type).toBe('oss');
        expect(next.dueDate.getFullYear()).toBe(2026);
        expect(next.dueDate.getMonth()).toBe(1);
        expect(next.dueDate.getDate()).toBe(23);
    });

    it('should calculate the next milestone release', () => {
        const generation = {
            dayOfWeek: 1,
            weekOfMonth: 3
        };
        const v = new Version('1.2.3-M1', new Date(2025, 10, 24));
        const next = v.nextMilestone(generation);
        expect(next.version).toBe('1.2.3-M2');
        expect(next.type).toBe('oss');
        expect(next.dueDate.getFullYear()).toBe(2026)
        expect(next.dueDate.getMonth()).toBe(1) // M2 releases in February and August
        expect(next.dueDate.getDate()).toBe(23)
    });

    it('should calculate the next GA commercial release', () => {
        const v = new Version('1.2.3', new Date(2026, 11, 28));
        const next = v.nextMilestone(generation);
        expect(next.version).toBe('1.2.4');
        expect(next.type).toBe('enterprise');
        expect(next.dueDate.getFullYear()).toBe(2027);
        expect(next.dueDate.getMonth()).toBe(1); // commercial releases are Feb, May, Aug, Nov
        expect(next.dueDate.getDate()).toBe(22);
    });

    it('should calculate the next snapshot for a GA release', () => {
        const v = new Version('1.2.3');
        const next = v.nextSnapshot();
        expect(next.version).toBe('1.2.4-SNAPSHOT');
    });

    it('should calculate the next snapshot for a pre-release', () => {
        const v = new Version('1.2.3-M1');
        const next = v.nextSnapshot();
        expect(next.version).toBe('1.2.3-SNAPSHOT');
    });
});
