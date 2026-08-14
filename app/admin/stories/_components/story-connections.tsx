"use client";

import { useActionState } from "react";

import {
  formatRelationshipValue,
  placeRelationshipTypes,
  sourceRoles,
  type StoryRelationshipType,
  themeRelevances,
} from "@/app/_lib/editorial/relationship";
import type {
  PlaceCandidate,
  SourceCandidate,
  StoryPlaceConnection,
  StoryRelationshipWorkspace,
  StorySourceConnection,
  StoryThemeConnection,
  ThemeCandidate,
} from "@/app/_lib/editorial/relationships-server";
import { SubmitButton } from "@/app/admin/_components/submit-button";
import {
  createStoryRelationshipAction,
  deleteStoryRelationshipAction,
  updateStoryRelationshipAction,
} from "@/app/admin/stories/relationship-actions";
import { initialRelationshipActionState } from "@/app/admin/stories/relationship-action-state";

type Candidate = SourceCandidate | PlaceCandidate | ThemeCandidate;

function candidateLabel(candidate: Candidate) {
  if ("original_title" in candidate) {
    return candidate.original_title || `Untitled ${candidate.source_type}`;
  }
  return candidate.name;
}

function connectionSummary(
  connection: StoryPlaceConnection | StorySourceConnection | StoryThemeConnection,
) {
  const values: string[] = [];
  if ("source_role" in connection) {
    values.push(`Role: ${formatRelationshipValue(connection.source_role)}`);
  } else if ("relationship_type" in connection) {
    values.push(
      `Relationship: ${formatRelationshipValue(connection.relationship_type)}`,
    );
  } else {
    values.push(`Relevance: ${formatRelationshipValue(connection.relevance)}`);
  }
  if ("is_primary" in connection && connection.is_primary) {
    values.push("Primary");
  }
  values.push(`Display order: ${connection.display_order}`);
  return values.join(" · ");
}

function PublishedConfirmation({ published }: { published: boolean }) {
  return published ? (
    <label className="admin-confirmation">
      <input
        name="confirm_published_relationship"
        required
        type="checkbox"
        value="confirm-published-relationship"
      />
      <span>
        I confirm this connection change should affect the published Story.
      </span>
    </label>
  ) : null;
}

