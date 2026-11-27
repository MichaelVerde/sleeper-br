Here is a comprehensive handoff you can paste into another agent. It covers the league configuration, API endpoints, team mappings, weekly recap preferences, historical standings, keeper investigation, and accuracy requirements.

# Fantasy Football League — Agent Handoff

## 1. Project overview

This project is for managing, analyzing and producing entertaining weekly recaps of a private Sleeper NFL fantasy football league.

The primary recurring task is producing ruthless, funny, factually accurate weekly league recaps suitable for posting directly into the league group chat.

Other tasks include:

- Trade analysis and grading.
- Keeper eligibility and value analysis.
- Draft analysis.
- Playoff race analysis.
- Historical scoring and standings comparisons.
- Start/sit analysis.
- FAAB spending and waiver-wire analysis.

## 2. League configuration

- **League name:** Touchdown My Pants 3.0
- **Platform:** Sleeper
- **Season:** 2026
- **League ID:** `1382842376132755456`
- **Draft ID:** `1382842376145350656`
- **Teams:** 12
- **Scoring:** Half-PPR
- **Draft:** 15-round snake
- **Starting FAAB:** 1,000
- **Keeper league:** Yes
- **Keeper cost:** One round earlier than the player's previous draft round, with a Round 6 keeper-cost constraint. Confirm the precise application of this constraint before calculating future keeper eligibility.

### Starting lineup

1. QB
2. RB
3. RB
4. WR
5. WR
6. TE
7. FLEX
8. K
9. DST

Six bench positions, with additional reserve functionality.

The playoff format has not been explicitly confirmed. Previous recaps assumed six playoff teams. Do not assume the playoff start week or declare teams mathematically eliminated without checking league settings and remaining schedules.

## 3. Sleeper API endpoints

Base URL: `https://api.sleeper.app/v1`

### League information

`https://api.sleeper.app/v1/league/1382842376132755456`

Contains league settings, playoff configuration and previous league ID.

### Weekly matchups

`https://api.sleeper.app/v1/league/1382842376132755456/matchups/{week}`

Contains:

- Roster ID
- Matchup ID
- Total points
- Custom points
- Starting player IDs
- Individual starter scores
- All rostered player scores

Match teams using identical `matchup_id` values.

If `custom_points` is populated, investigate whether it overrides the normal matchup score.

### Current standings and rosters

`https://api.sleeper.app/v1/league/1382842376132755456/rosters`

Contains:

- Owner IDs
- Roster IDs
- Wins and losses
- Points for and against
- Potential points
- FAAB usage
- Winning and losing streaks
- Current players
- Current starters
- Reserve players

### Weekly transactions

`https://api.sleeper.app/v1/league/1382842376132755456/transactions/{week}`

Contains:

- Trades
- Successful waiver claims
- Failed waiver claims
- FAAB bids
- FAAB transfers
- Free-agent additions
- Drops
- Transaction timestamps

Only completed transactions should be treated as executed.

Check timestamps because a transaction assigned to a particular Sleeper week can occur after that week's games have concluded.

### Updated team names

`https://api.sleeper.app/v1/league/1382842376132755456/users`

Join `user_id` to roster `owner_id`.

Use `metadata.team_name`, falling back to `display_name` when necessary.

Team names change throughout the season.

### Draft information

`https://api.sleeper.app/v1/league/1382842376132755456/drafts`

`https://api.sleeper.app/v1/draft/1382842376145350656`

`https://api.sleeper.app/v1/draft/1382842376145350656/picks`

### NFL player database

`https://api.sleeper.app/v1/players/nfl`

This is a large JSON response mapping Sleeper player IDs to names, positions and player metadata.

Cache this data where possible. The 2026 draft picks response also contains names and positions for all 180 drafted players.

### Typical weekly workflow

When the user says "new week, new recap" or asks for the queries, provide clickable links for:

1. Latest completed week's matchups.
2. Current rosters.
3. Latest completed week's transactions.

Optionally request users if team names have changed, and league settings if playoff rules need verification.

The user normally opens these endpoints and pastes the JSON responses into ChatGPT because direct API retrieval has been unreliable.

## 4. Team and manager mappings

These mappings are essential. Roster ID is NOT the same as draft position.

