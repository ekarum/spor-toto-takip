KARUM TOTO V17.5.0 - TÜRKİYE GENELİ TAHMİNİ İKRAMİYE MOTORU

Yeni: 15 maç için 1-X-2 oynanma yüzdeleri, toplam kolon/havuz/devreden ayarları, 15-14-13-12 tahmini kazanan ve ikramiye aralıkları, sürpriz ve güven endeksi, sonraki maç 1-X-2 etki analizi.

KARUM TOTO V17.3.0 - KARUM ZEKA TAM PAKET

Yeni özellikler:
- V17.1 Canlı Senaryo Motoru: 15, 14+, 13+ ve 12+ kesin kapsama hesapları
- V17.2 Otomatik Karum Zeka yorumları, garanti analizi ve tehlike uyarıları
- V17.3 Doğal dilde soru-cevap: 15 için ne gerekiyor, 14 garanti mi, kritik maç vb.
- API eşleştirme raporu açılır/kapanır yapı olarak korunmuştur.

Not: Karum Zeka maç tahmini yapmaz. Yalnızca yüklenen oynanmış kolonlar ve girilen sonuçlar üzerinden matematiksel analiz yapar.

<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#07111f">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Karum Toto">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="stylesheet" href="styles.css?v=16.0.0">
  <title>Karum Toto</title>
</head>
<body>
<div id="splash" class="splash" aria-hidden="true">
  <div class="splash-logo"><svg class="crown-mark" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 48h44l-4 8H14l-4-8Zm2-28 12 10 8-20 8 20 12-10-5 24H17l-5-24Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><circle cx="12" cy="18" r="3" fill="currentColor"/><circle cx="32" cy="8" r="3" fill="currentColor"/><circle cx="52" cy="18" r="3" fill="currentColor"/></svg></div>
  <div class="splash-title">KARUM TOTO</div>
  <div class="splash-subtitle">Spor Toto Takip Sistemi</div>
</div>

