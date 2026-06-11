// Game content: rooms, items, scenery, and narration.
// Ported from the Godot vertical slice (resources/*.json) and expanded.
// Tone: darkly comedic. The narrator is the star.

export const MAX_LAMP_FUEL = 150;
export const LAMP_THRESHOLDS = { bright: 90, warm: 45, flicker: 18 };
export const GRUE_GRACE_TURNS = 2; // turns in darkness before the grue eats you
export const PITY_FUEL = 25; // the Grim Rewind tops the lamp up to this after a death

export const MAX_SCORE = 250;
export const RANKS = [
  [0, 'Beginner'],
  [25, 'Amateur Adventurer'],
  [50, 'Novice Adventurer'],
  [100, 'Junior Adventurer'],
  [150, 'Seasoned Adventurer'],
  [200, 'Senior Adventurer'],
  [250, 'Greatest Underground Adventurer'],
];

export const TREASURES = {
  jewel_encrusted_egg: 25,
  painting: 30,
  bag_of_coins: 25,
  platinum_bar: 40,
  silver_chalice: 50,
};

export const EVENT_SCORES = {
  troll_defeated: 25,
  cyclops_fled: 25,
  visit_cellar: 10,
  visit_treasure_room: 20,
};

// dir: north/south/east/west/up/down
// exit: string target, or { target, requiresFlag, blockedMessage, hiddenUntilFlag }
export const ROOMS = {
  west_of_house: {
    name: 'West of House', dark: false, region: 'outside',
    exits: {
      north: 'north_of_house',
      south: 'south_of_house',
      west: 'forest_path',
    },
    objects: ['mailbox', 'front_door', 'white_house'],
  },
  north_of_house: {
    name: 'North of House', dark: false, region: 'outside',
    exits: { west: 'west_of_house', east: 'east_of_house' },
    objects: ['white_house'],
  },
  south_of_house: {
    name: 'South of House', dark: false, region: 'outside',
    exits: { west: 'west_of_house', east: 'east_of_house' },
    objects: ['white_house'],
  },
  east_of_house: {
    name: 'Behind House', dark: false, region: 'outside',
    exits: {
      north: 'north_of_house',
      south: 'south_of_house',
      west: {
        target: 'kitchen', requiresFlag: 'window_open',
        blockedMessage: 'The window is closed. It looks like it might open, though.',
      },
    },
    objects: ['window', 'white_house'],
  },
  forest_path: {
    name: 'Forest Path', dark: false, region: 'outside',
    exits: {
      east: 'west_of_house',
      west: { target: 'forest_path', loopMessage: 'You walk among the trees for a while and arrive back where you started. The forest is large, but it is not interested in you.' },
      north: { target: 'forest_path', loopMessage: 'More trees. They all look the same, and they are all judging you.' },
      south: { target: 'forest_path', loopMessage: 'You circle back to the path. Somewhere above, a songbird laughs at you. It is definitely laughing.' },
    },
    objects: ['great_tree'],
  },
  kitchen: {
    name: 'Kitchen', dark: false, region: 'house',
    exits: {
      west: 'living_room',
      east: {
        target: 'east_of_house', requiresFlag: 'window_open',
        blockedMessage: 'The window is closed. Which is strange, because you came in through it.',
      },
      up: 'attic',
    },
    objects: ['kitchen_table'],
  },
  living_room: {
    name: 'Living Room', dark: false, region: 'house',
    exits: {
      east: 'kitchen',
      west: {
        target: 'cyclops_room', hiddenUntilFlag: 'cyclops_fled',
        blockedMessage: 'That is a wall.',
      },
      down: {
        target: 'cellar', hiddenUntilFlag: 'rug_moved', requiresFlag: 'trap_door_open',
        blockedMessage: 'The trap door is closed. Trap doors are like that until opened.',
      },
    },
    objects: ['trophy_case', 'oriental_rug', 'trap_door'],
    floorItems: ['brass_lantern', 'elvish_sword'],
  },
  attic: {
    name: 'Attic', dark: true, region: 'house',
    exits: { down: 'kitchen' },
    objects: ['attic_table'],
    floorItems: ['nasty_knife', 'rope'],
  },
  cellar: {
    name: 'Cellar', dark: true, region: 'underground',
    exits: { up: 'living_room', north: 'troll_room', east: 'gallery' },
    objects: [],
  },
  gallery: {
    name: 'Gallery', dark: true, region: 'underground',
    exits: { west: 'cellar' },
    objects: [],
    floorItems: ['painting'],
  },
  troll_room: {
    name: 'The Troll Room', dark: true, region: 'underground',
    exits: {
      south: 'cellar',
      east: {
        target: 'maze_entrance', requiresFlag: 'troll_defeated',
        blockedMessage: 'A menacing troll blocks your way, brandishing a bloody axe.',
      },
    },
    objects: ['troll'],
  },
  maze_entrance: {
    name: 'Maze', dark: true, region: 'maze',
    exits: { west: 'troll_room', north: 'maze_2', east: 'maze_3', south: 'maze_dead_end' },
    objects: [],
  },
  maze_2: {
    name: 'Maze', dark: true, region: 'maze',
    exits: { south: 'maze_entrance', east: 'maze_3', north: 'maze_dead_end' },
    objects: [],
    floorItems: ['bag_of_coins', 'skeleton'],
  },
  maze_3: {
    name: 'Maze', dark: true, region: 'maze',
    exits: { west: 'maze_2', south: 'maze_entrance', north: 'round_room' },
    objects: [],
  },
  maze_dead_end: {
    name: 'Dead End', dark: true, region: 'maze',
    exits: { south: 'maze_entrance' },
    objects: ['claw_marks'],
    floorItems: ['tattered_page'],
  },
  round_room: {
    name: 'Round Room', dark: true, region: 'underground',
    exits: { south: 'maze_3', north: 'cyclops_room', east: 'narrow_passage', west: 'loud_room' },
    objects: ['ceiling_carvings'],
  },
  narrow_passage: {
    name: 'Narrow Passage', dark: true, region: 'underground',
    exits: { west: 'round_room', north: 'cyclops_room' },
    objects: [],
  },
  loud_room: {
    name: 'Loud Room', dark: true, region: 'underground',
    exits: { east: 'round_room' },
    objects: [],
    floorItems: ['platinum_bar'],
  },
  cyclops_room: {
    name: 'Cyclops Room', dark: true, region: 'underground',
    exits: {
      south: 'round_room',
      east: {
        target: 'living_room', hiddenUntilFlag: 'cyclops_fled',
        blockedMessage: 'That is a wall.',
      },
      up: {
        target: 'treasure_room', requiresFlag: 'cyclops_fled',
        blockedMessage: 'The Cyclops blocks the stairway, glaring at you with its single enormous eye.',
      },
    },
    objects: ['cyclops'],
  },
  treasure_room: {
    name: 'Treasure Room', dark: true, region: 'underground',
    exits: { down: 'cyclops_room' },
    objects: ['treasure_heaps'],
    floorItems: ['silver_chalice', 'torch'],
  },
};

