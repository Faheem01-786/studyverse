/// Behavioral API documentation for the StudyVerse backend.
/// Static Markdown describing the current public interface; it reads no state.
mixin () {
  public query func getApiDoc() : async Text {
    "# StudyVerse Backend API\n\n" #
    "StudyVerse is a student productivity and learning platform with RPG-style progression. " #
    "Students track study sessions, earn XP, level up, complete daily quests, spend XP in a rewards store, " #
    "buy memberships, apply themes, browse a study library and a website hub, and compete on leaderboards. " #
    "Administrators manage quests, store items, themes, resources, website links, memberships and students.\n\n" #
    "## Authentication and identity\n\n" #
    "All state-changing methods require a signed (non-anonymous) caller. Sign-in uses Internet Identity. " #
    "The frontend pins an Internet Identity derivation origin, published at `/.well-known/ii-derivation-origin` when available; " #
    "an agent already holding the user's Internet Identity authorization derives the correct per-app principal against that origin " #
    "(for example `icp identity link web <name> --app <host>`). Such a delegation acts with the user's full authority in this app until it expires.\n\n" #
    "Registration is a prerequisite for guarded calls. A direct API caller must register once by calling " #
    "`_initialize_access_control` as a signed-in caller before any role-guarded call, including guarded queries. " #
    "The first caller to initialize becomes the administrator; subsequent callers receive the regular user role. " #
    "An unregistered or anonymous caller receives a trap such as `Unauthorized: sign in to view your dashboard` " #
    "on guarded endpoints. Registration happens only when a caller signs in through the app's own frontend, so a principal " #
    "that never did so is unregistered even when it belongs to the app's owner, and a signed-in caller derived against a " #
    "different origin is a different principal than the one the frontend registered.\n\n" #
    "## Units and encodings\n\n" #
    "- Timestamps are signed 64-bit nanoseconds since the Unix epoch (`Time.now()`).\n" #
    "- Day keys are UTC `YYYY-MM-DD`; week keys are UTC `YYYY-Www`; month keys are UTC `YYYY-MM`.\n" #
    "- XP amounts are non-negative integers. Levels are derived from total XP.\n" #
    "- Membership prices are whole Indian rupees. Membership duration is 30 days.\n" #
    "- Identifiers are `Nat`; student identities are `Principal`.\n" #
    "- Library resource files are platform object-storage blobs (`Storage.ExternalBlob`).\n\n" #
    "## Study sessions and XP\n\n" #
    "`startStudySession(subject)` opens a server-timed session. `pauseStudySession(id)` and `resumeStudySession(id)` " #
    "accumulate elapsed seconds server-side; `finishStudySession(id)` closes it and awards XP from server-measured duration only " #
    "(30 minutes = 20 XP, 60 minutes = 50 XP), multiplied by the caller's active membership multiplier. " #
    "Finishing also updates the study streak, daily totals, quest progress and achievements. " #
    "A session can be finished once; a second finish traps with `Session already finished`, so retries are safe. " #
    "`listStudySessions`, `getDailyReport(dayKey)` and `getWeeklyReport(weekKey)` return the caller's own history and aggregates.\n\n" #
    "## Quests\n\n" #
    "`listDailyQuests()` returns active quests with the caller's progress for today, derived from real study activity. " #
    "`claimQuestReward(questId)` credits the quest's XP reward exactly once; a second claim returns 0. " #
    "Admins create, update and delete quests with `adminCreateQuest`, `adminUpdateQuest` and `adminDeleteQuest`.\n\n" #
    "## XP store\n\n" #
    "`listStoreItems()` lists active items with the caller's ownership. `purchaseStoreItem(itemId)` deducts the item's XP price " #
    "from the caller's balance and records the purchase. It traps on an unknown or inactive item, a duplicate purchase " #
    "(`You already own this item`) or insufficient XP (`Not enough XP to purchase this item`), so a balance can never go negative. " #
    "`getPurchaseHistory()` returns the caller's purchases, newest first.\n\n" #
    "## Memberships\n\n" #
    "`listMembershipPlans()` returns the three plans (Moderate 2X, Advanced 3X, Ultimate 3X). " #
    "`beginMembershipPurchase(tier, paymentReference)` records a pending purchase; benefits stay inactive. " #
    "`verifyMembershipPayment(paymentReference)` activates benefits with a 30-day expiry only when the reference matches the pending purchase. " #
    "`getMembership()` returns the caller's effective tier, active flag, expiry and XP multiplier (1 when inactive). " #
    "Benefits are never activated merely by clicking purchase.\n\n" #
    "## Themes\n\n" #
    "`listThemes()` returns themes with the caller's unlock and applied state. `applyTheme(themeId)` applies a theme the caller may use; " #
    "a premium theme requires an active Ultimate membership and otherwise traps. Admins manage themes with `adminCreateTheme`, " #
    "`adminUpdateTheme` and `adminDeleteTheme`.\n\n" #
    "## Library and website hub\n\n" #
    "`searchResources(filter)` searches and filters the study library; `getResource(id)` fetches one. " #
    "`recordResourceDownload(id)` increments a download count for a signed-in caller. " #
    "`listWebsiteLinks()` returns external educational shortcuts. Admins manage resources and links with the `admin*` methods.\n\n" #
    "## Leaderboards and achievements\n\n" #
    "`getLeaderboard(scope, limit)` ranks students: `#global` by total XP, `#weekly` and `#monthly` by XP earned in the current " #
    "week or month from real session and quest data, and `#friends` by total XP among the caller's friends. " #
    "`addFriend` and `removeFriend` manage the caller's friend list. `listAchievements()` returns the catalogue with the caller's earned state; " #
    "achievements are awarded automatically from real activity and each credits its XP reward once.\n\n" #
    "## Profile and dashboard\n\n" #
    "`createProfile(username, displayName)` creates the caller's profile on first sign-in. `getCallerProfile()` returns it; " #
    "`getProfile(student)` returns a public projection. `updateProfile(displayName, bio)` updates it. " #
    "`setDailyGoal(minutes)` and `getGoal()` manage the daily study goal and streak. " #
    "`getDashboard()` returns the caller's profile, goal, study minutes today and this week, XP today and this week, " #
    "and level progress, all from real session and quest data.\n\n" #
    "## Admin\n\n" #
    "Admin methods require the administrator role and trap with `Unauthorized: Only admins can perform this action` otherwise. " #
    "`adminGetAnalytics()` returns platform analytics; `adminListStudents()` lists students; `adminRemoveStudent(student)` removes one. " #
    "`adminFlagStudent` and `adminClearStudentFlag` moderate leaderboard entries. " #
    "`adminSetMembership(student, tier, expiresAt)` grants or revokes a membership.\n\n" #
    "## Errors and gotchas\n\n" #
    "Guarded methods trap rather than returning an error variant; the trap message states the cause. " #
    "Queries are read-only and never mutate state. Mutating methods are idempotent where noted (finish, claim, purchase) " #
    "and otherwise safe to retry because they reject invalid state. " #
    "OQL exposes queryable tables through `schema()` and `execute(qJson)` for the Data Intelligence agent and the user's own AI assistant.";
  };
};
