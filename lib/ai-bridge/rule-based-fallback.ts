// ---------------------------------------------------------------------
// lib/ai-bridge/rule-based-fallback.ts — Offline-First Architecture · Phase 9
// RuleBasedFallback: a lightweight, dependency-free AI provider that answers
// the ~50 most common disaster-safety questions with pre-written responses.
//
// When the cloud is unreachable AND the local Gemma model can't run (device
// too weak, download failed, model corrupted), the chat bridge steps down to
// this provider instead of returning "I'm offline." The responses are static
// strings — no inference, no network, no model download — so they work even
// on the weakest device with zero cache.
//
// Matching is substring-based on a normalized prompt, so "what should I do
// during a flood?" and "flood safety tips" both hit the same key. Unmatched
// prompts get a guided fallback that points to the emergency helpline and
// the Resources tab instead of a dead end.
// ---------------------------------------------------------------------

import type { AIProvider, AIResponse, ChatContext, ProviderStatus } from "./types";

/** A single pre-written answer keyed by one or more trigger phrases. */
export interface RuleEntry {
  /** Trigger phrases — the prompt (lowercased) must include one of these. */
  keys: string[];
  /** The answer shown when a key matches. */
  response: string;
}

/**
 * The curated offline knowledge base. Keys are intentionally broad
 * (word-stemmed / phrase level) so a 2G user typing "flood" still lands on
 * the flood checklist. Order matters — more specific entries come first.
 */