export const ITEMS = {
  brass_lantern: {
    name: 'Brass Lantern', type: 'light',
    description: 'A sturdy brass lantern. The fuel gauge reads... well, it doesn’t have a gauge. But it feels about three-quarters full. You’ll want to conserve it.',
  },
  elvish_sword: {
    name: 'Elvish Sword', type: 'weapon',
    description: 'The elvish sword bears etchings of an ancient language. It glows with a faint blue light that seems to pulse gently, as if it has a heartbeat. The blade is razor-sharp despite its age.',
  },
  nasty_knife: {
    name: 'Nasty Knife', type: 'weapon',
    description: 'A nasty-looking knife. The kind of knife that has stories to tell, none of them pleasant.',
  },
  rope: {
    name: 'Rope', type: 'tool',
    description: 'A length of sturdy hemp rope. Useful for all sorts of adventuring mishaps. Or for causing them.',
  },
  leaflet: {
    name: 'Leaflet', type: 'misc',
    description: '"WELCOME TO ZORK! You are about to embark on an adventure of great peril and modest reward. The Great Underground Empire awaits. Please watch your step, and do try not to die."',
  },
  tattered_page: {
    name: 'Tattered Page', type: 'misc',
    description: 'A page torn from a very old book. It describes, in breathless verse, how a clever Greek fellow named ODYSSEUS once dealt with a one-eyed problem. Someone has underlined the name. Twice.',
  },
  jewel_encrusted_egg: {
    name: 'Jewel-Encrusted Egg', type: 'treasure',
    description: 'A beautiful egg, covered in delicate jewels. Something rattles inside. Probably best not to wonder what.',
  },
  painting: {
    name: 'Painting', type: 'treasure',
    description: 'A painting of remarkable beauty, depicting a pastoral scene of impossible detail. The cows in it look happier than you have ever been.',
  },
  bag_of_coins: {
    name: 'Bag of Coins', type: 'treasure',
    description: 'A leather bag filled with gold coins. They clink satisfyingly. The previous owner has no further use for them, being a skeleton.',
  },
  platinum_bar: {
    name: 'Platinum Bar', type: 'treasure',
    description: 'A large bar of solid platinum. Astonishingly heavy. Astonishingly shiny. Astonishingly yours.',
  },
  silver_chalice: {
    name: 'Silver Chalice', type: 'treasure',
    description: 'An ornate silver chalice of obvious antiquity. It is engraved with scenes of a banquet that got badly out of hand.',
  },
  torch: {
    name: 'Torch', type: 'light',
    description: 'An ancient torch that burns with a steady, unwavering flame. It never seems to go out. You try not to think too hard about the physics.',
  },
};

