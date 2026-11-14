// Milestone 1 game state. The same object is used by every screen.
const seal = {
  sex: "",
  coatColour: "",
  spotPattern: "",
  health: 3,
  energy: 3,
  endingAge: "",
  milestones: {
    learnedToSwim: false,
    completedFirstHunt: false,
    reachedAdulthood: false,
    enteredLaterLife: false
  },
  memories: {
    exploredNewWaters: false,
    encounteredMarineDebris: false,
    experiencedDisturbance: false,
    exploredAsPup: false,
    playedAsPup: false,
    wasRescued: false,
    survivedEarlyInjury: false,
    successfulBreedingDisplay: false,
    unsuccessfulBreedingDisplay: false,
    injuredDuringBreeding: false,
    fatheredOffspring: false,
    becameMother: false,
    leftPupToForage: false,
    stayedWithPup: false,
    injuredByDebrisLater: false,
    experiencedIllness: false,
    reachedOldAge: false,
    diedWhileExhausted: false,
    criticalConditionTriggered: false,
    criticalButNotRescued: false,
    rescuedDuringLaterLife: false,
    releasedAfterLaterRescue: false,
    enteredPermanentHumanCare: false,
    engagedWithEnrichment: false,
    healthDeclinedInHumanCare: false,
    diedInHumanCare: false,
    reachedExceptionalWildAge: false,
    reachedExceptionalHumanCareAge: false
  }
};

// First Swim state is separate from the seal so existing character data and stats persist.
const firstSwim = {
  collisions: 0,
  progress: 0,
  journeyComplete: false,
  reachedMother: false,
  obstacles: [],
  isRunning: false,
  isDragging: false,
  immunityUntil: 0,
  lastFrameTime: 0,
  spawnTimer: 0,
  animationFrame: 0,
  messageTimer: 0,
  playerPosition: { x: 0, y: 0 },
  dragOffset: { x: 0, y: 0 },
  dragResponsiveness: 1
};

// Energy limits are shared by later events so results cannot exceed the game's bounds.
const MIN_ENERGY = 0;
const MAX_ENERGY = 3;
const MAX_HEALTH = 3;
const AUDIO_MUSIC_VOLUME = 0.15;
const AUDIO_SFX_VOLUMES = {
  collision: 0.22,
  food: 0.28,
  debris: 0.22,
  sealCall: 0.35
};
const AUDIO_ASSETS = {
  ambient: "assets/audio/ambient.wav",
  collision: "assets/audio/collision.wav",
  food: "assets/audio/food.wav",
  debris: "assets/audio/debris.wav",
  sealCall: "assets/audio/seal-call.wav"
};
const audioSystem = {
  enabled: true,
  musicStarted: false,
  music: new Audio(),
  activeSfx: new Set(),
  toggleButton: document.querySelector("#sound-toggle"),

  initialize() {
    this.music.preload = "none";
    this.music.src = AUDIO_ASSETS.ambient;
    this.music.loop = true;
    this.music.volume = AUDIO_MUSIC_VOLUME;
    this.toggleButton.addEventListener("click", () => this.toggle());
  },

  startMusic() {
    const isFirstStart = !this.musicStarted;
    this.musicStarted = true;
    if (isFirstStart) {
      this.music.preload = "auto";
      this.music.load();
    }
    this.playMusic();
  },

  playMusic() {
    if (!this.enabled || !this.musicStarted) return;
    this.music.play().catch(() => {});
  },

  playSfx(name) {
    if (!this.enabled) return;
    const volume = AUDIO_SFX_VOLUMES[name];
    const source = AUDIO_ASSETS[name];
    if (volume === undefined || !source) return;
    const sound = new Audio(source);
    sound.volume = volume;
    this.activeSfx.add(sound);
    const releaseSound = () => {
      this.activeSfx.delete(sound);
    };
    sound.addEventListener("ended", releaseSound, { once: true });
    sound.addEventListener("error", releaseSound, { once: true });
    sound.play().catch(() => {
      releaseSound();
    });
  },

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.playMusic();
    } else {
      this.music.pause();
      this.activeSfx.forEach((sound) => sound.pause());
      this.activeSfx.clear();
    }
    this.toggleButton.textContent = this.enabled ? "🔊" : "🔇";
    this.toggleButton.setAttribute(
      "aria-label",
      this.enabled ? "Mute game audio" : "Enable game audio"
    );
    this.toggleButton.title = this.enabled ? "Mute game audio" : "Enable game audio";
  }
};
audioSystem.initialize();
// Game design mechanics only; these are not real-world mortality statistics.
const EXHAUSTION_ADVERSE_BONUS = 0.2;
const FOOD_SCARCITY_ADVERSE_PROBABILITY = 0.4;
const DEBRIS_INJURY_PROBABILITY = 0.35;
const ILLNESS_WEAKENING_PROBABILITY = 0.35;
// Game-design aging probabilities — not real-world mortality statistics.
const WILD_AGE_NATURAL_END_PROBABILITIES = {
  12: 0,
  18: 0.01,
  23: 0.03,
  27: 0.08,
  30: 0.14,
  33: 0.22,
  36: 0.32
};
const WILD_HEALTH_NATURAL_END_BONUS = 0.04;
const HUMAN_CARE_BASE_NATURAL_END_PROBABILITY = 0.12;
const HUMAN_CARE_NATURAL_END_AGE_BONUS = 0.04;
const HUMAN_CARE_HEALTH_NATURAL_END_BONUS = 0.08;
// Prototype game-design probability for route accessibility — not real-world rescue statistics.
const CRITICAL_FOUND_PROBABILITY = 0.7;
const CRITICAL_NOT_FOUND_PROBABILITY = 0.3;
const REHABILITATION_RELEASE_PROBABILITY = 0.55;
const HUMAN_CARE_RECOVERY_PROBABILITY = 0.35;
const HUMAN_CARE_TREATMENT_FAILURE_PROBABILITY = 0.35;
const HUMAN_CARE_NATURAL_END_BONUS = 0.05;
const AGE_40_END_PROBABILITY = 0.8;
// Game design probabilities only; these are not real-world Harbor Seal rescue statistics.
const RESCUE_PROBABILITY = 0.4;
const SURVIVAL_WITHOUT_RESCUE_PROBABILITY = 0.4;
const RESCUE_HEALTH_RECOVERY = 1;
// Game design probabilities only; these are not real Harbor Seal statistics.
const DISPLAY_FAST_TIME = 8;
const DISPLAY_SLOW_TIME = 20;
const DISPLAY_FAST_SUCCESS_PROBABILITY = 0.7;
const DISPLAY_SLOW_SUCCESS_PROBABILITY = 0.35;
const DISPLAY_ESCALATION_PROBABILITY = 0.2;
const BREEDING_INJURY_PROBABILITY = 0.5;
// Game design probability only; this is not real reproductive statistics.
const MATING_SUCCESS_PROBABILITY = 0.6;
const DISPLAY_BASE_CALL_GAIN = 3.6;
const DISPLAY_ENERGY_GAIN_PER_LEVEL = 0.47;
const DISPLAY_STRONG_TIME = 3.5;
const DISPLAY_WEAK_TIME = 4;
// Temporary prototype thresholds; adjust these values after playtesting.
const LOW_THRESHOLD = 15;
const HIGH_THRESHOLD = 21;

// First Hunt has independent state and never places the seal in its play area.
const firstHunt = {
  timeRemaining: 30,
  score: 0,
  debrisCount: 0,
  interrupted: false,
  objects: [],
  isRunning: false,
  animationFrame: 0,
  lastFrameTime: 0,
  spawnTimer: 0,
  timerAccumulator: 0
};

const adultDisplay = {
  energy: 0,
  isRunning: false,
  startedAt: 0,
  calls: 0,
  completionTime: 0,
  strength: "",
  outcomeShown: false,
  maleOutcome: ""
};

const displaySoundWaves = {
  rivalResponseTimer: 0,
  rivalHideTimer: 0
};
const DISPLAY_WAVE_DURATION = 1100;

const laterLife = {
  // Wild ages are intentionally extended so exceptional lives can continue beyond 30.
  ages: [12, 18, 23, 27, 30, 33, 36, 40],
  ageIndex: 0,
  currentEvent: null,
  usedEvents: [],
  consequenceShown: false,
  currentAge: 5,
  route: "wild",
  criticalPending: false,
  criticalReturn: "later",
  criticalPhase: "",
  rehabilitationPhase: "",
  humanCareAges: [30, 35, 40, 45],
  humanCareAgeIndex: 0,
  humanCareUsedEvents: []
};

const juvenileStage = {
  events: [],
  currentIndex: 0,
  consequenceShown: false
};

const earlyLifeStage = {
  event: null,
  consequenceShown: false
};

const rescueState = {
  phase: "intro",
  outcome: ""
};

// One early-life event is selected for each life.
const earlyLifeEventPool = [
  {
    title: "RESTING ON SHORE",
    story: ["You rest beside your mother on the shore.", "Something moves nearby."],
    choices: [
      { label: "STAY CLOSE", resolve: () => ({ text: "You remain beside your mother." }) },
      {
        label: "MOVE TOWARD THE WATER",
        resolve: () => ({ text: "You move closer to the safety of the water.", energyChange: -1 })
      }
    ]
  },
  {
    title: "FOLLOWING MOTHER",
    story: ["Your mother enters the water again.", "This time, you follow without hesitation."],
    choices: [
      { label: "STAY CLOSE", resolve: () => ({ text: "You stay close as she moves through the water." }) },
      {
        label: "EXPLORE NEARBY",
        resolve: () => ({
          text: "You explore the nearby water before returning.",
          energyChange: -1,
          memory: "exploredAsPup"
        })
      }
    ]
  },
  {
    title: "A QUIET DAY",
    story: ["The sea is calm today.", "You spend the day beside your mother."],
    choices: [
      {
        label: "REST",
        resolve: () => ({ text: "You conserve your energy.", energyChange: 1 })
      },
      {
        label: "PLAY IN THE WATER",
        resolve: () => ({
          text: "You spend your energy exploring and playing in the water.",
          energyChange: -1,
          memory: "playedAsPup"
        })
      }
    ]
  }
];

// Each event owns its text and consequence rules so more events can be added later.
const juvenileEventPool = [
  {
    id: "unfamiliar-waters",
    title: "UNFAMILIAR WATERS",
    story: ["Food has become harder to find nearby.", "Beyond the familiar coast, the water is unknown."],
    choices: [
      { label: "STAY NEAR HOME", resolve: () => ({ text: "You remain in familiar waters." }) },
      {
        label: "EXPLORE FARTHER",
        resolve: () => ({
          text: "You spend more energy exploring beyond the familiar coast.",
          energyChange: -1,
          memory: "exploredNewWaters"
        })
      }
    ]
  },
  {
    id: "something-floating",
    title: "SOMETHING FLOATING",
    story: ["Something unfamiliar is floating ahead.", "You cannot tell what it is from a distance."],
    choices: [
      {
        label: "APPROACH",
        resolve: () => Math.random() < 0.5
          ? { text: "It drifts past without causing harm." }
          : { text: "It is marine debris.", healthChange: -1, memory: "encounteredMarineDebris" }
      },
      { label: "AVOID", resolve: () => ({ text: "You keep your distance and continue swimming." }) }
    ]
  },
  {
    id: "crowded-shore",
    title: "A CROWDED SHORE",
    story: ["Your usual resting place is unusually busy today."],
    choices: [
      {
        label: "REST HERE",
        resolve: () => Math.random() < 0.5
          ? { text: "You manage to rest without disturbance." }
          : { text: "The disturbance prevents you from resting properly.", energyChange: -1, memory: "experiencedDisturbance" }
      },
      {
        label: "FIND ANOTHER PLACE",
        resolve: () => ({ text: "You spend extra energy searching for a quieter place.", energyChange: -1 })
      }
    ]
  }
];

