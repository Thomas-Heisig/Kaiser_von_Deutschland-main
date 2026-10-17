import type { CampaignId, CampaignObjective } from './CampaignCatalog';

export interface StoryChapter {
  title: string;
  narrative: string;
}
/** Three sequential chapters per campaign, each with two live objectives. */
export const CHAPTERS: Record<CampaignId, readonly [StoryChapter, StoryChapter, StoryChapter]> = {
  frei: [
    { title: 'Freie Herrschaft', narrative: 'Dein Reich hat kein verpflichtendes Kampagnenziel.' },
    { title: 'Deine Geschichte', narrative: 'Gestalte Wirtschaft, Politik und Kultur nach deinem Willen.' },
    { title: 'Offene Zukunft', narrative: 'Spiele ohne festes Ende weiter.' }
  ],
  aufbau: [
    { title: 'Das hungernde Lehen', narrative: 'Sichere Felder und Märkte, damit das Volk über den Winter kommt.' },
    { title: 'Wissen und Vertrauen', narrative: 'Investiere in Schulen und das Wohlergehen deiner Untertanen.' },
    { title: 'Die Krone behaupten', narrative: 'Baue eine beständige Wirtschaft auf und bezwinge einen Rivalen.' }
  ],
  hanse: [
    { title: 'Die ersten Segel', narrative: 'Häfen und Marktplätze erschließen neue Handelswege.' },
    { title: 'Der Bund der Kaufleute', narrative: 'Erweitere deine Handelsrouten und deinen Einfluss.' },
    { title: 'Die reiche Hansestadt', narrative: 'Verbinde Wohlstand und das Vertrauen der Bürgerschaft.' }
  ],
  wissenschaft: [
    { title: 'Die Saat des Wissens', narrative: 'Errichte Schulen und eine Universität für die Gelehrten.' },
    { title: 'Der Aufbruch der Forscher', narrative: 'Schließe Forschungsprojekte ab und erringe einen Wissensvorsprung.' },
    { title: 'Ein erleuchtetes Reich', narrative: 'Bildung und Staatsfinanzen sichern die Zukunft.' }
  ],
  grenzland: [
    { title: 'Schutz für die Mark', narrative: 'Baue Kasernen und eine befestigte Residenz.' },
    { title: 'Die wehrhaften Städte', narrative: 'Stadtmauern und ausgebildete Truppen halten den Feind auf.' },
    { title: 'Frieden durch Stärke', narrative: 'Sichere eine Eroberung und die Stabilität im Grenzland.' }
  ],
  kultur: [
    { title: 'Die Glocken der Stadt', narrative: 'Errichte geistliche und schulische Zentren.' },
    { title: 'Gelehrte und Baumeister', narrative: 'Heb den kulturellen Einfluss und gründe eine Universität.' },
    { title: 'Frieden im Volk', narrative: 'Sichere eine glückliche, stabile Gesellschaft.' }
  ],
  kaiserkrone: [
    { title: 'Ein starker Herrschaftssitz', narrative: 'Baue eine Burg und belebe die Märkte.' },
    { title: 'Die Kunst des Friedens', narrative: 'Knüpfe diplomatische Bande und entwickle den Handel.' },
    { title: 'Die Krone des Reiches', narrative: 'Besiege einen Rivalen und festige den königlichen Schatz.' }
  ]
};
export interface CampaignChapterStatus {
  index: number;
  total: number;
  title: string;
  narrative: string;
  goals: CampaignObjective[];
  ready: boolean;
  finished: boolean;
}
export function chapterStatus(id: CampaignId, completed: number, goals: CampaignObjective[]): CampaignChapterStatus {
  if (!Number.isSafeInteger(completed) || completed < 0 || completed > CHAPTERS[id].length)
    throw new RangeError('Ungültiger Kampagnenfortschritt.');
  const finished = completed === CHAPTERS[id].length;
  const index = finished ? CHAPTERS[id].length - 1 : completed;
  const chapter = CHAPTERS[id][index];
  const objectives = goals.slice(index * 2, index * 2 + 2);
  return {
    index, total: CHAPTERS[id].length, title: chapter.title, narrative: chapter.narrative,
    goals: objectives, ready: !finished && objectives.length === 2 && objectives.every((goal) => goal.done), finished
  };
}
