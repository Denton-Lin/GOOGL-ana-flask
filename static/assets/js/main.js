// main.js
// console.log("main.js script started - Flask Version");

(function() {
  "use strict";
  // console.log("IIFE executed - Flask Version");

  // Firebase Config (!!! 🚨🚨🚨 請務必使用您自己的真實設定 🚨🚨🚨 !!!)
  const firebaseConfig = {
  apiKey: "AIzaSyCLGSAluWGeB92CsD-5mNlsQxt7-zz_hAY",
  authDomain: "snake1-cbb66.firebaseapp.com",
  databaseURL: "https://snake1-cbb66-default-rtdb.firebaseio.com",
  projectId: "snake1-cbb66",
  storageBucket: "snake1-cbb66.firebasestorage.app",
  messagingSenderId: "126279439476",
  appId: "1:126279439476:web:74cc01dd889a682da0ed21",
  measurementId: "G-2X2XB1CBMG"
};
  try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
  } catch (e) {
      console.error("Firebase initialization error:", e);
      alert("Firebase 設定錯誤，請檢查您的 firebaseConfig 物件！\n" + e.message + "\n並確認您已在 Firebase Console 完成所有必要設定 (啟用Google登入、新增授權網域)。");
  }
  const auth = firebase.auth();
  const database = firebase.database();

  // Gemini API Key (!!! 🚨🚨🚨 請務必使用您自己的真實金鑰 🚨🚨🚨 !!!)
  const GEMINI_API_KEY = "AIzaSyCSP-vK8Q30aPcUVoXNMjdRkIQkgQixr1Y";
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

  let currentUser = null;
  let currentLang = 'zh-TW';
  let latestFinancialRatios = {};
  let historicalFinancialRatiosData = [];
  let financialStatementTableData = { income: [], balance: [], cashflow: [] };

  let domElements = {};

  const translations = {
    'zh-TW': {
        siteTitle: "Google 投資分析", navHome: "首頁", navAbout: "公司概覽", navStock: "股價分析", navFinancials: "財務報表", navRatios: "財務比率", navAI: "AI分析師", projectAuthor: "開發者: 林致宇 | 期末專題",
        heroTitle: "Google (Alphabet Inc.) ", heroTitleSpan: "投資價值分析", heroSubtitle: "透過深入的數據分析，探索 Google 的投資潛力與風險。", getStarted: "開始探索",
        aboutTitle: "公司概覽", aboutSubtitle: "了解 Google", aboutSubtitleSpan: "的核心業務與市場地位",
        googleIntroTitle: "Alphabet Inc. 簡介",
        googleIntroText1: "Alphabet Inc. 是一家總部位於美國加州山景城的跨國科技集團，於 2015 年 10 月 2 日重組成立，由 Google 的聯合創始人 Larry Page 和 Sergey Brin 創立。這次重組的主要目的是提高營運透明度和管理效率，將核心的網際網路業務與其他具前瞻性但風險較高的新興業務分開。Google 依然是 Alphabet 旗下最大、最核心的子公司，是全球資訊搜尋、線上廣告、影音分享及行動作業系統的領導者。",
        coreBizTitle: "核心業務:",
        googleBiz1:"<i class='bi bi-search'></i> Google 搜尋及相關服務: 核心廣告收入來源，整合 AI 提供智慧搜尋體驗，涵蓋地圖、新聞等。",
        googleBiz2:"<i class='bi bi-badge-ad-fill'></i> Google 廣告: 主要營收引擎，包括搜尋廣告、YouTube 廣告及 Google 聯播網廣告。",
        googleBiz3:"<i class='bi bi-youtube'></i> YouTube: 全球最大影音平台，透過廣告和 Premium 訂閱等方式盈利，Shorts 短影音增長迅速。",
        googleBiz4:"<i class='bi bi-cloud-fill'></i> Google Cloud: 提供 GCP 雲端運算和 Workspace 協作工具，是快速增長的戰略重點。",
        googleBiz5:"<i class='bi bi-android2'></i> Android、Chrome 與硬體: Android 為全球主流行動作業系統，輔以 Chrome 及 Pixel 等硬體設備。",
        otherBetsTitle: "其他新興業務:",
        otherBetsText: "投資於具未來潛力但高風險的項目，如 Waymo (自動駕駛)、Verily (生命科學) 和 Calico (抗衰老研究) 等。",
        marketPosTitle: "市場地位、挑戰與展望",
        marketPosText1: "Google 在其核心領域擁有無可比擬的市場主導地位。然而，它也面臨諸多挑戰與機遇：",
        challenge1:"<i class='bi bi-robot'></i> AI 浪潮: 既是核心驅動力，也面臨激烈競爭。",
        challenge2:"<i class='bi bi-gavel'></i> 監管壓力: 全球反壟斷審查和數據隱私挑戰。",
        challenge3:"<i class='bi bi-clouds'></i> 雲端競爭: 與 AWS、Azure 的市場份額爭奪戰。",
        challenge4:"<i class='bi bi-globe'></i> 新興市場: 長期增長的潛力所在。",
        marketPosText2: "總體而言，Google 依然是全球最具影響力和投資價值的科技公司之一，但投資人需關注其應對挑戰的能力。",
        stockTitle: "股價分析", stockSubtitle: "追蹤 Google", stockSubtitleSpan: "的歷史股價表現", selectTimeRange: "選擇時間區間:", time1Y: "近一年", time3Y: "近三年", time5Y: "近五年", timeAll: "全部",
        stockPriceName: "股價", openPriceName: "開盤價", highPriceName: "最高價", lowPriceName: "最低價", closePriceName: "收盤價",
        volumeName: "成交量", volumeChartTitle: "成交量圖",
        stockDataError: "股價資料載入失敗或格式錯誤。", noStockDataPeriod: "此時間區間無股價資料。", noDataAvailable: "無可用數據",
        financialsTitle: "財務報表", financialsSubtitle: "探索 Google", financialsSubtitleSpan: "的核心財務數據", revenueTitle: "營收與毛利趨勢", incomeTitle: "營業收入與淨利趨勢", assetsLiabilitiesTitle: "資產與負債趨勢", cashflowTitle: "現金流量趨勢",
        totalRevenueName: "總營收", grossProfitName: "毛利", operatingIncomeName: "營業收入", netIncomeName: "淨利", totalAssetsName:"總資產", totalLiabilitiesName:"總負債", operatingCashflowName:"營運現金流", investmentCashflowName:"投資現金流", cashflowFromInvestmentName: "投資現金流",
        incomeComponentsTitle: "最新季度收益組成 (餅圖)",
        costofrevenueName: "營收成本", operatingexpensesName: "營業費用", taxesotherName: "稅及其他", netincomeName: "淨利",
        statementTableTitle: "查詢財務報表", statementTableSubtitle: "檢視 Google", statementTableSubtitleSpan: "的季度財務數據",
        selectStatementType: "選擇報表類型:", incomeStatement: "損益表", balanceSheet: "資產負債表", cashflowStatement: "現金流量表",
        searchMetric: "搜尋財務指標 (英文欄位名):", fiscalDateEndingName: "財報截止日期", reportedCurrencyName: "報告貨幣", commonStockSharesOutstandingName: "流通在外普通股股數",
        sankeyTitle: "利潤流向圖", sankeySubtitle: "視覺化 Google", sankeySubtitleSpan: "最新季度利潤組成與流動", revenueName: "總營收", cogsName: "營收成本", grossprofitName: "毛利",
        ratiosTitle: "財務比率", ratiosSubtitle: "評估 Google", ratiosSubtitleSpan: "的綜合財務健康狀況", ratiosIntro: "以下表格展示了根據最新財報計算出的關鍵財務比率。", ratioCategory: "類別", ratioName: "比率名稱", ratioValue: "數值 (最新季度)", ratioMeaning: "簡要含意",
        selectRatioCategory: "選擇比率類別:",
        ratioCatProfitability: "獲利能力", ratioCatValuation: "評價指標", ratioCatLiquidity: "償債能力", ratioCatEfficiency: "經營效率", ratioCatLeverage: "財務結構",
        latestRatiosTitle: "最新季度財務比率總覽",
        aiTitle: "Gemini AI 投資分析師", aiSubtitle: "與 AI 互動", aiSubtitleSpan: "獲取即時分析與見解",
        aiLoginPromptText1: "請先", aiLoginPromptText2: "以使用 AI 分析師功能並保存您的對話紀錄。",
        aiChatHeader: "與 Gemini AI 分析師對話", aiInputPlaceholder: "輸入您的問題...", aiSendButton: "發送", aiClearHistory: "清除歷史紀錄", aiClearHistoryConfirmQuestion: "您確定要清除歷史紀錄嗎？",
        login: "登入", logout: "登出", aiWelcome: "您好！我是您的 Gemini AI 投資分析師。請問有什麼關於 Google 投資的問題嗎？", aiThinking: "AI 正在思考中...", aiError: "抱歉，與 AI 連線時發生錯誤，請稍後再試或檢查您的 API 金鑰設定。", aiHistoryCleared: "對話紀錄已清除。",
        eps: "每股盈餘 (EPS)", eps_m: "公司每一股普通股能賺取多少利潤。", roa: "資產報酬率 (ROA)", roa_m: "公司利用其總資產創造利潤的效率。", roe: "股東權益報酬率 (ROE)", roe_m: "公司為股東創造利潤的效率。", pe: "本益比 (P/E Ratio)", pe_m: "投資人願意為公司每一元盈餘支付多少價格。", ps: "股價營收比 (P/S Ratio)", ps_m: "投資人願意為公司每一元營收支付多少價格。", pm: "利潤率 (Profit Margin)", pm_m: "公司每一元營收能產生多少淨利。", current: "流動比率 (Current Ratio)", current_m: "公司以流動資產償還短期負債的能力。", quick: "速動比率 (Quick Ratio)", quick_m: "公司以更具流動性的資產償還短期負債的能力。", cash: "現金比率 (Cash Ratio)", cash_m: "公司以現金及約当現金償還短期負債的能力。", invTurn: "存貨週轉率 (Inventory Turnover)", invTurn_m: "公司管理存貨的效率。", nwcTurn: "淨營運資本週轉率 (NWC Turnover)", nwcTurn_m: "公司利用淨營運資本產生營收的效率。", assetTurn: "總資產週轉率 (Asset Turnover)", assetTurn_m: "公司利用總資產產生營收的效率。", debt: "總負債比率 (Total Debt Ratio)", debt_m: "公司總資產中有多少比例是透過負債籌措的。", de: "負債權益比 (Debt-to-Equity)", de_m: "公司負債相對於股東權益的比例。", em: "權益乘數 (Equity Multiplier)", em_m: "衡量財務槓桿的另一指標。"
    },
    'en-US': { 
        siteTitle: "Google Investment Analysis", navHome: "Home", navAbout: "Overview", navStock: "Stock Analysis", navFinancials: "Financials", navRatios: "Ratios", navAI: "AI Analyst", projectAuthor: "Developer: Chih-Yu Lin | Final Project",
        heroTitle: "Google (Alphabet Inc.) ", heroTitleSpan: "Investment Analysis", heroSubtitle: "Explore Google's investment potential through in-depth data analysis.", getStarted: "Get Started",
        aboutTitle: "Company Overview", aboutSubtitle: "Understanding Google's", aboutSubtitleSpan: "Core Business & Market Position",
        googleIntroTitle: "About Alphabet Inc.",
        googleIntroText1: "Alphabet Inc., based in Mountain View, California, is a multinational technology conglomerate established on October 2, 2015, through a restructuring led by Google's co-founders, Larry Page and Sergey Brin. The primary goal was to enhance operational transparency and management efficiency by separating core internet services from 'Other Bets'—forward-looking but higher-risk ventures. Google remains Alphabet's largest and most crucial subsidiary, a global leader in information search, online advertising, video sharing, and mobile operating systems.",
        coreBizTitle: "Core Businesses:",
        googleBiz1:"<i class='bi bi-search'></i> Google Search & related: Core ad revenue, AI-powered smart search, Maps, News.",
        googleBiz2:"<i class='bi bi-badge-ad-fill'></i> Google Ads: Main revenue engine: Search, YouTube, Display Network.",
        googleBiz3:"<i class='bi bi-youtube'></i> YouTube: Largest video platform, monetized via ads & Premium; Shorts for short-form.",
        googleBiz4:"<i class='bi bi-cloud-fill'></i> Google Cloud: GCP (cloud computing) & Workspace (collaboration), a key growth area.",
        googleBiz5:"<i class='bi bi-android2'></i> Android, Chrome & Hardware: Dominant mobile OS, Chrome browser, Pixel devices.",
        otherBetsTitle: "Other Bets:",
        otherBetsText: "Investments in future-potential, high-risk projects like Waymo (self-driving), Verily (life sciences), and Calico (longevity research).",
        marketPosTitle: "Market Position, Challenges & Outlook",
        marketPosText1: "Google holds an unparalleled market-dominant position in its core areas. However, it faces numerous challenges and opportunities:",
        challenge1:"<i class='bi bi-robot'></i> AI Wave: Both a core driver and faces fierce competition.",
        challenge2:"<i class='bi bi-gavel'></i> Regulatory Pressure: Global antitrust reviews and data privacy challenges.",
        challenge3:"<i class='bi bi-clouds'></i> Cloud Competition: Market share battle with AWS and Azure.",
        challenge4:"<i class='bi bi-globe'></i> Emerging Markets: Potential for long-term growth.",
        marketPosText2: "Overall, Google remains one of the world's most influential and valuable tech companies, but investors need to monitor its ability to navigate these challenges.",
        stockTitle: "Stock Analysis", stockSubtitle: "Track Google's", stockSubtitleSpan: "Historical Stock Performance", selectTimeRange: "Select Time Range:", time1Y: "1 Year", time3Y: "3 Years", time5Y: "5 Years", timeAll: "All Time",
        stockPriceName: "Stock Price", openPriceName: "Open", highPriceName: "High", lowPriceName: "Low", closePriceName: "Close",
        volumeName: "Volume", volumeChartTitle: "Trading Volume",
        stockDataError: "Failed to load stock price data or format is incorrect.", noStockDataPeriod: "No stock price data for this period.", noDataAvailable: "No data available",
        financialsTitle: "Financial Statements", financialsSubtitle: "Explore Google's", financialsSubtitleSpan: "Core Financial Data", revenueTitle: "Revenue & Gross Profit Trend", incomeTitle: "Operating Income & Net Income Trend", assetsLiabilitiesTitle: "Assets & Liabilities Trend", cashflowTitle: "Cash Flow Trend",
        totalRevenueName: "Total Revenue", grossProfitName: "Gross Profit", operatingIncomeName: "Operating Income", netIncomeName: "Net Income", totalAssetsName:"Total Assets", totalLiabilitiesName:"Total Liabilities", operatingCashflowName:"Operating Cashflow", investmentCashflowName:"Investment Cashflow", cashflowFromInvestmentName: "Investment Cashflow",
        incomeComponentsTitle: "Latest Quarter Income Components (Pie Chart)",
        costofrevenueName: "Cost of Revenue", operatingexpensesName: "Operating Expenses", taxesotherName: "Taxes & Other", netincomeName: "Net Income",
        statementTableTitle: "Query Financial Statements", statementTableSubtitle: "View Google's", statementTableSubtitleSpan: "Quarterly Financial Data",
        selectStatementType: "Select Statement Type:", incomeStatement: "Income Statement", balanceSheet: "Balance Sheet", cashflowStatement: "Cash Flow Statement",
        searchMetric: "Search Financial Metric (English Field Name):", fiscalDateEndingName: "Fiscal Date Ending", reportedCurrencyName: "Reported Currency", commonStockSharesOutstandingName: "Common Stock Shares Outstanding",
        sankeyTitle: "Profit Flow (Sankey)", sankeySubtitle: "Visualize Google's", sankeySubtitleSpan: "Latest Quarter Profit Composition & Flow", revenueName: "Revenue", cogsName: "COGS", grossprofitName: "Gross Profit",
        ratiosTitle: "Financial Ratios", ratiosSubtitle: "Assess Google's", ratiosSubtitleSpan: "Overall Financial Health", ratiosIntro: "The table below shows key financial ratios calculated from the latest reports.", ratioCategory: "Category", ratioName: "Ratio Name", ratioValue: "Value (Latest Quarter)", ratioMeaning: "Brief Meaning",
        selectRatioCategory: "Select Ratio Category:",
        ratioCatProfitability: "Profitability", ratioCatValuation: "Valuation", ratioCatLiquidity: "Liquidity", ratioCatEfficiency: "Efficiency", ratioCatLeverage: "Leverage",
        latestRatiosTitle: "Latest Quarter Financial Ratios Overview",
        aiTitle: "Gemini AI Investment Analyst", aiSubtitle: "Interact with AI", aiSubtitleSpan: "for Real-time Analysis",
        aiLoginPromptText1: "Please ", aiLoginPromptText2: " to use the AI Analyst and save your chat history.",
        aiChatHeader: "Chat with Gemini AI Analyst", aiInputPlaceholder: "Type your question...", aiSendButton: "Send", aiClearHistory: "Clear History", aiClearHistoryConfirmQuestion: "Are you sure you want to clear the chat history?",
        login: "Login", logout: "Logout", aiWelcome: "Hello! I am your Gemini AI Investment Analyst. How can I help with your Google investment questions?", aiThinking: "AI is thinking...", aiError: "Sorry, an error occurred connecting to AI. Please try again later or check your API key.", aiHistoryCleared: "Chat history cleared.",
        eps: "EPS", eps_m: "Earnings per share.", roa: "ROA", roa_m: "Return on assets.", roe: "ROE", roe_m: "Return on equity.", pe: "P/E Ratio", pe_m: "Price to earnings.", ps: "P/S Ratio", ps_m: "Price to sales.", pm: "Profit Margin", pm_m: "Net income / revenue.", current: "Current Ratio", current_m: "Ability to pay short-term debt.", quick: "Quick Ratio", quick_m: "Ability to pay short-term debt w/o inventory.", cash: "Cash Ratio", cash_m: "Ability to pay short-term debt w/ cash.", invTurn: "Inventory Turnover", invTurn_m: "Inventory efficiency.", nwcTurn: "NWC Turnover", nwcTurn_m: "Working capital efficiency.", assetTurn: "Total Asset Turnover", assetTurn_m: "Asset efficiency.", debt: "Total Debt Ratio", debt_m: "Assets financed by debt.", de: "Debt-to-Equity", de_m: "Debt vs equity.", em: "Equity Multiplier", em_m: "Financial leverage measure."
    }
  };

  function assignDOMElements() {
      domElements = {
          loginButton: document.getElementById('login-button'), logoutButton: document.getElementById('logout-button'),
          userDisplay: document.getElementById('user-display'), aiLoginPrompt: document.getElementById('ai-login-prompt'),
          loginLink: document.getElementById('login-link'), aiChatArea: document.getElementById('ai-chat-area'),
          chatHistory: document.getElementById('chat-history'), userInput: document.getElementById('user-input'),
          sendButton: document.getElementById('send-button'), aiLoading: document.getElementById('ai-loading'),
          clearHistoryButton: document.getElementById('clear-history-button'), langTwButton: document.getElementById('lang-tw'),
          langEnButton: document.getElementById('lang-en'),
          priceTimeRangeSelect: document.getElementById('price-time-range'),
          candlestickChartDiv: document.getElementById('candlestick-chart'),
          volumeChartDiv: document.getElementById('volume-chart'),
          ratiosTableBody: document.getElementById('ratios-table-body'),
          incomePieChartDiv: document.getElementById('income-pie-chart'),
          statementTypeSelect: document.getElementById('statement-type-select'),
          financialMetricSearch: document.getElementById('financial-metric-search'),
          plotlyFinancialTableDiv: document.getElementById('plotly-financial-table'),
          sankeyChartDiv: document.getElementById('sankey-chart'),
          ratioCategorySelect: document.getElementById('ratio-category-select'),
          historicalRatiosChartsContainer: document.getElementById('historical-ratios-charts-container'),
          revenueChartDiv: document.getElementById('revenue-chart'),
          incomeChartDiv: document.getElementById('income-chart'),
          balanceSheetChartDiv: document.getElementById('balance-sheet-chart'),
          cashFlowChartDiv: document.getElementById('cash-flow-chart'),
      };
  }

  function switchLanguage(lang) {
      currentLang = lang;
      if (document.documentElement) document.documentElement.lang = lang === 'zh-TW' ? 'zh-TW' : 'en';
      document.querySelectorAll('[data-lang-key]').forEach(el => {
          const key = el.getAttribute('data-lang-key');
          if (translations[lang] && translations[lang][key]) {
               if (el.tagName === 'INPUT' && el.placeholder) { el.placeholder = translations[lang][key]; }
               else { el.innerHTML = translations[lang][key]; }
          }
      });
      if (domElements.langTwButton) domElements.langTwButton.classList.toggle('active', lang === 'zh-TW');
      if (domElements.langEnButton) domElements.langEnButton.classList.toggle('active', lang === 'en-US');

      updateAllChartsAndTables();
      updateAIChatLanguage();
      if (Object.keys(latestFinancialRatios).length > 0 && !latestFinancialRatios.error) {
          populateLatestRatiosTable(latestFinancialRatios);
      }
  }

    function handleLogin(e) {
      if(e) e.preventDefault();
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
          .catch(error => {
              console.error("Login Error:", error);
              alert(`登入失敗: ${error.code} - ${error.message}\n請檢查 Firebase Console 設定 (Authentication -> Sign-in method -> Google 已啟用，且已新增授權網域如 127.0.0.1, localhost)。並確認您的 firebaseConfig 物件完全正確。`);
          });
    }

    function handleLogout() {
      auth.signOut().catch(error => console.error("Logout Error:", error));
    }

    function updateUIForAuthState() {
      if (!domElements.loginButton) { return; }
      if (currentUser) {
          domElements.loginButton.style.display = 'none';
          domElements.logoutButton.style.display = 'inline-block';
          domElements.userDisplay.textContent = currentUser.displayName || currentUser.email;
          domElements.userDisplay.style.display = 'inline-block';
          if(domElements.aiLoginPrompt) domElements.aiLoginPrompt.style.display = 'none';
          if(domElements.aiChatArea) domElements.aiChatArea.style.display = 'block';
          loadChatHistory();
      } else {
          domElements.loginButton.style.display = 'inline-block';
          domElements.logoutButton.style.display = 'none';
          domElements.userDisplay.style.display = 'none';
          if(domElements.aiLoginPrompt) domElements.aiLoginPrompt.style.display = 'block';
          if(domElements.aiChatArea) domElements.aiChatArea.style.display = 'none';
          if(domElements.chatHistory) domElements.chatHistory.innerHTML = '';
      }
    }

    function addMessageToChat(text, sender) {
      if (!domElements.chatHistory) return null;
      const msgDiv = document.createElement('div');
      msgDiv.classList.add('chat-message', sender);
      const senderName = sender === 'user' ? (currentUser?.displayName || 'You') : 'Gemini AI';
      const formattedText = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      msgDiv.innerHTML = `<strong>${senderName}</strong><br>${formattedText}`;
      domElements.chatHistory.appendChild(msgDiv);
      domElements.chatHistory.scrollTop = domElements.chatHistory.scrollHeight;
      return msgDiv;
    }

    function saveMessageToFirebase(text, sender) {
      if (!currentUser || !database) return;
      database.ref(`chat_history/${currentUser.uid}`).push({
          text: text, sender: sender, timestamp: firebase.database.ServerValue.TIMESTAMP
      });
    }

    function loadChatHistory() {
        if (!currentUser || !domElements.chatHistory || !database) return;
        domElements.chatHistory.innerHTML = '';
        const chatRef = database.ref(`chat_history/${currentUser.uid}`).limitToLast(50);
        let isFirstMessage = true;
        chatRef.on('child_added', snapshot => {
            const message = snapshot.val();
            if (message) {
                addMessageToChat(message.text, message.sender);
                isFirstMessage = false;
            }
        });
        chatRef.once('value', snapshot => {
            if (isFirstMessage && !snapshot.exists()) {
                 addMessageToChat(translations[currentLang]['aiWelcome'], 'ai');
            }
        });
    }

    function clearChatHistory() {
        if (!currentUser || !database ) return;
        const confirmationMessageKey = 'aiClearHistory';
        const confirmationQuestionKey = 'aiClearHistoryConfirmQuestion';
        const defaultConfirmationMessage = "Clear chat history";
        const defaultConfirmationQuestion = "Are you sure you want to clear the chat history?";
        const confirmationText = translations[currentLang]?.[confirmationMessageKey] || defaultConfirmationMessage;
        const questionText = translations[currentLang]?.[confirmationQuestionKey] || defaultConfirmationQuestion;
        if (!confirm(confirmationText + "? " + questionText)) return;
        database.ref(`chat_history/${currentUser.uid}`).remove()
            .then(() => {
                if(domElements.chatHistory) domElements.chatHistory.innerHTML = '';
                addMessageToChat(translations[currentLang]['aiHistoryCleared'], 'ai');
            })
            .catch(error => console.error("Clear history error:", error));
    }

  async function handleSendMessage() {
      if (!domElements.userInput || !domElements.sendButton || !domElements.aiLoading) return;
      const userText = domElements.userInput.value.trim();
      if (!userText || !currentUser) return;

      addMessageToChat(userText, 'user');
      saveMessageToFirebase(userText, 'user');
      domElements.userInput.value = '';
      domElements.sendButton.disabled = true;
      domElements.aiLoading.style.display = 'inline-block';
      const thinkingMsg = addMessageToChat(translations[currentLang]['aiThinking'], 'ai');

      if (Object.keys(latestFinancialRatios).length === 0 || latestFinancialRatios.error) {
          try {
              const response = await fetch('/api/latest_ratios');
              const fetchedRatios = await response.json();
              if (fetchedRatios && !fetchedRatios.error) {
                latestFinancialRatios = fetchedRatios;
              } else {
                console.error("Error fetching/validating latest ratios for AI:", fetchedRatios?.error);
                latestFinancialRatios = {note: "Data unavailable"};
              }
          } catch (err) {
              console.error("Error fetching latest ratios for AI:", err);
              latestFinancialRatios = {note: "Failed to fetch data"};
          }
      }

      const financialContext = JSON.stringify(latestFinancialRatios, null, 2);
      const prompt = `You are a helpful investment analyst for Google (Alphabet Inc.). Current Language: ${currentLang}. Respond in this language. Financial Ratios for context: ${financialContext}. User's question: "${userText}". Provide concise, neutral analysis. Avoid direct financial advice (buy/sell).`;

      try {
           const placeholderKeys = ["YOUR_GEMINI_API_KEY", "AIzaSyAfDwNDCzR9ECRlLBXkgWoxLMc833c5tPg"];
           if (!GEMINI_API_KEY || placeholderKeys.some(pk => GEMINI_API_KEY.includes(pk)) ) {
                throw new Error("API Key is a placeholder or invalid.");
           }
          const response = await fetch(GEMINI_API_URL, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          const rawResponseText = await response.text();
          if (!response.ok) {
              let errorMsg = `API Error: ${response.status}.`;
              try { errorMsg += ` ${JSON.parse(rawResponseText)?.error?.message || rawResponseText}`; }
              catch(e) { errorMsg += ` ${rawResponseText}`; }
              throw new Error(errorMsg);
          }
          const data = JSON.parse(rawResponseText);
          const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || (translations[currentLang]['aiError'] + " (No content)");
          if (thinkingMsg) thinkingMsg.remove();
          addMessageToChat(aiText, 'ai');
          saveMessageToFirebase(aiText, 'ai');
      } catch (error) {
          console.error("Gemini API Error:", error);
          if (thinkingMsg) thinkingMsg.remove();
          addMessageToChat(`${translations[currentLang]['aiError']} (${error.message})`, 'ai');
      } finally {
          domElements.sendButton.disabled = false;
          domElements.aiLoading.style.display = 'none';
      }
  }

    function handleUserInputKeypress(e) { if (e.key === 'Enter') handleSendMessage(); }

  async function fetchData(url) {
      try {
          const response = await fetch(url);
          if (!response.ok) {
              console.error(`HTTP error! status: ${response.status} for ${url}`);
              try {
                const errorData = await response.json();
                console.error("Server error response (JSON):", errorData);
                return errorData;
              } catch (e) {
                const textError = await response.text()
                console.error("Server error response (text):", textError);
                return { error: `Server error: ${response.status}. Response not JSON.`};
              }
          }
          return await response.json();
      } catch (error) {
          console.error(`Network error or failed to fetch data from ${url}:`, error);
          return { error: `Network error: ${error.message}` };
      }
  }

  function drawPlotlyChart(divId, data, layout, config = {responsive: true}) {
     const chartDiv = document.getElementById(divId);
     if (chartDiv) {
         try { Plotly.newPlot(chartDiv, data, layout, config); }
         catch (e) {
            let errorMsg = "Unknown chart error";
            if (e && e.message) {
                errorMsg = e.message;
            } else if (e) {
                errorMsg = String(e);
            }
            console.error(`Plotly Error on ${divId}:`, e);
            chartDiv.innerHTML = `<div class="alert alert-danger">Chart Error: ${errorMsg || "Details unavailable"}</div>`;
        }
     } else {
         console.warn(`Chart div not found: ${divId}`);
     }
  }

  async function drawPriceCandlestickChart(timeRange = '1y') {
      const stockData = await fetchData(`/api/stock_data?time_range=${timeRange}`);
      if (!stockData || stockData.error || !Array.isArray(stockData) || stockData.length === 0) {
          const errorMsg = stockData?.error ? `(${stockData.error})` : '';
          if(domElements.candlestickChartDiv) domElements.candlestickChartDiv.innerHTML = `<div class="alert alert-warning">${translations[currentLang]['noStockDataPeriod']} ${errorMsg}</div>`;
          if(domElements.volumeChartDiv) domElements.volumeChartDiv.innerHTML = '';
          return;
      }
      const dates = stockData.map(d => new Date(d.date));
      const candlestickTrace = {
          x: dates,
          open: stockData.map(d => d.open), high: stockData.map(d => d.high),
          low: stockData.map(d => d.low), close: stockData.map(d => d.close),
          type: 'candlestick', name: translations[currentLang]['stockPriceName'],
          increasing: { line: { color: '#2ca02c' } }, decreasing: { line: { color: '#d62728' } }
      };
      const layoutOptions = { paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { color: '#444444' }, margin: { l: 60, r: 30, t: 60, b: 50 } };
      const candlestickLayout = { title: translations[currentLang]['stockTitle'], xaxis: { type: 'date', rangeslider: {visible: false} }, yaxis: {title: 'Price (USD)'}, ...layoutOptions };
      drawPlotlyChart('candlestick-chart', [candlestickTrace], candlestickLayout);

      const volumeTrace = {
          x: dates, y: stockData.map(d => d.volume), type: 'bar',
          name: translations[currentLang]['volumeName'], marker: { color: '#6c757d', opacity: 0.6 }
      };
      const volumeLayout = { title: translations[currentLang]['volumeChartTitle'], xaxis: { type: 'date' }, yaxis: {title: 'Volume'}, ...layoutOptions };
      drawPlotlyChart('volume-chart', [volumeTrace], volumeLayout);
  }

  async function drawOriginalFinancialCharts() {
      const incomeData = await fetchData('/api/financial_statement?type=income');
      const balanceData = await fetchData('/api/financial_statement?type=balance');
      const cashflowData = await fetchData('/api/financial_statement?type=cashflow');

      const layoutOptions = { paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { color: '#444444' }, margin: { l: 70, r: 20, t: 60, b: 40 }, legend: {orientation: "h", yanchor: "bottom", y: 1.02, xanchor: "right", x: 1}};
      const errText = (type, err) => `<div class="alert alert-warning">${translations[currentLang]['noDataAvailable']} (${type}${err ? ': '+err : ''})</div>`;

      if (incomeData && !incomeData.error && Array.isArray(incomeData) && incomeData.length > 0) {
          const datesInc = incomeData.map(d => d.fiscalDateEnding);
          drawPlotlyChart('revenue-chart', [{ x: datesInc, y: incomeData.map(d => d.totalRevenue), name: translations[currentLang]['totalRevenueName'], type: 'bar' }, { x: datesInc, y: incomeData.map(d => d.grossProfit), name: translations[currentLang]['grossProfitName'], type: 'bar' }], { title: translations[currentLang]['revenueTitle'], barmode: 'group', ...layoutOptions });
          drawPlotlyChart('income-chart', [{ x: datesInc, y: incomeData.map(d => d.operatingIncome), name: translations[currentLang]['operatingIncomeName'], type: 'line' }, { x: datesInc, y: incomeData.map(d => d.netIncome), name: translations[currentLang]['netIncomeName'], type: 'line' }], { title: translations[currentLang]['incomeTitle'], ...layoutOptions });
      } else { if(domElements.revenueChartDiv) domElements.revenueChartDiv.innerHTML = errText("Income", incomeData?.error); if(domElements.incomeChartDiv) domElements.incomeChartDiv.innerHTML = errText("Income", incomeData?.error);}

      if (balanceData && !balanceData.error && Array.isArray(balanceData) && balanceData.length > 0) {
          const datesBal = balanceData.map(d => d.fiscalDateEnding);
          drawPlotlyChart('balance-sheet-chart', [{ x: datesBal, y: balanceData.map(d => d.totalAssets), name: translations[currentLang]['totalAssetsName'], type: 'line' }, { x: datesBal, y: balanceData.map(d => d.totalLiabilities), name: translations[currentLang]['totalLiabilitiesName'], type: 'line' }], { title: translations[currentLang]['assetsLiabilitiesTitle'], ...layoutOptions });
      } else { if(domElements.balanceSheetChartDiv) domElements.balanceSheetChartDiv.innerHTML = errText("Balance Sheet", balanceData?.error);}

      if (cashflowData && !cashflowData.error && Array.isArray(cashflowData) && cashflowData.length > 0) {
          const datesCf = cashflowData.map(d => d.fiscalDateEnding);
          const investmentCashflowKey = 'cashflowFromInvestmentName';
          const investmentCashflowName = translations[currentLang][investmentCashflowKey] || translations[currentLang]['investmentCashflowName'] || "Investment Cashflow";

          drawPlotlyChart('cash-flow-chart', [
              { x: datesCf, y: cashflowData.map(d => d.operatingCashflow), name: translations[currentLang]['operatingCashflowName'], type: 'bar' },
              { x: datesCf, y: cashflowData.map(d => d.cashflowFromInvestment), name: investmentCashflowName, type: 'bar' }
            ], { title: translations[currentLang]['cashflowTitle'], barmode: 'relative', ...layoutOptions });
      } else { if(domElements.cashFlowChartDiv) domElements.cashFlowChartDiv.innerHTML = errText("Cash Flow", cashflowData?.error);}
  }

  async function drawNewFinancialCharts() {
      const componentsData = await fetchData('/api/income_statement_components');
      const errMessage = (err) => `<div class="alert alert-warning">${translations[currentLang]['noDataAvailable']} (Pie data unavailable or malformed${err ? ': '+err : ''}).</div>`;

      if (!componentsData || componentsData.pie_data?.error ||
          !componentsData.pie_data?.labels || !Array.isArray(componentsData.pie_data.labels) || componentsData.pie_data.labels.length === 0) {
          const errorDetail = componentsData?.pie_data?.error || "";
          if(domElements.incomePieChartDiv) domElements.incomePieChartDiv.innerHTML = errMessage(errorDetail);
          return;
      }
      const pieTrace = {
          labels: componentsData.pie_data.labels.map(label => {
              const key = label.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '') + 'Name';
              return translations[currentLang][key] || label;
          }),
          values: componentsData.pie_data.values, type: 'pie', textinfo: "label+percent", insidetextorientation: "radial"
      };
      const pieLayout = { title: translations[currentLang]['incomeComponentsTitle'], paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { color: '#444444' } };
      drawPlotlyChart('income-pie-chart', [pieTrace], pieLayout);
  }

  async function drawFinancialStatementTable(statementType = 'income', searchTerm = '') {
      let dataToDisplay = financialStatementTableData[statementType];
      if (!Array.isArray(dataToDisplay) || dataToDisplay.length === 0) {
        dataToDisplay = await fetchData(`/api/financial_statement?type=${statementType}`);
        if (!dataToDisplay || dataToDisplay.error || !Array.isArray(dataToDisplay) || dataToDisplay.length === 0) {
            const errorDetail = dataToDisplay?.error || "";
            if(domElements.plotlyFinancialTableDiv) domElements.plotlyFinancialTableDiv.innerHTML = `<div class="alert alert-warning">${translations[currentLang]['noDataAvailable']} (${statementType} statement${errorDetail ? ': '+errorDetail : ''}).</div>`;
            return;
        }
        financialStatementTableData[statementType] = dataToDisplay;
      }

      let filteredData = dataToDisplay;
      let initialHeaders = (filteredData.length > 0 && typeof filteredData[0] === 'object' && filteredData[0] !== null) ? Object.keys(filteredData[0]) : [];
      let displayHeaders = [...initialHeaders];

      if (searchTerm.trim()) {
          const lowerSearchTerm = searchTerm.toLowerCase().trim();
          const matchingHeadersFromSearch = initialHeaders.filter(header => header.toLowerCase().includes(lowerSearchTerm));

          if (matchingHeadersFromSearch.length > 0) {
              displayHeaders = matchingHeadersFromSearch;
          } else {
              filteredData = filteredData.filter(row =>
                  Object.values(row).some(val => String(val).toLowerCase().includes(lowerSearchTerm))
              );
              displayHeaders = (filteredData.length > 0 && typeof filteredData[0] === 'object' && filteredData[0] !== null) ? Object.keys(filteredData[0]) : initialHeaders;
          }
      }

      const columnsToActuallyDisplay = [];
      if (filteredData.length > 0) {
          // *** MODIFIED LOGIC: Only keep columns with NO missing values ***
          displayHeaders.forEach(header => {
              // Always keep the fiscalDateEnding column
              if (header === 'fiscalDateEnding') {
                  columnsToActuallyDisplay.push(header);
                  return; // Continue to the next header
              }

              // Check if this column contains ANY missing value
              const hasAnyMissingValue = filteredData.some(row => {
                  const val = (typeof row === 'object' && row !== null && row.hasOwnProperty(header)) ? row[header] : null;
                  return (val === null || val === undefined || String(val).toUpperCase() === 'N/A' || String(val).trim() === '');
              });

              // If the column does NOT have any missing values, add it for display
              if (!hasAnyMissingValue) {
                  columnsToActuallyDisplay.push(header);
              }
          });
      }

      if (searchTerm.trim() && columnsToActuallyDisplay.length === 0 && initialHeaders.length > 0) {
        if(domElements.plotlyFinancialTableDiv) domElements.plotlyFinancialTableDiv.innerHTML = `<div class="alert alert-info">No results found for "${searchTerm}" that have complete data.</div>`;
        return;
      }
      
      displayHeaders = columnsToActuallyDisplay;

      if (displayHeaders.length === 0) {
           if(domElements.plotlyFinancialTableDiv) domElements.plotlyFinancialTableDiv.innerHTML = `<div class="alert alert-info">${translations[currentLang]['noDataAvailable']} (No columns with complete data found for ${statementType}).</div>`;
           return;
      }

      const headerValues = displayHeaders.map(header => translations[currentLang][header.toLowerCase() + 'Name'] || header.replace(/([A-Z0-9])/g, ' $1').replace(/^./, str => str.toUpperCase()));
      const cellValues = displayHeaders.map(header => filteredData.map(row => {
          const val = (typeof row === 'object' && row !== null && row.hasOwnProperty(header)) ? row[header] : null;
          return (val === null || val === undefined || String(val).toUpperCase() === 'N/A') ? '' : val;
      }));

      const columnWidths = headerValues.map((translatedHeader, index) => {
        const originalHeader = displayHeaders[index];
        if (originalHeader === 'fiscalDateEnding') return 120;
        let maxLength = translatedHeader.length;
        const columnData = cellValues[index];
        if (columnData) {
            columnData.forEach(cell => {
                if (String(cell).length > maxLength) maxLength = String(cell).length;
            });
        }
        if (maxLength > 35) return 200;
        if (maxLength > 20) return 160;
        return 110;
      });

      const titleKeyMap = {
          'income': 'incomeStatement',
          'balance': 'balanceSheet',
          'cashflow': 'cashflowStatement'
      };
      const titleKey = titleKeyMap[statementType];
      const tableTitle = translations[currentLang][titleKey] || `${statementType.toUpperCase()} Statement`;


      const tableTrace = {
          type: 'table',
          columnwidth: columnWidths,
          header: {
              values: headerValues, align: "center", line: {width: 1, color: 'black'},
              fill: {color: "#106eea"}, font: {family: "Arial, Noto Sans TC, sans-serif", size: 12, color: "white"}
          },
          cells: {
              values: cellValues, align: "left", line: {color: "black", width: 1},
              font: {family: "Arial, Noto Sans TC, sans-serif", size: 11, color: ["black"]}
          }
      };
      const tableLayout = { title: tableTitle };
      drawPlotlyChart('plotly-financial-table', [tableTrace], tableLayout);
  }

  async function drawSankeyDiagram() {
      const data = await fetchData('/api/sankey_data');
      const errMessage = (err) => `<div class="alert alert-warning">${translations[currentLang]['noDataAvailable']} (Sankey data unavailable or malformed${err ? ': '+err : ''}).</div>`;

      if (!data || data.error || !data.nodes || data.nodes.error || !data.links ||
          !Array.isArray(data.nodes.label) || data.nodes.label.length === 0) {
          const errorDetail = data?.error || data?.nodes?.error || "";
          if(domElements.sankeyChartDiv) domElements.sankeyChartDiv.innerHTML = errMessage(errorDetail);
          return;
      }

      const translatedNodeLabels = data.nodes.label.map(label => {
          let keyPart = label.toLowerCase().replace(/\s+/g, '');
          let transKey = keyPart + 'Name';
          if (translations[currentLang][transKey]) {
              return translations[currentLang][transKey];
          }
          transKey = keyPart;
           if (translations[currentLang][transKey]) {
              return translations[currentLang][transKey];
          }
          return label;
      });


      const sankeyTrace = {
          type: "sankey", orientation: "h",
          node: {
              pad: 15, thickness: 20, line: { color: "black", width: 0.5 },
              label: translatedNodeLabels,
              color: data.nodes.color
          },
          link: {
              source: data.links.source, target: data.links.target, value: data.links.value,
              color: data.links.color
          }
      };
      const sankeyLayout = { title: translations[currentLang]['sankeyTitle'], font: { size: 12 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)' };
      drawPlotlyChart('sankey-chart', [sankeyTrace], sankeyLayout);
  }

  async function drawHistoricalRatiosCharts(category = 'profitability') {
      if (!Array.isArray(historicalFinancialRatiosData) || historicalFinancialRatiosData.length === 0) {
          const data = await fetchData('/api/historical_ratios');
          if (data === null || data.error) {
              const errorDetail = data?.error || "";
              if(domElements.historicalRatiosChartsContainer) domElements.historicalRatiosChartsContainer.innerHTML = `<div class="alert alert-danger">Failed to fetch historical ratio data${errorDetail ? ': '+errorDetail : ''}.</div>`;
              historicalFinancialRatiosData = [];
              return;
          }
          if (!Array.isArray(data) || data.length === 0) {
              if(domElements.historicalRatiosChartsContainer) domElements.historicalRatiosChartsContainer.innerHTML = `<div class="alert alert-warning">${translations[currentLang]['noDataAvailable']} (Historical ratios).</div>`;
              historicalFinancialRatiosData = [];
              return;
          }
          historicalFinancialRatiosData = data;
      }

      if (!Array.isArray(historicalFinancialRatiosData)) {
        console.error("drawHistoricalRatiosCharts: historicalFinancialRatiosData is not an array before processing.", historicalFinancialRatiosData);
        if(domElements.historicalRatiosChartsContainer) domElements.historicalRatiosChartsContainer.innerHTML = `<div class="alert alert-danger">Internal error processing ratio data.</div>`;
        return;
      }

      if(domElements.historicalRatiosChartsContainer) domElements.historicalRatiosChartsContainer.innerHTML = '';
      const ratioMap = {
          profitability: ['eps', 'roa', 'roe', 'pm'], valuation: ['pe', 'ps'],
          liquidity: ['current', 'quick', 'cash'],
          efficiency: ['nwcTurn', 'assetTurn'],
          leverage: ['debt', 'de', 'em']
      };
      const selectedRatios = ratioMap[category] || [];

      if (historicalFinancialRatiosData.length === 0 && selectedRatios.length > 0) {
        if(domElements.historicalRatiosChartsContainer) domElements.historicalRatiosChartsContainer.innerHTML = `<div class="alert alert-warning">${translations[currentLang]['noDataAvailable']} (Historical ratios).</div>`;
        return;
      }
      const dates = historicalFinancialRatiosData.map(d => d.fiscalDateEnding);

      let chartsDrawn = 0;
      selectedRatios.forEach(ratioKey => {
          const hasValidData = historicalFinancialRatiosData.some(d => d[ratioKey] !== 'N/A' && d[ratioKey] !== null && d[ratioKey] !== undefined);
          if (!hasValidData) return;

          chartsDrawn++;
          const chartId = `ratio-chart-${ratioKey}`;
          const chartContainer = document.createElement('div');
          chartContainer.className = 'col-lg-6 col-md-12 mb-4';
          chartContainer.innerHTML = `<div id="${chartId}" style="width:100%; height:350px;"></div>`;
          if(domElements.historicalRatiosChartsContainer) domElements.historicalRatiosChartsContainer.appendChild(chartContainer);

          const values = historicalFinancialRatiosData.map(d => d[ratioKey] === 'N/A' ? null : parseFloat(d[ratioKey]));
          const ratioTrace = {
              x: dates, y: values, type: 'scatter', mode: 'lines+markers',
              name: translations[currentLang][ratioKey] || ratioKey.toUpperCase()
          };
          const ratioLayout = {
              title: translations[currentLang][ratioKey] || ratioKey.toUpperCase(),
              xaxis: { title: 'Date' }, yaxis: { title: 'Value' },
              paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { color: '#444444' },
              margin: { l: 60, r: 20, t: 50, b: 50 }
          };
          drawPlotlyChart(chartId, [ratioTrace], ratioLayout);
      });

      if (chartsDrawn === 0 && domElements.historicalRatiosChartsContainer) {
          if (selectedRatios.length > 0) {
            domElements.historicalRatiosChartsContainer.innerHTML = `<div class="alert alert-warning">${translations[currentLang]['noDataAvailable']} (No chartable data for selected ratios in this category).</div>`;
          } else {
            domElements.historicalRatiosChartsContainer.innerHTML = `<div class="alert alert-info">Select a category to view ratio charts.</div>`;
          }
      }
  }

  function populateLatestRatiosTable(ratiosData) {
      latestFinancialRatios = ratiosData;
      const tableBody = domElements.ratiosTableBody;
      if (!tableBody) { return; }
      tableBody.innerHTML = '';
      const ratioOrder = [
          { cat_key: 'ratioCatProfitability', cat_en: 'Profitability', ratios: ['eps', 'roa', 'roe', 'pm'] },
          { cat_key: 'ratioCatValuation', cat_en: 'Valuation', ratios: ['pe', 'ps'] },
          { cat_key: 'ratioCatLiquidity', cat_en: 'Liquidity', ratios: ['current', 'quick', 'cash'] },
          { cat_key: 'ratioCatEfficiency', cat_en: 'Efficiency', ratios: ['nwcTurn', 'assetTurn'] },
          { cat_key: 'ratioCatLeverage', cat_en: 'Leverage', ratios: ['debt', 'de', 'em'] }
      ];
      ratioOrder.forEach(category => {
          category.ratios.forEach(key => {
              const catText = translations[currentLang][category.cat_key] || category.cat_en;
              const nameText = translations[currentLang][key] || key.toUpperCase();
              const meaningText = translations[currentLang][key + '_m'] || 'N/A';
              let value = ratiosData[key];
              if (value !== 'N/A' && value !== null && value !== undefined) {
                if (typeof value === 'number') {
                  if (['roa', 'roe', 'pm', 'debt'].includes(key)) {
                      value = (value * 100).toFixed(2) + '%';
                  } else {
                      value = value.toFixed(2);
                  }
                }
              } else {
                value = 'N/A';
              }
              tableBody.innerHTML += `<tr><td>${catText}</td><td>${nameText}</td><td>${String(value)}</td><td class="ratio-meaning-cell">${meaningText}</td></tr>`;
          });
      });
  }

  async function loadInitialDataAndDraw() {
      const ratios = await fetchData('/api/latest_ratios');
      if (ratios && typeof ratios === 'object' && Object.keys(ratios).length > 0 && !ratios.error) {
          populateLatestRatiosTable(ratios);
      } else {
        console.warn("Latest ratios data is empty, invalid, or contains an error:", ratios);
        const errorDetail = ratios?.error || "";
        if(domElements.ratiosTableBody) domElements.ratiosTableBody.innerHTML = `<tr><td colspan="4" class="text-center">${translations[currentLang]['noDataAvailable']}${errorDetail ? ': '+errorDetail : ''}</td></tr>`;
      }
      updateAllChartsAndTables();
  }

  function updateAllChartsAndTables() {
    if(domElements.priceTimeRangeSelect) drawPriceCandlestickChart(domElements.priceTimeRangeSelect.value); else drawPriceCandlestickChart();
    drawOriginalFinancialCharts();
    drawNewFinancialCharts();
    if(domElements.statementTypeSelect && domElements.financialMetricSearch) drawFinancialStatementTable(domElements.statementTypeSelect.value, domElements.financialMetricSearch.value); else drawFinancialStatementTable();
    drawSankeyDiagram();
    if(domElements.ratioCategorySelect) drawHistoricalRatiosCharts(domElements.ratioCategorySelect.value); else drawHistoricalRatiosCharts();
  }

  function addEventListeners() {
      const add = (el, event, handler) => { if (el) el.addEventListener(event, handler); };
      add(domElements.loginButton, 'click', handleLogin);
      add(domElements.loginLink, 'click', handleLogin);
      add(domElements.logoutButton, 'click', handleLogout);
      add(domElements.sendButton, 'click', handleSendMessage);
      add(domElements.clearHistoryButton, 'click', clearChatHistory);
      add(domElements.langTwButton, 'click', () => switchLanguage('zh-TW'));
      add(domElements.langEnButton, 'click', () => switchLanguage('en-US'));
      add(domElements.userInput, 'keypress', handleUserInputKeypress);
      add(domElements.priceTimeRangeSelect, 'change', (e) => drawPriceCandlestickChart(e.target.value));
      add(domElements.statementTypeSelect, 'change', (e) => {
        drawFinancialStatementTable(e.target.value, domElements.financialMetricSearch ? domElements.financialMetricSearch.value : '');
      });
      add(domElements.financialMetricSearch, 'input', (e) => {
        if (domElements.statementTypeSelect) {
            drawFinancialStatementTable(domElements.statementTypeSelect.value, e.target.value)
        }
      });
      add(domElements.ratioCategorySelect, 'change', (e) => drawHistoricalRatiosCharts(e.target.value));
  }

  function updateAIChatLanguage() {
      if (domElements.userInput) domElements.userInput.placeholder = translations[currentLang]['aiInputPlaceholder'];
      const sendButtonSpan = domElements.sendButton ? domElements.sendButton.querySelector('span:not(.spinner-border)') : null;
      if (sendButtonSpan) sendButtonSpan.innerText = translations[currentLang]['aiSendButton'];
      if (domElements.clearHistoryButton) domElements.clearHistoryButton.innerText = translations[currentLang]['aiClearHistory'];
      if (domElements.chatHistory && domElements.chatHistory.children.length <= 1) {
        const firstMessage = domElements.chatHistory.querySelector('.chat-message.ai');
        if (firstMessage && (firstMessage.innerHTML.includes(translations['zh-TW']['aiWelcome']) || firstMessage.innerHTML.includes(translations['en-US']['aiWelcome']) || firstMessage.innerHTML.includes("您好！我是您的 Gemini AI 投資分析師") || firstMessage.innerHTML.includes("Hello! I am your Gemini AI Investment Analyst"))) {
            firstMessage.innerHTML = `<strong>Gemini AI</strong><br>${translations[currentLang]['aiWelcome']}`;
        }
      }
  }

  function initBizLandJS() {
    function toggleScrolled() { const selectBody = document.querySelector('body'); const selectHeader = document.querySelector('#header'); if (!selectHeader || !selectBody) return; window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled'); }
    document.addEventListener('scroll', toggleScrolled); window.addEventListener('load', toggleScrolled);
    const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');
    function mobileNavToogle() { document.querySelector('body')?.classList.toggle('mobile-nav-active'); mobileNavToggleBtn?.classList.toggle('bi-list'); mobileNavToggleBtn?.classList.toggle('bi-x'); }
    mobileNavToggleBtn?.addEventListener('click', mobileNavToogle);
    document.querySelectorAll('#navmenu a').forEach(navmenu => { navmenu.addEventListener('click', () => { if (document.querySelector('.mobile-nav-active')) mobileNavToogle(); }); });
    document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => { navmenu.addEventListener('click', function(e) { e.preventDefault(); this.parentNode.classList.toggle('active'); this.parentNode.nextElementSibling.classList.toggle('dropdown-active'); e.stopImmediatePropagation(); }); });
    const preloader = document.querySelector('#preloader'); if (preloader) { setTimeout(() => { if(preloader) preloader.remove(); }, 500); }
    let scrollTop = document.querySelector('.scroll-top');
    function toggleScrollTop() { if (scrollTop) window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active'); }
    scrollTop?.addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    window.addEventListener('load', toggleScrollTop); document.addEventListener('scroll', toggleScrollTop);
    if (typeof AOS !== 'undefined') { AOS.init({ duration: 600, easing: 'ease-in-out', once: true, mirror: false }); } else { console.warn("AOS library not found.");}
    if (typeof GLightbox !== 'undefined') { GLightbox({ selector: '.glightbox' }); } else { console.warn("GLightbox library not found.");}
    if (typeof PureCounter !== 'undefined') { new PureCounter(); } else { console.warn("PureCounter library not found.");}
  }

  document.addEventListener('DOMContentLoaded', () => {
    assignDOMElements();
    initBizLandJS();
    addEventListeners();
    auth.onAuthStateChanged(user => {
        currentUser = user;
        updateUIForAuthState();
        if (user) {
            fetchData('/api/latest_ratios').then(ratios => {
                if (ratios && typeof ratios === 'object' && Object.keys(ratios).length > 0 && !ratios.error) {
                     latestFinancialRatios = ratios;
                } else {
                    console.warn("Fetched latest_ratios is not a valid object, is empty, or contains an error:", ratios);
                }
            });
        }
    });
    loadInitialDataAndDraw().then(() => {
        const initialLang = localStorage.getItem('preferredLang') || 'zh-TW';
        switchLanguage(initialLang);
        updateUIForAuthState();
    }).catch(error => {
        console.error("Initialization or initial data load failed:", error);
        switchLanguage('zh-TW');
        updateUIForAuthState();
    });
  });

})();