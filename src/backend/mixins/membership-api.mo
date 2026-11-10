import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/membership";
import MembershipLib "../lib/membership";

mixin (
  accessControlState : AccessControl.AccessControlState,
  subscriptions : Map.Map<Common.UserId, Types.Subscription>,
) {
  /// The available membership plans.
  public query func listMembershipPlans() : async [Types.Plan] {
    MembershipLib.plans();
  };

  /// Begin a membership purchase; benefits stay inactive until verified.
  public shared ({ caller }) func beginMembershipPurchase(tier : Types.PlanTier, paymentReference : Text) : async Types.Subscription {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to purchase a membership");
    };
    if (paymentReference.size() == 0) {
      Runtime.trap("A payment reference is required");
    };
    MembershipLib.beginPurchase(subscriptions, caller, tier, paymentReference);
  };

  /// Verify a payment and activate benefits.
  public shared ({ caller }) func verifyMembershipPayment(paymentReference : Text) : async Types.Subscription {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to verify a payment");
    };
    let existing = subscriptions.get(caller) ?? Runtime.trap("No pending membership purchase");
    let matches = switch (existing.paymentReference) {
      case (?ref) { ref == paymentReference };
      case null { false };
    };
    if (not matches) {
      Runtime.trap("Payment reference does not match the pending purchase");
    };
    MembershipLib.verifyPayment(subscriptions, caller, paymentReference, Time.now());
  };

  /// The caller's membership state.
  public query ({ caller }) func getMembership() : async Types.MembershipView {
    MembershipLib.getMembership(subscriptions, caller, Time.now());
  };

  /// Grant or revoke a membership (admin).
  public shared ({ caller }) func adminSetMembership(student : Common.UserId, tier : Types.PlanTier, expiresAt : Common.Timestamp) : async Types.Subscription {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can set memberships");
    };
    MembershipLib.adminSetMembership(subscriptions, student, tier, expiresAt);
  };
};
