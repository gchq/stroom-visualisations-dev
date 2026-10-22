/*
 * Copyright 2026 Crown Copyright
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Times as the user has asked Stroom to show them: in their time zone and date-time pattern (their
// preferences), which Stroom gives the visualisation (vis.js's stroom.time). A time is kept as the
// instant it is (milliseconds since the epoch, as Stroom gives it); for the user's days and hours,
// and for axes, it is turned into its "wall clock" time, the time a clock in their zone shows, held
// as if it were UTC, so that d3's UTC days, hours and formats give the user's.

import { scaleUtc, utcDay, utcFormat, utcHour, utcMinute, utcMonth, utcSecond, utcWeek, utcYear } from "d3";

const MINUTE = 60000;

const iso = ms => new Date(ms).toISOString();

// A time zone, given by its offset from UTC at each instant (in minutes, e.g. 60 for British Summer
// Time), with how its times are written in full and to the minute, and whether its clock is 12-hour
export class Zone {

    constructor({ offsetMinutes = () => 0, format = iso, formatCompact = ms => iso(ms).substring(0, 16),
                  is12Hour = false } = {}) {
        this.offsetMinutes = offsetMinutes;
        this.format = format;
        this.formatCompact = formatCompact;
        this.is12Hour = is12Hour;
    }

    // An instant's wall clock time in the zone
    toWall(ms) {
        return ms + this.offsetMinutes(ms) * MINUTE;
    }

    // The instant a wall clock time in the zone is (the first, where a clock goes back an hour)
    fromWall(wall) {
        const guess = wall - this.offsetMinutes(wall) * MINUTE;
        return wall - this.offsetMinutes(guess) * MINUTE;
    }

    // The instant the day an instant is in starts, in the zone
    dayStart(ms) {
        return this.fromWall(utcDay.floor(new Date(this.toWall(ms))).getTime());
    }

    // The instant the next day starts, after the day that starts at `dayStart`
    nextDay(dayStart) {
        return this.fromWall(utcDay.offset(new Date(this.toWall(dayStart)), 1).getTime());
    }

    // The instant the hour an instant is in starts, in the zone
    hourStart(ms) {
        return this.fromWall(utcHour.floor(new Date(this.toWall(ms))).getTime());
    }

    // An instant's hour of the day (0 to 23) and day of the week (0 for Monday to 6 for Sunday)
    hourOf(ms) {
        return new Date(this.toWall(ms)).getUTCHours();
    }

    weekdayOf(ms) {
        return (new Date(this.toWall(ms)).getUTCDay() + 6) % 7;
    }

    // An instant's milliseconds since the start of its day, in the zone
    timeOfDay(ms) {
        const wall = this.toWall(ms);
        return wall - utcDay.floor(new Date(wall)).getTime();
    }

    // A d3 time format (e.g. '%a %-d %b') of instants, in the zone
    label(specifier) {
        const format = utcFormat(specifier);
        return ms => format(new Date(this.toWall(+ms)));
    }

    // An hour of the day (0 to 24) as a clock with the user's 24- or 12-hour pattern shows it, e.g.
    // '06:00', or '6 AM' (24 is the midnight that ends the day, '24:00' or '12 AM')
    hourLabel(hour) {
        if (!this.is12Hour) {
            return String(hour).padStart(2, "0") + ":00";
        }
        return ((hour % 12) || 12) + (hour % 24 < 12 ? " AM" : " PM");
    }

    // The format of an axis's ticks, each as precise as it needs to be (as d3's own is), with a 24-
    // or 12-hour clock as the user's pattern has
    tickFormat() {
        const formats = {
            millisecond: utcFormat(".%L"),
            second: utcFormat(":%S"),
            minute: utcFormat(this.is12Hour ? "%-I:%M %p" : "%H:%M"),
            hour: utcFormat(this.is12Hour ? "%-I %p" : "%H:00"),
            day: utcFormat("%a %-d"),
            week: utcFormat("%-d %b"),
            month: utcFormat("%B"),
            year: utcFormat("%Y")
        };
        return ms => {
            const date = new Date(this.toWall(+ms));
            if (utcSecond(date) < date) {
                return formats.millisecond(date);
            }
            if (utcMinute(date) < date) {
                return formats.second(date);
            }
            if (utcHour(date) < date) {
                return formats.minute(date);
            }
            if (utcDay(date) < date) {
                return formats.hour(date);
            }
            if (utcMonth(date) < date) {
                return utcWeek(date) < date ? formats.day(date) : formats.week(date);
            }
            return utcYear(date) < date ? formats.month(date) : formats.year(date);
        };
    }
}

// UTC, written as ISO 8601: how times are shown without Stroom's settings
export const UTC = new Zone();

let hostZone = null;
let hostSettings;

// The user's time zone, as Stroom gives it (vis.js's stroom.time), or UTC if it doesn't
export function currentZone() {
    const time = typeof stroom !== "undefined" && stroom.time ? stroom.time : null;
    if (time === null) {
        return UTC;
    }
    const settings = time.settings();
    if (hostZone === null || settings !== hostSettings) {
        hostSettings = settings;
        hostZone = new Zone({
            offsetMinutes: ms => time.offsetMinutes(ms),
            format: ms => time.format(ms),
            formatCompact: ms => time.formatCompact(ms),
            is12Hour: time.is12Hour()
        });
    }
    return hostZone;
}

// An instant in full, as the user has asked Stroom to show times
export function formatTime(ms) {
    return currentZone().format(ms);
}

// A d3 UTC time scale of instants that places them, ticks and labels them by their wall clock time
// in a zone, so that an axis of times is in the user's hours and days
export function zonedTimeScale(zone = currentZone()) {
    const wall = scaleUtc();
    const scale = x => wall(zone.toWall(+x));
    const toDate = w => new Date(zone.fromWall(+w));
    scale.domain = domain => {
        if (domain === undefined) {
            return wall.domain().map(toDate);
        }
        wall.domain(domain.map(x => zone.toWall(+x)));
        return scale;
    };
    scale.range = range => {
        if (range === undefined) {
            return wall.range();
        }
        wall.range(range);
        return scale;
    };
    scale.nice = count => {
        wall.nice(count);
        return scale;
    };
    scale.clamp = clamp => {
        if (clamp === undefined) {
            return wall.clamp();
        }
        wall.clamp(clamp);
        return scale;
    };
    scale.invert = y => toDate(wall.invert(y));
    scale.ticks = count => wall.ticks(count).map(toDate);
    scale.tickFormat = () => zone.tickFormat();
    scale.copy = () => zonedTimeScale(zone).domain(scale.domain()).range(scale.range()).clamp(scale.clamp());
    scale.zone = zone;
    return scale;
}
