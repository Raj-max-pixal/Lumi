import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { get, ref as databaseRef, set, update } from "firebase/database";
import { getMetadata, ref as storageRef, uploadBytes } from "firebase/storage";

let environment;
const projectId = "demo-lumi-rules";
const profile = (name) => ({ name, avatar: "https://example.com/avatar.png", username: `@${name.toLowerCase()}` });
const post = (authorId) => ({ authorId, authorName: authorId, caption: "What I learned", createdAt: Date.now() });
const project = (authorId) => ({ authorId, authorName: authorId, title: "Student project", description: "A useful project", websiteUrl: "https://example.com", githubUrl: "https://github.com/example/project", imageUrls: ["https://example.com/thumbnail.png"], hackathonName: "Lumi Hackathon", createdAt: Date.now() });
const team = (ownerId, members = { [ownerId]: true }) => ({ ownerId, ownerName: ownerId, name: "Builders", description: "Learn together", idea: "Build an app", maxMembers: 4, recruiting: true, createdAt: Date.now(), members });
const server = (ownerId, members = { [ownerId]: true }) => ({ ownerId, name: "Coding server", details: "Discuss projects", domain: "Web Development", createdAt: Date.now(), members });
const database = (uid) => uid ? environment.authenticatedContext(uid).database() : environment.unauthenticatedContext().database();
const storage = (uid) => uid ? environment.authenticatedContext(uid).storage() : environment.unauthenticatedContext().storage();

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    database: { rules: readFileSync("database.rules.json", "utf8") },
    storage: { rules: readFileSync("storage.rules", "utf8") }
  });
});
after(async () => { if (environment) await environment.cleanup(); });

test("public discovery is readable; private profiles and root are not", async () => {
  await environment.clearDatabase();
  await assertSucceeds(get(databaseRef(database(), "publicProfiles")));
  await assertSucceeds(get(databaseRef(database(), "hackathon/projects")));
  await assertFails(get(databaseRef(database(), "privateProfiles/alice")));
  await assertFails(get(databaseRef(database(), "/")));
});

test("profiles require the owner and cannot be deleted", async () => {
  await environment.clearDatabase();
  await assertSucceeds(set(databaseRef(database("alice"), "publicProfiles/alice"), profile("Alice")));
  await assertFails(set(databaseRef(database("bob"), "publicProfiles/alice/name"), "Bob"));
  await assertFails(set(databaseRef(database("alice"), "publicProfiles/alice"), null));
  await assertSucceeds(set(databaseRef(database("alice"), "privateProfiles/alice/city"), "Chennai"));
  await assertFails(get(databaseRef(database("bob"), "privateProfiles/alice/city")));
});

test("posts bind author ID; other users can like and comment without editing author data", async () => {
  await environment.clearDatabase();
  await assertSucceeds(set(databaseRef(database("alice"), "community/posts/p1"), post("alice")));
  await assertFails(set(databaseRef(database("bob"), "community/posts/p2"), post("alice")));
  await assertSucceeds(set(databaseRef(database("bob"), "community/posts/p1/likedBy/bob"), true));
  await assertFails(set(databaseRef(database("bob"), "community/posts/p1/likedBy/alice"), true));
  await assertSucceeds(set(databaseRef(database("bob"), "community/posts/p1/comments/c1"), { authorId: "bob", body: "Nice work", createdAt: Date.now() }));
  await assertFails(set(databaseRef(database("bob"), "community/posts/p1/comments/c2"), { authorId: "alice", body: "Forged", createdAt: Date.now() }));
  await assertFails(set(databaseRef(database("bob"), "community/posts/p1/authorName"), "Bob"));
  await assertSucceeds(set(databaseRef(database("alice"), "community/posts/linked"), { ...post("alice"), imageUrl: "https://example.com/picture.png", videoUrl: "" }));
  await assertFails(set(databaseRef(database("alice"), "community/posts/unsafe"), { ...post("alice"), imageUrl: "javascript:alert(1)" }));
});