// These multipliers are intentionally easy to adjust during playtesting.
const obstacleSpeedStages = [
  { belowProgress: 30, multiplier: 1 },
  { belowProgress: 70, multiplier: 1.2 },
  { belowProgress: 100, multiplier: 1.4 }
];

const laterLifeEvents = [
  {
    id: "familiar-shore",
    title: "A FAMILIAR SHORE",
    story: ["You return to a resting place you have known for years.", "The sea is quiet."],
    choices: [
      { label: "REST", consequence: "You allow yourself to recover.", effect: () => changeEnergy(1) },
      { label: "KEEP MOVING", consequence: "You continue through the water.", effect: () => changeEnergy(-1) }
    ]
  },
  {
    id: "food-scarce",
    title: "FOOD IS SCARCE",
    story: ["Finding food has become difficult this season."],
    choices: [
      {
        label: "SEARCH FARTHER",
        resolve: () => {
          changeEnergy(-1);
          const adverseChance = FOOD_SCARCITY_ADVERSE_PROBABILITY
            + (seal.energy === MIN_ENERGY ? EXHAUSTION_ADVERSE_BONUS : 0);
          if (Math.random() < adverseChance) {
            return "You return without finding enough.";
          }
          changeEnergy(1);
          return "You eventually find food.";
        }
      },
      { label: "REST AND WAIT", consequence: "You conserve what energy you have.", effect: () => {} }
    ]
  },
  {
    id: "obstructed-path",
    title: "AN OBSTRUCTED PATH",
    story: ["Marine debris drifts across the water ahead."],
    choices: [
      { label: "TURN BACK", consequence: "You take the longer route.", effect: () => changeEnergy(-1) },
      {
        label: "PASS THROUGH",
        resolve: () => {
          const injuryChance = DEBRIS_INJURY_PROBABILITY
            + (seal.energy === MIN_ENERGY ? EXHAUSTION_ADVERSE_BONUS : 0);
          if (Math.random() < injuryChance) {
            changeHealth(-1);
            seal.memories.injuredByDebrisLater = true;
            return "You are injured.";
          }
          return "You pass through safely.";
        }
      }
    ]
  },
  {
    id: "unexpected-illness",
    title: "AN UNEXPECTED ILLNESS",
    story: ["One season, you become ill.", "There is nothing to choose but to endure it."],
    choices: [
      {
        label: "CONTINUE",
        resolve: () => {
          if (Math.random() < ILLNESS_WEAKENING_PROBABILITY) {
            changeHealth(-1);
            seal.memories.experiencedIllness = true;
            return "The illness leaves you weaker.";
          }
          return "You recover with time.";
        }
      }
    ]
  }
];

const humanCareEvents = [
  {
    id: "regular-care",
    title: "REGULAR CARE",
    story: ["Your days now follow a different rhythm.", "Food arrives regularly, and your condition is monitored."],
    choices: [
      {
        label: "CONTINUE",
        resolve: () => {
          if (seal.health < MAX_HEALTH && Math.random() < HUMAN_CARE_RECOVERY_PROBABILITY) {
            changeHealth(1);
            return "Your condition improves a little with regular care.";
          }
          return "Your condition remains steady.";
        }
      }
    ]
  },
  {
    id: "enrichment",
    title: "ENRICHMENT",
    story: ["New objects and activities are introduced into your environment."],
    choices: [
      {
        label: "EXPLORE",
        consequence: "You investigate the new objects and activities.",
        effect: () => {
          changeEnergy(-1);
          seal.memories.engagedWithEnrichment = true;
        }
      },
      {
        label: "REST",
        consequence: "You rest while the new objects remain nearby.",
        effect: () => changeEnergy(1)
      }
    ]
  },
  {
    id: "medical-treatment",
    title: "MEDICAL TREATMENT",
    story: ["As you grow older, you receive treatment for a health problem."],
    choices: [
      {
        label: "CONTINUE",
        resolve: () => {
          if (Math.random() < HUMAN_CARE_TREATMENT_FAILURE_PROBABILITY) {
            changeHealth(-1);
            seal.memories.healthDeclinedInHumanCare = true;
            return "Your condition continues to weaken.";
          }
          return "The treatment helps stabilize your condition.";
        }
      }
    ]
  }
];

const choices = {
  sex: ["Male", "Female"],
  coatColour: ["Silver Grey", "Blue Grey", "Warm Grey", "Charcoal Grey"],
  spotPattern: ["Sparse", "Medium", "Dense", "Mixed"]
};

// Pick one item from a list for the newly born seal.
function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

// Reset every temporary system so a new life cannot inherit the previous life.
function resetLifeState() {
  firstSwim.obstacles.forEach((obstacle) => obstacle.element.remove());
  firstSwim.isRunning = false;
  window.cancelAnimationFrame(firstSwim.animationFrame);
  firstSwim.obstacles = [];
  firstSwim.collisions = 0;
  firstSwim.progress = 0;
  firstSwim.journeyComplete = false;
  firstSwim.reachedMother = false;
  firstSwim.isDragging = false;

  firstHunt.objects.forEach((huntObject) => huntObject.element.remove());
  firstHunt.isRunning = false;
  window.cancelAnimationFrame(firstHunt.animationFrame);
  firstHunt.objects = [];
  firstHunt.timeRemaining = 30;
  firstHunt.score = 0;
  firstHunt.debrisCount = 0;
  firstHunt.interrupted = false;

  Object.assign(adultDisplay, {
    energy: 0,
    isRunning: false,
    startedAt: 0,
    calls: 0,
    completionTime: 0,
    strength: "",
    outcomeShown: false,
    maleOutcome: ""
  });
  Object.assign(laterLife, {
    ageIndex: 0,
    currentEvent: null,
    usedEvents: [],
    consequenceShown: false,
    currentAge: 5,
    route: "wild",
    criticalPending: false,
    criticalReturn: "later",
    criticalPhase: "",
    rehabilitationPhase: "",
    humanCareAgeIndex: 0,
    humanCareUsedEvents: []
  });
  juvenileStage.events = [];
  juvenileStage.currentIndex = 0;
  juvenileStage.consequenceShown = false;
  earlyLifeStage.event = null;
  earlyLifeStage.consequenceShown = false;
  rescueState.phase = "intro";
  rescueState.outcome = "";
}

// Create the seal once, then display its stored characteristics.
function generateSeal() {
  resetLifeState();
  seal.sex = randomItem(choices.sex);
  seal.coatColour = randomItem(choices.coatColour);
  seal.spotPattern = randomItem(choices.spotPattern);
  seal.health = 3;
  seal.energy = 3;
  seal.endingAge = "";
  seal.milestones = {
    learnedToSwim: false,
    completedFirstHunt: false,
    reachedAdulthood: false,
    enteredLaterLife: false
  };
  seal.memories = {
    exploredNewWaters: false,
    encounteredMarineDebris: false,
    experiencedDisturbance: false,
    exploredAsPup: false,
    playedAsPup: false,
    wasRescued: false,
    survivedEarlyInjury: false,
    successfulBreedingDisplay: false,
    unsuccessfulBreedingDisplay: false,
    injuredDuringBreeding: false,
    fatheredOffspring: false,
    becameMother: false,
    leftPupToForage: false,
    stayedWithPup: false,
    injuredByDebrisLater: false,
    experiencedIllness: false,
    reachedOldAge: false,
    diedWhileExhausted: false,
    criticalConditionTriggered: false,
    criticalButNotRescued: false,
    rescuedDuringLaterLife: false,
    releasedAfterLaterRescue: false,
    enteredPermanentHumanCare: false,
    engagedWithEnrichment: false,
    healthDeclinedInHumanCare: false,
    diedInHumanCare: false,
    reachedExceptionalWildAge: false,
    reachedExceptionalHumanCareAge: false
  };

  document.querySelector("#sex-value").textContent = seal.sex;
  document.querySelector("#coat-value").textContent = seal.coatColour;
  document.querySelector("#spots-value").textContent = seal.spotPattern;
  document.querySelector("#birth-health-value").textContent = seal.health;
  document.querySelector("#birth-energy-value").textContent = seal.energy;
}

// Show one screen and hide the others.
function showScreen(screenId) {
  if (screenId !== "display-screen") {
    clearDisplaySoundWaves();
  }
  document.querySelectorAll(".screen").forEach((screen) => {
    const isCurrent = screen.id === screenId;
    screen.hidden = !isCurrent;
    screen.classList.toggle("screen--active", isCurrent);
  });
  updateSealIllustration(screenId);
  updatePlayerCoatVisuals();
}

const coatClassNames = [
  "coat-silver",
  "coat-blue-grey",
  "coat-warm-grey",
  "coat-charcoal"
];

function applyPlayerCoatClass(element) {
  if (!element) return;
  element.classList.remove(...coatClassNames);
  const coatClass = {
    "Silver Grey": "coat-silver",
    "Blue Grey": "coat-blue-grey",
    "Warm Grey": "coat-warm-grey",
    "Charcoal Grey": "coat-charcoal"
  }[seal.coatColour];
  if (coatClass) element.classList.add(coatClass);
}

function updatePlayerCoatVisuals() {
  document.querySelectorAll("#player-seal, .display-seal--you").forEach(applyPlayerCoatClass);
  const storyImage = document.querySelector(".screen--active .seal-stage-image");
  const isMultiSealIllustration = storyImage
    && (storyImage.src.endsWith("/adult-and-pup.png") || storyImage.src.endsWith("/mother-and-pup.png"));
  if (storyImage && !isMultiSealIllustration) {
    applyPlayerCoatClass(storyImage);
  } else if (storyImage) {
    storyImage.classList.remove(...coatClassNames);
  }
}

const screenIllustrations = {
  "birth-screen": ["pup-resting.png", "A resting Harbor Seal pup"],
  "story-screen": ["pup-resting.png", "A Harbor Seal pup resting on shore"],
  "rescue-event-screen": ["seal-weakened.png", "A weakened Harbor Seal"],
  "early-life-transition-screen": ["mother-and-pup.png", "A mother seal with her pup"],
  "early-life-screen": ["pup-resting.png", "A Harbor Seal pup resting"],
  "hunt-transition-screen": ["pup-resting.png", "A Harbor Seal pup resting on shore"],
  "first-hunt-screen": ["pup-swimming.png", "A Harbor Seal pup swimming"],
  "juvenile-transition-screen": ["pup-resting.png", "A young Harbor Seal resting"],
  "juvenile-screen": ["pup-resting.png", "A young Harbor Seal resting"],
  "years-pass-screen": ["adult-resting.png", "An adult Harbor Seal resting"],
  "adult-screen": ["adult-resting.png", "An adult Harbor Seal resting"],
  "male-season-screen": ["adult-resting.png", "An adult Harbor Seal resting"],
  "male-outcome-screen": ["adult-resting.png", "An adult Harbor Seal resting"],
  "reproduction-screen": ["adult-resting.png", "An adult Harbor Seal resting"],
  "female-birth-screen": ["adult-and-pup.png", "An adult Harbor Seal with a pup"],
  "motherhood-screen": ["adult-and-pup.png", "An adult Harbor Seal with a pup"],
  "later-transition-screen": ["adult-resting.png", "An adult Harbor Seal resting"],
  "later-life-screen": ["adult-resting.png", "An adult Harbor Seal resting"],
  "critical-screen": ["seal-weakened.png", "A weakened Harbor Seal"],
  "rehabilitation-screen": ["seal-weakened.png", "A weakened Harbor Seal receiving care"],
  "old-life-screen": ["adult-resting.png", "An older Harbor Seal resting"],
  "life-ending-screen": ["seal-weakened.png", "A weakened Harbor Seal"],
  "life-record-screen": ["adult-resting.png", "A Harbor Seal portrait"]
};

