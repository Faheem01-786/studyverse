import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Common "../types/common";
import Types "../types/leaderboard";

module {
  public type ProfileRow = {
    id : Common.UserId;
    username : Text;
    displayName : Text;
    avatarItemId : ?Common.Id;
    frameItemId : ?Common.Id;
    xp : Common.Xp;
    level : Common.Level;
  };

  /// Build a ranked leaderboard for the requested scope, ranking by the
  /// XP supplied by `xpOf` for each student (period XP for weekly/monthly,
  /// total XP for global).
  public func getLeaderboardByXp(
    profiles : Map.Map<Common.UserId, ProfileRow>,
    friends : Map.Map<Common.UserId, Set.Set<Common.UserId>>,
    caller : Common.UserId,
    scope : Types.LeaderboardScope,
    limit : Nat,
    xpOf : Common.UserId -> Common.Xp,
  ) : [Types.LeaderboardEntry] {
    let friendSet = switch (scope) {
      case (#friends) {
        switch (friends.get(caller)) {
          case (?set) { set };
          case null { Set.empty<Common.UserId>() };
        };
      };
      case _ { Set.empty<Common.UserId>() };
    };
    let rows = profiles.values().filter(func(profile) {
      switch (scope) {
        case (#friends) { friendSet.contains(profile.id) };
        case _ { true };
      };
    });
    let sorted = rows.toArray().sort(func(a, b) {
      let ax = xpOf(a.id);
      let bx = xpOf(b.id);
      if (ax > bx) { #less } else if (ax < bx) { #greater } else { #equal };
    });
    let limited = if (sorted.size() > limit) { sorted.sliceToArray(0, limit.toInt()) } else { sorted };
    var rank = 0;
    limited.map(func(profile) {
      rank += 1;
      {
        rank;
        student = profile.id;
        username = profile.username;
        displayName = profile.displayName;
        avatarItemId = profile.avatarItemId;
        frameItemId = profile.frameItemId;
        level = profile.level;
        xp = xpOf(profile.id);
      };
    });
  };

  /// Build a ranked leaderboard for the requested scope.
  public func getLeaderboard(
    profiles : Map.Map<Common.UserId, ProfileRow>,
    friends : Map.Map<Common.UserId, Set.Set<Common.UserId>>,
    caller : Common.UserId,
    scope : Types.LeaderboardScope,
    limit : Nat,
  ) : [Types.LeaderboardEntry] {
    let friendSet = switch (scope) {
      case (#friends) {
        switch (friends.get(caller)) {
          case (?set) { set };
          case null { Set.empty<Common.UserId>() };
        };
      };
      case _ { Set.empty<Common.UserId>() };
    };
    let rows = profiles.values().filter(func(profile) {
      switch (scope) {
        case (#friends) { friendSet.contains(profile.id) };
        case _ { true };
      };
    });
    let sorted = rows.toArray().sort(func(a, b) {
      if (a.xp > b.xp) { #less } else if (a.xp < b.xp) { #greater } else { #equal };
    });
    let limited = if (sorted.size() > limit) { sorted.sliceToArray(0, limit.toInt()) } else { sorted };
    var rank = 0;
    limited.map(func(profile) {
      rank += 1;
      {
        rank;
        student = profile.id;
        username = profile.username;
        displayName = profile.displayName;
        avatarItemId = profile.avatarItemId;
        frameItemId = profile.frameItemId;
        level = profile.level;
        xp = profile.xp;
      };
    });
  };

  /// Add a friend for the caller.
  public func addFriend(
    friends : Map.Map<Common.UserId, Set.Set<Common.UserId>>,
    caller : Common.UserId,
    friend : Common.UserId,
  ) : () {
    if (caller == friend) { return };
    let set = switch (friends.get(caller)) {
      case (?existing) { existing };
      case null {
        let fresh = Set.empty<Common.UserId>();
        friends.add(caller, fresh);
        fresh;
      };
    };
    set.add(friend);
  };

  /// Remove a friend for the caller.
  public func removeFriend(
    friends : Map.Map<Common.UserId, Set.Set<Common.UserId>>,
    caller : Common.UserId,
    friend : Common.UserId,
  ) : () {
    switch (friends.get(caller)) {
      case (?set) { set.remove(friend) };
      case null {};
    };
  };

  /// Flag a student's leaderboard entry (admin moderation).
  public func flagStudent(
    flagged : Set.Set<Common.UserId>,
    student : Common.UserId,
  ) : () {
    flagged.add(student);
  };

  /// Clear a student's leaderboard flag (admin moderation).
  public func clearFlag(
    flagged : Set.Set<Common.UserId>,
    student : Common.UserId,
  ) : () {
    flagged.remove(student);
  };
};
