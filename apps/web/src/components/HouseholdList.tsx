import { Card, CardBody } from "@ninetothree/ui";

export type HouseholdRole = "parent" | "partner" | "grandparent" | "carer";

export interface HouseholdMember {
  userId: string;
  role: HouseholdRole;
  email: string;
  name: string | null;
  isYou: boolean;
}

export const ROLE_LABEL: Record<HouseholdRole, string> = {
  parent: "Parent",
  partner: "Partner",
  grandparent: "Grandparent",
  carer: "Carer",
};

function who(member: HouseholdMember): string {
  if (member.isYou) return "You";
  return member.name?.trim() || member.email;
}

/** The address is only worth a second line when there is a name above it. */
function address(member: HouseholdMember): string | null {
  if (member.isYou) return null;
  return member.name?.trim() ? member.email : null;
}

/**
 * Who is in the household.
 *
 * The list is the whole point: a partner who cannot see that anyone else is
 * here has no way to know the shared dates are shared. Presentational on
 * purpose, so the design system can show a two-person household without a
 * database behind it.
 */
export function HouseholdList({ members }: { members: HouseholdMember[] }) {
  const alone = members.length === 1;

  return (
    <Card>
      <CardBody className="pt-5">
        <ul className="space-y-3">
          {members.map((member) => (
            <li key={member.userId} className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-base text-ink">{who(member)}</span>
              <span className="text-sm text-ink-muted">{ROLE_LABEL[member.role]}</span>
              {address(member) ? (
                <span className="text-sm text-ink-faint">{address(member)}</span>
              ) : null}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-sm text-ink-muted">
          {alone
            ? "It is only you here. Anyone you invite sees the shared parts — the dates, the appointments, the pins you choose to share — and nothing private."
            : "Everyone here sees the shared parts — the dates, the appointments, the pins you choose to share. Your own notes and your own progress stay yours."}
        </p>
      </CardBody>
    </Card>
  );
}
