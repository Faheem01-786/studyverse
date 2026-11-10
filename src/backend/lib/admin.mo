import Int "mo:core/Int";
import Map "mo:core/Map";
import Common "../types/common";
import Types "../types/admin";
import ProfileTypes "../types/profiles";
import StudyTypes "../types/study";
import MembershipTypes "../types/membership";

module {
  /// Seconds in one minute.
  let secondsPerMinute : Nat = 60;

  /// Nanoseconds in one day.
  let nanosPerDay : Int = 86_400_000_000_000;

  /// Format a UTC day key (YYYY-MM-DD) for a nanosecond timestamp.
  /// Uses the civil-from-days algorithm so the key matches the day keys the
  /// study domain stores.
  public func dayKeyOf(now : Common.Timestamp) : Common.DayKey {
    let days = floorDiv(now, nanosPerDay);
    let (year, month, day) = civilFromDays(days);
    pad4(year) # "-" # pad2(month) # "-" # pad2(day);
  };

  /// Floor division for signed integers (rounds toward negative infinity).
  func floorDiv(a : Int, b : Int) : Int {
    let q = a / b;
    if (a % b != 0 and ((a < 0) != (b < 0))) { q - 1 } else { q };
  };

  /// Convert days since the Unix epoch to a (year, month, day) civil date.
  func civilFromDays(days : Int) : (Int, Int, Int) {
    let z = days + 719_468;
    let era = floorDiv(z, 146_097);
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if (mp < 10) { mp + 3 } else { mp - 9 };
    let year = if (m <= 2) { y + 1 } else { y };
    (year, m, d);
  };

  /// Zero-pad a non-negative integer to two digits.
  func pad2(n : Int) : Text {
    if (n < 10) { "0" # n.toText() } else { n.toText() };
  };

  /// Zero-pad a non-negative integer to four digits.
  func pad4(n : Int) : Text {
    if (n < 10) { "000" # n.toText() }
    else if (n < 100) { "00" # n.toText() }
    else if (n < 1000) { "0" # n.toText() }
    else { n.toText() };
  };

  /// Sum the verified study minutes across every stored session.
  public func totalStudyMinutes(
    sessions : Map.Map<Common.Id, StudyTypes.StudySession>,
  ) : Nat {
    var total = 0;
    for (session in sessions.values()) {
      total += session.accumulatedSeconds / secondsPerMinute;
    };
    total;
  };

  /// Sum the XP awarded for verified study sessions.
  public func totalXpAwarded(
    sessions : Map.Map<Common.Id, StudyTypes.StudySession>,
  ) : Common.Xp {
    var total = 0;
    for (session in sessions.values()) {
      total += session.rewardedXp ?? 0;
    };
    total;
  };

  /// Count memberships that are verified and not yet expired.
  public func activeMemberships(
    subscriptions : Map.Map<Common.UserId, MembershipTypes.Subscription>,
    now : Common.Timestamp,
  ) : Nat {
    var count = 0;
    for (sub in subscriptions.values()) {
      let verified = switch (sub.status) {
        case (#verified) { true };
        case (_) { false };
      };
      let unexpired = switch (sub.expiresAt) {
        case (?expires) { expires > now };
        case null { false };
      };
      if (verified and unexpired) { count += 1 };
    };
    count;
  };

  /// Count students whose profile was touched on the given UTC day.
  public func activeStudentsToday(
    profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
    dayKey : Common.DayKey,
  ) : Nat {
    var count = 0;
    for (profile in profiles.values()) {
      if (dayKeyOf(profile.updatedAt) == dayKey) { count += 1 };
    };
    count;
  };

  /// Compute platform-wide analytics from real stored data.
  public func analytics(
    totalStudents : Nat,
    totalStudyMinutes : Nat,
    totalXpAwarded : Common.Xp,
    totalPurchases : Nat,
    activeMemberships : Nat,
    totalResources : Nat,
    totalQuests : Nat,
    activeToday : Nat,
  ) : Types.PlatformAnalytics {
    {
      totalStudents;
      activeStudentsToday = activeToday;
      totalStudyMinutes;
      totalXpAwarded;
      totalPurchases;
      activeMemberships;
      totalResources;
      totalQuests;
    };
  };

  /// Build a student summary from the authoritative profile and membership.
  public func toStudentSummary(
    profile : ProfileTypes.Profile,
    membershipTier : ?Text,
  ) : Types.StudentSummary {
    {
      id = profile.id;
      username = profile.username;
      displayName = profile.displayName;
      xp = profile.xp;
      level = profile.level;
      membershipTier;
      createdAt = profile.createdAt;
    };
  };

  /// The membership tier label for a subscription, when it is active.
  public func activeTierLabel(
    subscription : ?MembershipTypes.Subscription,
    now : Common.Timestamp,
  ) : ?Text {
    switch (subscription) {
      case (?sub) {
        let verified = switch (sub.status) {
          case (#verified) { true };
          case (_) { false };
        };
        let unexpired = switch (sub.expiresAt) {
          case (?expires) { expires > now };
          case null { false };
        };
        if (verified and unexpired) {
          switch (sub.tier) {
            case (#moderate) { ?"moderate" };
            case (#advanced) { ?"advanced" };
            case (#ultimate) { ?"ultimate" };
          };
        } else {
          null;
        };
      };
      case null { null };
    };
  };

  /// List all students for admin management, newest first.
  public func listStudents(
    students : Map.Map<Common.UserId, Types.StudentSummary>,
  ) : [Types.StudentSummary] {
    let all = students.values().toArray();
    all.sort(func (a, b) = Int.compare(b.createdAt, a.createdAt));
  };

  /// Remove a student's summary row (admin).
  public func removeStudent(
    students : Map.Map<Common.UserId, Types.StudentSummary>,
    student : Common.UserId,
  ) : () {
    students.remove(student);
  };
};