<main class="app">
  <header class="hero">
    <div class="brand-wrap" id="brandHomeBtn" role="button" tabindex="0" aria-label="Ana sayfaya dön">
      <div class="brand-logo"><svg class="crown-mark" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 48h44l-4 8H14l-4-8Zm2-28 12 10 8-20 8 20 12-10-5 24H17l-5-24Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><circle cx="12" cy="18" r="3" fill="currentColor"/><circle cx="32" cy="8" r="3" fill="currentColor"/><circle cx="52" cy="18" r="3" fill="currentColor"/></svg></div>
      <div class="brand-text">
        <h1>KARUM TOTO <small id="versionBadge"></small></h1>
        <p class="eyebrow">SPOR TOTO TAKİP SİSTEMİ</p>
        <p id="weekName" class="week-name">Güncel Hafta</p>
      </div>
    </div>
    <div class="hero-actions"><span id="syncBadge" class="sync-badge offline">Çevrimdışı</span><button id="accountBtn" class="ghost">Hesap</button></div>
  </header>

  <section id="cloudBar" class="cloud-card premium-card hidden">
    <div class="cloud-row">
      <div><span class="summary-label">ORTAK KAYIT</span><strong id="cloudUser">Giriş yapılmadı</strong><p id="cloudInfo">Telefon ve bilgisayar aynı veriyi kullanır.</p></div>
      <div class="week-actions"><select id="weekSelect" class="week-select" aria-label="Hafta seç"><option value="">Hafta seç</option></select><button id="deleteWeekBtn" class="delete-week hidden" type="button" title="Seçili haftayı sil">Sil</button></div>
    </div>
  </section>

  <div id="homeView">
  <section class="upload-card premium-card">
    <div class="file-summary">
      <div>
        <span class="summary-label">BU HAFTA</span>
        <strong id="fileSummary">Henüz dosya seçilmedi</strong>
        <p id="uploadInfo">Excel'den maçlar, ligler, tarih-saat ve kolonlar okunur. Sonuçları telefonda sen seçersin.</p>
      </div>
      <label class="upload">
        <input id="fileInput" type="file" accept=".xlsx,.xls,.csv,.txt">
        <span class="upload-icon">↥</span>
        <span class="upload-title">Excel Yükle</span>
      </label>
    </div>
  </section>


  <section id="systemsPanel" class="systems-panel premium-card">
    <div class="systems-head">
      <div><span class="summary-label">BU HAFTANIN SİSTEMLERİ</span><strong>Kupon / Excel Ayrımı</strong><p>Sonuçlar haftaya ortak, kolonlar her sistemde ayrıdır.</p></div>
      <button id="deleteSystemBtn" class="delete-system hidden" type="button">Sistemi Sil</button>
    </div>
    <select id="systemSelect" class="system-select" aria-label="Sistem seç"><option value="">Sistem yok</option></select>
    <div id="systemCards" class="system-cards"></div>
  </section>

  <section class="stats">
    <article class="stat-card stat-main"><span>Kolon</span><strong id="total">0</strong></article>
    <article class="stat-card stat-main"><span>Maliyet</span><strong id="cost">0 TL</strong></article>
    <button class="stat-card green stat-button category-card" type="button" data-category="15"><span><i></i>15 Devam</span><strong id="s15">0</strong><small>Kolonları gör</small></button>
    <button class="stat-card blue stat-button category-card" type="button" data-category="14"><span><i></i>14 Devam</span><strong id="s14">0</strong><small>Kolonları gör</small></button>
    <button class="stat-card yellow stat-button category-card" type="button" data-category="13"><span><i></i>13 Devam</span><strong id="s13">0</strong><small>Kolonları gör</small></button>
    <button class="stat-card orange stat-button category-card" type="button" data-category="12"><span><i></i>12 Devam</span><strong id="s12">0</strong><small>Kolonları gör</small></button>
    <button class="stat-card red stat-button category-card" type="button" data-category="11"><span><i></i>11 ve Altı</span><strong id="s11">0</strong><small>Kolonları gör</small></button>
    <button id="remainingMatchesBtn" class="stat-card neutral wide stat-button remaining-card" type="button"><span><i></i>Kalan Maç</span><strong id="remaining">15</strong><small>Maçları gör</small></button>
  </section>
  <section class="quick-access premium-card" aria-label="Hızlı erişim">
    <button type="button" data-action="analysis"><span class="qa-icon qa-gold">▥</span><strong>Analiz Merkezi</strong><small>Genel görünüm</small></button>
    <button type="button" data-action="live"><span class="qa-icon qa-green">⌁</span><strong>Canlı Analiz</strong><small>Kalan kolonlar</small></button>
    <button type="button" data-action="scenario"><span class="qa-icon qa-purple">◇</span><strong>Senaryo Motoru</strong><small>15 bilme yolları</small></button>
    <button type="button" data-action="smart"><span class="qa-icon qa-blue">◉</span><strong>Akıllı Analiz</strong><small>Karar özeti</small></button>
  </section>

  <div class="week-progress" aria-label="Hafta ilerleme durumu">
    <div class="progress-head"><span id="progressText">0 / 15 maç tamamlandı</span><strong id="progressPercent">%0</strong></div>
    <div class="progress-track"><span id="progressBar" style="width:0%"></span></div>
  </div>
  <p id="statsSource" class="stats-source">Sonuçları telefonda seçtikçe kalan kolonlar anında hesaplanır.</p>

  <section id="liveScorePanel" class="live-score-panel premium-card" aria-labelledby="liveScoreTitle">
    <div class="live-score-head"><div><p class="section-kicker">API-FOOTBALL</p><h2 id="liveScoreTitle">Canlı Skor Merkezi</h2><p id="liveScoreSummary">İlk maç başladığında otomatik eşleştirme yapılır.</p></div><span id="liveScoreState" class="live-score-state">HAZIR</span></div>
    <div class="live-score-meta"><span>Son güncelleme <strong id="liveLastUpdate">Henüz güncellenmedi</strong></span><span>Sonraki kontrol <strong id="liveNextUpdate">-</strong></span><button id="liveRefreshBtn" type="button">Şimdi Kontrol Et</button></div>
    <small class="live-score-note">Maç başladığında ilk sorgu yapılır; ardından en az bir maç devam ederken 15 dakikada bir toplu güncellenir.</small>
  </section>

  <section id="coveragePanel" class="coverage-panel premium-card" aria-labelledby="coverageTitle">
    <div class="coverage-head">
      <div><p class="section-kicker">CANLI KAPSAMA ANALİZİ</p><h2 id="coverageTitle">Kupon Sisteminin Gerçek Kapsaması</h2><p>Her 1-X-2 sonucu eşit olasılıklı kabul edilerek, yüklenen kolonların kapsadığı sonuçlar hesaplanır.</p></div>
      <span id="coverageLiveBadge" class="coverage-live-badge">HAZIR</span>
    </div>
    <div id="coverageEmpty" class="coverage-empty">Analiz için kolon içeren bir Excel yükle.</div>
    <div id="coverageContent" class="hidden">
      <div class="coverage-prob-grid">
        <article class="coverage-prob p15"><span>15 Bilme İhtimali</span><strong id="coverage15">%0</strong><small id="coverage15Meta">0 senaryo</small></article>
        <article class="coverage-prob p14"><span>14+ Bilme İhtimali</span><strong id="coverage14">%0</strong><small id="coverage14Meta">0 senaryo</small></article>
        <article class="coverage-prob p13"><span>13+ Bilme İhtimali</span><strong id="coverage13">%0</strong><small id="coverage13Meta">0 senaryo</small></article>
        <article class="coverage-prob p12"><span>12+ Bilme İhtimali</span><strong id="coverage12">%0</strong><small id="coverage12Meta">0 senaryo</small></article>
      </div>
      <div class="coverage-info-grid">
        <article><span>Yüklenen Kolon</span><strong id="coverageLoaded">0</strong></article>
        <article><span>15 İçin Kalan Kolon</span><strong id="coverageAlive">0</strong></article>
        <article><span>Elenen Kolon</span><strong id="coverageEliminated">0</strong></article>
        <article><span>Kalan Maç</span><strong id="coverageRemaining">15</strong></article>
        <article><span>Toplam Olası Senaryo</span><strong id="coverageTotalScenarios">3¹⁵</strong></article>
        <article><span>15'i Sağlayan Senaryo</span><strong id="coverageWinningScenarios">0</strong></article>
      </div>
      <div class="coverage-meter-wrap">
        <div class="coverage-meter-head"><span>15 Kapsama Oranı</span><strong id="coverageMeterText">%0</strong></div>
        <div class="coverage-meter"><span id="coverageMeterBar" style="width:0%"></span></div>
        <p id="coverageSummary">Sonuç girdikçe kalan maçlara göre otomatik güncellenir.</p>
      </div>
    </div>
  </section>

  </div>

  <section id="matchesView" class="matches-view hidden" aria-labelledby="matchesTitle">
    <div class="page-head premium-card">
      <div><p class="section-kicker">HAFTA PROGRAMI</p><h2 id="matchesTitle">15 Maç</h2><p>Maça dokunarak ayrıntılı dağılımı ve sonucu aç.</p></div>
      <button id="clearResults" class="ghost small">Temizle</button>
    </div>
    <div id="matches" class="matches-list"></div>
  </section>

  <section id="matchDetailView" class="match-detail-view hidden" aria-labelledby="matchDetailTitle">
    <button id="matchDetailBack" class="detail-back" type="button">← Maçlara dön</button>
    <div id="matchDetailContent"></div>
  </section>

  <section id="analysisView" class="analysis-view hidden" aria-labelledby="analysisTitle">
    <div class="analysis-hero premium-card">
      <div><p class="section-kicker">KOLON ANALİZ MERKEZİ</p><h2 id="analysisTitle">Hafta Özeti</h2><p id="analysisSubtitle">Excel yüklediğinde 15 maç ve bütün kolonlar burada analiz edilir.</p></div>
      <span id="analysisTotalBadge" class="analysis-total-badge">0 kolon</span>
    </div>
    <div class="analysis-mode-switch premium-card" role="group" aria-label="Analiz modu">
      <button class="analysis-mode-btn" data-mode="all" type="button">Tüm Kolonlar</button>
      <button class="analysis-mode-btn active" data-mode="live" type="button"><span class="mode-live-dot"></span>Kalan Kolonlar</button>
    </div>
    <div id="analysisLiveStatus" class="analysis-live-status hidden">
      <article><span>Başlangıç</span><strong id="liveStart">0</strong></article>
      <article class="remaining"><span>Kalan</span><strong id="liveRemaining">0</strong></article>
      <article class="eliminated"><span>Elenen</span><strong id="liveEliminated">0</strong></article>
      <article><span>Kalan Oranı</span><strong id="liveRate">%0</strong></article>
    </div>
    <div id="analysisImpactBanner" class="analysis-impact-banner premium-card hidden"><div><span id="impactMatch">Son sonuç</span><strong id="impactFlow">0 → 0</strong></div><b id="impactEliminated">0 kolon elendi</b></div>
    <div id="analysisEmpty" class="analysis-empty premium-card">Analiz için önce kolon içeren bir Excel yükle.</div>
    <div id="analysisContent" class="hidden">
      <div class="analysis-summary-grid">
        <article class="analysis-summary-card"><span id="aTotalLabel">Kalan Kolon</span><strong id="aTotal">0</strong><small id="aTotalMeta">Analize dahil</small></article>
        <article class="analysis-summary-card"><span>En Çok Oynanan</span><strong id="aTopPick">-</strong><small id="aTopPickMeta">-</small></article>
        <article class="analysis-summary-card safe"><span>En Güvenli Maç</span><strong id="aSafestNo">-</strong><small id="aSafestMeta">-</small></article>
        <article class="analysis-summary-card risky"><span>En Riskli Maç</span><strong id="aRiskiestNo">-</strong><small id="aRiskiestMeta">-</small></article>
      </div>

      <div class="analysis-section premium-card">
        <div class="analysis-section-head"><div><p class="section-kicker">AKILLI ÖZET</p><h3>Bu Haftanın Yorumu</h3></div></div>
        <div id="analysisInsights" class="analysis-insights"></div>
      </div>


      <div id="smartDecisionPanel" class="analysis-section smart-decision-panel premium-card">
        <div class="analysis-section-head"><div><p class="section-kicker">V10 AKILLI KARAR ANALİZİ</p><h3 id="smartHeadline">Canlı karar özeti</h3></div><span class="smart-ai-badge">KOLON VERİSİ</span></div>
        <p id="smartSummary" class="smart-summary"></p>
        <div id="smartDecisionCards" class="smart-decision-cards"></div>
        <div id="smartBestPath" class="smart-best-path"></div>
        <div id="smartTopScenarios" class="smart-top-scenarios"></div>
      </div>

      <div id="scenarioEngine" class="analysis-section scenario-engine premium-card">
        <div class="analysis-section-head"><div><p class="section-kicker">SENARYO MOTORU</p><h3>15 Bilme Senaryoları</h3></div><small>Kalan kolonların bekleyen maç sonuçları</small></div>
        <div class="scenario-stats">
          <article><span>Kalan Maç</span><strong id="scenarioRemainingMatches">0</strong></article>
          <article><span>15 Devam Kolonu</span><strong id="scenarioExactColumns">0</strong></article>
          <article><span>Farklı Senaryo</span><strong id="scenarioUniqueCount">0</strong></article>
        </div>
        <p id="scenarioSummary" class="scenario-summary"></p>
        <div class="scenario-subhead"><strong>15 gelmesi için kalan yollar</strong><small>Aynı diziler birleştirilir</small></div>
        <div id="scenarioList" class="scenario-list"></div>
        <div class="scenario-subhead impact-head"><strong>Her sonucun 15 devam etkisi</strong><small>Sonuç gelirse kaç kolon yaşar?</small></div>
        <div id="scenarioImpactList" class="scenario-impact-list"></div>
      </div>

      <div class="analysis-section premium-card">
        <div class="analysis-section-head"><div><p class="section-kicker">ISI HARİTASI</p><h3 id="analysisHeatTitle">Kalan Maçlarda Canlı 1 / X / 2 Dağılımı</h3></div><small id="analysisHeatNote">Yüzdeler yalnızca devam eden kolonlara göredir.</small></div>
        <div class="confidence-legend"><span><i class="very-high"></i>Çok Güçlü</span><span><i class="high"></i>Güçlü</span><span><i class="medium"></i>Orta</span><span><i class="balanced"></i>Dengeli</span><span><i class="low"></i>Çok Riskli</span></div>
        <div id="analysisMatchList" class="analysis-match-list"></div>
      </div>
    </div>
  </section>

  <footer>Karum Toto v15.0.0 • Canlı Kapsama Analizi • by Eyüp Karum</footer>
