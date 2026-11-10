import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import BlobValue "mo:caffeineai-oql/BlobValue";

import Common "types/common";
import ProfileTypes "types/profiles";
import StudyTypes "types/study";
import QuestTypes "types/quests";
import StoreTypes "types/store";
import MembershipTypes "types/membership";
import ThemeTypes "types/themes";
import LibraryTypes "types/library";
import HubTypes "types/hub";
import AchievementTypes "types/achievements";
import AdminTypes "types/admin";

import SessionStatusValue "types/SessionStatusValue";
import QuestGoalValue "types/QuestGoalValue";
import StoreItemKindValue "types/StoreItemKindValue";
import PlanTierValue "types/PlanTierValue";
import PaymentStatusValue "types/PaymentStatusValue";
import AchievementKeyValue "types/AchievementKeyValue";

import ProfilesApi "mixins/profiles-api";
import StudyApi "mixins/study-api";
import QuestsApi "mixins/quests-api";
import StoreApi "mixins/store-api";
import MembershipApi "mixins/membership-api";
import ThemesApi "mixins/themes-api";
import LibraryApi "mixins/library-api";
import HubApi "mixins/hub-api";
import LeaderboardApi "mixins/leaderboard-api";
import AchievementsApi "mixins/achievements-api";
import AdminApi "mixins/admin-api";
import ApiDocMixin "mixins/api-doc";

