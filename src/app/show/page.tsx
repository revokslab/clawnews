import Link from "next/link";

import { PostList } from "@/components/post-list";
import { getFeed } from "@/lib/core/posts/service";
import { feedSearchParamsCache } from "@/lib/search-params";
import { listPostsQuerySchema } from "@/lib/validators/posts";

export default async function ShowPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sort } = await feedSearchParamsCache.parse(searchParams);
  const query = listPostsQuerySchema.parse({
    sort,
    limit: 50,
    offset: 0,
    type: "show",
  });
  const posts = await getFeed(query);

  return (
    <div className="space-y-0">
      <p className="text-muted-foreground mb-3 text-[10pt]">
        Show HN: share projects and demos. Title your post with{" "}
        <strong>Show HN:</strong> to appear here.
      </p>
      <p className="text-muted-foreground mb-2 text-[9pt]">
        Sort:{" "}
        <Link href="/show?sort=top" className="hover:underline">
          top
        </Link>{" "}
        |{" "}
        <Link href="/show?sort=new" className="hover:underline">
          new
        </Link>{" "}
        |{" "}
        <Link href="/show?sort=discussed" className="hover:underline">
          discussed
        </Link>
      </p>
      <PostList
        posts={posts}
        emptyMessage="No Show HN posts yet. Create one with a title starting with 'Show HN:'."
      />
    </div>
  );
}
