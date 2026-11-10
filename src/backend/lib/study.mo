import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Common "../types/common";
import Types "../types/study";

module {
  let NS_PER_SECOND : Int = 1_000_000_000;
  let NS_PER_DAY : Int = 86_400_000_000_000;

  func pad2(n : Int) : Text {
    if (n < 10) { "0" # n.toText() } else { n.toText() };
  };

  func pad4(n : Int) : Text {
    if (n < 10) { "000" # n.toText() }
    else if (n < 100) { "00" # n.toText() }
    else if (n < 1000) { "0" # n.toText() }
    else { n.toText() };
  };

  func parseInt(t : Text) : Int {
    var acc : Int = 0;
    for (c in t.toIter()) {
      let code = c.toNat32().toNat();
      if (code >= 48 and code <= 57) {
        acc := acc * 10 + (code - 48).toInt();
      };
    };
    acc;
  };

  /// Days since the Unix epoch for a civil date (Howard Hinnant's algorithm).
  func daysFromCivil(y : Int, m : Int, d : Int) : Int {
    let yy = if (m <= 2) { y - 1 } else { y };
    let era = (if (yy >= 0) { yy } else { yy - 399 }) / 400;
    let yoe = yy - era * 400;
    let mp = (m + 9) % 12;
    let doy = (153 * mp + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146097 + doe - 719468;
  };

  /// Civil date (year, month, day) from days since the Unix epoch.
  func civilFromDays(z : Int) : (Int, Int, Int) {
    let zz = z + 719468;
    let era = (if (zz >= 0) { zz } else { zz - 146096 }) / 146097;
    let doe = zz - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if (mp < 10) { mp + 3 } else { mp - 9 };
    (if (m <= 2) { y + 1 } else { y }, m, d);
  };

  /// Format a day key (YYYY-MM-DD) from days since the epoch.
  func dayKeyFromDays(days : Int) : Common.DayKey {
    let (y, m, d) = civilFromDays(days);
    pad4(y) # "-" # pad2(m) # "-" # pad2(d);
  };

  /// Parse a YYYY-MM-DD day key into days since the epoch.
  func daysFromDayKey(dayKey : Common.DayKey) : Int {
    let parts = dayKey.split(#char '-').toArray();
    if (parts.size() != 3) { return 0 };
    let y = parseInt(parts[0]);
    let m = parseInt(parts[1]);
    let d = parseInt(parts[2]);
    daysFromCivil(y, m, d);
  };

  /// Convert a nanosecond timestamp to whole seconds since the epoch.
  func toSeconds(now : Common.Timestamp) : Int {
    now / NS_PER_SECOND;
  };

  /// Days since the Unix epoch for a nanosecond timestamp (UTC).
  func daysSinceEpoch(now : Common.Timestamp) : Int {
    now / NS_PER_DAY;
  };

  /// XP awarded for a verified session of `minutes`.
  /// Anchors: 30 minutes = 20 XP, 60 minutes = 50 XP.
  /// The first 30 minutes earn 20 XP; each additional minute earns 1 XP.
  public func xpForMinutes(minutes : Nat) : Common.Xp {
    if (minutes <= 30) {
      (minutes * 20) / 30;
    } else {
      20 + (minutes - 30);
    };
  };

  /// The UTC day key for a nanosecond timestamp.
  public func dayKeyOf(now : Common.Timestamp) : Common.DayKey {
    dayKeyFromDays(daysSinceEpoch(now));
  };

  /// The day key for the Monday of the week containing `now`.
  public func weekStartDayKey(now : Common.Timestamp) : Common.DayKey {
    let days = daysSinceEpoch(now);
    let shifted = days + 3;
    let monday = shifted - (shifted % 7) - 3;
    dayKeyFromDays(monday);
  };

  /// The UTC week key (YYYY-Www) for a nanosecond timestamp.
  /// The week is identified by the Monday that starts it.
  public func weekKeyOf(now : Common.Timestamp) : Common.WeekKey {
    let monday = weekStartDayKey(now);
    let days = daysFromDayKey(monday);
    let shifted = days + 3;
    let week = shifted / 7;
    let year = 1970 + (week / 52);
    let weekOfYear = week - (year - 1970) * 52;
    pad4(year) # "-W" # pad2(weekOfYear + 1);
  };

  /// The day key `offset` days after `dayKey` (offset may be negative).
  public func addDays(dayKey : Common.DayKey, offset : Int) : Common.DayKey {
    let days = daysFromDayKey(dayKey);
    dayKeyFromDays(days + offset);
  };

  /// The day key for the Monday of the week named by a week key.
  func weekStartDayKeyFromKey(weekKey : Common.WeekKey) : Common.DayKey {
    let parts = weekKey.split(#char '-').toArray();
    if (parts.size() != 2) { return "1970-01-01" };
    let year = parseInt(parts[0]);
    // The week part is "Www"; parseInt ignores the leading non-digit.
    let week = parseInt(parts[1]);
    // Week 1 is the week containing January 4th.
    let jan4 = daysFromCivil(year, 1, 4);
    let jan4Shifted = jan4 + 3;
    let mondayOfJan4Week = jan4Shifted - (jan4Shifted % 7) - 3;
    dayKeyFromDays(mondayOfJan4Week + (week - 1) * 7);
  };

  /// Elapsed whole seconds for a session at time `now`.
  func elapsedSeconds(session : Types.StudySession, now : Common.Timestamp) : Nat {
    switch (session.status) {
      case (#running) {
        let live = switch (session.lastResumedAt) {
          case (?resumedAt) {
            let delta = toSeconds(now) - toSeconds(resumedAt);
            if (delta > 0) { delta.toNat() } else { 0 };
          };
          case null { 0 };
        };
        session.accumulatedSeconds + live;
      };
      case (_) { session.accumulatedSeconds };
    };
  };

  /// Start a new study session for the caller.
  public func startSession(
    sessions : Map.Map<Common.Id, Types.StudySession>,
    state : { var nextSessionId : Nat },
    caller : Common.UserId,
    subject : Text,
    now : Common.Timestamp,
  ) : Types.StudySession {
    let id = state.nextSessionId;
    state.nextSessionId := id + 1;
    let session : Types.StudySession = {
      id;
      owner = caller;
      subject;
      status = #running;
      startedAt = now;
      lastResumedAt = ?now;
      accumulatedSeconds = 0;
      finishedAt = null;
      rewardedXp = null;
      dayKey = dayKeyOf(now);
    };
    sessions.add(id, session);
    session;
  };

  /// Pause a running session, accumulating elapsed seconds server-side.
  public func pauseSession(
    sessions : Map.Map<Common.Id, Types.StudySession>,
    caller : Common.UserId,
    sessionId : Common.Id,
    now : Common.Timestamp,
  ) : Types.StudySession {
    let session = sessions.get(sessionId) ?? {
      id = sessionId;
      owner = caller;
      subject = "";
      status = #finished;
      startedAt = now;
      lastResumedAt = null;
      accumulatedSeconds = 0;
      finishedAt = null;
      rewardedXp = null;
      dayKey = dayKeyOf(now);
    };
    let updated : Types.StudySession = {
      session with
      status = #paused;
      accumulatedSeconds = elapsedSeconds(session, now);
      lastResumedAt = null;
    };
    sessions.add(sessionId, updated);
    updated;
  };

  /// Resume a paused session.
  public func resumeSession(
    sessions : Map.Map<Common.Id, Types.StudySession>,
    caller : Common.UserId,
    sessionId : Common.Id,
    now : Common.Timestamp,
  ) : Types.StudySession {
    let session = sessions.get(sessionId) ?? {
      id = sessionId;
      owner = caller;
      subject = "";
      status = #finished;
      startedAt = now;
      lastResumedAt = null;
      accumulatedSeconds = 0;
      finishedAt = null;
      rewardedXp = null;
      dayKey = dayKeyOf(now);
    };
    let updated : Types.StudySession = {
      session with
      status = #running;
      lastResumedAt = ?now;
    };
    sessions.add(sessionId, updated);
    updated;
  };

  /// Finish a session and return the server-measured elapsed minutes.
  public func finishSession(
    sessions : Map.Map<Common.Id, Types.StudySession>,
    caller : Common.UserId,
    sessionId : Common.Id,
    now : Common.Timestamp,
  ) : (Types.StudySession, Nat) {
    let session = sessions.get(sessionId) ?? {
      id = sessionId;
      owner = caller;
      subject = "";
      status = #finished;
      startedAt = now;
      lastResumedAt = null;
      accumulatedSeconds = 0;
      finishedAt = null;
      rewardedXp = null;
      dayKey = dayKeyOf(now);
    };
    let seconds = elapsedSeconds(session, now);
    let minutes = seconds / 60;
    let updated : Types.StudySession = {
      session with
      status = #finished;
      accumulatedSeconds = seconds;
      lastResumedAt = null;
      finishedAt = ?now;
    };
    sessions.add(sessionId, updated);
    (updated, minutes);
  };

  /// List the caller's sessions, newest first.
  public func listSessions(
    sessions : Map.Map<Common.Id, Types.StudySession>,
    caller : Common.UserId,
  ) : [Types.StudySessionView] {
    let mine = sessions.values().filter(func s = s.owner == caller).toArray();
    let sorted = mine.sort(func (a, b) = Int.compare(b.startedAt, a.startedAt));
    sorted.map(func s = toView(s));
  };

  /// Aggregate the caller's study totals for a day.
  public func dailyReport(
    sessions : Map.Map<Common.Id, Types.StudySession>,
    caller : Common.UserId,
    dayKey : Common.DayKey,
  ) : Types.StudyReport {
    aggregate(sessions, caller, func s = s.dayKey == dayKey);
  };

  /// Aggregate the caller's study totals for a week.
  public func weeklyReport(
    sessions : Map.Map<Common.Id, Types.StudySession>,
    caller : Common.UserId,
    weekKey : Common.WeekKey,
  ) : Types.StudyReport {
    let start = weekStartDayKeyFromKey(weekKey);
    let end = addDays(start, 7);
    aggregate(sessions, caller, func s = s.dayKey >= start and s.dayKey < end);
  };

  /// The caller's per-day study totals for the current week.
  public func weekDailyTotals(
    sessions : Map.Map<Common.Id, Types.StudySession>,
    caller : Common.UserId,
    weekKey : Common.WeekKey,
  ) : [Types.DailyStudyTotal] {
    let start = weekStartDayKeyFromKey(weekKey);
    let end = addDays(start, 7);
    let totals = Map.empty<Common.DayKey, (Nat, Common.Xp)>();
    for (s in sessions.values()) {
      if (s.owner == caller and s.status == #finished) {
        if (s.dayKey >= start and s.dayKey < end) {
          let minutes = s.accumulatedSeconds / 60;
          let xp = s.rewardedXp ?? 0;
          let (m, x) = totals.get(s.dayKey) ?? (0, 0);
          totals.add(s.dayKey, (m + minutes, x + xp));
        };
      };
    };
    let rows = totals.entries().map(func (entry) = {
      dayKey = entry.0;
      minutes = entry.1.0;
      xp = entry.1.1;
    }).toArray();
    rows.sort(func (a, b) = Text.compare(a.dayKey, b.dayKey));
  };

  /// Total verified study minutes for the caller on a day.
  public func minutesOnDay(
    sessions : Map.Map<Common.Id, Types.StudySession>,
    caller : Common.UserId,
    dayKey : Common.DayKey,
  ) : Nat {
    var total = 0;
    for (s in sessions.values()) {
      if (s.owner == caller and s.status == #finished and s.dayKey == dayKey) {
        total += s.accumulatedSeconds / 60;
      };
    };
    total;
  };

  /// Total verified study minutes for the caller across all sessions.
  public func totalMinutes(
    sessions : Map.Map<Common.Id, Types.StudySession>,
    caller : Common.UserId,
  ) : Nat {
    var total = 0;
    for (s in sessions.values()) {
      if (s.owner == caller and s.status == #finished) {
        total += s.accumulatedSeconds / 60;
      };
    };
    total;
  };

  /// Total XP the caller has earned from finished sessions.
  public func totalXp(
    sessions : Map.Map<Common.Id, Types.StudySession>,
    caller : Common.UserId,
  ) : Common.Xp {
    var total = 0;
    for (s in sessions.values()) {
      if (s.owner == caller and s.status == #finished) {
        total += s.rewardedXp ?? 0;
      };
    };
    total;
  };

  /// Minutes studied by the caller on a given day key.
  public func minutesForDay(
    sessions : Map.Map<Common.Id, Types.StudySession>,
    caller : Common.UserId,
    dayKey : Common.DayKey,
  ) : Nat {
    minutesOnDay(sessions, caller, dayKey);
  };

  /// Minutes studied by the caller in the week starting at `weekStart`.
  public func minutesForWeek(
    sessions : Map.Map<Common.Id, Types.StudySession>,
    caller : Common.UserId,
    weekStart : Common.DayKey,
  ) : Nat {
    let end = addDays(weekStart, 7);
    var total = 0;
    for (s in sessions.values()) {
      if (s.owner == caller and s.status == #finished and s.dayKey >= weekStart and s.dayKey < end) {
        total += s.accumulatedSeconds / 60;
      };
    };
    total;
  };

  /// XP earned by the caller on a given day key.
  public func xpForDay(
    sessions : Map.Map<Common.Id, Types.StudySession>,
    caller : Common.UserId,
    dayKey : Common.DayKey,
  ) : Common.Xp {
    var total = 0;
    for (s in sessions.values()) {
      if (s.owner == caller and s.status == #finished and s.dayKey == dayKey) {
        total += s.rewardedXp ?? 0;
      };
    };
    total;
  };

  /// XP earned by the caller in the week starting at `weekStart`.
  public func xpForWeek(
    sessions : Map.Map<Common.Id, Types.StudySession>,
    caller : Common.UserId,
    weekStart : Common.DayKey,
  ) : Common.Xp {
    let end = addDays(weekStart, 7);
    var total = 0;
    for (s in sessions.values()) {
      if (s.owner == caller and s.status == #finished and s.dayKey >= weekStart and s.dayKey < end) {
        total += s.rewardedXp ?? 0;
      };
    };
    total;
  };

  /// XP a student earned from finished sessions within a day-key range
  /// [start, end).
  public func sessionXpInRange(
    sessions : Map.Map<Common.Id, Types.StudySession>,
    caller : Common.UserId,
    start : Common.DayKey,
    end : Common.DayKey,
  ) : Common.Xp {
    var total = 0;
    for (s in sessions.values()) {
      if (s.owner == caller and s.status == #finished and s.dayKey >= start and s.dayKey < end) {
        total += s.rewardedXp ?? 0;
      };
    };
    total;
  };

  func aggregate(
    sessions : Map.Map<Common.Id, Types.StudySession>,
    caller : Common.UserId,
    predicate : Types.StudySession -> Bool,
  ) : Types.StudyReport {
    var totalMinutes = 0;
    var sessionCount = 0;
    var totalXp = 0;
    let bySubject = Map.empty<Text, Nat>();
    for (s in sessions.values()) {
      if (s.owner == caller and s.status == #finished and predicate(s)) {
        let minutes = s.accumulatedSeconds / 60;
        totalMinutes += minutes;
        sessionCount += 1;
        totalXp += s.rewardedXp ?? 0;
        let prev = bySubject.get(s.subject) ?? 0;
        bySubject.add(s.subject, prev + minutes);
      };
    };
    let subjects = bySubject.entries().toArray();
    {
      totalMinutes;
      sessionCount;
      totalXp;
      bySubject = subjects;
    };
  };

  /// Project a session for the API boundary.
  public func toView(session : Types.StudySession) : Types.StudySessionView {
    {
      id = session.id;
      subject = session.subject;
      status = session.status;
      startedAt = session.startedAt;
      accumulatedSeconds = session.accumulatedSeconds;
      finishedAt = session.finishedAt;
      rewardedXp = session.rewardedXp;
    };
  };
};
