import type { Lang } from "./types";

const S: Record<string, [string, string]> = {
  tagline: ["The cheapest nutritious week for every family.", "हर परिवार के लिए सबसे सस्ता पौष्टिक सप्ताह।"],
  household: ["1. Household", "1. परिवार"], age: ["Age", "उम्र"], sex: ["Sex", "लिंग"], F: ["Female", "महिला"], M: ["Male", "पुरुष"],
  status: ["Status", "स्थिति"], s0: ["Regular", "सामान्य"], s1: ["Pregnant", "गर्भवती"], s2: ["Lactating", "स्तनपान"],
  addMember: ["+ Add member", "+ सदस्य जोड़ें"], remove: ["Remove", "हटाएँ"], allergy: ["Allergy", "एलर्जी"],
  allergyNote: ["Tap an allergy under any member. Foods containing it are removed from the whole household plan.", "किसी भी सदस्य के नीचे एलर्जी चुनें। वह चीज़ पूरे परिवार के प्लान से हट जाती है।"],
  budget: ["2. Weekly budget (₹) and diet", "2. साप्ताहिक बजट (₹) और आहार"], budgetL: ["Weekly budget (₹)", "साप्ताहिक बजट (₹)"], diet: ["Diet", "आहार"],
  d0: ["Vegetarian", "शाकाहारी"], d1: ["Vegetarian + eggs", "शाकाहारी + अंडे"], d2: ["Non-vegetarian", "मांसाहारी"],
  d3: ["Vegan (no milk, curd, paneer, eggs)", "वीगन (दूध, दही, पनीर, अंडे नहीं)"], d4: ["Jain (no meat, eggs, onion, potato, carrot)", "जैन (मांस, अंडे, प्याज़, आलू, गाजर नहीं)"],
  month: ["Month (seasonal foods)", "महीना (मौसमी चीज़ें)"],
  pdsH: ["3. Ration (PDS) grain", "3. राशन (PDS) अनाज"], pdsOn: ["Family receives PDS grain", "परिवार को राशन का अनाज मिलता है"],
  pdsKg: ["Entitlement (kg per person per month)", "हक़ (किलो प्रति व्यक्ति प्रति माह)"], pdsPrice: ["PDS price (₹/kg)", "राशन भाव (₹/किलो)"],
  prefH: ["4. Kitchen", "4. रसोई"], quick: ["Quick cooking only (30 min or less)", "केवल जल्दी पकने वाला खाना (30 मिनट तक)"], nofridge: ["No refrigerator (skip milk, curd, eggs, meat)", "फ्रिज नहीं (दूध, दही, अंडे, मांस नहीं)"],
  healthH: ["5. Allergies and health", "5. एलर्जी और स्वास्थ्य"],
  dia: ["Diabetes-friendly: no jaggery, half the limit on rice and potato, more pulses", "मधुमेह-अनुकूल: गुड़ नहीं, चावल-आलू की सीमा आधी, दालें ज़्यादा"],
  mil: ["Millet boost: at least 50 g of bajra, ragi or jowar per person per day", "मोटा अनाज: बाजरा, रागी या ज्वार रोज़ कम से कम 50 ग्राम प्रति व्यक्ति"],
  fru: ["Include fruit every day (100 g per person)", "रोज़ फल शामिल करें (100 ग्राम प्रति व्यक्ति)"],
  avoid: ["Foods the family does not eat", "जो चीज़ें परिवार नहीं खाता"],
  tPlan: ["Weekly plan", "साप्ताहिक प्लान"], tWhy: ["Why this plan", "यह प्लान क्यों"], tNut: ["Nutrition", "पोषण"], tMenu: ["Weekly menu", "साप्ताहिक मेन्यू"], tPrice: ["Price monitor", "भाव मॉनिटर"],
  cost: ["Weekly cost", "साप्ताहिक लागत"], perDay: ["Per person per day", "प्रति व्यक्ति प्रति दिन"], under: ["Under budget", "बजट से कम"], over: ["Over budget", "बजट से ज़्यादा"],
  overMsg: ["The cheapest adequate plan is over your budget.", "सबसे सस्ता पर्याप्त प्लान आपके बजट से ज़्यादा है।"],
  listView: ["List", "सूची"], iconView: ["Large icons", "बड़े चित्र"], listen: ["Read aloud", "सुनें"], share: ["Share list", "सूची भेजें"], save: ["Save this plan", "प्लान सहेजें"], saved: ["Saved", "सहेजा गया"],
  food: ["Food", "खाद्य"], kg: ["kg / week", "किलो / सप्ताह"], gpd: ["g / person / day", "ग्राम / व्यक्ति / दिन"], rs: ["₹", "₹"], kgUnit: ["kg", "किलो"],
  safe: ["Allergy-safe: no food in this plan contains", "एलर्जी-सुरक्षित: इस प्लान की किसी चीज़ में नहीं है"], removedF: ["Foods removed for safety", "सुरक्षा के लिए हटाई गई चीज़ें"], member: ["Member", "सदस्य"],
  caution: ["Always read labels on packaged food. ThaliWise cannot detect cross-contact or hidden ingredients. For severe allergies, follow your doctor’s advice.", "पैकेट वाले खाने के लेबल ज़रूर पढ़ें। ThaliWise छिपी सामग्री या क्रॉस-कॉन्टैक्ट नहीं पहचान सकता। गंभीर एलर्जी में डॉक्टर की सलाह मानें।"],
  mode: ["Plan mode", "प्लान का तरीका"], mDia: ["Diabetes-friendly", "मधुमेह-अनुकूल"], mMil: ["Millet boost", "मोटा अनाज"], mFru: ["Daily fruit", "रोज़ फल"],
  noPlan: ["No plan is possible with these choices. Allergies and diet are never relaxed.", "इन विकल्पों के साथ प्लान संभव नहीं है। एलर्जी और आहार कभी ढीले नहीं किए जाते।"],
  tryOne: ["Try one of these:", "इनमें से कोई एक आज़माएँ:"],
  h_quick_cook: ["Turn off “Quick cooking only”", "“केवल जल्दी पकने वाला खाना” बंद करें"], h_no_fridge: ["Allow milk, curd and eggs (if you have a refrigerator)", "दूध, दही और अंडे जोड़ें (अगर फ्रिज है)"],
  h_excluded: ["Remove some foods from the “does not eat” list", "“नहीं खाते” सूची से कुछ चीज़ें हटाएँ"], h_millet_boost: ["Turn off the millet boost", "मोटा अनाज वाला विकल्प बंद करें"],
  h_daily_fruit: ["Turn off daily fruit", "रोज़ फल बंद करें"], h_diabetes: ["Turn off diabetes-friendly mode", "मधुमेह-अनुकूल विकल्प बंद करें"],
  limits: ["Limits that shaped this plan", "इस प्लान को आकार देने वाली सीमाएँ"], noLimits: ["No limit was tight. Every rule had room.", "कोई सीमा तंग नहीं थी।"],
  tight: ["{n} is met almost exactly", "{n} की ज़रूरत लगभग ठीक पूरी होती है"], eCap: ["Energy is at the 115% cap", "ऊर्जा 115% की सीमा पर है"], fCap: ["{n} is at its realistic limit", "{n} अपनी व्यावहारिक सीमा पर है"], pFull: ["PDS grain is fully used", "राशन का अनाज पूरा इस्तेमाल हुआ"],
  whyEach: ["Why each food", "हर चीज़ क्यों"], pdsReason: ["Free PDS grain: use the full entitlement", "मुफ़्त राशन का अनाज: पूरा हक़ इस्तेमाल करें"],
  supplies: ["Supplies {a}% of {n} for {b}% of the cost", "{n} का {a}% केवल {b}% लागत में"],
  energy: ["Energy", "ऊर्जा"], protein: ["Protein", "प्रोटीन"], iron: ["Iron", "आयरन"], calcium: ["Calcium", "कैल्शियम"],
  nutH: ["Nutrition: plan vs a typical basket", "पोषण: प्लान बनाम आम टोकरी"], required: ["Needed per week", "सप्ताह की ज़रूरत"], thaliwise: ["ThaliWise", "ThaliWise"], typical: ["Typical basket", "आम टोकरी"],
  nutSum: ["ThaliWise costs ₹{a} per week against ₹{b} for the typical basket, and moves iron coverage from {c}% to {d}%.", "ThaliWise की लागत ₹{a} प्रति सप्ताह है, आम टोकरी की ₹{b}; आयरन की पूर्ति {c}% से {d}% हो जाती है।"],
  anemia: ["Anemia risk indicator", "एनीमिया जोखिम संकेतक"], low: ["Low", "कम"], medium: ["Medium", "मध्यम"], high: ["High", "अधिक"],
  anemiaNote: ["An indication from dietary iron only, not a diagnosis.", "केवल आहार के आयरन पर आधारित संकेत है, निदान नहीं।"],
  basketNote: ["Typical basket: wheat, rice, toor dal, oil, potato, onion at common household quantities.", "आम टोकरी: गेहूं, चावल, अरहर दाल, तेल, आलू, प्याज़ सामान्य मात्रा में।"],
  menuH: ["Day-by-day kitchen split", "दिन-दर-दिन रसोई का बँटवारा"], mc1: ["Grains and staples", "अनाज और मुख्य सामग्री"], mc2: ["Dal and protein", "दाल और प्रोटीन"], mc3: ["Vegetables and greens", "सब्ज़ियाँ और साग"],
  menuNote: ["Quantities are for the whole household. Weekly totals match the plan exactly; dals, vegetables and greens are rotated across days for variety.", "मात्राएँ पूरे परिवार के लिए हैं। साप्ताहिक कुल प्लान के बराबर हैं; विविधता के लिए दालें, सब्ज़ियाँ और साग अलग-अलग दिन रखे गए हैं।"],
  live: ["Live mandi prices (Agmarknet)", "ताज़ा मंडी भाव (Agmarknet)"], stateL: ["State (e.g. Maharashtra, not a city)", "राज्य (जैसे Maharashtra, शहर नहीं)"], fetch: ["Fetch live prices", "ताज़ा भाव लाएँ"],
  liveNote: ["Covers staples, vegetables and fruit sold in mandis. Milk, oil, dals and the rest keep your manual prices.", "मंडी में बिकने वाले अनाज, सब्ज़ी और फल शामिल हैं। बाकी आपके डाले भाव पर रहते हैं।"],
  liveErr: ["Live prices are not available right now. Sample or manual prices are still in use.", "ताज़ा भाव अभी उपलब्ध नहीं हैं। नमूना या हाथ से डाले भाव इस्तेमाल हो रहे हैं।"],
  liveOk: ["{n} prices updated from mandi data ({d})", "{n} भाव मंडी आँकड़ों से अपडेट हुए ({d})"],
  sim: ["Simulate a price rise", "भाव बढ़ने का अनुमान"], apply: ["Apply", "लागू करें"], editPrices: ["Edit prices (₹/kg)", "भाव बदलें (₹/किलो)"],
  csvH: ["Import prices (CSV lines: food,price)", "भाव आयात करें (CSV: खाद्य,भाव)"], reset: ["Reset sample prices", "नमूना भाव वापस"],
  oldNew: ["Old plan at new prices", "पुराना प्लान नए भाव पर"], newPlan: ["New plan", "नया प्लान"], savings: ["Savings", "बचत"], changed: ["What changed (kg)", "क्या बदला (किलो)"], same: ["The plan stays the same.", "प्लान वही रहता है।"],
  history: ["Saved plans", "सहेजे गए प्लान"], people: ["people", "सदस्य"],
  loading: ["Planning…", "प्लान बन रहा है…"], err: ["Cannot reach the server. Check that the backend is running.", "सर्वर से संपर्क नहीं हो पा रहा। जाँचें कि बैकएंड चल रहा है।"],
  disclaimer: ["Prototype with sample prices and nutrient values. Allergy and health options are decision aids, not medical advice.", "नमूना भाव और पोषण मान वाला प्रोटोटाइप। एलर्जी और स्वास्थ्य विकल्प सहायक हैं, चिकित्सीय सलाह नहीं।"],
  days: ["Mon,Tue,Wed,Thu,Fri,Sat,Sun", "सोम,मंगल,बुध,गुरु,शुक्र,शनि,रवि"],
  months: ["Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec", "जन,फ़र,मार्च,अप्रै,मई,जून,जुला,अग,सित,अक्टू,नव,दिस"],
};
const ALLERGEN_NAMES: Record<string, [string, string]> = {
  peanut: ["Peanut", "मूंगफली"], milk: ["Milk", "दूध"], lactose: ["Lactose", "लैक्टोज़"], egg: ["Egg", "अंडा"],
  gluten: ["Gluten", "ग्लूटेन"], soy: ["Soy", "सोया"], sesame: ["Sesame", "तिल"], fish: ["Fish", "मछली"],
};

export const t = (lang: Lang, key: string, vars?: Record<string, string | number>): string => {
  let s = (S[key] ?? [key, key])[lang === "hi" ? 1 : 0];
  if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
};
export const allergenName = (lang: Lang, a: string) => (ALLERGEN_NAMES[a] ?? [a, a])[lang === "hi" ? 1 : 0];
export const list = (lang: Lang, key: string) => t(lang, key).split(",");
export const inr = (n: number) => Math.round(n).toLocaleString("en-IN");
