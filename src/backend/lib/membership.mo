import Map "mo:core/Map";
import Common "../types/common";
import Types "../types/membership";

module {
  /// Membership duration in nanoseconds (30 days).
  let membershipDurationNs : Int = 2_592_000_000_000_000;

  /// The three plan definitions.
  public func plans() : [Types.Plan] {
    [
      {
        tier = #moderate;
        name = "Moderate";
        priceRupees = 20;
        xpMultiplier = 2;
        benefits = [
          "2X XP multiplier on all study sessions and quest rewards",
          "Exclusive basic benefits",
          "Access to special quests",
        ];
      },
      {
        tier = #advanced;
        name = "Advanced";
        priceRupees = 50;
        xpMultiplier = 3;
        benefits = [
          "3X XP multiplier on all study sessions and quest rewards",
          "All Moderate benefits",
          "Advanced platform features",
          "Exclusive rewards",
        ];
      },
      {
        tier = #ultimate;
        name = "Ultimate";
        priceRupees = 99;
        xpMultiplier = 3;
        benefits = [
          "All Advanced benefits",
          "Custom dashboard themes",
          "Anime premium themes",
          "Personalized colors",
          "Special animations",
          "Exclusive customization options",
        ];
      },
    ];
  };

  /// The XP multiplier for a tier.
  public func multiplierFor(tier : Types.PlanTier) : Nat {
    switch (tier) {
      case (#moderate) { 2 };
      case (#advanced) { 3 };
      case (#ultimate) { 3 };
    };
  };

  /// Begin a membership purchase; benefits stay inactive until verified.
  public func beginPurchase(
    subscriptions : Map.Map<Common.UserId, Types.Subscription>,
    caller : Common.UserId,
    tier : Types.PlanTier,
    paymentReference : Text,
  ) : Types.Subscription {
    let pending : Types.Subscription = {
      owner = caller;
      tier;
      status = #pending;
      startedAt = null;
      expiresAt = null;
      paymentReference = ?paymentReference;
    };
    subscriptions.add(caller, pending);
    pending;
  };

  /// Verify a payment and activate benefits with an expiry date.
  public func verifyPayment(
    subscriptions : Map.Map<Common.UserId, Types.Subscription>,
    caller : Common.UserId,
    paymentReference : Text,
    now : Common.Timestamp,
  ) : Types.Subscription {
    let existing = subscriptions.get(caller) ?? do {
      return {
        owner = caller;
        tier = #moderate;
        status = #failed;
        startedAt = null;
        expiresAt = null;
        paymentReference = ?paymentReference;
      };
    };
    let matches = switch (existing.paymentReference) {
      case (?ref) { ref == paymentReference };
      case null { false };
    };
    if (not matches) {
      return { existing with status = #failed };
    };
    let active : Types.Subscription = {
      existing with
      status = #verified;
      startedAt = ?now;
      expiresAt = ?(now + membershipDurationNs);
    };
    subscriptions.add(caller, active);
    active;
  };

  /// The caller's effective membership state.
  public func getMembership(
    subscriptions : Map.Map<Common.UserId, Types.Subscription>,
    caller : Common.UserId,
    now : Common.Timestamp,
  ) : Types.MembershipView {
    switch (subscriptions.get(caller)) {
      case (?s) {
        let active = switch (s.status, s.expiresAt) {
          case (#verified, ?expiry) { expiry > now };
          case _ { false };
        };
        if (active) {
          {
            tier = ?s.tier;
            active = true;
            expiresAt = s.expiresAt;
            xpMultiplier = multiplierFor(s.tier);
          };
        } else {
          { tier = null; active = false; expiresAt = null; xpMultiplier = 1 };
        };
      };
      case null {
        { tier = null; active = false; expiresAt = null; xpMultiplier = 1 };
      };
    };
  };

  /// The caller's active XP multiplier (1 when no active membership).
  public func activeMultiplier(
    subscriptions : Map.Map<Common.UserId, Types.Subscription>,
    caller : Common.UserId,
    now : Common.Timestamp,
  ) : Nat {
    getMembership(subscriptions, caller, now).xpMultiplier;
  };

  /// Grant or revoke a membership (admin).
  public func adminSetMembership(
    subscriptions : Map.Map<Common.UserId, Types.Subscription>,
    student : Common.UserId,
    tier : Types.PlanTier,
    expiresAt : Common.Timestamp,
  ) : Types.Subscription {
    let active : Types.Subscription = {
      owner = student;
      tier;
      status = #verified;
      startedAt = ?expiresAt;
      expiresAt = ?expiresAt;
      paymentReference = null;
    };
    subscriptions.add(student, active);
    active;
  };
};
