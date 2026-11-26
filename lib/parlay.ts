export type ParlayLegKind =
  | 'anytime_td'
  | 'receiving_yards_over'
  | 'receiving_yards_under'
  | 'receiving_yards_at_least'
  | 'rushing_yards_at_least'
  | 'passing_yards_over'
  | 'passing_touchdowns_at_least'
  | 'receptions_at_least'
  | 'spread'
  | 'moneyline'
  | 'team_total_over'
  | 'game_total_over'
  | 'game_total_under';

export interface ParlayLeg {
  submittedName: string;
  kind: ParlayLegKind;
  playerId?: string;
  playerName?: string;
  team: string;
  opponent?: string;
  line?: number;
}

export const MAIN_LEAGUE_ID = '1382842376132755456';

export const CUCK_RANKS = [
  'No Cuckery Detected',
  'Cuck Curious',
  'Peeking Through the Keyhole',
  'Holding the Bull\u2019s Pants',
  'Certified Bedroom Cuck',
  'Hotel-Chair Masturbator',
  'The Bull\u2019s Cleanup Crew',
  'Intergalactic Mega-Cuck'
];

export const cuckRank = (index: number) => CUCK_RANKS[Math.min(
  Math.max(Math.round(index), 0),
  CUCK_RANKS.length - 1
)];

export const cuckAssetId = (leg: ParlayLeg) => leg.playerId
  ?? (leg.kind === 'spread' || leg.kind === 'moneyline' ? leg.team : undefined);

// Keep these mappings stable so weekly picks can use the names from the group chat.
export const LEAGUE_MEMBERS: Record<string, { userId: string; sleeperName: string }> = {
  Jaynaan: { userId: '1019353852707184640', sleeperName: 'JayParmar1023' },
  Jimmer: { userId: '1047676380575711232', sleeperName: 'soyjimmer' },
  Mark: { userId: '1131787508204933120', sleeperName: 'TannedMario' },
  Rob: { userId: '1208133333142208512', sleeperName: 'ronhanderson' },
  Verde: { userId: '1131463867114250240', sleeperName: 'michaelverde2' },
  Tom: { userId: '1001537883003527168', sleeperName: 'Tomparr' },
  Alastair: { userId: '1130697691425738752', sleeperName: 'alistar420' },
  Holden: { userId: '486689331822456832', sleeperName: 'berrysauce34' },
  Aron: { userId: '1132777153214431232', sleeperName: 'aronv' },
  Roop: { userId: '617826255089238016', sleeperName: 'SaroopPeetamber' },
  Griff: { userId: '1132354103486590976', sleeperName: 'griffmoore47' },
  Gav: { userId: '1132363061777743872', sleeperName: 'GavKerr' }
};

