import OQL "mo:caffeineai-oql";
import Types "../types/store";

module {
  public func _toRow(self : Types.StoreItemKind) : OQL.Value {
    #text(switch self {
      case (#resource) { "resource" };
      case (#badge) { "badge" };
      case (#avatar) { "avatar" };
      case (#frame) { "frame" };
      case (#dashboardTheme) { "dashboardTheme" };
      case (#digitalReward) { "digitalReward" };
    });
  };
};
