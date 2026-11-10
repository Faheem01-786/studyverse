import Map "mo:core/Map";
import Set "mo:core/Set";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  public type OldActor = {};

  type Profile = {
    id : Principal;
    username : Text;
    displayName : Text;
    bio : Text;
    avatarItemId : ?Nat;
    frameItemId : ?Nat;
    appliedThemeId : Nat;
    xp : Nat;
    level : Nat;
    createdAt : Int;
    updatedAt : Int;
  };

  type StudyGoal = {
    dailyGoalMinutes : Nat;
    currentStreakDays : Nat;
    longestStreakDays : Nat;
    lastStudyDay : ?Text;
  };

  type SessionStatus = { #running; #paused; #finished };

  type StudySession = {
    id : Nat;
    owner : Principal;
    subject : Text;
    status : SessionStatus;
    startedAt : Int;
    lastResumedAt : ?Int;
    accumulatedSeconds : Nat;
    finishedAt : ?Int;
    rewardedXp : ?Nat;
    dayKey : Text;
  };

  type QuestGoal = {
    #studyMinutes : Nat;
    #completeChapter;
    #solveQuestions : Nat;
    #finishSession;
    #reachDailyGoal;
  };

  type Quest = {
    id : Nat;
    title : Text;
    description : Text;
    goal : QuestGoal;
    xpReward : Nat;
    active : Bool;
    createdAt : Int;
  };

  type QuestProgress = {
    questId : Nat;
    owner : Principal;
    dayKey : Text;
    progress : Nat;
    target : Nat;
    completed : Bool;
    claimed : Bool;
  };

  type StoreItemKind = {
    #resource;
    #badge;
    #avatar;
    #frame;
    #dashboardTheme;
    #digitalReward;
  };

  type StoreItem = {
    id : Nat;
    name : Text;
    description : Text;
    kind : StoreItemKind;
    xpPrice : Nat;
    active : Bool;
    createdAt : Int;
  };

  type Purchase = {
    id : Nat;
    owner : Principal;
    itemId : Nat;
    xpSpent : Nat;
    purchasedAt : Int;
  };

  type PlanTier = { #moderate; #advanced; #ultimate };
  type PaymentStatus = { #pending; #verified; #failed };

  type Subscription = {
    owner : Principal;
    tier : PlanTier;
    status : PaymentStatus;
    startedAt : ?Int;
    expiresAt : ?Int;
    paymentReference : ?Text;
  };

  type Theme = {
    id : Nat;
    name : Text;
    description : Text;
    premium : Bool;
    cssVariables : Text;
    createdAt : Int;
  };

  type Resource = {
    id : Nat;
    title : Text;
    description : Text;
    category : Text;
    subject : Text;
    classLevel : Text;
    board : Text;
    file : Blob;
    fileName : Text;
    downloadCount : Nat;
    createdAt : Int;
  };

  type WebsiteLink = {
    id : Nat;
    name : Text;
    description : Text;
    url : Text;
    category : Text;
    createdAt : Int;
  };

  type AchievementKey = {
    #firstStudySession;
    #fiveHourLearner;
    #sevenDayStreak;
    #thirtyDayStreak;
    #questMaster;
    #xpChampion;
  };

  type EarnedAchievement = {
    key : AchievementKey;
    owner : Principal;
    earnedAt : Int;
  };

  type StudentSummary = {
    id : Principal;
    username : Text;
    displayName : Text;
    xp : Nat;
    level : Nat;
    membershipTier : ?Text;
    createdAt : Int;
  };

  type Counters = {
    var nextSessionId : Nat;
    var nextQuestId : Nat;
    var nextItemId : Nat;
    var nextPurchaseId : Nat;
    var nextThemeId : Nat;
    var nextResourceId : Nat;
    var nextLinkId : Nat;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    profiles : Map.Map<Principal, Profile>;
    goals : Map.Map<Principal, StudyGoal>;
    sessions : Map.Map<Nat, StudySession>;
    quests : Map.Map<Nat, Quest>;
    questProgress : Map.Map<Text, QuestProgress>;
    storeItems : Map.Map<Nat, StoreItem>;
    purchases : Map.Map<Nat, Purchase>;
    subscriptions : Map.Map<Principal, Subscription>;
    themes : Map.Map<Nat, Theme>;
    resources : Map.Map<Nat, Resource>;
    websiteLinks : Map.Map<Nat, WebsiteLink>;
    friends : Map.Map<Principal, Set.Set<Principal>>;
    flaggedStudents : Set.Set<Principal>;
    earnedAchievements : Map.Map<Text, EarnedAchievement>;
    students : Map.Map<Principal, StudentSummary>;
    counters : Counters;
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      profiles = Map.empty();
      goals = Map.empty();
      sessions = Map.empty();
      quests = Map.empty();
      questProgress = Map.empty();
      storeItems = Map.empty();
      purchases = Map.empty();
      subscriptions = Map.empty();
      themes = Map.empty();
      resources = Map.empty();
      websiteLinks = Map.empty();
      friends = Map.empty();
      flaggedStudents = Set.empty();
      earnedAchievements = Map.empty();
      students = Map.empty();
      counters = {
        var nextSessionId = 0;
        var nextQuestId = 0;
        var nextItemId = 0;
        var nextPurchaseId = 0;
        var nextThemeId = 0;
        var nextResourceId = 0;
        var nextLinkId = 0;
      };
    };
  };
};
