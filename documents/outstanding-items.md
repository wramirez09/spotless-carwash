# Outstanding Items — Client Content Review

Items still needing client input. References to `documents/feedback.txt` line numbers.

## 1. Per-package wash details (feedback line 20)

> "Get more details about each wash details"

Wash packages are renamed/renumbered/recolored (8 Deluxe-No-Dryer / 9 Deluxe / 10 Ultimate / 12 Lustre), but the per-tier feature bullets in [src/data/washes.ts](../src/data/washes.ts) are still placeholders carried over from the old tiers. **Need from client:** the actual feature list for each tier — what's included at $8, $9, $10, $12. Will update both the data file and the FAQ once supplied.

## 2. How-to steps 2 & 3 (feedback lines 24–28)

The feedback gives step 1 ("tap, card, cash, token — Apple Pay") and step 4 ("check the countdown timer straight ahead"), but steps 2 and 3 are partial:

```
1- tap, card, cash, token - Apple Pay
2-
3- and in there put car in park
4- check the countdown timer straight ahead
```

**Need from client:** full text for steps 2 and 3. Once supplied, will update [src/components/How.tsx](../src/components/How.tsx). The "Hit the RED STOP signal and put your car in park" line (feedback line 22) likely belongs to step 3 — please confirm.

## 3. Token redemption value

Tokens previously redeemed for the $13 Spotless wash. With the new tier structure, we've mapped tokens to **Ultimate ($10)** as a placeholder. **Need from client:** confirm token = Ultimate, or specify a different mapping. Affects:
- [src/components/Tokens.tsx](../src/components/Tokens.tsx) hero copy
- [src/data/faq.ts](../src/data/faq.ts) two FAQ answers
- Token pack pricing math (currently 10-pack $85 saves $5 vs 10× $9 = $90; 25-pack $200 saves $50 vs 25× $10 = $250 — savings copy may need adjustment depending on which tier tokens redeem for)

## 4. "How it works" / countdown timer copy

The current [src/components/How.tsx](../src/components/How.tsx) has 4 steps that overlap with feedback lines 22–28 but use different language. Once steps 2 & 3 are supplied (item 2 above), do a full pass on this component to align with the kiosk experience the client describes.

---

## Resolved this pass

- **Featured tier**: set to Deluxe ($9 / Green). Marked in [src/data/washes.ts](../src/data/washes.ts).
- **Site-age framing**: "Since the 90s" added to Hero pre-headline tag (no per-location year attribution). `isNew` flag and "since 1998" copy removed from all other surfaces.