</main>

<div id="sheetBackdrop" class="sheet-backdrop hidden" aria-hidden="true"></div>
<section id="survivorsSheet" class="bottom-sheet hidden" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">
  <div class="sheet-handle"></div>
  <div class="sheet-header">
    <div>
      <p class="section-kicker">CANLI KOLON TAKİBİ</p>
      <h2 id="sheetTitle">15 Devam Kolonları</h2>
      <p id="sheetCount" class="sheet-count">0 kolon</p>
    </div>
    <button id="closeSheet" class="sheet-close" type="button" aria-label="Kapat">×</button>
  </div>
  <div id="sheetEmpty" class="sheet-empty hidden"></div>
  <div id="survivorsList" class="survivors-list"></div>
</section>

<div id="authBackdrop" class="auth-backdrop hidden"></div>
<section id="authModal" class="auth-modal hidden" role="dialog" aria-modal="true">
  <button id="closeAuth" class="auth-close" aria-label="Kapat">×</button>
  <div class="brand-logo auth-logo"><svg class="crown-mark" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 48h44l-4 8H14l-4-8Zm2-28 12 10 8-20 8 20 12-10-5 24H17l-5-24Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><circle cx="12" cy="18" r="3" fill="currentColor"/><circle cx="32" cy="8" r="3" fill="currentColor"/><circle cx="52" cy="18" r="3" fill="currentColor"/></svg></div>
  <h2>Karum Toto Bulut</h2>
  <p>Telefon ve bilgisayarda aynı e-posta ve şifreyle giriş yap.</p>
  <label>E-posta<input id="authEmail" type="email" autocomplete="email" placeholder="ornek@email.com"></label>
  <label>Şifre<input id="authPassword" type="password" autocomplete="current-password" minlength="6" placeholder="En az 6 karakter"></label>
  <button id="loginBtn" class="primary-action">Giriş Yap</button>
  <button id="signupBtn" class="secondary-action">İlk Kez Kayıt Ol</button>
  <button id="logoutBtn" class="danger-action hidden">Çıkış Yap</button>
  <p id="authMessage" class="auth-message"></p>
</section>

<nav class="bottom-nav" aria-label="Alt menü">
  <button id="homeNavBtn" class="nav-item active" type="button" data-tab="home"><span class="nav-icon">⌂</span><em>Ana Sayfa</em></button>
  <button id="matchesNavBtn" class="nav-item" type="button" data-tab="matches"><span class="nav-icon">●</span><em>Maçlar</em></button>
  <button id="analysisNavBtn" class="nav-item" type="button" data-tab="analysis"><span class="nav-icon">▥</span><em>Analiz</em></button>
  <button id="smartNavBtn" class="nav-item" type="button" data-tab="smart"><span class="nav-icon">◉</span><em>Akıllı Analiz</em></button>
  <button id="settingsNavBtn" class="nav-item" type="button" data-tab="settings"><span class="nav-icon">⚙</span><em>Ayarlar</em></button>
</nav>

<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="initial-data.js?v=15.0.0"></script>
<script src="app.js?v=16.0.0"></script>
</body>
</html>
