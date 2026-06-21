// Shared Brevo contact-sync helper.
// Routes API calls via Brevo's API directly using the connector-stored
// BREVO_API_KEY. Used for syncing users across these lists:
//   12 - Account Created (No Activity)
//   13 - Current Group Class Students
//   14 - Past Group Class Students (Alumni)

export const BREVO_LIST = {
  ACCOUNT_CREATED: 12,
  CURRENT_STUDENTS_THUR: 13,
  ALUMNI: 14,
  CURRENT_STUDENTS_SAT: 15,
} as const;

/** All "current group class students" lists, regardless of day. */
export const CURRENT_STUDENT_LIST_IDS: number[] = [
  BREVO_LIST.CURRENT_STUDENTS_THUR,
  BREVO_LIST.CURRENT_STUDENTS_SAT,
];

/** Pick the Brevo list for the student's chosen weekly slot. Defaults to Thursday. */
export function currentStudentsListForSlot(slotId: string | null | undefined): number {
  if (slotId === "sat-1100-gmt") return BREVO_LIST.CURRENT_STUDENTS_SAT;
  return BREVO_LIST.CURRENT_STUDENTS_THUR;
}

const BREVO_BASE = "https://api.brevo.com/v3";

function getKey(): string {
  const key = Deno.env.get("BREVO_API_KEY");
  if (!key) throw new Error("BREVO_API_KEY not configured");
  return key;
}

type SyncArgs = {
  email: string;
  name?: string | null;
  marketingOptIn?: boolean; // sets MARKETING_OPT_IN attribute ("Yes"/"No")
  addToLists?: number[];
  removeFromLists?: number[];
};

/**
 * Create or update a Brevo contact, optionally adding/removing list
 * memberships and updating the MARKETING_OPT_IN attribute.
 *
 * Uses the Create/Update Contact API:
 *   POST /v3/contacts with updateEnabled=true
 *   PUT  /v3/contacts/{email} for unlinkListIds (not supported on create)
 */
export async function syncBrevoContact(args: SyncArgs): Promise<void> {
  const email = args.email.trim().toLowerCase();
  if (!email) return;

  const apiKey = getKey();
  const attributes: Record<string, unknown> = {};
  if (args.name) attributes.FIRSTNAME = args.name;
  if (typeof args.marketingOptIn === "boolean") {
    attributes.MARKETING_OPT_IN = args.marketingOptIn ? "Yes" : "No";
  }

  // Step 1: upsert (create or update) — handles add-to-lists + attributes.
  const createBody: Record<string, unknown> = {
    email,
    updateEnabled: true,
  };
  if (Object.keys(attributes).length) createBody.attributes = attributes;
  if (typeof args.marketingOptIn === "boolean") {
    createBody.emailBlacklisted = !args.marketingOptIn;
  }
  if (args.addToLists?.length) createBody.listIds = args.addToLists;

  const createRes = await fetch(`${BREVO_BASE}/contacts`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(createBody),
  });

  if (!createRes.ok && createRes.status !== 204) {
    const errText = await createRes.text().catch(() => "");
    // 400 duplicate_parameter just means contact exists — updateEnabled handles it;
    // anything else is a real failure.
    if (createRes.status !== 400 || !errText.includes("duplicate_parameter")) {
      throw new Error(`Brevo create/update failed [${createRes.status}]: ${errText}`);
    }
  }

  if (typeof args.marketingOptIn === "boolean") {
    const consentRes = await fetch(`${BREVO_BASE}/contacts/${encodeURIComponent(email)}`, {
      method: "PUT",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        attributes,
        emailBlacklisted: !args.marketingOptIn,
      }),
    });
    if (!consentRes.ok && consentRes.status !== 204) {
      const errText = await consentRes.text().catch(() => "");
      throw new Error(`Brevo consent update failed [${consentRes.status}]: ${errText}`);
    }
  }

  // Step 2: remove from lists (separate endpoint).
  if (args.removeFromLists?.length) {
    const updRes = await fetch(
      `${BREVO_BASE}/contacts/${encodeURIComponent(email)}`,
      {
        method: "PUT",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ unlinkListIds: args.removeFromLists }),
      },
    );
    if (!updRes.ok && updRes.status !== 204) {
      const errText = await updRes.text().catch(() => "");
      // 404 = contact doesn't exist in Brevo yet — nothing to unlink.
      if (updRes.status !== 404) {
        throw new Error(`Brevo unlink failed [${updRes.status}]: ${errText}`);
      }
    }
  }
}