| Roster ID | Current team name        | Manager         | Draft slot |
| --------- | ------------------------ | --------------- | ---------- |
| 1         | Jaggin’ Goff             | SaroopPeetamber | 2          |
| 2         | Michelle Poplas Fan Club | Tomparr         | 7          |
| 3         | Golden’s Girls           | alistar420      | 9          |
| 4         | I Gibbs zero Bucks       | michaelverde2   | 1          |
| 5         | Puka Shell Necklace      | griffmoore47    | 12         |
| 6         | Frank Gore Family Jewels | ronhanderson    | 5          |
| 7         | Soy Sheldon              | soyjimmer       | 3          |
| 8         | Gav's Not So Groovy Team | GavKerr         | 6          |
| 9         | No Roof, Nice Doorbell   | berrysauce34    | 11         |
| 10        | Shough and Awe           | TannedMario     | 10         |
| 11        | For the Love of the Game | JayParmar1023   | 4          |
| 12        | aronv                    | aronv           | 8          |

The user manages roster 4.

JayParmar1023 is the league commissioner.

### Owner IDs

| Roster ID | Owner ID              |
| --------- | --------------------- |
| 1         | `617826255089238016`  |
| 2         | `1001537883003527168` |
| 3         | `1130697691425738752` |
| 4         | `1131463867114250240` |
| 5         | `1132354103486590976` |
| 6         | `1208133333142208512` |
| 7         | `1047676380575711232` |
| 8         | `1132363061777743872` |
| 9         | `486689331822456832`  |
| 10        | `1131787508204933120` |
| 11        | `1019353852707184640` |
| 12        | `1132777153214431232` |

### Historical team names

- Jaggin’ Goff was previously Boutte Call.
- Golden’s Girls was previously Shadow Force.
- I Gibbs zero Bucks was previously Gibbs me a break.
- Gav's Not So Groovy Team was previously Bo Dix 💩.
- Shough and Awe was previously Saquon my pickens.

Use current names in new recaps.

## 5. Weekly recap preferences

The user wants a single, polished, copyable group-chat post.

### Preferred structure

1. Funny headline and brief introduction highlighting the week's biggest developments.
2. Six matchup-by-matchup roasts, with actual final scores.
3. Transaction desk covering interesting trades and waiver decisions.
4. Playoff race, especially later in the season.
5. Weekly awards.
6. Short, ruthless closing punchline.

### Tone

- Ruthless, sarcastic and creative.
- Group-chat banter between friends.
- Willing to roast every manager, including the user's own team.
- Specific jokes grounded in actual results.
- Avoid generic fantasy football analysis.
- Avoid excessive repetition of previous weeks' jokes.
- Do not simply repeat historical draft grades or season-long summaries.
- Focus primarily on what happened THIS week.
- Use historical context when it makes a current result funnier.
- Use player names rather than numeric Sleeper IDs whenever possible.

### Important accuracy requirements

Previous agents have made mistakes with player IDs, start/sit comparisons, streak lengths and matchup pairings. Be especially careful.

- Match opponents by matchup ID, not array order.
- Join team names using roster and owner IDs.
- Use actual weekly starters from the matchup endpoint, NOT the current starters from the roster endpoint.
- Validate player positions before suggesting substitutions.
- A quarterback cannot replace a flex or receiver.
- Account for injuries, bye weeks, reserve status and lineup-lock timing.
- Distinguish hindsight-optimal lineups from genuinely unreasonable pregame decisions.
- Do not claim a bench decision cost a win unless the legal substitution would have changed the result.
- Calculate all score differences and rankings programmatically when possible.
- Check that Monday-night scoring is complete.
- Confirm streak lengths from roster metadata.
- Sort numerical rankings correctly.
- Do not invent NFL news or injury information.
- Do not attribute a loss to a trade completed after the games.
- Do not confuse FAAB transferred in a trade with waiver spending.

One previous recap incorrectly accused the user's team of benching a better QB. The actual starting QB had been misidentified. This required a correction. Avoid repeating this type of mistake.

## 6. Recurring league storylines

### No Roof, Nice Doorbell — roster 9

The league's most established running joke.

