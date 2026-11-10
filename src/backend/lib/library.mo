import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Common "../types/common";
import Types "../types/library";

module {
  /// Project a resource for the API boundary.
  public func toView(resource : Types.Resource) : Types.ResourceView {
    {
      id = resource.id;
      title = resource.title;
      description = resource.description;
      category = resource.category;
      subject = resource.subject;
      classLevel = resource.classLevel;
      board = resource.board;
      file = resource.file;
      fileName = resource.fileName;
      downloadCount = resource.downloadCount;
      createdAt = resource.createdAt;
    };
  };

  /// Search and filter library resources.
  public func search(
    resources : Map.Map<Common.Id, Types.Resource>,
    filter : Types.ResourceFilter,
  ) : [Types.ResourceView] {
    let term = switch (filter.searchTerm) {
      case (?t) { t.toLower() };
      case null { "" };
    };
    let matches = resources.values().filter(func(resource) {
      let termOk = term == "" or resource.title.toLower().contains(#text term) or resource.description.toLower().contains(#text term);
      let categoryOk = switch (filter.category) {
        case (?c) { resource.category == c };
        case null { true };
      };
      let subjectOk = switch (filter.subject) {
        case (?s) { resource.subject == s };
        case null { true };
      };
      let classOk = switch (filter.classLevel) {
        case (?cl) { resource.classLevel == cl };
        case null { true };
      };
      let boardOk = switch (filter.board) {
        case (?b) { resource.board == b };
        case null { true };
      };
      termOk and categoryOk and subjectOk and classOk and boardOk;
    });
    matches.map(func(resource) = toView(resource)).toArray();
  };

  /// Fetch one resource.
  public func getResource(
    resources : Map.Map<Common.Id, Types.Resource>,
    resourceId : Common.Id,
  ) : ?Types.ResourceView {
    switch (resources.get(resourceId)) {
      case (?resource) { ?toView(resource) };
      case null { null };
    };
  };

  /// Increment a resource's download count.
  public func recordDownload(
    resources : Map.Map<Common.Id, Types.Resource>,
    resourceId : Common.Id,
  ) : Nat {
    switch (resources.get(resourceId)) {
      case (?resource) {
        let updated : Types.Resource = {
          id = resource.id;
          title = resource.title;
          description = resource.description;
          category = resource.category;
          subject = resource.subject;
          classLevel = resource.classLevel;
          board = resource.board;
          file = resource.file;
          fileName = resource.fileName;
          downloadCount = resource.downloadCount + 1;
          createdAt = resource.createdAt;
        };
        resources.add(resourceId, updated);
        updated.downloadCount;
      };
      case null { 0 };
    };
  };

  /// Create a resource (admin).
  public func createResource(
    resources : Map.Map<Common.Id, Types.Resource>,
    state : { var nextResourceId : Nat },
    title : Text,
    description : Text,
    category : Text,
    subject : Text,
    classLevel : Text,
    board : Text,
    file : Blob,
    fileName : Text,
    now : Common.Timestamp,
  ) : Types.ResourceView {
    let id = state.nextResourceId;
    state.nextResourceId := id + 1;
    let resource : Types.Resource = {
      id;
      title;
      description;
      category;
      subject;
      classLevel;
      board;
      file;
      fileName;
      downloadCount = 0;
      createdAt = now;
    };
    resources.add(id, resource);
    toView(resource);
  };

  /// Update a resource's metadata (admin).
  public func updateResource(
    resources : Map.Map<Common.Id, Types.Resource>,
    resourceId : Common.Id,
    title : Text,
    description : Text,
    category : Text,
    subject : Text,
    classLevel : Text,
    board : Text,
  ) : Types.ResourceView {
    let resource = resources.get(resourceId) ?? Runtime.trap("Resource not found");
    let updated : Types.Resource = {
      id = resource.id;
      title;
      description;
      category;
      subject;
      classLevel;
      board;
      file = resource.file;
      fileName = resource.fileName;
      downloadCount = resource.downloadCount;
      createdAt = resource.createdAt;
    };
    resources.add(resourceId, updated);
    toView(updated);
  };

  /// Delete a resource (admin).
  public func deleteResource(
    resources : Map.Map<Common.Id, Types.Resource>,
    resourceId : Common.Id,
  ) : () {
    resources.remove(resourceId);
  };
};
