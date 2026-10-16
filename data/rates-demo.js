/* Seeded live exchange rates matching Screen 6 (FX Advisor & Global Currency Board).
   Simulated fintech demonstration data. */
(function(global){
"use strict";
global.SeedLiveRates = [
  { ccy:"USD", name:"US Dollar", region:"Americas", buy:119.50, sell:119.80, usdRate:1.0000, change:+0.14, flag:"🇺🇸", corridorId:"us-dhaka" },
  { ccy:"EUR", name:"Euro", region:"Europe", buy:130.40, sell:131.20, usdRate:0.9160, change:-0.25, flag:"🇪🇺", corridorId:"eu-dhaka" },
  { ccy:"GBP", name:"British Pound", region:"Europe", buy:151.32, sell:152.50, usdRate:0.7880, change:+0.18, flag:"🇬🇧", corridorId:"uk-dhaka" },
  { ccy:"CAD", name:"Canadian Dollar", region:"Americas", buy:86.42, sell:87.10, usdRate:1.3760, change:+0.05, flag:"🇨🇦", corridorId:"ca-dhaka" },
  { ccy:"AUD", name:"Australian Dollar", region:"Asia-Pacific", buy:78.32, sell:79.10, usdRate:1.5160, change:-0.12, flag:"🇦🇺", corridorId:"au-dhaka" },
  { ccy:"CNY", name:"Chinese Yuan (RMB)", region:"Asia-Pacific", buy:16.75, sell:16.88, usdRate:7.1330, change:+0.21, flag:"🇨🇳", corridorId:"cn-dhaka" },
  { ccy:"SGD", name:"Singapore Dollar", region:"Asia-Pacific", buy:91.20, sell:91.85, usdRate:1.3100, change:+0.09, flag:"🇸🇬", corridorId:"sg-dhaka" },
  { ccy:"AED", name:"UAE Dirham", region:"Middle East", buy:32.70, sell:32.95, usdRate:3.6725, change:+0.02, flag:"🇦🇪", corridorId:"ae-dhaka" },
  { ccy:"SAR", name:"Saudi Riyal", region:"Middle East", buy:31.85, sell:32.10, usdRate:3.7500, change:0.00, flag:"🇸🇦", corridorId:"riyadh-dhaka" },
  { ccy:"MYR", name:"Malaysian Ringgit", region:"Asia-Pacific", buy:26.32, sell:27.10, usdRate:4.3100, change:+0.16, flag:"🇲🇾", corridorId:"kl-dhaka" },
  { ccy:"INR", name:"Indian Rupee", region:"Asia-Pacific", buy:1.42, sell:1.45, usdRate:83.9000, change:+0.08, flag:"🇮🇳", corridorId:"us-in" },
  { ccy:"PHP", name:"Philippine Peso", region:"Asia-Pacific", buy:2.08, sell:2.12, usdRate:57.4000, change:-0.06, flag:"🇵🇭", corridorId:"us-ph" }
];
})(typeof window !== "undefined" ? window : global);
