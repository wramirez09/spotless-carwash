# Outstanding Items — Client Content Review

Items that need client clarification before they can be implemented. References to `documents/feedback.txt` line numbers.

## 1. Per-package wash details (feedback line 20)

> "Get more details about each wash details"

We renamed/renumbered/recolored the four wash packages (8 Deluxe-No-Dryer / 9 Deluxe / 10 Ultimate / 12 Lustre), but the per-tier feature bullets in [src/data/washes.ts](../src/data/washes.ts) are still placeholders we carried over from the old tiers. **Need from client:** the actual feature list for each tier (what's included at $8, $9, $10, $12). Will update both the data file and the FAQ once supplied.

## 2. How-to steps 2 & 3 (feedback lines 24–28)

The feedback gives step 1 ("tap, card, cash, token — Apple Pay") and step 4 ("check the countdown timer straight ahead"), but steps 2 and 3 are partial:

```
1- tap, card, cash, token - Apple Pay
2-
3- and in there put car in park
4- check the countdown timer straight ahead
```

**Need from client:** full text for steps 2 and 3. Once supplied, will update [src/components/How.tsx](../src/components/How.tsx). The "Hit the RED STOP signal and put your car in park" line (feedback line 22) likely belongs to step 3 — please confirm.

## 3. Featured wash tier

The site has historically marked one tier as "Most picked" — that was Spotless ($13). We defaulted the featured tier to **Ultimate (10)** since it sits in the middle and is the new token-redemption tier. **Need from client:** confirm Ultimate is the right tier to feature, or pick another.

## 4. Token redemption value

Tokens previously redeemed for the $13 Spotless wash. With the new tier structure, we've mapped tokens to **Ultimate ($10)**. **Need from client:** confirm token = Ultimate, or specify a different mapping. Affects:
- [src/components/Tokens.tsx](../src/components/Tokens.tsx) hero copy
- [src/data/faq.ts](../src/data/faq.ts) two FAQ answers
- Token pack pricing math (currently 10-pack $85 saves $5 vs 10× $9 = $90; 25-pack $200 saves $50 vs 25× $10 = $250 — savings copy may need adjustment)

## 5. Site-age framing (feedback line 35)

> "Nothing needs to be said about a newer site- both sites built in 90s- 1995 and 1998"

We removed the `isNew` flag and per-location year attributions everywhere. **Need from client:** confirm whether to add a "since the 90s" line anywhere (e.g., footer, About, hero), or leave year language out entirely.

## 6. "How it works" / countdown timer copy

The current [src/components/How.tsx](../src/components/How.tsx) has 4 steps that overlap with feedback lines 22–28 but use different language. Once steps 2 & 3 are supplied (item 2 above), do a full pass on this component to align with the kiosk experience the client describes.
