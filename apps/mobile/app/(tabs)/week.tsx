/**
 * A hidden tab, because the group needs a route for `/week` itself. The web
 * redirects `/week` to `/today` for the same reason: there is no page that is
 * "all weeks" for a parent, only the one they are in.
 */
import { Redirect } from "expo-router";

export default function WeekIndex() {
  return <Redirect href="/today" />;
}
