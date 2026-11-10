import Common "common";

module {
  /// The three membership tiers.
  public type PlanTier = {
    #moderate;
    #advanced;
    #ultimate;
  };

  /// A membership plan definition.
  public type Plan = {
    tier : PlanTier;
    name : Text;
    priceRupees : Common.Rupees;
    xpMultiplier : Nat;
    benefits : [Text];
  };

  /// Payment verification state for a membership purchase.
  public type PaymentStatus = {
    #pending;
    #verified;
    #failed;
  };

  /// A student's membership subscription.
  public type Subscription = {
    owner : Common.UserId;
    tier : PlanTier;
    status : PaymentStatus;
    startedAt : ?Common.Timestamp;
    expiresAt : ?Common.Timestamp;
    paymentReference : ?Text;
  };

  /// The caller's effective membership state.
  public type MembershipView = {
    tier : ?PlanTier;
    active : Bool;
    expiresAt : ?Common.Timestamp;
    xpMultiplier : Nat;
  };
};