// These are the last complete 12-leg tickets posted for each week in chat.md.
export const PARLAYS_BY_WEEK: Record<number, ParlayLeg[]> = {
  1: [
    { submittedName: 'Jaynaan', kind: 'anytime_td', playerId: '9221', playerName: 'Jahmyr Gibbs', team: 'DET' },
    { submittedName: 'Verde', kind: 'anytime_td', playerId: '7021', playerName: 'Rico Dowdle', team: 'PIT' },
    { submittedName: 'Holden', kind: 'anytime_td', playerId: '8151', playerName: 'Kenneth Walker III', team: 'KC' },
    { submittedName: 'Alastair', kind: 'anytime_td', playerId: '12481', playerName: 'Cam Skattebo', team: 'NYG' },
    { submittedName: 'Mark', kind: 'anytime_td', playerId: '4866', playerName: 'Saquon Barkley', team: 'PHI' },
    { submittedName: 'Jimmer', kind: 'anytime_td', playerId: '7564', playerName: 'Ja\u2019Marr Chase', team: 'CIN' },
    { submittedName: 'Rob', kind: 'anytime_td', playerId: '4984', playerName: 'Josh Allen', team: 'BUF' },
    { submittedName: 'Roop', kind: 'anytime_td', playerId: '3198', playerName: 'Derrick Henry', team: 'BAL' },
    { submittedName: 'Griff', kind: 'anytime_td', playerId: '6786', playerName: 'CeeDee Lamb', team: 'DAL' },
    { submittedName: 'Gav', kind: 'anytime_td', playerId: '6813', playerName: 'Jonathan Taylor', team: 'IND' },
    { submittedName: 'Aron', kind: 'moneyline', team: 'CHI' },
    { submittedName: 'Tom', kind: 'receiving_yards_over', playerId: '6794', playerName: 'Justin Jefferson', team: 'MIN', line: 72.5 }
  ],
  2: [
    { submittedName: 'Jaynaan', kind: 'anytime_td', playerId: '9509', playerName: 'Bijan Robinson', team: 'ATL' },
    { submittedName: 'Jimmer', kind: 'anytime_td', playerId: '7564', playerName: 'Ja\u2019Marr Chase', team: 'CIN' },
    { submittedName: 'Mark', kind: 'anytime_td', playerId: '4866', playerName: 'Saquon Barkley', team: 'PHI' },
    { submittedName: 'Verde', kind: 'anytime_td', playerId: '11584', playerName: 'Bucky Irving', team: 'TB' },
    { submittedName: 'Griff', kind: 'anytime_td', playerId: '3198', playerName: 'Derrick Henry', team: 'BAL' },
    { submittedName: 'Rob', kind: 'anytime_td', playerId: '12517', playerName: 'Colston Loveland', team: 'CHI' },
    { submittedName: 'Tom', kind: 'anytime_td', playerId: '8167', playerName: 'Christian Watson', team: 'GB' },
    { submittedName: 'Roop', kind: 'spread', team: 'SEA', line: -2.5 },
    { submittedName: 'Holden', kind: 'anytime_td', playerId: '8151', playerName: 'Kenneth Walker III', team: 'KC' },
    { submittedName: 'Alastair', kind: 'anytime_td', playerId: '12481', playerName: 'Cam Skattebo', team: 'NYG' },
    { submittedName: 'Gav', kind: 'anytime_td', playerId: '12526', playerName: 'Tetairoa McMillan', team: 'CAR' },
    { submittedName: 'Aron', kind: 'anytime_td', playerId: '12527', playerName: 'Ashton Jeanty', team: 'LV' }
  ],
  3: [
    { submittedName: 'Jaynaan', kind: 'anytime_td', playerId: '9221', playerName: 'Jahmyr Gibbs', team: 'DET' },
    { submittedName: 'Alastair', kind: 'anytime_td', playerId: '6786', playerName: 'CeeDee Lamb', team: 'DAL' },
    { submittedName: 'Griff', kind: 'anytime_td', playerId: '4881', playerName: 'Lamar Jackson', team: 'BAL' },
    { submittedName: 'Verde', kind: 'moneyline', team: 'SF' },
    { submittedName: 'Mark', kind: 'anytime_td', playerId: '8151', playerName: 'Kenneth Walker III', team: 'KC' },
    { submittedName: 'Jimmer', kind: 'anytime_td', playerId: '7547', playerName: 'Amon-Ra St. Brown', team: 'DET' },
    { submittedName: 'Aron', kind: 'anytime_td', playerId: '12527', playerName: 'Ashton Jeanty', team: 'LV' },
    { submittedName: 'Rob', kind: 'anytime_td', playerId: '12507', playerName: 'Omarion Hampton', team: 'LAC' },
    { submittedName: 'Tom', kind: 'anytime_td', playerId: '8138', playerName: 'James Cook III', team: 'BUF' },
    { submittedName: 'Roop', kind: 'team_total_over', team: 'NO', line: 23.5 },
    { submittedName: 'Gav', kind: 'anytime_td', playerId: '4034', playerName: 'Christian McCaffrey', team: 'SF' },
    { submittedName: 'Holden', kind: 'rushing_yards_at_least', playerId: '8136', playerName: 'Rachaad White', team: 'WAS', line: 20 }
  ],
  4: [
    { submittedName: 'Jaynaan', kind: 'anytime_td', playerId: '6813', playerName: 'Jonathan Taylor', team: 'IND' },
    { submittedName: 'Mark', kind: 'rushing_yards_at_least', playerId: '3198', playerName: 'Derrick Henry', team: 'BAL', line: 110 },
    { submittedName: 'Rob', kind: 'anytime_td', playerId: '9997', playerName: 'Zay Flowers', team: 'BAL' },
    { submittedName: 'Verde', kind: 'anytime_td', playerId: '9221', playerName: 'Jahmyr Gibbs', team: 'DET' },
    { submittedName: 'Tom', kind: 'receiving_yards_over', playerId: '9756', playerName: 'Jordan Addison', team: 'MIN', line: 63.5 },
    { submittedName: 'Jimmer', kind: 'anytime_td', playerId: '9488', playerName: 'Jaxon Smith-Njigba', team: 'SEA' },
    { submittedName: 'Griff', kind: 'anytime_td', playerId: '7547', playerName: 'Amon-Ra St. Brown', team: 'DET' },
    { submittedName: 'Roop', kind: 'receiving_yards_at_least', playerId: '7564', playerName: 'Ja\u2019Marr Chase', team: 'CIN', line: 80 },
    { submittedName: 'Gav', kind: 'anytime_td', playerId: '8151', playerName: 'Kenneth Walker III', team: 'KC' },
    { submittedName: 'Alastair', kind: 'anytime_td', playerId: '6786', playerName: 'CeeDee Lamb', team: 'DAL' },
    { submittedName: 'Holden', kind: 'receiving_yards_over', playerId: '10229', playerName: 'Rashee Rice', team: 'KC', line: 60 },
    { submittedName: 'Aron', kind: 'anytime_td', playerId: '12526', playerName: 'Tetairoa McMillan', team: 'CAR' }
  ],
  5: [
    { submittedName: 'Jaynaan', kind: 'anytime_td', playerId: '9488', playerName: 'Jaxon Smith-Njigba', team: 'SEA' },
    { submittedName: 'Griff', kind: 'anytime_td', playerId: '9493', playerName: 'Puka Nacua', team: 'LAR' },
    { submittedName: 'Jimmer', kind: 'anytime_td', playerId: '3198', playerName: 'Derrick Henry', team: 'BAL' },
    { submittedName: 'Roop', kind: 'anytime_td', playerId: '12490', playerName: 'Bhayshul Tuten', team: 'JAX' },
    { submittedName: 'Verde', kind: 'moneyline', team: 'PIT' },
    { submittedName: 'Rob', kind: 'anytime_td', playerId: '11604', playerName: 'Brock Bowers', team: 'LV' },
    { submittedName: 'Gav', kind: 'anytime_td', playerId: '9221', playerName: 'Jahmyr Gibbs', team: 'DET' },
    { submittedName: 'Aron', kind: 'moneyline', team: 'CHI' },
    { submittedName: 'Mark', kind: 'anytime_td', playerId: '9509', playerName: 'Bijan Robinson', team: 'ATL' },
    { submittedName: 'Alastair', kind: 'anytime_td', playerId: '9224', playerName: 'Chase Brown', team: 'CIN' },
    { submittedName: 'Holden', kind: 'passing_yards_over', playerId: '3163', playerName: 'Jared Goff', team: 'DET', line: 250 },
    { submittedName: 'Tom', kind: 'receiving_yards_at_least', playerId: '6794', playerName: 'Justin Jefferson', team: 'MIN', line: 70 }
  ],
  6: [
    { submittedName: 'Jaynaan', kind: 'anytime_td', playerId: '6813', playerName: 'Jonathan Taylor', team: 'IND' },
    { submittedName: 'Roop', kind: 'spread', team: 'BAL', line: -2.5 },
    { submittedName: 'Rob', kind: 'anytime_td', playerId: '6790', playerName: 'D\u2019Andre Swift', team: 'CHI' },
    { submittedName: 'Alastair', kind: 'anytime_td', playerId: '6786', playerName: 'CeeDee Lamb', team: 'DAL' },
    { submittedName: 'Mark', kind: 'anytime_td', playerId: '4984', playerName: 'Josh Allen', team: 'BUF' },
    { submittedName: 'Jimmer', kind: 'anytime_td', playerId: '9509', playerName: 'Bijan Robinson', team: 'ATL' },
    { submittedName: 'Tom', kind: 'anytime_td', playerId: '9493', playerName: 'Puka Nacua', team: 'LAR' },
    { submittedName: 'Griff', kind: 'anytime_td', playerId: '3198', playerName: 'Derrick Henry', team: 'BAL' },
    { submittedName: 'Verde', kind: 'anytime_td', playerId: '8228', playerName: 'Jaylen Warren', team: 'PIT' },
    { submittedName: 'Gav', kind: 'anytime_td', playerId: '8151', playerName: 'Kenneth Walker III', team: 'KC' },
    { submittedName: 'Holden', kind: 'anytime_td', playerId: '8138', playerName: 'James Cook III', team: 'BUF' },
    { submittedName: 'Aron', kind: 'moneyline', team: 'CHI' }
  ],
  7: [
    { submittedName: 'Jaynaan', kind: 'anytime_td', playerId: '7594', playerName: 'Chuba Hubbard', team: 'CAR' },
    { submittedName: 'Alastair', kind: 'anytime_td', playerId: '9224', playerName: 'Chase Brown', team: 'CIN' },
    { submittedName: 'Mark', kind: 'anytime_td', playerId: '6794', playerName: 'Justin Jefferson', team: 'MIN' },
    { submittedName: 'Verde', kind: 'anytime_td', playerId: '9221', playerName: 'Jahmyr Gibbs', team: 'DET' },
    { submittedName: 'Griff', kind: 'anytime_td', playerId: '4034', playerName: 'Christian McCaffrey', team: 'SF' },
    { submittedName: 'Gav', kind: 'anytime_td', playerId: '3198', playerName: 'Derrick Henry', team: 'BAL' },
    { submittedName: 'Rob', kind: 'anytime_td', playerId: '5846', playerName: 'DK Metcalf', team: 'PIT' },
    { submittedName: 'Jimmer', kind: 'anytime_td', playerId: '7564', playerName: 'Ja\u2019Marr Chase', team: 'CIN' },
    { submittedName: 'Aron', kind: 'anytime_td', playerId: '3271', playerName: 'Tyler Higbee', team: 'LAR' },
    { submittedName: 'Roop', kind: 'passing_touchdowns_at_least', playerId: '6804', playerName: 'Jordan Love', team: 'GB', line: 2 },
    { submittedName: 'Holden', kind: 'receptions_at_least', playerId: '12501', playerName: 'Matthew Golden', team: 'GB', line: 4 },
    { submittedName: 'Tom', kind: 'anytime_td', playerId: '7569', playerName: 'Nico Collins', team: 'HOU' }
  ],
  8: [
    { submittedName: 'Jimmer', kind: 'anytime_td', playerId: '3198', playerName: 'Derrick Henry', team: 'BAL' },
    { submittedName: 'Jaynaan', kind: 'anytime_td', playerId: '4984', playerName: 'Josh Allen', team: 'BUF' },
    { submittedName: 'Verde', kind: 'anytime_td', playerId: '9221', playerName: 'Jahmyr Gibbs', team: 'DET' },
    { submittedName: 'Griff', kind: 'anytime_td', playerId: '9493', playerName: 'Puka Nacua', team: 'LAR' },
    { submittedName: 'Mark', kind: 'anytime_td', playerId: '6794', playerName: 'Justin Jefferson', team: 'MIN' },
    { submittedName: 'Alastair', kind: 'anytime_td', playerId: '6786', playerName: 'CeeDee Lamb', team: 'DAL' },
    { submittedName: 'Gav', kind: 'anytime_td', playerId: '9224', playerName: 'Chase Brown', team: 'CIN' },
    { submittedName: 'Roop', kind: 'anytime_td', playerId: '7588', playerName: 'Javonte Williams', team: 'DAL' },
    { submittedName: 'Rob', kind: 'anytime_td', playerId: '12527', playerName: 'Ashton Jeanty', team: 'LV' },
    { submittedName: 'Tom', kind: 'game_total_under', team: 'MIN', opponent: 'DET', line: 45.5 },
    { submittedName: 'Holden', kind: 'anytime_td', playerId: '8138', playerName: 'James Cook III', team: 'BUF' },
    { submittedName: 'Aron', kind: 'anytime_td', playerId: '9997', playerName: 'Zay Flowers', team: 'BAL' }
  ],
  9: [
    { submittedName: 'Jaynaan', kind: 'anytime_td', playerId: '6813', playerName: 'Jonathan Taylor', team: 'IND' },
    { submittedName: 'Roop', kind: 'spread', team: 'LAR', line: -2.5 },
    { submittedName: 'Rob', kind: 'anytime_td', playerId: '10229', playerName: 'Rashee Rice', team: 'KC' },
    { submittedName: 'Mark', kind: 'anytime_td', playerId: '6794', playerName: 'Justin Jefferson', team: 'MIN' },
    { submittedName: 'Holden', kind: 'anytime_td', playerId: '8138', playerName: 'James Cook III', team: 'BUF' },
    { submittedName: 'Alastair', kind: 'anytime_td', playerId: '6786', playerName: 'CeeDee Lamb', team: 'DAL' },
    { submittedName: 'Tom', kind: 'receiving_yards_under', playerId: '6794', playerName: 'Justin Jefferson', team: 'MIN', line: 77.5 },
    { submittedName: 'Griff', kind: 'anytime_td', playerId: '9493', playerName: 'Puka Nacua', team: 'LAR' },
    { submittedName: 'Jimmer', kind: 'anytime_td', playerId: '5850', playerName: 'Josh Jacobs', team: 'GB' },
    { submittedName: 'Gav', kind: 'anytime_td', playerId: '8151', playerName: 'Kenneth Walker III', team: 'KC' },
    { submittedName: 'Verde', kind: 'spread', team: 'CHI', line: -6 },
    { submittedName: 'Aron', kind: 'anytime_td', playerId: '12527', playerName: 'Ashton Jeanty', team: 'LV' }
  ],
  10: [
    { submittedName: 'Mark', kind: 'anytime_td', playerId: '6794', playerName: 'Justin Jefferson', team: 'MIN' },
    { submittedName: 'Jaynaan', kind: 'anytime_td', playerId: '7547', playerName: 'Amon-Ra St. Brown', team: 'DET' },
    { submittedName: 'Verde', kind: 'anytime_td', playerId: '9753', playerName: 'Zach Charbonnet', team: 'SEA' },
    { submittedName: 'Jimmer', kind: 'anytime_td', playerId: '12490', playerName: 'Bhayshul Tuten', team: 'JAX' },
    { submittedName: 'Griff', kind: 'anytime_td', playerId: '9221', playerName: 'Jahmyr Gibbs', team: 'DET' },
    { submittedName: 'Rob', kind: 'anytime_td', playerId: '6813', playerName: 'Jonathan Taylor', team: 'IND' },
    { submittedName: 'Gav', kind: 'anytime_td', playerId: '8138', playerName: 'James Cook III', team: 'BUF' },
    { submittedName: 'Tom', kind: 'passing_touchdowns_at_least', playerId: '1166', playerName: 'Kirk Cousins', team: 'MIN', line: 2 },
    { submittedName: 'Alastair', kind: 'anytime_td', playerId: '6786', playerName: 'CeeDee Lamb', team: 'DAL' },
    { submittedName: 'Roop', kind: 'game_total_over', team: 'BUF', opponent: 'NYJ', line: 49.5 },
    { submittedName: 'Holden', kind: 'anytime_td', playerId: '10229', playerName: 'Rashee Rice', team: 'KC' },
    { submittedName: 'Aron', kind: 'anytime_td', playerId: '12526', playerName: 'Tetairoa McMillan', team: 'CAR' }
  ],
  11: [
    { submittedName: 'Jaynaan', kind: 'spread', team: 'BUF', line: -16.5 },
    { submittedName: 'Jimmer', kind: 'anytime_td', playerId: '7564', playerName: 'Ja\u2019Marr Chase', team: 'CIN' },
    { submittedName: 'Mark', kind: 'anytime_td', playerId: '8131', playerName: 'Isaiah Likely', team: 'NYG' },
    { submittedName: 'Rob', kind: 'anytime_td', playerId: '5967', playerName: 'Tony Pollard', team: 'TEN' },
    { submittedName: 'Verde', kind: 'spread', team: 'JAX', line: -6 },
    { submittedName: 'Tom', kind: 'anytime_td', playerId: '9221', playerName: 'Jahmyr Gibbs', team: 'DET' },
    { submittedName: 'Alastair', kind: 'anytime_td', playerId: '6786', playerName: 'CeeDee Lamb', team: 'DAL' },
    { submittedName: 'Holden', kind: 'anytime_td', playerId: '7594', playerName: 'Chuba Hubbard', team: 'CAR' },
    { submittedName: 'Aron', kind: 'anytime_td', playerId: '4993', playerName: 'Mike Gesicki', team: 'CIN' },
    { submittedName: 'Roop', kind: 'receiving_yards_over', playerId: '11632', playerName: 'Malik Nabers', team: 'NYG', line: 66.5 },
    { submittedName: 'Griff', kind: 'anytime_td', playerId: '12490', playerName: 'Bhayshul Tuten', team: 'JAX' },
    { submittedName: 'Gav', kind: 'anytime_td', playerId: '13337', playerName: 'Emmett Johnson', team: 'KC' }
  ],
  12: [
    { submittedName: 'Mark', kind: 'anytime_td', playerId: '9221', playerName: 'Jahmyr Gibbs', team: 'DET' },
    { submittedName: 'Jaynaan', kind: 'anytime_td', playerId: '4984', playerName: 'Josh Allen', team: 'BUF' },
    { submittedName: 'Jimmer', kind: 'anytime_td', playerId: '7564', playerName: 'Ja\u2019Marr Chase', team: 'CIN' },
    { submittedName: 'Rob', kind: 'anytime_td', playerId: '8150', playerName: 'Kyren Williams', team: 'LAR' },
    { submittedName: 'Alastair', kind: 'anytime_td', playerId: '6786', playerName: 'CeeDee Lamb', team: 'DAL' },
    { submittedName: 'Griff', kind: 'anytime_td', playerId: '12501', playerName: 'Matthew Golden', team: 'GB' },
    { submittedName: 'Verde', kind: 'anytime_td', playerId: '11632', playerName: 'Malik Nabers', team: 'NYG' },
    { submittedName: 'Roop', kind: 'anytime_td', playerId: '6790', playerName: 'D\u2019Andre Swift', team: 'CHI' },
    { submittedName: 'Gav', kind: 'anytime_td', playerId: '13345', playerName: 'Jonah Coleman', team: 'DEN' },
    { submittedName: 'Tom', kind: 'moneyline', team: 'CHI' },
    { submittedName: 'Holden', kind: 'receiving_yards_over', playerId: '12501', playerName: 'Matthew Golden', team: 'GB', line: 80 },
    { submittedName: 'Aron', kind: 'anytime_td', playerId: '9997', playerName: 'Zay Flowers', team: 'BAL' },
    { submittedName: 'Jimmer', kind: 'anytime_td', playerId: '4866', playerName: 'Saquon Barkley', team: 'PHI' },
    { submittedName: 'Griff', kind: 'anytime_td', playerId: '7547', playerName: 'Amon-Ra St. Brown', team: 'DET' },
    { submittedName: 'Rob', kind: 'anytime_td', playerId: '4034', playerName: 'Christian McCaffrey', team: 'SF' },
    { submittedName: 'Holden', kind: 'anytime_td', playerId: '13337', playerName: 'Emmett Johnson', team: 'KC' }
  ]
};