actor {
  // --- Shared authorization state ---
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  // --- Platform object storage ---
  include MixinObjectStorage();

  // --- Domain state ---
  let profiles : Map.Map<Common.UserId, ProfileTypes.Profile>;
  let goals : Map.Map<Common.UserId, ProfileTypes.StudyGoal>;
  let sessions : Map.Map<Common.Id, StudyTypes.StudySession>;
  let quests : Map.Map<Common.Id, QuestTypes.Quest>;
  let questProgress : Map.Map<Text, QuestTypes.QuestProgress>;
  let storeItems : Map.Map<Common.Id, StoreTypes.StoreItem>;
  let purchases : Map.Map<Common.Id, StoreTypes.Purchase>;
  let subscriptions : Map.Map<Common.UserId, MembershipTypes.Subscription>;
  let themes : Map.Map<Common.Id, ThemeTypes.Theme>;
  let resources : Map.Map<Common.Id, LibraryTypes.Resource>;
  let websiteLinks : Map.Map<Common.Id, HubTypes.WebsiteLink>;
  let friends : Map.Map<Common.UserId, Set.Set<Common.UserId>>;
  let flaggedStudents : Set.Set<Common.UserId>;
  let earnedAchievements : Map.Map<Text, AchievementTypes.EarnedAchievement>;
  let students : Map.Map<Common.UserId, AdminTypes.StudentSummary>;

  // --- Shared counters ---
  let counters : {
    var nextSessionId : Nat;
    var nextQuestId : Nat;
    var nextItemId : Nat;
    var nextPurchaseId : Nat;
    var nextThemeId : Nat;
    var nextResourceId : Nat;
    var nextLinkId : Nat;
  };

  // --- Domain APIs ---
  include ProfilesApi(accessControlState, profiles, goals, sessions, quests, questProgress);
  include StudyApi(accessControlState, sessions, counters, profiles, goals, quests, questProgress, subscriptions, earnedAchievements);
  include QuestsApi(accessControlState, quests, questProgress, counters, profiles, goals, sessions, subscriptions, earnedAchievements);
  include StoreApi(accessControlState, storeItems, purchases, counters, profiles);
  include MembershipApi(accessControlState, subscriptions);
  include ThemesApi(accessControlState, themes, counters, profiles, subscriptions);
  include LibraryApi(accessControlState, resources, counters);
  include HubApi(accessControlState, websiteLinks, counters);
  include LeaderboardApi(accessControlState, profiles, friends, flaggedStudents, sessions, quests, questProgress);
  include AchievementsApi(accessControlState, earnedAchievements);
  include AdminApi(accessControlState, students, profiles, sessions, purchases, subscriptions, resources, quests);

  // --- Behavioral API documentation ---
  include ApiDocMixin();

  // --- OQL: queryable tables with per-table authorization ---
  transient let anyPrincipal = Principal.fromText("aaaaa-aa");

  include Expose({
    entities = [
      profiles.toEntity("profile", "Profile", "id")
        .sample({
          id = anyPrincipal;
          username = "";
          displayName = "";
          bio = "";
          avatarItemId = ?0;
          frameItemId = ?0;
          appliedThemeId = 0;
          xp = 0;
          level = 0;
          createdAt = 0;
          updatedAt = 0;
        })
        .ownedBy("id")
        .controllerOrScoped()
        .build(),
      sessions.toEntity("studySession", "StudySession", "id")
        .sample({
          id = 0;
          owner = anyPrincipal;
          subject = "";
          status = #finished;
          startedAt = 0;
          lastResumedAt = ?0;
          accumulatedSeconds = 0;
          finishedAt = ?0;
          rewardedXp = ?0;
          dayKey = "";
        })
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      quests.toEntity("quest", "Quest", "id")
        .sample({
          id = 0;
          title = "";
          description = "";
          goal = #finishSession;
          xpReward = 0;
          active = true;
          createdAt = 0;
        })
        .public_()
        .build(),
      storeItems.toEntity("storeItem", "StoreItem", "id")
        .sample({
          id = 0;
          name = "";
          description = "";
          kind = #badge;
          xpPrice = 0;
          active = true;
          createdAt = 0;
        })
        .public_()
        .build(),
      purchases.toEntity("purchase", "Purchase", "id")
        .sample({
          id = 0;
          owner = anyPrincipal;
          itemId = 0;
          xpSpent = 0;
          purchasedAt = 0;
        })
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      subscriptions.toEntity("subscription", "Subscription", "owner")
        .sample({
          owner = anyPrincipal;
          tier = #moderate;
          status = #pending;
          startedAt = ?0;
          expiresAt = ?0;
          paymentReference = ?"";
        })
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      themes.toEntity("theme", "Theme", "id")
        .sample({
          id = 0;
          name = "";
          description = "";
          premium = false;
          cssVariables = "";
          createdAt = 0;
        })
        .public_()
        .build(),
      resources.toEntity("resource", "Resource", "id")
        .sample({
          id = 0;
          title = "";
          description = "";
          category = "";
          subject = "";
          classLevel = "";
          board = "";
          file = "" : Blob;
          fileName = "";
          downloadCount = 0;
          createdAt = 0;
        })
        .public_()
        .build(),
      websiteLinks.toEntity("websiteLink", "WebsiteLink", "id")
        .sample({
          id = 0;
          name = "";
          description = "";
          url = "";
          category = "";
          createdAt = 0;
        })
        .public_()
        .build(),
      earnedAchievements.toEntity("earnedAchievement", "EarnedAchievement", "key")
        .sample({
          key = #firstStudySession;
          owner = anyPrincipal;
          earnedAt = 0;
        })
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      OQL.Entity.manual<(Text, QuestTypes.QuestProgress)>(
        "questProgress",
        func () = questProgress.entries(),
        "QuestProgress",
        "key",
      )
        .sample(("", {
          questId = 0;
          owner = anyPrincipal;
          dayKey = "";
          progress = 0;
          target = 0;
          completed = false;
          claimed = false;
        }))
        .payload("key", func ((k, _)) = k)
        .payload("questId", func ((_, p)) = p.questId)
        .payload("owner", func ((_, p)) = p.owner)
        .payload("dayKey", func ((_, p)) = p.dayKey)
        .payload("progress", func ((_, p)) = p.progress)
        .payload("target", func ((_, p)) = p.target)
        .payload("completed", func ((_, p)) = p.completed)
        .payload("claimed", func ((_, p)) = p.claimed)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
    ];
  });
};
