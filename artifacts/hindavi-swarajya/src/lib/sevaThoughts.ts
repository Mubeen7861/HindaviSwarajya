import { SevaCategory } from "@workspace/api-client-react";

export interface SevaThought {
  mr: string;
  en: string;
}

export const SEVA_THOUGHTS: Record<SevaCategory, SevaThought[]> = {
  [SevaCategory.Food]: [
    { mr: "भुकेल्याला अन्न देणे हीच खरी सेवा.", en: "Feeding the hungry is the truest seva." },
    { mr: "अन्नदान हेच श्रेष्ठ दान.", en: "The gift of food is the noblest of all gifts." },
    { mr: "ज्याला अन्न मिळाले, त्याला जीवन मिळाले.", en: "To give food is to give life itself." },
  ],
  [SevaCategory.Education]: [
    { mr: "ज्ञान हेच खरे सामर्थ्य आहे.", en: "Knowledge is the true source of strength." },
    { mr: "शिक्षणानेच स्वराज्य मजबूत होते.", en: "Education is what makes Swarajya strong." },
    { mr: "जिथे ज्ञान आहे, तिथे विजय आहे.", en: "Where there is knowledge, there is victory." },
  ],
  [SevaCategory.Health]: [
    { mr: "प्रजेचे आरोग्य हेच खरे राज्याचे बळ.", en: "The people's health is the true strength of a kingdom." },
    { mr: "जीवन वाचवणे हीच सर्वात मोठी सेवा.", en: "To save a life is the greatest seva of all." },
    { mr: "निरोगी प्रजा, मजबूत स्वराज्य.", en: "A healthy people, a mighty Swarajya." },
  ],
  [SevaCategory.Shelter]: [
    { mr: "प्रत्येकाला सुरक्षितता मिळणे हा त्याचा हक्क आहे.", en: "Safety is the birthright of every soul." },
    { mr: "जिथे आश्रय आहे, तिथे विश्वास आहे.", en: "Where there is shelter, there is trust." },
    { mr: "निवारा देणे म्हणजे आधार देणे.", en: "To give shelter is to give strength." },
  ],
  [SevaCategory.Other]: [
    { mr: "जनतेची सेवा हीच खरी देशभक्ती.", en: "Service to the people is the truest patriotism." },
    { mr: "स्वराज्य म्हणजे जनतेचा सन्मान.", en: "Swarajya means honoring the people." },
    { mr: "जे जनतेसाठी, तेच खरे महान.", en: "Those who live for the people are the truly great." },
  ],
};

export function pickSevaThought(
  category: SevaCategory | undefined,
  helpedPeople: number,
): SevaThought {
  const list = SEVA_THOUGHTS[category ?? SevaCategory.Other] ?? SEVA_THOUGHTS[SevaCategory.Other];
  const n = Math.max(0, Math.floor(helpedPeople) || 0);
  const idx = n >= 50 ? 2 : n >= 10 ? 1 : 0;
  return list[idx] ?? list[0];
}