export const SCENERY = {
  mailbox: { name: 'Small Mailbox' },
  front_door: { name: 'Front Door' },
  white_house: { name: 'White House' },
  window: { name: 'Window' },
  great_tree: { name: 'Towering Tree' },
  kitchen_table: { name: 'Kitchen Table' },
  attic_table: { name: 'Dusty Table' },
  trophy_case: { name: 'Trophy Case' },
  oriental_rug: { name: 'Oriental Rug' },
  trap_door: { name: 'Trap Door' },
  troll: { name: 'Troll' },
  cyclops: { name: 'Cyclops' },
  skeleton: { name: 'Adventurer Skeleton' },
  claw_marks: { name: 'Claw Marks' },
  ceiling_carvings: { name: 'Ancient Carvings' },
  treasure_heaps: { name: 'Heaps of Treasure' },
};

export const DEATHS = {
  grue: {
    title: 'Eaten by a Grue',
    text: 'Oh dear. It appears you have been eaten by a grue. If it’s any consolation, the grue found you quite delicious. They have, it must be said, excellent taste.',
  },
  troll: {
    title: 'Axed a Question',
    text: 'The troll’s axe finds its mark with the mechanical precision of a creature that has been doing this for centuries. Your adventuring career comes to an abrupt and somewhat messy conclusion.',
  },
  cyclops: {
    title: 'A Particularly Crunchy Snack',
    text: 'You attack the Cyclops a second time. The Cyclops, who had been willing to write off the first attempt as a cultural misunderstanding, is not willing to write off this one. What follows is brief, loud, and best described from a distance. The Cyclops picks its teeth with your sword.',
  },
  fall: {
    title: 'Gravity: 1, You: 0',
    text: 'You get almost four meters up the trunk before discovering that ambition is not a climbing tool. You fall for what feels like a very long time. Long enough to contemplate your choices. Long enough to compose a brief autobiography. Long enough to—',
  },
};

