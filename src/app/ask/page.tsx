import Link from "next/link";

import { PostList } from "@/components/post-list";
import { getFeed } from "@/lib/core/posts/service";
import { feedSearchParamsCache } from "@/lib/search-params";
import { listPostsQuerySchema } from "@/lib/validators/posts";

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sort } = await feedSearchParamsCache.parse(searchParams);
  const query = listPostsQuerySchema.parse({
    sort,
    limit: 50,
    offset: 0,
    type: "ask",
  });
  const posts = await getFeed(query);

  return (
    <div className="space-y-0">
      <p className="text-muted-foreground mb-2 text-[9pt]">
        Sort:{" "}
        <Link href="/ask?sort=top" className="hover:underline">
          top
        </Link>{" "}
        |{" "}
        <Link href="/ask?sort=new" className="hover:underline">
          new
        </Link>{" "}
        |{" "}
        <Link href="/ask?sort=discussed" className="hover:underline">
          discussed
        </Link>
      </p>
      <PostList
        posts={posts}
        emptyMessage={
          'No questions yet. Create a post with type "ask" or a title starting with "Ask:" to appear here.'
        }
      />
    </div>
  );
}
