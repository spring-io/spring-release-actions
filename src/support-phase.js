/**
 * Classify where {@code today} falls relative to a generation's OSS and
 * commercial support end dates.
 *
 * Both end dates are treated as inclusive: a date on or before `ossEnd`
 * is still `oss`, and a date on or before `commercialEnd` (but after
 * `ossEnd`) is `commercial`. Anything after `commercialEnd` is `eol`.
 *
 * @param today {{year: number, month: number, day: number}}
 * @param ossEnd {{year: number, month: number, day: number}}
 * @param commercialEnd {{year: number, month: number, day: number}}
 * @returns {"oss"|"commercial"|"eol"}
 */
function classifySupportPhase(today, ossEnd, commercialEnd) {
  if (_onOrBefore(today, ossEnd)) {
    return "oss";
  }
  if (_onOrBefore(today, commercialEnd)) {
    return "commercial";
  }
  return "eol";
}

function _onOrBefore(today, end) {
  if (today.year !== end.year) {
    return today.year < end.year;
  }
  if (today.month !== end.month) {
    return today.month < end.month;
  }
  return today.day <= end.day;
}

export { classifySupportPhase };
