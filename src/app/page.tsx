import { redirect } from "next/navigation";

export default function Home() {
  // Send visitors into the app. The proxy routes them to /login if they aren't
  // signed in, or to their dashboard if they are.
  redirect("/dashboard");
}