Originally drafted Cameron Dicker, a kicker, in Round 8 despite having more important roster needs.

The original analogy was that the manager bought a fancy doorbell before putting a roof on his house.

The kicker was subsequently dropped and later reacquired during the season.

The manager has made numerous trades, waiver claims, additions and drops, and has been described as the league's feeder system.

Major completed trades discussed:

- Sent D'Andre Swift for Drake London.
- Sent Drake London, Kenneth Walker and De'Zhaun Stribling for A.J. Brown, James Cook and Garrett Wilson.
- Sent Omarion Hampton and Garrett Wilson for Saquon Barkley.

The Hampton/Wilson/Barkley trade is confirmed in the Week 6 transaction data.

Verify the other historical trade details against raw transaction logs if using them for serious analysis.

The team won Week 1, lost seven straight, then won Weeks 9 and 10.

Running construction jokes:

- Selling the roof.
- Trading the foundation.
- Municipal condemnation.
- Building permits.
- Structural inspections.
- Renovating a house that remains uninhabitable.

The user likes this analogy but wants fresh variations and current-week relevance rather than repeating the original draft roast every week.

### Michelle Poplas Fan Club — roster 2

Spent 965 of 1,000 FAAB very early in the season.

Started 7–0, then lost Weeks 8 and 9 with scores of 78.98 and 79.02.

Rebounded in Week 10 with 152.06 points.

Recurring jokes involve sovereign wealth funds, hostile takeovers, economic recessions and financial markets.

### I Gibbs zero Bucks — roster 4

The user's own team.

Started 1–6 despite being among the league's highest-scoring teams.

Scored 212.46 points in Week 5.

Won Weeks 8 and 9 before losing Week 10 to No Roof, Nice Doorbell.

Often has significantly more points scored than teams with better records.

The user is happy to have their own team roasted but expects accurate analysis rather than invented lineup mistakes.

### Jaggin’ Goff — roster 1

Started 5–0 before losing to Michelle in Week 6.

Spent very little FAAB relative to other managers.

Won four consecutive games from Weeks 7–10, reaching 9–1.

### Soy Sheldon — roster 7

Started inconsistently, then won four straight from Weeks 6–9.

Scored 144.58 in Week 7 and 174.10 in Week 8.

Lost Week 10 to Golden’s Girls.

### For the Love of the Game — roster 11

The commissioner.

Started 4–1 despite relatively modest scoring.

Lost Weeks 9 and 10 with scores of 70.66 and 69.24.

Has been involved in consecutive trades transferring 100 FAAB in opposite directions.

### Frank Gore Family Jewels — roster 6

Has repeatedly won matchups with scores below 100.

Won Week 10 with 81.90 points, of which Christian McCaffrey contributed 44.3.

### Puka Shell Necklace — roster 5

Spent zero FAAB through Week 9.

Reached 7–3 in Week 10 after three consecutive victories.

Week 10 roster data showed 200 FAAB used.

### Gav's Not So Groovy Team — roster 8

Heavy FAAB spending, inconsistent scoring and a poor record.

Scored 134.46 in Week 9 and still lost to Golden’s Girls, who scored 153.14.

### aronv — roster 12

Has consistently struggled with both low scoring and high opponent scoring.

Week 10 featured Drake Maye starting for 3.02 points while Patrick Mahomes scored 35.42 on the bench.

### Shough and Awe — roster 10

Another struggling team with heavy FAAB spending.

Week 10 featured Tyler Shough starting for 9.98 points while Trevor Lawrence scored 26.78 on the bench, in an 8.88-point loss.

## 7. Historical weekly scoring data

The following are matchup endpoint scores by roster ID. These allow median scoring, averages, consistency comparisons and historical trends.

Use the latest official standings endpoint for authoritative cumulative points, because small differences may exist due to stat corrections or custom scoring.

