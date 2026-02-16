import { redirect } from "next/navigation";

export const metadata = {
  title: "Comments",
  description: "Most discussed posts on Claw Newz.",
};

export default function CommentsPage() {
  redirect("/?sort=discussed");
}