function updateSealIllustration(screenId) {
  const illustration = screenIllustrations[screenId];
  if (!illustration) return;
  let selectedIllustration = screenId !== "birth-screen" && seal.health <= 1
    ? ["seal-weakened.png", "A weakened Harbor Seal"]
    : illustration;
  if (
    screenId === "life-record-screen"
    && seal.health > 1
    && seal.memories.becameMother
    && (seal.memories.leftPupToForage || seal.memories.stayedWithPup)
  ) {
    selectedIllustration = ["adult-and-pup.png", "An adult Harbor Seal with a pup"];
  }
  const screen = document.querySelector(`#${screenId}`);
  const image = screen.querySelector(".seal-stage-image");
  if (image) {
    image.src = `assets/seals/${selectedIllustration[0]}`;
    image.alt = selectedIllustration[1];
    return;
  }
  const container = screen.querySelector(".story-card, .screen__content");
  if (!container) return;
  const newImage = document.createElement("img");
  newImage.className = "seal-stage-image";
  newImage.src = `assets/seals/${selectedIllustration[0]}`;
  newImage.alt = selectedIllustration[1];
  const heading = container.querySelector("h1, h2");
  container.insertBefore(newImage, heading || container.firstChild);
}

function setCurrentSealIllustration(filename, alt) {
  const image = document.querySelector(".screen--active .seal-stage-image");
  if (!image) return;
  image.src = `assets/seals/${filename}`;
  image.alt = alt;
  updatePlayerCoatVisuals();
}

function energyIndicator(value) {
  return "●".repeat(value) + (value === MIN_ENERGY ? " EXHAUSTED" : "");
}

function healthIndicator(value) {
  return "●".repeat(value) + (value === 1 ? " CRITICAL" : "");
}

function changeEnergy(amount) {
  seal.energy = Math.max(MIN_ENERGY, Math.min(MAX_ENERGY, seal.energy + amount));
}

function changeHealth(amount) {
  const previousHealth = seal.health;
  seal.health = Math.max(0, Math.min(MAX_HEALTH, seal.health + amount));
  if (
    laterLife.route === "wild"
    && previousHealth === 2
    && seal.health === 1
    && !seal.memories.criticalConditionTriggered
  ) {
    laterLife.criticalPending = true;
  }
}

// Wire up the three screens and the two first story choices.
document.querySelector("#new-life-button").addEventListener("click", () => {
  audioSystem.startMusic();
  generateSeal();
  showScreen("birth-screen");
});

document.querySelector("#begin-life-button").addEventListener("click", () => {
  resetWaitFlow();
  document.querySelector("#story-health").textContent = healthIndicator(seal.health);
  document.querySelector("#story-energy").textContent = energyIndicator(seal.energy);
  showScreen("story-screen");
});

document.querySelector("#wait-button").addEventListener("click", () => {
  document.querySelector("#wait-button").disabled = true;
  document.querySelector("#water-button").disabled = true;
  document.querySelector("#story-screen .choices").hidden = true;
  document.querySelector("#consequence").textContent = "You stay where your mother left you.";
  document.querySelector("#wait-flow").hidden = false;
});

document.querySelector("#water-button").addEventListener("click", () => {
  startFirstSwim();
});

function resetWaitFlow() {
  document.querySelector("#story-screen .choices").hidden = false;
  document.querySelector("#wait-button").disabled = false;
  document.querySelector("#water-button").disabled = false;
  document.querySelector("#consequence").textContent = "";
  document.querySelector("#wait-flow").hidden = true;
  document.querySelector("#wait-step-button").hidden = false;
  document.querySelector("#wait-enter-water-button").hidden = true;
}

document.querySelector("#wait-step-button").addEventListener("click", () => {
  document.querySelector("#wait-step-button").hidden = true;
  document.querySelector("#wait-enter-water-button").hidden = false;
  document.querySelector("#consequence").textContent =
    "Some time passes.\n\nYour mother still hasn't returned.";
});

document.querySelector("#wait-enter-water-button").addEventListener("click", () => {
  startFirstSwim();
});

const gameArea = document.querySelector("#game-area");
const playerSeal = document.querySelector("#player-seal");
const motherSeal = document.querySelector("#mother-seal");

function updateStatusBar() {
  document.querySelector("#swim-health").textContent = healthIndicator(seal.health);
  document.querySelector("#swim-energy").textContent = energyIndicator(seal.energy);
  document.querySelector("#collision-count").textContent = `${firstSwim.collisions} / 3`;
}

function updateHuntStatus() {
  document.querySelector("#hunt-health").textContent = healthIndicator(seal.health);
  document.querySelector("#hunt-energy").textContent = energyIndicator(seal.energy);
  document.querySelector("#hunt-time").textContent = `00:${String(firstHunt.timeRemaining).padStart(2, "0")}`;
  document.querySelector("#hunt-score").textContent = firstHunt.score;
  document.querySelector("#hunt-debris").textContent = `${firstHunt.debrisCount} / 3`;
}

function setSwimMessage(message) {
  const messageElement = document.querySelector("#swim-message");
  messageElement.textContent = message;
  window.clearTimeout(firstSwim.messageTimer);
  firstSwim.messageTimer = window.setTimeout(() => {
    if (firstSwim.isRunning) {
      messageElement.textContent = "Drag your seal through the water and avoid the rocks and seaweed.";
    }
  }, 1800);
}

// Keep the seal inside the playfield, including after a responsive resize.
function constrainPlayerPosition() {
  const maxX = Math.max(0, gameArea.clientWidth - playerSeal.offsetWidth);
  const maxY = Math.max(0, gameArea.clientHeight - playerSeal.offsetHeight);
  firstSwim.playerPosition.x = Math.min(Math.max(0, firstSwim.playerPosition.x), maxX);
  firstSwim.playerPosition.y = Math.min(Math.max(0, firstSwim.playerPosition.y), maxY);
  playerSeal.style.left = `${firstSwim.playerPosition.x}px`;
  playerSeal.style.top = `${firstSwim.playerPosition.y}px`;
}

// Pointer Events provide the same drag interaction for mouse, touch, and stylus.
function getPointerPosition(event) {
  const bounds = gameArea.getBoundingClientRect();
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
}

function beginDragging(event) {
  if (!firstSwim.isRunning || event.target !== playerSeal) return;
  event.preventDefault();
  const pointer = getPointerPosition(event);
  firstSwim.isDragging = true;
  firstSwim.dragOffset.x = pointer.x - firstSwim.playerPosition.x;
  firstSwim.dragOffset.y = pointer.y - firstSwim.playerPosition.y;
  playerSeal.classList.add("is-dragging");
  gameArea.setPointerCapture(event.pointerId);
}

function dragSeal(event) {
  if (!firstSwim.isDragging) return;
  event.preventDefault();
  const pointer = getPointerPosition(event);
  const targetX = pointer.x - firstSwim.dragOffset.x;
  const targetY = pointer.y - firstSwim.dragOffset.y;
  firstSwim.playerPosition.x += (targetX - firstSwim.playerPosition.x) * firstSwim.dragResponsiveness;
  firstSwim.playerPosition.y += (targetY - firstSwim.playerPosition.y) * firstSwim.dragResponsiveness;
  constrainPlayerPosition();
}

function endDragging(event) {
  if (!firstSwim.isDragging) return;
  firstSwim.isDragging = false;
  playerSeal.classList.remove("is-dragging");
  if (gameArea.hasPointerCapture(event.pointerId)) {
    gameArea.releasePointerCapture(event.pointerId);
  }
}

gameArea.addEventListener("pointerdown", beginDragging);
gameArea.addEventListener("pointermove", dragSeal);
gameArea.addEventListener("pointerup", endDragging);
gameArea.addEventListener("pointercancel", endDragging);

// Create a lightweight CSS obstacle at a random height on the right.
function spawnObstacle() {
  if (!firstSwim.isRunning || firstSwim.obstacles.length >= 4) return;
  const obstacle = document.createElement("div");
  const type = Math.random() > 0.5 ? "rock" : "seaweed";
  obstacle.className = `obstacle obstacle--${type}`;
  obstacle.dataset.hit = "false";
  const asset = type === "rock"
    ? randomItem(["rock-a.png", "rock-b.png"])
    : randomItem(["seaweed-a.png", "seaweed-b.png"]);
  const image = document.createElement("img");
  image.src = `assets/game/${asset}`;
  image.alt = "";
  image.setAttribute("aria-hidden", "true");
  obstacle.appendChild(image);
  const verticalSpace = Math.max(0, gameArea.clientHeight - (type === "seaweed" ? 64 : 44));
  obstacle.style.left = `${gameArea.clientWidth + 12}px`;
  obstacle.style.top = `${Math.random() * verticalSpace}px`;
  gameArea.appendChild(obstacle);
  firstSwim.obstacles.push({ element: obstacle, x: gameArea.clientWidth + 12, speed: 90 + Math.random() * 35 });
}

function rectanglesOverlap(first, second) {
  return first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top;
}

function getObstacleSpeedMultiplier(progress) {
  const stage = obstacleSpeedStages.find((speedStage) => progress < speedStage.belowProgress);
  return stage ? stage.multiplier : obstacleSpeedStages[obstacleSpeedStages.length - 1].multiplier;
}

function hasReachedMother() {
  const playerBounds = playerSeal.getBoundingClientRect();
  const motherBounds = motherSeal.getBoundingClientRect();
  const forgiveness = Math.max(playerSeal.offsetWidth, playerSeal.offsetHeight) * 0.35;
  const forgivingMotherBounds = {
    left: motherBounds.left - forgiveness,
    right: motherBounds.right + forgiveness,
    top: motherBounds.top - forgiveness,
    bottom: motherBounds.bottom + forgiveness
  };
  return rectanglesOverlap(playerBounds, forgivingMotherBounds);
}

function handleCollision(obstacle) {
  const now = performance.now();
  if (obstacle.element.dataset.hit === "true" || now < firstSwim.immunityUntil) return;

  obstacle.element.dataset.hit = "true";
  firstSwim.immunityUntil = now + 800;
  firstSwim.collisions += 1;
  audioSystem.playSfx("collision");
  updateStatusBar();
  playerSeal.classList.add("is-hit");
  window.setTimeout(() => playerSeal.classList.remove("is-hit"), 600);

  if (firstSwim.collisions === 1) {
    firstSwim.dragResponsiveness = 0.82;
    setSwimMessage("You were slightly injured.");
  } else if (firstSwim.collisions === 2) {
    seal.health = Math.max(0, seal.health - 1);
    updateStatusBar();
    setSwimMessage("You were injured.");
  } else {
    finishFirstSwimWithInjury();
  }
}

// Move obstacles left, remove old ones, update progress, and check collisions.
function runFirstSwimFrame(timestamp) {
  if (!firstSwim.isRunning) return;
  const elapsed = Math.min(50, timestamp - firstSwim.lastFrameTime);
  firstSwim.lastFrameTime = timestamp;
  firstSwim.spawnTimer += elapsed;

  if (!firstSwim.journeyComplete && firstSwim.spawnTimer >= 1700) {
    firstSwim.spawnTimer = 0;
    spawnObstacle();
  }

  const playerBounds = playerSeal.getBoundingClientRect();
  firstSwim.obstacles = firstSwim.obstacles.filter((obstacle) => {
    obstacle.x -= obstacle.speed * getObstacleSpeedMultiplier(firstSwim.progress) * (elapsed / 1000);
    obstacle.element.style.left = `${obstacle.x}px`;
    const obstacleBounds = obstacle.element.getBoundingClientRect();
    if (rectanglesOverlap(playerBounds, obstacleBounds)) handleCollision(obstacle);
    if (obstacle.x + obstacle.element.offsetWidth < 0) {
      obstacle.element.remove();
      return false;
    }
    return true;
  });

  if (!firstSwim.isRunning) return;

  if (!firstSwim.journeyComplete) {
    firstSwim.progress = Math.min(100, firstSwim.progress + elapsed * 0.0045);
    document.querySelector("#progress-fill").style.width = `${firstSwim.progress}%`;
  }

  if (!firstSwim.journeyComplete && firstSwim.progress >= 100) {
    firstSwim.journeyComplete = true;
    motherSeal.hidden = false;
  }

  if (firstSwim.journeyComplete && hasReachedMother()) {
    finishFirstSwimSuccessfully();
    return;
  }
  firstSwim.animationFrame = window.requestAnimationFrame(runFirstSwimFrame);
}

