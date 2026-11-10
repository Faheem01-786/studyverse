import OQL "mo:caffeineai-oql";
import Types "../types/membership";

module {
  public func _toRow(self : Types.PlanTier) : OQL.Value {
    #text(switch self {
      case (#moderate) { "moderate" };
      case (#advanced) { "advanced" };
      case (#ultimate) { "ultimate" };
    });
  };
};
