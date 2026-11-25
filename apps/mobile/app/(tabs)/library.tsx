import { SkeletonScreen } from "../../src/skeleton-screen";

export default function LibraryScreen() {
  return (
    <SkeletonScreen
      testID="screen-library"
      href="/library"
      issue={154}
      title="Library"
      subtitle="Every pack, every article, searchable in the words you would actually use."
      steps={[
        "Browse by stage: pregnancy weeks, the fourth trimester, infancy, toddler months.",
        'Search that matches "can\'t sleep" and "milk supply", not just titles.',
        "Each result opens the same reading page the web serves.",
      ]}
    />
  );
}