function resetFirstSwimView() {
  firstSwim.obstacles.forEach((obstacle) => obstacle.element.remove());
  firstSwim.obstacles = [];
  firstSwim.collisions = 0;
  firstSwim.progress = 0;
  firstSwim.journeyComplete = false;
  firstSwim.reachedMother = false;
  firstSwim.spawnTimer = 0;
  firstSwim.immunityUntil = 0;
  firstSwim.dragResponsiveness = 1;
  firstSwim.lastFrameTime = 0;
  firstSwim.isDragging = false;
  firstSwim.playerPosition = { x: 18, y: 0 };
  document.querySelector("#progress-fill").style.width = "0%";
  document.querySelector("#swim-result").hidden = true;
  document.querySelector("#swim-message").textContent =
    "Drag your seal through the water and avoid the rocks and seaweed.";
  motherSeal.hidden = true;
  playerSeal.hidden = false;
  playerSeal.classList.remove("is-hit");
  updateStatusBar();
}

// Start the First Swim without resetting the existing seal or its stats.
function startFirstSwim() {
  resetFirstSwimView();
  showScreen("first-swim-screen");
  firstSwim.isRunning = true;
  window.requestAnimationFrame(() => {
    firstSwim.playerPosition.y = (gameArea.clientHeight - playerSeal.offsetHeight) / 2;
    constrainPlayerPosition();
    firstSwim.lastFrameTime = performance.now();
    firstSwim.animationFrame = window.requestAnimationFrame(runFirstSwimFrame);
  });
}

function stopFirstSwim() {
  firstSwim.isRunning = false;
  window.cancelAnimationFrame(firstSwim.animationFrame);
  firstSwim.isDragging = false;
  playerSeal.classList.remove("is-dragging");
}

function showSwimResult(title, text) {
  document.querySelector("#swim-result-title").textContent = title;
  document.querySelector("#swim-result-text").textContent = text;
  document.querySelector("#swim-result").hidden = false;
}

// Success stops the loop and reveals the mother on the right side.
function finishFirstSwimSuccessfully() {
  stopFirstSwim();
  seal.milestones.learnedToSwim = true;
  firstSwim.progress = 100;
  document.querySelector("#progress-fill").style.width = "100%";
  firstSwim.obstacles.forEach((obstacle) => obstacle.element.remove());
  firstSwim.obstacles = [];
  motherSeal.hidden = false;
  firstSwim.reachedMother = true;
  document.querySelector("#swim-result-title").textContent = "You reached your mother.";
  document.querySelector("#swim-result-text").textContent = "";
  document.querySelector("#swim-result").hidden = false;
}

// The third collision freezes every part of the mini-game.
function finishFirstSwimWithInjury() {
  stopFirstSwim();
  firstSwim.obstacles.forEach((obstacle) => obstacle.element.remove());
  firstSwim.obstacles = [];
  setSwimMessage("SERIOUSLY INJURED");
  showSwimResult("SERIOUSLY INJURED", "You were badly hurt before reaching your mother.");
}

document.querySelector("#swim-continue-button").addEventListener("click", () => {
  if (firstSwim.reachedMother) {
    showEarlyLifeTransition();
  } else if (firstSwim.collisions >= 3) {
    showRescueIntro();
  }
});

function updateRescueStatus() {
  document.querySelector("#rescue-health").textContent = healthIndicator(seal.health);
  document.querySelector("#rescue-energy").textContent = energyIndicator(seal.energy);
}

function setRescueStory(title, paragraphs, buttonLabel) {
  document.querySelector("#rescue-event-title").textContent = title;
  const storyElement = document.querySelector("#rescue-event-story");
  storyElement.replaceChildren();
  paragraphs.forEach((paragraph) => {
    const text = document.createElement("p");
    text.textContent = paragraph;
    storyElement.appendChild(text);
  });
  document.querySelector("#rescue-event-button").textContent = buttonLabel;
  document.querySelector("#rescue-record").hidden = true;
  updateRescueStatus();
}

function showRescueIntro() {
  rescueState.phase = "intro";
  rescueState.outcome = "";
  setRescueStory(
    "WHAT HAPPENS NEXT?",
    ["You are badly injured and unable to continue swimming.", "The world around you becomes quiet."],
    "CONTINUE"
  );
  showScreen("rescue-event-screen");
}

function selectRescueOutcome() {
  const roll = Math.random();
  if (roll < RESCUE_PROBABILITY) return "rescued";
  if (roll < RESCUE_PROBABILITY + SURVIVAL_WITHOUT_RESCUE_PROBABILITY) return "survives";
  return "life-ends";
}

function showRescueOutcome() {
  rescueState.outcome = selectRescueOutcome();
  if (rescueState.outcome === "rescued") {
    rescueState.phase = "found";
    setRescueStory(
      "FOUND",
      ["You are found and taken somewhere unfamiliar.", "For a while, your days are quiet as you recover.", "Your strength slowly returns."],
      "RETURN TO THE OCEAN"
    );
  } else if (rescueState.outcome === "survives") {
    rescueState.phase = "survives";
    seal.memories.survivedEarlyInjury = true;
    setRescueStory(
      "STILL HERE",
      ["You remain injured, but somehow you make it through.", "Recovery is slow."],
      "CONTINUE"
    );
  } else {
    rescueState.phase = "life-ends";
    seal.health = 0;
    seal.endingAge = "2 WEEKS";
    setRescueStory(
      "YOUR LIFE WAS SHORT",
      ["Your injuries were too severe.", "This life ends here.", "You had only just begun to discover the ocean."],
      "REMEMBER THIS LIFE"
    );
    document.querySelector("#record-sex").textContent = seal.sex;
    document.querySelector("#record-coat").textContent = seal.coatColour;
    document.querySelector("#record-spots").textContent = seal.spotPattern;
    document.querySelector("#rescue-record").hidden = false;
  }
}

function handleRescueAction() {
  if (rescueState.phase === "intro") {
    showRescueOutcome();
  } else if (rescueState.phase === "found") {
    seal.health = Math.min(MAX_HEALTH, seal.health + RESCUE_HEALTH_RECOVERY);
    seal.memories.wasRescued = true;
    rescueState.phase = "release";
    setRescueStory("RELEASE", ["You return to the water.", "The ocean feels familiar again."], "CONTINUE YOUR LIFE");
  } else if (rescueState.phase === "release" || rescueState.phase === "survives") {
    showEarlyLifeTransition();
  } else if (rescueState.phase === "life-ends") {
    showLifeRecord();
  }
}

document.querySelector("#rescue-event-button").addEventListener("click", handleRescueAction);

function showEarlyLifeTransition() {
  document.querySelector("#early-transition-health").textContent = healthIndicator(seal.health);
  document.querySelector("#early-transition-energy").textContent = energyIndicator(seal.energy);
  showScreen("early-life-transition-screen");
}

document.querySelector("#begin-early-life-button").addEventListener("click", () => {
  startEarlyLife();
});

function startEarlyLife() {
  earlyLifeStage.event = earlyLifeEventPool[Math.floor(Math.random() * earlyLifeEventPool.length)];
  earlyLifeStage.consequenceShown = false;
  showScreen("early-life-screen");
  showEarlyLifeEvent();
}

function showEarlyLifeEvent() {
  const event = earlyLifeStage.event;
  document.querySelector("#early-event-title").textContent = event.title;
  const storyElement = document.querySelector("#early-event-story");
  storyElement.replaceChildren();
  event.story.forEach((paragraph) => {
    const text = document.createElement("p");
    text.textContent = paragraph;
    storyElement.appendChild(text);
  });
  document.querySelector("#early-choice-one").textContent = event.choices[0].label;
  document.querySelector("#early-choice-two").textContent = event.choices[1].label;
  document.querySelector("#early-choice-one").disabled = false;
  document.querySelector("#early-choice-two").disabled = false;
  document.querySelector("#early-consequence").textContent = "";
  document.querySelector("#early-continue-button").hidden = true;
  updateEarlyLifeStatus();
  const earlyLifeIllustrations = {
    "A QUIET DAY": ["pup-sleeping.png", "A Harbor Seal pup sleeping"],
    "FOLLOWING MOTHER": ["pup-swimming.png", "A Harbor Seal pup swimming"]
  };
  const illustration = earlyLifeIllustrations[event.title] || ["pup-resting.png", "A Harbor Seal pup resting"];
  setCurrentSealIllustration(illustration[0], illustration[1]);
}

function updateEarlyLifeStatus() {
  document.querySelector("#early-health").textContent = healthIndicator(seal.health);
  document.querySelector("#early-energy").textContent = energyIndicator(seal.energy);
}

function chooseEarlyLifeOption(choiceIndex) {
  if (earlyLifeStage.consequenceShown) return;
  earlyLifeStage.consequenceShown = true;
  document.querySelector("#early-choice-one").disabled = true;
  document.querySelector("#early-choice-two").disabled = true;
  const result = earlyLifeStage.event.choices[choiceIndex].resolve();
  seal.energy = Math.max(MIN_ENERGY, Math.min(MAX_ENERGY, seal.energy + (result.energyChange || 0)));
  if (result.memory) {
    seal.memories[result.memory] = true;
  }
  document.querySelector("#early-consequence").textContent = result.text;
  document.querySelector("#early-continue-button").hidden = false;
  updateEarlyLifeStatus();
}

document.querySelector("#early-choice-one").addEventListener("click", () => chooseEarlyLifeOption(0));
document.querySelector("#early-choice-two").addEventListener("click", () => chooseEarlyLifeOption(1));

document.querySelector("#early-continue-button").addEventListener("click", () => {
  if (earlyLifeStage.consequenceShown) {
    showHuntTransition();
  }
});

function showHuntTransition() {
  document.querySelector("#transition-health").textContent = healthIndicator(seal.health);
  document.querySelector("#transition-energy").textContent = energyIndicator(seal.energy);
  showScreen("hunt-transition-screen");
}

document.querySelector("#begin-hunt-button").addEventListener("click", () => {
  startFirstHunt();
});

const huntArea = document.querySelector("#hunt-area");

function resetFirstHuntView() {
  firstHunt.objects.forEach((huntObject) => huntObject.element.remove());
  firstHunt.timeRemaining = 30;
  firstHunt.score = 0;
  firstHunt.debrisCount = 0;
  firstHunt.interrupted = false;
  firstHunt.objects = [];
  firstHunt.isRunning = true;
  firstHunt.lastFrameTime = 0;
  firstHunt.spawnTimer = 0;
  firstHunt.timerAccumulator = 0;
  document.querySelector("#hunt-result").hidden = true;
  document.querySelector("#hunt-continue-message").textContent = "";
  updateHuntStatus();
}

// Initialize the First Hunt with a fresh timer while preserving seal health and energy.
function startFirstHunt() {
  resetFirstHuntView();
  showScreen("first-hunt-screen");
  window.requestAnimationFrame(() => {
    firstHunt.lastFrameTime = performance.now();
    firstHunt.animationFrame = window.requestAnimationFrame(runFirstHuntFrame);
  });
}

