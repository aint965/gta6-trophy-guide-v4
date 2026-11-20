'use strict';

const routeStages = [
  { title: 'Secure the Chapter 1 window', label: 'BEFORE YOU LEAVE', ids: [28],
    text: 'Keep a manual save. Take the optional meditation at Jason’s house before Chapter 1 ends. It might be required for the meditation trophy; it is not required for 100%.',
    detail: 'After Down to Earth, check the kitchen in the morning. Follow Lucia to the balcony and accept the invite. The exact timing can vary.' },
  { title: 'Play the main story', label: 'CHAPTERS 1–5', ids: [2, 3, 8, 4, 9, 5, 10, 11, 12, 6, 7, 13],
    text: 'Keep chapter saves: there is no mission replay. Complete optional jobs as you see them, scan base-model vehicles and study animals in binoculars. Avoid cheats, which disable trophies and saving.',
    detail: 'Gone Fishing starts the trophy run. Chapter 2 adds Breakfast Run and unlocks partner free roam after Coffee Break. The Cartel Heist is Chapter 3; Chapter 4 includes Child’s Play, Headliners and VCIA Takedown. Check the story gold at Starting From Zero, then continue into Chapter 5 for Operation Savage Glory.' },
  { title: 'Work the 100% checklist', label: 'POST-STORY FREE ROAM', ids: [14, 17, 18, 30, 31, 40],
    text: 'Open Progress → Stats → 100% Completion after the story. Prioritize overlapping goals: 42 range golds, 42 drone trials, 15 card sets, 100 location scans and all 8 large vaults.',
    detail: 'Start with geography-heavy tasks and let the Challenge counter accumulate. Finish at 70 challenges, 300 stunts and 30 unique race wins. Earlier progress already counts.' },
  { title: 'Close the ledger', label: 'CLEANUP → PLATINUM', ids: [25, 22, 23, 24, 26, 27, 1],
    text: 'Finish eight qualifying stranger strands, named contact finales and any miscellaneous trophies that 100% did not cover. The 54 other trophies unlock platinum; none require online play.',
    detail: 'Kenton may disappear temporarily and return later. Check the PlayStation list before marking the platinum earned.' },
];

const completionGroups = [
  ['Story & jobs', ['Finish the story', '100 optional tasks', '39/39 gang operations', '22/22 full bank jobs', '7/7 Payday Loans jobs', '34/35 Smash ’N’ Grabs', '50/91 Stick Ups', '8/8 large vaults', 'Fence $100,000 narcotics', 'Fence $100,000 jewelry', 'Fence $250,000 marked bills', 'Fence $200,000 vehicles']],
  ['Exploration & discovery', ['5/7 Kenton sets', '33/33 underwater discoveries', '15/18 card sets', '100 WAiNK location scans', '30/34 publications and book swaps', '15/18 meditations', '100/125 cocaine flamingos', '2/2 unique playlists', '70/79 styles', '200/277 base-model vehicles', '50/66 standard weapons', '100/255 animals studied']],
  ['Activities & challenges', ['30/40 unique race wins', '10/13 race challenge golds', '42/42 shooting range golds', '4/4 video games played', '5/7 pool opponents defeated', '2/3 minigolf courses played', '90/100 basketball hoops', '42/42 drone trials completed', '300/397 stunts', '70/80 challenges', '15/15 Bret Target Decks']],
];