function RelationshipFields({
  connection,
  relationshipType,
}: {
  connection?: StoryPlaceConnection | StorySourceConnection | StoryThemeConnection;
  relationshipType: StoryRelationshipType;
}) {
  return (
    <div className="admin-connection-fields">
      {relationshipType === "story_sources" ? (
        <label className="admin-field">
          <span>Source role</span>
          <select
            defaultValue={
              connection && "source_role" in connection
                ? connection.source_role
                : "supporting"
            }
            name="source_role"
          >
            {sourceRoles.map((value) => (
              <option key={value} value={value}>
                {formatRelationshipValue(value)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {relationshipType === "story_places" ? (
        <>
          <label className="admin-field">
            <span>Place relationship</span>
            <select
              defaultValue={
                connection && "relationship_type" in connection
                  ? connection.relationship_type
                  : "featured"
              }
              name="place_relationship_type"
            >
              {placeRelationshipTypes.map((value) => (
                <option key={value} value={value}>
                  {formatRelationshipValue(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-confirmation admin-connection-primary">
            <input
              defaultChecked={
                Boolean(connection && "is_primary" in connection && connection.is_primary)
              }
              name="is_primary"
              type="checkbox"
              value="true"
            />
            <span>Primary Place</span>
          </label>
        </>
      ) : null}

      {relationshipType === "story_themes" ? (
        <label className="admin-field">
          <span>Theme relevance</span>
          <select
            defaultValue={
              connection && "relevance" in connection
                ? connection.relevance
                : "related"
            }
            name="theme_relevance"
          >
            {themeRelevances.map((value) => (
              <option key={value} value={value}>
                {formatRelationshipValue(value)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="admin-field">
        <span>Display order</span>
        <input
          defaultValue={connection?.display_order ?? 0}
          max={10_000}
          min={0}
          name="display_order"
          required
          type="number"
        />
      </label>
    </div>
  );
}

function AddRelationshipForm({
  candidates,
  published,
  relationshipType,
  storyId,
}: {
  candidates: Candidate[];
  published: boolean;
  relationshipType: StoryRelationshipType;
  storyId: string;
}) {
  const [state, action] = useActionState(
    createStoryRelationshipAction,
    initialRelationshipActionState,
  );

  if (candidates.length === 0) {
    return <p>No unconnected candidate is available in the first 200 records.</p>;
  }

  return (
    <form action={action} className="admin-workflow-form admin-connection-form">
      <input name="story_id" type="hidden" value={storyId} />
      <input name="relationship_type" type="hidden" value={relationshipType} />
      <label className="admin-field">
        <span>Existing record</span>
        <select name="related_id" required>
          <option value="">Choose a record</option>
          {candidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidateLabel(candidate)}
            </option>
          ))}
        </select>
      </label>
      <RelationshipFields relationshipType={relationshipType} />
      <PublishedConfirmation published={published} />
      {state.status === "error" ? (
        <p className="admin-form-message admin-form-message-error" role="alert">
          {state.message}
        </p>
      ) : null}
      <SubmitButton label="Add connection" pendingLabel="Adding…" />
    </form>
  );
}

function EditRelationshipForm({
  connection,
  published,
  relatedId,
  relationshipType,
  storyId,
}: {
  connection: StoryPlaceConnection | StorySourceConnection | StoryThemeConnection;
  published: boolean;
  relatedId: string;
  relationshipType: StoryRelationshipType;
  storyId: string;
}) {
  const [state, action] = useActionState(
    updateStoryRelationshipAction,
    initialRelationshipActionState,
  );

  return (
    <form action={action} className="admin-form admin-connection-edit-form">
      <input name="story_id" type="hidden" value={storyId} />
      <input name="related_id" type="hidden" value={relatedId} />
      <input name="relationship_type" type="hidden" value={relationshipType} />
      <input name="lock_version" type="hidden" value={connection.lock_version} />
      <RelationshipFields
        connection={connection}
        relationshipType={relationshipType}
      />
      <PublishedConfirmation published={published} />
      {state.status === "error" ? (
        <p className="admin-form-message admin-form-message-error" role="alert">
          {state.message}
        </p>
      ) : null}
      <SubmitButton label="Save connection" pendingLabel="Saving…" />
    </form>
  );
}

function DeleteRelationshipForm({
  connection,
  published,
  relatedId,
  relationshipType,
  storyId,
}: {
  connection: StoryPlaceConnection | StorySourceConnection | StoryThemeConnection;
  published: boolean;
  relatedId: string;
  relationshipType: StoryRelationshipType;
  storyId: string;
}) {
  const [state, action] = useActionState(
    deleteStoryRelationshipAction,
    initialRelationshipActionState,
  );

  return (
    <form action={action} className="admin-workflow-form admin-connection-delete-form">
      <input name="story_id" type="hidden" value={storyId} />
      <input name="related_id" type="hidden" value={relatedId} />
      <input name="relationship_type" type="hidden" value={relationshipType} />
      <input name="lock_version" type="hidden" value={connection.lock_version} />
      <label className="admin-confirmation">
        <input
          name="confirm_removal"
          required
          type="checkbox"
          value="confirm-removal"
        />
        <span>Remove this connection without deleting the related record.</span>
      </label>
      <PublishedConfirmation published={published} />
      {state.status === "error" ? (
        <p className="admin-form-message admin-form-message-error" role="alert">
          {state.message}
        </p>
      ) : null}
      <SubmitButton label="Remove connection" pendingLabel="Removing…" />
    </form>
  );
}

function ConnectionGroup({
  canManage,
  candidates,
  connections,
  getLabel,
  getRelatedId,
  label,
  published,
  relationshipType,
  storyId,
}: {
  canManage: boolean;
  candidates: Candidate[];
  connections: Array<StoryPlaceConnection | StorySourceConnection | StoryThemeConnection>;
  getLabel: (connection: StoryPlaceConnection | StorySourceConnection | StoryThemeConnection) => string;
  getRelatedId: (connection: StoryPlaceConnection | StorySourceConnection | StoryThemeConnection) => string;
  label: string;
  published: boolean;
  relationshipType: StoryRelationshipType;
  storyId: string;
}) {
  const connectedIds = new Set(connections.map(getRelatedId));
  const available = candidates.filter((candidate) => !connectedIds.has(candidate.id));

  return (
    <section className="admin-connection-group">
      <header>
        <h3>{label}</h3>
        <p>{connections.length} connected</p>
      </header>
      {connections.length === 0 ? <p>No {label.toLowerCase()} connected.</p> : null}
      <div className="admin-connection-list">
        {connections.map((connection) => {
          const relatedId = getRelatedId(connection);
          return (
            <article className="admin-connection-card" key={relatedId}>
              <header>
                <h4>{getLabel(connection)}</h4>
                <span>Version {connection.lock_version}</span>
              </header>
              <p>{connectionSummary(connection)}</p>
              {canManage ? (
                <>
                  <EditRelationshipForm
                    connection={connection}
                    published={published}
                    relatedId={relatedId}
                    relationshipType={relationshipType}
                    storyId={storyId}
                  />
                  <DeleteRelationshipForm
                    connection={connection}
                    published={published}
                    relatedId={relatedId}
                    relationshipType={relationshipType}
                    storyId={storyId}
                  />
                </>
              ) : (
                <p>This connection is read-only in the current session.</p>
              )}
            </article>
          );
        })}
      </div>
      {canManage ? (
        <div className="admin-connection-add">
          <h4>Add existing {label.slice(0, -1)}</h4>
          <AddRelationshipForm
            candidates={available}
            published={published}
            relationshipType={relationshipType}
            storyId={storyId}
          />
        </div>
      ) : null}
    </section>
  );
}

export function StoryConnections({
  canManage,
  storyId,
  published,
  workspace,
}: {
  canManage: boolean;
  published: boolean;
  storyId: string;
  workspace: StoryRelationshipWorkspace;
}) {
  return (
    <div className="admin-connections">
      <p className="admin-connection-guidance">
        Primary Source and Place are unique. Demote the current primary before
        promoting another connection. Candidate lists are bounded to 200 active
        records; existing connections always remain visible.
      </p>
      <ConnectionGroup
        canManage={canManage}
        candidates={workspace.candidates.sources}
        connections={workspace.sources}
        getLabel={(connection) =>
          "source" in connection
            ? connection.source.original_title || connection.source.source_type
            : "Source"
        }
        getRelatedId={(connection) =>
          "source_id" in connection ? connection.source_id : ""
        }
        label="Sources"
        published={published}
        relationshipType="story_sources"
        storyId={storyId}
      />
      <ConnectionGroup
        canManage={canManage}
        candidates={workspace.candidates.places}
        connections={workspace.places}
        getLabel={(connection) =>
          "place" in connection ? connection.place.name : "Place"
        }
        getRelatedId={(connection) =>
          "place_id" in connection ? connection.place_id : ""
        }
        label="Places"
        published={published}
        relationshipType="story_places"
        storyId={storyId}
      />
      <ConnectionGroup
        canManage={canManage}
        candidates={workspace.candidates.themes}
        connections={workspace.themes}
        getLabel={(connection) =>
          "theme" in connection ? connection.theme.name : "Theme"
        }
        getRelatedId={(connection) =>
          "theme_id" in connection ? connection.theme_id : ""
        }
        label="Themes"
        published={published}
        relationshipType="story_themes"
        storyId={storyId}
      />
    </div>
  );
}
