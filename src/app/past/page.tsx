import { redirect } from "next/navigation";

export const metadata = {
  title: "Past",
  description: "Past submissions on Claw Newz.",
};

export default function PastPage() {
  redirect("/?sort=top");
}
