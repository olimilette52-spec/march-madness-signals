import { TEAMS_EAST } from './teamsEast'
import { TEAMS_WEST } from './teamsWest'
import { TEAMS_SOUTH } from './teamsSouth'
import { TEAMS_MIDWEST } from './teamsMidwest'

export const TEAMS = {
  ...TEAMS_EAST,
  ...TEAMS_WEST,
  ...TEAMS_SOUTH,
  ...TEAMS_MIDWEST,
}

export const TEAMS_LIST = Object.values(TEAMS)

export const MATCHUPS = [
  { id: 1,  region: 'East',    home: 'DUKE',  away: 'SIENA', time: 'Jeu 19 Mar 19:10', vegasSpread: -31.5, vegasTotal: 151.5 },
  { id: 2,  region: 'East',    home: 'OSU',   away: 'TCU',   time: 'Jeu 19 Mar 12:15', vegasSpread: -2.5,  vegasTotal: 147.5 },
  { id: 3,  region: 'East',    home: 'SJU',   away: 'NIA',   time: 'Jeu 19 Mar 14:45', vegasSpread: -11.5, vegasTotal: 131.5 },
  { id: 4,  region: 'East',    home: 'KU',    away: 'CBU',   time: 'Jeu 19 Mar 12:40', vegasSpread: -14.5, vegasTotal: 136.5 },
  { id: 5,  region: 'East',    home: 'LOU',   away: 'USF',   time: 'Ven 20 Mar 15:10', vegasSpread: -5.5,  vegasTotal: 143.5 },
  { id: 6,  region: 'East',    home: 'MIST',  away: 'NDST',  time: 'Ven 20 Mar 12:15', vegasSpread: -16.5, vegasTotal: 144.5 },
  { id: 7,  region: 'East',    home: 'UCLA',  away: 'UCF',   time: 'Ven 20 Mar 14:45', vegasSpread: -5.5,  vegasTotal: 153.5 },
  { id: 8,  region: 'East',    home: 'CONN',  away: 'FUR',   time: 'Ven 20 Mar 21:10', vegasSpread: -20.5, vegasTotal: 137.5 },
  { id: 9,  region: 'West',    home: 'ARIZ',  away: 'LIU',   time: 'Ven 20 Mar 13:35', vegasSpread: -31.5, vegasTotal: 151.5 },
  { id: 10, region: 'West',    home: 'VILL',  away: 'USU',   time: 'Ven 20 Mar 16:10', vegasSpread: -2.5,  vegasTotal: 147.5 },
  { id: 11, region: 'West',    home: 'WIS',   away: 'HPT',   time: 'Jeu 19 Mar 13:50', vegasSpread: -9.5,  vegasTotal: 165.5 },
  { id: 12, region: 'West',    home: 'ARK',   away: 'HAW',   time: 'Jeu 19 Mar 16:25', vegasSpread: -15.5, vegasTotal: 159.5 },
  { id: 13, region: 'West',    home: 'BYU',   away: 'NCST',  time: 'Jeu 19 Mar 19:25', vegasSpread: -3.5,  vegasTotal: 148.5 },
  { id: 14, region: 'West',    home: 'GONZ',  away: 'KNST',  time: 'Jeu 19 Mar 22:00', vegasSpread: -19.5, vegasTotal: 154.5 },
  { id: 15, region: 'West',    home: 'MIA',   away: 'MIZZ',  time: 'Ven 20 Mar 22:10', vegasSpread: -1.5,  vegasTotal: 148.5 },
  { id: 16, region: 'West',    home: 'PUR',   away: 'QUNS',  time: 'Ven 20 Mar 19:35', vegasSpread: -24.5, vegasTotal: 163.5 },
  { id: 17, region: 'South',   home: 'FLA',   away: 'LEH',   time: 'Jeu 19 Mar 13:15', vegasSpread: -31.5, vegasTotal: 151.5 },
  { id: 18, region: 'South',   home: 'CLEM',  away: 'IOWA',  time: 'Jeu 19 Mar 15:45', vegasSpread: -1.5,  vegasTotal: 143.5 },
  { id: 19, region: 'South',   home: 'VAN',   away: 'MCNS',  time: 'Jeu 19 Mar 18:15', vegasSpread: -7.5,  vegasTotal: 152.5 },
  { id: 20, region: 'South',   home: 'NEB',   away: 'TROY',  time: 'Jeu 19 Mar 12:40', vegasSpread: -13.5, vegasTotal: 137.5 },
  { id: 21, region: 'South',   home: 'UNC',   away: 'VCU',   time: 'Ven 20 Mar 16:25', vegasSpread: -2.5,  vegasTotal: 143.5 },
  { id: 22, region: 'South',   home: 'ILL',   away: 'PENN',  time: 'Ven 20 Mar 18:55', vegasSpread: -18.5, vegasTotal: 146.5 },
  { id: 23, region: 'South',   home: 'SMC',   away: 'TXAM',  time: 'Ven 20 Mar 21:25', vegasSpread: -4.5,  vegasTotal: 147.5 },
  { id: 24, region: 'South',   home: 'HOU',   away: 'IDA',   time: 'Ven 20 Mar 13:50', vegasSpread: -24.5, vegasTotal: 143.5 },
  { id: 25, region: 'Midwest', home: 'MICH',  away: 'MIOH',  time: 'Jeu 19 Mar 19:10', vegasSpread: -19.5, vegasTotal: 151.5 },
  { id: 26, region: 'Midwest', home: 'GEO',   away: 'SLU',   time: 'Jeu 19 Mar 21:45', vegasSpread: -3.5,  vegasTotal: 169.5 },
  { id: 27, region: 'Midwest', home: 'TTU',   away: 'AKR',   time: 'Ven 20 Mar 12:40', vegasSpread: -7.5,  vegasTotal: 157.5 },
  { id: 28, region: 'Midwest', home: 'ALA',   away: 'HOF',   time: 'Ven 20 Mar 15:15', vegasSpread: -13.5, vegasTotal: 161.5 },
  { id: 29, region: 'Midwest', home: 'TENN',  away: 'WRI',   time: 'Ven 20 Mar 16:25', vegasSpread: -14.5, vegasTotal: 149.5 },
  { id: 30, region: 'Midwest', home: 'VIR',   away: 'WRST',  time: 'Ven 20 Mar 13:50', vegasSpread: -18.5, vegasTotal: 146.5 },
  { id: 31, region: 'Midwest', home: 'KEN',   away: 'SCLA',  time: 'Ven 20 Mar 12:15', vegasSpread: -3.5,  vegasTotal: 160.5 },
  { id: 32, region: 'Midwest', home: 'ISU',   away: 'TNST',  time: 'Ven 20 Mar 14:50', vegasSpread: -24.5, vegasTotal: 149.5 },
]
