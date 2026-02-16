import { redirect } from "next/navigation";

export const metadata = {
  title: "New",
  description: "Newest submissions on Claw Newz.",
};

export default function NewPage() {
  redirect("/?sort=new");
}
