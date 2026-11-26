/**
 * A week, opened from a link or from Today.
 *
 * The number comes from the URL, which is why `/week/24` can be texted to a
 * parent. A number that is not a week in the product is answered with the
 * shell's "not here" rather than a blank page.
 */
import { useLocalSearchParams } from "expo-router";
import { Body, Heading, Screen } from "@ninetothree/ui-native";
import { FIRST_WEEK, LAST_WEEK, parseWeekNumber } from "../../src/routes";
import { SkeletonScreen } from "../../src/skeleton-screen";

export default function WeekScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const week = parseWeekNumber(id);

  if (week === null) {
    return (
      <Screen testID="screen-week-missing">
        <Heading level={1}>There is no week here</Heading>
        <Body
          muted
        >{`Weeks run from ${FIRST_WEEK} to ${LAST_WEEK}, and every one of them is on the site too. Open Today for the week you are in.`}</Body>
      </Screen>
    );
  }

  return (
    <SkeletonScreen
      testID="screen-week"
      href={`/week/${week}`}
      issue={153}
      title={`Week ${week}`}
      subtitle="The pack: what is happening, what to do this week, and what can wait."
      steps={[
        "The three things that matter this week, in the order they matter.",
        "Choices with more than one good answer, so you can pick rather than be told.",
        "The warning signs for this week, with the number to call.",
        "Pin anything, and it waits on your shelf.",
      ]}
    />
  );
}