// Spawn fish, crustaceans, and debris from the right side at varied heights.
function spawnHuntObject() {
  if (!firstHunt.isRunning || firstHunt.objects.length >= 6) return;
  const foodTypes = [
    { type: "fish", value: 1, assets: ["fish-a.png", "fish-b.png"] },
    { type: "squid", value: 1, assets: ["squid.png"] },
    { type: "shrimp", value: 1, assets: ["shrimp.png"] },
    { type: "crab", value: 1, assets: ["crab.png"] }
  ];
  const debrisType = { type: "debris", value: -1, assets: ["plastic-bottle.png", "can.png"] };
  const objectType = Math.random() < 1 / 3 ? debrisType : randomItem(foodTypes);
  const element = document.createElement("button");
  element.type = "button";
  element.className = `hunt-object hunt-object--${objectType.type}`;
  element.setAttribute("aria-label", objectType.type);
  element.dataset.scored = "false";
  const image = document.createElement("img");
  image.src = `assets/game/${randomItem(objectType.assets)}`;
  image.alt = "";
  image.setAttribute("aria-hidden", "true");
  element.appendChild(image);
  element.addEventListener("pointerdown", () => scoreHuntObject(huntObject));
  const x = huntArea.clientWidth + element.offsetWidth + 8;
  const y = Math.random() * Math.max(0, huntArea.clientHeight - 64);
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  huntArea.appendChild(element);
  const huntObject = { element, x, speed: 70 + Math.random() * 45, value: objectType.value };
  firstHunt.objects.push(huntObject);
}

// Score each object once and show a small floating response.
function scoreHuntObject(huntObject) {
  if (!firstHunt.isRunning || huntObject.element.dataset.scored === "true") return;
  huntObject.element.dataset.scored = "true";
  firstHunt.score = Math.max(0, firstHunt.score + huntObject.value);
  audioSystem.playSfx(huntObject.value > 0 ? "food" : "debris");
  showHuntFeedback(huntObject.element, huntObject.value > 0 ? "+1" : "-1");
  if (huntObject.value < 0) {
    firstHunt.debrisCount += 1;
  }
  huntObject.element.remove();
  firstHunt.objects = firstHunt.objects.filter((item) => item !== huntObject);
  updateHuntStatus();
  if (firstHunt.debrisCount >= 3) {
    interruptFirstHunt();
  }
}

function showHuntFeedback(element, text) {
  const feedback = document.createElement("span");
  feedback.className = "hunt-feedback";
  feedback.textContent = text;
  feedback.style.left = element.style.left;
  feedback.style.top = element.style.top;
  huntArea.appendChild(feedback);
  window.setTimeout(() => feedback.remove(), 700);
}

// Move hunt objects left and stop exactly when the countdown reaches zero.
function runFirstHuntFrame(timestamp) {
  if (!firstHunt.isRunning) return;
  const elapsed = Math.min(50, timestamp - firstHunt.lastFrameTime);
  firstHunt.lastFrameTime = timestamp;
  firstHunt.spawnTimer += elapsed;
  firstHunt.timerAccumulator += elapsed;

  if (firstHunt.spawnTimer >= 900) {
    firstHunt.spawnTimer = 0;
    spawnHuntObject();
  }
  while (firstHunt.timerAccumulator >= 1000) {
    firstHunt.timerAccumulator -= 1000;
    firstHunt.timeRemaining -= 1;
    updateHuntStatus();
  }
  if (firstHunt.timeRemaining <= 0) {
    completeFirstHunt();
    return;
  }

  firstHunt.objects = firstHunt.objects.filter((huntObject) => {
    huntObject.x -= huntObject.speed * (elapsed / 1000);
    huntObject.element.style.left = `${huntObject.x}px`;
    if (huntObject.x + huntObject.element.offsetWidth < 0) {
      huntObject.element.remove();
      return false;
    }
    return true;
  });
  firstHunt.animationFrame = window.requestAnimationFrame(runFirstHuntFrame);
}

function interruptFirstHunt() {
  firstHunt.interrupted = true;
  firstHunt.isRunning = false;
  window.cancelAnimationFrame(firstHunt.animationFrame);
  firstHunt.objects.forEach((huntObject) => huntObject.element.remove());
  firstHunt.objects = [];
  changeHealth(-1);
  document.querySelector("#hunt-result-title").textContent = "HUNT INTERRUPTED";
  document.querySelector("#hunt-final-score").textContent = firstHunt.score;
  document.querySelector("#hunt-final-debris").textContent = "3 / 3";
  document.querySelector("#hunt-result-category").textContent = "";
  document.querySelector("#hunt-result-text").textContent =
    "You swallowed too much marine debris.\n\nYour health has been affected.";
  document.querySelector("#hunt-result-health").textContent = seal.health;
  document.querySelector("#hunt-result-energy").textContent = "";
  firstHunt.timeRemaining = 0;
  updateHuntStatus();
  document.querySelector("#hunt-result").hidden = false;
}

// Calculate the result category and apply the bounded energy change.
function completeFirstHunt() {
  firstHunt.isRunning = false;
  window.cancelAnimationFrame(firstHunt.animationFrame);
  firstHunt.objects.forEach((huntObject) => huntObject.element.remove());
  firstHunt.objects = [];
  firstHunt.timeRemaining = 0;
  seal.milestones.completedFirstHunt = true;
  updateHuntStatus();

  let category;
  let resultText;
  if (firstHunt.score >= HIGH_THRESHOLD) {
    category = "SUCCESSFUL HUNT";
    resultText = "You found plenty of food.";
    seal.energy = Math.min(MAX_ENERGY, seal.energy + 2);
  } else if (firstHunt.score >= LOW_THRESHOLD) {
    category = "ENOUGH FOOD";
    resultText = "You found enough to keep going.";
    seal.energy = Math.min(MAX_ENERGY, seal.energy + 1);
  } else {
    category = "POOR HUNT";
    resultText = "You return tired and hungry.";
    seal.energy = Math.max(MIN_ENERGY, seal.energy - 1);
  }

  document.querySelector("#hunt-result-title").textContent = "HUNT COMPLETE";
  document.querySelector("#hunt-final-score").textContent = firstHunt.score;
  document.querySelector("#hunt-final-debris").textContent = `${firstHunt.debrisCount} / 3`;
  document.querySelector("#hunt-result-category").textContent = category;
  document.querySelector("#hunt-result-text").textContent = resultText;
  document.querySelector("#hunt-result-health").textContent = healthIndicator(seal.health);
  document.querySelector("#hunt-result-energy").textContent = energyIndicator(seal.energy);
  document.querySelector("#hunt-result").hidden = false;
}

document.querySelector("#hunt-continue-button").addEventListener("click", () => {
  if (firstHunt.interrupted) {
    if (seal.health <= 0) {
      showHealthEnding("Your injuries are too severe to continue.", "6 WEEKS");
    } else if (laterLife.criticalPending) {
      laterLife.criticalReturn = "juvenile";
      laterLife.criticalPending = false;
      showCriticalCondition();
    } else {
      showJuvenileTransition();
    }
    return;
  }
  showJuvenileTransition();
});

function updateJuvenileStatus() {
  document.querySelector("#juvenile-health").textContent = healthIndicator(seal.health);
  document.querySelector("#juvenile-energy").textContent = energyIndicator(seal.energy);
}

function showJuvenileTransition() {
  document.querySelector("#juvenile-transition-health").textContent = healthIndicator(seal.health);
  document.querySelector("#juvenile-transition-energy").textContent = energyIndicator(seal.energy);
  showScreen("juvenile-transition-screen");
}

document.querySelector("#begin-juvenile-button").addEventListener("click", () => {
  startJuvenileStage();
});

// Select two different events by shuffling a copy of the event pool.
function selectJuvenileEvents() {
  return [...juvenileEventPool]
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
}

function startJuvenileStage() {
  juvenileStage.events = selectJuvenileEvents();
  juvenileStage.currentIndex = 0;
  juvenileStage.consequenceShown = false;
  showScreen("juvenile-screen");
  showJuvenileEvent();
}

// Render the current event using the shared story and choice layout.
function showJuvenileEvent() {
  const event = juvenileStage.events[juvenileStage.currentIndex];
  juvenileStage.consequenceShown = false;
  document.querySelector("#juvenile-event-title").textContent = event.title;
  const storyElement = document.querySelector("#juvenile-event-story");
  storyElement.replaceChildren();
  event.story.forEach((paragraph) => {
    const text = document.createElement("p");
    text.textContent = paragraph;
    storyElement.appendChild(text);
  });

  const firstChoice = document.querySelector("#juvenile-choice-one");
  const secondChoice = document.querySelector("#juvenile-choice-two");
  firstChoice.textContent = event.choices[0].label;
  secondChoice.textContent = event.choices[1].label;
  firstChoice.disabled = false;
  secondChoice.disabled = false;
  firstChoice.hidden = false;
  secondChoice.hidden = false;
  document.querySelector("#juvenile-consequence").textContent = "";
  document.querySelector("#juvenile-continue-button").hidden = true;
  updateJuvenileStatus();
}

function applyJuvenileResult(result) {
  seal.health = Math.max(0, Math.min(MAX_HEALTH, seal.health + (result.healthChange || 0)));
  seal.energy = Math.max(MIN_ENERGY, Math.min(MAX_ENERGY, seal.energy + (result.energyChange || 0)));
  if (result.memory) {
    seal.memories[result.memory] = true;
  }
}

// Disable both choices, apply the selected consequence, and reveal Continue.
function chooseJuvenileOption(choiceIndex) {
  if (juvenileStage.consequenceShown) return;
  juvenileStage.consequenceShown = true;
  const firstChoice = document.querySelector("#juvenile-choice-one");
  const secondChoice = document.querySelector("#juvenile-choice-two");
  firstChoice.disabled = true;
  secondChoice.disabled = true;
  const result = juvenileStage.events[juvenileStage.currentIndex].choices[choiceIndex].resolve();
  applyJuvenileResult(result);
  document.querySelector("#juvenile-consequence").textContent = result.text;
  document.querySelector("#juvenile-continue-button").hidden = false;
  updateJuvenileStatus();
}

document.querySelector("#juvenile-choice-one").addEventListener("click", () => chooseJuvenileOption(0));
document.querySelector("#juvenile-choice-two").addEventListener("click", () => chooseJuvenileOption(1));

document.querySelector("#juvenile-continue-button").addEventListener("click", () => {
  if (!juvenileStage.consequenceShown) return;
  juvenileStage.currentIndex += 1;
  if (juvenileStage.currentIndex >= juvenileStage.events.length) {
    showYearsPass();
  } else {
    showJuvenileEvent();
  }
});

function showYearsPass() {
  document.querySelector("#adult-transition-health").textContent = healthIndicator(seal.health);
  document.querySelector("#adult-transition-energy").textContent = energyIndicator(seal.energy);
  document.querySelector("#adulthood-message").textContent = "";
  showScreen("years-pass-screen");
}

document.querySelector("#adulthood-button").addEventListener("click", () => {
  showAdultScreen();
});

function updateAdultStatus() {
  document.querySelector("#adult-health").textContent = healthIndicator(seal.health);
  document.querySelector("#adult-energy").textContent = energyIndicator(seal.energy);
}

function showAdultScreen() {
  seal.milestones.reachedAdulthood = true;
  updateAdultStatus();
  showScreen("adult-screen");
}

// Branch from the sex assigned at birth; adult sex is never randomized.
document.querySelector("#adult-continue-button").addEventListener("click", () => {
  if (seal.sex === "Male") {
    showMaleSeason();
  } else {
    startFemaleBirth();
  }
});

function showMaleSeason() {
  document.querySelector("#male-season-health").textContent = healthIndicator(seal.health);
  document.querySelector("#male-season-energy").textContent = energyIndicator(seal.energy);
  showScreen("male-season-screen");
}

document.querySelector("#begin-display-button").addEventListener("click", () => {
  startAdultDisplay();
});

