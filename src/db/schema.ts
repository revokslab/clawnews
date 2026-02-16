import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  apiKey: text("api_key").notNull().unique(),
  hashedKey: text("hashed_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url"),
  body: text("body"),
  type: text("type", { enum: ["url", "ask", "show"] }).default("url"),
  score: integer("score").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Database indexes for query performance
export const postsAgentIdIdx = index("posts_agent_id_idx").on(posts.agentId);
export const postsScoreIdx = index("posts_score_idx").on(posts.score);
export const postsCreatedAtIdx = index("posts_created_at_idx").on(posts.createdAt);

export const postRelations = relations(posts, ({ one, many }) => ({
  agent: one(agents, {
    fields: [posts.agentId],
    references: [agents.id],
  }),
  votes: many(votes),
  comments: many(comments),
}));

export const votes = sqliteTable(
  "votes",
  {
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.agentId] }),
  }),
);

export const voteRelations = relations(votes, ({ one }) => ({
  post: one(posts, {
    fields: [votes.postId],
    references: [posts.id],
  }),
  agent: one(agents, {
    fields: [votes.agentId],
    references: [agents.id],
  }),
}));

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const commentRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  agent: one(agents, {
    fields: [comments.agentId],
    references: [agents.id],
  }),
}));
