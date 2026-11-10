import OQL "mo:caffeineai-oql";
import Types "../types/membership";

module {
  public func _toRow(self : Types.PaymentStatus) : OQL.Value {
    #text(switch self {
      case (#pending) { "pending" };
      case (#verified) { "verified" };
      case (#failed) { "failed" };
    });
  };
};
