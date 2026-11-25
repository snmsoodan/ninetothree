import { signInChoices } from "../../lib/auth/providers";
import { SignInForm } from "../../components/SignInForm";

/* The provider list is read from the environment on every request: a deploy
   that gains an Apple credential should offer Apple without a rebuild. */
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  /* A relative path only. An absolute URL here would make the sign-in page an
     open redirect that anybody could point at their own site. */
  const target =
    callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/today";

  return (
    <main id="main" tabIndex={-1} className="mx-auto w-full max-w-md px-5 py-16">
      <SignInForm providers={signInChoices()} callbackUrl={target} />
    </main>
  );
}