| Roster | W1     | W2     | W3     | W4     | W5     | W6     | W7     | W8     | W9     | W10    |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| 1      | 172.26 | 77.72  | 140.36 | 100.88 | 150.54 | 76.80  | 118.82 | 125.98 | 136.96 | 99.32  |
| 2      | 136.26 | 148.20 | 140.10 | 123.38 | 131.52 | 134.28 | 126.20 | 78.98  | 79.02  | 152.06 |
| 3      | 115.56 | 121.18 | 110.98 | 138.92 | 98.10  | 93.12  | 127.08 | 116.18 | 153.14 | 138.16 |
| 4      | 114.56 | 68.64  | 122.82 | 95.24  | 212.46 | 100.80 | 105.08 | 126.18 | 113.66 | 98.96  |
| 5      | 107.42 | 109.66 | 129.98 | 137.62 | 98.26  | 75.96  | 99.62  | 130.78 | 125.36 | 141.86 |
| 6      | 117.86 | 93.88  | 116.98 | 102.88 | 104.00 | 99.04  | 95.76  | 85.22  | 121.78 | 81.90  |
| 7      | 73.10  | 103.86 | 104.54 | 95.20  | 79.24  | 112.72 | 144.58 | 174.10 | 95.20  | 101.62 |
| 8      | 100.34 | 112.12 | 109.36 | 71.22  | 111.22 | 103.48 | 65.72  | 79.08  | 134.46 | 95.84  |
| 9      | 137.90 | 85.40  | 100.64 | 109.56 | 100.18 | 91.24  | 77.02  | 88.46  | 103.14 | 110.90 |
| 10     | 117.40 | 48.96  | 83.70  | 91.24  | 109.64 | 93.06  | 83.72  | 103.90 | 75.08  | 132.98 |
| 11     | 87.66  | 141.42 | 85.56  | 98.22  | 122.08 | 89.90  | 119.30 | 101.56 | 70.66  | 69.24  |
| 12     | 99.62  | 80.48  | 61.44  | 127.00 | 100.56 | 91.40  | 100.54 | 85.46  | 78.38  | 60.92  |

Note: Roster 9's Week 4 score was 97.46 raw points, overridden by 109.56 custom points. The table uses the custom score.

## 8. Most recent available standings — after Week 10

Ordered by wins, then points for.

| Rank | Team                     | Record | PF      | PA      | FAAB used | Streak |
| ---- | ------------------------ | ------ | ------- | ------- | --------- | ------ |
| 1    | Jaggin’ Goff             | 9–1    | 1199.64 | 891.48  | 51        | W4     |
| 2    | Michelle Poplas Fan Club | 8–2    | 1249.99 | 996.68  | 965       | W1     |
| 3    | Puka Shell Necklace      | 7–3    | 1156.52 | 1076.86 | 200       | W3     |
| 4    | Golden’s Girls           | 6–4    | 1212.42 | 1137.94 | 360       | W2     |
| 5    | Soy Sheldon              | 6–4    | 1084.16 | 1005.22 | 618       | L1     |
| 6    | Frank Gore Family Jewels | 6–4    | 1019.30 | 1034.44 | 700       | W1     |
| 7    | For the Love of the Game | 5–5    | 985.60  | 1053.64 | 383       | L2     |
| 8    | I Gibbs zero Bucks       | 3–7    | 1158.40 | 1078.04 | 390       | L1     |
| 9    | No Roof, Nice Doorbell   | 3–7    | 1004.44 | 1077.66 | 814       | W2     |
| 10   | Shough and Awe           | 3–7    | 939.68  | 1152.94 | 900       | L2     |
| 11   | Gav's Not So Groovy Team | 2–8    | 982.84  | 1247.52 | 861       | L4     |
| 12   | aronv                    | 2–8    | 885.80  | 1126.38 | 313       | L3     |

These are the last supplied standings, not necessarily the current standings.

As of Week 10:

- Michelle leads the league in points scored.
- Jaggin’ Goff leads in wins.
- Golden’s Girls has the highest potential points, 1370.62.
- I Gibbs zero Bucks is fourth in points scored despite being 3–7.
- Gav has the most points against.
- Three teams are tied at 6–4.
- For the Love of the Game is one game behind the projected playoff cutoff.

## 9. Most recent recap — Week 10

| Winner                   | Loser                    | Score         |
| ------------------------ | ------------------------ | ------------- |
| Jaggin’ Goff             | aronv                    | 99.32–60.92   |
| Golden’s Girls           | Soy Sheldon              | 138.16–101.62 |
| Puka Shell Necklace      | Shough and Awe           | 141.86–132.98 |
| Michelle Poplas Fan Club | Gav's Not So Groovy Team | 152.06–95.84  |
| No Roof, Nice Doorbell   | I Gibbs zero Bucks       | 110.90–98.96  |
| Frank Gore Family Jewels | For the Love of the Game | 81.90–69.24   |

