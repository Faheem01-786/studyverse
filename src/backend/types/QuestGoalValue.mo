import Nat "mo:core/Nat";
import OQL "mo:caffeineai-oql";
import Types "../types/quests";

module {
  public func _toRow(self : Types.QuestGoal) : OQL.Value {
    #text(switch self {
      case (#studyMinutes(m)) { "studyMinutes:" # m.toText() };
      case (#completeChapter) { "completeChapter" };
      case (#solveQuestions(n)) { "solveQuestions:" # n.toText() };
      case (#finishSession) { "finishSession" };
      case (#reachDailyGoal) { "reachDailyGoal" };
    });
  };
};