export const TEXT = {
  // Room narration: first visit / repeat visits.
  room_west_of_house_first: 'You are standing in an open field west of a white house, with a boarded front door. There is a small mailbox here. The afternoon sun casts long shadows across the overgrown lawn. Something about this place feels... significant.',
  room_west_of_house: 'West of the white house. The mailbox stands sentinel, as always.',
  room_north_of_house_first: 'You are facing the north side of a white house. There is no door here, and all the windows are boarded up. The house is committed to its privacy.',
  room_north_of_house: 'The north side of the house. Still no door. Still boarded up.',
  room_south_of_house_first: 'You are facing the south side of a white house. The boarded windows give nothing away. A well-worn path circles the building, worn by feet much like yours. None of those people were ever seen again, probably.',
  room_south_of_house: 'The south side of the house. The path is still worn. You are still on it.',
  room_east_of_house_first: 'Behind the house, you find a small window that is slightly ajar. Curtains billow gently in the breeze, as if inviting you in. Windows do not normally have motives. This one might.',
  room_east_of_house: 'Behind the house. The window beckons.',
  room_forest_path_first: 'A path winds through a dim forest of towering trees. One tree in particular dwarfs the others, its lowest branches a good four meters up. High in those branches, something glints. Of course it does.',
  room_forest_path: 'The forest path. The towering tree looms. The glint glints.',
  room_kitchen_first: 'You find yourself in the kitchen of the white house. A table seems to have been used recently for the preparation of food. Through the doorway to the west, you can see a living room. A dark staircase leads upward.',
  room_kitchen: 'The kitchen. Crumbs on the table suggest someone was here not long ago.',
  room_living_room_first: 'The living room is tastefully furnished. A trophy case stands against the wall, conspicuously empty. A large oriental rug covers the center of the floor, with an odd lump beneath it. Above the mantel hang a battered brass lantern and an elvish sword — the household essentials.',
  room_living_room: 'The living room. The trophy case watches you expectantly.',
  room_attic_first: 'This is the attic. The only exit is a stairway leading down. In one corner is a dusty table bearing a nasty-looking knife and a length of rope. Standard attic inventory.',
  room_attic: 'The attic. Dusty, cramped, and full of regret.',
  room_cellar_first: 'You are in a dark and damp cellar with a narrow passageway leading north, an opening to the east, and a stairway leading up. The sound of dripping water echoes somewhere in the darkness below. Welcome to the Great Underground Empire.',
  room_cellar: 'The cellar. Your gateway to the underground. The dripping hasn’t stopped.',
  room_gallery_first: 'This appears to be an art gallery, in the sense that it is a room with exactly one painting in it. The painting is magnificent. The curation is questionable.',
  room_gallery: 'The gallery. Admission remains free, which feels right.',
  room_troll_room_first: 'This is a small room with passages leading south and east. A menacing troll stands here, blocking the eastern passage. He is brandishing a bloody axe and eyeing you with the kind of enthusiasm usually reserved for lunch.',
  room_troll_room: 'The troll room. The smell alone could fell a lesser adventurer.',
  room_troll_room_after: 'The troll room. A few bloodstains on the ground are the only reminder of your earlier encounter.',
  room_maze_entrance_first: 'You are in a maze of twisty little passages, all alike. The walls press close. Every direction looks the same. You are already lost.',
  room_maze_entrance: 'A maze of twisty little passages, all alike.',
  room_maze_2_first: 'A maze of twisty little passages, all alike. Except this one has a skeleton in it, slumped against the wall beside a bag of coins. A cautionary tale with excellent production values.',
  room_maze_2: 'The maze. The skeleton has not moved. That’s the kind of consistency you can build a friendship on.',
  room_maze_3_first: 'A maze of twisty little passages, all alike. You are starting to suspect the architect had exactly one idea.',
  room_maze_3: 'A maze of twisty little passages, all alike.',
  room_maze_dead_end_first: 'Dead end. The passage narrows to nothing. Something has scratched marks into the wall here — claw marks, by the look of them. Recent ones. Beneath them lies a single tattered page, which is a strange thing for a clawed creature to be reading.',
  room_maze_dead_end: 'Dead end. The claw marks seem fresher than before. Probably your imagination.',
  room_round_room_first: 'You are in a circular room with passages leading in several directions. The ceiling arches high above, carved with ancient symbols that seem to shift when you’re not looking directly at them.',
  room_round_room: 'The round room. The carvings on the ceiling are in different positions than you remember.',
  room_narrow_passage_first: 'A narrow passage winds north. The walls are smooth, as though something large has been squeezing through here for centuries. You decline to imagine it.',
  room_narrow_passage: 'The narrow passage. Still narrow. Still a passage.',
  room_loud_room_first: 'This room is DEAFENING. Every footstep returns as a stampede. Your own breathing comes back as a gale. On a pedestal sits a bar of solid platinum, and even the LIGHT in here seems to hum — your lantern’s gentle murmur is amplified into a freight train. Thinking is difficult. Grabbing anything while the room shakes is impossible.',
  room_loud_room: 'The loud room. ROOM. Room. room.',
  room_loud_room_quiet: 'With the light extinguished, the room falls utterly, blessedly silent. And utterly, regrettably dark. Somewhere in that darkness, the platinum bar waits. So might other things.',
  room_cyclops_room_first: 'A huge one-eyed creature sits in the corner of this room, blocking a stairway that leads upward. The Cyclops regards you with mild curiosity, the way you might regard a particularly interesting sandwich.',
  room_cyclops_room: 'The Cyclops room. He’s still here. Still hungry-looking.',
  room_cyclops_room_after: 'The Cyclops room. A knocked-over chair, a cyclops-shaped hole in the east wall, and enormous footprints are all that remain of its former occupant.',
  room_treasure_room_first: 'This room is filled with a dazzling collection of treasures, piled high in gleaming heaps. Gold, jewels, and artifacts of incredible craftsmanship catch what little light reaches here. Someone has been collecting. Someone with one eye and excellent taste.',
  room_treasure_room: 'The treasure room. Even with things missing, it’s still impressive.',

  // Object interactions.
  look_mailbox: 'A small mailbox stands here with its flag raised. Someone might have left you something.',
  look_mailbox_empty: 'The mailbox is empty now. Its flag is down. Its purpose is fulfilled. There is a lesson in that, probably.',
  open_mailbox: 'You open the mailbox and find a small leaflet inside. You take it. The mailbox’s little flag lowers, its life’s work complete.',
  look_front_door: 'The front door is boarded shut with what appears to be genuine enthusiasm. Whoever sealed this house did not want to be followed.',
  use_front_door: 'You tug at the boards. They do not move. The house is committed to its privacy, and frankly, you respect that.',
  look_white_house: 'A classic white colonial house. Boarded windows, boarded door, immaculate lawn. The architectural style is best described as “foreboding farmhouse.”',
  look_window_closed: 'A small window in the east wall. It’s slightly ajar, and a gentle breeze stirs the curtains.',
  look_window_open: 'The window stands open, curtains fluttering. Beyond it, the kitchen waits.',
  window_opened: 'You push the window open. It slides up with a soft groan. Beyond it, you can see a modest kitchen. Climbing through a stranger’s window: the first step of every great adventure, and most felonies.',
  window_already_open: 'The window is already open. You’ve done the hard part. The crime part.',
  look_great_tree: 'The tree is enormous. The lowest branch is a good four meters up. You were not built for this. High above, nestled among the leaves, something glints — jeweled, egg-shaped, and thoroughly out of reach.',
  look_great_tree_taken: 'The great tree, now egg-less. The rope still dangles from its branches, a monument to the one good decision you’ve made today.',
  climb_tree_no_rope: 'You size up the trunk, spit on your hands, and begin to climb.',
  use_rope_on_tree: 'You hurl the rope over the lowest branch on the third try (the narrator counted), tie it off, and haul yourself up into the canopy. There, in an abandoned bird’s nest of improbable size, sits the jewel-encrusted egg. You take it and climb down with your dignity mostly intact.',
  look_kitchen_table: 'A wooden table, recently used for the preparation of food. The crumbs suggest sandwiches. The knife marks suggest aggression.',
  look_attic_table: 'A dusty table. Its entire career has been holding a knife and a rope, and it has performed flawlessly.',
  look_trophy_case: 'The trophy case gleams emptily. It has room for many treasures. Perhaps you should find some.',
  look_trophy_case_partial: 'The trophy case holds {count} of 5 treasures. It wants the rest. You can feel it wanting.',
  look_trophy_case_full: 'The trophy case is full, radiant, complete. It has achieved its final form. You made this possible. The case will never thank you.',
  look_oriental_rug: 'A beautiful oriental rug, intricately woven with patterns that might be a map, or might be purely decorative. There’s definitely something lumpy underneath it.',
  look_oriental_rug_moved: 'The rug lies rolled against the wall, its secret spilled. It seems smaller now. Secrets were most of its volume.',
  rug_moved: 'You roll back the oriental rug, revealing a closed trap door set into the floor. The narrator would like to note that this was not subtle.',
  rug_already_moved: 'You’ve already moved the rug. It’s not going to un-reveal the trap door.',
  look_trap_door: 'A heavy wooden trap door set into the floor. Beyond it, darkness. And dripping. Always with the dripping.',
  look_trap_door_open: 'An open trap door reveals a dark stairway leading down. Cold air rises from below, carrying the scent of earth, ancient stone, and poor decisions.',
  trap_door_opened: 'The trap door opens with a reluctant creak, revealing a dark stairway leading down. A cold draft rises from below, carrying the scent of earth and ancient stone. And something else. Something watching.',
  trap_door_already_open: 'The trap door is already open. The darkness below is patient.',
  look_troll: 'The troll is a fearsome creature — stocky, muscular, and possessed of an axe that has clearly seen extensive use. He blocks the eastern passage with the confidence of someone who has never lost a fight. Or at least, never lost one he remembers.',
  talk_troll: 'You attempt small talk. The troll responds with a gesture involving the axe that transcends language barriers. Negotiations have concluded.',
  attack_troll_unarmed: 'You consider attacking the troll with your bare hands. The troll considers this too, with visible delight. Perhaps something with an edge would improve your odds.',
  look_skeleton: 'The skeleton of some unlucky adventurer, slumped against the wall. Its bony hand still gestures toward the bag of coins, as if to say: “worth it.”',
  talk_skeleton: 'You ask the skeleton how things are going. The conversation is one-sided but, you must admit, remarkably free of arguments.',
  look_claw_marks: 'Long, deep gouges in the stone. Whatever made these was large, strong, and — judging by the tally marks beside them — keeping count of something. You decide not to wonder what.',
  look_ceiling_carvings: 'Ancient symbols spiral across the ceiling. As you watch, you could swear one of them slowly rearranges itself. You look away. It is best for everyone if you both pretend that didn’t happen.',
  look_cyclops: 'The Cyclops is enormous — easily twice your height. Its single eye tracks your movements with an intelligence that’s somehow more unsettling than simple hostility. It’s said that these creatures have long memories. Perhaps it knows something about a certain Greek hero...',
  talk_cyclops: 'The Cyclops regards you with its enormous eye. “HUNGRY,” it says, in a voice like grinding boulders. Not the most stimulating conversationalist.',
  attack_cyclops_warning: 'You take a swing at the Cyclops. The blow bounces off its hide. The Cyclops slowly turns its eye toward you, less angry than disappointed, and wags one enormous finger. You get the strong impression that there will not be a second warning. Because there will not be a second warning.',
  show_cyclops_sword: 'You wave the sword at the Cyclops. It yawns. Your sword is, to this creature, approximately the size of a toothpick. A very pretty toothpick, but a toothpick nonetheless.',
  show_cyclops_generic: 'The Cyclops examines your {item} with mild curiosity, then ignores it.',
  cyclops_flees: 'You hold up the tattered page. The Cyclops’s single eye scans the verse, goes wide with terror. “ODYSSEUS!” it shrieks, in a register that should not be available to something that size. The creature scrambles backward and crashes straight THROUGH the east wall in a blind panic, leaving a cyclops-shaped hole and a new appreciation for Greek literature. The stairway upward is clear.',
  look_treasure_heaps: 'Heaps of gold and jewels, collected over centuries. Most of it is bolted down, fused together, or cursed — the Cyclops was a collector, not an organizer. Only the finest pieces are worth carrying off.',
  look_hole: 'A cyclops-shaped hole in the wall. The silhouette is quite detailed. You can make out the panic.',

  // Lamp & darkness.
  lamp_on: 'The brass lantern is now on.',
  lamp_off: 'The brass lantern is now off.',
  lamp_dead: 'The lamp has run out of fuel. It flickers and dies.',
  lamp_warm: 'The lamp seems a bit dimmer now.',
  lamp_flicker: 'The lamp flickers uncertainly. It won’t last much longer.',
  lamp_sputter: 'The lamp sputters and gasps. You can almost hear it begging for mercy.',
  lamp_out: 'The lamp has finally given up the ghost. Darkness closes in around you.',
  torch_on: 'The torch flares to life with a steady, eternal flame.',
  torch_off: 'You smother the eternal flame. It will reignite when you will it to. Don’t ask how. It’s that kind of torch.',
  darkness_warning: 'It is pitch black. You are likely to be eaten by a grue.',
  grue_lurk: 'You hear something breathing. It is not you. It is very close, and it is very patient, and your time is very much up at the next sound.',
  pity_fuel: 'The Grim Rewind, in a rare display of mercy, has wound a little extra fuel back into your lamp. Don’t get used to it.',

  // Loud room puzzle.
  take_bar_loud: 'You reach for the platinum bar and the room ERUPTS — your own heartbeat crashes back at you like artillery. You snatch your hand back. The echo of the light itself is shaking the pedestal. Perhaps if the room were... quieter. Darker, even.',
  take_bar_quiet: 'In the silent dark, your fingers close around cold platinum. The room holds its breath. Somewhere nearby, something else holds its breath too. Time to go. Time to LIGHT. Time to GO.',

  // Combat.
  combat_intro: 'The troll raises its axe and charges! This seems like a good time to use that sword.',
  combat_intro_knife: 'The troll raises its axe and charges! You raise your... knife. The troll looks briefly insulted, then swings anyway.',
  combat_hit: 'Your blade finds its mark! The troll stumbles backward, looking more surprised than hurt.',
  combat_miss: 'The troll sidesteps your attack with surprising grace for something so ugly.',
  combat_dodge: 'You duck just in time. The axe whistles past your ear, trimming a few hairs.',
  combat_fail_dodge: 'Too slow! The troll’s axe catches you across the shoulder. That’s going to leave a mark.',
  troll_defeated: 'With a final, desperate swing, you land a decisive blow. The troll crumples, its axe clattering away. It lets out a sound somewhere between a groan and a whimper, then crawls off into the shadows to reconsider its career. The eastern passage is clear.',
  use_sword_on_troll: 'You raise the elvish sword, which pulses with eager blue light. The troll narrows its eyes. Here we go.',

  // Inventory & treasure.
  take_generic: 'Taken.',
  take_lantern: 'Taken. The lantern is heavier than it looks. Most responsibilities are.',
  take_sword: 'Taken. The sword hums faintly in your grip, like it knows something you don’t. It does.',
  cant_take: 'You can’t take that.',
  treasure_placed: 'You place the {item} carefully in the trophy case. It catches the light beautifully. The case seems almost... satisfied.',
  trophy_case_no_treasure: 'You have no treasures to place. The trophy case sighs with disappointment.',
  trophy_case_wrong_item: 'The trophy case is for treasures, not... whatever that is.',
  game_won: 'The final treasure settles into place, and the trophy case BLAZES with golden light. Somewhere far below, the Great Underground Empire rumbles its grudging approval. You have done it. You have looted an entire civilization and arranged it attractively behind glass. They will write songs about you. Short songs, but songs.',

  // Misc.
  no_exit: 'You can’t go that way.',
  use_generic: 'Nothing happens. You both pretend that was intentional.',
  use_item_generic: 'That doesn’t seem to accomplish anything. The {item} is unbothered.',

  idle_1: 'The adventurer stands motionless, contemplating the void. The grue considers this an invitation.',
  idle_2: 'You appear to be doing nothing. This is, historically, not a survival strategy in the Great Underground Empire.',
  idle_3: 'Time passes. The lamp burns. The darkness watches.',
  idle_4: 'If you’re waiting for the puzzles to solve themselves, I have disappointing news.',
  idle_5: 'The narrator clears his throat pointedly.',
  idle_6: 'Are you still there? The Great Underground Empire doesn’t explore itself.',
};

export const IDLE_LINES = ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'idle_5', 'idle_6'];

export function fmt(key, params = {}) {
  let s = TEXT[key] ?? key;
  for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, v);
  return s;
}