Key stories:

- Michelle rebounded with the week's highest score.
- No Roof won its second consecutive game.
- Soy Sheldon's four-game winning streak ended.
- Puka won a close, high-scoring matchup.
- Frank Gore won despite scoring only 81.90.
- For the Love of the Game scored less than 71 points for the second consecutive week.
- Aronv left 35.42 QB points on the bench.
- Shough and Awe left a potential winning QB substitution on the bench.

The next recap should use newly supplied matchup data, not assume Week 10 is still the latest completed week.

## 10. Recent confirmed trades

### Week 9

I Gibbs zero Bucks receives:

- Player `13274`
- Player `13301`
- 100 FAAB

For the Love of the Game receives:

- Braelon Allen (`11576`)
- Player `11834`

Transaction ID: `1424823241335132160`

The user won that week, while the commissioner lost to No Roof, Nice Doorbell.

Resolve remaining player IDs using the NFL player database.

### Week 10

Golden’s Girls receives:

- Davante Adams (`2133`)

For the Love of the Game receives:

- Cam Skattebo (`12481`)
- 100 FAAB

Transaction ID: `1428161481148485632`

Important: Check the transaction timestamp before attributing any Week 10 performance to this trade. The trade appears in the Week 10 transaction log, but the matchup data shows Skattebo was still on Golden’s Girls during the games.

The commissioner effectively received back 100 FAAB after transferring 100 FAAB to the user's team the previous week.

## 11. Current investigation — confirmed 2026 keepers

The most recent task was determining which players were kept from the 2025 season going into the 2026 draft.

The user confirmed that the commissioner manually assigned these picks before the draft.

### Data already retrieved

- 2026 draft ID: `1382842376145350656`
- Full 2026 draft picks response containing 180 selections.
- Full 2026 draft configuration.
- All draft slots and roster mappings.

The full draft picks were supplied in an uploaded markdown file named `Pasted markdown(1).md`.

### Findings

Every one of the 180 draft selections has:

`is_keeper: null`

The draft configuration does not expose a `slot_to_player_id` mapping or any explicit keeper assignments.

Therefore, the 2026 draft response alone cannot conclusively distinguish commissioner-assigned picks from normal selections.

### Previously identified keeper candidates

These were earlier assistant predictions, NOT a confirmed list supplied by the user.

| Player             | Drafted by               | 2026 round | Overall pick |
| ------------------ | ------------------------ | ---------- | ------------ |
| Jaxon Smith-Njigba | Michelle Poplas Fan Club | 2          | 18           |
| Drake London       | Soy Sheldon              | 3          | 27           |
| Ladd McConkey      | Frank Gore Family Jewels | 3          | 29           |
| George Pickens     | Shough and Awe           | 3          | 34           |
| Rashee Rice        | No Roof, Nice Doorbell   | 4          | 38           |
| Jameson Williams   | For the Love of the Game | 6          | 69           |

Do not present these six as confirmed keepers.

### Next steps

1. Retrieve the 2026 league details:

`https://api.sleeper.app/v1/league/1382842376132755456`

2. Extract `previous_league_id`.
3. Retrieve the 2025 league drafts:

`https://api.sleeper.app/v1/league/{previous_league_id}/drafts`

4. Retrieve the 2025 draft picks:

`https://api.sleeper.app/v1/draft/{2025_draft_id}/picks`

5. Compare the 2025 and 2026 drafts by player ID and owner ID.
6. Apply the league's keeper-cost rules to identify likely matches.
7. Investigate the 2025 end-of-season rosters if traded players could be retained by managers other than the original drafting manager.
8. Check whether draft-room history or commissioner messages provide additional evidence.

Matching a previous draft round and owner is circumstantial evidence, not definitive proof of a commissioner-assigned keeper.

Confirm the precise keeper rules before completing the analysis.

## 12. Useful 2026 player ID mappings

These are confirmed from the 2026 draft metadata.