// Initialize the male Display mini-game without changing the existing seal stats.
function startAdultDisplay() {
  clearDisplaySoundWaves();
  adultDisplay.energy = 0;
  adultDisplay.isRunning = true;
  adultDisplay.startedAt = 0;
  adultDisplay.calls = 0;
  adultDisplay.completionTime = 0;
  adultDisplay.strength = "";
  adultDisplay.outcomeShown = false;
  document.querySelector("#display-energy-fill").style.width = "0%";
  document.querySelector("#display-energy-value").textContent = "0%";
  document.querySelector("#display-time").textContent = "";
  document.querySelector("#display-complete-panel").hidden = true;
  document.querySelector("#call-button").disabled = false;
  document.querySelector("#display-health").textContent = healthIndicator(seal.health);
  document.querySelector("#display-energy-status").textContent = energyIndicator(seal.energy);
  showScreen("display-screen");
  scheduleRivalResponse();
}

function createDisplaySoundWave(elementId, directionClass) {
  const container = document.querySelector(`#${elementId}`);
  if (!container) return;
  const wave = document.createElement("span");
  wave.className = `call-wave ${directionClass}`;
  wave.addEventListener("animationend", () => {
    wave.remove();
    if (container.children.length === 0) {
      container.hidden = true;
    }
  }, { once: true });
  container.appendChild(wave);
  container.hidden = false;
}

function scheduleRivalResponse() {
  window.clearTimeout(displaySoundWaves.rivalResponseTimer);
  if (!adultDisplay.isRunning) return;
  const delay = 500 + Math.random() * 1000;
  displaySoundWaves.rivalResponseTimer = window.setTimeout(() => {
    if (!adultDisplay.isRunning) return;
    createDisplaySoundWave("rival-call-waves", "call-wave--rival");
    window.clearTimeout(displaySoundWaves.rivalHideTimer);
    displaySoundWaves.rivalHideTimer = window.setTimeout(() => {
      if (!adultDisplay.isRunning) return;
      scheduleRivalResponse();
    }, DISPLAY_WAVE_DURATION);
  }, delay);
}

function startDisplaySoundWaves() {
  if (!adultDisplay.isRunning) return;
  createDisplaySoundWave("player-call-waves", "call-wave--player");
}

function clearDisplaySoundWaves() {
  window.clearTimeout(displaySoundWaves.rivalResponseTimer);
  window.clearTimeout(displaySoundWaves.rivalHideTimer);
  displaySoundWaves.rivalResponseTimer = 0;
  displaySoundWaves.rivalHideTimer = 0;
  ["player-call-waves", "rival-call-waves"].forEach((elementId) => {
    const container = document.querySelector(`#${elementId}`);
    if (!container) return;
    container.replaceChildren();
    container.hidden = true;
  });
}

function getDisplaySuccessProbability(seconds) {
  const progress = Math.min(1, Math.max(0, (seconds - DISPLAY_FAST_TIME) / (DISPLAY_SLOW_TIME - DISPLAY_FAST_TIME)));
  return DISPLAY_FAST_SUCCESS_PROBABILITY +
    (DISPLAY_SLOW_SUCCESS_PROBABILITY - DISPLAY_FAST_SUCCESS_PROBABILITY) * progress;
}

// CALL uses Pointer Events so mouse, touch, and stylus all fill the bar.
document.querySelector("#call-button").addEventListener("pointerdown", (event) => {
  event.preventDefault();
  if (!adultDisplay.isRunning) return;
  audioSystem.playSfx("sealCall");
  startDisplaySoundWaves();
  if (adultDisplay.startedAt === 0) {
    adultDisplay.startedAt = performance.now();
  }
  adultDisplay.calls += 1;
  const callGain = DISPLAY_BASE_CALL_GAIN + seal.energy * DISPLAY_ENERGY_GAIN_PER_LEVEL;
  adultDisplay.energy = Math.min(100, adultDisplay.energy + callGain);
  document.querySelector("#display-energy-fill").style.width = `${adultDisplay.energy}%`;
  document.querySelector("#display-energy-value").textContent = `${Math.floor(adultDisplay.energy)}%`;
  if (adultDisplay.energy >= 100) {
    finishAdultDisplay();
  }
});

function finishAdultDisplay() {
  adultDisplay.isRunning = false;
  clearDisplaySoundWaves();
  document.querySelector("#call-button").disabled = true;
  const completionTime = (performance.now() - adultDisplay.startedAt) / 1000;
  adultDisplay.completionTime = completionTime;
  adultDisplay.strength = completionTime <= DISPLAY_STRONG_TIME
    ? "STRONG"
    : completionTime <= DISPLAY_WEAK_TIME ? "MODERATE" : "WEAK";
  document.querySelector("#display-complete-panel").hidden = false;
  document.querySelector("#display-calls-made").textContent = adultDisplay.calls;
  document.querySelector("#display-completion-time").textContent = `${completionTime.toFixed(1)} seconds`;
  document.querySelector("#display-strength").textContent = adultDisplay.strength;
}

document.querySelector("#see-outcome-button").addEventListener("click", () => {
  if (adultDisplay.outcomeShown || adultDisplay.completionTime === 0) return;
  adultDisplay.outcomeShown = true;
  resolveMaleOutcome(adultDisplay.completionTime);
});

// Performance changes the odds, but chance always remains part of the outcome.
function resolveMaleOutcome(completionTime) {
  const successProbability = getDisplaySuccessProbability(completionTime);
  const outcomeRoll = Math.random();
  if (outcomeRoll < DISPLAY_ESCALATION_PROBABILITY) {
    showMaleOutcome("escalation");
  } else if (Math.random() < successProbability) {
    showMaleOutcome("success");
  } else {
    showMaleOutcome("unsuccessful");
  }
}

// Apply the selected male outcome and store only the relevant life memory.
function showMaleOutcome(outcome) {
  adultDisplay.maleOutcome = outcome;
  const outcomeData = {
    success: {
      title: "YOUR DISPLAY SUCCEEDS",
      story: ["The rival withdraws."],
      memory: "successfulBreedingDisplay",
      energyChange: -1
    },
    unsuccessful: {
      title: "THE RIVAL REMAINS",
      story: ["You choose to withdraw."],
      memory: "unsuccessfulBreedingDisplay",
      energyChange: -1
    },
    escalation: {
      title: "THE ENCOUNTER ESCALATES",
      story: [Math.random() < BREEDING_INJURY_PROBABILITY
        ? "You are injured during the encounter."
        : "You escape without serious injury."],
      memory: null,
      energyChange: 0
    }
  }[outcome];

  if (outcome === "escalation" && outcomeData.story[0] === "You are injured during the encounter.") {
    seal.health = Math.max(0, seal.health - 1);
    seal.memories.injuredDuringBreeding = true;
  }
  if (outcomeData.memory) {
    seal.memories[outcomeData.memory] = true;
  }
  seal.energy = Math.max(MIN_ENERGY, Math.min(MAX_ENERGY, seal.energy + outcomeData.energyChange));
  document.querySelector("#male-outcome-title").textContent = outcomeData.title;
  const storyElement = document.querySelector("#male-outcome-story");
  storyElement.replaceChildren();
  outcomeData.story.forEach((paragraph) => {
    const text = document.createElement("p");
    text.textContent = paragraph;
    storyElement.appendChild(text);
  });
  document.querySelector("#male-outcome-health").textContent = healthIndicator(seal.health);
  document.querySelector("#male-outcome-energy").textContent = energyIndicator(seal.energy);
  document.querySelector("#male-outcome-message").textContent = "";
  showScreen("male-outcome-screen");
}

document.querySelector("#male-outcome-button").addEventListener("click", () => {
  if (adultDisplay.maleOutcome === "success") {
    showMatingOpportunity();
  } else {
    startLaterLife();
  }
});

function updateReproductionStatus() {
  document.querySelector("#reproduction-health").textContent = healthIndicator(seal.health);
  document.querySelector("#reproduction-energy").textContent = energyIndicator(seal.energy);
}

function setReproductionStory(title, paragraphs, buttonLabel) {
  document.querySelector("#reproduction-title").textContent = title;
  const storyElement = document.querySelector("#reproduction-story");
  storyElement.replaceChildren();
  paragraphs.forEach((paragraph) => {
    const text = document.createElement("p");
    text.textContent = paragraph;
    storyElement.appendChild(text);
  });
  document.querySelector("#reproduction-button").textContent = buttonLabel;
  document.querySelector("#reproduction-message").textContent = "";
  updateReproductionStatus();
}

function showMatingOpportunity() {
  adultDisplay.maleOutcome = "mating-opportunity";
  setReproductionStory(
    "A MATING OPPORTUNITY",
    ["Your display has driven the rival away.", "Later in the breeding season, you find an opportunity to mate."],
    "CONTINUE"
  );
  showScreen("reproduction-screen");
}

document.querySelector("#reproduction-button").addEventListener("click", () => {
  if (adultDisplay.maleOutcome === "mating-opportunity") {
    adultDisplay.maleOutcome = Math.random() < MATING_SUCCESS_PROBABILITY
      ? "new-generation"
      : "season-passes";
    if (adultDisplay.maleOutcome === "new-generation") {
      seal.memories.fatheredOffspring = true;
      setReproductionStory(
        "A NEW GENERATION",
        ["Your mating was successful.", "Somewhere in the next generation, a new life begins."],
        "CONTINUE YOUR LIFE"
      );
    } else {
      setReproductionStory(
        "THE SEASON PASSES",
        ["You found a mating opportunity, but not every encounter leads to offspring.", "The season eventually comes to an end."],
        "CONTINUE YOUR LIFE"
      );
    }
  } else {
    startLaterLife();
  }
});

// Female route: birth costs Energy but does not reduce Health.
function startFemaleBirth() {
  seal.energy = Math.max(MIN_ENERGY, seal.energy - 1);
  seal.memories.becameMother = true;
  document.querySelector("#female-birth-health").textContent = healthIndicator(seal.health);
  document.querySelector("#female-birth-energy").textContent = energyIndicator(seal.energy);
  showScreen("female-birth-screen");
}

document.querySelector("#female-birth-continue-button").addEventListener("click", () => {
  document.querySelector("#motherhood-health").textContent = healthIndicator(seal.health);
  document.querySelector("#motherhood-energy").textContent = energyIndicator(seal.energy);
  document.querySelector("#motherhood-consequence").textContent = "";
  document.querySelector("#motherhood-reflection").hidden = true;
  document.querySelector("#motherhood-continue-button").hidden = true;
  document.querySelector("#motherhood-message").textContent = "";
  document.querySelector("#forage-button").disabled = false;
  document.querySelector("#stay-pup-button").disabled = false;
  showScreen("motherhood-screen");
});

// Motherhood choices update Energy, store the memory, and reveal the callback.
function chooseMotherhood(option) {
  document.querySelector("#forage-button").disabled = true;
  document.querySelector("#stay-pup-button").disabled = true;
  if (option === "forage") {
    seal.energy = Math.min(MAX_ENERGY, seal.energy + 1);
    seal.memories.leftPupToForage = true;
    document.querySelector("#motherhood-consequence").textContent =
      "You enter the water to search for food while your pup rests on shore.";
  } else {
    seal.energy = Math.max(MIN_ENERGY, seal.energy - 1);
    seal.memories.stayedWithPup = true;
    document.querySelector("#motherhood-consequence").textContent = "You remain beside your pup.";
  }
  document.querySelector("#motherhood-health").textContent = healthIndicator(seal.health);
  document.querySelector("#motherhood-energy").textContent = energyIndicator(seal.energy);
  document.querySelector("#motherhood-reflection").hidden = false;
  document.querySelector("#motherhood-continue-button").hidden = false;
}

document.querySelector("#forage-button").addEventListener("click", () => chooseMotherhood("forage"));
document.querySelector("#stay-pup-button").addEventListener("click", () => chooseMotherhood("stay"));
document.querySelector("#motherhood-continue-button").addEventListener("click", () => {
  startLaterLife();
});

