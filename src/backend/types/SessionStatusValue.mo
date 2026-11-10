import OQL "mo:caffeineai-oql";
import Types "../types/study";

module {
  public func _toRow(self : Types.SessionStatus) : OQL.Value {
    #text(switch self {
      case (#running) { "running" };
      case (#paused) { "paused" };
      case (#finished) { "finished" };
    });
  };
};