export const RULE_RESPONSES: RuleEntry[] = [
  // ---- flood ----------------------------------------------------------
  {
    keys: ["flood what should i do", "during a flood", "flood safety", "flooding", "flood"],
    response:
      "1. Move to the highest ground you can reach immediately. 2. Do NOT walk or drive through flowing water — 15 cm of water can knock you over, 30 cm can move a car. 3. Stay away from electricity: turn off gas and power at the mains if you can do so safely. 4. Do not drink flood water — it is contaminated. 5. Keep listening to the radio or this app for official updates.",
  },
  {
    keys: ["flood inside my home", "water in my house", "flood water entering"],
    response:
      "Do not stay in a room filling with water. Move valuables and important documents to the top floor, turn off the main power and gas, and leave the building if water is rising fast. Head to the highest point nearby — a neighbour's top floor, a hill, or a marked shelter.",
  },
  {
    keys: ["flood after", "after the flood", "flood cleanup"],
    response:
      "Do not return until authorities say it is safe. Discard any food, medicines or supplies that touched flood water. Wear rubber boots and gloves when cleaning; open windows to dry out the home. Report contaminated wells — do not drink from them. Watch for snakes and damaged power lines.",
  },
  {
    keys: ["driving through flood", "car in flood", "flooded road"],
    response:
      "Never drive through floodwater. Just 30 cm of moving water can carry a car away. If your vehicle is caught, abandon it and move to higher ground. If water is rising inside the car, break a window to escape.",
  },
  {
    keys: ["flood warning issued", "flood alert"],
    response:
      "A flood warning is already in effect in your area. Prepare your go-bag now: documents, medicines, phone charger, torch, bottled water, dry clothes. Move to higher ground before water arrives — do not wait. Listen for evacuation orders and move early.",
  },

  // ---- cyclone / storm ------------------------------------------------
  {
    keys: ["cyclone safety", "cyclone", "hurricane", "typhoon"],
    response:
      "1. Stay indoors and away from windows and glass doors. 2. Keep your emergency kit ready — water, food, torch, batteries, documents. 3. Turn off gas and electricity at the mains. 4. Listen to the local radio for updates. 5. Do not go outside during the 'eye' of the storm — the wind returns.",
  },
  {
    keys: ["cyclone coming", "storm approaching"],
    response:
      "A cyclone is approaching. Secure loose items outdoors — they become missiles in high wind. Tape or board up windows. Store drinking water and charge your phone fully. Know your evacuation route and shelter location. Move to a sturdy building if yours is weak.",
  },
  {
    keys: ["storm surge"],
    response:
      "A storm surge is a wall of water pushed ashore by a cyclone — it is the most dangerous part. If you live near the coast, move to higher ground at least 2 km inland or to the upper floor of a strong building. Never stay on the beach or low-lying areas to 'watch'.",
  },

  // ---- earthquake ------------------------------------------------------
  {
    keys: ["earthquake what should i do", "during an earthquake", "earthquake safety", "earthquake"],
    response:
      "DROP, COVER and HOLD ON. Drop to your hands and knees, take cover under a sturdy table or desk, and hold on until the shaking stops. Stay away from windows, glass and heavy furniture. If you are outdoors, move to an open space away from buildings and power lines. If you are in bed, stay there and cover your head.",
  },
  {
    keys: ["after an earthquake"],
    response:
      "After the shaking stops, check yourself and others for injuries. Expect aftershocks — be ready to Drop, Cover and Hold On again. Evacuate carefully; do not use lifts. Check for gas leaks, fires and damaged wiring before turning anything on. Follow official advice before re-entering buildings.",
  },
  {
    keys: ["earthquake tsunamis", "tsunami"],
    response:
      "If you feel a strong earthquake near the coast, move to high ground immediately — do not wait for a tsunami warning. Go inland at least 3 km or to an elevation above 30 m. Tsunamis arrive as a series of waves; the first is not the biggest. Stay away from the coast until authorities declare it safe.",
  },

  // ---- heatwave / heat ------------------------------------------------
  {
    keys: ["heatwave", "extreme heat", "heat safety"],
    response:
      "1. Stay indoors during the hottest part of the day (12–4 pm). 2. Drink water regularly — do not wait for thirst. 3. Wear loose, light clothing and a hat. 4. Never leave children or pets in a parked car. 5. Watch for heat exhaustion: dizziness, headache, cramps. Move to shade, cool down and sip water if it starts.",
  },
  {
    keys: ["heat stroke"],
    response:
      "Heat stroke is an emergency. Call 108. Move the person to shade, remove extra clothing, cool them with wet cloths or cool water, and fan them. If they are conscious, give small sips of water. Do not give liquids if they are unconscious or vomiting.",
  },

  // ---- fire / smoke ----------------------------------------------------
  {
    keys: ["fire in my building", "house fire", "building fire"],
    response:
      "Get out immediately — do not stop to collect belongings. Feel doors before opening; if hot, use another exit. Stay low under the smoke. Once out, call the fire service (101) and do not go back inside for anything. If trapped, close doors behind you, seal gaps and call for help from a window.",
  },
  {
    keys: ["wildfire", "forest fire", "bushfire"],
    response:
      "Leave early — do not wait for an order. Take your go-bag, pets and important documents. Move away from the wind direction and toward cleared ground. If trapped, shelter in a cleared area or a building away from vegetation. Call 101 and tell someone your location.",
  },
  {
    keys: ["gas leak", "smell of gas"],
    response:
      "If you smell gas, do NOT use any switch, phone, matches or flame. Open doors and windows, leave the building, and call the gas emergency number / 100 from outside. Warn neighbours. Do not re-enter until declared safe.",
  },

  // ---- health / medical ------------------------------------------------
  {
    keys: ["chest pain", "heart attack"],
    response:
      "This could be a heart attack — call 108 now. While waiting, sit the person down, loosen tight clothing and keep them calm. If they carry prescribed medicine, help them take it. Begin CPR if they collapse and are not breathing: push hard and fast in the centre of the chest at about 100–120 per minute.",
  },
  {
    keys: ["choking"],
    response:
      "Encourage the person to cough. If they cannot cough, speak or breathe, perform the Heimlich: stand behind them, place a fist above the navel, and thrust sharply inward and upward. If they lose consciousness, call 108 and begin CPR.",
  },
  {
    keys: ["burn", "burns"],
    response:
      "Cool the burn under cool (not ice) running water for 10–20 minutes. Remove jewellery and clothing near the burn, but do not pull anything stuck to the skin. Cover loosely with a clean cloth. Do not apply creams, ice or break blisters. For serious burns, call 108.",
  },
  {
    keys: ["bleeding", "wound bleeding"],
    response:
      "Press firmly on the wound with a clean cloth to stop bleeding, and elevate the injured limb. Do not remove an object stuck in the wound — press around it. Keep pressure until help arrives. Call 108 for heavy bleeding that soaks through.",
  },
  {
    keys: ["snake bite"],
    response:
      "Stay calm and still — movement spreads venom. Keep the bitten limb at or below heart level. Do NOT cut, suck or apply a tourniquet. Remove rings or tight clothing near the bite. Get to a hospital immediately and call 108. Note the snake's appearance for the doctor.",
  },
  {
    keys: ["dengue", "malaria", "fever"],
    response:
      "Rest and drink plenty of fluids. Use paracetamol for fever — avoid aspirin or ibuprofen (they increase bleeding risk in dengue). Watch for danger signs: severe abdominal pain, vomiting, bleeding gums, extreme weakness. If any appear, go to a hospital at once.",
  },
  {
    keys: ["diarrhea", "loose motions", "cholera"],
    response:
      "The biggest risk is dehydration. Mix Oral Rehydration Salt with clean water and drink after every loose stool. Drink boiled or bottled water only. If there is blood in the stool, high fever, or signs of severe dehydration, go to a health centre immediately.",
  },

  // ---- shelter / relief -----------------------------------------------
  {
    keys: ["nearest shelter", "where is the shelter", "find a shelter", "shelter near me"],
    response:
      "Shelter locations are pre-downloaded in the Resources tab — open it even without internet. If the app shows no cached shelters, call the emergency helpline (112) or ask a neighbour or police for the nearest designated shelter. Move early: shelters fill up during a disaster.",
  },
  {
    keys: ["evacuation", "evacuate", "where do i go"],
    response:
      "Check the Resources tab for your pre-downloaded evacuation route and nearest shelter. If you must evacuate: take your go-bag, important documents, medicines, phone and charger. Follow the marked routes — do not drive through floodwater. Tell a family member or neighbour where you are going.",
  },
  {
    keys: ["food distribution", "food relief", "where to get food"],
    response:
      "Relief food distribution points are usually at the nearest school, community hall or designated shelter. Check the Resources tab for cached relief locations in your district. If nothing is cached, listen to the local radio for distribution announcements.",
  },
  {
    keys: ["water safe to drink", "drinking water", "clean water"],
    response:
      "During a disaster, tap water may be contaminated. Drink bottled or boiled water only. If you must use stored water, add 2 drops of bleach per litre and wait 30 minutes. Do not drink flood water under any circumstances.",
  },

  // ---- communication / family -----------------------------------------
  {
    keys: ["family member missing", "find my family", "relative lost", "missing person"],
    response:
      "Call or message your relative on every channel you have. Post on the app's 'I am Safe' page — their app will show your status when they reconnect. Register the person as missing at the nearest police station or relief centre. Emergency helpline: 112.",
  },
  {
    keys: ["i am safe", "mark myself safe"],
    response:
      "Open the 'I am Safe' button on the home screen of this app and mark yourself safe — your family and community will see it as soon as they reconnect. It works even offline and syncs automatically when you have a connection.",
  },
  {
    keys: ["phone battery dying", "save battery", "battery conservation"],
    response:
      "Switch to low-power mode, reduce screen brightness and turn off Wi-Fi, Bluetooth and background apps. Keep the phone on silent for calls and use text messages — they use less power. Charge from a power bank, car or solar source when available. Avoid playing videos or games.",
  },

  // ---- first aid / general safety -------------------------------------
  {
    keys: ["first aid", "first aid kit"],
    response:
      "Your first aid kit should contain: bandages, sterile gauze, antiseptic, adhesive tape, scissors, gloves, pain reliever, ORS sachets, oral thermometer and any prescription medicines. Replenish it after every use. For serious injuries, call 108 and keep the person warm and calm until help arrives.",
  },
  {
    keys: ["emergency kit", "go bag", "survival kit"],
    response:
      "Pack a go-bag now: water (3 litres per person per day), dry food for 3 days, torch with batteries, power bank, important documents in a waterproof pouch, medicines, first-aid kit, whistle, blankets, and a change of clothes. Keep it near the exit. Check it every 6 months.",
  },
  {
    keys: ["power cut", "power outage", "electricity gone", "no power"],
    response:
      "Use a torch or candles safely — keep flames away from curtains. Unplug sensitive appliances to protect against surges when power returns. Keep the fridge closed to preserve food. If you use a generator, run it outdoors — never indoors, carbon monoxide kills silently.",
  },
  {
    keys: ["landslide", "mudslide"],
    response:
      "Move away from the path of a landslide immediately — do not try to outrun it downhill. Head to high ground on the side away from the slide. Watch for cracks, bulging ground or falling rocks that signal a new slide. After it stops, stay away — the ground is unstable.",
  },
  {
    keys: ["thunderstorm", "lightning"],
    response:
      "When thunder roars, go indoors. Avoid open fields, hilltops, tall trees and metal objects. Unplug electronics. Indoors, stay away from windows and plumbing. Wait 30 minutes after the last thunder before going back out.",
  },
  {
    keys: ["road closed", "road blocked", "can't reach road"],
    response:
      "Road closures are in place for your safety — do not remove barricades or drive around them. Use the app's cached map to find an alternate route. If a road is flooded, it may be washed out underneath; never attempt to cross.",
  },

  // ---- generic guidance ------------------------------------------------
  {
    keys: ["what should i do", "help me", "help"],
    response:
      "Tell me what kind of emergency you are facing and I will give you specific steps — for example 'flood', 'cyclone', 'earthquake' or 'fire'. You can also tap the quick prompts below. If someone is seriously hurt or in immediate danger, call 112 now.",
  },
  {
    keys: ["i don't know what to do", "confused", "panicked"],
    response:
      "Stay calm. Take one step at a time: 1) Make sure you and the people with you are out of immediate danger. 2) Call 112 if anyone is hurt. 3) Move to the safest nearby place — high ground for flood, sturdy building for wind. 4) Tell someone you trust where you are. You can ask me about specific dangers like flood, cyclone, or earthquake.",
  },
  // ---- cold / winter --------------------------------------------------
  {
    keys: ["cold wave", "extreme cold", "winter storm", "freezing", "hypothermia"],
    response:
      "Stay indoors and keep rooms warm. Dress in layers — a hat and gloves prevent the most heat loss. Never use a gas stove, charcoal or generator indoors for heat — carbon monoxide kills silently. Check on elderly neighbours. Watch for hypothermia: shivering, confusion, slurred speech — get the person warm and call 108.",
  },
  {
    keys: ["frostbite"],
    response:
      "Frostbitten skin feels numb and looks pale or waxy. Move to a warm place and warm the area with body heat — do NOT rub it, which damages tissue. Warm water (not hot) can help. If numbness persists or the skin turns dark, go to a hospital.",
  },

  // ---- air quality / environment --------------------------------------
  {
    keys: ["smog", "air pollution", "air quality"],
    response:
      "Stay indoors and keep doors and windows closed. Avoid exertion outdoors, especially during morning and evening peaks. Wear an N95 mask if you must go out. Use a damp cloth to reduce indoor dust. Children, the elderly and people with asthma should limit exposure most.",
  },
  {
    keys: ["chemical spill", "gas leak warning", "hazardous material"],
    response:
      "Move indoors immediately and close all doors, windows and vents. Turn off air conditioning. Listen for official instructions — you may be asked to shelter in place or evacuate. Do not go near the spill. If you have been exposed, remove contaminated clothing and wash skin thoroughly, then seek medical help.",
  },

  // ---- health conditions / vulnerable ----------------------------------
  {
    keys: ["stroke"],
    response:
      "Strokes are a medical emergency — call 108 immediately. Note the time symptoms started. Remember FAST: Face drooping, Arm weakness, Speech difficulty, Time to call. Keep the person lying down with head slightly raised. Do not give food, water or medicine.",
  },
  {
    keys: ["diabetic emergency", "low blood sugar", "high blood sugar"],
    response:
      "For low blood sugar (sweating, shaking, confusion): give sugar — glucose, juice or sweets immediately if the person is conscious. For high blood sugar (thirst, frequent urination, fruity breath): encourage water, check for emergency signs like deep rapid breathing, and call 108. If the person is unconscious, do not give anything by mouth — call 108.",
  },
  {
    keys: ["epilepsy", "seizure"],
    response:
      "Do not hold the person down or put anything in their mouth. Clear the area of hard objects and cushion their head. Time the seizure — if it lasts over 5 minutes or repeats, call 108. After it stops, turn them on their side and stay until they are fully awake.",
  },
  {
    keys: ["elderly person", "care for the elderly", "old person needs help"],
    response:
      "Elderly people are more vulnerable during disasters — check on them daily. Ensure they have medicines, food, water and warmth. Help them write their emergency numbers and keep a go-bag at their door. If they seem confused, weak or unwell, get medical help promptly.",
  },
  {
    keys: ["baby", "infant", "newborn", "young child"],
    response:
      "Keep infants warm and dry — they lose heat fast. Store boiled water and formula or nursing access. Do not give plain water to babies under 6 months. Watch for danger signs in a sick child: high fever, listlessness, difficulty breathing, poor feeding — seek help urgently if any appear.",
  },

  // ---- animals / bites ------------------------------------------------
  {
    keys: ["dog bite", "animal bite", "rabies"],
    response:
      "Wash the wound immediately with soap and plenty of running water for 10–15 minutes. Apply an antiseptic and cover with a clean cloth. Go to a hospital the same day for a rabies vaccine — rabies is preventable but only if treated early. Note the animal's owner and vaccination status if known.",
  },
  {
    keys: ["stray animals", "wild animals", "animals during disaster"],
    response:
      "Do not approach or feed stray or wild animals during a disaster — they are scared and unpredictable. Keep food sealed to avoid attracting them. If an animal is injured, report it to authorities; do not handle it yourself. Wash any bite or scratch immediately.",
  },

  // ---- extreme events --------------------------------------------------
  {
    keys: ["tornado"],
    response:
      "Take shelter immediately in a basement or the innermost room of the ground floor — a bathroom without windows is best. Cover your head and neck. Stay away from windows. Do not try to outrun a tornado in a car; leave the vehicle for a ditch or low ground and cover your head.",
  },
  {
    keys: ["building collapse", "house collapsed"],
    response:
      "If trapped: do not light matches, move or kick up dust. Cover your mouth with cloth, and tap on pipes or walls so rescuers can hear you — shout only as a last resort. If you can walk out, do so carefully avoiding unstable debris. Call 112 and wait for rescue teams.",
  },
  {
    keys: ["dam failure", "dam burst", "levee breach", "flash flood"],
    response:
      "A dam/levee failure causes a flash flood — move to high ground immediately and do not stop for belongings. Flash floods rise in minutes; never drive or walk through moving water. Head inland and upward, and follow evacuation orders at once.",
  },
  {
    keys: ["volcanic eruption", "volcano"],
    response:
      "Follow evacuation orders and leave the area immediately. If caught in ash fall, wear long sleeves, eye protection and a cloth over your mouth. Stay indoors with doors and windows closed if ash is falling. Clear ash from roofs as it is heavy. Avoid river valleys — lahars (mudflows) travel fast.",
  },
  {
    keys: ["dust storm", "sandstorm"],
    response:
      "Go indoors immediately and close all doors and windows. If caught outside, cover your nose and mouth with a cloth, shield your eyes, and shelter behind something sturdy — never in a car with the engine running. Wait for visibility to return before moving.",
  },

  // ---- crowd / public safety ------------------------------------------
  {
    keys: ["crowd", "stampede", "crush", "large crowd"],
    response:
      "Stay calm and keep moving with the crowd — do not push or resist the flow. Keep your hands up in front of your chest to protect it. Move diagonally toward the edge of the crowd to escape. If you fall, curl into a ball covering your head. Move away from barriers and narrow exits.",
  },
  {
    keys: ["suspicious package", "suspicious bag", "bomb threat"],
    response:
      "Do NOT touch, open or move the package. Leave the area calmly and warn others. Call 100 from a safe distance and describe exactly where the item is. Follow police instructions — do not use your phone near the item in case it is a trigger.",
  },
  {
    keys: ["shooting", "active shooter", "gunfire", "heard shots"],
    response:
      "If you can leave safely, run — leave belongings and get away. If you cannot, hide in a locked room, turn off lights and silence your phone. As a last resort, fight. When it is safe, call 100 and give your exact location. Do not approach police with anything in your hands.",
  },

  // ---- power / utility failures ---------------------------------------
  {
    keys: ["no water supply", "water supply cut", "water shortage"],
    response:
      "Store water in clean containers now. Use stored water sparingly — for drinking, cooking and hygiene. Boil or treat any uncertain water (2 drops of bleach per litre, wait 30 minutes). Local tankers and relief water points are usually announced on the radio — listen for locations.",
  },
  {
    keys: ["phone lost", "no network", "can't connect", "no signal"],
    response:
      "Move to a higher location or near a window — signals improve with elevation. Turn your phone off and on to re-register. Send SMS instead of calls — texts use far less bandwidth and often pass when calls fail. Use a neighbour's phone or a public phone booth if available.",
  },

  // ---- generic / helpline ---------------------------------------------
  {
    keys: ["what is the helpline", "emergency number", "who do i call"],
    response:
      "National emergency: 112. Ambulance: 108. Police: 100. Fire: 101. Disaster helpline: 1070. Save these now. Even with no mobile data, calls and SMS work on 2G and during most outages.",
  },
  {
    keys: ["sos", "save me", "emergency help", "i'm trapped", "i am trapped"],
    response:
      "If you are in immediate danger, call 112 now and stay on the line. If you cannot speak, tap the app's SOS button or send an SMS to 112 with your location. Keep calm, breathe slowly, and do not waste phone battery — help will come.",
  },
];

