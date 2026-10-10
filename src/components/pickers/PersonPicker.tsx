import { useEffect, useId, useRef, useState } from "react";
import { Loader2, User, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userLabel } from "@/lib/userLabel";
import { gqlRequest } from "@/services/networks/graphql/events/eventNetworkingTransport";

/**
 * A person found by the picker. Display data only; `id` travels back to the
 * server behind the scenes and is never rendered.
 */
export interface PersonSearchResult {
  id: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
}

const MIN_LENGTH = 2;
const LIMIT = 8;

const SEARCH = `
  query SearchUserSummaries($query: String!, $limit: Int) {
    searchUserSummaries(query: $query, limit: $limit) { id displayName username avatarUrl }
  }
`;

async function searchPeople(query: string): Promise<PersonSearchResult[]> {
  const data = await gqlRequest<{ searchUserSummaries: PersonSearchResult[] | null }>(SEARCH, { query, limit: LIMIT });
  return (data.searchUserSummaries ?? []).filter((p) => Boolean(p?.id));
}

const nameOf = (p: PersonSearchResult) => userLabel({ name: p.displayName, username: p.username }, "Unknown person");

export interface PersonPickerProps {
  value: PersonSearchResult | null;
  onChange: (person: PersonSearchResult | null) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/** Pick a person by name or @username. Shows name, @username and avatar — never an id. */
export function PersonPicker({ value, onChange, label = "Find a person", disabled, className }: PersonPickerProps) {
  const inputId = useId();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<PersonSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const q = term.trim();
    if (q.length < MIN_LENGTH) {
      setResults([]);
      setFailed(false);
      return;
    }
    const mine = ++seq.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setFailed(false);
      try {
        const found = await searchPeople(q);
        if (mine === seq.current) setResults(found);
      } catch {
        if (mine === seq.current) { setResults([]); setFailed(true); }
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [term]);

  if (value) {
    const name = nameOf(value);
    return (
      <div className={className}>
        <Label>{label}</Label>
        <div className="mt-1 flex items-center justify-between gap-3 rounded-md border border-border p-2">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-8 w-8">
              {value.avatarUrl && <AvatarImage src={value.avatarUrl} alt="" />}
              <AvatarFallback className="bg-primary/10 text-primary"><User className="h-4 w-4" aria-hidden="true" /></AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              {value.username && name !== `@${value.username}` && <p className="truncate text-xs text-muted-foreground">@{value.username}</p>}
            </div>
          </div>
          <button type="button" aria-label="Clear selection" disabled={disabled} className="rounded p-1 hover:bg-accent" onClick={() => { onChange(null); setTerm(""); }}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Label htmlFor={inputId}>{label}</Label>
      <Input id={inputId} className="mt-1" placeholder="Search by name or @username" value={term} disabled={disabled} autoComplete="off" onChange={(e) => setTerm(e.target.value)} />
      <div aria-live="polite" className="mt-1 text-xs text-muted-foreground">
        {term.trim().length < MIN_LENGTH ? `Type at least ${MIN_LENGTH} characters.`
          : loading ? (<span className="inline-flex items-center"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Searching…</span>)
          : failed ? "Search is unavailable right now."
          : results.length === 0 ? "No one found." : `${results.length} found.`}
      </div>
      {results.length > 0 && (
        <ul role="listbox" aria-label="People" className="mt-1 max-h-56 overflow-y-auto rounded-md border border-border">
          {results.map((p) => (
            <li key={p.id} role="option" aria-selected="false">
              <button type="button" className="flex w-full items-center gap-3 p-2 text-left hover:bg-accent" onClick={() => { onChange(p); setResults([]); }}>
                <Avatar className="h-8 w-8">
                  {p.avatarUrl && <AvatarImage src={p.avatarUrl} alt="" />}
                  <AvatarFallback className="bg-primary/10 text-primary"><User className="h-4 w-4" aria-hidden="true" /></AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{nameOf(p)}</p>
                  {p.username && nameOf(p) !== `@${p.username}` && <p className="truncate text-xs text-muted-foreground">@{p.username}</p>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