| ID    | Player              | Position |
| ----- | ------------------- | -------- |
| 9221  | Jahmyr Gibbs        | RB       |
| 9509  | Bijan Robinson      | RB       |
| 7564  | Ja'Marr Chase       | WR       |
| 6813  | Jonathan Taylor     | RB       |
| 4034  | Christian McCaffrey | RB       |
| 8138  | James Cook          | RB       |
| 7547  | Amon-Ra St. Brown   | WR       |
| 9226  | De'Von Achane       | RB       |
| 9224  | Chase Brown         | RB       |
| 4866  | Saquon Barkley      | RB       |
| 12507 | Omarion Hampton     | RB       |
| 9493  | Puka Nacua          | WR       |
| 3198  | Derrick Henry       | RB       |
| 8151  | Kenneth Walker      | RB       |
| 6794  | Justin Jefferson    | WR       |
| 6786  | CeeDee Lamb         | WR       |
| 12527 | Ashton Jeanty       | RB       |
| 9488  | Jaxon Smith-Njigba  | WR       |
| 5859  | A.J. Brown          | WR       |
| 8150  | Kyren Williams      | RB       |
| 4984  | Josh Allen          | QB       |
| 5850  | Josh Jacobs         | RB       |
| 7569  | Nico Collins        | WR       |
| 11604 | Brock Bowers        | TE       |
| 11632 | Malik Nabers        | WR       |
| 8130  | Trey McBride        | TE       |
| 8112  | Drake London        | WR       |
| 7525  | DeVonta Smith       | WR       |
| 11635 | Ladd McConkey       | WR       |
| 8146  | Garrett Wilson      | WR       |
| 13287 | Jeremiyah Love      | RB       |
| 12526 | Tetairoa McMillan   | WR       |
| 12481 | Cam Skattebo        | RB       |
| 8137  | George Pickens      | WR       |
| 6790  | D'Andre Swift       | RB       |
| 8155  | Breece Hall         | RB       |
| 6801  | Tee Higgins         | WR       |
| 10229 | Rashee Rice         | WR       |
| 13286 | Jadarian Price      | RB       |
| 7526  | Jaylen Waddle       | WR       |
| 9997  | Zay Flowers         | WR       |
| 4881  | Lamar Jackson       | QB       |
| 5892  | David Montgomery    | RB       |
| 4983  | DJ Moore            | WR       |
| 12517 | Colston Loveland    | TE       |
| 12490 | Bhayshul Tuten      | RB       |
| 12519 | Luther Burden       | WR       |
| 11584 | Bucky Irving        | RB       |
| 5927  | Terry McLaurin      | WR       |
| 8228  | Jaylen Warren       | RB       |
| 5967  | Tony Pollard        | RB       |
| 2133  | Davante Adams       | WR       |
| 10859 | Sam LaPorta         | TE       |
| 12514 | Emeka Egbuka        | WR       |
| 12529 | TreVeyon Henderson  | RB       |
| 11564 | Drake Maye          | QB       |
| 6770  | Joe Burrow          | QB       |
| 11620 | Rome Odunze         | WR       |
| 13279 | Carnell Tate        | WR       |
| 12506 | Harold Fannin       | TE       |
| 6904  | Jalen Hurts         | QB       |
| 12518 | Tyler Warren        | TE       |
| 12512 | Quinshon Judkins    | RB       |
| 7588  | Javonte Williams    | RB       |
| 7553  | Kyle Pitts          | TE       |
| 7543  | Travis Etienne      | RB       |
| 9487  | Parker Washington   | WR       |
| 8144  | Chris Olave         | WR       |
| 8148  | Jameson Williams    | WR       |
| 9484  | Tucker Kraft        | TE       |
| 8167  | Christian Watson    | WR       |
| 11566 | Jayden Daniels      | QB       |
| 2216  | Mike Evans          | WR       |
| 11560 | Caleb Williams      | QB       |
| 3294  | Dak Prescott        | QB       |
| 7611  | Rhamondre Stevenson | RB       |
| 6797  | Justin Herbert      | QB       |
| 10236 | Dalton Kincaid      | TE       |
| 11631 | Brian Thomas        | WR       |
| 11628 | Marvin Harrison     | WR       |
| 4217  | George Kittle       | TE       |
| 8408  | Jordan Mason        | RB       |
| 6806  | J.K. Dobbins        | RB       |
| 5846  | DK Metcalf          | WR       |
| 11533 | Brandon Aubrey      | K        |
| 8259  | Cameron Dicker      | K        |
| 7523  | Trevor Lawrence     | QB       |
| 11586 | Blake Corum         | RB       |
| 12489 | RJ Harvey           | RB       |
| 7594  | Chuba Hubbard       | RB       |
| 5045  | Courtland Sutton    | WR       |
| 7021  | Rico Dowdle         | RB       |
| 8132  | Tyler Allgeier      | RB       |
| 10232 | Michael Wilson      | WR       |
| 13345 | Jonah Coleman       | RB       |
| 13294 | Makai Lemon         | WR       |
| 8142  | Alec Pierce         | WR       |
| 9756  | Jordan Addison      | WR       |
| 12508 | Jaxson Dart         | QB       |
| 12534 | Kyle Monangai       | RB       |
| 8110  | Jake Ferguson       | TE       |
| 13298 | KC Concepcion       | WR       |
| 8131  | Isaiah Likely       | TE       |
| 13281 | Jordyn Tyson        | WR       |
| 11563 | Bo Nix              | QB       |
| 2449  | Stefon Diggs        | WR       |
| 9753  | Zach Charbonnet     | RB       |
| 12474 | Woody Marks         | RB       |
| 8126  | Wan'Dale Robinson   | WR       |
| 13305 | Mike Washington     | RB       |
| 11646 | Jalen Coker         | WR       |
| 4199  | Aaron Jones         | RB       |
| 8136  | Rachaad White       | RB       |
| 11786 | Cam Little          | K        |
| 9500  | Josh Downs          | WR       |
| 5849  | Kyler Murray        | QB       |
| 1466  | Travis Kelce        | TE       |
| 12501 | Matthew Golden      | WR       |
| 4046  | Patrick Mahomes     | QB       |
| 421   | Matthew Stafford    | QB       |
| 9225  | Tank Bigsby         | RB       |
| 12469 | Dylan Sampson       | RB       |
| 5022  | Dallas Goedert      | TE       |
| 4892  | Baker Mayfield      | QB       |
| 7839  | Evan McPherson      | K        |
| 10219 | Chris Rodriguez     | RB       |
| 11539 | Jake Bates          | K        |
| 3214  | Hunter Henry        | TE       |
| 11655 | Tyrone Tracy        | RB       |
| 11610 | Malik Washington    | WR       |
| 13414 | Kaelon Black        | RB       |
| 8183  | Brock Purdy         | QB       |
| 5947  | Jakobi Meyers       | WR       |
| 12545 | Tyler Shough        | QB       |
| 11624 | Xavier Worthy       | WR       |
| 11792 | Will Reichard       | K        |
| 1945  | Chris Boswell       | K        |
| 5872  | Deebo Samuel        | WR       |
| 13293 | Ja'Kobi Lane        | WR       |
| 3163  | Jared Goff          | QB       |
| 11576 | Braelon Allen       | RB       |
| 7002  | Juwan Johnson       | TE       |
| 13276 | Omar Cooper         | WR       |
| 8154  | Brian Robinson      | RB       |
| 4035  | Alvin Kamara        | RB       |

For players not listed, retrieve the Sleeper player database rather than guessing.

## 13. Instructions for the next agent

Continue the existing workflow without asking the user to repeat information already contained in this handoff.

For new weekly recaps, obtain the relevant matchup, roster and transaction JSON, verify the numbers, and produce one complete group-chat-ready post.

For keeper analysis, continue from the previous-league-ID lookup and compare the 2025 and 2026 drafts.

The user values accuracy and specificity just as much as the humour. The best recaps make the actual data funny rather than inventing facts to support a joke.

**Handoff limitations:** This includes the historical weekly scores through Week 10, the latest supplied standings, current team mappings and the keeper investigation. It does not reproduce every historical transaction or individual weekly player score. For deeper retrospective analysis, the new agent should retrieve those raw API responses. The actual keeper selections and playoff configuration also remain unconfirmed.