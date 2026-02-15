import { redirect } from "next/navigation";

export default function PastPage() {
  redirect("/?sort=top");
}