test("projects permit discovery, owner edits, and scoped reactions", async () => {
  await environment.clearDatabase();
  await assertSucceeds(set(databaseRef(database("alice"), "hackathon/projects/p1"), project("alice")));
  await assertFails(set(databaseRef(database("bob"), "hackathon/projects/p2"), project("alice")));
  await assertSucceeds(set(databaseRef(database("bob"), "hackathon/projects/p1/likedBy/bob"), true));
  await assertFails(update(databaseRef(database("bob"), "hackathon/projects/p1"), { title: "Taken" }));
  await assertSucceeds(update(databaseRef(database("alice"), "hackathon/projects/p1"), { title: "Updated project" }));
  await assertFails(set(databaseRef(database("bob"), "hackathon/projects/p1"), null));
  await assertSucceeds(set(databaseRef(database("alice"), "hackathon/projects/linked"), { ...project("alice"), websiteUrl: "https://lumi-maxmax.vercel.app/", githubUrl: "https://github.com/Raj-max-pixal/Lumi", imageUrls: ["https://example.com/thumbnail.png"] }));
  await assertSucceeds(set(databaseRef(database("alice"), "hackathon/projects/gallery"), { ...project("alice"), imageUrls: ["data:image/jpeg;base64,AA==", "data:image/jpeg;base64,BB=="] }));
  await assertFails(set(databaseRef(database("alice"), "hackathon/projects/unsafe"), { ...project("alice"), imageUrls: ["javascript:alert(1)"] }));
});

test("students can join open teams as themselves and cannot join closed teams", async () => {
  await environment.clearDatabase();
  await assertFails(set(databaseRef(database("alice"), "hackathon/teams/forged"), team("alice", { alice: true, bob: true })));
  await assertSucceeds(set(databaseRef(database("alice"), "hackathon/teams/t1"), team("alice")));
  await assertSucceeds(set(databaseRef(database("bob"), "hackathon/teams/t1/members/bob"), true));
  await assertFails(set(databaseRef(database("eve"), "hackathon/teams/t1/members/cara"), true));
  await assertSucceeds(set(databaseRef(database("alice"), "hackathon/teams/t1/recruiting"), false));
  await assertFails(set(databaseRef(database("cara"), "hackathon/teams/t1/members/cara"), true));
  await assertSucceeds(set(databaseRef(database("alice"), "hackathon/teams/t1/recruiting"), true));
});

test("team conversations stay with members and accept small gallery images", async () => {
  await environment.clearDatabase();
  await assertSucceeds(set(databaseRef(database("alice"), "hackathon/teams/t1"), team("alice")));
  await assertSucceeds(set(databaseRef(database("bob"), "hackathon/teams/t1/members/bob"), true));
  await assertFails(get(databaseRef(database("eve"), "teamMessages/t1")));
  await assertSucceeds(get(databaseRef(database("bob"), "teamMessages/t1")));
  await assertSucceeds(set(databaseRef(database("bob"), "teamMessages/t1/m1"), { authorId: "bob", authorName: "Bob", text: "Hello team", createdAt: Date.now() }));
  await assertSucceeds(set(databaseRef(database("alice"), "teamMessages/t1/m2"), { authorId: "alice", authorName: "Alice", text: "", imageData: "data:image/jpeg;base64,AA==", createdAt: Date.now() }));
  await assertFails(set(databaseRef(database("eve"), "teamMessages/t1/m3"), { authorId: "eve", authorName: "Eve", text: "Intrusion", createdAt: Date.now() }));
  await assertFails(set(databaseRef(database("bob"), "teamMessages/t1/m4"), { authorId: "alice", authorName: "Alice", text: "Forged", createdAt: Date.now() }));
  await assertFails(set(databaseRef(database("bob"), "teamMessages/t1/m5"), { authorId: "bob", authorName: "Bob", text: "", imageData: "javascript:alert(1)", createdAt: Date.now() }));
});

