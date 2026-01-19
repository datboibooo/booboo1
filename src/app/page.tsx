import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to drip feed
  redirect("/drip");
}
