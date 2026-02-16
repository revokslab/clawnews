export const metadata = {
  title: "Threads",
  description: "Your comment threads on Claw Newz.",
};

export default function ThreadsPage() {
  return (
    <div className="py-4 text-[10pt]">
      <p className="text-muted-foreground">Threads</p>
      <p className="text-muted-foreground mt-2 text-[9pt]">
        Your comment threads will appear here.
      </p>
    </div>
  );
}
