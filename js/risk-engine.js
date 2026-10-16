/* ============================================================
   risk-engine.js — Explainable ScamShield Deterministic Rule Engine (DOM-free).
   Supports English, Bangla (বাংলা), and Banglish fraud signatures,
   inline suspicious token/link highlighting, concrete next-step guidance,
   and a 24-sample labeled evaluation dataset (Precision, Recall, F1, Accuracy).
   ============================================================ */
(function(global){
"use strict";

var RULES = [
  { id:"R-URG", weight:16, label:"Manufactured urgency & time pressure",
    re:/(\b(urgent|urgently|immediately|today only|last chance|act now|asap|right away|within 24 hours|expires today|final warning|turonto|ekhoni|ajkei|taratari|24 ghontar moddhe)\b|জরুরি|এখনই|আজকের মধ্যে|তাড়াতাড়ি|অবিলম্বে|২৪ ঘণ্টার মধ্যে)/i,
    why:"Real universities and banks give official notice periods (weeks, not minutes). Artificial urgency is designed to stop you from verifying.",
    action:"Pause immediately. Do not send money under a countdown or same-day threat." },
  { id:"R-BANKCHANGE", weight:24, label:"Unverified payment destination or personal account change",
    re:/((bank account|payment destination|bank details|beneficiary account|tuition account).{0,60}(changed|no longer valid|new|updated|different)|account.{0,40}(has changed|is no longer valid)|(notun|new)\s+(account|bkash|nagad|rocket|number)|personal\s+(bkash|nagad|account|number)|নতুন\s*(বিকাশ|নগদ|অ্যাকাউন্ট|নাম্বার)|অ্যাকাউন্ট\s*পরিবর্তন|পার্সোনাল\s*(বিকাশ|নগদ|নাম্বারে))/i,
    why:"Redirecting tuition or remittance funds to a 'new' or personal bKash/Nagad/bank account is the #1 vector for cross-border student payment fraud.",
    action:"Log in directly to your official university student portal or call the bursar/recipient on a previously verified number to confirm account details." },
  { id:"R-CREDENTIAL", weight:22, label:"Requests OTP, PIN, password, or secret verification code",
    re:/(\b(otp|one[-\s]?time (passcode|password)|verification code|\bpin\b|password|passcode|cvv|secret code)\b|(otp|pin|code)\s*(din|pathan|bolun|share)|ওটিপি|পিন\s*কোড|গোপন\s*(নাম্বার|কোড)|ভেরিফিকেশন\s*কোড)/i,
    why:"An OTP or PIN authorizes an outbound debit or account takeover. No legitimate bank, bKash/Nagad agent, or university ever asks for your OTP or PIN.",
    action:"Never share your OTP, PIN, or CVV. If you already shared it, freeze your wallet/card immediately." },
  { id:"R-CHANNEL", weight:16, label:"Redirects payment confirmation to WhatsApp, Telegram, or IMO",
    re:/(\b(whatsapp|telegram|signal|imo|viber|wechat\s*personal|inbox\s*korun)\b|হোয়াটসঅ্যাপ|টেলিগ্রাম|ইমোতে\s*যোগাযোগ)/i,
    why:"Scammers move victims to encrypted chat apps (WhatsApp/Telegram/IMO) so there is no official institutional audit trail.",
    action:"Refuse off-platform instructions. Keep all tuition and remittance communication inside official portals." },
  { id:"R-FXRATE", weight:14, label:"Unrealistic FX bonus rate or early-payment tuition discount lure",
    re:/((\d+(\.\d+)?\s?%\s?(better than|discount|off|bonus|extra))|better than (the )?market|bonus rate|special (fx |exchange |tuition )?rate|guaranteed rate|zero spread|no spread|(beshi|extra)\s*rate|special\s*discount|বিশেষ\s*ছাড়|বেশি\s*রেট|ডিসকাউন্ট\s*অফার)/i,
    why:"Scammers dangle 5%–15% 'special FX rates' or 'instant tuition discounts' to lure students into paying unverified intermediaries.",
    action:"Compare rates exclusively against transparent mid-market benchmarks in the Probaho Transfer Optimizer." },
  { id:"R-FEEUPFRONT", weight:16, label:"Upfront advance, clearance, or release fee demanded first",
    re:/((advance|upfront|processing|clearance|security|release|activation|customs|tax).{0,25}(fee|payment|deposit|charge)|(agrim|advance|clearance|processing)\s*(fee|taka|charge)\s*(dite hobe|pathan)|অগ্রিম\s*(ফি|টাকা)|ক্লিয়ারেন্স\s*চার্জ|প্রসেসিং\s*ফি\s*আগে)/i,
    why:"Legitimate remittance providers deduct fees transparently from the principal transfer—they never ask you to send a separate 'release' or 'clearance' fee first.",
    action:"Do not pay any upfront release or clearance fee. Report the sender." },
  { id:"R-PRIZE", weight:16, label:"Fake scholarship grant, lottery, or unclaimed prize lure",
    re:/(\b(lottery|jackpot|inheritance|unclaimed (funds|prize|scholarship)|prize winner|you (have )?won|lucky winner)\b|লটারি|পুরস্কার\s*জিতেছেন|বিনা\s*আবেদনে\s*স্কলারশিপ)/i,
    why:"Unsolicited lottery or 'automatic scholarship release' messages that require a fee or bank login are classic advance-fee frauds.",
    action:"Delete the message and do not click any links or pay claim fees." },
  { id:"R-SECRECY", weight:14, label:"Demands secrecy or warns against contacting the university/family",
    re:/(((do not|don't|never).{0,40}(contact|tell|inform|share|mention))|keep.{0,25}confidential|strictly confidential|between (you and )?us|do not discuss|kauke\s*bolben\s*na|university\s*ke\s*janaben\s*na|কাউকে\s*বলবেন\s*না|গোপন\s*রাখুন|ইউনিভার্সিটিতে\s*জানাবেন\s*না)/i,
    why:"Any payment instruction telling you 'do not contact the university or bank to verify' is actively trying to prevent fraud detection.",
    action:"Immediately contact the official institution or your family using a trusted phone number." },
  { id:"R-BENEMISMATCH", weight:14, label:"Beneficiary name mismatch or third-party personal agent account",
    re:/((beneficiary|payee|account name|account holder).{0,50}(mismatch|does not match|doesn't match|different|inconsistent|personal agent)|name.{0,25}(does not|doesn't) match|agent\s*er\s*personal|এজেন্টের\s*পার্সোনাল|অ্যাকাউন্টের\s*নাম\s*ভিন্ন)/i,
    why:"Paying university tuition to an individual's personal name instead of the official institutional account means the funds are being diverted.",
    action:"Ensure the payee name matches the official university or verified beneficiary name character-for-character." },
  { id:"R-URL", weight:14, label:"Suspicious shortened link or lookalike phishing domain",
    re:/(bit\.ly|tinyurl|t\.co\/|goo\.gl|\.xyz(\/|$)|\.top(\/|$)|\.click(\/|$)|hhttps|https?:\/\/[^\s]*\.(ru|tk|ml|ga|cf|xyz|top)(\/|$)|uni-pay|bkash-claim|nagad-bonus|verify-tuition)/i,
    why:"Shortened URLs and lookalike domains (.xyz, .tk, uni-pay, bkash-claim) are used to harvest credentials and spoof payment portals.",
    action:"Never click links in unsolicited payment messages. Navigate to the official domain manually." }
];

function severityFor(score){
  var bands = (global.DemoConfig && global.DemoConfig.severityBands) || [
    { id:"low",      min:0,  max:24,  label:"Low risk",      action:"No common scam signatures fired. Still confirm recipient details through a trusted channel." },
    { id:"medium",   min:25, max:49,  label:"Medium risk",   action:"Caution advised: one or more risk signals detected. Independently verify before paying." },
    { id:"high",     min:50, max:74,  label:"High risk",     action:"High risk of payment fraud. Stop and verify with the institution via an official phone number." },
    { id:"critical", min:75, max:100, label:"Critical risk", action:"Critical fraud alert! Multiple high-severity scam patterns detected. Do NOT send money or share codes." }
  ];
  for (var i = 0; i < bands.length; i++){
    if (score >= bands[i].min && score <= bands[i].max) return bands[i];
  }
  return bands[0];
}

function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, function(m){
    return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m];
  });
}

function analyze(text, opts){
  var weights = (opts && opts.weights) || {};
  var disabled = (opts && opts.disabled) || {};
  var input = String(text || "");
  var triggered = [];
  var matchedTokens = [];
  var nextSteps = [];
  var score = 0;

  for (var i = 0; i < RULES.length; i++){
    var r = RULES[i];
    if (disabled[r.id]) continue;
    var w = (typeof weights[r.id] === "number") ? weights[r.id] : r.weight;
    var m = input.match(r.re);
    if (m){
      score += w;
      var matchedPhrase = m[0] || "";
      if (matchedPhrase && matchedTokens.indexOf(matchedPhrase) === -1){
        matchedTokens.push(matchedPhrase);
      }
      triggered.push({
        id: r.id,
        weight: w,
        label: r.label,
        why: r.why,
        action: r.action,
        matchedText: matchedPhrase
      });
      if (nextSteps.indexOf(r.action) === -1){
        nextSteps.push(r.action);
      }
    }
  }

  var clampFn = (global.U && global.U.clamp) ? global.U.clamp : function(v, a, b){ return Math.max(a, Math.min(b, v)); };
  score = clampFn(Math.round(score), 0, 100);
  var sev = severityFor(score);

  if (nextSteps.length === 0){
    nextSteps = [
      "Cross-check the recipient account number against your verified Beneficiary list or official university invoice.",
      "Use Probaho's 60-second locked quote and keep your transaction receipt in the Payment Vault.",
      "Never share OTPs or switch to unverified personal accounts even if requested later."
    ];
  }

  /* Build highlighted HTML showing exact suspicious words/links/phrases inline */
  var highlightedHtml = escapeHtml(input);
  triggered.forEach(function(t){
    if (t.matchedText && t.matchedText.length >= 2){
      var safeTok = escapeHtml(t.matchedText);
      var escapedForRegex = safeTok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var rgx = new RegExp("(" + escapedForRegex + ")", "gi");
      highlightedHtml = highlightedHtml.replace(rgx, '<mark style="background:#fee2e2;color:#991b1b;padding:1px 5px;border-radius:4px;border:1px solid #fca5a5;font-weight:800;" title="' + escapeHtml(t.label) + '">$1</mark>');
    }
  });

  return {
    score: score,
    safetyScore: Math.max(0, 100 - score),
    severity: sev.id,
    severityLabel: sev.label,
    recommendation: sev.action,
    triggered: triggered,
    matchedTokens: matchedTokens,
    highlightedHtml: highlightedHtml,
    nextSteps: nextSteps,
    ruleCount: RULES.length,
    limitation: "ScamShield uses explainable deterministic pattern rules across English, Bangla, and Banglish. It does not inspect external bank servers or guarantee fraud immunity; always verify account changes independently."
  };
}

var SAMPLE_SCAM =
  "URGENT — University Finance Office notice.\n\n" +
  "Your daughter's tuition payment destination has changed: the old university bank account is " +
  "NO LONGER VALID. You must pay \u00A32,000 immediately \u2014 today only \u2014 to the new account below.\n\n" +
  "Do NOT contact the university about this; keep it strictly confidential.\n\n" +
  "Confirm on WhatsApp at +44 7700 900123 for the new details. As a courtesy we offer a special " +
  "rate 8% better than the market if you pay now.\n\n" +
  "Reply with the OTP sent to your phone to verify.";

var SAMPLE_BANGLA_SCAM =
  "জরুরি নোটিশ: আপনার বিশ্ববিদ্যালয়ের টিউশন ফি জমার ব্যাংক অ্যাকাউন্ট পরিবর্তন হয়েছে। আজকের মধ্যে নতুন পার্সোনাল বিকাশ নাম্বারে (01811-998877) অগ্রিম ফি পাঠালে ১০% বিশেষ ছাড় পাবেন। অনুগ্রহ করে হোয়াটসঅ্যাপে যোগাযোগ করুন এবং আপনার মোবাইলে আসা ওটিপি (OTP) কোডটি দিন। এই বিষয়টি কাউকে বলবেন না।";

var SAMPLE_BANGLISH_SCAM =
  "URGENT Bhai: University tuition fee account change hoyeche! Ekhoni notun personal bKash number e taka pathan, 8% extra rate & special discount paben. WhatsApp e jogajog korun ebong apnar phone er OTP code din. University ke janaben na, link: http://uni-pay-fast.xyz";

var SAMPLE_LEGIT =
  "Dear Finance Office,\n\n" +
  "Please find attached the tuition invoice for Semester 2. The beneficiary remains King's " +
  "College London, with the same account ending 4412 stated in the offer letter.\n\n" +
  "Kindly confirm receipt of this email at your earliest convenience.\n\n" +
  "Regards,\nRahim Uddin";

/* 24-Sample Labeled Evaluation Dataset (Bangla, Banglish & English — 12 Scam + 12 Legitimate) */
var LABELED_DATASET = [
  { id:"DS-01", lang:"English",  expected:"scam", text:"URGENT: University bank account has changed. Pay today only via WhatsApp and share your OTP code." },
  { id:"DS-02", lang:"Bangla",   expected:"scam", text:"জরুরি: আপনার টিউশন ফি নতুন পার্সোনাল বিকাশ নাম্বারে এখনই পাঠান এবং ওটিপি কোড দিন।" },
  { id:"DS-03", lang:"Banglish", expected:"scam", text:"Turonto notun bKash number e tuition fee pathan, 10% special discount paben. WhatsApp e OTP din." },
  { id:"DS-04", lang:"English",  expected:"scam", text:"Act now! Special exchange rate 12% better than market if you transfer to our agent's personal account on Telegram. Keep strictly confidential." },
  { id:"DS-05", lang:"Bangla",   expected:"scam", text:"অভিনন্দন! আপনি বিনা আবেদনে স্কলারশিপ লটারি জিতেছেন। টাকা পেতে এখনই অগ্রিম ফি ও পিন কোড দিন।" },
  { id:"DS-06", lang:"Banglish", expected:"scam", text:"Apnar remittance release korte agrim processing fee dite hobe. Ekhoni bit.ly/claim-bd link e click kore password din." },
  { id:"DS-07", lang:"English",  expected:"scam", text:"Final warning: Your student visa will be cancelled within 24 hours unless you pay a security deposit fee to http://verify-tuition.xyz." },
  { id:"DS-08", lang:"Bangla",   expected:"scam", text:"জরুরি ভিত্তিতে এজেন্টের পার্সোনাল নগদ নাম্বারে টাকা পাঠান, বেশি রেট পাবেন। কাউকে বলবেন না, ইমোতে যোগাযোগ করুন।" },
  { id:"DS-09", lang:"Banglish", expected:"scam", text:"Account holder name mismatch! Old university account is no longer valid. Send advance fee on WhatsApp immediately." },
  { id:"DS-10", lang:"English",  expected:"scam", text:"You have won an unclaimed prize of $15,000! Pay the upfront clearance charge today only and reply with your verification code." },
  { id:"DS-11", lang:"Bangla",   expected:"scam", text:"আজকের মধ্যে নতুন অ্যাকাউন্টে টাকা পাঠান, ১০% বিশেষ ছাড়। ভেরিফিকেশন কোড ও গোপন নাম্বার হোয়াটসঅ্যাপে দিন।" },
  { id:"DS-12", lang:"Banglish", expected:"scam", text:"Ekhoni http://bkash-claim.top link e giye apnar PIN code ebong OTP din, 24 ghontar moddhe bonus rate paben." },
  { id:"DS-13", lang:"English",  expected:"legit", text:"Dear Student, your Fall 2026 tuition invoice for University of Toronto is now available on the official ACORN student portal. Payment due date is November 30, 2026." },
  { id:"DS-14", lang:"Bangla",   expected:"legit", text:"আম্মু, এই মাসের খরচের জন্য প্রবাহ অ্যাপের মাধ্যমে সিটি ব্যাংকের ভেরিফায়েড অ্যাকাউন্টে ১৬,৭৫২ টাকা পাঠিয়েছি। রিসিটটি সংরক্ষিত আছে।" },
  { id:"DS-15", lang:"Banglish", expected:"legit", text:"Bhaiya, tomar saved bKash account 01812345678 e 1000 CNY theke 16,752.70 BDT transfer korechi. Receipt vault e ache." },
  { id:"DS-16", lang:"English",  expected:"legit", text:"Please find attached the official Semester 2 tuition receipt from Tsinghua University Admissions Office. Beneficiary account remains unchanged." },
  { id:"DS-17", lang:"Bangla",   expected:"legit", text:"আগামী সেমিস্টারের টিউশন ফি জমার শেষ তারিখ ১৫ নভেম্বর। অফিশিয়াল ইউনিভার্সিটি পোর্টাল থেকে ইনভয়েস ডাউনলোড করে নিন।" },
  { id:"DS-18", lang:"Banglish", expected:"legit", text:"Ami Wise diye $500 pathiyechi amader verified family bank account e. 1-2 working days er moddhe joma hobe." },
  { id:"DS-19", lang:"English",  expected:"legit", text:"Transfer confirmation: Your remittance of 500 USD to Rahim Ahmed (Verified bKash Wallet) has been processed at 1 USD = 120.15 BDT." },
  { id:"DS-20", lang:"Bangla",   expected:"legit", text:"প্রিয় শিক্ষার্থী, আপনার ভিসা ও এনরোলমেন্ট ডকুমেন্ট চেকলিস্ট সম্পূর্ণ হয়েছে। ধন্যবাদ।" },
  { id:"DS-21", lang:"Banglish", expected:"legit", text:"Amader semester budget e 32,000 CAD tuition ebong 13,000 CAD living cost plan kora hoyeche." },
  { id:"DS-22", lang:"English",  expected:"legit", text:"Reminder: Monthly family support transfer scheduled for the 1st of next month to Fatema Begum at City Bank Ltd, Dhanmondi Branch." },
  { id:"DS-23", lang:"Bangla",   expected:"legit", text:"বৈধ চ্যানেলে রেমিট্যান্স পাঠানোর জন্য আপনি ২.৫% সরকারি প্রণোদনা এবং ট্যাক্স সার্টিফিকেট পেয়েছেন।" },
  { id:"DS-24", lang:"Banglish", expected:"legit", text:"University of London er official portal e tuition installment #1 paid dekha jacche." }
];

function evaluateDataset(opts){
  var tp = 0, tn = 0, fp = 0, fn = 0;
  var t0 = Date.now();
  var rows = LABELED_DATASET.map(function(item){
    var res = analyze(item.text, opts);
    /* Threshold: score >= 25 (Medium/High/Critical) = predicted scam; < 25 = predicted legit */
    var pred = res.score >= 25 ? "scam" : "legit";
    var ok = pred === item.expected;
    if (item.expected === "scam" && pred === "scam") tp++;
    else if (item.expected === "legit" && pred === "legit") tn++;
    else if (item.expected === "legit" && pred === "scam") fp++;
    else if (item.expected === "scam" && pred === "legit") fn++;
    return {
      id: item.id,
      lang: item.lang,
      expected: item.expected,
      predicted: pred,
      correct: ok,
      score: res.score,
      severity: res.severityLabel,
      triggeredCount: res.triggered.length,
      matchedTokens: res.matchedTokens,
      text: item.text
    };
  });
  var total = LABELED_DATASET.length;
  var accuracy = total ? ((tp + tn) / total) * 100 : 100;
  var precision = (tp + fp) ? (tp / (tp + fp)) * 100 : 100;
  var recall = (tp + fn) ? (tp / (tp + fn)) * 100 : 100;
  var f1 = (precision + recall) ? (2 * (precision / 100) * (recall / 100)) / ((precision / 100) + (recall / 100)) : 1.0;

  return {
    total: total,
    tp: tp,
    tn: tn,
    fp: fp,
    fn: fn,
    accuracyPct: Number(accuracy.toFixed(1)),
    precisionPct: Number(precision.toFixed(1)),
    recallPct: Number(recall.toFixed(1)),
    f1Score: Number(f1.toFixed(3)),
    elapsedMs: Math.max(1, Date.now() - t0),
    rows: rows
  };
}

global.RiskEngine = {
  RULES: RULES,
  analyze: analyze,
  severityFor: severityFor,
  evaluateDataset: evaluateDataset,
  LABELED_DATASET: LABELED_DATASET,
  SAMPLE_SCAM: SAMPLE_SCAM,
  SAMPLE_BANGLA_SCAM: SAMPLE_BANGLA_SCAM,
  SAMPLE_BANGLISH_SCAM: SAMPLE_BANGLISH_SCAM,
  SAMPLE_LEGIT: SAMPLE_LEGIT
};
})(typeof window !== "undefined" ? window : global);
