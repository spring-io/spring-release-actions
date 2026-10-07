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

    it('should parse a v-prefixed GA version', () => {
        const v = new Version('v1.2.3');
        expect(v.major).toBe(1);
        expect(v.minor).toBe(2);
        expect(v.patch).toBe(3);
        expect(v.classifier).toBe('');
        expect(v.ga).toBe(true);
    });

    it('should parse a v-prefixed snapshot version', () => {
        const v = new Version('v1.2.3-SNAPSHOT');
        expect(v.major).toBe(1);
        expect(v.minor).toBe(2);
        expect(v.patch).toBe(3);
        expect(v.classifier).toBe('SNAPSHOT');
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

    it('should parse a four-digit GA version', () => {
        const v = new Version('1.2.3.4');
        expect(v.major).toBe(1);
        expect(v.minor).toBe(2);
        expect(v.patch).toBe(3);
        expect(v.build).toBe(4);
        expect(v.classifier).toBe('');
        expect(v.ga).toBe(true);
        expect(v.prerelease).toBe(false);
        expect(v.snapshot).toBe(false);
    });

    it('should parse a four-digit snapshot version', () => {
        const v = new Version('1.2.3.4-SNAPSHOT');
        expect(v.major).toBe(1);
        expect(v.minor).toBe(2);
        expect(v.patch).toBe(3);
        expect(v.build).toBe(4);
        expect(v.classifier).toBe('SNAPSHOT');
        expect(v.ga).toBe(false);
        expect(v.prerelease).toBe(false);
        expect(v.snapshot).toBe(true);
    });

    it('should parse a v-prefixed four-digit GA version', () => {
        const v = new Version('v1.2.3.4');
        expect(v.major).toBe(1);
        expect(v.minor).toBe(2);
        expect(v.patch).toBe(3);
        expect(v.build).toBe(4);
        expect(v.classifier).toBe('');
        expect(v.ga).toBe(true);
        expect(v.snapshot).toBe(false);
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

    describe('next release for a GA in November', () => {
        const generation = {
            dayOfWeek: 1,
            weekOfMonth: 3
        };

        it.each([
            ['M1 on schedule', '1.2.3-M1', [2026, 6, 20], '1.2.3-M2', [2026, 7, 24]],
            ['M2 on schedule', '1.2.3-M2', [2026, 7, 24], '1.2.3-M3', [2026, 8, 28]],
            ['M3 on schedule', '1.2.3-M3', [2026, 8, 28], '1.2.3-RC1', [2026, 9, 26]],
            ['RC1 on schedule', '1.2.3-RC1', [2026, 9, 26], '1.2.3', [2026, 10, 23]],
            ['M1 slipped into the M2 month', '1.2.3-M1', [2026, 7, 24], '1.2.3-M2', [2026, 8, 28]],
            ['M1 slipped into the M3 month', '1.2.3-M1', [2026, 8, 28], '1.2.3-RC1', [2026, 9, 26]],
            ['M2 slipped into the M3 slot', '1.2.3-M2', [2026, 8, 28], '1.2.3-RC1', [2026, 9, 26]],
            ['M2 slipped into the RC1 month', '1.2.3-M2', [2026, 9, 12], '1.2.3-RC1', [2026, 9, 26]],
            ['M3 slipped into the RC1 month', '1.2.3-M3', [2026, 9, 12], '1.2.3-RC1', [2026, 9, 26]],
            ['M2 slipped past the RC1 slot', '1.2.3-M2', [2026, 9, 19], '1.2.3-RC1', [2026, 10, 2]],
            ['M2 slipped into the GA month', '1.2.3-M2', [2026, 10, 2], '1.2.3-RC1', [2026, 10, 16]],
            ['RC1 slipped past the GA slot', '1.2.3-RC1', [2026, 10, 16], '1.2.3', [2026, 10, 30]],
            ['M1 across a year boundary', '1.2.3-M1', [2025, 10, 24], '1.2.3-M2', [2026, 1, 23]]
        ])('should schedule after %s', (name, version, due, expectedVersion, expectedDue) => {
            const v = new Version(version, new Date(due[0], due[1], due[2]));
            const next = v.nextMilestone(generation);
            expect(next.version).toBe(expectedVersion);
            expect(next.dueDate).toEqual(new Date(expectedDue[0], expectedDue[1], expectedDue[2]));
            expect(next.dueDate > v.dueDate).toBe(true);
        });
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

    it('should calculate the next GA release for a four-digit version', () => {
        const v = new Version('6.5.0.1', new Date(2025, 10, 24));
        const next = v.nextMilestone(generation);
        expect(next.version).toBe('6.5.0.2');
    });

    it('should calculate the next snapshot for a four-digit GA release', () => {
        const v = new Version('6.5.0.1');
        const next = v.nextSnapshot();
        expect(next.version).toBe('6.5.0.2-SNAPSHOT');
    });

    it('should fail to advance a four-digit pre-release version', () => {
        const v = new Version('6.5.0.1-M1', new Date(2025, 10, 24));
        expect(() => v.nextMilestone(generation)).toThrow(/four-digit/);
    });
});
