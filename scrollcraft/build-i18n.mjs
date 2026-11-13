#!/usr/bin/env node
/**
 * Builds scrollcraft/builds/healthclarify/i18n.js: every string the scroll page
 * shows, in English, Hindi and Marathi.
 *
 *   node scrollcraft/build-i18n.mjs
 *
 * Strings marked A("key") are taken from the app's own dictionaries in
 * lib/i18n/{en,hi,mr}.ts, so the page says exactly what the rest of the app
 * says (consent, safety, status labels, the emergency text). Everything else is
 * written here as [english, hindi, marathi].
 *
 * DRAFT. The app's hi.ts and mr.ts are drafts awaiting native-speaker review
 * (and DPDP review for consent text). The page-specific Hindi and Marathi
 * below are drafts too, and the page shows the app's own draft notice whenever
 * a non-English language is on. Medical explanations and the doctor questions
 * stay in English, as the app does, until a clinician has reviewed translations.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadDict(code) {
  const text = fs.readFileSync(path.join(root, "lib", "i18n", code + ".ts"), "utf8");
  const out = {};
  const re = /^\s*'([^']+)'\s*:\s*'((?:\\.|[^'\\])*)'\s*,?\s*$/gm;
  let m;
  while ((m = re.exec(text))) out[m[1]] = m[2].replace(/\\'/g, "'").replace(/\\\\/g, "\\");
  return out;
}
const APP = { en: loadDict("en"), hi: loadDict("hi"), mr: loadDict("mr") };
const A = (key, opts = {}) => ({ app: key, ...opts });

/* ---- the table ---------------------------------------------------------- */
const T = {
  title: ["HealthClarify · lab reports in plain words", "HealthClarify · लैब रिपोर्ट सरल शब्दों में", "HealthClarify · लॅब अहवाल सोप्या शब्दांत"],
  skip: ["Skip to the page", "पेज पर जाएँ", "पानावर जा"],
  draft: A("footer.draftTranslation"),
  "eng.only": A("card.englishOnly"),

  /* chrome */
  "rail.aria": ["Report steps", "रिपोर्ट के चरण", "अहवालाचे टप्पे"],
  "brand.aria": ["HealthClarify, back to upload", "HealthClarify, अपलोड पर वापस", "HealthClarify, अपलोडकडे परत"],
  "file.none": ["No report yet", "अभी कोई रिपोर्ट नहीं", "अजून अहवाल नाही"],
  "file.none2": ["Nothing is loaded", "कुछ भी लोड नहीं है", "काहीही लोड केलेले नाही"],
  "file.sample": A("home.art.sample"),
  "file.sampleMeta": ["Fictional, 3 pages", "काल्पनिक, 3 पृष्ठ", "काल्पनिक, 3 पाने"],
  "file.own": ["Checked here, not uploaded", "यहीं जाँची गई, अपलोड नहीं की गई", "इथेच तपासली, अपलोड केलेली नाही"],
  "steps.aria": A("step.progress"),
  "step.upload": A("step.1"),
  "step.consent": ["Consent", "सहमति", "संमती"],
  "step.read": ["Reading", "पढ़ना", "वाचन"],
  "step.plain": ["Plain words", "सरल शब्दों में", "सोप्या शब्दांत"],
  "step.check": ["Check and ask", "जाँचें और पूछें", "तपासा आणि विचारा"],
  "step.start": ["Start", "शुरू करें", "सुरू करा"],
  "rail.edu": ["Educational only. Not a diagnosis.", "केवल शैक्षिक। निदान नहीं।", "फक्त शैक्षणिक. निदान नाही."],
  "rail.dash": ["See the demo dashboard", "डेमो डैशबोर्ड देखें", "डेमो डॅशबोर्ड पाहा"],
  "cta.open": ["Open the analyzer", "विश्लेषक खोलें", "विश्लेषक उघडा"],
  "strip.sample": ["Sample mode. Every value on this page is fictional.", "नमूना मोड। इस पेज का हर मान काल्पनिक है।", "नमुना मोड. या पानावरील प्रत्येक मूल्य काल्पनिक आहे."],
  "strip.link": A("strip.link"),
  "lang.switch": A("home.langs"),
  "lang.legend": A("nav.language"),

  /* 1 upload */
  "hero.h1": ["Upload a report.<br>Read it in plain words.", "रिपोर्ट अपलोड करें।<br>सरल शब्दों में पढ़ें।", "अहवाल अपलोड करा.<br>सोप्या शब्दांत वाचा."],
  "hero.lede": ["See where each number sits on its printed range, with a question ready for your doctor.", "देखें कि हर संख्या अपनी छपी सीमा में कहाँ आती है, और डॉक्टर के लिए एक सवाल तैयार रखें।", "प्रत्येक संख्या तिच्या छापलेल्या मर्यादेत कुठे बसते ते पाहा, आणि डॉक्टरांसाठी एक प्रश्न तयार ठेवा."],
  "drop.title": ["Drop a PDF or photo here, or choose a file", "यहाँ PDF या फ़ोटो डालें, या फ़ाइल चुनें", "इथे PDF किंवा फोटो टाका, किंवा फाइल निवडा"],
  "drop.hint": ["JPEG, PNG, WebP or PDF. Up to 10 MB.", "JPEG, PNG, WebP या PDF। 10 MB तक।", "JPEG, PNG, WebP किंवा PDF. 10 MB पर्यंत."],
  "drop.badType": ["That file is not a JPEG, PNG, WebP or PDF.", "यह फ़ाइल JPEG, PNG, WebP या PDF नहीं है।", "ही फाइल JPEG, PNG, WebP किंवा PDF नाही."],
  "drop.big": ["That file is over 10 MB.", "यह फ़ाइल 10 MB से बड़ी है।", "ही फाइल 10 MB पेक्षा मोठी आहे."],
  "drop.ok": ["{name} ({size}) passes the check. This page does not upload it.", "{name} ({size}) जाँच में ठीक है। यह पेज इसे अपलोड नहीं करता।", "{name} ({size}) तपासणीत ठीक आहे. हे पान ती अपलोड करत नाही."],
  "hero.sample": ["Use the sample report", "नमूना रिपोर्ट इस्तेमाल करें", "नमुना अहवाल वापरा"],
  "hero.own": ["Upload your own in the analyzer", "अपनी रिपोर्ट विश्लेषक में अपलोड करें", "तुमचा अहवाल विश्लेषकात अपलोड करा"],

  /* 2 consent */
  "consent.h2": ["Two choices before anything leaves your browser.", "आपके ब्राउज़र से कुछ भी बाहर जाने से पहले दो विकल्प।", "तुमच्या ब्राउझरमधून काहीही बाहेर जाण्यापूर्वी दोन पर्याय."],
  "consent.lede": ["Both start off. You can stop at any step.", "दोनों बंद रहते हैं। आप किसी भी चरण पर रुक सकते हैं।", "दोन्ही बंद असतात. तुम्ही कोणत्याही टप्प्यावर थांबू शकता."],
  "consent.legend": ["Consent choices", "सहमति के विकल्प", "संमतीचे पर्याय"],
  "sw.ocr.t": A("up.online"),
  "sw.ocr.d": A("up.who1", { strip: true }),
  "sw.ai.t": ["Pick out results with AI", "AI से परिणाम चुनें", "AI द्वारे निकाल निवडा"],
  "sw.ai.d": A("up.who2", { strip: true }),
  "leaves.h": ["Leaves this device right now", "अभी इस डिवाइस से बाहर क्या जाता है", "सध्या या डिव्हाइसमधून बाहेर काय जाते"],
  "leaves.none": ["Nothing. Your file and its text stay in this browser.", "कुछ नहीं। आपकी फ़ाइल और उसका पाठ इसी ब्राउज़र में रहते हैं।", "काहीही नाही. तुमची फाइल आणि तिचा मजकूर याच ब्राउझरमध्ये राहतो."],
  "leaves.file": A("up.who1", { strip: true }),
  "leaves.local": A("load.deviceOne"),
  "leaves.lines": A("up.who2", { strip: true }),
  "leaves.saved": A("home.trust2.s"),
  "leaves.fine": ["This page sends nothing. The analyzer asks the same two questions first.", "यह पेज कुछ नहीं भेजता। विश्लेषक पहले यही दो सवाल पूछता है।", "हे पान काहीही पाठवत नाही. विश्लेषक आधी हेच दोन प्रश्न विचारतो."],
  "read.btn": ["Read the sample report", "नमूना रिपोर्ट पढ़ें", "नमुना अहवाल वाचा"],
  "read.hint.sample": ["Reads the fictional sample, on this device.", "काल्पनिक नमूने को इसी डिवाइस पर पढ़ता है।", "काल्पनिक नमुना याच डिव्हाइसवर वाचतो."],
  "read.hint.own": ["This page can only read the fictional sample. To read your own file, open the analyzer.", "यह पेज केवल काल्पनिक नमूना पढ़ सकता है। अपनी फ़ाइल पढ़ने के लिए विश्लेषक खोलें।", "हे पान फक्त काल्पनिक नमुना वाचू शकते. तुमची स्वतःची फाइल वाचण्यासाठी विश्लेषक उघडा."],

  /* 3 reading */
  "read.h2": ["Finding the numbers.", "संख्याएँ ढूँढना।", "संख्या शोधणे."],
  "read.p": ["A plain filter, not a doctor. It keeps a line when it holds a test name, or a number with a unit.", "यह एक सीधा फ़िल्टर है, डॉक्टर नहीं। यह उस पंक्ति को रखता है जिसमें जाँच का नाम हो, या इकाई के साथ कोई संख्या।", "हा एक साधा फिल्टर आहे, डॉक्टर नाही. ज्या ओळीत चाचणीचे नाव किंवा एककासह संख्या असते ती ओळ तो ठेवतो."],
  "tally.read": ["Lines read", "पढ़ी गई पंक्तियाँ", "वाचलेल्या ओळी"],
  "tally.kept": ["Kept", "रखी गईं", "ठेवलेल्या"],
  "tally.interp": ["Interpreted", "व्याख्या की गईं", "अर्थ लावलेल्या"],
  "page.aria": ["Sample report, page {n} of 3", "नमूना रिपोर्ट, पृष्ठ {n}/3", "नमुना अहवाल, पान {n}/3"],
  "read.end": ["{n} lines kept. None interpreted.", "{n} पंक्तियाँ रखी गईं। किसी की व्याख्या नहीं की गई।", "{n} ओळी ठेवल्या. कोणत्याही ओळीचा अर्थ लावलेला नाही."],

  /* 4 plain words */
  "status.out": A("grp.outside"),
  "status.in": A("grp.within"),
  "plain.placed": ["Placed on the page", "पेज पर रखे गए", "पानावर मांडले"],
  "plain.results": ["{n} results", "{n} परिणाम", "{n} निकाल"],
  "plain.split": ["{o} sit outside the printed range. {w} sit within.", "{o} छपी सीमा से बाहर हैं। {w} भीतर हैं।", "{o} छापलेल्या मर्यादेबाहेर आहेत. {w} मर्यादेत आहेत."],
  "plain.ranges": ["Ranges come from the report, not from us.", "सीमाएँ रिपोर्ट से आती हैं, हमसे नहीं।", "मर्यादा अहवालातून येतात, आमच्याकडून नाही."],
  "plain.notAlert": ["Outside the printed range is not an alert. Bring it to your clinician.", "छपी सीमा से बाहर होना चेतावनी नहीं है। इसे अपने चिकित्सक के पास ले जाएँ।", "छापलेल्या मर्यादेबाहेर असणे ही धोक्याची सूचना नाही. ते तुमच्या डॉक्टरांकडे न्या."],
  "plain.sample": ["Sample report. Fictional values.", "नमूना रिपोर्ट। काल्पनिक मान।", "नमुना अहवाल. काल्पनिक मूल्ये."],
  "plain.printed": ["Printed range", "छपी सीमा", "छापलेली मर्यादा"],
  "plain.onReport": ["On this report", "इस रिपोर्ट में", "या अहवालात"],
  "plain.sum1": ["{n} results placed.", "{n} परिणाम रखे गए।", "{n} निकाल मांडले."],
  "plain.sum2": ["{o} outside the printed range, {w} within. Outside the printed range is not an alert. It is something to ask about.", "{o} छपी सीमा से बाहर, {w} भीतर। छपी सीमा से बाहर होना चेतावनी नहीं है। यह पूछने की बात है।", "{o} छापलेल्या मर्यादेबाहेर, {w} मर्यादेत. छापलेल्या मर्यादेबाहेर असणे ही धोक्याची सूचना नाही. हा विचारण्याचा मुद्दा आहे."],
  "panel.CBC": A("panel.CBC"),
  "panel.Lipid Profile": A("panel.Lipid Profile"),
  "panel.Thyroid": A("panel.Thyroid"),
  "panel.Diabetes": A("panel.Diabetes"),
  "panel.Vitamins": A("panel.Vitamins"),
  "panel.Liver": A("panel.Liver"),
  "panel.Kidney": A("panel.Kidney"),

  /* 5 check and ask */
  "check.h2": ["Check one against your original. Then take the questions.", "एक को अपनी मूल रिपोर्ट से मिलाएँ। फिर सवाल साथ ले जाएँ।", "एक तुमच्या मूळ अहवालाशी पडताळा. मग प्रश्न सोबत घ्या."],
  "check.lede": ["Change the value to what your own paper says. The ruler and the list below follow it.", "मान को अपने कागज़ पर लिखे अनुसार बदलें। पैमाना और नीचे की सूची उसके साथ बदलते हैं।", "मूल्य तुमच्या कागदावर जसे आहे तसे बदला. पट्टी आणि खालील यादी त्याप्रमाणे बदलतात."],
  "check.cap": ["As printed on the sample report", "नमूना रिपोर्ट में जैसा छपा है", "नमुना अहवालात जसे छापले आहे"],
  "check.test": ["Test", "जाँच", "चाचणी"],
  "check.value": ["Value on your report", "आपकी रिपोर्ट में मान", "तुमच्या अहवालातील मूल्य"],
  "check.verdict": ["{v} {u} is {statusl} ({ref}).", "{v} {u}: {status} ({ref})।", "{v} {u}: {status} ({ref})."],
  "check.printsAs": ["The report prints {v}.", "रिपोर्ट में {v} छपा है।", "अहवालात {v} छापलेले आहे."],
  "check.enter": ["Enter the number printed on your report.", "अपनी रिपोर्ट में छपी संख्या डालें।", "तुमच्या अहवालात छापलेली संख्या टाका."],
  "ask.h": ["Questions for your appointment", "आपकी अपॉइंटमेंट के लिए सवाल", "तुमच्या भेटीसाठी प्रश्न"],
  "ask.lead.n": ["{n} of {total} results sit outside the printed range. These are questions, not conclusions.", "{total} में से {n} परिणाम छपी सीमा से बाहर हैं। ये सवाल हैं, निष्कर्ष नहीं।", "{total} पैकी {n} निकाल छापलेल्या मर्यादेबाहेर आहेत. हे प्रश्न आहेत, निष्कर्ष नाहीत."],
  "ask.lead.0": ["Nothing sits outside the printed range right now. You can still bring any question.", "अभी कुछ भी छपी सीमा से बाहर नहीं है। फिर भी आप कोई भी सवाल ला सकते हैं।", "सध्या काहीही छापलेल्या मर्यादेबाहेर नाही. तरीही तुम्ही कोणताही प्रश्न आणू शकता."],
  "ask.copy": ["Copy the list", "सूची कॉपी करें", "यादी कॉपी करा"],
  "ask.none": ["Nothing selected to copy.", "कॉपी करने के लिए कुछ चुना नहीं गया।", "कॉपी करण्यासाठी काहीही निवडलेले नाही."],
  "ask.copied1": ["Copied {n} question.", "{n} सवाल कॉपी किया गया।", "{n} प्रश्न कॉपी केला."],
  "ask.copiedN": ["Copied {n} questions.", "{n} सवाल कॉपी किए गए।", "{n} प्रश्न कॉपी केले."],
  "ask.fail": ["Could not copy. Select the text and copy it yourself.", "कॉपी नहीं हो सका। पाठ चुनकर खुद कॉपी करें।", "कॉपी करता आले नाही. मजकूर निवडून स्वतः कॉपी करा."],
  "ask.head": ["Questions for my appointment (from a sample report, not medical advice)", "मेरी अपॉइंटमेंट के सवाल (नमूना रिपोर्ट से, चिकित्सकीय सलाह नहीं)", "माझ्या भेटीसाठी प्रश्न (नमुना अहवालातून, वैद्यकीय सल्ला नाही)"],

  /* 6 start */
  "start.h2": ["Ready for yours?", "अपनी रिपोर्ट के लिए तैयार?", "तुमच्या अहवालासाठी तयार?"],
  "start.lede": ["Choose a language, then open the analyzer. It asks before anything is sent.", "भाषा चुनें, फिर विश्लेषक खोलें। कुछ भी भेजने से पहले वह पूछता है।", "भाषा निवडा, मग विश्लेषक उघडा. काहीही पाठवण्यापूर्वी तो विचारतो."],
  ack: ["I understand HealthClarify explains reports. It does not diagnose or advise treatment.", "मुझे पता है कि HealthClarify रिपोर्ट समझाता है। यह निदान नहीं करता, न इलाज की सलाह देता है।", "मला माहीत आहे की HealthClarify अहवाल समजावून सांगते. ते निदान करत नाही आणि उपचारांचा सल्ला देत नाही."],
  "start.hintOff": ["Tick the box to continue.", "आगे बढ़ने के लिए बॉक्स पर निशान लगाएँ।", "पुढे जाण्यासाठी चौकटीत खूण करा."],
  "start.hintOn": ["The analyzer asks before sending anything.", "विश्लेषक कुछ भी भेजने से पहले पूछता है।", "विश्लेषक काहीही पाठवण्यापूर्वी विचारतो."],
  "emerg.t": A("side.urgent.t"),
  "emerg.p": A("side.urgent.p"),
  "foot.edu": ["HealthClarify · educational only", "HealthClarify · केवल शैक्षिक", "HealthClarify · फक्त शैक्षणिक"],
  "foot.aria": ["Legal", "कानूनी", "कायदेशीर"],
  "nav.safety": A("nav.safety"),
  "nav.privacy": A("nav.privacy"),
  "nav.terms": A("nav.terms"),
  "nav.accessibility": A("nav.accessibility")
};

/* ---- resolve ------------------------------------------------------------ */
const out = { en: {}, hi: {}, mr: {} };
const missing = [];
for (const [key, v] of Object.entries(T)) {
  for (const [i, code] of ["en", "hi", "mr"].entries()) {
    let s;
    if (Array.isArray(v)) s = v[i];
    else {
      s = APP[code][v.app];
      if (s === undefined) { missing.push(`${code}:${v.app}`); continue; }
      if (v.strip) s = s.replace(/\*/g, "");
    }
    out[code][key] = s;
  }
}
if (missing.length) { console.error("missing app keys: " + missing.join(", ")); process.exit(1); }

const dest = path.join(root, "scrollcraft", "builds", "healthclarify", "i18n.js");
fs.writeFileSync(dest,
  "/* Generated by scrollcraft/build-i18n.mjs. Do not edit by hand. Hindi and Marathi are DRAFTS. */\n" +
  "window.HC_I18N = " + JSON.stringify(out, null, 1) + ";\n");
const n = Object.keys(T).length, reused = Object.values(T).filter((v) => !Array.isArray(v)).length;
console.log(`wrote ${path.relative(root, dest)}: ${n} strings x 3 languages (${reused} reused from the app's own dictionaries)`);