test("servers start with the owner only; members can send their own messages", async () => {
  await environment.clearDatabase();
  await assertFails(set(databaseRef(database("alice"), "hackathon/servers/forged"), server("alice", { alice: true, bob: true })));
  await assertSucceeds(set(databaseRef(database("alice"), "hackathon/servers/s1"), server("alice")));
  await assertSucceeds(set(databaseRef(database("bob"), "hackathon/servers/s1/members/bob"), true));
  await assertSucceeds(set(databaseRef(database("alice"), "hackathon/servers/s1/members/cara"), true));
  await assertSucceeds(set(databaseRef(database("bob"), "hackathon/servers/s1/messages/m1"), { authorId: "bob", authorName: "Bob", text: "Hello", createdAt: Date.now() }));
  await assertSucceeds(set(databaseRef(database("bob"), "hackathon/servers/s1/messages/m-image"), { authorId: "bob", authorName: "Bob", text: "", imageData: "data:image/jpeg;base64,AA==", createdAt: Date.now() }));
  await assertFails(set(databaseRef(database("eve"), "hackathon/servers/s1/messages/m2"), { authorId: "eve", authorName: "Eve", text: "Hello", createdAt: Date.now() }));
});

test("stories accept secure image links and size-limited gallery images", async () => {
  await environment.clearDatabase();
  const story = (mediaUrl) => ({ authorId: "alice", mediaUrl, createdAt: Date.now(), expiresAt: Date.now() + 60000 });
  await assertSucceeds(set(databaseRef(database("alice"), "stories/s1"), story("https://example.com/story.jpg")));
  await assertSucceeds(set(databaseRef(database("alice"), "stories/s2"), story("data:image/jpeg;base64,AA==")));
  await assertFails(set(databaseRef(database("alice"), "stories/s3"), story("javascript:alert(1)")));
  await assertSucceeds(set(databaseRef(database("alice"), "stories/s1"), null));
  await assertFails(set(databaseRef(database("bob"), "stories/s2"), null));
});

test("direct messages are visible only to participants and require the sender UID", async () => {
  await environment.clearDatabase();
  await assertFails(set(databaseRef(database("alice"), "directMessages/alice_bob"), { creatorId: "alice", peerId: "bob", participants: { alice: true, bob: true, eve: true } }));
  await assertSucceeds(set(databaseRef(database("alice"), "directMessages/alice_bob"), { creatorId: "alice", peerId: "bob", participants: { alice: true, bob: true } }));
  await assertSucceeds(get(databaseRef(database("bob"), "directMessages/alice_bob")));
  await assertFails(get(databaseRef(database("eve"), "directMessages/alice_bob")));
  await assertSucceeds(set(databaseRef(database("bob"), "directMessages/alice_bob/messages/m1"), { senderId: "bob", text: "Hi", createdAt: Date.now() }));
  await assertFails(set(databaseRef(database("bob"), "directMessages/alice_bob/messages/m2"), { senderId: "alice", text: "Fake", createdAt: Date.now() }));
});

test("notification sender IDs are authenticated; recipients alone can read", async () => {
  await environment.clearDatabase();
  const notification = { senderId: "alice", title: "New follower", body: "Alice followed you", createdAt: Date.now() };
  await assertSucceeds(set(databaseRef(database("alice"), "notifications/bob/n1"), notification));
  await assertFails(set(databaseRef(database("eve"), "notifications/bob/n2"), notification));
  await assertSucceeds(get(databaseRef(database("bob"), "notifications/bob")));
  await assertFails(get(databaseRef(database("alice"), "notifications/bob")));
});

test("Storage accepts owner images and blocks wrong type, overwrite, and other users", async () => {
  await environment.clearStorage();
  const image = new Uint8Array([137, 80, 78, 71]);
  await assertSucceeds(uploadBytes(storageRef(storage("alice"), "lumi-profiles/alice/avatar.png"), image, { contentType: "image/png" }));
  await assertSucceeds(getMetadata(storageRef(storage("alice"), "lumi-profiles/alice/avatar.png")));
  await assertFails(uploadBytes(storageRef(storage("bob"), "lumi-profiles/alice/other.png"), image, { contentType: "image/png" }));
  await assertFails(uploadBytes(storageRef(storage("alice"), "lumi-profiles/alice/avatar.png"), image, { contentType: "image/png" }));
  await assertFails(uploadBytes(storageRef(storage("alice"), "lumi-profiles/alice/script.svg"), image, { contentType: "image/svg+xml" }));
  await assertFails(uploadBytes(storageRef(storage(), "lumi-profiles/anon/avatar.png"), image, { contentType: "image/png" }));
});