function updateLaterStatus() {
  document.querySelector("#later-age").textContent = `· ${laterLife.currentAge} YEARS`;
  document.querySelector("#later-health").textContent = healthIndicator(seal.health);
  document.querySelector("#later-energy").textContent = energyIndicator(seal.energy);
}

function startLaterLife() {
  seal.milestones.enteredLaterLife = true;
  laterLife.ageIndex = 0;
  laterLife.currentEvent = null;
  laterLife.usedEvents = [];
  laterLife.consequenceShown = false;
  laterLife.currentAge = laterLife.ages[0];
  laterLife.route = "wild";
  laterLife.criticalPending = false;
  laterLife.criticalReturn = "later";
  laterLife.criticalPhase = "";
  laterLife.rehabilitationPhase = "";
  laterLife.humanCareAgeIndex = 0;
  laterLife.humanCareUsedEvents = [];
  document.querySelector("#later-transition-health").textContent = healthIndicator(seal.health);
  document.querySelector("#later-transition-energy").textContent = energyIndicator(seal.energy);
  showScreen("later-transition-screen");
}

function renderLaterStory(paragraphs) {
  const story = document.querySelector("#later-event-story");
  story.replaceChildren();
  paragraphs.forEach((paragraph) => {
    const element = document.createElement("p");
    element.textContent = paragraph;
    story.appendChild(element);
  });
}

function showLaterLifeEvent() {
  laterLife.route = "wild";
  const availableEvents = laterLifeEvents.filter((event) => !laterLife.usedEvents.includes(event.id));
  if (availableEvents.length === 0) {
    laterLife.usedEvents = [];
  }
  const refreshedEvents = laterLifeEvents.filter((event) => !laterLife.usedEvents.includes(event.id));
  const event = refreshedEvents[Math.floor(Math.random() * refreshedEvents.length)];
  laterLife.currentEvent = event;
  laterLife.usedEvents.push(event.id);
  laterLife.consequenceShown = false;

  updateLaterStatus();
  document.querySelector("#later-event-title").textContent = event.title;
  document.querySelector("#later-event-eyebrow").textContent = "A later-life event";
  renderLaterStory(event.story);
  document.querySelector("#later-consequence").textContent = "";
  document.querySelector("#later-continue-button").hidden = true;
  const firstChoice = document.querySelector("#later-choice-one");
  const secondChoice = document.querySelector("#later-choice-two");
  firstChoice.textContent = event.choices[0].label;
  firstChoice.hidden = event.choices.length === 1;
  firstChoice.disabled = false;
  secondChoice.hidden = event.choices.length < 2;
  secondChoice.disabled = false;
  if (event.choices.length > 1) {
    secondChoice.textContent = event.choices[1].label;
  }
  document.querySelector("#later-continue-button").textContent = "CONTINUE";
  document.querySelector("#later-continue-button").hidden = event.choices.length === 1 ? false : true;
  showScreen("later-life-screen");
  setCurrentSealIllustration(
    event.id === "obstructed-path" ? "seal-weakened.png"
      : event.id === "food-scarce" ? "adult-swimming.png"
        : "adult-resting.png",
    event.id === "obstructed-path" ? "A weakened Harbor Seal"
      : event.id === "food-scarce" ? "An adult Harbor Seal searching the water"
        : "An adult Harbor Seal resting"
  );
}

function showHumanCareEvent() {
  laterLife.route = "human-care";
  const availableEvents = humanCareEvents.filter((event) => !laterLife.humanCareUsedEvents.includes(event.id));
  const previousEvent = laterLife.currentEvent ? laterLife.currentEvent.id : "";
  const nonRepeatingEvents = availableEvents.filter((event) => event.id !== previousEvent);
  const eventPool = nonRepeatingEvents.length > 0 ? nonRepeatingEvents : availableEvents;
  if (eventPool.length === 0) {
    laterLife.humanCareUsedEvents = [];
    return showHumanCareEvent();
  }
  const event = eventPool[Math.floor(Math.random() * eventPool.length)];
  laterLife.currentEvent = event;
  laterLife.humanCareUsedEvents.push(event.id);
  laterLife.consequenceShown = false;

  updateLaterStatus();
  document.querySelector("#later-event-title").textContent = event.title;
  document.querySelector("#later-event-eyebrow").textContent = "A life in human care";
  renderLaterStory(event.story);
  document.querySelector("#later-consequence").textContent = "";
  const firstChoice = document.querySelector("#later-choice-one");
  const secondChoice = document.querySelector("#later-choice-two");
  firstChoice.textContent = event.choices[0].label;
  firstChoice.hidden = event.choices.length === 1;
  firstChoice.disabled = false;
  secondChoice.hidden = event.choices.length < 2;
  secondChoice.disabled = false;
  if (event.choices.length > 1) {
    secondChoice.textContent = event.choices[1].label;
  }
  document.querySelector("#later-continue-button").textContent = "CONTINUE";
  document.querySelector("#later-continue-button").hidden = event.choices.length !== 1;
  showScreen("later-life-screen");
  setCurrentSealIllustration(
    event.id === "medical-treatment" ? "seal-weakened.png" : "adult-resting.png",
    event.id === "medical-treatment" ? "A Harbor Seal receiving medical care" : "An adult Harbor Seal resting"
  );
}

function showHealthEnding(reason, ageLabel = seal.endingAge || `${laterLife.currentAge} YEARS`) {
  if (seal.energy === MIN_ENERGY) {
    seal.memories.diedWhileExhausted = true;
  }
  document.querySelector("#life-ending-title").textContent = "YOUR LIFE ENDS HERE";
  document.querySelector("#life-ending-story").replaceChildren();
  const story = document.createElement("p");
  story.textContent = reason;
  document.querySelector("#life-ending-story").appendChild(story);
  seal.endingAge = ageLabel;
  document.querySelector("#ending-age").textContent = seal.endingAge;
  document.querySelector("#ending-health").textContent = healthIndicator(seal.health);
  document.querySelector("#ending-energy").textContent = energyIndicator(seal.energy);
  document.querySelector("#life-ending-message").textContent = "";
  showScreen("life-ending-screen");
}

function showNaturalEnding() {
  if (seal.energy === MIN_ENERGY) {
    seal.memories.diedWhileExhausted = true;
  }
  document.querySelector("#life-ending-title").textContent = "A QUIET END";
  document.querySelector("#life-ending-story").replaceChildren();
  const story = document.createElement("p");
  story.textContent = "After many years in these waters, your life comes quietly to an end.";
  document.querySelector("#life-ending-story").appendChild(story);
  seal.endingAge = `${laterLife.currentAge} YEARS`;
  document.querySelector("#ending-age").textContent = seal.endingAge;
  document.querySelector("#ending-health").textContent = healthIndicator(seal.health);
  document.querySelector("#ending-energy").textContent = energyIndicator(seal.energy);
  document.querySelector("#life-ending-message").textContent = "";
  showScreen("life-ending-screen");
}

function naturalEndingChance(age) {
  if (laterLife.route === "wild") {
    if (age === 12) return 0;
    if (age === 40) return AGE_40_END_PROBABILITY;
    const baseChance = WILD_AGE_NATURAL_END_PROBABILITIES[age] || 0;
    return Math.min(0.95, baseChance + (MAX_HEALTH - seal.health) * WILD_HEALTH_NATURAL_END_BONUS);
  }
  return Math.min(
    0.95,
    HUMAN_CARE_BASE_NATURAL_END_PROBABILITY
      + Math.max(0, age - 30) / 5 * HUMAN_CARE_NATURAL_END_AGE_BONUS
      + (MAX_HEALTH - seal.health) * HUMAN_CARE_HEALTH_NATURAL_END_BONUS
  );
}

function showWildAge40() {
  laterLife.currentAge = 40;
  seal.endingAge = `${laterLife.currentAge} YEARS`;
  seal.memories.reachedExceptionalWildAge = true;
  document.querySelector("#old-life-age").textContent = `· ${laterLife.currentAge} YEARS`;
  document.querySelector("#old-life-health").textContent = healthIndicator(seal.health);
  document.querySelector("#old-life-energy").textContent = energyIndicator(seal.energy);
  showScreen("old-life-screen");
}

function resolveWildAge() {
  if (laterLife.currentAge === 40) {
    showWildAge40();
    return;
  }
  if (laterLife.currentAge === 12) {
    laterLife.ageIndex += 1;
    laterLife.currentAge = laterLife.ages[laterLife.ageIndex];
    showLaterLifeEvent();
    return;
  }
  // Each Wild age gets a chance to end naturally; Age 40 is the prototype boundary.
  if (Math.random() < naturalEndingChance(laterLife.currentAge)) {
    showNaturalEnding();
  } else {
    laterLife.ageIndex += 1;
    laterLife.currentAge = laterLife.ages[laterLife.ageIndex];
    showLaterLifeEvent();
  }
}

function continueLaterLife() {
  if (!laterLife.consequenceShown && laterLife.currentEvent.choices.length === 1) {
    chooseLaterLifeOption(0);
    return;
  }
  if (!laterLife.consequenceShown) return;
  if (laterLife.route === "human-care") {
    continueHumanCare();
  } else {
    resolveWildAge();
  }
}

function chooseLaterLifeOption(choiceIndex) {
  if (laterLife.consequenceShown) return;
  laterLife.consequenceShown = true;
  const event = laterLife.currentEvent;
  const firstChoice = document.querySelector("#later-choice-one");
  const secondChoice = document.querySelector("#later-choice-two");
  firstChoice.disabled = true;
  secondChoice.disabled = true;
  const choice = event.choices[choiceIndex];
  const consequence = choice.resolve ? choice.resolve() : choice.consequence;
  if (choice.effect) choice.effect();
  updateLaterStatus();

  if (seal.health <= 0) {
    if (laterLife.route === "human-care") {
      showHumanCareEnding();
      return;
    }
    const reason = event.id === "unexpected-illness"
      ? "Your body does not recover from the illness."
      : "Your injuries are too severe to continue.";
    showHealthEnding(reason);
    return;
  }
  if (laterLife.route === "wild" && laterLife.criticalPending) {
    laterLife.criticalPending = false;
    showCriticalCondition();
    return;
  }
  document.querySelector("#later-consequence").textContent = consequence;
  document.querySelector("#later-continue-button").hidden = false;
}

// Health falling from 2 to 1 creates one rescue opportunity per life.
function showCriticalCondition() {
  seal.memories.criticalConditionTriggered = true;
  laterLife.criticalPhase = "prompt";
  document.querySelector("#critical-age").textContent = laterLife.criticalReturn === "juvenile"
    ? "· 6 WEEKS"
    : `· ${laterLife.currentAge} YEARS`;
  document.querySelector("#critical-health").textContent = healthIndicator(seal.health);
  document.querySelector("#critical-energy").textContent = energyIndicator(seal.energy);
  document.querySelector("#critical-title").textContent = "CRITICAL CONDITION";
  renderCriticalStory(["Your body has become weak.", "Continuing alone may no longer be possible."]);
  document.querySelector("#critical-button").textContent = "CONTINUE";
  showScreen("critical-screen");
}

function renderCriticalStory(paragraphs) {
  const story = document.querySelector("#critical-story");
  story.replaceChildren();
  paragraphs.forEach((paragraph) => {
    const element = document.createElement("p");
    element.textContent = paragraph;
    story.appendChild(element);
  });
}

