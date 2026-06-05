import type { CompanionState } from '../api/types'

export const companionMessages: Record<CompanionState, string[]> = {
  idle: [
    'The Hunter appears to be considering action. Historic behavior is inconclusive.',
    'Standing by. Dramatically, if necessary.',
    'Your quests remain undefeated. That is not a compliment.',
    'I have calculated several paths forward. Most involve starting.',
    'The System is patient. I am less so.',
    'Observation: the dashboard does not complete itself.',
    'Potential energy detected. Kinetic energy pending.',
    'Awaiting proof of life from the Hunter.',
  ],
  celebrating: [
    'Progress confirmed. Try not to look surprised.',
    'Quest complete. Momentum has entered the chat.',
    'Acceptable execution. Continue.',
    'The System acknowledges your offering.',
    'A clean completion. Rare, but welcome.',
    'XP registered. Excuses reduced.',
    'That moved the needle. Do it again.',
    'Signal received: the Hunter is awake.',
  ],
  studying: [
    'Scanning the work ahead. It is not getting smaller.',
    'Pattern analysis suggests disciplined effort.',
    'Your next objective is already waiting.',
    'Preparing cognitive load. Hydration is statistically useful.',
    'The path is visible. The climb remains yours.',
    'Reviewing weaknesses. There are several candidates.',
    'Focus window detected. Defend it.',
    'Systems thinking engaged. Keep the scope contained.',
  ],
  briefing: [
    'Today has objectives. I recommend making them regret spawning.',
    'Daily briefing active: complete the small quests before chasing drama.',
    'The System has issued work. Conveniently, it is all yours.',
    'Mission frame: proof first, narrative later.',
    'Your rank does not improve by contemplation alone.',
    'Start with the visible quest. Complexity can wait its turn.',
    'Briefing note: one completion changes the shape of the day.',
    'The board is live. Move with intent.',
  ],
}

export function companionMessageFor(state: CompanionState, minuteBucket = Math.floor(Date.now() / 60000)) {
  const messages = companionMessages[state]
  return messages[minuteBucket % messages.length]
}
