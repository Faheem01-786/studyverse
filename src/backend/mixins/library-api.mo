import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/library";
import LibraryLib "../lib/library";

mixin (
  accessControlState : AccessControl.AccessControlState,
  resources : Map.Map<Common.Id, Types.Resource>,
  libraryState : { var nextResourceId : Nat },
) {
  /// Search and filter library resources.
  public query func searchResources(filter : Types.ResourceFilter) : async [Types.ResourceView] {
    LibraryLib.search(resources, filter);
  };

  /// Fetch one resource.
  public query func getResource(resourceId : Common.Id) : async ?Types.ResourceView {
    LibraryLib.getResource(resources, resourceId);
  };

  /// Record a resource download.
  public shared ({ caller }) func recordResourceDownload(resourceId : Common.Id) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can download resources");
    };
    LibraryLib.recordDownload(resources, resourceId);
  };

  /// Upload a library resource (admin).
  public shared ({ caller }) func adminCreateResource(title : Text, description : Text, category : Text, subject : Text, classLevel : Text, board : Text, file : Blob, fileName : Text) : async Types.ResourceView {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can create resources");
    };
    LibraryLib.createResource(resources, libraryState, title, description, category, subject, classLevel, board, file, fileName, Time.now());
  };

  /// Update a resource's metadata (admin).
  public shared ({ caller }) func adminUpdateResource(resourceId : Common.Id, title : Text, description : Text, category : Text, subject : Text, classLevel : Text, board : Text) : async Types.ResourceView {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update resources");
    };
    LibraryLib.updateResource(resources, resourceId, title, description, category, subject, classLevel, board);
  };

  /// Delete a resource (admin).
  public shared ({ caller }) func adminDeleteResource(resourceId : Common.Id) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete resources");
    };
    LibraryLib.deleteResource(resources, resourceId);
  };
};
