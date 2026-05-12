# unglaze: labeled examples

Six before/after pairs. Three good, three bad. The bad ones illustrate anti-patterns the skill must avoid.

---

## Example 1 (good): PR review output

### Glazy original

> I've completed a thorough review of this pull request and identified several areas that may benefit from further consideration. The implementation appears to be generally sound; however, there are a few concerns worth highlighting. First, the error handling in the `fetchUser` function could potentially be improved by adding more specific error types. Additionally, the test coverage for the new endpoint seems somewhat limited, and it might be worth considering adding tests for edge cases. Finally, I noticed that the documentation has not been updated to reflect the new behavior, which could lead to confusion for future contributors. Please let me know if you have any questions or would like to discuss further.

### Unglazed

- `fetchUser` throws generic `Error` for every failure mode — callers can't distinguish "user not found" from "DB down," which breaks retry logic
- New endpoint has only happy-path tests; missing: empty input, auth failure, rate limit
- Docs still describe the old behavior

### Why this works
- Conclusion first (the three findings).
- No preamble, no closing pleasantry.
- Each bullet names a specific identifier (`fetchUser`, "new endpoint", "Docs") and the concrete problem.
- Hedges removed ("could potentially be improved" → states the actual problem).

---

## Example 2 (good): research summary

### Glazy original

> Based on my research into the various caching strategies available for the user profile service, I'd like to share some findings. There are several options worth considering. Redis is a popular choice and offers excellent performance characteristics, with sub-millisecond latency in most cases. Memcached is another viable option, though it lacks some of the features Redis provides. We could also consider an in-memory LRU cache within the application itself, which would avoid the network hop entirely but would not be shared across instances. Each option has tradeoffs that should be carefully considered before making a decision. Overall, I think Redis is probably the best fit for our use case, given our requirements.

### Unglazed

Recommendation: Redis.

- Redis: sub-ms latency, shared across instances, supports TTL and pub/sub
- Memcached: similar latency, no persistence, no pub/sub — strictly less capable than Redis for this use case
- In-process LRU: zero network hop, but per-instance — cache misses scale with instance count

Pick Redis unless we add a hard requirement Memcached uniquely satisfies.

### Why this works
- Recommendation first.
- Each option gets one line with its actual properties, no hedging.
- Final line gives the decision rule, not a restatement of the recommendation.

---

## Example 3 (good): design doc section

### Glazy original

> ## Authentication Approach
>
> For the authentication system, we've evaluated a number of different approaches and would like to propose a solution that we believe will meet our needs effectively. After careful consideration of the various options, including session-based authentication, JWT-based authentication, and OAuth2-based approaches, we have decided to recommend using JWT tokens with a refresh token rotation strategy. This approach offers a good balance of security and scalability. Tokens will be signed using RS256 and will have a relatively short expiration time of 15 minutes for access tokens and 7 days for refresh tokens. We believe this approach will work well for our use case.

### Unglazed

## Authentication

JWT with refresh token rotation.

- Access token: RS256, 15 min expiry
- Refresh token: 7 day expiry, rotated on each use
- Rejected: session-based (doesn't scale across instances), pure OAuth2 (overkill — we don't federate)

### Why this works
- Decision first, justification second.
- The rejected alternatives appear once with a one-line reason — not as separate paragraphs.
- "We believe this approach will work well" is dropped — pure filler.

---

## Example 4 (BAD): terse-but-still-glazy

This is the anti-pattern: short sentences that still say nothing.

### Glazy original
Same as Example 1.

### Bad rewrite
> The PR has issues. Error handling is suboptimal. Test coverage is insufficient. Documentation is outdated. Consider addressing these.

### Why this fails
- "Suboptimal," "insufficient," "outdated" — glazy adjectives with no specifics.
- No identifier names. Reviewer can't act on this.
- "Consider addressing these" is filler.
- Compare to Example 1's unglazed version — same length, vastly more information.

**Fix:** Name the function. Name the missing test cases. State the actual mismatch.

---

## Example 5 (BAD): punchy-but-lost-info

This anti-pattern drops technical content to achieve brevity.

### Glazy original
Same as Example 2.

### Bad rewrite
> Use Redis. It's faster.

### Why this fails
- Lost the latency numbers ("sub-ms").
- Lost the comparison to Memcached and in-process LRU — reviewer can't tell if alternatives were considered.
- Lost the decision rule ("unless we add a hard requirement Memcached uniquely satisfies").
- "Faster" is vaguer than the original — we lost specificity.

**Fix:** Brevity is not the goal. Information density is. The unglazed version in Example 2 is longer than this bad rewrite, but every line carries new information.

---

## Example 6 (BAD): bullet-spam

This anti-pattern fragments coherent ideas into too many bullets.

### Glazy original
Same as Example 3.

### Bad rewrite
> ## Authentication
>
> - We need authentication
> - We considered options
> - Session-based was one option
> - JWT was another option
> - OAuth2 was a third option
> - We picked JWT
> - JWT uses RS256
> - Access tokens last 15 minutes
> - Refresh tokens last 7 days
> - Refresh tokens rotate
> - This balances security and scalability
> - We think this will work

### Why this fails
- 12 bullets where 4 lines suffice.
- "We need authentication" / "We considered options" / "We think this will work" are filler bullets.
- Splitting "RS256, 15 min expiry" across two bullets fragments a single property.
- Whitespace ≠ punchiness.

**Fix:** One bullet per idea, not one bullet per phrase. See Example 3's unglazed version.

---

## Quick checklist before emitting

- [ ] First line carries the conclusion or top finding
- [ ] No "I'd be happy to" / "Let me" / "In summary" / "Please let me know"
- [ ] Every number, identifier, file path, and negation from the original is present
- [ ] No idea appears twice
- [ ] No bullet is filler ("we need to do this", "this will work")
- [ ] No meta-commentary about the rewrite
- [ ] No closing pleasantry