function resolveCriticalCondition() {
  if (Math.random() < CRITICAL_FOUND_PROBABILITY) {
    seal.memories.rescuedDuringLaterLife = true;
    laterLife.criticalPhase = "found";
    document.querySelector("#critical-title").textContent = "FOUND";
    renderCriticalStory([
      "You are discovered in a weakened condition.",
      "You are taken somewhere unfamiliar for treatment and care."
    ]);
    document.querySelector("#critical-button").textContent = "BEGIN RECOVERY";
  } else {
    seal.memories.criticalButNotRescued = true;
    laterLife.criticalPhase = "not-found";
    document.querySelector("#critical-title").textContent = "ALONE IN THE WATER";
    renderCriticalStory([
      "No one finds you.",
      "You remain in the wild, carrying your weakened condition with you."
    ]);
    document.querySelector("#critical-button").textContent = "CONTINUE IN THE WILD";
  }
}

function showRehabilitation() {
  laterLife.rehabilitationPhase = "prompt";
  document.querySelector("#rehabilitation-age").textContent = `· ${laterLife.currentAge} YEARS`;
  document.querySelector("#rehabilitation-health").textContent = healthIndicator(seal.health);
  document.querySelector("#rehabilitation-energy").textContent = energyIndicator(seal.energy);
  document.querySelector("#rehabilitation-title").textContent = "REHABILITATION";
  renderRehabilitationStory([
    "Your days become quieter.",
    "You receive food, rest, and medical care while your condition is assessed."
  ]);
  document.querySelector("#rehabilitation-button").textContent = "CONTINUE";
  showScreen("rehabilitation-screen");
}

function renderRehabilitationStory(paragraphs) {
  const story = document.querySelector("#rehabilitation-story");
  story.replaceChildren();
  paragraphs.forEach((paragraph) => {
    const element = document.createElement("p");
    element.textContent = paragraph;
    story.appendChild(element);
  });
}

// Rehabilitation restores part of the seal's condition before the release decision.
function resolveRehabilitation() {
  changeHealth(1);
  changeEnergy(1);
  laterLife.rehabilitationPhase = Math.random() < REHABILITATION_RELEASE_PROBABILITY
    ? "released"
    : "human-care";
  if (laterLife.rehabilitationPhase === "released") {
    seal.memories.releasedAfterLaterRescue = true;
    document.querySelector("#rehabilitation-title").textContent = "RETURN TO THE OCEAN";
    renderRehabilitationStory([
      "Your condition improves enough for you to return.",
      "The water feels familiar beneath you again."
    ]);
    document.querySelector("#rehabilitation-button").textContent = "RETURN TO THE WILD";
  } else {
    seal.memories.enteredPermanentHumanCare = true;
    document.querySelector("#rehabilitation-title").textContent = "A DIFFERENT LIFE";
    renderRehabilitationStory([
      "Your condition means returning to the wild is no longer possible.",
      "From now on, your life continues in human care."
    ]);
    document.querySelector("#rehabilitation-button").textContent = "CONTINUE";
  }
  document.querySelector("#rehabilitation-health").textContent = healthIndicator(seal.health);
  document.querySelector("#rehabilitation-energy").textContent = energyIndicator(seal.energy);
}

function startHumanCare() {
  // Human Care uses its own age sequence and event pool rather than Wild events.
  laterLife.route = "human-care";
  const nextAgeIndex = laterLife.humanCareAges.findIndex((age) => age >= laterLife.currentAge);
  laterLife.humanCareAgeIndex = nextAgeIndex === -1
    ? laterLife.humanCareAges.length - 1
    : nextAgeIndex;
  laterLife.currentAge = laterLife.humanCareAges[laterLife.humanCareAgeIndex];
  laterLife.humanCareUsedEvents = [];
  showHumanCareEvent();
}

function showHumanCareEnding() {
  seal.memories.diedInHumanCare = true;
  if (seal.energy === MIN_ENERGY) {
    seal.memories.diedWhileExhausted = true;
  }
  document.querySelector("#life-ending-title").textContent = "YOUR LIFE COMES TO AN END";
  document.querySelector("#life-ending-story").replaceChildren();
  const story = document.createElement("p");
  story.textContent = "Despite continuing care, your body can no longer recover.";
  document.querySelector("#life-ending-story").appendChild(story);
  seal.endingAge = `${laterLife.currentAge} YEARS`;
  document.querySelector("#ending-age").textContent = seal.endingAge;
  document.querySelector("#ending-health").textContent = healthIndicator(seal.health);
  document.querySelector("#ending-energy").textContent = energyIndicator(seal.energy);
  document.querySelector("#life-ending-message").textContent = "";
  document.querySelector("#remember-life-button").disabled = false;
  showScreen("life-ending-screen");
}

function continueHumanCare() {
  if (laterLife.currentAge === 45) {
    seal.memories.reachedExceptionalHumanCareAge = true;
    showHumanCareNaturalEnding();
    return;
  }
  const careEndingChance = Math.min(
    0.95,
    naturalEndingChance(laterLife.currentAge) + HUMAN_CARE_NATURAL_END_BONUS
  );
  if (Math.random() < careEndingChance) {
    showHumanCareNaturalEnding();
    return;
  }
  laterLife.humanCareAgeIndex += 1;
  laterLife.currentAge = laterLife.humanCareAges[laterLife.humanCareAgeIndex];
  showHumanCareEvent();
}

function showHumanCareNaturalEnding() {
  seal.memories.diedInHumanCare = true;
  if (seal.energy === MIN_ENERGY) {
    seal.memories.diedWhileExhausted = true;
  }
  document.querySelector("#life-ending-title").textContent = "A LIFE IN CARE";
  document.querySelector("#life-ending-story").replaceChildren();
  const story = document.createElement("p");
  story.textContent = "After many years, your life comes quietly to an end under human care.";
  document.querySelector("#life-ending-story").appendChild(story);
  seal.endingAge = `${laterLife.currentAge} YEARS`;
  document.querySelector("#ending-age").textContent = seal.endingAge;
  document.querySelector("#ending-health").textContent = healthIndicator(seal.health);
  document.querySelector("#ending-energy").textContent = energyIndicator(seal.energy);
  document.querySelector("#life-ending-message").textContent = "";
  document.querySelector("#remember-life-button").disabled = false;
  showScreen("life-ending-screen");
}

const lifeRecordMomentMap = [
  ["wasRescued", "Was rescued after an early-life injury."],
  ["survivedEarlyInjury", "Survived a serious injury early in life."],
  ["exploredAsPup", "Explored beyond your mother's side as a pup."],
  ["playedAsPup", "Spent a quiet day playing in the water."],
  ["exploredNewWaters", "Explored unfamiliar waters."],
  ["encounteredMarineDebris", "Encountered marine debris."],
  ["experiencedDisturbance", "Experienced disturbance at a resting place."],
  ["successfulBreedingDisplay", "Successfully completed a breeding display."],
  ["unsuccessfulBreedingDisplay", "Withdrew from a breeding competition."],
  ["injuredDuringBreeding", "Was injured during breeding competition."],
  ["fatheredOffspring", "Contributed to a new generation."],
  ["becameMother", "Became a mother."],
  ["leftPupToForage", "Left your pup resting on shore while you searched for food."],
  ["stayedWithPup", "Stayed beside your pup."],
  ["injuredByDebrisLater", "Was injured by marine debris later in life."],
  ["experiencedIllness", "Experienced serious illness."],
  ["criticalConditionTriggered", "Entered critical condition."],
  ["criticalButNotRescued", "Continued through critical condition without being found."],
  ["rescuedDuringLaterLife", "Was found and rescued during later life."],
  ["releasedAfterLaterRescue", "Recovered and returned to the ocean."],
  ["enteredPermanentHumanCare", "Continued life under permanent human care."],
  ["engagedWithEnrichment", "Engaged with enrichment while in human care."],
  ["healthDeclinedInHumanCare", "Required continuing care as your health declined."],
  ["diedInHumanCare", "Life came to an end under human care."],
  ["diedWhileExhausted", "Life ended while exhausted."],
  ["reachedOldAge", "Reached old age."],
  ["reachedExceptionalWildAge", "Lived an exceptionally long life in the wild."],
  ["reachedExceptionalHumanCareAge", "Lived an exceptionally long life under human care."]
];

function getHealthStateLabel(health) {
  return {
    3: "Healthy",
    2: "Weakened",
    1: "Critical",
    0: "Life Ended"
  }[health];
}

function getEnergyStateLabel(energy) {
  return {
    3: "Well Rested",
    2: "Stable",
    1: "Tired",
    0: "Exhausted"
  }[energy];
}

function getLifePathLabel() {
  if (seal.memories.enteredPermanentHumanCare) return "Human Care";
  if (seal.memories.releasedAfterLaterRescue) return "Rescued & Returned to the Wild";
  return "Wild";
}

function getLifeRecordMoments() {
  const moments = lifeRecordMomentMap
    .filter(([memory]) => seal.memories[memory])
    .map(([, phrase]) => phrase);
  const milestones = [
    ["learnedToSwim", "Learned to swim."],
    ["completedFirstHunt", "Completed your first hunt."],
    ["reachedAdulthood", "Reached adulthood."],
    ["enteredLaterLife", "Entered later life."]
  ];
  milestones.forEach(([milestone, phrase]) => {
    if (seal.milestones[milestone]) moments.push(phrase);
  });
  return moments;
}

function showLifeRecord() {
  document.querySelector("#life-record-sex").textContent = seal.sex;
  document.querySelector("#life-record-coat").textContent = seal.coatColour;
  document.querySelector("#life-record-pattern").textContent = seal.spotPattern;
  document.querySelector("#life-record-lifespan").textContent = seal.endingAge;
  document.querySelector("#life-record-path").textContent = getLifePathLabel();
  document.querySelector("#life-record-final-age").textContent = seal.endingAge;
  document.querySelector("#life-record-final-health").textContent = getHealthStateLabel(seal.health);
  document.querySelector("#life-record-final-energy").textContent = getEnergyStateLabel(seal.energy);

  const momentsElement = document.querySelector("#life-record-moments");
  momentsElement.replaceChildren();
  getLifeRecordMoments().forEach((moment) => {
    const item = document.createElement("li");
    item.textContent = moment;
    momentsElement.appendChild(item);
  });
  document.querySelector("#remember-life-button").disabled = false;
  showScreen("life-record-screen");
}

document.querySelector("#begin-later-life-button").addEventListener("click", () => {
  showLaterLifeEvent();
});
document.querySelector("#later-choice-one").addEventListener("click", () => chooseLaterLifeOption(0));
document.querySelector("#later-choice-two").addEventListener("click", () => chooseLaterLifeOption(1));
document.querySelector("#later-continue-button").addEventListener("click", continueLaterLife);
document.querySelector("#critical-button").addEventListener("click", () => {
  if (laterLife.criticalPhase === "prompt") {
    resolveCriticalCondition();
  } else if (laterLife.criticalPhase === "found") {
    showRehabilitation();
  } else {
    if (laterLife.criticalReturn === "juvenile") {
      showJuvenileTransition();
    } else {
      document.querySelector("#later-continue-button").hidden = false;
      continueLaterLife();
    }
  }
});
document.querySelector("#rehabilitation-button").addEventListener("click", () => {
  if (laterLife.rehabilitationPhase === "prompt") {
    resolveRehabilitation();
  } else if (laterLife.rehabilitationPhase === "released") {
    laterLife.route = "wild";
    if (laterLife.criticalReturn === "juvenile") {
      showJuvenileTransition();
      return;
    }
    if (laterLife.currentAge === 40) {
      showWildAge40();
    } else {
      laterLife.ageIndex += 1;
      laterLife.currentAge = laterLife.ages[laterLife.ageIndex];
      showLaterLifeEvent();
    }
  } else {
    startHumanCare();
  }
});
document.querySelector("#old-life-button").addEventListener("click", () => {
  showLifeRecord();
});
document.querySelector("#remember-life-button").addEventListener("click", () => {
  showLifeRecord();
});
document.querySelector("#live-another-life-button").addEventListener("click", () => {
  generateSeal();
  showScreen("start-screen");
});