/**
 * The offline answer when no rule matches. Points to the helpline and the
 * cached Resources tab instead of a dead end — never leaves the user stuck.
 */
export const RULE_FALLBACK_RESPONSE =
  "I don't have an answer for that in my offline database. Please connect to the internet, or contact emergency services at 112. You can also check the Resources tab — it has pre-downloaded shelter and relief information that works without a connection.";

export class RuleBasedFallback implements AIProvider {
  /** Confidence assigned to exact rule matches (Phase 9 scoring). */
  static readonly MATCH_CONFIDENCE = 0.9;
  /** Confidence for the generic fallback answer (deliberately low). */
  static readonly FALLBACK_CONFIDENCE = 0.2;

  getStatus(): ProviderStatus {
    return "local-ready"; // rules are always "loaded" — they ship with the app
  }

  estimateTokens(text: string): number {
    return Math.max(1, Math.ceil(text.trim().length / 4));
  }

  /** True — a static rule set needs no download. */
  async loadModel(): Promise<boolean> {
    return true;
  }

  async generateResponse(prompt: string, _context: ChatContext = {}): Promise<AIResponse> {
    // _context is accepted for the AIProvider contract; rules are static.
    void _context;
    const normalized = prompt.toLowerCase().trim();
    for (const entry of RULE_RESPONSES) {
      if (entry.keys.some((key) => normalized.includes(key))) {
        return {
          text: entry.response,
          mode: "local",
          durationMs: 0,
          confidence: RuleBasedFallback.MATCH_CONFIDENCE,
          source: "rule-based",
        };
      }
    }
    return {
      text: RULE_FALLBACK_RESPONSE,
      mode: "local",
      durationMs: 0,
      confidence: RuleBasedFallback.FALLBACK_CONFIDENCE,
      source: "rule-based",
    };
  }
}

export default RuleBasedFallback;
